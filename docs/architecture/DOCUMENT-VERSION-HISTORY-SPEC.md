11# Document Version History & Batch Navigation

## Epic 4.8 Design Specification

**Status:** Planned
**Priority:** Pro+ Feature
**Estimated Duration:** 3-4 days
**Last Updated:** December 7, 2025

---

## Problem Statement

When users work with documentation across multiple generation sessions, several UX issues arise:

1. **Mixed-batch workspaces**: After loading files from history and regenerating some, the workspace contains files from multiple batches
2. **Batch summary confusion**: The "current" batch summary changes based on the most recent generation or viewed batch
3. **Lost historical versions**: When a file is regenerated, the old documentation is only accessible via the original batch's summary links
4. **Filename-based linking breaks**: Batch summary links use `#file:filename` which matches by name, not by specific document version

---

## Core Concepts

### Terminology

| Term | Definition |
|------|------------|
| **Document** | An immutable snapshot of generated documentation (stored in DB with `documentId`) |
| **File** | A workspace entry representing a source file (may have multiple document versions) |
| **Batch** | An immutable record of a single generation run (contains 1+ documents) |
| **Workspace** | The current working set of files in the sidebar (mutable, session-based) |

### Key Insight

> A **file** in the workspace represents the *current working version*, while a **document** in the database represents an *immutable historical snapshot*. The same filename can have multiple documents across different batches.

---

## Current State Analysis

### How Batch Summaries Work Today

1. Generation completes → batch created in DB → `batchSummaryMarkdown` contains links like `[utils.js](#file:utils.js)`
2. Clicking link → `handleSummaryFileClick(filename)` → finds file in `multiFileState.files` by filename
3. If file not in workspace → error or load from batch

### Current Problems

1. **After regeneration**: Workspace has `utils.js` (v2), but Batch A's summary links to `utils.js` (v1)
2. **Clicking Batch A's link**: Either shows v2 (wrong!) or "file not found"
3. **No version awareness**: User can't tell which version they're viewing
4. **No batch context**: User can't easily see/access other batches related to their workspace

---

## Proposed Solution

### 1. Document ID-Based Links

**Change**: Batch summary links change from filename-based to document ID-based.

```markdown
// Before
[utils.js](#file:utils.js)

// After
[utils.js](#doc:abc-123-def-456)
```

**Implementation**:
- Server-side: `batchSummaryGenerator.js` includes `documentId` in file links
- Client-side: `DocPanel.jsx` intercepts `#doc:` links and calls `onDocumentClick(documentId)`

### 2. Document Click Handler

**New handler**: `handleDocumentClick(documentId)` in `useBatchGeneration.js`

```javascript
const handleDocumentClick = useCallback(async (documentId) => {
  // 1. Check if document is already in workspace (by documentId)
  const workspaceFile = multiFileState.files.find(f => f.documentId === documentId);

  if (workspaceFile) {
    // Document is current version - show normally
    setDocumentation(workspaceFile.documentation);
    setQualityScore(workspaceFile.qualityScore);
    setFilename(workspaceFile.filename);
    setDocType(workspaceFile.docType);
    multiFileState.setActiveFile(workspaceFile.id);
    setViewingHistoricalDoc(null);
    return;
  }

  // 2. Check if a NEWER version exists in workspace (same filename)
  const newerVersion = multiFileState.files.find(f =>
    f.filename === /* need to fetch doc first */ &&
    f.documentId !== documentId
  );

  // 3. Fetch document from database
  const doc = await documentsApi.getDocument(documentId);

  // 4. If newer version exists, show read-only historical view
  if (newerVersionExists) {
    setViewingHistoricalDoc({
      documentId: doc.id,
      filename: doc.filename,
      documentation: doc.documentation,
      qualityScore: doc.quality_score,
      docType: doc.doc_type,
      generatedAt: doc.generated_at,
      currentVersionId: newerVersion.documentId
    });
    setDocumentation(doc.documentation);
    setQualityScore(/* formatted */);
    setFilename(doc.filename);
    setDocType(doc.doc_type);
    // Don't set activeFile - this is read-only view
    return;
  }

  // 5. No newer version - add to workspace normally
  // (existing handleSummaryFileClick logic)
}, [...]);
```

### 3. Historical Document View State

**New state** in `useBatchGeneration.js`:

```javascript
const [viewingHistoricalDoc, setViewingHistoricalDoc] = useState(null);
// Shape: { documentId, filename, generatedAt, currentVersionId } or null
```

**DocPanel changes**:
- When `viewingHistoricalDoc` is set, show banner:
  ```
  ┌─────────────────────────────────────────────────────────────┐
  │ 📜 Viewing historical version from Dec 5, 2025             │
  │ A newer generation exists in your workspace.                │
  │                              [View Current] [Load to WS]    │
  └─────────────────────────────────────────────────────────────┘
  ```
- Visual distinction: Slightly muted/sepia tone, or subtle border

### 4. Batch List for Workspace

**New component**: `WorkspaceBatchList.jsx`

Shows all batches that contain documents matching files in the current workspace.

**Data flow**:
1. Collect all unique `batchId` values from workspace files
2. Also query: "Find batches containing documents with filenames matching workspace files"
3. Display as dropdown/accordion with:
   - Batch date
   - File count
   - Avg quality grade
   - "Current" badge for most recent

**Location options**:
- **Option A**: DocPanel header dropdown (next to "Batch Summary" title)
- **Option B**: Sidebar accordion section below file list
- **Option C**: Floating button/popover

**Recommended**: Option A (DocPanel header) - keeps batch context with documentation view.

### 5. Version Indicator in Sidebar

**FileItem enhancement**:

```jsx
// In FileItem.jsx
{hasMultipleVersions && (
  <Tooltip content={`Generated ${formatDate(file.generatedAt)} • ${priorVersionCount} prior version${priorVersionCount > 1 ? 's' : ''}`}>
    <span className="text-xs text-slate-500 dark:text-slate-400">
      {isLatest ? 'Latest' : `v${versionNumber}`}
    </span>
  </Tooltip>
)}
```

**Determining "hasMultipleVersions"**:
- Requires knowing if other documents exist with same filename
- Options:
  - Query on workspace load (adds latency)
  - Include in batch fetch response
  - Background fetch after workspace loads

---

## Database Considerations

### Existing Schema (No Changes Needed)

```sql
-- generated_documents already has what we need
CREATE TABLE generated_documents (
  id UUID PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  filename VARCHAR(255),
  batch_id UUID REFERENCES generation_batches(id),
  documentation TEXT,
  quality_score JSONB,
  doc_type VARCHAR(50),
  generated_at TIMESTAMP,
  ...
);
```

### New Query: Batches for Workspace Files

```sql
-- Find all batches containing documents for given filenames
SELECT DISTINCT gb.*,
  COUNT(gd.id) as doc_count,
  AVG((gd.quality_score->>'score')::numeric) as avg_score
FROM generation_batches gb
JOIN generated_documents gd ON gd.batch_id = gb.id
WHERE gd.user_id = $1
  AND gd.filename = ANY($2)  -- array of workspace filenames
  AND gd.deleted_at IS NULL
GROUP BY gb.id
ORDER BY gb.created_at DESC;
```

### New API Endpoint

```
GET /api/batches/for-files?filenames=utils.js,api.js,helper.js
```

Response:
```json
{
  "batches": [
    {
      "id": "batch-uuid-1",
      "createdAt": "2025-12-07T12:09:00Z",
      "totalFiles": 3,
      "avgQualityScore": 85,
      "avgGrade": "B",
      "documents": [
        { "id": "doc-1", "filename": "utils.js", "generatedAt": "..." },
        { "id": "doc-2", "filename": "api.js", "generatedAt": "..." }
      ]
    },
    {
      "id": "batch-uuid-2",
      "createdAt": "2025-12-05T10:30:00Z",
      ...
    }
  ]
}
```

---

## Implementation Plan

### Phase 1: Document ID Links (Foundation)

**Files to modify**:
- `server/services/batchSummaryGenerator.js` - Include documentId in links
- `client/src/components/DocPanel.jsx` - Handle `#doc:` link clicks
- `client/src/hooks/useBatchGeneration.js` - Add `handleDocumentClick`

**Steps**:
1. Update batch summary generation to include documentId in file links
2. Add link interception for `#doc:` format in DocPanel
3. Create `handleDocumentClick` handler
4. Test: Generate batch, verify links contain documentId

### Phase 2: Historical Document View

**Files to modify**:
- `client/src/hooks/useBatchGeneration.js` - Add `viewingHistoricalDoc` state
- `client/src/components/DocPanel.jsx` - Historical version banner
- `client/src/services/documentsApi.js` - Ensure `getDocument` works

**Steps**:
1. Add `viewingHistoricalDoc` state to hook
2. Implement detection logic in `handleDocumentClick`
3. Create historical version banner component
4. Add "View Current" and "Load to Workspace" actions
5. Test: Load old batch, click file with newer version, verify banner

### Phase 3: Batch List for Workspace

**Files to create/modify**:
- `server/routes/batches.js` - New endpoint `/for-files`
- `client/src/services/batchesApi.js` - Add `getBatchesForFiles`
- `client/src/components/DocPanel/WorkspaceBatchList.jsx` - New component
- `client/src/components/DocPanel.jsx` - Integrate batch list

**Steps**:
1. Create server endpoint to query batches by filenames
2. Add API client function
3. Create `WorkspaceBatchList` component
4. Integrate into DocPanel header
5. Test: Mixed-batch workspace shows all relevant batches

### Phase 4: Version Indicator in Sidebar

**Files to modify**:
- `client/src/components/Sidebar/FileItem.jsx` - Version badge
- `client/src/hooks/useBatchGeneration.js` - Version detection logic

**Steps**:
1. Determine how to detect multiple versions (background fetch vs included in batch data)
2. Add version indicator to FileItem
3. Add tooltip with generation date and prior version count
4. Test: Regenerate file, verify version indicator appears

---

## Migration Considerations

### Existing Batch Summaries

Old batch summaries in DB have `#file:` links. Options:

1. **Leave as-is**: Old summaries continue to work with filename matching (current behavior)
2. **Regenerate on access**: When viewing old batch, regenerate summary with documentIds
3. **Background migration**: Update all existing summaries (complex, may not be worth it)

**Recommended**: Option 1 - Leave existing summaries, new summaries use documentId. The filename-based fallback continues to work for historical batches.

### Backward Compatibility

- `handleSummaryFileClick(filename)` remains for `#file:` links
- `handleDocumentClick(documentId)` added for `#doc:` links
- Both handlers coexist

---

## Testing Strategy

### Unit Tests

1. `handleDocumentClick` - various scenarios (in workspace, newer exists, not found)
2. `WorkspaceBatchList` - rendering, click handlers
3. Batch summary generation with documentIds

### Integration Tests

1. Generate batch → verify documentId links in summary
2. Load historical batch → click file with newer version → verify banner
3. Mixed-batch workspace → verify batch list shows all

### Manual Testing Checklist

- [ ] Generate 3-file batch, verify documentId links work
- [ ] Regenerate 1 file, verify old batch summary shows historical banner
- [ ] Load files from 2 different batches, verify batch list shows both
- [ ] Click "View Current" from historical banner
- [ ] Version indicator shows on regenerated files

---

## Open Questions

1. **Batch list location**: DocPanel header dropdown vs sidebar section?
   - **Recommendation**: DocPanel header - keeps batch context with docs

2. **Version indicator data source**: Query on load vs background fetch?
   - **Recommendation**: Background fetch after workspace loads to avoid latency

3. **Historical view visual treatment**: Banner only vs full visual distinction?
   - **Recommendation**: Start with banner, add subtle visual distinction if needed

4. **"Load to Workspace" for historical**: Add as separate entry or replace current?
   - **Recommendation**: Add as separate entry with version suffix (e.g., "utils.js (Dec 5)")

---

## Success Metrics

1. Users can navigate between batch summaries without confusion
2. Historical versions are clearly identified
3. No "file not found" errors when clicking batch summary links
4. Version history is accessible without leaving the workspace

---

## Related Documentation

- [MULTI-FILE-ARCHITECTURE-ANALYSIS.md](./MULTI-FILE-ARCHITECTURE-ANALYSIS.md) - Multi-file workspace design
- [GENERATION-HISTORY-SPEC.md](./GENERATION-HISTORY-SPEC.md) - History feature specification
- [Epic 4.7: Documentation Sets](../planning/roadmap/roadmap-data.json) - Mutable collections concept

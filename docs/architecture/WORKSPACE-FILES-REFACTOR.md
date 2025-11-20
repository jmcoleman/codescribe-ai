# Workspace Files Architecture Refactor

**Status**: Design Phase
**Created**: November 19, 2025
**Author**: Architecture Review

---

## Problem Statement

The current `generated_documents` table mixes two distinct concerns:
1. **File metadata** (exists before generation): filename, language, file_size, origin, timestamps
2. **Documentation output** (exists after generation): documentation, quality_score, LLM metadata

This violates separation of concerns and creates limitations:
- ❌ Can't track files before they're generated
- ❌ Can't store multiple generations for the same file (regenerate history)
- ❌ Timestamps are ambiguous (when was file added vs. when was doc generated?)
- ❌ Can't show "5 files uploaded, 3 generated" status
- ❌ File metadata duplicated with each regeneration

---

## Proposed Solution

**Two-table architecture** separating file metadata from generated output:

### Table 1: `user_files` (Source File Metadata)
Tracks user's uploaded files, **persisted across sessions**, independent of generation status.

### Table 2: `generated_documents` (Documentation Output)
Tracks generated documentation, **linked to source files via FK**.

---

## Schema Design

### 1. `user_files` Table

```sql
CREATE TABLE user_files (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User relationship (ON DELETE CASCADE for GDPR compliance)
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Workspace isolation (ephemeral files tied to workspace session)
  workspace_id UUID NOT NULL,  -- Client-generated UUID for workspace session

  -- File metadata (NOT the code - only metadata about the file)
  filename VARCHAR(255) NOT NULL,
  language VARCHAR(50) NOT NULL,
  file_size_bytes INTEGER NOT NULL,

  -- Provenance
  origin VARCHAR(50) NOT NULL CHECK (origin IN ('upload', 'github', 'paste', 'sample')),

  -- GitHub integration metadata (optional)
  github_repo VARCHAR(255),
  github_path VARCHAR(500),
  github_sha VARCHAR(40),
  github_branch VARCHAR(255),

  -- Timestamps (when file was added/modified in workspace)
  date_added TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  date_modified TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Soft delete
  deleted_at TIMESTAMPTZ,

  -- Standard timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_files_user_workspace
  ON user_files(user_id, workspace_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_user_files_user_added
  ON user_files(user_id, date_added DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_user_files_github
  ON user_files(user_id, github_repo)
  WHERE github_repo IS NOT NULL AND deleted_at IS NULL;

-- Auto-update updated_at trigger
CREATE TRIGGER trigger_update_user_files_updated_at
  BEFORE UPDATE ON user_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 2. `generated_documents` Table (Refactored)

```sql
CREATE TABLE generated_documents (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User relationship (ON DELETE CASCADE for GDPR compliance)
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Link to source file (ON DELETE CASCADE - if file deleted, delete docs)
  user_file_id UUID REFERENCES user_files(id) ON DELETE CASCADE,

  -- Generated content (OUR output - documentation we created)
  documentation TEXT NOT NULL,
  quality_score JSONB NOT NULL,
  doc_type VARCHAR(50) NOT NULL CHECK (doc_type IN ('README', 'JSDOC', 'API', 'ARCHITECTURE')),

  -- Generation metadata
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- LLM metadata (for analytics, debugging, billing)
  provider VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  was_cached BOOLEAN DEFAULT FALSE,
  latency_ms INTEGER,

  -- Ephemeral flag (for authenticated users with save_docs_preference='never')
  is_ephemeral BOOLEAN DEFAULT FALSE,

  -- Soft delete (30-day recovery window)
  deleted_at TIMESTAMPTZ,

  -- Standard timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_generated_docs_user_generated_at
  ON generated_documents(user_id, generated_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_generated_docs_workspace_file
  ON generated_documents(user_file_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_generated_docs_user_ephemeral
  ON generated_documents(user_id)
  WHERE is_ephemeral = TRUE AND deleted_at IS NULL;

-- Auto-update updated_at trigger
CREATE TRIGGER trigger_update_generated_documents_updated_at
  BEFORE UPDATE ON generated_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Data Flow

### Before (Current - Single Table):
```
User uploads file → Generate docs → Save to generated_documents
                                    (file metadata + docs mixed)
```

### After (Proposed - Two Tables):
```
User uploads file → Save to user_files (file metadata)
                    ↓
                    User clicks Generate
                    ↓
                    Save to generated_documents (docs + FK to workspace_file)
```

### Regenerate Flow:
```
User clicks Regenerate → New row in generated_documents
                         (same user_file_id, new generated_at)
                         ↓
                         History: Multiple docs for same file
```

---

## Benefits

### 1. Clean Separation of Concerns
- **user_files**: What files are in the workspace (before generation)
- **generated_documents**: What documentation was generated (after generation)

### 2. Proper Timestamp Tracking
- `user_files.date_added`: When file was uploaded to workspace
- `user_files.date_modified`: When file content was edited
- `generated_documents.generated_at`: When documentation was generated

### 3. Multiple Generations per File
- Regenerate creates new row in `generated_documents`
- Same `user_file_id`, different `generated_at`
- Can show generation history, compare versions

### 4. Better UI/UX
- Show "5 files uploaded, 3 generated" status
- Track files before generation
- Display accurate timestamps in File Details Panel

### 5. Data Efficiency
- File metadata stored once (not duplicated per generation)
- GitHub metadata stored once per file
- Only documentation varies per generation

---

## Migration Strategy

### Phase 1: Create New Tables
1. Create `user_files` table
2. Create refactored `generated_documents` table (new name: `generated_documents_v2`)
3. Keep old `generated_documents` table temporarily

### Phase 2: Data Migration
1. Extract file metadata from old `generated_documents` → new `user_files`
2. Link new `generated_documents_v2` to `user_files` via FK
3. Verify data integrity

### Phase 3: Code Updates
1. Update API routes (`/api/documents`, `/api/workspace`)
2. Update services (`documentService.js`)
3. Update client hooks (`useDocumentPersistence.js`, `useMultiFileState.js`)
4. Update tests

### Phase 4: Cleanup
1. Drop old `generated_documents` table
2. Rename `generated_documents_v2` to `generated_documents`

---

## API Changes

### New Endpoint: Save Workspace File

```javascript
// POST /api/workspace/files
{
  workspaceId: 'uuid',
  filename: 'example.js',
  language: 'javascript',
  fileSize: 2400,
  origin: 'upload',
  dateAdded: '2025-11-19T10:30:00Z',
  dateModified: '2025-11-19T10:30:00Z',
  githubRepo?: 'acme/project',
  githubPath?: 'src/utils/helper.js',
  githubSha?: 'abc123...',
  githubBranch?: 'main'
}

// Response
{
  success: true,
  workspaceFileId: 'uuid',
  ...metadata
}
```

### Updated Endpoint: Save Generated Document

```javascript
// POST /api/documents
{
  workspaceFileId: 'uuid',  // FK to user_files (NEW)
  documentation: '# README...',
  qualityScore: { score: 92, grade: 'A', ... },
  docType: 'README',
  provider: 'claude',
  model: 'claude-sonnet-4-5-20250929',
  inputTokens: 500,
  outputTokens: 1000,
  wasCached: true,
  latencyMs: 1250,
  isEphemeral: false
}

// Response
{
  success: true,
  documentId: 'uuid',
  workspaceFileId: 'uuid',
  generatedAt: '2025-11-19T10:35:00Z'
}
```

### New Query: Get Workspace Files with Generation Status

```javascript
// GET /api/workspace/files?workspaceId=uuid

// Response
{
  success: true,
  files: [
    {
      id: 'uuid',
      filename: 'example.js',
      language: 'javascript',
      fileSize: 2400,
      origin: 'upload',
      dateAdded: '2025-11-19T10:30:00Z',
      dateModified: '2025-11-19T10:30:00Z',
      generatedDocuments: [  // Can be multiple (regenerate history)
        {
          id: 'uuid',
          docType: 'README',
          generatedAt: '2025-11-19T10:35:00Z',
          qualityScore: { score: 92, grade: 'A' }
        }
      ]
    },
    {
      id: 'uuid',
      filename: 'utils.js',
      language: 'javascript',
      fileSize: 1800,
      origin: 'github',
      dateAdded: '2025-11-19T10:32:00Z',
      dateModified: '2025-11-19T10:32:00Z',
      generatedDocuments: []  // Not yet generated
    }
  ]
}
```

---

## Client-Side Changes

### 1. Update `useMultiFileState.js`
Add `workspaceFileId` to file objects:

```javascript
const newFile = {
  id: fileId,  // Client UUID
  workspaceFileId: null,  // DB UUID (set after save)
  filename: '...',
  language: '...',
  // ... rest of fields
};
```

### 2. New Hook: `useWorkspaceFilePersistence.js`
Handle saving file metadata to `user_files` table:

```javascript
export function useWorkspaceFilePersistence(workspaceId) {
  const saveFileMetadata = async (file) => {
    const response = await fetch('/api/workspace/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId,
        filename: file.filename,
        language: file.language,
        fileSize: file.fileSize,
        origin: file.origin,
        dateAdded: file.dateAdded,
        dateModified: file.dateModified,
        // GitHub fields if applicable
      })
    });

    const { workspaceFileId } = await response.json();
    return workspaceFileId;
  };

  return { saveFileMetadata };
}
```

### 3. Update `useDocumentPersistence.js`
Include `workspaceFileId` when saving documents:

```javascript
const saveDocument = async (file, documentation, qualityScore, metadata) => {
  // First, ensure file metadata is saved
  let workspaceFileId = file.workspaceFileId;
  if (!workspaceFileId) {
    workspaceFileId = await saveFileMetadata(file);
  }

  // Then save generated documentation
  const response = await fetch('/api/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspaceFileId,  // FK to user_files
      documentation,
      qualityScore,
      docType: file.docType,
      provider: metadata.provider,
      model: metadata.model,
      // ... LLM metadata
    })
  });

  return response.json();
};
```

---

## Workspace ID Strategy

### Generation
- Client generates UUID on workspace creation/page load
- Stored in React state (not localStorage - ephemeral per tab)
- Used to group files in the same workspace session

### Persistence
- Authenticated users: workspace persists across sessions (stored in DB)
- Anonymous users: workspace cleared on logout/tab close (ephemeral)

### Use Cases
- **Single workspace**: User uploads 5 files, all share same `workspace_id`
- **Multiple workspaces**: User opens 2 tabs, each has different `workspace_id`
- **Cleanup**: Old workspaces auto-deleted after 30 days (soft delete + cleanup job)

---

## Implementation Checklist

### Database
- [ ] Create migration 022: Create `user_files` table
- [ ] Create migration 023: Refactor `generated_documents` table
- [ ] Create migration 024: Data migration from old to new schema
- [ ] Create migration 025: Drop old table, rename new table
- [ ] Add database tests for new schema

### Backend
- [ ] Create `workspaceFileService.js`
- [ ] Update `documentService.js` for new schema
- [ ] Add `POST /api/workspace/files` route
- [ ] Add `GET /api/workspace/files?workspaceId=` route
- [ ] Update `POST /api/documents` route
- [ ] Update `GET /api/documents` route
- [ ] Add API tests

### Frontend
- [ ] Add `workspaceId` to App.jsx state
- [ ] Create `useWorkspaceFilePersistence.js` hook
- [ ] Update `useDocumentPersistence.js` hook
- [ ] Update `useMultiFileState.js` to include `workspaceFileId`
- [ ] Update FileDetailsPanel to show accurate timestamps
- [ ] Add component tests

### Documentation
- [ ] Update API-Reference.md with new endpoints
- [ ] Update ARCHITECTURE.md with new schema
- [ ] Add migration guide for developers

---

## Rollback Plan

If issues arise during migration:
1. **Phase 1-2**: Simply drop new tables (old table still exists)
2. **Phase 3**: Revert code to use old table
3. **Phase 4**: If production issues, rename old table back

**Safe migration**: Keep old table until 100% confident in new schema.

---

## Timeline Estimate

- **Design**: ✅ Complete
- **Migration (DB)**: 2-3 hours (4 migrations + tests)
- **Backend (API)**: 3-4 hours (2 services + routes + tests)
- **Frontend (Hooks)**: 2-3 hours (2 hooks + updates + tests)
- **Testing**: 2-3 hours (integration + manual)
- **Total**: ~10-15 hours

---

## Future Enhancements

### 1. Workspace Management UI
- List all workspaces
- Name/rename workspaces
- Archive old workspaces
- Restore deleted workspaces (30-day window)

### 2. Generation History
- View all generations for a file
- Compare different versions
- Rollback to previous generation

### 3. Collaborative Workspaces
- Share workspace with team members
- Real-time collaboration
- Access control

### 4. Workspace Templates
- Save workspace as template
- Clone workspace
- Import/export workspace

---

## Questions for Discussion

1. **Workspace ID Lifetime**: Should workspaces persist indefinitely or have TTL?
2. **Anonymous Users**: Should anonymous users have `user_files` entries?
3. **File Deduplication**: Should we deduplicate identical files across workspaces?
4. **GitHub Sync**: Should we auto-update files when GitHub repo changes?

---

## References

- Current schema: `server/src/db/migrations/018-create-generated-documents-table.sql`
- Document service: `server/src/services/documentService.js`
- Client hook: `client/src/hooks/useDocumentPersistence.js`
- Multi-file state: `client/src/hooks/useMultiFileState.js`

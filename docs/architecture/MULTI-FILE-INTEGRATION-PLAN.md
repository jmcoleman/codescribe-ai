# Multi-File Integration Plan

**Status:** Ready for Implementation
**Feature:** Multi-file documentation generation with database persistence
**Tier Requirement:** Pro+ (batchProcessing feature)
**Created:** November 17, 2025

---

## Overview

Integrate multi-file functionality into App.jsx alongside existing single-file mode, with tier-based feature gating and backward compatibility.

### Design Principles

1. **Backward Compatible** - Single-file mode remains default for Free/Starter users
2. **Tier Gated** - Multi-file only available to Pro+ users (or admin override)
3. **Progressive Enhancement** - UI adapts based on user tier
4. **Privacy First** - Only save generated docs (never code), with user consent
5. **Seamless UX** - Smooth transition between single/multi-file modes

---

## Architecture

### Mode Switching

```
User Tier → Feature Check → UI Mode
───────────────────────────────────
Free/Starter → batchProcessing: false → Single-file only
Pro+ → batchProcessing: true → Multi-file enabled
Admin (override) → batchProcessing: true → Multi-file enabled
```

### State Management

**Current (Single-file):**
```javascript
const [code, setCode] = useState('...');
const [filename, setFilename] = useState('code.js');
const [language, setLanguage] = useState('javascript');
const { documentation, qualityScore, ... } = useDocGeneration();
```

**New (Multi-file):**
```javascript
const {
  files,
  activeFileId,
  activeFile,
  addFile,
  removeFile,
  updateFile,
  clearFiles
} = useMultiFileState();

const {
  saveDocument,
  loadDocuments,
  shouldSaveDocument
} = useDocumentPersistence();
```

### UI Layout

**Single-file Mode (Free/Starter):**
```
┌─────────────────────────────────────────┐
│ Header (no Sidebar toggle)              │
├─────────────────────────────────────────┤
│ ControlBar (DocType, Language, Actions) │
├──────────────────┬──────────────────────┤
│ CodePanel        │ DocPanel             │
│ (Monaco Editor)  │ (Generated Docs)     │
│                  │                      │
└──────────────────┴──────────────────────┘
```

**Multi-file Mode (Pro+):**
```
┌─────────────────────────────────────────┐
│ Header (with Sidebar toggle)            │
├────────┬────────────────────────────────┤
│Sidebar │ ControlBar (Active File)       │
│        ├──────────────┬─────────────────┤
│ Files  │ CodePanel    │ DocPanel        │
│ List   │ (Active)     │ (Active Docs)   │
│        │              │                 │
│[File1] │              │                 │
│[File2] │              │                 │
│[File3] │              │                 │
└────────┴──────────────┴─────────────────┘
```

---

## Implementation Steps

### Phase 1: Add Hooks & Feature Detection

1. **Import hooks and utilities**
```javascript
import { useMultiFileState } from './hooks/useMultiFileState';
import { useDocumentPersistence } from './hooks/useDocumentPersistence';
import { hasFeature } from './utils/tierFeatures';
import { useTierOverride } from './hooks/useTierOverride';
```

2. **Initialize multi-file hooks**
```javascript
// Inside App component
const multiFileState = useMultiFileState();
const documentPersistence = useDocumentPersistence();
const { override } = useTierOverride();
```

3. **Feature detection**
```javascript
const canUseBatchProcessing = hasFeature(user, 'batchProcessing');
const isMultiFileMode = canUseBatchProcessing && multiFileState.hasFiles;
```

### Phase 2: Add Sidebar Component

1. **Import Sidebar**
```javascript
import { Sidebar } from './components/Sidebar';
```

2. **Add Sidebar state**
```javascript
const [showSidebar, setShowSidebar] = useState(() =>
  getStorageItem(STORAGE_KEYS.SIDEBAR_EXPANDED, true)
);
```

3. **Render Sidebar (conditional)**
```jsx
{canUseBatchProcessing && (
  <Sidebar
    files={multiFileState.files}
    activeFileId={multiFileState.activeFileId}
    onSelectFile={multiFileState.setActiveFile}
    onRemoveFile={handleRemoveFile}
    onGenerateAll={handleGenerateAll}
    onClearAll={multiFileState.clearFiles}
    isExpanded={showSidebar}
    onToggle={() => setShowSidebar(!showSidebar)}
  />
)}
```

### Phase 3: Integrate File Upload

**Current single-file upload:**
```javascript
const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  // Read file, set code, filename, language
};
```

**Updated for multi-file:**
```javascript
const handleFileUpload = async (event) => {
  const uploadedFiles = Array.from(event.target.files);

  if (!canUseBatchProcessing && uploadedFiles.length > 1) {
    // Show upgrade prompt
    toast.error('Multi-file upload requires Pro tier');
    return;
  }

  if (canUseBatchProcessing && uploadedFiles.length > 1) {
    // Multi-file mode
    const filesData = await Promise.all(
      uploadedFiles.map(async (file) => ({
        filename: file.name,
        language: detectLanguage(file.name),
        content: await file.text(),
        fileSize: file.size,
        origin: 'upload',
        docType: docType
      }))
    );

    multiFileState.addFiles(filesData);
  } else {
    // Single-file mode (backward compatible)
    const file = uploadedFiles[0];
    const content = await file.text();

    if (canUseBatchProcessing) {
      // Add to multi-file list
      multiFileState.addFile({
        filename: file.name,
        language: detectLanguage(file.name),
        content,
        fileSize: file.size,
        origin: 'upload',
        docType: docType
      });
    } else {
      // Legacy single-file behavior
      setCode(content);
      setFilename(file.name);
      setLanguage(detectLanguage(file.name));
    }
  }
};
```

### Phase 4: Update Generation Logic

**Current single-file generation:**
```javascript
const handleGenerate = async () => {
  await generateDocumentation({
    code,
    filename,
    language,
    docType
  });
};
```

**Updated for multi-file:**
```javascript
const handleGenerate = async () => {
  if (isMultiFileMode) {
    // Generate for active file
    const activeFile = multiFileState.activeFile;
    if (!activeFile) return;

    // Mark as generating
    multiFileState.updateFile(activeFile.id, { isGenerating: true, error: null });

    try {
      const result = await generateDocumentation({
        code: activeFile.content,
        filename: activeFile.filename,
        language: activeFile.language,
        docType: activeFile.docType
      });

      // Update file with results
      multiFileState.updateFile(activeFile.id, {
        documentation: result.documentation,
        qualityScore: result.qualityScore,
        isGenerating: false
      });

      // Auto-save if user preference allows
      if (documentPersistence.shouldSaveDocument().shouldSave) {
        const savedDoc = await documentPersistence.saveDocument({
          ...activeFile,
          documentation: result.documentation,
          qualityScore: result.qualityScore
        });

        multiFileState.updateFile(activeFile.id, {
          documentId: savedDoc.documentId
        });
      }
    } catch (error) {
      multiFileState.updateFile(activeFile.id, {
        isGenerating: false,
        error: error.message
      });
    }
  } else {
    // Legacy single-file behavior
    await generateDocumentation({ code, filename, language, docType });
  }
};
```

### Phase 5: Add Bulk Actions

```javascript
const handleGenerateAll = async () => {
  const filesToGenerate = multiFileState.files.filter(
    f => !f.documentation && !f.isGenerating && !f.error
  );

  // Generate sequentially to avoid rate limits
  for (const file of filesToGenerate) {
    await handleGenerateForFile(file.id);
  }
};

const handleGenerateForFile = async (fileId) => {
  const file = multiFileState.getFileById(fileId);
  if (!file) return;

  multiFileState.updateFile(fileId, { isGenerating: true, error: null });

  try {
    const result = await generateDocumentation({
      code: file.content,
      filename: file.filename,
      language: file.language,
      docType: file.docType
    });

    multiFileState.updateFile(fileId, {
      documentation: result.documentation,
      qualityScore: result.qualityScore,
      isGenerating: false
    });

    // Auto-save
    if (documentPersistence.shouldSaveDocument().shouldSave) {
      const savedDoc = await documentPersistence.saveDocument({
        ...file,
        documentation: result.documentation,
        qualityScore: result.qualityScore
      });

      multiFileState.updateFile(fileId, {
        documentId: savedDoc.documentId
      });
    }
  } catch (error) {
    multiFileState.updateFile(fileId, {
      isGenerating: false,
      error: error.message
    });
  }
};
```

### Phase 6: Update Control Bar

```javascript
<ControlBar
  // Single-file props (backward compatible)
  filename={isMultiFileMode ? multiFileState.activeFile?.filename : filename}
  language={isMultiFileMode ? multiFileState.activeFile?.language : language}
  docType={isMultiFileMode ? multiFileState.activeFile?.docType : docType}

  // Multi-file props
  isMultiFileMode={isMultiFileMode}
  fileCount={multiFileState.fileCount}

  // ... other props
/>
```

### Phase 7: Update Panels

**CodePanel:**
```jsx
<CodePanel
  code={isMultiFileMode ? (multiFileState.activeFile?.content || '') : code}
  onChange={isMultiFileMode
    ? (newCode) => multiFileState.updateFile(multiFileState.activeFileId, { content: newCode })
    : setCode
  }
  filename={isMultiFileMode ? multiFileState.activeFile?.filename : filename}
  language={isMultiFileMode ? multiFileState.activeFile?.language : language}
  // ... other props
/>
```

**DocPanel:**
```jsx
<DocPanel
  documentation={isMultiFileMode ? multiFileState.activeFile?.documentation : documentation}
  qualityScore={isMultiFileMode ? multiFileState.activeFile?.qualityScore : qualityScore}
  isGenerating={isMultiFileMode ? multiFileState.activeFile?.isGenerating : isGenerating}
  // ... other props
/>
```

---

## Tier Gating UI

### Upgrade Prompts

**When Free/Starter user tries multi-file:**
```jsx
{!canUseBatchProcessing && attemptedMultiFile && (
  <UpgradePrompt
    feature="Multi-file Documentation"
    tier="Pro"
    description="Upload and generate documentation for multiple files at once"
    onUpgrade={() => window.location.href = '/pricing'}
  />
)}
```

**Header badge for Pro+ users:**
```jsx
{canUseBatchProcessing && (
  <Badge variant="purple">
    <Zap className="w-3 h-3" />
    Multi-file Enabled
  </Badge>
)}
```

### Tier Override Banner

```jsx
{override && override.active && (
  <TierOverrideBanner
    override={override}
    onClear={async () => {
      await clearOverride();
      // Reload to apply changes
      window.location.reload();
    }}
  />
)}
```

---

## Data Flow

### Upload Flow
```
User uploads files
  ↓
Feature check (canUseBatchProcessing)
  ↓
[Single-file]              [Multi-file]
  ↓                          ↓
setCode(content)           addFiles(filesData)
setFilename()              setActiveFile(first)
setLanguage()
```

### Generation Flow
```
User clicks Generate
  ↓
Feature check (isMultiFileMode)
  ↓
[Single-file]              [Multi-file]
  ↓                          ↓
Generate for              Generate for activeFile
current editor              ↓
  ↓                      Update file state
Set documentation         ↓
Set qualityScore          Auto-save if allowed
                            ↓
                          Update documentId
```

### Persistence Flow
```
Generation complete
  ↓
Check shouldSaveDocument()
  ↓
[always]    [never]     [ask]
  ↓          ↓           ↓
Save      Save as     Show consent
  ↓       ephemeral      modal
Update      ↓            ↓
documentId  Cleanup    User chooses
           on logout     ↓
                      Save or
                      ephemeral
```

---

## Storage Strategy

| Data Type | Storage Location | Lifecycle | Notes |
|-----------|-----------------|-----------|-------|
| Source code | React state only | Session | Never persisted (privacy) |
| Generated docs | Database | Persistent | With user consent |
| Quality scores | Database | Persistent | Linked to document |
| File metadata | React state | Session | Recreated on upload |
| UI state | localStorage | Persistent | Sidebar expanded, etc. |
| Document IDs | React state | Session | Links to saved docs |

---

## Testing Strategy

### Unit Tests
- ✅ useMultiFileState hook (64 tests) - Done
- ✅ useDocumentPersistence hook - Done
- ✅ hasFeature utility - Done
- ✅ Sidebar components (64 tests) - Done

### Integration Tests
- [ ] Single-file to multi-file transition
- [ ] File upload (single vs. multiple)
- [ ] Generation with tier gating
- [ ] Document persistence flow
- [ ] Tier override integration

### E2E Tests
- [ ] Free user sees upgrade prompt for multi-file
- [ ] Pro user can upload multiple files
- [ ] Admin with override can access multi-file
- [ ] Documents save with consent
- [ ] Ephemeral docs cleanup on logout

---

## Rollout Plan

### Phase 1: Backend Ready ✅
- Multi-file database schema
- Documents API endpoints
- Tier override system

### Phase 2: Frontend Hooks ✅
- useMultiFileState
- useDocumentPersistence
- Sidebar components

### Phase 3: Integration (Current)
- Integrate hooks into App.jsx
- Add tier-gated Sidebar
- Update file upload logic
- Update generation logic

### Phase 4: Testing
- Write integration tests
- Manual QA across tiers
- Test tier override

### Phase 5: Release
- Merge to main
- Deploy to production
- Monitor usage metrics

---

## Known Limitations

1. **Sequential Generation** - Generate files one at a time to avoid rate limits
2. **No Code Persistence** - Source code stays in memory only (privacy)
3. **Tier Locked** - Cannot downgrade mid-session (refresh required)
4. **Browser Storage** - File list limited by memory (reasonable for <50 files)

---

## Future Enhancements

### Phase 4+ Features
- **Batch upload from GitHub** - Import entire repos
- **Project workspaces** - Save file collections
- **Template sharing** - Team template library
- **CI/CD integration** - Auto-doc on PR merge
- **Zip export** - Download all docs at once

---

## Related Documentation

- [TIER-OVERRIDE-SYSTEM.md](TIER-OVERRIDE-SYSTEM.md) - Tier override design
- [MULTI-FILE-DB-DESIGN.md](../database/MULTI-FILE-DB-DESIGN.md) - Database schema
- [SUBSCRIPTION-FLOWS.md](SUBSCRIPTION-FLOWS.md) - Unauthenticated user flows
- [07-Figma-Guide.md](../planning/mvp/07-Figma-Guide.md) - UI design patterns

---

**Last Updated:** November 17, 2025
**Status:** Ready for Implementation
**Next Step:** Integrate hooks into App.jsx with feature flags

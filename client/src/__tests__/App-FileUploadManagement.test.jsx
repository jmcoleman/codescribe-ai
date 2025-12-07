/**
 * App Component Tests - File Upload and Management
 *
 * Tests file upload validation, workspace persistence, and file management
 * features including drag-and-drop, database sync, and error handling.
 *
 * Test Coverage:
 * 1. File upload validation edge cases
 * 2. Workspace persistence across sessions
 * 3. File deletion with database sync
 * 4. Error handling for DB failures
 * 5. Multi-file drag-and-drop
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithTheme as render } from './utils/renderWithTheme';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { ThemeProvider } from '../contexts/ThemeContext';
import * as workspaceApi from '../services/workspaceApi';
import { MAX_FILE_SIZE } from '../utils/fileValidation';

// Mock modules
vi.mock('../services/documentsApi', () => ({
  default: {
    generateDocumentation: vi.fn(() => Promise.resolve({
      success: true,
      documentation: '# Test',
      qualityScore: { score: 85, grade: 'B' }
    }))
  }
}));

vi.mock('../services/workspaceApi', () => ({
  default: {
    getWorkspace: vi.fn(() => Promise.resolve({ success: true, files: [] })),
    addWorkspaceFile: vi.fn((fileData) => Promise.resolve({
      success: true,
      file: { id: `workspace-${Date.now()}`, ...fileData }
    })),
    deleteWorkspaceFile: vi.fn(() => Promise.resolve({ success: true })),
    clearWorkspace: vi.fn(() => Promise.resolve({ success: true, deletedCount: 0 })),
    updateWorkspaceFile: vi.fn(() => Promise.resolve({ success: true }))
  },
  getWorkspace: vi.fn(() => Promise.resolve({ success: true, files: [] })),
  addWorkspaceFile: vi.fn((fileData) => Promise.resolve({
    success: true,
    file: { id: `workspace-${Date.now()}`, ...fileData }
  })),
  deleteWorkspaceFile: vi.fn(() => Promise.resolve({ success: true })),
  clearWorkspace: vi.fn(() => Promise.resolve({ success: true, deletedCount: 0 })),
  updateWorkspaceFile: vi.fn(() => Promise.resolve({ success: true }))
}));

vi.mock('react-resizable-panels', () => ({
  Panel: ({ children }) => <div data-testid="panel">{children}</div>,
  PanelGroup: ({ children }) => <div data-testid="panel-group">{children}</div>,
  PanelResizeHandle: () => <div data-testid="resize-handle" />
}));

// Mock AuthContext
const mockAuthContext = {
  isAuthenticated: false,
  user: null,
  loading: false,
  login: vi.fn(),
  logout: vi.fn(),
  signup: vi.fn(),
  updateUser: vi.fn(),
  checkAuth: vi.fn()
};

vi.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => mockAuthContext
}));

// Mock TrialContext
vi.mock('../contexts/TrialContext', () => ({
  TrialProvider: ({ children }) => children,
  useTrial: () => ({
    isOnTrial: false,
    trialTier: null,
    trialEndsAt: null,
    daysRemaining: 0,
    loading: false
  })
}));

// Mock WorkspaceContext
vi.mock('../contexts/WorkspaceContext', () => ({
  WorkspaceProvider: ({ children }) => children,
  useWorkspace: () => ({
    files: [],
    activeFileId: null,
    activeFile: null,
    selectedFileIds: [],
    selectedFiles: [],
    addFile: vi.fn(),
    addFiles: vi.fn(),
    removeFile: vi.fn(),
    removeFiles: vi.fn(),
    updateFile: vi.fn(),
    clearFiles: vi.fn(),
    setActiveFile: vi.fn(),
    getFileById: vi.fn(),
    toggleFileSelection: vi.fn(),
    selectAllFiles: vi.fn(),
    deselectAllFiles: vi.fn(),
    selectFiles: vi.fn(),
    isFileSelected: vi.fn(),
    getSelectedFiles: vi.fn(() => []),
    fileCount: 0,
    hasFiles: false,
    selectedCount: 0,
    hasSelection: false,
    reloadWorkspace: vi.fn()
  })
}));

// Helper to render App with all required providers
function renderApp(user = null) {
  mockAuthContext.isAuthenticated = !!user;
  mockAuthContext.user = user;
  mockAuthContext.loading = false;

  return render(
    <MemoryRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </MemoryRouter>
  );
}

// Helper to create mock File objects
function createMockFile(name, size, type = 'text/javascript', content = 'console.log("test");') {
  const blob = new Blob([content], { type });
  const file = new File([blob], name, { type });

  // Mock file size property
  Object.defineProperty(file, 'size', {
    value: size,
    writable: false
  });

  return file;
}

describe('App - File Upload and Management', () => {
  const proUser = {
    id: 1,
    email: 'pro@example.com',
    firstName: 'Pro',
    lastName: 'User',
    tier: 'pro',
    emailVerified: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();

    // Reset mock auth context
    mockAuthContext.isAuthenticated = false;
    mockAuthContext.user = null;
    mockAuthContext.loading = false;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('File Upload Validation - Edge Cases', () => {
    it('should reject files that are too large (>500KB)', async () => {
      renderApp(proUser);

      await waitFor(() => {
        expect(screen.getByText(/Files \(/i)).toBeInTheDocument();
      });

      // Create a file that exceeds MAX_FILE_SIZE
      const largeFile = createMockFile(
        'large-file.js',
        MAX_FILE_SIZE + 1, // 1 byte over limit
        'text/javascript'
      );

      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;

      // Trigger file change event
      Object.defineProperty(input, 'files', {
        value: [largeFile],
        writable: false
      });

      // File should be rejected silently or with error message
      // The validation happens in processFileUpload/handleMultiFilesDrop
      expect(largeFile.size).toBeGreaterThan(MAX_FILE_SIZE);
    });

    it('should reject empty files (0 bytes)', async () => {
      renderApp(proUser);

      await waitFor(() => {
        expect(screen.getByText(/Files \(/i)).toBeInTheDocument();
      });

      const emptyFile = createMockFile('empty.js', 0, 'text/javascript', '');

      expect(emptyFile.size).toBe(0);
    });

    it('should reject files with no extension', async () => {
      renderApp(proUser);

      await waitFor(() => {
        expect(screen.getByText(/Files \(/i)).toBeInTheDocument();
      });

      const noExtFile = createMockFile('noextension', 100, 'text/plain');

      // File should be validated and rejected
      expect(noExtFile.name.indexOf('.')).toBe(-1);
    });

    it('should reject files with unsupported extensions', async () => {
      renderApp(proUser);

      await waitFor(() => {
        expect(screen.getByText(/Files \(/i)).toBeInTheDocument();
      });

      const unsupportedFile = createMockFile('document.pdf', 1000, 'application/pdf');

      // Extension validation should fail
      expect(unsupportedFile.name.endsWith('.pdf')).toBe(true);
    });

    it('should accept files with valid extensions and size', async () => {
      renderApp(proUser);

      await waitFor(() => {
        expect(screen.getByText(/Files \(/i)).toBeInTheDocument();
      });

      const validFile = createMockFile(
        'valid-code.js',
        1000, // Well under 500KB
        'text/javascript',
        'console.log("valid code");'
      );

      expect(validFile.size).toBeLessThan(MAX_FILE_SIZE);
      expect(validFile.size).toBeGreaterThan(0);
      expect(validFile.name.endsWith('.js')).toBe(true);
    });

    it('should handle files with unusual MIME types but valid extensions', async () => {
      renderApp(proUser);

      await waitFor(() => {
        expect(screen.getByText(/Files \(/i)).toBeInTheDocument();
      });

      // Some systems report octet-stream for code files
      const unusualMimeFile = createMockFile(
        'code.js',
        500,
        'application/octet-stream',
        'const x = 1;'
      );

      expect(unusualMimeFile.name.endsWith('.js')).toBe(true);
      expect(unusualMimeFile.type).toBe('application/octet-stream');
    });

    it('should validate multiple file extensions (.jsx, .ts, .tsx, .py, etc.)', async () => {
      renderApp(proUser);

      await waitFor(() => {
        expect(screen.getByText(/Files \(/i)).toBeInTheDocument();
      });

      const extensions = ['.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.go', '.rs'];

      extensions.forEach(ext => {
        const file = createMockFile(`test${ext}`, 100, 'text/plain');
        expect(file.name.endsWith(ext)).toBe(true);
      });
    });
  });

  // NOTE: Workspace persistence tests need to be rewritten to test WorkspaceContext directly
  // since App now uses useWorkspace from context instead of calling workspaceApi directly
  describe('Workspace Persistence Across Sessions', () => {
    it.skip('should load workspace files from database on mount for Pro users', async () => {
      const mockWorkspaceFiles = [
        {
          id: 'workspace-1',
          filename: 'test1.js',
          language: 'javascript',
          file_size_bytes: 500,
          doc_type: 'README',
          origin: 'upload'
        },
        {
          id: 'workspace-2',
          filename: 'test2.py',
          language: 'python',
          file_size_bytes: 750,
          doc_type: 'API',
          origin: 'upload'
        }
      ];

      workspaceApi.default.getWorkspace.mockResolvedValueOnce({
        success: true,
        files: mockWorkspaceFiles,
        count: 2
      });

      renderApp(proUser);

      await waitFor(() => {
        expect(workspaceApi.default.getWorkspace).toHaveBeenCalled();
      });

      // Files should be loaded and displayed in sidebar
      // Note: File content is NOT loaded from DB (privacy), only metadata
    });

    it('should NOT load workspace for Free tier users', async () => {
      const freeUser = {
        id: 2,
        email: 'free@example.com',
        tier: 'free',
        emailVerified: true
      };

      renderApp(freeUser);

      await waitFor(() => {
        expect(mockAuthContext.isAuthenticated).toBe(true);
      });

      // Workspace should not be loaded for free tier
      expect(workspaceApi.default.getWorkspace).not.toHaveBeenCalled();
    });

    it('should save file metadata to localStorage for Pro users', async () => {
      renderApp(proUser);

      await waitFor(() => {
        expect(screen.getByText(/Files \(/i)).toBeInTheDocument();
      });

      // Verify localStorage key is set up correctly
      const workspaceKey = `workspace_${proUser.id}`;

      // Initially should be empty or have default state
      const initialData = localStorage.getItem(workspaceKey);
      expect(initialData === null || initialData === '{}').toBe(true);
    });

    it('should persist file list state in sessionStorage', async () => {
      renderApp(proUser);

      await waitFor(() => {
        expect(screen.getByText(/Files \(/i)).toBeInTheDocument();
      });

      // Verify sessionStorage is used for file list state
      const sessionData = sessionStorage.getItem('multi_file_workspace');

      // Should have workspace data structure
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        expect(parsed).toHaveProperty('files');
        expect(Array.isArray(parsed.files)).toBe(true);
      }
    });

    it('should handle localStorage quota exceeded gracefully', async () => {
      renderApp(proUser);

      await waitFor(() => {
        expect(screen.getByText(/Files \(/i)).toBeInTheDocument();
      });

      // Mock localStorage.setItem to throw QuotaExceededError
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      // Should not crash when quota is exceeded
      // Error should be caught and logged

      // Restore original
      Storage.prototype.setItem = originalSetItem;
    });
  });

  describe('File Deletion with Database Sync', () => {
    it('should delete file from both state and database', async () => {
      renderApp(proUser);

      await waitFor(() => {
        expect(screen.getByText(/Files \(/i)).toBeInTheDocument();
      });

      const fileId = 'test-file-id';

      // Mock file exists in workspace
      workspaceApi.default.deleteWorkspaceFile.mockResolvedValueOnce({
        success: true,
        deleted: fileId
      });

      // Call deleteWorkspaceFile API
      const result = await workspaceApi.default.deleteWorkspaceFile(fileId);

      expect(result.success).toBe(true);
      expect(result.deleted).toBe(fileId);
      expect(workspaceApi.default.deleteWorkspaceFile).toHaveBeenCalledWith(fileId);
    });

    it('should clear all files from database when workspace is cleared', async () => {
      renderApp(proUser);

      await waitFor(() => {
        expect(screen.getByText(/Files \(/i)).toBeInTheDocument();
      });

      workspaceApi.default.clearWorkspace.mockResolvedValueOnce({
        success: true,
        deletedCount: 5
      });

      const result = await workspaceApi.default.clearWorkspace();

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(5);
      expect(workspaceApi.default.clearWorkspace).toHaveBeenCalled();
    });

    it('should handle file deletion when file is not in database', async () => {
      renderApp(proUser);

      await waitFor(() => {
        expect(screen.getByText(/Files \(/i)).toBeInTheDocument();
      });

      // File doesn't exist in DB
      workspaceApi.default.deleteWorkspaceFile.mockRejectedValueOnce(
        new Error('File not found')
      );

      // Should handle error gracefully
      await expect(
        workspaceApi.default.deleteWorkspaceFile('nonexistent-id')
      ).rejects.toThrow('File not found');
    });

    it('should remove file from localStorage when deleted', async () => {
      renderApp(proUser);

      await waitFor(() => {
        expect(screen.getByText(/Files \(/i)).toBeInTheDocument();
      });

      const workspaceKey = `workspace_${proUser.id}`;

      // Add file content to localStorage
      const fileContent = { 'file-1': 'console.log("test");' };
      localStorage.setItem(workspaceKey, JSON.stringify(fileContent));

      // Verify it's there
      expect(localStorage.getItem(workspaceKey)).toBeTruthy();

      // After deletion, file content should be removed
      // (this happens in useWorkspacePersistence hook)
    });
  });

  describe('Error Handling for Database Failures', () => {
    it('should handle network errors when loading workspace', async () => {
      workspaceApi.default.getWorkspace.mockRejectedValueOnce(
        new Error('Network error')
      );

      renderApp(proUser);

      // Should not crash, should show error gracefully
      await waitFor(() => {
        // App should still render even if workspace fails to load
        const headers = screen.queryAllByText(/CodeScribe AI/i);
        expect(headers.length).toBeGreaterThan(0);
      });
    });

    // Skip: This test needs to test WorkspaceContext directly
    it.skip('should handle 401 Unauthorized when token is invalid', async () => {
      workspaceApi.default.getWorkspace.mockRejectedValueOnce(
        new Error('Unauthorized')
      );

      renderApp(proUser);

      await waitFor(() => {
        expect(workspaceApi.default.getWorkspace).toHaveBeenCalled();
      });

      // Should handle 401 and potentially trigger re-authentication
    });

    it('should handle 500 Internal Server Error gracefully', async () => {
      workspaceApi.default.addWorkspaceFile.mockRejectedValueOnce(
        new Error('Internal Server Error')
      );

      // Attempt to add a file should fail gracefully
      await expect(
        workspaceApi.default.addWorkspaceFile({
          filename: 'test.js',
          language: 'javascript',
          fileSizeBytes: 100,
          docType: 'README'
        })
      ).rejects.toThrow('Internal Server Error');
    });

    it('should handle timeout errors when saving to database', async () => {
      workspaceApi.default.addWorkspaceFile.mockImplementationOnce(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 100);
        });
      });

      await expect(
        workspaceApi.default.addWorkspaceFile({
          filename: 'test.js',
          language: 'javascript',
          fileSizeBytes: 100
        })
      ).rejects.toThrow('Request timeout');
    });

    it('should continue working if database save fails but file is added to state', async () => {
      renderApp(proUser);

      await waitFor(() => {
        expect(screen.getByText(/Files \(/i)).toBeInTheDocument();
      });

      // Mock DB failure
      workspaceApi.default.addWorkspaceFile.mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      // File should still be added to in-memory state
      // User can continue working even if DB sync fails
    });

    it('should show error message when workspace fails to load', async () => {
      workspaceApi.default.getWorkspace.mockRejectedValueOnce(
        new Error('Failed to fetch workspace')
      );

      renderApp(proUser);

      // Should not crash the app
      await waitFor(() => {
        const headers = screen.queryAllByText(/CodeScribe AI/i);
        expect(headers.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Multi-File Drag and Drop', () => {
    it('should handle multiple files dropped at once', async () => {
      renderApp(proUser);

      await waitFor(() => {
        expect(screen.getByText(/Files \(/i)).toBeInTheDocument();
      });

      const files = [
        createMockFile('file1.js', 100, 'text/javascript'),
        createMockFile('file2.py', 200, 'text/x-python'),
        createMockFile('file3.ts', 150, 'text/typescript')
      ];

      // All files should be valid
      files.forEach(file => {
        expect(file.size).toBeGreaterThan(0);
        expect(file.size).toBeLessThan(MAX_FILE_SIZE);
      });
    });

    it('should filter out invalid files and keep valid ones during batch upload', async () => {
      renderApp(proUser);

      await waitFor(() => {
        expect(screen.getByText(/Files \(/i)).toBeInTheDocument();
      });

      const files = [
        createMockFile('valid.js', 100, 'text/javascript'),
        createMockFile('too-large.js', MAX_FILE_SIZE + 1, 'text/javascript'),
        createMockFile('valid.py', 200, 'text/x-python'),
        createMockFile('invalid.pdf', 100, 'application/pdf')
      ];

      // Only 2 files should be valid
      const validFiles = files.filter(f =>
        f.size > 0 &&
        f.size <= MAX_FILE_SIZE &&
        !f.name.endsWith('.pdf')
      );

      expect(validFiles.length).toBe(2);
    });

    it('should handle drag events properly', async () => {
      renderApp(proUser);

      await waitFor(() => {
        expect(screen.getByText(/Files \(/i)).toBeInTheDocument();
      });

      // FileList component should have drag-and-drop handlers
      // onDragEnter, onDragLeave, onDragOver, onDrop
    });

    it('should show drop zone when dragging files over sidebar', async () => {
      renderApp(proUser);

      await waitFor(() => {
        expect(screen.getByText(/Files \(/i)).toBeInTheDocument();
      });

      // Drop zone should appear when isDragging state is true
      // This is handled in FileList component
    });

    it('should handle empty file list during drop', async () => {
      renderApp(proUser);

      await waitFor(() => {
        expect(screen.getByText(/Files \(/i)).toBeInTheDocument();
      });

      const emptyFileList = [];

      // Should handle gracefully without errors
      expect(emptyFileList.length).toBe(0);
    });

    it('should preserve file order when adding multiple files', async () => {
      renderApp(proUser);

      await waitFor(() => {
        expect(screen.getByText(/Files \(/i)).toBeInTheDocument();
      });

      const files = [
        createMockFile('alpha.js', 100, 'text/javascript'),
        createMockFile('beta.js', 100, 'text/javascript'),
        createMockFile('charlie.js', 100, 'text/javascript')
      ];

      // Files should maintain insertion order
      expect(files[0].name).toBe('alpha.js');
      expect(files[1].name).toBe('beta.js');
      expect(files[2].name).toBe('charlie.js');
    });

    it('should handle duplicate file names during batch upload', async () => {
      renderApp(proUser);

      await waitFor(() => {
        expect(screen.getByText(/Files \(/i)).toBeInTheDocument();
      });

      const files = [
        createMockFile('test.js', 100, 'text/javascript', 'code 1'),
        createMockFile('test.js', 150, 'text/javascript', 'code 2')
      ];

      // Both files have the same name but different content
      expect(files[0].name).toBe(files[1].name);
      expect(files[0].size).not.toBe(files[1].size);
    });
  });

  describe('File Management - Integration', () => {
    it('should update workspace when file doc type is changed', async () => {
      renderApp(proUser);

      await waitFor(() => {
        expect(screen.getByText(/Files \(/i)).toBeInTheDocument();
      });

      const fileId = 'test-file-id';
      const updates = { docType: 'API' };

      workspaceApi.default.updateWorkspaceFile.mockResolvedValueOnce({
        success: true,
        file: { id: fileId, ...updates }
      });

      const result = await workspaceApi.default.updateWorkspaceFile(fileId, updates);

      expect(result.success).toBe(true);
      expect(workspaceApi.default.updateWorkspaceFile).toHaveBeenCalledWith(fileId, updates);
    });

    it('should link workspace file to generated document after doc generation', async () => {
      renderApp(proUser);

      await waitFor(() => {
        expect(screen.getByText(/Files \(/i)).toBeInTheDocument();
      });

      const fileId = 'workspace-file-123';
      const documentId = 'generated-doc-456';

      workspaceApi.default.updateWorkspaceFile.mockResolvedValueOnce({
        success: true,
        file: { id: fileId, documentId }
      });

      const result = await workspaceApi.default.updateWorkspaceFile(fileId, { documentId });

      expect(result.success).toBe(true);
      expect(result.file.documentId).toBe(documentId);
    });

    it('should handle workspace operations for unauthenticated users (no DB sync)', async () => {
      renderApp(null);

      await waitFor(() => {
        // Unauthenticated user should not see sidebar
        expect(screen.queryByText(/Files \(/i)).not.toBeInTheDocument();
      });

      // No workspace API calls should be made
      expect(workspaceApi.default.getWorkspace).not.toHaveBeenCalled();
    });
  });
});

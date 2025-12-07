/**
 * Shared mock for WorkspaceContext
 *
 * Usage in test files:
 *   import { mockWorkspaceContext, createWorkspaceContextMock } from './mocks/workspaceContextMock';
 *
 *   vi.mock('../contexts/WorkspaceContext', () => mockWorkspaceContext);
 *
 * Or for customizable mocks:
 *   vi.mock('../contexts/WorkspaceContext', () => createWorkspaceContextMock({ files: mockFiles }));
 */

import { vi } from 'vitest';

/**
 * Create a mock workspace state object with optional overrides
 */
export function createMockWorkspaceState(overrides = {}) {
  return {
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
    reloadWorkspace: vi.fn(),
    ...overrides
  };
}

/**
 * Create a complete WorkspaceContext mock module with optional state overrides
 */
export function createWorkspaceContextMock(stateOverrides = {}) {
  const mockState = createMockWorkspaceState(stateOverrides);
  return {
    WorkspaceProvider: ({ children }) => children,
    useWorkspace: () => mockState
  };
}

/**
 * Default mock for WorkspaceContext - use with vi.mock()
 */
export const mockWorkspaceContext = createWorkspaceContextMock();

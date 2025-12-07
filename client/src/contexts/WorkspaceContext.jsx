/**
 * WorkspaceContext
 *
 * Provides workspace state (multi-file management) to the entire app.
 * This allows any page (like History) to add files to the workspace.
 *
 * Uses useWorkspacePersistence which wraps useMultiFileState and adds
 * database persistence for authenticated users with multi-file access.
 *
 * Usage:
 *   import { useWorkspace } from '../contexts/WorkspaceContext';
 *   const { addFile, addFiles, files } = useWorkspace();
 */

import { createContext, useContext } from 'react';
import { useWorkspacePersistence } from '../hooks/useWorkspacePersistence';

const WorkspaceContext = createContext(null);

/**
 * WorkspaceProvider - Wrap your app with this to provide workspace state
 */
export function WorkspaceProvider({ children }) {
  const workspaceState = useWorkspacePersistence();

  return (
    <WorkspaceContext.Provider value={workspaceState}>
      {children}
    </WorkspaceContext.Provider>
  );
}

/**
 * useWorkspace - Hook to access workspace state from any component
 * @returns {Object} Workspace state and operations from useMultiFileState
 */
export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}

export default WorkspaceContext;

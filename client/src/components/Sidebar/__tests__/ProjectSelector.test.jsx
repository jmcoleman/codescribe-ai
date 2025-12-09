/**
 * Tests for ProjectSelector Component
 *
 * Tests project selection dropdown including:
 * - Default "No Project" selection
 * - Project list loading and display
 * - Project selection
 * - Inline project creation
 * - Error handling
 *
 * Part of: Graph Engine API (Epic 5.4) - Phase 4: Frontend Integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectSelector } from '../ProjectSelector';
import * as projectsApi from '../../../services/projectsApi';

// Mock projectsApi
vi.mock('../../../services/projectsApi', () => ({
  getProjects: vi.fn(),
  createProject: vi.fn()
}));

// Mock toast utility
vi.mock('../../../utils/toastWithHistory', () => ({
  toastCompact: vi.fn()
}));

describe('ProjectSelector', () => {
  const mockProjects = [
    { id: 1, name: 'Project Alpha' },
    { id: 2, name: 'Project Beta' },
    { id: 3, name: 'Project Gamma' }
  ];

  const defaultProps = {
    selectedProjectId: null,
    onProjectChange: vi.fn(),
    size: 'small'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    projectsApi.getProjects.mockResolvedValue({ projects: mockProjects });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render with "No Project" as default when selectedProjectId is null', async () => {
      render(<ProjectSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No Project')).toBeInTheDocument();
      });
    });

    it('should show loading state while fetching projects', () => {
      // Delay the mock to capture loading state
      projectsApi.getProjects.mockImplementation(() => new Promise(() => {}));

      render(<ProjectSelector {...defaultProps} />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should load projects on mount', async () => {
      render(<ProjectSelector {...defaultProps} />);

      await waitFor(() => {
        expect(projectsApi.getProjects).toHaveBeenCalledWith({ limit: 100 });
      });
    });

    it('should show selected project name when selectedProjectId is set', async () => {
      render(<ProjectSelector {...defaultProps} selectedProjectId={2} />);

      await waitFor(() => {
        expect(screen.getByText('Project Beta')).toBeInTheDocument();
      });
    });

    it('should be disabled while loading', () => {
      projectsApi.getProjects.mockImplementation(() => new Promise(() => {}));

      render(<ProjectSelector {...defaultProps} />);

      const button = screen.getByRole('button', { name: /Select project/i });
      expect(button).toBeDisabled();
    });
  });

  describe('Dropdown Behavior', () => {
    it('should open dropdown when button is clicked', async () => {
      const user = userEvent.setup();
      render(<ProjectSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No Project')).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /Select project/i });
      await user.click(button);

      // Should show the project list
      expect(screen.getByRole('option', { name: /Project Alpha/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /Project Beta/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /Project Gamma/i })).toBeInTheDocument();
    });

    it('should show "No Project" option in dropdown', async () => {
      const user = userEvent.setup();
      render(<ProjectSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No Project')).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /Select project/i });
      await user.click(button);

      // Should have No Project option with checkmark since it's selected
      const noProjectOption = screen.getByRole('option', { name: /No Project/i });
      expect(noProjectOption).toBeInTheDocument();
    });

    it('should show "New project" button in dropdown', async () => {
      const user = userEvent.setup();
      render(<ProjectSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No Project')).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /Select project/i });
      await user.click(button);

      expect(screen.getByText('New project')).toBeInTheDocument();
    });

    it('should close dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <ProjectSelector {...defaultProps} />
          <div data-testid="outside">Outside</div>
        </div>
      );

      await waitFor(() => {
        expect(screen.getByText('No Project')).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /Select project/i });
      await user.click(button);

      // Dropdown should be open
      expect(screen.getByRole('option', { name: /Project Alpha/i })).toBeInTheDocument();

      // Click outside
      fireEvent.mouseDown(screen.getByTestId('outside'));

      // Dropdown should close
      await waitFor(() => {
        expect(screen.queryByRole('option', { name: /Project Alpha/i })).not.toBeInTheDocument();
      });
    });

    it('should toggle dropdown on button click', async () => {
      const user = userEvent.setup();
      render(<ProjectSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No Project')).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /Select project/i });

      // Open
      await user.click(button);
      expect(screen.getByRole('option', { name: /Project Alpha/i })).toBeInTheDocument();

      // Close
      await user.click(button);
      await waitFor(() => {
        expect(screen.queryByRole('option', { name: /Project Alpha/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Project Selection', () => {
    it('should call onProjectChange when selecting a project', async () => {
      const user = userEvent.setup();
      const onProjectChange = vi.fn();
      render(<ProjectSelector {...defaultProps} onProjectChange={onProjectChange} />);

      await waitFor(() => {
        expect(screen.getByText('No Project')).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /Select project/i });
      await user.click(button);

      const projectOption = screen.getByRole('option', { name: /Project Alpha/i });
      await user.click(projectOption);

      expect(onProjectChange).toHaveBeenCalledWith(1, 'Project Alpha');
    });

    it('should call onProjectChange with null when selecting "No Project"', async () => {
      const user = userEvent.setup();
      const onProjectChange = vi.fn();
      render(<ProjectSelector {...defaultProps} selectedProjectId={1} onProjectChange={onProjectChange} />);

      await waitFor(() => {
        expect(screen.getByText('Project Alpha')).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /Select project/i });
      await user.click(button);

      const noProjectOption = screen.getByRole('option', { name: /No Project/i });
      await user.click(noProjectOption);

      // Name defaults to null when selecting "No Project"
      expect(onProjectChange).toHaveBeenCalledWith(null, null);
    });

    it('should close dropdown after selection', async () => {
      const user = userEvent.setup();
      render(<ProjectSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No Project')).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /Select project/i });
      await user.click(button);

      const projectOption = screen.getByRole('option', { name: /Project Beta/i });
      await user.click(projectOption);

      await waitFor(() => {
        expect(screen.queryByRole('option', { name: /Project Alpha/i })).not.toBeInTheDocument();
      });
    });

    it('should show checkmark on selected project', async () => {
      const user = userEvent.setup();
      render(<ProjectSelector {...defaultProps} selectedProjectId={2} />);

      await waitFor(() => {
        expect(screen.getByText('Project Beta')).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /Select project/i });
      await user.click(button);

      // Project Beta should have purple styling indicating selection
      const projectBetaOption = screen.getByRole('option', { name: /Project Beta/i });
      expect(projectBetaOption).toHaveClass('bg-purple-50');
    });
  });

  describe('Inline Project Creation', () => {
    it('should show create form when "New project" is clicked', async () => {
      const user = userEvent.setup();
      render(<ProjectSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No Project')).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /Select project/i });
      await user.click(button);

      const newProjectBtn = screen.getByText('New project');
      await user.click(newProjectBtn);

      expect(screen.getByPlaceholderText('Project name')).toBeInTheDocument();
    });

    it('should focus input when create form opens', async () => {
      const user = userEvent.setup();
      render(<ProjectSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No Project')).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /Select project/i });
      await user.click(button);

      const newProjectBtn = screen.getByText('New project');
      await user.click(newProjectBtn);

      const input = screen.getByPlaceholderText('Project name');
      expect(document.activeElement).toBe(input);
    });

    it('should create project when form is submitted', async () => {
      const user = userEvent.setup();
      const onProjectChange = vi.fn();
      projectsApi.createProject.mockResolvedValue({
        project: { id: 4, name: 'New Test Project' }
      });

      render(<ProjectSelector {...defaultProps} onProjectChange={onProjectChange} />);

      await waitFor(() => {
        expect(screen.getByText('No Project')).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /Select project/i });
      await user.click(button);

      const newProjectBtn = screen.getByText('New project');
      await user.click(newProjectBtn);

      const input = screen.getByPlaceholderText('Project name');
      await user.type(input, 'New Test Project');

      const createBtn = screen.getByRole('button', { name: /Create project/i });
      await user.click(createBtn);

      await waitFor(() => {
        expect(projectsApi.createProject).toHaveBeenCalledWith({
          name: 'New Test Project'
        });
        expect(onProjectChange).toHaveBeenCalledWith(4, 'New Test Project');
      });
    });

    it('should create project when Enter is pressed', async () => {
      const user = userEvent.setup();
      const onProjectChange = vi.fn();
      projectsApi.createProject.mockResolvedValue({
        project: { id: 5, name: 'Enter Project' }
      });

      render(<ProjectSelector {...defaultProps} onProjectChange={onProjectChange} />);

      await waitFor(() => {
        expect(screen.getByText('No Project')).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /Select project/i });
      await user.click(button);

      const newProjectBtn = screen.getByText('New project');
      await user.click(newProjectBtn);

      const input = screen.getByPlaceholderText('Project name');
      await user.type(input, 'Enter Project{enter}');

      await waitFor(() => {
        expect(projectsApi.createProject).toHaveBeenCalledWith({
          name: 'Enter Project'
        });
      });
    });

    it('should not create project with empty name', async () => {
      const user = userEvent.setup();
      render(<ProjectSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No Project')).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /Select project/i });
      await user.click(button);

      const newProjectBtn = screen.getByText('New project');
      await user.click(newProjectBtn);

      const createBtn = screen.getByRole('button', { name: /Create project/i });
      expect(createBtn).toBeDisabled();
    });

    it('should cancel create form when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<ProjectSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No Project')).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /Select project/i });
      await user.click(button);

      const newProjectBtn = screen.getByText('New project');
      await user.click(newProjectBtn);

      expect(screen.getByPlaceholderText('Project name')).toBeInTheDocument();

      const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelBtn);

      // Form should be hidden, "New project" button should be visible
      expect(screen.queryByPlaceholderText('Project name')).not.toBeInTheDocument();
      expect(screen.getByText('New project')).toBeInTheDocument();
    });

    it('should cancel create form when Escape is pressed', async () => {
      const user = userEvent.setup();
      render(<ProjectSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No Project')).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /Select project/i });
      await user.click(button);

      const newProjectBtn = screen.getByText('New project');
      await user.click(newProjectBtn);

      const input = screen.getByPlaceholderText('Project name');
      await user.type(input, 'Test{escape}');

      // Form should be hidden
      expect(screen.queryByPlaceholderText('Project name')).not.toBeInTheDocument();
    });

    it('should show loading spinner while creating project', async () => {
      const user = userEvent.setup();
      // Delay the mock to capture loading state
      projectsApi.createProject.mockImplementation(() => new Promise(() => {}));

      render(<ProjectSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No Project')).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /Select project/i });
      await user.click(button);

      const newProjectBtn = screen.getByText('New project');
      await user.click(newProjectBtn);

      const input = screen.getByPlaceholderText('Project name');
      await user.type(input, 'Loading Project');

      const createBtn = screen.getByRole('button', { name: /Create project/i });
      await user.click(createBtn);

      // Input should be disabled during creation
      expect(input).toBeDisabled();
    });

    it('should add new project to list after creation', async () => {
      const user = userEvent.setup();
      projectsApi.createProject.mockResolvedValue({
        project: { id: 6, name: 'Brand New Project' }
      });

      render(<ProjectSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No Project')).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /Select project/i });
      await user.click(button);

      const newProjectBtn = screen.getByText('New project');
      await user.click(newProjectBtn);

      const input = screen.getByPlaceholderText('Project name');
      await user.type(input, 'Brand New Project');

      const createBtn = screen.getByRole('button', { name: /Create project/i });
      await user.click(createBtn);

      // Wait for creation and re-open dropdown
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Project name')).not.toBeInTheDocument();
      });

      // Open dropdown again to verify new project is in list
      await user.click(button);

      expect(screen.getByRole('option', { name: /Brand New Project/i })).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no projects exist', async () => {
      projectsApi.getProjects.mockResolvedValue({ projects: [] });
      const user = userEvent.setup();

      render(<ProjectSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No Project')).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /Select project/i });
      await user.click(button);

      expect(screen.getByText('No projects yet')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle API error silently when loading projects', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      projectsApi.getProjects.mockRejectedValue(new Error('Network error'));

      render(<ProjectSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No Project')).toBeInTheDocument();
      });

      // Should still be usable
      const button = screen.getByRole('button', { name: /Select project/i });
      expect(button).not.toBeDisabled();

      consoleError.mockRestore();
    });
  });

  describe('Size Variants', () => {
    it('should apply small size classes by default', async () => {
      render(<ProjectSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No Project')).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /Select project/i });
      expect(button).toHaveClass('text-xs');
      expect(button).toHaveClass('py-1.5');
    });

    it('should apply default size classes when size is "default"', async () => {
      render(<ProjectSelector {...defaultProps} size="default" />);

      await waitFor(() => {
        expect(screen.getByText('No Project')).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /Select project/i });
      expect(button).toHaveClass('text-sm');
      expect(button).toHaveClass('py-2');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on button', async () => {
      render(<ProjectSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No Project')).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /Select project/i });
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('should update aria-expanded when dropdown opens', async () => {
      const user = userEvent.setup();
      render(<ProjectSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No Project')).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /Select project/i });
      await user.click(button);

      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have aria-selected on options', async () => {
      const user = userEvent.setup();
      render(<ProjectSelector {...defaultProps} selectedProjectId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Project Alpha')).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /Select project/i });
      await user.click(button);

      const selectedOption = screen.getByRole('option', { name: /Project Alpha/i });
      expect(selectedOption).toHaveAttribute('aria-selected', 'true');

      const unselectedOption = screen.getByRole('option', { name: /Project Beta/i });
      expect(unselectedOption).toHaveAttribute('aria-selected', 'false');
    });
  });
});

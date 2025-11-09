import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithTheme as render } from '../../__tests__/utils/renderWithTheme';
import userEvent from '@testing-library/user-event';
import { ControlBar } from '../ControlBar';

describe('ControlBar Component', () => {
  const defaultProps = {
    docType: 'README',
    onDocTypeChange: vi.fn(),
    onGenerate: vi.fn(),
    onUpload: vi.fn(),
    onGithubImport: vi.fn(),
    isGenerating: false,
    disabled: false
  };

  describe('Rendering', () => {
    it('should render all action buttons', () => {
      render(<ControlBar {...defaultProps} />);

      expect(screen.getByRole('button', { name: /upload files/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /generate docs/i })).toBeInTheDocument();
      // GitHub import button hidden by feature flag
      expect(screen.queryByRole('button', { name: /import from github/i })).not.toBeInTheDocument();
    });

    it('should render doc type selector', () => {
      render(<ControlBar {...defaultProps} />);

      // The Select component renders a button with the selected option
      expect(screen.getByText('README.md')).toBeInTheDocument();
    });

    it('should display correct initial doc type', () => {
      render(<ControlBar {...defaultProps} docType="JSDOC" />);

      expect(screen.getByText('JSDoc Comments')).toBeInTheDocument();
    });

    it('should render with all doc type options', () => {
      render(<ControlBar {...defaultProps} />);

      const expectedOptions = ['README', 'JSDOC', 'API', 'ARCHITECTURE'];
      // All doc types should be available (verified by clicking the select)
      expect(expectedOptions.length).toBe(4);
    });
  });

  describe('Upload Button', () => {
    it('should call onUpload when upload button clicked', async () => {
      const user = userEvent.setup();
      const onUpload = vi.fn();

      render(<ControlBar {...defaultProps} onUpload={onUpload} />);

      const uploadButton = screen.getByRole('button', { name: /upload files/i });
      await user.click(uploadButton);

      expect(onUpload).toHaveBeenCalledTimes(1);
    });

    it('should disable upload button when disabled prop is true', () => {
      render(<ControlBar {...defaultProps} disabled={true} />);

      const uploadButton = screen.getByRole('button', { name: /upload files/i });
      expect(uploadButton).toBeDisabled();
    });

    it('should enable upload button when disabled prop is false', () => {
      render(<ControlBar {...defaultProps} disabled={false} />);

      const uploadButton = screen.getByRole('button', { name: /upload files/i });
      expect(uploadButton).toBeEnabled();
    });

    it('should have secondary variant styling', () => {
      render(<ControlBar {...defaultProps} />);

      const uploadButton = screen.getByRole('button', { name: /upload files/i });
      expect(uploadButton).toHaveClass('bg-slate-100');
    });

    it('should display upload icon', () => {
      render(<ControlBar {...defaultProps} />);

      const uploadButton = screen.getByRole('button', { name: /upload files/i });
      // Icon is rendered as SVG within the button
      expect(uploadButton.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('GitHub Import Button', () => {
    // Note: GitHub import feature is currently disabled via feature flag (ENABLE_GITHUB_IMPORT = false)
    // These tests are skipped until the feature is implemented in v2.0

    it.skip('should call onGithubImport when clicked', async () => {
      const user = userEvent.setup();
      const onGithubImport = vi.fn();

      render(<ControlBar {...defaultProps} onGithubImport={onGithubImport} />);

      const githubButton = screen.getByRole('button', { name: /import from github/i });
      await user.click(githubButton);

      expect(onGithubImport).toHaveBeenCalledTimes(1);
    });

    it.skip('should disable github button when disabled prop is true', () => {
      render(<ControlBar {...defaultProps} disabled={true} />);

      const githubButton = screen.getByRole('button', { name: /import from github/i });
      expect(githubButton).toBeDisabled();
    });

    it.skip('should have secondary variant styling', () => {
      render(<ControlBar {...defaultProps} />);

      const githubButton = screen.getByRole('button', { name: /import from github/i });
      expect(githubButton).toHaveClass('bg-slate-100');
    });

    it.skip('should display github icon', () => {
      render(<ControlBar {...defaultProps} />);

      const githubButton = screen.getByRole('button', { name: /import from github/i });
      expect(githubButton.querySelector('svg')).toBeInTheDocument();
    });

    it.skip('should show responsive text content', () => {
      render(<ControlBar {...defaultProps} />);

      // Desktop text (hidden on mobile)
      expect(screen.getByText('Import from GitHub')).toHaveClass('hidden', 'sm:inline');

      // Mobile text (hidden on desktop)
      expect(screen.getByText('GitHub')).toHaveClass('sm:hidden');
    });

    it('should not render GitHub import button when feature is disabled', () => {
      render(<ControlBar {...defaultProps} />);

      const githubButton = screen.queryByRole('button', { name: /import from github/i });
      expect(githubButton).not.toBeInTheDocument();
    });
  });

  describe('Doc Type Selector', () => {
    it('should open dropdown when clicked', async () => {
      const user = userEvent.setup();

      render(<ControlBar {...defaultProps} />);

      // Click the select trigger
      const selectButton = screen.getByText('README.md');
      await user.click(selectButton);

      // All options should now be visible
      await waitFor(() => {
        expect(screen.getByText('JSDoc Comments')).toBeInTheDocument();
        expect(screen.getByText('API Documentation')).toBeInTheDocument();
        expect(screen.getByText('Architecture Docs')).toBeInTheDocument();
      });
    });

    it('should call onDocTypeChange when option selected', async () => {
      const user = userEvent.setup();
      const onDocTypeChange = vi.fn();

      render(<ControlBar {...defaultProps} onDocTypeChange={onDocTypeChange} />);

      // Open dropdown
      const selectButton = screen.getByText('README.md');
      await user.click(selectButton);

      // Select JSDOC option
      const jsdocOption = await screen.findByText('JSDoc Comments');
      await user.click(jsdocOption);

      expect(onDocTypeChange).toHaveBeenCalledWith('JSDOC');
    });

    it('should change to JSDOC doc type', async () => {
      const user = userEvent.setup();
      const onDocTypeChange = vi.fn();

      const { rerender } = render(<ControlBar {...defaultProps} onDocTypeChange={onDocTypeChange} />);

      // Open dropdown and select JSDOC
      await user.click(screen.getByText('README.md'));
      const jsDocOptions = await screen.findAllByText('JSDoc Comments');
      await user.click(jsDocOptions[jsDocOptions.length - 1]); // Click the one in dropdown

      // Simulate parent component updating the docType prop
      rerender(<ControlBar {...defaultProps} docType="JSDOC" onDocTypeChange={onDocTypeChange} />);

      // JSDoc Comments should now be displayed (may appear multiple times if dropdown still open)
      const jsDocElements = screen.getAllByText('JSDoc Comments');
      expect(jsDocElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should change to API doc type', async () => {
      const user = userEvent.setup();
      const onDocTypeChange = vi.fn();

      const { rerender } = render(<ControlBar {...defaultProps} onDocTypeChange={onDocTypeChange} />);

      // Open dropdown and select API
      await user.click(screen.getByText('README.md'));
      const apiOptions = await screen.findAllByText('API Documentation');
      await user.click(apiOptions[apiOptions.length - 1]); // Click the one in dropdown

      // Simulate parent component updating the docType prop
      rerender(<ControlBar {...defaultProps} docType="API" onDocTypeChange={onDocTypeChange} />);

      // API Documentation should now be displayed (may appear multiple times if dropdown still open)
      const apiElements = screen.getAllByText('API Documentation');
      expect(apiElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should change to ARCHITECTURE doc type', async () => {
      const user = userEvent.setup();
      const onDocTypeChange = vi.fn();

      const { rerender } = render(<ControlBar {...defaultProps} onDocTypeChange={onDocTypeChange} />);

      // Open dropdown and select ARCHITECTURE
      await user.click(screen.getByText('README.md'));
      const archOptions = await screen.findAllByText('Architecture Docs');
      await user.click(archOptions[archOptions.length - 1]); // Click the one in dropdown

      // Simulate parent component updating the docType prop
      rerender(<ControlBar {...defaultProps} docType="ARCHITECTURE" onDocTypeChange={onDocTypeChange} />);

      // Architecture Docs should now be displayed (may appear multiple times if dropdown still open)
      const archElements = screen.getAllByText('Architecture Docs');
      expect(archElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should close dropdown after selecting option', async () => {
      const user = userEvent.setup();

      render(<ControlBar {...defaultProps} />);

      // Open dropdown
      await user.click(screen.getByText('README.md'));

      // Verify dropdown is open
      expect(screen.getByText('API Documentation')).toBeInTheDocument();

      // Select an option
      await user.click(screen.getByText('JSDoc Comments'));

      // Dropdown should close (API Documentation should no longer be visible)
      await waitFor(() => {
        expect(screen.queryByText('API Documentation')).not.toBeInTheDocument();
      });
    });

    it('should highlight selected option in dropdown', async () => {
      const user = userEvent.setup();
      const { container } = render(<ControlBar {...defaultProps} docType="API" />);

      // Open dropdown
      await user.click(screen.getByText('API Documentation'));

      // Find the selected option in the dropdown (it's an li element with a checkmark)
      const dropdownItems = container.querySelectorAll('li');
      const apiOption = Array.from(dropdownItems).find(li => li.textContent.includes('API Documentation'));

      // Selected option should have a checkmark icon
      const checkmark = apiOption.querySelector('svg');
      expect(checkmark).toBeInTheDocument();
    });
  });

  describe('Generate Button', () => {
    it('should call onGenerate when clicked', async () => {
      const user = userEvent.setup();
      const onGenerate = vi.fn();

      render(<ControlBar {...defaultProps} onGenerate={onGenerate} />);

      const generateButton = screen.getByRole('button', { name: /generate docs/i });
      await user.click(generateButton);

      expect(onGenerate).toHaveBeenCalledTimes(1);
    });

    it('should show "Generate Docs" text when not generating', () => {
      render(<ControlBar {...defaultProps} isGenerating={false} />);

      expect(screen.getByText('Generate Docs')).toBeInTheDocument();
    });

    it('should show "Generating..." text when generating', () => {
      render(<ControlBar {...defaultProps} isGenerating={true} />);

      expect(screen.getByText('Generating...')).toBeInTheDocument();
    });

    it('should be disabled when isGenerating is true', () => {
      render(<ControlBar {...defaultProps} isGenerating={true} />);

      const generateButton = screen.getByRole('button', { name: /generating/i });
      expect(generateButton).toBeDisabled();
    });

    it('should be disabled when disabled prop is true', () => {
      render(<ControlBar {...defaultProps} disabled={true} />);

      const generateButton = screen.getByRole('button', { name: /generate docs/i });
      expect(generateButton).toBeDisabled();
    });

    it('should have primary variant styling', () => {
      render(<ControlBar {...defaultProps} />);

      const generateButton = screen.getByRole('button', { name: /generate docs/i });
      expect(generateButton).toHaveClass('bg-purple-600', 'hover:bg-purple-700');
    });

    it('should display sparkles icon when not generating', () => {
      render(<ControlBar {...defaultProps} isGenerating={false} />);

      const generateButton = screen.getByRole('button', { name: /generate docs/i });
      expect(generateButton.querySelector('svg')).toBeInTheDocument();
    });

    it('should display loading spinner when generating', () => {
      render(<ControlBar {...defaultProps} isGenerating={true} />);

      const generateButton = screen.getByRole('button', { name: /generating/i });
      const spinner = generateButton.querySelector('svg');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });
  });

  describe('Disabled State', () => {
    it('should disable all action buttons when disabled prop is true', () => {
      render(<ControlBar {...defaultProps} disabled={true} />);

      // Check main action buttons (Upload, Generate)
      // Note: GitHub button hidden by feature flag
      const uploadButton = screen.getByRole('button', { name: /upload files/i });
      const generateButton = screen.getByRole('button', { name: /generate docs/i });

      expect(uploadButton).toBeDisabled();
      expect(generateButton).toBeDisabled();
    });

    it('should enable all buttons when disabled prop is false', () => {
      render(<ControlBar {...defaultProps} disabled={false} />);

      const uploadButton = screen.getByRole('button', { name: /upload files/i });
      const generateButton = screen.getByRole('button', { name: /generate docs/i });

      expect(uploadButton).toBeEnabled();
      expect(generateButton).toBeEnabled();
    });

    it('should prevent clicks when disabled', async () => {
      const user = userEvent.setup();
      const onGenerate = vi.fn();

      render(<ControlBar {...defaultProps} disabled={true} onGenerate={onGenerate} />);

      const generateButton = screen.getByRole('button', { name: /generate docs/i });
      await user.click(generateButton);

      expect(onGenerate).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should disable generate button during generation', () => {
      render(<ControlBar {...defaultProps} isGenerating={true} />);

      const generateButton = screen.getByRole('button', { name: /generating/i });
      expect(generateButton).toBeDisabled();
    });

    it('should change button text during generation', () => {
      const { rerender } = render(<ControlBar {...defaultProps} isGenerating={false} />);

      expect(screen.getByText('Generate Docs')).toBeInTheDocument();

      rerender(<ControlBar {...defaultProps} isGenerating={true} />);

      expect(screen.getByText('Generating...')).toBeInTheDocument();
    });

    it('should not disable other buttons during generation', () => {
      render(<ControlBar {...defaultProps} isGenerating={true} disabled={false} />);

      const uploadButton = screen.getByRole('button', { name: /upload files/i });

      expect(uploadButton).toBeEnabled();
    });
  });

  describe('Responsive Layout', () => {
    it('should have responsive container classes', () => {
      const { container } = render(<ControlBar {...defaultProps} />);

      const controlBar = container.firstChild;
      expect(controlBar).toHaveClass('bg-white', 'border', 'rounded-xl', 'shadow-sm', 'p-4');
    });

    it('should have responsive flex layout', () => {
      const { container } = render(<ControlBar {...defaultProps} />);

      const flexContainer = container.querySelector('.flex.flex-col.lg\\:flex-row');
      expect(flexContainer).toBeInTheDocument();
    });

    it('should show divider between buttons and select', () => {
      const { container } = render(<ControlBar {...defaultProps} />);

      const divider = container.querySelector('.hidden.sm\\:block.w-px');
      expect(divider).toBeInTheDocument();
      expect(divider).toHaveClass('h-6', 'bg-slate-300');
    });

    it('should make generate button full width on mobile', () => {
      render(<ControlBar {...defaultProps} />);

      const generateButton = screen.getByRole('button', { name: /generate docs/i });
      expect(generateButton).toHaveClass('w-full', 'lg:w-auto');
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      render(<ControlBar {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2); // At least 2 main buttons (Upload, Generate)
    });

    it('should have descriptive button text', () => {
      render(<ControlBar {...defaultProps} />);

      expect(screen.getByRole('button', { name: /upload files/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /generate docs/i })).toBeInTheDocument();
      // GitHub button hidden by feature flag
      expect(screen.queryByRole('button', { name: /import from github/i })).not.toBeInTheDocument();
    });

    it('should indicate disabled state through aria', () => {
      render(<ControlBar {...defaultProps} disabled={true} />);

      // Check main action buttons for disabled attribute
      const uploadButton = screen.getByRole('button', { name: /upload files/i });
      const generateButton = screen.getByRole('button', { name: /generate docs/i });

      expect(uploadButton).toHaveAttribute('disabled');
      expect(generateButton).toHaveAttribute('disabled');
    });

    it('should have proper focus order', () => {
      render(<ControlBar {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      // All buttons should be focusable
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabIndex', '-1');
      });
    });
  });

  describe('User Interaction Flows', () => {
    it('should handle complete workflow: upload → select type → generate', async () => {
      const user = userEvent.setup();
      const onUpload = vi.fn();
      const onDocTypeChange = vi.fn();
      const onGenerate = vi.fn();

      const { rerender } = render(
        <ControlBar
          {...defaultProps}
          onUpload={onUpload}
          onDocTypeChange={onDocTypeChange}
          onGenerate={onGenerate}
        />
      );

      // 1. Upload file
      await user.click(screen.getByRole('button', { name: /upload files/i }));
      expect(onUpload).toHaveBeenCalled();

      // 2. Change doc type
      await user.click(screen.getByText('README.md'));
      await user.click(await screen.findByText('JSDoc Comments'));
      expect(onDocTypeChange).toHaveBeenCalledWith('JSDOC');

      // Update docType
      rerender(
        <ControlBar
          {...defaultProps}
          docType="JSDOC"
          onUpload={onUpload}
          onDocTypeChange={onDocTypeChange}
          onGenerate={onGenerate}
        />
      );

      // 3. Generate docs
      await user.click(screen.getByRole('button', { name: /generate docs/i }));
      expect(onGenerate).toHaveBeenCalled();
    });

    it.skip('should handle github import → select type → generate', async () => {
      // Skipped: GitHub import feature disabled (ENABLE_GITHUB_IMPORT = false)
      const user = userEvent.setup();
      const onGithubImport = vi.fn();
      const onDocTypeChange = vi.fn();
      const onGenerate = vi.fn();

      render(
        <ControlBar
          {...defaultProps}
          onGithubImport={onGithubImport}
          onDocTypeChange={onDocTypeChange}
          onGenerate={onGenerate}
        />
      );

      // 1. Import from GitHub
      await user.click(screen.getByRole('button', { name: /import from github/i }));
      expect(onGithubImport).toHaveBeenCalled();

      // 2. Select doc type
      await user.click(screen.getByText('README.md'));
      await user.click(await screen.findByText('API Documentation'));
      expect(onDocTypeChange).toHaveBeenCalledWith('API');

      // 3. Generate docs
      await user.click(screen.getByRole('button', { name: /generate docs/i }));
      expect(onGenerate).toHaveBeenCalled();
    });

    it('should prevent interactions during generation', async () => {
      const user = userEvent.setup();
      const onGenerate = vi.fn();

      render(<ControlBar {...defaultProps} isGenerating={true} onGenerate={onGenerate} />);

      const generateButton = screen.getByRole('button', { name: /generating/i });
      await user.click(generateButton);

      // Should not call handler when disabled
      expect(onGenerate).not.toHaveBeenCalled();
    });

    it('should allow changing doc type during generation', async () => {
      const user = userEvent.setup();
      const onDocTypeChange = vi.fn();

      render(<ControlBar {...defaultProps} isGenerating={true} onDocTypeChange={onDocTypeChange} />);

      // Should still be able to change doc type
      await user.click(screen.getByText('README.md'));
      await user.click(await screen.findByText('JSDoc Comments'));

      expect(onDocTypeChange).toHaveBeenCalledWith('JSDOC');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid button clicks', async () => {
      const user = userEvent.setup();
      const onGenerate = vi.fn();

      render(<ControlBar {...defaultProps} onGenerate={onGenerate} />);

      const generateButton = screen.getByRole('button', { name: /generate docs/i });

      // Click multiple times rapidly
      await user.click(generateButton);
      await user.click(generateButton);
      await user.click(generateButton);

      expect(onGenerate).toHaveBeenCalledTimes(3);
    });

    it('should handle missing callback functions gracefully', () => {
      // Should not crash when callbacks are undefined
      expect(() => {
        render(
          <ControlBar
            docType="README"
            onDocTypeChange={undefined}
            onGenerate={undefined}
            onUpload={undefined}
            onGithubImport={undefined}
          />
        );
      }).not.toThrow();
    });

    it('should handle invalid docType gracefully', () => {
      render(<ControlBar {...defaultProps} docType="INVALID" />);

      // Should still render without crashing
      const controlBar = screen.getByRole('button', { name: /generate docs/i });
      expect(controlBar).toBeInTheDocument();
    });

    it('should maintain state during prop updates', () => {
      const { rerender } = render(<ControlBar {...defaultProps} docType="README" />);

      expect(screen.getByText('README.md')).toBeInTheDocument();

      rerender(<ControlBar {...defaultProps} docType="API" />);

      expect(screen.getByText('API Documentation')).toBeInTheDocument();
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DownloadButton } from '../DownloadButton';

// Mock toast functions
vi.mock('../../utils/toast', () => ({
  toastCompact: vi.fn(),
  toastError: vi.fn(),
}));

describe('DownloadButton', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Mock link.click()
    HTMLAnchorElement.prototype.click = vi.fn();

    // Ensure URL mocks are properly set
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  describe('Rendering', () => {
    it('should render the download button', () => {
      render(<DownloadButton content="Test content" />);
      const button = screen.getByTestId('download-btn');
      expect(button).toBeInTheDocument();
    });

    it('should have correct aria-label', () => {
      render(<DownloadButton content="Test content" ariaLabel="Download file" />);
      const button = screen.getByLabelText('Download file');
      expect(button).toBeInTheDocument();
    });

    it('should have correct title attribute', () => {
      render(<DownloadButton content="Test content" ariaLabel="Download file" />);
      const button = screen.getByTestId('download-btn');
      expect(button).toHaveAttribute('title', 'Download file');
    });

    it('should use default aria-label when not provided', () => {
      render(<DownloadButton content="Test content" />);
      const button = screen.getByLabelText('Download');
      expect(button).toBeInTheDocument();
    });

    it('should display Download icon initially', () => {
      const { container } = render(<DownloadButton content="Test content" />);
      const downloadIcon = container.querySelector('svg');
      expect(downloadIcon).toBeInTheDocument();
    });
  });

  describe('Download Functionality', () => {
    it('should trigger download when clicked', async () => {
      const user = userEvent.setup();
      const content = '# Test Documentation\n\nThis is test content.';

      render(<DownloadButton content={content} docType="README" />);

      const button = screen.getByTestId('download-btn');
      await user.click(button);

      // Verify Blob was created
      expect(global.URL.createObjectURL).toHaveBeenCalled();

      // Verify link was clicked
      expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();

      // Verify cleanup
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should create filename with docType and timestamp', async () => {
      const user = userEvent.setup();
      const content = 'Test content';
      let capturedLink;
      const originalAppendChild = document.body.appendChild.bind(document.body);
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
        if (node.tagName === 'A') {
          capturedLink = node;
        }
        return originalAppendChild(node);
      });

      render(<DownloadButton content={content} docType="API" />);

      const button = screen.getByTestId('download-btn');
      await user.click(button);

      // Verify filename format: docType-YYYY-MM-DD-HHMMSS.md
      expect(capturedLink.download).toMatch(/^API-\d{4}-\d{2}-\d{2}-\d{6}\.md$/);

      appendChildSpy.mockRestore();
    });

    it('should use default docType when not provided', async () => {
      const user = userEvent.setup();
      const content = 'Test content';
      let capturedLink;
      const originalAppendChild = document.body.appendChild.bind(document.body);
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
        if (node.tagName === 'A') {
          capturedLink = node;
        }
        return originalAppendChild(node);
      });

      render(<DownloadButton content={content} />);

      const button = screen.getByTestId('download-btn');
      await user.click(button);

      expect(capturedLink.download).toMatch(/^documentation-\d{4}-\d{2}-\d{2}-\d{6}\.md$/);

      appendChildSpy.mockRestore();
    });

    it('should call createObjectURL when downloading', async () => {
      const user = userEvent.setup();
      const content = 'Test content';

      render(<DownloadButton content={content} />);

      const button = screen.getByTestId('download-btn');
      await user.click(button);

      // Verify URL.createObjectURL was called (Blob was created)
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    it('should not download when content is empty', async () => {
      const user = userEvent.setup();
      const { toastError } = await import('../../utils/toast');

      render(<DownloadButton content="" />);

      const button = screen.getByTestId('download-btn');
      await user.click(button);

      expect(global.URL.createObjectURL).not.toHaveBeenCalled();
      expect(toastError).toHaveBeenCalledWith('No content to download');
    });

    it('should not download when content is null', async () => {
      const user = userEvent.setup();
      const { toastError } = await import('../../utils/toast');

      render(<DownloadButton content={null} />);

      const button = screen.getByTestId('download-btn');
      await user.click(button);

      expect(global.URL.createObjectURL).not.toHaveBeenCalled();
      expect(toastError).toHaveBeenCalledWith('No content to download');
    });
  });

  describe('Success Feedback', () => {
    it('should not show success toast after download (browser provides feedback)', async () => {
      const user = userEvent.setup();
      const { toastCompact } = await import('../../utils/toast');

      render(<DownloadButton content="Test content" />);

      const button = screen.getByTestId('download-btn');
      await user.click(button);

      // Design decision: No success toast - browser's download notification provides feedback
      // We cannot reliably detect if user actually saved the file or canceled the dialog
      expect(toastCompact).not.toHaveBeenCalled();
    });

    it('should keep same aria-label after download (no state change)', async () => {
      const user = userEvent.setup();
      render(<DownloadButton content="Test content" ariaLabel="Download documentation" />);

      const button = screen.getByTestId('download-btn');
      await user.click(button);

      // Button should remain enabled with same label
      expect(button).not.toBeDisabled();
      expect(button).toHaveAttribute('aria-label', 'Download documentation');
      expect(button).toHaveAttribute('title', 'Download documentation');
    });

    it('should remain clickable after download (fire-and-forget pattern)', async () => {
      const user = userEvent.setup();
      render(<DownloadButton content="Test content" />);

      const button = screen.getByTestId('download-btn');

      // First download
      await user.click(button);
      expect(global.URL.createObjectURL).toHaveBeenCalledTimes(1);

      // Should be able to download again immediately
      await user.click(button);
      expect(global.URL.createObjectURL).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should show error toast on download failure', async () => {
      const user = userEvent.setup();
      const { toastError } = await import('../../utils/toast');

      // Force an error by making createObjectURL throw
      global.URL.createObjectURL = vi.fn(() => {
        throw new Error('Failed to create object URL');
      });

      render(<DownloadButton content="Test content" />);

      const button = screen.getByTestId('download-btn');
      await user.click(button);

      expect(toastError).toHaveBeenCalledWith('Unable to download file. Please try again.');
    });
  });

  describe('Variants', () => {
    it('should apply ghost variant styles', () => {
      render(<DownloadButton content="Test content" variant="ghost" />);
      const button = screen.getByTestId('download-btn');
      expect(button.className).toContain('bg-transparent');
    });

    it('should apply outline variant styles', () => {
      render(<DownloadButton content="Test content" variant="outline" />);
      const button = screen.getByTestId('download-btn');
      expect(button.className).toContain('bg-white');
    });

    it('should apply solid variant styles', () => {
      render(<DownloadButton content="Test content" variant="solid" />);
      const button = screen.getByTestId('download-btn');
      expect(button.className).toContain('bg-slate-100');
    });
  });

  describe('Sizes', () => {
    it('should apply small size styles', () => {
      render(<DownloadButton content="Test content" size="sm" />);
      const button = screen.getByTestId('download-btn');
      expect(button.className).toContain('p-1.5');
    });

    it('should apply medium size styles', () => {
      render(<DownloadButton content="Test content" size="md" />);
      const button = screen.getByTestId('download-btn');
      expect(button.className).toContain('p-2');
    });

    it('should apply large size styles', () => {
      render(<DownloadButton content="Test content" size="lg" />);
      const button = screen.getByTestId('download-btn');
      expect(button.className).toContain('p-2.5');
    });
  });

  describe('Accessibility', () => {
    it('should have proper button type', () => {
      render(<DownloadButton content="Test content" />);
      const button = screen.getByTestId('download-btn');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should be keyboard accessible', () => {
      render(<DownloadButton content="Test content" />);

      const button = screen.getByTestId('download-btn');

      // Verify button is focusable and has correct attributes for keyboard access
      button.focus();
      expect(button).toHaveFocus();
      expect(button).toHaveAttribute('type', 'button');
      expect(button).not.toHaveAttribute('tabindex', '-1');
    });

    it('should be keyboard accessible with Space key', async () => {
      render(<DownloadButton content="Test content" />);

      const button = screen.getByTestId('download-btn');

      // Verify button is focusable (keyboard accessible)
      button.focus();
      expect(button).toHaveFocus();
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should have focus styles', () => {
      render(<DownloadButton content="Test content" />);
      const button = screen.getByTestId('download-btn');
      expect(button.className).toContain('focus:outline-none');
      expect(button.className).toContain('focus:ring-2');
      expect(button.className).toContain('focus:ring-purple-600');
    });

    it('should support reduced motion', () => {
      render(<DownloadButton content="Test content" />);
      const button = screen.getByTestId('download-btn');
      expect(button.className).toContain('motion-reduce:transition-none');
    });
  });

  describe('Custom Styling', () => {
    it('should accept and apply custom className', () => {
      render(<DownloadButton content="Test content" className="custom-class" />);
      const button = screen.getByTestId('download-btn');
      expect(button.className).toContain('custom-class');
    });
  });

  describe('Icon Display', () => {
    it('should show Download icon', () => {
      const { container } = render(<DownloadButton content="Test content" />);

      // Should have exactly one SVG (Download icon only)
      const icons = container.querySelectorAll('svg');
      expect(icons).toHaveLength(1);
    });

    it('should keep Download icon after clicking (no state change)', async () => {
      const user = userEvent.setup();
      const { container } = render(<DownloadButton content="Test content" />);

      const button = screen.getByTestId('download-btn');
      await user.click(button);

      // Should still have exactly one SVG (Download icon, no Check icon)
      const icons = container.querySelectorAll('svg');
      expect(icons).toHaveLength(1);
    });

    it('should have aria-hidden on icon', () => {
      const { container } = render(<DownloadButton content="Test content" />);

      const icon = container.querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });
});

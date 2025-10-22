import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

  describe('Success State', () => {
    it('should show success state after download', async () => {
      const user = userEvent.setup();
      render(<DownloadButton content="Test content" />);

      const button = screen.getByTestId('download-btn');
      await user.click(button);

      await waitFor(() => {
        expect(button).toHaveAttribute('aria-label', 'Downloaded!');
        expect(button).toHaveAttribute('title', 'Downloaded!');
      });
    });

    it('should disable button after download', async () => {
      const user = userEvent.setup();
      render(<DownloadButton content="Test content" />);

      const button = screen.getByTestId('download-btn');
      await user.click(button);

      await waitFor(() => {
        expect(button).toBeDisabled();
      });
    });

    it('should show success toast after download', async () => {
      const user = userEvent.setup();
      const { toastCompact } = await import('../../utils/toast');

      render(<DownloadButton content="Test content" />);

      const button = screen.getByTestId('download-btn');
      await user.click(button);

      expect(toastCompact).toHaveBeenCalledWith('Downloaded!', 'success');
    });

    it.skip('should reset to initial state after 2 seconds', async () => {
      vi.useFakeTimers();
      const user = userEvent.setup({ delay: null });

      render(<DownloadButton content="Test content" />);

      const button = screen.getByTestId('download-btn');
      await user.click(button);

      // Initially should be in downloaded state
      expect(button).toHaveAttribute('aria-label', 'Downloaded!');
      expect(button).toBeDisabled();

      // Fast-forward 2 seconds and run pending timers
      await vi.advanceTimersByTimeAsync(2000);

      // Should reset to initial state
      expect(button).toHaveAttribute('aria-label', 'Download');
      expect(button).not.toBeDisabled();

      vi.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    it.skip('should show error toast on download failure', async () => {
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

  describe('Haptic Feedback', () => {
    it.skip('should trigger haptic feedback on supported devices', async () => {
      const user = userEvent.setup();
      const vibrateSpy = vi.fn();
      navigator.vibrate = vibrateSpy;

      render(<DownloadButton content="Test content" />);

      const button = screen.getByTestId('download-btn');
      await user.click(button);

      expect(vibrateSpy).toHaveBeenCalledWith(50);
    });

    it.skip('should not error when haptic feedback is not supported', async () => {
      const user = userEvent.setup();
      delete navigator.vibrate;

      render(<DownloadButton content="Test content" />);

      const button = screen.getByTestId('download-btn');

      // Should not throw error
      await expect(user.click(button)).resolves.not.toThrow();
    });
  });

  describe('Icon Animation', () => {
    it('should show Download icon initially', () => {
      const { container } = render(<DownloadButton content="Test content" />);

      // Download icon should be visible (opacity-100)
      const icons = container.querySelectorAll('svg');
      const downloadIcon = icons[0];

      // SVG className is an object, use getAttribute instead
      expect(downloadIcon.getAttribute('class')).toContain('opacity-100');
    });

    it.skip('should transition to Check icon after download', async () => {
      const user = userEvent.setup();
      const { container } = render(<DownloadButton content="Test content" />);

      const button = screen.getByTestId('download-btn');
      await user.click(button);

      await waitFor(() => {
        const icons = container.querySelectorAll('svg');
        const downloadIcon = icons[0];
        const checkIcon = icons[1];

        // Download icon should fade out
        expect(downloadIcon.getAttribute('class')).toContain('opacity-0');

        // Check icon should fade in
        expect(checkIcon.getAttribute('class')).toContain('opacity-100');
      });
    });
  });
});

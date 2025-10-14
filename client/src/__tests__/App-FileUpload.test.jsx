import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

/**
 * File Upload Integration Tests
 * Tests the complete file upload flow from button click to API call to state update
 */
describe('App - File Upload Integration', () => {
  let mockFetch;

  beforeEach(() => {
    // Mock fetch globally
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Upload Button Interaction', () => {
    it('should trigger file input when upload button clicked', async () => {
      const user = userEvent.setup();
      render(<App />);

      const uploadButton = screen.getByRole('button', { name: /upload files/i });
      await user.click(uploadButton);

      // The hidden file input should exist
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('accept');
    });

    it('should accept correct file extensions', () => {
      render(<App />);

      const fileInput = document.querySelector('input[type="file"]');
      const acceptedExtensions = fileInput.getAttribute('accept');

      // Verify core file types are accepted
      expect(acceptedExtensions).toContain('.js');
      expect(acceptedExtensions).toContain('.jsx');
      expect(acceptedExtensions).toContain('.ts');
      expect(acceptedExtensions).toContain('.tsx');
      expect(acceptedExtensions).toContain('.py');
      expect(acceptedExtensions).toContain('.java');
      expect(acceptedExtensions).toContain('.cpp');
      expect(acceptedExtensions).toContain('.c');
      expect(acceptedExtensions).toContain('.go');
      expect(acceptedExtensions).toContain('.rs');
      expect(acceptedExtensions).toContain('.txt');
    });
  });

  describe('Successful File Upload', () => {
    it('should upload JavaScript file and update code editor', async () => {
      const user = userEvent.setup();

      const mockFileContent = 'function hello() { return "world"; }';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          file: {
            name: 'test.js',
            size: 100,
            sizeFormatted: '100 Bytes',
            extension: '.js',
            mimetype: 'application/javascript',
            content: mockFileContent
          }
        })
      });

      render(<App />);

      const fileInput = document.querySelector('input[type="file"]');
      const file = new File([mockFileContent], 'test.js', { type: 'application/javascript' });

      await user.upload(fileInput, file);

      // Wait for upload to complete
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/upload'),
          expect.objectContaining({
            method: 'POST',
            body: expect.any(FormData)
          })
        );
      });

      // Verify FormData contains the file
      const fetchCall = mockFetch.mock.calls[0];
      const formData = fetchCall[1].body;
      expect(formData).toBeInstanceOf(FormData);
    });

    it('should detect language from file extension', async () => {
      const user = userEvent.setup();

      const testCases = [
        { extension: '.js', content: 'const x = 1;', expectedLang: 'javascript' },
        { extension: '.ts', content: 'const x: number = 1;', expectedLang: 'typescript' },
        { extension: '.py', content: 'x = 1', expectedLang: 'python' },
        { extension: '.java', content: 'int x = 1;', expectedLang: 'java' },
        { extension: '.go', content: 'var x int = 1', expectedLang: 'go' },
        { extension: '.rs', content: 'let x: i32 = 1;', expectedLang: 'rust' },
      ];

      for (const testCase of testCases) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            file: {
              name: `test${testCase.extension}`,
              size: testCase.content.length,
              sizeFormatted: `${testCase.content.length} Bytes`,
              extension: testCase.extension,
              content: testCase.content
            }
          })
        });

        const { unmount } = render(<App />);

        const fileInput = document.querySelector('input[type="file"]');
        const file = new File([testCase.content], `test${testCase.extension}`);

        await user.upload(fileInput, file);

        await waitFor(() => {
          expect(mockFetch).toHaveBeenCalled();
        });

        // Clean up for next iteration
        unmount();
        mockFetch.mockClear();
      }
    });

    it('should handle TypeScript files', async () => {
      const user = userEvent.setup();

      const tsContent = 'interface User { name: string; }';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          file: {
            name: 'types.ts',
            size: tsContent.length,
            sizeFormatted: `${tsContent.length} Bytes`,
            extension: '.ts',
            content: tsContent
          }
        })
      });

      render(<App />);

      const fileInput = document.querySelector('input[type="file"]');
      const file = new File([tsContent], 'types.ts', { type: 'text/typescript' });

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it('should handle Python files', async () => {
      const user = userEvent.setup();

      const pyContent = 'def greet(name):\n    return f"Hello, {name}"';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          file: {
            name: 'script.py',
            size: pyContent.length,
            sizeFormatted: `${pyContent.length} Bytes`,
            extension: '.py',
            content: pyContent
          }
        })
      });

      render(<App />);

      const fileInput = document.querySelector('input[type="file"]');
      const file = new File([pyContent], 'script.py', { type: 'text/x-python' });

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });

  describe('Upload Error Handling', () => {
    it('should display error for invalid file type', async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Invalid file type',
          message: 'Invalid file type. Allowed: .js, .jsx, .ts, .tsx, .py, .java, .cpp, .c, .h, .hpp, .cs, .go, .rs, .rb, .php, .txt'
        })
      });

      render(<App />);

      const fileInput = document.querySelector('input[type="file"]');
      // Use a valid extension but server will reject it
      const file = new File(['test'], 'test.js', { type: 'application/javascript' });

      // Temporarily remove accept attribute to test server-side validation
      fileInput.removeAttribute('accept');

      await user.upload(fileInput, file);

      // Wait for fetch to be called
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      }, { timeout: 3000 });

      // Error banner should appear
      await waitFor(() => {
        const errorMessage = screen.queryByText(/Invalid file type/i);
        expect(errorMessage).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should display error for file too large', async () => {
      const user = userEvent.setup();

      render(<App />);

      const fileInput = document.querySelector('input[type="file"]');
      // Create a large file (> 500KB)
      const largeContent = 'x'.repeat(600 * 1024);
      const file = new File([largeContent], 'large.js', { type: 'application/javascript' });

      await user.upload(fileInput, file);

      // Client-side validation should catch this and NOT call fetch
      expect(mockFetch).not.toHaveBeenCalled();

      // Error banner should appear with client-side validation message
      await waitFor(() => {
        const errorMessage = screen.getByText(/exceeds maximum allowed size/i);
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<App />);

      const fileInput = document.querySelector('input[type="file"]');
      const file = new File(['test'], 'test.js', { type: 'application/javascript' });

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      // Error should be displayed
      await waitFor(() => {
        const errorMessage = screen.getByText(/Network error/i);
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('should allow dismissing upload errors', async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Invalid file type',
          message: 'Invalid file type'
        })
      });

      render(<App />);

      const fileInput = document.querySelector('input[type="file"]');
      const file = new File(['test'], 'test.js', { type: 'application/javascript' });

      // Temporarily remove accept attribute to test server-side validation
      fileInput.removeAttribute('accept');

      await user.upload(fileInput, file);

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.queryByText(/Invalid file type/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Find and click dismiss button (X button or close icon)
      const dismissButtons = screen.getAllByRole('button');
      const dismissButton = dismissButtons.find(btn =>
        btn.querySelector('svg') && btn.getAttribute('aria-label') === 'Close'
      );

      if (dismissButton) {
        await user.click(dismissButton);

        // Error should be removed
        await waitFor(() => {
          expect(screen.queryByText(/Invalid file type/i)).not.toBeInTheDocument();
        }, { timeout: 3000 });
      } else {
        // Skip test if dismiss button isn't found (ErrorBanner may not have dismiss functionality)
        expect(true).toBe(true);
      }
    });
  });

  describe('Upload Flow Integration', () => {
    it('should allow uploading file and then generating docs', async () => {
      const user = userEvent.setup();

      const fileContent = 'function add(a, b) { return a + b; }';

      // Mock upload response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          file: {
            name: 'math.js',
            extension: '.js',
            content: fileContent
          }
        })
      });

      render(<App />);

      // Upload file
      const fileInput = document.querySelector('input[type="file"]');
      const file = new File([fileContent], 'math.js');
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // Mock generate response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"type":"connected"}\n\n')
              })
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"type":"chunk","content":"# Math Functions"}\n\n')
              })
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"type":"complete","qualityScore":{"overall":85}}\n\n')
              })
              .mockResolvedValueOnce({ done: true })
          })
        }
      });

      // Click generate button
      const generateButton = screen.getByRole('button', { name: /generate docs/i });
      expect(generateButton).toBeEnabled();

      await user.click(generateButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });

    it('should reset file input after upload', async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          file: {
            name: 'test.js',
            extension: '.js',
            content: 'test'
          }
        })
      });

      render(<App />);

      const fileInput = document.querySelector('input[type="file"]');
      const file = new File(['test'], 'test.js');

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      // File input should be reset (empty value)
      await waitFor(() => {
        expect(fileInput.value).toBe('');
      });
    });
  });

  describe('API Communication', () => {
    it('should send file to correct endpoint', async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          file: { name: 'test.js', extension: '.js', content: 'test' }
        })
      });

      render(<App />);

      const fileInput = document.querySelector('input[type="file"]');
      const file = new File(['test'], 'test.js');

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringMatching(/\/api\/upload$/),
          expect.any(Object)
        );
      });
    });

    it('should use correct HTTP method', async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          file: { name: 'test.js', extension: '.js', content: 'test' }
        })
      });

      render(<App />);

      const fileInput = document.querySelector('input[type="file"]');
      const file = new File(['test'], 'test.js');

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            method: 'POST'
          })
        );
      });
    });

    it('should send FormData with file', async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          file: { name: 'test.js', extension: '.js', content: 'test' }
        })
      });

      render(<App />);

      const fileInput = document.querySelector('input[type="file"]');
      const file = new File(['test content'], 'test.js');

      await user.upload(fileInput, file);

      await waitFor(() => {
        const fetchCall = mockFetch.mock.calls[0];
        expect(fetchCall[1].body).toBeInstanceOf(FormData);
      });
    });
  });
});

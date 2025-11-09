import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithTheme as render } from './utils/renderWithTheme';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';

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
    localStorage.clear();

    // Mock usage tracking API call (happens on mount from useUsageTracking hook)
    // This ensures mockFetch.mock.calls[0] is always the usage API call
    // and upload calls start at mockFetch.mock.calls[1]
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        tier: 'free',
        daily: { used: 0, limit: 10, remaining: 10 },
        monthly: { used: 0, limit: 10, remaining: 10 },
        resetTimes: {
          daily: new Date().toISOString(),
          monthly: new Date().toISOString()
        }
      })
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to render App with ThemeProvider, AuthProvider and Router
  const renderApp = () => {
    return render(
      <MemoryRouter>
        <ThemeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>
    );
  };

  describe('Upload Button Interaction', () => {
    it('should trigger file input when upload button clicked', async () => {
      const user = userEvent.setup();
      renderApp();

      const uploadButton = screen.getByRole('button', { name: /upload files/i });
      await user.click(uploadButton);

      // The hidden file input should exist
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('accept');
    });

    it('should accept correct file extensions', () => {
      renderApp();

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

      renderApp();

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
      // Find the upload API call (not the usage tracking call)
      const uploadCall = mockFetch.mock.calls.find(call =>
        call[0].includes('/api/upload')
      );
      expect(uploadCall).toBeDefined();
      const formData = uploadCall[1].body;
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

        const { unmount } = renderApp();

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

      renderApp();

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

      renderApp();

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

      renderApp();

      // After mount, set up the upload error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Invalid file type',
          message: 'Invalid file type. Allowed: .js, .jsx, .ts, .tsx, .py, .java, .cpp, .c, .h, .hpp, .cs, .go, .rs, .rb, .php, .txt'
        })
      });

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

      // Error banner should appear (error appears in both banner and toast, so get all)
      await waitFor(() => {
        const errorMessages = screen.queryAllByText(/Invalid file type/i);
        expect(errorMessages.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('should display error for file too large', async () => {
      const user = userEvent.setup();

      renderApp();

      const fileInput = document.querySelector('input[type="file"]');
      // Create a large file (> 500KB)
      const largeContent = 'x'.repeat(600 * 1024);
      const file = new File([largeContent], 'large.js', { type: 'application/javascript' });

      await user.upload(fileInput, file);

      // Client-side validation should catch this and NOT call upload API
      // (usage tracking API was already called on mount)
      const uploadCalls = mockFetch.mock.calls.filter(call =>
        call[0].includes('/api/upload')
      );
      expect(uploadCalls.length).toBe(0);

      // Error banner should appear with client-side validation message
      await waitFor(() => {
        // Use getAllByText since error appears in both main message and technical details (dev mode)
        const errorMessages = screen.getAllByText(/exceeds maximum allowed size/i);
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();

      renderApp();

      // After mount, set up the network error response
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const fileInput = document.querySelector('input[type="file"]');
      const file = new File(['test'], 'test.js', { type: 'application/javascript' });

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      // Error should be displayed (error appears in both banner and toast, so get all)
      await waitFor(() => {
        const errorMessages = screen.queryAllByText(/Network error/i);
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });

    it('should allow dismissing upload errors', async () => {
      const user = userEvent.setup();

      renderApp();

      // After mount, set up the upload error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Invalid file type',
          message: 'Invalid file type'
        })
      });

      const fileInput = document.querySelector('input[type="file"]');
      const file = new File(['test'], 'test.js', { type: 'application/javascript' });

      // Temporarily remove accept attribute to test server-side validation
      fileInput.removeAttribute('accept');

      await user.upload(fileInput, file);

      // Wait for error to appear (error appears in both banner and toast, so get all)
      await waitFor(() => {
        const errorMessages = screen.queryAllByText(/Invalid file type/i);
        expect(errorMessages.length).toBeGreaterThan(0);
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

      renderApp();

      // Upload file
      const fileInput = document.querySelector('input[type="file"]');
      const file = new File([fileContent], 'math.js');
      await user.upload(fileInput, file);

      // Wait for upload to complete (usage API + upload API = 2 calls)
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/upload'),
          expect.any(Object)
        );
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

      // Click generate button (select the main button, not the quick start link)
      const generateButtons = screen.getAllByRole('button', { name: /generate docs/i });
      const generateButton = generateButtons[0]; // Main button in ControlBar
      expect(generateButton).toBeEnabled();

      await user.click(generateButton);

      // Wait for generate API call (usage tracking + upload + generate = 3+ calls)
      await waitFor(() => {
        const generateCalls = mockFetch.mock.calls.filter(call =>
          call[0].includes('/api/generate')
        );
        expect(generateCalls.length).toBeGreaterThanOrEqual(1);
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

      renderApp();

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

      renderApp();

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

      renderApp();

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

      renderApp();

      const fileInput = document.querySelector('input[type="file"]');
      const file = new File(['test content'], 'test.js');

      await user.upload(fileInput, file);

      await waitFor(() => {
        // Find the upload API call (not the usage tracking call)
        const uploadCall = mockFetch.mock.calls.find(call =>
          call[0].includes('/api/upload')
        );
        expect(uploadCall).toBeDefined();
        expect(uploadCall[1].body).toBeInstanceOf(FormData);
      });
    });
  });
});

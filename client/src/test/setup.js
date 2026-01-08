import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Mock analytics module - must be before any component imports
vi.mock('../utils/analytics', () => ({
  trackDocGeneration: vi.fn(),
  trackQualityScore: vi.fn(),
  trackCodeInput: vi.fn(),
  trackError: vi.fn(),
  trackGenerationMode: vi.fn(),
  trackInteraction: vi.fn(),
  trackSessionStart: vi.fn(),
  trackLogin: vi.fn(),
  trackSignup: vi.fn(),
  trackOAuth: vi.fn(),
  trackPerformance: vi.fn(),
  trackBatch: vi.fn(),
  trackDocExport: vi.fn(),
  trackUsageAlert: vi.fn(),
  setAnalyticsOptOut: vi.fn(),
  getSessionId: vi.fn(() => 'test-session-id'),
  getSessionStart: vi.fn(() => Date.now()),
  getSessionDuration: vi.fn(() => 0),
}));

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

// Mock IntersectionObserver (used by some components)
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

// Mock ResizeObserver (used by Monaco Editor)
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock Clipboard API (used by CopyButton)
const mockClipboard = {
  writeText: vi.fn(() => Promise.resolve()),
  readText: vi.fn(() => Promise.resolve('')),
};

Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
  writable: true,
  configurable: true,
});

// Mock matchMedia (used by react-hot-toast)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock URL.createObjectURL and URL.revokeObjectURL (used by DownloadButton)
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// Suppress console errors for cleaner test output (optional)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
       args[0].includes('Not implemented: HTMLFormElement.prototype.submit'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

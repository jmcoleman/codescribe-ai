# Toast Notification System - Enterprise Guide

**CodeScribe AI Toast Notification System**
**Version:** 1.0.0
**Last Updated:** October 18, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [When to Use Toasts](#when-to-use-toasts)
3. [Architecture](#architecture)
4. [Getting Started](#getting-started)
5. [Basic Usage](#basic-usage)
6. [Advanced Features](#advanced-features)
7. [Custom Toast Components](#custom-toast-components)
8. [Best Practices](#best-practices)
9. [Accessibility](#accessibility)
10. [Testing](#testing)
11. [API Reference](#api-reference)

---

## Overview

CodeScribe AI implements an enterprise-grade toast notification system built on `react-hot-toast` with extensive customizations for:

- **Professional UX**: Smooth animations, hover effects, and micro-interactions
- **Accessibility**: Full ARIA support, keyboard navigation, screen reader friendly
- **Flexibility**: 20+ toast variants for every use case
- **Performance**: Optimized rendering, queue management, and grouping
- **Developer Experience**: TypeScript-ready, JSDoc comments, comprehensive examples

### Key Features

✅ **Success-Focused**: Toasts are used for positive feedback only (errors use ErrorBanner)
✅ **Rich Content**: Actions, progress bars, avatars, expandable content
✅ **Smart Management**: Queuing, grouping, rate limiting
✅ **Accessibility**: WCAG 2.1 AA compliant
✅ **Animations**: Smooth enter/exit transitions with bounce effects
✅ **Customization**: Fully themeable with Tailwind CSS

---

## When to Use Toasts

**⚠️ IMPORTANT DESIGN DECISION (October 18, 2025):**

CodeScribe AI uses a **clear separation** between error and success notifications:

### ✅ Use Toasts For:

**Success notifications only** - Quick, celebratory feedback:
- ✅ Documentation generated successfully (`toastDocGenerated`)
- ✅ Example loaded (`toastCompact`)
- ✅ File uploaded successfully (`toastCompact`)
- ✅ Any positive action completion

**Why toasts for success:**
- Celebratory and positive reinforcement
- Auto-dismiss (don't clutter the UI)
- Non-blocking and unobtrusive
- Don't require user action

### ❌ DO NOT Use Toasts For:

**Error notifications** - Use ErrorBanner component instead:
- ❌ ~~Documentation generation errors~~ → Use ErrorBanner
- ❌ ~~File upload errors~~ → Use ErrorBanner
- ❌ ~~Network errors~~ → Use ErrorBanner
- ❌ ~~Rate limit errors~~ → Use ErrorBanner
- ❌ ~~Any error state~~ → Use ErrorBanner

**Why banners for errors:**
- Persistent (don't auto-dismiss and get missed)
- More prominent for critical information
- Include technical details in dev mode
- Allow user to see context while fixing issue

### Decision Rationale

**Problem:** Error toasts + error banners = duplicate notifications and UX clutter

**Solution:** Errors use persistent banners only, success uses auto-dismissing toasts

**Benefits:**
1. **No notification spam** - Each error shown once
2. **Clear mental model** - Red banner = error, green toast = success
3. **Better error visibility** - Errors persist until dismissed
4. **Technical debugging** - Dev mode shows full error details in banner

**See Also:** [ERROR-HANDLING-UX.md](./ERROR-HANDLING-UX.md#error-notification-strategy) for complete error handling guidelines

---

## Architecture

### File Structure

```
client/src/
├── utils/
│   └── toast.js                    # Toast utility functions (20+ helpers)
├── components/
│   └── toast/
│       └── CustomToast.jsx         # Custom toast components
└── App.jsx                         # Toast container setup
```

### Component Hierarchy

```
<Toaster>                           # react-hot-toast container
  └── Toast Instance
      ├── CustomToast               # Rich toast with actions
      ├── ProgressToast             # Progress bar toast
      ├── UndoToast                 # Undo action toast
      ├── CompactToast              # Minimal toast
      ├── AvatarToast               # Toast with image
      └── ExpandableToast           # Show more/less toast
```

---

## Getting Started

### Installation

The toast system is already installed in CodeScribe AI. If setting up in a new project:

```bash
npm install react-hot-toast lucide-react
```

### Setup

1. **Add Toaster to your app** (already done in `App.jsx:187-230`):

```jsx
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <div>
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '8px',
            background: '#1E293B',
            color: '#F8FAFC',
            fontSize: '14px',
            fontFamily: 'Inter, system-ui, sans-serif',
            padding: '12px 16px',
            maxWidth: '420px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
          },
        }}
      />
      {/* Your app content */}
    </div>
  );
}
```

2. **Import toast utilities**:

```javascript
import {
  toastSuccess,
  toastError,
  toastWarning,
  toastInfo,
  toastLoading,
  // ... and more
} from './utils/toast';
```

---

## Basic Usage

### Simple Notifications

```javascript
// Success notification
toastSuccess('Documentation generated successfully!');

// Error notification
toastError('Failed to upload file');

// Warning notification
toastWarning('Connection Lost', 'Your work is saved locally');

// Info notification
toastInfo('Processing your request...');
```

### Loading States

```javascript
// Show loading toast
const loadingId = toastLoading('Generating documentation...');

// Later, dismiss it
toast.dismiss(loadingId);

// Or update it
toastSuccess('Done!');
```

### Promise-Based Toasts

Perfect for async operations:

```javascript
import { toastPromise } from './utils/toast';

const generateDocs = async (code) => {
  return await toastPromise(
    apiClient.generateDocumentation(code),
    {
      loading: 'Analyzing code...',
      success: 'Documentation generated!',
      error: 'Generation failed. Please try again.',
    }
  );
};
```

---

## Advanced Features

### 1. Toasts with Actions

```javascript
import { toastWithActions } from './utils/toast';
import { Download, Copy } from 'lucide-react';

toastWithActions(
  'Documentation Ready',
  'Your documentation has been generated.',
  [
    {
      label: 'Download',
      onClick: () => downloadFile(),
      variant: 'primary',
      icon: Download,
    },
    {
      label: 'Copy',
      onClick: () => copyToClipboard(),
      variant: 'secondary',
      icon: Copy,
    },
  ],
  'success'
);
```

### 2. Progress Toasts

For long-running operations:

```javascript
import { toastProgress } from './utils/toast';

const progressToast = toastProgress(
  'Uploading files',
  'Starting upload...',
  0
);

// Update progress
progressToast.update(25, 'Uploading file 1/4...');
progressToast.update(50, 'Uploading file 2/4...');
progressToast.update(75, 'Uploading file 3/4...');
progressToast.update(100, 'Upload complete!');

// Dismiss when done
setTimeout(() => progressToast.dismiss(), 2000);
```

### 3. Undo Toasts

For reversible actions:

```javascript
import { toastUndo } from './utils/toast';

const handleClearCode = () => {
  const previousCode = code;
  setCode('');

  toastUndo(
    'Code cleared',
    () => {
      setCode(previousCode);
      toastSuccess('Code restored');
    },
    5000
  );
};
```

### 4. Confirmation Toasts

Replace traditional confirm dialogs:

```javascript
import { toastConfirm } from './utils/toast';

toastConfirm(
  'Delete File?',
  'This action cannot be undone. Are you sure?',
  () => {
    deleteFile();
    toastSuccess('File deleted');
  },
  () => {
    console.log('Deletion cancelled');
  }
);
```

### 5. Grouped Toasts

Prevent duplicate notifications:

```javascript
import { toastGrouped, toastError } from './utils/toast';

// Only the latest error in this group will be shown
toastGrouped('api-error', toastError, 'Connection failed');
toastGrouped('api-error', toastError, 'Timeout occurred'); // Replaces previous
```

### 6. Expandable Toasts

For notifications with long content:

```javascript
import { toastExpandable } from './utils/toast';

toastExpandable(
  'Error Details',
  'Failed to generate documentation.',
  `Detailed error trace:

  Error: API rate limit exceeded
  at generateDocumentation (line 45)
  at handleGenerate (line 123)

  The Claude API returned a 429 status code indicating too many requests.
  Please wait 60 seconds before trying again.`,
  'error'
);
```

### 7. Compact Toasts

For minimal, non-intrusive feedback:

```javascript
import { toastCompact } from './utils/toast';

// Perfect for quick actions like copy, save, etc.
toastCompact('Saved!', 'success');
toastCompact('Copied', 'success');
```

### 8. Avatar Toasts

For branded or user-specific notifications:

```javascript
import { toastAvatar } from './utils/toast';

toastAvatar(
  'CodeScribe AI',
  'Your documentation is ready to download!',
  '/logo.png',
  'success',
  [
    {
      label: 'View',
      onClick: () => navigate('/docs'),
      variant: 'primary',
    },
  ]
);
```

---

## Custom Toast Components

All custom toast components are in [CustomToast.jsx](../../client/src/components/toast/CustomToast.jsx).

### CustomToast (Base)

The foundation for all rich toasts:

```jsx
import { CustomToast } from '../components/toast/CustomToast';
import { Download } from 'lucide-react';

toast.custom((t) => (
  <CustomToast
    t={t}
    type="success"
    title="Export Complete"
    message="Your documentation has been exported."
    actions={[
      {
        label: 'Download',
        onClick: handleDownload,
        variant: 'primary',
        icon: Download,
      },
    ]}
  />
));
```

### ProgressToast

Shows real-time progress:

```jsx
import { ProgressToast } from '../components/toast/CustomToast';

toast.custom((t) => (
  <ProgressToast
    t={t}
    title="Processing Files"
    message="Processing file 3 of 10..."
    progress={30}
    showPercentage={true}
  />
));
```

### UndoToast

Reversible actions:

```jsx
import { UndoToast } from '../components/toast/CustomToast';

toast.custom((t) => (
  <UndoToast
    t={t}
    message="3 items deleted"
    onUndo={() => {
      restoreItems();
      toast.success('Items restored');
    }}
  />
));
```

---

## Best Practices

### 1. Use Appropriate Toast Types

```javascript
// ✅ Good: Specific toast types
toastSuccess('File uploaded successfully');
toastError('Upload failed: File too large');
toastWarning('Connection unstable', 'Your work is saved locally');

// ❌ Bad: Generic toasts for everything
toast('Something happened');
```

### 2. Provide Actionable Information

```javascript
// ✅ Good: Tells user what happened and what to do
toastError(
  'Upload failed: File exceeds 10MB limit',
  { duration: 6000 }
);

// ❌ Bad: Vague error
toastError('Upload failed');
```

### 3. Use Grouped Toasts for Repeated Events

```javascript
// ✅ Good: Only show latest validation error
toastGrouped('validation', toastError, validationMessage);

// ❌ Bad: Spam user with toasts on every keystroke
onInputChange(() => {
  if (invalid) toastError('Invalid input'); // Don't do this
});
```

### 4. Match Duration to Importance

```javascript
// Quick feedback (2s)
toastCompact('Copied!', 'success'); // duration: 2000

// Standard notification (3-4s)
toastSuccess('Documentation generated'); // duration: 3000

// Important warnings (5-6s)
toastError('Failed to save. Please try again'); // duration: 5000

// Critical info requiring action (persistent)
toastPersistent('API Key Missing', 'Configure your API key to continue', 'error');
```

### 5. Don't Overwhelm Users

```javascript
// ✅ Good: Use toast queue
import { toastQueue } from './utils/toast';

files.forEach(file => {
  toastQueue.add(toastSuccess, `Uploaded ${file.name}`);
});

// ❌ Bad: Show 50 toasts at once
files.forEach(file => {
  toastSuccess(`Uploaded ${file.name}`); // Don't do this
});
```

### 6. Provide Escape Hatches

```javascript
// ✅ Good: Dismissible with clear close button
toastError('Something went wrong', { dismissible: true });

// ✅ Better: Provide recovery action
toastWithActions(
  'Connection Lost',
  'Failed to connect to server',
  [
    {
      label: 'Retry',
      onClick: retryConnection,
      variant: 'primary',
    },
  ],
  'error'
);
```

---

## Accessibility

### ARIA Support

All toasts include proper ARIA attributes:

```jsx
<div
  role="alert"           // For errors, warnings
  role="status"          // For success, info, loading
  aria-live="assertive"  // For errors (interrupt screen reader)
  aria-live="polite"     // For info (wait for pause)
  aria-atomic="true"     // Read entire message
>
  {/* Toast content */}
</div>
```

### Keyboard Navigation

- **Escape**: Dismiss focused toast
- **Tab**: Navigate between action buttons
- **Enter/Space**: Activate focused button

### Screen Reader Announcements

```javascript
// Assertive (interrupts): Errors, critical warnings
toastError('Upload failed'); // role="alert", aria-live="assertive"

// Polite (waits for pause): Success, info
toastSuccess('Saved'); // role="status", aria-live="polite"
```

### Focus Management

Toasts with actions automatically manage focus:

```javascript
toastConfirm(
  'Delete File?',
  'Are you sure?',
  onConfirm,
  onCancel
);
// Focus automatically moves to "Confirm" button (danger action)
```

### Color Contrast

All toast colors meet WCAG 2.1 AA standards:

- Success: Green 600 (#16A34A) on white - 4.5:1 contrast ratio
- Error: Red 600 (#DC2626) on white - 4.5:1 contrast ratio
- Warning: Yellow 600 (#CA8A04) on white - 4.5:1 contrast ratio
- Info: Indigo 600 (#4F46E5) on white - 4.5:1 contrast ratio

---

## Testing

### Unit Testing Toasts

```javascript
import { render, screen } from '@testing-library/react';
import { toastSuccess } from '../utils/toast';
import { Toaster } from 'react-hot-toast';

describe('Toast Notifications', () => {
  it('should show success toast', async () => {
    render(<Toaster />);

    toastSuccess('Operation successful');

    expect(await screen.findByText('Operation successful')).toBeInTheDocument();
  });

  it('should dismiss toast after duration', async () => {
    render(<Toaster />);

    toastSuccess('Quick message', { duration: 1000 });

    const toast = await screen.findByText('Quick message');
    expect(toast).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Quick message')).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
```

### Integration Testing

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

describe('File Upload Toast', () => {
  it('should show success toast after file upload', async () => {
    render(<App />);

    const file = new File(['console.log("test")'], 'test.js', {
      type: 'text/javascript',
    });

    const input = screen.getByLabelText('Upload code file');
    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByText(/test.js uploaded/i)).toBeInTheDocument();
  });
});
```

---

## API Reference

### Basic Toast Functions

#### `toastSuccess(message, options)`

Shows a success toast with a checkmark icon.

**Parameters:**
- `message` (string): The success message
- `options` (object, optional): Additional toast options

**Returns:** Toast ID (string)

**Example:**
```javascript
toastSuccess('Documentation generated successfully!');
toastSuccess('File uploaded', { duration: 2000 });
```

---

#### `toastError(message, options)`

Shows an error toast with an alert icon.

**Parameters:**
- `message` (string): The error message
- `options` (object, optional): Additional toast options

**Returns:** Toast ID (string)

**Example:**
```javascript
toastError('Failed to generate documentation');
toastError('Network error', { duration: 6000 });
```

---

#### `toastWarning(title, message, action, options)`

Shows a warning toast with optional action button.

**Parameters:**
- `title` (string): Warning title
- `message` (string): Warning message
- `action` (object, optional): Action button `{ label, onClick, icon }`
- `options` (object, optional): Additional toast options

**Returns:** Toast ID (string)

**Example:**
```javascript
import { RefreshCw } from 'lucide-react';

toastWarning(
  'Connection Lost',
  'The connection to the server was lost.',
  { label: 'Retry', onClick: handleRetry, icon: RefreshCw }
);
```

---

## Common Use Cases in CodeScribe AI

### File Upload Flow

```javascript
const handleFileChange = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const validation = validateFile(file);

    if (!validation.valid) {
      const errorMessage = getValidationErrorMessage(validation);
      toastGrouped('upload-error', toastError, `Upload failed: ${errorMessage}`);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${apiUrl}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      toastCompact(`${data.file.name} uploaded`, 'success');
    }
  } catch (error) {
    toastGrouped('upload-error', toastError, `Upload failed: ${error.message}`);
  }
};
```

### Documentation Generation

```javascript
useEffect(() => {
  if (documentation && qualityScore && !isGenerating) {
    // Show success with quality score
    toastDocGenerated(qualityScore.grade, qualityScore.score);
  }
}, [documentation, qualityScore, isGenerating]);

useEffect(() => {
  if (error && error.includes('rate limit')) {
    if (retryAfter) {
      toastGrouped('rate-limit', toastRateLimited, retryAfter);
    }
  } else if (error && error.includes('network')) {
    toastGrouped('network-error', toastError, error);
  }
}, [error, retryAfter]);
```

### Example Loading

```javascript
const handleLoadExample = (example) => {
  setCode(example.code);
  setDocType(example.docType);
  setLanguage(example.language);
  reset();

  toastCompact('Example loaded', 'success');
};
```

---

## Resources

- **react-hot-toast Documentation**: https://react-hot-toast.com/
- **Lucide Icons**: https://lucide.dev/
- **WCAG 2.1 Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **CodeScribe Toast Utils**: [/client/src/utils/toast.js](../../client/src/utils/toast.js)
- **Custom Components**: [/client/src/components/toast/CustomToast.jsx](../../client/src/components/toast/CustomToast.jsx)

---

## Optional Enhancements (Future Phase)

The following enhancements are **not currently planned for implementation** but may be evaluated and prioritized in a future phase (Phase 4) after MVP, CLI, and VS Code Extension completion:

### Toast Positioning & Layout
- **Custom Position Per Toast**: Allow individual toasts to override global position
- **Multi-Column Layout**: Display toasts in multiple columns for high-volume scenarios
- **Smart Positioning**: Automatically reposition toasts to avoid obscuring important UI elements
- **Floating Action Button Integration**: Anchor toasts to FABs or specific UI elements

### Advanced Interactions
- **Swipe to Dismiss**: Mobile gesture support for dismissing toasts
- **Drag to Reorder**: Allow users to manually reorder toast stack
- **Pin/Unpin Toasts**: Let users pin important toasts to prevent auto-dismissal
- **Toast History Panel**: Sidebar showing all dismissed toasts for the session
- **Toast Search**: Search through toast history by content or type

### Rich Content & Customization
- **Toast Templates**: Pre-built templates for common scenarios (upload, download, sync, etc.)
- **Custom Animations**: User-selectable animation styles (slide, fade, bounce, scale)
- **Sound Effects**: Optional audio notifications for important toasts
- **Vibration API**: Haptic feedback on mobile devices
- **Emoji Reactions**: Allow users to react to toasts with emojis
- **Dark Mode Theming**: Automatic theme switching based on system preferences

### Persistence & State Management
- **Local Storage Persistence**: Save toast history across sessions
- **Toast Preferences**: Remember user preferences for duration, position, sound
- **Do Not Disturb Mode**: Temporarily suppress all non-critical toasts
- **Smart Rate Limiting**: Automatically group similar toasts to prevent spam
- **Toast Analytics**: Track which toasts are most frequently dismissed vs. acted upon

### Integration & Advanced Features
- **Keyboard Shortcuts**: Global shortcuts to navigate toast queue (Ctrl+Shift+T)
- **Voice Announcements**: Optional audio reading of toast content
- **Multi-Language Support**: i18n for toast messages and actions
- **Toast Export**: Export toast history as JSON, CSV, or text
- **Webhook Integration**: Send toast events to external services for monitoring

### Developer Experience
- **Toast Playground**: Interactive component for testing toast configurations
- **Toast DevTools**: Browser extension for debugging toast behavior
- **Performance Monitoring**: Built-in metrics for toast render performance
- **A/B Testing Framework**: Compare different toast designs and messaging
- **TypeScript Definitions**: Full TypeScript support with strict typing

### Accessibility Enhancements
- **Customizable Announcement Timing**: Fine-tune screen reader announcement delays
- **High Contrast Mode**: Enhanced visibility for users with visual impairments
- **Reduced Motion Support**: Respect `prefers-reduced-motion` for all animations
- **Focus Trap for Critical Toasts**: Prevent keyboard navigation outside of important toasts
- **Braille Display Optimization**: Ensure compatibility with braille readers

---

## Changelog

### v1.0.0 (October 14, 2025)
- Initial enterprise toast system
- 20+ toast utility functions
- 6 custom toast components
- Full accessibility support
- Comprehensive documentation
- Added optional enhancements section for future Phase 4 evaluation

---

**Questions or Issues?**
Open an issue on GitHub or contact the development team.

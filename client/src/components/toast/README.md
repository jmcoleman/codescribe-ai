# Enterprise Toast Notification System

> **Professional, accessible, and feature-rich toast notifications for CodeScribe AI**

[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![react-hot-toast](https://img.shields.io/badge/react--hot--toast-2.6.0-orange.svg)](https://react-hot-toast.com/)
[![WCAG 2.1 AA](https://img.shields.io/badge/WCAG-2.1%20AA-green.svg)](https://www.w3.org/WAI/WCAG21/quickref/)

---

## Quick Start

### Basic Usage

```javascript
import { toastSuccess, toastError } from '../../utils/toast';

// Simple notifications
toastSuccess('Documentation generated successfully!');
toastError('Failed to upload file');
toastWarning('Connection Lost', 'Your work is saved locally');
toastInfo('Processing your request...');
```

### Advanced Usage

```javascript
import { toastWithActions, toastProgress } from '../../utils/toast';
import { Download, Copy } from 'lucide-react';

// Toast with action buttons
toastWithActions(
  'Documentation Ready',
  'Your documentation has been generated.',
  [
    { label: 'Download', onClick: downloadFile, variant: 'primary', icon: Download },
    { label: 'Copy', onClick: copyToClipboard, variant: 'secondary', icon: Copy },
  ],
  'success'
);

// Progress toast
const progressToast = toastProgress('Uploading files', 'Starting...', 0);
progressToast.update(50, 'Halfway there...');
progressToast.update(100, 'Complete!');
progressToast.dismiss();
```

---

## Key Features

✨ **20+ Pre-built Toast Variants** - Success, error, warning, info, loading, progress, undo, and more

🎨 **Custom Rich Components** - Actions, avatars, progress bars, expandable content

♿ **Full Accessibility** - WCAG 2.1 AA compliant with keyboard shortcuts and screen reader support

📊 **Notification Center** - Built-in history tracking and management

🧪 **Comprehensive Test Suite** - Fully tested with Vitest

📚 **Extensive Documentation** - JSDoc comments, examples, and best practices

⌨️ **Keyboard Shortcuts** - Power-user productivity features

---

## File Structure

```
client/src/
├── components/toast/
│   ├── README.md              # This file
│   ├── CustomToast.jsx        # Rich toast components
│   └── ToastHistory.jsx       # Notification center
├── utils/
│   ├── toast.js               # Core utilities (20+ functions)
│   ├── toastWithHistory.js    # Auto-tracking wrapper
│   └── __tests__/
│       └── toast.test.jsx     # Test suite
└── hooks/
    └── useToastKeyboardShortcuts.js  # Accessibility
```

---

## Available Toast Functions

### Basic Toasts
- `toastSuccess(message)` - Green checkmark toast
- `toastError(message)` - Red alert toast
- `toastWarning(title, message)` - Yellow warning toast
- `toastInfo(message)` - Blue info toast
- `toastLoading(message)` - Loading spinner toast

### Specialized Toasts
- `toastCopied()` - Quick "Copied!" notification
- `toastFileUploaded(name, size)` - File upload success
- `toastDocGenerated(grade, score)` - Documentation complete
- `toastRateLimited(retryAfter)` - Rate limit warning
- `toastNetworkError()` - Network error notification
- `toastCompact(message, type)` - Minimal toast

### Advanced Toasts
- `toastWithActions()` - Toast with custom action buttons
- `toastProgress()` - Progress bar toast with updates
- `toastUndo()` - Reversible action toast
- `toastConfirm()` - Confirmation dialog toast
- `toastExpandable()` - Show more/less toast
- `toastAvatar()` - Toast with image/avatar
- `toastPromise()` - Promise-based (auto loading/success/error)

---

## Components

### CustomToast

Base component for rich toast notifications.

```jsx
import { CustomToast } from './components/toast/CustomToast';

toast.custom((t) => (
  <CustomToast
    t={t}
    type="success"
    title="Export Complete"
    message="Your file is ready"
    actions={[{ label: 'Download', onClick: download, variant: 'primary' }]}
  />
));
```

### ToastHistory

Notification center with persistent history.

```jsx
import { ToastHistory, useToastHistory } from './components/toast/ToastHistory';

function App() {
  return (
    <>
      <ToastHistory />
      {/* Your app */}
    </>
  );
}
```

**Features:**
- Persistent notification history (localStorage)
- Filter by type (success, error, warning, info)
- Mark as read/unread
- Archive notifications
- Clear individual or all notifications
- Unread badge counter

---

## Keyboard Shortcuts

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Esc` | Dismiss all | Close all active toasts |
| `Ctrl/Cmd+Shift+K` | Clear all | Clear all toasts immediately |
| `Ctrl/Cmd+Shift+N` | Notification center | Open toast history panel |
| `Tab` | Navigate | Move between action buttons |
| `Enter/Space` | Activate | Click focused button |
| `Alt+T` | Help | Show keyboard shortcuts |

**Enable in your app:**
```javascript
import { useToastKeyboardShortcuts } from '../hooks/useToastKeyboardShortcuts';

function App() {
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);

  useToastKeyboardShortcuts({
    onOpenNotificationCenter: () => setNotificationCenterOpen(true),
  });

  return <div>...</div>;
}
```

---

## Accessibility

✅ **WCAG 2.1 AA Compliant**
- Color contrast meets 4.5:1 minimum ratio
- Full keyboard navigation support
- Proper ARIA attributes and live regions
- Screen reader friendly announcements
- Multiple dismiss options

```jsx
// Success/Info (polite)
<div role="status" aria-live="polite" aria-atomic="true">
  Success message
</div>

// Error/Warning (assertive)
<div role="alert" aria-live="assertive" aria-atomic="true">
  Error message
</div>
```

---

## Best Practices

### ✅ Do's

```javascript
// ✅ Use specific toast types
toastSuccess('File uploaded successfully');
toastError('Upload failed: File too large');

// ✅ Provide actionable information
toastError('Upload failed: File exceeds 10MB limit', { duration: 6000 });

// ✅ Use grouped toasts for repeated events
toastGrouped('validation', toastError, validationMessage);

// ✅ Match duration to importance
toastCompact('Copied!', 'success'); // 2s
toastError('Failed to save'); // 5s

// ✅ Provide recovery actions
toastWithActions('Connection Lost', 'Failed to connect', [
  { label: 'Retry', onClick: retry, variant: 'primary' }
], 'error');
```

### ❌ Don'ts

```javascript
// ❌ Don't use generic messages
toast('Something happened');

// ❌ Don't spam users
files.forEach(file => {
  toastSuccess(`Uploaded ${file.name}`); // Use toastQueue
});

// ❌ Don't show vague errors
toastError('Error'); // Be specific!
```

---

## Testing

```javascript
import { render, screen } from '@testing-library/react';
import { toastSuccess } from '../utils/toast';
import { Toaster } from 'react-hot-toast';

test('should show success toast', async () => {
  render(<Toaster />);
  toastSuccess('Operation successful');
  expect(await screen.findByText('Operation successful')).toBeInTheDocument();
});
```

**Run tests:**
```bash
npm test                    # Run all tests
npm test toast             # Run toast tests only
npm test -- --coverage     # Run with coverage
```

---

## Examples

### File Upload Flow

```javascript
const handleFileUpload = async (file) => {
  const loadingId = toastLoading('Uploading file...');

  try {
    const result = await uploadFile(file);
    toast.dismiss(loadingId);
    toastFileUploaded(file.name, formatFileSize(file.size));
  } catch (error) {
    toast.dismiss(loadingId);
    toastError(`Upload failed: ${error.message}`);
  }
};
```

### Documentation Generation

```javascript
useEffect(() => {
  if (documentation && qualityScore && !isGenerating) {
    toastDocGenerated(qualityScore.grade, qualityScore.score);
  }
}, [documentation, qualityScore, isGenerating]);
```

### Batch Operations

```javascript
const deleteMultipleFiles = async (files) => {
  const progressToast = toastProgress('Deleting files', '0 deleted', 0);

  for (let i = 0; i < files.length; i++) {
    await deleteFile(files[i]);
    const progress = ((i + 1) / files.length) * 100;
    progressToast.update(progress, `${i + 1}/${files.length} deleted`);
  }

  progressToast.dismiss();
  toastSuccess(`Deleted ${files.length} files`);
};
```

---

## Documentation

📖 **Complete Guide:** [TOAST-SYSTEM.md](../../../docs/components/TOAST-SYSTEM.md)

Comprehensive documentation including:
- Detailed API reference
- Architecture overview
- Advanced patterns
- Migration guide
- Troubleshooting

---

## Performance

### Optimization Techniques

1. **Toast Queue** - Limit visible toasts
   ```javascript
   import { toastQueue } from './utils/toast';
   toastQueue.add(toastSuccess, 'Message'); // Max 3 visible
   ```

2. **Grouped Toasts** - Prevent duplicates
   ```javascript
   toastGrouped('api-error', toastError, 'Connection failed');
   ```

3. **Lazy Loading** - Components loaded on demand
   ```javascript
   const { CustomToast } = require('./components/toast/CustomToast');
   ```

---

## Customization

### Custom Styling

```javascript
toastSuccess('Custom styled', {
  style: {
    background: '#000',
    color: '#fff',
    borderRadius: '16px',
  },
});
```

### Custom Duration

```javascript
toastSuccess('Quick message', { duration: 2000 }); // 2s
toastError('Important error', { duration: 10000 }); // 10s
```

### Custom Position

```javascript
toastSuccess('Top center', { position: 'top-center' });
toastSuccess('Bottom right', { position: 'bottom-right' });
```

---

## Troubleshooting

### Toast Not Showing

**Solution:** Ensure `<Toaster />` is rendered in App.jsx

```jsx
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <Toaster /> {/* Required! */}
      {/* Your app */}
    </>
  );
}
```

### Too Many Toasts

**Solution:** Use `toastQueue`

```javascript
import { toastQueue } from './utils/toast';

files.forEach(file => {
  toastQueue.add(toastSuccess, `Processed ${file.name}`);
});
```

### Duplicate Toasts

**Solution:** Use `toastGrouped`

```javascript
toastGrouped('validation', toastError, errorMessage);
```

---

## Resources

- **react-hot-toast**: https://react-hot-toast.com/
- **Lucide Icons**: https://lucide.dev/
- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/
- **Full Documentation**: [TOAST-SYSTEM.md](../../../docs/components/TOAST-SYSTEM.md)
- **Test Suite**: [toast.test.jsx](../../utils/__tests__/toast.test.jsx)
- **Keyboard Shortcuts**: [useToastKeyboardShortcuts.js](../../hooks/useToastKeyboardShortcuts.js)

---

## License

MIT © CodeScribe AI

---

**Questions?** Open an issue or contact the development team.

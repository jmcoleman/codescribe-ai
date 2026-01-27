# Error Handling UX Design Guide

**Project:** CodeScribe AI
**Last Updated:** January 26, 2026
**Status:** Active Design Guidelines

---

## Table of Contents

1. [Overview](#overview)
2. [Error Display Methods](#error-display-methods)
3. [Decision Framework](#decision-framework)
4. [Field Validation Patterns](#field-validation-patterns)
5. [Banner Usage](#banner-usage)
6. [Modal Usage](#modal-usage)
7. [Toast Usage](#toast-usage)
8. [CodeScribe AI Error Patterns](#codescribe-ai-error-patterns)
9. [Implementation Guidelines](#implementation-guidelines)

---

## Overview

This guide provides a decision framework for choosing the appropriate error display method in CodeScribe AI. The goal is to provide clear, actionable error feedback while maintaining a professional user experience.

### Key Principles

1. **Match error scope to display method**
   - Field-level errors → Inline validation
   - Page-level errors → Banners
   - Critical/blocking errors → Modals (rare)

2. **Validate at the right time**
   - Most fields: On submit
   - Real-time exceptions: Passwords, duplicate checks

3. **Clear errors when user takes action**
   - Errors disappear when user starts typing/selecting
   - Encourages immediate correction

4. **Separate errors from success**
   - Errors use banners (persistent)
   - Success uses toasts (transient)

5. **No duplicate notifications**
   - Each error shown once in the appropriate location
   - No banner + toast for the same error

---

## Error Display Methods

### Summary Table

| Method | Scope | Blocking? | Persistent? | Use Case |
|--------|-------|-----------|-------------|----------|
| **Inline Field Validation** | Single field | No | Until cleared | Form validation errors |
| **Banner** | Page/section | Partially | Yes | API errors, network issues, upload failures |
| **Modal** | Application | Completely | Yes | Critical errors, data loss prevention |
| **Toast** | N/A | No | No | ❌ NOT for errors (success only) |

---

## Decision Framework

### Step 1: Identify Error Scope

```
Is this error related to a specific form field?
├─ YES → Use inline field validation
└─ NO → Continue to Step 2

Does this error affect the entire page/workflow?
├─ YES → Continue to Step 3
└─ NO → Continue to Step 3

Does this error block ALL application functionality?
├─ YES → Use modal (rare - only for critical errors)
└─ NO → Use banner
```

### Step 2: Choose Between Banner and Modal

**Use Banner When:**
- Error is recoverable
- User can continue working or retry
- Error affects current workflow but not entire app
- Examples: API errors, network issues, file upload failures

**Use Modal When:**
- Error blocks ALL functionality
- Requires immediate user decision
- Data loss imminent
- Examples: Session expired, payment failed, unsaved changes

### Step 3: Determine Validation Timing

**Validate on Submit (Default):**
- Email, text inputs, selects, dates
- Most form fields

**Validate Real-Time (Exceptions):**
- Password strength indicators
- Duplicate name checks (debounced)
- Character count limits

---

## Field Validation Patterns

### Standard Field Validation

**Timing:** Validate on submit, clear on change

**Visual Treatment:**
```jsx
// Invalid state
<input
  className={`... ${
    error
      ? 'border-red-300 dark:border-red-500 bg-red-50 dark:bg-red-900/20'
      : 'border-slate-300 dark:border-slate-600'
  }`}
  aria-invalid={!!error}
  aria-describedby={error ? 'field-error' : undefined}
/>
{error && (
  <p id="field-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
    {error}
  </p>
)}
```

**Implementation Pattern:**
```jsx
const handleSubmit = async (e) => {
  e.preventDefault();

  // Clear previous errors
  setEmailError('');
  setPasswordError('');

  let hasErrors = false;

  // Validate email
  if (!email.trim()) {
    setEmailError('Email is required');
    hasErrors = true;
  } else if (!emailRegex.test(email)) {
    setEmailError('Please enter a valid email address');
    hasErrors = true;
  }

  // Validate password
  if (!password) {
    setPasswordError('Password is required');
    hasErrors = true;
  }

  // Stop if validation errors
  if (hasErrors) {
    // Focus first field with error
    if (emailError && emailInputRef.current) {
      emailInputRef.current.focus();
    } else if (passwordError && passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
    return;
  }

  // Submit form
  try {
    await submitForm();
  } catch (err) {
    setFormError(err.message);
  }
};

// Clear error when user types
const handleEmailChange = (e) => {
  setEmail(e.target.value);
  if (emailError) setEmailError('');
};
```

**Examples in App:**
- SignupModal: Email, password, confirm password validation
- Users (Admin): Role, reason validation
- TrialPrograms: Name, dates, trial tier validation

---

### Real-Time Validation (Exceptions)

#### 1. Password Strength Indicator

**When:** User is typing password
**Why:** Helps user create strong password before submission

**Implementation:**
```jsx
const [password, setPassword] = useState('');

// Calculate strength as user types
const passwordChecks = {
  length: password.length >= 8,
  hasUpper: /[A-Z]/.test(password),
  hasLower: /[a-z]/.test(password),
  hasNumber: /[0-9]/.test(password),
};

const passwordStrength = Object.values(passwordChecks).filter(Boolean).length;

// Show indicator when password has content
{password && (
  <div className="mt-3 space-y-2">
    {/* Strength bar (red/yellow/green) */}
    <div className="flex gap-1">
      {[1, 2, 3, 4].map((level) => (
        <div
          key={level}
          className={`h-1 flex-1 rounded-full ${
            level <= passwordStrength
              ? passwordStrength <= 2 ? 'bg-red-500'
              : passwordStrength === 3 ? 'bg-yellow-500'
              : 'bg-green-500'
              : 'bg-slate-200'
          }`}
        />
      ))}
    </div>

    {/* Requirements checklist */}
    <div className="space-y-1">
      <PasswordCheck met={passwordChecks.length}>
        At least 8 characters
      </PasswordCheck>
      <PasswordCheck met={passwordChecks.hasUpper}>
        One uppercase letter
      </PasswordCheck>
      <PasswordCheck met={passwordChecks.hasLower}>
        One lowercase letter
      </PasswordCheck>
      <PasswordCheck met={passwordChecks.hasNumber}>
        One number
      </PasswordCheck>
    </div>
  </div>
)}
```

**Example:** SignupModal password field

---

#### 2. Duplicate Name Validation

**When:** User types in a name field (debounced)
**Why:** Prevent submission of duplicate names

**Implementation:**
```jsx
const [name, setName] = useState('');
const [nameError, setNameError] = useState('');
const [existingNames, setExistingNames] = useState([]);

// Debounced duplicate check
useEffect(() => {
  if (!name.trim()) {
    setNameError('');
    return;
  }

  const timer = setTimeout(() => {
    const duplicate = existingNames.find(
      existing => existing.toLowerCase() === name.trim().toLowerCase()
    );
    if (duplicate) {
      setNameError('A trial program with this name already exists');
    } else {
      setNameError('');
    }
  }, 300); // 300ms debounce

  return () => clearTimeout(timer);
}, [name, existingNames]);

// Also validate on submit
const handleSubmit = (e) => {
  e.preventDefault();

  if (nameError) {
    nameInputRef.current?.focus();
    return;
  }

  // Continue with submission
};
```

**Example:** TrialPrograms name field

---

### Focus Management

**After validation fails:**
1. Set all errors using `flushSync` (ensures DOM updates synchronously)
2. Focus first field with error
3. Screen reader announces error via `aria-live="assertive"`

**Example:**
```jsx
import { flushSync } from 'react-dom';

const handleSubmit = async (e) => {
  e.preventDefault();

  // Validate fields
  const errors = validateForm();

  if (Object.keys(errors).length > 0) {
    // Use flushSync to ensure errors are set before focusing
    flushSync(() => {
      setEmailError(errors.email);
      setPasswordError(errors.password);
    });

    // Now focus first field with error
    if (errors.email && emailInputRef.current) {
      emailInputRef.current.focus();
    } else if (errors.password && passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
    return;
  }

  // Submit
};
```

---

## Banner Usage

**When to use banners:**
- API/network errors (rate limits, auth failures, server errors)
- File upload/validation errors
- Page-level validation summaries
- Non-blocking warnings (usage limits, deprecation notices)

**See [BANNER-PATTERNS.md](./BANNER-PATTERNS.md) for visual design specifications.**

### Banner vs Toast Decision

**Use Banners for Errors:**
- ✅ Persistent until dismissed
- ✅ More prominent (harder to miss)
- ✅ Can show technical details in dev mode
- ✅ User can reference while fixing issue
- ✅ No notification spam

**Use Toasts for Success:**
- ✅ Celebratory feedback
- ✅ Auto-dismiss (3-5 seconds)
- ✅ Unobtrusive
- ✅ No permanent screen space

**❌ Never Use Toasts for Errors:**
- Auto-dismiss causes users to miss errors
- Can't reference while fixing issue
- Creates notification spam with banners

### Priority System

When multiple errors/warnings exist, show only the most critical:

**Priority Order:**
1. **Error banners** (blocking - API, network, upload)
2. **Warning banners** (non-blocking - usage limits, deprecation)
3. **Info banners** (educational - tips, announcements)

**Implementation:**
```jsx
{error ? (
  <ErrorBanner error={error} onDismiss={() => setError(null)} />
) : uploadError ? (
  <ErrorBanner error={uploadError} onDismiss={() => setUploadError(null)} />
) : showUsageWarning ? (
  <WarningBanner onDismiss={() => setShowUsageWarning(false)} />
) : null}
```

**Example:** App.jsx error/warning display

---

## Modal Usage

**Use modals ONLY for critical errors:**

### When to Use Modals

1. **Application-breaking errors**
   - Session expired (requires re-auth)
   - License/permission revoked
   - System-wide failures

2. **Data loss prevention**
   - Unsaved changes warning
   - Destructive action confirmation
   - Payment failures with financial impact

3. **Security issues**
   - Security breach detected
   - Unusual activity requiring verification

### When NOT to Use Modals

- ❌ API errors (use banners)
- ❌ Network errors (use banners)
- ❌ Validation errors (use inline or banners)
- ❌ Informational messages (use banners/toasts)

**Why modals should be rare:**
- Users reflexively close modals without reading
- Blocks entire interface (frustrating)
- Can't reference context while fixing
- Industry research shows banners are more effective

**See [MODAL_DESIGN_STANDARDS.md](../design/MODAL_DESIGN_STANDARDS.md) for modal design patterns.**

---

## Toast Usage

**Toasts are for SUCCESS ONLY in CodeScribe AI.**

**Use toasts for:**
- ✅ Documentation generated successfully
- ✅ File uploaded successfully
- ✅ Example loaded
- ✅ Settings saved
- ✅ Code copied to clipboard

**Never use toasts for:**
- ❌ Errors (use banners)
- ❌ Warnings (use banners)
- ❌ Critical information (users might miss it)

**See [TOAST-SYSTEM.md](./TOAST-SYSTEM.md) for toast implementation patterns.**

---

## CodeScribe AI Error Patterns

### Error Classification Table

| Error Type | Display Method | Blocking? | Example |
|------------|----------------|-----------|---------|
| **Email format invalid** | Inline field validation | No | "Please enter a valid email address" |
| **Password too short** | Inline field validation | No | "Password must be at least 8 characters" |
| **Form incomplete** | Inline field validation | No | "This field is required" |
| **Passwords don't match** | Inline field validation | No | "Passwords do not match" |
| **API rate limit** | Error banner | Yes | "Rate limit exceeded. Try again in 30 seconds" |
| **Network failure** | Error banner | Temporarily | "Unable to connect to server" |
| **File upload error** | Error banner | Partially | "File too large (max 10MB)" |
| **File validation error** | Error banner | Partially | "Only .js, .py, .java files supported" |
| **Usage warning (80%)** | Warning banner | No | "You've used 80% of your monthly quota" |
| **Usage limit (100%)** | Modal | Yes | "Monthly limit reached. Upgrade to continue" |
| **Session expired** | Modal | Yes | "Your session has expired. Please log in again" |

---

## Implementation Guidelines

### 1. Form Validation Example

```jsx
function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear errors
    setEmailError('');
    setPasswordError('');

    // Validate
    let hasErrors = false;

    if (!email.trim()) {
      setEmailError('Email is required');
      hasErrors = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address');
      hasErrors = true;
    }

    if (!password) {
      setPasswordError('Password is required');
      hasErrors = true;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      hasErrors = true;
    }

    if (hasErrors) {
      // Focus first error
      if (emailError && emailInputRef.current) {
        emailInputRef.current.focus();
      } else if (passwordError && passwordInputRef.current) {
        passwordInputRef.current.focus();
      }
      return;
    }

    // Submit form
    try {
      await submitForm(email, password);
    } catch (err) {
      // Show banner for API errors
      setApiError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Email field */}
      <div>
        <label htmlFor="email">Email</label>
        <input
          ref={emailInputRef}
          id="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError('');
          }}
          className={emailError ? 'border-red-500 bg-red-50' : 'border-slate-300'}
          aria-invalid={!!emailError}
          aria-describedby={emailError ? 'email-error' : undefined}
        />
        {emailError && (
          <p id="email-error" className="text-sm text-red-600" role="alert">
            {emailError}
          </p>
        )}
      </div>

      {/* Password field */}
      <div>
        <label htmlFor="password">Password</label>
        <input
          ref={passwordInputRef}
          id="password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (passwordError) setPasswordError('');
          }}
          className={passwordError ? 'border-red-500 bg-red-50' : 'border-slate-300'}
          aria-invalid={!!passwordError}
          aria-describedby={passwordError ? 'password-error' : undefined}
        />
        {passwordError && (
          <p id="password-error" className="text-sm text-red-600" role="alert">
            {passwordError}
          </p>
        )}

        {/* Password strength (real-time) */}
        {password && <PasswordStrengthIndicator password={password} />}
      </div>

      <button type="submit">Sign Up</button>
    </form>
  );
}
```

---

### 2. API Error Handling Example

```jsx
function DocumentGenerator() {
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null); // Clear previous errors

    try {
      await generateDocumentation(code);
      toastSuccess('Documentation generated!');
    } catch (err) {
      // Show error banner (persistent)
      setError({
        type: err.type || 'Error',
        message: err.message || 'Failed to generate documentation'
      });
      // NO toast - banner is sufficient
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      {/* Error banner at top of page */}
      {error && (
        <ErrorBanner
          error={error}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Main content */}
      <button onClick={handleGenerate} disabled={generating}>
        Generate Documentation
      </button>
    </div>
  );
}
```

---

### 3. Usage Limit Example

```jsx
function App() {
  const [error, setError] = useState(null);
  const [showUsageWarning, setShowUsageWarning] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const { usage } = useAuth();

  // Check usage and show appropriate UI
  useEffect(() => {
    if (!usage) return;

    const percentUsed = (usage.used / usage.limit) * 100;

    if (percentUsed >= 100) {
      // 100% - blocking modal
      setShowUsageModal(true);
      setShowUsageWarning(false);
    } else if (percentUsed >= 80) {
      // 80-99% - non-blocking banner
      setShowUsageWarning(true);
    } else {
      setShowUsageWarning(false);
    }
  }, [usage]);

  return (
    <div>
      {/* Priority system - show only most critical */}
      {error ? (
        <ErrorBanner error={error} onDismiss={() => setError(null)} />
      ) : showUsageWarning ? (
        <WarningBanner
          message="You've used 80% of your monthly quota"
          onDismiss={() => setShowUsageWarning(false)}
        />
      ) : null}

      {/* Main content */}

      {/* Blocking modal for 100% usage */}
      {showUsageModal && (
        <UsageLimitModal onClose={() => setShowUsageModal(false)} />
      )}
    </div>
  );
}
```

---

## Related Documentation

- [BANNER-PATTERNS.md](./BANNER-PATTERNS.md) - Visual design for all banner types
- [TOAST-SYSTEM.md](./TOAST-SYSTEM.md) - Success notification patterns
- [MODAL_DESIGN_STANDARDS.md](../design/MODAL_DESIGN_STANDARDS.md) - Modal design patterns
- [FORM-VALIDATION-GUIDE.md](./FORM-VALIDATION-GUIDE.md) - Detailed form validation patterns

---

## Version History

- **v2.0** (January 26, 2026) - Refactored to focus on decision framework
  - Split visual patterns into BANNER-PATTERNS.md
  - Added comprehensive field validation patterns
  - Documented real-time validation exceptions (passwords, duplicate checks)
  - Added focus management guidelines
  - Expanded examples from actual app components
  - Clarified banner vs toast usage (errors = banners, success = toasts)
  - Added implementation code examples

- **v1.0** (October 16, 2025) - Initial error handling guide
  - Established banner vs modal decision framework
  - Defined animation standards
  - Documented CodeScribe AI error patterns

---

**Maintained by:** CodeScribe AI Design Team
**Questions?** Refer to related documentation or contact UX lead

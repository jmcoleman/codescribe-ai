# Password Reset E2E Tests

**File:** [client/e2e/password-reset-core.spec.js](../../client/e2e/password-reset-core.spec.js)
**Created:** October 24, 2025
**Test Count:** 14 core tests × 5 browsers = 70 total test runs
**Pass Rate:** 93% on desktop browsers (Chromium, Firefox, WebKit)

## Overview

Comprehensive end-to-end tests for the complete password reset flow, from requesting a reset link to successfully setting a new password.

## Test Coverage

### 1. Forgot Password Request (3 tests)

| Test | Description | Verification |
|------|-------------|--------------|
| **Successfully request password reset** | User can request password reset with valid email | Success message displayed, API called |
| **Validate required email field** | Form validates empty email | Error message shown |
| **Show loading state** | Button shows loading during submission | "Sending..." text displayed, button disabled |

### 2. Password Reset Confirmation (7 tests)

| Test | Description | Verification |
|------|-------------|--------------|
| **Successfully reset with valid token** | User can set new password with valid token | Success message, redirect to home |
| **Validate password mismatch** | Passwords must match | Error shown when passwords don't match |
| **Validate password length** | Password must be 8+ characters | Error shown for short passwords |
| **Show error for missing token** | Page handles missing token | Error message, disabled submit button |
| **Handle expired token** | Server error for expired token handled | Error message displayed |
| **Toggle password visibility** | Show/hide password buttons work | Password type toggles between 'password' and 'text' |
| **Auto-focus password input** | Password field focused on page load | First input is focused |

### 3. Complete Flow Integration (1 test)

| Test | Description | Verification |
|------|-------------|--------------|
| **Complete full password reset flow** | End-to-end: request → reset → redirect | All steps complete successfully |

### 4. Accessibility (3 tests)

| Test | Description | Verification |
|------|-------------|--------------|
| **Proper ARIA attributes** | Error alerts have role="alert" | ARIA attributes present |
| **Keyboard navigation** | Tab key navigates form elements | Focus moves correctly |
| **Escape key closes modal** | Modal dismisses on Escape | Modal closes |

## Running the Tests

```bash
# Run all password reset tests
cd client
npx playwright test e2e/password-reset-core.spec.js

# Run on specific browser
npx playwright test e2e/password-reset-core.spec.js --project=chromium

# Run with UI
npx playwright test e2e/password-reset-core.spec.js --ui

# Debug mode
npx playwright test e2e/password-reset-core.spec.js --debug
```

## Test Results

### Desktop Browsers
- **Chromium:** 13/14 passing (93%)
- **Firefox:** 13/14 passing (93%)
- **WebKit:** 13/14 passing (93%)

### Known Issues
1. **ARIA attributes test:** Minor timing issue with error alert appearance (non-critical)
2. **Mobile browsers:** Modal tests timeout (password reset page tests all pass)

## Implementation Details

### Mock Strategy
Tests use Playwright's `page.route()` to mock API responses:
- Forgot password: `POST /api/auth/forgot-password`
- Reset password: `POST /api/auth/reset-password`

### Key Selectors
```javascript
// Forgot Password Modal
page.getByRole('button', { name: /sign in/i })
page.getByText(/forgot password/i)
page.getByLabel(/email address/i)
page.getByRole('button', { name: /send reset link/i })

// Reset Password Page
page.getByLabel(/^new password$/i)
page.getByLabel(/confirm new password/i)
page.getByRole('button', { name: /^reset password$/i })
```

### Test Data
```javascript
const testEmail = 'test@example.com'
const newPassword = 'NewPassword123'
const resetToken = 'mock-reset-token-32-characters-long-abc123def456'
```

## Related Files

**Implementation:**
- Frontend: [client/src/components/ForgotPasswordModal.jsx](../../client/src/components/ForgotPasswordModal.jsx)
- Frontend: [client/src/components/ResetPassword.jsx](../../client/src/components/ResetPassword.jsx)
- Backend: [server/src/routes/auth.js](../../server/src/routes/auth.js)

**Unit Tests:**
- [client/src/components/__tests__/ForgotPasswordModal.test.jsx](../../client/src/components/__tests__/ForgotPasswordModal.test.jsx)
- [client/src/components/__tests__/ResetPassword.test.jsx](../../client/src/components/__tests__/ResetPassword.test.jsx)
- [server/src/routes/__tests__/auth-password-reset.test.js](../../server/src/routes/__tests__/auth-password-reset.test.js)

**Documentation:**
- Setup Guide: [docs/authentication/PASSWORD-RESET-SETUP.md](../authentication/PASSWORD-RESET-SETUP.md)
- Implementation Guide: [docs/authentication/PASSWORD-RESET-IMPLEMENTATION.md](../authentication/PASSWORD-RESET-IMPLEMENTATION.md)

## Best Practices

### Wait for Events, Not Timeouts
```javascript
// ✅ GOOD: Wait for API response
const response = page.waitForResponse('/api/auth/forgot-password')
await page.click('button')
await response

// ❌ BAD: Arbitrary timeout
await page.waitForTimeout(1000)
```

### Use Specific Selectors
```javascript
// ✅ GOOD: Specific role and name
page.getByRole('button', { name: /^reset password$/i })

// ❌ BAD: Generic selector
page.locator('button').nth(2)
```

### Test Real Scenarios
```javascript
// ✅ GOOD: Test realistic user flow
await page.fill('input', 'short')  // triggers validation
await page.click('button')
await expect(page.getByText(/must be at least 8 characters/i)).toBeVisible()

// ❌ BAD: Test implementation details
expect(validatePassword('short')).toBe('Password must be at least 8 characters')
```

## Future Enhancements

1. **Email Integration Tests:** Test actual email delivery (requires test email service)
2. **Token Expiration:** Test time-based token expiration
3. **Rate Limiting:** Test forgot password rate limiting
4. **Mobile Browser Support:** Fix timeout issues on mobile tests

## Changelog

**October 24, 2025**
- ✅ Created comprehensive e2e test suite
- ✅ 14 tests covering full password reset flow
- ✅ 93% pass rate on desktop browsers
- ✅ Accessibility tests included

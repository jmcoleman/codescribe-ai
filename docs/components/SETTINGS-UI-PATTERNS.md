# Settings UI Patterns & Guidelines

**Project:** CodeScribe AI
**Last Updated:** November 17, 2024
**Purpose:** Design system reference for consistent settings page patterns

---

## Table of Contents

1. [Action Placement Rules](#action-placement-rules)
2. [Button Styles & Variants](#button-styles--variants)
3. [Section Structure](#section-structure)
4. [Form Patterns](#form-patterns)
5. [Spacing & Typography](#spacing--typography)
6. [Examples by Use Case](#examples-by-use-case)

---

## Action Placement Rules

### Top-Right Actions (Header Level)

**Use top-right placement for:**

| Action Type | Purpose | Visual Style | Examples |
|-------------|---------|--------------|----------|
| **Mode Toggles** | Enable/disable editing state | Link-style button | "Edit", "Change Password" |
| **Navigation Actions** | Navigate to another page | Link-style button | "Upgrade", "View Details" |
| **Binary Toggles** | Quick on/off switches | Toggle switch | Analytics enabled/disabled |
| **Non-destructive Previews** | Show/hide content | Link-style button | "Show more", "Expand" |

**Characteristics:**
- ✅ Non-committal (can be undone easily)
- ✅ Changes UI state or navigates
- ✅ Doesn't require additional input
- ✅ Lightweight visual style (link or toggle)

**Code Pattern:**
```jsx
<div className="flex items-center justify-between mb-4">
  <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
    <Icon className="w-5 h-5" aria-hidden="true" />
    Section Title
  </h2>
  {!isEditing && (
    <button
      onClick={() => setIsEditing(true)}
      className="px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
    >
      Edit
    </button>
  )}
</div>
```

---

### Bottom Actions (Content Level)

**Use bottom placement for:**

| Action Type | Purpose | Visual Style | Examples |
|-------------|---------|--------------|----------|
| **Form Submissions** | Save/update data | Primary button | "Save Changes", "Update Password" |
| **Destructive Actions** | Delete/remove data | Danger button | "Delete Account", "Remove Card" |
| **Downloads/Exports** | Generate files | Primary button | "Download My Data", "Export CSV" |
| **Multi-step Commits** | Actions requiring validation | Primary button | "Apply Override" (needs reason) |

**Characteristics:**
- ✅ Commits changes to server
- ✅ May be irreversible (destructive)
- ✅ Requires validation or additional input
- ✅ Prominent visual style (filled button with shadow)

**Code Pattern:**
```jsx
<div className="flex justify-end gap-3">
  <button
    type="button"
    onClick={handleCancel}
    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg font-medium hover:bg-slate-200 active:bg-slate-300 dark:hover:bg-slate-600 dark:active:bg-slate-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    Cancel
  </button>
  <button
    type="submit"
    disabled={isSaving}
    className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-lg font-semibold shadow-lg shadow-purple-600/20 dark:shadow-purple-900/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <Save className="w-5 h-5" aria-hidden="true" />
    <span>Save Changes</span>
  </button>
</div>
```

---

## Button Styles & Variants

### 1. Link-Style Buttons (Top Actions)

**Use for:** Mode toggles, navigation, lightweight actions

```jsx
className="px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
```

**Characteristics:**
- No background color
- Purple text color
- Minimal padding (py-2)
- No shadow
- Simple color transition

---

### 2. Primary Action Buttons (Bottom Actions)

**Use for:** Form submissions, important actions, exports

```jsx
className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-lg font-semibold shadow-lg shadow-purple-600/20 dark:shadow-purple-900/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
```

**Characteristics:**
- Purple background
- White text
- font-semibold
- shadow-lg with dark variant
- Icon + text pattern
- Disabled state uses opacity-50

---

### 3. Secondary Action Buttons (Cancel, etc.)

**Use for:** Cancel, dismiss, secondary actions

```jsx
className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg font-medium hover:bg-slate-200 active:bg-slate-300 dark:hover:bg-slate-600 dark:active:bg-slate-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
```

**Characteristics:**
- Slate background
- font-medium (not semibold)
- No shadow
- Hover/active states
- Disabled state uses opacity-50

---

### 4. Danger Buttons (Destructive Actions)

**Use for:** Delete, remove, destructive actions

```jsx
className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 dark:bg-red-700 dark:hover:bg-red-800 dark:active:bg-red-900 text-white rounded-lg font-semibold shadow-lg shadow-red-600/20 dark:shadow-red-900/30 transition-all duration-200"
```

**Characteristics:**
- Red background
- White text
- font-semibold
- Shadow with red tint
- Icon + text pattern
- Use sparingly for high-risk actions

---

### 5. Toggle Switches

**Use for:** Binary on/off settings

```jsx
<button
  onClick={handleToggle}
  disabled={isSaving}
  className={`
    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
    ${isEnabled ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-600'}
  `}
  role="switch"
  aria-checked={isEnabled}
  aria-label="Toggle feature"
>
  <span
    className={`
      pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
      ${isEnabled ? 'translate-x-5' : 'translate-x-0'}
    `}
  />
</button>
```

---

## Section Structure

### Standard Section Pattern

```jsx
<div className="space-y-6">
  {/* First Section - No divider */}
  <div>
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
        <Icon className="w-5 h-5" aria-hidden="true" />
        Section Title
      </h2>
      {/* Optional top action */}
    </div>

    {/* Section content */}

    {/* Optional bottom action */}
  </div>

  {/* Subsequent Sections - With divider */}
  <div className="pt-8 border-t border-slate-200 dark:border-slate-700">
    <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
      <Icon className="w-5 h-5" aria-hidden="true" />
      Section Title
    </h2>

    {/* Section content */}
  </div>
</div>
```

**Rules:**
- ✅ First section: No top border/padding
- ✅ Subsequent sections: `pt-8 border-t`
- ✅ Consistent `space-y-6` between sections
- ✅ Icons aligned with header text using `gap-2`

---

## Form Patterns

Understanding when to use each form pattern is critical for good UX. The pattern you choose depends on **what type of data you're working with**.

### Pattern Decision Tree

```
Is this data...

┌─ Existing user data that's frequently viewed but rarely edited?
│  └─> Use EDITABLE FORM PATTERN (Profile, Password)
│      Rationale: Protects against accidental edits, shows current state
│
┌─ An admin tool or always creating new data (no existing state to view)?
│  └─> Use ALWAYS-EDITABLE FORM PATTERN (Tier Override)
│      Rationale: Admins come to use the tool, not view data
│
└─ A single action with no input required?
   └─> Use DIRECT ACTION PATTERN (Data Export, Delete Account)
       Rationale: No form needed, just trigger the action
```

---

### Editable Form Pattern

**Use when:** User data that's frequently viewed but rarely edited

**Examples:** Profile information, email address, password

**Rationale:**
- Users view their profile info often (to verify tier, check email, etc.)
- Edits happen infrequently (name changes, password updates)
- Read-only default prevents accidental changes
- Clear visual distinction between "viewing" and "editing" modes

**Initial State (Read-only):**
```jsx
<div>
  <div className="flex items-center justify-between mb-4">
    <h2>Profile Information</h2>
    {!isEditing && (
      <button onClick={() => setIsEditing(true)}>Edit</button>
    )}
  </div>

  <form className="space-y-4">
    <input disabled={!isEditing} />

    {/* Action buttons only show when editing */}
    <div className={`
      overflow-hidden transition-all duration-200
      ${isEditing ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}
    `}>
      <div className="flex justify-end gap-3">
        <button type="button">Cancel</button>
        <button type="submit">Save Changes</button>
      </div>
    </div>
  </form>
</div>
```

**Flow:**
1. User clicks "Edit" (top-right)
2. Form inputs become enabled
3. "Edit" button hides
4. "Cancel" + "Save" buttons appear at bottom (animated)
5. After save, returns to read-only state

**Why this pattern:**
- ✅ Prevents accidental edits (inputs start disabled)
- ✅ Shows current data clearly (read-only view)
- ✅ Explicit intent required (must click "Edit")
- ✅ Easy to cancel (returns to safe read-only state)

---

### Conditional Form Pattern (Variant of Editable Form)

**Use when:** Sensitive data that shouldn't be displayed at all until user wants to edit

**Examples:** Password change form

**Rationale:**
- Passwords can't be shown (security)
- No existing state to display in read-only mode
- Form only appears when user explicitly wants to change password
- Keeps UI clean when not in use

**Show/Hide Form:**
```jsx
<div>
  <div className="flex items-center justify-between mb-4">
    <h2>Password</h2>
    {!showForm && (
      <button onClick={() => setShowForm(true)}>Change Password</button>
    )}
  </div>

  {showForm && (
    <form className="space-y-4">
      <input type="password" />

      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => setShowForm(false)}>
          Cancel
        </button>
        <button type="submit">Update Password</button>
      </div>
    </form>
  )}
</div>
```

**Flow:**
1. User clicks "Change Password" (top-right)
2. Button hides, form appears
3. User fills form
4. Submit or cancel returns to initial state

**Why this pattern:**
- ✅ No sensitive data visible by default
- ✅ Clean UI when not in use
- ✅ Form appears only when needed
- ✅ Similar to editable form, but content is hidden not disabled

---

### Always-Editable Form Pattern

**Use when:** Admin tools, creating new data, or no existing state to view

**Examples:** Tier override panel, admin controls

**Rationale:**
- User comes to this section specifically to use the tool
- There's no existing data to "view" - you're always creating something new
- Form is the interface (not a secondary mode)
- Validation prevents accidental submissions
- Typically admin/power-user features (not general user settings)

**Always-Ready Form:**
```jsx
<div>
  <h2 className="mb-4">Tier Override</h2>

  <form className="space-y-3">
    <Select label="Tier" />
    <Select label="Duration" />
    <Input
      label="Reason"
      placeholder="Testing feature..."
      required
      minLength={10}
    />

    <div className="flex justify-end">
      <button
        type="submit"
        disabled={!isValid} {/* Form validation prevents accidents */}
      >
        Apply Override
      </button>
    </div>
  </form>
</div>
```

**Flow:**
1. Form is immediately visible and editable
2. User fills required fields
3. Validation enables submit button
4. Submit creates new override

**Why this pattern:**
- ✅ No "view" state needed (nothing to view)
- ✅ User's intent is clear (came here to use the tool)
- ✅ Validation provides safety (can't submit invalid data)
- ✅ Efficient for admin workflows (fewer clicks)
- ✅ Common for admin panels (Stripe admin, Linear admin)

**Key difference from Editable Form Pattern:**
- **Editable Form**: Protects existing data, requires explicit "Edit" mode
- **Always-Editable Form**: No existing data to protect, tool is the interface

---

### Direct Action Pattern

**Use when:** Single action with no form input required

**Examples:** Data export, account deletion

**Rationale:**
- Action is self-contained (no additional input needed)
- One-click operation (potentially with confirmation modal)
- Not editing data, just triggering a server action
- Button text makes action clear

**No form, immediate action:**
```jsx
<div>
  <h2 className="mb-4">Export Your Data</h2>
  <p className="text-sm mb-4">Download all your account data...</p>

  {/* Optional expandable details */}
  <details className="mb-4">
    <summary>What's included</summary>
    <ul>...</ul>
  </details>

  <div className="flex justify-end">
    <button onClick={handleExport} disabled={isExporting}>
      <Download />
      <span>{isExporting ? 'Downloading...' : 'Download Data'}</span>
    </button>
  </div>
</div>
```

**Flow:**
1. Single action button at bottom
2. Clicking triggers immediate server action
3. Loading state shows progress
4. No form fields needed

**Why this pattern:**
- ✅ Simplest possible interface (just a button)
- ✅ No data entry required
- ✅ Clear call-to-action
- ✅ Can show loading state inline

---

## Spacing & Typography

### Header Spacing

```jsx
// Section header with action
<div className="flex items-center justify-between mb-4">

// Section header without action
<h2 className="mb-4">

// Subheading within section
<h3 className="mb-2">
```

### Content Spacing

```jsx
// Between sections
<div className="space-y-6">

// Within a section (form fields)
<form className="space-y-4">

// Between related items (list items)
<ul className="space-y-2">
```

### Typography Scale

```jsx
// Section headers
className="text-lg font-semibold"

// Subheadings
className="text-base font-semibold"

// Body text
className="text-sm text-slate-700 dark:text-slate-300"

// Helper/supplementary text
className="text-sm text-slate-600 dark:text-slate-400 italic"

// Labels
className="text-sm font-medium text-slate-700 dark:text-slate-300"
```

### Input Fields

**Standard text input pattern:**

```jsx
<div>
  <label htmlFor="fieldId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
    Field Label
  </label>
  <input
    type="text"
    id="fieldId"
    value={value}
    onChange={(e) => setValue(e.target.value)}
    disabled={!isEditing}
    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
    placeholder="Enter value..."
  />
</div>
```

**Key characteristics:**
- Padding: `px-3 py-2` (consistent across all inputs)
- Font size: `text-sm`
- Border: `border-slate-300 dark:border-slate-600`
- Background: `bg-white dark:bg-slate-700`
- Text: `text-slate-900 dark:text-slate-100`
- Placeholder: `placeholder-slate-400 dark:placeholder-slate-500`
- Focus: `focus:ring-2 focus:ring-purple-500 focus:border-transparent`
- Disabled: `disabled:opacity-50 disabled:cursor-not-allowed`

**Input with icon (e.g., email):**

```jsx
<div className="relative">
  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
  <input
    type="email"
    className="w-full pl-10 pr-3 py-2 text-sm ..." {/* pl-10 for icon space */}
  />
</div>
```

---

## Examples by Use Case

### 1. Profile Editing

**Pattern:** Editable form with mode toggle

```jsx
<div>
  {/* Top action: Mode toggle */}
  <div className="flex items-center justify-between mb-4">
    <h2>Profile Information</h2>
    {!isEditing && <button>Edit</button>}
  </div>

  {/* Form with disabled inputs */}
  <form>
    <input disabled={!isEditing} />

    {/* Bottom actions: Form submission */}
    {isEditing && (
      <div className="flex justify-end gap-3">
        <button type="button">Cancel</button>
        <button type="submit">Save Changes</button>
      </div>
    )}
  </form>
</div>
```

**Why:** Users need to explicitly enter edit mode before making changes. This prevents accidental edits.

---

### 2. Subscription Upgrade

**Pattern:** Top navigation action

```jsx
<div>
  {/* Top action: Navigate to pricing */}
  <div className="flex items-center justify-between mb-4">
    <h2>Current Plan</h2>
    {isFree && <button onClick={() => navigate('/pricing')}>Upgrade</button>}
  </div>

  {/* Read-only plan details */}
  <div>
    <h3>Free</h3>
    <ul>...</ul>
  </div>
</div>
```

**Why:** Upgrade doesn't modify current section - it navigates elsewhere. Top placement signals this is a navigation action.

---

### 3. Analytics Toggle

**Pattern:** Top inline toggle

```jsx
<div>
  <div className="flex items-center justify-between mb-4">
    <h2>Usage Analytics</h2>
    {/* Top action: Binary toggle */}
    <ToggleSwitch checked={enabled} onChange={handleToggle} />
  </div>

  <p>Help us improve by sharing analytics...</p>
</div>
```

**Why:** Simple on/off choice with immediate effect. Top placement keeps it visible and accessible.

---

### 4. Password Change

**Pattern:** Conditional form

```jsx
<div>
  {/* Top action: Show form */}
  <div className="flex items-center justify-between mb-4">
    <h2>Password</h2>
    {!showForm && <button>Change Password</button>}
  </div>

  {showForm && (
    <form>
      <input type="password" placeholder="Current password" />
      <input type="password" placeholder="New password" />

      {/* Bottom actions: Form submission */}
      <div className="flex justify-end gap-3">
        <button type="button">Cancel</button>
        <button type="submit">Update Password</button>
      </div>
    </form>
  )}
</div>
```

**Why:** Password change is a distinct flow that requires validation. Form appears on demand.

---

### 5. Data Export

**Pattern:** Direct action

```jsx
<div>
  <h2 className="mb-4">Export Your Data</h2>
  <p className="mb-4">Download all account data (GDPR compliance).</p>

  <details className="mb-4">
    <summary>What's included</summary>
    <ul>...</ul>
  </details>

  {/* Bottom action: Generate export */}
  <div className="flex justify-end">
    <button onClick={handleExport}>
      <Download />
      <span>Download My Data</span>
    </button>
  </div>
</div>
```

**Why:** Export is a server action that generates a file. Bottom placement emphasizes this is a significant action.

---

### 6. Account Deletion

**Pattern:** Destructive action

```jsx
<div>
  <h2 className="mb-4">Delete Account</h2>
  <p className="mb-2">Permanently delete your account...</p>
  <p className="text-sm italic mb-4">You have 30 days to restore...</p>

  <details className="mb-4">
    <summary>What will be deleted</summary>
    <ul>...</ul>
  </details>

  {/* Bottom action: Danger button */}
  <div className="flex justify-end">
    <button className="bg-red-600 ...">
      <Trash2 />
      <span>Delete My Account</span>
    </button>
  </div>
</div>
```

**Why:** Destructive action requires careful consideration. Bottom placement + danger styling signals high risk.

---

### 7. Tier Override (Admin)

**Pattern:** Always-editable form (admin tool)

```jsx
<div>
  <h2 className="mb-4">Tier Override</h2>

  <form className="space-y-3">
    <Select label="Tier" />
    <Select label="Duration" />
    <Input label="Reason" placeholder="Testing feature..." />

    {/* Bottom action: Requires validation */}
    <div className="flex justify-end">
      <button
        type="submit"
        disabled={reason.length < 10}
      >
        Apply Override
      </button>
    </div>
  </form>
</div>
```

**Why:**
- Admin tool with no existing data to view
- Form is the interface, not a secondary mode
- Always editable because admins come here specifically to override
- Validation (10+ char reason) prevents accidental submissions
- Matches admin panel patterns (Stripe admin, Linear admin)

---

## Industry Best Practices & Implementation

This section documents how major platforms implement these UX patterns and where we've applied them in CodeScribe AI.

### Pattern 1: Editable Form (Edit Mode → Save Changes)

**Industry Examples:**

| Platform | Implementation | Location |
|----------|---------------|----------|
| **GitHub** | Edit button (top-right) → disabled inputs → Save/Cancel (bottom) | Settings → Profile |
| **Stripe** | Edit icon (inline) → form expands → Update/Cancel (bottom) | Account → Profile details |
| **Linear** | Edit mode toggle → form inputs enabled → Save changes (bottom) | Settings → Profile |
| **Gmail** | Not used - Gmail prefers always-editable with explicit Save | N/A |
| **Notion** | Edit button → modal with form → Save/Cancel (bottom) | Settings → My account |

**CodeScribe AI Implementation:**

| Component | Location | Details |
|-----------|----------|---------|
| **Profile Information** | AccountTab.jsx:20-85 | First name, last name, email fields - disabled until "Edit" clicked |
| **Pattern Features** | | - Edit button (top-right, line 31-39)<br>- Disabled inputs (line 54-76)<br>- Animated button reveal (line 78-84)<br>- Cancel returns to read-only |

**Why we use this pattern:**
- User profile data is viewed frequently (to check tier, verify email)
- Edits happen rarely (name changes are infrequent)
- Protects against accidental modifications
- Clear visual distinction between viewing and editing states

---

### Pattern 2: Conditional Form (Show/Hide Form)

**Industry Examples:**

| Platform | Implementation | Location |
|----------|---------------|----------|
| **GitHub** | "Change password" link → reveals form → Update/Cancel | Settings → Password and authentication |
| **Stripe** | "Change password" → expands accordion → Update | Account → Password |
| **Linear** | "Change password" → inline form appears → Update | Settings → Password |
| **Gmail** | Google Account manages this - redirects to accounts.google.com | External |
| **Notion** | "Change password" → modal opens → Save/Cancel | Settings → My account |

**CodeScribe AI Implementation:**

| Component | Location | Details |
|-----------|----------|---------|
| **Password Change** | AccountTab.jsx:88-147 | Password change form - hidden until "Change Password" clicked |
| **Pattern Features** | | - "Change Password" link (top-right, line 97-105)<br>- Form hidden by default (line 107)<br>- Current + New + Confirm fields (line 109-131)<br>- Update/Cancel (line 133-146) |

**Why we use this pattern:**
- Passwords can't be shown (security)
- No existing state to display in read-only view
- Keeps UI clean when not actively changing password
- Form appears only when user has explicit intent

---

### Pattern 3: Always-Editable Form (Admin Tools)

**Industry Examples:**

| Platform | Implementation | Location |
|----------|---------------|----------|
| **Stripe Dashboard (Admin)** | Form always editable, validation prevents submission | Create coupon, Add customer |
| **Linear (Admin)** | Admin overrides always editable with reason required | Team settings → Member overrides |
| **GitHub (Admin)** | Organization admin tools - always-editable forms | Organization → Settings |
| **Retool (Admin Builder)** | All admin panels use always-editable pattern | Component configuration |
| **Vercel (Project Settings)** | Environment variables - always editable with validation | Project → Settings → Environment Variables |

**CodeScribe AI Implementation:**

| Component | Location | Details |
|-----------|----------|---------|
| **Tier Override Panel** | TierOverridePanel.jsx:35-175 | Admin tool for testing as different subscription tiers |
| **Pattern Features** | | - Form always visible (line 115-172)<br>- Tier/Duration selects (line 117-132)<br>- Reason input with 10-char validation (line 135-152)<br>- Submit disabled until valid (line 166) |

**Why we use this pattern:**
- Admin comes specifically to use the tool (not to view data)
- No existing state to view - each override is new
- Validation (10+ character reason) provides safety
- Efficient for admin workflows (no extra "Edit" click needed)
- Matches standard admin panel UX (Stripe, Linear, Retool)

---

### Pattern 4: Direct Action (Single Button, No Form)

**Industry Examples:**

| Platform | Implementation | Location |
|----------|---------------|----------|
| **GitHub** | "Export account data" button → generates download | Settings → Account → Export account data |
| **Google** | "Download your data" (Google Takeout) | Account → Data & privacy |
| **Stripe** | "Download invoice" button | Billing → Invoice history |
| **Linear** | "Export issues" button | Workspace → Export data |
| **Twitter/X** | "Download your archive" button | Settings → Your account → Download an archive |

**CodeScribe AI Implementation:**

| Component | Location | Details |
|-----------|----------|---------|
| **Data Export** | AccountTab.jsx:150-180 | GDPR-compliant data export |
| **Delete Account** | DangerZoneTab.jsx:97-154 | Account deletion (30-day grace period) |
| **Pattern Features** | | - Description text (what's included)<br>- Collapsible details (optional)<br>- Single action button (bottom-right)<br>- Loading state (isExporting/isDeleting) |

**Why we use this pattern:**
- No form input required (self-contained action)
- Server generates response (download/email)
- Bottom placement signals significant action
- Loading state provides feedback

---

### Pattern 5: Binary Toggle (Instant On/Off)

**Industry Examples:**

| Platform | Implementation | Location |
|----------|---------------|----------|
| **Gmail** | Toggle switches throughout | Settings → General (many toggles) |
| **GitHub** | Feature flags, privacy settings | Settings → various |
| **Linear** | Notification preferences | Settings → Notifications |
| **Notion** | Workspace settings | Settings → various toggles |
| **Stripe** | Email notification preferences | Settings → Emails |

**CodeScribe AI Implementation:**

| Component | Location | Details |
|-----------|----------|---------|
| **Usage Analytics** | PrivacyTab.jsx:23-50 | Opt-in analytics tracking toggle |
| **Pattern Features** | | - Toggle switch in header (line 30-47)<br>- Immediate effect (no Save needed)<br>- Visual feedback (purple when enabled)<br>- Loading state during save (line 34) |

**Why we use this pattern:**
- Simple on/off choice
- Immediate effect preferred (no "Save" step)
- Top-right placement keeps toggle visible
- Common for privacy/notification settings

---

### Pattern 6: Navigation Action (Link to Different Page)

**Industry Examples:**

| Platform | Implementation | Location |
|----------|---------------|----------|
| **GitHub** | "Upgrade" link in free tier banner | Settings → Billing → Upgrade |
| **Stripe** | "Manage billing" → customer portal | Settings → Billing |
| **Linear** | "View billing details" → billing page | Settings → Subscription |
| **Notion** | "Upgrade" button in free workspace | Settings → Plans |
| **Vercel** | "Upgrade to Pro" button | Project → Settings → General |

**CodeScribe AI Implementation:**

| Component | Location | Details |
|-----------|----------|---------|
| **Upgrade Plan** | SubscriptionTab.jsx:97-110 | Shows when near/at usage limit |
| **Manage Billing** | SubscriptionTab.jsx:145-164 | Links to Stripe customer portal |
| **Pattern Features** | | - Link-style button (top or inline)<br>- Clear destination ("Upgrade Plan", "Manage Billing")<br>- Navigation occurs immediately<br>- No form submission |

**Why we use this pattern:**
- Action happens elsewhere (pricing page, Stripe portal)
- Top/inline placement signals lightweight navigation
- No data modification in current section
- Matches industry standard for upgrade CTAs

---

### Summary Table: Where Each Pattern is Used

| Pattern | CodeScribe AI Usage | Industry Standard | Key Characteristic |
|---------|---------------------|-------------------|-------------------|
| **Editable Form** | Profile (AccountTab) | GitHub Profile, Stripe Account | Edit mode protects existing data |
| **Conditional Form** | Password (AccountTab) | GitHub Password, Stripe Password | Form hidden until needed |
| **Always-Editable Form** | Tier Override (TierOverridePanel) | Stripe Create Coupon, Linear Admin | Admin tool, no existing state |
| **Direct Action** | Data Export, Delete Account | GitHub Export, Google Takeout | Single button, no form |
| **Binary Toggle** | Analytics (PrivacyTab) | Gmail Settings, Notion Toggles | Instant on/off, no Save button |
| **Navigation Action** | Upgrade, Manage Billing | GitHub Upgrade, Stripe Billing | Links to different page |

---

### Key Industry Insights

**1. Editable Form Pattern is Dominant for User Data**
- GitHub, Stripe, Linear all use Edit → disabled inputs → Save/Cancel for profiles
- Protects against accidental modifications
- Clear mental model: "viewing" vs "editing" modes

**2. Admin Tools Use Always-Editable Pattern**
- Stripe Dashboard, Linear Admin, Retool all keep admin forms editable
- Admins come to use tools, not view data
- Validation provides safety net

**3. Direct Action for GDPR/Data Exports**
- GitHub, Google, Twitter all use single "Download" button
- No form needed - server generates the export
- Bottom placement signals significant action

**4. Password Changes Always Use Conditional Form**
- Every platform hides password form until explicitly shown
- No existing state to display (can't show current password)
- Security + clean UI

**5. Toggles for Privacy/Notifications**
- Gmail, Notion, Linear prefer instant toggles
- No "Save" button needed (saves automatically)
- Top-right placement keeps controls visible

---

## Quick Decision Tree

```
Is the action...

┌─ Changing UI state only (Edit, Show/Hide)?
│  └─> TOP (link-style button)
│
┌─ Navigating to another page (Upgrade, Learn more)?
│  └─> TOP (link-style button)
│
┌─ A binary toggle (On/Off)?
│  └─> TOP (toggle switch)
│
┌─ Submitting a form?
│  └─> BOTTOM (primary button)
│
┌─ Destructive (Delete, Remove)?
│  └─> BOTTOM (danger button)
│
└─ Generating/downloading something?
   └─> BOTTOM (primary button)
```

---

## Common Mistakes to Avoid

### ❌ Don't Do This:

1. **Form submissions at the top**
   ```jsx
   // WRONG
   <div className="flex justify-between mb-4">
     <h2>Profile</h2>
     <button type="submit">Save Changes</button> {/* ❌ */}
   </div>
   ```

2. **Edit mode toggle at the bottom**
   ```jsx
   // WRONG
   <form>
     <input />
     <div className="flex justify-end">
       <button onClick={() => setEditing(true)}>Edit</button> {/* ❌ */}
     </div>
   </form>
   ```

3. **Using always-editable pattern for user data**
   ```jsx
   // WRONG - Profile should use editable form pattern
   <form>
     <input value={email} /> {/* Always editable, no protection */}
     <button type="submit">Save</button>
   </form>
   ```

4. **Using editable form pattern for admin tools**
   ```jsx
   // WRONG - Admin tools don't need edit mode
   <div>
     <button onClick={() => setEditing(true)}>Edit</button>
     <input disabled={!isEditing} /> {/* Unnecessary friction */}
   </div>
   ```

3. **Mixed button styles for same action type**
   ```jsx
   // WRONG - Inconsistent styling
   <button className="bg-purple-600 ...">Save</button>
   <button className="bg-blue-600 ...">Update</button> {/* ❌ Different color */}
   ```

4. **Excessive focus rings on link-style buttons**
   ```jsx
   // WRONG - Over-styled
   <button className="text-purple-600 focus:ring-4 focus:ring-offset-4 ..."> {/* ❌ */}
     Edit
   </button>
   ```

5. **Using disabled:bg instead of disabled:opacity**
   ```jsx
   // WRONG - Inconsistent disabled state
   <button className="disabled:bg-gray-300 disabled:text-gray-500"> {/* ❌ */}

   // RIGHT - Use opacity
   <button className="disabled:opacity-50"> {/* ✅ */}
   ```

---

## Checklist for New Settings Sections

Before adding a new settings section, verify:

- [ ] Action placement follows top/bottom rules
- [ ] Button styles match variant guidelines
- [ ] Spacing uses consistent values (mb-4, space-y-6, etc.)
- [ ] Headers use text-lg font-semibold
- [ ] Icons are properly sized (w-5 h-5)
- [ ] Dividers use pt-8 border-t (except first section)
- [ ] Disabled states use opacity-50
- [ ] Dark mode colors are specified
- [ ] Loading states show progress (spinner + text)
- [ ] Forms validate before enabling submit

---

## Related Documentation

- [Brand Palette (Unified)](../design/theming/brand-palette-unified.html) - Color reference
- [Toast System](./TOAST-SYSTEM.md) - Success/error feedback patterns
- [Select Component](./SELECT-USAGE.md) - Dropdown patterns
- [Error Handling UX](./ERROR-HANDLING-UX.md) - Error display patterns

---

**Version:** 1.0
**Contributors:** Claude + Joel Coleman
**Last Review:** November 17, 2024

# Release Notes Format

**Simple, consistent format for release note summaries across all versions.**

---

## Template

```markdown
## Release v[VERSION] - [2-4 Word Title]

**Released:** [Month Day, Year]
**Tests:** [X] passing ([frontend] frontend, [backend] backend) | [skipped] skipped

### Summary
[1-2 sentence overview: what's new, why it matters, who benefits]

### What's New
- **[Feature/Fix Name]** - [One sentence: what it does, user benefit]
- **[Feature/Fix Name]** - [One sentence: what it does, user benefit]
- **[Feature/Fix Name]** - [One sentence: what it does, user benefit]

### Technical Changes
- [Component/System]: [What changed, why]
- [Database/API/etc]: [What changed, why]

### Fixes
- Fixed [issue] that caused [problem]
- Resolved [issue] affecting [users/systems]

---
**Full Details:** See CHANGELOG.md
```

---

## Guidelines

### Title Format
- **Full Pattern:** `v[VERSION] - [Descriptive Title]`
- **Important:** Always include version number with "v" prefix, then hyphen with spaces, then description
- **Description Length:** 2-4 words max
- **Style:** Title Case, user-focused
- **Examples:**
  - ✅ "v3.4.4 - User Management & Account Control"
  - ✅ "v3.3.9 - Analytics Dashboard Reorganization"
  - ✅ "v3.3.3 - GitHub Integration"
  - ✅ "v2.7.0 - Dark Mode"
  - ❌ "User Management & Account Control" (missing version number)
  - ❌ "v3.4.4: User Management" (wrong separator - use hyphen with spaces)
  - ❌ "Various Updates" (too vague)
  - ❌ "Fix bugs and add features" (not descriptive)

### Summary Section
- **Length:** 1-2 sentences
- **Focus:** What changed, who benefits, why it matters
- **Voice:** Active, present tense
- **Example:**
  > Complete administrative user management system with suspension, deletion scheduling, and role management. Admins can now control user access with granular actions while maintaining comprehensive audit trails.

### What's New Section
- **Format:** Bullet list with bold feature names
- **Content:** User-facing changes only (no technical implementation)
- **Style:** "Feature Name - What it does, benefit"
- **Examples:**
  - **User Management Page** - Admins can search, filter, and manage all users from a single interface with real-time updates
  - **Account Suspension** - Instantly block user access without deleting data, with detailed suspension notices
  - **Role Management** - Change user roles with self-protection and automatic audit logging

### Technical Changes Section
- **When to include:** Database migrations, API changes, architecture updates
- **When to skip:** Internal refactoring with no external impact
- **Format:** `Component: Change description`
- **Examples:**
  - Database: Added suspension fields (suspended, suspended_at, suspension_reason)
  - API: New endpoints for suspension/unsuspend actions with admin-only access
  - Auth: Suspended users blocked at login with 403 response

### Fixes Section
- **Format:** "Fixed [issue] that caused [problem]"
- **Focus:** User-visible bugs only
- **Examples:**
  - Fixed search input background in dark mode
  - Resolved timing issues in ContactSalesModal tests causing CI failures
  - Fixed migration checksum validation errors blocking deployments

---

## Size Variations

### Major Release (v3.0.0, v4.0.0)
Use full template with all sections, 3-5 items per section

### Minor Release (v3.4.0, v3.5.0)
Use full template, 2-4 items in "What's New"

### Patch Release (v3.4.1, v3.4.2)
Simplified format:

```markdown
## Release v[VERSION] - [Title]

**Released:** [Date]

### Summary
[1 sentence: what was fixed/improved]

### Changes
- [Change 1]
- [Change 2]

### Fixes
- Fixed [issue 1]
- Fixed [issue 2]
```

---

## Real Examples

### Example 1: Major Feature Release

```markdown
## Release v3.4.4 - User Management & Account Control

**Released:** January 14, 2026
**Tests:** 4,133 passing (2,082 frontend, 2,051 backend) | 106 skipped

### Summary
Complete administrative user management system with suspension, deletion scheduling, role management, and full audit logging. Admins can now control user access with granular actions while maintaining comprehensive audit trails.

### What's New
- **User Management Page** - Search, filter, and manage all users from `/admin/users` with real-time updates
- **Account Suspension** - Instantly block user access without deleting data, with detailed suspension notices
- **Deletion Scheduling** - Schedule account deletion with configurable grace periods (1-90 days)
- **Role Management** - Change user roles with self-protection preventing admins from demoting themselves
- **Trial Granting** - Admins can grant Pro/Team trials to users with custom durations

### Technical Changes
- Database: Added suspension fields (suspended, suspended_at, suspension_reason) via migration 053
- Database: Renamed audit log column changed_by_id to changed_by via migration 054
- API: Four new admin endpoints for suspension, deletion scheduling, and trial granting
- Email: Three new templates for suspension, unsuspension, and admin-granted trials
- Auth: Suspended users blocked at login with 403 response

### Fixes
- Fixed migration 015 checksum validation errors blocking production deployments
- Fixed ContactSalesModal timing issues causing CI test failures

---
**Full Details:** See CHANGELOG.md for complete changes (6,178 lines added, 48 new tests, 21 files changed)
```

### Example 2: Minor Feature Release

```markdown
## Release v3.3.9 - Analytics Dashboard Reorganization

**Released:** January 9, 2026
**Tests:** 4,100 passing (2,065 frontend, 2,035 backend) | 102 skipped

### Summary
Reorganized Analytics dashboard into user-journey groups with model filtering for clearer insights into system usage and performance.

### What's New
- **Usage Tab Reorganization** - Metrics grouped into 5 user-journey categories for easier analysis
- **Model Filtering** - Filter analytics by Claude/OpenAI models to track provider usage

### Technical Changes
- Analytics: Refactored event categorization into workflow stages
- UI: Added model dropdown filter with multi-select support

---
**Full Details:** See CHANGELOG.md
```

### Example 3: Patch Release

```markdown
## Release v3.4.5 - Migration & Test Fixes

**Released:** January 14, 2026
**Tests:** 4,133 passing (2,082 frontend, 2,051 backend) | 106 skipped

### Summary
Fixed migration checksum validation errors and ContactSalesModal timing issues blocking deployments.

### Changes
- Restored migration 015 to production version (v3.4.3) matching deployed checksum
- Updated migration 054 to rename changed_by_id column correctly
- Fixed dev database checksums to match production

### Fixes
- Fixed migration 015 checksum validation error: c6b754d70425272525c91cfb71369b5f vs 296e840dfe5c92a0bc536ffbf79eee86
- Fixed ContactSalesModal test timing issues (4 occurrences of waitFor + getByText replaced with findByText)
- Resolved Vercel deployment failures due to migration validation

---
**Full Details:** See CHANGELOG.md
```

---

## Checklist

Before finalizing release notes:

- [ ] Version number follows semver (major.minor.patch)
- [ ] Title is 2-4 words and user-focused
- [ ] Summary is 1-2 sentences covering what/why/who
- [ ] "What's New" focuses on user capabilities (no technical jargon)
- [ ] Technical changes separated from user features
- [ ] Test counts are accurate and current
- [ ] Date is correct (EST/EDT timezone)
- [ ] All sections use consistent formatting
- [ ] Links to CHANGELOG.md included
- [ ] No emojis (unless specifically requested by user)

---

## Where to Use

1. **Git Tag Messages** - Use simplified version (summary + 3-5 key bullets)
2. **CHANGELOG.md** - Use full detailed format with all sections
3. **GitHub Releases** - Use full format
4. **Roadmap Updates** - Use "What's New" section content only (user-focused)
5. **Commit Messages** - Use summary line only

---

## Anti-Patterns to Avoid

❌ **Too Technical in User Sections:**
> "Added POST /api/admin/users/:userId/suspend endpoint with suspension_reason field"

✅ **Better:**
> "Admins can now suspend user accounts with detailed reason tracking"

---

❌ **Too Vague:**
> "Various improvements and bug fixes"

✅ **Better:**
> "Fixed migration validation errors and test timing issues blocking deployments"

---

❌ **Missing Context:**
> "Updated admin.js"

✅ **Better:**
> "API: Added four new admin endpoints for user management actions"

---

❌ **Implementation Details in Summary:**
> "Refactored ContactSalesModal tests to use findByText instead of waitFor with getByText for better async handling"

✅ **Better:**
> "Fixed ContactSalesModal test timing issues causing CI failures"

---

**Last Updated:** January 14, 2026
**Template Version:** 1.0.0

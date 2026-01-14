# User Management Guide

**Admin Tool**: Comprehensive user management for CodeScribe AI
**Access**: Admin, Support, and Super Admin roles only
**Location**: `/admin/users`
**Version**: 3.4.3

---

## Overview

The User Management page provides administrators with complete control over user accounts, including role management, account suspension, and deletion scheduling. All administrative actions are logged in the audit trail for accountability.

### Key Features

- **User List Management**: View, search, and filter all platform users
- **Role Management**: Assign and modify user roles (user, support, admin, super_admin)
- **Account Suspension**: Temporarily suspend accounts with reason tracking
- **Deletion Scheduling**: Schedule account deletion with configurable grace periods
- **Trial Management**: Grant trial access to users
- **Audit Logging**: All actions automatically logged with timestamps and reasons

---

## User Statuses

The system tracks four distinct user statuses:

### 1. Active
- Normal account state
- User has full access to their tier features
- No restrictions or scheduled actions

### 2. Suspended
- Account is temporarily blocked
- User cannot log in or access any features
- Auth middleware blocks suspended users at login
- Can be reversed with unsuspension
- Requires reason for accountability

### 3. Deletion Scheduled
- Account is scheduled for permanent deletion
- User still has access until deletion date
- Grace period: 1-90 days (default: 30 days)
- Can be cancelled before deletion date
- System displays countdown in user status

### 4. Deleted
- Account permanently deleted (tombstone record)
- User data anonymized or removed per privacy policy
- Cannot be reversed
- Audit log preserved for compliance

### Combined States
Users can have both **Suspended** and **Deletion Scheduled** status simultaneously:
- Account is immediately blocked (suspended)
- AND scheduled for deletion after grace period
- Allows immediate action while preserving data temporarily

---

## User List Features

### Search and Filtering

**Search by Email or Name:**
- Real-time search with 400ms debounce
- Searches email, first_name, and last_name fields
- Case-insensitive partial matching

**Filter by Tier:**
- All Tiers (default)
- Free
- Starter
- Pro
- Team
- Enterprise

**Filter by Role:**
- All Roles (default)
- User
- Support
- Admin
- Super Admin

**Filter by Status:**
- All Statuses (default)
- Active
- Suspended
- Deletion Scheduled
- Deleted

### Sorting

Click column headers to sort by:
- Email
- Name (first_name)
- Role
- Tier
- Status (Active → Suspended → Deletion Scheduled → Deleted)
- Generations (total_generations)
- Created date

### Pagination

- 50 users per page
- Navigate with Previous/Next buttons
- Displays total count and page number

---

## Administrative Actions

### Edit User Role

**Access**: Admin, Support, Super Admin
**Restrictions**: Admins cannot demote themselves to 'user'

**Steps:**
1. Click "Edit Role" in user actions menu
2. Select new role from dropdown
3. Enter reason (minimum 10 characters)
4. Click "Update Role"

**Roles:**
- **User**: Standard user access
- **Support**: Can view admin tools, manage user issues
- **Admin**: Full administrative access
- **Super Admin**: Highest access level (future use)

**Audit Log:**
- Field: `role`
- Old value: Previous role
- New value: New role
- Changed by: Admin user ID
- Reason: Required justification

### Suspend Account

**Access**: Admin, Support, Super Admin
**Purpose**: Temporarily block account access

**Steps:**
1. Click "Suspend Account" in user actions menu
2. Enter suspension reason (minimum 10 characters)
3. Click "Suspend Account"

**Effects:**
- User immediately blocked from login
- Sets `suspended = true`, `suspended_at = NOW()`, `suspension_reason`
- Auth middleware returns 403 error on login attempts
- Email notification sent to user
- Status badge changes to "Suspended" (amber)

**Audit Log:**
- Field: `suspended`
- Old value: `false`
- New value: `true`
- Reason: Suspension justification

### Unsuspend Account

**Access**: Admin, Support, Super Admin
**Purpose**: Restore access to suspended account

**Steps:**
1. Click "Unsuspend Account" in user actions menu
2. Enter unsuspension reason (minimum 10 characters)
3. Click "Unsuspend Account"

**Effects:**
- User can log in immediately
- Clears `suspended = false`, `suspended_at = null`, `suspension_reason = null`
- Email notification sent to user
- Status badge returns to "Active" (green)

**Note**: Unsuspension does NOT affect deletion schedule. If account is also scheduled for deletion, that must be cancelled separately.

**Audit Log:**
- Field: `suspended`
- Old value: `true`
- New value: `false`
- Reason: Unsuspension justification

### Schedule Deletion

**Access**: Admin, Support, Super Admin
**Purpose**: Schedule account for permanent deletion with grace period

**Steps:**
1. Click "Schedule Deletion" in user actions menu
2. Enter deletion reason (minimum 10 characters)
3. Set grace period in days (1-90, default: 30)
4. Click "Schedule Deletion"

**Effects:**
- Sets `deletion_scheduled_at` to future date
- User retains access until deletion date
- Status badge shows "Deletion Scheduled" (red) with date
- Email notification sent to user
- System cron job deletes account when date reached

**Grace Period Guidelines:**
- **7 days**: Standard account closure
- **30 days**: Default for most cases
- **60-90 days**: High-value accounts, compliance requirements

**Audit Log:**
- Field: `deletion_scheduled_at`
- Old value: `null`
- New value: Scheduled deletion date
- Reason: Deletion justification

### Cancel Deletion

**Access**: Admin, Support, Super Admin
**Purpose**: Cancel scheduled deletion before it occurs

**Steps:**
1. Click "Cancel Deletion" in user actions menu
2. Enter cancellation reason (minimum 10 characters)
3. Click "Cancel Deletion"

**Effects:**
- Clears `deletion_scheduled_at = null`
- Account no longer scheduled for deletion
- Status badge updates (removes "Deletion Scheduled")
- Email notification sent to user

**Note**: Cancel deletion does NOT unsuspend the account. If account is suspended, that must be handled separately.

**Audit Log:**
- Field: `deletion_scheduled_at`
- Old value: Previous scheduled date
- New value: `null`
- Reason: Cancellation justification

### Grant Trial

**Access**: Admin, Support, Super Admin
**Purpose**: Manually grant trial tier access to users

**Steps:**
1. Click "Grant Trial" in user actions menu
2. Select trial tier (Pro or Team)
3. Set duration in days (1-90)
4. Enter reason (minimum 10 characters)
5. Click "Grant Trial"

**Effects:**
- Creates entry in `user_trials` table with source='admin_grant'
- User gains trial tier access immediately
- Trial expires after duration
- Email notification sent to user
- Trial status shows in Users table

**Validation:**
- User cannot have multiple active trials
- Duration must be 1-90 days

**Audit Log:**
- Trial creation logged separately in trial management system
- Admin action tracked in admin activity log

---

## Statistics Dashboard

The page displays four key metrics:

### Total Users
- Count of all users in system
- Includes active, suspended, and deleted accounts
- Icon: Users (multiple people)

### Active Users
- Users with no suspension or deletion scheduled
- Actively using the platform
- Icon: CheckCircle (green checkmark)

### Admin Users
- Count of users with admin/support/super_admin roles
- Administrative staff monitoring
- Icon: Shield (protection symbol)

### Trial Users
- Users currently on trial tier access
- Includes admin-granted and campaign-based trials
- Icon: Sparkles (premium feature indicator)

**Refresh:** Click "Refresh" button to update stats and user list

---

## Audit Trail

All administrative actions are automatically logged to the `user_audit_log` table:

### Logged Fields
- `user_id`: Affected user
- `user_email`: Denormalized email (preserved if user deleted)
- `changed_by`: Admin who made the change
- `field_name`: Which field changed (role, suspended, deletion_scheduled_at)
- `old_value`: Previous value
- `new_value`: New value
- `reason`: Required justification
- `changed_at`: Timestamp
- `metadata`: Additional context (IP, user agent, etc.)

### Viewing Audit Logs

**Per User:**
1. Navigate to user's profile (future feature)
2. View "Audit History" tab
3. See chronological list of all changes

**System-Wide:**
1. Admin Analytics page (future feature)
2. Filter by field_name, changed_by, date range
3. Export audit reports

### Audit Log Retention
- Logs are permanent and cannot be deleted
- ON DELETE RESTRICT: Cannot hard-delete users with audit history
- Soft delete recommended (sets `deleted_at` timestamp)

---

## Best Practices

### Suspension Guidelines

**When to Suspend:**
- Terms of Service violations
- Suspicious activity (spam, abuse)
- Account security compromise
- Payment disputes requiring investigation
- Temporary hold during compliance review

**Reason Requirements:**
- Be specific and factual
- Include violation type or evidence
- Reference support ticket if applicable
- Avoid vague reasons like "bad user" or "spam"

**Good Example:**
```
Terms of Service violation - User sent 500+ spam emails to other users
on 2025-01-13. Support ticket #1234. Email logs attached to ticket.
```

**Bad Example:**
```
spam
```

### Deletion Scheduling Guidelines

**When to Schedule Deletion:**
- User requested account closure
- Abandoned account cleanup (>2 years inactive)
- GDPR/CCPA deletion requests (30-day minimum)
- Persistent Terms violations after warnings
- Fraudulent account detected

**Grace Period Selection:**
- **7 days**: User-requested, no compliance concerns
- **30 days**: Standard deletion, allows time for reconsideration
- **60 days**: Business accounts, data backup requirements
- **90 days**: Legal/compliance holds, investigation period

**Reason Requirements:**
- Document deletion trigger (user request, policy, legal)
- Include ticket/case number if applicable
- Note any data retention requirements
- Reference compliance framework if applicable

**Good Example:**
```
User submitted account closure request via support ticket #5678 on 2025-01-13.
No active subscriptions. 30-day grace period per standard policy.
GDPR Article 17 (right to erasure) compliance.
```

### Role Management Guidelines

**Role Assignment:**
- **User**: Default role, standard platform access
- **Support**: Customer service team, can view (not edit) admin tools
- **Admin**: Engineering/operations team, full access
- **Super Admin**: Reserved for founders/executives, rarely used

**Self-Demotion Protection:**
- System prevents admins from demoting themselves to 'user'
- Prevents accidental lockout
- Requires another admin to change role if needed

**Reason Requirements:**
- Include reason for promotion/demotion
- Reference HR approval if applicable
- Note team/department assignment

### Trial Granting Guidelines

**When to Grant Trials:**
- Customer support escalations (user experiencing tier limits)
- Sales demos and proof-of-concept testing
- Partnership/integration testing
- Influencer/reviewer access
- Bug reproduction requiring higher tier

**Duration Selection:**
- **7 days**: Quick testing, support troubleshooting
- **14 days**: Sales demos, POC validation
- **30 days**: Partnership testing, integration development
- **60-90 days**: Long-term partnerships, strategic accounts

**Reason Requirements:**
- Include purpose and requestor
- Reference support ticket or sales opportunity
- Note expected trial outcome

---

## Security Considerations

### Admin-Only Access
- All user management endpoints require `requireAdmin` middleware
- Roles allowed: admin, support, super_admin
- User role: 403 Forbidden

### Self-Protection
- Admins cannot demote their own role to 'user'
- Prevents accidental lockout
- System enforces this server-side (not just UI)

### Audit Logging
- All changes logged automatically via database trigger
- Cannot be bypassed or disabled
- Immutable audit trail for compliance

### Reason Requirements
- All destructive actions require justification
- Minimum 10 characters enforced
- Promotes accountability and documentation

### Rate Limiting
- Standard API rate limits apply
- Prevents bulk suspension/deletion abuse
- Monitor for unusual activity patterns

### Authorization Checks
- Bearer token authentication (not cookies)
- Token must be valid and unexpired
- User must have admin/support/super_admin role

---

## Common Workflows

### Workflow 1: Handle Terms of Service Violation

1. **Investigate**: Review user activity, support tickets, logs
2. **Document**: Gather evidence, create internal case
3. **Suspend**: Click "Suspend Account" → Enter detailed reason
4. **Notify**: System sends suspension email automatically
5. **Monitor**: Wait for user appeal or resolution
6. **Resolve**: Either unsuspend (if appeal approved) or schedule deletion (if violation confirmed)

### Workflow 2: Process Account Closure Request

1. **Verify**: Confirm user identity and closure request
2. **Check**: Review active subscriptions (cancel if needed)
3. **Schedule**: Click "Schedule Deletion" → 30-day grace period
4. **Document**: Enter reason referencing support ticket
5. **Notify**: System sends deletion confirmation email
6. **Wait**: Grace period allows user to cancel if needed
7. **Cleanup**: Cron job automatically deletes account after 30 days

### Workflow 3: Grant Support Trial for Troubleshooting

1. **Assess**: User reports Pro-tier feature issue
2. **Grant**: Click "Grant Trial" → Pro tier, 7 days
3. **Document**: Reason: "Support ticket #1234 - Reproducing API limit issue"
4. **Test**: User tests Pro features with support team
5. **Resolve**: Issue fixed or identified
6. **Expire**: Trial expires automatically after 7 days

### Workflow 4: Respond to User Appeal

1. **Review**: User appeals suspension via support
2. **Investigate**: Re-examine evidence and reason
3. **Decide**: Approve or deny appeal
4. **Unsuspend** (if approved): Click "Unsuspend Account" → Enter reason
5. **Document**: Update support ticket with decision
6. **Notify**: System sends unsuspension confirmation

### Workflow 5: Emergency Account Lockout

1. **Detect**: Security team identifies compromised account
2. **Act Fast**: Click "Suspend Account" immediately
3. **Document**: Reason: "Security incident #5678 - Compromised credentials"
4. **Notify**: Contact user via alternate channel (phone, secondary email)
5. **Secure**: User resets password, verifies identity
6. **Restore**: Click "Unsuspend Account" after verification

---

## Keyboard Shortcuts

- **Search**: `/` (focus search input)
- **Refresh**: `Ctrl/Cmd + R` (refresh data)
- **Escape**: Close open modals
- **Tab**: Navigate form fields
- **Enter**: Submit focused form

---

## Troubleshooting

### Issue: Cannot find user in list
**Solution:**
- Check status filter (default is "All Statuses")
- Verify spelling in search
- Try searching by email instead of name
- Check if user is deleted (switch to "Deleted" filter)

### Issue: "Unauthorized" error when trying to edit user
**Solution:**
- Verify you have admin/support role
- Check if auth token is expired (logout and login)
- Ensure you're not trying to demote your own account

### Issue: "User has audit history" error when trying to delete
**Solution:**
- User has audit log entries (ON DELETE RESTRICT)
- Use soft delete instead (schedule deletion)
- Contact database admin for hard delete if absolutely necessary

### Issue: Suspension not blocking user login
**Solution:**
- Verify `suspended = true` in database
- Check auth middleware is active (`requireAuth`)
- Clear user's JWT token (they may have cached token)
- Force logout on frontend by clearing localStorage

### Issue: Stats not updating after action
**Solution:**
- Click "Refresh" button to reload stats
- Check if action completed successfully (look for toast notification)
- Verify database was updated (check audit log)

---

## API Endpoints

All endpoints require Bearer token authentication and admin/support/super_admin role.

### GET /api/admin/users
**Purpose**: List users with pagination and filters

**Query Parameters:**
- `page` (integer, default: 1)
- `limit` (integer, default: 50, max: 100)
- `search` (string): Email or name search
- `tier` (string): Filter by tier
- `role` (string): Filter by role
- `status` (string): active, suspended, scheduled, deleted, or all
- `sortBy` (string): Column to sort by
- `sortOrder` (string): asc or desc

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "user",
      "tier": "free",
      "suspended": false,
      "deleted_at": null,
      "deletion_scheduled_at": null,
      "email_verified": true,
      "total_generations": 42,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

### GET /api/admin/users/stats
**Purpose**: Get user statistics for dashboard

**Response:**
```json
{
  "success": true,
  "data": {
    "total_users": 1000,
    "active_users": 850,
    "admin_users": 10,
    "trial_users": 25
  }
}
```

### PATCH /api/admin/users/:userId/role
**Purpose**: Update user role

**Body:**
```json
{
  "role": "admin",
  "reason": "Promoted to admin for customer support team"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "admin",
    "updated_at": "2025-01-13T00:00:00Z"
  }
}
```

### POST /api/admin/users/:userId/suspend
**Purpose**: Suspend user account

**Body:**
```json
{
  "reason": "Terms of Service violation - spam activity"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "suspended": true,
    "suspended_at": "2025-01-13T00:00:00Z",
    "suspension_reason": "Terms of Service violation - spam activity"
  }
}
```

### POST /api/admin/users/:userId/unsuspend
**Purpose**: Unsuspend user account

**Body:**
```json
{
  "reason": "Appeal approved - false positive spam detection"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "suspended": false,
    "suspended_at": null,
    "suspension_reason": null
  }
}
```

### POST /api/admin/users/:userId/schedule-deletion
**Purpose**: Schedule account deletion

**Body:**
```json
{
  "reason": "User requested account closure via support ticket #1234",
  "gracePeriodDays": 30
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "deletion_scheduled_at": "2025-02-12T00:00:00Z"
  }
}
```

### POST /api/admin/users/:userId/cancel-deletion
**Purpose**: Cancel scheduled deletion

**Body:**
```json
{
  "reason": "User appeal approved - account restored"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "deletion_scheduled_at": null
  }
}
```

### POST /api/admin/users/:userId/grant-trial
**Purpose**: Grant trial tier access

**Body:**
```json
{
  "trialTier": "pro",
  "durationDays": 14,
  "reason": "Support ticket #5678 - Testing Pro features for bug reproduction"
}
```

**Response:**
```json
{
  "success": true,
  "trial": {
    "id": 1,
    "user_id": 1,
    "tier": "pro",
    "source": "admin_grant",
    "started_at": "2025-01-13T00:00:00Z",
    "expires_at": "2025-01-27T00:00:00Z"
  }
}
```

---

## Database Schema Reference

### users table
```sql
id INTEGER PRIMARY KEY
email VARCHAR(255) UNIQUE NOT NULL
first_name VARCHAR(100)
last_name VARCHAR(100)
role VARCHAR(50) DEFAULT 'user' -- user, support, admin, super_admin
tier VARCHAR(50) DEFAULT 'free'
suspended BOOLEAN DEFAULT FALSE
suspended_at TIMESTAMPTZ
suspension_reason TEXT
deletion_scheduled_at TIMESTAMPTZ
deleted_at TIMESTAMPTZ
email_verified BOOLEAN DEFAULT FALSE
total_generations INTEGER DEFAULT 0
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

### user_audit_log table
```sql
id SERIAL PRIMARY KEY
user_id INTEGER REFERENCES users(id) ON DELETE RESTRICT
user_email VARCHAR(255) -- Denormalized
changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL
field_name VARCHAR(100) -- role, suspended, deletion_scheduled_at, etc.
old_value TEXT
new_value TEXT
change_type VARCHAR(50) DEFAULT 'update' -- update, delete, restore
reason TEXT
changed_at TIMESTAMPTZ DEFAULT NOW()
metadata JSONB DEFAULT '{}'
```

---

## Related Documentation

- **Campaign Management**: [CAMPAIGN-MANAGEMENT-GUIDE.md](./CAMPAIGN-MANAGEMENT-GUIDE.md)
- **Trial System**: [Trial Architecture](../architecture/TIER-ARCHITECTURE.md)
- **Admin Analytics**: [ADMIN-USAGE-STATS.md](./ADMIN-USAGE-STATS.md)
- **Database Migrations**: [DB-MIGRATION-MANAGEMENT.md](../database/DB-MIGRATION-MANAGEMENT.md)
- **Authentication**: [EMAIL-VERIFICATION-SYSTEM.md](../authentication/EMAIL-VERIFICATION-SYSTEM.md)

---

## Version History

- **v3.4.3** (2026-01-13): Initial user management system with suspension/deletion separation
- Future: Bulk operations, user impersonation, advanced audit search

---

## Support

For issues or questions:
- **Technical**: support@codescribeai.com
- **Security**: security@codescribeai.com
- **Documentation**: See [CLAUDE.md](../../CLAUDE.md) for full documentation index

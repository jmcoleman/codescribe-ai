# Admin Usage Statistics API

**Version:** 1.0
**Created:** November 7, 2025
**Access Level:** Admin Only

---

## Overview

The admin usage statistics API provides comprehensive insights into anonymous (IP-based) and authenticated user usage patterns. This is useful for monitoring application usage, identifying patterns, and tracking growth.

---

## Setup

### 1. Add Your Email to Admin List

Edit `server/src/routes/admin.js` and add your email to the `ADMIN_EMAILS` array:

```javascript
const ADMIN_EMAILS = [
  'your-email@example.com', // Replace with your actual email
];
```

**Important:** Only emails in this list can access the admin endpoints.

### 2. Ensure You're Authenticated

You must be logged in with an admin email to access these endpoints. The endpoints require both:
- ✅ Valid authentication session (`requireAuth` middleware)
- ✅ Admin email in the `ADMIN_EMAILS` list (`requireAdmin` middleware)

---

## Endpoints

### 1. Get Overall Usage Statistics

**Endpoint:** `GET /api/admin/usage-stats`

**Description:** Get comprehensive usage statistics for both anonymous and authenticated users

**Authentication:** Required (must be admin)

**Response:**

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalIPs": 245,
      "totalUsers": 128,
      "totalGenerations": 1842,
      "anonymousGenerations": 412,
      "authenticatedGenerations": 1430,
      "anonymousPercentage": 22.4,
      "authenticatedPercentage": 77.6
    },
    "last24Hours": {
      "activeIPs": 34,
      "generations": 67
    },
    "topIPs": [
      {
        "ipAddress": "192.168.1.100",
        "totalGenerations": 45,
        "lastActivity": "2025-11-07T14:32:12.000Z",
        "daysActive": 3
      },
      // ... up to 10 IPs
    ],
    "recentActivity": [
      {
        "ipAddress": "192.168.1.105",
        "dailyCount": 2,
        "monthlyCount": 8,
        "lastActivity": "2025-11-07T15:20:00.000Z",
        "periodStart": "2025-11-01",
        "firstSeen": "2025-11-03T10:15:00.000Z"
      },
      // ... up to 50 records
    ]
  },
  "timestamp": "2025-11-07T15:45:00.000Z"
}
```

**Data Breakdown:**

| Field | Description |
|-------|-------------|
| **summary** | Overall statistics for current billing period |
| `totalIPs` | Unique anonymous IP addresses tracked |
| `totalUsers` | Unique authenticated users |
| `totalGenerations` | Total generations (anonymous + authenticated) |
| `anonymousPercentage` | Percentage of generations from anonymous users |
| **last24Hours** | Recent activity metrics |
| `activeIPs` | IPs with activity in last 24 hours |
| `generations` | Total anonymous generations in last 24 hours |
| **topIPs** | Top 10 IPs by usage (last 7 days) |
| **recentActivity** | Last 50 anonymous user activities |

---

### 2. Get Specific IP Statistics

**Endpoint:** `GET /api/admin/usage-stats/ip/:ipAddress`

**Description:** Get detailed usage history for a specific IP address

**Authentication:** Required (must be admin)

**Parameters:**
- `ipAddress` (path parameter): The IP address to look up

**Example:** `GET /api/admin/usage-stats/ip/192.168.1.100`

**Response:**

```json
{
  "success": true,
  "data": {
    "ipAddress": "192.168.1.100",
    "summary": {
      "totalGenerations": 127,
      "periodsActive": 3,
      "firstSeen": "2025-09-15T08:30:00.000Z",
      "lastActivity": "2025-11-07T14:32:12.000Z"
    },
    "history": [
      {
        "periodStart": "2025-11-01",
        "dailyCount": 2,
        "monthlyCount": 45,
        "lastActivity": "2025-11-07T14:32:12.000Z",
        "createdAt": "2025-11-01T00:00:00.000Z",
        "updatedAt": "2025-11-07T14:32:12.000Z"
      },
      {
        "periodStart": "2025-10-01",
        "dailyCount": 0,
        "monthlyCount": 38,
        "lastActivity": "2025-10-29T18:15:00.000Z",
        "createdAt": "2025-10-05T00:00:00.000Z",
        "updatedAt": "2025-10-29T18:15:00.000Z"
      },
      // ... all historical periods
    ]
  },
  "timestamp": "2025-11-07T15:45:00.000Z"
}
```

**Use Cases:**
- Investigate heavy users
- Check if IP has migrated to authenticated account
- Identify potential abuse patterns
- Track usage trends over time

---

## Usage Examples

### Using cURL

```bash
# Get overall statistics (must be logged in)
curl -X GET http://localhost:3000/api/admin/usage-stats \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"

# Get specific IP statistics
curl -X GET http://localhost:3000/api/admin/usage-stats/ip/192.168.1.100 \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

### Using Browser Console

```javascript
// Get overall statistics
fetch('/api/admin/usage-stats', {
  credentials: 'include'
})
  .then(res => res.json())
  .then(data => console.table(data.data.topIPs));

// Get specific IP statistics
fetch('/api/admin/usage-stats/ip/192.168.1.100', {
  credentials: 'include'
})
  .then(res => res.json())
  .then(data => console.log(data));
```

### Using React (Future Frontend Implementation)

```jsx
import { useState, useEffect } from 'react';

function AdminUsageStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/usage-stats', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats(data.data);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to fetch usage stats:', error);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!stats) return <div>Failed to load stats</div>;

  return (
    <div>
      <h1>Usage Statistics</h1>

      <section>
        <h2>Summary</h2>
        <p>Total IPs: {stats.summary.totalIPs}</p>
        <p>Total Users: {stats.summary.totalUsers}</p>
        <p>Anonymous: {stats.summary.anonymousPercentage}%</p>
        <p>Authenticated: {stats.summary.authenticatedPercentage}%</p>
      </section>

      <section>
        <h2>Top IPs (Last 7 Days)</h2>
        <table>
          <thead>
            <tr>
              <th>IP Address</th>
              <th>Generations</th>
              <th>Days Active</th>
              <th>Last Activity</th>
            </tr>
          </thead>
          <tbody>
            {stats.topIPs.map(ip => (
              <tr key={ip.ipAddress}>
                <td>{ip.ipAddress}</td>
                <td>{ip.totalGenerations}</td>
                <td>{ip.daysActive}</td>
                <td>{new Date(ip.lastActivity).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
```

---

## Security Considerations

### Access Control

1. **Double Authentication**: Requires both valid session AND admin email
2. **Email Whitelist**: Only emails in `ADMIN_EMAILS` array can access
3. **No Public Access**: Endpoints return 401 (unauthenticated) or 403 (not admin)

### Data Privacy

- **IP Addresses**: Visible to admins for usage tracking
- **No PII**: No user names, emails, or other personal data exposed for anonymous users
- **Aggregation**: Stats are designed for aggregate analysis, not individual tracking

### Recommended Practices

1. **Limit Admin Access**: Only add trusted admin emails to the list
2. **Use HTTPS**: Always access in production over encrypted connection
3. **Log Access**: Consider adding audit logging for admin endpoint access
4. **Rate Limit**: Consider adding rate limiting for admin endpoints (not currently implemented)

---

## Database Schema Reference

### anonymous_quotas Table

```sql
CREATE TABLE IF NOT EXISTS anonymous_quotas (
  id SERIAL PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,          -- Supports IPv4 and IPv6
  daily_count INTEGER DEFAULT 0 NOT NULL,
  monthly_count INTEGER DEFAULT 0 NOT NULL,
  last_reset_date TIMESTAMP NOT NULL DEFAULT NOW(),
  period_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_ip_period UNIQUE (ip_address, period_start_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_anonymous_quotas_ip_period
  ON anonymous_quotas(ip_address, period_start_date);

CREATE INDEX IF NOT EXISTS idx_anonymous_quotas_last_reset
  ON anonymous_quotas(last_reset_date);
```

### Quota Reset Logic

- **Daily Reset**: Happens at midnight UTC (lazy reset on next request)
- **Monthly Reset**: First day of each month (lazy reset on next request)
- **period_start_date**: Tracks which billing period the record belongs to

---

## Troubleshooting

### 403 Forbidden Error

```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Admin access required"
}
```

**Cause:** Your email is not in the `ADMIN_EMAILS` list or you're not authenticated

**Solution:**
1. Make sure you're logged in
2. Add your email to `server/src/routes/admin.js` in the `ADMIN_EMAILS` array
3. Restart the server

### 401 Unauthorized Error

**Cause:** Not authenticated

**Solution:** Log in first, then access the admin endpoints

### Empty Data

If `totalIPs: 0` or `recentActivity: []`:

**Possible Causes:**
1. No anonymous users have used the app yet
2. Viewing wrong billing period (data resets monthly)
3. Database connection issues

**Check:**
```sql
-- Connect to database and run:
SELECT COUNT(*) FROM anonymous_quotas;
SELECT * FROM anonymous_quotas ORDER BY created_at DESC LIMIT 10;
```

---

## Future Enhancements

Potential features to add:

1. **Frontend Dashboard**: React admin page with charts and graphs
2. **Export Data**: CSV/JSON export functionality
3. **Date Range Filters**: View stats for specific date ranges
4. **Automated Reports**: Email weekly/monthly usage summaries
5. **Abuse Detection**: Flag IPs exceeding normal usage patterns
6. **Usage Trends**: Track growth over time with visualizations
7. **IP Geolocation**: Show geographic distribution of users
8. **Conversion Tracking**: Track which anonymous IPs convert to authenticated users

---

## Related Documentation

- [Usage Quota System](../database/USAGE-QUOTA-SYSTEM.md) - How quotas work
- [Usage Model](../../server/src/models/Usage.js) - Database model implementation
- [Auth Middleware](../../server/src/middleware/auth.js) - Authentication system

---

**Last Updated:** November 7, 2025
**Maintainer:** Admin Team

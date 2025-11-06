# Email Priority Filtering & SLA Management

Guide to setting up automated email sorting and priority management for CodeScribe AI support requests.

**Last Updated:** November 5, 2025
**Related:** [Email Templating Guide](../components/EMAIL-TEMPLATING-GUIDE.md) | [Email Rate Limiting](../security/EMAIL-RATE-LIMITING.md)

---

## Overview

CodeScribe AI support emails include custom headers that enable automatic priority-based sorting in Gmail and other email clients. This ensures urgent enterprise requests are handled within their 4-hour SLA while free-tier requests are addressed within 5 days.

### SLA Tiers

| Tier | Priority | SLA | Response Time |
|------|----------|-----|---------------|
| Enterprise | Urgent (1) | 4 hours | Same business day |
| Team | Urgent (1) | 4 hours | Same business day |
| Pro | High (2) | 24 hours | Next business day |
| Starter | Normal (3) | 48 hours | Within 2 business days |
| Free | Low (5) | 5 days | Within 5 business days |

### Email Headers

Every support email includes these custom headers:

```
X-Priority: 1                    # RFC standard priority (1=urgent, 5=low)
X-MSMail-Priority: High          # Outlook compatibility
Importance: high                 # General email client compatibility
X-CodeScribe-Tier: ENTERPRISE    # Custom tier header for filtering
X-CodeScribe-SLA: 4 hours        # Custom SLA header for tracking
```

**Benefits:**
- **Automatic sorting** in inbox by priority
- **Visual indicators** for urgent emails
- **Filter-based automation** for labels, stars, and forwarding
- **SLA tracking** via custom headers
- **No subject line clutter** - tier info in headers, not subject

---

## Gmail Filter Setup

### Option 1: Quick Setup (Manual Filters)

Create 4 filters in Gmail to organize support requests by tier/SLA:

#### 1. Enterprise/Team Urgent (4-hour SLA)

**Search query:**
```
from:(noreply@mail.codescribeai.com) (Tier:ENTERPRISE OR Tier:TEAM)
```

**Actions:**
- Apply label: `Support/Urgent-4hr`
- Star it
- Never send it to Spam
- Mark as important
- (Optional) Forward to: `urgent-support@yourdomain.com`

**Create filter:**
1. Gmail → Settings → Filters and Blocked Addresses → Create new filter
2. Paste search query in "Has the words" field
3. Click "Create filter"
4. Check boxes for desired actions
5. Click "Create filter"

---

#### 2. Pro High Priority (24-hour SLA)

**Search query:**
```
from:(noreply@mail.codescribeai.com) Tier:PRO
```

**Actions:**
- Apply label: `Support/High-24hr`
- Star it
- Never send it to Spam
- Mark as important

---

#### 3. Starter Normal Priority (48-hour SLA)

**Search query:**
```
from:(noreply@mail.codescribeai.com) Tier:STARTER
```

**Actions:**
- Apply label: `Support/Normal-48hr`
- Never send it to Spam

---

#### 4. Free Low Priority (5-day SLA)

**Search query:**
```
from:(noreply@mail.codescribeai.com) Tier:FREE
```

**Actions:**
- Apply label: `Support/Low-5day`
- Never send it to Spam

---

### Option 2: Advanced Setup (Gmail Apps Script)

Automate SLA tracking and due date calculation with Apps Script.

**File:** `Code.gs`

```javascript
/**
 * CodeScribe AI Support Email Priority Manager
 *
 * Automatically processes support emails, calculates SLA due dates,
 * and applies labels based on tier priority.
 *
 * Setup:
 * 1. Gmail → Settings → "See all settings" → "Filters and Blocked Addresses"
 * 2. Create filter: to:support@codescribeai.com → Apply label "Support/Inbox"
 * 3. Apps Script → New Project → Paste this code
 * 4. Set trigger: Run "processNewSupportEmails" every 5 minutes
 */

function processNewSupportEmails() {
  // Get unprocessed support emails (those with Support/Inbox label)
  const label = GmailApp.getUserLabelByName('Support/Inbox');
  if (!label) {
    Logger.log('Label "Support/Inbox" not found. Create it first.');
    return;
  }

  const threads = label.getThreads();
  Logger.log(`Processing ${threads.length} new support emails...`);

  threads.forEach(thread => {
    const message = thread.getMessages()[0]; // Get first message in thread
    const headers = getCustomHeaders(message);

    if (!headers.tier) {
      Logger.log(`Skipping thread ${thread.getId()} - no tier header found`);
      return;
    }

    // Calculate SLA due date
    const slaInfo = getSLAInfo(headers.tier);
    const receivedDate = message.getDate();
    const dueDate = calculateDueDate(receivedDate, slaInfo.hours);

    // Apply tier-based label
    const tierLabel = GmailApp.getUserLabelByName(slaInfo.label);
    if (tierLabel) {
      thread.addLabel(tierLabel);
    } else {
      Logger.log(`Label "${slaInfo.label}" not found. Creating it...`);
      GmailApp.createLabel(slaInfo.label);
      thread.addLabel(GmailApp.getUserLabelByName(slaInfo.label));
    }

    // Apply due date label (for visual tracking)
    const dueDateStr = Utilities.formatDate(dueDate, Session.getScriptTimeZone(), 'MMM d, h:mm a');
    const dueDateLabel = `Support/Due: ${dueDateStr}`;
    thread.addLabel(createOrGetLabel(dueDateLabel));

    // Star urgent/high priority emails
    if (slaInfo.priority === 1 || slaInfo.priority === 2) {
      thread.markImportant();
      if (slaInfo.priority === 1) {
        thread.addStar(); // Star urgent (enterprise/team) emails
      }
    }

    // Remove from inbox label (processed)
    thread.removeLabel(label);

    Logger.log(`Processed: ${headers.tier} (SLA: ${slaInfo.hours}h, Due: ${dueDateStr})`);
  });
}

/**
 * Extract custom headers from email message
 */
function getCustomHeaders(message) {
  const rawContent = message.getRawContent();

  // Extract X-CodeScribe headers
  const tierMatch = rawContent.match(/X-CodeScribe-Tier:\s*(\w+)/i);
  const slaMatch = rawContent.match(/X-CodeScribe-SLA:\s*([\w\s]+)/i);

  return {
    tier: tierMatch ? tierMatch[1].toUpperCase() : null,
    sla: slaMatch ? slaMatch[1] : null
  };
}

/**
 * Get SLA configuration for tier
 */
function getSLAInfo(tier) {
  const slaConfig = {
    'ENTERPRISE': { priority: 1, hours: 4, label: 'Support/Urgent-4hr', color: 'red' },
    'TEAM': { priority: 1, hours: 4, label: 'Support/Urgent-4hr', color: 'red' },
    'PRO': { priority: 2, hours: 24, label: 'Support/High-24hr', color: 'orange' },
    'STARTER': { priority: 3, hours: 48, label: 'Support/Normal-48hr', color: 'yellow' },
    'FREE': { priority: 5, hours: 120, label: 'Support/Low-5day', color: 'gray' }
  };

  return slaConfig[tier] || slaConfig['FREE'];
}

/**
 * Calculate SLA due date (business hours only)
 *
 * Business hours: Mon-Fri, 9am-5pm EST
 * Excludes weekends and US holidays
 */
function calculateDueDate(startDate, hoursToAdd) {
  const BUSINESS_HOURS_PER_DAY = 8; // 9am-5pm
  const BUSINESS_START_HOUR = 9;
  const BUSINESS_END_HOUR = 17;

  let currentDate = new Date(startDate);
  let remainingHours = hoursToAdd;

  while (remainingHours > 0) {
    // Skip weekends
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(BUSINESS_START_HOUR, 0, 0, 0);
      continue;
    }

    // Get current hour
    const currentHour = currentDate.getHours();

    // If before business hours, jump to start of business day
    if (currentHour < BUSINESS_START_HOUR) {
      currentDate.setHours(BUSINESS_START_HOUR, 0, 0, 0);
      continue;
    }

    // If after business hours, jump to next business day
    if (currentHour >= BUSINESS_END_HOUR) {
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(BUSINESS_START_HOUR, 0, 0, 0);
      continue;
    }

    // Calculate hours remaining in current business day
    const hoursLeftToday = BUSINESS_END_HOUR - currentHour;

    if (remainingHours <= hoursLeftToday) {
      // SLA ends today
      currentDate.setHours(currentHour + remainingHours);
      remainingHours = 0;
    } else {
      // Continue to next business day
      remainingHours -= hoursLeftToday;
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(BUSINESS_START_HOUR, 0, 0, 0);
    }
  }

  return currentDate;
}

/**
 * Create label if it doesn't exist, or get existing label
 */
function createOrGetLabel(labelName) {
  let label = GmailApp.getUserLabelByName(labelName);
  if (!label) {
    label = GmailApp.createLabel(labelName);
  }
  return label;
}

/**
 * Check for overdue support emails and send daily summary
 *
 * Run this on a daily trigger (8am EST)
 */
function checkOverdueSupportEmails() {
  const now = new Date();
  const supportLabels = [
    'Support/Urgent-4hr',
    'Support/High-24hr',
    'Support/Normal-48hr',
    'Support/Low-5day'
  ];

  let overdueCount = 0;
  const overdueThreads = [];

  supportLabels.forEach(labelName => {
    const label = GmailApp.getUserLabelByName(labelName);
    if (!label) return;

    const threads = label.getThreads();

    threads.forEach(thread => {
      // Check if thread has due date label
      const labels = thread.getLabels();
      const dueDateLabel = labels.find(l => l.getName().startsWith('Support/Due:'));

      if (dueDateLabel) {
        // Extract due date from label
        const dueDateStr = dueDateLabel.getName().replace('Support/Due: ', '');
        const dueDate = new Date(dueDateStr);

        if (now > dueDate && !thread.hasStarredMessages()) {
          // Overdue and not resolved (resolved = starred by support agent)
          overdueCount++;
          overdueThreads.push({
            subject: thread.getFirstMessageSubject(),
            tier: labelName.split('/')[1],
            dueDate: dueDateStr,
            link: thread.getPermalink()
          });
        }
      }
    });
  });

  if (overdueCount > 0) {
    sendOverdueAlert(overdueThreads);
  }

  Logger.log(`Daily check complete: ${overdueCount} overdue support emails`);
}

/**
 * Send alert for overdue support emails
 */
function sendOverdueAlert(overdueThreads) {
  const recipient = 'support-alerts@codescribeai.com'; // Change to your email
  const subject = `⚠️ ${overdueThreads.length} Overdue Support Requests`;

  let body = `You have ${overdueThreads.length} overdue support requests:\n\n`;

  overdueThreads.forEach((thread, index) => {
    body += `${index + 1}. [${thread.tier}] ${thread.subject}\n`;
    body += `   Due: ${thread.dueDate}\n`;
    body += `   Link: ${thread.link}\n\n`;
  });

  GmailApp.sendEmail(recipient, subject, body);
  Logger.log(`Overdue alert sent to ${recipient}`);
}
```

**Setup Instructions:**

1. **Create Labels:**
   - `Support/Inbox` (temporary holding label)
   - `Support/Urgent-4hr`
   - `Support/High-24hr`
   - `Support/Normal-48hr`
   - `Support/Low-5day`

2. **Create Gmail Filter:**
   - Search: `to:support@codescribeai.com`
   - Action: Apply label `Support/Inbox`

3. **Install Apps Script:**
   - Gmail → Settings → Apps Script
   - Create new project
   - Paste code above
   - Save

4. **Set Triggers:**
   - Apps Script → Triggers → Add Trigger
   - Function: `processNewSupportEmails`
   - Event source: Time-driven
   - Type: Minutes timer
   - Interval: Every 5 minutes

5. **Optional Daily Summary:**
   - Add trigger for `checkOverdueSupportEmails`
   - Event source: Time-driven
   - Type: Day timer
   - Time: 8am EST

---

## Outlook Filter Setup

### Using Outlook Rules

1. **Create Rule → Advanced Options**
2. **Condition:** Message header contains specific words
   - Header: `X-CodeScribe-Tier`
   - Words: `ENTERPRISE` or `TEAM`
3. **Action:**
   - Move to folder: `Support/Urgent-4hr`
   - Mark as high importance
   - Display desktop alert

Repeat for each tier (PRO, STARTER, FREE) with appropriate folders and importance levels.

---

## Apple Mail Filter Setup

Apple Mail doesn't support custom header filtering directly, but you can use **Rules** with **AppleScript**:

1. **Mail → Preferences → Rules → Add Rule**
2. **Condition:** From contains `@codescribeai.com`
3. **Action:** Run AppleScript

**AppleScript:**

```applescript
using terms from application "Mail"
    on perform mail action with messages theMessages
        repeat with eachMessage in theMessages
            set messageSource to source of eachMessage

            -- Extract X-CodeScribe-Tier header
            if messageSource contains "X-CodeScribe-Tier: ENTERPRISE" or messageSource contains "X-CodeScribe-Tier: TEAM" then
                set mailbox of eachMessage to mailbox "Support/Urgent-4hr"
                set flag index of eachMessage to 2 -- Orange flag

            else if messageSource contains "X-CodeScribe-Tier: PRO" then
                set mailbox of eachMessage to mailbox "Support/High-24hr"
                set flag index of eachMessage to 3 -- Yellow flag

            else if messageSource contains "X-CodeScribe-Tier: STARTER" then
                set mailbox of eachMessage to mailbox "Support/Normal-48hr"

            else if messageSource contains "X-CodeScribe-Tier: FREE" then
                set mailbox of eachMessage to mailbox "Support/Low-5day"
            end if
        end repeat
    end perform mail action with messages
end using terms from
```

---

## Testing Filters

### Send Test Email with Custom Headers

Use the support request form in CodeScribe AI with different tiers to test filtering:

1. **Enterprise Test:**
   - Create enterprise account
   - Submit support request via app
   - Check `Support/Urgent-4hr` folder
   - Verify star and importance

2. **Free Test:**
   - Use unauthenticated support form
   - Submit request
   - Check `Support/Low-5day` folder
   - Verify no star

### Manual Header Inspection (Gmail)

1. Open support email
2. Click "⋮" (More) → "Show original"
3. Look for headers:
   ```
   X-Priority: 1
   X-MSMail-Priority: High
   Importance: high
   X-CodeScribe-Tier: ENTERPRISE
   X-CodeScribe-SLA: 4 hours
   ```

---

## SLA Dashboard (Optional)

Create a Google Sheet to track SLA compliance:

**Sheet columns:**
- Date Received
- Tier
- Subject
- SLA (hours)
- Due Date
- Response Date
- Resolution Date
- Status (On Time / Late)
- Minutes Late

**Apps Script to populate:**

```javascript
function exportSupportMetrics() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Support Metrics');
  const startRow = 2; // Row 1 is headers

  const supportLabels = [
    'Support/Urgent-4hr',
    'Support/High-24hr',
    'Support/Normal-48hr',
    'Support/Low-5day'
  ];

  let row = startRow;

  supportLabels.forEach(labelName => {
    const label = GmailApp.getUserLabelByName(labelName);
    if (!label) return;

    const threads = label.getThreads();

    threads.forEach(thread => {
      const firstMessage = thread.getMessages()[0];
      const headers = getCustomHeaders(firstMessage);

      // Extract data
      const receivedDate = firstMessage.getDate();
      const tier = headers.tier || 'UNKNOWN';
      const subject = thread.getFirstMessageSubject();
      const slaInfo = getSLAInfo(tier);
      const dueDate = calculateDueDate(receivedDate, slaInfo.hours);

      // Check if resolved (marked important by support agent)
      const messages = thread.getMessages();
      let responseDate = null;
      let resolutionDate = null;

      messages.forEach((msg, index) => {
        if (index > 0 && !responseDate) {
          // First reply from support
          responseDate = msg.getDate();
        }
        if (thread.hasStarredMessages() && !resolutionDate) {
          // Thread marked as resolved
          resolutionDate = msg.getDate();
        }
      });

      // Calculate status
      let status = 'Open';
      let minutesLate = 0;

      if (resolutionDate) {
        status = resolutionDate <= dueDate ? 'On Time' : 'Late';
        if (status === 'Late') {
          minutesLate = (resolutionDate - dueDate) / (1000 * 60);
        }
      } else if (new Date() > dueDate) {
        status = 'Overdue';
        minutesLate = (new Date() - dueDate) / (1000 * 60);
      }

      // Write to sheet
      sheet.getRange(row, 1, 1, 9).setValues([[
        receivedDate,
        tier,
        subject,
        slaInfo.hours,
        dueDate,
        responseDate || '',
        resolutionDate || '',
        status,
        Math.round(minutesLate)
      ]]);

      row++;
    });
  });

  Logger.log(`Exported ${row - startRow} support tickets to sheet`);
}
```

**Run daily** to track SLA performance over time.

---

## Best Practices

### 1. Respond Promptly to Urgent Emails

- Check `Support/Urgent-4hr` folder **every 2 hours** during business days
- Set up desktop/mobile notifications for urgent emails
- Enterprise/Team requests require same-day response

### 2. Batch Process by Priority

- Morning (9am): Clear urgent emails (4hr SLA)
- Afternoon (2pm): Process high priority emails (24hr SLA)
- End of day (4pm): Review normal/low priority backlog

### 3. Use Templates for Common Responses

Create Gmail canned responses for:
- "Working on it" acknowledgment
- "Need more info" follow-up
- "Issue resolved" closing

### 4. Mark Resolved Threads

- Star threads when resolved
- This prevents overdue alerts
- Helps track completion rate

### 5. Weekly Review

Every Friday:
- Check SLA compliance dashboard
- Identify bottlenecks (which tier/category has most overdue)
- Adjust resources for next week

---

## Troubleshooting

### Filters Not Working

**Problem:** Emails not being sorted into tier folders

**Solutions:**
1. Check filter search query syntax
2. Verify custom headers exist (Show original → check for `X-CodeScribe-Tier`)
3. Ensure labels exist before creating filters
4. Test with single email first

### Apps Script Not Running

**Problem:** Emails staying in `Support/Inbox` folder

**Solutions:**
1. Check Apps Script execution log for errors
2. Verify trigger is active (every 5 minutes)
3. Test `processNewSupportEmails()` manually
4. Check authorization (may need to re-authorize script)

### Due Dates Incorrect

**Problem:** SLA due dates not accounting for weekends/business hours

**Solutions:**
1. Verify timezone in Apps Script: `Session.getScriptTimeZone()`
2. Test `calculateDueDate()` function with known dates
3. Adjust business hours if needed (BUSINESS_START_HOUR, BUSINESS_END_HOUR)

---

## Related Documentation

- [Email Templating Guide](../components/EMAIL-TEMPLATING-GUIDE.md) - Email template architecture
- [Email Rate Limiting](../security/EMAIL-RATE-LIMITING.md) - Rate limit rules
- [Support Request Template](../../server/src/services/emailTemplates/supportRequest.js) - Template source code

---

**Questions or Issues?**
- Check Gmail filter syntax: [Gmail Help](https://support.google.com/mail/answer/7190)
- Apps Script documentation: [Google Apps Script](https://developers.google.com/apps-script)
- Contact: support@codescribeai.com

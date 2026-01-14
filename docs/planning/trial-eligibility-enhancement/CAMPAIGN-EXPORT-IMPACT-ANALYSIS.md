# Campaign Export Impact Analysis - Trial Eligibility Enhancement

**Date:** January 14, 2026
**Status:** ✅ No Breaking Changes, Optional Enhancements Identified

---

## Summary

**Impact Assessment:** The trial eligibility enhancement (Phase 1 and Phase 2) **will NOT break** the existing campaign export or Google Sheets integration. All changes are backward compatible.

**Recommendation:** Add optional enhancements in Phase 2 to surface eligibility settings in exports.

---

## Current Campaign Export System

### 1. Campaign Export Endpoint

**Endpoint:** `GET /api/admin/campaigns/export`
**Location:** `server/src/routes/admin.js:2123-2340`

**Current Data Sources:**
```sql
-- Trial breakdown by source
SELECT source, COUNT(*), status, started_at, converted_at
FROM user_trials
WHERE started_at BETWEEN startDate AND endDate
GROUP BY source

-- Cohort summary
SELECT COUNT(*), email_verified, activated_users
FROM users
WHERE created_at BETWEEN startDate AND endDate

-- Daily metrics (with campaign names)
SELECT date, origin_type, signups, verified
FROM users u
LEFT JOIN user_trials ut ON u.id = ut.user_id
LEFT JOIN campaigns c ON ut.campaign_id = c.id
```

**Key Observation:** The export does NOT currently SELECT any columns from the `campaigns` table except using `c.name` for origin labeling. It only uses `campaign_id` as a join key.

### 2. Google Sheets Template

**Documentation:** `docs/admin/GOOGLE-SHEETS-CAMPAIGN-TEMPLATE.md`
**Template URL:** https://docs.google.com/spreadsheets/d/1NfEyJYTy9QReSeS0CWUUwHUZUQ8LzBBWhVs9IwdqRtk/edit

**8 Sheets:**
1. Config - API settings
2. Overview - Campaign summary
3. Trial Performance - Campaign vs individual trial comparison
4. Cohort Funnel - Signup to activation conversion
5. Trial Funnel - Trial-to-conversion
6. Usage Segments - User engagement
7. Daily Metrics - Day-by-day data
8. User List - Complete user roster

**Expected Fields:**
- Campaign name, tier, duration, period
- Trial counts by source
- Conversion rates
- Signup/verification metrics
- User origin types

---

## Trial Eligibility Enhancement Changes

### Phase 1: Admin Force Flag (No Export Changes)

**Database Changes:**
- Add `forced` flag to trial audit logging metadata
- No changes to `campaigns` table
- No changes to `user_trials` table schema

**Impact on Exports:** ✅ **NONE**
- Export queries don't select trial metadata
- Force-granted trials still appear in trial breakdown by source
- No breaking changes to CSV or Google Sheets

### Phase 2: Campaign-Level Eligibility Settings

**Database Changes (Proposed):**
```sql
ALTER TABLE campaigns
ADD COLUMN allow_previous_trial_users BOOLEAN DEFAULT false,
ADD COLUMN cooldown_days INTEGER DEFAULT 0
  CHECK (cooldown_days >= 0 AND cooldown_days <= 365),
ADD COLUMN max_trials_per_user INTEGER DEFAULT 1
  CHECK (max_trials_per_user >= 1 AND max_trials_per_user <= 10);
```

**Impact on Existing Queries:** ✅ **NO BREAKING CHANGES**
- Adding columns to `campaigns` table is backward compatible
- Existing `SELECT * FROM campaigns` queries will include new columns (but nothing currently does SELECT *)
- Existing join queries using `campaign_id` are unaffected
- Default values ensure backward compatibility for existing campaigns

**Impact on Google Sheets:** ✅ **NO BREAKING CHANGES**
- Google Sheets template doesn't expect specific campaign column counts
- Apps Script only accesses named fields from JSON response
- New fields would be ignored if not explicitly accessed

---

## Compatibility Analysis

### 1. Campaign Export Endpoint

**Current Behavior:**
```javascript
// Export returns:
{
  campaignTrials: { source, trials_started, conversions, conversion_rate },
  individualTrials: [...],
  cohortSummary: { total_signups, verified_users, activated_users },
  dailyMetrics: [...],
  trialBreakdown: [...],
  timeToValueMetrics: {...},
  usageSegments: {...},
  userList: [...]
}
```

**Phase 2 Behavior (No Changes Required):**
- Same response structure
- New campaign fields don't affect trial metrics
- Eligibility rules affect *future* trial redemptions, not historical data

### 2. User List Export

**Current Fields:**
```csv
email, tier, role, created_at, email_verified, email_verified_at, first_gen_at, total_generations, last_active, origin_type, trial_tier, trial_started, trial_status
```

**Potential Phase 2 Enhancement (Optional):**
Add eligibility context to user list:
```csv
..., trial_tier, trial_started, trial_status, eligible_for_campaign, ineligibility_reason, days_until_eligible
```

**Impact:** Optional enhancement, not breaking change.

### 3. Google Sheets Apps Script

**Current Script:** Parses JSON response and populates named ranges
**Phase 2 Impact:** ✅ **NO CHANGES NEEDED**
- Script accesses fields by name, not by index
- Unknown fields are safely ignored
- Existing formulas continue to work

---

## Recommended Enhancements (Phase 2)

### Enhancement 1: Add Eligibility Fields to Campaign Export

**Goal:** Help admins understand campaign eligibility rules when analyzing performance.

**New Section in Export Response:**
```javascript
{
  campaignConfig: {
    name: string,
    trial_tier: string,
    trial_days: number,
    allow_previous_trial_users: boolean,  // NEW
    cooldown_days: number,                 // NEW
    max_trials_per_user: number,           // NEW
    is_active: boolean,
    starts_at: string,
    ends_at: string
  },
  // ... existing metrics
}
```

**Implementation:**
```javascript
// In admin.js campaign export endpoint
const campaignConfig = await sql`
  SELECT name, trial_tier, trial_days,
         allow_previous_trial_users, cooldown_days, max_trials_per_user,
         is_active, starts_at, ends_at
  FROM campaigns
  WHERE name = ${campaignName}  // or however campaign is identified
`;
```

**Google Sheets Impact:**
- Add "Eligibility Settings" section to Overview sheet
- Display: "Allows Previous Trial Users: Yes/No"
- Display: "Cooldown Period: 90 days"
- Display: "Max Trials Per User: 3"

### Enhancement 2: Add Eligibility Context to User List

**Goal:** Show which users could/couldn't redeem campaign based on eligibility rules.

**New Fields:**
```csv
email, ..., trial_status, eligible_for_campaign, ineligibility_reason, days_until_eligible
```

**Implementation:**
```sql
-- In user list query, add eligibility check
SELECT
  u.email,
  ...,
  ut.status as trial_status,
  CASE
    WHEN NOT campaign.allow_previous_trial_users AND EXISTS (
      SELECT 1 FROM user_trials ut2
      WHERE ut2.user_id = u.id
        AND ut2.id != ut.id
    ) THEN false
    ELSE true
  END as eligible_for_campaign,
  CASE
    WHEN NOT campaign.allow_previous_trial_users THEN 'Has previous trial'
    WHEN days_since_last_trial < campaign.cooldown_days THEN 'In cooldown period'
    ELSE NULL
  END as ineligibility_reason,
  CASE
    WHEN days_since_last_trial < campaign.cooldown_days
    THEN campaign.cooldown_days - days_since_last_trial
    ELSE NULL
  END as days_until_eligible
```

**Google Sheets Impact:**
- User List sheet includes eligibility columns
- Pivot table: "Ineligible Users Breakdown by Reason"
- Chart: "Eligibility Status Distribution"

### Enhancement 3: Update Google Sheets Template Documentation

**Files to Update:**
1. `docs/admin/GOOGLE-SHEETS-CAMPAIGN-TEMPLATE.md`
   - Add "Eligibility Settings" section to Overview sheet structure
   - Document new eligibility fields in User List
   - Add setup instructions for new columns

2. Create new Apps Script functions:
   ```javascript
   function formatEligibilitySettings(config) {
     const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Overview');
     sheet.getRange('A15').setValue('ELIGIBILITY SETTINGS');
     sheet.getRange('A16').setValue('Allows Previous Users');
     sheet.getRange('B16').setValue(config.allow_previous_trial_users ? 'Yes' : 'No');
     sheet.getRange('A17').setValue('Cooldown Period');
     sheet.getRange('B17').setValue(config.cooldown_days + ' days');
     sheet.getRange('A18').setValue('Max Trials Per User');
     sheet.getRange('B18').setValue(config.max_trials_per_user);
   }
   ```

---

## Migration Strategy

### Phase 1: No Changes Needed ✅

**Reason:** Force-granted trials don't affect export structure.

**Validation:**
```bash
# Test existing export continues to work
curl -H "Authorization: Bearer $TOKEN" \
  "https://codescribeai.com/api/admin/campaigns/export?startDate=2026-01-01&endDate=2026-01-31"

# Verify response structure unchanged
jq '.campaignTrials, .individualTrials, .cohortSummary' response.json
```

### Phase 2: Optional Enhancements

**Step 1: Database Migration (Required)**
```sql
-- Migration: 055-add-campaign-eligibility-fields.sql
ALTER TABLE campaigns
ADD COLUMN allow_previous_trial_users BOOLEAN DEFAULT false,
ADD COLUMN cooldown_days INTEGER DEFAULT 0,
ADD COLUMN max_trials_per_user INTEGER DEFAULT 1;
```

**Step 2: Update Export Endpoint (Optional Enhancement)**
- Add `campaignConfig` section to response
- Backward compatible - existing clients ignore new fields

**Step 3: Update Google Sheets Template (Optional Enhancement)**
- Update Apps Script to populate eligibility settings
- Add new sections to Overview sheet
- Update documentation

**Step 4: Update User List Query (Optional Enhancement)**
- Add eligibility context fields
- Requires campaign-aware query (performance impact minimal)

---

## Testing Checklist

### Phase 1 Testing

- [ ] Export existing campaign data before Phase 1 deployment
- [ ] Deploy Phase 1 (admin force flag)
- [ ] Force-grant a trial to test user
- [ ] Export same campaign data after deployment
- [ ] Verify response structure is identical
- [ ] Verify Google Sheets import still works
- [ ] Verify forced trials appear in trial breakdown

### Phase 2 Testing

- [ ] Add eligibility fields to campaigns table
- [ ] Create test campaign with eligibility rules
- [ ] Export campaign data with new fields
- [ ] Verify existing exports continue to work
- [ ] Update Apps Script with eligibility formatting
- [ ] Test Google Sheets import with new fields
- [ ] Verify eligibility settings display correctly
- [ ] Test user list with eligibility context
- [ ] Validate eligibility calculations

---

## Rollback Plan

### Phase 1 Rollback

**Scenario:** Admin force flag causes issues
**Action:** No export changes, so no rollback needed for exports

### Phase 2 Rollback

**Scenario:** Eligibility fields cause export issues

**Step 1: Revert Export Endpoint Changes**
```javascript
// Remove campaignConfig section from response
// Revert to Phase 1 response structure
```

**Step 2: Keep Database Migration**
```sql
-- DO NOT drop columns (may have data)
-- Existing campaigns continue to work with default values
-- New campaigns can still be created without eligibility settings
```

**Step 3: Revert Google Sheets Template**
- Remove eligibility sections from template
- Revert Apps Script to Phase 1 version
- Users can continue using old template

---

## Risk Assessment

### Low Risk

- ✅ Adding columns to `campaigns` table (backward compatible)
- ✅ Extending export response with new section (ignored by old clients)
- ✅ Google Sheets template enhancements (optional)

### No Risk

- ✅ Phase 1 admin force flag (no export changes)
- ✅ Trial eligibility rules (affect redemption, not reporting)

### Medium Risk (Mitigated)

- ⚠️ Adding eligibility context to user list (complex query)
  - **Mitigation:** Make it optional via query param `?includeEligibility=true`
  - **Fallback:** Remove if performance issues occur

---

## Conclusion

**Summary:**
- ✅ No breaking changes to campaign export or Google Sheets
- ✅ Phase 1 has zero impact on exports
- ✅ Phase 2 database changes are backward compatible
- 🎁 Optional enhancements available for Phase 2

**Recommendation:**
1. **Phase 1:** Deploy with confidence - no export changes needed
2. **Phase 2:** Add optional enhancements to surface eligibility settings
3. **Documentation:** Update Google Sheets template guide in Phase 2

**Next Steps:**
- Phase 1: No action required for exports
- Phase 2: Create migration `055-add-campaign-eligibility-fields.sql`
- Phase 2: Optional - enhance export endpoint with `campaignConfig`
- Phase 2: Optional - update Google Sheets Apps Script

---

## Related Documents

- [TRIAL-ELIGIBILITY-WF-PRD.md](./TRIAL-ELIGIBILITY-WF-PRD.md) - Workflow PRD with business outcomes
- [TECHNICAL-SPEC.md](./TECHNICAL-SPEC.md) - Technical implementation details
- [ANALYTICS-OPTIMIZATION.md](./ANALYTICS-OPTIMIZATION.md) - Event tracking strategy
- [GOOGLE-SHEETS-CAMPAIGN-TEMPLATE.md](../../admin/GOOGLE-SHEETS-CAMPAIGN-TEMPLATE.md) - Current template
- [CAMPAIGN-MANAGEMENT-GUIDE.md](../../admin/CAMPAIGN-MANAGEMENT-GUIDE.md) - Campaign admin guide

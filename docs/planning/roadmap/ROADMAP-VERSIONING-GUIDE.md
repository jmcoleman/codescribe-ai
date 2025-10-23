# Roadmap Versioning Guide

**Purpose:** Maintain consistency across roadmap documents (ROADMAP.md, roadmap-data.json, ROADMAP-TIMELINE.html)
**Created:** October 23, 2025
**Current Timeline Version:** v2.0

---

## 📋 Two Version Numbers

### 1. **Document Version** (ROADMAP.md only)
- Tracks iterations of the ROADMAP.md document itself
- Increments with any significant content update
- Format: `1.5`, `1.6`, `2.0`
- **Location:** Footer of ROADMAP.md

### 2. **Timeline Version** (All roadmap files)
- Tracks the interactive timeline roadmap structure
- Increments with major roadmap changes
- Format: `v1.0`, `v2.0`, `v3.0`
- **Locations:**
  - `roadmap-data.json` → `meta.footerLeft`
  - `ROADMAP-TIMELINE.html` → Embedded in footer
  - `ROADMAP.md` → Footer metadata

---

## 🔄 When to Increment Timeline Version

### **Major Version (v1.0 → v2.0)**
Increment when making **structural changes**:

| Change Type | Example | New Version |
|-------------|---------|-------------|
| ✅ Add entire phase | Add Phase 2.5 (Dark Mode) | v1.0 → v2.0 |
| ✅ Remove entire phase | Cancel Phase 6 | v2.0 → v3.0 |
| ✅ Restructure phases | Move phases between columns | v2.0 → v3.0 |
| ✅ Major scope change | Replace multiple phases | v2.0 → v3.0 |

### **Minor Version (v2.0 → v2.1)**
Increment when making **content changes**:

| Change Type | Example | New Version |
|-------------|---------|-------------|
| ✅ Add features to phase | Add drag-and-drop to Phase 2 | v2.0 → v2.1 |
| ✅ Remove features | Remove GitHub import from Phase 2 | v2.0 → v2.1 |
| ✅ Change duration | Phase 2: 2-3 days → 3-4 days | v2.0 → v2.1 |
| ✅ Move phase to DONE | Complete Phase 2 | v2.0 → v2.1 |

### **No Version Change**
Don't increment for **minor edits**:

| Change Type | Example | Version |
|-------------|---------|---------|
| ❌ Typo fixes | Fix spelling errors | v2.0 (no change) |
| ❌ Wording changes | Rephrase descriptions | v2.0 (no change) |
| ❌ Formatting | Update markdown formatting | v2.0 (no change) |
| ❌ Add clarifications | Expand technical details | v2.0 (no change) |

---

## 📊 Phase Duration Summary

**Format:** `"Phase 1-1.5 (X days) · Phases 2-8 Planned (Y-Z days)"`

**Update this EVERY TIME you:**
- Add or remove a phase
- Change phase duration estimates
- Move phases between columns (NOW → DONE)

### **How to Calculate:**

#### **DONE Phases (Fixed Number):**
Sum all completed phase durations:

```
Phase 1.0.0:  5 days
Phase 1.2.0:  4 days (accessibility)
Phase 1.2.0:  3 days (infrastructure)
Phase 1.2.0:  2 days (security)
Phase 1.2.1:  0.5 days
Phase 1.2.2:  1 day
─────────────────────
Total:        15.5 days → Round to 16 days
```

#### **PLANNED Phases (Range):**
Sum min and max estimates for all planned phases:

```
Phase 2 (v1.3.0):    2-3 days
Phase 2.5 (v1.3.5):  1.5-2 days
Phase 3 (v1.4.0):    3-4 days
Phase 3.5 (v1.5.0):  3-5 days
Phase 4 (v2.0.0):    3-4 days
Phase 5 (v2.1.0):    4-5 days
Phase 6 (v3.0.0):    5-7 days
Phase 7 (v4.0.0):    7-10 days
─────────────────────────────
Min:                 28.5 → 29 days
Max:                 40 days
```

**Result:** `"Phase 1-1.5 (16 days) · Phases 2-8 Planned (29-40 days)"`

---

## 🗂️ Files to Update

When changing the Timeline Version, update **all three files**:

### 1. **roadmap-data.json**
```json
{
  "meta": {
    "footerLeft": "<strong>CodeScribe AI</strong> · Timeline Roadmap v2.0",
    "footer": "Phase 1-1.5 (16 days) · Phases 2-8 Planned (29-40 days)"
  }
}
```

### 2. **ROADMAP.md** (Footer)
```markdown
**Document Version:** 1.5
**Timeline Version:** 2.0 (added Phase 2.5 - Dark Mode)
**Created:** October 17, 2025
**Last Updated:** October 23, 2025
```

### 3. **ROADMAP-TIMELINE.html**
- **Don't edit directly!**
- Use the update process (Shift+L, Shift+S, `npm run roadmap:update`)
- Embedded data will update automatically from roadmap-data.json

---

## ✅ Update Checklist

Use this checklist when making roadmap changes:

- [ ] **1. Update roadmap-data.json**
  - [ ] Increment `meta.footerLeft` version if major/minor change
  - [ ] Update `meta.footer` duration summary if durations changed
  - [ ] Add/remove/modify phase data in columns

- [ ] **2. Update ROADMAP.md**
  - [ ] Add/remove/modify phase sections
  - [ ] Update footer `Document Version`
  - [ ] Update footer `Timeline Version` (match JSON)
  - [ ] Update `Last Updated` date

- [ ] **3. Update ROADMAP-TIMELINE.html**
  - [ ] Open HTML in browser
  - [ ] Press Shift+L (load JSON)
  - [ ] Verify changes visually
  - [ ] Press Shift+S (save HTML)
  - [ ] Run `npm run roadmap:update`

- [ ] **4. Verify Sync**
  - [ ] All three files show same timeline version
  - [ ] Duration summary matches calculations
  - [ ] Phase content matches across all files

---

## 📝 Version History Log

Keep a record of timeline version changes:

| Version | Date | Change | Files Updated |
|---------|------|--------|---------------|
| v1.0 | Oct 21, 2025 | Initial interactive roadmap | JSON, HTML |
| v2.0 | Oct 23, 2025 | Added Phase 2.5 (Dark Mode), updated durations (29-40 days) | MD, JSON, HTML |

---

## 🎯 Best Practices

1. **Increment versions immediately** when making structural changes
2. **Update all three files together** - never update just one
3. **Always recalculate duration summary** when changing phases
4. **Use hard refresh (Cmd+Shift+R)** after updating HTML to bypass cache
5. **Document version changes** in the log above for future reference
6. **Round durations sensibly** - 15.5 → 16 days (not 15 or 15.5)
7. **Keep consistent formatting** across all files

---

## 🚨 Common Mistakes to Avoid

❌ **Don't:** Update ROADMAP.md without updating roadmap-data.json
✅ **Do:** Update both files together

❌ **Don't:** Forget to recalculate duration summary
✅ **Do:** Recalculate every time phases change

❌ **Don't:** Edit ROADMAP-TIMELINE.html directly
✅ **Do:** Use Shift+L, Shift+S, and update script

❌ **Don't:** Increment for typo fixes
✅ **Do:** Save version increments for meaningful changes

❌ **Don't:** Use different version numbers in different files
✅ **Do:** Keep timeline version synced across all files

---

## 📚 Related Documentation

- [ROADMAP.md](ROADMAP.md) - Main roadmap document
- [roadmap-data.json](roadmap-data.json) - Roadmap data source
- [ROADMAP-TIMELINE.html](ROADMAP-TIMELINE.html) - Interactive visualization
- [../../scripts/update-roadmap.sh](../../scripts/update-roadmap.sh) - Update automation script

---

**Document Version:** 1.0
**Created:** October 23, 2025
**Status:** Active guideline

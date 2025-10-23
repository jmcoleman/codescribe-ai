# CodeScribe AI - Phase Reordering

**Date:** October 23, 2025
**Reason:** Prioritize monetization validation before UX enhancements
**Status:** In Progress

---

## Old Order vs. New Order

### OLD ORDER (UX First)
```
Phase 1.0:   MVP Development (v1.0.0) ✅
Phase 1.5:   Accessibility (v1.2.0) ✅
Phase 2:     UX Improvements (v2.0.0)
Phase 2.5:   Dark Mode (v2.1.0)
Phase 3:     Layout Enhancements (v2.2.0)
Phase 3.5:   Auth & Monetization (v3.0.0)
Phase 4:     OpenAPI/Swagger (v3.1.0)
Phase 5:     Multi-File Docs (v3.2.0)
Phase 6:     CLI Tool (v4.0.0)
Phase 7:     VS Code Extension (v5.0.0)
Phase 8:     Optional Enhancements (TBD)
```

### NEW ORDER (Monetization First) ⭐
```
Phase 1.0:   MVP Development (v1.0.0) ✅
Phase 1.5:   Accessibility (v1.2.0) ✅
Phase 2:     Monetization Architecture (v2.0.0-alpha) ✅ PLANNING COMPLETE
Phase 3:     Authentication & Payment (v2.0.0) ← NEXT
Phase 4:     UX Improvements (v3.0.0)
Phase 5:     Dark Mode (v3.1.0)
Phase 6:     Layout Enhancements (v3.2.0)
Phase 7:     OpenAPI/Swagger (v4.0.0)
Phase 8:     Multi-File Docs (v4.1.0)
Phase 9:     CLI Tool (v5.0.0)
Phase 10:    VS Code Extension (v6.0.0)
Phase 11:    Optional Enhancements (TBD)
```

---

## Version Mapping Changes

### OLD Version Mapping
- Phase 2 → v2.0.0 (UX)
- Phase 2.5 → v2.1.0 (Dark Mode)
- Phase 3 → v2.2.0 (Layout)
- Phase 3.5 → v3.0.0 (Auth)
- Phase 4 → v3.1.0 (OpenAPI)
- Phase 5 → v3.2.0 (Multi-File)
- Phase 6 → v4.0.0 (CLI)
- Phase 7 → v5.0.0 (VS Code)

### NEW Version Mapping
- Phase 2 → v2.0.0-alpha (Monetization Architecture) - Planning only
- Phase 3 → v2.0.0 (Auth & Payment) - MAJOR: breaks "privacy-first no database"
- Phase 4 → v3.0.0 (UX) - MAJOR: comprehensive UX overhaul
- Phase 5 → v3.1.0 (Dark Mode) - MINOR: visual theming
- Phase 6 → v3.2.0 (Layout) - MINOR: resizable panels
- Phase 7 → v4.0.0 (OpenAPI) - MAJOR: new doc type
- Phase 8 → v4.1.0 (Multi-File) - MINOR: 6th doc type
- Phase 9 → v5.0.0 (CLI) - MAJOR: new product surface
- Phase 10 → v6.0.0 (VS Code) - MAJOR: new product surface

---

## Rationale for Reordering

**Why Monetization Before UX?**

1. ✅ **Architecture already done** (tiers.js, tierGate.js, useFeature.js)
2. ✅ **Current product is portfolio-worthy** (all 4 doc types, quality scoring, WCAG AA)
3. ✅ **Business validation faster** (10-15 days vs. 30+ days)
4. ✅ **UX better with tier awareness** (can gate batch upload, GitHub import, etc.)
5. ✅ **Real pain point** (developer hit API limit, wants to pay but can't)
6. ✅ **Free tier drives adoption** (generous free tier works without drag-and-drop)

**Conversion Timeline:**
- **Old order:** 16-24 days to monetization (UX → Dark → Layout → Auth → Payment)
- **New order:** 10-15 days to monetization (Auth → Payment immediately)

---

## Files Requiring Updates

### 1. ROADMAP.md
- [ ] Renumber Phase 2 → Monetization Architecture
- [ ] Renumber Phase 3 → Authentication & Payment
- [ ] Renumber Phase 4 → UX Improvements (was Phase 2)
- [ ] Renumber Phase 5 → Dark Mode (was Phase 2.5)
- [ ] Renumber Phase 6 → Layout Enhancements (was Phase 3)
- [ ] Renumber Phase 7 → OpenAPI/Swagger (was Phase 4)
- [ ] Renumber Phase 8 → Multi-File Docs (was Phase 5)
- [ ] Renumber Phase 9 → CLI Tool (was Phase 6)
- [ ] Renumber Phase 10 → VS Code Extension (was Phase 7)
- [ ] Renumber Phase 11 → Optional Enhancements (was Phase 8)
- [ ] Update version mapping section (lines 1095-1105)
- [ ] Update milestones table (lines 862-870)

### 2. roadmap-data.json
- [ ] Reorder "Next" column phases (v2.0.0-alpha, v2.0.0 first)
- [ ] Move UX, Dark Mode, Layout to "Later" column
- [ ] Update footer text to reflect new order
- [ ] Update phase v3.0.0 content (Auth & Payment, not UX)

### 3. ROADMAP-TIMELINE.html
- [ ] Will auto-update after roadmap-data.json changes
- [ ] Use Shift+L to load JSON, Shift+S to save

---

## Implementation Checklist

**ROADMAP.md Updates:**
- [x] Phase 2: Changed to Monetization Architecture
- [ ] Phase 2.5: DELETE (no longer exists)
- [ ] Phase 3: DELETE old content, replace with Auth & Payment
- [ ] Phase 3.5: DELETE (merged into Phase 3)
- [ ] Phase 4-10: Renumber and keep content
- [ ] Version mapping: Update all phase → version mappings
- [ ] Milestones table: Update phase numbers

**roadmap-data.json Updates:**
- [x] Added v2.0.0-alpha (Monetization Architecture) in "Next" column
- [x] Updated v3.0.0 (was Auth, split into Auth + Payment)
- [ ] Move v2.0.0 (UX), v2.1.0 (Dark), v2.2.0 (Layout) to "Later" column
- [ ] Renumber remaining phases

---

## Next Steps

1. Complete ROADMAP.md phase renumbering
2. Update roadmap-data.json column organization
3. Load JSON into HTML and save
4. Verify all cross-references are correct
5. Update any other docs that reference phase numbers

---

**Document Status:** Work in Progress
**Completion Target:** October 23, 2025

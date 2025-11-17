# 🔧 CODESCRIBE AI TODO LIST

**Status:** 📋 **ACTIVE** - Current Sprint Planning
**Current Phase:** Phase 3: UX Enhancements & Developer Tools
**Current Version:** v2.7.5 (November 12, 2025)
**Last Updated:** November 12, 2025

> **📌 Quick Reference:**
> - **Completed work** → [CHANGELOG.md](../../CHANGELOG.md)
> - **Full roadmap** → [roadmap-data.json](roadmap/roadmap-data.json) | [Interactive Roadmap](roadmap/interactive-roadmap.html)
> - **Historical planning** → [TODO-ARCHIVE.md](TODO-ARCHIVE.md) (Phase 1-2 details)

---

## 📊 Current Status Summary

**✅ Completed:**
- Phase 1: MVP + Production Deployment (v1.0.0 - v1.2.2)
- Phase 2: Payments Infrastructure (v2.0.0 - v2.7.5)
  - Epic 2.1: Authentication ✅
  - Epic 2.2: Tier System ✅
  - Epic 2.3: UX Enhancements ✅
  - Epic 2.4: Payment Integration ✅
  - Epic 2.5: Legal Compliance ✅
  - Epic 2.6: UI Integration ✅
- Epic 3.1: Dark Mode ✅ (v2.7.0-v2.7.5)

**🚧 In Progress:**
- Epic 3.3: Advanced File Handling (Planning)
- Epic 4.1: GitHub Integration (Planning)

**📋 Next Up:**
- Epic 2.7: Production Launch (Post-LLC, Jan 14+ 2026)
- Epic 4.2: Multi-File Project Documentation

---

## 🎯 Active Epic: 3.3 - Advanced File Handling

**Status:** 📋 Planning
**Duration:** 2-3 days
**Priority:** P1 (Infrastructure First)

### Required Before
- Epic 4.1 (GitHub Integration - primary source for multi-file)
- Epic 4.2 (Multi-File Project Documentation)

### Tasks

#### Multi-File Upload
- [ ] Update file input to accept multiple files
- [ ] Create file queue UI component
- [ ] Show file list with thumbnails/icons
- [ ] Allow removing files from queue
- [ ] Limit to 10 files maximum (Pro tier)

#### Batch Processing
- [ ] Process files sequentially (not parallel)
- [ ] Show progress for each file (1/10, 2/10, etc.)
- [ ] Show overall batch progress indicator
- [ ] Handle per-file errors (don't fail entire batch)
- [ ] Aggregate results in DocPanel or separate view

#### File Preview
- [ ] Show file preview before generation
- [ ] Display file size, type, name
- [ ] Syntax highlighting for code preview
- [ ] Allow editing files before generation

#### Testing
- [ ] Test multi-file upload (2, 5, 10 files)
- [ ] Test batch processing with errors
- [ ] Test file preview functionality
- [ ] Accessibility testing

### Success Criteria
- [ ] Multi-file upload supports up to 10 files
- [ ] Batch processing handles errors gracefully
- [ ] File preview shows accurate information
- [ ] All tests passing

---

## 🎯 Active Epic: 4.1 - GitHub Integration

**Status:** 📋 Planned
**Duration:** 3-4 days
**Priority:** P1 (Developer Adoption)
**Badge:** Required before Epic 4.2

### Tasks

#### GitHub OAuth App
- [ ] GitHub OAuth app for repository access
- [ ] Repository browser (list user's repos, search)
- [ ] Branch and path selection
- [ ] File tree navigation

#### Import Functionality
- [ ] Import files directly from GitHub (single or multiple)
- [ ] Support for private repositories
- [ ] Repository URL input (paste repo link)
- [ ] Rate limiting and API quota management

#### Testing
- [ ] Test with public repositories
- [ ] Test with private repositories
- [ ] Test GitHub API rate limits
- [ ] Test various repo structures

### Success Criteria
- [ ] Users can browse their GitHub repositories
- [ ] Single and multi-file import working
- [ ] Private repository access functional
- [ ] API quota management prevents errors

---

## 💡 Quick Capture Backlog

**Purpose:** Quick capture of bugs, enhancements, and ideas
**Process:** Move to appropriate Epic when ready to implement

**Format:** `[TYPE]` Brief description
Types: BUG, ENHANCEMENT, FEATURE, TECH-DEBT, SECURITY

### Current Items

#### UX Improvements
- [ ] **[ENHANCEMENT]** Consider adding support for more programming languages
- [ ] **[FEATURE]** Add changelog generation from git history
- [ ] **[FEATURE]** Multi-language support (i18n for UI)
- [ ] **[FEATURE]** Team collaboration features (share, comment, review)

#### Sales & Enterprise
- [ ] **[ENHANCEMENT]** Calendly integration for Enterprise/Team sales calls
- [ ] **[ENHANCEMENT]** Gmail 'Send As' setup for sales@codescribeai.com replies
- [ ] **[FEATURE]** Support ticket ID tracking system

#### Email Service Improvements (Future)
- [ ] **[TECH-DEBT]** Extract email templates to separate files (Handlebars/EJS)
- [ ] **[TECH-DEBT]** Create reusable email template components
- [ ] **[ENHANCEMENT]** Add email preview/testing mode (Ethereal/Mailtrap)
- [ ] **[ENHANCEMENT]** Implement email queue (Bull/BullMQ) for scale

#### Security Improvements (From Oct 2025 Audit)

**Priority 1 (Q1 2026):**
- [ ] **[SECURITY]** DOMPurify for Mermaid SVG sanitization (2-3 days)
- [ ] **[SECURITY]** Content Security Policy (CSP) headers (1-2 days)
- [x] **[SECURITY]** ~~Security headers (X-Frame-Options, X-Content-Type, etc.)~~ ✅ Completed v2.8.1 (Nov 16, 2025)
- [ ] **[SECURITY]** Subresource Integrity (SRI) for external scripts (1 day)

**Priority 2 (Q2 2026):**
- [ ] **[SECURITY]** IP address validation in Usage model (2-4 hours)
- [ ] **[SECURITY]** Structured audit logging for auth events (5 days)
- [ ] **[SECURITY]** Extend rate limiting to all endpoints (3 days)
- [ ] **[SECURITY]** Security testing in CI/CD (SAST, dependency scanning) (8 days)

**Reference:** See `private/SECURITY-AUDIT-OCT-2025.md` for full audit report

#### Design System
- [x] **[ENHANCEMENT]** ~~Update brand-color-palette.html for dark mode colors~~ (Superseded by brand-palette-unified.html - already includes both themes)

---

## 📅 Upcoming Releases

### v2.7.6 (Next - TBD)
- Epic 3.3 implementation
- Epic 4.1 GitHub integration

### v2.8.0 (Post-LLC - Jan 14+ 2026)
- Epic 2.7: Production Launch (live Stripe keys)
- Custom branded receipts
- Monitor first live transactions

### v3.0.0 (Q1 2026)
- Epic 3.2: Layout & Workspace Flexibility
- Epic 4.2: Multi-File Project Documentation

---

## 📚 Reference Documentation

**Planning & Strategy:**
- [ROADMAP.md](roadmap/ROADMAP.md) - Strategic roadmap with phases
- [roadmap-data.json](roadmap/roadmap-data.json) - Detailed epic breakdown
- [Interactive Roadmap](roadmap/interactive-roadmap.html) - Visual roadmap

**Completed Work:**
- [CHANGELOG.md](../../CHANGELOG.md) - Version history and release notes
- [TODO-ARCHIVE.md](TODO-ARCHIVE.md) - Historical Phase 1-2 planning

**Current Features:**
- [README.md](../../README.md) - Project overview and quick start
- [CLAUDE.md](../../CLAUDE.md) - Complete context reference

---

**Document Version:** 3.0 (Minimal Active TODO)
**Last Updated:** November 12, 2025
**Aligned with:** ROADMAP.md v3.9, v2.7.5 release

**Note:** This is a minimal active TODO focused on current sprint work. For historical planning details (Phase 1-2), see [TODO-ARCHIVE.md](TODO-ARCHIVE.md).

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

---

## [1.2.2] - 2025-10-22

**Status:** ✅ Maintenance Release - Mobile & UX Polish

### Added
- **Mobile Compatibility**
  - Clipboard fallback for non-secure contexts (HTTP/IP access)
  - Document.execCommand('copy') fallback when Clipboard API unavailable
  - Test coverage for non-secure context clipboard operations

- **Documentation**
  - Mobile-Specific Testing section in Cross-Browser Test Plan (110+ lines)
  - Native OS file picker behavior documentation (iOS Safari, Chrome Android)
  - 8-step manual testing procedure for mobile file uploads
  - Browser-specific notes table (Safari iOS, Chrome Android, Samsung Browser)
  - Debugging tips for chrome://inspect mobile workflow
  - Testing patterns for secure vs non-secure contexts

- **Feature Management**
  - Feature flag system for incomplete features (following ENABLE_AUTH pattern)
  - ENABLE_GITHUB_IMPORT flag (disabled until v2.0 implementation)

### Changed
- **UX Improvements**
  - Download button simplified: removed checkmark animation (fire-and-forget UX pattern)
  - Enhanced mobile focus indicators (larger rings, better visibility)
  - Improved touch target sizing across mobile components
  - Better visual hierarchy in mobile menu
  - Clearer active/hover states for mobile interactions

- **Accessibility Enhancements**
  - Enhanced focus ring visibility in Header component
  - Improved keyboard navigation visual feedback
  - Better contrast for WCAG compliance
  - Mobile-friendly focus indicators in ExamplesModal
  - Enhanced focus styles for all interactive elements in MobileMenu

- **Component Refinements**
  - DocPanel spacing and layout improvements
  - App.jsx integration cleanup (simplified DownloadButton API)
  - Removed unnecessary state management for downloads

- **Testing**
  - Updated ControlBar tests: 6 skipped (GitHub button hidden), 1 new verification test
  - Removed 3 obsolete download button checkmark tests
  - Added non-secure context clipboard tests
  - Cleaned up duplicate test helpers in QualityScore tests

### Fixed
- Copy-to-clipboard now works on mobile via IP/HTTP (non-secure contexts)
- Download button no longer shows confusing checkmark after download
- GitHub import button hidden (non-functional placeholder removed)
- Mobile file upload expectations documented (Camera/Photos/Files picker)
- Server error handling and logging improvements
- Test suite consistency (660+ tests passing, 100% pass rate)

### Documentation
- Updated Cross-Browser Test Plan v1.0 → v1.1
- Enhanced Frontend Testing Guide with mobile patterns
- Updated Todo List v1.3 with v1.2.2 completion details
- Updated Roadmap.md and roadmap-data.json
- Comprehensive maintenance release documentation

### Statistics
- **Files Modified:** 16
- **Lines Added:** 513
- **Lines Removed:** 253
- **Net Change:** +260 lines
- **Tests:** 660+ passing (46 ControlBar + 6 skipped appropriately)
- **Test Coverage:** Maintained at 95.81% backend
- **Duration:** 1 day (afternoon session)

---

## [1.2.0] - 2025-10-19

**Status:** ✅ Production Release - [codescribeai.com](https://codescribeai.com)

### Added
- **AI-Powered Documentation Generation**
  - 4 documentation types: README, JSDoc, API, ARCHITECTURE
  - Real-time streaming with Server-Sent Events (SSE)
  - Powered by Claude Sonnet 4.5 (claude-sonnet-4-20250514)

- **Quality Scoring System**
  - 0-100 scale with letter grades (A-F)
  - 5 criteria breakdown: Overview, Installation, Usage, API, Structure
  - Visual traffic light indicators (green/yellow/red)

- **Code Input Methods**
  - Monaco Editor with syntax highlighting (24+ languages)
  - File upload support (.js, .jsx, .ts, .tsx, .py, .java, .go, etc.)
  - Drag-and-drop file upload

- **User Interface**
  - Responsive design (mobile, tablet, desktop)
  - Real-time markdown preview with GitHub Flavored Markdown
  - Mermaid diagram support in generated documentation
  - Copy-to-clipboard functionality with visual feedback
  - Toast notifications for user feedback
  - Error handling with expandable technical details
  - Confirmation modals for large file uploads

- **Accessibility Features**
  - WCAG 2.1 AA compliance (95/100 Lighthouse score)
  - Full keyboard navigation support
  - Screen reader compatibility (NVDA, VoiceOver tested)
  - Skip navigation link
  - Focus traps in modals
  - ARIA labels and live regions
  - AAA color contrast (18.2:1 ratio for body text)
  - 0 automated accessibility violations (axe DevTools)

- **Testing & Quality**
  - 660+ tests across 3 frameworks (Vitest, Jest, Playwright)
  - 513+ frontend component tests (100% passing)
  - 133+ backend service tests (100% passing)
  - 10 E2E tests (100% passing, cross-browser)
  - 95.81% backend code coverage
  - Cross-browser testing (Chrome, Firefox, Safari, Edge, WebKit)

- **Performance Optimizations**
  - Lazy loading for Monaco Editor, Mermaid, and DocPanel
  - Bundle size: 78 KB gzipped (main), 425.68 KB total lazy chunks
  - Lighthouse performance score: 75/100 (+67% improvement)
  - Core Web Vitals optimized (FCP: -89%, LCP: -93%, TBT: -30%)

- **Infrastructure**
  - Vercel deployment with custom domain
  - GitHub Actions CI/CD pipeline
  - Test-gated deployments with Deploy Hooks
  - Environment variable security
  - Rate limiting (10 requests/minute, 100/hour per IP)
  - CORS configuration
  - HSTS headers for security

### Changed
- N/A (initial release)

### Fixed
- N/A (initial release)

### Security
- Environment variable sanitization
- API key protection (server-side only)
- Input validation and sanitization
- File upload security (type/size validation)
- Rate limiting to prevent abuse
- Strict Transport Security (HSTS) headers

---

## Development Timeline

- **Phase 1 (Oct 11-16, 2025):** Core application development (5 days)
- **Phase 1.5 (Oct 16-19, 2025):** Accessibility compliance + deployment (4 days)
- **Total:** 9 days from start to production

---

## Version History Summary

- **v1.0.0** - Production release with full feature set, accessibility compliance, and comprehensive testing

---

## Links

- **Live Application:** [https://codescribeai.com](https://codescribeai.com)
- **Documentation:** [docs/](docs/)
- **API Reference:** [docs/api/API-Reference.md](docs/api/API-Reference.md)
- **Architecture:** [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md)
- **Testing Guide:** [docs/testing/README.md](docs/testing/README.md)

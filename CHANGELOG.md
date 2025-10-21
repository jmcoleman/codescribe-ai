# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- (Features added since last release will be listed here)

### Changed
- (Changes to existing functionality will be listed here)

### Fixed
- (Bug fixes will be listed here)

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

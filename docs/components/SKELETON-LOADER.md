# Skeleton Loader Component Guide

**Component:** SkeletonLoader
**Purpose:** Provide visual loading states during documentation generation
**Location:** `client/src/components/SkeletonLoader.jsx`
**Status:** ✅ Implemented
**Last Updated:** October 15, 2025

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Component Architecture](#component-architecture)
3. [Props API](#props-api)
4. [Usage Examples](#usage-examples)
5. [Animation System](#animation-system)
6. [Styling Guidelines](#styling-guidelines)
7. [Accessibility](#accessibility)
8. [Testing Strategy](#testing-strategy)
9. [Performance Considerations](#performance-considerations)
10. [Future Enhancements](#future-enhancements)

---

## Overview

The SkeletonLoader component provides an elegant loading state for the documentation panel while AI-generated content is being streamed. It replaces empty states with animated placeholders that match the expected content structure, improving perceived performance and user experience.

### Key Features

- **Adaptive skeleton patterns** for different document types (README, JSDoc, API, Architecture)
- **Smooth pulse animation** using Tailwind CSS
- **Lightweight implementation** (< 150 lines, zero dependencies)
- **Accessible** with proper ARIA labels
- **Responsive** design matching main panel layout

### Design Philosophy

The skeleton loader follows the **progressive disclosure** pattern - showing users what to expect before content arrives. This reduces cognitive load and provides visual feedback that the system is working.

---

## Component Architecture

### File Structure

```
client/src/components/
├── SkeletonLoader.jsx    # Main component
├── DocPanel.jsx          # Consumer component
└── __tests__/
    └── SkeletonLoader.test.jsx  # Unit tests (future)
```

### Component Hierarchy

```
DocPanel
└── SkeletonLoader (when isLoading && !markdown)
    ├── SkeletonLine (title)
    ├── SkeletonLine (subtitle)
    ├── SkeletonLine (paragraph x3)
    ├── SkeletonLine (heading)
    └── SkeletonLine (paragraph x2)
```

---

## Props API

### SkeletonLoader Component

```jsx
<SkeletonLoader
  docType="README"  // Optional: "README" | "JSDOC" | "API" | "ARCHITECTURE"
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `docType` | string | `"README"` | Document type to optimize skeleton pattern for |

#### Supported Document Types

1. **README** - Title, subtitle, 3 paragraphs, heading, 2 paragraphs
2. **JSDOC** - Multiple function signature blocks with descriptions
3. **API** - Endpoint definitions with request/response examples
4. **ARCHITECTURE** - Diagram placeholder + section headings

---

## Usage Examples

### Basic Usage (README)

```jsx
import SkeletonLoader from './SkeletonLoader';

function DocPanel({ isLoading, markdown }) {
  if (isLoading && !markdown) {
    return (
      <div className="doc-panel">
        <SkeletonLoader />
      </div>
    );
  }

  return <div className="doc-panel">{markdown}</div>;
}
```

### With Document Type

```jsx
import SkeletonLoader from './SkeletonLoader';

function DocPanel({ isLoading, markdown, selectedDocType }) {
  if (isLoading && !markdown) {
    return (
      <div className="doc-panel">
        <SkeletonLoader docType={selectedDocType} />
      </div>
    );
  }

  return <div className="doc-panel">{markdown}</div>;
}
```

### Conditional Rendering Pattern

```jsx
function DocPanel({ isLoading, markdown, error }) {
  // Show skeleton only when loading AND no content yet
  if (isLoading && !markdown && !error) {
    return <SkeletonLoader />;
  }

  // Show error state
  if (error) {
    return <ErrorMessage error={error} />;
  }

  // Show content (even while loading for streaming updates)
  if (markdown) {
    return <MarkdownRenderer markdown={markdown} />;
  }

  // Show empty state
  return <EmptyState />;
}
```

---

## Animation System

### Pulse Animation

The skeleton uses Tailwind's built-in `animate-pulse` utility for smooth, performant animations:

```css
/* Tailwind generates this CSS */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

### Animation Duration

- **Pulse cycle:** 2 seconds
- **Easing:** cubic-bezier(0.4, 0, 0.6, 1) for natural motion
- **Infinite loop** until content arrives

### Performance

The animation uses `opacity` only, which:
- Doesn't trigger layout recalculation
- Hardware-accelerated on most browsers
- Minimal CPU/GPU usage
- Safe for multiple instances

---

## Styling Guidelines

### Color Palette

```css
/* Skeleton backgrounds (match neutral slate tones) */
bg-slate-200  /* Light skeleton bars (#e2e8f0) */
bg-slate-300  /* Darker skeleton bars (#cbd5e1) */
```

### Line Patterns

```jsx
// Title (large, full width)
<SkeletonLine width="w-3/4" height="h-8" />

// Subtitle (medium, 60% width)
<SkeletonLine width="w-3/5" height="h-6" />

// Paragraph (multiple lines, varied widths)
<SkeletonLine width="w-full" height="h-4" />
<SkeletonLine width="w-full" height="h-4" />
<SkeletonLine width="w-2/3" height="h-4" />

// Heading (medium, 50% width)
<SkeletonLine width="w-1/2" height="h-6" />
```

### Spacing

```css
/* Between skeleton lines */
space-y-3      /* 12px vertical spacing for paragraphs */
space-y-4      /* 16px vertical spacing for sections */

/* Container padding */
p-6            /* 24px padding (matches DocPanel) */
```

### Responsive Behavior

```jsx
// Mobile: full width, reduced padding
<div className="p-4 sm:p-6">

// Tablet/Desktop: maintain padding
<div className="p-6">
```

---

## Accessibility

### ARIA Attributes

```jsx
<div
  role="status"
  aria-live="polite"
  aria-label="Loading documentation"
>
  <SkeletonLoader />
</div>
```

#### Key ARIA Properties

| Attribute | Value | Purpose |
|-----------|-------|---------|
| `role` | `"status"` | Indicates dynamic content region |
| `aria-live` | `"polite"` | Announces changes when user is idle |
| `aria-label` | `"Loading documentation"` | Provides screen reader description |

### Screen Reader Behavior

1. When skeleton appears: "Loading documentation"
2. When content loads: "Documentation loaded" (via separate announcement)
3. Animation is hidden from screen readers (purely visual)

### Keyboard Navigation

- Skeleton loader is **not focusable** (decorative only)
- Focus remains on control elements (Generate button, doc type selector)
- When content loads, focus can move to documentation panel if needed

---

## Testing Strategy

### Unit Tests

```javascript
// client/src/components/__tests__/SkeletonLoader.test.jsx
import { render, screen } from '@testing-library/react';
import SkeletonLoader from '../SkeletonLoader';

describe('SkeletonLoader', () => {
  test('renders skeleton structure', () => {
    render(<SkeletonLoader />);
    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-label', 'Loading documentation');
  });

  test('applies pulse animation', () => {
    const { container } = render(<SkeletonLoader />);
    const lines = container.querySelectorAll('.animate-pulse');
    expect(lines.length).toBeGreaterThan(0);
  });

  test('renders different patterns for document types', () => {
    const { rerender, container } = render(<SkeletonLoader docType="README" />);
    const readmeLines = container.querySelectorAll('.h-4, .h-6, .h-8');

    rerender(<SkeletonLoader docType="API" />);
    const apiLines = container.querySelectorAll('.h-4, .h-6, .h-8');

    // Different patterns should have different structures
    expect(readmeLines.length).not.toBe(apiLines.length);
  });
});
```

### Integration Tests

```javascript
// Test within DocPanel component
describe('DocPanel with SkeletonLoader', () => {
  test('shows skeleton when loading without content', () => {
    render(<DocPanel isLoading={true} markdown="" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('hides skeleton when content arrives', () => {
    const { rerender } = render(<DocPanel isLoading={true} markdown="" />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(<DocPanel isLoading={true} markdown="# Content" />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('hides skeleton when loading completes', () => {
    const { rerender } = render(<DocPanel isLoading={true} markdown="" />);

    rerender(<DocPanel isLoading={false} markdown="# Content" />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
```

### Visual Regression Tests

```javascript
// Using Storybook + Chromatic (optional)
export default {
  title: 'Components/SkeletonLoader',
  component: SkeletonLoader,
};

export const Default = () => <SkeletonLoader />;
export const README = () => <SkeletonLoader docType="README" />;
export const JSDoc = () => <SkeletonLoader docType="JSDOC" />;
export const API = () => <SkeletonLoader docType="API" />;
export const Architecture = () => <SkeletonLoader docType="ARCHITECTURE" />;
```

---

## Performance Considerations

### Bundle Size

```
SkeletonLoader.jsx: ~2KB (minified)
Dependencies: 0 (uses only React + Tailwind)
Impact on bundle: Negligible (<0.1% of total)
```

### Runtime Performance

```
Initial render: <1ms
Re-renders: 0 (component is static)
Animation cost: GPU-accelerated (opacity only)
Memory usage: <1KB
```

### Optimization Techniques

1. **Static component** - No state, props, or effects
2. **CSS animations** - No JavaScript timers
3. **Tailwind purge** - Only used classes included in production
4. **No dependencies** - Zero external libraries

### Best Practices

```jsx
// ✅ Good: Show skeleton immediately
if (isLoading && !markdown) {
  return <SkeletonLoader />;
}

// ❌ Bad: Delay skeleton (adds perceived latency)
if (isLoading && !markdown) {
  setTimeout(() => setShowSkeleton(true), 500);
  return showSkeleton ? <SkeletonLoader /> : null;
}

// ✅ Good: Hide skeleton when content starts
if (markdown) {
  return <MarkdownRenderer markdown={markdown} />;
}

// ❌ Bad: Keep skeleton visible with content
if (isLoading) {
  return <SkeletonLoader />; // Overlaps with content
}
```

---

## Future Enhancements

### Phase 4 Evaluation: Optional Improvements

These enhancements are **not required** for MVP but may be evaluated in Phase 4:

#### 1. Progressive Skeleton Refinement

**Concept:** Update skeleton pattern as streaming progresses

```jsx
// Show different skeleton sections based on content received
function AdaptiveSkeleton({ receivedLines }) {
  if (receivedLines === 0) return <FullSkeleton />;
  if (receivedLines < 10) return <PartialSkeleton lines={receivedLines} />;
  return null; // Hide when enough content visible
}
```

**Pros:**
- More accurate loading representation
- Smoother transition to real content

**Cons:**
- Adds complexity to state management
- Minimal UX improvement over static skeleton

**Verdict:** Evaluate if user feedback indicates confusion about loading progress

---

#### 2. Staggered Animation Entrance

**Concept:** Skeleton lines fade in sequentially (top to bottom)

```jsx
const SkeletonLine = ({ delay = 0 }) => (
  <div
    className="h-4 bg-slate-200 rounded animate-pulse"
    style={{ animationDelay: `${delay}ms` }}
  />
);

// Usage
<SkeletonLine delay={0} />
<SkeletonLine delay={50} />
<SkeletonLine delay={100} />
```

**Pros:**
- More polished visual effect
- Draws eye down the page naturally

**Cons:**
- Slightly more complex implementation
- May feel slower than instant appearance

**Verdict:** Evaluate if design system needs more motion sophistication

---

#### 3. Custom Skeleton Shapes

**Concept:** Add code block, list, and table skeletons

```jsx
// Code block skeleton
function SkeletonCodeBlock() {
  return (
    <div className="bg-slate-800 rounded-lg p-4 space-y-2">
      <div className="h-4 bg-slate-700 rounded w-3/4 animate-pulse" />
      <div className="h-4 bg-slate-700 rounded w-full animate-pulse" />
      <div className="h-4 bg-slate-700 rounded w-5/6 animate-pulse" />
    </div>
  );
}

// List skeleton
function SkeletonList() {
  return (
    <ul className="space-y-2">
      {[1, 2, 3].map(i => (
        <li key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse" />
          <div className="h-4 bg-slate-200 rounded flex-1 animate-pulse" />
        </li>
      ))}
    </ul>
  );
}
```

**Pros:**
- More accurate representation of final content
- Better for complex documentation structures

**Cons:**
- Significantly more code to maintain
- Diminishing returns on UX improvement

**Verdict:** Evaluate only if expanding to more complex document types (e.g., Architecture with diagrams)

---

#### 4. Shimmer Effect

**Concept:** Add gradient shimmer across skeleton (like Facebook/LinkedIn)

```css
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    #e2e8f0 0%,
    #f1f5f9 50%,
    #e2e8f0 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
}
```

**Pros:**
- More premium feel
- Industry-standard loading pattern

**Cons:**
- Slightly higher CSS complexity
- May not fit minimalist design aesthetic

**Verdict:** Evaluate during design polish phase if brand allows for more visual flair

---

### Enhancement Priority Matrix

| Enhancement | UX Impact | Dev Effort | Priority |
|-------------|-----------|------------|----------|
| Progressive Refinement | Low | Medium | P3 |
| Staggered Animation | Low | Low | P4 |
| Custom Shapes | Medium | High | P2 |
| Shimmer Effect | Low | Low | P4 |

**Recommendation:** Focus on core functionality in MVP. Evaluate enhancements only if user testing reveals confusion or dissatisfaction with current loading states.

---

## Integration Checklist

- [x] Component created in `client/src/components/SkeletonLoader.jsx`
- [x] Integrated into DocPanel component
- [x] ARIA attributes added for accessibility
- [x] Tailwind classes applied for styling
- [x] Animation tested across browsers
- [ ] Unit tests written (optional for MVP)
- [ ] Visual regression tests (optional)
- [ ] Documentation completed (this file)

---

## Related Documentation

- [DocPanel Component](../planning/05-Dev-Guide.md#react-components) - Parent component integration
- [Design System](../planning/07-Figma-Guide.md#color-palette) - Color palette reference
- [Toast System](./TOAST-SYSTEM.md) - Complementary notification system
- [Accessibility Guidelines](../planning/01-PRD.md#accessibility) - WCAG compliance requirements

---

## Version History

- **v1.0** (October 15, 2025) - Initial documentation created
  - Component architecture defined
  - Props API documented
  - Usage examples provided
  - Accessibility guidelines added
  - Future enhancements outlined for Phase 4 evaluation

---

**For questions or suggestions about the SkeletonLoader component, reference this guide and the main [CLAUDE.md](../../CLAUDE.md) documentation map.**

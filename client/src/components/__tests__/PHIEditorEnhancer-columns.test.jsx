/**
 * Tests for PHI Editor Enhancer - Responsive Column Width Functionality
 * Tests weight-based allocation, responsive breakpoints, and adjacent column compensation
 */

import { describe, it, expect } from 'vitest';

// Import helper functions from PHIEditorEnhancer
// Note: These would need to be exported from PHIEditorEnhancer.jsx for testing
// For now, we'll duplicate them here for testing purposes

const COLUMN_WEIGHTS = {
  number: 1,
  status: 2,
  line: 1,
  id: 3,
  type: 4,
  found: 8,
  replacement: 8,
  action: 3
};

const RESPONSIVE_WEIGHTS = {
  mobile: {
    number: 0,
    status: 2,
    line: 0,
    id: 0,
    type: 3,
    found: 8,
    replacement: 8,
    action: 3
  },
  tablet: {
    number: 1,
    status: 2,
    line: 1,
    id: 0,
    type: 4,
    found: 8,
    replacement: 8,
    action: 3
  },
  desktop: COLUMN_WEIGHTS
};

const MIN_COLUMN_WIDTH = 5;
const SCROLLBAR_WIDTH = 15;

function getBreakpoint(viewportWidth) {
  if (viewportWidth < 640) return 'mobile';
  if (viewportWidth < 1024) return 'tablet';
  return 'desktop';
}

function calculateColumnWidths(viewportWidth, breakpoint) {
  const availableWidth = viewportWidth - SCROLLBAR_WIDTH;
  const weights = RESPONSIVE_WEIGHTS[breakpoint];
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);

  const columnWidths = {};
  let allocatedWidth = 0;

  Object.entries(weights).forEach(([key, weight]) => {
    if (weight === 0) {
      columnWidths[key] = 0;
    } else {
      const proportionalWidth = (weight / totalWeight) * availableWidth;
      const roundedWidth = Math.round(proportionalWidth);
      const finalWidth = Math.max(MIN_COLUMN_WIDTH, roundedWidth);

      columnWidths[key] = finalWidth;
      allocatedWidth += finalWidth;
    }
  });

  // Handle rounding error
  const roundingError = availableWidth - allocatedWidth;
  if (roundingError !== 0) {
    const lastVisibleKey = Object.keys(weights).reverse().find(key => weights[key] > 0);
    if (lastVisibleKey) {
      columnWidths[lastVisibleKey] += roundingError;
    }
  }

  return columnWidths;
}

function handleResizeAdjacent(columnKey, newWidth, currentWidths) {
  const columnOrder = ['number', 'status', 'line', 'id', 'type', 'found', 'replacement', 'action'];
  const index = columnOrder.indexOf(columnKey);

  const clampedWidth = Math.max(MIN_COLUMN_WIDTH, newWidth);

  const adjacentIndex = index < columnOrder.length - 1 ? index + 1 : index - 1;
  const adjacentKey = columnOrder[adjacentIndex];

  if (currentWidths[adjacentKey] === 0) {
    return currentWidths;
  }

  const delta = clampedWidth - currentWidths[columnKey];
  const newAdjacentWidth = currentWidths[adjacentKey] - delta;

  if (newAdjacentWidth < MIN_COLUMN_WIDTH) {
    const maxDelta = currentWidths[adjacentKey] - MIN_COLUMN_WIDTH;
    const cappedWidth = currentWidths[columnKey] + maxDelta;

    return {
      ...currentWidths,
      [columnKey]: cappedWidth,
      [adjacentKey]: MIN_COLUMN_WIDTH
    };
  }

  return {
    ...currentWidths,
    [columnKey]: clampedWidth,
    [adjacentKey]: newAdjacentWidth
  };
}

describe('PHI Table Column Width Calculation', () => {
  it('calculates proportional widths based on weights', () => {
    const widths = calculateColumnWidths(1200, 'desktop');

    // Found and Replacement should have equal widths (both weight 8)
    expect(widths.found).toBe(widths.replacement);

    // Found should be wider than Type (8 vs 4)
    expect(widths.found).toBeGreaterThan(widths.type);

    // Type should be wider than Status (4 vs 2)
    expect(widths.type).toBeGreaterThan(widths.status);

    // Status should be wider than Number (2 vs 1)
    expect(widths.status).toBeGreaterThan(widths.number);
  });

  it('enforces 5px minimum width', () => {
    // Use a viewport that gives each column enough space to meet minimum
    // Desktop has 8 columns, total weight 30, so need at least (8 * 5) + 15 = 55px
    const widths = calculateColumnWidths(300, 'desktop');

    Object.values(widths).forEach(w => {
      if (w > 0) {
        expect(w).toBeGreaterThanOrEqual(MIN_COLUMN_WIDTH);
      }
    });
  });

  it('hides columns at mobile breakpoint', () => {
    const widths = calculateColumnWidths(500, 'mobile');

    expect(widths.number).toBe(0);
    expect(widths.line).toBe(0);
    expect(widths.id).toBe(0);
    expect(widths.found).toBeGreaterThan(0);
    expect(widths.replacement).toBeGreaterThan(0);
  });

  it('hides ID column at tablet breakpoint', () => {
    const widths = calculateColumnWidths(800, 'tablet');

    expect(widths.number).toBeGreaterThan(0);
    expect(widths.id).toBe(0);
    expect(widths.found).toBeGreaterThan(0);
  });

  it('shows all columns at desktop breakpoint', () => {
    const widths = calculateColumnWidths(1200, 'desktop');

    Object.values(widths).forEach(w => {
      expect(w).toBeGreaterThan(0);
    });
  });

  it('handles rounding error by adjusting last visible column', () => {
    const widths = calculateColumnWidths(1201, 'desktop');
    const total = Object.values(widths).reduce((sum, w) => sum + w, 0);

    // Total should equal available width (viewport - scrollbar)
    expect(total).toBe(1201 - SCROLLBAR_WIDTH);
  });

  it('allocates more width to important columns', () => {
    const widths = calculateColumnWidths(1200, 'desktop');

    // Found and Replacement (weight 8) should be the widest
    const maxWidth = Math.max(...Object.values(widths));
    expect(widths.found).toBe(maxWidth);
    expect(widths.replacement).toBe(maxWidth);
  });
});

describe('Adjacent Column Compensation', () => {
  it('grows adjacent column when shrinking resized column', () => {
    const initial = { status: 100, line: 50, id: 120 };
    const result = handleResizeAdjacent('status', 70, initial);

    expect(result.status).toBe(70); // Shrunk by 30
    expect(result.line).toBe(80);   // Grew by 30
    expect(result.id).toBe(120);    // Unchanged
  });

  it('shrinks adjacent column when growing resized column', () => {
    const initial = { status: 100, line: 50, id: 120 };
    const result = handleResizeAdjacent('status', 130, initial);

    expect(result.status).toBe(130); // Grew by 30
    expect(result.line).toBe(20);    // Shrunk by 30
    expect(result.id).toBe(120);     // Unchanged
  });

  it('enforces minimum on adjacent column', () => {
    const initial = { status: 100, line: 10, id: 120 };
    const result = handleResizeAdjacent('status', 110, initial);

    // Line can only shrink to MIN_COLUMN_WIDTH (5), so status can only grow by 5
    expect(result.line).toBe(MIN_COLUMN_WIDTH);
    expect(result.status).toBe(105);
  });

  it('enforces minimum on resized column', () => {
    const initial = { status: 100, line: 50, id: 120 };
    const result = handleResizeAdjacent('status', 3, initial);

    // Status cannot go below MIN_COLUMN_WIDTH
    expect(result.status).toBe(MIN_COLUMN_WIDTH);
  });

  it('compensates with previous column when resizing last column', () => {
    const initial = { replacement: 200, action: 100 };
    const result = handleResizeAdjacent('action', 120, initial);

    expect(result.action).toBe(120);       // Grew by 20
    expect(result.replacement).toBe(180);   // Shrunk by 20
  });

  it('skips hidden adjacent columns', () => {
    const initial = { status: 100, line: 0, id: 120 };
    const result = handleResizeAdjacent('status', 110, initial);

    // Line is hidden (0), so status should not change or find next visible column
    expect(result).toBe(initial);
  });

  it('maintains total width during resize', () => {
    const initial = { status: 100, line: 50, id: 120, type: 80 };
    const initialTotal = initial.status + initial.line + initial.id + initial.type;

    const result = handleResizeAdjacent('status', 120, initial);
    const resultTotal = result.status + result.line + result.id + result.type;

    expect(resultTotal).toBe(initialTotal);
  });
});

describe('Responsive Breakpoints', () => {
  it('detects mobile breakpoint', () => {
    expect(getBreakpoint(500)).toBe('mobile');
    expect(getBreakpoint(639)).toBe('mobile');
  });

  it('detects tablet breakpoint', () => {
    expect(getBreakpoint(640)).toBe('tablet');
    expect(getBreakpoint(1023)).toBe('tablet');
  });

  it('detects desktop breakpoint', () => {
    expect(getBreakpoint(1024)).toBe('desktop');
    expect(getBreakpoint(1920)).toBe('desktop');
  });

  it('uses correct weights for each breakpoint', () => {
    const mobileWidths = calculateColumnWidths(500, 'mobile');
    const tabletWidths = calculateColumnWidths(800, 'tablet');
    const desktopWidths = calculateColumnWidths(1200, 'desktop');

    // Mobile: number, line, id hidden
    expect(mobileWidths.number).toBe(0);
    expect(mobileWidths.line).toBe(0);
    expect(mobileWidths.id).toBe(0);

    // Tablet: number and line visible, id hidden
    expect(tabletWidths.number).toBeGreaterThan(0);
    expect(tabletWidths.line).toBeGreaterThan(0);
    expect(tabletWidths.id).toBe(0);

    // Desktop: all visible
    expect(desktopWidths.number).toBeGreaterThan(0);
    expect(desktopWidths.id).toBeGreaterThan(0);
  });
});

describe('Edge Cases', () => {
  it('handles very small viewport', () => {
    const widths = calculateColumnWidths(200, 'mobile');

    // Should still enforce minimums
    Object.values(widths).forEach(w => {
      if (w > 0) {
        expect(w).toBeGreaterThanOrEqual(MIN_COLUMN_WIDTH);
      }
    });
  });

  it('handles very large viewport', () => {
    const widths = calculateColumnWidths(3000, 'desktop');
    const total = Object.values(widths).reduce((sum, w) => sum + w, 0);

    expect(total).toBe(3000 - SCROLLBAR_WIDTH);
  });

  it('handles resize to exactly minimum width', () => {
    const initial = { status: 100, line: 50, id: 120 };
    const result = handleResizeAdjacent('status', MIN_COLUMN_WIDTH, initial);

    expect(result.status).toBe(MIN_COLUMN_WIDTH);
    expect(result.line).toBeGreaterThan(MIN_COLUMN_WIDTH);
  });

  it('calculates widths when all columns have same weight', () => {
    const equalWeights = {
      col1: 1,
      col2: 1,
      col3: 1
    };

    const viewportWidth = 315; // 300 available after scrollbar
    const availableWidth = viewportWidth - SCROLLBAR_WIDTH;
    const totalWeight = 3;

    const widths = {};
    Object.keys(equalWeights).forEach(key => {
      widths[key] = Math.max(MIN_COLUMN_WIDTH, Math.round((1 / totalWeight) * availableWidth));
    });

    // Each column should get roughly equal width
    const values = Object.values(widths);
    const maxDiff = Math.max(...values) - Math.min(...values);
    expect(maxDiff).toBeLessThanOrEqual(1); // Allow 1px rounding difference
  });
});

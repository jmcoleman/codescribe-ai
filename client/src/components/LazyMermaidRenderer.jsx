import { useEffect, useState, memo } from 'react';
import mermaid from 'mermaid';
import { useTheme } from '../contexts/ThemeContext';

// Light theme configuration
const LIGHT_THEME_CONFIG = {
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'Inter, system-ui, sans-serif',
  themeVariables: {
    primaryColor: '#9333ea',
    primaryTextColor: '#1e293b',
    primaryBorderColor: '#7c3aed', // purple-600 - darker, more defined borders
    lineColor: '#64748b',
    secondaryColor: '#e0e7ff',
    tertiaryColor: '#f1f5f9',
    background: '#ffffff',
    mainBkg: '#ffffff',
    secondBkg: '#f8fafc',
    altBackground: '#f8fafc', // slate-50 - subtle alternating row background for ER diagrams
    // ER diagram specific - alternating row colors
    attributeBackgroundColorOdd: '#ffffff', // white for odd rows
    attributeBackgroundColorEven: '#f8fafc', // slate-50 for even rows
    borderColor: '#94a3b8', // slate-400 - darker borders for better definition
    arrowheadColor: '#64748b',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '14px'
  }
};

/**
 * Clean up Mermaid error icons (bomb images) from document.body
 * Mermaid renders error icons directly into body when diagrams have issues
 * This runs after render to clean up any stray error elements
 *
 * IMPORTANT: Only clean up actual ERROR elements, not normal temp render containers
 * Mermaid needs its temp containers during rendering - removing them breaks rendering
 */
function cleanupMermaidErrorIcons() {
  // Clean up SVG elements that contain bomb images (error icons)
  const bodySvgs = document.querySelectorAll('body > svg');
  bodySvgs.forEach(svg => {
    // Only remove if it contains bomb images or syntax error text
    const hasBombImage = svg.querySelector('image[href*="bomb"]') ||
                         svg.querySelector('image[xlink\\:href*="bomb"]');
    const hasSyntaxError = svg.textContent?.includes('Syntax error');
    const isErrorIcon = svg.classList.contains('error-icon') ||
                        svg.querySelector('.error-icon');
    // Also check for mermaid version text which appears in error diagrams
    const hasMermaidVersion = svg.textContent?.includes('mermaid version');

    if (hasBombImage || hasSyntaxError || isErrorIcon || hasMermaidVersion) {
      svg.remove();
    }
  });

  // Clean up any explicitly marked error icon elements
  const errorIcons = document.querySelectorAll('body > svg.error-icon, body > .error-icon');
  errorIcons.forEach(el => el.remove());

  // Clean up any stray mermaid temp elements that weren't cleaned up
  const strayMermaidElements = document.querySelectorAll('body > [id^="mermaid-"]');
  strayMermaidElements.forEach(el => {
    // Only remove if it's a detached/orphaned element (not inside our diagram container)
    if (el.parentElement === document.body) {
      el.remove();
    }
  });
}

// Set up a MutationObserver to catch error icons (bombs) added to body
// IMPORTANT: Only clean up actual error elements, NOT temp render containers
// Mermaid needs its temp containers to extract the SVG before we can remove them
let mermaidCleanupObserver = null;

function setupMermaidCleanupObserver() {
  if (mermaidCleanupObserver || typeof MutationObserver === 'undefined') return;

  mermaidCleanupObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Only clean up SVGs that contain error indicators (bomb images, error text)
            // Do NOT clean up normal mermaid temp elements - they're needed for rendering
            if (node.tagName === 'svg' && node.parentElement === document.body) {
              // Check specifically for error content - bomb images or syntax error text
              const hasBombImage = node.querySelector('image[href*="bomb"]') ||
                                   node.querySelector('image[xlink\\:href*="bomb"]');
              const hasSyntaxError = node.textContent?.includes('Syntax error');
              // Also check for error-icon class which mermaid uses for error diagrams
              const hasErrorClass = node.classList.contains('error-icon') ||
                                    node.querySelector('.error-icon');

              if (hasBombImage || hasSyntaxError || hasErrorClass) {
                // Use setTimeout to ensure Mermaid has finished with it
                setTimeout(() => {
                  if (node.parentElement) {
                    node.remove();
                  }
                }, 50);
              }
            }
          }
        });
      }
    }
  });

  mermaidCleanupObserver.observe(document.body, { childList: true });
}

// Initialize observer when module loads
if (typeof window !== 'undefined') {
  setupMermaidCleanupObserver();

  // Also run periodic cleanup as a fallback (every 2 seconds while diagrams might be rendering)
  // This catches any bombs that slip through the observer
  let cleanupInterval = null;
  const startPeriodicCleanup = () => {
    if (!cleanupInterval) {
      cleanupInterval = setInterval(() => {
        cleanupMermaidErrorIcons();
      }, 2000);
    }
  };
  const stopPeriodicCleanup = () => {
    if (cleanupInterval) {
      clearInterval(cleanupInterval);
      cleanupInterval = null;
    }
  };

  // Start cleanup when page loads, stop after a delay if no diagrams are being rendered
  startPeriodicCleanup();
  // Stop after 30 seconds to avoid unnecessary CPU usage
  setTimeout(() => {
    stopPeriodicCleanup();
  }, 30000);
}

// Dark theme configuration
const DARK_THEME_CONFIG = {
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Inter, system-ui, sans-serif',
  themeVariables: {
    primaryColor: '#7c3aed', // purple-600
    primaryTextColor: '#e2e8f0', // slate-200 - lighter text for dark mode
    primaryBorderColor: '#a78bfa', // purple-400 - lighter, more visible borders
    lineColor: '#94a3b8', // slate-400 - lighter lines for visibility
    secondaryColor: '#312e81', // indigo-900
    tertiaryColor: '#1e293b', // slate-800
    background: '#0f172a', // slate-900
    mainBkg: '#1e293b', // slate-800
    secondBkg: '#334155', // slate-700
    altBackground: '#1e293b', // slate-800 - subtle alternating row background for ER diagrams
    // ER diagram specific - alternating row colors
    attributeBackgroundColorOdd: '#1e293b', // slate-800 for odd rows
    attributeBackgroundColorEven: '#334155', // slate-700 for even rows
    borderColor: '#64748b', // slate-500 - lighter borders for better definition
    arrowheadColor: '#94a3b8', // slate-400
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '14px',
    // Additional dark mode specific variables
    darkMode: true,
    textColor: '#e2e8f0', // slate-200
    edgeLabelBackground: '#1e293b', // slate-800
    clusterBkg: '#1e293b', // slate-800
    clusterBorder: '#a78bfa' // purple-400
  }
};

/**
 * LazyMermaidRenderer - Renders Mermaid diagrams (lazy loaded)
 * This component is dynamically imported to reduce initial bundle size
 */
export const LazyMermaidRenderer = memo(function LazyMermaidRenderer({ chart, id, onError, onSuccess }) {
  const { effectiveTheme } = useTheme();
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(null);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let uniqueId = null;

    const renderDiagram = async () => {
      if (!chart) {
        return;
      }

      // Clean up the chart text
      const cleanChart = chart.trim();

      try {
        // Re-initialize Mermaid with the appropriate theme and suppress errors
        const themeConfig = effectiveTheme === 'dark' ? DARK_THEME_CONFIG : LIGHT_THEME_CONFIG;
        mermaid.initialize({
          ...themeConfig,
          suppressErrors: true, // Suppress error rendering in DOM
        });

        // Generate unique ID for this render with more entropy
        uniqueId = `mermaid-${id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        // Render the diagram
        const { svg } = await mermaid.render(uniqueId, cleanChart);

        // Clean up any DOM elements that Mermaid created
        // Mermaid sometimes creates temporary elements in document.body
        const mermaidElement = document.getElementById(uniqueId);
        if (mermaidElement) {
          mermaidElement.remove();
        }

        // If component unmounted during render, don't update state
        if (cancelled) {
          return;
        }

        // Remove error elements from the SVG
        const parser = new DOMParser();
        const doc = parser.parseFromString(svg, 'image/svg+xml');

        // Find all text elements and check for error messages
        const allTexts = doc.querySelectorAll('text');
        const errorsFound = [];

        allTexts.forEach(textEl => {
          const content = textEl.textContent.trim();
          // Check if this is an error message
          if (content.includes('Syntax error') ||
              content.includes('mermaid version') ||
              content.includes('error in text')) {
            errorsFound.push(content);
            // Remove the entire parent group (including icon)
            const parent = textEl.closest('g');
            if (parent) {
              parent.remove();
            } else {
              textEl.remove();
            }
          }
        });

        // Also remove any images (error icons like bombs)
        const errorImages = doc.querySelectorAll('image[href*="bomb"]');
        errorImages.forEach(img => {
          const parent = img.closest('g');
          if (parent) {
            parent.remove();
          } else {
            img.remove();
          }
        });

        // Normalize all background colors to our theme colors
        // This strips custom colors from LLM-generated diagrams that may clash with dark/light mode
        // and ensures consistent, readable diagrams
        const themeBgColor = effectiveTheme === 'dark' ? '#1e293b' : '#ffffff'; // slate-800 : white
        const themeTextColor = effectiveTheme === 'dark' ? '#e2e8f0' : '#1e293b'; // slate-200 : slate-800

        /**
         * Convert light-mode colors to dark-mode equivalents
         * Handles common diagram colors (red, blue, yellow, green, orange)
         */
        const convertToDarkMode = (color) => {
          const colorLower = color.toLowerCase();

          // Problematic light colors that need dark mode variants
          // Format: [light color pattern, dark mode replacement]
          const colorMap = [
            // Light reds/pinks/oranges → dark slate (these create poor contrast)
            { pattern: /^#(ff|fe|fd|fc|fb|fa|f9|f8)[a-f0-9]{4}$/i, replacement: '#334155' }, // Very light → slate-700
            { pattern: /^#(f[0-9a-f]d|f[0-9a-f]e|f[0-9a-f]f)[a-f0-9]{3}$/i, replacement: '#334155' }, // Light salmon/peach → slate-700
            { pattern: /^#(ff[c-f]|fe[c-f]|fd[c-f])[a-f0-9]{3}$/i, replacement: '#334155' }, // Light orange/peach → slate-700

            // Light yellows/creams → slate (poor contrast in dark mode)
            { pattern: /^#(ff|fe|fd|fc)f[c-f][a-f0-9]{2}$/i, replacement: '#475569' }, // Light yellow/cream → slate-600
            { pattern: /^#f[a-f]f[a-f](c|d|e|f)[a-f0-9]$/i, replacement: '#475569' }, // Cream/beige → slate-600

            // Light blues → darker blue
            { pattern: /^#[c-f][0-9a-f][d-f][0-9a-f]ff$/i, replacement: '#3b82f6' }, // Light blue → blue-500
            { pattern: /^#[d-f][0-9a-f]e[0-9a-f]ff$/i, replacement: '#3b82f6' }, // Very light blue → blue-500

            // Light greens → darker green
            { pattern: /^#[c-f][0-9a-f]f[c-f][a-f0-9]{2}$/i, replacement: '#22c55e' }, // Light green → green-500

            // Pure white/very light grays → slate-800
            { pattern: /^#f{6}$/i, replacement: '#1e293b' }, // White → slate-800
            { pattern: /^#f[a-f]f[a-f]f[a-f]$/i, replacement: '#1e293b' }, // Very light gray → slate-800
          ];

          for (const { pattern, replacement } of colorMap) {
            if (pattern.test(colorLower)) {
              return replacement;
            }
          }

          return color; // Return original if no match
        };

        // Standard colors that we allow (our theme colors + converted dark mode colors)
        const allowedBgColors = new Set([
          // Light mode standard colors
          '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', // white and slate variations
          '#9333ea', '#7c3aed', '#a78bfa', '#c4b5fd', // purple variations
          '#e0e7ff', '#c7d2fe', // indigo variations
          // Dark mode standard colors
          '#0f172a', '#1e293b', '#334155', '#475569', '#64748b', // slate dark variations
          '#312e81', // indigo-900
          '#3b82f6', '#2563eb', '#1d4ed8', // blue variations (dark mode safe)
          '#22c55e', '#16a34a', '#15803d', // green variations (dark mode safe)
          '#ef4444', '#dc2626', '#b91c1c', // red variations (darker, readable)
          '#f59e0b', '#d97706', '#b45309', // amber variations (darker, readable)
          // Transparent/none
          'none', 'transparent',
        ]);

        // Find all rect and path elements with fill colors
        const allShapes = doc.querySelectorAll('rect, path, polygon, circle, ellipse');
        allShapes.forEach(shape => {
          const fill = shape.getAttribute('fill');
          if (fill && fill !== 'none' && fill !== 'transparent' && !fill.startsWith('url(')) {
            let finalFill = fill;

            // In dark mode, convert problematic light colors to dark equivalents
            if (effectiveTheme === 'dark') {
              finalFill = convertToDarkMode(fill);
            }

            const fillLower = finalFill.toLowerCase();
            // If it's not one of our standard colors, replace with theme background
            if (!allowedBgColors.has(fillLower)) {
              finalFill = themeBgColor;
            }

            if (finalFill !== fill) {
              shape.setAttribute('fill', finalFill);
            }
          }
        });

        // Normalize all text colors to our theme text color
        const textElements = doc.querySelectorAll('text, tspan');
        textElements.forEach(text => {
          // Set text to theme color
          text.setAttribute('fill', themeTextColor);
          if (text.style) {
            text.style.fill = themeTextColor;
          }
        });

        // Handle foreignObject elements (used for HTML labels)
        const foreignObjects = doc.querySelectorAll('foreignObject');
        foreignObjects.forEach(fo => {
          const elements = fo.querySelectorAll('div, span, p');
          elements.forEach(el => {
            el.style.color = themeTextColor;
          });
        });

        // Serialize back to string
        const cleanSvg = new XMLSerializer().serializeToString(doc);

        // Clean up any stray error icons that Mermaid may have added to body
        cleanupMermaidErrorIcons();

        setSvg(cleanSvg);
        setError(null);
        if (onSuccess) onSuccess();
      } catch (err) {
        // Clean up error icons on failure too
        cleanupMermaidErrorIcons();

        if (cancelled) {
          return;
        }
        const errorMsg = err.message || 'Failed to render diagram';
        setError(errorMsg);
        setSvg('');
        if (onError) onError(errorMsg);
      }
    };

    renderDiagram();

    // Cleanup function to prevent state updates after unmount
    return () => {
      cancelled = true;
    };
  }, [chart, id, effectiveTheme, onError, onSuccess]);

  if (error) {
    return (
      <div className="not-prose my-6 border border-amber-200 dark:border-amber-800 rounded-lg bg-amber-50 dark:bg-amber-900/20">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-9 h-9 bg-amber-100 dark:bg-amber-800/30 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-1">
                Diagram Rendering Error
              </h4>
              <p className="text-sm text-amber-800 dark:text-amber-400">
                Unable to render this diagram. The diagram syntax may be invalid or incomplete.
              </p>
              {error && (
                <p className="text-xs text-amber-700 dark:text-amber-500 mt-2 font-mono">
                  {error}
                </p>
              )}
              <button
                onClick={() => setShowCode(!showCode)}
                className="mt-3 text-xs font-medium text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 underline underline-offset-2"
              >
                {showCode ? 'Hide' : 'Show'} diagram code
              </button>
            </div>
          </div>
        </div>
        {showCode && (
          <div className="border-t border-amber-200 dark:border-amber-800 p-4 bg-amber-100/50 dark:bg-amber-900/10">
            <pre className="text-xs text-amber-900 dark:text-amber-300 font-mono overflow-x-auto">
              <code>{chart}</code>
            </pre>
          </div>
        )}
      </div>
    );
  }

  // Show loading state while rendering
  if (!svg) {
    return (
      <div className="not-prose my-6 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg min-h-[300px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 dark:border-purple-400 mx-auto mb-2"></div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Rendering diagram...</p>
        </div>
      </div>
    );
  }

  // Show the rendered diagram with toggle
  return (
    <div
      className="not-prose my-6 w-full border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 overflow-hidden"
      style={{
        contain: 'layout style',
        willChange: 'auto'
      }}
    >
      {/* Toggle header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {showCode ? 'Mermaid Code' : 'Diagram'}
        </span>
        <button
          type="button"
          onClick={() => setShowCode(!showCode)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400"
          aria-label={showCode ? 'Show diagram' : 'Show code'}
        >
          {showCode ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Show Diagram
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Show Code
            </>
          )}
        </button>
      </div>

      {/* Content: Diagram or Code - using inline styles for theme since dark: variants don't work in this context */}
      {showCode ? (
        <div
          className="p-4 overflow-x-auto"
          style={{ backgroundColor: effectiveTheme === 'dark' ? '#1e293b' : '#ffffff' }}
        >
          <pre
            className="text-xs font-mono whitespace-pre-wrap"
            style={{
              color: effectiveTheme === 'dark' ? '#e2e8f0' : '#1e293b',
              backgroundColor: 'transparent',
              margin: 0,
              padding: 0,
              border: 'none'
            }}
          >
            <code
              style={{
                backgroundColor: 'transparent',
                color: 'inherit',
                border: 'none'
              }}
            >
              {chart}
            </code>
          </pre>
        </div>
      ) : (
        <div className="p-4 overflow-x-auto">
          <div
            className="w-full flex justify-center"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>
      )}
    </div>
  );
});

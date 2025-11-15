import { useEffect, useState } from 'react';
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
export function LazyMermaidRenderer({ chart, id, onError, onSuccess }) {
  const { effectiveTheme } = useTheme();
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(null);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    let cancelled = false;

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
        const uniqueId = `mermaid-${id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        // Render the diagram
        const { svg } = await mermaid.render(uniqueId, cleanChart);

        // Clean up any DOM elements that Mermaid created
        // Mermaid sometimes creates temporary elements in the document
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

        // Fix ER diagram row colors - remove alternating backgrounds, use same color for all rows
        const evenRowPaths = doc.querySelectorAll('.row-rect-even path[fill]');
        const oddRowPaths = doc.querySelectorAll('.row-rect-odd path[fill]');

        // Use same background color for all rows - white in light mode, dark in dark mode
        const rowColor = effectiveTheme === 'dark' ? '#1e293b' : '#ffffff'; // slate-800 : white

        evenRowPaths.forEach(path => {
          const currentFill = path.getAttribute('fill');
          // Only replace if it's not "none" and looks like a color (not a gradient/pattern)
          if (currentFill && currentFill !== 'none' && !currentFill.startsWith('url(')) {
            path.setAttribute('fill', rowColor);
          }
        });

        oddRowPaths.forEach(path => {
          const currentFill = path.getAttribute('fill');
          if (currentFill && currentFill !== 'none' && !currentFill.startsWith('url(')) {
            path.setAttribute('fill', rowColor);
          }
        });

        // Serialize back to string
        const cleanSvg = new XMLSerializer().serializeToString(doc);

        setSvg(cleanSvg);
        setError(null);
        if (onSuccess) onSuccess();
      } catch (err) {
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

  // Show the rendered diagram
  return (
    <div
      className="not-prose my-6 w-full overflow-x-auto"
      style={{
        contain: 'layout style',
        willChange: 'auto'
      }}
    >
      <div
        className="w-full flex justify-center"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}

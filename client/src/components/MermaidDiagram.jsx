import { useEffect, useState, memo } from 'react';
import mermaid from 'mermaid';

// Initialize mermaid with configuration
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'Inter, system-ui, sans-serif',
  themeVariables: {
    primaryColor: '#9333ea',
    primaryTextColor: '#1e293b',
    primaryBorderColor: '#c084fc',
    lineColor: '#64748b',
    secondaryColor: '#e0e7ff',
    tertiaryColor: '#f1f5f9',
    background: '#ffffff',
    mainBkg: '#ffffff',
    secondBkg: '#f8fafc',
    borderColor: '#cbd5e1',
    arrowheadColor: '#64748b',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '14px'
  }
});

/**
 * MermaidDiagram component renders Mermaid diagrams from text
 * @param {Object} props
 * @param {string} props.chart - Mermaid diagram syntax
 * @param {string} props.id - Unique identifier for this diagram
 */
export const MermaidDiagram = memo(function MermaidDiagram({ chart, id }) {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(null);
  const [showDiagram, setShowDiagram] = useState(false);

  useEffect(() => {
    if (!showDiagram) return;

    let cancelled = false;

    const renderDiagram = async () => {
      if (!chart) {
        console.log(`[Mermaid ${id}] No chart content, skipping render`);
        return;
      }

      // Clean up the chart text
      const cleanChart = chart.trim();

      try {
        // Generate unique ID for this render with more entropy
        const uniqueId = `mermaid-${id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        console.log(`[Mermaid ${id}] Starting render with uniqueId: ${uniqueId}`);
        console.log(`[Mermaid ${id}] Chart length: ${cleanChart.length} chars`);

        // Render the diagram
        const { svg } = await mermaid.render(uniqueId, cleanChart);

        // If component unmounted during render, don't update state
        if (cancelled) {
          console.log(`[Mermaid ${id}] Render cancelled (component unmounted)`);
          return;
        }

        console.log(`[Mermaid ${id}] Render successful, SVG length: ${svg.length} chars`);

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

        // Log errors found
        if (errorsFound.length > 0) {
          console.group(`🔍 [Mermaid ${id}] Syntax Issues (diagram still rendered):`);
          errorsFound.forEach((error, index) => {
            console.log(`Error ${index + 1}:`, error);
          });
          console.log('Chart source:', cleanChart);
          console.groupEnd();
        }

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

        // Serialize back to string
        const cleanSvg = new XMLSerializer().serializeToString(doc);

        setSvg(cleanSvg);
        setError(null);
        console.log(`[Mermaid ${id}] ✅ Render complete and state updated`);
      } catch (err) {
        if (cancelled) {
          console.log(`[Mermaid ${id}] Error ignored (component unmounted)`);
          return;
        }

        console.error(`[Mermaid ${id}] ❌ Rendering failed:`, err);
        console.error(`[Mermaid ${id}] Chart content:`, chart);
        // Only set error if rendering actually failed (no SVG produced)
        setError(err.message || 'Failed to render diagram');
        setSvg('');
      }
    };

    renderDiagram();

    // Cleanup function to prevent state updates after unmount
    return () => {
      cancelled = true;
      console.log(`[Mermaid ${id}] Component unmounting, cancelling any pending renders`);
    };
  }, [chart, id, showDiagram]);

  if (error) {
    return (
      <div className="my-6 p-4 bg-red-50 border border-red-200 rounded-lg min-h-[300px] flex items-center justify-center">
        <p className="text-sm text-red-800">
          <strong>Error rendering diagram:</strong> {error}
        </p>
      </div>
    );
  }

  // Show button to load diagram
  if (!showDiagram) {
    return (
      <div className="not-prose my-6 w-full border border-slate-200 rounded-lg bg-white hover:border-slate-300 transition-colors duration-200">
        <div className="flex items-center justify-between gap-4 p-4">
          {/* Left side: Icon + Text */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex-shrink-0 w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-700">
                Diagram Available
              </p>
              <p className="text-xs text-slate-500">
                Click to render visualization
              </p>
            </div>
          </div>

          {/* Right side: Button */}
          <button
            onClick={() => setShowDiagram(true)}
            className="flex-shrink-0 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2"
          >
            Show
          </button>
        </div>
      </div>
    );
  }

  // Show loading state while rendering
  if (!svg) {
    return (
      <div className="not-prose my-6 p-4 bg-slate-50 border border-slate-200 rounded-lg min-h-[300px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-sm text-slate-600">Rendering diagram...</p>
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
});

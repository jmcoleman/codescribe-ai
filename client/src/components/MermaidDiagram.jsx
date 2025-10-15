import { useEffect, useState } from 'react';
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
export function MermaidDiagram({ chart, id }) {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    renderDiagram();
  }, [chart, id]);

  const renderDiagram = async () => {
    if (!chart) {
      return;
    }

    // Clean up the chart text
    const cleanChart = chart.trim();

    try {
      // Generate unique ID for this render
      const uniqueId = `mermaid-${id}-${Date.now()}`;

      // Render the diagram
      const { svg } = await mermaid.render(uniqueId, cleanChart);

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
        console.group('🔍 Mermaid Syntax Issues (diagram still rendered):');
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
    } catch (err) {
      console.error('Mermaid rendering failed:', err);
      console.error('Chart content:', chart);
      // Only set error if rendering actually failed (no SVG produced)
      setError(err.message || 'Failed to render diagram');
      setSvg('');
    }
  };

  if (error) {
    return (
      <div className="my-6 p-4 bg-red-50 border border-red-200 rounded-lg min-h-[300px] flex items-center justify-center">
        <p className="text-sm text-red-800">
          <strong>Error rendering diagram:</strong> {error}
        </p>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="my-6 p-4 bg-slate-50 border border-slate-200 rounded-lg min-h-[300px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-sm text-slate-600">Rendering diagram...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-6 p-4 bg-slate-50 border border-slate-200 rounded-lg overflow-x-auto min-h-[300px] flex items-center justify-center">
      <div
        className="flex justify-center items-center"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}

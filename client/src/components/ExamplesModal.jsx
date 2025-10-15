import { X, Code2, ChevronRight } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { codeExamples } from '../data/examples';

export function ExamplesModal({ isOpen, onClose, onLoadExample }) {
  const [selectedExample, setSelectedExample] = useState(null);
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  // Focus management: auto-focus close button when modal opens
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Focus trap: keep focus within modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // Close on Escape key
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Focus trap on Tab
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          // Shift+Tab on first element: go to last
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          // Tab on last element: go to first
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLoadExample = (example) => {
    onLoadExample(example);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 id="modal-title" className="text-lg font-semibold text-slate-900">Code Examples</h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-2 hover:bg-purple-50 hover:scale-[1.05] rounded-lg transition-all duration-200 motion-reduce:transition-none focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 active:scale-[0.98]"
            aria-label="Close examples modal"
          >
            <X className="w-5 h-5 text-slate-600 hover:text-purple-600 transition-colors" />
          </button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 h-[calc(90vh-120px)]">
          {/* Left: Example List */}
          <div className="border-r border-slate-200 overflow-y-auto">
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4">
                Click a card to preview • Click <ChevronRight className="w-3.5 h-3.5 inline mx-0.5" /> to load
              </p>
              <div className="space-y-3">
                {codeExamples.map((example) => (
                  <ExampleCard
                    key={example.id}
                    example={example}
                    isSelected={selectedExample?.id === example.id}
                    onPreview={() => setSelectedExample(example)}
                    onLoad={() => handleLoadExample(example)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="overflow-y-auto bg-slate-50">
            {selectedExample ? (
              <ExamplePreview example={selectedExample} onLoad={() => handleLoadExample(selectedExample)} />
            ) : (
              <div className="flex items-center justify-center h-full p-6 text-center">
                <div>
                  <Code2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">
                    Select an example to preview
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExampleCard({ example, isSelected, onPreview, onLoad }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPreview();
    }
  };

  return (
    <div
      className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 ${
        isSelected
          ? 'border-purple-500 bg-purple-50 shadow-sm'
          : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/50 hover:shadow-sm'
      }`}
      onClick={onPreview}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-pressed={isSelected}
      aria-label={`Preview ${example.title} example`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 mb-1.5">
            {example.title}
          </h3>
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
            {example.description}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md font-medium">
              {example.docType}
            </span>
            <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-md font-medium">
              {example.language}
            </span>
          </div>
        </div>

        {/* Load Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLoad();
          }}
          className="flex-shrink-0 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 hover:scale-[1.05] hover:shadow-md transition-all duration-200 motion-reduce:transition-none focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 shadow-sm active:scale-[0.98] active:brightness-95"
          aria-label={`Load ${example.title} example`}
          title="Load into editor"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function ExamplePreview({ example, onLoad }) {
  return (
    <div className="flex flex-col h-full">
      {/* Action Button */}
      <div className="p-6 border-b border-slate-200 bg-white">
        <button
          onClick={onLoad}
          className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 hover:scale-[1.02] hover:shadow-lg transition-all duration-200 motion-reduce:transition-none font-semibold text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 active:scale-[0.98] active:brightness-95"
        >
          Load This Example
        </button>
      </div>

      {/* Code Preview */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <pre className="text-xs font-mono text-slate-800 leading-relaxed bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <code>{example.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}

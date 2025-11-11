import { X, Code2, ChevronRight } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { codeExamples } from '../data/examples';

export function ExamplesModal({ isOpen, onClose, onLoadExample, currentCode }) {
  const [selectedExample, setSelectedExample] = useState(null);
  const [allowClickOutside, setAllowClickOutside] = useState(false);
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const cardRefs = useRef({});

  // Delay enabling click-outside to prevent immediate close on modal open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setAllowClickOutside(true);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setAllowClickOutside(false);
    }
  }, [isOpen]);

  // Auto-select current example (if it matches) when modal opens
  useEffect(() => {
    if (isOpen && codeExamples.length > 0) {
      // Try to find the currently loaded example by matching code
      const currentExample = currentCode
        ? codeExamples.find(ex => ex.code.trim() === currentCode.trim())
        : null;

      // Only update selectedExample if we found a match
      // This preserves the previous selection if no match is found
      if (currentExample) {
        setSelectedExample(currentExample);
      }
    }
  }, [isOpen, currentCode]);

  // Focus management: auto-focus the selected example card when modal opens
  useEffect(() => {
    if (isOpen && codeExamples.length > 0) {
      // Focus the selected example if one exists, otherwise focus the first card
      const cardToFocus = selectedExample
        ? cardRefs.current[selectedExample.id]
        : cardRefs.current[codeExamples[0].id];

      if (cardToFocus) {
        cardToFocus.focus();
      }
    }
  }, [isOpen, selectedExample]);

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
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLoadExample = (example) => {
    onLoadExample(example);
    onClose();
  };

  const handleBackdropClick = (e) => {
    // Only close if clicking the backdrop itself (not the modal content)
    if (allowClickOutside && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="modal-backdrop animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="modal-container max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 id="modal-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">Code Samples</h2>
          <button
            type="button"
            ref={closeButtonRef}
            onClick={onClose}
            className="icon-btn interactive-scale-sm focus-ring-dark"
            aria-label="Close examples modal"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 h-[calc(90vh-120px)]">
          {/* Left: Example List */}
          <div className="border-r border-slate-200 dark:border-slate-700 overflow-y-auto bg-white dark:bg-slate-900">
            <div className="p-6">
              <div className="bg-slate-100 dark:bg-slate-800 py-2 px-3 rounded-lg mb-4">
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  Click a card to preview • Click <ChevronRight className="w-3.5 h-3.5 inline mx-0.5 text-purple-600 dark:text-purple-400" /> to load
                </p>
              </div>
              <div className="space-y-3">
                {codeExamples.map((example) => (
                  <ExampleCard
                    key={example.id}
                    ref={(el) => {
                      cardRefs.current[example.id] = el;
                    }}
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
          <div className="overflow-y-auto bg-slate-100 dark:bg-slate-800">
            {selectedExample ? (
              <ExamplePreview example={selectedExample} onLoad={() => handleLoadExample(selectedExample)} />
            ) : (
              <div className="flex items-center justify-center h-full p-6 text-center">
                <div>
                  <Code2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Select a code sample to preview
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

const ExampleCard = React.forwardRef(({ example, isSelected, onPreview, onLoad }, ref) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPreview();
    }
  };

  return (
    <div
      ref={ref}
      className={`p-4 rounded-lg border transition-smooth cursor-pointer focus-ring-dark ${
        isSelected
          ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-950/20 shadow-sm'
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-300 dark:hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-950/10 hover:shadow-sm'
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
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
            {example.title}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
            {example.description}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-md font-medium border border-transparent dark:border-indigo-500/50">
              {example.docType}
            </span>
            <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md font-medium">
              {example.language}
            </span>
          </div>
        </div>

        {/* Load Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onLoad();
          }}
          className="flex-shrink-0 p-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 dark:bg-purple-700 dark:hover:bg-purple-800 dark:active:bg-purple-900 text-white rounded-lg interactive-scale-sm shadow-lg shadow-purple-600/20 dark:shadow-purple-900/30 focus-ring-dark"
          aria-label={`Load ${example.title} sample`}
          title="Load into editor"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

ExampleCard.displayName = 'ExampleCard';

function ExamplePreview({ example, onLoad }) {
  return (
    <div className="flex flex-col h-full">
      {/* Action Button */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
        <button
          type="button"
          onClick={onLoad}
          className="btn-primary w-full interactive-scale text-sm font-semibold focus-ring-dark"
        >
          Load Sample
        </button>
      </div>

      {/* Code Preview */}
      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
        <pre className="text-xs font-mono text-slate-800 dark:text-slate-200 leading-relaxed p-6 h-full">
          <code>{example.code}</code>
        </pre>
      </div>
    </div>
  );
}

import { X, Code2, Search } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { codeSamples } from '../data/examples';
import { sanitizeFilename } from '../utils/fileValidation';

// Format language names for display (e.g., "csharp" -> "C#", "javascript" -> "JavaScript")
function formatLanguageName(language) {
  const languageMap = {
    'javascript': 'JavaScript',
    'typescript': 'TypeScript',
    'python': 'Python',
    'java': 'Java',
    'csharp': 'C#',
    'cpp': 'C++',
    'c': 'C',
    'go': 'Go',
    'rust': 'Rust',
    'ruby': 'Ruby',
    'php': 'PHP',
    'kotlin': 'Kotlin',
    'swift': 'Swift',
    'dart': 'Dart',
    'sh': 'Shell',
    'bash': 'Bash',
    'zsh': 'Zsh',
    'gs': 'Apps Script'
  };

  return languageMap[language.toLowerCase()] || language.toUpperCase();
}

export function SamplesModal({ isOpen, onClose, onLoadSample, currentCode }) {
  const [selectedSample, setSelectedSample] = useState(null);
  const [allowClickOutside, setAllowClickOutside] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const cardRefs = useRef({});
  const loadButtonRef = useRef(null);
  const searchInputRef = useRef(null);

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

  // Auto-select current sample (if it matches) when modal opens
  useEffect(() => {
    if (isOpen && codeSamples.length > 0) {
      // Try to find the currently loaded sample by matching code
      const currentSample = currentCode
        ? codeSamples.find(sample => sample.code.trim() === currentCode.trim())
        : null;

      // Only update selectedSample if we found a match
      // This preserves the previous selection if no match is found
      if (currentSample) {
        setSelectedSample(currentSample);
      }
    }
  }, [isOpen, currentCode]);

  // Focus management: auto-focus the search input when modal opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure modal is fully rendered before focusing
      const timer = setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
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

      // Arrow key navigation
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();

        // Right arrow: move to Load Sample button (if preview is shown)
        if (e.key === 'ArrowRight' && selectedSample && loadButtonRef.current) {
          loadButtonRef.current.focus();
          return;
        }

        // Left arrow: move back to selected card (if on Load Sample button)
        if (e.key === 'ArrowLeft' && selectedSample && document.activeElement === loadButtonRef.current) {
          const cardElement = cardRefs.current[selectedSample.id];
          if (cardElement) {
            cardElement.focus();
          }
          return;
        }

        // Up/Down: navigate between cards
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          const currentIndex = selectedSample
            ? codeSamples.findIndex(sample => sample.id === selectedSample.id)
            : -1;

          let nextIndex;
          if (e.key === 'ArrowDown') {
            // Down: next card (wrap to first if at end)
            nextIndex = currentIndex === codeSamples.length - 1 ? 0 : currentIndex + 1;
          } else {
            // Up: previous card (wrap to last if at start)
            nextIndex = currentIndex <= 0 ? codeSamples.length - 1 : currentIndex - 1;
          }

          const nextSample = codeSamples[nextIndex];
          setSelectedSample(nextSample);

          // Focus and scroll the card into view
          const cardElement = cardRefs.current[nextSample.id];
          if (cardElement) {
            cardElement.focus();
            cardElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
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
  }, [isOpen, onClose, selectedSample, codeSamples]);

  if (!isOpen) return null;

  const handleLoadSample = (sample) => {
    onLoadSample(sample);
    onClose();
  };

  const handleBackdropClick = (e) => {
    // Only close if clicking the backdrop itself (not the modal content)
    if (allowClickOutside && e.target === e.currentTarget) {
      onClose();
    }
  };

  // Filter samples based on search query
  const filteredSamples = codeSamples.filter((sample) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      sample.title.toLowerCase().includes(query) ||
      sample.description.toLowerCase().includes(query) ||
      sample.language.toLowerCase().includes(query) ||
      sample.docType.toLowerCase().includes(query)
    );
  });

  return (
    <div
      className="modal-backdrop animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="modal-container max-w-5xl xl:max-w-6xl 2xl:max-w-7xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
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
            className="icon-btn interactive-scale-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-800"
            aria-label="Close samples modal"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 md:grid-cols-[40%_60%] h-[calc(90vh-120px)]">
          {/* Left: Sample List */}
          <div className="border-r border-slate-200 dark:border-slate-700 overflow-y-auto bg-white dark:bg-slate-800">
            <div className="p-6">
              {/* Search Input */}
              <div className="mb-4">
                <label htmlFor="samples-search" className="sr-only">Search code samples</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                  <input
                    id="samples-search"
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search samples..."
                    className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:border-purple-600 dark:focus-visible:border-purple-400 transition-colors"
                    aria-label="Search code samples"
                  />
                </div>
              </div>

              {/* Sample Cards */}
              <div className="space-y-2">
                {filteredSamples.length > 0 ? (
                  filteredSamples.map((sample) => (
                    <SampleCard
                      key={sample.id}
                      ref={(el) => {
                        cardRefs.current[sample.id] = el;
                      }}
                      sample={sample}
                      isSelected={selectedSample?.id === sample.id}
                      onPreview={() => setSelectedSample(sample)}
                      onLoad={() => handleLoadSample(sample)}
                    />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No samples found matching "{searchQuery}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="overflow-y-auto bg-slate-100 dark:bg-slate-800">
            {selectedSample ? (
              <SamplePreview sample={selectedSample} onLoad={() => handleLoadSample(selectedSample)} onClose={onClose} loadButtonRef={loadButtonRef} />
            ) : (
              <div className="flex items-center justify-center h-full p-8 text-center" role="status" aria-label="No sample selected">
                <div className="max-w-xs">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full blur-2xl opacity-20 dark:opacity-10" aria-hidden="true" />
                    <Code2 className="relative w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto" aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Choose a sample to preview
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Click any card on the left to see what you'll get
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

const SampleCard = React.forwardRef(({ sample, isSelected, onPreview, onLoad }, ref) => {
  const handleKeyDown = (e) => {
    // Arrow keys are handled at modal level, don't propagate
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      // Let modal handle arrows
      return;
    }

    if (e.key === 'Enter') {
      // Enter loads the sample (if selected) or previews it
      e.preventDefault();
      if (isSelected) {
        onLoad();
      } else {
        onPreview();
      }
    } else if (e.key === ' ') {
      // Space just previews
      e.preventDefault();
      onPreview();
    }
  };

  return (
    <div
      ref={ref}
      className={`group relative p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-800 ${
        isSelected
          ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-950/20 shadow-lg shadow-purple-500/10 dark:shadow-purple-500/20'
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-300 dark:hover:border-purple-500 hover:bg-purple-50/30 dark:hover:bg-purple-950/10 hover:shadow-md'
      }`}
      onClick={onPreview}
      onDoubleClick={onLoad}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-pressed={isSelected}
      aria-label={`${isSelected ? 'Press Enter to load' : 'Preview'} ${sample.title} sample`}
    >
      {/* Header Row: Title + Selected Badge */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight flex-1">
          {sample.title}
        </h3>

        {isSelected && (
          <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 text-xs font-semibold shrink-0">
            <div className="w-1.5 h-1.5 bg-purple-600 dark:bg-purple-400 rounded-full animate-pulse" />
            Selected
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-2 line-clamp-2">
        {sample.description}
      </p>

      {/* Metadata Tags - Language + Doc Type */}
      <div className="flex items-center gap-2">
        <span className="inline-block text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded font-medium">
          {formatLanguageName(sample.language)}
        </span>
        <span className="inline-block text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded font-bold uppercase tracking-wide">
          {sample.docType}
        </span>
      </div>
    </div>
  );
});

SampleCard.displayName = 'SampleCard';

function SamplePreview({ sample, onLoad, onClose, loadButtonRef }) {
  // Generate actual filename based on sample title and language
  const getFilename = () => {
    const baseName = sample.title.toLowerCase().replace(/\s+/g, '-');
    const extensions = {
      'javascript': '.js',
      'typescript': '.ts',
      'python': '.py',
      'java': '.java',
      'cpp': '.cpp',
      'go': '.go',
      'rust': '.rs'
    };
    const filename = `${baseName}${extensions[sample.language] || '.txt'}`;
    // Sanitize for cross-platform filesystem compatibility
    return sanitizeFilename(filename);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Code Preview */}
      <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-800">
        <div className="h-full flex flex-col">
          {/* Enhanced Header with Title and Badges */}
          <div className="px-4 py-3 border-b border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-200 flex-1">
                {sample.title}
              </h4>
              <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded text-xs font-bold uppercase tracking-wide">
                {sample.docType}
              </span>
              <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-medium">
                {formatLanguageName(sample.language)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                {getFilename()}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-500 font-medium">Preview</span>
            </div>
          </div>
          <pre className="flex-1 text-sm font-mono text-slate-900 dark:text-slate-200 leading-relaxed p-4 bg-white dark:bg-slate-900 overflow-x-auto">
            <code>{sample.code}</code>
          </pre>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-lg font-bold transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800"
          >
            Cancel
          </button>
          <button
            ref={loadButtonRef}
            type="button"
            onClick={onLoad}
            className="btn-primary transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] font-bold shadow-xl shadow-purple-600/20 dark:shadow-purple-900/40"
          >
            Load Sample
          </button>
        </div>
      </div>
    </div>
  );
}

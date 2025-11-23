import { X, FileText, Star, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function HelpModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('quality'); // 'quality', 'faq'
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  // Focus management - focus close button when modal opens
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard navigation - Esc to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus trap - keep focus within modal
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTabKey);
    return () => modal.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  const handleClose = () => {
    onClose();
  };

  const toggleFAQ = (index) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const faqs = [
    {
      question: 'What file types are supported?',
      answer: 'We support JavaScript (.js, .jsx), TypeScript (.ts, .tsx), Python (.py), Java, C/C++ (.c, .cpp, .h, .hpp), C# (.cs), Go (.go), Rust (.rs), Ruby (.rb), PHP (.php), Kotlin (.kt, .kts), Swift (.swift), Dart (.dart), Shell scripts (.sh, .bash, .zsh), and Google Apps Script (.gs).'
    },
    {
      question: 'How does the quality scoring work?',
      answer: 'Your documentation is scored on five criteria: Overview/Description (20 pts), Installation Instructions (15 pts), Usage Examples (20 pts), API Documentation (25 pts), and Structure/Formatting (20 pts). Click "View Breakdown" after generation to see detailed suggestions.'
    },
    {
      question: 'Is my code stored anywhere?',
      answer: 'No! Your code is processed in memory and never stored in a database. Once the documentation is generated, your code is immediately discarded. We prioritize your privacy.'
    },
    {
      question: 'What\'s the difference between documentation types?',
      answer: 'README.md creates project-level documentation with setup instructions and examples. JSDoc generates inline code comments with parameter types and descriptions. API documents REST endpoints or public functions for integration guides. Architecture provides system design overviews with component interactions and data flows.'
    },
    {
      question: 'Can I edit the generated documentation?',
      answer: 'Yes! Use the copy button to paste the documentation into your editor, or download it as a .md file. You can then customize it to fit your project\'s needs.'
    }
  ];

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
      aria-describedby="help-modal-description"
    >
      <div
        ref={modalRef}
        className="modal-container max-w-2xl xl:max-w-3xl 2xl:max-w-4xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 id="help-modal-title" className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Help
          </h2>
          <button
            type="button"
            ref={closeButtonRef}
            onClick={handleClose}
            className="icon-btn interactive-scale-sm focus-ring-dark"
            aria-label="Close help modal"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <div className="flex px-6">
            <button
              type="button"
              onClick={() => setActiveTab('quality')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-purple-600 ${
                activeTab === 'quality'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
              aria-selected={activeTab === 'quality'}
              aria-controls="help-modal-description"
              role="tab"
            >
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4" aria-hidden="true" />
                Quality Scores
              </div>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('faq')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-purple-600 ${
                activeTab === 'faq'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
              aria-selected={activeTab === 'faq'}
              aria-controls="help-modal-description"
              role="tab"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" aria-hidden="true" />
                FAQs
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 bg-white dark:bg-slate-900 transition-all duration-200 ease-in-out" id="help-modal-description" role="tabpanel">
          {/* Quality Score Tab */}
          {activeTab === 'quality' && (
            <section>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Understanding Quality Scores
              </h3>
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-12 text-center">
                    <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs font-bold rounded border border-transparent dark:border-green-500/50">
                      A
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      <strong className="text-slate-900 dark:text-slate-100">90-100 points:</strong> Excellent documentation with comprehensive coverage, clear examples, and professional formatting.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-12 text-center">
                    <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs font-bold rounded border border-transparent dark:border-green-500/50">
                      B
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      <strong className="text-slate-900 dark:text-slate-100">80-89 points:</strong> Good documentation with most sections covered, may need minor improvements.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-12 text-center">
                    <span className="inline-block px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 text-xs font-bold rounded border border-transparent dark:border-yellow-500/50">
                      C
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      <strong className="text-slate-900 dark:text-slate-100">70-79 points:</strong> Adequate documentation with some gaps, should add more examples or details.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-12 text-center">
                    <span className="inline-block px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold rounded border border-transparent dark:border-red-500/50">
                      D-F
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      <strong className="text-slate-900 dark:text-slate-100">Below 70:</strong> Needs significant improvement. Review the breakdown for specific suggestions.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* FAQ Tab */}
          {activeTab === 'faq' && (
            <section>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Frequently Asked Questions
              </h3>
              <div className="space-y-2">
                {faqs.map((faq, index) => {
                  const isExpanded = expandedFAQ === index;
                  return (
                    <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden transition-all duration-200 hover:shadow-sm dark:hover:shadow-purple-500/10">
                      <button
                        type="button"
                        onClick={() => toggleFAQ(index)}
                        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400"
                        aria-expanded={isExpanded}
                        aria-controls={`faq-answer-${index}`}
                      >
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 pr-4">
                          {faq.question}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-600 dark:text-slate-400 flex-shrink-0 transition-transform duration-300 ease-in-out ${
                            isExpanded ? 'rotate-180' : 'rotate-0'
                          }`}
                        />
                      </button>
                      <div
                        id={`faq-answer-${index}`}
                        className={`grid transition-all duration-300 ease-in-out ${
                          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                        }`}
                        role="region"
                        aria-hidden={!isExpanded}
                      >
                        <div className="overflow-hidden">
                          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                              {faq.answer}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-6 py-4 rounded-b-xl">
          <button
            type="button"
            onClick={handleClose}
            className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 dark:bg-purple-700 dark:hover:bg-purple-800 dark:active:bg-purple-900 text-white rounded-lg font-medium shadow-lg shadow-purple-600/20 dark:shadow-purple-900/30 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}

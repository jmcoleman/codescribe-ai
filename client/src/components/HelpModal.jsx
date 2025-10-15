import { X, Sparkles, FileText, Star, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function HelpModal({ isOpen, onClose }) {
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
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
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
      answer: 'We support JavaScript (.js, .jsx), TypeScript (.ts, .tsx), Python (.py), Java, C/C++, C#, Go, Rust, Ruby, and PHP files.'
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
      aria-describedby="help-modal-description"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
          <h2 id="help-modal-title" className="text-xl font-semibold text-slate-900">
            Help & Quick Start
          </h2>
          <button
            ref={closeButtonRef}
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
            aria-label="Close help modal"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-8" id="help-modal-description">
          {/* Quick Start Guide */}
          <section>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Quick Start Guide
            </h3>
            <ol className="space-y-3">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-semibold">
                  1
                </span>
                <div>
                  <p className="text-slate-900 font-medium">Paste or upload your code</p>
                  <p className="text-sm text-slate-600 mt-1">
                    Use the left panel to paste code directly, or click "Upload Files" to select a file from your computer.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-semibold">
                  2
                </span>
                <div>
                  <p className="text-slate-900 font-medium">Select documentation type</p>
                  <p className="text-sm text-slate-600 mt-1">
                    Choose README.md for project documentation, JSDoc for inline comments, API for endpoint documentation, or Architecture for system design overviews.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-semibold">
                  3
                </span>
                <div>
                  <p className="text-slate-900 font-medium">Generate and review</p>
                  <p className="text-sm text-slate-600 mt-1">
                    Click "Generate Docs" and watch your documentation stream in real-time. Review the quality score to see what's working well and what could be improved.
                  </p>
                </div>
              </li>
            </ol>
          </section>

          {/* Quality Score Explanation */}
          <section>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-600" />
              Understanding Quality Scores
            </h3>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-12 text-center">
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded">
                    A
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-700">
                    <strong className="text-slate-900">90-100 points:</strong> Excellent documentation with comprehensive coverage, clear examples, and professional formatting.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-12 text-center">
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded">
                    B
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-700">
                    <strong className="text-slate-900">80-89 points:</strong> Good documentation with most sections covered, may need minor improvements.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-12 text-center">
                  <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">
                    C
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-700">
                    <strong className="text-slate-900">70-79 points:</strong> Adequate documentation with some gaps, should add more examples or details.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-12 text-center">
                  <span className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                    D-F
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-700">
                    <strong className="text-slate-900">Below 70:</strong> Needs significant improvement. Review the breakdown for specific suggestions.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ - Collapsible */}
          <section>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Frequently Asked Questions
            </h3>
            <div className="space-y-2">
              {faqs.map((faq, index) => {
                const isExpanded = expandedFAQ === index;
                return (
                  <div key={index} className="border border-slate-200 rounded-lg overflow-hidden transition-all duration-200 hover:shadow-sm">
                    <button
                      onClick={() => toggleFAQ(index)}
                      className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-600"
                      aria-expanded={isExpanded}
                      aria-controls={`faq-answer-${index}`}
                    >
                      <span className="text-sm font-semibold text-slate-900 pr-4">
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-600 flex-shrink-0 transition-transform duration-300 ease-in-out ${
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
                        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
                          <p className="text-sm text-slate-700 leading-relaxed">
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
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 rounded-b-xl z-10">
          <button
            onClick={handleClose}
            className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
          >
            Got it, let's start!
          </button>
        </div>
      </div>
    </div>
  );
}

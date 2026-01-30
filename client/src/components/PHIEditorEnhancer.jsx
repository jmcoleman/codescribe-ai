/**
 * PHI Editor Enhancer
 * Embeds PHI detection and sanitization directly into Monaco editor
 * with inline decorations, gutter markers, hover tooltips, and a review panel
 *
 * Key features:
 * - Direct code editing while PHI is highlighted
 * - Visual indicators (underlines, gutter icons)
 * - Quick actions for accept/skip/custom replacements
 * - Bottom panel for systematic review
 * - Real-time updates as code changes
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { AlertTriangle, Check, SkipForward, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import './PHIEditorEnhancer.css';

/**
 * Get suggested replacement text based on PHI type
 */
function getSuggestedReplacement(type) {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('email')) return 'user@example.com';
  if (lowerType.includes('phone')) return '555-0100';
  if (lowerType.includes('ssn') || lowerType.includes('social security')) return 'XXX-XX-XXXX';
  if (lowerType.includes('date')) return 'YYYY-MM-DD';
  if (lowerType.includes('name')) return 'John Doe';
  if (lowerType.includes('address')) return '123 Main St';
  if (lowerType.includes('id') || lowerType.includes('identifier')) return 'ID-XXXXX';
  return '[REDACTED]';
}

/**
 * Extract PHI items from detection data with line/column positions
 */
function extractPHIItems(phiDetection, code) {
  const items = [];
  const lines = code.split('\n');

  if (!phiDetection?.suggestions) return items;

  phiDetection.suggestions.forEach(suggestion => {
    if (!suggestion.examples || suggestion.examples.length === 0) return;

    suggestion.examples.forEach(example => {
      lines.forEach((line, lineIndex) => {
        let startCol = 0;
        while ((startCol = line.indexOf(example, startCol)) !== -1) {
          items.push({
            id: `${lineIndex + 1}-${startCol}`,
            lineNumber: lineIndex + 1,
            columnStart: startCol + 1, // Monaco uses 1-based columns
            columnEnd: startCol + example.length + 1,
            value: example,
            type: suggestion.title,
            message: suggestion.message,
            confidence: phiDetection.confidence,
            suggestedReplacement: getSuggestedReplacement(suggestion.title),
            state: 'pending' // 'pending' | 'accepted' | 'skipped'
          });
          startCol += example.length;
        }
      });
    });
  });

  return items;
}

/**
 * PHI Editor Enhancer Component
 */
export function PHIEditorEnhancer({
  editorInstance,
  monacoInstance,
  phiDetection,
  code,
  onCodeChange,
  onPhiResolved,
  effectiveTheme
}) {
  const [phiItems, setPhiItems] = useState([]);
  const [reviewState, setReviewState] = useState({});
  const [customReplacements, setCustomReplacements] = useState({});
  const [currentItemId, setCurrentItemId] = useState(null);
  const [panelExpanded, setPanelExpanded] = useState(true);
  const [showBackToFirst, setShowBackToFirst] = useState(false);

  const decorationsRef = useRef([]);
  const hoverProviderRef = useRef(null);
  const codeActionProviderRef = useRef(null);

  // Extract PHI items when detection data changes
  useEffect(() => {
    if (!phiDetection?.containsPHI) {
      setPhiItems([]);
      return;
    }

    const items = extractPHIItems(phiDetection, code);
    setPhiItems(items);
    setReviewState({});
    setCustomReplacements({});
    if (items.length > 0) {
      setCurrentItemId(items[0].id);
    }
  }, [phiDetection, code]);

  // Apply decorations to editor
  useEffect(() => {
    if (!editorInstance || !monacoInstance || phiItems.length === 0) {
      return;
    }

    const decorations = phiItems.map(item => {
      const state = reviewState[item.id];
      const isAccepted = state === 'accepted';
      const isSkipped = state === 'skipped';
      const isCurrent = item.id === currentItemId;

      return {
        range: new monacoInstance.Range(
          item.lineNumber,
          item.columnStart,
          item.lineNumber,
          item.columnEnd
        ),
        options: {
          className: isAccepted
            ? 'phi-accepted'
            : isSkipped
            ? 'phi-skipped'
            : getDecorationClass(item.confidence),
          glyphMarginClassName: isCurrent ? 'phi-gutter-icon-current' : 'phi-gutter-icon',
          hoverMessage: {
            value: `**⚠️ ${item.type}**\n\n${item.message}\n\nSuggested: \`${item.suggestedReplacement}\`\n\n*Click lightbulb (Ctrl+.) for quick actions*`
          },
          minimap: {
            color: getMinimapColor(item.confidence),
            position: monacoInstance.editor.MinimapPosition.Inline
          }
        }
      };
    });

    decorationsRef.current = editorInstance.deltaDecorations(decorationsRef.current, decorations);

    // Set model markers for problem panel integration
    const markers = phiItems.map(item => ({
      severity: monacoInstance.MarkerSeverity.Warning,
      message: `${item.type}: ${item.message}`,
      startLineNumber: item.lineNumber,
      startColumn: item.columnStart,
      endLineNumber: item.lineNumber,
      endColumn: item.columnEnd,
      source: 'PHI Detector'
    }));

    monacoInstance.editor.setModelMarkers(
      editorInstance.getModel(),
      'phi-detector',
      markers
    );

    return () => {
      // Cleanup decorations and markers
      if (editorInstance && decorationsRef.current) {
        editorInstance.deltaDecorations(decorationsRef.current, []);
      }
      if (monacoInstance && editorInstance) {
        monacoInstance.editor.setModelMarkers(
          editorInstance.getModel(),
          'phi-detector',
          []
        );
      }
    };
  }, [editorInstance, monacoInstance, phiItems, reviewState, currentItemId]);

  // Register hover provider
  useEffect(() => {
    if (!monacoInstance || phiItems.length === 0) return;

    const findPHIAtPosition = (position) => {
      return phiItems.find(item =>
        item.lineNumber === position.lineNumber &&
        item.columnStart <= position.column &&
        item.columnEnd >= position.column
      );
    };

    hoverProviderRef.current = monacoInstance.languages.registerHoverProvider('*', {
      provideHover: (model, position) => {
        const phiItem = findPHIAtPosition(position);
        if (!phiItem) return null;

        return {
          range: new monacoInstance.Range(
            phiItem.lineNumber,
            phiItem.columnStart,
            phiItem.lineNumber,
            phiItem.columnEnd
          ),
          contents: [
            { value: `**⚠️ ${phiItem.type}**` },
            { value: phiItem.message },
            { value: `Suggested: \`${phiItem.suggestedReplacement}\`` },
            { value: '_Click lightbulb for quick actions_' }
          ]
        };
      }
    });

    return () => {
      if (hoverProviderRef.current) {
        hoverProviderRef.current.dispose();
      }
    };
  }, [monacoInstance, phiItems]);

  // Register code action provider for quick fixes
  useEffect(() => {
    if (!monacoInstance || !editorInstance || phiItems.length === 0) return;

    const findPHIAtPosition = (position) => {
      return phiItems.find(item =>
        item.lineNumber === position.lineNumber &&
        item.columnStart <= position.column &&
        item.columnEnd >= position.column
      );
    };

    codeActionProviderRef.current = monacoInstance.languages.registerCodeActionProvider('*', {
      provideCodeActions: (model, range) => {
        const phiItem = findPHIAtPosition(range.getStartPosition());
        if (!phiItem) return { actions: [], dispose: () => {} };

        const actions = [
          {
            title: `✓ Replace with "${phiItem.suggestedReplacement}"`,
            kind: 'quickfix',
            edit: {
              edits: [{
                resource: model.uri,
                edit: {
                  range: new monacoInstance.Range(
                    phiItem.lineNumber,
                    phiItem.columnStart,
                    phiItem.lineNumber,
                    phiItem.columnEnd
                  ),
                  text: phiItem.suggestedReplacement
                }
              }]
            },
            isPreferred: true
          },
          {
            title: '⊘ Skip this occurrence',
            kind: 'quickfix',
            command: {
              id: 'phi.skip',
              title: 'Skip PHI',
              arguments: [phiItem.id]
            }
          }
        ];

        return {
          actions,
          dispose: () => {}
        };
      }
    });

    // Register command handlers
    const acceptCommand = editorInstance.addCommand(0, (accessor, itemId) => {
      handleAcceptPHI(itemId);
    });

    const skipCommand = editorInstance.addCommand(0, (accessor, itemId) => {
      handleSkipPHI(itemId);
    });

    return () => {
      if (codeActionProviderRef.current) {
        codeActionProviderRef.current.dispose();
      }
    };
  }, [monacoInstance, editorInstance, phiItems]);

  // Handle accept PHI
  const handleAcceptPHI = useCallback((itemId) => {
    setReviewState(prev => ({ ...prev, [itemId]: 'accepted' }));

    // Apply replacement immediately
    const item = phiItems.find(i => i.id === itemId);
    if (item && editorInstance) {
      const replacement = customReplacements[itemId] || item.suggestedReplacement;
      const newCode = code.replaceAll(item.value, replacement);
      onCodeChange(newCode);
    }

    // Move to next item
    const currentIndex = phiItems.findIndex(i => i.id === itemId);
    if (currentIndex < phiItems.length - 1) {
      setCurrentItemId(phiItems[currentIndex + 1].id);
    } else {
      setShowBackToFirst(true);
    }
  }, [phiItems, customReplacements, code, onCodeChange, editorInstance]);

  // Handle skip PHI
  const handleSkipPHI = useCallback((itemId) => {
    setReviewState(prev => ({ ...prev, [itemId]: 'skipped' }));

    // Move to next item
    const currentIndex = phiItems.findIndex(i => i.id === itemId);
    if (currentIndex < phiItems.length - 1) {
      setCurrentItemId(phiItems[currentIndex + 1].id);
    } else {
      setShowBackToFirst(true);
    }
  }, [phiItems]);

  // Jump to PHI location in editor
  const jumpToPHI = useCallback((itemId) => {
    const item = phiItems.find(i => i.id === itemId);
    if (!item || !editorInstance) return;

    setCurrentItemId(itemId);
    editorInstance.revealLineInCenter(item.lineNumber);
    editorInstance.setPosition({
      lineNumber: item.lineNumber,
      column: item.columnStart
    });
    editorInstance.focus();
  }, [phiItems, editorInstance]);

  // Apply all changes
  const handleApplyAllChanges = useCallback(() => {
    let sanitizedCode = code;
    const replacements = [];

    phiItems.forEach(item => {
      if (reviewState[item.id] === 'accepted') {
        const replacement = customReplacements[item.id] || item.suggestedReplacement;
        replacements.push({ value: item.value, replacement });
      }
    });

    // Apply replacements
    replacements.forEach(rep => {
      sanitizedCode = sanitizedCode.replaceAll(rep.value, rep.replacement);
    });

    onCodeChange(sanitizedCode);

    // Notify parent that PHI is resolved
    if (onPhiResolved) {
      onPhiResolved();
    }
  }, [phiItems, reviewState, customReplacements, code, onCodeChange, onPhiResolved]);

  // Calculate progress
  const reviewedCount = Object.keys(reviewState).length;
  const acceptedCount = Object.values(reviewState).filter(s => s === 'accepted').length;
  const skippedCount = Object.values(reviewState).filter(s => s === 'skipped').length;
  const progress = phiItems.length > 0 ? (reviewedCount / phiItems.length) * 100 : 0;

  if (phiItems.length === 0) {
    return null;
  }

  return (
    <div className="phi-editor-enhancer">
      {/* Bottom Panel */}
      <div className={`phi-review-panel ${panelExpanded ? 'expanded' : 'collapsed'} ${
        effectiveTheme === 'dark' ? 'dark' : 'light'
      }`}>
        {/* Panel Header */}
        <div className="phi-panel-header">
          <div className="phi-panel-title">
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            <span>Protected Health Information Detected ({phiItems.length} items)</span>
          </div>
          <button
            onClick={() => setPanelExpanded(!panelExpanded)}
            className="phi-panel-toggle"
            aria-label={panelExpanded ? 'Collapse panel' : 'Expand panel'}
          >
            {panelExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* Panel Content */}
        {panelExpanded && (
          <>
            {/* Progress Bar */}
            <div className="phi-progress-bar">
              <div className="phi-progress-fill" style={{ width: `${progress}%` }} />
            </div>

            {/* Stats */}
            <div className="phi-stats">
              <span className="phi-stat-accepted">✓ {acceptedCount} Accepted</span>
              <span className="phi-stat-skipped">⊘ {skippedCount} Skipped</span>
              <span className="phi-stat-pending">⋯ {phiItems.length - reviewedCount} Pending</span>
            </div>

            {/* PHI Items Table */}
            <div className="phi-items-table">
              <table>
                <thead>
                  <tr>
                    <th className="phi-col-status">Status</th>
                    <th className="phi-col-type">Type & Location</th>
                    <th className="phi-col-found">Found</th>
                    <th className="phi-col-action">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {phiItems.map((item) => {
                    const state = reviewState[item.id];
                    const isCurrent = item.id === currentItemId;

                    return (
                      <tr
                        key={item.id}
                        className={`phi-item-row ${isCurrent ? 'current' : ''} ${state || 'pending'}`}
                        onClick={() => jumpToPHI(item.id)}
                      >
                        <td className="phi-col-status">
                          {state === 'accepted' && <Check className="w-4 h-4 text-green-600" />}
                          {state === 'skipped' && <SkipForward className="w-4 h-4 text-slate-400" />}
                          {!state && <span className="phi-pending-indicator">•</span>}
                        </td>
                        <td className="phi-col-type">
                          <div className="phi-type-label">{item.type}</div>
                          <div className="phi-location">Line {item.lineNumber}</div>
                        </td>
                        <td className="phi-col-found">
                          <code>{item.value.length > 20 ? item.value.substring(0, 20) + '…' : item.value}</code>
                        </td>
                        <td className="phi-col-action">
                          {!state && (
                            <div className="phi-action-buttons">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAcceptPHI(item.id);
                                }}
                                className="phi-btn-accept"
                                title="Accept replacement"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSkipPHI(item.id);
                                }}
                                className="phi-btn-skip"
                                title="Skip this item"
                              >
                                <SkipForward className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                          {state === 'accepted' && <span className="phi-state-label">Accepted</span>}
                          {state === 'skipped' && <span className="phi-state-label">Skipped</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer Actions */}
            <div className="phi-panel-footer">
              <div className="phi-footer-left">
                Progress: {reviewedCount}/{phiItems.length} Reviewed
              </div>
              <div className="phi-footer-right">
                {showBackToFirst && (
                  <button
                    onClick={() => {
                      setCurrentItemId(phiItems[0].id);
                      jumpToPHI(phiItems[0].id);
                      setShowBackToFirst(false);
                    }}
                    className="phi-btn-back-to-first"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to First
                  </button>
                )}
                <button
                  onClick={handleApplyAllChanges}
                  disabled={acceptedCount === 0}
                  className="phi-btn-apply"
                >
                  Apply All Changes ({acceptedCount})
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Helper functions for decoration styling
 */
function getDecorationClass(confidence) {
  if (confidence === 'high') return 'phi-high-severity';
  if (confidence === 'medium') return 'phi-medium-severity';
  return 'phi-low-severity';
}

function getMinimapColor(confidence) {
  if (confidence === 'high') return '#ef4444'; // red-500
  if (confidence === 'medium') return '#f59e0b'; // amber-500
  return '#eab308'; // yellow-500
}

export default PHIEditorEnhancer;

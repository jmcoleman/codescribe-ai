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
import { AlertTriangle, Check, X, ChevronDown, ChevronUp, ArrowLeft, ArrowUpDown, GripVertical, Undo } from 'lucide-react';
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
 * Create stable content-based ID for PHI value
 * Same PHI value always gets the same contentId (for linking custom replacements)
 */
function createContentId(value, type) {
  const str = `${type}:${value}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `phi-${Math.abs(hash)}`;
}

/**
 * Extract PHI items from detection data with line/column positions
 * Uses hybrid ID system:
 * - id: Unique per occurrence (for row selection/highlighting)
 * - contentId: Same for all occurrences of same PHI (for custom replacements)
 */
function extractPHIItems(phiDetection, code) {
  const items = [];
  const lines = code.split('\n');
  const occurrenceCounts = new Map(); // Track occurrence count per contentId

  if (!phiDetection?.suggestions) return items;

  phiDetection.suggestions.forEach(suggestion => {
    if (!suggestion.examples || suggestion.examples.length === 0) return;

    suggestion.examples.forEach(example => {
      lines.forEach((line, lineIndex) => {
        let startCol = 0;
        while ((startCol = line.indexOf(example, startCol)) !== -1) {
          const contentId = createContentId(example, suggestion.title);

          // Get occurrence count for this contentId
          const occurrenceCount = occurrenceCounts.get(contentId) || 0;
          occurrenceCounts.set(contentId, occurrenceCount + 1);

          items.push({
            id: `${contentId}-${occurrenceCount}`, // Unique ID per occurrence
            contentId: contentId, // Stable ID for same PHI value
            lineNumber: lineIndex + 1,
            columnStart: startCol + 1,
            columnEnd: startCol + example.length + 1,
            value: example,
            type: suggestion.title,
            message: suggestion.message,
            confidence: phiDetection.confidence,
            suggestedReplacement: getSuggestedReplacement(suggestion.title),
            state: 'pending'
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
  onProceed,
  effectiveTheme
}) {
  const [phiItems, setPhiItems] = useState([]);
  const [reviewState, setReviewState] = useState({});
  const [customReplacements, setCustomReplacements] = useState({});
  const [originalValues, setOriginalValues] = useState({}); // Store original PHI values for revert (immutable "Found" column)
  const [currentItemId, setCurrentItemId] = useState(null);
  const [panelExpanded, setPanelExpanded] = useState(true);
  const [showBackToFirst, setShowBackToFirst] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [confirmed, setConfirmed] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null); // Track which replacement cell is being edited
  // Load column widths from localStorage or use defaults
  const getInitialColumnWidths = () => {
    const stored = localStorage.getItem('phiTableColumnWidths');
    const defaults = {
      status: 105,
      line: 40,
      id: 125,
      type: 180,
      found: 400,
      replacement: 350,
      action: 110
    };

    if (stored) {
      try {
        return { ...defaults, ...JSON.parse(stored) };
      } catch (e) {
        return defaults;
      }
    }
    return defaults;
  };

  const [columnWidths, setColumnWidths] = useState(getInitialColumnWidths());

  // Save column widths to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('phiTableColumnWidths', JSON.stringify(columnWidths));
  }, [columnWidths]);

  const decorationsRef = useRef([]);
  const hoverProviderRef = useRef(null);
  const codeActionProviderRef = useRef(null);
  const panelRef = useRef(null);
  const panelHeaderRef = useRef(null); // For focus management when Escape closes drawer
  const resizingRef = useRef(null);
  const currentRowRef = useRef(null);
  const tableContainerRef = useRef(null);

  // Extract PHI items when detection data changes
  // Preserve review state and custom replacements using stable content-based IDs
  useEffect(() => {
    if (!phiDetection?.containsPHI) {
      setPhiItems([]);
      setReviewState({});
      setCustomReplacements({});
      setOriginalValues({});
      return;
    }

    const items = extractPHIItems(phiDetection, code);
    setPhiItems(items);

    // Preserve review state for items with matching contentIds (same PHI value)
    setReviewState(prev => {
      const preserved = {};
      items.forEach(item => {
        if (prev[item.contentId]) {
          preserved[item.contentId] = prev[item.contentId];
        }
      });
      return preserved;
    });

    // Preserve custom replacements for items with matching contentIds
    setCustomReplacements(prev => {
      const preserved = {};
      items.forEach(item => {
        if (prev[item.contentId]) {
          preserved[item.contentId] = prev[item.contentId];
        }
      });
      return preserved;
    });

    // Preserve original values for revert functionality
    setOriginalValues(prev => {
      const preserved = {};
      items.forEach(item => {
        if (prev[item.contentId]) {
          preserved[item.contentId] = prev[item.contentId];
        }
      });
      return preserved;
    });

    if (items.length > 0 && !currentItemId) {
      setCurrentItemId(items[0].id);
    }
  }, [phiDetection, code, currentItemId]);

  // Apply decorations to editor
  useEffect(() => {
    if (!editorInstance || !monacoInstance || phiItems.length === 0) {
      return;
    }

    const decorations = phiItems.map(item => {
      const state = reviewState[item.contentId];
      const isAccepted = state === 'accepted';
      const isSkipped = state === 'skipped';
      const isCurrent = item.id === currentItemId; // Use unique id for current row

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

  /**
   * Note: Monaco → Table sync is not implemented because:
   * 1. When user edits PHI in Monaco, the value changes
   * 2. This changes the content-based ID, breaking the link to the original item
   * 3. PHI re-detection runs after edits (1 sec debounce), creating fresh scan
   * 4. Best practice: Use table for systematic sanitization, Monaco for code editing
   *
   * Workflow:
   * - User edits replacement in table → Applies to Monaco on Accept ✅
   * - User edits code in Monaco → Triggers re-detection → Fresh PHI scan ✅
   */

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

  // Handle replacement text edit in table - updates Monaco editor
  const handleReplacementEdit = useCallback((itemId, newReplacement) => {
    const item = phiItems.find(i => i.id === itemId);
    if (!item || !editorInstance) return;

    // Store the custom replacement using contentId (shared across all occurrences)
    setCustomReplacements(prev => ({
      ...prev,
      [item.contentId]: newReplacement
    }));

    // If this item is already accepted, update the code in Monaco immediately
    if (reviewState[item.contentId] === 'accepted') {
      const oldReplacement = customReplacements[item.contentId] || item.suggestedReplacement;
      const newCode = code.replaceAll(oldReplacement, newReplacement);
      onCodeChange(newCode);
    }
  }, [phiItems, reviewState, customReplacements, code, onCodeChange, editorInstance]);

  // Handle accept PHI - apply immediately to ALL occurrences of this PHI
  const handleAcceptPHI = useCallback((itemId) => {
    const item = phiItems.find(i => i.id === itemId);
    if (!item) return;

    // Use contentId to mark ALL occurrences as accepted
    setReviewState(prev => ({ ...prev, [item.contentId]: 'accepted' }));

    // Store original value for revert (immutable "Found" column)
    setOriginalValues(prev => ({ ...prev, [item.contentId]: item.value }));

    // Apply replacement immediately to all occurrences
    if (editorInstance) {
      const replacement = customReplacements[item.contentId] || item.suggestedReplacement;
      const newCode = code.replaceAll(item.value, replacement);
      onCodeChange(newCode);
    }

    // Move to next item (use unique id for navigation)
    const currentIndex = phiItems.findIndex(i => i.id === itemId);
    if (currentIndex < phiItems.length - 1) {
      setCurrentItemId(phiItems[currentIndex + 1].id);
    } else {
      setShowBackToFirst(true);
    }
  }, [phiItems, customReplacements, code, onCodeChange, editorInstance]);

  // Handle skip PHI - mark ALL occurrences of this PHI as skipped
  const handleSkipPHI = useCallback((itemId) => {
    const item = phiItems.find(i => i.id === itemId);
    if (!item) return;

    // Use contentId to mark ALL occurrences as skipped
    setReviewState(prev => ({ ...prev, [item.contentId]: 'skipped' }));

    // Move to next item (use unique id for navigation)
    const currentIndex = phiItems.findIndex(i => i.id === itemId);
    if (currentIndex < phiItems.length - 1) {
      setCurrentItemId(phiItems[currentIndex + 1].id);
    } else {
      setShowBackToFirst(true);
    }
  }, [phiItems]);

  // Handle revert PHI - undo a previous application for ALL occurrences
  const handleRevertPHI = useCallback((itemId) => {
    const item = phiItems.find(i => i.id === itemId);
    if (!item) return;

    const originalValue = originalValues[item.contentId];
    if (!originalValue || !editorInstance) return;

    // Revert: replace the replacement back to stored original value
    const replacement = customReplacements[item.contentId] || item.suggestedReplacement;
    const newCode = code.replaceAll(replacement, originalValue);
    onCodeChange(newCode);

    // Reset state to pending and clear stored original (use contentId)
    setReviewState(prev => {
      const updated = { ...prev };
      delete updated[item.contentId];
      return updated;
    });
    setOriginalValues(prev => {
      const updated = { ...prev };
      delete updated[item.contentId];
      return updated;
    });
  }, [phiItems, originalValues, customReplacements, code, onCodeChange, editorInstance]);

  // Revert a skipped item back to pending (ALL occurrences)
  const handleUnskipPHI = useCallback((itemId) => {
    const item = phiItems.find(i => i.id === itemId);
    if (!item) return;

    // Use contentId to unskip ALL occurrences
    setReviewState(prev => {
      const updated = { ...prev };
      delete updated[item.contentId];
      return updated;
    });
  }, [phiItems]);

  // Revert all applied changes and skipped items at once
  const handleRevertAllChanges = useCallback(() => {
    let revertedCode = code;
    const reversions = [];
    const processedContentIds = new Set();

    // Collect all applied items to revert (only once per contentId)
    phiItems.forEach(item => {
      if (processedContentIds.has(item.contentId)) return;
      processedContentIds.add(item.contentId);

      const state = reviewState[item.contentId];
      const originalValue = originalValues[item.contentId];
      if (state === 'accepted' && originalValue) {
        const replacement = customReplacements[item.contentId] || item.suggestedReplacement;
        reversions.push({ replacement, originalValue });
      }
    });

    // Apply all reversions
    reversions.forEach(rev => {
      revertedCode = revertedCode.replaceAll(rev.replacement, rev.originalValue);
    });

    if (reversions.length > 0) {
      onCodeChange(revertedCode);
    }

    // Reset all accepted AND skipped items to pending
    setReviewState({});
    setOriginalValues({});
  }, [phiItems, reviewState, originalValues, customReplacements, code, onCodeChange]);

  // Jump to PHI location in editor and keep table focused for arrow navigation
  const jumpToPHI = useCallback((itemId) => {
    const item = phiItems.find(i => i.id === itemId);
    if (!item || !editorInstance) return;

    setCurrentItemId(itemId);
    editorInstance.revealLineInCenter(item.lineNumber);
    editorInstance.setPosition({
      lineNumber: item.lineNumber,
      column: item.columnStart
    });

    // Keep table focused so arrow keys continue to work
    if (tableContainerRef.current) {
      tableContainerRef.current.focus();
    }
  }, [phiItems, editorInstance]);

  // Handle keyboard navigation - industry standard patterns
  const handleKeyDown = useCallback((e) => {
    if (phiItems.length === 0) return;

    let currentIndex = phiItems.findIndex(i => i.id === currentItemId);

    // If no item selected yet, start from -1 so first arrow down goes to index 0
    if (currentIndex === -1 && !currentItemId) {
      currentIndex = e.key === 'ArrowDown' ? -1 : 0;
    }

    const navigateToItem = (index) => {
      const item = phiItems[index];
      setCurrentItemId(item.id);
      if (editorInstance) {
        editorInstance.revealLineInCenter(item.lineNumber);
        editorInstance.setPosition({
          lineNumber: item.lineNumber,
          column: item.columnStart
        });
      }
    };

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        navigateToItem(Math.min(currentIndex + 1, phiItems.length - 1));
        break;

      case 'ArrowUp':
        e.preventDefault();
        navigateToItem(Math.max(currentIndex - 1, 0));
        break;

      case 'Home':
        e.preventDefault();
        navigateToItem(0);
        break;

      case 'End':
        e.preventDefault();
        navigateToItem(phiItems.length - 1);
        break;

      case 'Enter':
      case ' ': // Space key
        e.preventDefault();
        // Apply replacement for current item
        if (currentIndex >= 0 && currentIndex < phiItems.length) {
          const currentItem = phiItems[currentIndex];
          const state = reviewState[currentItem.contentId];
          if (!state) {
            // Only apply if not already applied or skipped
            handleAcceptPHI(currentItem.id);
          }
        }
        break;

      default:
        break;
    }
  }, [phiItems, currentItemId, editorInstance, reviewState, handleAcceptPHI]);

  // Sort PHI items
  const handleSort = useCallback((key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  }, [sortConfig]);

  // Get sorted items
  const getSortedItems = useCallback(() => {
    if (!sortConfig.key) return phiItems;

    return [...phiItems].sort((a, b) => {
      let aVal, bVal;

      switch (sortConfig.key) {
        case 'status':
          aVal = reviewState[a.contentId] || 'pending';
          bVal = reviewState[b.contentId] || 'pending';
          break;
        case 'line':
          aVal = a.lineNumber;
          bVal = b.lineNumber;
          break;
        case 'type':
          aVal = a.type;
          bVal = b.type;
          break;
        case 'location':
          aVal = a.lineNumber;
          bVal = b.lineNumber;
          break;
        case 'found':
          aVal = a.value;
          bVal = b.value;
          break;
        case 'replacement':
          aVal = customReplacements[a.contentId] || a.suggestedReplacement;
          bVal = customReplacements[b.contentId] || b.suggestedReplacement;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [phiItems, sortConfig, reviewState, customReplacements]);

  // Column-specific minimum widths (all resizable columns except #)
  // Set very small minimums to give users maximum control
  const getMinColumnWidth = useCallback((column) => {
    const minimums = {
      status: 30,      // Can shrink very small
      line: 20,        // Can shrink very small
      id: 30,          // Can shrink very small
      type: 30,        // Can shrink very small
      found: 30,       // Can shrink very small
      replacement: 30, // Can shrink very small
      action: 30       // Can shrink very small
    };
    return minimums[column] || 30;
  }, []);

  // Handle column resize
  const handleColumnResize = useCallback((column, deltaX) => {
    const minWidth = getMinColumnWidth(column);
    setColumnWidths(prev => ({
      ...prev,
      [column]: Math.max(minWidth, prev[column] + deltaX)
    }));
  }, [getMinColumnWidth]);

  const startResize = useCallback((e, column) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = columnWidths[column];
    const minWidth = getMinColumnWidth(column);

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      setColumnWidths(prev => ({
        ...prev,
        [column]: Math.max(minWidth, startWidth + deltaX)
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [columnWidths, getMinColumnWidth]);

  // Apply all pending changes (shortcut to apply everything at once)
  const handleApplyAllChanges = useCallback(() => {
    let sanitizedCode = code;
    const replacements = [];
    const originals = {};
    const updatedReviewState = { ...reviewState };
    const processedContentIds = new Set();

    // Apply all pending items (not already applied or skipped, only once per contentId)
    phiItems.forEach(item => {
      if (processedContentIds.has(item.contentId)) return;
      processedContentIds.add(item.contentId);

      const state = reviewState[item.contentId];
      if (!state || state === 'pending') {
        const replacement = customReplacements[item.contentId] || item.suggestedReplacement;
        replacements.push({ value: item.value, replacement });
        // Store original value for revert
        originals[item.contentId] = item.value;
        // Mark as accepted
        updatedReviewState[item.contentId] = 'accepted';
      }
    });

    // Update states
    setReviewState(updatedReviewState);
    if (Object.keys(originals).length > 0) {
      setOriginalValues(prev => ({ ...prev, ...originals }));
    }

    // Apply replacements
    replacements.forEach(rep => {
      sanitizedCode = sanitizedCode.replaceAll(rep.value, rep.replacement);
    });

    if (replacements.length > 0) {
      onCodeChange(sanitizedCode);
    }

    // Notify parent that PHI is resolved
    if (onPhiResolved) {
      onPhiResolved();
    }
  }, [phiItems, reviewState, customReplacements, code, onCodeChange, onPhiResolved]);

  // Skip all pending items (mark as skipped without applying replacements)
  const handleSkipAllPending = useCallback(() => {
    const updatedReviewState = { ...reviewState };
    const processedContentIds = new Set();

    // Mark all pending items as skipped (only once per contentId)
    phiItems.forEach(item => {
      if (processedContentIds.has(item.contentId)) return;
      processedContentIds.add(item.contentId);

      const state = reviewState[item.contentId];
      if (!state || state === 'pending') {
        updatedReviewState[item.contentId] = 'skipped';
      }
    });

    setReviewState(updatedReviewState);

    // Move to first item if showing "Back to First"
    if (phiItems.length > 0) {
      setCurrentItemId(phiItems[0].id);
      setShowBackToFirst(false);
    }
  }, [phiItems, reviewState]);

  // Note: Keyboard handler is attached via onKeyDown prop on the table container
  // This ensures immediate event handling without timing issues

  // Global Escape key to close drawer
  useEffect(() => {
    if (!panelExpanded) return;

    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        // Check if Monaco editor has focus - if so, let it handle Escape first
        const editorHasFocus = editorInstance && editorInstance.hasTextFocus();

        if (!editorHasFocus) {
          // Editor doesn't have focus, so close the drawer
          setPanelExpanded(false);

          // Focus the panel header toggle button so user knows where they are
          setTimeout(() => {
            if (panelHeaderRef.current) {
              panelHeaderRef.current.focus();
            }
          }, 100);
        }
        // If editor has focus, Monaco will handle Escape to exit the editor (via onKeyDown above)
      }
    };

    window.addEventListener('keydown', handleEscapeKey);
    return () => window.removeEventListener('keydown', handleEscapeKey);
  }, [panelExpanded, editorInstance]);

  // Scroll current row into view when it changes
  useEffect(() => {
    if (currentRowRef.current) {
      currentRowRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center', // Center in viewport to avoid sticky header overlap
        inline: 'nearest'
      });
    }
  }, [currentItemId]);

  // Select first item when panel opens if none selected
  useEffect(() => {
    if (panelExpanded && phiItems.length > 0) {
      // If no item is selected, select the first one
      if (!currentItemId) {
        setCurrentItemId(phiItems[0].id);
      }
    }
  }, [panelExpanded, phiItems, currentItemId]);

  // Calculate progress
  // Calculate counts based on unique PHI values (contentIds)
  const uniqueContentIds = new Set(phiItems.map(item => item.contentId));
  const totalUniquePhiCount = uniqueContentIds.size;

  const reviewedCount = Object.keys(reviewState).length;
  const acceptedCount = Object.values(reviewState).filter(s => s === 'accepted').length;
  const skippedCount = Object.values(reviewState).filter(s => s === 'skipped').length;
  const revertableCount = acceptedCount + skippedCount; // Both can be reverted
  const pendingCount = totalUniquePhiCount - reviewedCount;
  const progress = totalUniquePhiCount > 0 ? (reviewedCount / totalUniquePhiCount) * 100 : 0;

  const sortedItems = getSortedItems();

  // Always render if there are PHI items, regardless of editor state
  // The panel will show even if editor refs are temporarily null during view transitions
  if (phiItems.length === 0) {
    return null;
  }

  return (
    <div className="phi-editor-enhancer">
      {/* Bottom Panel */}
      <div
        ref={panelRef}
        className={`phi-review-panel ${panelExpanded ? 'expanded' : 'collapsed'} ${
          effectiveTheme === 'dark' ? 'dark' : 'light'
        }`}
      >
        {/* Panel Header - Entire header is clickable */}
        <div
          ref={panelHeaderRef}
          className="phi-panel-header"
          aria-controls="phi-panel-content"
        >
          <div className="phi-panel-title">
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            <span>
              <span className="lg:hidden">PHI Detected ({totalUniquePhiCount} unique, {phiItems.length} total)</span>
              <span className="hidden lg:inline">Protected Health Information Detected ({totalUniquePhiCount} unique values, {phiItems.length} occurrences)</span>
            </span>
            {phiDetection?.confidence && (
              <span
                className={`phi-confidence-badge phi-confidence-${phiDetection.confidence}`}
                title={`Detection confidence: ${phiDetection.confidence}`}
              >
                {phiDetection.confidence.charAt(0).toUpperCase() + phiDetection.confidence.slice(1)} Confidence
              </span>
            )}
          </div>

          {/* Confirmation Checkbox - In Header */}
          <label
            className="phi-header-confirmation"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              id="phi-confirmation-header"
              checked={confirmed}
              onChange={(e) => {
                setConfirmed(e.target.checked);
                if (e.target.checked && onProceed) {
                  onProceed();
                }
              }}
              className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-purple-600 dark:text-purple-400 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-0 transition-colors flex-shrink-0"
              aria-describedby="phi-confirmation-header-label"
            />
            <span
              id="phi-confirmation-header-label"
              className="text-sm leading-tight text-slate-700 dark:text-slate-300 transition-opacity"
            >
              <span className="hidden sm:inline">I confirm this code contains no actual PHI and is safe to process</span>
              <span className="sm:hidden">Confirm: No actual PHI</span>
            </span>
          </label>

          <div
            className="phi-panel-toggle"
            onClick={() => setPanelExpanded(!panelExpanded)}
            role="button"
            tabIndex={-1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setPanelExpanded(!panelExpanded);
              }
            }}
            aria-expanded={panelExpanded}
            aria-label={panelExpanded ? 'Collapse PHI review panel' : 'Expand PHI review panel'}
          >
            {panelExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>
        </div>

        {/* Panel Content */}
        {panelExpanded && (
          <div id="phi-panel-content">
            {/* Stats */}
            <div className="phi-stats">
              <span className="phi-stat-accepted">✓ {acceptedCount} Accepted</span>
              <span className="phi-stat-skipped">⊘ {skippedCount} Skipped</span>
              <span className="phi-stat-pending">⋯ {pendingCount} Pending</span>
            </div>

            {/* PHI Items Table */}
            <div
              ref={tableContainerRef}
              className="phi-items-table"
              tabIndex={-1}
              role="grid"
              aria-label="PHI items list - use arrow keys to navigate, Enter to apply, Escape to close"
              aria-rowcount={phiItems.length}
              onKeyDown={handleKeyDown}
            >
              <table>
                <thead>
                  <tr role="row">
                    <th
                      className="phi-col-number"
                      role="columnheader"
                      title="Entry number in table"
                    >
                      #
                    </th>
                    <th
                      className="phi-col-status phi-col-resizable"
                      style={{ width: `${columnWidths.status}px` }}
                      role="columnheader"
                    >
                      <div className="phi-col-header">
                        <button
                          className="phi-col-sort-btn"
                          onClick={() => handleSort('status')}
                          title="Sort by status"
                        >
                          Status
                          {sortConfig.key === 'status' && (
                            <ArrowUpDown className="w-3 h-3 ml-1" />
                          )}
                        </button>
                        <div
                          className="phi-col-resize-handle"
                          onMouseDown={(e) => startResize(e, 'status')}
                        >
                          <GripVertical className="w-3 h-3" />
                        </div>
                      </div>
                    </th>
                    <th
                      className="phi-col-line phi-col-resizable"
                      style={{ width: `${columnWidths.line}px` }}
                      role="columnheader"
                    >
                      <div className="phi-col-header">
                        <button
                          className="phi-col-sort-btn"
                          onClick={() => handleSort('line')}
                          title="Sort by line number"
                        >
                          Line
                          {sortConfig.key === 'line' && (
                            <ArrowUpDown className="w-3 h-3 ml-1" />
                          )}
                        </button>
                        <div
                          className="phi-col-resize-handle"
                          onMouseDown={(e) => startResize(e, 'line')}
                        >
                          <GripVertical className="w-3 h-3" />
                        </div>
                      </div>
                    </th>
                    <th
                      className="phi-col-id phi-col-resizable"
                      style={{ width: `${columnWidths.id}px` }}
                      role="columnheader"
                    >
                      <div className="phi-col-header">
                        <span className="phi-col-sort-btn" title="Unique ID for this occurrence">
                          ID
                        </span>
                        <div
                          className="phi-col-resize-handle"
                          onMouseDown={(e) => startResize(e, 'id')}
                        >
                          <GripVertical className="w-3 h-3" />
                        </div>
                      </div>
                    </th>
                    <th
                      className="phi-col-type phi-col-resizable"
                      style={{ width: `${columnWidths.type}px` }}
                      role="columnheader"
                    >
                      <div className="phi-col-header">
                        <button
                          className="phi-col-sort-btn"
                          onClick={() => handleSort('type')}
                          title="Sort by type"
                        >
                          Type
                          {sortConfig.key === 'type' && (
                            <ArrowUpDown className="w-3 h-3 ml-1" />
                          )}
                        </button>
                        <div
                          className="phi-col-resize-handle"
                          onMouseDown={(e) => startResize(e, 'type')}
                        >
                          <GripVertical className="w-3 h-3" />
                        </div>
                      </div>
                    </th>
                    <th
                      className="phi-col-found phi-col-resizable"
                      style={{ width: `${columnWidths.found}px` }}
                      role="columnheader"
                    >
                      <div className="phi-col-header">
                        <button
                          className="phi-col-sort-btn"
                          onClick={() => handleSort('found')}
                          title="Sort by found value"
                        >
                          Found
                          {sortConfig.key === 'found' && (
                            <ArrowUpDown className="w-3 h-3 ml-1" />
                          )}
                        </button>
                        <div
                          className="phi-col-resize-handle"
                          onMouseDown={(e) => startResize(e, 'found')}
                        >
                          <GripVertical className="w-3 h-3" />
                        </div>
                      </div>
                    </th>
                    <th
                      className="phi-col-replacement phi-col-resizable"
                      style={{ width: `${columnWidths.replacement}px` }}
                      role="columnheader"
                    >
                      <div className="phi-col-header">
                        <button
                          className="phi-col-sort-btn"
                          onClick={() => handleSort('replacement')}
                          title="Sort by replacement value"
                        >
                          Replacement
                          {sortConfig.key === 'replacement' && (
                            <ArrowUpDown className="w-3 h-3 ml-1" />
                          )}
                        </button>
                        <div
                          className="phi-col-resize-handle"
                          onMouseDown={(e) => startResize(e, 'replacement')}
                        >
                          <GripVertical className="w-3 h-3" />
                        </div>
                      </div>
                    </th>
                    <th
                      className="phi-col-action phi-col-resizable"
                      style={{ width: `${columnWidths.action}px` }}
                      role="columnheader"
                    >
                      <div className="phi-col-header">
                        <span>Action</span>
                        <div
                          className="phi-col-resize-handle"
                          onMouseDown={(e) => startResize(e, 'action')}
                        >
                          <GripVertical className="w-3 h-3" />
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map((item, index) => {
                    const state = reviewState[item.contentId]; // Use contentId for shared state
                    const isCurrent = item.id === currentItemId; // Use unique id for current row

                    return (
                      <tr
                        key={item.id}
                        ref={isCurrent ? currentRowRef : null}
                        className={`phi-item-row ${isCurrent ? 'current' : ''} ${state || 'pending'}`}
                        onClick={() => jumpToPHI(item.id)}
                        role="row"
                        aria-rowindex={index + 1}
                        aria-selected={isCurrent}
                      >
                        <td className="phi-col-number" role="gridcell">
                          {index + 1}
                        </td>
                        <td className="phi-col-status" role="gridcell">
                          <div className="phi-status-cell">
                            {state === 'accepted' && (
                              <>
                                <Check className="w-4 h-4" aria-hidden="true" />
                                <span className="phi-status-text">Applied</span>
                              </>
                            )}
                            {state === 'skipped' && (
                              <>
                                <X className="w-4 h-4" aria-hidden="true" />
                                <span className="phi-status-text">Skipped</span>
                              </>
                            )}
                            {!state && (
                              <>
                                <span className="phi-pending-indicator">•</span>
                                <span className="phi-status-text">Pending</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="phi-col-line" role="gridcell">
                          {item.lineNumber}
                        </td>
                        <td className="phi-col-id" role="gridcell">
                          {item.id}
                        </td>
                        <td className="phi-col-type" role="gridcell">
                          {item.type}
                        </td>
                        <td className="phi-col-found" role="gridcell" title="Original detected PHI (immutable)">
                          <code>{item.value}</code>
                        </td>
                        <td
                          className="phi-col-replacement"
                          role="gridcell"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <code
                            className="phi-replacement-preview"
                            contentEditable={true}
                            suppressContentEditableWarning={true}
                            onFocus={(e) => {
                              setEditingItemId(item.id);
                              // Select all text on focus
                              const range = document.createRange();
                              range.selectNodeContents(e.target);
                              const sel = window.getSelection();
                              sel.removeAllRanges();
                              sel.addRange(range);
                            }}
                            onBlur={(e) => {
                              const newValue = e.target.textContent.trim();
                              if (newValue && newValue !== (customReplacements[item.contentId] || item.suggestedReplacement)) {
                                handleReplacementEdit(item.id, newValue);
                              }
                              setEditingItemId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.target.blur(); // Trigger onBlur to save
                              }
                              if (e.key === 'Escape') {
                                e.preventDefault();
                                // Revert to original value
                                e.target.textContent = customReplacements[item.contentId] || item.suggestedReplacement;
                                e.target.blur();
                              }
                              // Stop propagation to prevent table navigation
                              e.stopPropagation();
                            }}
                            title="Click to edit replacement value"
                            style={{
                              cursor: editingItemId === item.id ? 'text' : 'pointer',
                              outline: editingItemId === item.id ? '2px solid rgb(147, 51, 234)' : 'none',
                              outlineOffset: '2px'
                            }}
                          >
                            {customReplacements[item.contentId] || item.suggestedReplacement}
                          </code>
                        </td>
                        <td className="phi-col-action" role="gridcell">
                          {!state && (
                            <div className="phi-action-buttons">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAcceptPHI(item.id);
                                }}
                                className="phi-btn-action phi-btn-apply-item"
                                title="Apply replacement"
                                aria-label="Apply replacement"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSkipPHI(item.id);
                                }}
                                className="phi-btn-action phi-btn-skip-item"
                                title="Don't apply (skip)"
                                aria-label="Don't apply"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                          {state === 'accepted' && (
                            <div className="phi-action-buttons">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRevertPHI(item.id);
                                }}
                                className="phi-btn-action phi-btn-revert"
                                title="Revert to pending"
                                aria-label="Revert to pending"
                              >
                                <Undo className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                          {state === 'skipped' && (
                            <div className="phi-action-buttons">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUnskipPHI(item.id);
                                }}
                                className="phi-btn-action phi-btn-unskip"
                                title="Revert to pending"
                                aria-label="Revert to pending"
                              >
                                <Undo className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
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
                Progress: {reviewedCount}/{totalUniquePhiCount} Unique PHI Reviewed
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
                  onClick={handleRevertAllChanges}
                  disabled={revertableCount === 0}
                  className="phi-btn-revert-all"
                  aria-label={`Revert ${revertableCount} reviewed items (${acceptedCount} accepted, ${skippedCount} skipped)`}
                >
                  <Undo className="w-4 h-4" />
                  Revert All ({revertableCount})
                </button>
                <button
                  onClick={handleSkipAllPending}
                  disabled={pendingCount === 0}
                  className="phi-btn-skip-all"
                  aria-label={`Skip ${pendingCount} pending items`}
                >
                  <X className="w-4 h-4" />
                  Skip All ({pendingCount})
                </button>
                <button
                  onClick={handleApplyAllChanges}
                  disabled={pendingCount === 0}
                  className="phi-btn-apply-all"
                  aria-label={`Apply ${pendingCount} pending items`}
                >
                  <Check className="w-4 h-4" />
                  Apply All ({pendingCount})
                </button>
              </div>
            </div>
          </div>
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

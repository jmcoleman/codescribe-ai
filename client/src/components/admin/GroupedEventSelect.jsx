/**
 * GroupedEventSelect Component
 *
 * A multi-select dropdown that displays events grouped with their actions.
 * Supports:
 * - Selecting an entire event (all actions)
 * - Selecting specific actions within an event
 * - Smart selection logic (parent/children mutual exclusivity)
 *
 * @example
 * // Returns { eventNames: ['session_start', 'tier_change'], eventActions: { tier_change: { actionField: 'action', actions: ['upgrade'] } } }
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Portal } from '@headlessui/react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * GroupedEventSelect component
 *
 * @param {Object} props
 * @param {Array} props.events - Events from /api/admin/analytics/event-names
 *   Format: [{ name, category, actions?, actionField? }]
 * @param {Object} props.value - Current selection
 *   Format: { eventNames: string[], eventActions: { [eventName]: { actionField, actions } } }
 * @param {Function} props.onChange - Called when selection changes
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} [props.ariaLabel] - Accessibility label
 * @param {string} [props.size] - 'small' or 'normal'
 */
export function GroupedEventSelect({
  events = [],
  value = { eventNames: [], eventActions: {} },
  onChange,
  placeholder = 'All Events',
  ariaLabel = 'Filter by event',
  size = 'small',
}) {
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});

  // Local pending selections (applied on close)
  const [pendingEventNames, setPendingEventNames] = useState([]);
  const [pendingEventActions, setPendingEventActions] = useState({});

  // Size variants
  const sizeClasses = {
    small: 'px-2 py-1.5 text-xs',
    normal: 'px-3 py-2 text-sm',
  };

  // Calculate dropdown position
  const updateDropdownPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 280), // Wider for nested items
        zIndex: 9999,
      });
    }
  }, []);

  // Sync pending selections with value when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setPendingEventNames(value.eventNames || []);
      setPendingEventActions(value.eventActions || {});
      updateDropdownPosition();
    }
  }, [isOpen, value.eventNames, value.eventActions, updateDropdownPosition]);

  // Apply pending selections when dropdown closes
  const closeDropdown = useCallback(() => {
    const currentEventNames = value.eventNames || [];
    const currentEventActions = value.eventActions || {};

    // Check if selections changed
    const eventNamesChanged =
      pendingEventNames.length !== currentEventNames.length ||
      pendingEventNames.some((n) => !currentEventNames.includes(n));

    const eventActionsChanged =
      JSON.stringify(pendingEventActions) !== JSON.stringify(currentEventActions);

    if (eventNamesChanged || eventActionsChanged) {
      onChange({
        eventNames: pendingEventNames,
        eventActions: pendingEventActions,
      });
    }
    setIsOpen(false);
  }, [pendingEventNames, pendingEventActions, value, onChange]);

  // Handle click outside to close dropdown
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        closeDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closeDropdown]);

  // Handle parent event selection (selects all actions)
  const handleEventSelect = (eventName, hasActions) => {
    setPendingEventNames((prev) => {
      if (prev.includes(eventName)) {
        // Deselect the event
        return prev.filter((n) => n !== eventName);
      } else {
        // Select the event
        return [...prev, eventName];
      }
    });

    // If this event has actions and we're selecting it, clear any specific action filters
    if (hasActions) {
      setPendingEventActions((prev) => {
        const { [eventName]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  // Handle child action selection
  const handleActionSelect = (eventName, action, actionField, allActions) => {
    setPendingEventActions((prev) => {
      const currentConfig = prev[eventName];
      const currentActions = currentConfig?.actions || [];

      let newActions;
      if (currentActions.includes(action)) {
        // Remove action
        newActions = currentActions.filter((a) => a !== action);
      } else {
        // Add action
        newActions = [...currentActions, action];
      }

      // If all actions are now selected, treat as parent selection (no action filter)
      if (newActions.length === allActions.length) {
        // Remove from eventActions, keep in eventNames
        const { [eventName]: _, ...rest } = prev;
        if (!pendingEventNames.includes(eventName)) {
          setPendingEventNames((names) => [...names, eventName]);
        }
        return rest;
      }

      // If no actions selected, remove the event entirely
      if (newActions.length === 0) {
        const { [eventName]: _, ...rest } = prev;
        setPendingEventNames((names) => names.filter((n) => n !== eventName));
        return rest;
      }

      // Update action filter
      // Also ensure the event is in eventNames
      if (!pendingEventNames.includes(eventName)) {
        setPendingEventNames((names) => [...names, eventName]);
      }

      return {
        ...prev,
        [eventName]: { actionField, actions: newActions },
      };
    });
  };

  // Get display text for button
  const getDisplayText = () => {
    const selections = isOpen ? pendingEventNames : (value.eventNames || []);
    const actions = isOpen ? pendingEventActions : (value.eventActions || {});

    if (selections.length === 0) {
      return placeholder;
    }

    // Count total selections including actions
    let totalCount = 0;
    for (const eventName of selections) {
      const actionConfig = actions[eventName];
      if (actionConfig && actionConfig.actions.length > 0) {
        totalCount += actionConfig.actions.length;
      } else {
        totalCount += 1;
      }
    }

    if (totalCount === 1 && selections.length === 1) {
      const eventName = selections[0];
      const actionConfig = actions[eventName];
      if (actionConfig && actionConfig.actions.length === 1) {
        return `${eventName}:${actionConfig.actions[0]}`;
      }
      return eventName;
    }

    return `${totalCount} selected`;
  };

  // Check if an event is selected (at parent level)
  const isEventSelected = (eventName) => {
    const selections = isOpen ? pendingEventNames : (value.eventNames || []);
    const actions = isOpen ? pendingEventActions : (value.eventActions || {});
    return selections.includes(eventName) && !actions[eventName];
  };

  // Check if specific actions are selected for an event
  const isActionSelected = (eventName, action) => {
    const actions = isOpen ? pendingEventActions : (value.eventActions || {});
    return actions[eventName]?.actions?.includes(action);
  };

  // Check if event has any children selected
  const hasChildrenSelected = (eventName) => {
    const actions = isOpen ? pendingEventActions : (value.eventActions || {});
    return actions[eventName]?.actions?.length > 0;
  };

  // Sort events alphabetically by name
  const sortedEvents = [...events].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (isOpen ? closeDropdown() : setIsOpen(true))}
        className={`flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 transition-colors min-w-[160px] focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 w-full ${sizeClasses[size]}`}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="flex-1 text-left truncate">{getDisplayText()}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-600 dark:text-slate-400 transition-transform flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Menu with Portal */}
      {isOpen && (
        <Portal>
          <div
            ref={dropdownRef}
            style={dropdownStyle}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden max-h-80 overflow-y-auto focus:outline-none"
          >
            {/* All Events option */}
            <button
              type="button"
              onClick={() => {
                setPendingEventNames([]);
                setPendingEventActions({});
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition-colors text-slate-700 dark:text-slate-200 hover:bg-purple-50/75 dark:hover:bg-purple-400/20 ${
                pendingEventNames.length === 0 ? 'bg-purple-50 dark:bg-purple-900/30' : ''
              }`}
            >
              <span className="font-medium">{placeholder}</span>
              {pendingEventNames.length === 0 && (
                <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              )}
            </button>

            {/* Divider */}
            <div className="border-t border-slate-200 dark:border-slate-700" />

            {/* Events list (flat, alphabetical) */}
            {sortedEvents.map((event) => {
              const hasActions = event.actions && event.actions.length > 0;
              const isParentSelected = isEventSelected(event.name);
              const hasPartialSelection = hasChildrenSelected(event.name);

              return (
                <div key={event.name}>
                  {/* Event row */}
                  <button
                    type="button"
                    onClick={() => handleEventSelect(event.name, hasActions)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition-colors text-slate-700 dark:text-slate-200 hover:bg-purple-50/75 dark:hover:bg-purple-400/20"
                  >
                    <span
                      className={`font-mono text-xs ${
                        hasPartialSelection ? 'text-purple-600 dark:text-purple-400' : ''
                      }`}
                    >
                      {event.name}
                    </span>
                    {isParentSelected && (
                      <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    )}
                    {hasPartialSelection && !isParentSelected && (
                      <span className="w-4 h-4 flex items-center justify-center">
                        <span className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full" />
                      </span>
                    )}
                  </button>

                  {/* Actions (always shown if event has actions) */}
                  {hasActions && (
                    <div className="bg-slate-50 dark:bg-slate-900/30">
                      {event.actions.map((action) => {
                        const isSelected = isActionSelected(event.name, action);

                        return (
                          <button
                            key={action}
                            type="button"
                            onClick={() =>
                              handleActionSelect(
                                event.name,
                                action,
                                event.actionField,
                                event.actions
                              )
                            }
                            className="w-full flex items-center justify-between pl-6 pr-3 py-1.5 text-sm cursor-pointer transition-colors text-slate-600 dark:text-slate-300 hover:bg-purple-50/75 dark:hover:bg-purple-400/20"
                          >
                            <span className="font-mono text-xs">{action}</span>
                            {isSelected && (
                              <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Portal>
      )}
    </div>
  );
}

export default GroupedEventSelect;

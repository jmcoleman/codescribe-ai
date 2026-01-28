import { Fragment, useRef, useState, useCallback, useEffect } from 'react';
import { Listbox, Transition, Portal } from '@headlessui/react';
import { ChevronDown, Check } from 'lucide-react';

export function Select({ options, value, onChange, placeholder = 'Select...', label, ariaLabel, size = 'normal', className = '', multiple = false }) {
  // For multi-select, value is an array; for single, find the matching option
  const selectedOption = multiple ? null : options.find(opt => opt.value === value);
  const selectedCount = multiple && Array.isArray(value) ? value.length : 0;
  const accessibleLabel = ariaLabel || label;

  // For portal positioning and manual open state (needed for multi-select with Portal)
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});

  // Size variants
  const sizeClasses = {
    small: 'px-2 py-1.5 text-xs',
    normal: 'px-3 py-2 text-sm'
  };

  // Calculate dropdown position
  const updateDropdownPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
  }, []);

  // Update position when opening
  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
    }
  }, [isOpen, updateDropdownPosition]);

  // Display text for the button
  const getDisplayText = () => {
    if (multiple) {
      if (selectedCount === 0) return placeholder;
      if (selectedCount === 1) {
        const selected = options.find(opt => opt.value === value[0]);
        return selected?.label || placeholder;
      }
      return `${selectedCount} selected`;
    }
    return selectedOption?.label || placeholder;
  };

  // For multi-select, we manage open state and pending selections locally
  // Only call onChange when dropdown closes (industry standard pattern)
  const [pendingSelections, setPendingSelections] = useState([]);

  // Sync pending selections with value when dropdown opens
  useEffect(() => {
    if (multiple && isOpen) {
      setPendingSelections(Array.isArray(value) ? value : []);
    }
  }, [multiple, isOpen, value]);

  // Apply pending selections when dropdown closes
  const closeDropdown = useCallback(() => {
    if (multiple) {
      // Only call onChange if selections actually changed
      const currentValue = Array.isArray(value) ? value : [];
      const hasChanged = pendingSelections.length !== currentValue.length ||
        pendingSelections.some(v => !currentValue.includes(v));
      if (hasChanged) {
        onChange(pendingSelections);
      }
    }
    setIsOpen(false);
  }, [multiple, pendingSelections, value, onChange]);

  // Handle click outside to close dropdown (for multi-select mode)
  useEffect(() => {
    if (!multiple || !isOpen) return;

    const handleClickOutside = (event) => {
      if (
        buttonRef.current && !buttonRef.current.contains(event.target) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target)
      ) {
        closeDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [multiple, isOpen, closeDropdown]);

  if (multiple) {
    const handleOptionClick = (optionValue) => {
      setPendingSelections(prev => {
        if (prev.includes(optionValue)) {
          return prev.filter(v => v !== optionValue);
        } else {
          return [...prev, optionValue];
        }
      });
      // Dropdown stays open - changes applied on close
    };

    // Display text shows pending selections when open, actual value when closed
    const displaySelections = isOpen ? pendingSelections : (Array.isArray(value) ? value : []);
    const displayCount = displaySelections.length;
    const getMultiDisplayText = () => {
      if (displayCount === 0) return placeholder;
      if (displayCount === 1) {
        const selected = options.find(opt => opt.value === displaySelections[0]);
        return selected?.label || placeholder;
      }
      return `${displayCount} selected`;
    };

    return (
      <div className={`relative ${className}`}>
        {/* Visible Label (if provided) */}
        {label && (
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {label}
          </label>
        )}

        {/* Trigger Button */}
        <button
          ref={buttonRef}
          type="button"
          onClick={() => isOpen ? closeDropdown() : setIsOpen(true)}
          className={`flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 transition-colors min-w-[160px] focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 w-full ${sizeClasses[size]}`}
          aria-label={accessibleLabel}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className="flex-1 text-left truncate">
            {getMultiDisplayText()}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-600 dark:text-slate-400 transition-transform duration-200 ease-out flex-shrink-0 ${
              isOpen ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </button>

        {/* Dropdown Menu with Portal */}
        <Portal>
          <Transition
            as={Fragment}
            show={isOpen}
            enter="transition duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
            enterFrom="opacity-0 -translate-y-2"
            enterTo="opacity-100 translate-y-0"
            leave="transition duration-[200ms] ease-[cubic-bezier(0.4,0,1,1)]"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <ul
              ref={dropdownRef}
              role="listbox"
              aria-multiselectable="true"
              style={dropdownStyle}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto focus:outline-none"
            >
              {options.map((option) => {
                const isSelected = pendingSelections.includes(option.value);
                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleOptionClick(option.value)}
                    className="flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition-colors text-slate-700 dark:text-slate-200 hover:bg-purple-50/75 dark:hover:bg-purple-400/20"
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-slate-600 dark:text-slate-400 flex-shrink-0 ml-2" aria-hidden="true" />
                    )}
                  </li>
                );
              })}
            </ul>
          </Transition>
        </Portal>
      </div>
    );
  }

  // Single-select uses standard Headless UI Listbox
  return (
    <div className={`relative ${className}`}>
      <Listbox value={value} onChange={onChange}>
        {({ open }) => {
          // Update position when dropdown opens, restoring scroll
          // because Headless UI auto-focuses the Portal-rendered options
          // which causes the browser to scroll to the end of <body>
          if (open) {
            const scrollY = window.scrollY;
            setTimeout(() => {
              updateDropdownPosition();
              window.scrollTo({ top: scrollY, behavior: 'instant' });
            }, 0);
          }

          return (
            <>
              {/* Visible Label (if provided) */}
              {label && (
                <Listbox.Label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {label}
                </Listbox.Label>
              )}

              {/* Trigger Button */}
              <Listbox.Button
                ref={buttonRef}
                className={`flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 transition-colors min-w-[160px] focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 w-full ${sizeClasses[size]}`}
                aria-label={accessibleLabel}
              >
                <span className="flex-1 text-left truncate">
                  {getDisplayText()}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-600 dark:text-slate-400 transition-transform duration-200 ease-out flex-shrink-0 ${
                    open ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </Listbox.Button>

              {/* Dropdown Menu with Portal to escape overflow containers */}
              <Portal>
                <Transition
                  as={Fragment}
                  show={open}
                  enter="transition duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                  enterFrom="opacity-0 -translate-y-2"
                  enterTo="opacity-100 translate-y-0"
                  leave="transition duration-[200ms] ease-[cubic-bezier(0.4,0,1,1)]"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options
                    static
                    style={dropdownStyle}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto focus:outline-none focus:ring-0"
                  >
                    {options.map((option) => {
                      const isSelected = value === option.value;
                      return (
                        <Listbox.Option
                          key={option.value}
                          value={option.value}
                          as={Fragment}
                        >
                          {({ active }) => (
                            <li
                              className={`
                                flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition-colors text-slate-700 dark:text-slate-200
                                ${active ? 'bg-purple-50/75 dark:bg-purple-400/20' : ''}
                              `}
                            >
                              <span className="truncate">{option.label}</span>
                              {isSelected && (
                                <Check className="w-4 h-4 text-slate-600 dark:text-slate-400 flex-shrink-0 ml-2" aria-hidden="true" />
                              )}
                            </li>
                          )}
                        </Listbox.Option>
                      );
                    })}
                  </Listbox.Options>
                </Transition>
              </Portal>
            </>
          );
        }}
      </Listbox>
    </div>
  );
}

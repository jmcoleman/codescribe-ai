import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronDown, Check } from 'lucide-react';

export function Select({ options, value, onChange, placeholder = 'Select...', label, ariaLabel }) {
  const selectedOption = options.find(opt => opt.value === value);
  const accessibleLabel = ariaLabel || label;

  return (
    <div className="relative">
      <Listbox value={value} onChange={onChange}>
        {({ open }) => (
          <>
            {/* Visible Label (if provided) */}
            {label && (
              <Listbox.Label className="block text-sm font-medium text-slate-700 mb-1">
                {label}
              </Listbox.Label>
            )}

            {/* Trigger Button */}
            <Listbox.Button
              className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 hover:border-slate-400 transition-colors min-w-[160px] focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 w-full"
              aria-label={accessibleLabel}
            >
              <span className="flex-1 text-left truncate">
                {selectedOption?.label || placeholder}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-600 transition-transform flex-shrink-0 ${
                  open ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </Listbox.Button>

            {/* Dropdown Menu with Transition */}
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-md overflow-hidden z-10 max-h-60 overflow-y-auto focus:outline-none focus:ring-0">
                {options.map((option) => (
                  <Listbox.Option
                    key={option.value}
                    value={option.value}
                    as={Fragment}
                  >
                    {({ active, selected }) => (
                      <li
                        className={`
                          flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition-colors text-slate-700
                          ${active ? 'bg-purple-50/75' : ''}
                        `}
                      >
                        <span className="truncate">{option.label}</span>
                        {selected && (
                          <Check className="w-4 h-4 text-slate-600 flex-shrink-0 ml-2" aria-hidden="true" />
                        )}
                      </li>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </>
        )}
      </Listbox>
    </div>
  );
}

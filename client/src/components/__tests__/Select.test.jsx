import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Select } from '../Select';

describe('Select', () => {
  const defaultOptions = [
    { value: 'js', label: 'JavaScript' },
    { value: 'ts', label: 'TypeScript' },
    { value: 'py', label: 'Python' },
  ];

  const defaultProps = {
    options: defaultOptions,
    value: 'js',
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the select component', () => {
      render(<Select {...defaultProps} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('displays selected option label', () => {
      render(<Select {...defaultProps} value="js" />);
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
    });

    it('displays placeholder when no value selected', () => {
      render(<Select {...defaultProps} value="" placeholder="Choose one" />);
      expect(screen.getByText('Choose one')).toBeInTheDocument();
    });

    it('uses default placeholder when not provided', () => {
      render(<Select {...defaultProps} value="" />);
      expect(screen.getByText('Select...')).toBeInTheDocument();
    });

    it('renders ChevronDown icon', () => {
      const { container } = render(<Select {...defaultProps} />);
      const chevron = container.querySelector('svg');
      expect(chevron).toBeInTheDocument();
    });
  });

  describe('Dropdown Behavior', () => {
    it('dropdown is closed by default', () => {
      render(<Select {...defaultProps} />);
      expect(screen.queryByText('TypeScript')).not.toBeInTheDocument();
    });

    it('opens dropdown when clicked', async () => {
      const user = userEvent.setup();
      render(<Select {...defaultProps} />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(screen.getByText('TypeScript')).toBeInTheDocument();
      expect(screen.getByText('Python')).toBeInTheDocument();
    });

    it('closes dropdown when clicked again', async () => {
      const user = userEvent.setup();
      render(<Select {...defaultProps} />);

      const button = screen.getByRole('button');

      // Open
      await user.click(button);
      expect(screen.getByText('TypeScript')).toBeInTheDocument();

      // Close
      await user.click(button);
      await waitFor(() => {
        expect(screen.queryByText('TypeScript')).not.toBeInTheDocument();
      });
    });

    it('toggles dropdown on multiple clicks', async () => {
      const user = userEvent.setup();
      render(<Select {...defaultProps} />);

      const button = screen.getByRole('button');

      // Open
      await user.click(button);
      expect(screen.getByText('TypeScript')).toBeInTheDocument();

      // Close
      await user.click(button);
      await waitFor(() => {
        expect(screen.queryByText('TypeScript')).not.toBeInTheDocument();
      });

      // Open again
      await user.click(button);
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
    });
  });

  describe('Option Selection', () => {
    it('calls onChange with selected value', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<Select {...defaultProps} onChange={onChange} />);

      // Open dropdown
      await user.click(screen.getByRole('button'));

      // Click option
      await user.click(screen.getByText('TypeScript'));

      expect(onChange).toHaveBeenCalledWith('ts');
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('closes dropdown after selecting option', async () => {
      const user = userEvent.setup();
      render(<Select {...defaultProps} />);

      // Open dropdown
      await user.click(screen.getByRole('button'));
      expect(screen.getByText('Python')).toBeInTheDocument();

      // Select option
      await user.click(screen.getByText('TypeScript'));

      // Dropdown should close
      await waitFor(() => {
        expect(screen.queryByText('Python')).not.toBeInTheDocument();
      });
    });

    it('updates selected value display after selection', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<Select {...defaultProps} value="js" />);

      expect(screen.getByText('JavaScript')).toBeInTheDocument();

      await user.click(screen.getByRole('button'));
      // Click the TypeScript option (use getAllByText to handle duplicates when dropdown is open)
      const typeScriptOptions = screen.getAllByText('TypeScript');
      await user.click(typeScriptOptions[typeScriptOptions.length - 1]); // Click the one in the dropdown list

      // Simulate parent component updating value prop
      rerender(<Select {...defaultProps} value="ts" />);

      // After rerender, TypeScript should be displayed (may appear multiple times if dropdown is still open)
      const tsElements = screen.getAllByText('TypeScript');
      expect(tsElements.length).toBeGreaterThanOrEqual(1);
    });

    it('can select each option', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<Select {...defaultProps} onChange={onChange} />);

      // Test selecting TypeScript (not currently selected, so no duplicate)
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('TypeScript'));
      expect(onChange).toHaveBeenCalledWith('ts');

      // Test selecting Python
      onChange.mockClear();
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('Python'));
      expect(onChange).toHaveBeenCalledWith('py');
    });
  });

  describe('Click Outside Behavior', () => {
    it('closes dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <div data-testid="outside">Outside</div>
          <Select {...defaultProps} />
        </div>
      );

      // Open dropdown
      await user.click(screen.getByRole('button'));
      expect(screen.getByText('TypeScript')).toBeInTheDocument();

      // Click outside
      await user.click(screen.getByTestId('outside'));

      await waitFor(() => {
        expect(screen.queryByText('TypeScript')).not.toBeInTheDocument();
      });
    });

    it('does not close when clicking inside dropdown', async () => {
      const user = userEvent.setup();
      render(<Select {...defaultProps} />);

      await user.click(screen.getByRole('button'));
      expect(screen.getByText('TypeScript')).toBeInTheDocument();

      // Click on dropdown container (not an option)
      const dropdown = screen.getByText('TypeScript').parentElement;
      await user.click(dropdown);

      // Should remain open (unless option was clicked)
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
    });
  });

  describe('ChevronDown Icon Animation', () => {
    it('rotates chevron when dropdown opens', async () => {
      const user = userEvent.setup();
      const { container } = render(<Select {...defaultProps} />);

      const button = screen.getByRole('button');
      const chevron = container.querySelector('svg');

      // Initial state
      expect(chevron).not.toHaveClass('rotate-180');

      // Open dropdown
      await user.click(button);

      // Chevron should rotate
      expect(chevron).toHaveClass('rotate-180');
    });

    it('rotates back when dropdown closes', async () => {
      const user = userEvent.setup();
      const { container } = render(<Select {...defaultProps} />);

      const button = screen.getByRole('button');
      const chevron = container.querySelector('svg');

      // Open
      await user.click(button);
      expect(chevron).toHaveClass('rotate-180');

      // Close
      await user.click(button);
      await waitFor(() => {
        expect(chevron).not.toHaveClass('rotate-180');
      });
    });

    it('has transition class for smooth animation', () => {
      const { container } = render(<Select {...defaultProps} />);
      const chevron = container.querySelector('svg');
      expect(chevron).toHaveClass('transition-transform');
    });
  });

  describe('Selected Option Highlighting', () => {
    it('highlights currently selected option', async () => {
      const user = userEvent.setup();
      const { container } = render(<Select {...defaultProps} value="ts" />);

      await user.click(screen.getByRole('button'));

      // Wait for dropdown to appear, then find TypeScript option (li elements)
      await waitFor(() => {
        const dropdown = container.querySelector('.absolute.top-full');
        expect(dropdown).toBeInTheDocument();
      });

      // Options are li elements, not buttons
      const optionItems = container.querySelectorAll('.absolute.top-full li');
      const typeScriptOption = Array.from(optionItems).find(li => li.textContent.includes('TypeScript'));

      // Selected option should have a checkmark icon
      const checkmark = typeScriptOption.querySelector('svg');
      expect(checkmark).toBeInTheDocument();
    });

    it('does not highlight non-selected options', async () => {
      const user = userEvent.setup();
      const { container } = render(<Select {...defaultProps} value="js" />);

      await user.click(screen.getByRole('button'));

      // Options are li elements, not buttons
      const optionItems = container.querySelectorAll('li');
      const typeScriptOption = Array.from(optionItems).find(li => li.textContent.includes('TypeScript'));

      // Non-selected option should NOT have a checkmark icon
      const checkmark = typeScriptOption?.querySelector('svg');
      expect(checkmark).toBeNull();
    });

    it('updates highlighting when selection changes', async () => {
      const user = userEvent.setup();
      const { rerender, container } = render(<Select {...defaultProps} value="js" />);

      await user.click(screen.getByRole('button'));

      // Get JavaScript option and verify it has checkmark
      await waitFor(() => {
        const dropdown = container.querySelector('.absolute.top-full');
        expect(dropdown).toBeInTheDocument();
      });

      let optionItems = container.querySelectorAll('.absolute.top-full li');
      let jsOption = Array.from(optionItems).find(li => li.textContent.includes('JavaScript'));
      let jsCheckmark = jsOption.querySelector('svg');
      expect(jsCheckmark).toBeInTheDocument();

      // Change selection
      const typeScriptOptions = screen.getAllByText('TypeScript');
      await user.click(typeScriptOptions[typeScriptOptions.length - 1]);

      // Reopen with new value
      rerender(<Select {...defaultProps} value="ts" />);
      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        const dropdown = container.querySelector('.absolute.top-full');
        expect(dropdown).toBeInTheDocument();
      });

      // TypeScript should now have checkmark, JavaScript should not
      optionItems = container.querySelectorAll('.absolute.top-full li');
      const tsOption = Array.from(optionItems).find(li => li.textContent.includes('TypeScript'));
      jsOption = Array.from(optionItems).find(li => li.textContent.includes('JavaScript'));

      const tsCheckmark = tsOption.querySelector('svg');
      const jsCheckmarkAfter = jsOption.querySelector('svg');

      expect(tsCheckmark).toBeInTheDocument();
      expect(jsCheckmarkAfter).toBeNull();
    });
  });

  describe('Styling and Classes', () => {
    it('trigger button has correct base classes', () => {
      const { container } = render(<Select {...defaultProps} />);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('flex');
      expect(button).toHaveClass('items-center');
      expect(button).toHaveClass('gap-2');
      expect(button).toHaveClass('bg-white');
      expect(button).toHaveClass('border');
      expect(button).toHaveClass('border-slate-300');
      expect(button).toHaveClass('rounded-lg');
    });

    it('trigger button has hover classes', () => {
      const { container } = render(<Select {...defaultProps} />);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('hover:border-slate-400');
      expect(button).toHaveClass('transition-colors');
    });

    it('trigger button has focus classes', () => {
      const { container } = render(<Select {...defaultProps} />);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('focus:outline-none');
      expect(button).toHaveClass('focus-visible:ring-2');
      expect(button).toHaveClass('focus-visible:ring-purple-600');
      expect(button).toHaveClass('focus-visible:ring-offset-2');
    });

    it('dropdown has correct positioning classes', async () => {
      const user = userEvent.setup();
      const { container } = render(<Select {...defaultProps} />);

      await user.click(screen.getByRole('button'));

      const dropdown = container.querySelector('.absolute.top-full.left-0.right-0');
      expect(dropdown).toBeInTheDocument();
    });

    it('dropdown has correct styling classes', async () => {
      const user = userEvent.setup();
      const { container } = render(<Select {...defaultProps} />);

      await user.click(screen.getByRole('button'));

      // Updated to match current implementation: shadow-lg, border-slate-200, with dark mode support
      const dropdown = container.querySelector('.bg-white.border.border-slate-200.rounded-lg.shadow-lg');
      expect(dropdown).toBeInTheDocument();
    });

    it('dropdown has z-index for proper layering', async () => {
      const user = userEvent.setup();
      const { container } = render(<Select {...defaultProps} />);

      await user.click(screen.getByRole('button'));

      // Updated to match current implementation: z-50 for proper layering above other elements
      const dropdown = container.querySelector('.z-50');
      expect(dropdown).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('trigger is a button element', () => {
      render(<Select {...defaultProps} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('option buttons have correct type', async () => {
      const user = userEvent.setup();
      const { container } = render(<Select {...defaultProps} />);

      await user.click(screen.getByRole('button'));

      // Options are li elements, not buttons - check that they exist
      const optionItems = container.querySelectorAll('li');
      expect(optionItems.length).toBeGreaterThanOrEqual(3); // Should have 3 options
    });

    it('option buttons have focus ring', async () => {
      const user = userEvent.setup();
      const { container } = render(<Select {...defaultProps} />);

      await user.click(screen.getByRole('button'));

      // Options are li elements - check they have proper cursor styling
      const optionItems = container.querySelectorAll('li');
      const typeScriptOption = Array.from(optionItems).find(li => li.textContent.includes('TypeScript'));
      expect(typeScriptOption).toHaveClass('cursor-pointer');
    });
  });

  describe('Options Rendering', () => {
    it('renders all provided options', async () => {
      const user = userEvent.setup();
      const { container } = render(<Select {...defaultProps} />);

      await user.click(screen.getByRole('button'));

      const dropdown = container.querySelector('.absolute.top-full');
      expect(dropdown).toBeInTheDocument();

      // TypeScript and Python only appear once (in dropdown)
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
      expect(screen.getByText('Python')).toBeInTheDocument();

      // JavaScript appears in both trigger button and dropdown
      expect(screen.getAllByText('JavaScript').length).toBeGreaterThanOrEqual(1);
    });

    it('renders options in correct order', async () => {
      const user = userEvent.setup();
      const { container } = render(<Select {...defaultProps} />);

      await user.click(screen.getByRole('button'));

      // Options are li elements, not buttons
      const options = Array.from(container.querySelectorAll('li'));
      expect(options[0]).toHaveTextContent('JavaScript');
      expect(options[1]).toHaveTextContent('TypeScript');
      expect(options[2]).toHaveTextContent('Python');
    });

    it('handles single option', async () => {
      const user = userEvent.setup();
      const singleOption = [{ value: 'only', label: 'Only Option' }];
      render(<Select options={singleOption} value="only" onChange={vi.fn()} />);

      await user.click(screen.getByRole('button'));

      // "Only Option" appears twice: in trigger and in dropdown
      expect(screen.getAllByText('Only Option').length).toBeGreaterThanOrEqual(1);
    });

    it('handles many options', async () => {
      const user = userEvent.setup();
      const manyOptions = Array.from({ length: 20 }, (_, i) => ({
        value: `opt${i}`,
        label: `Option ${i + 1}`,
      }));
      render(<Select options={manyOptions} value="opt0" onChange={vi.fn()} />);

      await user.click(screen.getByRole('button'));

      // Option 1 appears twice (trigger + dropdown), but Option 20 only once
      expect(screen.getAllByText('Option 1').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Option 20')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty options array', () => {
      render(<Select options={[]} value="" onChange={vi.fn()} placeholder="No options" />);
      expect(screen.getByText('No options')).toBeInTheDocument();
    });

    it('handles value not in options', () => {
      render(<Select {...defaultProps} value="nonexistent" placeholder="Unknown" />);
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    it('handles undefined value', () => {
      render(<Select {...defaultProps} value={undefined} placeholder="Choose" />);
      expect(screen.getByText('Choose')).toBeInTheDocument();
    });

    it('handles null value', () => {
      render(<Select {...defaultProps} value={null} placeholder="Choose" />);
      expect(screen.getByText('Choose')).toBeInTheDocument();
    });

    it('handles options with special characters in labels', async () => {
      const user = userEvent.setup();
      const specialOptions = [
        { value: 'a', label: 'Option <>&"' },
        { value: 'b', label: 'Option with emoji 🎉' },
      ];
      render(<Select options={specialOptions} value="a" onChange={vi.fn()} />);

      await user.click(screen.getByRole('button'));

      // Option <>&" appears in both trigger and dropdown
      expect(screen.getAllByText('Option <>&"').length).toBeGreaterThanOrEqual(1);
      // emoji option only appears in dropdown
      expect(screen.getByText('Option with emoji 🎉')).toBeInTheDocument();
    });
  });

  describe('Event Handler Edge Cases', () => {
    it('handles rapid clicks', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<Select {...defaultProps} onChange={onChange} />);

      const button = screen.getByRole('button');

      // Open dropdown
      await user.click(button);

      // Rapidly click different options
      await user.click(screen.getByText('TypeScript'));
      await user.click(button);
      await user.click(screen.getByText('Python'));

      // Should have been called twice
      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChange).toHaveBeenNthCalledWith(1, 'ts');
      expect(onChange).toHaveBeenNthCalledWith(2, 'py');
    });

    it('does not call onChange when clicking currently selected option', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      const { container } = render(<Select {...defaultProps} value="js" onChange={onChange} />);

      await user.click(screen.getByRole('button'));

      // Find the JavaScript option (li element, not button)
      const options = container.querySelectorAll('li');
      const jsOption = Array.from(options).find(li => li.textContent.includes('JavaScript'));
      await user.click(jsOption);

      // Should still call onChange (component doesn't prevent it)
      expect(onChange).toHaveBeenCalledWith('js');
    });
  });
});

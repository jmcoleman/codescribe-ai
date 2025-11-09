import { screen } from '@testing-library/react';
import { renderWithTheme as render } from '../../__tests__/utils/renderWithTheme';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button, IconButton } from '../Button';
import { Download } from 'lucide-react';

describe('Button', () => {
  describe('Rendering', () => {
    it('renders with children text', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('renders with an icon', () => {
      render(<Button icon={Download}>Download</Button>);
      const button = screen.getByRole('button', { name: /download/i });
      expect(button).toBeInTheDocument();
      expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('renders loading spinner when loading prop is true', () => {
      render(<Button loading>Submit</Button>);
      const button = screen.getByRole('button');
      const spinner = button.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('replaces icon with spinner when loading', () => {
      render(<Button icon={Download} loading>Download</Button>);
      const button = screen.getByRole('button');
      // Should have spinner, not Download icon
      expect(button.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('renders primary variant with correct classes', () => {
      render(<Button variant="primary">Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-purple-600');
      expect(button).toHaveClass('hover:bg-purple-700');
      expect(button).toHaveClass('text-white');
    });

    it('renders secondary variant with correct classes', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-slate-100');
      expect(button).toHaveClass('text-slate-700');
    });

    it('renders icon variant with correct classes', () => {
      render(<Button variant="icon" icon={Download} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-10');
      expect(button).toHaveClass('h-10');
      expect(button).toHaveClass('p-0');
      expect(button).toHaveClass('bg-transparent');
    });

    it('renders dark variant with correct classes', () => {
      render(<Button variant="dark">Dark</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-slate-900');
      expect(button).toHaveClass('text-white');
    });

    it('defaults to primary variant when no variant specified', () => {
      render(<Button>Default</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-purple-600');
    });
  });

  describe('Animation Classes', () => {
    it('has transition classes for smooth animations', () => {
      render(<Button>Animated</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('transition-all');
      expect(button).toHaveClass('duration-200');
    });

    it('has motion-reduce class for accessibility', () => {
      render(<Button>Accessible</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('motion-reduce:transition-none');
    });

    it('primary variant has hover scale effect classes', () => {
      render(<Button variant="primary">Hover me</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:scale-[1.02]');
    });

    it('primary variant has active scale effect classes', () => {
      render(<Button variant="primary">Click me</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('active:scale-[0.98]');
      // Primary variant no longer has brightness effect, only scale
    });

    it('secondary variant has hover and active scale effects', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:scale-[1.02]');
      expect(button).toHaveClass('active:scale-[0.98]');
    });

    it('icon variant has larger hover scale effect', () => {
      render(<Button variant="icon" icon={Download} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:scale-[1.05]');
      expect(button).toHaveClass('active:scale-[0.98]');
    });

    it('dark variant has hover shadow and scale effects', () => {
      render(<Button variant="dark">Dark</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:scale-[1.02]');
      expect(button).toHaveClass('shadow-lg');
    });

    it('primary variant has shadow classes', () => {
      render(<Button variant="primary">Shadow</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('shadow-lg');
      expect(button).toHaveClass('shadow-purple-600/20');
    });
  });

  describe('Disabled State', () => {
    it('disables button when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('disables button when loading is true', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('applies disabled opacity class', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:opacity-50');
      expect(button).toHaveClass('disabled:cursor-not-allowed');
    });

    it('is not clickable when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      const button = screen.getByRole('button');

      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('is not clickable when loading', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button loading onClick={handleClick}>Loading</Button>);
      const button = screen.getByRole('button');

      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('shows spinner animation when loading', () => {
      render(<Button loading>Loading</Button>);
      const spinner = screen.getByRole('button').querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('spinner has correct size classes', () => {
      render(<Button loading>Loading</Button>);
      const spinner = screen.getByRole('button').querySelector('.animate-spin');
      expect(spinner).toHaveClass('w-4');
      expect(spinner).toHaveClass('h-4');
    });

    it('maintains button text while loading', () => {
      render(<Button loading>Submitting...</Button>);
      expect(screen.getByText('Submitting...')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('merges custom className with variant classes', () => {
      render(<Button variant="primary" className="custom-class">Merged</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
      expect(button).toHaveClass('bg-purple-600');
    });
  });

  describe('Event Handling', () => {
    it('calls onClick handler when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click me</Button>);
      await user.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('passes event object to onClick handler', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click me</Button>);
      await user.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
    });

    it('forwards additional props to button element', () => {
      render(<Button data-testid="custom-button" aria-label="Custom label">Test</Button>);
      const button = screen.getByTestId('custom-button');
      expect(button).toHaveAttribute('aria-label', 'Custom label');
    });
  });

  describe('Base Classes', () => {
    it('has flex and alignment classes', () => {
      render(<Button>Flex</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('flex');
      expect(button).toHaveClass('items-center');
      expect(button).toHaveClass('justify-center');
      expect(button).toHaveClass('gap-2');
    });

    it('has padding and border radius classes', () => {
      render(<Button>Styled</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-6');
      expect(button).toHaveClass('py-2');
      expect(button).toHaveClass('rounded-lg');
    });

    it('has text styling classes', () => {
      render(<Button>Text</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-sm');
      expect(button).toHaveClass('font-medium');
    });
  });
});

describe('IconButton', () => {
  it('renders as icon variant', () => {
    render(<IconButton icon={Download} aria-label="Download" />);
    const button = screen.getByRole('button', { name: /download/i });
    expect(button).toHaveClass('w-10');
    expect(button).toHaveClass('h-10');
    expect(button).toHaveClass('bg-transparent');
  });

  it('renders icon SVG', () => {
    render(<IconButton icon={Download} aria-label="Download" />);
    const button = screen.getByRole('button');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('applies icon variant hover scale', () => {
    render(<IconButton icon={Download} aria-label="Download" />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('hover:scale-[1.05]');
  });

  it('forwards props to Button component', () => {
    const handleClick = vi.fn();
    render(<IconButton icon={Download} onClick={handleClick} aria-label="Download" />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('can be disabled', () => {
    render(<IconButton icon={Download} disabled aria-label="Download" />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RateLimitIndicator } from '../RateLimitIndicator';

describe('RateLimitIndicator', () => {
  describe('Rendering', () => {
    it('renders with remaining and limit values', () => {
      render(<RateLimitIndicator remaining={8} limit={10} />);
      expect(screen.getByText('8/10 requests remaining')).toBeInTheDocument();
    });

    it('renders progress bar', () => {
      const { container } = render(<RateLimitIndicator remaining={5} limit={10} />);
      const progressBar = container.querySelector('.w-20.h-2.bg-slate-200.rounded-full');
      expect(progressBar).toBeInTheDocument();
    });

    it('renders progress fill indicator', () => {
      const { container } = render(<RateLimitIndicator remaining={5} limit={10} />);
      const progressFill = container.querySelector('.h-full.transition-all');
      expect(progressFill).toBeInTheDocument();
    });
  });

  describe('Percentage Calculation', () => {
    it('calculates 100% when all requests remaining', () => {
      const { container } = render(<RateLimitIndicator remaining={10} limit={10} />);
      const progressFill = container.querySelector('.h-full.transition-all');
      expect(progressFill).toHaveStyle({ width: '100%' });
    });

    it('calculates 50% when half requests remaining', () => {
      const { container } = render(<RateLimitIndicator remaining={5} limit={10} />);
      const progressFill = container.querySelector('.h-full.transition-all');
      expect(progressFill).toHaveStyle({ width: '50%' });
    });

    it('calculates 0% when no requests remaining', () => {
      const { container } = render(<RateLimitIndicator remaining={0} limit={10} />);
      const progressFill = container.querySelector('.h-full.transition-all');
      expect(progressFill).toHaveStyle({ width: '0%' });
    });

    it('calculates 25% correctly', () => {
      const { container } = render(<RateLimitIndicator remaining={25} limit={100} />);
      const progressFill = container.querySelector('.h-full.transition-all');
      expect(progressFill).toHaveStyle({ width: '25%' });
    });

    it('calculates 75% correctly', () => {
      const { container } = render(<RateLimitIndicator remaining={75} limit={100} />);
      const progressFill = container.querySelector('.h-full.transition-all');
      expect(progressFill).toHaveStyle({ width: '75%' });
    });
  });

  describe('Low Threshold Warning (< 30%)', () => {
    it('shows red color when below 30% threshold', () => {
      const { container } = render(<RateLimitIndicator remaining={2} limit={10} />); // 20%
      const text = container.querySelector('.text-red-500');
      expect(text).toBeInTheDocument();
      expect(text).toHaveTextContent('2/10 requests remaining');
    });

    it('shows red progress bar when below 30% threshold', () => {
      const { container } = render(<RateLimitIndicator remaining={2} limit={10} />); // 20%
      const progressFill = container.querySelector('.bg-red-500');
      expect(progressFill).toBeInTheDocument();
    });

    it('shows red at exactly 29%', () => {
      const { container } = render(<RateLimitIndicator remaining={29} limit={100} />);
      const text = container.querySelector('.text-red-500');
      expect(text).toBeInTheDocument();
    });

    it('shows red at 1% remaining', () => {
      const { container } = render(<RateLimitIndicator remaining={1} limit={100} />);
      const text = container.querySelector('.text-red-500');
      expect(text).toBeInTheDocument();
    });

    it('shows red at 0% remaining', () => {
      const { container } = render(<RateLimitIndicator remaining={0} limit={100} />);
      const text = container.querySelector('.text-red-500');
      expect(text).toBeInTheDocument();
    });
  });

  describe('Normal State (>= 30%)', () => {
    it('shows slate color when at or above 30% threshold', () => {
      const { container } = render(<RateLimitIndicator remaining={3} limit={10} />); // 30%
      const text = container.querySelector('.text-slate-500');
      expect(text).toBeInTheDocument();
      expect(text).toHaveTextContent('3/10 requests remaining');
    });

    it('shows purple progress bar when at or above 30% threshold', () => {
      const { container } = render(<RateLimitIndicator remaining={3} limit={10} />); // 30%
      const progressFill = container.querySelector('.bg-purple-500');
      expect(progressFill).toBeInTheDocument();
    });

    it('shows purple at exactly 30%', () => {
      const { container } = render(<RateLimitIndicator remaining={30} limit={100} />);
      const progressFill = container.querySelector('.bg-purple-500');
      expect(progressFill).toBeInTheDocument();
    });

    it('shows purple at 50%', () => {
      const { container } = render(<RateLimitIndicator remaining={50} limit={100} />);
      const progressFill = container.querySelector('.bg-purple-500');
      expect(progressFill).toBeInTheDocument();
    });

    it('shows purple at 100%', () => {
      const { container } = render(<RateLimitIndicator remaining={100} limit={100} />);
      const progressFill = container.querySelector('.bg-purple-500');
      expect(progressFill).toBeInTheDocument();
    });
  });

  describe('Text Display', () => {
    it('displays remaining/limit format', () => {
      render(<RateLimitIndicator remaining={7} limit={10} />);
      expect(screen.getByText('7/10 requests remaining')).toBeInTheDocument();
    });

    it('handles single digit values', () => {
      render(<RateLimitIndicator remaining={1} limit={5} />);
      expect(screen.getByText('1/5 requests remaining')).toBeInTheDocument();
    });

    it('handles large values', () => {
      render(<RateLimitIndicator remaining={850} limit={1000} />);
      expect(screen.getByText('850/1000 requests remaining')).toBeInTheDocument();
    });

    it('handles zero remaining', () => {
      render(<RateLimitIndicator remaining={0} limit={10} />);
      expect(screen.getByText('0/10 requests remaining')).toBeInTheDocument();
    });
  });

  describe('Styling and Animation', () => {
    it('has transition-all class for smooth animations', () => {
      const { container } = render(<RateLimitIndicator remaining={5} limit={10} />);
      const progressFill = container.querySelector('.transition-all');
      expect(progressFill).toBeInTheDocument();
    });

    it('progress bar has correct width classes', () => {
      const { container } = render(<RateLimitIndicator remaining={5} limit={10} />);
      const progressBar = container.querySelector('.w-20');
      expect(progressBar).toBeInTheDocument();
    });

    it('progress bar has correct height classes', () => {
      const { container } = render(<RateLimitIndicator remaining={5} limit={10} />);
      const progressBar = container.querySelector('.h-2');
      expect(progressBar).toBeInTheDocument();
    });

    it('progress bar has rounded corners', () => {
      const { container } = render(<RateLimitIndicator remaining={5} limit={10} />);
      const progressBar = container.querySelector('.rounded-full');
      expect(progressBar).toBeInTheDocument();
    });

    it('progress bar has overflow hidden', () => {
      const { container } = render(<RateLimitIndicator remaining={5} limit={10} />);
      const progressBar = container.querySelector('.overflow-hidden');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles decimal percentages correctly', () => {
      const { container } = render(<RateLimitIndicator remaining={1} limit={3} />); // 33.33%
      const progressFill = container.querySelector('.h-full.transition-all');
      expect(progressFill).toHaveStyle({ width: '33.33333333333333%' });
    });

    it('handles very small remaining values', () => {
      render(<RateLimitIndicator remaining={1} limit={1000} />); // 0.1%
      expect(screen.getByText('1/1000 requests remaining')).toBeInTheDocument();
    });

    it('handles equal remaining and limit', () => {
      const { container } = render(<RateLimitIndicator remaining={10} limit={10} />);
      const progressFill = container.querySelector('.h-full.transition-all');
      expect(progressFill).toHaveStyle({ width: '100%' });
    });

    it('handles limit of 1', () => {
      render(<RateLimitIndicator remaining={1} limit={1} />);
      expect(screen.getByText('1/1 requests remaining')).toBeInTheDocument();
    });
  });

  describe('Threshold Boundary Testing', () => {
    it('29.9% shows red warning', () => {
      const { container } = render(<RateLimitIndicator remaining={299} limit={1000} />);
      expect(container.querySelector('.text-red-500')).toBeInTheDocument();
      expect(container.querySelector('.bg-red-500')).toBeInTheDocument();
    });

    it('30.0% shows normal state', () => {
      const { container } = render(<RateLimitIndicator remaining={300} limit={1000} />);
      expect(container.querySelector('.text-slate-500')).toBeInTheDocument();
      expect(container.querySelector('.bg-purple-500')).toBeInTheDocument();
    });

    it('30.1% shows normal state', () => {
      const { container } = render(<RateLimitIndicator remaining={301} limit={1000} />);
      expect(container.querySelector('.text-slate-500')).toBeInTheDocument();
      expect(container.querySelector('.bg-purple-500')).toBeInTheDocument();
    });
  });

  describe('Real-World Scenarios', () => {
    it('typical starting state (10/10)', () => {
      const { container } = render(<RateLimitIndicator remaining={10} limit={10} />);
      expect(screen.getByText('10/10 requests remaining')).toBeInTheDocument();
      expect(container.querySelector('.bg-purple-500')).toBeInTheDocument();
      const progressFill = container.querySelector('.h-full.transition-all');
      expect(progressFill).toHaveStyle({ width: '100%' });
    });

    it('half used (5/10)', () => {
      const { container } = render(<RateLimitIndicator remaining={5} limit={10} />);
      expect(screen.getByText('5/10 requests remaining')).toBeInTheDocument();
      expect(container.querySelector('.bg-purple-500')).toBeInTheDocument();
      const progressFill = container.querySelector('.h-full.transition-all');
      expect(progressFill).toHaveStyle({ width: '50%' });
    });

    it('almost depleted (2/10)', () => {
      const { container } = render(<RateLimitIndicator remaining={2} limit={10} />);
      expect(screen.getByText('2/10 requests remaining')).toBeInTheDocument();
      expect(container.querySelector('.bg-red-500')).toBeInTheDocument();
      const progressFill = container.querySelector('.h-full.transition-all');
      expect(progressFill).toHaveStyle({ width: '20%' });
    });

    it('depleted (0/10)', () => {
      const { container } = render(<RateLimitIndicator remaining={0} limit={10} />);
      expect(screen.getByText('0/10 requests remaining')).toBeInTheDocument();
      expect(container.querySelector('.bg-red-500')).toBeInTheDocument();
      const progressFill = container.querySelector('.h-full.transition-all');
      expect(progressFill).toHaveStyle({ width: '0%' });
    });
  });

  describe('Component Structure', () => {
    it('has correct flex layout', () => {
      const { container } = render(<RateLimitIndicator remaining={5} limit={10} />);
      const wrapper = container.querySelector('.flex.items-center.gap-2.text-sm');
      expect(wrapper).toBeInTheDocument();
    });

    it('text container has correct classes', () => {
      const { container } = render(<RateLimitIndicator remaining={5} limit={10} />);
      const textContainer = container.querySelector('.flex.items-center.gap-1');
      expect(textContainer).toBeInTheDocument();
    });
  });
});

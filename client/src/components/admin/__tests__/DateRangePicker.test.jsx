/**
 * Tests for DateRangePicker Component
 *
 * Tests preset selection, custom date input, and display.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DateRangePicker from '../DateRangePicker';

describe('DateRangePicker', () => {
  const mockOnChange = vi.fn();
  const defaultStartDate = new Date('2024-01-01T00:00:00');
  const defaultEndDate = new Date('2024-01-08T00:00:00');

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Date.now to return a consistent value
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders date picker button', () => {
      render(
        <DateRangePicker
          startDate={defaultStartDate}
          endDate={defaultEndDate}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('displays current date range', () => {
      render(
        <DateRangePicker
          startDate={defaultStartDate}
          endDate={defaultEndDate}
          onChange={mockOnChange}
        />
      );

      // Should display custom range format since dates don't match a preset
      expect(screen.getByText(/jan 1, 2024/i)).toBeInTheDocument();
    });

    it('displays preset label when dates match preset', () => {
      const today = new Date('2024-01-15T00:00:00');
      const tomorrow = new Date('2024-01-16T00:00:00');

      render(
        <DateRangePicker
          startDate={today}
          endDate={tomorrow}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    it('shows calendar icon', () => {
      render(
        <DateRangePicker
          startDate={defaultStartDate}
          endDate={defaultEndDate}
          onChange={mockOnChange}
        />
      );

      // Calendar icon is rendered as an SVG
      expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Dropdown Behavior', () => {
    it('opens dropdown on click', () => {
      render(
        <DateRangePicker
          startDate={defaultStartDate}
          endDate={defaultEndDate}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByRole('button'));

      // Should show preset options
      expect(screen.getByText('Last 7 days')).toBeInTheDocument();
      expect(screen.getByText('Last 30 days')).toBeInTheDocument();
      expect(screen.getByText('This month')).toBeInTheDocument();
      expect(screen.getByText('Last month')).toBeInTheDocument();
      expect(screen.getByText('Custom range')).toBeInTheDocument();
    });

    it('closes dropdown when preset is selected', () => {
      render(
        <DateRangePicker
          startDate={defaultStartDate}
          endDate={defaultEndDate}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      fireEvent.click(screen.getByText('Last 7 days'));

      // Dropdown should close
      expect(screen.queryByText('This month')).not.toBeInTheDocument();
    });

    it('closes dropdown when clicking backdrop', () => {
      render(
        <DateRangePicker
          startDate={defaultStartDate}
          endDate={defaultEndDate}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      expect(screen.getByText('Last 7 days')).toBeInTheDocument();

      // Click the backdrop
      const backdrop = document.querySelector('.fixed.inset-0');
      fireEvent.click(backdrop);

      // Dropdown should close
      expect(screen.queryByText('Last 7 days')).not.toBeInTheDocument();
    });
  });

  describe('Preset Selection', () => {
    it('calls onChange with Today preset', () => {
      render(
        <DateRangePicker
          startDate={defaultStartDate}
          endDate={defaultEndDate}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      fireEvent.click(screen.getByText('Today'));

      expect(mockOnChange).toHaveBeenCalledWith({
        startDate: new Date('2024-01-15T00:00:00'),
        endDate: new Date('2024-01-16T00:00:00'),
      });
    });

    it('calls onChange with Last 7 days preset', () => {
      render(
        <DateRangePicker
          startDate={defaultStartDate}
          endDate={defaultEndDate}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      fireEvent.click(screen.getByText('Last 7 days'));

      expect(mockOnChange).toHaveBeenCalledWith({
        startDate: new Date('2024-01-08T00:00:00'),
        endDate: new Date('2024-01-16T00:00:00'),
      });
    });

    it('calls onChange with Last 30 days preset', () => {
      render(
        <DateRangePicker
          startDate={defaultStartDate}
          endDate={defaultEndDate}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      fireEvent.click(screen.getByText('Last 30 days'));

      expect(mockOnChange).toHaveBeenCalledWith({
        startDate: new Date('2023-12-16T00:00:00'),
        endDate: new Date('2024-01-16T00:00:00'),
      });
    });

    it('calls onChange with This month preset', () => {
      render(
        <DateRangePicker
          startDate={defaultStartDate}
          endDate={defaultEndDate}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      fireEvent.click(screen.getByText('This month'));

      expect(mockOnChange).toHaveBeenCalledWith({
        startDate: new Date('2024-01-01T00:00:00'),
        endDate: new Date('2024-01-16T00:00:00'),
      });
    });

    it('calls onChange with Last month preset', () => {
      render(
        <DateRangePicker
          startDate={defaultStartDate}
          endDate={defaultEndDate}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      fireEvent.click(screen.getByText('Last month'));

      expect(mockOnChange).toHaveBeenCalledWith({
        startDate: new Date('2023-12-01T00:00:00'),
        endDate: new Date('2024-01-01T00:00:00'),
      });
    });
  });

  describe('Custom Date Range', () => {
    it('shows custom date inputs when Custom range is selected', () => {
      render(
        <DateRangePicker
          startDate={defaultStartDate}
          endDate={defaultEndDate}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      fireEvent.click(screen.getByText('Custom range'));

      // Check for date inputs by type
      const dateInputs = document.querySelectorAll('input[type="date"]');
      expect(dateInputs.length).toBe(2);
      expect(screen.getByText('Start Date')).toBeInTheDocument();
      expect(screen.getByText('End Date')).toBeInTheDocument();
      expect(screen.getByText('Apply')).toBeInTheDocument();
    });

    it('applies custom date range when Apply is clicked', () => {
      render(
        <DateRangePicker
          startDate={defaultStartDate}
          endDate={defaultEndDate}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      fireEvent.click(screen.getByText('Custom range'));

      // Find inputs by type
      const dateInputs = document.querySelectorAll('input[type="date"]');
      const startInput = dateInputs[0];
      const endInput = dateInputs[1];

      // Change dates using fireEvent
      fireEvent.change(startInput, { target: { value: '2024-01-10' } });
      fireEvent.change(endInput, { target: { value: '2024-01-20' } });

      fireEvent.click(screen.getByText('Apply'));

      expect(mockOnChange).toHaveBeenCalledWith({
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-01-21'), // End date is incremented by 1 day to include it
      });
    });
  });

  describe('Active Preset Highlighting', () => {
    it('highlights the current preset', () => {
      const today = new Date('2024-01-15T00:00:00');
      const tomorrow = new Date('2024-01-16T00:00:00');

      render(
        <DateRangePicker
          startDate={today}
          endDate={tomorrow}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByRole('button'));

      // Today should be highlighted (has different class)
      // Use getAllByText since "Today" appears in both button and dropdown
      const todayButtons = screen.getAllByText('Today');
      // The second one is in the dropdown
      const dropdownTodayButton = todayButtons[todayButtons.length - 1];
      expect(dropdownTodayButton.className).toContain('bg-purple');
    });

    it('shows Custom range as active for non-preset dates', () => {
      render(
        <DateRangePicker
          startDate={defaultStartDate}
          endDate={defaultEndDate}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByRole('button'));

      // Custom range should be highlighted
      const customButton = screen.getByText('Custom range');
      expect(customButton.className).toContain('bg-purple');
    });
  });
});

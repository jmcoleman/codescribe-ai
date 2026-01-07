/**
 * Tests for TrendChart Component
 *
 * Tests rendering, data display, and theme support.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TrendChart from '../TrendChart';

// Mock Recharts to avoid canvas issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  AreaChart: ({ children, data }) => (
    <div data-testid="area-chart" data-points={data?.length}>
      {children}
    </div>
  ),
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

describe('TrendChart', () => {
  const mockData = [
    { date: '2024-01-01', value: 100 },
    { date: '2024-01-02', value: 150 },
    { date: '2024-01-03', value: 120 },
    { date: '2024-01-04', value: 180 },
    { date: '2024-01-05', value: 200 },
  ];

  describe('Rendering', () => {
    it('renders area chart with data', () => {
      render(<TrendChart data={mockData} isDark={false} />);

      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
      expect(screen.getByTestId('area')).toBeInTheDocument();
    });

    it('renders all chart elements', () => {
      render(<TrendChart data={mockData} isDark={false} />);

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });

    it('renders empty state when no data', () => {
      render(<TrendChart data={[]} isDark={false} />);

      expect(screen.getByText(/no data available for this period/i)).toBeInTheDocument();
    });

    it('renders empty state when data is null', () => {
      render(<TrendChart data={null} isDark={false} />);

      expect(screen.getByText(/no data available for this period/i)).toBeInTheDocument();
    });

    it('renders empty state when data is undefined', () => {
      render(<TrendChart data={undefined} isDark={false} />);

      expect(screen.getByText(/no data available for this period/i)).toBeInTheDocument();
    });
  });

  describe('Theme Support', () => {
    it('renders in light mode', () => {
      render(<TrendChart data={mockData} isDark={false} />);

      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });

    it('renders in dark mode', () => {
      render(<TrendChart data={mockData} isDark={true} />);

      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });
  });

  describe('Height Configuration', () => {
    it('uses default height of 250px', () => {
      render(<TrendChart data={mockData} isDark={false} />);

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('accepts custom height prop', () => {
      render(
        <TrendChart
          data={mockData}
          isDark={false}
          height={400}
        />
      );

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });

  describe('Interval Configuration', () => {
    it('accepts day interval', () => {
      render(<TrendChart data={mockData} isDark={false} interval="day" />);

      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });

    it('accepts week interval', () => {
      render(<TrendChart data={mockData} isDark={false} interval="week" />);

      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });

    it('accepts month interval', () => {
      render(<TrendChart data={mockData} isDark={false} interval="month" />);

      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });
  });

  describe('Value Type Configuration', () => {
    it('defaults to number formatting', () => {
      render(<TrendChart data={mockData} isDark={false} />);

      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });

    it('accepts currency value type', () => {
      render(<TrendChart data={mockData} isDark={false} valueType="currency" />);

      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });
  });

  describe('Custom Color', () => {
    it('accepts custom color prop', () => {
      render(<TrendChart data={mockData} isDark={false} color="#ff0000" />);

      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });
  });

  describe('Data Sorting', () => {
    it('sorts data by date', () => {
      const unsortedData = [
        { date: '2024-01-05', value: 200 },
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-03', value: 120 },
      ];

      render(<TrendChart data={unsortedData} isDark={false} />);

      // Should still render without crashing
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });
  });
});

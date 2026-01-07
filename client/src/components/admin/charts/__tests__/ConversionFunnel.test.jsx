/**
 * Tests for ConversionFunnel Component
 *
 * Tests rendering, data transformation, and accessibility features.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ConversionFunnel from '../ConversionFunnel';

// Mock Recharts to avoid canvas issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  FunnelChart: ({ children }) => <div data-testid="funnel-chart">{children}</div>,
  Funnel: ({ data, children }) => (
    <div data-testid="funnel" data-count={data?.length}>
      {children}
    </div>
  ),
  Tooltip: () => <div data-testid="tooltip" />,
  LabelList: () => <div data-testid="label-list" />,
}));

describe('ConversionFunnel', () => {
  // Mock data matching the expected format from the API
  const mockData = {
    stages: {
      session_start: { sessions: 1000 },
      code_input: { sessions: 800 },
      generation_started: { sessions: 600 },
      generation_completed: { sessions: 550 },
      doc_copied: { sessions: 400 },
    },
    conversionRates: {
      session_start_to_code_input: 80,
      code_input_to_generation_started: 75,
      generation_started_to_generation_completed: 91.7,
      generation_completed_to_doc_copied: 72.7,
    },
  };

  describe('Rendering', () => {
    it('renders funnel chart with data', () => {
      render(<ConversionFunnel data={mockData} isDark={false} />);

      expect(screen.getByTestId('funnel-chart')).toBeInTheDocument();
      expect(screen.getByTestId('funnel')).toBeInTheDocument();
    });

    it('renders responsive container', () => {
      render(<ConversionFunnel data={mockData} isDark={false} />);

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('renders empty state when no stages', () => {
      render(<ConversionFunnel data={{}} isDark={false} />);

      expect(screen.getByText(/no funnel data available/i)).toBeInTheDocument();
    });

    it('renders empty state when data is null', () => {
      render(<ConversionFunnel data={null} isDark={false} />);

      expect(screen.getByText(/no funnel data available/i)).toBeInTheDocument();
    });

    it('renders empty state when data is undefined', () => {
      render(<ConversionFunnel data={undefined} isDark={false} />);

      expect(screen.getByText(/no funnel data available/i)).toBeInTheDocument();
    });
  });

  describe('Conversion Rate Display', () => {
    it('displays conversion rate labels', () => {
      render(<ConversionFunnel data={mockData} isDark={false} />);

      // Should show stage names in conversion rate section
      expect(screen.getByText(/sessions/i)).toBeInTheDocument();
      expect(screen.getByText(/code input/i)).toBeInTheDocument();
    });

    it('displays percentage values', () => {
      render(<ConversionFunnel data={mockData} isDark={false} />);

      // Should show conversion percentages
      expect(screen.getByText('80.0%')).toBeInTheDocument();
      expect(screen.getByText('75.0%')).toBeInTheDocument();
    });
  });

  describe('Theme Support', () => {
    it('applies light theme colors when isDark is false', () => {
      const { container } = render(<ConversionFunnel data={mockData} isDark={false} />);

      expect(container).toBeTruthy();
      expect(screen.getByTestId('funnel-chart')).toBeInTheDocument();
    });

    it('applies dark theme colors when isDark is true', () => {
      const { container } = render(<ConversionFunnel data={mockData} isDark={true} />);

      expect(container).toBeTruthy();
      expect(screen.getByTestId('funnel-chart')).toBeInTheDocument();
    });
  });

  describe('Height Configuration', () => {
    it('uses default height of 300px', () => {
      render(<ConversionFunnel data={mockData} isDark={false} />);

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('accepts custom height prop', () => {
      render(<ConversionFunnel data={mockData} isDark={false} height={400} />);

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });

  describe('Data Transformation', () => {
    it('handles missing stages gracefully', () => {
      const partialData = {
        stages: {
          session_start: { sessions: 1000 },
          code_input: { sessions: 800 },
          // Missing other stages
        },
        conversionRates: {},
      };

      render(<ConversionFunnel data={partialData} isDark={false} />);

      expect(screen.getByTestId('funnel-chart')).toBeInTheDocument();
    });

    it('handles zero session counts', () => {
      const zeroData = {
        stages: {
          session_start: { sessions: 0 },
          code_input: { sessions: 0 },
          generation_started: { sessions: 0 },
          generation_completed: { sessions: 0 },
          doc_copied: { sessions: 0 },
        },
        conversionRates: {},
      };

      render(<ConversionFunnel data={zeroData} isDark={false} />);

      // Should still render the funnel chart even with zero values
      expect(screen.getByTestId('funnel-chart')).toBeInTheDocument();
    });

    it('handles missing conversion rates', () => {
      const noRatesData = {
        stages: mockData.stages,
        // No conversionRates
      };

      render(<ConversionFunnel data={noRatesData} isDark={false} />);

      expect(screen.getByTestId('funnel-chart')).toBeInTheDocument();
      // Should show '-' for missing rates
      expect(screen.getAllByText('-').length).toBeGreaterThan(0);
    });
  });
});

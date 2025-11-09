import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithTheme } from './renderWithTheme';

describe('renderWithTheme helper', () => {
  it('wraps component with ThemeProvider', () => {
    renderWithTheme(<div>Test</div>);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});

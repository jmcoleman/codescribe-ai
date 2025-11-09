import { render as rtlRender } from '@testing-library/react';
import { ThemeProvider } from '../../contexts/ThemeContext';

/**
 * Render helper that wraps components with ThemeProvider
 * Use this for any components that use useTheme hook
 */
export function renderWithTheme(ui, options = {}) {
  const result = rtlRender(
    <ThemeProvider>
      {ui}
    </ThemeProvider>,
    options
  );

  // Wrap rerender to also use ThemeProvider
  const originalRerender = result.rerender;
  result.rerender = (rerenderUi) => {
    return originalRerender(
      <ThemeProvider>
        {rerenderUi}
      </ThemeProvider>
    );
  };

  return result;
}

// Also export as render for convenience
export { renderWithTheme as render };

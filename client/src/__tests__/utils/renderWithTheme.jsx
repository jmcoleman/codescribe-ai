import { render as rtlRender } from '@testing-library/react';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { AuthProvider } from '../../contexts/AuthContext';

/**
 * Render helper that wraps components with ThemeProvider and AuthProvider
 * Use this for any components that use useTheme or useAuth hooks
 */
export function renderWithTheme(ui, options = {}) {
  const result = rtlRender(
    <AuthProvider>
      <ThemeProvider>
        {ui}
      </ThemeProvider>
    </AuthProvider>,
    options
  );

  // Wrap rerender to also use both providers
  const originalRerender = result.rerender;
  result.rerender = (rerenderUi) => {
    return originalRerender(
      <AuthProvider>
        <ThemeProvider>
          {rerenderUi}
        </ThemeProvider>
      </AuthProvider>
    );
  };

  return result;
}

// Also export as render for convenience
export { renderWithTheme as render };

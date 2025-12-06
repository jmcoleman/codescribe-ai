import { render as rtlRender } from '@testing-library/react';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { AuthProvider } from '../../contexts/AuthContext';
import { TrialProvider } from '../../contexts/TrialContext';

/**
 * Render helper that wraps components with ThemeProvider, AuthProvider, and TrialProvider
 * Use this for any components that use useTheme, useAuth, or useTrial hooks
 */
export function renderWithTheme(ui, options = {}) {
  const result = rtlRender(
    <AuthProvider>
      <TrialProvider>
        <ThemeProvider>
          {ui}
        </ThemeProvider>
      </TrialProvider>
    </AuthProvider>,
    options
  );

  // Wrap rerender to also use all providers
  const originalRerender = result.rerender;
  result.rerender = (rerenderUi) => {
    return originalRerender(
      <AuthProvider>
        <TrialProvider>
          <ThemeProvider>
            {rerenderUi}
          </ThemeProvider>
        </TrialProvider>
      </AuthProvider>
    );
  };

  return result;
}

// Also export as render for convenience
export { renderWithTheme as render };

/**
 * AppToaster Component
 *
 * Shared toast notification container with theme-aware styling.
 * Include this component on any page that needs toast notifications.
 */

import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';

export function AppToaster() {
  const { effectiveTheme } = useTheme();
  const [isMobileView, setIsMobileView] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Toaster
      position={isMobileView ? 'top-center' : 'top-right'}
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{
        // Safe area insets for mobile devices with notches/home indicators
        ...(isMobileView && {
          top: 'env(safe-area-inset-top, 0px)',
        }),
      }}
      toastOptions={{
        // Accessibility - prevent toast container from being focusable
        ariaProps: {
          role: 'status',
          'aria-live': 'polite',
        },
        // Mobile-optimized durations (longer than desktop for distraction)
        duration: isMobileView ? 5000 : 4000,
        // Theme-aware default styling
        style: {
          background: effectiveTheme === 'dark' ? 'rgb(30 41 59)' : 'rgb(255 255 255)', // slate-800 : white
          color: effectiveTheme === 'dark' ? 'rgb(248 250 252)' : 'rgb(15 23 42)', // slate-50 : slate-900
          border: effectiveTheme === 'dark' ? '1px solid rgb(51 65 85)' : '1px solid rgb(203 213 225)', // slate-700 : slate-300
          // Mobile-specific: near full-width for better readability
          maxWidth: isMobileView ? 'calc(100vw - 32px)' : '28rem',
          width: isMobileView ? 'auto' : undefined,
        },
        // Success toasts
        success: {
          duration: isMobileView ? 4000 : 3000,
          iconTheme: {
            primary: effectiveTheme === 'dark' ? '#4ADE80' : '#16A34A', // green-400 : green-600
            secondary: effectiveTheme === 'dark' ? 'rgb(30 41 59)' : '#FFFFFF',
          },
        },
        // Error toasts - longer on mobile since errors need attention
        error: {
          duration: isMobileView ? 7000 : 5000,
          iconTheme: {
            primary: effectiveTheme === 'dark' ? '#F87171' : '#DC2626', // red-400 : red-600
            secondary: effectiveTheme === 'dark' ? 'rgb(30 41 59)' : '#FFFFFF',
          },
        },
        // Loading toasts
        loading: {
          iconTheme: {
            primary: effectiveTheme === 'dark' ? '#C084FC' : '#9333EA', // purple-400 : purple-600
            secondary: effectiveTheme === 'dark' ? 'rgb(30 41 59)' : '#FFFFFF',
          },
        },
      }}
    />
  );
}

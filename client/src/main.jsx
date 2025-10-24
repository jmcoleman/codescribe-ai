import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'

// Only load analytics and speed insights in production
// Use hostname check - works reliably in Vercel deployments
const isProduction =
  window.location.hostname === 'codescribeai.com' ||
  window.location.hostname.includes('vercel.app')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
    {isProduction && (
      <>
        <Analytics />
        <SpeedInsights />
      </>
    )}
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Only load analytics and speed insights in production
const isProduction = import.meta.env.PROD

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
    {isProduction && (
      <>
        <Analytics />
        <SpeedInsights />
      </>
    )}
  </StrictMode>,
)

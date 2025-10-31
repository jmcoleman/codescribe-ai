import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { AuthCallback } from './components/AuthCallback.jsx'
import { ResetPassword } from './components/ResetPassword.jsx'
import { PricingPage } from './components/PricingPage.jsx'
import { PaymentSuccess } from './components/PaymentSuccess.jsx'
import { PaymentCancel } from './components/PaymentCancel.jsx'
import VerifyEmail from './components/VerifyEmail.jsx'

// Only load analytics and speed insights in production
// Use hostname check - works reliably in Vercel deployments
const isProduction =
  window.location.hostname === 'codescribeai.com' ||
  window.location.hostname.includes('vercel.app')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/cancel" element={<PaymentCancel />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
    {isProduction && (
      <>
        <Analytics />
        <SpeedInsights />
      </>
    )}
  </StrictMode>,
)

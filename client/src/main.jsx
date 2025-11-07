import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AnalyticsWrapper } from './components/AnalyticsWrapper.jsx'
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
import TermsOfService from './pages/TermsOfService.jsx'
import PrivacyPolicy from './pages/PrivacyPolicy.jsx'
import Settings from './pages/Settings.jsx'
import { RestoreAccount } from './pages/RestoreAccount.jsx'
import { UsageDashboard } from './pages/UsageDashboard.jsx'
import AdminUsage from './pages/AdminUsage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/restore-account" element={<RestoreAccount />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/cancel" element={<PaymentCancel />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/usage" element={<UsageDashboard />} />
            <Route path="/admin/usage" element={<AdminUsage />} />
          </Routes>
          <AnalyticsWrapper />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)

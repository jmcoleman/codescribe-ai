import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AnalyticsWrapper } from './components/AnalyticsWrapper.jsx'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { TrialProvider } from './contexts/TrialContext.jsx'
import { PreferencesProvider } from './contexts/PreferencesContext.jsx'
import { WorkspaceProvider } from './contexts/WorkspaceContext.jsx'
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
import { History } from './pages/History.jsx'
import Admin from './pages/Admin.jsx'
import AdminUsage from './pages/AdminUsage.jsx'
import InviteCodes from './pages/admin/InviteCodes.jsx'
import TrialsAdmin from './pages/admin/Trials.jsx'
import Analytics from './pages/admin/Analytics.jsx'
import { TrialRedemption } from './pages/TrialRedemption.jsx'
import { ErrorTest } from './components/ErrorTest.jsx'
import { Projects } from './pages/Projects.jsx'
import { ProjectDetails } from './pages/ProjectDetails.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <TrialProvider>
          <PreferencesProvider>
          <ThemeProvider>
          <WorkspaceProvider>
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
              <Route path="/history" element={<History />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/usage" element={<AdminUsage />} />
              <Route path="/admin/invite-codes" element={<InviteCodes />} />
              <Route path="/admin/trials" element={<TrialsAdmin />} />
              <Route path="/admin/analytics" element={<Analytics />} />
              <Route path="/trial" element={<TrialRedemption />} />
              {/* Project management routes (Pro+ feature) - not yet linked from main nav */}
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetails />} />
              {/* Testing route - triggers ErrorBoundary for dark mode and UI testing */}
              <Route path="/test-error" element={<ErrorTest />} />
            </Routes>
            <AnalyticsWrapper />
          </WorkspaceProvider>
          </ThemeProvider>
          </PreferencesProvider>
          </TrialProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)

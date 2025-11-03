/**
 * Privacy Policy Page
 * Version: 2025-11-02 (v2.5.0 - Initial version)
 *
 * Legal document defining how we collect, use, and protect user data
 */

import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PRIVACY_VERSION = '2025-11-02';
const EFFECTIVE_DATE = 'November 2, 2025';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-purple-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-lg ring-1 ring-slate-200 p-8 sm:p-12">
          {/* Title */}
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Privacy Policy
          </h1>
          <p className="text-slate-600 mb-8">
            <strong>Effective Date:</strong> {EFFECTIVE_DATE} | <strong>Version:</strong> {PRIVACY_VERSION}
          </p>

          {/* Introduction */}
          <section className="mb-8 prose prose-slate max-w-none">
            <p className="text-lg text-slate-700 leading-relaxed">
              At CodeScribe AI, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose,
              and safeguard your information when you use our service.
            </p>
          </section>

          {/* 1. Information We Collect */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Information We Collect</h2>

            <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">1.1 Account Information</h3>
            <div className="prose prose-slate max-w-none text-slate-700">
              <p>When you create an account, we collect:</p>
              <ul className="space-y-2">
                <li><strong>Email address:</strong> Used for authentication and communication</li>
                <li><strong>Password:</strong> Stored as a secure hash (bcrypt with 10 salt rounds)</li>
                <li><strong>Name:</strong> Optional, collected during signup or later for subscription management</li>
                <li><strong>GitHub ID:</strong> If you sign up via GitHub OAuth</li>
                <li><strong>Subscription tier:</strong> Free, Starter, Pro, Team, or Enterprise</li>
                <li><strong>Account creation date:</strong> Timestamp of account creation</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">1.2 Usage Data</h3>
            <div className="prose prose-slate max-w-none text-slate-700">
              <p>To enforce usage limits and improve our service, we collect:</p>
              <ul className="space-y-2">
                <li><strong>Documentation generation count:</strong> Number of documents generated (daily and monthly)</li>
                <li><strong>IP address (anonymous users only):</strong> Used to track usage for non-authenticated users</li>
                <li><strong>User ID (authenticated users):</strong> Linked to your account for usage tracking</li>
                <li><strong>Last reset date:</strong> When your usage counters were last reset</li>
              </ul>
              <p className="mt-4">
                <strong>Important:</strong> Your code and generated documentation are <strong>NOT stored</strong>. All code
                processing happens in memory only, and results are sent directly to your browser.
              </p>
            </div>

            <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">1.3 Payment Information</h3>
            <div className="prose prose-slate max-w-none text-slate-700">
              <p>
                When you subscribe to a paid tier, we use Stripe to process payments. We collect:
              </p>
              <ul className="space-y-2">
                <li><strong>Stripe Customer ID:</strong> Unique identifier linking your account to Stripe</li>
                <li><strong>Subscription ID:</strong> Identifier for your active subscription</li>
                <li><strong>Subscription status:</strong> Active, canceled, past_due, etc.</li>
                <li><strong>Current period dates:</strong> Billing cycle start and end dates</li>
              </ul>
              <p className="mt-4">
                <strong>We do not store your credit card information.</strong> All payment details are securely stored by Stripe.
                We only receive non-sensitive payment information necessary to manage your subscription.
              </p>
            </div>

            <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">1.4 Automatically Collected Information</h3>
            <div className="prose prose-slate max-w-none text-slate-700">
              <ul className="space-y-2">
                <li><strong>Browser type and version:</strong> For compatibility and analytics</li>
                <li><strong>Operating system:</strong> For compatibility</li>
                <li><strong>Referrer URL:</strong> How you found our service</li>
                <li><strong>Pages visited:</strong> Basic navigation analytics</li>
                <li><strong>Time and date of visit:</strong> For usage patterns</li>
              </ul>
            </div>
          </section>

          {/* 2. How We Use Your Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. How We Use Your Information</h2>
            <div className="prose prose-slate max-w-none text-slate-700">
              <p>We use the information we collect to:</p>
              <ul className="space-y-2">
                <li><strong>Provide the Service:</strong> Generate documentation, manage your account, enforce usage limits</li>
                <li><strong>Process payments:</strong> Manage subscriptions and billing through Stripe</li>
                <li><strong>Communicate with you:</strong> Send transactional emails (verification, password reset, receipts)</li>
                <li><strong>Improve the Service:</strong> Analyze usage patterns to enhance features</li>
                <li><strong>Prevent fraud and abuse:</strong> Detect and prevent unauthorized access and usage limit circumvention</li>
                <li><strong>Comply with legal obligations:</strong> Respond to legal requests and enforce our Terms</li>
              </ul>
            </div>
          </section>

          {/* 3. Data Processing and Storage */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Data Processing and Storage</h2>

            <h3 className="text-xl font-semibold text-slate-900 mt-4 mb-3">3.1 Code Processing (Privacy-First)</h3>
            <div className="prose prose-slate max-w-none text-slate-700">
              <p>
                <strong>Your code is processed in memory only and is NEVER stored on our servers.</strong> Here's how it works:
              </p>
              <ul className="space-y-2">
                <li>You upload or paste code in your browser</li>
                <li>Code is sent to our server via encrypted connection (HTTPS)</li>
                <li>Our server sends code to Claude API for analysis</li>
                <li>Claude generates documentation and returns it to our server</li>
                <li>Our server sends documentation directly to your browser</li>
                <li><strong>Code and documentation are purged from memory immediately</strong></li>
              </ul>
              <p className="mt-4 font-medium text-purple-700">
                We have zero visibility into your code after processing. It is not logged, stored, or retained in any form.
              </p>
            </div>

            <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">3.2 Database Storage</h3>
            <div className="prose prose-slate max-w-none text-slate-700">
              <p>We store the following in our Neon PostgreSQL database:</p>
              <ul className="space-y-2">
                <li><strong>Account data:</strong> Email, password hash, name, tier, GitHub ID</li>
                <li><strong>Usage data:</strong> Generation counts, IP addresses (anonymous users only)</li>
                <li><strong>Subscription data:</strong> Stripe customer ID, subscription status, billing dates</li>
                <li><strong>Email verification tokens:</strong> Temporary (24-hour expiration)</li>
                <li><strong>Password reset tokens:</strong> Temporary (1-hour expiration), hashed with SHA-256</li>
              </ul>
              <p className="mt-4">
                All data is stored in secure, encrypted databases hosted by Neon (AWS infrastructure, SOC 2 Type II certified).
              </p>
            </div>

            <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">3.3 Third-Party Services</h3>
            <div className="prose prose-slate max-w-none text-slate-700">
              <p>We use the following third-party services that process your data:</p>
              <ul className="space-y-2">
                <li>
                  <strong>Anthropic Claude API:</strong> Processes your code to generate documentation (privacy-first, no training)
                </li>
                <li>
                  <strong>Stripe:</strong> Payment processing (PCI DSS Level 1 compliant)
                </li>
                <li>
                  <strong>Resend:</strong> Transactional email delivery (verification, password reset, receipts)
                </li>
                <li>
                  <strong>Neon:</strong> PostgreSQL database hosting (AWS infrastructure, encrypted at rest)
                </li>
                <li>
                  <strong>Vercel:</strong> Application hosting and deployment (AWS/GCP infrastructure)
                </li>
                <li>
                  <strong>GitHub:</strong> OAuth authentication (optional, only if you choose to sign up via GitHub)
                </li>
              </ul>
            </div>
          </section>

          {/* 4. Data Sharing and Disclosure */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Data Sharing and Disclosure</h2>
            <div className="prose prose-slate max-w-none text-slate-700">
              <p>
                <strong>We do not sell, rent, or trade your personal information.</strong> We only share your data in the
                following limited circumstances:
              </p>
              <ul className="space-y-2">
                <li>
                  <strong>Service providers:</strong> Third-party services necessary to operate (Stripe, Resend, Claude API, Neon, Vercel)
                </li>
                <li>
                  <strong>Legal compliance:</strong> When required by law, subpoena, or court order
                </li>
                <li>
                  <strong>Business transfers:</strong> In the event of a merger, acquisition, or sale of assets (you will be notified)
                </li>
                <li>
                  <strong>Fraud prevention:</strong> To protect against fraud, abuse, or security threats
                </li>
              </ul>
            </div>
          </section>

          {/* 5. Data Retention */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Data Retention</h2>
            <div className="prose prose-slate max-w-none text-slate-700">
              <ul className="space-y-2">
                <li><strong>Account data:</strong> Retained until you delete your account</li>
                <li><strong>Usage data:</strong> Retained for 12 months for quota enforcement and analytics</li>
                <li><strong>Code and documentation:</strong> <strong>NOT retained</strong> (processed in memory only)</li>
                <li><strong>Email verification tokens:</strong> Deleted after 24 hours or upon verification</li>
                <li><strong>Password reset tokens:</strong> Deleted after 1 hour or upon password reset</li>
                <li><strong>Transaction records:</strong> Retained for 7 years for tax and accounting purposes</li>
              </ul>
            </div>
          </section>

          {/* 6. Your Rights (GDPR & Privacy) */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Your Rights (GDPR & Privacy)</h2>
            <div className="prose prose-slate max-w-none text-slate-700">
              <p>You have the following rights regarding your personal data:</p>
              <ul className="space-y-2">
                <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
                <li><strong>Deletion:</strong> Request deletion of your account and associated data ("right to be forgotten")</li>
                <li><strong>Export:</strong> Request a machine-readable export of your data (data portability)</li>
                <li><strong>Object:</strong> Object to processing of your data for certain purposes</li>
                <li><strong>Restrict:</strong> Request restriction of processing under certain circumstances</li>
                <li><strong>Withdraw consent:</strong> Withdraw consent for data processing (where applicable)</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, contact us at{' '}
                <a href="mailto:support@codescribeai.com" className="text-purple-600 hover:text-purple-700">
                  support@codescribeai.com
                </a>
                . We will respond within 30 days.
              </p>
            </div>
          </section>

          {/* 7. Security */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Security</h2>
            <div className="prose prose-slate max-w-none text-slate-700">
              <p>We implement industry-standard security measures to protect your data:</p>
              <ul className="space-y-2">
                <li><strong>Encryption in transit:</strong> All data transmitted via HTTPS (TLS 1.3)</li>
                <li><strong>Encryption at rest:</strong> Database encrypted by Neon (AES-256)</li>
                <li><strong>Password hashing:</strong> Bcrypt with 10 salt rounds (industry standard)</li>
                <li><strong>Token hashing:</strong> Password reset tokens hashed with SHA-256</li>
                <li><strong>Rate limiting:</strong> Protection against brute force attacks</li>
                <li><strong>JWT tokens:</strong> Secure session management with 7-day expiration</li>
                <li><strong>Environment isolation:</strong> Production secrets stored securely in Vercel</li>
              </ul>
              <p className="mt-4">
                However, no method of transmission or storage is 100% secure. We cannot guarantee absolute security, but we
                continuously monitor and improve our security practices.
              </p>
            </div>
          </section>

          {/* 8. Cookies and Tracking */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Cookies and Tracking</h2>
            <div className="prose prose-slate max-w-none text-slate-700">
              <p>We use minimal cookies and tracking:</p>
              <ul className="space-y-2">
                <li>
                  <strong>Session cookie:</strong> Maintains your login state (HTTP-only, expires after 7 days or logout)
                </li>
                <li>
                  <strong>localStorage:</strong> Stores JWT token and user preferences (theme, billing period) locally in your browser
                </li>
                <li>
                  <strong>No third-party tracking cookies:</strong> We do not use Google Analytics, Facebook Pixel, or similar tracking
                </li>
              </ul>
            </div>
          </section>

          {/* 9. International Data Transfers */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">9. International Data Transfers</h2>
            <div className="prose prose-slate max-w-none text-slate-700">
              <p>
                Our services are hosted on AWS infrastructure (via Neon and Vercel). Your data may be transferred to and
                processed in countries outside your country of residence. We ensure that all data transfers comply with
                applicable data protection laws, including GDPR.
              </p>
            </div>
          </section>

          {/* 10. Children's Privacy */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Children's Privacy</h2>
            <div className="prose prose-slate max-w-none text-slate-700">
              <p>
                Our Service is intended for users aged 13 and older. We do not knowingly collect personal information from
                children under 13. If you are a parent or guardian and believe your child has provided us with personal
                information, please contact us immediately.
              </p>
            </div>
          </section>

          {/* 11. Changes to Privacy Policy */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">11. Changes to Privacy Policy</h2>
            <div className="prose prose-slate max-w-none text-slate-700">
              <p>
                We may update this Privacy Policy from time to time. When we make changes, we will:
              </p>
              <ul className="space-y-2">
                <li>Update the "Effective Date" and "Version" at the top of this page</li>
                <li>Notify you via email or through the Service</li>
                <li>Require you to accept the new Privacy Policy before continuing to use the Service</li>
              </ul>
              <p className="mt-4">
                Your continued use of the Service after accepting the new Privacy Policy constitutes your agreement to be bound by it.
              </p>
            </div>
          </section>

          {/* 12. Contact Us */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">12. Contact Us</h2>
            <div className="prose prose-slate max-w-none text-slate-700">
              <p>
                If you have any questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <p className="font-medium">
                Email:{' '}
                <a href="mailto:support@codescribeai.com" className="text-purple-600 hover:text-purple-700">
                  support@codescribeai.com
                </a>
              </p>
              <p className="font-medium">
                Website:{' '}
                <a href="https://codescribeai.com" className="text-purple-600 hover:text-purple-700">
                  https://codescribeai.com
                </a>
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

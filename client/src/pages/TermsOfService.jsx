/**
 * Terms of Service Page
 * Version: 2025-11-02 (v2.5.0 - Initial version)
 *
 * Legal document defining terms and conditions for using CodeScribe AI
 */

import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageLayout } from '../components/PageLayout';

const TERMS_VERSION = '2025-11-02';
const EFFECTIVE_DATE = 'November 2, 2025';

export default function TermsOfService() {
  const navigate = useNavigate();

  // ESC key to navigate back (same as Back button)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        navigate(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <PageLayout>
      {/* Back button - above content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-purple-600 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="font-medium">Back</span>
        </button>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white rounded-xl shadow-lg ring-1 ring-slate-200 p-8 sm:p-12">
          {/* Title */}
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Terms of Service
          </h1>
          <p className="text-slate-600 mb-8">
            <strong>Effective Date:</strong> {EFFECTIVE_DATE} | <strong>Version:</strong> {TERMS_VERSION}
          </p>

          {/* Introduction */}
          <section className="mb-8 prose prose-slate max-w-none">
            <p className="text-lg text-slate-700 leading-relaxed">
              Welcome to CodeScribe AI. By accessing or using our service, you agree to be bound by these Terms of Service
              ("Terms"). Please read them carefully.
            </p>
          </section>

          {/* 1. Acceptance of Terms */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Acceptance of Terms</h2>
            <div className="prose prose-slate max-w-none text-slate-700">
              <p>
                By creating an account, accessing, or using CodeScribe AI (the "Service"), you agree to be bound by these Terms
                and our Privacy Policy. If you do not agree to these Terms, you may not use the Service.
              </p>
            </div>
          </section>

          {/* 2. Description of Service */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Description of Service</h2>
            <div className="prose prose-slate max-w-none text-slate-700">
              <p>
                CodeScribe AI is an AI-powered documentation generation service that helps developers create high-quality
                documentation for their code. The Service uses Claude AI to analyze code and generate various types of
                documentation including README files, JSDoc comments, API documentation, and architecture documents.
              </p>
            </div>
          </section>

          {/* 3. Account Registration */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Account Registration</h2>
            <div className="prose prose-slate max-w-none text-slate-700">
              <ul className="space-y-2">
                <li>You must provide accurate and complete information when creating an account</li>
                <li>You are responsible for maintaining the security of your account credentials</li>
                <li>You must notify us immediately of any unauthorized access to your account</li>
                <li>You must be at least 13 years old to use the Service</li>
                <li>One person or entity may not maintain more than one free account</li>
              </ul>
            </div>
          </section>

          {/* 4. Subscription Tiers and Billing */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Subscription Tiers and Billing</h2>
            <div className="prose prose-slate max-w-none text-slate-700">
              <h3 className="text-xl font-semibold text-slate-900 mt-4 mb-2">4.1 Available Tiers</h3>
              <p>We offer the following subscription tiers:</p>
              <ul className="space-y-2">
                <li><strong>Free:</strong> 10 documentation generations per month, 3 per day, 100KB file size limit</li>
                <li><strong>Starter:</strong> $12/month - 50 generations per month, 10 per day, 500KB file size limit</li>
                <li><strong>Pro:</strong> $29/month - 200 generations per month, 50 per day, 1MB file size limit</li>
                <li><strong>Team:</strong> $99/month - 1,000 generations per month, 250 per day, 5MB file size limit, 10 users</li>
                <li><strong>Enterprise:</strong> Custom pricing - Unlimited generations, 50MB file size limit, custom features</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-2">4.2 Billing Cycle</h3>
              <p>
                Paid subscriptions are billed on a monthly or annual basis, depending on your selection. You will be charged
                at the beginning of each billing cycle for the upcoming period.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-2">4.3 Payment Processing</h3>
              <p>
                All payments are processed securely through Stripe. We do not store your credit card information. By providing
                payment information, you authorize us to charge your payment method for all fees associated with your subscription.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-2">4.4 Price Changes</h3>
              <p>
                We reserve the right to change our pricing at any time. If we change the price of your subscription, we will
                provide at least 30 days' notice before the change takes effect. Continued use of the Service after the price
                change constitutes acceptance of the new price.
              </p>
            </div>
          </section>

          {/* 5. Cancellation and Refunds */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Cancellation and Refunds</h2>
            <div className="prose prose-slate max-w-none text-slate-700">
              <h3 className="text-xl font-semibold text-slate-900 mt-4 mb-2">5.1 Cancellation Policy</h3>
              <p>
                You may cancel your subscription at any time through your account settings or by contacting us at{' '}
                <a href="mailto:support@codescribeai.com" className="text-purple-600 hover:text-purple-700">
                  support@codescribeai.com
                </a>
                . When you cancel:
              </p>
              <ul className="space-y-2">
                <li>Your subscription will remain active until the end of your current billing period</li>
                <li>You will retain access to paid features until the end of the billing period</li>
                <li>Your account will automatically revert to the Free tier at the end of the billing period</li>
                <li>You will not be charged for subsequent billing periods</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-2">5.2 No Refunds</h3>
              <p>
                <strong>All subscription fees are non-refundable.</strong> We do not provide refunds or credits for partial
                months of service, upgrade/downgrade refunds, or refunds for months unused with an open account. This is
                standard industry practice for SaaS (Software as a Service) products.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-2">5.3 Downgrading</h3>
              <p>
                If you downgrade your subscription, the change will take effect at the end of your current billing period.
                You will retain access to your current tier's features until that time.
              </p>
            </div>
          </section>

          {/* 6. Usage Limits and Fair Use */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Usage Limits and Fair Use</h2>
            <div className="prose prose-slate max-w-none text-slate-700">
              <p>
                Usage limits are enforced per tier as described above. We track usage based on:
              </p>
              <ul className="space-y-2">
                <li><strong>Authenticated users:</strong> Usage tracked by user account</li>
                <li><strong>Anonymous users:</strong> Usage tracked by IP address</li>
              </ul>
              <p>
                Usage limits reset daily (3am UTC) for daily limits and monthly (1st of the month, 3am UTC) for monthly limits.
                You may not circumvent usage limits by creating multiple accounts or using multiple IP addresses.
              </p>
            </div>
          </section>

          {/* 7. Intellectual Property */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Intellectual Property</h2>
            <div className="prose prose-slate max-w-none text-slate-700">
              <h3 className="text-xl font-semibold text-slate-900 mt-4 mb-2">7.1 Your Content</h3>
              <p>
                You retain all ownership rights to the code you submit to the Service and the documentation generated by the Service.
                We do not claim ownership of your content.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-2">7.2 Our Service</h3>
              <p>
                The Service, including its original content, features, and functionality, is owned by CodeScribe AI and is
                protected by international copyright, trademark, and other intellectual property laws.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-2">7.3 License to Use Service</h3>
              <p>
                We grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Service
                for your personal or business purposes, subject to these Terms.
              </p>
            </div>
          </section>

          {/* 8. Privacy and Data Protection */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Privacy and Data Protection</h2>
            <div className="prose prose-slate max-w-none text-slate-700">
              <p>
                Your use of the Service is also governed by our{' '}
                <Link to="/privacy" className="text-purple-600 hover:text-purple-700 font-medium">
                  Privacy Policy
                </Link>
                . Key points include:
              </p>
              <ul className="space-y-2">
                <li><strong>Code Processing:</strong> Your code is processed in memory only and is not stored on our servers</li>
                <li><strong>Generated Documentation:</strong> Documentation is sent directly to your browser and is not stored</li>
                <li><strong>Usage Tracking:</strong> We track usage counts for quota enforcement (authenticated: by user ID, anonymous: by IP address)</li>
                <li><strong>Account Data:</strong> Email, name, tier, and subscription information are stored securely</li>
              </ul>
            </div>
          </section>

          {/* 9. Prohibited Conduct */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Prohibited Conduct</h2>
            <div className="prose prose-slate max-w-none text-slate-700">
              <p>You agree not to:</p>
              <ul className="space-y-2">
                <li>Use the Service for any illegal purpose or in violation of any laws</li>
                <li>Attempt to circumvent usage limits or access controls</li>
                <li>Reverse engineer, decompile, or disassemble the Service</li>
                <li>Use automated systems (bots, scrapers) to access the Service</li>
                <li>Transmit malware, viruses, or malicious code</li>
                <li>Impersonate another person or entity</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Collect user information without consent</li>
              </ul>
            </div>
          </section>

          {/* 10. Termination */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Termination</h2>
            <div className="prose prose-slate max-w-none text-slate-700">
              <p>
                We reserve the right to suspend or terminate your account at any time, with or without notice, for violations
                of these Terms or for any other reason. Upon termination:
              </p>
              <ul className="space-y-2">
                <li>Your right to use the Service will immediately cease</li>
                <li>We will delete or anonymize your account data in accordance with our Privacy Policy</li>
                <li>You will not be entitled to any refunds</li>
                <li>Sections of these Terms that by their nature should survive termination will survive</li>
              </ul>
            </div>
          </section>

          {/* 11. Disclaimers */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">11. Disclaimers</h2>
            <div className="prose prose-slate max-w-none text-slate-700">
              <p>
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED,
                INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p>
                We do not warrant that:
              </p>
              <ul className="space-y-2">
                <li>The Service will be uninterrupted, timely, secure, or error-free</li>
                <li>The results obtained from the Service will be accurate or reliable</li>
                <li>The quality of any products, services, information, or other material obtained through the Service will meet your expectations</li>
                <li>Any errors in the Service will be corrected</li>
              </ul>
            </div>
          </section>

          {/* 12. Limitation of Liability */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">12. Limitation of Liability</h2>
            <div className="prose prose-slate max-w-none text-slate-700">
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, CODESCRIBE AI SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
                CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY,
                OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
              </p>
              <p>
                OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATED TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED
                THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM.
              </p>
            </div>
          </section>

          {/* 13. Changes to Terms */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">13. Changes to Terms</h2>
            <div className="prose prose-slate max-w-none text-slate-700">
              <p>
                We reserve the right to modify these Terms at any time. When we make changes, we will:
              </p>
              <ul className="space-y-2">
                <li>Update the "Effective Date" and "Version" at the top of this page</li>
                <li>Notify you via email or through the Service</li>
                <li>Require you to accept the new Terms before continuing to use the Service</li>
              </ul>
              <p>
                Your continued use of the Service after accepting the new Terms constitutes your agreement to be bound by them.
              </p>
            </div>
          </section>

          {/* 14. Contact Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">14. Contact Information</h2>
            <div className="prose prose-slate max-w-none text-slate-700">
              <p>
                If you have any questions about these Terms, please contact us at:
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
      </div>
    </PageLayout>
  );
}

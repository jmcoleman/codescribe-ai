import { Check, Sparkles, Zap, Building2, Code2 } from 'lucide-react';

/**
 * Pricing Page Component
 *
 * Displays tier pricing, supported languages, and upgrade options.
 * Will be integrated with Stripe in Phase 2 Epic 2.3.
 *
 * @component
 */
export function PricingPage() {
  const tiers = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for trying out CodeScribe AI',
      icon: Code2,
      features: [
        '10 docs per month',
        '3 docs per day',
        'All 10 programming languages',
        '4 documentation types',
        'Real-time streaming',
        'Quality scoring',
        'Community support'
      ],
      cta: 'Get Started',
      ctaVariant: 'secondary',
      popular: false
    },
    {
      name: 'Starter',
      price: '$12',
      period: 'per month',
      description: 'For individual developers',
      icon: Sparkles,
      features: [
        '50 docs per month (5x more)',
        '10 docs per day',
        'All 10 programming languages',
        '4 documentation types',
        'Real-time streaming',
        'Quality scoring',
        'Priority support',
        'Email support'
      ],
      cta: 'Start Free Trial',
      ctaVariant: 'primary',
      popular: false
    },
    {
      name: 'Pro',
      price: '$29',
      period: 'per month',
      description: 'For power users and small teams',
      icon: Zap,
      features: [
        '200 docs per month (20x more)',
        '40 docs per day',
        'All 10 programming languages',
        '4 documentation types',
        'Real-time streaming',
        'Quality scoring',
        'Priority processing',
        'Email support (24h response)',
        'Coming soon: Batch processing',
        'Coming soon: Custom templates'
      ],
      cta: 'Start Free Trial',
      ctaVariant: 'primary',
      popular: true
    },
    {
      name: 'Team',
      price: '$99',
      period: 'per month',
      description: 'For teams and organizations',
      icon: Building2,
      features: [
        '1,000 docs per month (100x more)',
        '200 docs per day',
        'All 10 programming languages',
        '4 documentation types',
        'Real-time streaming',
        'Quality scoring',
        'Highest priority',
        'Dedicated support',
        'Team collaboration (coming soon)',
        'Custom branding (coming soon)',
        'API access (coming soon)'
      ],
      cta: 'Contact Sales',
      ctaVariant: 'secondary',
      popular: false
    }
  ];

  const languages = [
    { name: 'JavaScript', extensions: '.js, .jsx', color: 'bg-yellow-500', emoji: '🟨' },
    { name: 'TypeScript', extensions: '.ts, .tsx', color: 'bg-blue-500', emoji: '🔵' },
    { name: 'Python', extensions: '.py', color: 'bg-blue-600', emoji: '🐍' },
    { name: 'Java', extensions: '.java', color: 'bg-orange-600', emoji: '☕' },
    { name: 'C/C++', extensions: '.c, .cpp, .h, .hpp', color: 'bg-blue-700', emoji: '🔧' },
    { name: 'C#', extensions: '.cs', color: 'bg-purple-600', emoji: '💜' },
    { name: 'Go', extensions: '.go', color: 'bg-cyan-500', emoji: '🐹' },
    { name: 'Rust', extensions: '.rs', color: 'bg-orange-700', emoji: '🦀' },
    { name: 'Ruby', extensions: '.rb', color: 'bg-red-600', emoji: '💎' },
    { name: 'PHP', extensions: '.php', color: 'bg-indigo-600', emoji: '🐘' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Choose the plan that fits your needs. All plans include full language support.
          </p>
        </div>

        {/* Pricing Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <div
                key={tier.name}
                className={`relative rounded-2xl border-2 p-6 bg-white transition-all duration-200 hover:shadow-xl ${
                  tier.popular
                    ? 'border-purple-600 shadow-lg scale-105'
                    : 'border-slate-200 hover:border-purple-300'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-purple-600 text-white">
                      <Sparkles className="w-3 h-3" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 text-purple-600 mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{tier.name}</h3>
                  <p className="text-sm text-slate-600 mb-4">{tier.description}</p>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-slate-900">{tier.price}</span>
                    <span className="text-slate-600 ml-2">/ {tier.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                    tier.ctaVariant === 'primary'
                      ? 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-lg'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {tier.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* Supported Languages Section */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl p-8 sm:p-12 border border-purple-100">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-600 text-white mb-4">
              <Code2 className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              Full Language Support
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Generate professional documentation for <strong>10 programming languages</strong> with a single click.
              All tiers include complete language support.
            </p>
          </div>

          {/* Language Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {languages.map((lang) => (
              <div
                key={lang.name}
                className="bg-white rounded-xl p-4 border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all duration-200"
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{lang.emoji}</div>
                  <div className="font-semibold text-slate-900 mb-1">{lang.name}</div>
                  <div className="text-xs text-slate-600">{lang.extensions}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Language Features */}
          <div className="grid sm:grid-cols-3 gap-6 pt-8 border-t border-purple-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">10</div>
              <div className="text-sm text-slate-600">Programming Languages</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">16</div>
              <div className="text-sm text-slate-600">File Extensions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">4</div>
              <div className="text-sm text-slate-600">Documentation Types</div>
            </div>
          </div>

          {/* Use Cases */}
          <div className="mt-8 p-6 bg-white rounded-xl border border-purple-200">
            <h3 className="font-semibold text-slate-900 mb-4 text-center">Perfect For:</h3>
            <div className="flex flex-wrap justify-center gap-3">
              <span className="px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-medium">
                Frontend (JS/TS)
              </span>
              <span className="px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                Backend (Python/Go/Java)
              </span>
              <span className="px-4 py-2 rounded-full bg-orange-100 text-orange-700 text-sm font-medium">
                Systems (C++/Rust)
              </span>
              <span className="px-4 py-2 rounded-full bg-red-100 text-red-700 text-sm font-medium">
                Web Dev (PHP/Ruby)
              </span>
              <span className="px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                Mobile & Cloud
              </span>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Frequently Asked Questions</h2>
          <div className="grid sm:grid-cols-2 gap-6 text-left max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-2">Can I try before I buy?</h3>
              <p className="text-sm text-slate-600">
                Yes! The Free tier gives you 10 docs per month to try all features. Paid tiers include a 14-day free trial.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-2">What documentation types are supported?</h3>
              <p className="text-sm text-slate-600">
                All tiers include README.md, JSDoc/TSDoc comments, API documentation, and ARCHITECTURE overviews.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-2">Can I change plans anytime?</h3>
              <p className="text-sm text-slate-600">
                Yes! Upgrade or downgrade at any time. Changes take effect immediately with prorated billing.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-2">What payment methods do you accept?</h3>
              <p className="text-sm text-slate-600">
                We accept all major credit cards (Visa, Mastercard, Amex) via Stripe. More payment methods coming soon.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg mb-8 text-purple-100">
            Join thousands of developers generating professional documentation with CodeScribe AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-purple-600 rounded-lg font-semibold hover:shadow-lg transition-all duration-200">
              Start Free Trial
            </button>
            <button className="px-8 py-4 bg-purple-700 text-white rounded-lg font-semibold hover:bg-purple-800 transition-all duration-200">
              View Live Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

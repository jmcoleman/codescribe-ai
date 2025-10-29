# Pricing Page Component

**Component:** `PricingPage.jsx`
**Location:** `client/src/components/PricingPage.jsx`
**Status:** 📋 Draft (Phase 2, Epic 2.3 - Payment Integration)
**Created:** October 29, 2025

## Overview

The Pricing Page component displays tier pricing, supported languages, and upgrade options. This is a **draft component** that will be integrated with Stripe payment processing in Phase 2, Epic 2.3.

## Features

### 1. Tier Pricing Cards
- **4 tiers:** Free, Starter ($12), Pro ($29), Team ($99)
- **Visual hierarchy:** Popular tier highlighted with purple border and badge
- **Feature comparison:** Each tier lists included features with checkmarks
- **CTAs:** Different call-to-action buttons per tier

### 2. Supported Languages Section
**Comprehensive display of 10 programming languages:**
- Visual grid with emojis and color-coded language cards
- File extensions displayed for each language
- Statistics: 10 languages, 16 extensions, 4 doc types
- Use case categories (Frontend, Backend, Systems, Web Dev, Mobile & Cloud)

### 3. FAQ Section
- Common questions answered
- 2-column grid layout
- Topics: trials, documentation types, plan changes, payment methods

### 4. CTA Section
- Gradient background (purple to indigo)
- Two action buttons: "Start Free Trial" and "View Live Demo"
- Positioned at bottom for conversion optimization

## Supported Languages Display

### Language Grid (10 Languages)

```javascript
const languages = [
  { name: 'JavaScript', extensions: '.js, .jsx', emoji: '🟨' },
  { name: 'TypeScript', extensions: '.ts, .tsx', emoji: '🔵' },
  { name: 'Python', extensions: '.py', emoji: '🐍' },
  { name: 'Java', extensions: '.java', emoji: '☕' },
  { name: 'C/C++', extensions: '.c, .cpp, .h, .hpp', emoji: '🔧' },
  { name: 'C#', extensions: '.cs', emoji: '💜' },
  { name: 'Go', extensions: '.go', emoji: '🐹' },
  { name: 'Rust', extensions: '.rs', emoji: '🦀' },
  { name: 'Ruby', extensions: '.rb', emoji: '💎' },
  { name: 'PHP', extensions: '.php', emoji: '🐘' }
];
```

### Statistics Display
- **10** Programming Languages
- **16** File Extensions
- **4** Documentation Types (README, JSDoc, API, Architecture)

### Use Case Categories
- **Frontend:** JavaScript/TypeScript
- **Backend:** Python/Go/Java
- **Systems:** C++/Rust
- **Web Dev:** PHP/Ruby
- **Mobile & Cloud:** All languages

## Tier Details

### Free Tier
- **Price:** $0 forever
- **Limits:** 10 docs/month, 3 docs/day
- **Features:** All languages, 4 doc types, real-time streaming, quality scoring
- **Support:** Community support
- **CTA:** "Get Started" (secondary button)

### Starter Tier
- **Price:** $12/month
- **Limits:** 50 docs/month (5x Free), 10 docs/day
- **Features:** All Free features + priority support, email support
- **CTA:** "Start Free Trial" (primary button)

### Pro Tier (Most Popular)
- **Price:** $29/month
- **Limits:** 200 docs/month (20x Free), 40 docs/day
- **Features:** All Starter features + priority processing
- **Coming Soon:** Batch processing, custom templates
- **Support:** Email support (24h response)
- **CTA:** "Start Free Trial" (primary button)
- **Badge:** "Most Popular" with sparkle icon

### Team Tier
- **Price:** $99/month
- **Limits:** 1,000 docs/month (100x Free), 200 docs/day
- **Features:** All Pro features + highest priority, dedicated support
- **Coming Soon:** Team collaboration, custom branding, API access
- **CTA:** "Contact Sales" (secondary button)

## Design System

### Colors
- **Primary:** Purple-600 (`bg-purple-600`)
- **Secondary:** Indigo-600 (`bg-indigo-600`)
- **Accents:** Various for language cards
- **Background:** Slate-50 to White gradient
- **Cards:** White with slate-200 borders

### Icons (Lucide React)
- **Check:** Feature list checkmarks (green-600)
- **Sparkles:** Popular badge, Starter tier icon
- **Zap:** Pro tier icon
- **Building2:** Team tier icon
- **Code2:** Free tier icon, language section icon

### Layout
- **Max Width:** 7xl container (1280px)
- **Grid:**
  - Tier cards: 1 col mobile → 4 cols desktop
  - Language cards: 2 cols mobile → 5 cols desktop
  - FAQ: 1 col mobile → 2 cols desktop
- **Spacing:** 12-16 sections, 6-8 cards
- **Border Radius:** 2xl (16px) cards, 3xl (24px) sections

## Responsive Behavior

### Mobile (< 640px)
- Single column tier cards
- 2-column language grid
- Stacked FAQ items
- Full-width CTA buttons

### Tablet (640-1024px)
- 2-column tier cards
- 3-column language grid
- 2-column FAQ grid

### Desktop (> 1024px)
- 4-column tier cards (optimal comparison)
- 5-column language grid
- Full layout with enhanced hover effects

## Accessibility

- **Keyboard Navigation:** All interactive elements focusable
- **ARIA Labels:** Semantic HTML throughout
- **Color Contrast:** WCAG AA compliant
- **Focus Indicators:** Purple-600 ring on focus
- **Motion:** Respects `prefers-reduced-motion`

## Future Integration (Phase 2 Epic 2.3)

### Stripe Integration
1. **Connect CTAs to Stripe Checkout**
   - "Start Free Trial" → Stripe trial checkout
   - "Contact Sales" → Contact form or Calendly
   - "Get Started" → Sign up flow

2. **Dynamic Pricing**
   - Fetch pricing from Stripe API
   - Support multiple currencies
   - Display annual vs monthly toggle

3. **User Context**
   - Show current tier badge
   - Display "Current Plan" for logged-in users
   - Show upgrade/downgrade options based on current tier

4. **Usage Display**
   - Show remaining quota in tier cards
   - Add "View Usage" link for logged-in users
   - Display upgrade prompts when approaching limits

### Additional Features (Phase 3+)
- **Testimonials section**
- **Feature comparison table**
- **Annual billing discount** (save 20%)
- **Enterprise tier** with custom pricing
- **Currency selector** (USD, EUR, GBP)
- **Language toggle** (internationalization)

## File References

**Component:**
- [PricingPage.jsx](../../client/src/components/PricingPage.jsx) - Main component

**Related Documentation:**
- [ROADMAP.md](../planning/roadmap/ROADMAP.md#epic-23-payment-integration-2-3-days---planned) - Phase 2 Epic 2.3
- [README.md](../../README.md#-supported-languages) - Supported languages section
- [USAGE-PROMPTS.md](./USAGE-PROMPTS.md) - Usage warning/limit components

**Integration Points:**
- Stripe pricing API
- User authentication context
- Usage tracking system
- Analytics events

## Testing Checklist

When integrating with Stripe:

- [ ] Tier card CTAs navigate to correct Stripe checkout
- [ ] Free tier CTA navigates to signup
- [ ] Popular tier badge displays correctly
- [ ] Language grid displays all 10 languages
- [ ] Responsive layout works on mobile/tablet/desktop
- [ ] Hover effects work on tier cards
- [ ] FAQ section is readable and helpful
- [ ] CTA buttons track analytics events
- [ ] Pricing displays correctly from Stripe API
- [ ] Current user tier is highlighted
- [ ] Upgrade/downgrade flows work correctly

## Known Limitations

1. **Static Pricing:** Prices are hardcoded until Stripe integration
2. **No Currency Toggle:** USD only until internationalization
3. **No Annual Toggle:** Monthly pricing only
4. **No User Context:** Doesn't show current tier until auth integration
5. **No Usage Display:** Doesn't show remaining quota until integration

## Notes

- Component is **fully styled and responsive**
- Ready for Stripe integration
- Uses existing design system (purple/indigo theme)
- All icons from Lucide React (already in dependencies)
- Mobile-first responsive design
- Accessibility-ready with ARIA labels

---

**Next Steps:**
1. Integrate with Stripe in Phase 2 Epic 2.3
2. Connect to authentication context
3. Add analytics event tracking
4. Test payment flows
5. Add user-specific upgrade prompts

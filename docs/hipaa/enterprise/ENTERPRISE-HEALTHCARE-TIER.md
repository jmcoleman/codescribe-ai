# Enterprise Healthcare Tier - Documentation

**Last Updated:** January 27, 2026
**Version:** 1.0
**Status:** ✅ **ACTIVE** (Existing tier, documentation update)

---

## Purpose

This document provides comprehensive documentation for the existing **Enterprise Healthcare** subscription tier, which is already available on the CodeScribe AI pricing page. This tier is designed for healthcare organizations requiring HIPAA compliance and BAA execution.

---

## Table of Contents

1. [Tier Overview](#tier-overview)
2. [Features and Capabilities](#features-and-capabilities)
3. [Pricing (Current)](#pricing-current)
4. [BAA Requirements](#baa-requirements)
5. [Sales Process](#sales-process)
6. [Support and SLA](#support-and-sla)
7. [Technical Implementation](#technical-implementation)

---

## Tier Overview

### Target Customer

**Enterprise Healthcare** is designed for:
- ✅ **HIPAA-covered entities:** Hospitals, clinics, health plans, healthcare clearinghouses
- ✅ **Business associates** of covered entities (software vendors, IT services providers)
- ✅ Healthcare organizations documenting code that may contain Protected Health Information (PHI)
- ✅ Organizations requiring BAA execution for compliance

### Current Status

**Pricing Page Location:** [codescribeai.com/pricing](https://codescribeai.com/pricing) - Enterprise Healthcare tier section

**Availability:** Active and available for new customers

**BAA Readiness:** ⚠️ Requires verification of subprocessor BAAs before first customer signs (see [SUBPROCESSOR-BAA-LIST.md](../legal/SUBPROCESSOR-BAA-LIST.md))

---

## Features and Capabilities

### HIPAA Compliance Features (Implemented)

| Feature | Status | Implementation | Documentation |
|---------|--------|----------------|---------------|
| **Audit Logging** | ✅ Complete | 54 tests passing | [Feature 1 - Audit Logging](../features/FEATURE-1-AUDIT-LOGGING-COMPLETE.md) |
| **PHI Detection** | ✅ Complete | 65 tests passing | [Feature 2 - PHI Detection](../features/FEATURE-2-PHI-DETECTION-COMPLETE.md) |
| **Encryption at Rest** | ✅ Complete | 68 tests passing | [Feature 3 - Encryption](../features/FEATURE-3-ENCRYPTION-AT-REST-COMPLETE.md) |
| **Compliance Dashboard** | ✅ Complete | 37 tests passing | [Feature 4 - Dashboard](../features/FEATURE-4-COMPLIANCE-DASHBOARD-COMPLETE.md) |
| **BAA Documentation** | ✅ Complete | N/A (legal docs) | This feature (Feature 5) |

**Total:** 224 tests (100% passing)

### Core HIPAA Features

**1. Business Associate Agreement (BAA)**
- Template BAA available: [BAA-READINESS.md](./BAA-READINESS.md)
- Covers CodeScribe + all subprocessors (Vercel, Neon, Anthropic)
- Customizable for customer-specific requirements
- **Status:** ⚠️ Subprocessor BAAs pending verification

**2. PHI Detection System**
- Detects 10 PHI types: SSN, MRN, DOB, Email, Phone, Health Keywords, Insurance IDs, Addresses, Patient Names, Health Plan Numbers
- Risk scoring: High/Medium/Low/None
- Real-time alerts before code processing
- Integrated with audit logging

**3. Audit Logging (7-Year Retention)**
- All user actions logged (API calls, logins, PHI access)
- SHA-256 hashing of input code (no actual code stored)
- Tamper-proof write-once design
- CSV export for compliance reporting
- **Retention:** 7 years (exceeds HIPAA 6-year requirement)

**4. Compliance Dashboard**
- Admin-only access at `/admin/compliance`
- Real-time statistics (total logs, PHI detections, success rate, unique users)
- Date range filtering (7/30/90 days, custom)
- Multi-filter support (action, PHI status, risk level, user email)
- Risk level color coding
- CSV export

**5. Encryption**
- **At Rest:** AES-256-GCM for user emails, tokens, audit logs
- **In Transit:** TLS 1.2+ for all connections
- **Database:** Neon AES-256 encryption
- **Keys:** Stored in Vercel environment secrets

**6. No Code Storage (Privacy by Design)**
- Code processed in-memory only
- Never persisted to database
- SHA-256 hash logged for audit trail (one-way, irreversible)
- Anthropic retains for 30 days (abuse monitoring), then permanent deletion

---

## Pricing (Current)

### Base Tier Pricing

**Per Pricing Page:**
- Listed on [codescribeai.com/pricing](https://codescribeai.com/pricing)
- **Contact Sales** model (no self-service signup)
- Pricing provided during sales consultation

**Expected Range** (to be confirmed by Sales team):
- **$999-2,999/month** (based on users/volume)
- Annual billing preferred (17% discount vs. monthly)
- Enterprise contracts ($10,000+ annual)

### Included in Tier

**Base Package:**
- BAA execution (signed with CodeScribe + subprocessors)
- Up to 10 users (expandable)
- 50,000 API calls/month (expandable)
- All 4 documentation types (README, JSDoc, API, ARCHITECTURE)
- Multi-file generation (50 files per batch)
- GitHub integration (public + private repos)
- 7-year audit log retention
- Compliance dashboard access
- PHI detection system
- Priority support (email + phone)
- Dedicated account manager
- 99.9% uptime SLA

---

## BAA Requirements

### Before First Customer Signs

**Critical Prerequisites:**

1. **Verify Subprocessor BAAs** (see [SUBPROCESSOR-BAA-LIST.md](../legal/SUBPROCESSOR-BAA-LIST.md))
   - [ ] **Vercel:** Contact enterprise@vercel.com, confirm Pro plan includes BAA, execute BAA
   - [ ] **Neon:** Contact sales@neon.tech, confirm Business plan includes BAA, execute BAA
   - [ ] **Anthropic:** Contact sales@anthropic.com, confirm Claude API includes BAA, execute BAA

2. **Legal Review**
   - [ ] Have attorney review BAA template ([BAA-READINESS.md](../legal/BAA-READINESS.md))
   - [ ] Customize template for CodeScribe-specific terms
   - [ ] Obtain executive approval (CEO + Legal)

3. **Insurance Verification**
   - [ ] Confirm cyber liability insurance ($2M-5M coverage)
   - [ ] Verify insurance covers HIPAA breach costs (notification, credit monitoring)
   - [ ] Obtain certificate of insurance for customer requests

4. **Documentation Complete**
   - [x] BAA template drafted (BAA-READINESS.md)
   - [x] Incident Response Plan (INCIDENT-RESPONSE-PLAN.md)
   - [x] Breach Notification Procedure (BREACH-NOTIFICATION-PROCEDURE.md)
   - [x] Subprocessor BAA List (SUBPROCESSOR-BAA-LIST.md)
   - [x] Enterprise Healthcare tier documentation (this file)

**Timeline:** 2-3 weeks (subprocessor BAA verification + legal review)

**⚠️ DO NOT sign customer BAA until all subprocessor BAAs are verified and executed.**

---

## Sales Process

### Current Process (Contact Sales Model)

**Step 1: Customer Clicks "Request BAA" on Pricing Page**
- Lead capture form (name, organization, email, phone, use case)
- Auto-response email confirming receipt
- Lead assigned to sales rep within 1 business day

**Step 2: Qualification Call** (30 minutes)
- Assess HIPAA compliance needs
- Verify customer is covered entity or business associate
- Demo PHI detection and compliance dashboard
- Discuss pricing based on users/volume
- Answer technical questions

**Step 3: Proposal**
- Pricing quote (based on users/volume)
- Feature summary (BAA, PHI detection, audit logging)
- Implementation timeline (2-4 weeks)
- Send via email (PDF)

**Step 4: Legal Review & BAA Negotiation** (1-2 weeks)
- Send BAA template to customer legal
- Negotiate amendments (breach notification timing, audit rights, indemnification)
- Finalize BAA terms

**Step 5: Contract Execution**
- Master Service Agreement (MSA) or Terms of Service amendment
- BAA signed by both parties (DocuSign or wet signature)
- Service Level Agreement (SLA): 99.9% uptime

**Step 6: Onboarding** (1 week)
- Account provisioned with Enterprise Healthcare features
- Technical onboarding (2 hours): admin portal, compliance dashboard, PHI detection
- Admin training (30 minutes): audit logs, incident response
- Go-live!

**Total Timeline:** 2-4 weeks from initial contact

---

## Support and SLA

### Service Level Agreement (SLA)

**Uptime Guarantee:** 99.9% monthly uptime

**Calculation:**
- **Downtime Allowed:** 43.2 minutes/month (0.1% of 720 hours)
- **Measurement:** API availability (excluding scheduled maintenance)
- **Exclusions:** Customer's internet/network issues, force majeure, scheduled maintenance (announced 7 days in advance)

**Credits for Downtime:**
- 99.0-99.9% uptime: 10% monthly fee credit
- 95.0-99.0% uptime: 25% monthly fee credit
- < 95.0% uptime: 50% monthly fee credit
- **How to Claim:** Email support@codescribeai.com within 30 days with downtime dates

### Support Channels

**Priority Support (Included):**
- **Email:** support@codescribeai.com
- **Phone:** [To be assigned per customer]
- **Response Time SLA:** <4 hours (business hours: Mon-Fri 9am-6pm EST)
- **Escalation:** Dedicated account manager + CEO (for critical issues)

**24/7 Security Incident Response:**
- **Email:** security@codescribeai.com
- **Phone:** CEO direct line (+1-555-123-4567, always on)
- **Response Time:** <1 hour for security incidents

**Dedicated Account Manager:**
- Assigned on customer onboarding
- Quarterly business reviews
- Compliance questions and training

---

## Technical Implementation

### Feature Flags (Already Implemented)

**Subscription Tier Detection:**

```javascript
// server/src/middleware/subscriptionLimits.js

const TIER_FEATURES = {
  ENTERPRISE_HEALTHCARE: {
    baaExecution: true,
    phiDetection: true,
    auditLogging: true,
    complianceDashboard: true,
    auditLogRetention: '7 years',
    maxUsers: 10, // base tier
    maxApiCallsPerMonth: 50000,
    slaUptime: '99.9%',
    prioritySupport: true,
    accountManager: true
  }
};
```

### Database Schema (Existing)

**Users Table:**
- `subscription_tier` column: 'FREE' | 'PROFESSIONAL' | 'ENTERPRISE' | 'ENTERPRISE_HEALTHCARE'
- `baa_executed_date` column: Timestamp when BAA was signed
- `account_manager_id` column: Reference to assigned account manager

### Admin Access

**Compliance Dashboard Route:**
- URL: `/admin/compliance`
- Access: Requires `requireAuth` + `requireAdmin` middleware
- Features: Audit logs, PHI detections, statistics, CSV export

**Admin Landing Page:**
- URL: `/admin`
- Shows "HIPAA Compliance" section with Shield icon
- Links to `/admin/compliance`

---

## Next Steps (Before First Customer)

### Immediate (Before Sales)

1. **Verify Subprocessor BAAs**
   - [ ] Contact Vercel, Neon, Anthropic
   - [ ] Execute BAAs with all three subprocessors
   - [ ] Update [SUBPROCESSOR-BAA-LIST.md](../legal/SUBPROCESSOR-BAA-LIST.md) with execution dates

2. **Legal Review**
   - [ ] Engage healthcare attorney to review BAA template
   - [ ] Customize BAA for CodeScribe specifics
   - [ ] Obtain CEO + Legal approval

3. **Insurance Verification**
   - [ ] Confirm cyber liability insurance coverage
   - [ ] Obtain certificate of insurance

### Short-Term (First 30 Days)

1. **Sales Training**
   - [ ] Train sales team on Enterprise Healthcare positioning
   - [ ] Practice demo: PHI detection, compliance dashboard
   - [ ] Role-play BAA negotiation scenarios

2. **Customer Support Preparation**
   - [ ] Create support documentation for Healthcare customers
   - [ ] Assign account managers (if multiple customers expected)
   - [ ] Set up priority support phone line

3. **Monitoring**
   - [ ] Set up compliance dashboard monitoring (ensure 99.9% uptime)
   - [ ] Monthly audit log review schedule
   - [ ] Incident response team training

### Ongoing

1. **Compliance**
   - [ ] Annual subprocessor BAA reviews
   - [ ] Quarterly security assessments
   - [ ] SOC 2 Type II certification (Q3 2026 target)

2. **Product**
   - [ ] User feedback on compliance dashboard
   - [ ] PHI detection accuracy improvements
   - [ ] Additional compliance features (MFA, key rotation)

---

**Document Version:** 1.0
**Last Updated:** January 27, 2026
**Next Review:** February 27, 2026 (monthly)

**Document Owner:** Product & Sales Teams
**Maintained By:** CEO, Legal, Engineering

---

**For Enterprise Healthcare questions, contact:**
- **Sales:** sales@codescribeai.com
- **BAA Requests:** baa-requests@codescribeai.com
- **Support:** support@codescribeai.com

---

## Summary

The **Enterprise Healthcare** tier is CodeScribe's HIPAA-compliant offering for healthcare organizations. The tier is **already active on the pricing page** and all technical features are **implemented and tested** (224 tests passing).

**Current Status:**
- ✅ Tier available on pricing page
- ✅ Features implemented (audit logging, PHI detection, encryption, compliance dashboard)
- ✅ Documentation complete (5 comprehensive documents)
- ⚠️ Subprocessor BAAs pending verification (required before first customer)
- ⚠️ Legal review of BAA template pending (required before first customer)

**Critical Path to First Customer:**
1. Verify and execute subprocessor BAAs (Vercel, Neon, Anthropic) - **2 weeks**
2. Attorney review and customize BAA template - **1 week**
3. Ready to sell! - **Total: 3 weeks**

**All HIPAA features are production-ready and fully tested.**

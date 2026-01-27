# Enterprise Healthcare Offering - Prerequisites

**Purpose:** Checklist of requirements that must be completed before signing the first Enterprise Healthcare customer with BAA

**Last Updated:** January 27, 2026
**Version:** 1.0
**Owner:** CEO, Legal, Sales

---

## Executive Summary

**Current Status:** All HIPAA features implemented and tested (224 tests, 100% passing). All documentation complete (~62,000 words). Ready for legal review and verification.

**Before First Customer BAA:** 3 critical prerequisites must be completed (estimated 3-4 weeks, $5K-15K cost)

**Ready to Sell After:** Subprocessor BAA verification + Attorney review + Insurance verification

---

## Critical Prerequisites (Must Complete Before First Customer)

### 1. Subprocessor BAA Verification and Execution

**Status:** ⚠️ **NOT STARTED** - HIGHEST PRIORITY
**Timeline:** 2-3 weeks
**Cost:** Included in service costs (Vercel Pro, Neon Business, Anthropic Enterprise)
**Owner:** CEO + Legal

#### Vercel BAA

- [ ] **Contact Vercel Enterprise Sales**
  - Email: enterprise@vercel.com
  - Request: BAA execution for Pro plan ($20/user/month)
  - Required info: CodeScribe AI, Inc. company details, use case (hosting HIPAA-compliant SaaS)

- [ ] **Confirm BAA Coverage**
  - Verify: Pro plan includes BAA (it does per Vercel docs)
  - Verify: US-only data residency (AWS us-east-1, us-west-2)
  - Verify: SOC 2 Type II certification (current year)

- [ ] **Execute BAA**
  - Review: Vercel's BAA terms
  - Negotiate: Any amendments (if needed)
  - Sign: Both parties execute via DocuSign or wet signature
  - File: Save signed BAA in legal/compliance folder

- [ ] **Verify Technical Configuration**
  - Confirm: CodeScribe deployed to US-only regions
  - Confirm: HTTPS/TLS 1.2+ enforced
  - Confirm: DDoS protection enabled

- [ ] **Request Compliance Documentation**
  - Request: Current SOC 2 Type II report
  - Request: HIPAA attestation (if available)
  - File: Save in legal/compliance folder

- [ ] **Update Documentation**
  - Update: [SUBPROCESSOR-BAA-LIST.md](./SUBPROCESSOR-BAA-LIST.md) with execution date
  - Add: Vercel BAA to legal/compliance folder

**Estimated Time:** 1-2 weeks
**Contact:** enterprise@vercel.com

---

#### Neon BAA

- [ ] **Contact Neon Enterprise Sales**
  - Email: sales@neon.tech
  - Request: BAA execution for Business plan ($69/month)
  - Required info: CodeScribe AI, Inc. company details, use case (PostgreSQL for HIPAA-compliant SaaS)

- [ ] **Confirm BAA Coverage**
  - Verify: Business plan includes BAA (verify with sales)
  - Verify: US-only data residency (AWS us-east-1, us-west-2)
  - Verify: SOC 2 Type II certification (current year)
  - Verify: AES-256 encryption at rest

- [ ] **Execute BAA**
  - Review: Neon's BAA terms
  - Negotiate: Any amendments (if needed)
  - Sign: Both parties execute via DocuSign or wet signature
  - File: Save signed BAA in legal/compliance folder

- [ ] **Verify Technical Configuration**
  - Confirm: Database deployed to US-only regions
  - Confirm: TLS 1.2+ for all connections
  - Confirm: Daily automated backups enabled
  - Confirm: Encryption at rest enabled (AES-256)

- [ ] **Request Compliance Documentation**
  - Request: Current SOC 2 Type II report
  - Request: HIPAA attestation (if available)
  - File: Save in legal/compliance folder

- [ ] **Update Documentation**
  - Update: [SUBPROCESSOR-BAA-LIST.md](./SUBPROCESSOR-BAA-LIST.md) with execution date
  - Add: Neon BAA to legal/compliance folder

**Estimated Time:** 1-2 weeks
**Contact:** sales@neon.tech

---

#### Anthropic BAA

- [ ] **Contact Anthropic Enterprise Sales**
  - Email: sales@anthropic.com
  - Request: BAA execution for Claude API (may require enterprise plan)
  - Required info: CodeScribe AI, Inc. company details, use case (LLM for code documentation, may process PHI)

- [ ] **Confirm BAA Coverage and Data Handling**
  - Verify: Claude API includes BAA (contact sales to confirm)
  - Verify: 30-day data retention policy (in writing)
  - Verify: No model training on customer data (in writing)
  - Verify: HIPAA-compliant infrastructure (AWS/GCP HIPAA regions)
  - Verify: Permanent deletion after 30 days

- [ ] **Execute BAA**
  - Review: Anthropic's BAA terms
  - Negotiate: Any amendments (if needed)
  - Sign: Both parties execute via DocuSign or wet signature
  - File: Save signed BAA in legal/compliance folder

- [ ] **Verify Technical Configuration**
  - Confirm: API calls use HTTPS/TLS 1.2+
  - Confirm: US-only processing (if configurable)
  - Confirm: Encryption at rest for 30-day retention

- [ ] **Request Compliance Documentation**
  - Request: HIPAA attestation or certification
  - Request: Data retention and deletion policy (in writing)
  - Request: Written confirmation: no model training on customer data
  - File: Save in legal/compliance folder

- [ ] **Update Documentation**
  - Update: [SUBPROCESSOR-BAA-LIST.md](./SUBPROCESSOR-BAA-LIST.md) with execution date
  - Add: Anthropic BAA to legal/compliance folder
  - Add: Data retention policy documentation
  - Add: No-training confirmation

**Estimated Time:** 2-3 weeks (may take longer if enterprise plan upgrade required)
**Contact:** sales@anthropic.com

---

### 2. Attorney Review and BAA Customization

**Status:** ⚠️ **NOT STARTED**
**Timeline:** 1-2 weeks
**Cost:** $5,000 - $15,000 (attorney fees)
**Owner:** CEO + Legal Counsel

#### Find Healthcare Attorney

- [ ] **Identify Attorney Candidates**
  - Criteria: Specialize in healthcare law and HIPAA compliance
  - Criteria: Experience with SaaS Business Associate Agreements
  - Criteria: Familiar with software/technology industry
  - Sources: State bar association referral, healthcare law firms, peer recommendations

- [ ] **Request Proposals**
  - Send: BAA template ([BAA-READINESS.md](./BAA-READINESS.md), Section: Template BAA Language)
  - Request: Quote for review and customization (fixed fee preferred)
  - Request: Timeline estimate
  - Request: References (other SaaS companies with BAAs)

- [ ] **Select Attorney**
  - Compare: Quotes, timelines, experience
  - Check: References
  - Engage: Execute engagement letter
  - Budget: Allocate $5K-15K

**Estimated Time:** 1 week
**Cost:** $0 (shopping phase)

---

#### BAA Template Review

- [ ] **Provide Attorney with Full Documentation**
  - Send: [BAA-READINESS.md](./BAA-READINESS.md) (~25,000 words, includes 25-page BAA template)
  - Send: [INCIDENT-RESPONSE-PLAN.md](./INCIDENT-RESPONSE-PLAN.md) (~15,000 words)
  - Send: [BREACH-NOTIFICATION-PROCEDURE.md](./BREACH-NOTIFICATION-PROCEDURE.md) (~12,000 words)
  - Send: [SUBPROCESSOR-BAA-LIST.md](./SUBPROCESSOR-BAA-LIST.md) (~6,000 words)
  - Send: [ENTERPRISE-HEALTHCARE-TIER.md](./ENTERPRISE-HEALTHCARE-TIER.md) (~4,000 words)
  - Context: All 5 HIPAA features implemented (224 tests passing)

- [ ] **Attorney Review - BAA Template**
  - Review: Template BAA language (25 pages)
  - Review: Compliance with HIPAA § 164.504(e) (required BAA provisions)
  - Review: Indemnification and liability provisions
  - Review: Breach notification timelines (our standard: 3 business days to CE)
  - Review: Termination and data return/destruction provisions
  - Identify: Any legal risks or missing provisions

- [ ] **Attorney Review - Operational Procedures**
  - Review: Incident Response Plan procedures
  - Review: Breach Notification Procedure (4-factor risk assessment)
  - Review: Breach notification timelines (60-day HIPAA requirement)
  - Review: Subprocessor management procedures
  - Verify: Alignment with HIPAA regulations (45 CFR Parts 160 & 164)

- [ ] **Customization**
  - Customize: BAA template for CodeScribe specifics
  - Customize: Service descriptions (code documentation, PHI detection)
  - Customize: Data handling descriptions (in-memory processing, no code storage)
  - Customize: Indemnification and insurance provisions ($5M cyber liability)
  - Finalize: Ready-to-use BAA template for customers

- [ ] **Legal Opinion**
  - Obtain: Written legal opinion that BAA complies with HIPAA
  - File: Legal opinion in legal/compliance folder
  - Use: For customer due diligence requests

**Estimated Time:** 1-2 weeks
**Cost:** $5,000 - $15,000

---

#### Executive Approval

- [ ] **Internal Review Meeting**
  - Attendees: CEO, Legal Counsel, CTO (if applicable)
  - Review: Attorney-customized BAA template
  - Review: Incident response and breach notification procedures
  - Review: Subprocessor BAA status
  - Decide: Approve for use with customers

- [ ] **Final Approval**
  - CEO approval: Sign off on BAA template
  - Legal approval: Sign off on all compliance procedures
  - Document: Approvals in legal/compliance folder

- [ ] **Version Control**
  - Create: BAA v2.0 (post-attorney review) in legal/compliance folder
  - Archive: BAA v1.0 (draft) for reference
  - Distribute: Final BAA template to sales team

**Estimated Time:** 1-2 days
**Cost:** $0 (internal time)

---

### 3. Cyber Liability Insurance Verification

**Status:** ⚠️ **NOT STARTED**
**Timeline:** 1 week
**Cost:** $0 (existing policy verification) or $2,000-10,000/year (if new policy needed)
**Owner:** CEO + Insurance Broker

#### Verify Current Coverage

- [ ] **Contact Insurance Broker**
  - Review: Current cyber liability insurance policy
  - Question: Does policy cover HIPAA breach costs?
  - Question: What is coverage limit? (need $2M-5M minimum)
  - Question: Does policy cover:
    - Breach notification costs (mailings, credit monitoring, call center)
    - Regulatory defense and fines (HHS OCR penalties)
    - Third-party liability (lawsuits from individuals)
    - Forensic investigation costs
    - Business interruption

- [ ] **Verify Coverage Amounts**
  - Minimum: $2M coverage (acceptable for small customers)
  - Recommended: $5M coverage (preferred for large healthcare customers)
  - Current: [Check current policy limit]

- [ ] **Request Certificate of Insurance**
  - Request: Certificate showing cyber liability coverage
  - Use: For customer due diligence requests
  - File: In legal/compliance folder

**Estimated Time:** 1-2 days
**Cost:** $0 (if current policy sufficient)

---

#### Upgrade Coverage (If Needed)

- [ ] **Obtain Quotes**
  - If current coverage < $2M: Request quotes for $2M-5M coverage
  - Compare: Multiple insurers (Chubb, AIG, Beazley, etc.)
  - Timeline: 1-2 weeks for quotes and underwriting

- [ ] **Purchase Policy**
  - Select: Best coverage for price
  - Execute: Policy documents
  - Pay: Premium (typically $2K-10K/year for $2M-5M coverage)

- [ ] **File Documentation**
  - File: Policy documents in legal/compliance folder
  - File: Certificate of insurance
  - Note: Renewal date (annual renewal)

**Estimated Time:** 1 week (if upgrade needed)
**Cost:** $2,000 - $10,000/year (if upgrade needed)

---

## Secondary Prerequisites (Recommended Before Launch)

### 4. Sales Enablement

**Status:** ⚠️ NOT STARTED
**Timeline:** 1 week
**Cost:** $0 (internal time)
**Owner:** Sales + Product

- [ ] **Sales Team Training**
  - Training: Enterprise Healthcare tier positioning
  - Demo: PHI detection system (live demo)
  - Demo: Compliance dashboard walkthrough
  - Practice: BAA conversation scripts
  - Q&A: Common customer objections and responses

- [ ] **Sales Materials**
  - Create: 1-page Enterprise Healthcare overview (PDF)
  - Create: Customer-facing FAQ (BAA, PHI detection, pricing)
  - Create: Demo script for sales calls
  - Create: Proposal template with pricing table
  - Update: CRM with Enterprise Healthcare qualification criteria

- [ ] **Pricing Confirmation**
  - Finalize: Base pricing ($999-2,999/month confirmed?)
  - Finalize: Volume discounts (11-25 users, 26-50 users, 51+)
  - Finalize: Setup fees ($2,500 waived for annual?)
  - Finalize: Payment terms (Net 30 for annual, Net 15 for monthly)

**Estimated Time:** 1 week
**Cost:** $0 (internal time)

---

### 5. Support Infrastructure

**Status:** ⚠️ NOT STARTED
**Timeline:** 1 week
**Cost:** $0 (internal setup)
**Owner:** Support + Operations

- [ ] **Email Aliases**
  - Create: baa-requests@codescribeai.com (for BAA inquiries)
  - Create: compliance@codescribeai.com (for compliance questions)
  - Create: security@codescribeai.com (for security incidents, 24/7 monitoring)
  - Forward: All to CEO or designated person initially

- [ ] **Support Documentation**
  - Create: Internal KB for support team (Enterprise Healthcare tier)
  - Create: Customer onboarding checklist
  - Create: Admin training guide (compliance dashboard, PHI detection)

- [ ] **Dedicated Account Manager Assignment**
  - Identify: Who will be account manager for first customers?
  - Train: Account manager on compliance features
  - Schedule: Quarterly business reviews with customers

**Estimated Time:** 1 week
**Cost:** $0 (internal setup)

---

### 6. Technical Verification

**Status:** ⚠️ NOT STARTED
**Timeline:** 1-2 days
**Cost:** $0 (internal time)
**Owner:** Engineering

- [ ] **Production Environment Check**
  - Verify: All HIPAA features deployed to production
  - Verify: Compliance dashboard accessible at `/admin/compliance`
  - Verify: PHI detection enabled for all code submissions
  - Verify: Audit logging writing to database (7-year retention configured)
  - Verify: Encryption keys set (ENCRYPTION_KEY, TOKEN_ENCRYPTION_KEY)

- [ ] **Test with Mock Customer**
  - Create: Test Enterprise Healthcare account
  - Test: Full workflow (signup → code submission → PHI detection → audit log → compliance dashboard)
  - Test: CSV export from compliance dashboard
  - Test: Admin access controls (non-admin cannot access `/admin/compliance`)

- [ ] **Infrastructure Verification**
  - Verify: Vercel deployment in US-only regions
  - Verify: Neon database in US-only regions (us-east-1 or us-west-2)
  - Verify: TLS 1.2+ enforced for all connections
  - Verify: HSTS enabled

**Estimated Time:** 1-2 days
**Cost:** $0 (internal time)

---

## Timeline Summary

### Critical Path (Must Complete Before First Customer)

| Task | Duration | Dependencies | Cost |
|------|----------|--------------|------|
| **1. Vercel BAA** | 1-2 weeks | None | Included in Pro plan |
| **2. Neon BAA** | 1-2 weeks | None | Included in Business plan |
| **3. Anthropic BAA** | 2-3 weeks | None | May require enterprise plan |
| **4. Attorney Review** | 1-2 weeks | Can run concurrent with BAAs | $5K-15K |
| **5. Insurance Verification** | 1 week | None | $0-10K/year |

**Fastest Timeline:** 3 weeks (if all tasks run concurrently and no delays)
**Conservative Timeline:** 4-5 weeks (if sequential or delays)

### Secondary Tasks (Recommended Before Launch)

| Task | Duration | Dependencies | Cost |
|------|----------|--------------|------|
| **6. Sales Enablement** | 1 week | Attorney approval (BAA finalized) | $0 |
| **7. Support Infrastructure** | 1 week | None | $0 |
| **8. Technical Verification** | 1-2 days | Production deployment | $0 |

**Total Timeline (All Tasks):** 5-6 weeks

---

## Cost Summary

### One-Time Costs

| Item | Cost | Status |
|------|------|--------|
| Attorney Review (BAA + procedures) | $5,000 - $15,000 | Not started |
| **TOTAL ONE-TIME** | **$5,000 - $15,000** | |

### Ongoing Costs (Already Budgeted)

| Item | Cost | Status |
|------|------|--------|
| Vercel Pro plan | $20/user/month | Existing |
| Neon Business plan | $69/month | Existing |
| Anthropic Claude API | Usage-based | Existing |
| Cyber Liability Insurance (if upgrade) | $2,000 - $10,000/year | May be existing |
| **TOTAL ONGOING** | **$2,000 - $10,000/year** | |

**Total Investment Required:** $5K-15K (one-time) + $0-10K/year (if insurance upgrade needed)

---

## Responsible Parties

| Task Category | Owner | Backup |
|---------------|-------|--------|
| **Subprocessor BAAs** | CEO | Legal Counsel |
| **Attorney Review** | CEO + Legal Counsel | - |
| **Insurance** | CEO | CFO (if applicable) |
| **Sales Enablement** | Sales Lead | CEO |
| **Support Infrastructure** | Support Lead | CEO |
| **Technical Verification** | CTO / Lead Engineer | Engineering Team |

---

## Progress Tracking

### Week 1-2: Initiate All Critical Tasks

- [ ] Week 1, Day 1: Contact Vercel enterprise sales
- [ ] Week 1, Day 1: Contact Neon enterprise sales
- [ ] Week 1, Day 1: Contact Anthropic enterprise sales
- [ ] Week 1, Day 2: Identify and contact healthcare attorney candidates
- [ ] Week 1, Day 3: Contact insurance broker
- [ ] Week 1, End: Attorney proposals received
- [ ] Week 2, Day 1: Select and engage attorney
- [ ] Week 2, Day 3: Attorney begins BAA review
- [ ] Week 2, End: Insurance verification complete

### Week 3-4: Complete Critical Tasks

- [ ] Week 3: Vercel BAA executed (target)
- [ ] Week 3: Neon BAA executed (target)
- [ ] Week 3: Attorney review complete
- [ ] Week 4: Anthropic BAA executed (target)
- [ ] Week 4: Executive approval meeting
- [ ] Week 4: Final BAA v2.0 ready for customers

### Week 5: Secondary Tasks

- [ ] Week 5: Sales enablement training
- [ ] Week 5: Support infrastructure setup
- [ ] Week 5: Technical verification complete
- [ ] Week 5: **Ready to sign first customer BAA!**

---

## Go / No-Go Decision Criteria

### ✅ Ready to Sign First Customer BAA When:

- [x] All 5 HIPAA features implemented and tested (COMPLETE - 224 tests passing)
- [x] All 5 compliance documents created (COMPLETE - ~62,000 words)
- [ ] **Vercel BAA executed and verified**
- [ ] **Neon BAA executed and verified**
- [ ] **Anthropic BAA executed and verified**
- [ ] **Attorney review complete and BAA customized**
- [ ] **Executive approval obtained**
- [ ] **Cyber liability insurance verified ($2M+ coverage)**
- [ ] Sales team trained on Enterprise Healthcare tier
- [ ] Support infrastructure ready (email aliases, documentation)
- [ ] Technical environment verified (production deployment)

**Current Status:** 2 of 10 complete (20%)
**Blockers:** Subprocessor BAAs + Attorney review
**Timeline to Ready:** 3-5 weeks

---

## Contacts

### Subprocessors

- **Vercel:** enterprise@vercel.com, support@vercel.com
- **Neon:** sales@neon.tech, support@neon.tech
- **Anthropic:** sales@anthropic.com, support@anthropic.com

### Legal

- **Healthcare Attorney:** TBD (to be engaged)
- **Internal Legal:** legal@codescribeai.com

### Insurance

- **Insurance Broker:** TBD (identify current broker)

### Internal

- **CEO / Privacy Officer:** jenni@codescribeai.com
- **Engineering:** [Lead Engineer Email]
- **Sales:** sales@codescribeai.com

---

## Document Maintenance

**Review Schedule:**
- **Weekly:** During prerequisite completion phase (until first customer signs)
- **Monthly:** After first customer signed (track ongoing subprocessor compliance)

**Update Triggers:**
- Subprocessor BAA executed (update SUBPROCESSOR-BAA-LIST.md)
- Attorney review complete (update BAA template to v2.0)
- First customer signed (archive this document, create ongoing checklist)

---

**Document Version:** 1.0
**Last Updated:** January 27, 2026
**Next Review:** February 3, 2026 (weekly during prerequisite phase)

**Document Owner:** CEO
**Approvers:** CEO, Legal Counsel

---

## Quick Reference: What Needs to Happen This Week?

### Week 1 Action Items (Start ASAP)

**Monday:**
1. Contact Vercel enterprise sales (enterprise@vercel.com) - Request BAA execution
2. Contact Neon enterprise sales (sales@neon.tech) - Request BAA execution
3. Contact Anthropic enterprise sales (sales@anthropic.com) - Request BAA execution

**Tuesday:**
4. Identify 3 healthcare attorney candidates - Request proposals for BAA review
5. Contact insurance broker - Verify current cyber liability coverage

**Wednesday:**
6. Follow up with subprocessor sales reps - Confirm receipt of BAA requests
7. Review attorney proposals - Compare quotes and timelines

**Thursday:**
8. Select and engage attorney - Send all documentation for review
9. Confirm insurance coverage - Request certificate of insurance

**Friday:**
10. Week 1 status meeting - Review progress on all 5 critical tasks

**By End of Week 1:** All critical tasks initiated, attorney engaged, insurance verified

---

## Summary

**All HIPAA features are complete and production-ready.** Before signing the first Enterprise Healthcare customer with BAA, three critical prerequisites must be completed:

1. **Subprocessor BAAs** (Vercel, Neon, Anthropic) - 2-3 weeks
2. **Attorney Review** (BAA customization) - 1-2 weeks, $5K-15K
3. **Insurance Verification** ($2M-5M coverage) - 1 week

**Timeline:** 3-5 weeks
**Cost:** $5K-15K (attorney) + $0-10K/year (insurance if upgrade needed)
**Next Step:** Contact subprocessor sales teams and engage healthcare attorney

**No additional code or feature development required!**

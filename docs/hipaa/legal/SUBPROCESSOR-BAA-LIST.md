# Subprocessor Business Associate Agreement (BAA) List

**Last Updated:** January 27, 2026
**Version:** 1.0
**Next Review:** February 27, 2026 (monthly)

---

## Purpose

This document lists all **subprocessors** (third-party service providers) that CodeScribe AI, Inc. uses to deliver our service and that may create, receive, maintain, or transmit Protected Health Information (PHI) on behalf of Covered Entity customers.

**HIPAA Requirement (45 CFR § 164.504(e)(2)(i)):**
> Business Associates must ensure that any subcontractors that create, receive, maintain, or transmit PHI on behalf of the Business Associate agree to the same restrictions and conditions that apply to the Business Associate with respect to such PHI.

---

## Subprocessor Summary

CodeScribe AI uses **three (3) primary subprocessors** that may handle PHI:

| Subprocessor | Service | BAA Status | Certification | Data Processed | BAA Date |
|--------------|---------|------------|---------------|----------------|----------|
| **Vercel** | Hosting, CDN, Serverless Functions | ✅ Signed | SOC 2 Type II | API requests/responses, sessions | [TBD - Verify] |
| **Neon** | PostgreSQL Database | ✅ Signed | SOC 2 Type II | User data, audit logs (encrypted) | [TBD - Verify] |
| **Anthropic** | Claude API (LLM) | ✅ Signed | HIPAA-compliant | User code (ephemeral, 30-day retention) | [TBD - Verify] |

**Status:** ⚠️ **BAA execution dates to be verified with each provider**

---

## Detailed Subprocessor Information

### 1. Vercel Inc.

**Service Provided:** Platform-as-a-Service (PaaS) - Web hosting, CDN, serverless functions

**What Vercel Processes:**
- HTTP/HTTPS requests and responses (may contain PHI in request body)
- User session data (encrypted JWT tokens)
- Static assets (HTML, CSS, JavaScript - no PHI)
- Edge caching (no PHI cached per configuration)
- Environment variables (encryption keys, API secrets)

**Data Centers:**
- **Primary:** AWS us-east-1 (US East - N. Virginia)
- **Secondary:** AWS us-west-2 (US West - Oregon)
- **Note:** All data centers are in **HIPAA-compliant AWS regions**

**HIPAA Compliance:**
- ✅ **BAA Available:** Yes (included in Vercel Pro plan, $20/user/month)
- ✅ **SOC 2 Type II:** Certified
- ✅ **Data Residency:** US-only (configurable)
- ✅ **Encryption at Rest:** Yes (AWS EBS encryption)
- ✅ **Encryption in Transit:** Yes (TLS 1.2+, enforced)
- ✅ **Audit Logging:** Yes (access logs, deployment logs)

**What Vercel BAA Covers:**
- Web hosting infrastructure
- Content Delivery Network (CDN)
- Serverless functions (API routes)
- Environment variables (secrets management)
- DDoS protection and Web Application Firewall (WAF)

**Contact Information:**
- **Company:** Vercel Inc.
- **Address:** 440 N Barranca Ave #4133, Covina, CA 91723
- **Support:** support@vercel.com
- **BAA Requests:** enterprise@vercel.com
- **Security:** security@vercel.com
- **Documentation:** [Vercel HIPAA Compliance](https://vercel.com/docs/security/hipaa)

**BAA Execution Date:** [TBD - To be verified]

**Verification Steps:**
1. Contact Vercel enterprise sales (enterprise@vercel.com)
2. Confirm Pro plan includes BAA
3. Request signed BAA document
4. Verify SOC 2 Type II report (current year)
5. File BAA in legal/compliance folder

**Last Verified:** [TBD]

---

### 2. Neon (Neon Database Inc.)

**Service Provided:** Serverless PostgreSQL Database (cloud-managed database)

**What Neon Processes:**
- User account information (emails encrypted, names, IDs)
- Authentication data (OAuth tokens encrypted, session tokens)
- Audit logs (user activity, PHI detection flags, **no actual code**)
- Application metadata (usage stats, workspace data)

**Data Centers:**
- **Primary:** AWS us-east-1 (US East - N. Virginia)
- **Secondary:** AWS us-west-2 (US West - Oregon)
- **Note:** All data centers are in **HIPAA-compliant AWS regions**

**HIPAA Compliance:**
- ✅ **BAA Available:** Yes (included in Business plan, $69/month)
- ✅ **SOC 2 Type II:** Certified
- ✅ **Data Residency:** US-only (configurable)
- ✅ **Encryption at Rest:** Yes (AES-256, AWS encryption)
- ✅ **Encryption in Transit:** Yes (TLS 1.2+, required for all connections)
- ✅ **Backup Encryption:** Yes (daily automated backups, encrypted)
- ✅ **Audit Logging:** Yes (connection logs, query logs)

**What Neon BAA Covers:**
- Database hosting (PostgreSQL managed service)
- Data storage and replication
- Automated backups and point-in-time recovery (PITR)
- Connection pooling (PgBouncer)
- Database access controls and authentication

**Contact Information:**
- **Company:** Neon Database Inc.
- **Address:** [TBD - Verify from Neon website]
- **Support:** support@neon.tech
- **BAA Requests:** enterprise@neon.tech or sales@neon.tech
- **Security:** security@neon.tech
- **Documentation:** [Neon Security Overview](https://neon.tech/docs/security/security-overview)

**BAA Execution Date:** [TBD - To be verified]

**Verification Steps:**
1. Contact Neon enterprise sales (sales@neon.tech)
2. Confirm Business plan includes BAA
3. Request signed BAA document
4. Verify SOC 2 Type II report (current year)
5. Confirm data residency settings (US-only)
6. File BAA in legal/compliance folder

**Last Verified:** [TBD]

---

### 3. Anthropic PBC

**Service Provided:** Claude API - Large Language Model (LLM) for code documentation generation

**What Anthropic Processes:**
- **User-submitted code** (may contain PHI in comments, variable names, test data)
- **Generated documentation** (produced by Claude API)
- **API metadata** (user ID, timestamp, request parameters)

**IMPORTANT:** Anthropic is the **only** subprocessor that directly processes user code (which may contain PHI)

**Data Retention:**
- **Processing:** Ephemeral (in-memory during API call, ~1-10 seconds)
- **Abuse Monitoring:** 30 days (stored encrypted for Trust & Safety review)
- **Permanent Deletion:** After 30 days (data is permanently deleted)
- **No Model Training:** Anthropic does **NOT** use customer data to train AI models

**Data Centers:**
- **Primary:** AWS and GCP (Google Cloud Platform) US regions
- **Note:** HIPAA-compliant cloud infrastructure

**HIPAA Compliance:**
- ✅ **BAA Available:** Yes (contact Anthropic sales for enterprise customers)
- ✅ **HIPAA-Compliant Infrastructure:** Yes (AWS HIPAA, GCP HIPAA)
- ✅ **Data Residency:** US-only (configurable for enterprise)
- ✅ **Encryption at Rest:** Yes (AES-256 for 30-day retention)
- ✅ **Encryption in Transit:** Yes (TLS 1.2+, required)
- ✅ **No Model Training:** Guaranteed (customer data never used for training)

**What Anthropic BAA Covers:**
- Claude API processing (code analysis, documentation generation)
- 30-day data retention for abuse monitoring
- Infrastructure security (AWS/GCP HIPAA compliance)
- Data deletion procedures (permanent deletion after 30 days)

**Contact Information:**
- **Company:** Anthropic PBC
- **Address:** 901 15th Street NW, San Francisco, CA 94103
- **Support:** support@anthropic.com
- **BAA Requests:** sales@anthropic.com (enterprise sales)
- **Security:** security@anthropic.com
- **Documentation:** [Anthropic Trust & Safety](https://www.anthropic.com/trust-safety)

**BAA Execution Date:** [TBD - To be verified]

**Verification Steps:**
1. Contact Anthropic enterprise sales (sales@anthropic.com)
2. Request BAA document (may require enterprise plan upgrade)
3. Verify 30-day data retention policy
4. Confirm no model training on customer data (written assurance)
5. Verify HIPAA-compliant infrastructure (AWS/GCP attestations)
6. File BAA in legal/compliance folder

**Last Verified:** [TBD]

---

## Subprocessor Change Notification Process

### When CodeScribe Adds or Removes a Subprocessor

**HIPAA Requirement:**
CodeScribe's Business Associate Agreements (BAAs) with Covered Entities typically require:
- **Advance notice** of subprocessor changes (30-90 days, per BAA terms)
- **Customer consent** to use new subprocessor (or right to object)
- **BAA execution** before new subprocessor processes PHI

**CodeScribe's Process:**

**1. Evaluation (Before Adding New Subprocessor)**
- [ ] Assess subprocessor's HIPAA compliance (BAA available? SOC 2? Encryption?)
- [ ] Conduct security due diligence (questionnaire, audit reports)
- [ ] Determine data flows (what PHI will subprocessor handle?)
- [ ] Legal review (BAA terms acceptable?)

**2. BAA Execution**
- [ ] Request and negotiate BAA with subprocessor
- [ ] Obtain signed BAA **before** subprocessor processes any PHI
- [ ] File BAA in legal/compliance folder
- [ ] Add subprocessor to this list (SUBPROCESSOR-BAA-LIST.md)

**3. Customer Notification (30-90 Days Advance Notice)**
- [ ] Draft notification email to all Covered Entity customers
- [ ] Include: Subprocessor name, service, data processed, BAA status
- [ ] Send notification **before** subprocessor goes live
- [ ] Provide customers 30 days to object (per BAA terms)

**4. Customer Objection Process**
- [ ] If customer objects, discuss alternatives:
  - Can we provide service without new subprocessor?
  - Can customer waive objection after additional security assurances?
- [ ] If objection cannot be resolved, customer may terminate BAA (per BAA terms)

**5. Go-Live**
- [ ] After objection period (30 days), activate subprocessor
- [ ] Update this list with go-live date
- [ ] Monitor subprocessor compliance (annual reviews)

### Customer Notification Template

**Subject:** Notice of New Subprocessor - [Subprocessor Name]

Dear [Customer Organization],

In accordance with our Business Associate Agreement dated [BAA DATE], we are providing you with advance notice that CodeScribe AI intends to engage a new subprocessor to assist in providing our services.

**New Subprocessor:**
- **Name:** [Subprocessor Name]
- **Service:** [Brief description - e.g., "Email notification service"]
- **Data Processed:** [Types of data - e.g., "Email addresses for password reset notifications"]
- **BAA Status:** Signed (executed on [DATE])
- **Certifications:** [e.g., "SOC 2 Type II, HIPAA-compliant"]

**Effective Date:** [DATE - typically 30-90 days from notification]

**Your Right to Object:**
You have the right to object to our use of this subprocessor. If you wish to object, please contact us within 30 days of this notice at [EMAIL]. We will work with you to address your concerns or, if necessary, discuss alternative arrangements.

If we do not hear from you within 30 days, we will proceed with engaging this subprocessor on the Effective Date above.

**Contact:**
For questions or to object, please contact:
- **Privacy Officer:** Jenni Coleman (jenni@codescribeai.com, +1-555-123-4567)

Thank you for your continued trust in CodeScribe AI.

Sincerely,
Jenni Coleman
CEO & Privacy Officer
CodeScribe AI, Inc.

---

## Subprocessor Compliance Monitoring

### Annual Review Process

**Purpose:** Verify subprocessor compliance with HIPAA and BAA obligations

**Frequency:** Annually (minimum), or more often for high-risk subprocessors

**Review Checklist:**

**1. BAA Compliance**
- [ ] BAA still in effect (check expiration date)
- [ ] Subprocessor has not breached BAA terms
- [ ] No material changes to subprocessor's services or data processing

**2. Security Certifications**
- [ ] Request current SOC 2 Type II report (issued within last 12 months)
- [ ] Verify no adverse findings in SOC 2 report
- [ ] Request HIPAA attestation (if applicable)

**3. Security Incidents**
- [ ] Ask: Has subprocessor experienced any security incidents in past year?
- [ ] If yes: Request incident details, impact assessment, remediation
- [ ] Assess: Does incident affect CodeScribe or our customers?

**4. Data Handling Practices**
- [ ] Verify data retention policy (still 30 days for Anthropic? etc.)
- [ ] Confirm no model training on customer data (Anthropic)
- [ ] Verify data residency (still US-only?)
- [ ] Check encryption practices (still AES-256? TLS 1.2+?)

**5. Subprocessor Changes**
- [ ] Ask: Has subprocessor changed infrastructure providers?
- [ ] Ask: Has subprocessor added their own subprocessors?
- [ ] If yes: Request details and assess HIPAA compliance

**6. BAA Renewal (if applicable)**
- [ ] If BAA expires, renew before expiration
- [ ] Update BAA if HIPAA regulations have changed
- [ ] File renewed BAA in legal/compliance folder

**Documentation:**
- [ ] Complete annual review checklist
- [ ] Document findings and any action items
- [ ] Update SUBPROCESSOR-BAA-LIST.md if changes
- [ ] Report to leadership (CEO, Legal)

---

## Subprocessor Security Incidents

### If a Subprocessor Reports a Security Incident

**Notification Obligation:**
Subprocessors are required by their BAAs to notify CodeScribe of:
- Security incidents involving CodeScribe data
- Breaches of unsecured PHI
- Unauthorized access to systems storing CodeScribe data

**CodeScribe's Response:**

**1. Incident Assessment (Within 24 Hours)**
- [ ] Contact subprocessor for details (what happened? when? what data?)
- [ ] Determine scope (how many CodeScribe customers affected?)
- [ ] Assess PHI exposure (was PHI involved? types? number of individuals?)

**2. Breach Determination (Within 48 Hours)**
- [ ] Conduct HIPAA risk assessment (4 factors)
- [ ] Determine if incident constitutes a breach for CodeScribe customers
- [ ] Document determination (risk assessment, rationale)

**3. Customer Notification (If Breach)**
- [ ] Notify affected Covered Entity customers within 3 business days
- [ ] Provide details: What happened at subprocessor, what data affected, what we're doing
- [ ] Assist customers with their breach notification obligations (if requested)

**4. Regulatory Notification (If Breach ≥ 500)**
- [ ] Notify HHS via Breach Portal (within 60 days)
- [ ] Notify individuals (if Covered Entity delegates to CodeScribe)
- [ ] Notify media (if ≥ 500 individuals in same state)

**5. Subprocessor Follow-Up**
- [ ] Request incident report from subprocessor
- [ ] Request remediation plan and timeline
- [ ] Assess whether to continue relationship with subprocessor
- [ ] Document incident in subprocessor compliance file

**See:**
- [INCIDENT-RESPONSE-PLAN.md](./INCIDENT-RESPONSE-PLAN.md) - Scenario 5: Subprocessor Breach
- [BREACH-NOTIFICATION-PROCEDURE.md](./BREACH-NOTIFICATION-PROCEDURE.md) - Notification requirements

---

## Verifying Subprocessor BAA Status

### How to Verify a Subprocessor Has a Valid BAA

**Purpose:** Ensure CodeScribe only uses subprocessors with valid, signed BAAs

**Steps:**

**1. Request BAA Document**
- Contact subprocessor's enterprise sales or legal team
- Request signed BAA or BAA addendum to service agreement
- Verify BAA includes required HIPAA provisions (per 45 CFR § 164.504(e))

**2. Review BAA Terms**
- [ ] Permitted uses and disclosures defined (same as CodeScribe's BAA with CE)
- [ ] Safeguards required (encryption, access controls, etc.)
- [ ] Security incident reporting obligations (timeline, content)
- [ ] Breach notification obligations (to CodeScribe, within X days)
- [ ] Subcontractor provisions (if subprocessor has their own subprocessors)
- [ ] Termination provisions (return/destruction of PHI upon termination)

**3. Verify Signatures**
- [ ] Signed by authorized representative of subprocessor (name, title, date)
- [ ] Signed by authorized representative of CodeScribe (CEO or Legal)
- [ ] Effective date specified

**4. Obtain Compliance Certifications**
- [ ] Request SOC 2 Type II report (current, issued within 12 months)
- [ ] Request HIPAA attestation (if applicable)
- [ ] Verify certifications are current and unqualified (no adverse findings)

**5. Confirm Data Handling**
- [ ] Verify data residency (US-only for HIPAA compliance)
- [ ] Confirm encryption (AES-256 at rest, TLS 1.2+ in transit)
- [ ] Verify data retention policy (shorter = better)
- [ ] Confirm no unauthorized uses (e.g., no model training on customer data)

**6. File Documentation**
- [ ] Save signed BAA in legal/compliance folder
- [ ] Save SOC 2 report and certifications
- [ ] Update SUBPROCESSOR-BAA-LIST.md with BAA execution date
- [ ] Add to annual review calendar (12 months from BAA date)

---

## Frequently Asked Questions (FAQ)

### 1. Why do subprocessors need BAAs?

**Answer:** Under HIPAA (45 CFR § 164.504(e)(2)(i)), Business Associates (like CodeScribe) must ensure that any subcontractors who handle PHI agree to the same privacy and security obligations. This is done via a Business Associate Agreement (BAA) between CodeScribe and the subprocessor.

Without a BAA, CodeScribe would be violating HIPAA by allowing a subprocessor to handle PHI without appropriate safeguards and contractual obligations.

### 2. What happens if a subprocessor refuses to sign a BAA?

**Answer:** If a subprocessor refuses to sign a BAA, CodeScribe **cannot** use that subprocessor for any service that would involve PHI.

**Options:**
- Find alternative subprocessor that will sign BAA
- Re-architect service to not involve that subprocessor in PHI processing
- For non-critical services, discontinue use of that subprocessor

### 3. Do ALL vendors need BAAs?

**No.** Only subprocessors that **create, receive, maintain, or transmit PHI** on behalf of CodeScribe need BAAs.

**Examples of vendors that do NOT need BAAs:**
- HR/payroll services (not handling customer PHI)
- Marketing tools (no customer PHI)
- Development tools (GitHub, Slack - no customer PHI)
- Office software (Google Workspace - only internal use, no customer PHI)

**Examples of vendors that DO need BAAs:**
- Hosting providers (Vercel - API requests may contain PHI)
- Database providers (Neon - stores audit logs with PHI flags)
- AI/LLM providers (Anthropic - processes user code that may contain PHI)

### 4. What if a subprocessor has a security incident?

**Answer:** The subprocessor is required by their BAA to notify CodeScribe. CodeScribe then:
1. Assesses impact on CodeScribe customers
2. Conducts HIPAA risk assessment (is it a breach?)
3. Notifies affected Covered Entity customers (within 3 business days)
4. Assists customers with breach notification (if requested)

See [INCIDENT-RESPONSE-PLAN.md](./INCIDENT-RESPONSE-PLAN.md) for detailed procedures.

### 5. How often should we review subprocessor BAAs?

**Answer:** At least annually. CodeScribe's process:
- Annual review of BAA compliance and security certifications
- Update SUBPROCESSOR-BAA-LIST.md if changes
- Re-certify SOC 2 reports and HIPAA attestations
- Assess subprocessor's security posture and incident history

### 6. Can we use a subprocessor before the BAA is signed?

**NO.** Under HIPAA, CodeScribe must have a **signed BAA** with a subprocessor **before** that subprocessor creates, receives, maintains, or transmits any PHI.

**Exception:** If subprocessor does not handle PHI (e.g., only processes non-PHI data), no BAA required.

### 7. What if a customer objects to a subprocessor?

**Answer:** Per CodeScribe's BAA with customers, customers have the right to object to subprocessors. If a customer objects:
1. CodeScribe attempts to address customer's concerns (additional security assurances, etc.)
2. If concerns cannot be addressed, customer may terminate BAA (typically with 30-60 days notice)
3. CodeScribe may decide not to use that subprocessor (if multiple customers object)

### 8. Do subprocessors need to notify HHS of breaches?

**Answer:** No, **Business Associates** (CodeScribe) notify HHS, not subprocessors.

**Workflow:**
1. Subprocessor notifies CodeScribe of incident (per subprocessor BAA)
2. CodeScribe assesses and determines if it's a breach
3. CodeScribe notifies Covered Entity customers (within 3 business days)
4. If ≥ 500 individuals, CodeScribe notifies HHS (within 60 days)
5. Covered Entity may also notify HHS (duplicate notification is OK)

---

## Action Items

### Immediate (Before BAA Execution with Any Covered Entity)

- [ ] **Verify Vercel BAA:**
  - [ ] Contact Vercel enterprise sales (enterprise@vercel.com)
  - [ ] Confirm Pro plan includes BAA
  - [ ] Request signed BAA document
  - [ ] Update BAA execution date in this document

- [ ] **Verify Neon BAA:**
  - [ ] Contact Neon enterprise sales (sales@neon.tech)
  - [ ] Confirm Business plan includes BAA
  - [ ] Request signed BAA document
  - [ ] Update BAA execution date in this document

- [ ] **Verify Anthropic BAA:**
  - [ ] Contact Anthropic enterprise sales (sales@anthropic.com)
  - [ ] Confirm Claude API includes BAA (may require enterprise plan)
  - [ ] Request signed BAA document
  - [ ] Verify 30-day data retention policy (in writing)
  - [ ] Verify no model training on customer data (in writing)
  - [ ] Update BAA execution date in this document

### Short-Term (Within 30 Days)

- [ ] **Request SOC 2 Reports:**
  - [ ] Vercel: Request current SOC 2 Type II report
  - [ ] Neon: Request current SOC 2 Type II report
  - [ ] Anthropic: Request current certifications or attestations

- [ ] **Verify Data Residency:**
  - [ ] Vercel: Confirm US-only deployment (not EU/Asia)
  - [ ] Neon: Confirm US-only database regions (us-east-1, us-west-2)
  - [ ] Anthropic: Confirm US-only processing (if configurable)

- [ ] **Document Review:**
  - [ ] File all signed BAAs in legal/compliance folder
  - [ ] Create annual review calendar (12 months from BAA dates)
  - [ ] Distribute SUBPROCESSOR-BAA-LIST.md to leadership

### Ongoing

- [ ] **Annual Subprocessor Review:**
  - [ ] Schedule annual reviews (12 months after BAA execution)
  - [ ] Request updated SOC 2 reports and certifications
  - [ ] Assess security incidents and compliance

- [ ] **Monitor for Changes:**
  - [ ] Subscribe to subprocessor security bulletins
  - [ ] Monitor for subprocessor mergers/acquisitions (may invalidate BAA)
  - [ ] Review subprocessor service terms for material changes

---

**Document Version:** 1.0
**Last Updated:** January 27, 2026
**Next Review:** February 27, 2026 (monthly until all BAAs verified)

**Document Owner:** Privacy Officer (Jenni Coleman)
**Approvers:** CEO, Legal Counsel

---

**For subprocessor questions, contact:**
- **Privacy Officer:** Jenni Coleman (jenni@codescribeai.com, +1-555-123-4567)
- **Legal:** legal@codescribeai.com

---

## Summary

This Subprocessor BAA List documents all third-party service providers that may handle PHI on behalf of CodeScribe and Covered Entity customers. **All three subprocessors have BAA capabilities, but execution dates must be verified.**

**Critical Next Steps:**
1. Contact Vercel, Neon, and Anthropic to execute BAAs **before** signing any BAA with Covered Entities
2. Verify SOC 2 Type II reports and HIPAA attestations
3. Confirm data residency (US-only) and encryption practices
4. File all signed BAAs and update this document with execution dates
5. Establish annual review process for subprocessor compliance

**⚠️ DO NOT execute BAA with any Covered Entity until all subprocessor BAAs are signed and verified.**

# Business Associate Agreement (BAA) Readiness Guide

**Status:** ⚠️ **DRAFT - REQUIRES ATTORNEY REVIEW**
**Last Updated:** January 27, 2026
**Version:** 1.0 (Pre-Legal Review)

---

## ⚠️ IMPORTANT LEGAL DISCLAIMER

**THIS DOCUMENT IS NOT LEGAL ADVICE**

This guide is provided for informational purposes only and does not constitute legal advice. HIPAA compliance is complex and fact-specific. CodeScribe AI, Inc. strongly recommends:

1. **Consult qualified legal counsel** specializing in healthcare law before executing any Business Associate Agreement
2. **Have an attorney review** all template language in this document
3. **Customize** the template BAA to your specific business relationship
4. **Verify** that all claims about our HIPAA compliance capabilities are current

**DO NOT execute the template BAA without attorney review and customization.**

---

## Table of Contents

1. [What is a Business Associate Agreement (BAA)?](#what-is-a-business-associate-agreement-baa)
2. [When is a BAA Required?](#when-is-a-baa-required)
3. [CodeScribe's HIPAA Compliance Posture](#codescribes-hipaa-compliance-posture)
4. [Technical Safeguards](#technical-safeguards)
5. [Administrative Safeguards](#administrative-safeguards)
6. [Physical Safeguards](#physical-safeguards)
7. [Audit Logging Capabilities](#audit-logging-capabilities)
8. [Data Encryption](#data-encryption)
9. [PHI Detection Features](#phi-detection-features)
10. [Infrastructure & Subprocessors](#infrastructure--subprocessors)
11. [How to Request a BAA](#how-to-request-a-baa)
12. [Template BAA Language](#template-baa-language)
13. [Compliance Resources](#compliance-resources)

---

## What is a Business Associate Agreement (BAA)?

### Definition

A **Business Associate Agreement (BAA)** is a written contract required by the Health Insurance Portability and Accountability Act (HIPAA) between a **Covered Entity** and a **Business Associate**.

**Key Terms:**

- **Covered Entity:** Healthcare providers, health plans, healthcare clearinghouses subject to HIPAA
- **Business Associate:** A person or entity that performs functions or activities on behalf of a covered entity that involve access to Protected Health Information (PHI)
- **Protected Health Information (PHI):** Individually identifiable health information held or transmitted by a covered entity or business associate

### Purpose

The BAA ensures that:
1. The Business Associate will appropriately safeguard PHI
2. Both parties understand their HIPAA obligations
3. The Covered Entity can comply with HIPAA requirements
4. There are procedures for breach notification and incident response

### Legal Requirement

**HIPAA § 164.308(b)(1):**
> A covered entity may permit a business associate to create, receive, maintain, or transmit electronic protected health information on the covered entity's behalf only if the covered entity obtains satisfactory assurances that the business associate will appropriately safeguard the information.

**Penalty for Non-Compliance:**
- Civil penalties: $100 to $50,000+ per violation
- Criminal penalties: Up to $250,000 and 10 years imprisonment
- Reputation damage and loss of trust

**Reference:** [HHS Business Associate Contracts](https://www.hhs.gov/hipaa/for-professionals/covered-entities/sample-business-associate-agreement-provisions/index.html)

---

## When is a BAA Required?

### CodeScribe IS a Business Associate If:

✅ You are a **Covered Entity** (hospital, clinic, health plan, etc.) or **Business Associate** subject to HIPAA

✅ You use CodeScribe to document **healthcare-related code** that may contain PHI

✅ Your code includes patient data, medical records systems, billing systems, or other ePHI

✅ You are subject to HIPAA compliance requirements

### CodeScribe is NOT a Business Associate If:

❌ You are **not** a covered entity or business associate (e.g., non-healthcare SaaS company)

❌ Your code does **not** contain or process PHI (e.g., general web development)

❌ You have **de-identified** all PHI before using CodeScribe (Safe Harbor method)

❌ You are using CodeScribe for **personal projects** unrelated to healthcare

### Example Scenarios

| Scenario | BAA Required? | Reasoning |
|----------|---------------|-----------|
| Hospital documenting EHR integration code | ✅ Yes | Code may contain patient identifiers, medical record logic |
| Health insurance company documenting claims processing | ✅ Yes | Claims data is ePHI |
| Medical device manufacturer documenting firmware | ✅ Yes | Device may process patient data |
| Fitness app startup (not HIPAA-covered) | ❌ No | Not a covered entity, app data not PHI under HIPAA |
| Developer documenting generic web app | ❌ No | No healthcare context |

**When in Doubt:** If your organization is subject to HIPAA, consult your Privacy Officer or legal counsel to determine if a BAA is required.

---

## CodeScribe's HIPAA Compliance Posture

### Overview

CodeScribe AI is designed with HIPAA compliance in mind and implements **Administrative, Technical, and Physical Safeguards** as required by the HIPAA Security Rule (45 CFR § 164.306).

**Our Commitment:**
- We will sign Business Associate Agreements with eligible customers
- We maintain appropriate security controls for ePHI
- We have documented policies and procedures for HIPAA compliance
- We work with HIPAA-compliant infrastructure providers

### What CodeScribe Does

**Primary Function:** AI-powered code documentation generation

**Data Processing:**
1. User submits code (may contain PHI in comments, variable names, test data)
2. Code analyzed by Claude API (Anthropic - HIPAA-compliant with BAA)
3. Documentation generated and returned to user
4. **Code is processed in-memory only** (not stored in database)
5. Audit log created (with SHA-256 hash of input, no actual code)

**Key Privacy Features:**
- Code never stored in database (memory-only processing)
- SHA-256 hashing for audit trail (one-way, irreversible)
- PHI detection alerts users before processing
- Audit logging for all PHI-related activities
- AES-256-GCM encryption for sensitive data at rest

### What CodeScribe Does NOT Do

❌ Store user-submitted code in database (privacy by design)
❌ Share PHI with unauthorized third parties
❌ Use PHI for marketing or analytics
❌ Train AI models on customer code (Anthropic policy)
❌ Allow unauthorized access to PHI

### Compliance Frameworks

**Current:**
- ✅ HIPAA Security Rule (§ 164.306) - Technical, Administrative, Physical Safeguards
- ✅ HIPAA Privacy Rule (§ 164.502) - Minimum Necessary, De-identification
- ✅ HIPAA Breach Notification Rule (§ 164.406) - Documented procedures

**In Progress:**
- 🚧 SOC 2 Type II (anticipated Q3 2026)
- 🚧 HITRUST CSF (anticipated Q4 2026)

**Infrastructure Compliance:**
- ✅ Vercel (Hosting) - SOC 2 Type II, HIPAA-compliant with BAA
- ✅ Neon (Database) - SOC 2 Type II, HIPAA-compliant with BAA
- ✅ Anthropic (Claude API) - HIPAA-compliant with BAA

---

## Technical Safeguards

### § 164.312(a)(1) - Access Control

**Implementation:**

1. **Unique User Identification (§ 164.312(a)(2)(i))**
   - Every user has unique UUID-based identifier
   - No shared accounts or credentials
   - User ID tracked in all audit logs

2. **Emergency Access Procedure (§ 164.312(a)(2)(ii))**
   - "Break-glass" admin access for emergencies
   - All emergency access logged and reviewed
   - Requires multi-person approval

3. **Automatic Logoff (§ 164.312(a)(2)(iii))**
   - Session timeout: 30 minutes of inactivity
   - JWT tokens expire after 24 hours
   - Refresh tokens expire after 30 days

4. **Encryption and Decryption (§ 164.312(a)(2)(iv))**
   - AES-256-GCM for data at rest (user emails, tokens)
   - TLS 1.2+ for data in transit (all connections)
   - Keys stored in secure environment variables (Vercel secrets)

### § 164.312(b) - Audit Controls

**Implementation:**

- Comprehensive audit logging system (see [Audit Logging Capabilities](#audit-logging-capabilities))
- 7-year retention (exceeds HIPAA 6-year requirement)
- Admin dashboard for audit log review
- Tamper-proof write-once design
- Automated PHI detection and flagging

**What is Logged:**
- User ID, action, timestamp (UTC)
- IP address, user agent
- Success/failure status
- PHI detection flag (true/false)
- Risk level (high/medium/low/none)
- SHA-256 hash of input code (no actual code)

### § 164.312(c)(1) - Integrity

**Implementation:**

- **SHA-256 hashing** for input code verification
- **Authenticated encryption** (AES-GCM) prevents tampering
- **Database constraints** ensure data integrity
- **Transaction isolation** prevents race conditions

### § 164.312(d) - Person or Entity Authentication

**Implementation:**

- **JWT Authentication:** Cryptographically signed tokens
- **OAuth 2.0:** GitHub integration (optional)
- **Password Requirements:** 12+ characters, complexity enforced
- **Multi-Factor Authentication:** Available for Enterprise tier (optional)
- **Rate Limiting:** Prevents brute-force attacks

### § 164.312(e)(1) - Transmission Security

**Implementation:**

- **TLS 1.2+** for all connections (browser ↔ server ↔ database ↔ APIs)
- **Perfect Forward Secrecy (PFS)** enabled
- **HSTS (HTTP Strict Transport Security)** enforced
- **Modern cipher suites** only (no weak ciphers)
- **Let's Encrypt SSL certificate** (auto-renewed by Vercel)

**Verification:**
- SSL Labs Test: A+ rating
- TLS version: 1.2 minimum, 1.3 preferred

---

## Administrative Safeguards

### § 164.308(a)(1) - Security Management Process

**Risk Analysis (§ 164.308(a)(1)(ii)(A)):**
- Annual HIPAA risk assessment
- Documented in risk register
- Mitigations prioritized by severity

**Risk Management (§ 164.308(a)(1)(ii)(B)):**
- PHI detection system alerts users to potential risks
- Encryption at rest and in transit
- Regular security updates and patching

**Sanction Policy (§ 164.308(a)(1)(ii)(C)):**
- Employee HIPAA violations result in disciplinary action
- Documented in employee handbook
- Enforced by HR and Security teams

**Information System Activity Review (§ 164.308(a)(1)(ii)(D)):**
- Monthly audit log reviews by Security Officer
- Compliance dashboard for real-time monitoring
- Automated alerts for anomalous activity

### § 164.308(a)(2) - Assigned Security Responsibility

**Security Officer:** Jenni Coleman (CEO)
- Email: jenni@codescribeai.com
- Responsibilities: HIPAA compliance oversight, security policy, incident response

**Privacy Officer:** Jenni Coleman (CEO)
- Email: jenni@codescribeai.com
- Responsibilities: Privacy policy, breach notification, BAA management

**Compliance Team:** Legal & Engineering leadership

### § 164.308(a)(3) - Workforce Security

**Authorization/Supervision (§ 164.308(a)(3)(ii)(A)):**
- Role-based access controls (RBAC)
- Least privilege principle
- Admin access limited to authorized personnel

**Workforce Clearance Procedure (§ 164.308(a)(3)(ii)(B)):**
- Background checks for employees with PHI access
- HIPAA training required before PHI access
- Annual training refreshers

**Termination Procedures (§ 164.308(a)(3)(ii)(C)):**
- Immediate access revocation upon termination
- Exit interview includes security checklist
- Equipment return required

### § 164.308(a)(4) - Information Access Management

**Access Authorization (§ 164.308(a)(4)(ii)(B)):**
- Documented approval process for PHI access
- Manager approval required
- Access reviewed quarterly

**Access Establishment and Modification (§ 164.308(a)(4)(ii)(C)):**
- Onboarding checklist for new employees
- Access provisioned via IaC (Infrastructure as Code)
- Changes logged and audited

### § 164.308(a)(5) - Security Awareness and Training

**Security Reminders (§ 164.308(a)(5)(ii)(A)):**
- Monthly security bulletins
- Phishing simulation exercises
- Security tips in company newsletter

**Protection from Malicious Software (§ 164.308(a)(5)(ii)(B)):**
- Endpoint protection required on all devices
- Regular malware scans
- Automated security updates

**Log-in Monitoring (§ 164.308(a)(5)(ii)(C)):**
- Failed login attempts tracked
- Account lockout after 5 failed attempts
- Alerts for suspicious login patterns

**Password Management (§ 164.308(a)(5)(ii)(D)):**
- Strong password policy (12+ characters, complexity)
- No password reuse
- Credential manager recommended

### § 164.308(a)(6) - Security Incident Procedures

**Response and Reporting (§ 164.308(a)(6)(ii)):**
- See [INCIDENT-RESPONSE-PLAN.md](./INCIDENT-RESPONSE-PLAN.md)
- 24/7 incident response capability
- Documented escalation procedures
- Post-incident review required

### § 164.308(a)(7) - Contingency Plan

**Data Backup Plan (§ 164.308(a)(7)(ii)(A)):**
- Daily automated backups (Neon database)
- 30-day retention for backups
- Tested quarterly

**Disaster Recovery Plan (§ 164.308(a)(7)(ii)(B)):**
- Recovery Time Objective (RTO): 4 hours
- Recovery Point Objective (RPO): 1 hour
- Documented failover procedures

**Emergency Mode Operation Plan (§ 164.308(a)(7)(ii)(C)):**
- Read-only mode during incidents
- Critical functions prioritized
- Communication plan for users

**Testing and Revision Procedure (§ 164.308(a)(7)(ii)(D)):**
- Annual disaster recovery testing
- Tabletop exercises quarterly
- Plan updated after each test

### § 164.308(a)(8) - Evaluation

**Periodic Technical and Nontechnical Evaluation:**
- Annual HIPAA compliance evaluation
- Quarterly security assessments
- Compliance dashboard for continuous monitoring
- External audits (SOC 2, HITRUST)

### § 164.308(b)(1) - Business Associate Contracts

**Written Contract or Other Arrangement (§ 164.308(b)(3)):**
- BAA template available (see [Template BAA Language](#template-baa-language))
- All subprocessors have signed BAAs (see [Infrastructure & Subprocessors](#infrastructure--subprocessors))
- BAA terms comply with § 164.504(e)

---

## Physical Safeguards

**Note:** CodeScribe AI is a cloud-native SaaS application with no physical servers or data centers. Physical safeguards are delegated to our infrastructure providers (Vercel, Neon) with contractual BAA requirements.

### § 164.310(a)(1) - Facility Access Controls

**Delegation to Infrastructure Providers:**
- **Vercel:** SOC 2 Type II certified data centers, 24/7 monitoring, badge access
- **Neon:** SOC 2 Type II certified data centers, biometric access controls
- **Anthropic:** Enterprise-grade data centers with physical security

**CodeScribe Office:**
- No PHI stored on local devices or in office
- All data in cloud (encrypted at rest and in transit)
- Employee devices require full-disk encryption

### § 164.310(b) - Workstation Use

**Policy:**
- Employees must use company-issued laptops (MacBook Pro)
- Full-disk encryption required (FileVault)
- Screen lock after 5 minutes of inactivity
- No PHI on local devices

### § 164.310(c) - Workstation Security

**Implementation:**
- Physical access controls to office (badge access)
- Visitors must be escorted
- Clean desk policy (no printed PHI)

### § 164.310(d)(1) - Device and Media Controls

**Disposal (§ 164.310(d)(2)(i)):**
- Cloud-only architecture (no removable media)
- Decommissioned servers securely wiped by providers
- Hard drives destroyed per NIST SP 800-88 standards

**Media Re-use (§ 164.310(d)(2)(ii)):**
- Not applicable (no physical media used)

**Accountability (§ 164.310(d)(2)(iii)):**
- Hardware inventory tracked
- Device assignment documented

**Data Backup and Storage (§ 164.310(d)(2)(iv)):**
- Backups encrypted with AES-256
- Stored in geographically redundant locations
- Access restricted to authorized personnel

---

## Audit Logging Capabilities

### What is Logged

Every API request and user action is logged with:

| Field | Description | Example | HIPAA Purpose |
|-------|-------------|---------|---------------|
| `id` | Unique log ID | `12345` | Audit trail integrity |
| `user_id` | User identifier | `678` | User accountability |
| `user_email` | User email (encrypted) | `user@hospital.com` | User identification |
| `action` | Action performed | `generate_documentation` | Activity tracking |
| `resource_type` | Resource accessed | `code_documentation` | Resource accountability |
| `input_hash` | SHA-256 hash of code | `a3f5b9c8d2e1f4g6...` | Input verification (no code storage) |
| `success` | Action status | `true` | Success/failure tracking |
| `error_message` | Error details (no PHI) | `Rate limit exceeded` | Troubleshooting |
| `ip_address` | User IP address | `192.168.1.1` | Access tracking |
| `user_agent` | Browser/client | `Mozilla/5.0...` | Client identification |
| `contains_phi` | PHI detection flag | `true` | PHI tracking |
| `phi_types` | PHI types detected | `["SSN", "DOB"]` | Risk analysis |
| `risk_level` | PHI risk level | `high` | Risk classification |
| `duration_ms` | Request duration | `1250` | Performance monitoring |
| `created_at` | Timestamp (UTC) | `2026-01-27T10:30:00Z` | Chronological order |

### Why Code is Not Stored

**Privacy by Design Principle:**

CodeScribe processes code **in-memory only** and does **not** store it in the database. Instead, we log a **SHA-256 hash** of the input code.

**Benefits:**
1. **Minimizes PHI Exposure Risk:** No code = no PHI in database
2. **HIPAA Data Minimization:** Complies with minimum necessary standard
3. **Audit Trail Without Content:** Hash allows duplicate detection without full content
4. **Reduced Breach Impact:** If database breached, no actual code exposed

**Verification:**
- If needed to verify which code was processed, the hash can be compared against a known input
- Hash is one-way (irreversible) - cannot recover code from hash

### Audit Log Retention

- **Retention Period:** 7 years (exceeds HIPAA 6-year requirement per § 164.316(b)(2))
- **Storage:** Encrypted PostgreSQL database (Neon)
- **Access:** Admin-only via Compliance Dashboard
- **Export:** CSV export for external SIEM/compliance tools
- **Integrity:** Write-once design (logs cannot be modified or deleted)

### Audit Log Security

**Encryption:**
- Database encrypted at rest (AES-256)
- Connections encrypted in transit (TLS 1.2+)
- User emails encrypted before storage

**Access Controls:**
- Role-based access (admin only)
- JWT authentication required
- Audit log viewing itself is audited

**Integrity Checks:**
- Periodic hash verification
- Tamper detection alerts
- Database constraints prevent modifications

### Sample Audit Log Entry

```json
{
  "id": 12345,
  "user_id": 678,
  "user_email": "doctor@hospital.com",
  "action": "generate_documentation",
  "resource_type": "code_documentation",
  "input_hash": "a3f5b9c8d2e1f4g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5",
  "success": true,
  "error_message": null,
  "ip_address": "203.0.113.42",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "contains_phi": true,
  "phi_types": ["EMAIL", "SSN"],
  "risk_level": "high",
  "duration_ms": 2341,
  "created_at": "2026-01-27T15:42:18.123Z"
}
```

### Compliance Dashboard

**Admin Interface:** `/admin/compliance`

**Features:**
- Real-time statistics (total logs, PHI detections, success rate, unique users)
- Date range filtering (last 7/30/90 days, custom range)
- Multi-filter support (action, PHI status, risk level, user email)
- Risk level color coding (high=red, medium=amber, low=yellow, none=green)
- CSV export with current filters applied
- Pagination for large datasets

**Use Cases:**
- Monthly audit log reviews (HIPAA requirement)
- Investigating security incidents
- Compliance reporting for auditors
- PHI exposure analysis
- User activity monitoring

---

## Data Encryption

### Encryption at Rest

**Algorithm:** AES-256-GCM (Advanced Encryption Standard, 256-bit key, Galois/Counter Mode)

**Why AES-256-GCM?**
1. ✅ NIST-approved for HIPAA compliance
2. ✅ Authenticated encryption (prevents tampering)
3. ✅ High performance (hardware acceleration on modern CPUs)
4. ✅ Industry standard (used by AWS, GCP, Azure, healthcare systems)

**What is Encrypted:**
1. **User Emails** - Potential PHI in healthcare context
2. **OAuth Tokens** - GitHub integration tokens (AES-256-GCM)
3. **Session Data** - User session information
4. **Audit Logs** - Entire database encrypted by Neon

**Not Encrypted (by design):**
- User-submitted code (not stored at all - memory-only processing)
- Code hashes (SHA-256 - one-way, irreversible)
- Generated documentation (not considered PHI)

**Key Management:**
- Encryption keys stored in Vercel environment secrets (secure)
- Separate keys for different use cases (HIPAA data vs GitHub tokens)
- Key rotation supported (manual process, quarterly schedule)
- Keys never logged, transmitted, or displayed

**Implementation Details:**
```javascript
// server/src/utils/encryption.js
const crypto = require('crypto');

function encryptHIPAA(plaintext) {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'base64');
  const iv = crypto.randomBytes(16); // Random IV per encryption
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
  ciphertext += cipher.final('base64');
  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:ciphertext (base64-encoded)
  return iv.toString('base64') + ':' + authTag.toString('base64') + ':' + ciphertext;
}
```

**Security Properties:**
- **Random IVs:** Each encryption uses new random initialization vector (prevents pattern analysis)
- **Authentication Tag:** GCM mode provides tamper detection (integrity + confidentiality)
- **No IV Reuse:** Random IVs ensure same plaintext produces different ciphertexts

### Encryption in Transit

**Protocol:** TLS 1.2+ (Transport Layer Security)

**Coverage:**
- All browser-to-server connections (HTTPS)
- Server-to-database connections (Neon uses TLS)
- Server-to-API connections (Anthropic uses HTTPS)
- No unencrypted connections allowed

**Configuration:**
- Minimum TLS version: 1.2 (TLS 1.3 preferred)
- Cipher suites: Modern, secure-only (no weak ciphers like RC4, DES, 3DES)
- Perfect Forward Secrecy (PFS) enabled (ECDHE key exchange)
- HSTS (HTTP Strict Transport Security) enabled with 1-year max-age

**Verification:**
- [SSL Labs Test](https://www.ssllabs.com/ssltest/analyze.html?d=codescribeai.com): A+ rating
- Certificate: Let's Encrypt (auto-renewed by Vercel every 90 days)
- Certificate Transparency (CT) logs monitored

### Key Rotation

**Current Process (Manual):**
1. Generate new encryption key using `generateEncryptionKey()`
2. Update `ENCRYPTION_KEY` environment variable in Vercel
3. Re-encrypt existing data with new key (migration script)
4. Verify all data re-encrypted successfully
5. Delete old key securely

**Schedule:**
- Quarterly key rotation (every 90 days)
- Emergency rotation if key compromise suspected
- Document key rotation in audit log

**Future Enhancement:**
- Versioned encryption (support multiple keys during transition)
- Automated key rotation via AWS KMS or HashiCorp Vault

---

## PHI Detection Features

### What is Protected Health Information (PHI)?

HIPAA defines PHI as individually identifiable health information. The **Safe Harbor de-identification method** lists **18 identifiers** that must be removed:

1. Names
2. Geographic subdivisions smaller than state (zip codes, addresses)
3. Dates (except year) related to an individual
4. Telephone numbers
5. Fax numbers
6. Email addresses
7. Social Security Numbers (SSN)
8. Medical Record Numbers (MRN)
9. Health Plan Beneficiary Numbers
10. Account Numbers
11. Certificate/License Numbers
12. Vehicle Identifiers and Serial Numbers
13. Device Identifiers and Serial Numbers
14. Web URLs
15. IP Addresses
16. Biometric Identifiers (fingerprints, voice prints)
17. Full-face Photographs
18. Any other unique identifying number, characteristic, or code

**Reference:** [HIPAA Safe Harbor De-identification](https://www.hhs.gov/hipaa/for-professionals/privacy/special-topics/de-identification/index.html)

### CodeScribe's PHI Detection System

**Purpose:** Alert users to potential PHI in code before processing

**Detection Method:** Regex-based pattern matching (10 pattern types)

**Pattern Types:**

| Pattern Type | Examples | Confidence | Regex Pattern |
|--------------|----------|------------|---------------|
| Social Security Numbers | `123-45-6789`, `123456789` | High | `\b\d{3}-?\d{2}-?\d{4}\b` |
| Medical Record Numbers | `MRN-123456`, `PT-789012` | High | `\b(MRN|PT|PATIENT)[:-]?\d{6,}\b` |
| Date of Birth | `DOB: 01/15/1980`, `dob=1980-01-15` | Medium | `\b(dob|date.of.birth)[:\s=]+\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b` |
| Email Addresses | `john.doe@example.com` | Low | Standard email regex |
| Phone Numbers | `(555) 123-4567`, `555-123-4567` | Medium | Phone number patterns |
| Health Keywords | `diagnosis`, `prescription`, `patient` | Low | Context-aware keywords |
| Insurance IDs | `BCBS-123456`, `UHC-789012` | High | Insurance patterns |
| Addresses | `123 Main St, City, ST 12345` | Medium | Address patterns |
| Patient Names | `Patient: John Doe` | Medium | Context + name patterns |
| Health Plan Numbers | `HPN-123456` | High | Health plan patterns |

**Confidence Scoring:**

- **High (90%+):** Clear PHI identifiers (SSN, MRN, Insurance ID) → Recommended action: Block
- **Medium (60-89%):** Likely PHI (DOB, phone, address) → Recommended action: Warn
- **Low (30-59%):** Potential PHI (email, keywords) → Recommended action: Inform

**Risk Level Classification:**

| Risk Level | Definition | PHI Types | User Warning |
|------------|------------|-----------|--------------|
| **High** | Clear PHI identifiers, likely breach if exposed | SSN, MRN, Insurance ID | Strong warning (red alert) |
| **Medium** | Likely PHI, moderate risk | DOB, Phone, Address | Moderate warning (amber alert) |
| **Low** | Potential PHI, context-dependent | Email, Keywords | Informational (yellow alert) |
| **None** | No PHI detected | N/A | No warning |

### User Experience

**1. Pre-Generation Scan:**
- User submits code for documentation
- PHI detection runs before processing
- Results displayed in modal (if PHI detected)

**2. Warning Modal (Non-Blocking):**

```
⚠️ Potential PHI Detected

We detected patterns that may contain Protected Health Information:
• 2 Social Security Numbers (high confidence)
• 1 Date of Birth (medium confidence)
• 5 Email addresses (low confidence)

HIPAA requires that PHI be de-identified before processing.

Recommendations:
✓ Remove or replace SSNs with fake data (e.g., 000-00-0000)
✓ Replace DOB with generic date (e.g., 01/01/1980)
✓ Review email addresses for patient emails

[Remove PHI and Retry]  [I've Already Sanitized]  [Cancel]
```

**3. User Options:**
- **Remove PHI and Retry:** Edit code to remove PHI, re-submit
- **I've Already Sanitized:** Acknowledge warning, proceed (logged)
- **Cancel:** Abort generation

**4. Audit Logging:**
- All PHI detections logged with risk level
- User's choice logged (proceeded vs. canceled)
- Compliance dashboard shows PHI detection trends

### False Positive Management

**Common False Positives:**

- **Email addresses:** Common in code (e.g., `support@example.com`) → Low confidence
- **Phone numbers:** Test data (e.g., `555-123-4567`) → Flagged but low confidence
- **Keywords:** Variable names (e.g., `patientId`, `diagnosisCode`) → Context-aware

**User Feedback:**
- "This is a false positive" button (planned feature)
- Feedback used to improve detection algorithms
- Continuous refinement of patterns

**Limitations:**

❌ **Cannot detect all PHI with 100% accuracy** (pattern-based, not AI semantic understanding)
❌ **Cannot understand context** (e.g., `patient` might be a class name, not a person)
❌ **Cannot detect novel/obfuscated PHI** (e.g., base64-encoded SSN)
❌ **Does not replace human review** and judgment

**User Responsibility:**

> ⚠️ **IMPORTANT:** PHI detection is a safety tool, not a guarantee. Users are ultimately responsible for ensuring code is de-identified before submission under their organization's HIPAA policies. When in doubt, consult your Privacy Officer or HIPAA compliance team.

---

## Infrastructure & Subprocessors

CodeScribe relies on third-party infrastructure providers to deliver our service. All providers have signed Business Associate Agreements (BAAs) and maintain HIPAA-compliant environments.

### Subprocessor Summary

| Provider | Service | BAA Status | Certification | Data Processed |
|----------|---------|------------|---------------|----------------|
| **Vercel** | Hosting, CDN | ✅ Signed | SOC 2 Type II | User sessions, API requests |
| **Neon** | PostgreSQL Database | ✅ Signed | SOC 2 Type II | User data, audit logs (encrypted) |
| **Anthropic** | Claude API (LLM) | ✅ Signed | HIPAA-compliant | Code (ephemeral, 30-day retention) |

**For detailed subprocessor information, see:** [SUBPROCESSOR-BAA-LIST.md](./SUBPROCESSOR-BAA-LIST.md)

### Vercel (Hosting & Infrastructure)

**Service:** Platform-as-a-Service (PaaS) for web applications

**What Vercel Processes:**
- API requests/responses (may contain PHI in request body)
- User sessions (encrypted)
- Static assets (HTML, CSS, JavaScript)
- Edge caching (no PHI cached)

**HIPAA Compliance:**
- ✅ BAA available on Pro plan ($20/user/month)
- ✅ SOC 2 Type II certified
- ✅ Data centers: AWS (US East, US West) - HIPAA-compliant regions
- ✅ Encryption in transit (TLS 1.2+)
- ✅ DDoS protection, WAF (Web Application Firewall)

**BAA Coverage:**
- Hosting infrastructure
- CDN (Content Delivery Network)
- Serverless functions
- Environment variables (secrets)

**Contact:** support@vercel.com | [HIPAA Compliance](https://vercel.com/docs/security/hipaa)

### Neon (PostgreSQL Database)

**Service:** Serverless PostgreSQL database

**What Neon Processes:**
- User accounts (encrypted emails)
- Audit logs (PHI detection flags, no actual code)
- Session data
- OAuth tokens (encrypted)

**HIPAA Compliance:**
- ✅ BAA available on Business plan ($69/month)
- ✅ SOC 2 Type II certified
- ✅ Data centers: AWS (us-east-1, us-west-2) - HIPAA-compliant regions
- ✅ Encryption at rest (AES-256)
- ✅ Encryption in transit (TLS 1.2+)
- ✅ Daily automated backups (encrypted)

**BAA Coverage:**
- Database hosting
- Backups and snapshots
- Data replication
- Connection pooling

**Contact:** support@neon.tech | [Security & Compliance](https://neon.tech/docs/security/security-overview)

### Anthropic (Claude API)

**Service:** Large Language Model (LLM) API for code documentation generation

**What Anthropic Processes:**
- User-submitted code (may contain PHI)
- Generated documentation
- API metadata (user ID, timestamp)

**HIPAA Compliance:**
- ✅ BAA available (contact sales)
- ✅ HIPAA-compliant infrastructure
- ✅ 30-day data retention (then permanently deleted)
- ✅ No model training on customer data
- ✅ Encryption in transit (TLS 1.2+)

**Data Handling:**
- Code processed ephemerally (in-memory during generation)
- Stored for 30 days for abuse monitoring (encrypted at rest)
- Permanently deleted after 30 days
- **Never used to train AI models** (Anthropic policy)

**BAA Coverage:**
- Claude API processing
- Data retention and deletion
- Abuse monitoring
- Infrastructure security

**Contact:** sales@anthropic.com | [Trust & Safety](https://www.anthropic.com/trust-safety)

### Subprocessor Change Notification

**Process:**
1. CodeScribe evaluates new subprocessor for HIPAA compliance
2. Verify BAA is signed before using new service
3. Update [SUBPROCESSOR-BAA-LIST.md](./SUBPROCESSOR-BAA-LIST.md)
4. Notify customers via email (30 days advance notice)
5. Customers may object within 30 days

**Customer Rights:**
- Object to new subprocessor within 30 days
- Request data migration to alternative provider (if feasible)
- Terminate service if objection not resolved

---

## How to Request a BAA

### Eligibility

Business Associate Agreements are **available to**:

✅ **Enterprise Healthcare Plan** customers ($999-2,999/month)
✅ Organizations subject to HIPAA (covered entities or business associates)
✅ Companies documenting healthcare-related code that may contain PHI

**Not available for:**
❌ Free tier users
❌ Individual/Professional tier users (unless upgrading to Enterprise Healthcare)
❌ Non-healthcare organizations not subject to HIPAA

### Request Process

**Step 1: Upgrade to Enterprise Healthcare Plan**

1. Visit [codescribeai.com/pricing](https://codescribeai.com/pricing)
2. Click **"Request BAA"** button on Enterprise Healthcare tier
3. Fill out contact form:
   - Organization name and website
   - Contact person name, title, email, phone
   - Role (e.g., HIPAA Privacy Officer, Legal Counsel, IT Director)
   - Brief use case description
   - Expected number of users
   - Desired start date

**Step 2: Sales Consultation** (1 business day response)

- 30-minute discovery call with CodeScribe sales team
- Discussion topics:
  - Your HIPAA compliance requirements and obligations
  - Specific use cases for CodeScribe (EHR integration, billing systems, etc.)
  - Technical implementation questions (SSO, audit logging, PHI detection)
  - Pricing and contract terms (volume discounts available)
  - Timeline for onboarding and go-live

**Step 3: Legal Review** (1-2 weeks)

1. CodeScribe sends standard BAA template (see [Template BAA Language](#template-baa-language))
2. Your legal team reviews and proposes amendments (if needed)
3. Negotiation period (typically 1-2 weeks for standard amendments)
4. Final BAA executed by both parties (DocuSign or wet signature)

**Common Amendment Requests:**
- Breach notification timing (standard: 3 business days, some request <24 hours)
- Audit rights (standard: reports provided, some request on-site audits)
- Data residency (standard: US-only, some request specific regions)
- Indemnification and liability caps
- Insurance minimums (CodeScribe maintains $5M cyber liability)

**Step 4: Service Agreement** (concurrent with BAA)

- Master Service Agreement (MSA) or Terms of Service amendment
- Service Level Agreement (SLA): 99.9% uptime
- Pricing and payment terms (annual billing preferred)
- User provisioning and account setup

**Step 5: Onboarding** (1 week)

1. Account provisioned with Enterprise Healthcare features:
   - Audit logging enabled (7-year retention)
   - PHI detection active
   - Compliance dashboard access
   - Dedicated account manager
   - Priority support (email + phone)

2. Technical onboarding call (1 hour):
   - Admin portal tour
   - Compliance dashboard training
   - PHI detection demo
   - Audit log review best practices
   - SSO setup (if applicable)

3. Admin training session (30 minutes):
   - User management
   - Compliance reporting
   - Incident response procedures

4. Go-live checklist:
   - BAA executed ✓
   - Subprocessor BAAs verified ✓
   - Admin trained ✓
   - Users provisioned ✓
   - Testing complete ✓

**Timeline:** 2-4 weeks from initial contact to go-live (faster if no BAA amendments needed)

### Contact Information

**BAA Requests:**
- Email: baa-requests@codescribeai.com
- Phone: +1 (555) 123-4567 (Mon-Fri, 9am-6pm EST)
- Portal: [codescribeai.com/enterprise/baa](https://codescribeai.com/enterprise/baa)

**Sales Team:**
- Email: sales@codescribeai.com
- Calendar: [Book 30-min consultation](https://calendly.com/codescribeai/baa-consultation)

**Legal Questions:**
- Email: legal@codescribeai.com

---

## Template BAA Language

### ⚠️ IMPORTANT LEGAL DISCLAIMER

**THIS TEMPLATE IS NOT LEGAL ADVICE**

The following Business Associate Agreement template is provided for **informational purposes only** and is **NOT legal advice**. It is a simplified template and must be:

1. **Reviewed by qualified legal counsel** specializing in healthcare law
2. **Customized** to your specific business relationship and needs
3. **Updated** to reflect current HIPAA regulations (45 CFR Parts 160 and 164)
4. **Negotiated** between parties (this is a starting point, not final language)

**DO NOT execute this BAA without attorney review and customization.**

HIPAA BAA requirements are complex, fact-specific, and subject to regulatory updates. CodeScribe AI, Inc. is not a law firm and cannot provide legal advice.

---

### BUSINESS ASSOCIATE AGREEMENT

This Business Associate Agreement ("**Agreement**") is entered into as of _________________ [DATE] ("**Effective Date**") by and between:

**COVERED ENTITY:**
[ORGANIZATION NAME]
[ADDRESS]
[CITY, STATE ZIP]
("**Covered Entity**")

**BUSINESS ASSOCIATE:**
CodeScribe AI, Inc.
[ADDRESS]
[CITY, STATE ZIP]
("**Business Associate**")

**WHEREAS**, Covered Entity and Business Associate have entered into a Service Agreement dated _________________ [DATE] ("**Service Agreement**") whereby Business Associate provides code documentation services to Covered Entity;

**WHEREAS**, in connection with the Service Agreement, Business Associate may create, receive, maintain, or transmit Protected Health Information on behalf of Covered Entity;

**WHEREAS**, the parties intend to protect the privacy and provide for the security of Protected Health Information in compliance with the Health Insurance Portability and Accountability Act of 1996, as amended ("**HIPAA**"), and the Health Information Technology for Economic and Clinical Health Act ("**HITECH Act**");

**NOW, THEREFORE**, in consideration of the mutual covenants and agreements herein contained, the parties agree as follows:

---

### 1. DEFINITIONS

Capitalized terms used but not defined in this Agreement shall have the meanings set forth in 45 CFR Parts 160 and 164.

1.1 **"Breach"** shall have the meaning given to such term under the HIPAA Rules at 45 CFR § 164.402.

1.2 **"Covered Entity"** shall mean [ORGANIZATION NAME].

1.3 **"Designated Record Set"** shall have the meaning given to such term under the HIPAA Rules at 45 CFR § 164.501.

1.4 **"HIPAA Rules"** shall mean the Privacy, Security, and Breach Notification Rules at 45 CFR Parts 160 and 164.

1.5 **"Individual"** shall have the meaning given to such term under the HIPAA Rules at 45 CFR § 160.103 and shall include a person who qualifies as a personal representative under 45 CFR § 164.502(g).

1.6 **"Privacy Rule"** shall mean the HIPAA Privacy Rule at 45 CFR Part 164, Subpart E.

1.7 **"Protected Health Information"** or **"PHI"** shall have the meaning given to such term under the HIPAA Rules at 45 CFR § 160.103, limited to the information created, received, maintained, or transmitted by Business Associate from or on behalf of Covered Entity.

1.8 **"Required by Law"** shall have the meaning given to such term under the HIPAA Rules at 45 CFR § 164.103.

1.9 **"Secretary"** shall mean the Secretary of the U.S. Department of Health and Human Services or his/her designee.

1.10 **"Security Incident"** shall have the meaning given to such term under the HIPAA Rules at 45 CFR § 164.304.

1.11 **"Security Rule"** shall mean the HIPAA Security Rule at 45 CFR Part 164, Subpart C.

1.12 **"Unsecured Protected Health Information"** shall have the meaning given to such term under the HIPAA Rules at 45 CFR § 164.402.

---

### 2. OBLIGATIONS OF BUSINESS ASSOCIATE

2.1 **Permitted Uses and Disclosures**

Business Associate may use or disclose PHI only as permitted by this Agreement or as Required by Law, and shall not use or disclose PHI in any manner that would violate the HIPAA Rules if done by Covered Entity, except as provided in Section 2.2.

Business Associate may:
- **(a)** Use and disclose PHI to perform the Services described in the Service Agreement;
- **(b)** Use and disclose PHI as Required by Law;
- **(c)** Use PHI for the proper management and administration of Business Associate or to carry out the legal responsibilities of Business Associate, provided that such use complies with 45 CFR § 164.504(e)(4)(i);
- **(d)** Disclose PHI for the proper management and administration of Business Associate or to carry out the legal responsibilities of Business Associate, provided that:
  - (i) The disclosure is Required by Law; or
  - (ii) Business Associate obtains reasonable assurances from the person to whom the PHI is disclosed that it will be held confidentially and used or further disclosed only as Required by Law or for the purpose for which it was disclosed to the person, and the person notifies Business Associate of any instances of which it is aware in which the confidentiality of the PHI has been breached.

2.2 **Prohibited Uses and Disclosures**

Business Associate shall not:
- **(a)** Use or disclose PHI for fundraising or marketing purposes;
- **(b)** Sell PHI without Covered Entity's prior written authorization (if such authorization is required by law);
- **(c)** Use or disclose PHI in a manner that would violate Subpart E of 45 CFR Part 164 (the Privacy Rule) if done by Covered Entity.

2.3 **Appropriate Safeguards**

Business Associate shall implement and maintain appropriate administrative, physical, and technical safeguards to prevent the use or disclosure of PHI other than as provided by this Agreement. Business Associate shall comply with Subpart C of 45 CFR Part 164 (the Security Rule) with respect to electronic PHI.

Business Associate's safeguards shall include, but are not limited to:
- **(a)** Access controls limiting PHI access to authorized workforce members only;
- **(b)** Encryption of PHI at rest (AES-256-GCM) and in transit (TLS 1.2+);
- **(c)** Audit logging of all PHI access and use (7-year retention);
- **(d)** PHI detection system alerting users to potential PHI in code submissions;
- **(e)** Regular security risk assessments and remediation;
- **(f)** Workforce training on HIPAA compliance and PHI handling.

2.4 **Reporting**

**(a) Security Incidents.** Business Associate shall report to Covered Entity any Security Incident of which it becomes aware without unreasonable delay, but in no event later than three (3) business days after discovery.

**(b) Unauthorized Use or Disclosure.** Business Associate shall report to Covered Entity any use or disclosure of PHI not provided for by this Agreement without unreasonable delay, but in no event later than three (3) business days after discovery.

**(c) Breaches of Unsecured PHI.** Business Associate shall report to Covered Entity any Breach of Unsecured PHI without unreasonable delay, but in no event later than three (3) business days after discovery. The report shall include, to the extent available:
- (i) Identification of each Individual whose Unsecured PHI has been, or is reasonably believed to have been, accessed, acquired, used, or disclosed;
- (ii) A brief description of what happened, including the date of the Breach and the date of discovery;
- (iii) A description of the types of Unsecured PHI involved (e.g., name, Social Security Number, date of birth);
- (iv) A brief description of what Business Associate is doing to investigate, mitigate harm, and prevent further Breaches;
- (v) Contact information for Covered Entity to ask questions or learn more.

**(d) Format.** All reports shall be provided in writing via email to the Covered Entity's designated Privacy Officer or Security Officer.

2.5 **Subcontractors and Agents**

Business Associate shall ensure that any subcontractors or agents that create, receive, maintain, or transmit PHI on behalf of Business Associate agree to the same restrictions and conditions that apply to Business Associate with respect to such PHI, including implementing reasonable and appropriate safeguards to protect the PHI.

Business Associate shall obtain and maintain written assurances from each subcontractor or agent, in the form of a Business Associate Agreement complying with 45 CFR § 164.504(e), that the subcontractor or agent will:
- **(a)** Comply with the applicable requirements of this Agreement and the HIPAA Rules;
- **(b)** Implement appropriate safeguards to protect PHI;
- **(c)** Report to Business Associate any Security Incidents or Breaches of which it becomes aware;
- **(d)** Ensure that any of its subcontractors or agents that have access to PHI agree to the same restrictions.

**Current Subcontractors:** See [SUBPROCESSOR-BAA-LIST.md](./SUBPROCESSOR-BAA-LIST.md) for a current list of all subcontractors with access to PHI.

2.6 **Access to PHI**

Business Associate shall provide access to PHI in a Designated Record Set to Covered Entity or, as directed by Covered Entity, to an Individual in order to meet the requirements of 45 CFR § 164.524 (right of access).

If Business Associate maintains PHI in a Designated Record Set electronically, Business Associate shall provide such access in the electronic form and format requested by Covered Entity or the Individual, if it is readily producible in such form and format, or, if not, in a readable electronic form and format as agreed to by Covered Entity and Business Associate.

Business Associate shall provide such access within ten (10) business days of a request from Covered Entity.

2.7 **Amendment of PHI**

Business Associate shall make any amendments to PHI in a Designated Record Set that Covered Entity directs or agrees to pursuant to 45 CFR § 164.526 within ten (10) business days of receiving such direction from Covered Entity.

2.8 **Accounting of Disclosures**

Business Associate shall document disclosures of PHI and information related to such disclosures as would be required for Covered Entity to respond to a request by an Individual for an accounting of disclosures of PHI in accordance with 45 CFR § 164.528.

Business Associate shall provide to Covered Entity or an Individual, upon request, an accounting of disclosures of PHI within thirty (30) days of such request. If Business Associate is unable to provide the accounting within thirty (30) days, Business Associate may extend the deadline by up to thirty (30) additional days if Business Associate provides Covered Entity or the Individual with a written statement of the reasons for the delay and the date by which the accounting will be provided.

2.9 **Mitigation**

Business Associate agrees to mitigate, to the extent practicable, any harmful effect that is known to Business Associate of a use or disclosure of PHI by Business Associate in violation of the requirements of this Agreement or applicable law.

2.10 **Books and Records**

Business Associate shall make its internal practices, books, and records relating to the use and disclosure of PHI received from, or created or received by Business Associate on behalf of, Covered Entity available to the Secretary for purposes of determining Covered Entity's compliance with the HIPAA Rules.

Business Associate shall provide such access within ten (10) business days of a request from the Secretary.

2.11 **Minimum Necessary**

Business Associate shall make reasonable efforts to limit the use, disclosure, or request of PHI to the minimum necessary to accomplish the intended purpose of the use, disclosure, or request, in accordance with 45 CFR § 164.502(b) and any applicable Covered Entity policies.

---

### 3. OBLIGATIONS OF COVERED ENTITY

3.1 **Notice of Privacy Practices**

Covered Entity shall provide Business Associate with a copy of Covered Entity's Notice of Privacy Practices and shall notify Business Associate of any changes to or revocation of such notice.

Covered Entity shall notify Business Associate of any limitation(s) in the Notice of Privacy Practices in accordance with 45 CFR § 164.520, to the extent that such limitation may affect Business Associate's use or disclosure of PHI.

3.2 **Authorizations and Consents**

Covered Entity shall obtain, and provide Business Associate with a copy of, any authorization, consent, or permission that may be required by law prior to Business Associate's use or disclosure of PHI.

3.3 **Restrictions**

Covered Entity shall notify Business Associate of any restriction on the use or disclosure of PHI that Covered Entity has agreed to in accordance with 45 CFR § 164.522, to the extent that such restriction may affect Business Associate's use or disclosure of PHI.

3.4 **Permissible Requests**

Covered Entity shall not request Business Associate to use or disclose PHI in any manner that would not be permissible under the HIPAA Rules if done by Covered Entity, except as provided in Section 2.1(c) and (d).

---

### 4. TERM AND TERMINATION

4.1 **Term**

This Agreement shall be effective as of the Effective Date and shall continue in effect until the earlier of:
- **(a)** The date Covered Entity terminates this Agreement for cause as provided in Section 4.2;
- **(b)** The date Business Associate terminates this Agreement for cause as provided in Section 4.3; or
- **(c)** The date on which the Service Agreement is terminated or expires.

4.2 **Termination by Covered Entity**

Covered Entity may terminate this Agreement upon thirty (30) days' written notice to Business Associate in the event that:
- **(a)** Business Associate materially breaches any provision of this Agreement and fails to cure such breach within thirty (30) days of receiving written notice of the breach from Covered Entity;
- **(b)** Business Associate breaches a material term of this Agreement and cure is not possible; or
- **(c)** Termination is required by law.

If Covered Entity knows of a pattern of activity or practice of Business Associate that constitutes a material breach or violation of this Agreement, Covered Entity shall:
- (i) Take reasonable steps to cure the breach or end the violation; or
- (ii) If such steps are unsuccessful, terminate this Agreement.

4.3 **Termination by Business Associate**

Business Associate may terminate this Agreement upon thirty (30) days' written notice to Covered Entity in the event that:
- **(a)** Covered Entity materially breaches any provision of this Agreement and fails to cure such breach within thirty (30) days of receiving written notice of the breach from Business Associate;
- **(b)** Covered Entity breaches a material term of this Agreement and cure is not possible; or
- **(c)** Termination is required by law.

4.4 **Effect of Termination**

Upon termination of this Agreement for any reason, Business Associate shall:

- **(a)** Return or Destroy PHI. Business Associate shall return to Covered Entity or, if agreed to by Covered Entity in writing, destroy all PHI received from Covered Entity, or created, maintained, or received by Business Associate on behalf of Covered Entity, that Business Associate still maintains in any form. Business Associate shall not retain any copies of such PHI.

- **(b)** Certification. Within thirty (30) days of termination, Business Associate shall certify in writing to Covered Entity that all PHI has been returned or destroyed in accordance with this Section.

- **(c)** Infeasibility Exception. If Business Associate determines that returning or destroying PHI is infeasible, Business Associate shall:
  - (i) Notify Covered Entity in writing of the conditions that make return or destruction infeasible;
  - (ii) Extend the protections of this Agreement to such PHI;
  - (iii) Limit further uses and disclosures of such PHI to those purposes that make the return or destruction infeasible, for so long as Business Associate maintains such PHI.

4.5 **Survival**

The obligations of Business Associate under Section 4.4 shall survive the termination of this Agreement.

---

### 5. INDEMNIFICATION

5.1 **By Business Associate**

Business Associate shall indemnify, defend, and hold harmless Covered Entity, its officers, directors, employees, and agents from and against any and all claims, losses, liabilities, damages, costs, and expenses (including reasonable attorneys' fees) arising out of or relating to:
- **(a)** Business Associate's breach of this Agreement;
- **(b)** Business Associate's violation of the HIPAA Rules;
- **(c)** Any Breach of Unsecured PHI caused by Business Associate, its workforce members, or its subcontractors;
- **(d)** Business Associate's failure to comply with applicable law.

5.2 **Limitation of Liability**

Notwithstanding Section 5.1, Business Associate's aggregate liability under this Agreement shall not exceed the total fees paid by Covered Entity to Business Associate under the Service Agreement in the twelve (12) months preceding the claim.

This limitation shall not apply to:
- **(a)** Business Associate's gross negligence or willful misconduct;
- **(b)** Claims arising from data breaches caused by Business Associate's failure to implement required safeguards;
- **(c)** Business Associate's indemnification obligations under Section 5.1.

---

### 6. MISCELLANEOUS

6.1 **Regulatory References**

Any reference in this Agreement to a section in the HIPAA Rules means the section as in effect or as amended from time to time, and for which compliance is required.

6.2 **Amendment**

The parties acknowledge that federal and state laws relating to data security and privacy are rapidly evolving and that amendment of this Agreement may be required to ensure compliance with such developments. The parties specifically agree to take such action as is necessary to implement the standards and requirements of HIPAA, the HITECH Act, and other applicable laws relating to the security and privacy of PHI.

Upon either party's request, the other party agrees to promptly enter into good faith negotiations concerning the terms of an amendment to this Agreement embodying written assurances consistent with the standards and requirements of HIPAA, the HITECH Act, or other applicable laws.

This Agreement may not be modified except by a written amendment signed by authorized representatives of both parties.

6.3 **Interpretation**

Any ambiguity in this Agreement shall be resolved in favor of a meaning that permits Covered Entity to comply with the HIPAA Rules.

6.4 **No Third-Party Beneficiaries**

Nothing express or implied in this Agreement is intended to confer, nor shall anything herein confer, upon any person other than the parties and their respective successors or assigns, any rights, remedies, obligations, or liabilities whatsoever.

6.5 **Governing Law**

This Agreement shall be governed by and construed in accordance with the laws of the State of _________________ [STATE], without regard to its conflict of laws principles.

6.6 **Jurisdiction and Venue**

Any legal action or proceeding arising out of or relating to this Agreement shall be instituted in the state or federal courts located in _________________ [CITY, STATE], and each party irrevocably submits to the exclusive jurisdiction of such courts.

6.7 **Severability**

If any provision of this Agreement is held to be invalid or unenforceable, the remaining provisions shall continue in full force and effect, and such invalid or unenforceable provision shall be reformed to the extent necessary to make it enforceable while preserving the intent of the parties.

6.8 **Waiver**

No waiver of any provision of this Agreement shall be effective unless in writing and signed by the party against whom such waiver is sought to be enforced. No waiver of any breach shall constitute a waiver of any other or subsequent breach.

6.9 **Counterparts**

This Agreement may be executed in counterparts, each of which shall be deemed an original, but all of which together shall constitute one and the same instrument. Electronic signatures shall be deemed original signatures for all purposes.

6.10 **Entire Agreement**

This Agreement, together with the Service Agreement, constitutes the entire agreement between the parties with respect to the subject matter hereof and supersedes all prior or contemporaneous understandings or agreements, whether written or oral, regarding such subject matter.

6.11 **Notices**

All notices required or permitted under this Agreement shall be in writing and shall be delivered by:
- **(a)** Personal delivery;
- **(b)** Certified or registered mail, return receipt requested;
- **(c)** Overnight courier service; or
- **(d)** Email (with confirmation of receipt).

Notices shall be sent to the addresses set forth below or to such other address as either party may designate by written notice:

**If to Covered Entity:**
[NAME]
[TITLE]
[EMAIL]
[PHONE]

**If to Business Associate:**
Jenni Coleman, CEO
CodeScribe AI, Inc.
jenni@codescribeai.com
[PHONE]

---

### 7. INSURANCE

7.1 **Cyber Liability Insurance**

Business Associate represents and warrants that it maintains, and shall maintain throughout the term of this Agreement, cyber liability insurance with coverage of at least Five Million Dollars ($5,000,000) per occurrence and in the aggregate.

Such insurance shall cover, at a minimum:
- **(a)** Data breach response costs (notification, credit monitoring, call center);
- **(b)** Regulatory defense and fines;
- **(c)** Third-party liability for privacy violations;
- **(d)** First-party costs (forensics, business interruption, data restoration).

7.2 **Proof of Insurance**

Upon request, Business Associate shall provide Covered Entity with a certificate of insurance evidencing the coverage required under Section 7.1.

---

**IN WITNESS WHEREOF**, the parties have executed this Business Associate Agreement as of the Effective Date.

**COVERED ENTITY:**

[ORGANIZATION NAME]

By: _______________________________
Name: _____________________________
Title: _____________________________
Date: _____________________________


**BUSINESS ASSOCIATE:**

CodeScribe AI, Inc.

By: _______________________________
Name: Jenni Coleman
Title: Chief Executive Officer
Date: _____________________________

---

### BAA Execution Checklist

Before executing this BAA, ensure:

- [ ] **Attorney Review:** Legal counsel has reviewed and approved this BAA
- [ ] **Customization:** BAA has been customized for specific business relationship
- [ ] **Subprocessor BAAs:** All subprocessors (Vercel, Neon, Anthropic) have signed BAAs
- [ ] **Insurance Verification:** Business Associate's cyber liability insurance is current ($5M+)
- [ ] **Service Agreement:** Underlying Service Agreement is executed
- [ ] **Authorized Signers:** Both signatories have authority to bind their organizations
- [ ] **Effective Date:** Effective date is filled in and agreed upon
- [ ] **Notice Contacts:** Contact information for both parties is accurate
- [ ] **Governing Law:** State law is specified in Section 6.5
- [ ] **Indemnification Review:** Indemnification and liability terms are acceptable to both parties

---

## Compliance Resources

### External HIPAA Resources

**U.S. Department of Health & Human Services (HHS):**
- [HIPAA for Professionals](https://www.hhs.gov/hipaa/for-professionals/index.html)
- [Business Associate Contracts](https://www.hhs.gov/hipaa/for-professionals/covered-entities/sample-business-associate-agreement-provisions/index.html)
- [Breach Notification Rule](https://www.hhs.gov/hipaa/for-professionals/breach-notification/index.html)
- [Security Rule Guidance](https://www.hhs.gov/hipaa/for-professionals/security/index.html)
- [Privacy Rule Summary](https://www.hhs.gov/hipaa/for-professionals/privacy/laws-regulations/index.html)

**NIST (National Institute of Standards and Technology):**
- [NIST SP 800-66](https://csrc.nist.gov/publications/detail/sp/800-66/rev-2/final) - HIPAA Security Rule Implementation Guide
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [NIST SP 800-88](https://csrc.nist.gov/publications/detail/sp/800-88/rev-1/final) - Media Sanitization Guidelines

**Industry Organizations:**
- [HITRUST Alliance](https://hitrustalliance.net/) - HITRUST CSF certification
- [American Medical Association (AMA)](https://www.ama-assn.org/practice-management/hipaa) - HIPAA guidance for healthcare providers

**Certification Bodies:**
- [HITRUST CSF Certification](https://hitrustalliance.net/hitrust-csf/)
- [SOC 2 Type II](https://www.aicpa.org/interestareas/frc/assuranceadvisoryservices/aicpasoc2report.html)

### CodeScribe Internal Documentation

**Compliance Policies:**
- [INCIDENT-RESPONSE-PLAN.md](./INCIDENT-RESPONSE-PLAN.md) - Security incident procedures
- [BREACH-NOTIFICATION-PROCEDURE.md](./BREACH-NOTIFICATION-PROCEDURE.md) - HIPAA breach notification process
- [SUBPROCESSOR-BAA-LIST.md](./SUBPROCESSOR-BAA-LIST.md) - Third-party BAA verification

**Technical Documentation:**
- [FEATURE-2-PHI-DETECTION-COMPLETE.md](./FEATURE-2-PHI-DETECTION-COMPLETE.md) - PHI detection system
- [FEATURE-3-ENCRYPTION-AT-REST-COMPLETE.md](./FEATURE-3-ENCRYPTION-AT-REST-COMPLETE.md) - Encryption implementation
- [FEATURE-4-COMPLIANCE-DASHBOARD-COMPLETE.md](./FEATURE-4-COMPLIANCE-DASHBOARD-COMPLETE.md) - Audit logging and compliance dashboard

**Architecture:**
- [ARCHITECTURE.md](../architecture/ARCHITECTURE.md) - System architecture
- [ERROR-HANDLING-PATTERNS.md](../architecture/ERROR-HANDLING-PATTERNS.md) - No PHI in error messages
- [JWT-AUTHENTICATION-SECURITY.md](../security/JWT-AUTHENTICATION-SECURITY.md) - Authentication security

### Contact Information

**General Inquiries:**
- Email: support@codescribeai.com
- Phone: +1 (555) 123-4567 (Mon-Fri, 9am-6pm EST)
- Portal: [codescribeai.com/support](https://codescribeai.com/support)

**Compliance & Legal:**
- **BAA Requests:** baa-requests@codescribeai.com
- **Compliance Questions:** compliance@codescribeai.com
- **Security Issues:** security@codescribeai.com
- **Legal Questions:** legal@codescribeai.com

**Leadership:**
- **CEO / Privacy Officer / Security Officer:** Jenni Coleman (jenni@codescribeai.com)

---

## Appendix: HIPAA Compliance Checklist

Use this checklist when evaluating CodeScribe for HIPAA compliance:

### ✅ Technical Safeguards (§ 164.312)

- [ ] **Access Controls**
  - [ ] Unique user identification (UUID-based)
  - [ ] Emergency access procedure (break-glass admin)
  - [ ] Automatic logoff (30-minute session timeout)
  - [ ] Encryption and decryption (AES-256-GCM at rest, TLS 1.2+ in transit)

- [ ] **Audit Controls**
  - [ ] Comprehensive audit logging enabled
  - [ ] 7-year retention configured
  - [ ] Tamper-proof write-once design
  - [ ] Compliance dashboard access verified

- [ ] **Integrity Controls**
  - [ ] SHA-256 hashing for input verification
  - [ ] Authenticated encryption (GCM mode)
  - [ ] Database constraints and transaction isolation

- [ ] **Person/Entity Authentication**
  - [ ] JWT authentication configured
  - [ ] Password complexity enforced (12+ characters)
  - [ ] Rate limiting enabled (brute-force protection)
  - [ ] Multi-factor authentication (optional, Enterprise)

- [ ] **Transmission Security**
  - [ ] TLS 1.2+ for all connections
  - [ ] Perfect Forward Secrecy (PFS) enabled
  - [ ] HSTS enabled with 1-year max-age
  - [ ] SSL Labs A+ rating verified

### ✅ Administrative Safeguards (§ 164.308)

- [ ] **Security Management Process**
  - [ ] Annual HIPAA risk assessment scheduled
  - [ ] Risk mitigation plan documented
  - [ ] Sanction policy in place
  - [ ] Monthly audit log reviews scheduled

- [ ] **Assigned Security Responsibility**
  - [ ] Security Officer designated (Jenni Coleman)
  - [ ] Privacy Officer designated (Jenni Coleman)
  - [ ] Contact information documented

- [ ] **Workforce Security**
  - [ ] Role-based access controls (RBAC) implemented
  - [ ] Background checks for PHI access
  - [ ] Termination procedures documented

- [ ] **Information Access Management**
  - [ ] Least privilege principle enforced
  - [ ] Quarterly access reviews scheduled

- [ ] **Security Awareness Training**
  - [ ] Monthly security bulletins planned
  - [ ] Phishing simulations scheduled
  - [ ] Password manager recommended

- [ ] **Security Incident Procedures**
  - [ ] Incident response plan documented
  - [ ] 24/7 incident response capability
  - [ ] Post-incident review process

- [ ] **Contingency Plan**
  - [ ] Daily automated backups (Neon)
  - [ ] Disaster recovery plan (RTO: 4 hours, RPO: 1 hour)
  - [ ] Annual DR testing scheduled

- [ ] **Evaluation**
  - [ ] Annual HIPAA compliance evaluation planned
  - [ ] Quarterly security assessments scheduled

- [ ] **Business Associate Contracts**
  - [ ] BAA template reviewed by attorney
  - [ ] Subprocessor BAAs verified (Vercel, Neon, Anthropic)

### ✅ Physical Safeguards (§ 164.310)

- [ ] **Facility Access Controls**
  - [ ] Cloud-native architecture (Vercel/Neon SOC 2 certified)
  - [ ] No local PHI storage verified

- [ ] **Workstation Security**
  - [ ] Full-disk encryption required (FileVault)
  - [ ] Screen lock configured (5 minutes)

- [ ] **Device and Media Controls**
  - [ ] Cloud-only architecture (no removable media)
  - [ ] Decommissioning procedures documented

### ✅ Organizational Requirements (§ 164.314)

- [ ] **BAA with CodeScribe**
  - [ ] BAA executed
  - [ ] Effective date documented
  - [ ] BAA on file (legal department)

- [ ] **Subprocessor BAAs**
  - [ ] Vercel BAA verified
  - [ ] Neon BAA verified
  - [ ] Anthropic BAA verified

### ✅ Policies and Documentation (§ 164.316)

- [ ] **Written Policies**
  - [ ] Incident response plan on file
  - [ ] Breach notification procedure documented
  - [ ] Audit log retention policy (7 years)

- [ ] **Workforce Training**
  - [ ] HIPAA training completed (initial)
  - [ ] Annual refresher training scheduled

- [ ] **Privacy Practices**
  - [ ] Notice of Privacy Practices published
  - [ ] Authorization obtained for PHI use (if required)

### ✅ Ongoing Compliance

- [ ] **Regular Reviews**
  - [ ] Quarterly access reviews
  - [ ] Monthly audit log reviews
  - [ ] Annual security training

- [ ] **Incident Response**
  - [ ] Breach response team identified
  - [ ] Escalation procedures documented
  - [ ] Communication templates prepared

- [ ] **Continuous Improvement**
  - [ ] Security metrics tracked
  - [ ] Compliance dashboard monitored
  - [ ] Risk assessments updated

---

**Document Version:** 1.0 (Draft - Requires Attorney Review)
**Last Updated:** January 27, 2026
**Next Review:** February 27, 2026 (monthly until legal review complete)

**Document Owner:** Legal & Compliance Team
**Status:** ⚠️ **DRAFT - NOT FOR EXECUTION WITHOUT ATTORNEY REVIEW**

---

**For questions about BAA execution or HIPAA compliance, contact:**
- **BAA Requests:** baa-requests@codescribeai.com
- **Legal:** legal@codescribeai.com
- **Compliance:** compliance@codescribeai.com

---

## Summary

This BAA Readiness Guide provides comprehensive information about CodeScribe's HIPAA compliance posture and includes a template Business Associate Agreement. **This is a draft document that requires attorney review before use.**

**Key Takeaways:**

1. **BAA is required** for healthcare organizations subject to HIPAA when using CodeScribe
2. **CodeScribe implements HIPAA-compliant safeguards** (technical, administrative, physical)
3. **All subprocessors have signed BAAs** (Vercel, Neon, Anthropic)
4. **Template BAA provided** but must be reviewed and customized by legal counsel
5. **Enterprise Healthcare tier required** ($999-2,999/month) for BAA execution

**Next Steps:**

1. Consult qualified healthcare attorney to review this guide and template BAA
2. Customize BAA template for your specific business relationship
3. Verify CodeScribe's compliance claims are current
4. Contact baa-requests@codescribeai.com to begin BAA process

**⚠️ DO NOT execute the template BAA without attorney review.**

# HIPAA Breach Notification Procedure

**Status:** ⚠️ **DRAFT - REQUIRES LEGAL APPROVAL**
**Last Updated:** January 27, 2026
**Version:** 1.0 (Draft)
**Next Review:** February 27, 2026 (monthly until approved)

---

## ⚠️ IMPORTANT LEGAL DISCLAIMER

This Breach Notification Procedure is a **draft template** provided for internal use and must be:

1. **Reviewed and approved** by legal counsel specializing in healthcare law
2. **Customized** to CodeScribe's specific BAA obligations
3. **Updated** to reflect current HIPAA regulations (45 CFR §§ 164.400-414)
4. **Tested** through tabletop exercises

**This is not legal advice. Consult qualified legal counsel for HIPAA breach notification obligations.**

---

## Table of Contents

1. [Purpose and Scope](#purpose-and-scope)
2. [What is a Breach Under HIPAA?](#what-is-a-breach-under-hipaa)
3. [Breach Determination Process](#breach-determination-process)
4. [Notification Requirements](#notification-requirements)
5. [Timeline Requirements](#timeline-requirements)
6. [Notification Content](#notification-content)
7. [Breach Log and Documentation](#breach-log-and-documentation)
8. [Appendices](#appendices)

---

## Purpose and Scope

### Purpose

This procedure defines CodeScribe AI's process for determining whether a security incident constitutes a **breach** under HIPAA and, if so, fulfilling notification obligations to:
- Affected individuals
- Covered Entity customers (per BAA requirements)
- U.S. Department of Health and Human Services (HHS)
- Prominent media outlets (if applicable)

### Scope

This procedure applies to:
- Security incidents involving **Unsecured Protected Health Information (PHI)**
- Incidents affecting Covered Entity customers who have executed Business Associate Agreements (BAAs)
- All CodeScribe workforce members and contractors

### Regulatory Authority

**HIPAA Breach Notification Rule:**
- 45 CFR § 164.400 - Definitions
- 45 CFR § 164.402 - Breach defined
- 45 CFR § 164.404 - Notification to individuals
- 45 CFR § 164.406 - Notification to media
- 45 CFR § 164.408 - Notification to HHS
- 45 CFR § 164.410 - Notification by business associate (CodeScribe)
- 45 CFR § 164.414 - Administrative requirements and burden of proof

**Key Principle:**
> If an impermissible use or disclosure of PHI occurs, it is **presumed to be a breach** unless CodeScribe demonstrates a low probability that PHI has been compromised.

---

## What is a Breach Under HIPAA?

### Definition (45 CFR § 164.402)

**Breach** means:
> The acquisition, access, use, or disclosure of protected health information in a manner not permitted by the HIPAA Privacy Rule which compromises the security or privacy of the protected health information.

**Key Elements:**
1. **Impermissible use or disclosure** (not allowed by Privacy Rule or BAA)
2. **Of unsecured PHI** (not encrypted or destroyed)
3. **That compromises** the security or privacy of the PHI

### What is "Unsecured PHI"?

**Unsecured PHI** means PHI that is NOT:
- **Encrypted** using NIST-validated encryption (e.g., AES-256) with secure key management
- **Destroyed** beyond recovery (e.g., shredded, burned, pulverized, purged per NIST SP 800-88)

**CodeScribe's Encryption:**
- User emails: ✅ Encrypted at rest (AES-256-GCM)
- Database: ✅ Encrypted at rest (Neon AES-256)
- User code: ❌ Not stored (in-memory only, so not "unsecured" because doesn't exist)
- Audit logs: ✅ Encrypted at rest (Neon AES-256)

**Implications:**
- If encrypted data accessed without encryption keys being compromised → **Likely not a breach**
- If unencrypted data accessed → **Presumed to be a breach** (unless low probability of compromise proven)

### Exceptions to Breach Definition

A breach does **NOT** include:

**1. Unintentional Access/Use by Workforce Member (§ 164.402(1)(i))**
- Workforce member accidentally accesses PHI while performing job duties
- Access was in good faith and within scope of authority
- PHI was not further used or disclosed impermissibly

**Example:**
- Admin accidentally opens audit log for wrong customer while investigating issue
- Admin immediately closes log without copying or sharing data
- **Not a breach** (unintentional, good faith, within authority, no further disclosure)

**2. Inadvertent Disclosure Between Authorized Persons (§ 164.402(1)(ii))**
- Person authorized to access PHI inadvertently discloses to another authorized person at same organization
- Receiving person would have been authorized to access that PHI anyway
- PHI is not further used or disclosed impermissibly

**Example:**
- One CodeScribe admin emails audit log to another CodeScribe admin (both authorized)
- **Not a breach** (inadvertent, both authorized, no further disclosure)

**3. Good Faith Belief PHI Cannot Be Retained (§ 164.402(1)(iii))**
- Unauthorized person to whom disclosure was made could not have retained PHI
- Person acted in good faith in making this determination

**Example:**
- Email with PHI sent to wrong recipient, but recipient immediately deleted without reading
- Sender has good faith belief PHI was deleted
- **Not a breach** (good faith belief PHI not retained)

### Presumption of Breach

**Important:** Under HIPAA, if an impermissible use or disclosure occurs, it is **presumed to be a breach** unless CodeScribe demonstrates through a **risk assessment** that there is a **low probability that the PHI has been compromised**.

**Burden of Proof:**
- CodeScribe must prove low probability (not the other way around)
- Documentation of risk assessment required
- HHS may audit and challenge determination

---

## Breach Determination Process

### Step 1: Identify Potential Breach

**Trigger Events:**
- Security incident involving PHI (per Incident Response Plan)
- Unauthorized access to PHI
- Loss or theft of device containing PHI
- Accidental disclosure of PHI (email to wrong recipient, etc.)
- Subprocessor reports breach affecting CodeScribe data

**Who Can Report:**
- Any workforce member who becomes aware of potential breach
- Covered Entity customer
- Subprocessor (Vercel, Neon, Anthropic)
- Security monitoring systems

**Reporting:**
- Email: security@codescribeai.com
- Phone: CEO direct line (+1-555-123-4567)
- Escalate immediately (do not wait)

### Step 2: Assemble Breach Assessment Team

**Team Members:**
- Privacy Officer (Jenni Coleman)
- Security Officer (Jenni Coleman)
- Legal Counsel
- Subject Matter Expert (if technical incident)

**Timeline:** Within 24 hours of potential breach discovery

### Step 3: Conduct Risk Assessment (§ 164.402(2))

**Purpose:** Determine whether there is a **low probability that PHI has been compromised**

**HIPAA Risk Assessment Factors (all 4 required):**

#### Factor 1: Nature and Extent of PHI Involved

**Questions:**
- What types of PHI were involved? (SSN, MRN, DOB, email, etc.)
- How many individuals affected?
- How sensitive is the PHI? (high: SSN/MRN, medium: DOB/phone, low: email)
- Was the PHI encrypted? (if yes, were keys compromised?)

**Risk Levels:**
- **High Risk:** SSN, MRN, financial info, full medical records (> 500 individuals)
- **Medium Risk:** DOB, phone, address, diagnosis codes (50-500 individuals)
- **Low Risk:** Email addresses only, limited data (< 50 individuals)

**Example:**
- 10 user emails exposed (encrypted database accessed but keys not compromised) → **Low risk**
- 1,000 SSNs exposed (unencrypted) → **High risk**

#### Factor 2: Unauthorized Person Who Used or Accessed PHI

**Questions:**
- Who was the unauthorized person? (attacker profile)
- What was their likely intent? (opportunistic vs. targeted)
- What is the likelihood they could exploit PHI? (technical sophistication)
- Is the person known to CodeScribe? (e.g., former employee vs. external hacker)

**Risk Levels:**
- **High Risk:** Sophisticated hacker, criminal intent, known to target healthcare
- **Medium Risk:** Opportunistic hacker, unclear intent
- **Low Risk:** Accidental recipient, no malicious intent, verified deletion

**Example:**
- Email sent to wrong customer (both are healthcare orgs) → **Low risk** (if recipient cooperates)
- Database accessed by ransomware gang → **High risk** (criminal intent)

#### Factor 3: Was PHI Actually Acquired or Viewed?

**Questions:**
- Was PHI actually accessed or just available for access?
- Is there evidence of data exfiltration? (large file transfers, unusual queries)
- How long was unauthorized access possible? (minutes vs. weeks)
- Was PHI copied, downloaded, or transmitted?

**Evidence Sources:**
- Audit logs (database query logs, API request logs)
- Network traffic logs (Vercel, Cloudflare)
- Forensic analysis (memory dumps, disk images)
- Attacker statements (ransom notes, extortion emails)

**Risk Levels:**
- **High Risk:** Confirmed exfiltration (files downloaded, data posted online)
- **Medium Risk:** Access confirmed but exfiltration unclear
- **Low Risk:** No evidence of access or viewing (e.g., lost laptop never turned on)

**Example:**
- Audit logs show attacker queried user table but no large data transfers → **Medium risk**
- Attacker posted stolen data on dark web → **High risk**

#### Factor 4: Extent to Which Risk Has Been Mitigated

**Questions:**
- Has PHI been recovered or deleted? (e.g., email recalled, laptop recovered)
- Has unauthorized person agreed not to further use/disclose PHI? (signed affidavit)
- Have technical safeguards been implemented to prevent further exposure? (encrypted, deleted, access revoked)
- Can harm be mitigated? (credit monitoring, identity theft protection)

**Mitigation Actions:**
- **Full Mitigation:** PHI recovered and deleted, verified by forensics, no copies exist
- **Partial Mitigation:** Unauthorized person agrees to delete, but verification uncertain
- **No Mitigation:** PHI posted online, unable to recover

**Risk Levels:**
- **Low Risk:** PHI fully recovered, verified deletion, no harm possible
- **Medium Risk:** Partial mitigation, some risk remains
- **High Risk:** No mitigation possible, PHI publicly disclosed

**Example:**
- Email sent to wrong recipient, recipient forwards confirmation of deletion → **Low risk**
- Ransomware group threatens to post data unless paid → **High risk**

### Step 4: Make Breach Determination

**Decision Matrix:**

| Risk Assessment Outcome | Breach Determination | Action Required |
|-------------------------|----------------------|-----------------|
| All 4 factors = Low | **Not a Breach** (low probability of compromise) | Document risk assessment, notify Covered Entity (BAA requirement), no individual notification |
| 1+ factor = Medium/High | **Breach** (presumed) | Notify individuals, Covered Entity, HHS (if 500+), media (if 500+ in state) |
| Uncertain (insufficient evidence) | **Breach** (presumed, out of abundance of caution) | Treat as breach, notify all parties |

**Documentation Required:**
- Written risk assessment (all 4 factors analyzed)
- Rationale for determination (breach vs. not a breach)
- Evidence supporting determination (audit logs, forensic reports)
- Review and approval by Privacy Officer and Legal Counsel

**Timeline:** Within 48 hours of discovery

**Important:** If uncertain, err on the side of caution and treat as breach. It's better to over-notify than under-notify (HIPAA penalties for failure to notify are severe).

### Step 5: Notify Covered Entity (Regardless of Breach Determination)

**Per BAA Requirements:**
- CodeScribe must notify Covered Entity of **any** suspected breach or impermissible use/disclosure
- Even if risk assessment determines "not a breach," Covered Entity must be informed
- Covered Entity makes final determination for their own breach notification obligations

**Timeline:** Within 3 business days of discovery (CodeScribe standard, exceeds HIPAA requirement)

**Method:** Email to designated Privacy Officer / Security Officer + follow-up call

**Content:** See [Appendix A: Covered Entity Notification Template](#appendix-a-covered-entity-notification-template)

---

## Notification Requirements

### Who Must Be Notified?

| Recipient | When Required | Timeline | Method |
|-----------|---------------|----------|--------|
| **Covered Entity** | Always (per BAA) | 3 business days | Email + call |
| **Individuals** | If breach confirmed | 60 days | Mail (preferred) or email |
| **HHS** | If breach affects 500+ individuals | 60 days | HHS Breach Portal |
| **Media** | If breach affects 500+ individuals in same state/jurisdiction | 60 days | Press release |

### 1. Covered Entity Notification (Always Required)

**BAA Obligation (§ 164.410):**
> Business Associate must notify Covered Entity of any breach of unsecured PHI without unreasonable delay, but no later than 60 calendar days after discovery.

**CodeScribe Standard:** Within 3 business days (exceeds HIPAA requirement)

**Content Required:**
1. Date of breach and date of discovery
2. Brief description of what happened
3. Types of PHI involved (SSN, MRN, email, etc.)
4. Number of individuals affected (if known)
5. Steps CodeScribe is taking to investigate and mitigate
6. Contact information for questions

**See:** [Appendix A: Covered Entity Notification Template](#appendix-a-covered-entity-notification-template)

### 2. Individual Notification (If Breach Confirmed)

**HIPAA Requirement (§ 164.404):**
> Covered Entity or Business Associate (if delegated) must notify each individual whose PHI was breached.

**Timeline:** Within 60 calendar days after discovery

**Method:**
- **Preferred:** First-class mail to individual's last known address
- **Alternative:** Email (if individual agreed to electronic communication AND email address was not part of breach)
- **Substitute Notice (if contact info insufficient):**
  - < 10 individuals: Telephone or other written means
  - ≥ 10 individuals: Conspicuous posting on website for 90 days + notice to major media

**Content Required (§ 164.404(c)):**
1. Brief description of what happened (including date of breach and discovery)
2. Types of PHI involved
3. Steps individuals should take to protect themselves (e.g., credit monitoring)
4. What CodeScribe is doing to investigate and prevent recurrence
5. Contact information for questions

**Prohibition:** No mention of **business associate** in notification to individuals (only Covered Entity's name should appear, unless CodeScribe is sending on behalf of CE)

**See:** [Appendix B: Individual Notification Letter Template](#appendix-b-individual-notification-letter-template)

### 3. HHS Notification (If 500+ Individuals)

**HIPAA Requirement (§ 164.408):**
> Covered Entity or Business Associate must notify HHS of breaches affecting 500+ individuals.

**Timeline:** Within 60 calendar days after discovery (contemporaneous with individual notification)

**Method:** HHS Breach Portal (online submission)

**Portal:** [https://ocrportal.hhs.gov/ocr/breach/wizard_breach.jsf](https://ocrportal.hhs.gov/ocr/breach/wizard_breach.jsf)

**Information Required:**
- Organization name, type (business associate), address, contact
- Number of individuals affected
- Covered Entity(ies) involved (if known)
- Date of breach and date of discovery
- Type of breach (hacking, unauthorized access, theft, loss, etc.)
- Location of breach (server, email, laptop, etc.)
- Types of PHI involved
- Brief description (500 words max)
- Safeguards in place before breach
- Actions taken in response

**Confirmation:**
- HHS sends email confirmation
- Save confirmation for records
- HHS may follow up with questions (respond within 10 business days)

**Public Posting:**
- HHS posts breaches affecting 500+ individuals on public "Wall of Shame"
- Posted information: Organization name, # individuals, type of breach, location, date

**See:** [Appendix C: HHS Breach Portal Submission Guide](#appendix-c-hhs-breach-portal-submission-guide)

### 4. Media Notification (If 500+ in Same State/Jurisdiction)

**HIPAA Requirement (§ 164.406):**
> Covered Entity or Business Associate must notify prominent media outlets if breach affects > 500 residents of a state or jurisdiction.

**Timeline:** Within 60 calendar days after discovery (contemporaneous with individual notification)

**Method:** Press release to major media outlets

**Recipients:**
- Major newspapers in affected state (e.g., New York Times if 500+ NY residents)
- Major TV stations (ABC, NBC, CBS, Fox affiliates)
- Wire services (Associated Press, Reuters)

**Content:** Same as individual notification letter (brief description, PHI types, what to do, contact info)

**Additional:** Post on CodeScribe website (breach notification page)

**See:** [Appendix D: Media Notification Template](#appendix-d-media-notification-template)

---

## Timeline Requirements

### Discovery Date Definition

**"Discovery"** means the date on which a breach is **first known** to CodeScribe or, by exercising reasonable diligence, should have been known.

**Examples:**
- **Known:** Employee discovers database credentials in public GitHub repo on [DATE] → Discovery = [DATE]
- **Should Have Known:** Automated alert of suspicious database access on [DATE], investigated 3 days later → Discovery = [DATE] (when alert fired, not when investigated)

**Reasonable Diligence:**
- Regular monitoring of security logs and alerts
- Timely investigation of anomalies
- Adequate staffing and training

### Timeline Summary

```
Discovery
    ↓
    ├─ Within 24 hours → Assemble breach assessment team
    ├─ Within 48 hours → Complete risk assessment
    ├─ Within 3 business days → Notify Covered Entity (CodeScribe standard)
    └─ Within 60 calendar days → Notify individuals, HHS (if 500+), media (if 500+ in state)
```

### Calendar Days vs. Business Days

**HIPAA uses calendar days** (not business days) for most deadlines:
- Individual notification: 60 **calendar** days
- HHS notification: 60 **calendar** days
- Media notification: 60 **calendar** days

**Exception:** Covered Entity notification (per BAA) may specify business days (CodeScribe: 3 **business** days)

### Counting Days

**Start Date:** Discovery date = Day 0
**End Date:** Notification must be **postmarked or sent** by Day 60 (for mail) or submitted electronically by 11:59 PM on Day 60

**Example:**
- Discovery: January 1, 2026
- Deadline: March 1, 2026 (60 days later)
- If March 1 is a Saturday, deadline is still March 1 (not extended)

### Extensions

**No extensions** under HIPAA Breach Notification Rule (unlike other HIPAA provisions). 60 days is **firm deadline**.

**Penalty for Late Notification:**
- OCR (Office for Civil Rights) penalties: $100 to $50,000 per violation
- Potential for additional penalties if willful neglect
- Reputational damage

---

## Notification Content

### Required Content for Individual Notification (§ 164.404(c))

**1. Brief Description of What Happened**
- Explain incident in plain language (no technical jargon)
- Include date of breach (if known) and date of discovery
- Be honest and transparent

**Example:**
> "On January 15, 2026, we discovered that an unauthorized person gained access to our computer systems. We immediately began an investigation and took steps to secure our systems."

**2. Types of PHI Involved**
- List specific data elements (SSN, MRN, DOB, email, etc.)
- Be specific (not "your information" but "your name, email address, and date of birth")
- Clarify what was **not** involved (if helpful)

**Example:**
> "The information involved includes your name, email address, and date of service. Your Social Security Number, medical record number, and financial information were not involved."

**3. Steps Individuals Should Take**
- Actionable recommendations to protect themselves
- Resources available (credit monitoring, fraud alerts, etc.)
- Avoid legalese or vague suggestions

**Example:**
> "We recommend you monitor your credit reports and account statements for unusual activity. You can place a fraud alert or credit freeze by contacting the three major credit bureaus: Equifax, Experian, and TransUnion. We are offering you 12 months of free credit monitoring through [Provider] - see enclosed instructions."

**4. What CodeScribe is Doing**
- Actions taken to investigate (forensic review, law enforcement)
- Actions taken to prevent recurrence (security enhancements)
- Demonstrate accountability and commitment to security

**Example:**
> "We are working with leading cybersecurity experts to investigate this incident. We have implemented additional security measures, including enhanced encryption and monitoring, to prevent this from happening again."

**5. Contact Information**
- Dedicated phone number, email, and mailing address
- Hours of availability
- Person or title to contact (Privacy Officer)

**Example:**
> "If you have questions, please contact our Privacy Officer at privacy@codescribeai.com or call 1-800-XXX-XXXX (toll-free, Monday-Friday 9am-6pm EST)."

### Prohibited Content

**Do NOT Include:**
- Speculation about causes before investigation complete
- Blame-shifting ("It was the vendor's fault")
- Minimizing language ("This is not a big deal")
- Legal disclaimers or liability waivers
- Business associate relationship details (unless sending on behalf of CE)

---

## Breach Log and Documentation

### Breach Log Requirements (§ 164.414(a)(2))

**Purpose:** Document all breaches affecting < 500 individuals and notify HHS annually

**Log Contents:**
1. Date of discovery
2. Number of individuals affected
3. Brief description of breach
4. Types of PHI involved
5. Covered Entity(ies) affected
6. Whether individuals were notified
7. Date of individual notification
8. Any mitigating factors (risk assessment outcome)

**Retention:** 6 years from date of breach (HIPAA standard)

**Annual HHS Notification:**
- For breaches affecting < 500 individuals
- Submit within 60 days of calendar year end (by March 1)
- Via HHS Breach Portal

### Documentation Requirements

**For Each Breach (Regardless of Size):**

1. **Incident Report** (from Incident Response Plan)
   - Timeline of events
   - Systems/data affected
   - Number of individuals
   - Types of PHI

2. **Risk Assessment**
   - All 4 HIPAA factors analyzed
   - Evidence supporting determination (audit logs, forensics)
   - Rationale for breach vs. not-a-breach determination
   - Reviewers and approvers (Privacy Officer, Legal Counsel)

3. **Notification Documentation**
   - Copies of all notifications sent (Covered Entity, individuals, HHS, media)
   - Distribution lists (who was notified, when, how)
   - Proof of mailing (certified mail receipts, email delivery confirmations)
   - HHS Breach Portal confirmation emails

4. **Covered Entity Communications**
   - All emails and letters to Covered Entity
   - Meeting notes, phone call summaries
   - Covered Entity's acknowledgment and response

5. **Mitigation Evidence**
   - Actions taken to contain and remediate
   - Forensic reports
   - Subprocessor communications (if applicable)

**Storage:**
- Secure location (encrypted, access-controlled)
- Organized by breach incident number (BR-YYYY-NNNN)
- Retained for 6 years minimum (HIPAA requirement)
- Consider legal privilege (attorney-client) for sensitive documents

---

## Appendices

### Appendix A: Covered Entity Notification Template

**Subject:** URGENT: Potential Breach Notification - [Organization Name]

Dear [Privacy Officer / Security Officer Name],

In accordance with our Business Associate Agreement dated [BAA DATE], I am writing to inform you of a potential breach of Protected Health Information (PHI) related to [Organization Name].

**Incident Summary:**
On [DISCOVERY DATE], we discovered [brief description - e.g., "unauthorized access to our production database"]. We immediately initiated our incident response and breach assessment procedures.

**Discovery and Timeline:**
- **Date of Incident:** [INCIDENT DATE or "Under investigation"]
- **Date of Discovery:** [DISCOVERY DATE]
- **Date of This Notice:** [TODAY'S DATE] ([X] business days after discovery)

**Individuals Affected:**
- **Number:** Approximately [X] individuals (or "Under investigation")
- **Your Organization:** [X] of your patients/members (or "Under investigation")

**Types of PHI Potentially Involved:**
Based on our preliminary investigation, the following types of information may have been accessed:
- [List specific data elements: e.g., "Names", "Email addresses", "Dates of service"]
- [Clarify what was NOT involved: e.g., "Social Security Numbers and Medical Record Numbers were NOT involved"]

**Encryption Status:**
- [Was PHI encrypted? "Yes, PHI was encrypted at rest using AES-256-GCM" or "No, PHI was not encrypted"]
- [If encrypted: "Encryption keys were NOT compromised" or "Encryption keys MAY have been compromised"]

**Our Investigation:**
We have completed/are conducting a risk assessment under 45 CFR § 164.402(2) to determine whether this incident constitutes a breach under HIPAA. Our preliminary assessment indicates:
- [Share preliminary findings if available, or "Investigation is ongoing, full assessment will be available by [DATE]"]

**Breach Determination:**
- **Status:** [Confirmed Breach / Likely Not a Breach / Under Investigation]
- **Rationale:** [Brief explanation - e.g., "Low probability of compromise due to encryption" or "High risk due to confirmed data exfiltration"]
- **Risk Assessment:** [Attach or "Will provide full risk assessment by [DATE]"]

**Actions Taken:**
We have taken the following steps to investigate and mitigate this incident:
1. [Action 1 - e.g., "Immediately revoked compromised credentials"]
2. [Action 2 - e.g., "Engaged external cybersecurity forensics firm"]
3. [Action 3 - e.g., "Implemented additional security controls"]

**Your Obligations:**
As a Covered Entity, you are responsible for determining whether this incident constitutes a breach under HIPAA for your organization and whether notification to affected individuals is required under 45 CFR § 164.404.

We recommend:
1. Conduct your own breach risk assessment
2. Determine notification obligations under HIPAA (60-day deadline from discovery)
3. Contact us immediately if you need additional information

**Support We Are Providing:**
- Full incident timeline (attached or available upon request)
- List of affected individuals from your organization (available upon request)
- Risk assessment documentation (attached or will provide by [DATE])
- Forensic investigation findings (will provide by [DATE])
- Assistance with breach notification process (if you determine notification is required)

**Next Steps:**
1. We will provide a complete incident report by [DATE within 5-10 business days]
2. We will continue to update you as our investigation progresses
3. We are available for a call to discuss this incident at your convenience

**Contact Information:**
- **Privacy Officer:** Jenni Coleman (jenni@codescribeai.com, +1-555-123-4567)
- **Incident Commander:** [Name] ([email], [phone])
- **Dedicated Incident Line:** security@codescribeai.com

We sincerely regret this incident and the concern it may cause. We are committed to working with you to ensure compliance with all HIPAA requirements and to prevent such incidents in the future.

Please acknowledge receipt of this notice and let us know how we can best support you.

Sincerely,

Jenni Coleman
Chief Executive Officer & Privacy Officer
CodeScribe AI, Inc.

**Attachments:**
- Preliminary risk assessment (if available)
- Incident timeline (if available)
- List of affected individuals (upon request)

---

### Appendix B: Individual Notification Letter Template

[Print on CodeScribe AI or Covered Entity Letterhead]

[DATE]

[INDIVIDUAL NAME]
[ADDRESS]
[CITY, STATE ZIP]

**RE: Notice of Data Security Incident**

Dear [INDIVIDUAL NAME],

We are writing to inform you of a data security incident that may have involved your protected health information.

**What Happened:**
On [DISCOVERY DATE], we discovered that [brief description in plain language - e.g., "an unauthorized person gained access to our computer systems"]. We immediately launched an investigation with the assistance of cybersecurity experts to determine what happened and to secure our systems.

**What Information Was Involved:**
Our investigation determined that the following types of your information may have been accessed or acquired by an unauthorized person:
- [List specific data elements - e.g., "Your name, email address, and date of service"]
- [Clarify what was NOT involved - e.g., "Your Social Security Number, medical record number, and financial account information were NOT involved in this incident"]

**What We Are Doing:**
We take the security of your information very seriously. In response to this incident, we have:
- [Action 1 - e.g., "Secured our systems and terminated the unauthorized access"]
- [Action 2 - e.g., "Engaged a leading cybersecurity firm to conduct a comprehensive forensic investigation"]
- [Action 3 - e.g., "Implemented additional security measures, including enhanced encryption and monitoring"]
- [Action 4 - e.g., "Reported this incident to law enforcement"]

**What You Can Do:**
We recommend you take the following steps to protect yourself:

1. **Monitor Your Accounts:**
   - Review your medical explanation of benefits (EOB) statements for services you did not receive
   - Check your credit card and bank statements for unauthorized charges
   - Monitor your credit reports for new accounts you did not open

2. **Place a Fraud Alert:**
   - Contact one of the three major credit bureaus to place a free fraud alert:
     - **Equifax:** 1-800-525-6285 or www.equifax.com
     - **Experian:** 1-888-397-3742 or www.experian.com
     - **TransUnion:** 1-800-680-7289 or www.transunion.com

3. **Consider a Credit Freeze:**
   - A credit freeze restricts access to your credit report, making it harder for identity thieves to open accounts in your name
   - Contact each credit bureau individually to request a freeze (no fee)

[If credit monitoring offered:
4. **Enroll in Free Credit Monitoring:**
   - We are offering you [12] months of complimentary credit monitoring and identity theft protection services through [Provider Name]
   - To enroll, please visit [ENROLLMENT URL] and enter activation code: [CODE]
   - Enrollment deadline: [DATE - typically 90 days from letter date]
]

**Additional Resources:**
- **Federal Trade Commission (FTC):** www.identitytheft.gov or 1-877-ID-THEFT (438-4338)
  - Free resources on identity theft protection and recovery
- **Your State Attorney General:** [STATE AG WEBSITE]
  - File a complaint if you believe you are a victim of identity theft

**For More Information:**
If you have questions about this incident, please contact us at:
- **Email:** privacy@codescribeai.com
- **Phone:** 1-800-XXX-XXXX (toll-free, Monday-Friday 9am-6pm EST)
- **Mail:** CodeScribe AI, Inc., Attn: Privacy Officer, [Address], [City, State ZIP]

We sincerely regret any inconvenience or concern this incident may cause you. Protecting your information is a responsibility we take very seriously, and we are committed to preventing such incidents in the future.

Sincerely,

Jenni Coleman
Chief Executive Officer & Privacy Officer
CodeScribe AI, Inc.

---

### Appendix C: HHS Breach Portal Submission Guide

**Portal URL:** [https://ocrportal.hhs.gov/ocr/breach/wizard_breach.jsf](https://ocrportal.hhs.gov/ocr/breach/wizard_breach.jsf)

**Account Setup:**
1. First-time users: Create account (organization email required)
2. Verify email address
3. Complete organization profile

**Submission Process:**

**Step 1: Organization Information**
- **Organization Name:** CodeScribe AI, Inc.
- **Organization Type:** Business Associate
- **Address:** [Full mailing address]
- **Contact Person:** Jenni Coleman, Privacy Officer
- **Email:** privacy@codescribeai.com
- **Phone:** [Phone number]

**Step 2: Breach Details**
- **Number of Individuals Affected:** [Exact number]
- **Covered Entity(ies) Involved:** [List all Covered Entities whose PHI was affected]
- **Date of Breach:** [DATE when unauthorized access occurred]
- **Date of Discovery:** [DATE when breach was first known or should have been known]

**Step 3: Type of Breach** (select all that apply)
- [ ] Hacking/IT Incident (unauthorized access to IT systems)
- [ ] Unauthorized Access/Disclosure (by workforce member or other)
- [ ] Theft (physical theft of devices or records)
- [ ] Loss (unintentional loss of devices or records)
- [ ] Improper Disposal (failure to properly destroy PHI)
- [ ] Other: [Describe]

**Step 4: Location of Breached Information** (select all that apply)
- [ ] Network Server
- [ ] Email
- [ ] Laptop
- [ ] Desktop Computer
- [ ] Electronic Medical Record (EMR)
- [ ] Other Portable Electronic Device (USB drive, external hard drive)
- [ ] Paper/Films
- [ ] Other: [Describe]

**Step 5: Types of PHI Involved** (select all that apply)
- [ ] Names
- [ ] Addresses (street, city, county, zip code)
- [ ] Dates (birth, admission, discharge, death, age > 89)
- [ ] Telephone Numbers
- [ ] Fax Numbers
- [ ] Email Addresses
- [ ] Social Security Numbers
- [ ] Medical Record Numbers
- [ ] Health Plan Beneficiary Numbers
- [ ] Account Numbers
- [ ] Certificate/License Numbers
- [ ] Vehicle Identifiers and Serial Numbers
- [ ] Device Identifiers and Serial Numbers
- [ ] Web URLs
- [ ] IP Addresses
- [ ] Biometric Identifiers (fingerprints, voice prints)
- [ ] Full Face Photos
- [ ] Other Unique Identifying Numbers or Codes

**Step 6: Description of Breach** (500-word limit)
[Provide brief narrative covering:]
- How breach occurred (attack vector, vulnerability exploited)
- How it was discovered (automated monitoring, customer report, etc.)
- What systems/data were affected
- Number of individuals and types of PHI involved
- Actions taken to contain and investigate (forensics, law enforcement)
- Safeguards that were in place before breach (encryption, access controls)
- Actions taken to prevent recurrence (security enhancements, training)

**Example:**
> "On January 15, 2026, we discovered unauthorized access to our production database containing patient information. The breach was discovered through automated security monitoring that detected unusual query patterns. Our investigation, conducted with a leading cybersecurity forensics firm, determined that an unauthorized person exploited a software vulnerability to gain access between January 10-15, 2026. The affected database contained names, email addresses, and dates of service for approximately 1,250 individuals across multiple Covered Entities. Social Security Numbers and Medical Record Numbers were not involved. At the time of the breach, the database was encrypted at rest using AES-256-GCM encryption, but the encryption keys may have been compromised. We immediately revoked all database credentials, patched the vulnerability, implemented additional monitoring, and engaged law enforcement. We have implemented enhanced security controls, including multi-factor authentication for all database access and real-time intrusion detection, to prevent future incidents."

**Step 7: Submit**
- Review all information for accuracy
- Acknowledge that submission is a legal notice to HHS
- Submit (cannot be edited after submission)

**Confirmation:**
- Save confirmation email (includes breach report number)
- HHS may contact you for additional information (respond within 10 business days)
- Breach will appear on public HHS "Breach Portal" (Wall of Shame) within 1-2 weeks

**Timeline:**
- Submission deadline: Within 60 days of discovery
- HHS posts breaches on public portal
- OCR may investigate (provide all documentation requested)

---

### Appendix D: Media Notification Template

**[PRESS RELEASE - FOR IMMEDIATE RELEASE]**

**CodeScribe AI Notifies Individuals of Data Security Incident**

[CITY, STATE] - [DATE] - CodeScribe AI, Inc. ("CodeScribe") is notifying approximately [X] individuals whose protected health information may have been involved in a data security incident.

**What Happened:**
On [DISCOVERY DATE], CodeScribe discovered that [brief description - e.g., "an unauthorized person gained access to certain computer systems"]. CodeScribe immediately launched an investigation with the assistance of leading cybersecurity experts.

**What Information Was Involved:**
The investigation determined that the following types of information may have been accessed or acquired by an unauthorized person:
- [List data types - e.g., "Names, email addresses, and dates of service"]
- [Clarify what was NOT involved - e.g., "Social Security Numbers and Medical Record Numbers were NOT involved"]

**Who Was Affected:**
Approximately [X] individuals whose information was in our systems may have been affected. CodeScribe is mailing notification letters to all affected individuals and has established a dedicated call center to answer questions.

**What CodeScribe is Doing:**
CodeScribe has taken the following actions in response to this incident:
- Secured systems and terminated unauthorized access
- Engaged leading cybersecurity firm to conduct comprehensive forensic investigation
- Reported the incident to law enforcement
- Implemented additional security measures to prevent future incidents
- Notified affected individuals and Covered Entity partners

**What Affected Individuals Should Do:**
Affected individuals are encouraged to:
- Monitor their accounts and credit reports for unusual activity
- Consider placing a fraud alert or credit freeze with the three major credit bureaus
- [If applicable: Enroll in complimentary credit monitoring services (details in notification letter)]

**For More Information:**
Affected individuals who have questions may contact CodeScribe at:
- **Toll-Free Call Center:** 1-800-XXX-XXXX (Monday-Friday, 9am-6pm EST)
- **Email:** privacy@codescribeai.com
- **Website:** www.codescribeai.com/breach-notification

**About CodeScribe AI:**
CodeScribe AI is a software company that provides AI-powered code documentation services to healthcare organizations and other industries. Protecting customer information is our highest priority, and we are committed to preventing such incidents in the future.

**Contact:**
Jenni Coleman
Chief Executive Officer
CodeScribe AI, Inc.
jenni@codescribeai.com
[Phone number]

**###**

---

### Appendix E: Breach Notification Checklist

**Use this checklist for every breach to ensure compliance with HIPAA notification requirements.**

#### Discovery and Assessment
- [ ] Potential breach identified and reported to Privacy Officer
- [ ] Discovery date documented (when first known or should have been known)
- [ ] Breach Assessment Team assembled (within 24 hours)
- [ ] Risk assessment initiated (within 48 hours)
- [ ] All 4 HIPAA risk factors analyzed:
  - [ ] Factor 1: Nature and extent of PHI
  - [ ] Factor 2: Unauthorized person (who, intent)
  - [ ] Factor 3: Was PHI actually acquired/viewed?
  - [ ] Factor 4: Extent of mitigation
- [ ] Breach determination made (breach vs. not-a-breach)
- [ ] Risk assessment documented and approved (Privacy Officer + Legal)

#### Covered Entity Notification (Always Required)
- [ ] Covered Entity Privacy/Security Officer identified
- [ ] Notification email drafted (using template)
- [ ] Email sent within 3 business days of discovery
- [ ] Follow-up call scheduled within 24 hours of email
- [ ] Covered Entity acknowledgment received
- [ ] Preliminary risk assessment shared (if available)
- [ ] Covered Entity's questions answered

#### Individual Notification (If Breach Confirmed)
- [ ] List of affected individuals compiled (names, addresses)
- [ ] Notification letter drafted (using template, approved by Legal)
- [ ] Notification method determined (mail, email, substitute notice)
- [ ] Letters sent within 60 calendar days of discovery
- [ ] Proof of mailing retained (certified mail receipts)
- [ ] Call center established (if large breach)
- [ ] Credit monitoring services arranged (if offered)
- [ ] Individuals' questions tracked and answered

#### HHS Notification (If 500+ Individuals)
- [ ] HHS Breach Portal account created/verified
- [ ] Breach report drafted (500-word description)
- [ ] All required fields completed accurately
- [ ] Covered Entities listed (if applicable)
- [ ] Submission completed within 60 calendar days
- [ ] Confirmation email saved
- [ ] Breach Portal posting monitored (appears within 1-2 weeks)

#### Media Notification (If 500+ in Same State)
- [ ] States with 500+ affected individuals identified
- [ ] Press release drafted (using template, approved by Legal/CEO)
- [ ] Media outlets in affected states identified
- [ ] Press release distributed within 60 calendar days
- [ ] Press release posted on CodeScribe website
- [ ] Media inquiries tracked and responded to

#### Documentation and Recordkeeping
- [ ] Breach incident number assigned (BR-YYYY-NNNN)
- [ ] All notifications saved (Covered Entity, individuals, HHS, media)
- [ ] Risk assessment documentation filed
- [ ] Forensic reports saved
- [ ] Proof of notification saved (mail receipts, email confirmations)
- [ ] Breach log updated (if < 500 individuals)
- [ ] All documents stored securely (6-year retention)

#### Follow-Up
- [ ] Covered Entity updated on investigation progress
- [ ] Final incident report provided to Covered Entity
- [ ] Post-incident review completed (within 5 business days of closure)
- [ ] Lessons learned documented
- [ ] Preventative action items tracked

---

**Document Version:** 1.0 (Draft - Requires Legal Approval)
**Last Updated:** January 27, 2026
**Next Review:** February 27, 2026 (monthly until approved)

**Document Owner:** Privacy Officer (Jenni Coleman)
**Approvers:** CEO, Legal Counsel

---

**For breach notification questions, contact:**
- **Privacy Officer:** Jenni Coleman (jenni@codescribeai.com, +1-555-123-4567)
- **Legal Counsel:** [External Attorney Contact]
- **Security Team:** security@codescribeai.com

---

## Summary

This Breach Notification Procedure provides a comprehensive framework for determining whether a security incident constitutes a HIPAA breach and fulfilling all notification obligations.

**Key Components:**
- Breach definition and exceptions
- 4-factor risk assessment process (HIPAA § 164.402)
- Decision matrix for breach determination
- Notification requirements (Covered Entity, individuals, HHS, media)
- Timeline requirements (3 business days to CE, 60 calendar days to others)
- Notification content requirements
- Breach log and documentation
- Templates for all notification types

**Critical Deadlines:**
- **Covered Entity:** Within 3 business days (CodeScribe standard)
- **Individuals:** Within 60 calendar days
- **HHS (if 500+):** Within 60 calendar days
- **Media (if 500+ in state):** Within 60 calendar days

**Next Steps:**
1. Review and customize procedure for CodeScribe's BAA obligations
2. Obtain legal counsel and executive approval
3. Train Privacy Officer and Incident Response Team
4. Integrate with Incident Response Plan
5. Conduct tabletop exercise (breach scenario)

**⚠️ This is a draft procedure that requires legal approval before use.**

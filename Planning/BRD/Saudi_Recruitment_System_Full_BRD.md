# Business Requirements Document (BRD)
# Saudi Recruitment & Employment Readiness Platform
# منصة التوظيف والجاهزية الوظيفية في المملكة العربية السعودية

**Version:** 2.0  
**Date:** 2026-08-04  
**Status:** Detailed Draft for Product, Legal, Compliance, and Technical Review  
**Owner:** YusufMohamed-tech  
**Primary market:** Kingdom of Saudi Arabia  
**Primary language:** Arabic (RTL)  
**Secondary language:** English (LTR)  
**Document type:** Product and business requirements; not legal advice  

---

## 0. Document Control

### 0.1 Purpose

This BRD defines the complete requirements for replacing the current internal recruitment module with a Saudi-ready, multi-tenant recruitment, applicant tracking, employment-compliance, preboarding, onboarding, and probation platform.

The platform must support the complete journey from workforce demand to a confirmed employee without incorrectly treating an accepted offer as a completed hire.

```text
Workforce Need
→ Job Requisition
→ Saudi Compliance Review
→ Approval
→ Job Publishing
→ Candidate Application
→ Screening and Selection
→ Offer
→ Employment Compliance
→ Qiwa Contract Documentation
→ Government and Payroll Readiness
→ Joining
→ Onboarding
→ Probation
→ Confirmation
```

### 0.2 Regulatory Position

This document translates operational requirements into product requirements. It must be reviewed by qualified Saudi legal, labour, privacy, payroll, and government-relations specialists before production use.

The product must not hard-code a legal interpretation as permanent truth. Localization decisions, occupational restrictions, minimum counting salaries, establishment eligibility rules, and government procedures can change. All compliance rules must therefore be:

- Configurable.
- Versioned.
- Effective-date controlled.
- Traceable to an official source.
- Reviewable by an authorized compliance officer.
- Capable of producing a manual-review result instead of an automatic legal conclusion.

### 0.3 Superseded Document

This version supersedes the earlier **Sabbar-Style Recruitment Platform BRD v1.0** while retaining its strongest requirements: public careers portal, ATS, requisitions, interviews, candidate communication, offers, talent pools, analytics, and HR employee conversion.

### 0.4 Key Correction

The product shall enforce the following principle:

```text
Offer Accepted ≠ Active Employee
```

An accepted offer creates a **preboarding hire case**. Activation as an employee occurs only after required compliance, contract, government, payroll, and joining gates are satisfied.

---

## 1. Executive Summary

The platform will be the organization’s primary talent-acquisition and employment-readiness system for Saudi Arabia. It will combine three connected engines:

1. **Recruitment Engine** — requisitions, job publishing, candidate sourcing, ATS, assessments, interviews, selection, and offers.
2. **Saudi Compliance Engine** — Saudization/Nitaqat-aware review, occupational localization controls, Saudi/non-Saudi workflow branching, professional verification, Qiwa contract tracking, work authorization, transfer/visa case tracking, and compliance evidence.
3. **Joining Engine** — GOSI/payroll/insurance readiness, Wage Protection alignment, preboarding tasks, joining confirmation, onboarding, probation, and quality-of-hire analytics.

The platform will provide an Arabic-first public candidate experience and a secure internal workspace for recruiters, hiring managers, HR, finance, compliance, government relations, IT, facilities, and executives.

The system is not intended to replace Qiwa, GOSI, Jadarat, Mudad, Ajeer, Musaned, or other government systems of record. It will integrate where authorized and technically available, and otherwise provide controlled manual workflows, deep links, evidence uploads, reference-number tracking, reconciliation, and audit trails.

---

## 2. Business Context and Problem Statement

### 2.1 Current State

The existing recruitment module provides:

- Job posting creation with a custom form builder.
- A basic Kanban pipeline.
- Application review.
- Interview scheduling.
- Applicant score and notes.
- One-click conversion to an employee.
- Public application page through a direct slug.
- Reusable job templates.

### 2.2 Current Gaps

| ID | Gap | Business Impact |
|---|---|---|
| G-01 | No public searchable careers portal | Weak candidate discovery and employer brand |
| G-02 | No workforce requisition and budget governance | Uncontrolled hiring and weak auditability |
| G-03 | No Saudi compliance gate before publishing or selection | Risk of hiring into restricted or non-compliant roles |
| G-04 | Accepted offer immediately becomes employee | Incorrect legal and operational state |
| G-05 | No Saudi/non-Saudi workflow branching | Expatriate transfer, visa, permit, and verification cases cannot be controlled |
| G-06 | No Qiwa contract tracking | Internal offer may differ from documented employment contract |
| G-07 | No GOSI/payroll/insurance readiness gate | Employees may join without complete setup |
| G-08 | No candidate profile across applications | Duplicate records and lost talent-pool value |
| G-09 | No structured collaboration | Slow decisions and missing accountability |
| G-10 | No automated communication | Poor candidate experience and recruiter workload |
| G-11 | No offer approval/versioning | Compensation and commitment risks |
| G-12 | No PDPL lifecycle controls | Privacy, retention, access, and transfer risks |
| G-13 | No joining, onboarding, or probation workflow | No control after offer acceptance |
| G-14 | No quality-of-hire analytics | Recruitment success measured only by offers or hires |
| G-15 | No government-process evidence and reconciliation | Weak compliance proof and manual spreadsheet dependency |

### 2.3 Business Opportunity

A Saudi-ready platform can differentiate from ordinary ATS products by treating recruitment as an **employment-readiness journey**, not merely a CV pipeline. The system can reduce hiring delay, prevent non-compliant offers, improve visibility, protect candidate data, and provide an auditable bridge between internal hiring decisions and external government platforms.

---

## 3. Product Vision and Design Principles

### 3.1 Vision

> Build the most operationally complete Arabic-first recruitment and employment-readiness platform for Saudi private-sector organizations.

### 3.2 Design Principles

1. **Compliance before convenience** — destructive or legally sensitive transitions require gates and evidence.
2. **Arabic-first, bilingual by design** — Arabic RTL is the primary experience; English is fully supported.
3. **Human accountability** — AI assists; authorized humans decide.
4. **Progressive data collection** — collect only the data needed at each stage.
5. **Government systems remain authoritative** — internal statuses must be reconcilable with official records.
6. **No silent blocking** — uncertain compliance produces manual review, not hidden rejection.
7. **Every decision is explainable** — approvals, scores, rejections, overrides, and changes are auditable.
8. **Configuration over hard-coding** — policies vary by organization, profession, activity, establishment, and date.
9. **Candidate dignity** — clear communication, accessible applications, correction rights, and respectful rejection.
10. **Multi-tenant isolation** — every organization’s candidates, files, settings, and analytics are isolated.

---

## 4. Business Goals and Success Metrics

### 4.1 Goals

| ID | Goal | Target Direction |
|---|---|---|
| BG-01 | Reduce time-to-fill | Down |
| BG-02 | Reduce recruiter manual administration | Down |
| BG-03 | Increase offer acceptance | Up |
| BG-04 | Increase accepted-offer-to-join conversion | Up |
| BG-05 | Prevent non-compliant job publication and hiring | Near zero preventable incidents |
| BG-06 | Improve candidate satisfaction | Up |
| BG-07 | Improve audit readiness | Up |
| BG-08 | Reduce duplicate candidate records | Down |
| BG-09 | Increase reuse of qualified talent pools | Up |
| BG-10 | Measure probation success and early attrition | Complete visibility |

### 4.2 Core KPIs

- Time to approve requisition.
- Time to publish.
- Time to first qualified candidate.
- Time to shortlist.
- Time to offer.
- Time to fill.
- Offer acceptance rate.
- Accepted-offer-to-join rate.
- No-show rate.
- Compliance-block rate.
- Compliance-review turnaround time.
- Qiwa contract turnaround time.
- Government-readiness turnaround time.
- Saudization impact by requisition and hire.
- Source-to-qualified-candidate conversion.
- Source-to-hire conversion.
- Cost per hire.
- Candidate withdrawal rate.
- Interview-to-offer conversion.
- Probation confirmation rate.
- 90/180-day early attrition.
- Quality-of-hire score.
- Candidate privacy-request completion time.

### 4.3 Initial Product Targets

Targets shall be baselined using current organizational performance before contractual commitments. Illustrative objectives:

- Reduce median time-to-fill by at least 30% after stabilization.
- Reduce manual status-follow-up messages by at least 50%.
- Ensure 100% of offers have approval and version history.
- Ensure 100% of sensitive candidate-file access is logged.
- Ensure 100% of active employees created from recruitment have a joining confirmation.
- Ensure 100% of legal/compliance overrides include reason, evidence, approver, and expiry where applicable.

---

## 5. Scope

### 5.1 In Scope

- Multi-tenant organization and establishment configuration.
- Workforce planning and job requisitions.
- Configurable approval workflows.
- Saudi compliance pre-check and case management.
- Public careers portal.
- Job posting management and templates.
- Sourcing and channel attribution.
- Jadarat workflow support.
- Candidate profiles and applications.
- Duplicate detection and controlled merge.
- ATS Kanban and list views.
- Screening, assessments, interviews, and selection.
- Candidate communications.
- Talent pools and employee referrals.
- Offer generation, approval, e-acceptance, negotiation, and versioning.
- Saudi candidate employment-readiness workflow.
- Non-Saudi resident transfer workflow.
- Overseas non-Saudi recruitment workflow.
- Professional verification and professional licence tracking.
- Qiwa contract documentation tracking and reconciliation.
- Work permit, visa, profession, and government-process task tracking.
- GOSI, payroll, bank, insurance, and Wage Protection readiness tracking.
- Preboarding, onboarding, joining, and probation.
- Analytics, dashboards, exports, and audit evidence.
- PDPL privacy notices, consent where applicable, retention, rights requests, and breach workflow.
- Role-based access control and segregation of duties.
- API, webhook, import/export, and manual-integration modes.
- Migration from the current recruitment module.

### 5.2 Out of Scope for Initial Release

- Replacing Qiwa, GOSI, Mudad, Jadarat, Ajeer, Musaned, Absher, or visa systems.
- Acting as an immigration or legal-advice service.
- Fully autonomous candidate rejection by AI.
- Consumer domestic-worker recruitment through Musaned.
- Payroll calculation engine.
- Benefits administration engine.
- Full learning-management system.
- Full performance-management system beyond probation.
- Background-check vendor operations unless separately integrated.
- Native iOS/Android applications.

### 5.3 Optional Future Scope

- Marketplace connecting employers and licensed recruitment agencies.
- Candidate mobile application.
- WhatsApp Business integration.
- Interview transcription and structured summaries with consent.
- Workforce demand forecasting.
- Internal mobility and succession planning.
- University and graduate-program management.
- Seasonal staffing and Ajeer permit workflows.
- Recruitment agency portal and vendor scorecards.

---

## 6. Regulatory and Operational Context

### 6.1 Government and External Platforms

| Platform / Authority | Product Relevance |
|---|---|
| HRSD | Labour rules, localization decisions, work services, regulatory guidance |
| Qiwa | Contract documentation, employee transfer, work permits, profession services, selected establishment services |
| Jadarat | National employment platform for Saudi job opportunities and candidate access |
| GOSI | Social-insurance contributor and wage-related employer services |
| Mudad / Wage Protection | Wage-file and wage-compliance processes |
| Professional Verification / Accreditation | Qualification, experience, and skill verification for applicable expatriate professions |
| Ajeer | Temporary-work permits and workforce arrangements |
| Musaned | Domestic-worker recruitment and contracts; separate product domain |
| Sector regulators | Professional licences and accreditations for regulated professions |
| SDAIA / National Data Governance Platform | PDPL guidance, controller obligations, data-subject rights, and breach reporting |

### 6.2 Product Treatment of Regulatory Rules

Each rule record shall include:

- Rule code.
- Rule category.
- Arabic and English title.
- Description.
- Applicable activity.
- Applicable establishment size/category.
- Applicable occupation codes.
- Applicable nationality or residency class.
- Minimum salary or counting condition where relevant.
- Required percentage or threshold where relevant.
- Effective-from date.
- Effective-to date.
- Grace period.
- Official source URL.
- Source publication date.
- Last reviewed date.
- Reviewer.
- Automation level.
- Confidence level.
- Manual override permission.

### 6.3 Compliance Output Types

```text
PASS
PASS_WITH_WARNING
MANUAL_REVIEW_REQUIRED
BLOCKED
OVERRIDE_PENDING
OVERRIDE_APPROVED
NOT_APPLICABLE
DATA_INCOMPLETE
RULE_STALE
```

The platform shall never present an automated compliance result as legal advice.

---

## 7. Stakeholders and Personas

| Persona | Main Responsibilities | Typical Access |
|---|---|---|
| Candidate | Discover jobs, apply, submit documents, schedule interviews, respond to offers, complete preboarding | Own profile and applications only |
| Employee Referrer | Submit and track referrals | Own referrals only |
| Hiring Manager | Request headcount, review shortlist, interview, select, prepare onboarding | Own department/requisitions |
| Recruiter | Publish roles, source, screen, coordinate, communicate, manage pipeline | Assigned jobs/candidates |
| Senior Recruiter / Recruitment Lead | Allocate work, approve recruiter actions, monitor SLA | Recruitment-wide |
| HR Manager | Approve requisitions/offers, oversee policy and analytics | HR-wide |
| HR Business Partner | Workforce planning, department support, approvals | Assigned business units |
| Saudization / Compliance Officer | Review localization, occupational eligibility, evidence, overrides | Compliance data |
| Government Relations Officer | Manage Qiwa, transfer, visa, work permit, profession, and government references | Government cases |
| Finance / Compensation | Approve budgets, salary bands, allowances, cost centers | Compensation and budget fields |
| Payroll Officer | Configure payroll readiness and wage components | Hired/preboarding cases |
| IT | Provision email, equipment, and access | Assigned onboarding tasks only |
| Facilities / Security | Workspace, badge, site access | Assigned onboarding tasks only |
| Interviewer | View relevant candidate package and submit scorecard | Assigned interviews only |
| Executive Approver | Approve strategic or high-cost requisitions/offers | Approval package only |
| Privacy Officer / DPO | Privacy notices, rights requests, retention, breach response | Privacy administration |
| Auditor | Read-only evidence and immutable history | Scoped read-only |
| Tenant Administrator | Configure organization settings, roles, templates, integrations | Tenant administration |
| Platform Super Admin | Operate SaaS platform without default access to tenant candidate content | Platform operations |

---

## 8. Complete End-to-End Business Flow

### 8.1 Master Flow

```text
1. Workforce Need Identified
2. Job Requisition Drafted
3. Budget and Headcount Validation
4. Saudi Compliance Pre-Check
5. Approval Chain Completed
6. Job Posting Created
7. Job Published to Selected Channels
8. Candidate Applies or Is Sourced
9. Identity and Duplicate Checks
10. Eligibility Screening
11. Recruiter Screening
12. Assessment and/or Hiring Manager Review
13. Interviews
14. Final Selection
15. Pre-Offer Checks
16. Offer Approval
17. Offer Sent and Negotiated
18. Offer Accepted
19. Preboarding Hire Case Created
20. Saudi / Non-Saudi Compliance Branch
21. Qiwa Contract Documented
22. Government, GOSI, Payroll, Bank, and Insurance Readiness
23. Ready-to-Join Approval
24. Candidate Joins
25. Employee Activated
26. Onboarding Tasks Completed
27. Probation Reviews
28. Employee Confirmed, Extended, Transferred, or Exited
29. Quality-of-Hire Analytics Updated
```

### 8.2 Gate Model

A stage transition may require one or more gate types:

- Required field gate.
- Approval gate.
- Compliance gate.
- Document gate.
- External reference gate.
- Payment/budget gate.
- Candidate action gate.
- Date/time gate.
- Segregation-of-duties gate.
- Joining confirmation gate.

### 8.3 Candidate Branch Classification

At or before offer preparation, each selected candidate must be classified as one of:

```text
SAUDI_CITIZEN
GCC_CITIZEN
NON_SAUDI_RESIDENT_TRANSFER
NON_SAUDI_RESIDENT_NO_TRANSFER
NON_SAUDI_OVERSEAS
SPECIAL_AUTHORIZATION
TEMPORARY_AJEER
OTHER_MANUAL_REVIEW
```

The classification determines required tasks, documents, approvals, and external processes.

---

## 9. State Models

### 9.1 Requisition Statuses

```text
DRAFT
PENDING_BUDGET_REVIEW
PENDING_COMPLIANCE_REVIEW
PENDING_APPROVAL
CHANGES_REQUESTED
APPROVED
APPROVED_WITH_CONDITIONS
REJECTED
POSTING_IN_PROGRESS
OPEN
ON_HOLD
FILLED
CLOSED
CANCELLED
```

### 9.2 Job Posting Statuses

```text
DRAFT
COMPLIANCE_REVIEW
READY_TO_PUBLISH
SCHEDULED
PUBLISHED
PAUSED
CLOSED
ARCHIVED
CANCELLED
```

### 9.3 Application Pipeline Statuses

```text
APPLIED
DATA_INCOMPLETE
ELIGIBILITY_REVIEW
RECRUITER_SCREENING
SHORTLISTED
ASSESSMENT
HIRING_MANAGER_REVIEW
INTERVIEW_1
INTERVIEW_2
FINAL_INTERVIEW
FINAL_REVIEW
SELECTED
RESERVE
PRE_OFFER_CHECKS
OFFER_APPROVAL
OFFER_SENT
OFFER_NEGOTIATION
OFFER_ACCEPTED
OFFER_DECLINED
OFFER_EXPIRED
OFFER_WITHDRAWN
EMPLOYMENT_COMPLIANCE
CONTRACT_DOCUMENTATION
READY_TO_JOIN
JOINED
ONBOARDING
PROBATION
CONFIRMED
REJECTED
WITHDRAWN
NO_SHOW
CANCELLED
TALENT_POOL
HIRED_FOR_ANOTHER_ROLE
```

### 9.4 Employment-Readiness Statuses

```text
NOT_STARTED
PREBOARDING_CASE_CREATED
IDENTITY_PENDING
COMPLIANCE_PENDING
GOVERNMENT_PROCESS_PENDING
QIWA_CONTRACT_PENDING
QIWA_EMPLOYEE_ACTION_PENDING
QIWA_AMENDMENT_PENDING
QIWA_DOCUMENTED
GOSI_PENDING
PAYROLL_PENDING
BANK_PENDING
INSURANCE_PENDING
ONBOARDING_TASKS_PENDING
READY_TO_JOIN_REVIEW
READY_TO_JOIN
JOINING_DELAYED
JOINED
ACTIVATED
CANCELLED
FAILED
```

### 9.5 Government Case Statuses

```text
NOT_REQUIRED
NOT_STARTED
INTERNAL_PREPARATION
SUBMITTED_EXTERNALLY
PENDING_EXTERNAL_ACTION
PENDING_CANDIDATE_ACTION
PENDING_EMPLOYER_ACTION
MORE_INFORMATION_REQUIRED
APPROVED
REJECTED
EXPIRED
CANCELLED
COMPLETED
RECONCILIATION_REQUIRED
```

### 9.6 Offer Statuses

```text
DRAFT
PENDING_APPROVAL
CHANGES_REQUESTED
APPROVED
SENT
VIEWED
NEGOTIATION_REQUESTED
REVISED
ACCEPTED
DECLINED
EXPIRED
WITHDRAWN
SUPERSEDED
```

---

## 10. Functional Requirements

### 10.1 Organization and Establishment Configuration

#### FR-ORG-001 Organization Profile

The system shall store:

- Legal and display names in Arabic and English.
- Commercial registration details.
- Unified number where applicable.
- Main activity and sub-activities.
- Headquarters and branches.
- Time zone and calendar.
- Primary currency.
- Default language.
- Brand settings.
- Privacy-controller information.
- Authorized government-relations contacts.

#### FR-ORG-002 Establishment Records

Each establishment/branch shall support:

- Establishment identifier.
- Location.
- Activity.
- Current operational status.
- Current compliance category/snapshot.
- Work-permit and licence status indicators.
- Wage Protection readiness indicator.
- Government platform reference values.
- Last reconciliation date.
- Data source and evidence.

#### FR-ORG-003 Compliance Snapshot

Authorized users shall create/import a dated compliance snapshot containing the values required for recruitment decisions. Historical snapshots must remain immutable after certification.

#### FR-ORG-004 Multi-Tenant Isolation

All business entities must include `org_id`. Establishment and branch data must additionally include `establishment_id` or `branch_id` where relevant.

### 10.2 Workforce Planning and Job Requisitions

#### FR-REQ-001 Create Requisition

A hiring manager, recruiter, HRBP, or permitted user can create a requisition with:

- Arabic and English job titles.
- Internal position title and public title.
- Saudi occupational classification code.
- Department, branch, and cost center.
- Hiring manager.
- Headcount.
- New or replacement position.
- Replacement employee reference where permitted.
- Business justification.
- Employment type.
- Workplace mode.
- Expected start date.
- Contract duration.
- Salary band and allowances.
- Budget source.
- Target nationality strategy.
- Required education, experience, skills, and licences.
- Shift and working-hour details.
- Travel or relocation requirements.
- Confidentiality level.

#### FR-REQ-002 Draft and Collaboration

The requisition can be saved as draft, commented on, mentioned, assigned, and returned for changes without losing version history.

#### FR-REQ-003 Headcount Validation

The system shall compare the requisition with approved headcount and budget. Unbudgeted hiring must trigger an additional approval path.

#### FR-REQ-004 Replacement Controls

Replacement requisitions shall not expose confidential employee information to unauthorized approvers. The system shall record whether the incumbent has resigned, is under notice, or is subject to a confidential replacement plan.

#### FR-REQ-005 Requisition Closure

A requisition may close as filled, partially filled, cancelled, expired, or no longer required. Remaining headcount must be explicit.

### 10.3 Saudi Compliance Pre-Check

#### FR-CMP-001 Mandatory Pre-Publish Check

A requisition cannot become publishable until a compliance check returns `PASS`, `PASS_WITH_WARNING`, or an authorized override.

#### FR-CMP-002 Saudization/Nitaqat-Aware Assessment

The engine shall evaluate available organization data and rule configuration to estimate:

- Current localization position.
- Expected effect of hiring a Saudi candidate.
- Expected effect of hiring a non-Saudi candidate.
- Establishment-level eligibility warnings.
- Missing or stale compliance data.

The result must be labelled as an estimate unless confirmed from an authoritative integration.

#### FR-CMP-003 Profession Localization Check

The engine shall determine whether the selected occupation is:

- Reserved for Saudi nationals.
- Subject to a localization percentage.
- Subject to a counting-salary condition.
- Subject to establishment-size thresholds.
- Subject to activity or regional conditions.
- Subject to professional licensing.
- Subject to a future effective date or grace period.

#### FR-CMP-004 Occupation-Code Validation

Public and internal job titles must map to an approved occupation code. Free-text titles may be used for display, but compliance evaluation must use the standardized code.

#### FR-CMP-005 Candidate-Specific Recheck

Compliance must be recalculated when a final candidate is selected because nationality, salary, licence status, residence status, and branch assignment may change the result.

#### FR-CMP-006 Stale Rule Detection

If a compliance rule has passed its review date or lacks a valid source, the system shall return `RULE_STALE` or `MANUAL_REVIEW_REQUIRED`.

#### FR-CMP-007 Compliance Override

Overrides require:

- Reason code.
- Detailed justification.
- Evidence attachment.
- Requester.
- Independent approver.
- Expiry/effective period where applicable.
- Immutable audit history.

#### FR-CMP-008 Compliance Case Workspace

Compliance users shall have a queue showing cases by severity, SLA, establishment, profession, candidate, and required action.

### 10.4 Approval Workflow

#### FR-APR-001 Configurable Chains

Approval chains can depend on:

- Salary and total package.
- Grade.
- Department.
- Branch.
- New vs replacement position.
- Budget status.
- Saudi vs non-Saudi strategy.
- Executive or confidential role.
- Permanent, temporary, or contractor status.

#### FR-APR-002 Approval Actions

Approvers can approve, reject, request changes, delegate, abstain for conflict, or request more information.

#### FR-APR-003 Sequential and Parallel Approval

The platform shall support sequential, parallel, unanimous, majority, and any-one approval groups.

#### FR-APR-004 Escalation

Pending approvals can be reminded and escalated based on configurable SLA.

#### FR-APR-005 Segregation of Duties

The system shall prevent prohibited combinations, such as the offer creator being the sole approver above a configured threshold.

### 10.5 Job Posting Management

#### FR-JOB-001 Create Posting

A posting must normally originate from an approved requisition. Direct creation requires a permission and reason.

#### FR-JOB-002 Posting Fields

- Arabic and English title.
- Job summary.
- Responsibilities.
- Required qualifications.
- Preferred qualifications.
- Skills.
- Experience.
- City and branch.
- Workplace mode.
- Employment type.
- Contract duration where public.
- Salary visibility.
- Benefits.
- Working schedule.
- Application deadline.
- Number of vacancies.
- Accessibility/accommodation statement.
- Privacy notice reference.
- Screening questions.
- Required documents.

#### FR-JOB-003 Templates

Templates shall support organization, department, job family, and occupation-code ownership, with versioning and approval.

#### FR-JOB-004 Form Builder

Question types:

- Short text.
- Long text.
- Single select.
- Multi-select.
- Yes/no.
- Number.
- Date.
- File upload.
- Rating.
- Address/location.
- Consent/acknowledgement.
- Conditional section.

Questions may be mandatory, conditional, scored, disqualifying, private, or candidate-visible after submission.

#### FR-JOB-005 Preview and Validation

Before publishing, the system shall show Arabic and English previews, mobile preview, missing translation warnings, privacy validation, and compliance status.

### 10.6 Publishing and Sourcing

#### FR-SRC-001 Public Portal Publishing

Approved jobs can be published immediately or scheduled.

#### FR-SRC-002 Channel Selection

Supported channels may include:

- Organization careers portal.
- Internal employee portal.
- Jadarat.
- LinkedIn.
- Bayt.
- Other job boards.
- University portals.
- Recruitment agencies.
- Social campaigns.
- Job fairs and QR codes.
- Employee referrals.
- Direct sourcing.

#### FR-SRC-003 Integration Modes

Each channel supports one or more:

```text
DIRECT_API
AUTHORIZED_CONNECTOR
CSV_EXPORT_IMPORT
DEEPLINK
MANUAL_TRACKING
AGENCY_SUBMISSION
```

#### FR-SRC-004 Jadarat Support

The product shall use the correct name **Jadarat / جدارات**. It shall support opportunity-reference tracking, publishing status, applicant-source attribution, and reconciliation. Direct integration is subject to official access and authorization.

#### FR-SRC-005 Attribution

Every application shall record first-touch source, last-touch source, campaign, UTM values, referral, agency, event, and manual correction history.

#### FR-SRC-006 Agency Portal

Authorized agencies may submit candidates to assigned vacancies, view only their submissions, and receive structured feedback. Duplicate ownership disputes require a configurable policy.

### 10.7 Public Careers Portal

#### FR-PORT-001 Job Board

`/careers` shall provide:

- Arabic-first responsive layout.
- Keyword search.
- Department, city, workplace mode, employment type, and job-family filters.
- Accessible job cards.
- Share actions.
- Saved search or job alert in a later phase.

#### FR-PORT-002 Job Detail

`/careers/{slug}` shall display the approved public content, closing date, location, employment type, accessibility information, privacy notice, and application CTA.

#### FR-PORT-003 Branding

Tenant-specific logo, colors, banner, company information, social links, and custom domain may be configured.

#### FR-PORT-004 SEO and Structured Data

Public jobs should support metadata, canonical URLs, sitemap inclusion, and job-posting structured data where appropriate.

#### FR-PORT-005 Accessibility

Public pages must meet WCAG 2.2 AA target, support keyboard navigation, logical focus, screen readers, scalable text, and accessible errors.

### 10.8 Candidate Registration and Application

#### FR-CAN-001 Guest Application

Candidates may apply without creating a password. A secure magic-link account can be offered after submission.

#### FR-CAN-002 Minimum Initial Data

Initial application should collect only what is required, normally:

- Name.
- Email.
- Mobile.
- Current city/country.
- CV.
- Vacancy-specific answers.
- Privacy acknowledgement.

Sensitive identity documents must not be collected at this stage unless necessary and approved.

#### FR-CAN-003 Progressive Profile

Additional data is requested by stage:

```text
Application → Minimum contact and qualification data
Shortlist → Availability and work-eligibility data
Selection → Identity, licence, and official evidence
Preboarding → Government, bank, insurance, and joining data
```

#### FR-CAN-004 Candidate Profile

A candidate profile aggregates applications, source history, skills, experience, education, documents, interviews, assessments, offers, communications, privacy preferences, and rights requests.

#### FR-CAN-005 Candidate Self-Service

Candidates can:

- Track application status at an appropriate level.
- Update allowed profile fields.
- Upload requested documents.
- Schedule or reschedule interviews.
- Respond to offers.
- Complete preboarding forms.
- Withdraw an application.
- Submit privacy requests.

#### FR-CAN-006 Application Confirmation

On successful submission, the candidate receives an application reference, confirmation, expected next step, and privacy information.

#### FR-CAN-007 Save and Resume

Long applications can be saved and resumed securely.

#### FR-CAN-008 Accommodation Request

Candidates may voluntarily request recruitment-process accommodation. Access must be restricted and the information must not influence unrelated evaluation.

### 10.9 Duplicate Detection and Identity Resolution

#### FR-DUP-001 Detection Signals

Potential duplicates can be identified using:

- Normalized email.
- Normalized phone.
- Candidate-provided identifiers collected at later stages.
- Name and date of birth where available.
- CV/document fingerprint.
- Similar employment history.

#### FR-DUP-002 No Automatic Destructive Merge

The system must not automatically merge candidates when confidence is uncertain.

#### FR-DUP-003 Merge Workflow

Authorized users can compare, merge, keep separate, or request verification. Merge actions must preserve source, application, consent, and audit histories.

#### FR-DUP-004 Identity Verification

Where identity verification is required, the platform shall record method, result, verifier, date, evidence reference, and expiry without unnecessarily exposing full identifiers.


### 10.10 Eligibility Screening and AI-Assisted Matching

#### FR-SCR-001 Rule-Based Eligibility

The system shall support mandatory, preferred, and informational criteria, including:

- Nationality eligibility where lawful and required.
- Saudi-only occupation restrictions.
- Location and relocation willingness.
- Minimum education.
- Minimum relevant experience.
- Mandatory licence/certificate.
- Shift availability.
- Language requirements.
- Work authorization.
- Notice period.
- Salary alignment.

#### FR-SCR-002 Screening Outcomes

```text
ELIGIBLE
POTENTIALLY_ELIGIBLE
INFORMATION_MISSING
MANUAL_REVIEW
INELIGIBLE
COMPLIANCE_BLOCKED
```

A parser failure or missing CV field shall not automatically equal ineligibility.

#### FR-SCR-003 CV Parsing

The system may extract:

- Education.
- Employers and positions.
- Employment dates.
- Total and relevant experience.
- Skills.
- Certifications.
- Languages.
- Location.
- Portfolio links.

The raw CV remains the source document. Parsed values must be editable or correctable with provenance.

#### FR-SCR-004 Explainable Match Score

A configurable score may combine job-related criteria. Recruiters must see the component breakdown and source evidence.

Example:

```text
Mandatory requirements       Pass
Relevant skills              28/35
Relevant experience          21/25
Education                    10/10
Licences                      8/10
Location and availability     7/10
Languages                     8/10
Total                         82/100
```

#### FR-SCR-005 AI Restrictions

AI shall not:

- Make the final hiring decision.
- Automatically reject based solely on inferred traits.
- infer nationality, religion, health, disability, family status, or other sensitive characteristics from names, photos, or text.
- Use protected or irrelevant personal characteristics in ranking.
- Fabricate candidate qualifications.

#### FR-SCR-006 Human Review

Every AI recommendation must show confidence, explanation, data used, model/version, and a human override option.

#### FR-SCR-007 Bias and Quality Monitoring

The platform shall support periodic evaluation of scoring accuracy, false negatives, recruiter overrides, and disproportionate outcomes using legally approved aggregated analysis.

### 10.11 Recruiter Workspace and ATS

#### FR-ATS-001 Kanban View

The board shall support configurable stages, counts, drag/drop with gate validation, SLA indicators, assignees, score badges, compliance badges, interview state, and next action.

#### FR-ATS-002 List View

The table shall support search, sorting, filters, saved views, bulk actions, exports, and column permissions.

#### FR-ATS-003 Candidate Detail Workspace

Tabs:

- Overview.
- CV and profile.
- Application answers.
- Eligibility and AI explanation.
- Assessments.
- Interviews and scorecards.
- Communications.
- Notes and collaboration.
- Offer.
- Compliance.
- Government processes.
- Documents.
- Activity and audit history.
- Privacy status.

#### FR-ATS-004 Assignments

Applications and jobs can be assigned to recruiters, coordinators, sourcers, HRBPs, and compliance owners.

#### FR-ATS-005 Collaboration

Support comments, internal notes, mentions, tasks, attachments, reactions, and decision requests. Internal content is never candidate-visible unless explicitly converted to a message.

#### FR-ATS-006 Structured Rejection

Rejection requires a reason category. Candidate-facing wording may differ from the internal reason. Sensitive notes must not appear in candidate communications.

#### FR-ATS-007 Bulk Actions

Bulk operations must show affected records, validate each record independently, and produce a result report. High-risk actions require elevated permission.

#### FR-ATS-008 SLA Management

The system shall track time in stage, overdue actions, aging candidates, and recruiter workload.

### 10.12 Talent Pools, Referrals, and Sourcing CRM

#### FR-TAL-001 Talent Pools

Users can create dynamic or static pools based on skills, occupation, location, experience, availability, source, or prior outcome.

#### FR-TAL-002 Do Not Contact

Candidates may be marked `DO_NOT_CONTACT` through their request or an authorized privacy action. This is separate from hiring restrictions.

#### FR-TAL-003 Restricted Review

A candidate restriction record shall require a reason, owner, approver, visibility scope, evidence, review date, and expiry. Future applications are flagged for authorized review rather than silently discarded.

#### FR-TAL-004 Employee Referral

Employees can refer candidates, disclose relationship where required, and track high-level status. Referral rewards are tracked but paid by payroll or another system.

#### FR-TAL-005 Consent/Notice for Talent Reuse

The platform shall provide the applicable notice and preference controls before reusing candidate data for future opportunities.

#### FR-TAL-006 Sourcing Outreach

Recruiters can create outreach sequences, but marketing-like communications must respect channel preferences, legal basis, opt-out, and do-not-contact status.

### 10.13 Assessments

#### FR-ASM-001 Assessment Types

- Technical test.
- Coding challenge.
- Language test.
- Cognitive assessment.
- Case study.
- Work sample.
- Sales simulation.
- Data-entry/typing test.
- Behavioural assessment.
- Video questions where approved.

#### FR-ASM-002 Assessment Configuration

Store provider, instructions, deadline, attempts, duration, passing score, accommodation, proctoring method, and scoring rules.

#### FR-ASM-003 Assessment Statuses

```text
DRAFT
INVITED
DELIVERED
STARTED
COMPLETED
PASSED
FAILED
MANUAL_REVIEW
EXPIRED
CANCELLED
```

#### FR-ASM-004 Integrity and Accommodation

Fraud indicators must be treated as review signals, not automatic guilt. Approved accommodations must be documented and access restricted.

#### FR-ASM-005 Provider Integration

Provider results must include candidate mapping, assessment version, score, completion time, raw report reference, and synchronization status.

### 10.14 Interview Management

#### FR-INT-001 Interview Rounds

Support configurable rounds, interview kits, mandatory scorecards, interviewers, and sequence.

#### FR-INT-002 Scheduling

The system shall use availability, time zones, working hours, holidays, location capacity, and candidate preferences to propose slots.

#### FR-INT-003 Interview Types

- Phone.
- Video.
- In person.
- Panel.
- Technical.
- Behavioural.
- Case presentation.
- Executive/final.

#### FR-INT-004 Calendar Integration

Create calendar events and update or cancel them without duplicate invitations. Meeting links and locations must follow access rules.

#### FR-INT-005 Scorecards

Scorecards shall use job-related competencies, anchored rating definitions, evidence notes, and an overall recommendation.

```text
STRONG_HIRE
HIRE
MIXED
NO_HIRE
STRONG_NO_HIRE
```

#### FR-INT-006 Independent Submission

Interviewers should submit feedback before seeing others’ feedback unless the process explicitly allows collaborative evaluation.

#### FR-INT-007 Conflict of Interest

Interviewers can declare a conflict and request replacement.

#### FR-INT-008 Interview Recording

Recording/transcription is disabled by default and requires policy, notice/consent where applicable, retention controls, and restricted access.

### 10.15 Final Selection and Decision Meeting

#### FR-SEL-001 Candidate Comparison

The system shall compare finalists using consistent, job-related criteria:

- Eligibility.
- Skills and experience.
- Assessments.
- Interview scorecards.
- Compensation expectation.
- Availability.
- Compliance readiness.
- Licence/verification status.
- References/checks.

#### FR-SEL-002 Preferred and Reserve Candidates

One candidate may be selected as preferred, with ordered reserve candidates and validity dates.

#### FR-SEL-003 Selection Decision

The final decision requires an authorized decision maker, decision date, rationale, and evidence summary.

#### FR-SEL-004 Decision Integrity

The system shall show missing scorecards, unexplained score divergence, and unapproved overrides before final selection.

### 10.16 Pre-Offer Checks

#### FR-CHK-001 Configurable Check Packages

Checks can vary by job family, grade, candidate branch, and risk level:

- Identity.
- Education.
- Employment history.
- References.
- Professional licence.
- Professional verification/accreditation.
- Conflict-of-interest declaration.
- Medical fitness where legally required.
- Background checks where lawful and approved.
- Work authorization.
- Sanctions or regulatory checks where applicable.

#### FR-CHK-002 Check Statuses

```text
NOT_STARTED
PENDING_CANDIDATE
PENDING_PROVIDER
IN_PROGRESS
CLEAR
CLEAR_WITH_NOTES
UNABLE_TO_VERIFY
FAILED
WAIVED
EXPIRED
```

#### FR-CHK-003 Restricted Results

Sensitive result details are available only to authorized users. Recruiters receive only the decision outcome needed for their role.

#### FR-CHK-004 Adverse Decision Review

Where a failed check may cause rejection, the system shall require authorized review, evidence validation, and any required candidate correction/dispute process.

### 10.17 Compensation and Offer Management

#### FR-OFR-001 Offer Package

The offer package may contain:

- Job title and occupation code.
- Grade.
- Department and branch.
- Reporting manager.
- Basic salary.
- Housing allowance.
- Transportation allowance.
- Other allowances.
- Variable pay/commission.
- Benefits.
- Medical insurance category.
- Annual leave.
- Working hours/schedule.
- Contract type and duration.
- Probation terms.
- Proposed start date.
- Relocation support.
- Offer expiry.
- Conditions precedent.

#### FR-OFR-002 Budget and Equity Validation

The system shall compare the offer with requisition budget, grade range, approved exceptions, internal-equity indicators, and compliance counting conditions.

#### FR-OFR-003 Approval Chain

Offer approval can include recruiter, hiring manager, HR, compensation, finance, compliance, and authorized signatory.

#### FR-OFR-004 Offer Versioning

Every negotiation creates a new immutable version. Prior versions become `SUPERSEDED` and remain auditable.

#### FR-OFR-005 Candidate Response

Candidates can securely accept, decline, request clarification, or request negotiation.

#### FR-OFR-006 Electronic Evidence

Record delivery, view, response, timestamp, IP/device metadata where appropriate, acceptance statement, and final document hash.

#### FR-OFR-007 Conditions

Offer conditions shall be explicitly listed and tracked, such as successful verification, Qiwa documentation, transfer approval, visa, work permit, or joining-date confirmation.

#### FR-OFR-008 Offer Withdrawal

Withdrawal requires permission, reason, notification decision, and audit trail.

### 10.18 Preboarding Hire Case Creation

#### FR-PRE-001 Creation Trigger

When an offer becomes `ACCEPTED`, the platform shall:

1. Lock the accepted offer version.
2. Create an employment-readiness case.
3. Copy approved terms into a controlled employment data record.
4. Classify the candidate branch.
5. Generate required tasks and government cases.
6. Create a pending/preboarding employee record only if the HR architecture requires it.

#### FR-PRE-002 No Premature Activation

The person shall not appear as an active employee for attendance, payroll, access, or headcount reporting until activation criteria are satisfied.

#### FR-PRE-003 Change Control

Any change to accepted terms requires a controlled amendment, approvals, candidate acknowledgement where necessary, and Qiwa reconciliation.

### 10.19 Saudi Candidate Employment-Readiness Flow

#### FR-KSA-001 Saudi Flow

```text
Offer Accepted
→ Identity and Data Validation
→ Employment Data Preparation
→ Qiwa Contract Creation/Tracking
→ Candidate Response
→ Contract Documented
→ GOSI Readiness
→ Payroll/Bank/Insurance Readiness
→ Preboarding Tasks
→ Ready-to-Join Approval
→ Joined
```

#### FR-KSA-002 Required Data

Collect only approved data necessary for contract, GOSI, payroll, insurance, and onboarding.

#### FR-KSA-003 HRDF Support Check

The system may record eligibility and application status for relevant HRDF support programs without promising entitlement.

#### FR-KSA-004 Contract Reconciliation

Internal accepted terms and documented contract terms must be compared before ready-to-join approval.

### 10.20 Non-Saudi Resident Transfer Flow

#### FR-TRN-001 Transfer Classification

Determine whether the candidate is:

- Currently employed and transfer required.
- Resident under another status.
- Already under the same employer/group.
- Not eligible based on available information.
- Requires manual government-relations review.

#### FR-TRN-002 Transfer Case

Track:

- Current employer information where lawful.
- Iqama validity.
- Profession.
- Transfer eligibility checklist.
- Qiwa transfer request reference.
- Employment contract reference.
- Candidate action.
- Current employer/external action where relevant.
- Submission and completion dates.
- Rejection or amendment reason.

#### FR-TRN-003 Establishment Preconditions

The system shall support a checklist for establishment conditions such as active status, valid licences, work-permit compliance, Wage Protection compliance, localization range, and sufficient transaction eligibility. The authoritative decision remains with the government platform.

#### FR-TRN-004 Failure Handling

If transfer fails, the case may be resubmitted, escalated, cancelled, or used to withdraw/amend the offer according to policy.

### 10.21 Overseas Non-Saudi Recruitment Flow

#### FR-VIS-001 Overseas Flow

```text
Offer Accepted
→ Establishment/Visa Eligibility Review
→ Candidate Document Collection
→ Professional Verification if Applicable
→ Qualification/Experience Attestation Tracking
→ Visa Case
→ Medical and Required Clearances
→ Travel and Arrival
→ Work Permit/Residency Tasks
→ Qiwa Contract Documentation
→ GOSI/Payroll/Insurance Readiness
→ Ready to Join
```

#### FR-VIS-002 Visa Case Tracking

Store type, occupation, establishment, candidate, external reference, status, submission date, expiry, required actions, evidence, and owner.

#### FR-VIS-003 Professional Verification

The platform shall determine if the selected occupation/candidate requires professional verification or accreditation and track provider/platform reference, result, issue date, expiry, and evidence.

#### FR-VIS-004 Profession Match

The offered job, visa profession, work-permit profession, Qiwa contract, and internal employee position must be reconciled. Differences require review.

#### FR-VIS-005 Arrival and Permit Tasks

Track arrival date, work-permit issuance/renewal workflow, residence-related tasks, and deadlines without representing the internal tracker as the government system of record.

### 10.22 Qiwa Contract Management

#### FR-QIW-001 Qiwa Case

Each applicable hire shall have a Qiwa contract case with:

- Establishment.
- Employee/candidate identifiers.
- Contract reference.
- Contract version.
- Submission status.
- Employee response.
- Amendment requests.
- Documentation date.
- Last synchronization/reconciliation date.
- Evidence or official receipt.

#### FR-QIW-002 Statuses

```text
NOT_STARTED
DRAFTED
SUBMITTED
PENDING_EMPLOYEE
AMENDMENT_REQUESTED
REJECTED
ACCEPTED
DOCUMENTED
CANCELLED
EXPIRED
RECONCILIATION_REQUIRED
```

#### FR-QIW-003 Contract Comparison

Compare at minimum:

- Arabic/English names.
- Identity/residency identifiers.
- Job title.
- Occupation code/profession.
- Contract type.
- Contract duration.
- Start date.
- Basic salary.
- Allowances and financial obligations.
- Working hours.
- Work location.
- Probation.
- Additional terms.

#### FR-QIW-004 Discrepancy Resolution

A discrepancy blocks ready-to-join unless an authorized, documented resolution exists.

#### FR-QIW-005 Integration Modes

Direct API or connector use requires official authorization. Otherwise, use structured manual entry, evidence upload, deep links, import/export, and periodic reconciliation.

### 10.23 GOSI, Payroll, Bank, Insurance, and Wage Protection Readiness

#### FR-GOV-001 GOSI Readiness

Track whether the employee record is ready for or completed in GOSI, including joining date, wage components, occupation, establishment, external reference, and reconciliation status.

#### FR-GOV-002 Payroll Readiness

Validate:

- Payroll employee number.
- Payroll group.
- Cost center.
- Basic salary and allowances.
- Effective date.
- Payment frequency.
- Deductions setup where applicable.
- Contract-to-payroll comparison.

#### FR-GOV-003 Bank/IBAN

Collect bank data only at the required stage, validate format and ownership using approved methods, mask display, encrypt storage, and restrict access.

#### FR-GOV-004 Insurance

Track insurer, category, effective date, dependants where applicable, enrollment status, and external reference.

#### FR-GOV-005 Wage Protection Alignment

The system shall reconcile the documented contract, GOSI wage data, and payroll wage components before activation. It shall identify mismatches that could affect Wage Protection compliance.

#### FR-GOV-006 Readiness Checklist

A hire cannot become `READY_TO_JOIN` until all mandatory readiness items are complete or formally waived.

### 10.24 Preboarding

#### FR-ONB-001 Preboarding Plan

Templates by job, grade, branch, and candidate branch generate tasks for HR, government relations, payroll, IT, facilities, security, manager, and candidate.

#### FR-ONB-002 Candidate Tasks

Examples:

- Confirm personal information.
- Upload requested documents.
- Provide bank details.
- Review policies.
- Confirm joining logistics.
- Complete medical/insurance forms where applicable.
- Sign acknowledgements.

#### FR-ONB-003 Internal Tasks

Examples:

- Create email/account.
- Prepare device.
- Create badge.
- Assign workspace.
- Add payroll record.
- Enroll insurance.
- Prepare manager plan.
- Arrange travel/accommodation.

#### FR-ONB-004 Dependencies

Tasks can have dependencies, owners, SLA, approval, evidence, and escalation.

#### FR-ONB-005 Candidate Communications

Send a welcome pack, joining location, date/time, contact person, required originals, first-day agenda, and support channel.

### 10.25 Joining and Employee Activation

#### FR-JOIN-001 Joining Confirmation

An authorized user records:

- Actual joining date/time.
- Work location.
- Identity check outcome.
- Attendance confirmation.
- Documents verified.
- Equipment delivered.
- Manager confirmation.

#### FR-JOIN-002 Activation

Only after joining confirmation shall the system activate or finalize the employee record and trigger downstream access and payroll-effective actions.

#### FR-JOIN-003 No-Show

A no-show case shall trigger contact attempts, escalation, grace period, decision, offer/case closure, equipment cancellation, and audit trail.

#### FR-JOIN-004 Delayed Joining

A revised joining date may require offer/contract amendment and readiness revalidation.

### 10.26 Onboarding and Probation

#### FR-PRB-001 Onboarding Plan

Onboarding may include orientation, policy acknowledgements, training, mandatory compliance modules, introductions, role objectives, and manager check-ins.

#### FR-PRB-002 Probation Configuration

Probation duration, review dates, extension conditions, and decision authority must be configurable and aligned with the documented contract and current Saudi requirements.

#### FR-PRB-003 Review Checkpoints

Support first-week, 30-day, 60/90-day, and pre-decision checkpoints or organization-configured equivalents.

#### FR-PRB-004 Probation Outcomes

```text
CONFIRMED
EXTENDED
TRANSFERRED
RESIGNED
TERMINATED_DURING_PROBATION
OTHER_REVIEW
```

#### FR-PRB-005 Decision Evidence

Store manager recommendation, HR review, employee feedback, objectives, attendance summary, training completion, decision, and effective date.

#### FR-PRB-006 Quality of Hire

Calculate configurable quality-of-hire indicators from probation, performance proxy, retention, manager satisfaction, employee satisfaction, and recruitment signals.

### 10.27 Candidate Communication

#### FR-COM-001 Channels

- Email.
- SMS.
- In-app/candidate portal.
- WhatsApp Business in a future/approved phase.
- Calendar invitations.

#### FR-COM-002 Templates

Bilingual templates support variables, versions, approvals, previews, and fallback language.

#### FR-COM-003 Trigger Examples

- Application confirmation.
- Missing information.
- Assessment invitation/reminder.
- Interview invitation/change/reminder.
- Status update.
- Offer sent/expiry reminder.
- Preboarding task.
- Contract action reminder.
- Joining reminder.
- Rejection.
- Talent-pool invitation.

#### FR-COM-004 Communication Log

Store channel, template/version, recipient, status, provider reference, delivery, open/click where lawful, bounce, opt-out, and related case.

#### FR-COM-005 Failure Handling

Failed delivery shall retry according to policy and create recruiter action when exhausted.

#### FR-COM-006 Candidate-Facing Status

Internal detailed statuses may map to simpler candidate-facing statuses to avoid exposing confidential decisions.

### 10.28 Analytics and Reporting

#### FR-ANA-001 Executive Dashboard

- Open requisitions.
- Active jobs.
- Applications.
- Funnel.
- Hiring plan vs actual.
- Time-to-fill.
- Offer acceptance.
- Joining conversion.
- Compliance readiness.
- Saudi/non-Saudi hiring mix.
- Quality-of-hire.

#### FR-ANA-002 Recruiter Dashboard

- Work queue.
- Aging candidates.
- Interviews.
- Offers.
- Overdue tasks.
- Personal SLA.
- Conversion by stage.

#### FR-ANA-003 Compliance Dashboard

- Cases by severity/status.
- Jobs blocked by localization rules.
- Rule staleness.
- Overrides.
- Qiwa discrepancies.
- Transfer/visa case aging.
- Readiness blockers.

#### FR-ANA-004 Source Analytics

Applications, qualified candidates, interviews, offers, joins, cost, time, and quality by source/campaign/agency/referrer.

#### FR-ANA-005 Fairness Monitoring

Where legally approved, provide aggregated process metrics to detect inconsistent outcomes without exposing individual sensitive data unnecessarily.

#### FR-ANA-006 Exports

Exports must respect permissions, masking, purpose, watermarking, row limits, and audit logging.

### 10.29 Configuration and Administration

#### FR-ADM-001 Pipeline Builder

Authorized users can add, rename, order, and gate stages while preserving immutable historical stage keys.

#### FR-ADM-002 Workflow Builder

Configure approvals, tasks, reminders, escalations, conditions, and branch logic.

#### FR-ADM-003 Rule Management

Compliance administrators can create, test, approve, publish, supersede, and retire rules.

#### FR-ADM-004 Templates

Manage job, email, offer, interview, assessment, preboarding, onboarding, and probation templates.

#### FR-ADM-005 Master Data

Manage departments, locations, branches, job families, grades, cost centers, occupation codes, skills, licence types, rejection reasons, and source values.

#### FR-ADM-006 Feature Flags

Tenant and environment-level feature flags must support controlled rollout.

### 10.30 Role-Based Access Control

#### FR-RBAC-001 Permission Model

Permissions must be action-based and resource-scoped, for example:

```text
requisition.create
requisition.approve
job.publish
candidate.view_basic
candidate.view_sensitive
candidate.export
offer.create
offer.approve
compliance.review
compliance.override
government_case.manage
privacy_request.manage
audit.view
```

#### FR-RBAC-002 Scope Model

Scopes may include own, assigned, department, business unit, branch, establishment, organization, or platform.

#### FR-RBAC-003 Sensitive Field Controls

National ID/Iqama, passport, bank, medical, background-check, and verification data require separate permissions and masking.

#### FR-RBAC-004 Temporary Access

Time-limited access can be granted with reason and approval.

#### FR-RBAC-005 Auditor Access

Auditors receive read-only access and cannot download sensitive files unless explicitly granted.

### 10.31 PDPL and Candidate Privacy

#### FR-PRV-001 Privacy Notice

Before collection, candidates shall receive a clear Arabic and English notice describing controller identity, purposes, legal basis, data categories, recipients, retention, rights, transfer where relevant, and contact channel.

#### FR-PRV-002 Purpose and Legal Basis

Each processing activity shall map to a documented purpose and legal basis. Consent shall not be used as a default when another lawful basis is appropriate.

#### FR-PRV-003 Data Minimization

Forms and workflows shall collect the minimum data necessary for the current stage.

#### FR-PRV-004 Consent Records

Where consent is used, store notice/version, purpose, channel, timestamp, evidence, withdrawal, and resulting actions.

#### FR-PRV-005 Data-Subject Rights

Support requests for:

- Information/awareness.
- Access.
- Obtain a readable copy.
- Correction/completion/update.
- Destruction/deletion where applicable.
- Withdrawal of consent where applicable.

#### FR-PRV-006 Request Workflow

Requests require identity verification, SLA, assignment, search scope, decision, exceptions, communication, evidence, and closure.

#### FR-PRV-007 Retention

Retention policies shall vary by application status, hired status, legal hold, talent-pool relationship, and document category. Policies require legal approval, effective dates, and automated disposition reports.

#### FR-PRV-008 Destruction and Anonymization

Expired data shall be securely deleted or irreversibly anonymized across primary storage, derived indexes, and scheduled downstream systems, subject to backup policy and legal requirements.

#### FR-PRV-009 Cross-Border Transfer

Before transferring personal data outside Saudi Arabia, the organization shall record transfer purpose, destination, data categories, legal basis, safeguards, processor, risk assessment where required, and approval.

#### FR-PRV-010 Processor Management

Maintain a processor/subprocessor registry with service, location, data categories, contract, security review, transfer mechanism, and exit/deletion obligations.

#### FR-PRV-011 Privacy by Default

Candidate profiles are not public; sensitive fields are masked; exports are restricted; and production support access is exceptional and logged.

### 10.32 Security, Audit, and Incident Management

#### FR-SEC-001 Authentication

Internal users shall use secure authentication, MFA for privileged roles, session controls, and tenant-aware authorization.

#### FR-SEC-002 Candidate Links

Magic links, offer links, and document links must be signed, purpose-bound, single-use where appropriate, revocable, and time limited.

#### FR-SEC-003 File Security

Uploads shall be type-checked, size-limited, malware-scanned, stored privately, encrypted, and delivered through authorized expiring links.

#### FR-SEC-004 Audit Events

Log create, view-sensitive, download, export, update, delete, merge, approve, reject, override, sign, send, permission change, and integration reconciliation events.

#### FR-SEC-005 Immutable Audit Fields

Each audit event includes tenant, actor, role, action, resource, before/after summary, timestamp, IP/device where appropriate, reason, correlation ID, and source.

#### FR-SEC-006 Security Incident Workflow

Support incident intake, triage, containment, evidence, affected records, notification assessment, remediation, and closure.

#### FR-SEC-007 Personal Data Breach

The system shall support the organization’s assessment and reporting workflow, including a configurable deadline and evidence needed for notification to the competent authority and affected individuals where required.

### 10.33 Optional Temporary and Domestic-Worker Boundaries

#### FR-SPC-001 Ajeer

Temporary or seasonal workforce arrangements shall use a separate `AJEER` case type with permit tracking, period, facility, worker, occupation, and evidence.

#### FR-SPC-002 Musaned

Domestic-worker recruitment shall be excluded from the standard corporate ATS pipeline and routed to a separate Musaned-aligned product/workflow if introduced.

#### FR-SPC-003 Misclassification Warning

Users selecting domestic worker, temporary borrowed worker, contractor, or agency worker shall receive a classification warning and appropriate workflow options.

---

## 11. Differentiating “Rocket” Feature

# Saudi Employment Readiness Engine (SERE)
# محرك الجاهزية الوظيفية السعودي

### 11.1 Concept

SERE is a real-time, evidence-backed readiness layer that predicts whether a selected candidate can legally and operationally join, explains blockers, assigns actions, and estimates the critical path.

It combines:

- Requisition compliance.
- Candidate nationality/residency branch.
- Occupation localization rules.
- Professional licence/verification.
- Qiwa contract state.
- Transfer/visa/work-permit cases.
- GOSI/payroll/bank/insurance readiness.
- Preboarding task dependencies.

### 11.2 Readiness Score

```text
Compliance Readiness         25%
Contract Readiness           20%
Government Process Readiness 20%
Payroll/GOSI Readiness       15%
Candidate Document Readiness 10%
Internal Onboarding Readiness 10%
```

The score is not a legal conclusion. Any mandatory blocker overrides the numeric score.

### 11.3 Example Output

```text
Candidate: Ahmed A.
Role: Procurement Specialist
Readiness: 72% — BLOCKED

Critical blockers:
1. Profession localization review required.
2. Qiwa contract not submitted.
3. GOSI wage data not prepared.

Next best actions:
- Compliance Officer: verify current profession rule.
- Government Relations: create Qiwa contract case.
- Payroll: confirm basic salary and allowances.

Estimated critical path: dependent on external completion; no guaranteed date.
```

### 11.4 Why It Is Different

Traditional ATS products stop at `Offer Accepted`. SERE measures and orchestrates the path to `Ready to Join`, exposes the responsible party for every blocker, and creates an auditable explanation for management.

### 11.5 Guardrails

- Rules require approved sources and effective dates.
- External completion dates are estimates, not guarantees.
- Human compliance approval is required for blocked or ambiguous cases.
- Candidate-sensitive data is minimized and masked.
- The model cannot override a mandatory legal/compliance gate.

---

## 12. Business Rules

### 12.1 Core Rules

| ID | Rule |
|---|---|
| BR-001 | A job cannot be published without an approved requisition unless an authorized bypass is recorded. |
| BR-002 | A job cannot be published with a blocked or stale compliance result. |
| BR-003 | A selected candidate triggers a candidate-specific compliance recalculation. |
| BR-004 | An offer cannot be sent without required approvals. |
| BR-005 | An accepted offer creates a preboarding hire case, not an active employee. |
| BR-006 | The accepted offer version is immutable; changes require a new approved amendment/version. |
| BR-007 | Saudi and non-Saudi candidates follow different employment-readiness templates. |
| BR-008 | Qiwa contract discrepancies block ready-to-join unless formally resolved. |
| BR-009 | Active employee creation requires confirmed joining. |
| BR-010 | A candidate cannot be silently blocked by a generic blacklist flag. |
| BR-011 | Sensitive identity and bank data are collected only at an approved stage. |
| BR-012 | AI may recommend but cannot make the final hiring decision. |
| BR-013 | Missing parsed data causes review, not automatic rejection. |
| BR-014 | Every rejection has an internal reason; candidate communication uses an approved template. |
| BR-015 | Every compliance override requires independent approval and evidence. |
| BR-016 | Government-platform data is authoritative when reconciled and verified. |
| BR-017 | Rule versions apply according to the decision/effective date, not only the current date. |
| BR-018 | Data export is permissioned and audited. |
| BR-019 | Privacy retention and destruction operate by approved policy, not a universal fixed period. |
| BR-020 | Domestic-worker recruitment is not processed through the corporate ATS flow. |

### 12.2 Duplicate Rules

- Same email + same posting: warn and support resume/update rather than creating uncontrolled duplicates.
- Same person + multiple postings: one candidate profile, separate application records.
- Agency submission matching an existing candidate: ownership policy determines attribution without duplicating the profile.
- Merge actions require permission and cannot lose consent, source, or audit history.

### 12.3 Date Rules

- Store timestamps in UTC and display in tenant/user time zone.
- Support Gregorian dates; Hijri display may be added where required.
- External expiry dates generate reminders before expiry.
- Historical records retain the rule and template versions active at the time.

### 12.4 Ready-to-Join Gate

Minimum configurable gate categories:

```text
Accepted offer locked
Candidate branch confirmed
Identity checks complete
Mandatory pre-employment checks complete
Compliance approved
Qiwa documented where applicable
Transfer/visa/work-permit tasks complete where applicable
GOSI readiness complete
Payroll data reconciled
Bank and insurance readiness complete where required
Mandatory preboarding documents complete
Joining date approved
No unresolved mandatory discrepancy
```

---

## 13. Data Model Overview

### 13.1 Design Conventions

- UUID primary keys.
- `org_id` on every tenant-owned table.
- `establishment_id`/`branch_id` where relevant.
- Soft deletion only where legally/operationally appropriate.
- Immutable event tables for audits and major state transitions.
- Encrypted fields for sensitive identifiers.
- Separate file metadata from storage objects.
- Version numbers for offers, templates, policies, and rules.
- Optimistic concurrency (`version`) for mutable workflows.

### 13.2 Core Organization Entities

```text
organizations
  id, legal_name_ar, legal_name_en, display_name_ar, display_name_en,
  default_language, timezone, currency, status, created_at, updated_at

establishments
  id, org_id, name, government_reference, commercial_registration,
  unified_number, activity_code, status, city, branch_id,
  last_reconciled_at, created_at, updated_at

organization_branches
  id, org_id, name_ar, name_en, city, address, timezone, status

compliance_snapshots
  id, org_id, establishment_id, snapshot_date, source_type,
  category, metrics_json, evidence_file_id, certified_by, certified_at
```

### 13.3 Requisition and Job Entities

```text
job_requisitions
  id, org_id, establishment_id, branch_id, department_id, cost_center_id,
  title_ar, title_en, occupation_code, headcount, filled_headcount,
  hiring_reason, replacement_employee_id, justification,
  employment_type, contract_duration, work_mode, target_start_date,
  salary_min, salary_max, currency, budget_status,
  nationality_strategy, status, confidentiality_level,
  hiring_manager_id, created_by, version, created_at, updated_at

requisition_versions
  id, requisition_id, version_no, snapshot_json, changed_by, changed_at

approval_requests
  id, org_id, resource_type, resource_id, workflow_version_id,
  status, submitted_by, submitted_at, completed_at

approval_steps
  id, approval_request_id, step_order, group_type, approver_type,
  approver_id, status, decision, comments, decided_at, delegated_to

job_postings
  id, org_id, requisition_id, title_ar, title_en, public_slug,
  description_ar, description_en, requirements_ar, requirements_en,
  benefits_ar, benefits_en, occupation_code, employment_type,
  work_mode, city, branch_id, salary_visible, salary_min, salary_max,
  openings, deadline, form_version_id, privacy_notice_version_id,
  status, publish_at, published_at, closed_at, created_by, version

job_posting_channels
  id, job_posting_id, channel, integration_mode, external_reference,
  status, published_at, last_synced_at, error_code, metadata_json
```

### 13.4 Candidate and Application Entities

```text
candidates
  id, org_id, preferred_name, name_ar, name_en, email_normalized,
  phone_normalized, current_city, current_country, preferred_language,
  do_not_contact, profile_status, created_at, updated_at

candidate_sensitive_profiles
  id, candidate_id, nationality, date_of_birth_encrypted,
  national_id_encrypted, iqama_encrypted, passport_encrypted,
  identity_expiry_date, residency_class, work_authorization_status,
  bank_data_encrypted, encryption_key_version, updated_at

candidate_experiences
  id, candidate_id, employer, title, start_date, end_date,
  description, source, verified_status

candidate_education
  id, candidate_id, institution, qualification, field,
  start_date, end_date, source, verified_status

candidate_skills
  candidate_id, skill_id, proficiency, years, source, confidence

candidate_documents
  id, org_id, candidate_id, document_type, file_id, status,
  issued_at, expires_at, verified_by, verified_at, visibility_class

job_applications
  id, org_id, job_posting_id, candidate_id, source_id,
  current_stage, candidate_visible_status, assigned_recruiter_id,
  eligibility_status, match_score, compliance_status,
  applied_at, withdrawn_at, rejected_at, rejection_reason_id,
  version, created_at, updated_at

application_answers
  id, application_id, question_version_id, answer_json, file_id

application_stage_events
  id, application_id, from_stage, to_stage, reason_code,
  actor_id, occurred_at, correlation_id, metadata_json
```

### 13.5 Screening, Assessment, and Interview Entities

```text
screening_results
  id, application_id, ruleset_version, outcome, score,
  explanation_json, model_id, model_version, reviewed_by, reviewed_at

assessments
  id, org_id, application_id, provider, assessment_type,
  assessment_version, status, invited_at, due_at, completed_at,
  score, passing_score, result_reference, raw_report_file_id

interviews
  id, org_id, application_id, round_id, type, scheduled_start,
  scheduled_end, timezone, location, meeting_link_encrypted,
  status, organizer_id, created_at

interview_participants
  interview_id, user_id, role, attendance_status, conflict_declared

interview_scorecards
  id, interview_id, reviewer_id, template_version_id,
  ratings_json, recommendation, evidence_notes, submitted_at
```

### 13.6 Selection, Checks, and Offers

```text
selection_decisions
  id, application_id, decision, rank, rationale, decided_by,
  decided_at, evidence_summary_json

pre_employment_checks
  id, org_id, application_id, check_type, provider,
  status, requested_at, completed_at, outcome,
  restricted_result_json, evidence_file_id, reviewed_by

offers
  id, org_id, application_id, current_version_id, status,
  approved_at, sent_at, viewed_at, responded_at, expires_at

offer_versions
  id, offer_id, version_no, terms_json, document_file_id,
  document_hash, status, created_by, created_at, supersedes_version_id

offer_approvals
  id, offer_version_id, approval_request_id

offer_responses
  id, offer_version_id, response, comments, responded_at,
  evidence_json, acceptance_hash
```

### 13.7 Compliance and Government Entities

```text
compliance_rules
  id, rule_code, category, title_ar, title_en, description,
  applicability_json, logic_json, severity, effective_from,
  effective_to, grace_end, source_url, source_published_at,
  review_due_at, status, version, approved_by, approved_at

compliance_evaluations
  id, org_id, resource_type, resource_id, ruleset_version,
  overall_result, evaluated_at, input_snapshot_json,
  result_summary_json, stale_rules_count

compliance_evaluation_items
  id, evaluation_id, rule_id, result, explanation,
  evidence_json, requires_manual_review

compliance_overrides
  id, evaluation_item_id, requested_by, reason_code,
  justification, evidence_file_id, status, approved_by,
  approved_at, expires_at

employment_readiness_cases
  id, org_id, application_id, candidate_id, branch_type,
  accepted_offer_version_id, status, readiness_score,
  mandatory_blockers, target_join_date, actual_join_date,
  owner_id, created_at, updated_at

government_cases
  id, org_id, readiness_case_id, case_type, establishment_id,
  external_reference, status, submitted_at, completed_at,
  expires_at, owner_id, last_reconciled_at, metadata_json

qiwa_contract_cases
  id, government_case_id, contract_reference, contract_version,
  status, employee_response, submitted_at, documented_at,
  last_reconciled_at, contract_snapshot_json, evidence_file_id

contract_discrepancies
  id, qiwa_contract_case_id, field_name, internal_value_hash,
  external_value_hash, severity, status, resolution, resolved_by,
  resolved_at

professional_verifications
  id, readiness_case_id, verification_type, occupation_code,
  provider_reference, status, result, issued_at, expires_at,
  evidence_file_id

work_authorization_cases
  id, readiness_case_id, authorization_type, status,
  external_reference, issued_at, expires_at, evidence_file_id
```

### 13.8 Joining and Employee Entities

```text
readiness_checklist_items
  id, readiness_case_id, item_type, mandatory, status,
  owner_type, owner_id, due_at, completed_at, waived_by,
  waiver_reason, evidence_file_id, dependency_json

preboarding_tasks
  id, readiness_case_id, template_task_id, title, owner_id,
  candidate_visible, status, due_at, completed_at, evidence_file_id

joining_confirmations
  id, readiness_case_id, planned_date, actual_date,
  location_id, status, confirmed_by, confirmed_at, notes

employees
  id, org_id, source_readiness_case_id, employee_number,
  candidate_id, employment_status, activation_date,
  department_id, position_id, manager_id, branch_id

onboarding_plans
  id, org_id, employee_id, template_version_id, status,
  start_date, target_completion_date, completed_at

probation_cases
  id, org_id, employee_id, contract_start_date, probation_end_date,
  status, outcome, extension_end_date, decision_by, decision_at

probation_reviews
  id, probation_case_id, review_type, reviewer_id,
  ratings_json, comments, recommendation, submitted_at
```

### 13.9 Privacy, Communication, and Audit Entities

```text
privacy_notice_versions
  id, org_id, language, version, content, effective_from,
  status, approved_by, approved_at

processing_activities
  id, org_id, purpose_code, data_categories, legal_basis,
  recipients, retention_policy_id, transfer_flag, owner_id

candidate_acknowledgements
  id, candidate_id, notice_version_id, purpose_code,
  action, captured_at, channel, evidence_json

privacy_requests
  id, org_id, candidate_id, request_type, status,
  verified_at, due_at, decision, response_file_id, closed_at

retention_policies
  id, org_id, record_type, trigger_event, retention_period,
  action, legal_basis, effective_from, approved_by

communications
  id, org_id, candidate_id, application_id, readiness_case_id,
  channel, template_version_id, recipient, status,
  provider_reference, sent_at, delivered_at, failed_at

files
  id, org_id, storage_key, original_name, content_type, size,
  sha256, malware_status, encryption_metadata, visibility_class,
  created_by, created_at

audit_events
  id, org_id, actor_type, actor_id, action, resource_type,
  resource_id, occurred_at, ip_hash, user_agent_hash,
  before_summary, after_summary, reason, correlation_id
```

---

## 14. Integration Requirements

### 14.1 Integration Principles

1. Government and third-party integrations require authorization, credentials, contractual permission, and technical availability.
2. The product must not assume a public API exists.
3. Each integration shall support a declared mode: direct API, authorized connector, file exchange, deep link, manual tracking, or no integration.
4. External systems of record remain authoritative for their official processes.
5. Every synchronization must be idempotent, auditable, retryable, and reconcilable.
6. Sensitive data shall be minimized in integration payloads.
7. Webhooks must be authenticated and replay-protected.
8. Failed synchronization shall not silently mark a process complete.

### 14.2 Integration Registry

Each configured integration shall store:

- Provider/system.
- Tenant and establishment scope.
- Environment.
- Integration mode.
- Credential owner/reference.
- Data categories.
- Transfer destination/country where relevant.
- Purpose and legal basis.
- Sync direction.
- Frequency.
- Retry policy.
- Reconciliation owner.
- Last successful sync.
- Last failure.
- Health status.
- Processor/subprocessor reference.

### 14.3 Qiwa

Potential capabilities, subject to authorization:

- Deep link to contract management.
- Employee-transfer case link/reference.
- Work-permit/profession service references.
- Import or reconciliation of contract status.
- Contract field comparison.
- Evidence upload.

Required failure behavior:

- Mark `SYNC_FAILED`.
- Preserve local case state.
- Display external system as unavailable.
- Queue retry where safe.
- Require manual reconciliation if the failure exceeds SLA.

### 14.4 Jadarat

Potential capabilities:

- Export approved opportunity data.
- Record external job reference.
- Track publishing and closure.
- Import/source-tag applicants where officially supported.
- Reconcile candidate and application counts.

The platform shall not claim automatic Jadarat publishing unless an authorized integration is confirmed.

### 14.5 GOSI

Potential capabilities:

- Readiness export.
- Employer task/deep link.
- Store external contributor reference.
- Reconcile engagement and wage information where authorized.

### 14.6 Mudad / Wage Protection

The recruitment platform is not the wage-file submission system. It shall:

- Prepare contract/payroll wage reconciliation.
- Expose wage mismatch warnings.
- Track payroll handoff readiness.
- Store compliance evidence/reference where provided.

### 14.7 Professional Verification and Sector Regulators

Support provider-specific cases for:

- Professional verification/accreditation.
- Saudi Council of Engineers.
- Saudi Commission for Health Specialties.
- Accounting or other regulated-profession authorities.
- Additional sector regulators configured by the tenant.

### 14.8 Email, SMS, and Messaging

Requirements:

- Queue-based sending.
- Provider abstraction.
- Arabic Unicode and RTL-safe templates.
- Delivery webhooks.
- Bounce and complaint handling.
- Suppression list.
- Tenant sender configuration.
- Rate limits.
- Message idempotency.

### 14.9 Calendar and Video Conferencing

- Google Calendar / Microsoft 365 where authorized.
- Create/update/cancel events.
- Free/busy support.
- Meeting-link generation.
- Organizer ownership.
- Candidate invitation without exposing internal attendee details unnecessarily.

### 14.10 Assessment Providers

- Candidate invitation.
- SSO/deep link where supported.
- Result callback/import.
- Assessment version and score normalization.
- Raw report access control.

### 14.11 HRIS and Employee Master

On confirmed joining, send/create:

- Employee identity and contact data.
- Employee number request/result.
- Department, position, manager, branch.
- Joining and activation dates.
- Compensation components as permitted.
- Payroll group/cost center.
- Source application and readiness references.

The integration must prevent duplicate employee creation through an idempotency key.

### 14.12 File Storage

- Private tenant-scoped storage.
- Signed, short-lived download links.
- Malware scan before availability.
- Object hash and metadata.
- Encryption.
- Retention and deletion support.
- Quarantine state.
- Upload resumability for approved file sizes.

### 14.13 Webhooks and Event Bus

Example domain events:

```text
requisition.submitted
requisition.approved
compliance.evaluated
job.published
application.submitted
application.stage_changed
assessment.completed
interview.scheduled
scorecard.submitted
offer.approved
offer.accepted
readiness_case.created
qiwa_contract.documented
government_case.completed
hire.ready_to_join
candidate.joined
employee.activated
probation.completed
privacy_request.received
security_incident.created
```

Every event must include event ID, version, tenant, timestamp, correlation ID, actor/source, resource reference, and minimal payload.

---

## 15. API and Service Requirements

### 15.1 API Principles

- REST or typed RPC may be used consistently with the existing architecture.
- All write requests use idempotency keys where duplicate submission is harmful.
- Resources use tenant-scoped authorization.
- Sensitive fields are excluded by default.
- Pagination, filtering, sorting, and field selection are standardized.
- Errors are structured and translatable.
- Optimistic concurrency is required for high-risk records.

### 15.2 Illustrative Endpoint Groups

```text
/api/requisitions
/api/requisitions/{id}/submit
/api/requisitions/{id}/approve
/api/requisitions/{id}/compliance-check

/api/jobs
/api/jobs/{id}/publish
/api/public/careers
/api/public/careers/{slug}
/api/public/careers/{slug}/apply

/api/candidates
/api/candidates/{id}/merge
/api/candidates/{id}/privacy-requests

/api/applications
/api/applications/{id}/transition
/api/applications/{id}/screening
/api/applications/{id}/assessments
/api/applications/{id}/interviews
/api/applications/{id}/selection

/api/offers
/api/offers/{id}/versions
/api/offers/{id}/submit-approval
/api/public/offers/{token}/respond

/api/readiness-cases
/api/readiness-cases/{id}/evaluate
/api/readiness-cases/{id}/government-cases
/api/readiness-cases/{id}/ready-to-join
/api/readiness-cases/{id}/confirm-joining

/api/compliance/rules
/api/compliance/evaluations
/api/compliance/overrides

/api/integrations
/api/integrations/{id}/reconcile
/api/webhooks/{provider}
```

### 15.3 Error Model

```json
{
  "error": {
    "code": "QIWA_CONTRACT_DISCREPANCY",
    "message": "The documented contract does not match the accepted offer.",
    "message_ar": "العقد الموثق لا يطابق العرض المقبول.",
    "correlation_id": "...",
    "details": {
      "fields": ["basic_salary", "start_date"]
    }
  }
}
```

### 15.4 Critical Error Codes

- `AUTHENTICATION_REQUIRED`
- `PERMISSION_DENIED`
- `TENANT_SCOPE_VIOLATION`
- `VERSION_CONFLICT`
- `COMPLIANCE_BLOCKED`
- `COMPLIANCE_RULE_STALE`
- `APPROVAL_REQUIRED`
- `OFFER_NOT_ACCEPTED`
- `OFFER_VERSION_MISMATCH`
- `QIWA_CONTRACT_REQUIRED`
- `QIWA_CONTRACT_DISCREPANCY`
- `READINESS_GATE_INCOMPLETE`
- `JOINING_NOT_CONFIRMED`
- `DUPLICATE_CANDIDATE_REVIEW`
- `FILE_QUARANTINED`
- `PRIVACY_RESTRICTION`
- `INTEGRATION_UNAVAILABLE`

---

## 16. User Experience Requirements

### 16.1 Language and Direction

- Arabic is the default tenant application language.
- Public portal opens in Arabic unless tenant configuration or user preference indicates otherwise.
- Full RTL layout; not only right-aligned text.
- English LTR must be fully functional.
- Mixed Arabic/English names, numbers, email, and document references must render correctly.
- Translation keys, not hard-coded UI strings.

### 16.2 Candidate Experience

- Mobile-first application.
- Clear progress and expected completion time.
- Minimal initial fields.
- Inline validation.
- Preserve entered data after errors.
- Accessible file-upload guidance.
- Confirmation with reference number.
- Transparent status and communication preferences.
- No exposure of internal scores, notes, or compliance reasoning.

### 16.3 Recruiter Experience

- Unified work queue.
- Fast candidate navigation.
- Keyboard-friendly actions.
- Saved filters and views.
- Visible blockers and next action.
- Bulk actions with dry-run summary.
- Side-by-side candidate comparison.
- Arabic/English message preview.

### 16.4 Compliance Experience

- Evidence next to each rule result.
- Source and last-review date visible.
- Clear difference between authoritative data, imported data, user-entered data, and estimates.
- One-click request for missing information.
- Override workflow separated from ordinary approval.

### 16.5 Status Presentation

Status colors must not be the only signal. Use text, icon, severity, and accessible labels.

### 16.6 Destructive Actions

Reject, withdraw offer, merge, delete, export sensitive data, approve override, and cancel hire require confirmation showing impact.

---

## 17. Non-Functional Requirements

### 17.1 Performance

| Requirement | Target |
|---|---|
| Public careers LCP | Target < 2.5 seconds at p75 under defined mobile network profile |
| Job search response | < 1 second p95 for normal tenant dataset |
| Application submission | < 3 seconds p95 excluding large upload transfer |
| ATS list query | < 2 seconds p95 for standard filtered page |
| Kanban initial load | < 3 seconds p95 with server pagination/virtualization |
| Stage transition | < 2 seconds p95 excluding external integrations |
| Dashboard freshness | Operational metrics within 5 minutes; critical counters within 60 seconds where required |

Performance targets must be tested with realistic volumes and regions.

### 17.2 Scale

Initial design targets per tenant:

- 100+ active postings.
- 10,000 applications per large posting.
- 1,000,000 candidate/application records over lifecycle for large tenants.
- 500 concurrent internal users for enterprise tenants.
- Burst handling for campaign-driven public applications.

No user interface should attempt to load all application records into the browser.

### 17.3 Availability and Reliability

- Public application service availability target: 99.9% excluding planned maintenance.
- No accepted application may be lost after success confirmation.
- Write operations must be transactionally consistent.
- Queued external work must support retry and dead-letter handling.
- Recovery point and recovery time objectives must be defined before production.
- Backups and restoration must be tested.

### 17.4 Resilience

- Circuit breakers for external providers.
- Graceful degradation when email/calendar/government links are unavailable.
- Candidate application remains possible if non-essential analytics fail.
- External-sync failure never rolls back a valid internal application unless explicitly required.

### 17.5 Observability

- Structured logs.
- Metrics by service and tenant without leaking candidate PII.
- Distributed tracing/correlation IDs.
- Queue depth and dead-letter alerts.
- Integration health dashboard.
- Security alerts.
- Audit-log integrity monitoring.

### 17.6 Accessibility

- WCAG 2.2 AA target for public and core internal flows.
- Keyboard navigation.
- Screen-reader labels.
- Focus management.
- Contrast compliance.
- Reduced motion preference.
- Accessible validation and errors.

### 17.7 Maintainability

- Modular domain boundaries.
- Versioned schemas and APIs.
- Automated tests.
- Feature flags.
- Migration scripts with rollback plans.
- Configuration as data.
- Documented runbooks.

---

## 18. Security and Privacy Architecture Requirements

### 18.1 Data Classification

| Class | Examples | Default Control |
|---|---|---|
| Public | Published job descriptions | Public read |
| Internal | Requisition business justification | Authenticated scoped access |
| Confidential | Interview feedback, compensation | Role and resource scoped |
| Highly Confidential | National ID/Iqama/passport, bank, medical/check results | Separate permission, encryption, masking, strong audit |
| Regulatory Evidence | Qiwa/GOSI/government receipts | Restricted, immutable retention policy |

### 18.2 Encryption

- TLS for data in transit.
- Encryption at rest.
- Field-level encryption/tokenization for highest-risk identifiers.
- Key rotation and versioning.
- Secrets stored in a secrets manager, not source code.

### 18.3 Access Control

- Deny by default.
- Tenant isolation at application and database layers.
- MFA for privileged roles.
- Periodic access review.
- Immediate deprovisioning.
- Just-in-time support access where feasible.

### 18.4 Secure Development

- Threat modeling.
- Dependency and container scanning.
- Static and dynamic security testing.
- Secret scanning.
- Code review.
- Database migration review.
- Penetration testing before major launch.

### 18.5 Application Abuse Protection

- Rate limits.
- Bot detection appropriate to accessibility.
- Email/phone verification where needed.
- File scanning.
- Duplicate controls.
- Abuse-report workflow.
- Do not block legitimate high-volume events without fallback.

### 18.6 Privacy Operations

- Processing-activity records.
- Data inventory.
- Retention schedules.
- Processor reviews.
- Cross-border transfer assessment.
- Rights-request workflow.
- Incident/breach register.
- Privacy impact assessment for high-risk AI and sensitive-data features.

### 18.7 Breach Workflow

The incident module shall capture:

- Detection and awareness time.
- Data categories and volume.
- Affected subjects.
- Likely harm.
- Containment.
- Notification decision.
- Authority notification evidence.
- Candidate/employee notification evidence.
- Root cause.
- Corrective actions.

A configurable 72-hour authority-notification timer shall be available for incidents meeting the applicable reporting threshold, with legal/privacy review before submission.

---

## 19. AI Governance Requirements

### 19.1 Approved Uses

- CV parsing.
- Job-related skill extraction.
- Drafting job descriptions and communications for human review.
- Match-score suggestions.
- Candidate-summary generation.
- Interview-note structuring from authorized inputs.
- Duplicate suggestions.
- Compliance-rule retrieval assistance without autonomous legal decision.

### 19.2 Prohibited Uses

- Face/emotion analysis for hiring.
- Inferring protected/sensitive traits.
- Fully autonomous rejection or selection.
- Generating false qualifications or references.
- Scraping prohibited personal sources.
- Ranking based on photograph, name-origin inference, or non-job-related personal data.

### 19.3 Model Registry

Store:

- Model/provider.
- Version.
- Purpose.
- Data categories sent.
- Hosting/processing location.
- Retention policy.
- Evaluation results.
- Approval owner.
- Effective date.
- Rollback plan.

### 19.4 Candidate Transparency

Where AI materially assists screening, the privacy notice and candidate information shall accurately describe the processing at an appropriate level.

### 19.5 Human Override and Appeals

Recruiters can override scores with reason. Candidate correction/dispute channels shall be available for inaccurate data, subject to policy.

---

## 20. Reporting Definitions

### 20.1 Time to Approve

`requisition approved_at - requisition submitted_at`

### 20.2 Time to Publish

`job first_published_at - requisition approved_at`

### 20.3 Time to Fill

`first confirmed joining date for requisition - first job publication date`

The organization may also configure a hire-based version, but the definition must be explicit.

### 20.4 Time to Hire

`offer accepted date - application date`, or another approved definition. Reports must display the chosen definition.

### 20.5 Offer Acceptance Rate

`accepted offers / offers with final candidate response or expiry`

### 20.6 Join Conversion

`joined candidates / accepted offers`

### 20.7 Quality of Hire

A tenant-configurable weighted metric using probation outcome, early retention, manager rating, onboarding completion, and role-specific indicators.

### 20.8 Compliance Metrics

- Percentage of requisitions evaluated before publishing.
- Percentage of selected candidates re-evaluated.
- Overrides per 100 hires.
- Stale-rule exposure.
- Average blocker-resolution time.
- Contract discrepancy rate.

---

## 21. Notification Matrix

| Event | Recipient | Channel | Default Timing |
|---|---|---|---|
| Requisition submitted | Approver | In-app + email | Immediate |
| Approval overdue | Approver / escalation owner | In-app + email | SLA-based |
| Compliance blocked | Recruiter + compliance | In-app + email | Immediate |
| Job published | Recruiter / hiring manager | In-app | Immediate |
| Application submitted | Candidate | Email/SMS optional | Immediate |
| Candidate assigned | Recruiter | In-app | Immediate |
| Information missing | Candidate | Email/portal | Immediate |
| Assessment invited | Candidate | Email/portal | Immediate |
| Assessment due | Candidate | Email/SMS | Configurable |
| Interview scheduled | Candidate + interviewers | Email/calendar | Immediate |
| Scorecard overdue | Interviewer | In-app + email | SLA-based |
| Offer approval required | Approver | In-app + email | Immediate |
| Offer sent | Candidate | Email/portal | Immediate |
| Offer expiring | Candidate + recruiter | Email/in-app | Configurable |
| Offer accepted | Recruiter + HR + compliance | In-app + email | Immediate |
| Qiwa employee action pending | Candidate/owner | Email/portal/in-app | Configurable |
| Government case overdue | Government relations | In-app + email | SLA-based |
| Readiness blocker | Task owner | In-app | Immediate |
| Ready to join | HR + manager + candidate | Email/in-app | Immediate |
| Joining reminder | Candidate + manager | Email/SMS | Configurable |
| No show | HR + recruiter + manager | In-app + email | Immediate |
| Probation review due | Manager + HR | In-app + email | Configurable |
| Privacy request received | Privacy officer | In-app + email | Immediate |
| Security incident | Security/privacy owners | Alerting system | Immediate |

---

## 22. Migration Requirements

### 22.1 Migration Scope

Migrate where available:

- Existing job templates.
- Job postings.
- Applications.
- Candidate contact information.
- CVs and files.
- Stage history.
- Interviews.
- Notes.
- Scores.
- Hired linkage.

### 22.2 Migration Rules

- Preserve source IDs in legacy-reference fields.
- Do not invent missing history.
- Mark inferred data explicitly.
- Normalize emails and phones without overwriting originals.
- Detect duplicates and queue uncertain merges.
- Scan migrated files.
- Apply tenant and access classification.
- Produce reconciliation counts and exception reports.

### 22.3 Historical Status Mapping

Example:

| Legacy Status | New Status | Notes |
|---|---|---|
| submitted | APPLIED | Direct mapping |
| review | RECRUITER_SCREENING | Direct mapping |
| interview | INTERVIEW_1 | Preserve history note |
| offered | OFFER_SENT | Create legacy offer placeholder if document missing |
| hired | JOINED or CONFIRMED | Requires HR employee reconciliation |
| rejected | REJECTED | Preserve reason if available |

### 22.4 Migration Validation

- Record counts by tenant/table.
- File counts and hashes.
- Orphan detection.
- Candidate-to-application link validation.
- Employee linkage validation.
- Permission checks.
- Sample visual review.
- Rollback rehearsal.

### 22.5 Cutover

- Freeze or dual-write plan.
- Final delta migration.
- Validation sign-off.
- Redirect old routes.
- Monitor errors and support queue.
- Retain rollback option for agreed period.

---

## 23. Phased Delivery Plan

### Phase 0 — Discovery, Legal Validation, and Foundation

- Confirm target customer segments and activities.
- Review Saudi labour, localization, privacy, and government-process assumptions.
- Inventory current code and data.
- Define domain architecture.
- Define tenant, establishment, and permission model.
- Confirm integration availability.
- Approve privacy notices and retention strategy.
- Establish design system and bilingual terminology.

**Exit criteria:** approved architecture, regulatory review plan, migration inventory, and prioritized backlog.

### Phase 1 — Core ATS and Public Portal

- Requisitions and approvals.
- Compliance pre-check framework with manually maintained rule registry.
- Public careers portal.
- Job templates/form builder.
- Candidate applications and profiles.
- Duplicate review.
- ATS list/Kanban.
- Screening.
- Interview scheduling and scorecards.
- Email notifications.
- Core RBAC and audit.
- Basic analytics.

**Exit criteria:** a job can move from approved requisition through candidate selection with traceable compliance and decisions.

### Phase 2 — Offers and Employment Readiness

- Offer approval/versioning/secure response.
- Preboarding hire case.
- Saudi/non-Saudi branch templates.
- Qiwa contract manual tracking and reconciliation.
- Transfer/visa/professional-verification case tracking.
- GOSI/payroll/bank/insurance readiness.
- Ready-to-join gate.
- Joining confirmation and employee activation.

**Exit criteria:** accepted offers no longer become active employees prematurely; every hire has a readiness case.

### Phase 3 — Onboarding, Probation, and Advanced Compliance

- Preboarding task orchestration.
- Onboarding plans.
- Probation reviews.
- Quality-of-hire analytics.
- Compliance rule versioning and simulation.
- Override and evidence workflows.
- Privacy rights and automated retention.
- Integration health and reconciliation dashboards.

### Phase 4 — Intelligence and Ecosystem Integrations

- Saudi Employment Readiness Engine.
- Explainable AI matching.
- Authorized Jadarat/Qiwa/GOSI connectors where available.
- Assessment providers.
- Calendar and video integration.
- Agency portal.
- Advanced sourcing CRM.
- Workforce analytics.

### Phase 5 — Scale and Marketplace Options

- Recruitment-agency marketplace.
- Mobile application.
- Advanced campaign automation.
- Internal mobility.
- Graduate programs.
- Ajeer temporary-work flows.

---

## 24. Acceptance Criteria

### 24.1 Requisition and Compliance

| ID | Acceptance Criterion |
|---|---|
| AC-001 | A permitted user can create and save a requisition draft with bilingual title, occupation code, branch, headcount, budget, and target date. |
| AC-002 | Submitting a requisition creates the configured approval chain and immutable submission version. |
| AC-003 | An unapproved requisition cannot publish a job unless a permitted bypass with reason is used. |
| AC-004 | Every requisition receives a compliance result before publication. |
| AC-005 | A blocked compliance result prevents publication. |
| AC-006 | A stale rule produces a visible warning/manual-review state. |
| AC-007 | An override requires evidence and an independent approver. |
| AC-008 | Changing occupation, branch, nationality strategy, or salary triggers re-evaluation. |

### 24.2 Job and Portal

| ID | Acceptance Criterion |
|---|---|
| AC-009 | HR can create a posting from an approved requisition without re-entering core data. |
| AC-010 | Arabic and English previews show correct RTL/LTR layout. |
| AC-011 | Only published jobs appear on the public portal. |
| AC-012 | Public users can search and filter jobs on mobile and desktop. |
| AC-013 | A job page displays the correct privacy notice and application form version. |
| AC-014 | A closed/expired job refuses new applications with a clear message. |

### 24.3 Candidate and Application

| ID | Acceptance Criterion |
|---|---|
| AC-015 | A candidate can apply without an account and receives a reference number. |
| AC-016 | Application submission is idempotent and does not create duplicates after network retry. |
| AC-017 | Potential duplicate candidates are flagged for review rather than automatically merged. |
| AC-018 | The same candidate can have separate applications for different jobs. |
| AC-019 | Sensitive identifiers are not required on the initial generic application unless configured with approved justification. |
| AC-020 | Candidates can withdraw an active application from the portal. |
| AC-021 | Candidate-facing status does not expose internal notes or scores. |

### 24.4 Screening and ATS

| ID | Acceptance Criterion |
|---|---|
| AC-022 | Mandatory screening criteria produce an explainable outcome. |
| AC-023 | Missing parser data produces information-missing/manual review rather than automatic rejection. |
| AC-024 | AI match score displays weighted components and model/version. |
| AC-025 | A recruiter can override an AI recommendation with a reason. |
| AC-026 | Stage transitions record actor, previous stage, new stage, reason, and timestamp. |
| AC-027 | Invalid transitions are blocked with the unmet gate displayed. |
| AC-028 | Bulk transitions validate each application and report successes/failures. |
| AC-029 | Rejection requires an internal reason and uses an approved candidate message. |

### 24.5 Interviews and Assessments

| ID | Acceptance Criterion |
|---|---|
| AC-030 | Scheduling an interview creates invitations for the candidate and interviewers. |
| AC-031 | Rescheduling updates the same calendar event rather than creating an uncontrolled duplicate. |
| AC-032 | Interviewers can submit structured scorecards. |
| AC-033 | Interviewers cannot see others’ scorecards before submission when independent mode is enabled. |
| AC-034 | Overdue scorecards trigger reminders and appear in the recruiter queue. |
| AC-035 | Assessment results are linked to the correct application and assessment version. |

### 24.6 Selection and Offer

| ID | Acceptance Criterion |
|---|---|
| AC-036 | Final selection identifies preferred and reserve candidates. |
| AC-037 | Candidate-specific compliance is recalculated before offer approval. |
| AC-038 | An offer cannot be sent until all mandatory approvals complete. |
| AC-039 | Every negotiated change creates a new offer version. |
| AC-040 | Candidate response is tied to the exact offer version. |
| AC-041 | Expired or withdrawn links cannot accept an offer. |
| AC-042 | An accepted offer automatically creates an employment-readiness case. |
| AC-043 | An accepted offer does not create an active employee. |

### 24.7 Saudi and Non-Saudi Readiness

| ID | Acceptance Criterion |
|---|---|
| AC-044 | The system assigns the correct readiness template based on candidate branch classification. |
| AC-045 | A Saudi candidate case includes Qiwa, GOSI, payroll, and joining readiness tasks as configured. |
| AC-046 | A resident-transfer case records transfer reference and external/candidate actions. |
| AC-047 | An overseas case records verification, visa, arrival, permit, and contract tasks as configured. |
| AC-048 | Occupation/profession mismatches are visible and block readiness when mandatory. |
| AC-049 | Government case completion requires evidence or an authorized integration result. |
| AC-050 | External failure does not silently mark the case completed. |

### 24.8 Qiwa and Contract Reconciliation

| ID | Acceptance Criterion |
|---|---|
| AC-051 | Qiwa case supports draft, submitted, employee action, amendment, documented, rejected, and cancelled states. |
| AC-052 | The system compares accepted offer and Qiwa contract fields. |
| AC-053 | A material discrepancy blocks ready-to-join. |
| AC-054 | Resolving a discrepancy records owner, decision, evidence, and timestamp. |
| AC-055 | Contract evidence and external reference are available to authorized users only. |

### 24.9 Payroll, GOSI, and Joining

| ID | Acceptance Criterion |
|---|---|
| AC-056 | Payroll wage components are compared with accepted/documented terms. |
| AC-057 | GOSI readiness status and evidence can be tracked. |
| AC-058 | Bank information is encrypted and masked. |
| AC-059 | Required insurance enrollment is visible in readiness. |
| AC-060 | Ready-to-join is blocked while mandatory checklist items remain incomplete. |
| AC-061 | Joining confirmation records actual date and authorized confirmer. |
| AC-062 | Employee activation occurs only after joining confirmation. |
| AC-063 | A no-show case cancels or pauses downstream provisioning according to workflow. |

### 24.10 Onboarding and Probation

| ID | Acceptance Criterion |
|---|---|
| AC-064 | Preboarding templates create tasks for all configured owners. |
| AC-065 | Task dependencies prevent premature completion. |
| AC-066 | Candidate and internal task visibility are separated. |
| AC-067 | Onboarding completion is measurable. |
| AC-068 | Probation reviews are scheduled based on contract configuration. |
| AC-069 | Probation outcome requires authorized HR/manager decision. |
| AC-070 | Quality-of-hire analytics update after probation outcome. |

### 24.11 Privacy and Security

| ID | Acceptance Criterion |
|---|---|
| AC-071 | The candidate sees the active privacy notice before submission. |
| AC-072 | Notice/acknowledgement version is stored with the application. |
| AC-073 | A candidate can submit access, correction, and destruction requests. |
| AC-074 | Privacy requests have identity verification, SLA, decision, and response evidence. |
| AC-075 | Retention rules identify records due for deletion/anonymization. |
| AC-076 | Sensitive-data access is logged. |
| AC-077 | Unauthorized users receive no sensitive field values, including through exports or APIs. |
| AC-078 | Candidate files are malware scanned and unavailable while quarantined. |
| AC-079 | Cross-tenant access tests fail at API and database layers. |
| AC-080 | Offer and portal tokens are expiring, revocable, and purpose-bound. |

### 24.12 Analytics and Operations

| ID | Acceptance Criterion |
|---|---|
| AC-081 | Dashboard funnel counts reconcile with application records. |
| AC-082 | Time-to-fill definition is displayed in report metadata. |
| AC-083 | Source attribution is preserved through candidate merge. |
| AC-084 | Integration failures appear in an operational queue. |
| AC-085 | Audit events can reconstruct every high-risk transition. |
| AC-086 | Exports are permission checked, logged, and masked according to role. |
| AC-087 | Arabic email templates render correctly in major supported clients. |
| AC-088 | Public portal core flows meet accessibility test criteria. |

---

## 25. End-to-End Test Scenarios

### TS-001 Saudi Candidate — Successful Hire

1. Manager creates requisition.
2. Budget and compliance pass.
3. Requisition approved.
4. Job published.
5. Saudi candidate applies.
6. Candidate screened, assessed, and interviewed.
7. Candidate selected and offer approved.
8. Candidate accepts.
9. Preboarding case created.
10. Qiwa contract documented.
11. GOSI/payroll/bank/insurance readiness completed.
12. Candidate marked ready to join.
13. Joining confirmed.
14. Employee activated.
15. Probation completed and confirmed.

Expected: complete audit chain; no employee activation before step 13.

### TS-002 Non-Saudi Resident — Transfer Required

1. Candidate selected and classified as resident transfer.
2. Candidate-specific compliance passes with transfer conditions.
3. Offer accepted.
4. Transfer case created.
5. Establishment prerequisite checklist completed.
6. Transfer request reference recorded.
7. Candidate/external actions tracked.
8. Transfer completed.
9. Qiwa contract documented and reconciled.
10. Readiness completed and joining confirmed.

Expected: transfer failure or missing reference prevents ready-to-join.

### TS-003 Overseas Candidate — Professional Verification Required

1. Selected occupation triggers verification rule.
2. Offer acceptance creates verification and visa cases.
3. Verification result pending.
4. System blocks readiness while pending.
5. Verification clears.
6. Visa, arrival, permit, Qiwa, and payroll tasks complete.
7. Candidate joins.

Expected: evidence and external references are retained; occupation consistency is checked.

### TS-004 Localized Profession Block

1. Recruiter selects an occupation restricted to Saudis.
2. Requisition strategy indicates non-Saudi candidate.
3. Compliance returns blocked.
4. Job cannot publish under that strategy.
5. Authorized user changes strategy or occupation and re-evaluates.

Expected: no bypass without configured override process; every change auditable.

### TS-005 Qiwa Salary Discrepancy

1. Accepted offer basic salary is entered.
2. Qiwa contract snapshot contains a different basic salary.
3. Reconciliation creates material discrepancy.
4. Ready-to-join is blocked.
5. Contract or internal terms are corrected through authorized amendment.
6. Reconciliation passes.

### TS-006 Candidate Duplicate

1. Candidate applies with a previously used email/phone.
2. System identifies possible duplicate.
3. Recruiter compares profiles.
4. Profiles merge without losing applications or source data.
5. Candidate privacy preferences remain intact.

### TS-007 Privacy Destruction Request

1. Rejected candidate submits destruction request.
2. Identity is verified.
3. System checks legal hold and retention exceptions.
4. Approved records are destroyed/anonymized.
5. Candidate receives response.
6. Audit record remains without unnecessary personal content.

### TS-008 Integration Outage

1. Offer accepted.
2. External government link/service is unavailable.
3. Internal readiness case remains valid.
4. Integration status is failed/unavailable.
5. Owner receives task and retry occurs.
6. Manual evidence can be recorded when policy allows.

Expected: no false completion and no loss of accepted offer state.

### TS-009 No Show

1. Candidate marked ready to join.
2. Candidate does not appear.
3. HR opens no-show case.
4. Candidate contact attempts logged.
5. IT/facilities tasks cancelled or recovered.
6. Final decision recorded.
7. Application and offer close correctly.

### TS-010 Rule Update with Future Effective Date

1. Compliance admin adds a new localization rule effective in the future.
2. Existing requisition before effective date evaluates under old version.
3. New requisition after effective date evaluates under new version.
4. Reports show applied rule version.

---

## 26. Operational Roles and Responsibility Matrix

| Activity | Recruiter | Hiring Manager | HR | Compliance | Gov. Relations | Finance/Payroll | Privacy | IT/Facilities |
|---|---|---|---|---|---|---|---|---|
| Create requisition | C/R | R | C | I | I | C | I | I |
| Approve requisition | I | A/C | A | C | I | C | I | I |
| Compliance review | C | I | C | A/R | C | I | I | I |
| Publish job | R | C | A | I | I | I | I | I |
| Screen candidate | R | C | C | I | I | I | I | I |
| Interview/select | C | A/R | C | I | I | I | I | I |
| Offer approval | R | A/C | A | C | I | A/C | I | I |
| Qiwa/transfer/visa | I | I | C | C | A/R | I | I | I |
| Payroll/GOSI readiness | I | I | A/C | I | C | A/R | I | I |
| Privacy request | I | I | C | I | I | I | A/R | I |
| Joining confirmation | C | C | A/R | I | C | C | I | C |
| Onboarding task | I | R | A | I | I | C | I | R |

Legend: **R** Responsible, **A** Accountable, **C** Consulted, **I** Informed.

---

## 27. Risks and Mitigations

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---:|---:|---|
| R-01 | Regulatory rules change | High | High | Versioned rule registry, review dates, official sources, legal review |
| R-02 | Government API unavailable | High | Medium | Manual/deep-link workflow, evidence, reconciliation; do not promise direct integration |
| R-03 | Incorrect automated compliance conclusion | Medium | High | Explainable results, stale detection, human approval, no legal-advice claim |
| R-04 | Premature employee activation | Medium | High | Hard ready-to-join and joining gates |
| R-05 | Candidate PII breach | Medium | Critical | Encryption, least privilege, audit, DLP, incident response |
| R-06 | AI bias or inaccurate parsing | Medium | High | Human review, prohibited features, monitoring, correction workflow |
| R-07 | Offer/Qiwa mismatch | Medium | High | Field reconciliation and blocking discrepancy workflow |
| R-08 | Duplicate candidates | High | Medium | Identity resolution and controlled merge |
| R-09 | Email/SMS failure | Medium | Medium | Queue, retry, provider fallback, operational alerts |
| R-10 | Migration corruption | Medium | High | Reconciliation, backups, staged rehearsal, rollback |
| R-11 | Recruiter resistance | Medium | Medium | Simple workflows, training, pilot, feedback, phased rollout |
| R-12 | Excessive candidate data collection | Medium | High | Progressive collection and form governance |
| R-13 | Cross-border processor risk | Medium | High | Transfer assessment, safeguards, provider registry |
| R-14 | Stale establishment snapshot | High | High | Snapshot expiry, manual review, reconciliation reminders |
| R-15 | No-show after expensive onboarding | Medium | Medium | Joining reconfirmation, phased provisioning, no-show workflow |
| R-16 | Over-customized tenant workflows | Medium | Medium | Guardrails, versioned templates, supported extension points |

---

## 28. Assumptions and Dependencies

### 28.1 Assumptions

- The existing multi-tenant authentication, organization, HR, department, and employee foundations will be reused where suitable.
- Arabic is the default tenant-user and candidate experience.
- Government systems remain external systems of record.
- Tenant compliance teams are responsible for entering or validating organization-specific data not available through integration.
- Legal and privacy policies will be approved before production.
- Recruitment is primarily for private-sector corporate employment, not domestic workers.

### 28.2 Dependencies

- Approved organization and establishment master data.
- Saudi occupation-code master data.
- Current localization/compliance rules and source-review process.
- Email/SMS provider.
- Private file storage and malware scanning.
- Calendar provider for interview integration.
- HRIS/payroll employee-creation contract.
- Privacy notice, retention schedule, and data-processing inventory.
- Access to official government services by authorized organization representatives.

### 28.3 Decisions Required Before Build

1. Which customer activities and company sizes are targeted first?
2. Will Phase 1 use manual compliance snapshots or an available data source?
3. Which government-platform integrations are contractually and technically available?
4. Is candidate self-service mandatory in Phase 1?
5. Which SMS/email providers and hosting regions are approved?
6. What is the approved retention schedule by candidate outcome?
7. Which roles may view full identity, compensation, and government evidence?
8. Is a pending employee record created on offer acceptance or only at ready-to-join?
9. Which HRIS/payroll system receives the final employee record?
10. Which assessment and calendar providers are required?
11. Will agency and referral modules launch with the core product?
12. What exact quality-of-hire definition will management use?

---

## 29. Definition of Done

A feature is done only when:

- Business requirements and acceptance criteria are met.
- Arabic and English behavior is complete.
- RTL/LTR visual QA passes.
- Authorization and tenant-isolation tests pass.
- Audit events are implemented.
- Privacy and retention behavior is defined.
- Accessibility checks pass.
- Unit, integration, and end-to-end tests pass.
- Migration impact is assessed.
- Monitoring and alerts exist.
- User documentation and runbook are updated.
- Product owner and required compliance/privacy reviewers approve.

---

## 30. Recommended Implementation Architecture

### 30.1 Domain Modules

```text
Identity & Access
Organization & Establishments
Workforce Requisitions
Compliance Rules & Evaluations
Job Publishing
Candidate CRM
Applications & ATS
Assessments
Interviews
Selection
Offers
Employment Readiness
Government Cases
Preboarding & Onboarding
Probation
Communications
Privacy Operations
Analytics & Audit
Integrations
```

### 30.2 Separation of Records

- `candidate` is a person in the talent domain.
- `application` is the candidate’s relationship to one job.
- `offer` is a versioned proposal tied to an application.
- `employment_readiness_case` begins after accepted offer.
- `employee` begins only after joining/activation rules.

This separation prevents state corruption and preserves history.

### 30.3 Workflow Engine

Use a durable workflow/state-machine approach for approvals, candidate stages, government cases, and onboarding tasks. Workflows must support:

- State guards.
- Timers.
- Human tasks.
- External callbacks.
- Retries.
- Compensation/cancellation.
- Versioning.
- Audit.

### 30.4 Rule Engine

Compliance logic should be data-driven and tested in a sandbox before publishing. Each ruleset release shall include regression scenarios and expected outcomes.

### 30.5 Search

Search indexes may contain only approved fields. Sensitive identity and bank fields must not enter general search indexes.

---

## 31. Regulatory Reference Basis

The following official sources informed the requirements. They must be revalidated during legal and compliance review because procedures and requirements can change.

1. **HRSD — Contract Management:** establishments can create/document employment contracts electronically; employees can approve, reject, or request amendment through Qiwa Individuals.  
   https://www.hrsd.gov.sa/en/ministry-services/services/%D8%A5%D8%AF%D8%A7%D8%B1%D8%A9-%D8%A7%D9%84%D8%B9%D9%82%D9%88%D8%AF

2. **HRSD — Request for Transfer of Expatriate Workers:** Qiwa service for requesting employee transfer from another employer, including establishment-level conditions and employment-contract creation.  
   https://www.hrsd.gov.sa/en/ministry-services/services/%D8%B7%D9%84%D8%A8-%D9%86%D9%82%D9%84-%D8%A7%D9%84%D8%B9%D9%85%D8%A7%D9%84%D8%A9-%D8%A7%D9%84%D9%88%D8%A7%D9%81%D8%AF%D8%A9

3. **HRSD — Employment of Non-Saudis:** recruitment requires Ministry approval; non-Saudis require work permits and applicable qualifications/conditions.  
   https://www.hrsd.gov.sa/en/%D8%AA%D9%88%D8%B8%D9%8A%D9%81-%D8%BA%D9%8A%D8%B1-%D8%A7%D9%84%D8%B3%D8%B9%D9%88%D8%AF%D9%8A%D9%8A%D9%86

4. **HRSD — Issue and Renew Work Licence:** work permits for expatriate workers are linked to lawful residency and establishment conditions.  
   https://www.hrsd.gov.sa/en/ministry-services/services/%D8%A5%D8%B5%D8%AF%D8%A7%D8%B1-%D9%88-%D8%AA%D8%AC%D8%AF%D9%8A%D8%AF-%D8%B1%D8%AE%D8%B5-%D8%A7%D9%84%D8%B9%D9%85%D9%84

5. **HRSD — Professional Verification:** verification of qualifications, experience, and skills for applicable expatriate professions.  
   https://www.hrsd.gov.sa/en/care-about-you/skillsandtrain

6. **HRSD — Developed Nitaqat Procedural Guide (2026 page):** the program links localization rates to establishment/workforce conditions and requires current procedural guidance.  
   https://www.hrsd.gov.sa/knowledge-centre/decisions-and-regulations/regulation-and-procedures/%D8%A7%D9%84%D8%AF%D9%84%D9%8A%D9%84-%D8%A7%D9%84%D8%A5%D8%AC%D8%B1%D8%A7%D8%A6%D9%8A-%D9%84%D8%A8%D8%B1%D9%86%D8%A7%D9%85%D8%AC-%D9%86%D8%B7%D8%A7%D9%82%D8%A7%D8%AA-%D8%A7%D9%84%D9%85%D8%B7%D9%88%D8%B1

7. **HRDF — Jadarat:** unified national employment platform enabling job-opportunity management and candidate access.  
   https://www.hrdf.org.sa/en/products-and-services/programs/establishments/other/jadarat/

8. **GOSI — Employer/Registration Services:** employers can add, exclude, transfer, and manage contributor and wage information through GOSI services.  
   https://www.gosi.gov.sa/GOSIOnline/Registration

9. **HRSD — Wage Protection:** monitors payment of private-sector wages for Saudi and non-Saudi employees according to agreed wage information.  
   https://www.hrsd.gov.sa/ministry-services/services/%D8%B1%D9%81%D8%B9-%D9%85%D9%84%D9%81-%D8%AD%D9%85%D8%A7%D9%8A%D8%A9-%D8%A7%D9%84%D8%A3%D8%AC%D9%88%D8%B1

10. **SDAIA / National Data Governance Platform — Personal Data Protection Law and Implementing Regulations:** personal-data definitions, controller obligations, rights, and processing requirements.  
    https://dgp.sdaia.gov.sa/wps/portal/pdp/knowledgecenter/details/PDPL/  
    https://dgp.sdaia.gov.sa/wps/portal/pdp/knowledgecenter/details/PDPL2/

11. **SDAIA — Regulation on Personal Data Transfer Outside the Kingdom:** safeguards and risk assessment for applicable cross-border transfers.  
    https://dgp.sdaia.gov.sa/wps/portal/pdp/knowledgecenter/details/RegulationonPersonalDataTransferOutsidetheKingdom/

12. **SDAIA — Personal Data Breach Notification:** notification service describes a 72-hour reporting period for qualifying incidents after awareness.  
    https://dgp.sdaia.gov.sa/wps/portal/pdp/services/personaldatabreachnotification/

13. **HRSD — Ajeer Permit Issuance:** temporary-work permit workflow for work at a specific facility for a defined temporary period.  
    https://www.hrsd.gov.sa/en/ministry-services/services/%D8%A5%D8%B5%D8%AF%D8%A7%D8%B1-%D8%AA%D8%B5%D8%A7%D8%B1%D9%8A%D8%AD-%D8%A3%D8%AC%D9%8A%D8%B1

### 31.1 Regulatory Update Requirement

Before every production compliance-rules release:

1. Review the current HRSD localization decisions and procedural guides.
2. Review occupation-code and professional-regulator changes.
3. Review Qiwa service requirements.
4. Review PDPL/SDAIA guidance.
5. Record source, publication date, reviewer, and effective date.
6. Run regression scenarios.
7. Obtain compliance approval.

---

## 32. Final Product Flow Summary

```text
WORKFORCE PLANNING
  Need → Requisition → Budget → Saudi Compliance → Approval

RECRUITMENT
  Posting → Sourcing → Application → Screening → Assessment
  → Interviews → Selection → Pre-Offer Checks

OFFER
  Offer Draft → Approval → Send → Negotiate → Accept

EMPLOYMENT READINESS
  Create Preboarding Case → Candidate Branch
  → Compliance / Verification / Transfer / Visa
  → Qiwa Contract → GOSI / Payroll / Bank / Insurance
  → Preboarding Tasks → Ready to Join

EMPLOYMENT
  Joining Confirmation → Employee Activation → Onboarding
  → Probation → Confirmation / Extension / Exit

CONTINUOUS GOVERNANCE
  Privacy → Security → Audit → Analytics → Rule Updates
```

---

## 33. Final Approval Checklist

Before approving this BRD for implementation, confirm:

- [ ] Product owner approves scope and phases.
- [ ] Saudi labour/compliance reviewer approves flow and terminology.
- [ ] Privacy officer approves candidate-data lifecycle.
- [ ] Security approves classification and access controls.
- [ ] Finance/payroll approves compensation and readiness mapping.
- [ ] Government relations approves Qiwa/transfer/visa case fields.
- [ ] HR approves onboarding and probation outcomes.
- [ ] Engineering approves architecture and integration assumptions.
- [ ] Data/analytics approves KPI definitions.
- [ ] Arabic UX/content reviewer approves terminology and RTL design.
- [ ] Government integration availability is documented without unsupported promises.
- [ ] Phase 1 acceptance criteria are converted into implementation tickets.

---

*End of Document*

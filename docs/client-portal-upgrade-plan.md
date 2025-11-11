# Client Portal Upgrade Plan (UAE • KSA • Egypt)

A comprehensive, phased implementation plan to upgrade the client portal for a multi-country tax platform. The plan aligns features visible in the reference UI with the needs of a tax-filing product and adapts them to regulatory requirements of UAE, KSA, and Egypt.

---

## 1) Snapshot: What the reference UI conveys and how it maps to a tax portal

Key elements observed in the provided screenshot and recommended mapping:

- Left sidebar menu (Messaging, Current Account, Payment Gateway, Corporate Cards, Connected Banking, Trademark, Documents)
  - Messaging → Secure in-portal conversations, cases, and task threads per filing period.
  - Current Account / Connected Banking → Bank feeds for reconciliation and cash/expense evidence supporting returns (read-only). Regional support for local banks.
  - Payment Gateway → Client invoices, online payments for firm fees; links to government payment references (FTA/ZATCA/ETA portals) when applicable.
  - Corporate Cards → Receipts inbox; OCR to tag VAT or deductible categories; optional.
  - Trademark → Replace with “Registrations & Certificates” (TRN, ZATCA e-invoice device IDs, ETA profile, ESR submissions, commercial registration documents).
  - Documents → Source-of-truth document vault with folders by Entity→Year→Tax Type.

- Top navigation (Dashboard, Accounts, Updates, Teams, AI Agents, Billing, Support)
  - Dashboard → Filing calendar, upcoming/overdue actionables, return status widgets.
  - Accounts → Entities & People; client teams and permissions.
  - Updates → Compliance alerts (rate changes, schema changes like ZATCA Phase-2, ETA updates), and product release notes.
  - Teams → Client-side user management (owners, finance, auditor access). 
  - AI Agents → Assisted intake, doc classification, compliance Q&A, checklist generation.
  - Billing → Firm billing and client invoices, payment methods, credit balance.
  - Support → Knowledge base, tickets, SLA status, live chat.

- Center content (Entities/People tabs, empty state, search, new buttons)
  - Entities ↔ client companies; People ↔ individual taxpayers and authorized users.
  - Deep search across entities, returns, invoices, docs.
  - “+” actions to add Entity/Person; smart templates by country.

- Right panel (Business Actionables → Upcoming/Renewals)
  - Filing deadlines and renewals: VAT returns, Corporate Tax, Zakat (KSA), ESR (UAE), Withholding Tax (KSA), E-invoice device renewals (KSA), activity renewals (Egypt: e-invoicing profile/ETA obligations).

- Other elements: Dark theme, notifications, quick sign out, privacy badge, chat bubble
  - Maintain dark theme with accessible color contrast. Notifications unify portal, email, and WhatsApp/SMS (opt-in).

---

## 2) Product Goals

- Single portal for clients across UAE, KSA, Egypt to manage tax obligations, returns, payments, and compliance artifacts.
- Reduce back-and-forth via messaging, structured tasks, and automated intake.
- Provide audit-ready, immutable records (docs, approvals, timelines).
- Minimize regional friction with country-specific automations and checklists.

---

## 3) Regulatory Landscape (country highlights)

- UAE
  - VAT (FTA): 5% VAT returns, refund claims, voluntary disclosures, ESR notifications/reports, Corporate Tax (9% effective now) returns.
  - TRN validation, FTA e-Services flows (link-out for payment/submission with tracked references).
- KSA
  - ZATCA VAT (15%), Zakat (for certain entities), Withholding Tax, e-Invoicing (Phase-2, integration compliance: reporting/clearance, device and CSR/CRT management), e-archiving requirements.
- Egypt
  - ETA VAT and e-Invoicing clearance, e-Receipt for B2C, withholding/stamp where applicable; identity and certificate management.

Implications: separate templates, calendars, validations, and evidentiary document sets per country; configurable per entity.

---

## 4) Information Architecture

- Tenancy
  - Tenant = client group; Entity = legal company or individual taxpayer; People = users or directors; Advisors = firm users.
- Primary Objects
  - Entity profiles: country, registrations (TRN/ZATCA/ETA), activity, fiscal calendar.
  - Filing cycles: VAT, Corporate Tax, Zakat, ESR, WHT, e-Invoice obligations.
  - Documents: categories (invoices, bank statements, contracts, payroll, fixed assets, tax adjustments), retention rules.
  - Tasks & checklists: per filing period, per obligation.
  - Payments & invoices: firm invoices, official references, reconciliation.
  - Messages & tickets: case threads tied to returns and tasks.
  - Banking connections: read-only transactions, statement fetch, receipts OCR pipeline.
  - Notifications: digest, deadline alerts, missing-evidence reminders.

---

## 5) Phased Implementation Plan

Each phase includes objectives, key tasks, acceptance criteria, and dependencies. Use feature flags for safe rollout. Adopt a country-by-country vertical slice approach when needed.

### Phase 0 — Foundations (Architecture, Security, Localization)
- Objectives
  - Harden multi-tenancy; enforce RLS; country-aware settings; Arabic/English i18n; timezones; currencies; dark/light modes.
- Key Tasks
  - RBAC: roles (Client Owner, Finance, Viewer, Auditor, Advisor), scoped to Tenant/Entity.
  - Country config registry (UAE/KSA/EGY) with obligations, calendars, forms, validation rules.
  - Activity log + audit trails; data retention policies by country.
  - Observability: Sentry, performance metrics, structured logs, alerting.
- Acceptance
  - All pages respect tenant + role scoping; language toggle; unit/integration tests for RLS and RBAC.

### Phase 1 — Entities & People (replaces Entities/People tabs)
- Tasks
  - Entity creation wizard per country (collect TRN/TIN, registration certificates, fiscal year, VAT status).
  - People management with invitations and 2FA; role assignment; KYC verification.
  - Search across entities and people; bulk import.
- Acceptance
  - Create/edit/archive entities; invite users; permission matrix enforced.

### Phase 1.1 — Business Account Setup Wizard (Modal)
- Purpose
  - Allow clients to create a business account from a focused modal, matching the reference UI: two tabs (Existing Entity Setup, New Entity Setup), country flag indicator, license-number driven verification, consent checkbox, prominent primary CTA, support partner label, and chat link.
- UX Requirements
  - Modal overlay with focus trap, ESC to close, and ARIA roles (dialog, aria-labelledby/aria-describedby). Keyboard-only and screen-reader friendly. Persist dark theme.
  - Tabs: "Existing Entity Setup" (search/verify existing registrations and auto-link) and "New Entity Setup" (create new entity with license details).
  - Fields (UAE default): License Number, Business Name, Economic Department/Free Zone (select), TRN (optional at creation), Legal Form (LLC, Sole Establishment, etc.), Incorporation Date, Attachments (trade license PDF/JPG, certificate). Terms consent checkbox with link to agreement. CTA text: "Set up Business".
  - Helpers: country switcher (UAE/KSA/EGY), inline validation messages, empty-state copy on mismatch, support partner label, live chat link.
- Regional Variants
  - UAE: Validate DED/Free-zone license, TRN format (15 digits), ESR applicability flag, Corporate Tax applicability.
  - KSA: CR Number, VAT Registration Number, optional Zakat flag; no e-invoice device at setup; city/region selector.
  - Egypt: Tax ID (TIN), ETA profile number, activity code (GPC/industry), e-Invoicing obligation flag.
- Validation & Integrations
  - Real-time license lookup adapters (pluggable): UAE (DED + major free zones), KSA (MC / CR), Egypt (GAFI/ETA where permitted). Fallback to manual verification workflow.
  - TRN/VAT/TIN checksum validation, name similarity (Levenshtein) with license record; duplicate-entity prevention and merge suggestion.
  - File uploads scanned for malware; OCR to prefill Business Name and number.
- Data Model Additions
  - entity_licenses(id, entity_id, country, authority, license_number, legal_form, issued_at, expires_at, economic_zone_id, status, metadata).
  - entity_registrations(id, entity_id, type[TRN/ZATCA/ETA/WHT/ZAKAT], value, verified_at, source, status).
  - economic_zones(id, country, name, authority_code, city, metadata).
  - consents(id, subject_type, subject_id, type[terms|privacy|service], version, accepted_by, accepted_at, ip, user_agent).
  - verification_attempts(id, type[license|tax_id], value, country, status, result, attempted_by, attempted_at, correlation_id).
- API Design
  - POST /api/entities/setup (idempotent with Idempotency-Key header). Payload: country, tab, license_number, business_name, economic_zone_id, legal_form, registrations[], attachments[], consent_version.
  - GET /api/registries/:country/license/:number → normalized license record; cache with TTL and ETag; rate limiting.
  - POST /api/consents → record explicit consent with IP/UA; linked to entity/user.
  - Emits audit events: entity.setup.requested, entity.setup.verified, entity.setup.completed, entity.setup.failed.
- Security & Privacy
  - RLS on all tables by tenant/entity; encrypted columns for IDs/certificates; redact PII in logs.
  - Virus scan on uploads; content-type verification; size limits; signed URLs; temporary storage before verification.
- Error States
  - License not found, registry unavailable, duplicate entity, invalid consent; present fallback: “Continue with manual review” opening a case in Messaging.
  - Show support partner block and Chat CTA on repeat failures.
- Acceptance Criteria
  - End-to-end setup succeeds for happy-path in UAE/KSA/EGY; duplicate protection; consent captured with timestamp/IP/UA; audit events present.
  - Accessibility verified (tab order, labels, contrast); localized AR/EN content; RTL layout correct.
- Telemetry
  - Funnel metrics: view → submit → verified → completed; reason codes for drop-offs; time-to-completion; registry latency.
- Testing
  - Unit tests for validators; contract tests for adapters; E2E flows: existing vs new entity, duplicate, offline registry, manual review route.

### Phase 1.1A — Business Account Setup Wizard (Mobile screens)
- Observed UI (from images)
  - Header with Back button, title “Business Setup”, profile/avatar.
  - Global search bar (placeholder: “Search Services”).
  - Segmented tabs: Existing Business | New Startup | Individual.
  - Form fields: License Number, Business (name), Department (select with dropdown: e.g., Abu Dhabi Airports Free Zone, Abu Dhabi Department of Economic Development, Abu Dhabi Global Market).
  - Consent: “I agree to … License agreement” with hyperlink.
  - Primary CTA: Swipe to Setup — rightward swipeable pill/gradient button with arrow.
- UX/Behavior
  - Form validation: required Business and Department; Existing Business requires License Number. License supports alphanumeric (e.g., CR124686P). Inline errors below inputs.
  - Department dropdown searchable, virtualized list; options sourced from economic_zones table filtered by country/emirate.
  - “Existing Business” → attempt license lookup; prefill Business/Department; allow manual override with change log entry.
  - “New Startup” → hide License Number; show Proposed Name, Emirate/Zone; optional name reservation step; create entity in Draft state.
  - “Individual” → Emirates ID/TIN input, DOB; create individual taxpayer entity with minimal fields.
  - Swipe-to-setup: track drag width; enable only when form valid and consent checked; haptic on threshold; cancel if released before threshold; loading state after trigger; prevent double submit via idempotency key.
- Accessibility & i18n
  - 44px+ touch targets; semantic labels; focus order aligns top-to-bottom; talkback announcements for tab changes and validation; supports RTL Arabic with mirrored swipe (right-to-left → swipe left to confirm) based on locale.
- Telemetry
  - Events: setup.view, tab.change, license.lookup.start/success/fail, dept.search, consent.toggle, swipe.start/complete/cancel, setup.submit/success/error; durations and error codes.
- Error states
  - License not found, registry rate-limited, name mismatch >20% distance, duplicate entity; provide “Continue with manual review” CTA.
- API usage
  - Reuse POST /api/entities/setup, GET /api/registries/:country/license/:number, POST /api/consents. Attach user locale and device to payload.
- Testing
  - Unit: validators (CR/ID formats), swipe reducer; Integration: tab flows; E2E: happy path and offline registry; RTL snapshots.

### Phase 1.1B — Business Verification (post “Swipe to Setup”)
- Observed UI
  - Title: “Business Verification”; large success icon; celebratory copy; primary CTA: “Continue”.
- Flow & States
  - Immediately after swipe: create setup job with idempotency key and return entity_setup_id. Show Pending screen, then Success/Error.
  - Pending: spinner + copy “Verifying your license and details (≈ <5 min). We’ll notify you when done.” Offer “Continue in background”.
  - Success: screen per image; CTA routes to Entity Overview with checklist and actionables.
  - Error: friendly failure screen with reason code (not found/duplicate/rate-limited) and CTAs: Try again, Manual Review (opens Messaging case), Contact Support.
- Backend
  - Queue job: verify license/registrations, OCR attachments, create entity, record consent, emit audit events.
  - Webhooks/adapters for registries with exponential backoff. Persist verification_attempts.
  - Real-time status via Postgres NOTIFY or Redis pub/sub; fallback to polling (2s → 5s backoff, cap 60s).
- Telemetry & Copy
  - Events: setup.status.pending/success/error, time_to_verify, registry.latency, retries, error_code.
  - Localized AR/EN strings; tone concise; number/date formatting per locale.
- Security & Compliance
  - Do not expose PII in toasts/logs; mask license numbers; encrypt identifiers at rest.
- Acceptance Criteria
  - Success screen appears only after persisted entity + audit log; deep-link works; reconnection resumes last state; RTL layout validated.

### Phase 2 — Dashboard & Actionables (right panel)
- Tasks
  - Action center with upcoming/overdue filings, renewals, and required evidence.
  - Calendar view per entity/country; ICS export and WhatsApp/SMS/email reminders (opt-in).
  - Empty states and “next-best-action” guidance.
- Acceptance
  - Accurate deadlines by country; SLA timers on tasks; notification dispatch tested.

### Phase 3 — Documents Vault
- Tasks
  - Entity→Year→Tax Type foldering; drag-drop; OCR + auto-tag; versioning; e-sign; immutable audit log.
  - Templates: bank statements, purchase/sales, payroll, fixed assets, adjustments.
  - Link docs to tasks and return line items; deduplication; virus scanning.
- Acceptance
  - All uploads virus-scanned; >95% OCR accuracy benchmark on test set; auditable trails.

### Phase 4 — Messaging & Support (left “Messaging”, top “Support”)
- Tasks
  - Case-based messaging tied to returns/tasks; canned replies; SLA timers.
  - Knowledge base; ticketing; live chat; multilingual macros.
- Acceptance
  - All messages immutable and exportable; SLA dashboards.

### Phase 5 — Payments & Billing (left “Payment Gateway”, top “Billing”)
- Tasks
  - Firm invoices; cards/bank transfer; partial payments; refunds; dunning.
  - Store official references to FTA/ZATCA/ETA payments (link-out); reconcile against filings.
- Acceptance
  - PCI-compliant processor; invoices mapped to tasks/returns; ledger reconciliation.

### Phase 6 — Connected Banking & Receipts (left “Connected Banking/Corporate Cards”)
- Tasks
  - Aggregator integrations for UAE/KSA/EGY banks (read-only). CSV fallback.
  - Receipt inbox with mobile capture; vendor/VAT extraction; match to transactions.
- Acceptance
  - 90% auto-match rate on controlled dataset; manual workflows for exceptions.

### Phase 7 — Tax Filing Workflows (country-specific)
- UAE
  - VAT returns, refund claims, voluntary disclosures, Corporate Tax returns; ESR notifications/reports.
  - Validations: TRN, reverse-charge, exempt/zero-rated mapping, rate changes.
- KSA
  - VAT returns, Zakat computations, WHT calculations; e-invoice compliance artifacts.
  - ZATCA metadata capture (device IDs, certificates), return working papers.
- Egypt
  - ETA VAT return and clearance statuses; e-Invoice/e-Receipt references; withholding/stamp logic where applicable.
- Acceptance
  - End-to-end flow: intake checklist → doc evidence → computations → review/approve → payment reference → archive.

### Phase 8 — E‑Invoicing Integrations (KSA & Egypt)
- Tasks
  - KSA ZATCA Phase-2 APIs: CSR/CRT, clearance/reporting, e-archiving schema.
  - Egypt ETA clearance: document signing, statuses, error handling.
- Acceptance
  - Conformance tests pass; per-entity keys rotation; tamper-proof storage.

### Phase 9 — AI Agents (top nav)
- Tasks
  - Intake assistant: find missing docs; create checklists; answer compliance questions with citations.
  - Document classification and anomaly detection (VAT outliers, WHT edge cases).
- Acceptance
  - Human-in-the-loop approvals; drift monitoring; prompt/response logging without PII leakage.

### Phase 10 — Teams & Permissions (top nav "Teams")
- Tasks
  - Team spaces, shared views, read-only auditor links, masked-doc view.
- Acceptance
  - External auditor access is time-bound and read-only; redaction tools available.

### Phase 11 — Accessibility, Internationalization, Mobile
- Tasks
  - Full WCAG 2.2 AA, Arabic RTL layouts, responsive components, print-friendly returns.
- Acceptance
  - Axe clean runs; manual test scripts; RTL screenshots.

### Phase 12 — Analytics, SLAs, and Reporting
- Tasks
  - Operational dashboards: cycle-time, first-time-right, reminders efficacy.
  - Client reports: tax paid/collected, VAT position, Zakat/WHT summaries.
- Acceptance
  - SLOs defined; alerts wired; self-serve client reports.

### Phase 13 — Migration & Cutover
- Tasks
  - Data model migration; import legacy entities/docs; backfill registrations and calendars.
  - Dual-run with feature flags; rollback playbook.
- Acceptance
  - Reconciled counts; dry run success; <0.1% critical discrepancies.

### Phase 14 — Security & Compliance
- Tasks
  - 2FA/Step-up auth, IP allowlists, device approvals, encryption at rest, key rotation.
  - Country-specific data retention; SAR/erasure; detailed audit logs.
- Acceptance
  - Pen test issues remediated; DPA/ToS updates; incident response drills.

### Phase 15 — Go-Live & Post-Launch
- Tasks
  - Canary cohorts; support playbook; NPS + CSAT instrumentation; backlog grooming.
- Acceptance
  - KPI thresholds met; stabilization complete.

---

## 6) Technical Blueprint

- Stack alignment
  - Next.js (already in repo) with API routes; Neon Postgres; Upstash Redis cache; Sentry.
  - Server-side validation layer per country; feature flags for phased enablement.
- Data model (high level)
  - Tenants, Entities, People, Registrations (TRN/ZATCA/ETA), Obligations, FilingPeriods, Tasks, Documents, Messages, Invoices, Payments, BankConnections, Transactions, EInvoiceDevices (KSA), Certificates (EGY), AuditLogs, Notifications.
- Integrations
  - Government: FTA (UAE, link-out + reference capture), ZATCA (KSA), ETA (Egypt).
  - Banking aggregators (region providers or Plaid-alternatives); storage with virus scanning; OCR.
  - Payments: Stripe-like processor for firm invoices; webhook verification and reconciliation.
- Security
  - RLS, encrypted fields (keys, certs), scoped API tokens per entity; end-to-end audit.

---

## 7) Acceptance Criteria (cross-cutting)

- Every client activity is traceable to a tenant/entity and appears in audit logs.
- All deadlines reflect correct regional calendars and daylight rules.
- Multilingual UI (Arabic/English) end-to-end including PDFs and emails.
- 99th percentile p95 < 400ms for portal core actions; Sentry error budget respected.

---

## 8) Success Metrics

- 50% reduction in time-to-complete VAT return (median) after rollout.
- 80%+ of required evidence auto-detected or proactively requested pre-review.
- <2% overdue filings among active clients with notifications enabled.
- NPS ≥ 45; CSAT ≥ 4.6/5 for support tickets.

---

## 9) Risks & Mitigations

- Government API volatility → Versioned adapters; automated contract tests; feature flags.
- Bank aggregation gaps → CSV fallback + manual workflows.
- Data privacy across countries → Residency-aware storage options; configurable retention.
- AI hallucinations → Guardrails, retrieval with citations, reviewer gates.

---

## 10) Timeline (indicative)

- Q1: Phases 0–2
- Q2: Phases 3–6
- Q3: Phases 7–9
- Q4: Phases 10–15 and global hardening

---

## 11) Backlog / Nice-to-Have

- Mobile receipts app; auto-categorization tuned for local merchants.
- Supplier portal for VAT-compliant invoice uploads.
- Partner APIs for accountants and ERPs.

---

## 12) MCP Integrations to consider

Use the platform’s MCP connectors to accelerate setup. You can connect integrations from the MCP popover.

- Supabase — authentication and database primitives; real-time subscriptions.
- Neon — serverless Postgres for data storage.
- Netlify — hosting/CDN for static assets or marketing site.
- Zapier — automate reminders, move docs across apps.
- Figma — design-to-code; accelerate RTL/Arabic UI work.
- Builder CMS — public content and help center management.
- Linear — convert this plan into tickets; track delivery.
- Notion — documentation hub synced with portal knowledge base.
- Sentry — production monitoring and error tracking.
- Context7 — up-to-date framework docs during development.
- Semgrep — security scanning and CI enforcement.
- Stripe — billing and payments for firm invoices.
- Prisma Postgres — schema and ORM management backed by Postgres.

---

## 13) Next Steps

- Approve scope and priorities per country.
- Create tickets per phase and enable feature flags.
- Prepare design sprint for Dashboard, Entities/People, and Documents.
- Begin Phase 0 technical hardening and i18n/RTL.

# How others handle multi-state / cross-border healthcare compliance

_Research notes — 2026-04-14. Sources: accountablehq.com, truto.one, kodekx medium, Arkenea Epic guide, Bask Health, CMS NPI docs._

## The dominant pattern: **HIPAA baseline + "stricter-of" state overlay**

- Treat federal HIPAA as the floor. It's deliberately preemptive-light — states can go stricter.
- For each state, layer stricter rules on top (consent, breach timelines, private right of action, content rules, fee caps).
- At runtime, **always apply the strictest applicable rule** per patient jurisdiction.
- Collapse everything into a single unified SOP — not 50 parallel documents.

## The jurisdiction matrix

Every serious multi-state player maintains one. Rows = state/province. Columns:

- Breach notification deadline (days) and delivery method
- Consent requirements (explicit / opt-in / opt-out)
- Minor consent age & parental rules
- Content rules (what must be in the notice)
- Licensure compacts applicable (IMLC for MDs, PSYPACT for psych, NLC for nurses)
- Private right of action? (yes/no → changes your legal exposure calculus)
- Special-category data (HIV, mental health, substance use, reproductive) — many states regulate these beyond HIPAA
- Fee caps for record requests
- Telehealth-specific rules (can you prescribe controlled substances across state lines?)

The matrix drives a master calendar — every deadline, every required filing, per jurisdiction.

## Location-aware UX

- Detect patient jurisdiction at intake — address, phone area code, IP fallback.
- Render the right consent form, notices, and licensure disclaimers based on detected state/province.
- Block flows that aren't legal in that jurisdiction (e.g., clinician not licensed there).

## Architecture — minimize PHI surface area

Three patterns, in order of preference for compliance ease:

1. **Pass-through proxy / zero-retention** (Truto-style): your middleware never stores PHI, just forwards. Smallest BAA footprint, smallest audit surface.
2. **Customer-controlled data store**: middleware is stateless; PHI lives in the customer's own database under their controls.
3. **Your own PHI store** (last resort): full encryption at rest (AES-256), KMS with key rotation, network segmentation, audit logs, BAAs with every vendor including your cloud provider.

Every extra copy of ePHI = another thing to map, secure, monitor, and explain during audit.

## Non-negotiable baseline controls

- TLS 1.2+ everywhere, certificate pinning where possible
- AES-256 at rest with proper key management (KMS, key rotation)
- BAAs signed with every vendor that touches PHI (middleware, cloud, AI/LLM providers — OpenAI/Anthropic have HIPAA-eligible tiers)
- Audit logs of every PHI access and modification, tamper-evident
- Breach notification playbook with per-state timelines pre-loaded
- Tenant isolation in multi-tenant SaaS — per-tenant encryption keys or row-level security
- Zero-trust network segmentation; contain lateral movement
- Annual penetration testing

## Canada parallel

- PIPEDA is federal floor (like HIPAA).
- Provincial acts go stricter: Quebec Law 25, Ontario PHIPA, Alberta HIA, BC PIPA.
- Quebec requires data-transfer impact assessments for cross-border flows; some data must stay in Canada.
- Cross-border (US↔CA) transfer triggers extra consent disclosures.

## Governance / process

- Privacy officer + security officer designated (HIPAA requires it).
- Cross-functional council: legal + security + compliance + clinical + IT.
- Data-flow maps for PHI, kept current.
- Vendor risk management — SOC 2 Type II and ISO 27001 on every critical vendor.

## How Epic actually does it

- Configurable rules per organization deployment — each hospital system sets its own state-specific overrides.
- Extensive customization layer sits on top of a universal data model.
- Compliance is **implementation-dependent**, not product-dependent — the buyer (hospital) configures Epic for their jurisdictions. Epic provides the hooks; the hospital's compliance team fills in the rules.

## Takeaway for Coordra / pc-city

- **Stricter-of overlay model** is the right default. Don't try to unify all rules into one — keep HIPAA-compliant base and jurisdiction overrides.
- **Build the jurisdiction matrix first**, before coding. Start with NJ (flagged) + home state, expand.
- **Detect location at intake** and route to the right consent/notice set.
- **Zero-retention proxy pattern** for anything involving third-party EHRs / NPI / pharmacy data — keep your middleware dumb and stateless.
- **Decide early** whether you go multi-tenant (shared infra, per-tenant isolation) or single-tenant per health system (more expensive, simpler compliance story).
- **Sign BAAs with AI/LLM vendors** if Coordra calls out to them. Anthropic has HIPAA-eligible access via AWS Bedrock; OpenAI via the Enterprise/API BAA path.

## Open questions for attorneys

- Which states will Coordra launch in? (drives matrix scope)
- Is Coordra a Covered Entity, Business Associate, or neither? (determines what HIPAA obligations apply directly)
- Any plan to go to Canada? (triggers PIPEDA + provincial matrix work)
- What's the data retention policy target — hours, days, or "until customer deletes"?
- Telehealth included? (adds licensure compact research per state)

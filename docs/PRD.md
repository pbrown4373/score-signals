# SCORE Signals — Product Requirements Document

## 1. Product statement

SCORE Signals is a self-service Creative Intelligence platform for performance marketers. It transforms creative assets into structured intelligence, abstracts reusable persuasive structures, adapts those structures to a customer's Brand Brain, and produces original concepts and production briefs.

### Core promise

**Understand the structure behind effective creative and turn that intelligence into original executions for your brand.**

Post-MVP promise:

**Identify which creative patterns are emerging or accelerating, understand why, and know what to test next.**

## 2. Primary user

Start with performance-driven ecommerce/DTC operators:

- founder
- media buyer
- creative strategist
- growth marketer
- small internal performance team

Schema supports agencies/multiple brands, but MVP optimizes for a single operator using one brand.

## 3. Product principles

1. Intelligence, not imitation.
2. Originality by architecture, not disclaimer.
3. Evidence has explicit confidence/class.
4. Fast path to action.
5. Self-service by default.
6. Preserve provenance.
7. Models are replaceable; domain data is durable.
8. Raw source media is disposable; structured knowledge is the asset.

## 4. Core loop

### DISCOVER
Acquire source creative using permitted/authorized methods.

### DECONSTRUCT
Create validated Creative DNA.

### COMPOSE
Use Skeleton + Brand Brain to create original concepts.

### PERFORM
Collect customer outcomes and improve recommendations.

MVP implements source submission, DECONSTRUCT, COMPOSE, originality, export, billing, and scaffolding for later PERFORM.

## 5. MVP workflow A — Brand Brain

User creates:

- brand
- optional website
- category
- description
- products/offers
- personas
- voice
- proof points
- prohibited claims/restrictions
- optional competitors

**Success:** the system has enough structured context to generate brand-specific creative without asking for a meeting.

## 6. MVP workflow B — Analyze creative

1. User uploads supported media or submits a supported URL.
2. System validates source.
3. Media pipeline extracts metadata, audio/transcript, and representative frames.
4. AI creates Creative DNA.
5. JSON validates.
6. System creates Skeleton in a separate step.
7. Results display with observed vs inferred distinctions.

### Creative DNA dimensions

- identity
- opening/hook
- psychology
- story/beat map
- proof
- production
- offer/CTA
- structural assessment
- evidence limitations
- observed/inferred statements

## 7. MVP workflow C — Skeleton

Skeleton preserves function while removing source-specific "skin."

It must abstract:

- names -> roles
- exact claims -> claim function
- unique events -> narrative function
- exact hook wording -> hook mechanism
- exact scenes -> scene purpose
- unique metaphor/catchphrase -> forbidden/restricted element

Example:

Bad:
`I stopped drinking coffee for 30 days and something weird happened.`

Good:
`Contrarian personal admission -> challenge common category assumption -> reveal unexpected explanation -> demonstrate evidence -> introduce alternative.`

## 8. MVP workflow D — Compose

User chooses:

- Skeleton
- Brand
- Product
- Persona
- Objective
- optional offer

Composer receives:

- Skeleton
- Brand Brain
- proof/offer/restrictions
- user objective

Composer does **not** receive source transcript.

Output:

- creative hypothesis
- 3–10 materially different concepts
- hook options
- 30s script
- optional 60s script
- beat map
- shot list
- B-roll
- on-screen text
- CTA
- caption
- production notes
- optional downstream-generation prompt

## 9. MVP workflow E — Originality Guardian

Deterministic checks:

- exact restricted phrase collision
- normalized phrase overlap
- n-gram overlap
- fuzzy restricted-element match

Semantic checks:

- embedding similarity
- model-based distinctive narrative/scene collision

Thresholds are configuration.

On fail:
- regenerate failed concept only,
- include collision flags,
- bounded retries,
- withhold persistent failures.

UI wording:

**Originality Check: Passed configured similarity checks.**

Never claim a legal guarantee of originality.

## 10. MVP workflow F — Export

Export:

- copyable text
- Markdown
- JSON
- PDF/printable production brief

## 11. MVP workflow G — Billing

Plans are self-service:

- FREE
- OPERATOR
- GROWTH
- AGENCY

Exact prices/limits are configuration and Stripe product mapping.

No "contact sales" requirement for published plans.

Usage is metered. Idempotent retries never double-charge.

Recommended commercial rule:
System/provider failure does not consume final user credit. A successfully completed analysis does.

## 12. MVP functional requirements

### Authentication and tenancy
- Supabase Auth
- tenant created on first signup
- role-backed membership
- RLS on tenant-owned tables

### Creative intake
Initially support:
- MP4
- MOV
- WebM
- safe/approved URL adapters if implemented

Unsupported URL -> clear error + upload alternative.

### Processing
- MIME verification
- configurable file size/duration
- SHA-256
- private object storage
- transcript adapter
- FFmpeg frame extraction
- durable job state

### Audit
Record significant events:
- auth
- upload
- analysis
- composition
- deletion
- billing state changes
- privileged support/admin access if ever added

## 13. Explicit non-goals

Not MVP:

- native video generation
- native image generation
- social publishing
- social scheduling
- influencer marketplace
- project management
- CRM
- live human support
- onboarding calls
- custom consulting
- enterprise SSO/SAML
- arbitrary web scraping
- huge cross-platform crawler
- data warehouse
- white label

## 14. Post-MVP Pattern Graph

Each Skeleton gets an embedding.
Related Skeletons cluster into Patterns.
Patterns receive time-series Signal Snapshots.

Opportunity Index:

- 20% velocity
- 15% acceleration
- 10% cross-platform diffusion
- 15% novelty
- 15% structural reusability
- 15% brand proximity
- 10% evidence confidence
- saturation penalty 0–20
- arbitrage bonus 0–10

Clamp final score to 0–100.

Labels:
- 0–39 IGNORE
- 40–59 WATCH
- 60–74 TEST
- 75–89 PRIORITY
- 90–100 BREAKOUT

Lifecycle:
- EMERGING
- ACCELERATING
- MAINSTREAM
- SATURATED
- DECLINING

## 15. Evidence classes

- OBSERVED
- INFERRED
- CUSTOMER_VALIDATED
- SCORE_VALIDATED

Never silently promote evidence class.

Public existence is not proof an ad was profitable.

## 16. Product metrics

MVP activation:

`signup -> Brand Brain complete -> creative READY -> composition complete -> export`

Track:

- time to first value
- free -> paid
- analysis success/failure
- composition success/failure
- originality regeneration rate
- average variable cost/run
- repeat weekly use
- churn

Post-MVP north star:

**Weekly Actioned Signals** — a signal that leads to concept generation, brief/export, or linked performance.

## 17. v1 success

A new customer completes the full value path without founder involvement and receives consistently useful, structured output.

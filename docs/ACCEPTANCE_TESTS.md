# Acceptance Tests and Quality Gates

## Global pre-merge gate

`npm run verify` must include:

- lint/format check
- typecheck
- unit tests
- integration tests
- production build

Critical Playwright e2e runs in mock-provider mode.

## Tenancy

### Cross-tenant read
User A cannot retrieve Brand/Creative/Concept belonging to Tenant B.

### Cross-tenant write
User A cannot update/delete Tenant B resources.

### Viewer
Viewer is read-only and cannot initiate billable operation.

## Brand Brain

- create brand/product/persona/proof/restriction
- validate required fields/lengths
- restriction reaches composition guardrail context

## Upload/media

- valid MP4 fixture accepted
- invalid executable renamed MP4 rejected
- oversize rejected before expensive work
- retry does not duplicate creative or quota event
- object is private

## Analysis

- mock fixture reaches READY
- Creative DNA validates JSON Schema
- observed/inferred labels preserved
- malformed provider output never persists as completed deconstruction
- transient error retry behavior tested

## Skeleton

- validates schema
- distinctive source phrase absent from canonical Skeleton
- source name/unique fact removed
- restricted elements stored separately

## Composer

- service/prompt builder receives Skeleton + Brand Brain
- test explicitly proves raw transcript is absent
- concept count bounded 3–10
- brand restrictions included
- result validates schema

## Originality

- exact restricted phrase fails
- fuzzy restricted collision flags
- safe structurally inspired rewrite passes
- retry bounded
- failed retries do not duplicate usage charge

## Billing

- checkout for authorized owner
- forged webhook rejected
- duplicate webhook processed once
- verified event updates entitlements
- cancellation/past-due behavior follows documented policy

## Usage

- identical idempotency key -> one event
- free plan blocks above limit
- platform/system failure does not consume final user credit

## Security

- private/local URL SSRF attempts rejected
- server secret absent from client bundle
- prompt-injection transcript cannot alter application instructions
- no public raw-media URL

## Self-service e2e

In mock mode, clean user can:

1. signup
2. complete Brand Brain
3. upload synthetic fixture
4. reach READY
5. view DNA
6. view Skeleton
7. compose concepts
8. receive originality pass
9. create brief
10. export Markdown/JSON/PDF
11. see usage

No DB editing or staff action.

## Severity

P0:
security, tenant leak, billing correctness, destructive data loss.
No release.

P1:
core path broken/corrupted state.
No production release without mitigation.

P2:
non-core UX.
May backlog.

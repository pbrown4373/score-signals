# Security, Privacy, and Abuse Requirements

## Priority threats

1. cross-tenant access
2. public object exposure
3. forged Stripe webhooks
4. SSRF via URL import
5. malicious files
6. prompt injection from source creative/transcript
7. secrets in client/logs
8. duplicate usage/billing
9. accidental retention after deletion

## Multi-tenancy

- RLS on every tenant-owned table.
- Integration tests prove A cannot read/write B.
- Service role only in server/worker contexts.
- Application repositories require scoped tenant context.

## URL / SSRF

Do not naïvely fetch arbitrary URLs.

Implement:
- allowlisted adapters or controlled fetch,
- private/local/link-local IP rejection,
- redirect limit,
- timeouts,
- size limit,
- content-type validation,
- DNS rebinding defenses as appropriate.

Unsupported source -> upload.

## Upload

- validate MIME from bytes
- size/duration limits
- random private object keys
- safe FFmpeg process invocation
- isolated worker context
- optional malware scanning for production

## Billing

- verify Stripe signature
- event ID idempotency
- webhook is payment truth, not return URL
- secrets server-only

## Prompt injection

Source media/transcript is **untrusted data**.

Model prompts must clearly delimit source data.
Source must not be able to:
- change system rules,
- request secrets,
- call arbitrary tools,
- change tenant access,
- bypass originality rules.

MVP AI calls should not expose powerful arbitrary tools.

## Privacy

Never expose one tenant's:
- Brand Brain
- concepts
- raw media
- transcripts
- private performance

to another tenant.

Cross-customer aggregate learning is deferred until explicit anonymization/aggregation policy exists.

## Logging

Redact:
- auth headers
- cookies
- API keys
- payment data
- private media
- raw transcript by default

## Retention

Configurable:
- raw media retention
- derived media retention
- logs
- deleted-account purge

Starting policy intent:
- structured intelligence retained while account active
- raw uploaded media default 30 days unless deliberately retained
- signed URLs short lived

## Deletion

Tenant deletion:
1. lock tenant,
2. handle subscription,
3. enqueue object deletion,
4. purge tenant data,
5. audit non-sensitive deletion event,
6. verify storage cleanup.

## Dependency security

CI should include:
- lockfile
- dependency audit
- secret scanning
- no knowingly accepted critical vulnerabilities without written exception

# Milestone 3 — Media intake

Status: complete

## Delivered

- Tenant-scoped source, creative, upload, artifact, and durable background-job tables.
- Composite tenant foreign keys, membership-backed read/delete RLS, and service-only processing transitions.
- Idempotent upload initialization/completion and failed-job retry functions.
- Private storage interface with filesystem mock and Cloudflare R2/S3-compatible live adapter.
- Short-lived direct upload target contract; mock uploads use an authenticated same-origin route.
- MP4, MOV, and WebM declaration validation plus byte-level type sniffing, configured size/duration limits, and SHA-256 persistence.
- Real FFprobe metadata extraction and deterministic FFmpeg video normalization, audio extraction, thumbnail, and three representative frames.
- Postgres job ledger with atomic claim, completion, failure, attempt count, maximum attempts, and replay-safe artifact persistence.
- Analyze upload UI, creative library, detailed processing status, private artifact metadata, and failed-job retry control.
- Status API and deletion route with private-object cleanup.
- Safe URL source-adapter interface, empty-by-default allowlist, DNS resolution, and private/local/link-local/reserved address rejection.
- ADR 0007 documenting ledger-first jobs, mock/live execution, private storage, and URL intake boundaries.

## Security properties verified

- Tenant A cannot read or delete Tenant B media records.
- VIEWER can inspect own-tenant status but cannot initialize, complete, retry, or delete media.
- Authenticated browser roles cannot invoke service-only validation or job transitions.
- Cross-tenant media relationships fail at the database constraint layer.
- File type derives from uploaded bytes rather than filename or client-declared MIME.
- Raw and derived object keys remain private and status responses expose metadata, not object URLs.
- Storage traversal and private/local URL destinations are rejected.
- Unsupported public URLs return an upload alternative and never trigger arbitrary network acquisition.
- Completion/retry replays create no duplicate creative, original artifact, derived artifact, or job.

## Verification

- `npm run format:check`: passed.
- `npm run lint`: passed with no warnings.
- `npm run typecheck`: passed.
- `npm run test`: 11 files, 32 tests passed, including a real synthetic FFmpeg pipeline.
- `npm run test:db`: 71 pgTAP assertions passed on local Supabase/Postgres.
- `npm run build`: passed; media APIs and application pages compile as dynamic routes.
- `npm run test:e2e`: 5 Chromium tests passed, including oversize rejection, invalid byte rejection, private upload, FFmpeg processing, artifact/status rendering, and status API inspection.
- `npm audit --audit-level=critical`: no critical vulnerabilities.
- `npm run verify`: passed end to end.

## Manual checks

- Confirmed synthetic media reaches `TRANSCRIBING` with one normalized video, one audio artifact, one thumbnail, and three frames.
- Confirmed creative detail renders exact metadata (duration and 160 × 90 dimensions) without exposing private storage keys or URLs.
- Confirmed invalid bytes produce a stable user-facing error and no processing job.
- Confirmed the mock upload target stays on the browser's current origin.
- Confirmed URL intake exposes no approved arbitrary-fetch adapter.

## Known limitations

- Live mode can create R2 upload targets and durable queued jobs, but requires the separately deployed worker described in ADR 0007 before production media intake is enabled.
- Mock mode buffers the whole file and executes FFmpeg in the request for deterministic testing only; production uses direct R2 upload and asynchronous processing.
- Approved YouTube, Meta, TikTok, or licensed URL adapters are not implemented; users receive the required upload fallback.
- Optional malware scanning is not selected or enabled.
- Raw-object expiration is persisted, but a scheduled retention sweeper belongs to Milestone 11 hardening.
- Media playback/download is not exposed; future access must use short-lived authorized URLs.
- Playwright media verification requires Docker, local Supabase, Chromium, FFmpeg, and FFprobe.

## Next milestone

Milestone 4 — Transcription + Creative DNA:

- transcription adapter and deterministic mock,
- provider-neutral Model Gateway with OpenAI and mock adapters,
- versioned JSON Schema Structured Output validation,
- Creative DNA prompt v1,
- lineage, usage/cost, and latency metadata,
- observed-versus-inferred result UI,
- malformed-output failure handling.

Do not begin Milestone 5 until Milestone 4's fixture-to-valid-Creative-DNA, malformed-output, lineage, and observed/inferred exit criteria pass.

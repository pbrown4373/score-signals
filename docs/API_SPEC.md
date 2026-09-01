# SCORE Logical API Specification

Codex may implement internal actions using Next.js server actions/route handlers, but external/webhook contracts remain explicit.

Never authorize solely from a client-supplied tenant ID.

## Brands

- `GET /api/brands`
- `POST /api/brands`
- `GET /api/brands/:id`
- `PATCH /api/brands/:id`
- `DELETE /api/brands/:id`

Child CRUD:
- products
- personas
- proof points
- restrictions

## Creative intake

### `POST /api/creative/upload-init`
Returns signed/private upload initialization and `creative_asset_id`.

### `POST /api/creative/upload-complete`
Confirms upload and queues processing. Idempotent.

### `POST /api/creative/from-url`
Select safe source adapter.
Unsupported source returns explicit error and upload fallback.

### `GET /api/creative/:id`
Returns state, metadata, and availability of latest artifacts.

### `POST /api/creative/:id/retry`
Retry only when allowed.

### `DELETE /api/creative/:id`
Delete source and tenant-derived artifacts according to policy.

## Analysis

- `GET /api/creative/:id/deconstruction`
- `GET /api/creative/:id/skeleton`
- `POST /api/creative/:id/reanalyze`

## Composition

### `POST /api/compositions`

Body:
- skeleton_id
- brand_id
- product_id?
- persona_id?
- objective
- optional offer override
- bounded concept_count

Returns generation run/job ID.

### `GET /api/compositions/:runId`

### `POST /api/concepts/:id/regenerate`

### `GET /api/concepts/:id/originality`

### `POST /api/concepts/:id/brief`

## Exports

`GET /api/concepts/:id/export?format=markdown|json|pdf`

## Account

- `GET /api/account/usage`
- `GET /api/account/entitlements`

## Billing

- `POST /api/billing/checkout`
- `POST /api/billing/portal`
- `POST /api/webhooks/stripe`

Stripe webhook:
- verify signature
- store event ID
- process idempotently
- update local subscription mirror
- emit audit event

## Post-MVP

- `GET /api/signals`
- `GET /api/patterns/:id`
- `POST /api/patterns/:id/compose`
- performance import endpoints

## Error envelope

```json
{
  "error": {
    "code": "CREATIVE_UNSUPPORTED_SOURCE",
    "message": "This source cannot be imported directly. Upload the video file instead.",
    "request_id": "..."
  }
}
```

Do not expose stack traces.

## Idempotency required for

- upload completion
- reanalysis
- composition
- usage event creation
- Stripe webhook processing

## Rate limits

Throttle expensive operations per tenant/user.
Return 429 with useful retry guidance.

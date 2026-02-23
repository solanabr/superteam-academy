# API Request/Response IO (Testing Reference)

Base URL (local): `http://localhost:3001`

## Versioning

- API uses **URL path versioning**: `/v1/academy/*` for all academy endpoints.
- `GET /v1/contract` returns the OpenAPI 3.0 contract (request/response schemas and examples). No auth required.
- `GET /health`, `GET /v1/health` — liveness (process alive).
- `GET /ready`, `GET /v1/ready` — readiness (keypairs + RPC). Returns 503 when not ready.

## Reliability

- All responses include `X-Request-Id` for tracing.
- Error responses include `retriable: boolean` (4xx=false, 5xx/429=true).

## Conventions

- `GET /health` and `GET /v1/health` are health endpoints; `GET /v1/contract` returns the API contract.
- All `/v1/academy/*` endpoints are `POST` with `Content-Type: application/json`.
- `/v1/academy/*` endpoints require one auth header:
  - `Authorization: Bearer <token>`, or
  - `X-API-Key: <token>`
  - Token: `BACKEND_API_TOKEN` (bootstrap) or any key from `POST /v1/admin/generate-api-key`.

## Admin (optional)

Set `ADMIN_SECRET` and `ADMIN_PASSWORD` to enable:

- **POST /v1/admin/login** (no auth) — body `{ "password": "<ADMIN_PASSWORD>" }` → `{ "token": "<JWT>" }`
- **POST /v1/admin/generate-api-key** (Bearer JWT) — body `{ "role": "admin"|"client", "label": "optional" }` → `{ "apiKey", "role", "label" }`

- Success responses are `200` with JSON payloads shown below.
- Validation/business input errors return `400` with:

```json
{ "error": "<message>" }
```

- Internal/runtime/chain errors return `500` with:

```json
{ "error": "<message>" }
```

## 1) Health

### Request
- Method: `GET`
- Path: `/health`
- Body: none

### Success (200)
```json
{ "ok": true, "service": "academy-backend" }
```

---

## 2) Create Course

### Request
- Method: `POST`
- Path: `/v1/academy/create-course`

```json
{
  "courseId": "test-course-1",
  "lessonCount": 3,
  "xpPerLesson": 100,
  "creator": "<optional pubkey>"
}
```

### Notes
- `courseId` default: `"test-course-1"`
- `lessonCount` default: `3` (integer, >= 1)
- `xpPerLesson` default: `100` (integer, >= 0)
- `creator` optional (defaults to authority wallet)

### Success (200)
```json
{ "tx": "<signature>" }
```

---

## 3) Update Config

### Request
- Method: `POST`
- Path: `/v1/academy/update-config`

```json
{
  "newBackendSigner": "<pubkey>"
}
```

### Success (200)
```json
{ "tx": "<signature>" }
```

---

## 4) Update Course

### Request
- Method: `POST`
- Path: `/academy/update-course`

```json
{
  "courseId": "test-course-1",
  "newContentTxId": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  "newIsActive": true,
  "newXpPerLesson": 150,
  "newCreatorRewardXp": 75,
  "newMinCompletionsForReward": 3
}
```

### Notes
- `courseId` default: `"test-course-1"`
- All `new*` fields are optional and nullable.
- `newContentTxId` must be `32` integers when provided.

### Success (200)
```json
{ "tx": "<signature>" }
```

---

## 5) Complete Lesson

### Request
- Method: `POST`
- Path: `/academy/complete-lesson`

```json
{
  "courseId": "test-course-1",
  "learner": "<pubkey>",
  "lessonIndex": 0
}
```

### Notes
- `courseId` default: `"test-course-1"`
- `lessonIndex` default: `0` (integer, >= 0)

### Success (200)
```json
{ "tx": "<signature>" }
```

### Common 400
```json
{ "error": "Course \"test-course-1\" not found. Create it first via POST /academy/create-course." }
```

---

## 6) Finalize Course

### Request
- Method: `POST`
- Path: `/academy/finalize-course`

```json
{
  "courseId": "test-course-1",
  "learner": "<pubkey>"
}
```

### Notes
- `courseId` default: `"test-course-1"`

### Success (200)
```json
{ "tx": "<signature>" }
```

### Common 400
```json
{ "error": "Course \"test-course-1\" not found. Create it first via POST /academy/create-course." }
```

---

## 7) Issue Credential

### Request
- Method: `POST`
- Path: `/academy/issue-credential`

```json
{
  "courseId": "test-course-1",
  "learner": "<pubkey>",
  "credentialName": "Solana Fundamentals Credential",
  "metadataUri": "https://arweave.net/<metadata>",
  "coursesCompleted": 1,
  "totalXp": 350,
  "trackCollection": "<pubkey>"
}
```

### Notes
- `courseId` default: `"test-course-1"`
- `coursesCompleted` default: `1` (integer, >= 0)
- `totalXp` default: `0` (integer, >= 0)

### Success (200)
```json
{
  "tx": "<signature>",
  "credentialAsset": "<new asset pubkey>"
}
```

---

## 8) Upgrade Credential

### Request
- Method: `POST`
- Path: `/academy/upgrade-credential`

```json
{
  "courseId": "test-course-1",
  "learner": "<pubkey>",
  "credentialAsset": "<existing asset pubkey>",
  "credentialName": "Solana Fundamentals Credential",
  "metadataUri": "https://arweave.net/<new-metadata>",
  "coursesCompleted": 2,
  "totalXp": 800,
  "trackCollection": "<pubkey>"
}
```

### Notes
- `courseId` default: `"test-course-1"`
- `coursesCompleted` default: `1` (integer, >= 0)
- `totalXp` default: `0` (integer, >= 0)

### Success (200)
```json
{ "tx": "<signature>" }
```

---

## 9) Register Minter

### Request
- Method: `POST`
- Path: `/academy/register-minter`

```json
{
  "minter": "<pubkey>",
  "label": "custom",
  "maxXpPerCall": 1000
}
```

### Notes
- `label` default: `"custom"`
- `maxXpPerCall` default: `0` (integer, >= 0, where 0 means unlimited)

### Success (200)
```json
{ "tx": "<signature>" }
```

---

## 10) Revoke Minter

### Request
- Method: `POST`
- Path: `/academy/revoke-minter`

```json
{
  "minter": "<pubkey>"
}
```

### Success (200)
```json
{ "tx": "<signature>" }
```

---

## 11) Reward XP

### Request
- Method: `POST`
- Path: `/academy/reward-xp`

```json
{
  "recipient": "<pubkey>",
  "amount": 100,
  "memo": "bonus"
}
```

### Notes
- `amount` required (integer, >= 1)
- `memo` optional, default: `""`

### Success (200)
```json
{ "tx": "<signature>" }
```

---

## 12) Create Achievement Type

### Request
- Method: `POST`
- Path: `/academy/create-achievement-type`

```json
{
  "achievementId": "first-course-complete",
  "name": "First Course Complete",
  "metadataUri": "https://arweave.net/<achievement-metadata>",
  "maxSupply": 0,
  "xpReward": 100
}
```

### Notes
- `maxSupply` default: `0` (unlimited)
- `xpReward` default: `100` (integer, >= 0)

### Success (200)
```json
{
  "tx": "<signature>",
  "collection": "<collection pubkey>"
}
```

---

## 13) Award Achievement

### Request
- Method: `POST`
- Path: `/academy/award-achievement`

```json
{
  "achievementId": "first-course-complete",
  "recipient": "<pubkey>",
  "collection": "<achievement collection pubkey>"
}
```

### Notes
- `collection` must match on-chain `AchievementType.collection`.

### Success (200)
```json
{
  "tx": "<signature>",
  "asset": "<new achievement asset pubkey>"
}
```

### Common 400
```json
{ "error": "collection does not match the on-chain achievement type collection" }
```

---

## 14) Deactivate Achievement Type

### Request
- Method: `POST`
- Path: `/academy/deactivate-achievement-type`

```json
{
  "achievementId": "first-course-complete"
}
```

### Success (200)
```json
{ "tx": "<signature>" }
```

---

## Quick Test Curl Template

```bash
curl -X POST http://localhost:3001/academy/<endpoint> \
  -H 'Content-Type: application/json' \
  -d '{ ... }'
```

# SBT Identity and Certificate Model

Version: 1.0  
Status: Design approved for implementation

## Scope

This document defines the hybrid identity model for Superteam Academy:

- Global profile SBT (optional post-Phase-6 feature)
- Per-track certificate NFTs (Metaplex Core, canonical in v1.3 SPEC)
- Wallet-auth-triggered issuance/update policies

## Canonical alignment

- `SPEC.md` is source of truth for v1:
  - Credentials use Metaplex Core
  - One credential per learner per track
  - Upgradeable and wallet-visible
- `IMPLEMENTATION_ORDER.md` controls rollout sequence:
  - Core platform through Phase 6 first
  - Identity extensions after stable credential path

## Asset model

### 1) Track certificate NFT (V1 canonical)

- Standard: Metaplex Core
- Quantity: one NFT per learner per track
- Collection: one collection NFT per track
- Soulbound behavior: enforced through plugin policy
- Lifecycle:
  - create on first track completion milestone
  - upgrade metadata/attributes on further milestones
- Authority:
  - update authority: program-controlled authority path
  - learner: read/verify ownership only

### 2) Global profile SBT (V2 additive)

- Standard: Metaplex Core
- Quantity: one profile asset per learner
- Purpose:
  - public portable identity summary
  - social/composability surface for ecosystem integrations
- Source of truth:
  - operational logic remains on PDAs (`LearnerProfile`, `Enrollment`, `Course`)
  - profile SBT mirrors curated public fields

## Metadata and attributes schema

All attributes use explicit versioning for backward compatibility.

### Certificate attributes (`certificate_v1`)

- `schema_version`: `1`
- `track_id`: string
- `track_level`: integer (1,2,3...)
- `courses_completed`: integer
- `xp_snapshot`: integer
- `last_completed_course_id`: string
- `issued_at`: unix timestamp
- `updated_at`: unix timestamp
- `history_v1`: JSON array of transition objects
  - `{ level, course_id, timestamp }`

### Profile attributes (`profile_v1`)

- `schema_version`: `1`
- `wallet`: base58
- `username`: string
- `join_date`: unix timestamp
- `level`: integer
- `xp_total`: integer
- `streak_current`: integer
- `streak_longest`: integer
- `courses_completed_count`: integer
- `achievements`: string array
- `social_links`: JSON object
  - `github`, `twitter`, `linkedin`, `website`
- `last_synced_at`: unix timestamp

## Revocation model

Revocation is supported for certificate/profile assets under strict authority policy.

- Allowed initiator: program-authorized admin path (platform governance)
- Required metadata:
  - `reason_code`
  - `reason_note` (optional, bounded)
  - `revoked_at`
  - `revoked_by`
- Effects:
  - emit revocation event
  - mark asset metadata as revoked state
  - preserve historical attributes for auditability

Recommended reason codes:

- `policy_violation`
- `fraudulent_activity`
- `administrative_correction`
- `security_response`

## Wallet auth integration policy

Wallet signature auth remains the gate.

- On successful wallet auth:
  - ensure learner profile PDA exists
  - if profile SBT feature enabled, ensure profile asset exists
- On course milestones:
  - update certificate attributes/history
  - optionally sync profile SBT summary fields

## Security constraints

- No private data on-chain
  - no email
  - no secret identifiers
- Attribute updates must be authority-validated
- Replay-safe backend auth (nonce + signature verification)
- Event emissions for issuance, upgrade, revocation

## Cost and development stance

Development can be effectively free:

- local validator: free
- devnet: free using SOL airdrops

Mainnet planning:

- per-certificate creation has mint + rent costs
- upgrades add transaction costs
- revocation adds transaction costs

Migration strategy:

- If economics require, evaluate compressed representation in V2/V3
- Keep schema-versioned attributes so data model can migrate safely

## Acceptance criteria

- Certificate lifecycle supports create + upgrade + revocation
- Collection-per-track grouping is enforced
- Profile SBT schema is defined and implementation-ready
- Frontend can read and display certificate/profile attributes via DAS/indexing layer

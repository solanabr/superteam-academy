# Superteam Academy On-Chain Program — Specification

Program ID (all clusters): **`7NeJaSRyb4Wxay3Tcd9bdpD7T3GWYUQSFyrhG8SgwE8V`**

The spec itself is id-agnostic — every PDA derives from the deployed program
id. The pinocchio implementation can additionally be built with
`--features fresh-id` as a self-owned devnet instance
(`Dsro2Cd9Mhgk8L71imh3LLPwYU5PU8hvBY5HEcPrcx5u`; see
[DEPLOY-PROGRAM.md](./DEPLOY-PROGRAM.md) § "Fresh devnet instance").

This document is the authoritative, framework-neutral specification of the
on-chain program: every account layout (to the byte), every instruction
(accounts, arguments, validation order, state transitions, CPIs, events,
errors), and every protocol invariant. The program has a single Pinocchio
implementation — see [Implementations](#implementations) — that conforms to
this spec bit-for-bit on the wire.

Related: [ARCHITECTURE.md](./ARCHITECTURE.md) (system-wide picture),
[ANCHOR-VS-PINOCCHIO.md](./ANCHOR-VS-PINOCCHIO.md) (implementation deltas),
[DEPLOY-PROGRAM.md](./DEPLOY-PROGRAM.md) (deployment).

---

## 1. Overview

The program records a learning platform's on-chain state: **courses**,
learner **enrollments** (with per-lesson completion bitmaps), a soulbound
**XP token** (Token-2022), soulbound **credential NFTs** and **achievement
NFTs** (Metaplex Core), and a capability system of **minter roles** with XP
caps. 18 instructions, 6 account types, 18 events, 34 custom errors.

```text
                       ┌────────────────────────┐
                       │   Config (PDA, 1×)     │  authority (Squads multisig)
                       │  authority             │  backend_signer (rotatable)
                       │  backend_signer        │  xp_mint  · paused (kill-switch)
                       └───────────┬────────────┘
             ┌─────────────────────┼─────────────────────────┐
   ┌─────────▼─────────┐ ┌─────────▼──────────┐  ┌───────────▼───────────┐
   │ Course (per id)   │ │ MinterRole (per    │  │ AchievementType (per  │
   │ lessons, XP rates │ │ minter pubkey)     │  │ id) + mpl-core        │
   │ creator rewards   │ │ per-call/lifetime  │  │ collection, supply,   │
   │ prerequisite      │ │ XP caps            │  │ xp_reward             │
   └─────────┬─────────┘ └────────────────────┘  └───────────┬───────────┘
   ┌─────────▼──────────────┐                    ┌───────────▼───────────┐
   │ Enrollment (per course │                    │ AchievementReceipt    │
   │ × learner): bitmap,    │                    │ (per achievement ×    │
   │ completed_at,          │                    │ recipient): double-   │
   │ credential_asset       │                    │ award guard           │
   └────────────────────────┘                    └───────────────────────┘
```

### Trust model

`backend_signer` (stored in `Config`, rotatable via `update_config`) is a
**TRUSTED off-chain authority**. Every XP-minting and credential instruction —
`complete_lesson`, `finalize_course`, `reward_xp`, `award_achievement`,
`issue_credential`, `upgrade_credential` — requires it as an additional
signer. That co-signature is the authorization boundary, NOT a proof of
merit: the program verifies only on-chain structural invariants (the lesson
bit is not already set, a course finalizes at most once, supply/minter caps
hold, the kill-switch is off, every account matches its PDA). Whether the
learner actually completed the lesson is proven off-chain; the program trusts
the backend to have validated it before co-signing. A leaked `backend_signer`
key can therefore mint XP and credentials at will — bounded by the minter
caps, the `MAX_XP_PER_MINT` ceiling, and the kill-switch — and must be
rotated via `update_config` if compromised.

`authority` (the platform multisig) can: rotate `backend_signer` and itself,
pause/unpause minting, create/update/close courses, register/update/revoke
minters, and create/deactivate achievement types. It cannot bypass PDAs or
mint XP without the backend co-signature paths.

### External programs

| Program       | ID                                             | Used for                     |
| ------------- | ---------------------------------------------- | ---------------------------- |
| System        | `11111111111111111111111111111111`             | PDA creation, rent transfers |
| Token-2022    | `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb`  | XP mint + mint_to            |
| Metaplex Core | `CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d` | credential/achievement NFTs  |

The **Config PDA signs** every Token-2022 and Metaplex Core CPI (it is the XP
mint authority, the mint's permanent delegate, and the update authority of
every collection/asset the program creates).

---

## 2. PDAs

All PDAs are derived with the canonical bump (stored in the account at init
and reused for verification thereafter).

| Account            | Seeds                                                | Notes                                                                                |
| ------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Config             | `["config"]`                                         | Singleton. Canonical address `HmQsZaBKvADBvnUuyxG8G3hdDKYSyZsQbpmeMcPWoPn`, bump 255 |
| Course             | `["course", course_id]`                              | `course_id` = raw UTF-8 bytes, ≤ 32                                                  |
| Enrollment         | `["enrollment", course_id, learner]`                 | one per course × learner                                                             |
| MinterRole         | `["minter", minter]`                                 | one per minter pubkey                                                                |
| AchievementType    | `["achievement", achievement_id]`                    | id ≤ 32 bytes                                                                        |
| AchievementReceipt | `["achievement_receipt", achievement_id, recipient]` | double-award guard                                                                   |

## 3. Wire format conventions

- **Instruction data** = 8-byte Anchor discriminator
  (`sha256("global:<snake_case_name>")[0..8]`) followed by Borsh-serialized
  arguments.
- **Account data** = 8-byte Anchor discriminator
  (`sha256("account:<TypeName>")[0..8]`) followed by the Borsh-serialized
  struct. Accounts are allocated at a **fixed size** (max string lengths) but
  the serialized content is **true Borsh**: `String` = u32 LE length + bytes,
  `Option<T>` = 1-byte tag (0/1) + payload. Field offsets after a variable
  field therefore shift with content; trailing allocation bytes are zero.
- **Events** = `sol_log_data` of (8-byte event discriminator
  `sha256("event:<Name>")[0..8]` ++ Borsh payload), surfaced by the runtime
  as a `Program data: <base64>` log line.
- **Errors** = custom program error codes. Program errors are
  `6000 + variant` (§7); framework-level violations reuse Anchor's error
  space (e.g. 2006 ConstraintSeeds, 3012 AccountNotInitialized). Every
  failure also logs one line in the format
  `AnchorError occurred. Error Code: <Name>. Error Number: <n>. Error Message: <msg>.`
- All integers little-endian; all timestamps are `Clock.unix_timestamp` (i64
  seconds).

---

## 4. Account layouts

Offsets below are for the canonical fresh account; `▲` marks fields whose
offset shifts when an earlier variable-length field differs from its maximum
or an `Option` changes state.

### 4.1 Config — 113 bytes, seeds `["config"]`

| Offset | Size | Field          | Type                              | Notes                    |
| ------ | ---- | -------------- | --------------------------------- | ------------------------ |
| 0      | 8    | discriminator  | `[155,12,170,224,30,250,204,130]` |                          |
| 8      | 32   | authority      | Pubkey                            | platform multisig        |
| 40     | 32   | backend_signer | Pubkey                            | rotatable trusted signer |
| 72     | 32   | xp_mint        | Pubkey                            | Token-2022 XP mint       |
| 104    | 1    | paused         | bool                              | minting kill-switch      |
| 105    | 7    | \_reserved     | `[u8;7]`                          | zero                     |
| 112    | 1    | bump           | u8                                | canonical (255)          |

`paused` occupies the first byte of the original 8-byte reserved area;
legacy accounts deserialize it as `false`.

### 4.2 Course — 224 bytes, seeds `["course", course_id]`

Discriminator `[206,6,78,228,163,138,241,106]`. After the discriminator, true
Borsh in this field order:

| Field                        | Type             | Encoded size   | Constraints                                                 |
| ---------------------------- | ---------------- | -------------- | ----------------------------------------------------------- |
| course_id                    | String           | 4 + n (n ≤ 32) | non-empty                                                   |
| creator ▲                    | Pubkey           | 32             | XP reward recipient (not an authority)                      |
| content_tx_id ▲              | `[u8;32]`        | 32             | content reference (e.g. Arweave)                            |
| version ▲                    | u16              | 2              | starts at 1; +1 per content update                          |
| lesson_count ▲               | u8               | 1              | ≥ 1                                                         |
| difficulty ▲                 | u8               | 1              | 1–3                                                         |
| xp_per_lesson ▲              | u32              | 4              |                                                             |
| track_id ▲                   | u16              | 2              |                                                             |
| track_level ▲                | u8               | 1              |                                                             |
| prerequisite ▲               | Option\<Pubkey\> | 1 (+32)        | prerequisite Course PDA                                     |
| creator_reward_xp ▲          | u32              | 4              | per-completion creator reward                               |
| min_completions_for_reward ▲ | u16              | 2              | reward window start                                         |
| total_completions ▲          | u32              | 4              | counter                                                     |
| total_enrollments ▲          | u32              | 4              | counter                                                     |
| is_active ▲                  | bool             | 1              |                                                             |
| created_at ▲                 | i64              | 8              |                                                             |
| updated_at ▲                 | i64              | 8              |                                                             |
| collection ▲                 | Pubkey           | 32             | mpl-core credential collection; `Pubkey::default()` = unset |
| \_reserved ▲                 | `[u8;8]`         | 8              | zero                                                        |
| bump ▲                       | u8               | 1              | canonical                                                   |

`course_id` and `prerequisite` are write-once (set at init); every other
field's offset is stable for the account's lifetime. **Migration note**: the
account grew 192 → 224 bytes when `collection` was added; pre-resize accounts
cannot be deserialized and must be freed via `close_course` and recreated.

### 4.3 Enrollment — 127 bytes, seeds `["enrollment", course_id, learner]`

Discriminator `[249,210,64,145,197,241,57,51]`.

| Field              | Type             | Encoded size | Notes                                                           |
| ------------------ | ---------------- | ------------ | --------------------------------------------------------------- |
| course             | Pubkey           | 32           | Course PDA                                                      |
| enrolled_at        | i64              | 8            |                                                                 |
| completed_at       | Option\<i64\>    | 1 (+8)       | None while in progress; set once by `finalize_course`           |
| lesson_flags ▲     | `[u64;4]`        | 32           | 256-bit completion bitmap; lesson _i_ → word `i/64`, bit `i%64` |
| credential_asset ▲ | Option\<Pubkey\> | 1 (+32)      | set once by `issue_credential`                                  |
| \_reserved ▲       | `[u8;4]`         | 4            | zero                                                            |
| bump ▲             | u8               | 1            | canonical                                                       |

Both options transition **None → Some exactly once** and never revert, so the
serialized length only grows (87 → 95 → 127 content bytes).

### 4.4 MinterRole — 110 bytes, seeds `["minter", minter]`

Discriminator `[21,246,6,133,142,211,33,193]`.

| Field             | Type   | Encoded size   | Notes                           |
| ----------------- | ------ | -------------- | ------------------------------- |
| minter            | Pubkey | 32             | authorized wallet/PDA           |
| label             | String | 4 + n (n ≤ 32) | may be empty                    |
| max_xp_per_call ▲ | u64    | 8              | 0 = unlimited                   |
| total_xp_minted ▲ | u64    | 8              | lifetime counter                |
| is_active ▲       | bool   | 1              |                                 |
| created_at ▲      | i64    | 8              |                                 |
| max_total_xp ▲    | u64    | 8              | lifetime ceiling; 0 = unlimited |
| bump ▲            | u8     | 1              | canonical                       |

Setting `max_total_xp ≤ total_xp_minted` freezes the role without closing it.
`max_total_xp` occupies the former reserved bytes; legacy accounts read 0.

### 4.5 AchievementType — 338 bytes, seeds `["achievement", achievement_id]`

Discriminator `[13,187,114,66,217,154,85,137]`.

| Field            | Type     | Encoded size    | Constraints                           |
| ---------------- | -------- | --------------- | ------------------------------------- |
| achievement_id   | String   | 4 + n (n ≤ 32)  | non-empty                             |
| name ▲           | String   | 4 + n (n ≤ 64)  | non-empty                             |
| metadata_uri ▲   | String   | 4 + n (n ≤ 128) | non-empty                             |
| collection ▲     | Pubkey   | 32              | mpl-core collection (created at init) |
| creator ▲        | Pubkey   | 32              | the authority at creation             |
| max_supply ▲     | u32      | 4               | 0 = unlimited                         |
| current_supply ▲ | u32      | 4               | counter                               |
| xp_reward ▲      | u32      | 4               | > 0 required at creation              |
| is_active ▲      | bool     | 1               |                                       |
| created_at ▲     | i64      | 8               |                                       |
| \_reserved ▲     | `[u8;8]` | 8               | zero                                  |
| bump ▲           | u8       | 1               | canonical                             |

### 4.6 AchievementReceipt — 49 bytes, seeds `["achievement_receipt", achievement_id, recipient]`

Discriminator `[149,5,79,178,116,231,43,248]`. Fixed layout: asset Pubkey
(8..40), awarded_at i64 (40..48), bump u8 (48). Exists purely so a second
`award_achievement` for the same (achievement, recipient) fails at PDA
creation.

---

## 5. Instructions

Legend: **w** writable, **s** signer. Validation listed in order; the first
failing check determines the error. Account validation follows the two-phase
model: first all accounts are loaded/type-checked in order (missing account →
3005; uninitialized → 3012; wrong owner → 3007; missing/mismatched
discriminator → 3001/3002; undeserializable → 3003; missing signature →
3010; wrong program id for the System program slot → 3008), then constraints
run in account order (PDA seeds → 2006; missing `mut` → 2000; key-equality
constraints → the listed custom error; fixed `address` slots → 2012).
Instruction-data parse failures → 102; unknown/short discriminators → 101.

XP minting invariant shared by all mint paths: single-call amount ≤
**MAX_XP_PER_MINT = 5000** (error 6033).

### 5.1 `initialize` — discriminator `[175,175,109,31,13,152,155,237]`

One-time platform setup. **Args**: none.

| #   | Account             | Access | Checks                                                     |
| --- | ------------------- | ------ | ---------------------------------------------------------- |
| 0   | config              | w      | init at `["config"]` (payer = authority, 113 B)            |
| 1   | xp_mint             | w,s    | fresh keypair                                              |
| 2   | authority           | w,s    | pays for everything                                        |
| 3   | backend_minter_role | w      | init at `["minter", authority]` (payer = authority, 110 B) |
| 4   | system_program      |        | = System                                                   |
| 5   | token_program       |        | = Token-2022 (2012)                                        |

**Effects** (in order): creates Config PDA; creates backend MinterRole PDA;
creates the XP mint account (274 bytes = base mint + account-type byte +
NonTransferable + PermanentDelegate + MetadataPointer TLVs); initializes
extensions **before** the mint itself: NonTransferable, PermanentDelegate =
Config PDA, MetadataPointer (authority = Config PDA, metadata = the mint
itself), then `initialize_mint2` (decimals 0, mint authority = Config PDA, no
freeze authority). Writes `Config { authority, backend_signer = authority,
xp_mint, paused: false }` and `MinterRole { minter: authority, label:
"backend", caps 0/0 (unlimited), active }`. Token metadata initialization is
deferred to the client (Agave CPI-realloc restriction). **Events**: none.

### 5.2 `update_config` — `[29,158,252,191,10,83,219,99]`

**Args** (Borsh): `new_backend_signer: Option<Pubkey>`, `paused:
Option<bool>`, `new_authority: Option<Pubkey>`.

| #   | Account        | Access | Checks                                      |
| --- | -------------- | ------ | ------------------------------------------- |
| 0   | config         | w      | PDA; `config.authority == authority` @ 6000 |
| 1   | authority      | s      |                                             |
| 2…  | old MinterRole | w      | _optional remaining account_                |

**Effects**: for each `Some` field, in this order —

1. `new_backend_signer`: if a remaining account is present it must be a
   program-owned MinterRole whose `minter == config.backend_signer` (any
   violation → 6000) and is deactivated (`is_active = false`). Passing no
   remaining account skips deactivation (deliberate, see §9.2). Sets
   `config.backend_signer`; emits `ConfigUpdated{field:"backend_signer"}`.
2. `paused`: sets the kill-switch; emits `MintingPauseSet{paused}`.
3. `new_authority`: must not be the zero pubkey (→ 6000); sets
   `config.authority`; emits `ConfigUpdated{field:"authority"}`. Single-step
   handoff — the current authority co-signs (see §9.3).

### 5.3 `create_course` — `[120,121,154,164,107,180,167,241]`

**Args**: `course_id: String, creator: Pubkey, content_tx_id: [u8;32],
lesson_count: u8, difficulty: u8, xp_per_lesson: u32, track_id: u16,
track_level: u8, prerequisite: Option<Pubkey>, creator_reward_xp: u32,
min_completions_for_reward: u16, collection: Option<Pubkey>`.

| #   | Account        | Access | Checks                                                     |
| --- | -------------- | ------ | ---------------------------------------------------------- |
| 0   | course         | w      | init at `["course", course_id]` (payer = authority, 224 B) |
| 1   | config         |        | PDA; `authority == config.authority` @ 6000                |
| 2   | authority      | w,s    |                                                            |
| 3   | system_program |        |                                                            |

**Effects**: account creation happens **before** the handler's parameter
checks (an existing PDA fails in the system program; a > 32-byte id aborts at
seed derivation). Then requires id non-empty (6011), id ≤ 32 (6012),
lesson_count ≥ 1 (6013), difficulty ∈ 1..=3 (6014). Writes the Course with
`version = 1`, counters 0, `is_active = true`, `created_at = updated_at =
now`, `collection = collection.unwrap_or_default()`. **Event**:
`CourseCreated`.

### 5.4 `update_course` — `[81,217,18,192,129,233,129,231]`

**Args**: `new_content_tx_id: Option<[u8;32]>, new_is_active: Option<bool>,
new_xp_per_lesson: Option<u32>, new_creator_reward_xp: Option<u32>,
new_min_completions_for_reward: Option<u16>, new_collection: Option<Pubkey>`.

Accounts: config (PDA, `authority == config.authority` @ 6000), course (w,
PDA over its stored `course_id`), authority (s).

**Effects**: each `Some` field is applied; a content update also increments
`version` (checked, → 6010). `new_collection` is **backfill-only**: allowed
only while `collection` is unset or unchanged (→ 6016) — re-pointing a live
collection would orphan issued credentials. Always stamps `updated_at`.
**Event**: `CourseUpdated`.

### 5.5 `close_course` — `[157,252,239,166,213,174,160,34]`

**Args**: `course_id: String`. Migration tool for freeing Course PDAs
(including stale 192-byte pre-resize accounts).

Accounts: config (PDA, has-one authority @ 6000), course (w, **unchecked**:
canonical-PDA check @ 2006, owner = program @ 6030), authority (s).

**Effects**: requires the account to carry the Course discriminator (6030) —
its only deserialization; drains all lamports to the authority (checked, →
6010); truncates data to 0 and assigns the account back to the System
program so `create_course` can recreate it. Enrollments for the id are
untouched. **Event**: `CourseClosed`.

### 5.6 `enroll` — `[58,12,36,3,142,28,1,43]`

**Args**: `course_id: String`.

| #   | Account                          | Access | Checks                                                                |
| --- | -------------------------------- | ------ | --------------------------------------------------------------------- |
| 0   | course                           | w      | PDA over the ARG course_id (stored bump) @ 2006                       |
| 1   | enrollment                       | w      | init at `["enrollment", course_id, learner]` (payer = learner, 127 B) |
| 2   | learner                          | w,s    |                                                                       |
| 3   | system_program                   |        |                                                                       |
| 4,5 | prereq Course, prereq Enrollment |        | _remaining accounts, required iff the course has a prerequisite_      |

**Effects**: creates the enrollment PDA (re-enrolling on a live PDA fails in
the system program — the intended double-enroll guard); requires
`course.is_active` (6001). If `course.prerequisite` is Some, ALL of the
following must hold, each failing with 6007: two remaining accounts are
present; both are owned by this program; remaining[0] key equals the
prerequisite; both deserialize as Course/Enrollment; the prerequisite
enrollment's `course` equals the prerequisite; it is finalized
(`completed_at` Some); and its address equals the canonical
`["enrollment", prereq.course_id, learner]` PDA — i.e. the _enrolling
learner's own_ completed enrollment. Writes the fresh Enrollment (options
None, empty bitmap) and increments `course.total_enrollments` (checked →
6010). **Event**: `Enrolled`.

### 5.7 `complete_lesson` — `[77,217,53,132,204,150,169,58]`

**Args**: `lesson_index: u8`. Backend-cosigned.

| #   | Account               | Access | Checks                                                                                       |
| --- | --------------------- | ------ | -------------------------------------------------------------------------------------------- |
| 0   | config                |        | PDA                                                                                          |
| 1   | course                |        | PDA (stored course_id)                                                                       |
| 2   | enrollment            | w      | PDA `["enrollment", course.course_id, learner]` @ 2006; `enrollment.course == course` @ 6009 |
| 3   | learner               |        | identity only (no signature)                                                                 |
| 4   | learner_token_account | w      | owned by Token-2022 @ 6000                                                                   |
| 5   | xp_mint               | w      | `== config.xp_mint` @ 6000                                                                   |
| 6   | backend_signer        | s      | `== config.backend_signer` @ 6000                                                            |
| 7   | token_program         |        | = Token-2022 (2012)                                                                          |

**Effects**: kill-switch off (6031); `lesson_index < lesson_count` (6002);
bitmap bit unset (6003) → set it; `xp_per_lesson ≤ 5000` (6033); the token
account must be a structurally valid, initialized Token-2022 account whose
mint is `config.xp_mint` (6032) **and whose owner is the learner** (6000) —
XP can only land in the learner's own account; mints `xp_per_lesson` signed
by the Config PDA. **Event**: `LessonCompleted`.

### 5.8 `finalize_course` — `[68,189,122,239,39,121,16,218]`

**Args**: none. Backend-cosigned.

Accounts: config | course (w, PDA) | enrollment (w, PDA @ 2006, course-match
@ 6009) | learner | learner_token_account (w, t22-owned @ 6000) |
creator_token_account (w, t22-owned @ 6000) | creator (`== course.creator` @ 6000) | xp_mint (w @ 6000) | backend_signer (s @ 6000) | token_program
(2012).

**Effects**: kill-switch off (6031); not already finalized (`completed_at`
None, else 6005); popcount of the bitmap == `lesson_count` (6004); sets
`completed_at = now`; increments `course.total_completions` (checked, 6010).
**Completion bonus** = `xp_per_lesson × lesson_count / 2` (checked multiply →
6010; ≤ 5000 → 6033); if > 0, minted to the learner after the same
mint+owner ATA binding as 5.7. **Creator reward**: paid iff
`total_completions ∈ [min_completions_for_reward,
min_completions_for_reward + 100)` AND `creator_reward_xp > 0` — a bounded
100-completion window that caps total creator XP per course at
`100 × creator_reward_xp` and prevents unbounded post-threshold Sybil
farming; the reward amount must be ≤ 5000 (6033) and the creator ATA is
bound to mint + creator identity. **Event**: `CourseFinalized{ total_xp:
completed × xp_per_lesson (checked → 6010), bonus_xp, creator_xp }`.

### 5.9 `close_enrollment` — `[236,137,133,253,91,138,217,91]`

**Args**: none. Learner-initiated unenroll.

Accounts: course (PDA) | enrollment (w, PDA @ 2006, course-match @ 6009,
closed to learner) | learner (w,s).

**Effects**: refuses finalized or credentialed enrollments (6029) — they are
permanent replay guards (closing one would free the PDA and allow re-earning
XP); requires `now − enrolled_at > 86 400` seconds (24 h cooldown, 6008;
subtraction checked → 6010). Emits `EnrollmentClosed{ completed: false,
rent_reclaimed }` **then** drains lamports to the learner, assigns the
account to the System program and truncates it to 0 bytes.

### 5.10 `issue_credential` — `[255,193,171,224,68,171,194,87]`

**Args**: `credential_name: String, metadata_uri: String, courses_completed:
u32, total_xp: u64`. Backend-cosigned.

Accounts: config | course (PDA) | enrollment (w, PDA @ 2006, course-match @ 6009) | learner | credential_asset (w,s — fresh keypair) | track_collection
(w, `== course.collection` @ 6016) | payer (w,s) | backend_signer (s @ 6000)
| mpl_core_program (2012) | system_program.

**Effects**: kill-switch off (6031); enrollment finalized (6006); credential
not yet issued (`credential_asset` None, else 6017). CPI mpl-core
**CreateV2** (Config-PDA-signed): owner = learner, collection =
track_collection, plugins `[PermanentFreezeDelegate{frozen: true} /
UpdateAuthority, Attributes{track_id, level, courses_completed, total_xp — all
rendered as decimal strings} / UpdateAuthority]` → a **soulbound** NFT.
Records `enrollment.credential_asset = asset`. **Event**: `CredentialIssued`.

### 5.11 `upgrade_credential` — `[2,121,77,255,103,187,252,169]`

**Args**: same as 5.10.

Accounts: as 5.10 except enrollment is read-only and credential_asset is
writable but NOT a signer.

**Effects**: kill-switch off (6031); finalized (6006); the passed asset must
equal `enrollment.credential_asset` (unset → 6006; mismatch → 6015). Two
Config-PDA-signed CPIs: mpl-core **UpdateV1** (new name + new URI) and
**UpdatePluginV1** (replaces the Attributes plugin with the four refreshed
values). Note the mpl-core account-meta asymmetry: the collection is
read-only for UpdateV1 but writable for UpdatePluginV1. **Event**:
`CredentialUpgraded`.

### 5.12 `register_minter` — `[58,224,74,142,170,95,116,191]`

**Args**: `minter: Pubkey, label: String, max_xp_per_call: u64,
max_total_xp: u64`.

Accounts: config (PDA) | minter_role (w, init at `["minter", minter]`, payer
= payer, 110 B) | authority (w,s, `== config.authority` @ 6000) | payer (w,s)
| system_program.

**Effects**: the PDA is created before the authority check (account-order
semantics); label ≤ 32 bytes (6021, empty allowed). Writes the role
(counters 0, active). **Event**: `MinterRegistered`.

### 5.13 `revoke_minter` — `[33,91,131,167,62,37,38,105]`

Accounts: config (PDA) | minter_role (w, PDA over its stored `minter`,
closed to authority) | authority (w,s, `== config.authority` @ 6000).

**Effects**: refuses to close the role whose `minter ==
config.backend_signer` (6000) — that would silently break completions;
rotate the backend first. Emits `MinterRevoked` then closes the PDA (rent to
authority).

### 5.14 `update_minter` — `[164,129,164,88,75,29,91,38]`

**Args**: `max_xp_per_call: u64, max_total_xp: u64`.

Accounts: config (PDA) | minter_role (w, PDA) | authority (s, `==
config.authority` @ 6000).

**Effects**: overwrites both caps unconditionally (setting `max_total_xp ≤
total_xp_minted` freezes the role — the sanctioned soft-retire). **Event**:
`MinterUpdated`.

### 5.15 `reward_xp` — `[144,187,117,238,89,118,224,145]`

**Args**: `amount: u64, memo: String` (memo length unbounded on-chain;
transaction-size limited). Minter + backend cosigned; the general-purpose XP
faucet.

| #   | Account                 | Access | Checks                                                              |
| --- | ----------------------- | ------ | ------------------------------------------------------------------- |
| 0   | config                  |        | PDA                                                                 |
| 1   | minter_role             | w      | PDA `["minter", minter.key]` @ 2006; `role.minter == minter` @ 6000 |
| 2   | xp_mint                 | w      | `== config.xp_mint` @ 6000                                          |
| 3   | recipient_token_account | w      | see below                                                           |
| 4   | minter                  | s      |                                                                     |
| 5   | backend_signer          | s      | `== config.backend_signer` @ 6000                                   |
| 6   | token_program           |        | 2012                                                                |

**Effects**: kill-switch off (6031); role active (6018); `amount > 0`
(6027); `amount ≤ 5000` (6033); `amount ≤ max_xp_per_call` when that cap is
set (6019); `total_xp_minted + amount` (checked → 6010) `≤ max_total_xp`
when set (6020). The destination is **address-based by design**: there is no
on-chain recipient identity to bind, so only the ATA's mint is pinned to
`config.xp_mint` (6032) — the caps bound the blast radius. Mints, then
persists the new `total_xp_minted`. **Event**: `XpRewarded{ recipient = the
token-account address }`.

### 5.16 `create_achievement_type` — `[231,38,39,228,103,4,229,19]`

**Args**: `achievement_id: String, name: String, metadata_uri: String,
max_supply: u32, xp_reward: u32`.

Accounts: config (PDA) | achievement_type (w, init at `["achievement", id]`,
payer = payer, 338 B) | collection (w,s — fresh keypair) | authority (s, `==
config.authority` @ 6000) | payer (w,s) | mpl_core_program (2012) |
system_program.

**Effects**: id non-empty ≤ 32 (6024); name non-empty ≤ 64 (6025); uri
non-empty ≤ 128 (6026); `xp_reward > 0` (6028); `max_supply` 0 = unlimited.
CPI mpl-core **CreateCollectionV2** (update authority = Config PDA, no
plugins). Writes the AchievementType (supply 0, active). **Event**:
`AchievementTypeCreated`.

### 5.17 `award_achievement` — `[75,47,156,253,124,231,84,12]`

**Args**: none. Minter + backend cosigned.

| #     | Account                      | Access | Checks                                                                                              |
| ----- | ---------------------------- | ------ | --------------------------------------------------------------------------------------------------- |
| 0     | config                       |        | PDA                                                                                                 |
| 1     | achievement_type             | w      | PDA over stored id                                                                                  |
| 2     | achievement_receipt          | w      | init at `["achievement_receipt", id, recipient]` (payer = payer, 49 B) — **the double-award guard** |
| 3     | minter_role                  | w      | PDA `["minter", minter.key]`; `role.minter == minter` @ 6000                                        |
| 4     | asset                        | w,s    | fresh NFT keypair                                                                                   |
| 5     | collection                   | w      | `== achievement_type.collection` @ 6000                                                             |
| 6     | recipient                    |        | identity only                                                                                       |
| 7     | recipient_token_account      | w      | bound iff xp_reward > 0                                                                             |
| 8     | xp_mint                      | w      | `== config.xp_mint` @ 6000                                                                          |
| 9     | payer                        | w,s    |                                                                                                     |
| 10    | minter                       | s      |                                                                                                     |
| 11    | backend_signer               | s      | `== config.backend_signer` @ 6000                                                                   |
| 12–14 | mpl_core, token-2022, system |        | 2012 / 2012 / —                                                                                     |

**Effects**: kill-switch off (6031); achievement active (6022); role active
(6018); if `max_supply > 0`, `current_supply < max_supply` (6023). XP-cap
gate BEFORE any CPI (this path mints through the role's budget too):
`xp_reward ≤ 5000` (6033), `total_xp_minted + xp_reward` checked (6010) and
≤ `max_total_xp` when set (6020). `next_supply = current_supply + 1`
(checked, 6010). CPI mpl-core **CreateV2** (soulbound, owner = recipient,
Attributes `{achievement_id, supply_number}`); if `xp_reward > 0`, recipient
ATA bound to mint + recipient identity (6032/6000) and XP minted. Persists
`current_supply = next_supply`, the role's `total_xp_minted`, and writes the
receipt `{asset, awarded_at}`. **Event**: `AchievementAwarded`.

Note: `max_xp_per_call` does NOT gate this path (only the absolute 5000
ceiling and the lifetime cap do); `xp_reward` was validated > 0 at type
creation, but a type-level reward could be 0 only if created before that
rule — the `xp_reward > 0` branches keep that safe.

### 5.18 `deactivate_achievement_type` — `[185,21,222,243,192,118,71,191]`

Accounts: config (PDA) | achievement_type (w, PDA) | authority (s, `==
config.authority` @ 6000).

**Effects**: `is_active = false` (one-way; no reactivation instruction).
**Event**: `AchievementTypeDeactivated`.

---

## 6. Events

Payload = fields in order, Borsh-encoded, prefixed by the 8-byte
discriminator; emitted via `sol_log_data` (`Program data:` log).

| Event                      | Discriminator                       | Fields                                                                             |
| -------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------- |
| ConfigUpdated              | `[40,241,230,122,11,19,198,194]`    | field: String ("backend_signer" \| "authority"), timestamp: i64                    |
| CourseCreated              | `[205,144,55,47,150,170,123,214]`   | course, course_id, creator, track_id: u16, track_level: u8, collection, timestamp  |
| CourseUpdated              | `[124,141,110,224,149,124,26,141]`  | course, version: u16, collection, timestamp                                        |
| CourseClosed               | `[35,195,37,254,25,107,100,12]`     | course, course_id, timestamp                                                       |
| Enrolled                   | `[129,156,102,214,94,196,220,127]`  | learner, course, course_version: u16, timestamp                                    |
| LessonCompleted            | `[248,174,148,235,186,49,11,163]`   | learner, course, lesson_index: u8, xp_earned: u32, timestamp                       |
| CourseFinalized            | `[18,195,195,25,165,189,194,56]`    | learner, course, total_xp: u32, bonus_xp: u64, creator, creator_xp: u32, timestamp |
| EnrollmentClosed           | `[197,4,145,238,217,4,175,77]`      | learner, course, completed: bool (always false), rent_reclaimed: u64, timestamp    |
| CredentialIssued           | `[194,216,28,159,89,29,72,177]`     | learner, track_id: u16, credential_asset, current_level: u8, timestamp             |
| CredentialUpgraded         | `[198,142,252,191,210,200,253,133]` | learner, track_id: u16, credential_asset, current_level: u8, timestamp             |
| MinterRegistered           | `[104,203,87,105,23,33,231,1]`      | minter, label: String, max_xp_per_call: u64, max_total_xp: u64, timestamp          |
| MinterRevoked              | `[138,76,227,247,141,92,77,127]`    | minter, total_xp_minted: u64, timestamp                                            |
| MinterUpdated              | `[8,124,66,45,176,53,49,153]`       | minter, max_xp_per_call: u64, max_total_xp: u64, timestamp                         |
| XpRewarded                 | `[140,182,232,144,16,155,237,182]`  | minter, recipient (ATA address), amount: u64, memo: String, timestamp              |
| AchievementTypeCreated     | `[189,36,173,243,25,232,198,153]`   | achievement_id, collection, creator, max_supply: u32, xp_reward: u32, timestamp    |
| AchievementAwarded         | `[127,212,93,231,175,0,69,150]`     | achievement_id, recipient, asset, xp_reward: u32, timestamp                        |
| AchievementTypeDeactivated | `[133,12,218,127,151,28,1,222]`     | achievement_id, timestamp                                                          |
| MintingPauseSet            | `[232,11,219,8,116,65,178,74]`      | paused: bool, timestamp                                                            |

Pubkey fields are 32 raw bytes. `initialize` emits nothing.

## 7. Errors

Program errors (`Custom(6000 + n)`):

| Code | Name                       | Message                                                      |
| ---- | -------------------------- | ------------------------------------------------------------ |
| 6000 | Unauthorized               | Unauthorized signer                                          |
| 6001 | CourseNotActive            | Course not active                                            |
| 6002 | LessonOutOfBounds          | Lesson index out of bounds                                   |
| 6003 | LessonAlreadyCompleted     | Lesson already completed                                     |
| 6004 | CourseNotCompleted         | Not all lessons completed                                    |
| 6005 | CourseAlreadyFinalized     | Course already finalized                                     |
| 6006 | CourseNotFinalized         | Course not finalized                                         |
| 6007 | PrerequisiteNotMet         | Prerequisite not met                                         |
| 6008 | UnenrollCooldown           | Close cooldown not met (24h)                                 |
| 6009 | EnrollmentCourseMismatch   | Enrollment/course mismatch                                   |
| 6010 | Overflow                   | Arithmetic overflow                                          |
| 6011 | CourseIdEmpty              | Course ID is empty                                           |
| 6012 | CourseIdTooLong            | Course ID exceeds max length                                 |
| 6013 | InvalidLessonCount         | Lesson count must be at least 1                              |
| 6014 | InvalidDifficulty          | Difficulty must be 1, 2, or 3                                |
| 6015 | CredentialAssetMismatch    | Credential asset does not match enrollment record            |
| 6016 | CollectionMismatch         | Collection does not match the course's credential collection |
| 6017 | CredentialAlreadyIssued    | Credential already issued for this enrollment                |
| 6018 | MinterNotActive            | Minter role is not active                                    |
| 6019 | MinterAmountExceeded       | Amount exceeds minter's per-call limit                       |
| 6020 | MinterCapExceeded          | Cumulative minted XP would exceed minter's total cap         |
| 6021 | LabelTooLong               | Minter label exceeds max length                              |
| 6022 | AchievementNotActive       | Achievement type is not active                               |
| 6023 | AchievementSupplyExhausted | Achievement max supply reached                               |
| 6024 | AchievementIdTooLong       | Achievement ID exceeds max length                            |
| 6025 | AchievementNameTooLong     | Achievement name exceeds max length                          |
| 6026 | AchievementUriTooLong      | Achievement URI exceeds max length                           |
| 6027 | InvalidAmount              | Amount must be greater than zero                             |
| 6028 | InvalidXpReward            | XP reward must be greater than zero                          |
| 6029 | EnrollmentFinalized        | Finalized or credentialed enrollment cannot be closed        |
| 6030 | InvalidCourseAccount       | Account is not a valid Course PDA                            |
| 6031 | MintingPaused              | Minting is paused                                            |
| 6032 | WrongXpMint                | Recipient token account mint does not match Config.xp_mint   |
| 6033 | XpAmountExceedsMax         | XP amount exceeds the per-mint ceiling                       |

Framework-space errors surfaced by validation: 101
InstructionFallbackNotFound, 102 InstructionDidNotDeserialize, 2000
ConstraintMut, 2006 ConstraintSeeds, 2012 ConstraintAddress, 3001/3002
discriminator missing/mismatch, 3003 AccountDidNotDeserialize, 3005
AccountNotEnoughKeys, 3007 AccountOwnedByWrongProgram, 3008 InvalidProgramId,
3010 AccountNotSigner, 3012 AccountNotInitialized, 4100
DeclaredProgramIdMismatch. Token-account structural violations raise the
token-program-style `InvalidAccountData` / `UninitializedAccount`.

## 8. Constants

| Constant                 | Value           | Where used                                         |
| ------------------------ | --------------- | -------------------------------------------------- |
| MAX_XP_PER_MINT          | 5000 XP         | every mint path (matches the 5000/day SQL ceiling) |
| MAX_COURSE_ID_LEN        | 32 bytes        | create_course                                      |
| MAX_LABEL_LEN            | 32 bytes        | register_minter                                    |
| MAX_ACHIEVEMENT_ID_LEN   | 32 bytes        | create_achievement_type                            |
| MAX_ACHIEVEMENT_NAME_LEN | 64 bytes        | create_achievement_type                            |
| MAX_ACHIEVEMENT_URI_LEN  | 128 bytes       | create_achievement_type                            |
| CREATOR_REWARD_WINDOW    | 100 completions | finalize_course                                    |
| Unenroll cooldown        | 86 400 s (24 h) | close_enrollment                                   |
| XP mint decimals         | 0               | initialize                                         |
| XP mint space            | 274 bytes       | initialize                                         |

## 9. Protocol invariants & security notes

1. **Kill-switch coverage**: `Config.paused` blocks all six mint/credential
   paths (complete_lesson, finalize_course, reward_xp, award_achievement,
   issue_credential, upgrade_credential). Admin/course/minter management
   stays available while paused.
2. **Backend rotation is permissive about the old role** (§5.2): when
   `new_backend_signer` is set without passing the old MinterRole, the old
   role stays active. The old key can then still co-sign nothing (it is no
   longer `config.backend_signer`) but its MinterRole could be reused if the
   key is ever re-appointed. Operational guidance: always pass the old role;
   enforcing it on-chain is a known follow-up that would change the
   instruction contract (the test suite exercises the permissive path).
3. **Single-step authority rotation**: `new_authority` takes effect
   immediately (zero key rejected). A two-step nominate/accept flow needs 32
   bytes of new Config state — a layout migration (only 7 reserved bytes
   remain) — and is documented future work.
4. **Replay guards**: a finalized or credentialed Enrollment can never be
   closed (6029), so course XP + credentials are one-shot per learner ×
   course. AchievementReceipt PDAs make awards one-shot per achievement ×
   recipient.
5. **Recipient binding**: identity-bearing mint paths (complete_lesson,
   finalize_course, award_achievement) bind the destination ATA's mint AND
   owner; `reward_xp` binds mint only (no on-chain identity exists) and is
   bounded by the caps.
6. **Creator-reward window arithmetic**: `min_completions_for_reward` is a
   u16, so `min + 100` computed in u32 can never overflow; the
   saturating add in the implementations is provably equivalent to a checked
   add here.
7. **XP is soulbound**: the mint is NonTransferable; Config holds a
   PermanentDelegate (future clawback/administration) and is the only mint
   authority. Credentials/achievements carry
   `PermanentFreezeDelegate{frozen: true}` from creation.
8. **No reentrancy surface**: all CPIs target fixed, validated program ids
   (Token-2022, mpl-core, System); no user-supplied program is ever invoked.

## Implementations

|           | Pinocchio (production)                               |
| --------- | ---------------------------------------------------- |
| Crate     | `onchain-academy/programs/onchain-academy-pinocchio` |
| Framework | pinocchio 0.11.2 (`no_std`, no allocator)            |
| Build     | `cargo build-sbf --tools-version v1.54`              |

Conformance to this spec is enforced by two test layers: host byte-parity
tests (layouts, discriminators, CPI wire bytes) and a single-VM integration
suite replaying all instructions (happy + error paths) on the compiled binary
— see `onchain-academy/package.json` scripts. The measured compute-unit gap
against the retired Anchor build is catalogued in
[ANCHOR-VS-PINOCCHIO.md](./ANCHOR-VS-PINOCCHIO.md).

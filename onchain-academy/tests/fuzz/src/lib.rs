//! Seeded fuzz harness for the `onchain_academy` program on litesvm.
//!
//! Ported from the Trident harness (`onchain-academy/trident-tests`, removed in
//! 09-2026) with the same coverage: one iteration initializes the platform and
//! creates a course with fuzzed economics, then runs a random sequence of
//! `enroll` / `complete_lesson` / `finalize_course` flows and checks the same
//! two invariants. Two flows the Trident harness never had were added in
//! 09-2026 — `close_enrollment` (unenroll) and a close/recreate of the course —
//! along with a seeded clock warp between flows, without which every
//! time-dependent branch in the program was unreachable.
//!
//! Everything is derived from a single u64 seed: given the seed the exact same
//! instruction sequence replays, so a crash file is a reproduction recipe.
//!
//! The pre-mainnet hardening (10-2026) added: an impostor `initialize` before
//! the real one (only the upgrade authority may initialize), sponsored
//! enrollments with the rent refunded to the recorded payer, `update_course`
//! flows that retire slots and move XP inside and outside the write-time
//! bounds, and the `close_course` refusal for courses with enrollments.
//!
//! Instruction builders, PDA derivation and the `.so` loader come from the
//! differential suite (`onchain_academy_differential`) — same program, same
//! runtime line, no second copy to keep in sync. Transactions are sent here
//! rather than through `Harness::run` only because the fuzzer needs the program
//! logs on the success path too.

use borsh::BorshDeserialize;
use litesvm::types::TransactionMetadata;
use onchain_academy_differential::harness::Harness;
use onchain_academy_differential::ixs::{self, CourseParams};
use rand::rngs::StdRng;
use rand::{Rng, SeedableRng};
use solana_sdk::instruction::{Instruction, InstructionError};
use solana_sdk::pubkey::Pubkey;
use solana_sdk::signature::Keypair;
use solana_sdk::signer::Signer;
use solana_sdk::transaction::{Transaction, TransactionError};
use std::collections::BTreeMap;

pub const SOL: u64 = 1_000_000_000;
/// Fixed course id so the Course / Enrollment PDAs are reproducible across flows.
pub const COURSE_ID: &str = "fuzz-course";

/// Exit code for a crash (invariant violation or an unexpected program error).
pub const EXIT_CRASH: i32 = 99;
/// Exit code for a failed preflight smoke — distinct from a fuzz finding,
/// because it means the harness/runtime is broken, not the program logic.
pub const EXIT_PREFLIGHT: i32 = 98;

// ---- on-chain account layouts ------------------------------------------------
// Pubkeys are decoded as raw byte arrays so this crate needs no borsh feature on
// solana-sdk. Ported unchanged from the Trident harness's types.rs.

/// Borsh body of the `Enrollment` account (after the 8-byte discriminator).
#[derive(BorshDeserialize, Debug, Clone)]
pub struct EnrollmentAccount {
    pub course: [u8; 32],
    pub enrolled_at: i64,
    pub completed_at: Option<i64>,
    pub lesson_flags: [u64; 4],
    pub credential_asset: Option<[u8; 32]>,
    /// `Course.generation` in force at enroll time.
    pub course_gen: u32,
    pub bump: u8,
}

/// Borsh body of the `Course` account (after the 8-byte discriminator).
///
/// `active_lessons` (CS-3) replaced the v1 `lesson_count: u8` — a 256-bit mask
/// of live lesson slots, mirroring `Enrollment.lesson_flags`.
#[derive(BorshDeserialize, Debug, Clone)]
pub struct CourseAccount {
    pub course_id: String,
    pub creator: [u8; 32],
    pub content_tx_id: [u8; 32],
    pub version: u16,
    pub active_lessons: [u64; 4],
    pub difficulty: u8,
    pub xp_per_lesson: u32,
    pub track_id: u16,
    pub track_level: u8,
    pub prerequisite: Option<[u8; 32]>,
    pub creator_reward_xp: u32,
    pub total_completions: u32,
    pub total_enrollments: u32,
    pub is_active: bool,
    pub created_at: i64,
    pub updated_at: i64,
    pub collection: [u8; 32],
    pub generation: u32,
    pub _reserved: [u8; 4],
    pub bump: u8,
}

/// A finding: either a violated invariant or a program error that means the
/// program blew up rather than rejected the input.
#[derive(Debug)]
pub struct Crash {
    pub kind: &'static str,
    pub detail: String,
    pub logs: Vec<String>,
}

pub type FuzzResult<T> = Result<T, Crash>;

/// Error codes the fuzzer explicitly tracks so the coverage line can prove the
/// time-dependent branches were reached (F-3).
pub const ERR_UNENROLL_COOLDOWN: u32 = 6008;
pub const ERR_STALE_ENROLLMENT: u32 = 6034;
pub const ERR_UNAUTHORIZED: u32 = 6000;
pub const ERR_INVALID_LESSON_COUNT: u32 = 6013;
pub const ERR_XP_AMOUNT_EXCEEDS_MAX: u32 = 6033;
pub const ERR_COURSE_HAS_ENROLLMENTS: u32 = 6037;
pub const ERR_CONSTRAINT_ADDRESS: u32 = 2012;
const MAX_XP_PER_MINT: u64 = 5_000;
/// Rent payer offset in a 159-byte Enrollment (after the 127-byte body).
const PAYER_OFFSET: usize = 127;

/// The program's write-time XP rule, restated independently: every mint the
/// course can trigger fits in one mint.
fn xp_in_bounds(xp_per_lesson: u32, creator_reward_xp: u32, live_lessons: u32) -> bool {
    xp_per_lesson as u64 <= MAX_XP_PER_MINT
        && creator_reward_xp as u64 <= MAX_XP_PER_MINT
        && (xp_per_lesson as u64 * live_lessons as u64) / 2 <= MAX_XP_PER_MINT
}

/// Is this transaction error an *expected* rejection of fuzzed input?
///
/// Allowlist of exactly one variant: `Custom(_)`, the program's own
/// `AcademyError` codes plus the Anchor-parity framework codes its validation
/// helpers return. Everything else is a finding.
///
/// The allowlist started wider — ten further `InstructionError` variants,
/// justified as "fuzzed data that does not parse", "a learner short of rent"
/// and so on. None of them is reachable: this is a flow/state fuzzer, so it
/// only ever builds well-formed data, correct signers and real ATAs, and the
/// gate on #1214 observed zero non-`Custom` errors in ~64k transactions across
/// three seeds. Each was also a real bug signature — a forgotten
/// `target.resize(0)` in `close_account` surfaces as `ModifiedProgramId`, a
/// wrong account reaching the Token-2022 CPI as `InvalidAccountData`, a
/// program debiting lamports it may not as `InsufficientFunds`.
///
/// Re-add a variant only together with the seed that produced it.
fn is_expected_rejection(err: &TransactionError) -> bool {
    matches!(
        err,
        TransactionError::InstructionError(_, InstructionError::Custom(_))
    )
}

/// Inverse of [`is_expected_rejection`] — kept as a named predicate because the
/// send path reads better as "is this a finding".
fn is_unexpected(err: &TransactionError) -> bool {
    !is_expected_rejection(err)
}

/// The `Custom` code of a rejection, for the per-code counters.
fn custom_code(err: &TransactionError) -> Option<u32> {
    match err {
        TransactionError::InstructionError(_, InstructionError::Custom(c)) => Some(*c),
        _ => None,
    }
}

/// Success counters per flow. Printed by the driver at the end of a run: a run
/// that "completed" with zeros is not coverage, it is the failure mode this
/// port exists to make visible.
#[derive(Default, Debug, Clone)]
pub struct Stats {
    pub transactions: u64,
    pub enrollments: u64,
    pub lessons_completed: u64,
    pub finalizations: u64,
    pub unenrollments: u64,
    pub course_recreations: u64,
    /// Enrollments whose rent was paid by a separate sponsor.
    pub sponsored_enrollments: u64,
    /// Closes that refunded a sponsor (not the learner).
    pub sponsor_refunds: u64,
    /// Stale enrollments re-initialised in place by a re-enroll.
    pub stale_reenrollments: u64,
    /// `update_course` calls the program accepted / refused (6013, 6033).
    pub course_updates: u64,
    pub course_update_rejections: u64,
    /// `close_course` refused because the course had enrollments (6037).
    pub close_course_refusals: u64,
    /// `initialize` attempts by a signer that is not the upgrade authority.
    pub impostor_inits_rejected: u64,
    /// Rejections with `UnenrollCooldown` (6008) — unreachable before the
    /// clock started moving.
    pub cooldown_rejections: u64,
    /// Rejections with `StaleEnrollment` (6034) — unreachable before the
    /// course-recreate flow existed.
    pub stale_rejections: u64,
    /// Hostile account sets that the program rejected, by `Custom` code. The
    /// codes matter as much as the count: they say *which* account check did
    /// the rejecting, so a check going missing shows up as a code that stops
    /// appearing rather than as a silent pass.
    pub hostile_rejections: BTreeMap<u32, u64>,
}

impl Stats {
    pub fn merge(&mut self, other: &Stats) {
        self.transactions += other.transactions;
        self.enrollments += other.enrollments;
        self.lessons_completed += other.lessons_completed;
        self.finalizations += other.finalizations;
        self.unenrollments += other.unenrollments;
        self.course_recreations += other.course_recreations;
        self.sponsored_enrollments += other.sponsored_enrollments;
        self.sponsor_refunds += other.sponsor_refunds;
        self.stale_reenrollments += other.stale_reenrollments;
        self.course_updates += other.course_updates;
        self.course_update_rejections += other.course_update_rejections;
        self.close_course_refusals += other.close_course_refusals;
        self.impostor_inits_rejected += other.impostor_inits_rejected;
        self.cooldown_rejections += other.cooldown_rejections;
        self.stale_rejections += other.stale_rejections;
        for (code, count) in &other.hostile_rejections {
            *self.hostile_rejections.entry(*code).or_default() += count;
        }
    }

    /// `6000x12, 2006x7` — the hostile-swap rejection codes for the summary line.
    pub fn hostile_summary(&self) -> String {
        if self.hostile_rejections.is_empty() {
            return "none".to_string();
        }
        self.hostile_rejections
            .iter()
            .map(|(code, count)| format!("{code}x{count}"))
            .collect::<Vec<_>>()
            .join(", ")
    }

    pub fn hostile_total(&self) -> u64 {
        self.hostile_rejections.values().sum()
    }
}

pub struct Outcome {
    pub ok: bool,
    pub logs: Vec<String>,
    pub err: Option<TransactionError>,
}

/// Course id whose PDA is never created — the "foreign course" of the hostile
/// account sets.
pub const FOREIGN_COURSE_ID: &str = "fuzz-course-foreign";

/// One wrong-but-plausible account substituted into an otherwise valid
/// instruction (G-2 on #1214).
///
/// Every flow above sends a *correct* account set, so the program's account
/// checks were never exercised: the gate deleted `expect_program_owned`
/// outright and the fuzzer still ran clean. These swaps change exactly one
/// address per instruction — the kind of substitution a caller who holds a
/// signature but not the right accounts would attempt — and the program must
/// reject every one of them.
///
/// Which check they actually exercise: deleting the enrollment `expect_pda` in
/// `complete_lesson` makes `ForeignEnrollment` pass and the run exit 99.
/// Deleting `expect_program_owned` alone stays clean, and that is not a gap —
/// `expect_account` runs `expect_initialized` and the discriminator compare
/// around it, so no substituted account can be caught by the owner check
/// alone. It is defense in depth, not the load-bearing check.
#[derive(Debug, Clone, Copy)]
enum AccountSwap {
    /// `complete_lesson` against another learner's Enrollment PDA: the seeds no
    /// longer match the learner account, so `expect_pda` must reject (2006).
    ForeignEnrollment,
    /// `complete_lesson` crediting the creator's XP ATA instead of the
    /// learner's: `require_xp_recipient` must reject on the owner binding
    /// (6000).
    CreatorTokenAccount,
    /// `complete_lesson` reading a Course PDA that was never created: the
    /// account is system-owned and empty, so `expect_account` must reject
    /// (3012 / 3007).
    UnknownCourse,
    /// `close_enrollment` signed by one learner but pointed at another
    /// learner's Enrollment PDA — the account-substitution that would drain a
    /// stranger's rent. Must reject (2006).
    ForeignEnrollmentOnClose,
    /// `close_enrollment` paying the rent to someone other than the recorded
    /// payer. Must reject (2012).
    WrongRentRecipient,
}

pub struct Session {
    pub h: Harness,
    rng: StdRng,
    /// Every instruction attempted this iteration, with its outcome. Printed
    /// and written to the crash file on a finding.
    pub sequence: Vec<String>,
    pub authority: Keypair,
    pub xp_mint: Pubkey,
    pub stats: Stats,
    learners: Vec<Keypair>,
    /// Rent payer recorded for each entry of `learners` (same index).
    payers: Vec<Pubkey>,
    /// Funds sponsored enrollments. Never the fee payer, so its balance moves
    /// only by the rent it pays and gets back.
    sponsor: Keypair,
    /// Did the last `create_fuzzed_course` in this session succeed? That is the
    /// only legitimate reason for the Course PDA to be missing, so it is the
    /// only condition under which a flow may skip on it.
    course_live: bool,
}

impl Session {
    /// A fresh VM with the real `.so` loaded, seeded from `seed`.
    pub fn new(seed: u64) -> Self {
        let mut rng = StdRng::seed_from_u64(seed);
        let authority = keypair_from(&mut rng);
        let sponsor = keypair_from(&mut rng);
        let mut h = Harness::new();
        // The authority deployed the program: it is the upgrade authority
        // `initialize` checks for.
        h.set_upgrade_authority(Some(&authority.pubkey()));
        Self {
            h,
            rng,
            sequence: Vec::new(),
            authority,
            xp_mint: Pubkey::default(),
            stats: Stats::default(),
            learners: Vec::new(),
            payers: Vec::new(),
            sponsor,
            course_live: false,
        }
    }

    fn send(&mut self, label: &str, ixs_list: &[Instruction], signers: &[&Keypair]) -> Outcome {
        // Fresh blockhash per send so identical retried transactions are never
        // deduplicated as AlreadyProcessed.
        self.h.svm.expire_blockhash();
        self.stats.transactions += 1;
        let payer = self.authority.insecure_clone();
        let mut all: Vec<&Keypair> = vec![&payer];
        for s in signers {
            if s.pubkey() != payer.pubkey() {
                all.push(s);
            }
        }
        let tx = Transaction::new_signed_with_payer(
            ixs_list,
            Some(&payer.pubkey()),
            &all,
            self.h.svm.latest_blockhash(),
        );
        match self.h.svm.send_transaction(tx) {
            Ok(meta) => {
                self.sequence.push(format!("{label} -> ok"));
                Outcome {
                    ok: true,
                    logs: meta.logs,
                    err: None,
                }
            }
            Err(failed) => {
                match custom_code(&failed.err) {
                    Some(ERR_UNENROLL_COOLDOWN) => self.stats.cooldown_rejections += 1,
                    Some(ERR_STALE_ENROLLMENT) => self.stats.stale_rejections += 1,
                    _ => {}
                }
                self.sequence
                    .push(format!("{label} -> err {:?}", failed.err));
                let TransactionMetadata { logs, .. } = failed.meta;
                Outcome {
                    ok: false,
                    logs,
                    err: Some(failed.err),
                }
            }
        }
    }

    /// Sends and turns an unexpected program error into a finding.
    fn send_checked(
        &mut self,
        label: &str,
        ixs_list: &[Instruction],
        signers: &[&Keypair],
    ) -> FuzzResult<Outcome> {
        let out = self.send(label, ixs_list, signers);
        match &out.err {
            Some(e) if is_unexpected(e) => Err(Crash {
                kind: "unexpected program error",
                detail: format!("{label}: {e:?}"),
                logs: out.logs,
            }),
            _ => Ok(out),
        }
    }

    /// `initialize` only — the preflight smoke and the first step of an iteration.
    pub fn initialize(&mut self) -> FuzzResult<Outcome> {
        let authority = self.authority.pubkey();
        self.h.airdrop(&authority, 500 * SOL);
        let xp_mint = keypair_from(&mut self.rng);
        self.xp_mint = xp_mint.pubkey();
        let ix = ixs::initialize(&xp_mint.pubkey(), &authority);
        self.send_checked("initialize", &[ix], &[&xp_mint])
    }

    /// A signer that is not the upgrade authority tries to initialize first.
    /// It must be refused with `Unauthorized` and leave no Config behind.
    fn impostor_initialize(&mut self) -> FuzzResult<()> {
        let impostor = keypair_from(&mut self.rng);
        let xp_mint = keypair_from(&mut self.rng);
        // The authority pays every fee in this harness.
        let authority = self.authority.pubkey();
        self.h.airdrop(&authority, 10 * SOL);
        self.h.airdrop(&impostor.pubkey(), 10 * SOL);
        let ix = ixs::initialize(&xp_mint.pubkey(), &impostor.pubkey());
        let out = self.send_checked("initialize(impostor)", &[ix], &[&impostor, &xp_mint])?;
        let config_exists = self
            .h
            .svm
            .get_account(&ixs::config_pda())
            .is_some_and(|a| !a.data.is_empty());
        match out.err.as_ref().and_then(custom_code) {
            Some(ERR_UNAUTHORIZED) if !config_exists => {
                self.stats.impostor_inits_rejected += 1;
                Ok(())
            }
            other => Err(Crash {
                kind: "invariant violated",
                detail: format!(
                    "initialize by a non-upgrade-authority returned {other:?} (config exists: {config_exists})"
                ),
                logs: out.logs,
            }),
        }
    }

    /// Platform + one course with fuzzed economics + the creator's XP ATA.
    /// Returns false if `create_course` was rejected, in which case the flows
    /// have nothing to work with this iteration.
    pub fn init_iteration(&mut self) -> FuzzResult<bool> {
        self.impostor_initialize()?;
        if !self.initialize()?.ok {
            return Ok(false);
        }
        let sponsor = self.sponsor.pubkey();
        self.h.airdrop(&sponsor, 100 * SOL);
        let created = self.create_fuzzed_course("create_course")?;

        // creator (== authority) ATA, target of finalize creator-reward mints.
        let authority = self.authority.pubkey();
        let mint = self.xp_mint;
        let ata = ixs::create_ata_idempotent(&authority, &authority, &mint);
        self.send_checked("create_ata(creator)", &[ata], &[])?;
        Ok(created)
    }

    /// One `create_course` with fuzzed economics under [`COURSE_ID`].
    fn create_fuzzed_course(&mut self, label: &str) -> FuzzResult<bool> {
        // Bounded fuzzed economics: difficulty must be 1..=3 and lesson_count
        // >= 1 or create_course rejects it (a valid rejection, but we want a
        // usable course most iterations).
        let lesson_count: u8 = self.rng.gen_range(1..=8);
        let difficulty: u8 = self.rng.gen_range(1..=3);
        // Most draws stay inside the per-mint XP bounds (each lesson, the
        // finalize bonus xp * lessons / 2 and the creator reward <= 5000) so the
        // flows have a course to work with; the rest run over them, which
        // `create_course` now refuses at write time (6033).
        let capped = self.rng.gen_bool(0.8);
        let xp_per_lesson: u32 = if capped {
            self.rng
                .gen_range(0..=(10_000 / lesson_count as u32).min(5_000))
        } else {
            self.rng.gen_range(0..=12_000)
        };
        let creator_reward_xp: u32 = if capped {
            self.rng.gen_range(0..=5_000)
        } else {
            self.rng.gen_range(0..=10_000)
        };
        let track_id: u16 = self.rng.gen();
        let track_level: u8 = self.rng.gen();
        let mut content_tx_id = [0u8; 32];
        self.rng.fill(&mut content_tx_id);

        let authority = self.authority.pubkey();
        let params = CourseParams {
            course_id: COURSE_ID,
            creator: authority,
            content_tx_id,
            lesson_count,
            difficulty,
            xp_per_lesson,
            track_id,
            track_level,
            prerequisite: None,
            creator_reward_xp,
            collection: None,
        };
        let out = self.send_checked(
            &format!(
                "{label}(lessons={lesson_count}, difficulty={difficulty}, \
                 xp_per_lesson={xp_per_lesson}, creator_reward_xp={creator_reward_xp})"
            ),
            &[ixs::create_course(&authority, &params)],
            &[],
        )?;
        // The write-time bound is exact: in bounds is accepted, out of bounds
        // is refused with 6033 — nothing else.
        let in_bounds = xp_in_bounds(xp_per_lesson, creator_reward_xp, lesson_count as u32);
        let code = out.err.as_ref().and_then(custom_code);
        if out.ok != in_bounds || (!out.ok && code != Some(ERR_XP_AMOUNT_EXCEEDS_MAX)) {
            return Err(Crash {
                kind: "invariant violated",
                detail: format!(
                    "create_course xp_per_lesson={xp_per_lesson} reward={creator_reward_xp} \
                     lessons={lesson_count}: in_bounds={in_bounds} but ok={} code={code:?}",
                    out.ok
                ),
                logs: out.logs,
            });
        }
        let created = out.ok;
        self.course_live = created;
        Ok(created)
    }

    /// Enroll a brand-new learner, then provision its XP ATA. Half the
    /// learners are sponsored (zero SOL, the sponsor pays the rent).
    ///
    /// Invariant: on success the Enrollment is 159 bytes and records the payer.
    pub fn flow_enroll(&mut self) -> FuzzResult<()> {
        let learner = keypair_from(&mut self.rng);
        let sponsored = self.rng.gen_bool(0.5);
        if !sponsored {
            self.h.airdrop(&learner.pubkey(), 50 * SOL);
        }
        let idx = self.learners.len();
        let payer = if sponsored {
            self.sponsor.pubkey()
        } else {
            learner.pubkey()
        };

        let ix = ixs::enroll_with_payer(&learner.pubkey(), &payer, COURSE_ID, None);
        let sponsor = self.sponsor.insecure_clone();
        let signers: Vec<&Keypair> = if sponsored {
            vec![&learner, &sponsor]
        } else {
            vec![&learner]
        };
        let label = format!("enroll(learner#{idx}, sponsored={sponsored})");
        let out = self.send_checked(&label, &[ix], &signers)?;
        if out.ok {
            self.stats.enrollments += 1;
            if sponsored {
                self.stats.sponsored_enrollments += 1;
            }
            match self.stored_payer(&learner.pubkey()) {
                Some(stored) if stored == payer => {}
                other => {
                    return Err(Crash {
                        kind: "invariant violated",
                        detail: format!("{label}: recorded payer {other:?}, expected {payer}"),
                        logs: out.logs,
                    })
                }
            }
            let mint = self.xp_mint;
            let authority = self.authority.pubkey();
            let ata = ixs::create_ata_idempotent(&authority, &learner.pubkey(), &mint);
            self.send_checked(&format!("create_ata(learner#{idx})"), &[ata], &[])?;
            self.learners.push(learner);
            self.payers.push(payer);
        }
        Ok(())
    }

    /// Re-enroll an existing learner. A current-generation enrollment refuses
    /// (the account is in use); a stale one is re-initialised in place.
    ///
    /// Invariant: a re-enroll never changes the recorded payer or the size.
    pub fn flow_reenroll(&mut self) -> FuzzResult<()> {
        let Some((idx, learner)) = self.pick_learner() else {
            self.sequence
                .push("reenroll -> skipped (no learners)".into());
            return Ok(());
        };
        let signer = self.learners[idx].insecure_clone();
        let before = self
            .h
            .svm
            .get_account(&ixs::enrollment_pda(COURSE_ID, &learner))
            .map(|a| a.data);
        // The learner pays its own way (zero-SOL learners are funded first).
        self.h.airdrop(&learner, SOL);
        let ix = ixs::enroll(&learner, COURSE_ID, None);
        let out = self.send_checked(&format!("reenroll(learner#{idx})"), &[ix], &[&signer])?;
        if !out.ok {
            return Ok(());
        }
        self.stats.stale_reenrollments += 1;
        let after = self
            .h
            .svm
            .get_account(&ixs::enrollment_pda(COURSE_ID, &learner))
            .map(|a| a.data);
        let same_tail = match (&before, &after) {
            (Some(b), Some(a)) => {
                b.len() == a.len() && b.get(PAYER_OFFSET..) == a.get(PAYER_OFFSET..)
            }
            _ => false,
        };
        if !same_tail {
            return Err(Crash {
                kind: "invariant violated",
                detail: "re-enroll over a stale enrollment changed its size or payer".to_string(),
                logs: out.logs,
            });
        }
        Ok(())
    }

    /// Complete a random lesson index for a random enrolled learner. Drives the
    /// Token-2022 `mint_to` CPI in `complete_lesson`.
    ///
    /// Invariant: on success the lesson bit is set.
    pub fn flow_complete_lesson(&mut self) -> FuzzResult<()> {
        let Some((idx, learner)) = self.pick_learner() else {
            self.sequence
                .push("complete_lesson -> skipped (no learners)".into());
            return Ok(());
        };
        let lesson_index: u8 = self.rng.gen_range(0..=12);
        let mint = self.xp_mint;
        let backend = self.authority.pubkey();
        let ix = ixs::complete_lesson(COURSE_ID, &learner, &mint, &backend, lesson_index);
        let out = self.send_checked(
            &format!("complete_lesson(learner#{idx}, lesson={lesson_index})"),
            &[ix],
            &[],
        )?;
        if !out.ok {
            return Ok(());
        }
        self.stats.lessons_completed += 1;

        if let Some(enr) = self.enrollment(&learner) {
            let word = (lesson_index / 64) as usize;
            let bit = 1u64 << (lesson_index % 64);
            if enr.lesson_flags[word] & bit == 0 {
                return Err(Crash {
                    kind: "invariant violated",
                    detail: format!(
                        "complete_lesson succeeded but lesson {lesson_index} bit is unset"
                    ),
                    logs: out.logs,
                });
            }
        }
        Ok(())
    }

    /// Drive the full completion path for a random learner: mark every lesson,
    /// then `finalize_course` (mints the completion bonus + creator reward).
    ///
    /// Invariant: a successful finalize stamped `completed_at` and the whole
    /// bitmap equals the course's active-lesson count.
    pub fn flow_finalize(&mut self) -> FuzzResult<()> {
        let Some((idx, learner)) = self.pick_learner() else {
            self.sequence
                .push("finalize -> skipped (no learners)".into());
            return Ok(());
        };
        // The account stores no raw lesson_count — derive it as the popcount of
        // the active_lessons mask. Nothing here retires a slot, so the course
        // stays dense and this equals the lesson_count used at creation.
        let Some(course) = self.course() else {
            // The one legitimate reason there is no course: the fuzzer's own
            // `create_course` / `recreate_course` was rejected, so the PDA was
            // never (re)opened. Anything else — a Course that exists but is
            // truncated, zeroed or otherwise undecodable — is the program
            // losing an account, and must crash rather than skip.
            if !self.course_live {
                self.sequence.push("finalize -> skipped (no course)".into());
                return Ok(());
            }
            let len = self
                .h
                .svm
                .get_account(&ixs::course_pda(COURSE_ID))
                .map_or(0, |a| a.data.len());
            return Err(Crash {
                kind: "invariant violated",
                detail: format!(
                    "create_course succeeded but the Course PDA no longer decodes (len {len})"
                ),
                logs: Vec::new(),
            });
        };
        let active = course.active_lessons;
        let live_slots: Vec<u8> = (0u16..256)
            .filter(|s| (active[(*s / 64) as usize] >> (s % 64)) & 1 == 1)
            .map(|s| s as u8)
            .collect();

        let mint = self.xp_mint;
        let backend = self.authority.pubkey();

        // Mark every live slot (already-complete / stale are valid rejections;
        // we just want to reach a finalizable state). Slots may be sparse once
        // `flow_update_course` has retired some.
        for lesson in live_slots {
            let ix = ixs::complete_lesson(COURSE_ID, &learner, &mint, &backend, lesson);
            self.send_checked(
                &format!("complete_lesson(learner#{idx}, lesson={lesson}) [finalize prelude]"),
                &[ix],
                &[],
            )?;
        }

        let creator = self.authority.pubkey();
        let ix = ixs::finalize_course(COURSE_ID, &learner, &creator, &mint, &backend);
        let out = self.send_checked(&format!("finalize_course(learner#{idx})"), &[ix], &[])?;
        if !out.ok {
            return Ok(());
        }
        self.stats.finalizations += 1;

        if let Some(enr) = self.enrollment(&learner) {
            if enr.completed_at.is_none() {
                return Err(Crash {
                    kind: "invariant violated",
                    detail: "finalize succeeded but completed_at is None".to_string(),
                    logs: out.logs,
                });
            }
            // The program's completion rule: every live slot is set (a slot
            // completed and later retired may also be set).
            let covered = (0..4).all(|w| enr.lesson_flags[w] & active[w] == active[w]);
            if !covered {
                return Err(Crash {
                    kind: "invariant violated",
                    detail: format!(
                        "finalize succeeded with flags {:?} not covering the active mask {active:?}",
                        enr.lesson_flags
                    ),
                    logs: out.logs,
                });
            }
        }
        Ok(())
    }

    /// Unenroll: `close_enrollment` reclaims the rent and frees the PDA.
    ///
    /// Gated on the 24h `UNENROLL_COOLDOWN_SECS`, so before the clock started
    /// moving this flow could only ever have produced `UnenrollCooldown`
    /// (6008). With [`Session::warp_clock`] both sides are reachable.
    ///
    /// Invariant: on success the Enrollment PDA is gone.
    pub fn flow_close_enrollment(&mut self) -> FuzzResult<()> {
        let Some((idx, learner)) = self.pick_learner() else {
            self.sequence
                .push("close_enrollment -> skipped (no learners)".into());
            return Ok(());
        };
        let signer = self.learners[idx].insecure_clone();
        let payer = self.payers[idx];
        let pda = ixs::enrollment_pda(COURSE_ID, &learner);
        let rent = self.h.svm.get_account(&pda).map_or(0, |a| a.lamports);
        let payer_before = self.h.svm.get_balance(&payer).unwrap_or(0);
        let ix = ixs::close_enrollment_to(COURSE_ID, &learner, &payer);
        let out = self.send_checked(
            &format!("close_enrollment(learner#{idx})"),
            &[ix],
            &[&signer],
        )?;
        if !out.ok {
            return Ok(());
        }
        self.stats.unenrollments += 1;
        // Invariant: the recorded payer got exactly the account's lamports
        // (neither the learner nor the sponsor is the fee payer).
        let payer_after = self.h.svm.get_balance(&payer).unwrap_or(0);
        if payer_after != payer_before + rent {
            return Err(Crash {
                kind: "invariant violated",
                detail: format!(
                    "close_enrollment refunded {} to the payer, expected the {rent} rent",
                    payer_after as i128 - payer_before as i128
                ),
                logs: out.logs,
            });
        }
        if payer != learner {
            self.stats.sponsor_refunds += 1;
        }
        // The learner no longer has an enrollment; drop it so later flows keep
        // working against live ones.
        self.learners.swap_remove(idx);
        self.payers.swap_remove(idx);

        if self
            .h
            .svm
            .get_account(&pda)
            .is_some_and(|a| !a.data.is_empty())
        {
            return Err(Crash {
                kind: "invariant violated",
                detail: "close_enrollment succeeded but the Enrollment PDA still has data"
                    .to_string(),
                logs: out.logs,
            });
        }
        Ok(())
    }

    /// Close the course and recreate it under the same id, which claims the
    /// next `Config.course_generation`.
    ///
    /// `close_course` refuses a course with enrollments (6037), so an honest
    /// close only lands while nobody has enrolled. When it is refused, the flow
    /// models a course closed with live enrollments by the program before that
    /// rule (zeroing `total_enrollments` first), which is still the only way to
    /// reach `StaleEnrollment` (6034) and the stale re-enroll path.
    pub fn flow_recreate_course(&mut self) -> FuzzResult<()> {
        let authority = self.authority.pubkey();
        let enrolled = self.course().map(|c| c.total_enrollments);
        let out = self.send_checked(
            "close_course",
            &[ixs::close_course(&authority, COURSE_ID)],
            &[],
        )?;
        let mut closed = out.ok;
        match (enrolled, out.err.as_ref().and_then(custom_code)) {
            // No course to close (a rejected create): nothing to check.
            (None, _) => {}
            (Some(0), None) => {}
            (Some(n), Some(ERR_COURSE_HAS_ENROLLMENTS)) if n > 0 => {
                self.stats.close_course_refusals += 1;
            }
            (Some(n), code) => {
                return Err(Crash {
                    kind: "invariant violated",
                    detail: format!(
                        "close_course with total_enrollments={n} returned ok={} code={code:?}",
                        out.ok
                    ),
                    logs: out.logs,
                })
            }
        }
        if !closed && enrolled.is_some_and(|n| n > 0) {
            self.zero_total_enrollments();
            closed = self
                .send_checked(
                    "close_course(pre-rule state)",
                    &[ixs::close_course(&authority, COURSE_ID)],
                    &[],
                )?
                .ok;
        }
        if !closed && self.course().is_some() {
            // Still there: nothing to recreate.
            return Ok(());
        }
        let recreated = self.create_fuzzed_course("recreate_course")?;
        if closed && recreated {
            self.stats.course_recreations += 1;
        }
        Ok(())
    }

    /// Rewrites `Course.total_enrollments` to 0, the state a course closed
    /// before `close_course` checked the counter could leave behind.
    fn zero_total_enrollments(&mut self) {
        let address = ixs::course_pda(COURSE_ID);
        let Some(mut account) = self.h.svm.get_account(&address) else {
            return;
        };
        // 12 + id + 106 fixed bytes -> prerequisite tag (None in this harness),
        // then creator_reward_xp (4), total_completions (4), total_enrollments.
        let o = 12 + COURSE_ID.len() + 106 + 1 + 4 + 4;
        account.data[o..o + 4].copy_from_slice(&0u32.to_le_bytes());
        self.h.set_account(address, account);
        self.sequence
            .push("set total_enrollments=0 (pre-rule state)".into());
    }

    /// `update_course` with a fuzzed mask, XP per lesson and creator reward:
    /// mostly in bounds (retiring and re-adding slots), sometimes a zero mask
    /// or XP a single mint cannot carry.
    ///
    /// Invariant: accepted exactly when the mask is non-zero and the result is
    /// within the per-mint bounds; refused with 6013 / 6033 otherwise.
    pub fn flow_update_course(&mut self) -> FuzzResult<()> {
        let Some(course) = self.course() else {
            self.sequence
                .push("update_course -> skipped (no course)".into());
            return Ok(());
        };
        let mask: [u64; 4] = match self.rng.gen_range(0..10u8) {
            0 => [0; 4],
            1..=6 => [self.rng.gen_range(1..=0xFFu64), 0, 0, 0],
            _ => course.active_lessons,
        };
        let new_mask = (mask != course.active_lessons).then_some(mask);
        let new_xp = self
            .rng
            .gen_bool(0.5)
            .then(|| self.rng.gen_range(0..=6_000u32));
        let new_reward = self
            .rng
            .gen_bool(0.3)
            .then(|| self.rng.gen_range(0..=6_000u32));

        let xp = new_xp.unwrap_or(course.xp_per_lesson);
        let reward = new_reward.unwrap_or(course.creator_reward_xp);
        let live: u32 = mask.iter().map(|w| w.count_ones()).sum();
        let touches_xp = new_xp.is_some() || new_reward.is_some() || new_mask.is_some();
        let expected_code = if new_mask == Some([0; 4]) {
            Some(ERR_INVALID_LESSON_COUNT)
        } else if touches_xp && !xp_in_bounds(xp, reward, live) {
            Some(ERR_XP_AMOUNT_EXCEEDS_MAX)
        } else {
            None
        };

        let authority = self.authority.pubkey();
        let ix = ixs::update_course(
            &authority, COURSE_ID, None, None, new_xp, new_reward, None, new_mask,
        );
        let label =
            format!("update_course(mask={new_mask:?}, xp={new_xp:?}, reward={new_reward:?})");
        let out = self.send_checked(&label, &[ix], &[])?;
        let code = out.err.as_ref().and_then(custom_code);
        if code != expected_code {
            return Err(Crash {
                kind: "invariant violated",
                detail: format!("{label}: expected {expected_code:?}, got {code:?}"),
                logs: out.logs,
            });
        }
        if out.ok {
            self.stats.course_updates += 1;
        } else {
            self.stats.course_update_rejections += 1;
        }
        Ok(())
    }

    /// Send one instruction with a single hostile account substituted, and
    /// require the program to reject it.
    ///
    /// The assertion is the point: any `Custom` code counts (which check fires
    /// depends on the order the handler validates in, and on whatever state the
    /// preceding flows left behind), but *acceptance* is an invariant failure —
    /// the program acted on an account it had no business accepting.
    pub fn flow_hostile_account(&mut self) -> FuzzResult<()> {
        let Some((idx, learner)) = self.pick_learner() else {
            self.sequence
                .push("hostile -> skipped (no learners)".into());
            return Ok(());
        };
        // Draw unconditionally so the RNG stream does not depend on how many
        // learners happen to be alive — the sequence must stay seed-derived.
        let draw = self.rng.gen_range(0..5u8);
        let other = self.pick_other_learner(idx);
        let swap = match draw {
            0 if other.is_some() => AccountSwap::ForeignEnrollment,
            1 => AccountSwap::CreatorTokenAccount,
            2 => AccountSwap::UnknownCourse,
            3 => AccountSwap::WrongRentRecipient,
            _ if other.is_some() => AccountSwap::ForeignEnrollmentOnClose,
            // Only one learner alive: fall back to a swap that needs no second.
            _ => AccountSwap::CreatorTokenAccount,
        };

        let mint = self.xp_mint;
        let backend = self.authority.pubkey();
        let authority = self.authority.pubkey();
        let mut signer: Option<Keypair> = None;
        let ix = match swap {
            AccountSwap::ForeignEnrollment => {
                let mut ix = ixs::complete_lesson(COURSE_ID, &learner, &mint, &backend, 0);
                // 2 = enrollment.
                ix.accounts[2].pubkey = ixs::enrollment_pda(COURSE_ID, &other.expect("other"));
                ix
            }
            AccountSwap::CreatorTokenAccount => ixs::complete_lesson_with_ata(
                COURSE_ID,
                &learner,
                &ixs::ata(&authority, &mint),
                &mint,
                &backend,
                0,
            ),
            AccountSwap::UnknownCourse => {
                let mut ix = ixs::complete_lesson(COURSE_ID, &learner, &mint, &backend, 0);
                // 1 = course.
                ix.accounts[1].pubkey = ixs::course_pda(FOREIGN_COURSE_ID);
                ix
            }
            AccountSwap::ForeignEnrollmentOnClose => {
                let mut ix = ixs::close_enrollment_to(COURSE_ID, &learner, &self.payers[idx]);
                // 1 = enrollment; account 2 (the signer) stays this learner.
                ix.accounts[1].pubkey = ixs::enrollment_pda(COURSE_ID, &other.expect("other"));
                signer = Some(self.learners[idx].insecure_clone());
                ix
            }
            AccountSwap::WrongRentRecipient => {
                // Whoever did not pay: the learner if sponsored, else the sponsor.
                let wrong = if self.payers[idx] == learner {
                    self.sponsor.pubkey()
                } else {
                    learner
                };
                signer = Some(self.learners[idx].insecure_clone());
                ixs::close_enrollment_to(COURSE_ID, &learner, &wrong)
            }
        };

        let label = format!("hostile({swap:?}, learner#{idx})");
        let signers: Vec<&Keypair> = signer.iter().collect();
        let out = self.send_checked(&label, &[ix], &signers)?;
        match out.err.as_ref().and_then(custom_code) {
            Some(code) => {
                *self.stats.hostile_rejections.entry(code).or_default() += 1;
                Ok(())
            }
            // `send_checked` already turned a non-`Custom` error into a finding,
            // so the only way here is a transaction that succeeded.
            None => Err(Crash {
                kind: "invariant violated",
                detail: format!("{label} was ACCEPTED — the program acted on a swapped account"),
                logs: out.logs,
            }),
        }
    }

    /// One random flow, as the Trident flow executor did.
    ///
    /// Weighted so the three original flows keep the coverage they had: the
    /// recreate flow tears the course down, so it stays rare.
    pub fn step(&mut self) -> FuzzResult<()> {
        self.warp_clock();
        match self.rng.gen_range(0..64u8) {
            0..=14 => self.flow_enroll(),
            15..=29 => self.flow_complete_lesson(),
            30..=43 => self.flow_finalize(),
            44..=51 => self.flow_close_enrollment(),
            52..=54 => self.flow_update_course(),
            55..=57 => self.flow_reenroll(),
            // 1 flow in 16: one hostile account substitution.
            58..=61 => self.flow_hostile_account(),
            _ => self.flow_recreate_course(),
        }
    }

    /// Advance the VM clock by a seeded delta before each flow.
    ///
    /// litesvm starts at `unix_timestamp = 0` and nothing moved it, so every
    /// time-dependent branch in the program was unreachable. Most hops stay
    /// inside the 24h unenroll cooldown (the 6008 rejection path); one in four
    /// clears it (the success path).
    fn warp_clock(&mut self) {
        const UNENROLL_COOLDOWN_SECS: i64 = 86_400;
        let delta = if self.rng.gen_bool(0.25) {
            self.rng
                .gen_range(UNENROLL_COOLDOWN_SECS + 1..=UNENROLL_COOLDOWN_SECS * 3)
        } else {
            self.rng.gen_range(1..=3_600)
        };
        self.h.warp(delta);
        self.sequence.push(format!("warp(+{delta}s)"));
    }

    /// A learner other than `skip`, for the swaps that need a second party.
    fn pick_other_learner(&mut self, skip: usize) -> Option<Pubkey> {
        if self.learners.len() < 2 {
            return None;
        }
        let mut idx = self.rng.gen_range(0..self.learners.len() - 1);
        if idx >= skip {
            idx += 1;
        }
        Some(self.learners[idx].pubkey())
    }

    fn pick_learner(&mut self) -> Option<(usize, Pubkey)> {
        if self.learners.is_empty() {
            return None;
        }
        let idx = self.rng.gen_range(0..self.learners.len());
        Some((idx, self.learners[idx].pubkey()))
    }

    /// Both accounts are allocated at a fixed max size, so the borsh body is
    /// followed by padding — `deserialize` (not `try_from_slice`) is what reads
    /// them.
    fn decode<T: BorshDeserialize>(&self, address: &Pubkey) -> Option<T> {
        let account = self.h.svm.get_account(address)?;
        let mut body = account.data.get(8..)?;
        T::deserialize(&mut body).ok()
    }

    fn enrollment(&self, learner: &Pubkey) -> Option<EnrollmentAccount> {
        self.decode(&ixs::enrollment_pda(COURSE_ID, learner))
    }

    /// The rent payer recorded in a 159-byte Enrollment (bytes 127..159).
    fn stored_payer(&self, learner: &Pubkey) -> Option<Pubkey> {
        let account = self
            .h
            .svm
            .get_account(&ixs::enrollment_pda(COURSE_ID, learner))?;
        let bytes: [u8; 32] = account
            .data
            .get(PAYER_OFFSET..PAYER_OFFSET + 32)?
            .try_into()
            .ok()?;
        (account.data.len() == PAYER_OFFSET + 32).then(|| Pubkey::new_from_array(bytes))
    }

    fn course(&self) -> Option<CourseAccount> {
        self.decode(&ixs::course_pda(COURSE_ID))
    }
}

/// Deterministic keypair from the session RNG — `Keypair::new()` would read the
/// OS RNG and break replay.
fn keypair_from(rng: &mut StdRng) -> Keypair {
    let mut secret = [0u8; 32];
    rng.fill(&mut secret);
    Keypair::new_from_array(secret)
}

/// Executes exactly one `initialize` and reports whether the program ran.
///
/// This is the check the Trident harness never had: it silently swallowed a
/// failed init and kept "fuzzing", so a `.so` the VM could not execute at all
/// still reported a million iterations.
pub fn preflight(seed: u64) -> Result<(), String> {
    let mut session = Session::new(seed);
    match session.initialize() {
        Ok(out) if out.ok => Ok(()),
        Ok(out) => Err(format!(
            "initialize failed: {:?}\nprogram logs:\n{}",
            out.err,
            out.logs.join("\n")
        )),
        Err(crash) => Err(format!(
            "{}: {}\nprogram logs:\n{}",
            crash.kind,
            crash.detail,
            crash.logs.join("\n")
        )),
    }
}

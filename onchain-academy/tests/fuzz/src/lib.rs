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
        Self {
            h: Harness::new(),
            rng,
            sequence: Vec::new(),
            authority,
            xp_mint: Pubkey::default(),
            stats: Stats::default(),
            learners: Vec::new(),
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

    /// Platform + one course with fuzzed economics + the creator's XP ATA.
    /// Returns false if `create_course` was rejected, in which case the flows
    /// have nothing to work with this iteration.
    pub fn init_iteration(&mut self) -> FuzzResult<bool> {
        if !self.initialize()?.ok {
            return Ok(false);
        }
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
        // Half the draws stay under the mint caps (finalize's completion bonus
        // is xp_per_lesson * lessons / 2, capped at MAX_XP_PER_MINT = 5000) so
        // the finalize invariant is actually reached; the other half runs over
        // them, which is the XpAmountExceedsMax rejection path.
        let capped = self.rng.gen_bool(0.5);
        let xp_per_lesson: u32 = if capped {
            self.rng.gen_range(0..=10_000 / lesson_count as u32)
        } else {
            self.rng.gen_range(0..=5_000)
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
        let created = self
            .send_checked(
                &format!(
                    "{label}(lessons={lesson_count}, difficulty={difficulty}, \
                     xp_per_lesson={xp_per_lesson}, creator_reward_xp={creator_reward_xp})"
                ),
                &[ixs::create_course(&authority, &params)],
                &[],
            )?
            .ok;
        self.course_live = created;
        Ok(created)
    }

    /// Enroll a brand-new learner, then provision its XP ATA.
    pub fn flow_enroll(&mut self) -> FuzzResult<()> {
        let learner = keypair_from(&mut self.rng);
        self.h.airdrop(&learner.pubkey(), 50 * SOL);
        let idx = self.learners.len();

        let ix = ixs::enroll(&learner.pubkey(), COURSE_ID, None);
        let out = self.send_checked(&format!("enroll(learner#{idx})"), &[ix], &[&learner])?;
        if out.ok {
            self.stats.enrollments += 1;
            let mint = self.xp_mint;
            let authority = self.authority.pubkey();
            let ata = ixs::create_ata_idempotent(&authority, &learner.pubkey(), &mint);
            self.send_checked(&format!("create_ata(learner#{idx})"), &[ata], &[])?;
            self.learners.push(learner);
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
        let lesson_count: u32 = course.active_lessons.iter().map(|w| w.count_ones()).sum();

        let mint = self.xp_mint;
        let backend = self.authority.pubkey();

        // Mark all lessons (already-complete / not-enrolled are valid rejections;
        // we just want to reach a finalizable state).
        for lesson in 0..(lesson_count as u8) {
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
            let completed: u32 = enr.lesson_flags.iter().map(|w| w.count_ones()).sum();
            if completed != lesson_count {
                return Err(Crash {
                    kind: "invariant violated",
                    detail: format!(
                        "finalize succeeded with {completed} lessons completed, \
                         expected {lesson_count}"
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
        let ix = ixs::close_enrollment(COURSE_ID, &learner);
        let out = self.send_checked(
            &format!("close_enrollment(learner#{idx})"),
            &[ix],
            &[&signer],
        )?;
        if !out.ok {
            return Ok(());
        }
        self.stats.unenrollments += 1;
        // The learner no longer has an enrollment; drop it so later flows keep
        // working against live ones.
        self.learners.swap_remove(idx);

        let pda = ixs::enrollment_pda(COURSE_ID, &learner);
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
    /// next `Config.course_generation`. Every enrollment made before the
    /// recreate is now superseded — the only way to reach `StaleEnrollment`
    /// (6034) from `complete_lesson` / `finalize_course`.
    pub fn flow_recreate_course(&mut self) -> FuzzResult<()> {
        let authority = self.authority.pubkey();
        let closed = self
            .send_checked(
                "close_course",
                &[ixs::close_course(&authority, COURSE_ID)],
                &[],
            )?
            .ok;
        // Always recreate, even if the close was rejected, so the course PDA is
        // never left freed for the following flows.
        let recreated = self.create_fuzzed_course("recreate_course")?;
        if closed && recreated {
            self.stats.course_recreations += 1;
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
        let draw = self.rng.gen_range(0..4u8);
        let other = self.pick_other_learner(idx);
        let swap = match draw {
            0 if other.is_some() => AccountSwap::ForeignEnrollment,
            1 => AccountSwap::CreatorTokenAccount,
            2 => AccountSwap::UnknownCourse,
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
                let mut ix = ixs::close_enrollment(COURSE_ID, &learner);
                // 1 = enrollment; account 2 (the signer) stays this learner.
                ix.accounts[1].pubkey = ixs::enrollment_pda(COURSE_ID, &other.expect("other"));
                signer = Some(self.learners[idx].insecure_clone());
                ix
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
            0..=16 => self.flow_enroll(),
            17..=33 => self.flow_complete_lesson(),
            34..=49 => self.flow_finalize(),
            50..=58 => self.flow_close_enrollment(),
            // 1 flow in 16: one hostile account substitution.
            59..=62 => self.flow_hostile_account(),
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

//! Seeded fuzz harness for the `onchain_academy` program on litesvm.
//!
//! Ported from the Trident harness (`onchain-academy/trident-tests`, removed in
//! 09-2026) with the same coverage: one iteration initializes the platform and
//! creates a course with fuzzed economics, then runs a random sequence of
//! `enroll` / `complete_lesson` / `finalize_course` flows and checks the same
//! two invariants.
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

/// Program errors that are *findings*, not valid rejections.
///
/// A fuzzed instruction is expected to be refused all the time — a `Custom(n)`
/// error is the program working. These variants instead mean the program
/// aborted, ran away with compute, or could not be executed at all. The last
/// one is what seven weeks of red Trident nightlies actually were.
fn is_unexpected(err: &TransactionError) -> bool {
    matches!(
        err,
        TransactionError::InstructionError(
            _,
            InstructionError::ProgramFailedToComplete
                | InstructionError::ComputationalBudgetExceeded
                | InstructionError::ProgramEnvironmentSetupFailure
                | InstructionError::UnsupportedProgramId
                | InstructionError::InvalidError
        )
    )
}

/// Success counters per flow. Printed by the driver at the end of a run: a run
/// that "completed" with zeros is not coverage, it is the failure mode this
/// port exists to make visible.
#[derive(Default, Debug, Clone, Copy)]
pub struct Stats {
    pub transactions: u64,
    pub enrollments: u64,
    pub lessons_completed: u64,
    pub finalizations: u64,
}

impl Stats {
    pub fn merge(&mut self, other: Stats) {
        self.transactions += other.transactions;
        self.enrollments += other.enrollments;
        self.lessons_completed += other.lessons_completed;
        self.finalizations += other.finalizations;
    }
}

pub struct Outcome {
    pub ok: bool,
    pub logs: Vec<String>,
    pub err: Option<TransactionError>,
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
                    "create_course(lessons={lesson_count}, difficulty={difficulty}, \
                     xp_per_lesson={xp_per_lesson}, creator_reward_xp={creator_reward_xp})"
                ),
                &[ixs::create_course(&authority, &params)],
                &[],
            )?
            .ok;

        // creator (== authority) ATA, target of finalize creator-reward mints.
        let mint = self.xp_mint;
        let ata = ixs::create_ata_idempotent(&authority, &authority, &mint);
        self.send_checked("create_ata(creator)", &[ata], &[])?;
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
            return Err(Crash {
                kind: "harness",
                detail: "Course account could not be decoded — layout drift?".into(),
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

    /// One random flow, as the Trident flow executor did.
    pub fn step(&mut self) -> FuzzResult<()> {
        match self.rng.gen_range(0..3u8) {
            0 => self.flow_enroll(),
            1 => self.flow_complete_lesson(),
            _ => self.flow_finalize(),
        }
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

//! Trident fuzz target for the `onchain_academy` program.
//!
//! Exercises the REAL compiled program (`../target/deploy/onchain_academy.so`,
//! loaded via `Trident.toml`) against Trident's in-process SVM, which ships
//! Token-2022 and the Associated-Token program built in — so the XP-mint CPI in
//! `complete_lesson` / `finalize_course` runs for real.
//!
//! Flow (one iteration):
//!   #[init]  initialize  -> Config PDA + Token-2022 XP mint + backend MinterRole
//!            create_course -> one Course PDA with fuzzed economics
//!   #[flow]  enroll          -> a fresh learner + its XP ATA
//!   #[flow]  complete_lesson -> mints xp_per_lesson to a learner (Token-2022 CPI)
//!   #[flow]  finalize_course -> completes all lessons, then mints bonus + creator
//!                               reward, asserting on-chain accounting invariants
//!
//! Trident runs each iteration under `catch_unwind`; a failed `assert!` (a broken
//! invariant) or a program panic is a crash. With `TRIDENT_WITH_EXIT_CODE=1` the
//! process exits 99 on any crash (used by CI to fail the job).

use fuzz_accounts::*;
use trident_fuzz::fuzzing::*;
mod fuzz_accounts;
mod types;
use types::*;

/// Fixed course id so the Course / Enrollment PDAs are reproducible across flows.
const COURSE_ID: &[u8] = b"fuzz-course";
/// Associated-Token program id (built into trident-svm) — used to derive ATAs.
const ATA_PROGRAM_ID: Pubkey = pubkey!("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

#[derive(FuzzTestMethods)]
struct FuzzTest {
    trident: Trident,
    fuzz_accounts: AccountAddresses,
}

impl FuzzTest {
    /// Standard ATA address for `owner` holding `mint` under Token-2022.
    fn derive_ata(&self, owner: &Pubkey, mint: &Pubkey) -> Pubkey {
        self.trident
            .find_program_address(
                &[owner.as_ref(), TOKEN_2022_PROGRAM_ID.as_ref(), mint.as_ref()],
                &ATA_PROGRAM_ID,
            )
            .0
    }

    /// Enrollment PDA for `learner` on the fixed course.
    fn derive_enrollment(&self, learner: &Pubkey) -> Pubkey {
        self.trident
            .find_program_address(
                &[b"enrollment", COURSE_ID, learner.as_ref()],
                &program_id(),
            )
            .0
    }

    /// Creates a learner's Token-2022 ATA for the XP mint (idempotent-safe: only
    /// called once per newly-inserted learner in `flow_enroll`).
    fn create_learner_ata(&mut self, owner: &Pubkey, payer: &Pubkey, mint: &Pubkey) -> Pubkey {
        let ixs = self
            .trident
            .initialize_associated_token_account_2022(payer, mint, owner, &[]);
        let _ = self.trident.process_transaction(&ixs, Some("create_ata"));
        self.derive_ata(owner, mint)
    }
}

#[flow_executor]
impl FuzzTest {
    fn new() -> Self {
        Self {
            trident: Trident::default(),
            fuzz_accounts: AccountAddresses::default(),
        }
    }

    /// Establish the real on-chain preconditions: a Config + XP mint and one
    /// Course. Runs at the start of every iteration.
    #[init]
    fn start(&mut self) {
        let authority = self.fuzz_accounts.authority.insert(&mut self.trident, None);
        self.trident.airdrop(&authority, 100 * LAMPORTS_PER_SOL);

        // xp_mint is a fresh keypair address; `initialize` creates the account.
        let xp_mint = self.fuzz_accounts.xp_mint.insert(&mut self.trident, None);

        let config = self.fuzz_accounts.config.insert(
            &mut self.trident,
            Some(PdaSeeds::new(&[b"config"], program_id())),
        );
        let backend_minter_role = self.fuzz_accounts.backend_minter_role.insert(
            &mut self.trident,
            Some(PdaSeeds::new(&[b"minter", authority.as_ref()], program_id())),
        );

        let init_res = self.trident.process_transaction(
            &[initialize_ix(&InitializeAccounts {
                config,
                xp_mint,
                authority,
                backend_minter_role,
            })],
            Some("initialize"),
        );
        // If init fails the rest of the iteration is a no-op; bail early.
        if !init_res.is_success() {
            return;
        }

        // Fuzzed but bounded course economics. Difficulty must be 1..=3 and
        // lesson_count >= 1 or create_course rejects it (those rejections are
        // valid program behavior, but we want a usable course most iterations).
        let lesson_count: u8 = self.trident.random_from_range(1..=8u8);
        let difficulty: u8 = self.trident.random_from_range(1..=3u8);
        let xp_per_lesson: u32 = self.trident.random_from_range(0..=5_000u32);
        let creator_reward_xp: u32 = self.trident.random_from_range(0..=10_000u32);

        let course = self.fuzz_accounts.course.insert(
            &mut self.trident,
            Some(PdaSeeds::new(&[b"course", COURSE_ID], program_id())),
        );

        let mut content_tx_id = [0u8; 32];
        self.trident.random_bytes(&mut content_tx_id);

        let params = CreateCourseParams {
            course_id: String::from_utf8_lossy(COURSE_ID).into_owned(),
            creator: authority,
            content_tx_id,
            lesson_count,
            difficulty,
            xp_per_lesson,
            track_id: self.trident.random_from_range(0..=u16::MAX),
            track_level: self.trident.random_from_range(0..=u8::MAX),
            prerequisite: None,
            creator_reward_xp,
            collection: None,
        };

        let _ = self.trident.process_transaction(
            &[create_course_ix(
                &CreateCourseAccounts {
                    course,
                    config,
                    authority,
                },
                &params,
            )],
            Some("create_course"),
        );

        // creator (== authority) ATA, target of finalize creator-reward mints.
        let creator_ata = self.create_learner_ata(&authority, &authority, &xp_mint);
        self.fuzz_accounts.creator_ata.insert_with_address(creator_ata);
    }

    /// Enroll a brand-new learner, then provision its XP ATA.
    #[flow]
    fn flow_enroll(&mut self) {
        let course = match self.fuzz_accounts.course.get(&mut self.trident) {
            Some(c) => c,
            None => return,
        };
        let xp_mint = match self.fuzz_accounts.xp_mint.get(&mut self.trident) {
            Some(m) => m,
            None => return,
        };

        let learner = self.fuzz_accounts.learners.insert(&mut self.trident, None);
        self.trident.airdrop(&learner, 10 * LAMPORTS_PER_SOL);

        let enrollment = self.derive_enrollment(&learner);
        self.fuzz_accounts.enrollment.insert_with_address(enrollment);

        let res = self.trident.process_transaction(
            &[enroll_ix(
                &EnrollAccounts {
                    course,
                    enrollment,
                    learner,
                },
                &String::from_utf8_lossy(COURSE_ID),
            )],
            Some("enroll"),
        );

        if res.is_success() {
            let ata = self.create_learner_ata(&learner, &learner, &xp_mint);
            self.fuzz_accounts.learner_ata.insert_with_address(ata);
        }
    }

    /// Complete a random lesson index for a random enrolled learner. Drives the
    /// Token-2022 `mint_to` CPI in `complete_lesson`.
    #[flow]
    fn flow_complete_lesson(&mut self) {
        let learner = match self.fuzz_accounts.learners.get(&mut self.trident) {
            Some(l) => l,
            None => return,
        };
        let (config, course, xp_mint, backend_signer) = match self.platform() {
            Some(p) => p,
            None => return,
        };

        let enrollment = self.derive_enrollment(&learner);
        let learner_token_account = self.derive_ata(&learner, &xp_mint);
        let lesson_index: u8 = self.trident.random_from_range(0..=12u8);

        let res = self.trident.process_transaction(
            &[complete_lesson_ix(
                &CompleteLessonAccounts {
                    config,
                    course,
                    enrollment,
                    learner,
                    learner_token_account,
                    xp_mint,
                    backend_signer,
                },
                lesson_index,
            )],
            Some("complete_lesson"),
        );

        // Invariant: on success the lesson bit is set and within bounds.
        if res.is_success() {
            if let Some(enr) = self
                .trident
                .get_account_with_type::<EnrollmentAccount>(&enrollment, 8)
            {
                let word = (lesson_index / 64) as usize;
                let bit = 1u64 << (lesson_index % 64);
                assert!(
                    enr.lesson_flags[word] & bit != 0,
                    "complete_lesson succeeded but lesson {} bit is unset",
                    lesson_index
                );
            }
        }
    }

    /// Drive the full completion path for a random learner: mark every lesson,
    /// then `finalize_course` (mints the completion bonus + creator reward).
    #[flow]
    fn flow_finalize(&mut self) {
        let learner = match self.fuzz_accounts.learners.get(&mut self.trident) {
            Some(l) => l,
            None => return,
        };
        let (config, course, xp_mint, backend_signer) = match self.platform() {
            Some(p) => p,
            None => return,
        };
        let authority = match self.fuzz_accounts.authority.get(&mut self.trident) {
            Some(a) => a,
            None => return,
        };
        let creator_ata = match self.fuzz_accounts.creator_ata.get(&mut self.trident) {
            Some(a) => a,
            None => return,
        };

        let enrollment = self.derive_enrollment(&learner);
        let learner_token_account = self.derive_ata(&learner, &xp_mint);

        // How many lessons does this course actually have? CS-3/WS-1: the account
        // no longer stores a raw lesson_count — derive it as the popcount of the
        // active_lessons mask. `start` never retires a slot, so the course stays
        // dense and this popcount equals the fuzzed lesson_count used at creation.
        let lesson_count: u32 = match self
            .trident
            .get_account_with_type::<CourseAccount>(&course, 8)
        {
            Some(c) => c.active_lessons.iter().map(|w| w.count_ones()).sum(),
            None => return,
        };

        // Mark all lessons (ignore per-call results: already-complete / not-enrolled
        // are valid rejections; we just want to reach a finalizable state).
        for idx in 0..(lesson_count as u8) {
            let _ = self.trident.process_transaction(
                &[complete_lesson_ix(
                    &CompleteLessonAccounts {
                        config,
                        course,
                        enrollment,
                        learner,
                        learner_token_account,
                        xp_mint,
                        backend_signer,
                    },
                    idx,
                )],
                Some("complete_lesson"),
            );
        }

        let res = self.trident.process_transaction(
            &[finalize_course_ix(&FinalizeCourseAccounts {
                config,
                course,
                enrollment,
                learner,
                learner_token_account,
                creator_token_account: creator_ata,
                creator: authority,
                xp_mint,
                backend_signer,
            })],
            Some("finalize_course"),
        );

        // Invariant: a successful finalize must have stamped completed_at and the
        // whole bitmap must equal the course's lesson_count.
        if res.is_success() {
            if let Some(enr) = self
                .trident
                .get_account_with_type::<EnrollmentAccount>(&enrollment, 8)
            {
                assert!(
                    enr.completed_at.is_some(),
                    "finalize succeeded but completed_at is None"
                );
                let completed: u32 = enr.lesson_flags.iter().map(|w| w.count_ones()).sum();
                assert_eq!(
                    completed, lesson_count,
                    "finalize succeeded with {} lessons completed, expected {}",
                    completed, lesson_count
                );
            }
        }
    }

    #[end]
    fn end(&mut self) {}
}

impl FuzzTest {
    /// (config, course, xp_mint, backend_signer) if the platform is initialized.
    fn platform(&mut self) -> Option<(Pubkey, Pubkey, Pubkey, Pubkey)> {
        let config = self.fuzz_accounts.config.get(&mut self.trident)?;
        let course = self.fuzz_accounts.course.get(&mut self.trident)?;
        let xp_mint = self.fuzz_accounts.xp_mint.get(&mut self.trident)?;
        // backend_signer == authority (set by initialize).
        let backend_signer = self.fuzz_accounts.authority.get(&mut self.trident)?;
        Some((config, course, xp_mint, backend_signer))
    }
}

fn main() {
    // (iterations, flow_calls_per_iteration). Defaults are a quick local smoke
    // size; CI passes a large iteration count as argv[1] and bounds the real
    // runtime with a `timeout` wrapper so the job fuzzes for 10+ minutes.
    //   cargo run --release --bin fuzz_0 -- <iterations> [flows_per_iteration]
    let mut args = std::env::args().skip(1);
    let iterations: u64 = args
        .next()
        .and_then(|a| a.parse().ok())
        .unwrap_or(1_000);
    let flows_per_iteration: u64 = args
        .next()
        .and_then(|a| a.parse().ok())
        .unwrap_or(30);
    FuzzTest::fuzz(iterations, flows_per_iteration);
}

//! Shared scenario context: a platform initialized on both VMs, plus the
//! common preludes (courses, learners, ATAs, collections, second mints).

use solana_sdk::instruction::{AccountMeta, Instruction};
use solana_sdk::pubkey::Pubkey;
use solana_sdk::signature::Keypair;
use solana_sdk::signer::Signer;

use crate::harness::DiffHarness;
use crate::ixs::{self, CourseParams};

pub const SOL: u64 = 1_000_000_000;

pub struct Ctx {
    pub h: DiffHarness,
    /// Platform authority — also the initial backend signer and backend minter.
    pub authority: Keypair,
    pub xp_mint: Pubkey,
}

#[allow(clippy::new_without_default)] // side-effectful constructor, Default would mislead
impl Ctx {
    /// Fresh platform: airdropped authority + `initialize` executed on both VMs.
    pub fn new() -> Self {
        let mut h = DiffHarness::new();
        let authority = Keypair::new();
        h.airdrop(&authority.pubkey(), 500 * SOL);

        let xp_mint_kp = Keypair::new();
        h.run_ok(
            "initialize",
            &[ixs::initialize(&xp_mint_kp.pubkey(), &authority.pubkey())],
            &authority,
            &[&xp_mint_kp],
        );

        let mut ctx = Self {
            h,
            authority,
            xp_mint: xp_mint_kp.pubkey(),
        };
        // finalize_course validates BOTH token accounts even when no creator
        // reward is due, so the authority (default course creator in these
        // scenarios) needs an XP ATA too.
        ctx.create_xp_ata(&ctx.authority.pubkey().clone());
        ctx
    }

    pub fn backend(&self) -> Pubkey {
        self.authority.pubkey()
    }

    pub fn create_course(&mut self, p: &CourseParams) {
        let ix = ixs::create_course(&self.authority.pubkey(), p);
        self.h.run_ok(
            &format!("create_course {}", p.course_id),
            &[ix],
            &self.authority,
            &[],
        );
    }

    /// New funded learner with an XP ATA on both VMs.
    pub fn new_learner(&mut self) -> Keypair {
        let learner = Keypair::new();
        self.h.airdrop(&learner.pubkey(), 50 * SOL);
        self.create_xp_ata(&learner.pubkey());
        learner
    }

    pub fn create_xp_ata(&mut self, owner: &Pubkey) {
        let payer = self.authority.insecure_clone();
        let ix = ixs::create_ata_idempotent(&payer.pubkey(), owner, &self.xp_mint);
        self.h.run_ok("create_ata", &[ix], &payer, &[]);
    }

    pub fn enroll(&mut self, learner: &Keypair, course_id: &str) {
        let ix = ixs::enroll(&learner.pubkey(), course_id, None);
        self.h
            .run_ok(&format!("enroll {course_id}"), &[ix], learner, &[]);
    }

    pub fn complete_lessons(&mut self, learner: &Keypair, course_id: &str, count: u8) {
        let backend = self.authority.insecure_clone();
        for i in 0..count {
            let ix = ixs::complete_lesson(
                course_id,
                &learner.pubkey(),
                &self.xp_mint,
                &backend.pubkey(),
                i,
            );
            self.h.run_ok(
                &format!("complete_lesson {course_id}#{i}"),
                &[ix],
                &backend,
                &[],
            );
        }
    }

    pub fn finalize(&mut self, learner: &Keypair, course_id: &str, creator: &Pubkey) {
        let backend = self.authority.insecure_clone();
        let ix = ixs::finalize_course(
            course_id,
            &learner.pubkey(),
            creator,
            &self.xp_mint,
            &backend.pubkey(),
        );
        self.h
            .run_ok(&format!("finalize {course_id}"), &[ix], &backend, &[]);
    }

    /// Bootstraps an mpl-core collection whose update authority is the Config
    /// PDA (the production client does the same before create_course).
    pub fn bootstrap_collection(&mut self) -> Pubkey {
        let collection = Keypair::new();
        let ix = ixs::mpl_create_collection(
            &collection.pubkey(),
            &self.authority.pubkey(),
            "Track Collection",
            "https://arweave.net/track",
        );
        self.h.run_ok(
            "bootstrap_collection",
            &[ix],
            &self.authority,
            &[&collection],
        );
        collection.pubkey()
    }

    /// XP balance from the learner's ATA (token amount at offset 64..72).
    pub fn xp_balance(&self, owner: &Pubkey) -> u64 {
        let account = self
            .h
            .svm
            .get_account(&ixs::ata(owner, &self.xp_mint))
            .expect("ATA exists");
        u64::from_le_bytes(account.data[64..72].try_into().unwrap())
    }

    /// Creates a base Token-2022 mint UNRELATED to the platform's XP mint,
    /// plus an ATA of it for `owner` — the hostile-account fixture.
    pub fn create_foreign_mint_ata(&mut self, owner: &Pubkey) -> (Pubkey, Pubkey) {
        let mint = Keypair::new();
        let payer = self.authority.insecure_clone();

        // Base Token-2022 mint: 82 bytes, no extensions.
        let rent = 2_000_000u64; // comfortably rent-exempt for 82 bytes
        let create = ixs::system_create_account(
            &payer.pubkey(),
            &mint.pubkey(),
            rent,
            82,
            &ixs::token_2022_id(),
        );
        let mut init_data = vec![20u8, 0u8]; // InitializeMint2, decimals 0
        init_data.extend_from_slice(payer.pubkey().as_ref());
        init_data.push(0); // freeze_authority: None
        let init = Instruction {
            program_id: ixs::token_2022_id(),
            accounts: vec![AccountMeta::new(mint.pubkey(), false)],
            data: init_data,
        };
        self.h
            .run_ok("create_foreign_mint", &[create, init], &payer, &[&mint]);

        let ata_ix = ixs::create_ata_idempotent(&payer.pubkey(), owner, &mint.pubkey());
        self.h.run_ok("create_foreign_ata", &[ata_ix], &payer, &[]);

        (mint.pubkey(), ixs::ata(owner, &mint.pubkey()))
    }
}

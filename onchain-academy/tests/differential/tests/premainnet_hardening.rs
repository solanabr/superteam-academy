//! Pre-mainnet program hardening, end to end in LiteSVM:
//!
//! * `close_enrollment` refunds the rent to whoever paid it (the payer recorded
//!   at enroll), and legacy 127-byte enrollments still refund the learner;
//! * only the program's upgrade authority can `initialize`;
//! * `create_course` / `update_course` refuse an all-zero lesson mask and XP
//!   values a single mint could not carry;
//! * `close_course` refuses a course anyone ever enrolled in.
//!
//! These are intentional differences from the retired Anchor build, which had
//! none of these checks.

use onchain_academy_differential::ixs::{self, CourseParams};
use onchain_academy_differential::scenario::{Ctx, SOL};
use solana_sdk::account::Account;
use solana_sdk::pubkey::Pubkey;
use solana_sdk::signature::Keypair;
use solana_sdk::signer::Signer;

const UNAUTHORIZED: u32 = 6000;
const INVALID_LESSON_COUNT: u32 = 6013;
const XP_AMOUNT_EXCEEDS_MAX: u32 = 6033;
const ENROLLMENT_IN_PROGRESS: u32 = 6036;
const COURSE_HAS_ENROLLMENTS: u32 = 6037;
const CONSTRAINT_MUT: u32 = 2000;
const CONSTRAINT_SEEDS: u32 = 2006;
const CONSTRAINT_ADDRESS: u32 = 2012;
const ACCOUNT_DID_NOT_DESERIALIZE: u32 = 3003;
const ACCOUNT_OWNED_BY_WRONG_PROGRAM: u32 = 3007;

const ENROLLMENT_SIZE: usize = 159;
const LEGACY_ENROLLMENT_SIZE: usize = 127;
const COOLDOWN: i64 = 86_401;

fn enrollment_account(ctx: &Ctx, course_id: &str, learner: &Pubkey) -> Account {
    ctx.h
        .svm
        .get_account(&ixs::enrollment_pda(course_id, learner))
        .expect("enrollment exists")
}

fn is_closed(ctx: &Ctx, course_id: &str, learner: &Pubkey) -> bool {
    ctx.h
        .svm
        .get_account(&ixs::enrollment_pda(course_id, learner))
        .map(|a| a.data.is_empty() && a.lamports == 0)
        .unwrap_or(true)
}

/// Rewrites an enrollment as a legacy 127-byte account (no payer recorded),
/// funded at the 127-byte rent minimum: what every enrollment created before
/// this change looks like on chain.
fn make_legacy(ctx: &mut Ctx, course_id: &str, learner: &Pubkey) -> u64 {
    let address = ixs::enrollment_pda(course_id, learner);
    let mut account = enrollment_account(ctx, course_id, learner);
    account.data.truncate(LEGACY_ENROLLMENT_SIZE);
    account.lamports = ctx
        .h
        .svm
        .minimum_balance_for_rent_exemption(LEGACY_ENROLLMENT_SIZE);
    let lamports = account.lamports;
    ctx.h.set_account(address, account);
    lamports
}

// ---- rent refund to the payer ----------------------------------------------

#[test]
fn self_paid_enrollment_records_the_learner_and_refunds_it() {
    let mut ctx = Ctx::new();
    let authority = ctx.authority.insecure_clone();
    ctx.create_course(&CourseParams::simple("self", authority.pubkey(), 2));
    let learner = ctx.new_learner();
    ctx.enroll(&learner, "self");

    let acct = enrollment_account(&ctx, "self", &learner.pubkey());
    assert_eq!(acct.data.len(), ENROLLMENT_SIZE);
    assert_eq!(
        &acct.data[127..159],
        learner.pubkey().as_ref(),
        "payer = learner"
    );
    assert_eq!(
        acct.lamports,
        ctx.h
            .svm
            .minimum_balance_for_rent_exemption(ENROLLMENT_SIZE)
    );

    ctx.h.warp(COOLDOWN);
    let fee_payer = ctx.authority.insecure_clone();
    let before = ctx.balance(&learner.pubkey());
    let ix = ixs::close_enrollment("self", &learner.pubkey());
    ctx.h
        .run_ok("self-paid close", &[ix], &fee_payer, &[&learner]);
    assert_eq!(ctx.balance(&learner.pubkey()), before + acct.lamports);
    assert!(is_closed(&ctx, "self", &learner.pubkey()));
}

/// The sponsored case the payer field exists for: a zero-SOL learner enrolled
/// by a sponsor. Closing refunds the sponsor, and the learner can neither keep
/// the rent nor send it anywhere else.
#[test]
fn sponsored_rent_returns_to_the_sponsor() {
    let mut ctx = Ctx::new();
    let authority = ctx.authority.insecure_clone();
    ctx.create_course(&CourseParams::simple("spon", authority.pubkey(), 2));

    let sponsor = Keypair::new();
    ctx.h.airdrop(&sponsor.pubkey(), 10 * SOL);
    let learner = ctx.new_broke_learner();
    ctx.enroll_sponsored(&learner, &sponsor, "spon");

    let acct = enrollment_account(&ctx, "spon", &learner.pubkey());
    assert_eq!(acct.data.len(), ENROLLMENT_SIZE);
    assert_eq!(
        &acct.data[127..159],
        sponsor.pubkey().as_ref(),
        "payer = sponsor"
    );
    ctx.h.warp(COOLDOWN);

    // A third party pays the fee, so balances move only by the rent.
    let fee_payer = ctx.authority.insecure_clone();

    // The learner as recipient is refused.
    let ix = ixs::close_enrollment_to("spon", &learner.pubkey(), &learner.pubkey());
    ctx.h.run_expect_custom(
        "learner keeps sponsored rent",
        &[ix],
        &fee_payer,
        &[&learner],
        CONSTRAINT_ADDRESS,
    );
    // So is anyone else.
    let thief = Keypair::new();
    let ix = ixs::close_enrollment_to("spon", &learner.pubkey(), &thief.pubkey());
    ctx.h.run_expect_custom(
        "rent to a stranger",
        &[ix],
        &fee_payer,
        &[&learner],
        CONSTRAINT_ADDRESS,
    );
    // The right recipient passed read-only cannot be credited.
    let mut ix = ixs::close_enrollment_to("spon", &learner.pubkey(), &sponsor.pubkey());
    ix.accounts[3].is_writable = false;
    ctx.h.run_expect_custom(
        "read-only recipient",
        &[ix],
        &fee_payer,
        &[&learner],
        CONSTRAINT_MUT,
    );
    assert!(!is_closed(&ctx, "spon", &learner.pubkey()));

    let sponsor_before = ctx.balance(&sponsor.pubkey());
    let learner_before = ctx.balance(&learner.pubkey());
    let ix = ixs::close_enrollment_to("spon", &learner.pubkey(), &sponsor.pubkey());
    ctx.h
        .run_ok("refund sponsor", &[ix], &fee_payer, &[&learner]);
    assert_eq!(
        ctx.balance(&sponsor.pubkey()),
        sponsor_before + acct.lamports
    );
    assert_eq!(
        ctx.balance(&learner.pubkey()),
        learner_before,
        "learner gains nothing"
    );
    assert!(is_closed(&ctx, "spon", &learner.pubkey()));
}

/// The refund does not relax the existing close rules: the learner still has
/// to sign, and a started enrollment still cannot be closed.
#[test]
fn refund_keeps_learner_signature_and_started_lock() {
    let mut ctx = Ctx::new();
    let authority = ctx.authority.insecure_clone();
    ctx.create_course(&CourseParams::simple("lock", authority.pubkey(), 2));
    let sponsor = Keypair::new();
    ctx.h.airdrop(&sponsor.pubkey(), 10 * SOL);
    let learner = ctx.new_broke_learner();
    ctx.enroll_sponsored(&learner, &sponsor, "lock");
    ctx.h.warp(COOLDOWN);

    // The sponsor cannot close the learner's enrollment to collect its rent.
    let mut ix = ixs::close_enrollment_to("lock", &learner.pubkey(), &sponsor.pubkey());
    ix.accounts[2].is_signer = false;
    ctx.h
        .run_expect_err("sponsor closes without learner", &[ix], &sponsor, &[]);

    // A started enrollment stays locked (6036), refund or not.
    ctx.complete_lessons(&learner, "lock", 1);
    let fee_payer = ctx.authority.insecure_clone();
    let ix = ixs::close_enrollment_to("lock", &learner.pubkey(), &sponsor.pubkey());
    ctx.h.run_expect_custom(
        "started enrollment",
        &[ix],
        &fee_payer,
        &[&learner],
        ENROLLMENT_IN_PROGRESS,
    );
}

/// Enrollments created before the payer was recorded are 127 bytes. They
/// refund the learner, as they always did, and nobody else.
#[test]
fn legacy_127_byte_enrollment_refunds_the_learner() {
    let mut ctx = Ctx::new();
    let authority = ctx.authority.insecure_clone();
    ctx.create_course(&CourseParams::simple("old", authority.pubkey(), 2));
    let sponsor = Keypair::new();
    ctx.h.airdrop(&sponsor.pubkey(), 10 * SOL);
    let learner = ctx.new_broke_learner();
    ctx.enroll_sponsored(&learner, &sponsor, "old");
    let rent = make_legacy(&mut ctx, "old", &learner.pubkey());
    ctx.h.warp(COOLDOWN);
    let fee_payer = ctx.authority.insecure_clone();

    // No payer is recorded, so the sponsor is not a valid recipient.
    let ix = ixs::close_enrollment_to("old", &learner.pubkey(), &sponsor.pubkey());
    ctx.h.run_expect_custom(
        "legacy to sponsor",
        &[ix],
        &fee_payer,
        &[&learner],
        CONSTRAINT_ADDRESS,
    );

    let before = ctx.balance(&learner.pubkey());
    let ix = ixs::close_enrollment("old", &learner.pubkey());
    ctx.h.run_ok("legacy close", &[ix], &fee_payer, &[&learner]);
    assert_eq!(ctx.balance(&learner.pubkey()), before + rent);
    assert!(is_closed(&ctx, "old", &learner.pubkey()));
}

/// An Enrollment of any other size was not written by this program; close
/// fails closed instead of guessing a recipient.
#[test]
fn unknown_enrollment_size_is_refused() {
    let mut ctx = Ctx::new();
    let authority = ctx.authority.insecure_clone();
    ctx.create_course(&CourseParams::simple("odd", authority.pubkey(), 2));
    let learner = ctx.new_learner();
    ctx.enroll(&learner, "odd");
    let address = ixs::enrollment_pda("odd", &learner.pubkey());
    let mut account = enrollment_account(&ctx, "odd", &learner.pubkey());
    account.data.truncate(140);
    ctx.h.set_account(address, account);
    ctx.h.warp(COOLDOWN);

    let ix = ixs::close_enrollment("odd", &learner.pubkey());
    ctx.h.run_expect_custom(
        "140-byte enrollment",
        &[ix],
        &learner,
        &[],
        ACCOUNT_DID_NOT_DESERIALIZE,
    );
}

/// Re-enrolling over a stale enrollment (a course recreated under the old
/// rules) re-initialises it in place: the size and the recorded payer are kept,
/// because that payer funded the account and the re-enroll adds no rent.
#[test]
fn stale_reuse_keeps_size_and_payer() {
    let mut ctx = Ctx::new();
    let authority = ctx.authority.insecure_clone();
    ctx.create_course(&CourseParams::simple("re", authority.pubkey(), 1));
    let sponsor = Keypair::new();
    ctx.h.airdrop(&sponsor.pubkey(), 10 * SOL);

    let sponsored = ctx.new_broke_learner();
    ctx.enroll_sponsored(&sponsored, &sponsor, "re");
    let legacy = ctx.new_learner();
    ctx.enroll(&legacy, "re");
    make_legacy(&mut ctx, "re", &legacy.pubkey());

    // Model a course closed with live enrollments by the program before this
    // change, then recreated: zero the counter, close, recreate.
    ctx.set_course_total_enrollments("re", 0);
    let ix = ixs::close_course(&authority.pubkey(), "re");
    ctx.h.run_ok("legacy-state close", &[ix], &authority, &[]);
    ctx.create_course(&CourseParams::simple("re", authority.pubkey(), 1));

    // Both learners re-enroll, paying their own way this time.
    let fee_payer = ctx.authority.insecure_clone();
    let ix = ixs::enroll_with_payer(&sponsored.pubkey(), &fee_payer.pubkey(), "re", None);
    ctx.h
        .run_ok("re-enroll sponsored", &[ix], &fee_payer, &[&sponsored]);
    ctx.enroll(&legacy, "re");

    let a = enrollment_account(&ctx, "re", &sponsored.pubkey());
    assert_eq!(a.data.len(), ENROLLMENT_SIZE);
    assert_eq!(
        &a.data[127..159],
        sponsor.pubkey().as_ref(),
        "original payer kept"
    );
    let b = enrollment_account(&ctx, "re", &legacy.pubkey());
    assert_eq!(b.data.len(), LEGACY_ENROLLMENT_SIZE, "legacy stays legacy");

    ctx.h.warp(COOLDOWN);
    let sponsor_before = ctx.balance(&sponsor.pubkey());
    let ix = ixs::close_enrollment_to("re", &sponsored.pubkey(), &sponsor.pubkey());
    ctx.h
        .run_ok("close reused sponsored", &[ix], &fee_payer, &[&sponsored]);
    assert_eq!(ctx.balance(&sponsor.pubkey()), sponsor_before + a.lamports);

    let legacy_before = ctx.balance(&legacy.pubkey());
    let ix = ixs::close_enrollment("re", &legacy.pubkey());
    ctx.h
        .run_ok("close reused legacy", &[ix], &fee_payer, &[&legacy]);
    assert_eq!(ctx.balance(&legacy.pubkey()), legacy_before + b.lamports);
}

// ---- initialize: upgrade authority only ------------------------------------

/// A fresh platform with the program deployed under `upgrade_authority`.
fn fresh_platform(
    upgrade_authority: Option<&Pubkey>,
) -> onchain_academy_differential::harness::Harness {
    let mut h = onchain_academy_differential::harness::Harness::new();
    h.set_upgrade_authority(upgrade_authority);
    h
}

#[test]
fn initialize_requires_the_upgrade_authority() {
    let owner = Keypair::new();
    let mut h = fresh_platform(Some(&owner.pubkey()));
    h.airdrop(&owner.pubkey(), 10 * SOL);

    // Anyone else is refused (6000), and nothing is created.
    let attacker = Keypair::new();
    h.airdrop(&attacker.pubkey(), 10 * SOL);
    let mint = Keypair::new();
    let ix = ixs::initialize(&mint.pubkey(), &attacker.pubkey());
    h.run_expect_custom(
        "non-upgrade-authority init",
        &[ix],
        &attacker,
        &[&mint],
        UNAUTHORIZED,
    );
    assert!(h.svm.get_account(&ixs::config_pda()).is_none());

    // The upgrade authority initializes, and becomes Config.authority.
    let ix = ixs::initialize(&mint.pubkey(), &owner.pubkey());
    h.run_ok("upgrade-authority init", &[ix], &owner, &[&mint]);
    let cfg = h.svm.get_account(&ixs::config_pda()).expect("config");
    assert_eq!(&cfg.data[8..40], owner.pubkey().as_ref());
}

#[test]
fn initialize_refuses_an_immutable_program() {
    let mut h = fresh_platform(None);
    let owner = Keypair::new();
    h.airdrop(&owner.pubkey(), 10 * SOL);
    let mint = Keypair::new();
    let ix = ixs::initialize(&mint.pubkey(), &owner.pubkey());
    h.run_expect_custom(
        "no upgrade authority",
        &[ix],
        &owner,
        &[&mint],
        UNAUTHORIZED,
    );
}

/// The ProgramData account must be the loader-owned, canonical one for this
/// program. A look-alike naming the attacker is refused whichever check it
/// fails.
#[test]
fn initialize_refuses_a_forged_programdata_account() {
    let owner = Keypair::new();
    let mut h = fresh_platform(Some(&owner.pubkey()));
    let attacker = Keypair::new();
    h.airdrop(&attacker.pubkey(), 10 * SOL);
    let mint = Keypair::new();

    let mut forged = vec![0u8; 45];
    forged[0..4].copy_from_slice(&3u32.to_le_bytes());
    forged[12] = 1;
    forged[13..45].copy_from_slice(attacker.pubkey().as_ref());

    // Right bytes, wrong owner (3007).
    let fake = Pubkey::new_unique();
    h.set_account(
        fake,
        Account {
            lamports: SOL,
            data: forged.clone(),
            owner: attacker.pubkey(),
            executable: false,
            rent_epoch: 0,
        },
    );
    let ix = ixs::initialize_with_programdata(&mint.pubkey(), &attacker.pubkey(), &fake);
    h.run_expect_custom(
        "forged owner",
        &[ix],
        &attacker,
        &[&mint],
        ACCOUNT_OWNED_BY_WRONG_PROGRAM,
    );

    // Loader-owned, but not this program's ProgramData address (2006).
    let other = Pubkey::new_unique();
    h.set_account(
        other,
        Account {
            lamports: SOL,
            data: forged,
            owner: ixs::bpf_loader_upgradeable_id(),
            executable: false,
            rent_epoch: 0,
        },
    );
    let ix = ixs::initialize_with_programdata(&mint.pubkey(), &attacker.pubkey(), &other);
    h.run_expect_custom(
        "forged address",
        &[ix],
        &attacker,
        &[&mint],
        CONSTRAINT_SEEDS,
    );

    // The real ProgramData, truncated below its 45-byte header (3003).
    let address = ixs::programdata_pda();
    let mut real = h.svm.get_account(&address).unwrap();
    real.data.truncate(12);
    h.set_account(address, real);
    let ix = ixs::initialize(&mint.pubkey(), &owner.pubkey());
    h.airdrop(&owner.pubkey(), 10 * SOL);
    h.run_expect_custom(
        "truncated programdata",
        &[ix],
        &owner,
        &[&mint],
        ACCOUNT_DID_NOT_DESERIALIZE,
    );
}

// ---- course writes: zero mask and XP bounds ---------------------------------

#[test]
fn zero_mask_is_refused() {
    let mut ctx = Ctx::new();
    let authority = ctx.authority.insecure_clone();
    ctx.create_course(&CourseParams::simple("mask", authority.pubkey(), 3));
    let learner = ctx.new_learner();
    ctx.enroll(&learner, "mask");

    let ix = ixs::update_course(
        &authority.pubkey(),
        "mask",
        None,
        None,
        None,
        None,
        None,
        Some([0, 0, 0, 0]),
    );
    ctx.h
        .run_expect_custom("zero mask", &[ix], &authority, &[], INVALID_LESSON_COUNT);

    // The untouched enrollment still cannot finalize (6004).
    let backend = ctx.authority.insecure_clone();
    let ix = ixs::finalize_course(
        "mask",
        &learner.pubkey(),
        &authority.pubkey(),
        &ctx.xp_mint,
        &backend.pubkey(),
    );
    ctx.h
        .run_expect_custom("finalize with no lessons", &[ix], &backend, &[], 6004);

    // Retiring all but one slot is still allowed.
    let ix = ixs::update_course(
        &authority.pubkey(),
        "mask",
        None,
        None,
        None,
        None,
        None,
        Some([0b100, 0, 0, 0]),
    );
    ctx.h.run_ok("single live slot", &[ix], &authority, &[]);
}

#[test]
fn create_course_refuses_xp_a_mint_cannot_carry() {
    let mut ctx = Ctx::new();
    let authority = ctx.authority.insecure_clone();
    let refuse = |ctx: &mut Ctx, label: &str, p: &CourseParams| {
        let ix = ixs::create_course(&authority.pubkey(), p);
        ctx.h
            .run_expect_custom(label, &[ix], &authority, &[], XP_AMOUNT_EXCEEDS_MAX);
    };

    let mut p = CourseParams::simple("xp-lesson", authority.pubkey(), 1);
    p.xp_per_lesson = 5_001;
    refuse(&mut ctx, "xp_per_lesson over a mint", &p);

    let mut p = CourseParams::simple("xp-reward", authority.pubkey(), 1);
    p.xp_per_lesson = 10;
    p.creator_reward_xp = 5_001;
    refuse(&mut ctx, "creator reward over a mint", &p);

    // 3 x 3334 / 2 = 5001 > 5000.
    let mut p = CourseParams::simple("xp-bonus", authority.pubkey(), 3);
    p.xp_per_lesson = 3_334;
    refuse(&mut ctx, "finalize bonus over a mint", &p);

    // At the boundary every mint fits, and finalize really mints the bonus.
    let mut p = CourseParams::simple("xp-edge", authority.pubkey(), 2);
    p.xp_per_lesson = 5_000;
    p.creator_reward_xp = 5_000;
    ctx.create_course(&p);
    let learner = ctx.new_learner();
    ctx.enroll(&learner, "xp-edge");
    ctx.complete_lessons(&learner, "xp-edge", 2);
    ctx.finalize(&learner, "xp-edge", &authority.pubkey());
    assert_eq!(ctx.xp_balance(&learner.pubkey()), 2 * 5_000 + 5_000);
}

#[test]
fn update_course_refuses_xp_a_mint_cannot_carry() {
    let mut ctx = Ctx::new();
    let authority = ctx.authority.insecure_clone();
    let mut p = CourseParams::simple("upd-xp", authority.pubkey(), 3);
    p.xp_per_lesson = 100;
    ctx.create_course(&p);

    #[allow(clippy::type_complexity)]
    let cases: [(&str, Option<u32>, Option<u32>, Option<[u64; 4]>); 4] = [
        ("xp_per_lesson", Some(5_001), None, None),
        ("creator reward", None, Some(5_001), None),
        // 3 live lessons x 3334 / 2 > 5000.
        ("bonus via xp", Some(3_334), None, None),
        // 100 XP is fine for 3 lessons, not for 101 (100 x 101 / 2 = 5050).
        (
            "bonus via mask",
            None,
            None,
            Some([u64::MAX, (1 << 37) - 1, 0, 0]),
        ),
    ];
    for (label, xp, reward, mask) in cases {
        let ix = ixs::update_course(
            &authority.pubkey(),
            "upd-xp",
            None,
            None,
            xp,
            reward,
            None,
            mask,
        );
        ctx.h
            .run_expect_custom(label, &[ix], &authority, &[], XP_AMOUNT_EXCEEDS_MAX);
    }

    // Updates that leave the course in bounds still apply.
    let ix = ixs::update_course(
        &authority.pubkey(),
        "upd-xp",
        None,
        None,
        Some(40),
        Some(30),
        None,
        Some([u64::MAX, (1 << 37) - 1, 0, 0]),
    );
    ctx.h.run_ok("in-bounds update", &[ix], &authority, &[]);
}

// ---- close_course: never once enrolled -------------------------------------

#[test]
fn close_course_refuses_any_course_ever_enrolled() {
    let mut ctx = Ctx::new();
    let authority = ctx.authority.insecure_clone();
    ctx.create_course(&CourseParams::simple("kept", authority.pubkey(), 2));
    let learner = ctx.new_learner();
    ctx.enroll(&learner, "kept");

    let ix = ixs::close_course(&authority.pubkey(), "kept");
    ctx.h.run_expect_custom(
        "close enrolled course",
        &[ix],
        &authority,
        &[],
        COURSE_HAS_ENROLLMENTS,
    );

    // The learner unenrolls; the counter is a high-water mark, so it stays
    // closed to close_course.
    ctx.h.warp(COOLDOWN);
    let ix = ixs::close_enrollment("kept", &learner.pubkey());
    ctx.h.run_ok("learner unenrolls", &[ix], &learner, &[]);
    assert_eq!(ctx.course_total_enrollments("kept"), 1);
    let ix = ixs::close_course(&authority.pubkey(), "kept");
    ctx.h.run_expect_custom(
        "close after unenroll",
        &[ix],
        &authority,
        &[],
        COURSE_HAS_ENROLLMENTS,
    );
    assert!(ctx.h.svm.get_account(&ixs::course_pda("kept")).is_some());

    // A course nobody enrolled in closes and recreates.
    ctx.create_course(&CourseParams::simple("empty", authority.pubkey(), 2));
    let ix = ixs::close_course(&authority.pubkey(), "empty");
    ctx.h.run_ok("close empty course", &[ix], &authority, &[]);
    ctx.create_course(&CourseParams::simple("empty", authority.pubkey(), 2));
}

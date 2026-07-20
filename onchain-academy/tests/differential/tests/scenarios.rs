//! Gate 2 — pinocchio integration scenarios (LiteSVM). Every test drives the
//! pinocchio `.so` and asserts the expected result / error code. Covers all 18
//! instructions, happy paths and error paths, incl. the kill-switch sweep,
//! prerequisite enrollment, the 24h cooldown warp, hostile token accounts,
//! and the legacy 192-byte close_course migration path. (Originally a dual-VM
//! differential suite vs the Anchor oracle, which has been retired.)

use onchain_academy_differential::ixs::{self, CourseParams};
use onchain_academy_differential::scenario::{Ctx, SOL};
use solana_sdk::account::Account;
use solana_sdk::pubkey::Pubkey;
use solana_sdk::signature::Keypair;
use solana_sdk::signer::Signer;

#[test]
fn init_and_reinit() {
    let mut ctx = Ctx::new(); // initialize ran inside
                              // Re-initializing must fail identically (config PDA already in use).
    let mint2 = Keypair::new();
    let ix = ixs::initialize(&mint2.pubkey(), &ctx.authority.pubkey());
    let authority = ctx.authority.insecure_clone();
    ctx.h
        .run_expect_err("re-initialize", &[ix], &authority, &[&mint2]);
}

#[test]
fn config_rotate_and_pause() {
    let mut ctx = Ctx::new();
    let authority = ctx.authority.insecure_clone();

    // Rotating the backend signer now REQUIRES the previous backend's minter
    // role PDA, so a live old role is always retired. Omitting it fails (6035).
    let new_backend = Keypair::new();
    let ix = ixs::update_config(
        &authority.pubkey(),
        Some(new_backend.pubkey()),
        None,
        None,
        None,
    );
    ctx.h
        .run_expect_custom("rotate without old role", &[ix], &authority, &[], 6035);

    // With the old backend's (authority's) live role passed -> rotates and
    // deactivates that role.
    let ix = ixs::update_config(
        &authority.pubkey(),
        Some(new_backend.pubkey()),
        None,
        None,
        Some(ixs::minter_pda(&authority.pubkey())),
    );
    ctx.h
        .run_ok("rotate + retire old role", &[ix], &authority, &[]);

    // Rotate back to authority. The old backend (new_backend) never held a
    // role, so its (uninitialized) canonical minter PDA is a no-op — but it is
    // still required, and must be the canonical one.
    let ix = ixs::update_config(
        &authority.pubkey(),
        Some(authority.pubkey()),
        None,
        None,
        Some(ixs::minter_pda(&new_backend.pubkey())),
    );
    ctx.h.run_ok("rotate back", &[ix], &authority, &[]);

    // Pause / unpause.
    let ix = ixs::update_config(&authority.pubkey(), None, Some(true), None, None);
    ctx.h.run_ok("pause", &[ix], &authority, &[]);
    let ix = ixs::update_config(&authority.pubkey(), None, Some(false), None, None);
    ctx.h.run_ok("unpause", &[ix], &authority, &[]);

    // Zero new_authority rejected (6000), non-authority rejected (6000).
    let ix = ixs::update_config(
        &authority.pubkey(),
        None,
        None,
        Some(Pubkey::default()),
        None,
    );
    ctx.h
        .run_expect_custom("zero authority", &[ix], &authority, &[], 6000);

    let mallory = Keypair::new();
    ctx.h.airdrop(&mallory.pubkey(), SOL);
    let ix = ixs::update_config(&mallory.pubkey(), None, Some(true), None, None);
    ctx.h
        .run_expect_custom("non-authority pause", &[ix], &mallory, &[], 6000);
}

#[test]
fn create_course_validation() {
    let mut ctx = Ctx::new();
    let authority = ctx.authority.insecure_clone();

    ctx.create_course(&CourseParams::simple("rust-101", authority.pubkey(), 3));

    // Duplicate id -> create CPI fails inside the system program.
    let ix = ixs::create_course(
        &authority.pubkey(),
        &CourseParams::simple("rust-101", authority.pubkey(), 3),
    );
    ctx.h
        .run_expect_err("duplicate course", &[ix], &authority, &[]);

    // Zero lessons -> 6013.
    let ix = ixs::create_course(
        &authority.pubkey(),
        &CourseParams::simple("zero-lessons", authority.pubkey(), 0),
    );
    ctx.h
        .run_expect_custom("zero lessons", &[ix], &authority, &[], 6013);

    // Difficulty 4 -> 6014.
    let mut p = CourseParams::simple("bad-difficulty", authority.pubkey(), 3);
    p.difficulty = 4;
    let ix = ixs::create_course(&authority.pubkey(), &p);
    ctx.h
        .run_expect_custom("bad difficulty", &[ix], &authority, &[], 6014);

    // Empty id -> 6011 (PDA with empty seed is derivable, so the handler check fires).
    let ix = ixs::create_course(
        &authority.pubkey(),
        &CourseParams::simple("", authority.pubkey(), 3),
    );
    ctx.h
        .run_expect_custom("empty id", &[ix], &authority, &[], 6011);

    // Non-authority -> 6000.
    let mallory = Keypair::new();
    ctx.h.airdrop(&mallory.pubkey(), SOL);
    let ix = ixs::create_course(
        &mallory.pubkey(),
        &CourseParams::simple("mallory-course", mallory.pubkey(), 3),
    );
    ctx.h
        .run_expect_custom("non-authority create", &[ix], &mallory, &[], 6000);
}

#[test]
fn update_course_paths() {
    let mut ctx = Ctx::new();
    let authority = ctx.authority.insecure_clone();
    ctx.create_course(&CourseParams::simple("upd", authority.pubkey(), 3));

    // Multi-field update incl. content bump -> version 2.
    let ix = ixs::update_course(
        &authority.pubkey(),
        "upd",
        Some([9u8; 32]),
        Some(false),
        Some(75),
        Some(300),
        None,
        Some([0b11, 0, 0, 0]),
    );
    ctx.h.run_ok("multi update", &[ix], &authority, &[]);

    // Collection backfill, then re-point rejected (6016).
    let collection = Pubkey::new_unique();
    let ix = ixs::update_course(
        &authority.pubkey(),
        "upd",
        None,
        None,
        None,
        None,
        Some(collection),
        None,
    );
    ctx.h.run_ok("collection backfill", &[ix], &authority, &[]);
    let other = Pubkey::new_unique();
    let ix = ixs::update_course(
        &authority.pubkey(),
        "upd",
        None,
        None,
        None,
        None,
        Some(other),
        None,
    );
    ctx.h
        .run_expect_custom("collection repoint", &[ix], &authority, &[], 6016);

    // Non-authority -> 6000.
    let mallory = Keypair::new();
    ctx.h.airdrop(&mallory.pubkey(), SOL);
    let ix = ixs::update_course(
        &mallory.pubkey(),
        "upd",
        None,
        Some(true),
        None,
        None,
        None,
        None,
    );
    ctx.h
        .run_expect_custom("non-authority update", &[ix], &mallory, &[], 6000);
}

#[test]
fn minter_lifecycle() {
    let mut ctx = Ctx::new();
    let authority = ctx.authority.insecure_clone();
    let minter = Keypair::new();
    ctx.h.airdrop(&minter.pubkey(), SOL);

    // Register (empty label allowed), oversized label rejected (6021).
    let ix = ixs::register_minter(
        &authority.pubkey(),
        &authority.pubkey(),
        &minter.pubkey(),
        "streaks",
        500,
        10_000,
    );
    ctx.h.run_ok("register", &[ix], &authority, &[]);

    let other = Pubkey::new_unique();
    let ix = ixs::register_minter(
        &authority.pubkey(),
        &authority.pubkey(),
        &other,
        &"x".repeat(33),
        0,
        0,
    );
    ctx.h
        .run_expect_custom("label too long", &[ix], &authority, &[], 6021);

    // Update caps.
    let ix = ixs::update_minter(&authority.pubkey(), &minter.pubkey(), 100, 200);
    ctx.h.run_ok("update caps", &[ix], &authority, &[]);

    // Revoking the live backend's own role is refused (6000).
    let ix = ixs::revoke_minter(&authority.pubkey(), &authority.pubkey());
    ctx.h
        .run_expect_custom("revoke backend role", &[ix], &authority, &[], 6000);

    // Revoke + re-register the third-party minter.
    let ix = ixs::revoke_minter(&authority.pubkey(), &minter.pubkey());
    ctx.h.run_ok("revoke", &[ix], &authority, &[]);
    let ix = ixs::register_minter(
        &authority.pubkey(),
        &authority.pubkey(),
        &minter.pubkey(),
        "streaks-v2",
        0,
        0,
    );
    ctx.h.run_ok("re-register", &[ix], &authority, &[]);

    // Non-authority register -> 6000.
    let mallory = Keypair::new();
    ctx.h.airdrop(&mallory.pubkey(), SOL);
    let ix = ixs::register_minter(&mallory.pubkey(), &mallory.pubkey(), &other, "evil", 0, 0);
    ctx.h
        .run_expect_custom("non-authority register", &[ix], &mallory, &[], 6000);
}

#[test]
fn enroll_paths() {
    let mut ctx = Ctx::new();
    let authority = ctx.authority.insecure_clone();
    ctx.create_course(&CourseParams::simple("enr", authority.pubkey(), 3));
    let learner = ctx.new_learner();

    ctx.enroll(&learner, "enr");

    // Double-enroll fails inside the system program (account in use).
    let ix = ixs::enroll(&learner.pubkey(), "enr", None);
    ctx.h.run_expect_err("double enroll", &[ix], &learner, &[]);

    // Inactive course -> 6001.
    ctx.create_course(&CourseParams::simple("inactive", authority.pubkey(), 3));
    let ix = ixs::update_course(
        &authority.pubkey(),
        "inactive",
        None,
        Some(false),
        None,
        None,
        None,
        None,
    );
    ctx.h.run_ok("deactivate", &[ix], &authority, &[]);
    let learner2 = ctx.new_learner();
    let ix = ixs::enroll(&learner2.pubkey(), "inactive", None);
    ctx.h
        .run_expect_custom("enroll inactive", &[ix], &learner2, &[], 6001);
}

#[test]
fn prerequisite_enroll() {
    let mut ctx = Ctx::new();
    let authority = ctx.authority.insecure_clone();
    ctx.create_course(&CourseParams::simple("basics", authority.pubkey(), 2));
    let mut advanced = CourseParams::simple("advanced", authority.pubkey(), 2);
    advanced.prerequisite = Some(ixs::course_pda("basics"));
    ctx.create_course(&advanced);

    let learner = ctx.new_learner();

    // Missing remaining accounts -> 6007.
    let ix = ixs::enroll(&learner.pubkey(), "advanced", None);
    ctx.h
        .run_expect_custom("prereq missing accounts", &[ix], &learner, &[], 6007);

    // Prereq enrollment exists but incomplete -> 6007.
    ctx.enroll(&learner, "basics");
    let ix = ixs::enroll(
        &learner.pubkey(),
        "advanced",
        Some(("basics", &learner.pubkey())),
    );
    ctx.h
        .run_expect_custom("prereq incomplete", &[ix], &learner, &[], 6007);

    // Complete + finalize basics, then advanced enrollment succeeds.
    ctx.complete_lessons(&learner, "basics", 2);
    ctx.finalize(&learner, "basics", &authority.pubkey());
    let ix = ixs::enroll(
        &learner.pubkey(),
        "advanced",
        Some(("basics", &learner.pubkey())),
    );
    ctx.h.run_ok("prereq satisfied", &[ix], &learner, &[]);

    // Another learner may not reuse the first learner's completed enrollment.
    let freerider = ctx.new_learner();
    let ix = ixs::enroll(
        &freerider.pubkey(),
        "advanced",
        Some(("basics", &learner.pubkey())),
    );
    ctx.h
        .run_expect_custom("prereq wrong learner", &[ix], &freerider, &[], 6007);
}

#[test]
fn complete_lesson_paths() {
    let mut ctx = Ctx::new();
    let authority = ctx.authority.insecure_clone();
    ctx.create_course(&CourseParams::simple("cl", authority.pubkey(), 3));
    let learner = ctx.new_learner();
    ctx.enroll(&learner, "cl");

    // Happy: lesson 0 mints 50 XP.
    ctx.complete_lessons(&learner, "cl", 1);
    assert_eq!(ctx.xp_balance(&learner.pubkey()), 50);

    let backend = ctx.authority.insecure_clone();

    // Duplicate lesson -> 6003.
    let ix = ixs::complete_lesson("cl", &learner.pubkey(), &ctx.xp_mint, &backend.pubkey(), 0);
    ctx.h
        .run_expect_custom("dup lesson", &[ix], &backend, &[], 6003);

    // Out of bounds -> 6002.
    let ix = ixs::complete_lesson("cl", &learner.pubkey(), &ctx.xp_mint, &backend.pubkey(), 3);
    ctx.h
        .run_expect_custom("lesson oob", &[ix], &backend, &[], 6002);

    // Wrong backend signer -> 6000.
    let fake_backend = Keypair::new();
    ctx.h.airdrop(&fake_backend.pubkey(), SOL);
    let ix = ixs::complete_lesson(
        "cl",
        &learner.pubkey(),
        &ctx.xp_mint,
        &fake_backend.pubkey(),
        1,
    );
    ctx.h
        .run_expect_custom("wrong backend", &[ix], &fake_backend, &[], 6000);

    // Learner-swap: enrollment PDA of learner A with learner B account -> 2006.
    let other = ctx.new_learner();
    let mut ix = ixs::complete_lesson("cl", &learner.pubkey(), &ctx.xp_mint, &backend.pubkey(), 1);
    ix.accounts[3] = solana_sdk::instruction::AccountMeta::new_readonly(other.pubkey(), false);
    ctx.h
        .run_expect_custom("learner swap", &[ix], &backend, &[], 2006);

    // Hostile: ATA of the right mint but owned by a DIFFERENT wallet -> 6000
    // (owner binding in require_xp_recipient).
    let ix = ixs::complete_lesson_with_ata(
        "cl",
        &learner.pubkey(),
        &ixs::ata(&other.pubkey(), &ctx.xp_mint),
        &ctx.xp_mint,
        &backend.pubkey(),
        1,
    );
    ctx.h
        .run_expect_custom("foreign-owner ata", &[ix], &backend, &[], 6000);

    // Hostile: ATA of an unrelated mint -> 6032 (mint binding).
    let (_foreign_mint, foreign_ata) = ctx.create_foreign_mint_ata(&learner.pubkey());
    let ix = ixs::complete_lesson_with_ata(
        "cl",
        &learner.pubkey(),
        &foreign_ata,
        &ctx.xp_mint,
        &backend.pubkey(),
        1,
    );
    ctx.h
        .run_expect_custom("foreign-mint ata", &[ix], &backend, &[], 6032);
}

#[test]
fn finalize_paths() {
    let mut ctx = Ctx::new();
    let authority = ctx.authority.insecure_clone();
    let creator = ctx.new_learner(); // funded, has XP ATA

    let mut p = CourseParams::simple("fin", creator.pubkey(), 2);
    p.creator_reward_xp = 25;
    ctx.create_course(&p);

    let learner = ctx.new_learner();
    ctx.enroll(&learner, "fin");

    // Incomplete -> 6004.
    let backend = authority.insecure_clone();
    let ix = ixs::finalize_course(
        "fin",
        &learner.pubkey(),
        &creator.pubkey(),
        &ctx.xp_mint,
        &backend.pubkey(),
    );
    ctx.h
        .run_expect_custom("finalize incomplete", &[ix], &backend, &[], 6004);

    // Complete all + finalize: learner gets 2*50 lesson XP + 50 bonus;
    // creator (threshold 1, within window) gets 25.
    ctx.complete_lessons(&learner, "fin", 2);
    ctx.finalize(&learner, "fin", &creator.pubkey());
    assert_eq!(ctx.xp_balance(&learner.pubkey()), 150);
    assert_eq!(ctx.xp_balance(&creator.pubkey()), 25);

    // Double finalize -> 6005.
    let ix = ixs::finalize_course(
        "fin",
        &learner.pubkey(),
        &creator.pubkey(),
        &ctx.xp_mint,
        &backend.pubkey(),
    );
    ctx.h
        .run_expect_custom("double finalize", &[ix], &backend, &[], 6005);

    // Wrong creator account -> 6000.
    let learner2 = ctx.new_learner();
    ctx.enroll(&learner2, "fin");
    ctx.complete_lessons(&learner2, "fin", 2);
    let wrong_creator = ctx.new_learner();
    let ix = ixs::finalize_course(
        "fin",
        &learner2.pubkey(),
        &wrong_creator.pubkey(),
        &ctx.xp_mint,
        &backend.pubkey(),
    );
    ctx.h
        .run_expect_custom("wrong creator", &[ix], &backend, &[], 6000);
}

#[test]
fn reward_xp_caps() {
    let mut ctx = Ctx::new();
    let authority = ctx.authority.insecure_clone();
    let minter = Keypair::new();
    ctx.h.airdrop(&minter.pubkey(), SOL);
    let recipient = ctx.new_learner();
    let recipient_ata = ixs::ata(&recipient.pubkey(), &ctx.xp_mint);

    let ix = ixs::register_minter(
        &authority.pubkey(),
        &authority.pubkey(),
        &minter.pubkey(),
        "capped",
        100,
        150,
    );
    ctx.h.run_ok("register capped", &[ix], &authority, &[]);

    let backend = authority.pubkey();

    // Happy.
    let ix = ixs::reward_xp(
        &minter.pubkey(),
        &backend,
        &ctx.xp_mint,
        &recipient_ata,
        100,
        "gm",
    );
    ctx.h.run_ok("reward 100", &[ix], &authority, &[&minter]);
    assert_eq!(ctx.xp_balance(&recipient.pubkey()), 100);

    // Zero amount -> 6027.
    let ix = ixs::reward_xp(
        &minter.pubkey(),
        &backend,
        &ctx.xp_mint,
        &recipient_ata,
        0,
        "zero",
    );
    ctx.h
        .run_expect_custom("reward zero", &[ix], &authority, &[&minter], 6027);

    // Above absolute ceiling -> 6033.
    let ix = ixs::reward_xp(
        &minter.pubkey(),
        &backend,
        &ctx.xp_mint,
        &recipient_ata,
        5001,
        "big",
    );
    ctx.h
        .run_expect_custom("reward over ceiling", &[ix], &authority, &[&minter], 6033);

    // Above per-call cap -> 6019.
    let ix = ixs::reward_xp(
        &minter.pubkey(),
        &backend,
        &ctx.xp_mint,
        &recipient_ata,
        101,
        "percall",
    );
    ctx.h
        .run_expect_custom("reward over per-call", &[ix], &authority, &[&minter], 6019);

    // Lifetime cap: 100 already minted, cap 150 -> +100 exceeds -> 6020.
    let ix = ixs::reward_xp(
        &minter.pubkey(),
        &backend,
        &ctx.xp_mint,
        &recipient_ata,
        100,
        "lifetime",
    );
    ctx.h
        .run_expect_custom("reward over lifetime", &[ix], &authority, &[&minter], 6020);

    // Foreign-mint ATA -> 6032.
    let (_m, foreign_ata) = ctx.create_foreign_mint_ata(&recipient.pubkey());
    let ix = ixs::reward_xp(
        &minter.pubkey(),
        &backend,
        &ctx.xp_mint,
        &foreign_ata,
        10,
        "foreign",
    );
    ctx.h
        .run_expect_custom("reward foreign mint", &[ix], &authority, &[&minter], 6032);

    // Inactive minter (deactivate via update_minter to cap 1 < total? use
    // revoke instead: revoked role -> account gone -> 3012).
    let ix = ixs::revoke_minter(&authority.pubkey(), &minter.pubkey());
    ctx.h.run_ok("revoke minter", &[ix], &authority, &[]);
    let ix = ixs::reward_xp(
        &minter.pubkey(),
        &backend,
        &ctx.xp_mint,
        &recipient_ata,
        10,
        "gone",
    );
    ctx.h
        .run_expect_custom("reward revoked minter", &[ix], &authority, &[&minter], 3012);
}

#[test]
fn close_enrollment_cooldown_and_replay_guard() {
    let mut ctx = Ctx::new();
    let authority = ctx.authority.insecure_clone();
    ctx.create_course(&CourseParams::simple("ce", authority.pubkey(), 1));
    let learner = ctx.new_learner();
    ctx.enroll(&learner, "ce");

    // Before cooldown -> 6008.
    let ix = ixs::close_enrollment("ce", &learner.pubkey());
    ctx.h
        .run_expect_custom("close before cooldown", &[ix], &learner, &[], 6008);

    // Warp past 24h -> closes; rent parity is asserted by the harness.
    ctx.h.warp(86_401);
    let ix = ixs::close_enrollment("ce", &learner.pubkey());
    ctx.h.run_ok("close after cooldown", &[ix], &learner, &[]);

    // Re-enroll works after close (PDA freed).
    ctx.enroll(&learner, "ce");

    // Finalized enrollment cannot be closed -> 6029.
    ctx.complete_lessons(&learner, "ce", 1);
    ctx.finalize(&learner, "ce", &authority.pubkey());
    ctx.h.warp(86_401);
    let ix = ixs::close_enrollment("ce", &learner.pubkey());
    ctx.h
        .run_expect_custom("close finalized", &[ix], &learner, &[], 6029);
}

#[test]
fn achievements_lifecycle() {
    let mut ctx = Ctx::new();
    let authority = ctx.authority.insecure_clone();
    let collection = Keypair::new();

    // Validation: xp_reward 0 -> 6028 (collection create runs after? no —
    // handler checks run before the CPI, so the error is clean).
    let bad = ixs::create_achievement_type(
        &authority.pubkey(),
        &authority.pubkey(),
        &collection.pubkey(),
        "zero-xp",
        "Zero",
        "https://u",
        0,
        0,
    );
    ctx.h
        .run_expect_custom("achv zero xp", &[bad], &authority, &[&collection], 6028);

    // Create with max_supply = 1.
    let ix = ixs::create_achievement_type(
        &authority.pubkey(),
        &authority.pubkey(),
        &collection.pubkey(),
        "early",
        "Early Adopter",
        "https://arweave.net/xyz",
        1,
        25,
    );
    ctx.h
        .run_ok("create achievement", &[ix], &authority, &[&collection]);

    // Award to recipient 1 (mints NFT + 25 XP).
    let recipient = ctx.new_learner();
    let asset = Keypair::new();
    let ix = ixs::award_achievement(
        "early",
        &asset.pubkey(),
        &collection.pubkey(),
        &recipient.pubkey(),
        &ctx.xp_mint,
        &authority.pubkey(),
        &authority.pubkey(),
        &authority.pubkey(),
    );
    ctx.h.run_ok("award", &[ix], &authority, &[&asset]);
    assert_eq!(ctx.xp_balance(&recipient.pubkey()), 25);

    // Duplicate award to the same recipient -> receipt PDA in use.
    let asset2 = Keypair::new();
    let ix = ixs::award_achievement(
        "early",
        &asset2.pubkey(),
        &collection.pubkey(),
        &recipient.pubkey(),
        &ctx.xp_mint,
        &authority.pubkey(),
        &authority.pubkey(),
        &authority.pubkey(),
    );
    ctx.h
        .run_expect_err("duplicate award", &[ix], &authority, &[&asset2]);

    // Supply exhausted for a second recipient -> 6023.
    let recipient2 = ctx.new_learner();
    let asset3 = Keypair::new();
    let ix = ixs::award_achievement(
        "early",
        &asset3.pubkey(),
        &collection.pubkey(),
        &recipient2.pubkey(),
        &ctx.xp_mint,
        &authority.pubkey(),
        &authority.pubkey(),
        &authority.pubkey(),
    );
    ctx.h
        .run_expect_custom("supply exhausted", &[ix], &authority, &[&asset3], 6023);

    // Deactivate, then awarding -> 6022.
    let ix = ixs::deactivate_achievement_type(&authority.pubkey(), "early");
    ctx.h
        .run_ok("deactivate achievement", &[ix], &authority, &[]);
    let asset4 = Keypair::new();
    let ix = ixs::award_achievement(
        "early",
        &asset4.pubkey(),
        &collection.pubkey(),
        &recipient2.pubkey(),
        &ctx.xp_mint,
        &authority.pubkey(),
        &authority.pubkey(),
        &authority.pubkey(),
    );
    ctx.h
        .run_expect_custom("award deactivated", &[ix], &authority, &[&asset4], 6022);
}

#[test]
fn credentials_lifecycle() {
    let mut ctx = Ctx::new();
    let authority = ctx.authority.insecure_clone();
    let collection = ctx.bootstrap_collection();

    let mut p = CourseParams::simple("cred", authority.pubkey(), 1);
    p.collection = Some(collection);
    ctx.create_course(&p);

    let learner = ctx.new_learner();
    ctx.enroll(&learner, "cred");

    // Issue before finalize -> 6006.
    let asset = Keypair::new();
    let ix = ixs::issue_credential(
        "cred",
        &learner.pubkey(),
        &asset.pubkey(),
        &collection,
        &authority.pubkey(),
        &authority.pubkey(),
        "Track Cred",
        "https://arweave.net/c1",
        1,
        150,
    );
    ctx.h
        .run_expect_custom("issue unfinalized", &[ix], &authority, &[&asset], 6006);

    ctx.complete_lessons(&learner, "cred", 1);
    ctx.finalize(&learner, "cred", &authority.pubkey());

    // Wrong collection -> 6016.
    let other_collection = ctx.bootstrap_collection();
    let ix = ixs::issue_credential(
        "cred",
        &learner.pubkey(),
        &asset.pubkey(),
        &other_collection,
        &authority.pubkey(),
        &authority.pubkey(),
        "Track Cred",
        "https://arweave.net/c1",
        1,
        150,
    );
    ctx.h
        .run_expect_custom("issue wrong collection", &[ix], &authority, &[&asset], 6016);

    // Happy issue.
    let ix = ixs::issue_credential(
        "cred",
        &learner.pubkey(),
        &asset.pubkey(),
        &collection,
        &authority.pubkey(),
        &authority.pubkey(),
        "Track Cred",
        "https://arweave.net/c1",
        1,
        150,
    );
    ctx.h
        .run_ok("issue credential", &[ix], &authority, &[&asset]);

    // Second issue -> 6017.
    let asset2 = Keypair::new();
    let ix = ixs::issue_credential(
        "cred",
        &learner.pubkey(),
        &asset2.pubkey(),
        &collection,
        &authority.pubkey(),
        &authority.pubkey(),
        "Track Cred",
        "https://arweave.net/c1",
        1,
        150,
    );
    ctx.h
        .run_expect_custom("issue twice", &[ix], &authority, &[&asset2], 6017);

    // Upgrade with the wrong asset -> 6015.
    let ix = ixs::upgrade_credential(
        "cred",
        &learner.pubkey(),
        &asset2.pubkey(),
        &collection,
        &authority.pubkey(),
        &authority.pubkey(),
        "Track Cred L2",
        "https://arweave.net/c2",
        2,
        400,
    );
    ctx.h
        .run_expect_custom("upgrade wrong asset", &[ix], &authority, &[], 6015);

    // Happy upgrade.
    let ix = ixs::upgrade_credential(
        "cred",
        &learner.pubkey(),
        &asset.pubkey(),
        &collection,
        &authority.pubkey(),
        &authority.pubkey(),
        "Track Cred L2",
        "https://arweave.net/c2",
        2,
        400,
    );
    ctx.h.run_ok("upgrade credential", &[ix], &authority, &[]);
}

#[test]
fn close_course_including_legacy_192() {
    let mut ctx = Ctx::new();
    let authority = ctx.authority.insecure_clone();

    // Current-layout close + recreate.
    ctx.create_course(&CourseParams::simple("cc", authority.pubkey(), 2));
    let ix = ixs::close_course(&authority.pubkey(), "cc");
    ctx.h.run_ok("close course", &[ix], &authority, &[]);
    ctx.create_course(&CourseParams::simple("cc", authority.pubkey(), 2));

    // Legacy pre-resize 192-byte account: valid discriminator + truncated
    // borsh (no `collection` field). Seeded identically into both VMs.
    let legacy_id = "legacy-course";
    let (pda, bump) = solana_sdk::pubkey::Pubkey::find_program_address(
        &[b"course", legacy_id.as_bytes()],
        &ixs::program_id(),
    );
    let mut data = vec![0u8; 192];
    data[0..8].copy_from_slice(&[206, 6, 78, 228, 163, 138, 241, 106]); // Course discriminator
    data[8..12].copy_from_slice(&(legacy_id.len() as u32).to_le_bytes());
    data[12..12 + legacy_id.len()].copy_from_slice(legacy_id.as_bytes());
    // Remaining legacy fields left zeroed except the bump at the legacy tail;
    // close_course only reads the discriminator, so this is sufficient.
    let _ = bump;
    ctx.h.set_account(
        pda,
        Account {
            lamports: 2_400_000,
            data,
            owner: ixs::program_id(),
            executable: false,
            rent_epoch: 0,
        },
    );
    let ix = ixs::close_course(&authority.pubkey(), legacy_id);
    ctx.h.run_ok("close legacy 192", &[ix], &authority, &[]);

    // Non-course PDA seeds -> ConstraintSeeds long before any drain: closing a
    // course id that was never created -> account is system-owned/empty ->
    // owner check custom error 6030.
    let ix = ixs::close_course(&authority.pubkey(), "never-created");
    ctx.h
        .run_expect_custom("close nonexistent", &[ix], &authority, &[], 6030);
}

#[test]
fn kill_switch_sweep() {
    let mut ctx = Ctx::new();
    let authority = ctx.authority.insecure_clone();
    let collection = ctx.bootstrap_collection();

    // Setup while unpaused: course with collection, enrolled learner with one
    // of two lessons done; a second finalized learner for credential paths;
    // an achievement type.
    let mut p = CourseParams::simple("ks", authority.pubkey(), 2);
    p.collection = Some(collection);
    ctx.create_course(&p);

    let learner = ctx.new_learner();
    ctx.enroll(&learner, "ks");
    ctx.complete_lessons(&learner, "ks", 1);

    let graduate = ctx.new_learner();
    ctx.enroll(&graduate, "ks");
    ctx.complete_lessons(&graduate, "ks", 2);
    ctx.finalize(&graduate, "ks", &authority.pubkey());

    let achv_collection = Keypair::new();
    let ix = ixs::create_achievement_type(
        &authority.pubkey(),
        &authority.pubkey(),
        &achv_collection.pubkey(),
        "ks-achv",
        "KS",
        "https://u",
        0,
        10,
    );
    ctx.h
        .run_ok("ks create achv", &[ix], &authority, &[&achv_collection]);

    // PAUSE.
    let ix = ixs::update_config(&authority.pubkey(), None, Some(true), None, None);
    ctx.h.run_ok("ks pause", &[ix], &authority, &[]);

    let backend = authority.pubkey();

    // All six gated paths -> 6031.
    let ix = ixs::complete_lesson("ks", &learner.pubkey(), &ctx.xp_mint, &backend, 1);
    ctx.h
        .run_expect_custom("paused complete_lesson", &[ix], &authority, &[], 6031);

    let ix = ixs::finalize_course(
        "ks",
        &learner.pubkey(),
        &authority.pubkey(),
        &ctx.xp_mint,
        &backend,
    );
    ctx.h
        .run_expect_custom("paused finalize", &[ix], &authority, &[], 6031);

    let recipient_ata = ixs::ata(&learner.pubkey(), &ctx.xp_mint);
    let ix = ixs::reward_xp(
        &authority.pubkey(),
        &backend,
        &ctx.xp_mint,
        &recipient_ata,
        10,
        "paused",
    );
    ctx.h
        .run_expect_custom("paused reward_xp", &[ix], &authority, &[], 6031);

    let asset = Keypair::new();
    let ix = ixs::award_achievement(
        "ks-achv",
        &asset.pubkey(),
        &achv_collection.pubkey(),
        &learner.pubkey(),
        &ctx.xp_mint,
        &authority.pubkey(),
        &authority.pubkey(),
        &authority.pubkey(),
    );
    ctx.h
        .run_expect_custom("paused award", &[ix], &authority, &[&asset], 6031);

    let cred_asset = Keypair::new();
    let ix = ixs::issue_credential(
        "ks",
        &graduate.pubkey(),
        &cred_asset.pubkey(),
        &collection,
        &authority.pubkey(),
        &authority.pubkey(),
        "C",
        "https://u",
        1,
        1,
    );
    ctx.h
        .run_expect_custom("paused issue", &[ix], &authority, &[&cred_asset], 6031);

    let ix = ixs::upgrade_credential(
        "ks",
        &graduate.pubkey(),
        &cred_asset.pubkey(),
        &collection,
        &authority.pubkey(),
        &authority.pubkey(),
        "C",
        "https://u",
        1,
        1,
    );
    ctx.h
        .run_expect_custom("paused upgrade", &[ix], &authority, &[], 6031);

    // UNPAUSE — the blocked lesson completes again.
    let ix = ixs::update_config(&authority.pubkey(), None, Some(false), None, None);
    ctx.h.run_ok("ks unpause", &[ix], &authority, &[]);
    let ix = ixs::complete_lesson("ks", &learner.pubkey(), &ctx.xp_mint, &backend, 1);
    ctx.h
        .run_ok("unpaused complete_lesson", &[ix], &authority, &[]);
}

#[test]
fn unknown_and_short_instruction_data() {
    let mut ctx = Ctx::new();
    let authority = ctx.authority.insecure_clone();

    // Unknown 8-byte discriminator -> InstructionFallbackNotFound (101).
    let ix = solana_sdk::instruction::Instruction {
        program_id: ixs::program_id(),
        accounts: vec![],
        data: vec![9, 9, 9, 9, 9, 9, 9, 9],
    };
    ctx.h
        .run_expect_custom("unknown discriminator", &[ix], &authority, &[], 101);

    // Short data -> also 101 (Anchor's fallback path).
    let ix = solana_sdk::instruction::Instruction {
        program_id: ixs::program_id(),
        accounts: vec![],
        data: vec![1, 2, 3],
    };
    ctx.h
        .run_expect_custom("short data", &[ix], &authority, &[], 101);
}

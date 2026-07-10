//! ADVERSARIAL AUDIT — multi-violation first-failing-check parity.
//!
//! The committed `scenarios.rs` suite only exercises SINGLE-violation inputs.
//! These craft transactions that violate 2+ constraints AT ONCE, straddling
//! Anchor's two-phase boundary (all account loads/type-checks first, THEN all
//! field constraints), and assert the Anchor `.so` and the pinocchio `.so`
//! surface the *same* first error. `DiffHarness::run` panics on any divergence
//! (error code, normalized logs, or touched-account bytes).

use onchain_academy_differential::ixs;
use onchain_academy_differential::scenario::Ctx;
use solana_sdk::instruction::AccountMeta;
use solana_sdk::signature::Signer;

/// complete_lesson: unsigned backend (AccountNotSigner 3010, an EXTRACTION-phase
/// check on account #7) + learner-swap (enrollment seeds 2006, a CONSTRAINT-phase
/// check on account #3). Two-phase order => extraction wins => 3010, even though
/// the seeds violation is on an earlier-declared account.
#[test]
fn cl_unsigned_backend_beats_seeds() {
    let mut ctx = Ctx::new();
    let backend = ctx.authority.insecure_clone();
    let p = ixs::CourseParams::simple("cl", ctx.authority.pubkey(), 3);
    ctx.create_course(&p);
    let learner = ctx.new_learner();
    ctx.enroll(&learner, "cl");
    let other = ctx.new_learner();

    let mut ix = ixs::complete_lesson("cl", &learner.pubkey(), &ctx.xp_mint, &backend.pubkey(), 1);
    ix.accounts[3] = AccountMeta::new_readonly(other.pubkey(), false); // learner swap -> enrollment 2006
    ix.accounts[6] = AccountMeta::new_readonly(backend.pubkey(), false); // backend un-signed -> 3010

    ctx.h.run_expect_custom(
        "cl: unsigned-backend + learner-swap",
        &[ix],
        &learner,
        &[],
        3010,
    );
}

/// complete_lesson: learner-swap (enrollment seeds 2006, account #3) + wrong
/// xp_mint (Unauthorized 6000, account #6). Both are CONSTRAINT-phase; the
/// earlier-declared account wins => 2006.
#[test]
fn cl_seeds_beats_xp_mint() {
    let mut ctx = Ctx::new();
    let backend = ctx.authority.insecure_clone();
    let p = ixs::CourseParams::simple("cl", ctx.authority.pubkey(), 3);
    ctx.create_course(&p);
    let learner = ctx.new_learner();
    ctx.enroll(&learner, "cl");
    let other = ctx.new_learner();
    let bogus_mint = solana_sdk::pubkey::Pubkey::new_unique();

    let mut ix = ixs::complete_lesson("cl", &learner.pubkey(), &ctx.xp_mint, &backend.pubkey(), 1);
    ix.accounts[3] = AccountMeta::new_readonly(other.pubkey(), false); // enrollment 2006
    ix.accounts[5] = AccountMeta::new(bogus_mint, false); // xp_mint mismatch -> 6000

    ctx.h.run_expect_custom(
        "cl: learner-swap + wrong-xp-mint",
        &[ix],
        &backend,
        &[],
        2006,
    );
}

/// complete_lesson: non-writable enrollment (ConstraintMut 2000, account #3) +
/// wrong xp_mint (Unauthorized 6000, account #6). Both CONSTRAINT-phase; within
/// enrollment linearize is seeds->mut, and mut(#3) precedes the #6 custom => 2000.
#[test]
fn cl_mut_beats_xp_mint() {
    let mut ctx = Ctx::new();
    let backend = ctx.authority.insecure_clone();
    let p = ixs::CourseParams::simple("cl", ctx.authority.pubkey(), 3);
    ctx.create_course(&p);
    let learner = ctx.new_learner();
    ctx.enroll(&learner, "cl");
    let bogus_mint = solana_sdk::pubkey::Pubkey::new_unique();

    let mut ix = ixs::complete_lesson("cl", &learner.pubkey(), &ctx.xp_mint, &backend.pubkey(), 1);
    // enrollment (account #2) demoted to read-only -> ConstraintMut 2000
    ix.accounts[2] = AccountMeta::new_readonly(ixs::enrollment_pda("cl", &learner.pubkey()), false);
    ix.accounts[5] = AccountMeta::new(bogus_mint, false); // xp_mint mismatch -> 6000

    ctx.h.run_expect_custom(
        "cl: nonwritable-enrollment + wrong-xp-mint",
        &[ix],
        &backend,
        &[],
        2000,
    );
}

/// finalize_course: unsigned backend (3010, EXTRACTION on account #9 Signer) +
/// non-writable course (2000, CONSTRAINT on account #2). Extraction wins => 3010.
#[test]
fn finalize_unsigned_backend_beats_course_mut() {
    let mut ctx = Ctx::new();
    let backend = ctx.authority.insecure_clone();
    let creator = ctx.new_learner();
    let p = ixs::CourseParams::simple("ff", creator.pubkey(), 2);
    ctx.create_course(&p);
    let learner = ctx.new_learner();
    ctx.enroll(&learner, "ff");

    let mut ix = ixs::finalize_course(
        "ff",
        &learner.pubkey(),
        &creator.pubkey(),
        &ctx.xp_mint,
        &backend.pubkey(),
    );
    ix.accounts[1] = AccountMeta::new_readonly(ixs::course_pda("ff"), false); // course non-writable -> 2000
    ix.accounts[8] = AccountMeta::new_readonly(backend.pubkey(), false); // backend un-signed -> 3010

    ctx.h.run_expect_custom(
        "finalize: unsigned-backend + nonwritable-course",
        &[ix],
        &learner,
        &[],
        3010,
    );
}

/// create_course: the `course` init account is declared BEFORE `config`, so the
/// init create-CPI runs first. A duplicate course (init fails: AccountAlreadyInUse)
/// by a NON-authority must fail on the init, NOT on `config.has_one` (6000):
/// proves the port did not hoist the cheap has_one check ahead of the init.
#[test]
fn create_course_dup_init_beats_has_one() {
    let mut ctx = Ctx::new();
    let authority = ctx.authority.insecure_clone();
    let p = ixs::CourseParams::simple("dd", authority.pubkey(), 3);
    ctx.create_course(&p); // "dd" now exists

    // Non-authority tries to re-create the existing course.
    let mallory = ctx.new_learner();
    let pm = ixs::CourseParams::simple("dd", mallory.pubkey(), 3);
    let ix = ixs::create_course(&mallory.pubkey(), &pm);
    // Not a clean custom code (system AccountAlreadyInUse); assert both VMs agree.
    ctx.h.run_expect_err(
        "create_course: dup-init + non-authority",
        &[ix],
        &mallory,
        &[],
    );
}

/// award_achievement (15 accounts, receipt `init`): unsigned `asset`
/// (AccountNotSigner 3010, EXTRACTION on account #5) + wrong xp_mint
/// (Unauthorized 6000, CONSTRAINT on account #9). The extraction 3010 must
/// precede ALL constraint-phase work — including the receipt-init create CPI
/// (#3) and the minter constraint (#4) — proving the port defers every
/// constraint until after the full extraction pass even on the init path.
#[test]
fn award_unsigned_asset_beats_constraints() {
    let mut ctx = Ctx::new();
    let authority = ctx.authority.insecure_clone();

    // backend == minter == authority (the initialize default), so the fee-payer
    // signature covers them; `asset` is the one signer we can independently drop.
    let coll_kp = solana_sdk::signature::Keypair::new();
    let ix = ixs::create_achievement_type(
        &authority.pubkey(),
        &authority.pubkey(),
        &coll_kp.pubkey(),
        "ach",
        "Ach",
        "https://x/a",
        0,
        10,
    );
    ctx.h
        .run_ok("mk achievement", &[ix], &authority, &[&coll_kp]);

    let recipient = ctx.new_learner();
    let asset = solana_sdk::signature::Keypair::new();
    let bogus_mint = solana_sdk::pubkey::Pubkey::new_unique();

    let mut ix = ixs::award_achievement(
        "ach",
        &asset.pubkey(),
        &coll_kp.pubkey(),
        &recipient.pubkey(),
        &ctx.xp_mint,
        &authority.pubkey(), // payer
        &authority.pubkey(), // minter
        &authority.pubkey(), // backend_signer
    );
    ix.accounts[4] = AccountMeta::new(asset.pubkey(), false); // asset un-signed -> 3010
    ix.accounts[8] = AccountMeta::new(bogus_mint, false); // xp_mint mismatch -> 6000

    // asset is intentionally NOT in the signer set; authority is the fee payer.
    ctx.h.run_expect_custom(
        "award: unsigned-asset beats init + xp_mint",
        &[ix],
        &authority,
        &[],
        3010,
    );
}

/// REGRESSION (audit finding F-C): a program-owned MinterRole whose Borsh
/// `label` bytes are invalid UTF-8. Anchor's `Account::<MinterRole>::try_from`
/// runs full Borsh `String` deser and rejects with AccountDidNotDeserialize
/// (3003). The pinocchio `MinterRoleOffsets::parse` now UTF-8-validates the
/// label bytes (via `state::validate_utf8`) and rejects with the same 3003, so
/// the two builds CONVERGE. (Before the fix, pinocchio parsed on and the ix
/// succeeded — a documented LOW/unreachable divergence, since register_minter
/// UTF-8-validates the label on the way in and no external actor can inject
/// account bytes on a live cluster. This test locks the convergence in.)
#[test]
fn injected_invalid_utf8_label_now_converges() {
    use solana_sdk::account::Account;
    use solana_sdk::pubkey::Pubkey;

    const ACC_MINTER_ROLE: [u8; 8] = [21, 246, 6, 133, 142, 211, 33, 193];

    let mut ctx = Ctx::new();
    let authority = ctx.authority.insecure_clone();

    let m = Pubkey::new_unique();
    let (pda, bump) = Pubkey::find_program_address(&[b"minter", m.as_ref()], &ixs::program_id());

    // Hand-built MinterRole (label_len = 2, label bytes = 0xFF 0xFF = invalid UTF-8).
    let mut data = vec![0u8; 110];
    data[0..8].copy_from_slice(&ACC_MINTER_ROLE);
    data[8..40].copy_from_slice(m.as_ref());
    data[40..44].copy_from_slice(&2u32.to_le_bytes());
    data[44] = 0xFF;
    data[45] = 0xFF;
    data[62] = 1; // is_active @ 44+2+8+8 = 62
    data[79] = bump; // bump @ 62+1+8+8 = 79
    ctx.h.set_account(
        pda,
        Account {
            lamports: 5_000_000,
            data,
            owner: ixs::program_id(),
            executable: false,
            rent_epoch: 0,
        },
    );

    let ix = ixs::update_minter(&authority.pubkey(), &m, 0, 0);
    // Both builds now reject the corrupt account identically with 3003.
    ctx.h
        .run_expect_custom("utf8-label converges", &[ix], &authority, &[], 3003);
}

/// REGRESSION (audit finding F-B): a program-owned MinterRole whose `label`
/// length prefix is ≥ 65536. Before the fix, `label_len as u16` truncated to a
/// small in-bounds offset and pinocchio ACCEPTED (and update_minter MUTATED)
/// the corrupt account. `read_str_len` now full-width-bounds-checks the body,
/// so pinocchio rejects with AccountDidNotDeserialize (3003) — matching what
/// Anchor's borsh does for any length that overruns the account (for lengths in
/// (account_len, 32768); ≥ 32768 is the separately-documented heap-abort delta).
#[test]
fn injected_truncating_label_len_now_rejected() {
    use solana_sdk::account::Account;
    use solana_sdk::pubkey::Pubkey;

    const ACC_MINTER_ROLE: [u8; 8] = [21, 246, 6, 133, 142, 211, 33, 193];

    let mut ctx = Ctx::new();
    let authority = ctx.authority.insecure_clone();

    let m = Pubkey::new_unique();
    let (pda, _bump) = Pubkey::find_program_address(&[b"minter", m.as_ref()], &ixs::program_id());

    // label_len = 200 (overruns the 110-byte account, but < 32768 so Anchor's
    // borsh returns a clean 3003 rather than a heap abort).
    let mut data = vec![0u8; 110];
    data[0..8].copy_from_slice(&ACC_MINTER_ROLE);
    data[8..40].copy_from_slice(m.as_ref());
    data[40..44].copy_from_slice(&200u32.to_le_bytes());
    ctx.h.set_account(
        pda,
        Account {
            lamports: 5_000_000,
            data,
            owner: ixs::program_id(),
            executable: false,
            rent_epoch: 0,
        },
    );

    let ix = ixs::update_minter(&authority.pubkey(), &m, 0, 0);
    ctx.h.run_expect_custom(
        "truncating label_len rejected",
        &[ix],
        &authority,
        &[],
        3003,
    );
}

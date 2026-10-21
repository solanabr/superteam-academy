//! Regression tests for the pre-deploy audit fixes (docs/PRE-DEPLOY-AUDIT.md):
//! H-1 course-generation replay guard, M-1 unenroll lock, I-1 mandatory
//! backend-role retirement. Pinocchio-only (the Anchor oracle shared these
//! bugs and has been retired).

use onchain_academy_differential::ixs::{self, CourseParams};
use onchain_academy_differential::scenario::Ctx;
use solana_sdk::pubkey::Pubkey;
use solana_sdk::signature::{Keypair, Signer};

const STALE_ENROLLMENT: u32 = 6034;
const OLD_MINTER_ROLE_MISSING: u32 = 6035;
const ENROLLMENT_IN_PROGRESS: u32 = 6036;
const COURSE_HAS_ENROLLMENTS: u32 = 6037;

/// H-1: a course id closed and recreated gets a fresh generation, so an
/// enrollment left over from the prior generation can neither finalize nor
/// complete lessons against the new course — and the learner can re-enroll
/// cleanly into the new generation.
///
/// `close_course` now refuses a course with enrollments (6037), so a live
/// enrollment can no longer be orphaned this way; the generation check is the
/// backstop for enrollments orphaned before that rule. The test models that
/// state by zeroing `total_enrollments` before the close.
#[test]
fn h1_recreated_course_rejects_stale_enrollment() {
    let mut ctx = Ctx::new();
    let authority = ctx.authority.insecure_clone();
    ctx.create_course(&CourseParams::simple("gen", authority.pubkey(), 1));

    let learner = ctx.new_learner();
    ctx.enroll(&learner, "gen");
    ctx.complete_lessons(&learner, "gen", 1); // one lesson done, not finalized

    // The program refuses to close it out from under the live enrollment.
    let close = ixs::close_course(&authority.pubkey(), "gen");
    ctx.h.run_expect_custom(
        "close_course with an enrollment",
        &[close],
        &authority,
        &[],
        COURSE_HAS_ENROLLMENTS,
    );

    // Pre-rule state: the course was closed anyway and recreated at the same
    // PDA (fresh generation).
    ctx.set_course_total_enrollments("gen", 0);
    let close = ixs::close_course(&authority.pubkey(), "gen");
    ctx.h
        .run_ok("close_course (pre-rule state)", &[close], &authority, &[]);
    ctx.create_course(&CourseParams::simple("gen", authority.pubkey(), 1));

    // The stale enrollment (prior generation) can no longer earn on the new
    // course — both the mint path and the finalize path reject it as stale.
    let backend = ctx.authority.insecure_clone();
    let cl = ixs::complete_lesson("gen", &learner.pubkey(), &ctx.xp_mint, &backend.pubkey(), 0);
    ctx.h.run_expect_custom(
        "stale complete_lesson",
        &[cl],
        &backend,
        &[],
        STALE_ENROLLMENT,
    );
    let fin = ixs::finalize_course(
        "gen",
        &learner.pubkey(),
        &authority.pubkey(),
        &ctx.xp_mint,
        &backend.pubkey(),
    );
    ctx.h
        .run_expect_custom("stale finalize", &[fin], &backend, &[], STALE_ENROLLMENT);

    // The learner can re-enroll: the stale enrollment is re-initialised in
    // place at the new generation, and completing a lesson then works.
    ctx.enroll(&learner, "gen");
    let cl = ixs::complete_lesson("gen", &learner.pubkey(), &ctx.xp_mint, &backend.pubkey(), 0);
    ctx.h
        .run_ok("re-enrolled complete_lesson", &[cl], &backend, &[]);
}

/// M-1: once a learner has completed any lesson, the enrollment cannot be
/// closed — closing then re-enrolling would otherwise reset the bitmap and
/// re-mint the XP.
#[test]
fn m1_cannot_unenroll_after_starting_lessons() {
    let mut ctx = Ctx::new();
    let authority = ctx.authority.insecure_clone();
    ctx.create_course(&CourseParams::simple("m", authority.pubkey(), 3));

    let learner = ctx.new_learner();
    ctx.enroll(&learner, "m");
    ctx.complete_lessons(&learner, "m", 1); // started, not finalized

    // Even past the cooldown, a started enrollment refuses to close (6036).
    ctx.h.warp(86_401);
    let close = ixs::close_enrollment("m", &learner.pubkey());
    ctx.h.run_expect_custom(
        "close started enrollment",
        &[close],
        &learner,
        &[],
        ENROLLMENT_IN_PROGRESS,
    );
}

/// M-1 boundary: an enrollment with zero completed lessons still closes after
/// the cooldown (the guard is specifically about started enrollments).
#[test]
fn m1_unstarted_enrollment_still_closes() {
    let mut ctx = Ctx::new();
    let authority = ctx.authority.insecure_clone();
    ctx.create_course(&CourseParams::simple("m0", authority.pubkey(), 3));

    let learner = ctx.new_learner();
    ctx.enroll(&learner, "m0");
    ctx.h.warp(86_401);
    let close = ixs::close_enrollment("m0", &learner.pubkey());
    ctx.h
        .run_ok("close unstarted enrollment", &[close], &learner, &[]);
}

/// I-1: rotating the backend signer requires the previous backend's canonical
/// minter-role PDA — omitting it, or passing a non-canonical account, fails.
#[test]
fn i1_backend_rotation_requires_canonical_old_role() {
    let mut ctx = Ctx::new();
    let authority = ctx.authority.insecure_clone();
    let new_backend = Keypair::new();

    // Omitted entirely -> 6035.
    let ix = ixs::update_config(
        &authority.pubkey(),
        Some(new_backend.pubkey()),
        None,
        None,
        None,
    );
    ctx.h.run_expect_custom(
        "rotate without old role",
        &[ix],
        &authority,
        &[],
        OLD_MINTER_ROLE_MISSING,
    );

    // A non-canonical account (not ["minter", old_backend]) -> 6035.
    let ix = ixs::update_config(
        &authority.pubkey(),
        Some(new_backend.pubkey()),
        None,
        None,
        Some(Pubkey::new_unique()),
    );
    ctx.h.run_expect_custom(
        "rotate with wrong old role",
        &[ix],
        &authority,
        &[],
        OLD_MINTER_ROLE_MISSING,
    );

    // The canonical old role (authority's) rotates successfully.
    let ix = ixs::update_config(
        &authority.pubkey(),
        Some(new_backend.pubkey()),
        None,
        None,
        Some(ixs::minter_pda(&authority.pubkey())),
    );
    ctx.h
        .run_ok("rotate with canonical old role", &[ix], &authority, &[]);
}

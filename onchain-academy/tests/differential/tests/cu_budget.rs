//! CU budget drift gate (feeds #141 [G-4]).
//!
//! Measures per-instruction `compute_units_consumed` for all 18 program
//! instructions against the pinocchio `.so`, on the litesvm 0.12 (Agave 3.x)
//! runtime this suite already uses — deterministic and crash-free on the CI
//! runner, unlike the litesvm-JS 0.3.3 harness (`tests/cu-measurement.ts`),
//! whose Linux native addon is memory-unsafe and must never be CI-wired.
//!
//! The measured numbers are asserted against the committed baseline
//! `tests/CU_BASELINE.rust.md`. Any drift — a program change OR a toolchain
//! bump — fails this test and, with it, the `Integration (pinocchio · LiteSVM)`
//! CI job, forcing a deliberate baseline regeneration + a review-doc touch.
//!
//! On mismatch the test prints a full expected-vs-actual table AND the complete
//! ready-to-commit baseline, so a maintainer can lift the correct numbers
//! straight from the failing CI log. To accept new numbers locally, run:
//!
//!   CU_BASELINE_REGEN=1 cargo test --manifest-path tests/differential/Cargo.toml \
//!     --test cu_budget
//!
//! then commit the regenerated baseline and update docs/CU-BUDGET-REVIEW.md.

use onchain_academy_differential::harness::Harness;
use onchain_academy_differential::ixs::{self, ata, CourseParams};
use solana_sdk::pubkey::Pubkey;
use solana_sdk::signature::Keypair;
use solana_sdk::signer::keypair::keypair_from_seed;
use solana_sdk::signer::Signer;

const SOL: u64 = 1_000_000_000;

/// Deterministic keypair from a fixed 1-byte seed. CU consumption depends on
/// account addresses — the program derives PDAs on-chain with a canonical-bump
/// search, and the number of failed bump iterations (each a ~1500 CU sha256
/// syscall) varies with the address. Random `Keypair::new()` would make the
/// measurement non-deterministic; fixed seeds pin every address, hence every
/// bump, hence every CU count. ed25519 seed→keypair derivation is standard, so
/// the addresses are identical across solana-keypair versions (local vs CI).
fn kp(seed: u8) -> Keypair {
    keypair_from_seed(&[seed; 32]).unwrap()
}

/// Path to the committed baseline, one level up from this crate (alongside the
/// litesvm-JS baseline `CU_BASELINE.pinocchio.md`).
fn baseline_path() -> String {
    format!("{}/../CU_BASELINE.rust.md", env!("CARGO_MANIFEST_DIR"))
}

/// Create the Token-2022 XP ATA for `owner` (idempotent), paid by `payer`.
fn create_xp_ata(h: &mut Harness, payer: &Keypair, owner: &Pubkey, mint: &Pubkey) {
    h.run_ok(
        "create_xp_ata",
        &[ixs::create_ata_idempotent(&payer.pubkey(), owner, mint)],
        payer,
        &[],
    );
}

#[test]
fn cu_budget_within_baseline() {
    let mut h = Harness::new();
    let authority = kp(1);
    h.airdrop(&authority.pubkey(), 500 * SOL);
    let xp_mint = kp(2);

    // Collected in the canonical row order (matches the review-doc table).
    // `update_config` contributes two rows (pause + resume); every other
    // instruction contributes one — 19 rows across 18 instructions.
    let mut rows: Vec<(String, u64)> = Vec::new();
    let mut m = |name: &str, cu: u64| rows.push((name.to_string(), cu));

    // 1. initialize — creates Config PDA + the Token-2022 XP mint (Config is the
    //    mint authority) and auto-registers the authority as the backend minter.
    m(
        "initialize",
        h.run_cu(
            "initialize",
            &[ixs::initialize(&xp_mint.pubkey(), &authority.pubkey())],
            &authority,
            &[&xp_mint],
        ),
    );
    // finalize_course validates both token accounts, so the default creator
    // (the authority) needs an XP ATA.
    create_xp_ata(&mut h, &authority, &authority.pubkey(), &xp_mint.pubkey());

    // 2 & 3. update_config — pause then resume (two rows).
    m(
        "update_config (pause)",
        h.run_cu(
            "update_config pause",
            &[ixs::update_config(
                &authority.pubkey(),
                None,
                Some(true),
                None,
                None,
            )],
            &authority,
            &[],
        ),
    );
    m(
        "update_config (resume)",
        h.run_cu(
            "update_config resume",
            &[ixs::update_config(
                &authority.pubkey(),
                None,
                Some(false),
                None,
                None,
            )],
            &authority,
            &[],
        ),
    );

    // 4. create_course — the main course, 3 lessons.
    let course = CourseParams::simple("cu", authority.pubkey(), 3);
    m(
        "create_course",
        h.run_cu(
            "create_course",
            &[ixs::create_course(&authority.pubkey(), &course)],
            &authority,
            &[],
        ),
    );

    // 5. update_course — bump xp_per_lesson.
    m(
        "update_course",
        h.run_cu(
            "update_course",
            &[ixs::update_course(
                &authority.pubkey(),
                "cu",
                None,
                None,
                Some(60),
                None,
                None,
                None,
            )],
            &authority,
            &[],
        ),
    );

    // 6-8. minter lifecycle on a fresh (non-backend) minter.
    let minter = kp(3);
    m(
        "register_minter",
        h.run_cu(
            "register_minter",
            &[ixs::register_minter(
                &authority.pubkey(),
                &authority.pubkey(),
                &minter.pubkey(),
                "cu-minter",
                1_000,
                100_000,
            )],
            &authority,
            &[],
        ),
    );
    m(
        "update_minter",
        h.run_cu(
            "update_minter",
            &[ixs::update_minter(
                &authority.pubkey(),
                &minter.pubkey(),
                2_000,
                200_000,
            )],
            &authority,
            &[],
        ),
    );
    m(
        "revoke_minter",
        h.run_cu(
            "revoke_minter",
            &[ixs::revoke_minter(&authority.pubkey(), &minter.pubkey())],
            &authority,
            &[],
        ),
    );

    // 9. enroll — learner1 on the main course.
    let learner1 = kp(4);
    h.airdrop(&learner1.pubkey(), 50 * SOL);
    create_xp_ata(&mut h, &authority, &learner1.pubkey(), &xp_mint.pubkey());
    m(
        "enroll",
        h.run_cu(
            "enroll",
            &[ixs::enroll(&learner1.pubkey(), "cu", None)],
            &learner1,
            &[],
        ),
    );

    // 10. complete_lesson — lesson 0 measured; 1 and 2 completed as setup so the
    //     enrollment can be finalized next.
    m(
        "complete_lesson",
        h.run_cu(
            "complete_lesson",
            &[ixs::complete_lesson(
                "cu",
                &learner1.pubkey(),
                &xp_mint.pubkey(),
                &authority.pubkey(),
                0,
            )],
            &authority,
            &[],
        ),
    );
    for lesson in 1u8..3 {
        h.run_ok(
            "complete_lesson_setup",
            &[ixs::complete_lesson(
                "cu",
                &learner1.pubkey(),
                &xp_mint.pubkey(),
                &authority.pubkey(),
                lesson,
            )],
            &authority,
            &[],
        );
    }

    // 11. finalize_course.
    m(
        "finalize_course",
        h.run_cu(
            "finalize_course",
            &[ixs::finalize_course(
                "cu",
                &learner1.pubkey(),
                &authority.pubkey(),
                &xp_mint.pubkey(),
                &authority.pubkey(),
            )],
            &authority,
            &[],
        ),
    );

    // 12. reward_xp — direct mint via the auto-registered backend minter role.
    m(
        "reward_xp",
        h.run_cu(
            "reward_xp",
            &[ixs::reward_xp(
                &authority.pubkey(),
                &authority.pubkey(),
                &xp_mint.pubkey(),
                &ata(&learner1.pubkey(), &xp_mint.pubkey()),
                100,
                "cu reward",
            )],
            &authority,
            &[],
        ),
    );

    // 13. close_enrollment — a separate incomplete enrollment, past the 24h
    //     unenroll cooldown (finalized enrollments are replay-guarded).
    h.run_ok(
        "create_close_course",
        &[ixs::create_course(
            &authority.pubkey(),
            &CourseParams::simple("cu-close", authority.pubkey(), 1),
        )],
        &authority,
        &[],
    );
    let close_learner = kp(5);
    h.airdrop(&close_learner.pubkey(), 50 * SOL);
    h.run_ok(
        "enroll_close",
        &[ixs::enroll(&close_learner.pubkey(), "cu-close", None)],
        &close_learner,
        &[],
    );
    h.warp(86_401); // advance past the 24h unenroll cooldown
    m(
        "close_enrollment",
        h.run_cu(
            "close_enrollment",
            &[ixs::close_enrollment("cu-close", &close_learner.pubkey())],
            &close_learner,
            &[],
        ),
    );

    // 14. create_achievement_type — creates the mpl_core collection via CPI.
    let ach_collection = kp(6);
    m(
        "create_achievement_type",
        h.run_cu(
            "create_achievement_type",
            &[ixs::create_achievement_type(
                &authority.pubkey(),
                &authority.pubkey(),
                &ach_collection.pubkey(),
                "cu-ach",
                "CU Achievement",
                "https://arweave.net/cu-ach",
                100,
                200,
            )],
            &authority,
            &[&ach_collection],
        ),
    );

    // 15. award_achievement — mints the mpl_core asset + 200 XP to the recipient.
    let recipient = kp(7);
    h.airdrop(&recipient.pubkey(), 50 * SOL);
    create_xp_ata(&mut h, &authority, &recipient.pubkey(), &xp_mint.pubkey());
    let ach_asset = kp(8);
    m(
        "award_achievement",
        h.run_cu(
            "award_achievement",
            &[ixs::award_achievement(
                "cu-ach",
                &ach_asset.pubkey(),
                &ach_collection.pubkey(),
                &recipient.pubkey(),
                &xp_mint.pubkey(),
                &authority.pubkey(),
                &authority.pubkey(),
                &authority.pubkey(),
            )],
            &authority,
            &[&ach_asset],
        ),
    );

    // 16. deactivate_achievement_type — after the award above.
    m(
        "deactivate_achievement_type",
        h.run_cu(
            "deactivate_achievement_type",
            &[ixs::deactivate_achievement_type(
                &authority.pubkey(),
                "cu-ach",
            )],
            &authority,
            &[],
        ),
    );

    // 17 & 18. credential flow: a bootstrapped mpl_core collection (update
    //          authority = Config PDA), a course referencing it, and a finalized
    //          enrollment. issue then upgrade the same asset.
    let cred_collection = kp(9);
    h.run_ok(
        "bootstrap_cred_collection",
        &[ixs::mpl_create_collection(
            &cred_collection.pubkey(),
            &authority.pubkey(),
            "CU Track Credentials",
            "https://arweave.net/cu-collection",
        )],
        &authority,
        &[&cred_collection],
    );
    let mut cred_course = CourseParams::simple("cu-cred", authority.pubkey(), 1);
    cred_course.collection = Some(cred_collection.pubkey());
    h.run_ok(
        "create_cred_course",
        &[ixs::create_course(&authority.pubkey(), &cred_course)],
        &authority,
        &[],
    );
    let cred_learner = kp(10);
    h.airdrop(&cred_learner.pubkey(), 50 * SOL);
    create_xp_ata(
        &mut h,
        &authority,
        &cred_learner.pubkey(),
        &xp_mint.pubkey(),
    );
    h.run_ok(
        "enroll_cred",
        &[ixs::enroll(&cred_learner.pubkey(), "cu-cred", None)],
        &cred_learner,
        &[],
    );
    h.run_ok(
        "complete_cred_lesson",
        &[ixs::complete_lesson(
            "cu-cred",
            &cred_learner.pubkey(),
            &xp_mint.pubkey(),
            &authority.pubkey(),
            0,
        )],
        &authority,
        &[],
    );
    h.run_ok(
        "finalize_cred",
        &[ixs::finalize_course(
            "cu-cred",
            &cred_learner.pubkey(),
            &authority.pubkey(),
            &xp_mint.pubkey(),
            &authority.pubkey(),
        )],
        &authority,
        &[],
    );
    let cred_asset = kp(11);
    m(
        "issue_credential",
        h.run_cu(
            "issue_credential",
            &[ixs::issue_credential(
                "cu-cred",
                &cred_learner.pubkey(),
                &cred_asset.pubkey(),
                &cred_collection.pubkey(),
                &authority.pubkey(),
                &authority.pubkey(),
                "CU Track Cred",
                "https://arweave.net/cu-c1",
                1,
                150,
            )],
            &authority,
            &[&cred_asset],
        ),
    );
    m(
        "upgrade_credential",
        h.run_cu(
            "upgrade_credential",
            &[ixs::upgrade_credential(
                "cu-cred",
                &cred_learner.pubkey(),
                &cred_asset.pubkey(),
                &cred_collection.pubkey(),
                &authority.pubkey(),
                &authority.pubkey(),
                "CU Track Cred L2",
                "https://arweave.net/cu-c2",
                2,
                400,
            )],
            &authority,
            &[],
        ),
    );

    // 19. close_course — a fresh course with no enrollments.
    h.run_ok(
        "create_closeable_course",
        &[ixs::create_course(
            &authority.pubkey(),
            &CourseParams::simple("cu-cc", authority.pubkey(), 2),
        )],
        &authority,
        &[],
    );
    m(
        "close_course",
        h.run_cu(
            "close_course",
            &[ixs::close_course(&authority.pubkey(), "cu-cc")],
            &authority,
            &[],
        ),
    );

    assert_eq!(
        rows.len(),
        19,
        "expected 19 measured rows (18 instructions)"
    );

    // Regenerate the baseline on demand (CU_BASELINE_REGEN=1) instead of asserting.
    if std::env::var("CU_BASELINE_REGEN").is_ok() {
        std::fs::write(baseline_path(), render_baseline(&rows)).expect("write baseline");
        eprintln!("regenerated {}", baseline_path());
        return;
    }

    let expected = parse_baseline(
        &std::fs::read_to_string(baseline_path()).unwrap_or_else(|e| {
            panic!(
                "cannot read {} ({e}). Generate it with CU_BASELINE_REGEN=1.",
                baseline_path()
            )
        }),
    );

    if expected != rows {
        // Full expected-vs-actual table + the ready-to-commit baseline, so the
        // correct numbers can be lifted straight from the failing CI log.
        let exp: std::collections::HashMap<_, _> = expected.iter().cloned().collect();
        let mut out = String::from(
            "\nCU BUDGET DRIFT DETECTED (feeds #141 [G-4])\n\n\
             instruction                     expected     actual      delta\n\
             ------------------------------ --------- ---------- ----------\n",
        );
        for (name, actual) in &rows {
            let e = exp.get(name).copied();
            let (exp_s, delta_s) = match e {
                Some(ev) => (ev.to_string(), format!("{:+}", *actual as i64 - ev as i64)),
                None => ("(new)".to_string(), "".to_string()),
            };
            out.push_str(&format!(
                "{:<30} {:>9} {:>10} {:>10}\n",
                name, exp_s, actual, delta_s
            ));
        }
        out.push_str(
            "\nTo accept: run with CU_BASELINE_REGEN=1 and commit \
             tests/CU_BASELINE.rust.md, then update docs/CU-BUDGET-REVIEW.md.\n\
             Ready-to-commit baseline (lift verbatim into tests/CU_BASELINE.rust.md):\n\n",
        );
        out.push_str(&render_baseline(&rows));
        panic!("{out}");
    }
}

/// Parse the markdown table into ordered (name, cu) rows. A data row is
/// `| name | number |`; header/separator rows (non-numeric second cell) are
/// skipped. Mirrors the litesvm-JS baseline format so one doc-generation script
/// parses either file.
fn parse_baseline(text: &str) -> Vec<(String, u64)> {
    let mut rows = Vec::new();
    for line in text.lines() {
        let parts: Vec<&str> = line.split('|').collect();
        if parts.len() != 4 {
            continue;
        }
        let name = parts[1].trim();
        if let Ok(cu) = parts[2].trim().parse::<u64>() {
            rows.push((name.to_string(), cu));
        }
    }
    rows
}

/// Render the baseline markdown (header + one row per measurement).
fn render_baseline(rows: &[(String, u64)]) -> String {
    let mut s = String::from(
        "# Per-instruction Compute-Unit (CU) Baseline — Rust differential harness (#141 / G-4)\n\n\
         Captured by the litesvm 0.12 (Agave 3.x) Rust harness \
         (`tests/differential/tests/cu_budget.rs`) against a release SBF build of\n\
         the pinocchio program. Deterministic and crash-free on the CI runner — the\n\
         drift gate enforces it in the `Integration (pinocchio · LiteSVM)` job.\n\n\
         Regenerate: `CU_BASELINE_REGEN=1 cargo test --manifest-path \
         tests/differential/Cargo.toml --test cu_budget`.\n\n\
         | Instruction                 |    CU |\n\
         | --------------------------- | ----: |\n",
    );
    for (name, cu) in rows {
        s.push_str(&format!("| {name:<27} | {cu:>5} |\n"));
    }
    s.push_str(&format!(
        "\n**Measured {} transactions across all 18 instructions.** `update_config` is\n\
         measured for both pause and resume; every other instruction contributes one row.\n",
        rows.len()
    ));
    s
}

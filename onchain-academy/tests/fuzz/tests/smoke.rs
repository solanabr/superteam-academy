//! The preflight smoke as a unit test: `cargo test` fails locally for the same
//! reason the nightly would, instead of the fuzzer reporting phantom coverage.

use onchain_academy_fuzz::{preflight, Session, Stats};

#[test]
fn preflight_smoke_passes() {
    if let Err(detail) = preflight(1) {
        panic!("preflight failed: {detail}");
    }
}

/// A short seeded run must replay identically.
#[test]
fn same_seed_replays_the_same_sequence() {
    let run = |seed: u64| {
        let mut s = Session::new(seed);
        s.init_iteration().expect("init");
        // Long enough to draw every flow, including the rare recreate, and the
        // per-flow clock warp — all of which must stay seed-derived.
        for _ in 0..40 {
            s.step().expect("step");
        }
        (s.sequence, s.stats)
    };
    let (seq_a, stats_a) = run(42);
    let (seq_b, stats_b) = run(42);
    assert_eq!(seq_a, seq_b);
    assert_eq!(format!("{stats_a:?}"), format!("{stats_b:?}"));
    assert!(
        seq_a.iter().any(|s| s.starts_with("warp(+")),
        "the clock never moved"
    );
    assert!(
        seq_a.iter().any(|s| s.starts_with("hostile(")),
        "the hostile account swaps never ran"
    );
}

/// Every flow must reach the program's success path. Without this a harness
/// whose transactions are all rejected still reports millions of clean
/// iterations — which is exactly what the Trident nightly did for seven weeks.
#[test]
fn flows_reach_their_success_paths() {
    let mut stats = Stats::default();
    for seed in 0..12u64 {
        let mut s = Session::new(seed);
        if !s.init_iteration().expect("init") {
            continue;
        }
        for _ in 0..40 {
            s.step().expect("step");
        }
        stats.merge(&s.stats);
    }
    assert!(stats.enrollments > 0, "no enrollment succeeded: {stats:?}");
    assert!(
        stats.lessons_completed > 0,
        "no complete_lesson succeeded: {stats:?}"
    );
    assert!(stats.finalizations > 0, "no finalize succeeded: {stats:?}");
    assert!(
        stats.unenrollments > 0,
        "no close_enrollment succeeded: {stats:?}"
    );
    assert!(
        stats.course_recreations > 0,
        "no course recreate succeeded: {stats:?}"
    );
}

/// The hostile account sets must actually be sent, and every one of them must
/// come back rejected. `flow_hostile_account` crashes the run on acceptance, so
/// reaching this assertion at all means none was accepted; the count is what
/// guards against the swaps quietly becoming unreachable.
#[test]
fn hostile_account_swaps_are_rejected() {
    let mut stats = Stats::default();
    for seed in 0..12u64 {
        let mut s = Session::new(seed);
        if !s.init_iteration().expect("init") {
            continue;
        }
        for _ in 0..40 {
            s.step().expect("step");
        }
        stats.merge(&s.stats);
    }
    assert!(
        stats.hostile_total() > 0,
        "no hostile account set was ever sent: {stats:?}"
    );
    // Each swap defeats a different check, so a single code dominating the
    // histogram means the others stopped being exercised.
    assert!(
        stats.hostile_rejections.len() > 1,
        "hostile swaps only ever hit one check: {}",
        stats.hostile_summary()
    );
}

/// The two branches the fixed clock made unreachable. Both are pure rejections,
/// so they only show up if the clock moves (6008) and if a course generation is
/// superseded (6034) — a regression on either silently deletes coverage.
#[test]
fn time_dependent_branches_are_reached() {
    let mut stats = Stats::default();
    for seed in 0..12u64 {
        let mut s = Session::new(seed);
        if !s.init_iteration().expect("init") {
            continue;
        }
        for _ in 0..40 {
            s.step().expect("step");
        }
        stats.merge(&s.stats);
    }
    assert!(
        stats.cooldown_rejections > 0,
        "UnenrollCooldown (6008) never reached: {stats:?}"
    );
    assert!(
        stats.stale_rejections > 0,
        "StaleEnrollment (6034) never reached: {stats:?}"
    );
}

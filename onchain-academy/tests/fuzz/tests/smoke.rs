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
        for _ in 0..8 {
            s.step().expect("step");
        }
        s.sequence
    };
    assert_eq!(run(42), run(42));
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
        stats.merge(s.stats);
    }
    assert!(stats.enrollments > 0, "no enrollment succeeded: {stats:?}");
    assert!(
        stats.lessons_completed > 0,
        "no complete_lesson succeeded: {stats:?}"
    );
    assert!(stats.finalizations > 0, "no finalize succeeded: {stats:?}");
}

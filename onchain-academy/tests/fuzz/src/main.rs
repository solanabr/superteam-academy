//! Nightly fuzz driver for the `onchain_academy` program.
//!
//!   cargo run --release --bin fuzz -- [iterations] [flows_per_iteration]
//!
//! Env:
//!   FUZZ_SEED          u64 master seed (default: wall-clock nanos, printed)
//!   FUZZ_MAX_SECONDS   wall-clock budget; stops cleanly when reached
//!   FUZZ_CRASH_DIR     where crash files are written (default: ./crashes)
//!   FUZZ_PRINT_SEQUENCE=1  dump every iteration's instruction sequence (replay
//!                          aid; also how the determinism check is run)
//!
//! Exit codes: 0 clean, 98 preflight smoke failed, 99 crash (invariant
//! violation or unexpected program error). CI additionally treats 124/143 from
//! `timeout` as a clean full-window run.

use onchain_academy_fuzz::{preflight, Session, Stats, EXIT_CRASH, EXIT_PREFLIGHT};
use rand::rngs::StdRng;
use rand::{Rng, SeedableRng};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

fn env_u64(key: &str) -> Option<u64> {
    std::env::var(key).ok().and_then(|v| v.parse().ok())
}

fn main() {
    let mut args = std::env::args().skip(1);
    let iterations: u64 = args.next().and_then(|a| a.parse().ok()).unwrap_or(1_000);
    let flows_per_iteration: u64 = args.next().and_then(|a| a.parse().ok()).unwrap_or(30);

    let seed = env_u64("FUZZ_SEED").unwrap_or_else(|| {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos() as u64
    });
    let budget = env_u64("FUZZ_MAX_SECONDS").map(Duration::from_secs);
    let crash_dir = std::env::var("FUZZ_CRASH_DIR").unwrap_or_else(|_| "crashes".to_string());
    let print_sequence = std::env::var("FUZZ_PRINT_SEQUENCE").is_ok_and(|v| v == "1");

    println!("seed: {seed}   (replay with FUZZ_SEED={seed})");
    println!("iterations: {iterations}, flows per iteration: {flows_per_iteration}");
    if let Some(b) = budget {
        println!("wall-clock budget: {}s", b.as_secs());
    }

    // Preflight: prove the program actually executes on this runtime before
    // claiming any coverage.
    if let Err(detail) = preflight(seed) {
        eprintln!("PREFLIGHT SMOKE FAILED — the program did not execute; no fuzzing happened.");
        eprintln!("{detail}");
        std::process::exit(EXIT_PREFLIGHT);
    }
    println!("preflight smoke: initialize succeeded");

    let started = Instant::now();
    let mut master = StdRng::seed_from_u64(seed);
    let mut done = 0u64;
    let mut stats = Stats::default();

    for iteration in 0..iterations {
        if budget.is_some_and(|b| started.elapsed() >= b) {
            println!("wall-clock budget reached");
            break;
        }
        let iteration_seed: u64 = master.gen();
        let mut session = Session::new(iteration_seed);

        let result = session.init_iteration().and_then(|usable| {
            if !usable {
                return Ok(());
            }
            for _ in 0..flows_per_iteration {
                session.step()?;
            }
            Ok(())
        });

        if let Err(crash) = result {
            let report = format!(
                "seed: {seed}\niteration: {iteration}\niteration seed: {iteration_seed}\n\
                 finding: {} — {}\n\ninstruction sequence:\n{}\n\nprogram logs:\n{}\n",
                crash.kind,
                crash.detail,
                session
                    .sequence
                    .iter()
                    .enumerate()
                    .map(|(i, s)| format!("  {i:>4}. {s}"))
                    .collect::<Vec<_>>()
                    .join("\n"),
                crash.logs.join("\n"),
            );
            eprintln!("CRASH\n{report}");
            let path = format!("{crash_dir}/crash-{seed}-{iteration}.txt");
            match std::fs::create_dir_all(&crash_dir).and_then(|_| std::fs::write(&path, &report)) {
                Ok(()) => eprintln!("crash written to {path}"),
                Err(e) => eprintln!("could not write {path}: {e}"),
            }
            std::process::exit(EXIT_CRASH);
        }

        if print_sequence {
            println!("--- iteration {iteration} (seed {iteration_seed})");
            for step in &session.sequence {
                println!("  {step}");
            }
        }
        stats.merge(&session.stats);
        done = iteration + 1;
        if done.is_multiple_of(100) {
            println!(
                "{done} iterations, {:.0}s elapsed",
                started.elapsed().as_secs_f64()
            );
        }
    }

    println!(
        "clean: {done} iterations in {:.1}s (seed {seed})",
        started.elapsed().as_secs_f64()
    );
    println!(
        "coverage: {} transactions, {} enrollments, {} lessons completed, {} finalizations, \
         {} unenrollments, {} course recreations",
        stats.transactions,
        stats.enrollments,
        stats.lessons_completed,
        stats.finalizations,
        stats.unenrollments,
        stats.course_recreations
    );
    println!(
        "time-dependent rejections: {} UnenrollCooldown (6008), {} StaleEnrollment (6034)",
        stats.cooldown_rejections, stats.stale_rejections
    );
    println!(
        "hostile account swaps rejected: {} ({})",
        stats.hostile_total(),
        stats.hostile_summary()
    );
}

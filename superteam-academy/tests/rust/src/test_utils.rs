/// Pure unit tests for bitmap math, streak logic, and daily XP cap logic.
///
/// The actual `update_streak` and `check_and_update_daily_xp` functions live in the
/// program crate and depend on `Clock::get()` (sysvar), so they cannot be called
/// outside a runtime. We re-implement the pure arithmetic here to verify correctness,
/// then integration tests (test_enrollment, test_completion) exercise the real code
/// paths through LiteSVM.

// ---------- Bitmap helpers (mirrors complete_lesson inline logic) ----------

fn bitmap_set(flags: &mut [u64; 4], index: u8) {
    let word = (index / 64) as usize;
    let bit = index % 64;
    flags[word] |= 1u64 << bit;
}

fn bitmap_is_set(flags: &[u64; 4], index: u8) -> bool {
    let word = (index / 64) as usize;
    let bit = index % 64;
    flags[word] & (1u64 << bit) != 0
}

fn bitmap_count_ones(flags: &[u64; 4]) -> u32 {
    flags.iter().map(|w| w.count_ones()).sum()
}

// ---------- Streak logic (mirrors utils::update_streak) ----------

struct StreakState {
    current_streak: u16,
    longest_streak: u16,
    last_activity_ts: i64,
}

fn update_streak(state: &mut StreakState, now: i64) {
    let today = (now / 86400) as u64;
    let last_day = (state.last_activity_ts / 86400) as u64;

    if today > last_day {
        let gap = today - last_day - 1;
        if gap == 0 {
            state.current_streak = state.current_streak.checked_add(1).unwrap();
        } else {
            state.current_streak = 1;
        }
        if state.current_streak > state.longest_streak {
            state.longest_streak = state.current_streak;
        }
        state.last_activity_ts = now;
    }
    // same-day: no-op
}

fn is_milestone(streak: u16) -> bool {
    [7u16, 30, 100, 365].contains(&streak)
}

// ---------- Daily XP logic (mirrors utils::check_and_update_daily_xp) ----------

struct DailyXpState {
    xp_earned_today: u32,
    last_xp_day: u16,
}

/// Returns Ok(new_total) or Err("exceeded") / Err("overflow").
fn check_daily_xp(
    state: &mut DailyXpState,
    max_daily_xp: u32,
    xp_amount: u32,
    now: i64,
) -> Result<u32, &'static str> {
    let today = (now / 86400) as u16;
    if today > state.last_xp_day {
        state.xp_earned_today = 0;
        state.last_xp_day = today;
    }
    let new_total = state
        .xp_earned_today
        .checked_add(xp_amount)
        .ok_or("overflow")?;
    if new_total > max_daily_xp {
        return Err("exceeded");
    }
    state.xp_earned_today = new_total;
    Ok(new_total)
}

// ======================== TESTS ========================

#[test]
fn bitmap_set_and_check() {
    let mut flags = [0u64; 4];
    bitmap_set(&mut flags, 0);
    assert!(bitmap_is_set(&flags, 0));
    assert!(!bitmap_is_set(&flags, 1));
    assert_eq!(bitmap_count_ones(&flags), 1);
}

#[test]
fn bitmap_set_multiple_bits() {
    let mut flags = [0u64; 4];
    bitmap_set(&mut flags, 0);
    bitmap_set(&mut flags, 63);
    bitmap_set(&mut flags, 64);
    bitmap_set(&mut flags, 127);
    bitmap_set(&mut flags, 128);
    bitmap_set(&mut flags, 255);

    assert!(bitmap_is_set(&flags, 0));
    assert!(bitmap_is_set(&flags, 63));
    assert!(bitmap_is_set(&flags, 64));
    assert!(bitmap_is_set(&flags, 127));
    assert!(bitmap_is_set(&flags, 128));
    assert!(bitmap_is_set(&flags, 255));
    assert!(!bitmap_is_set(&flags, 1));
    assert!(!bitmap_is_set(&flags, 254));
    assert_eq!(bitmap_count_ones(&flags), 6);
}

#[test]
fn bitmap_idempotent_set() {
    let mut flags = [0u64; 4];
    bitmap_set(&mut flags, 42);
    let snapshot = flags;
    bitmap_set(&mut flags, 42);
    assert_eq!(flags, snapshot);
    assert_eq!(bitmap_count_ones(&flags), 1);
}

#[test]
fn bitmap_boundary_index_255() {
    let mut flags = [0u64; 4];
    bitmap_set(&mut flags, 255);
    assert!(bitmap_is_set(&flags, 255));
    // bit 255 => word 3, bit 63
    assert_eq!(flags[3], 1u64 << 63);
    assert_eq!(bitmap_count_ones(&flags), 1);
}

#[test]
fn bitmap_fill_all_256() {
    let mut flags = [0u64; 4];
    for i in 0..=255u8 {
        bitmap_set(&mut flags, i);
    }
    assert_eq!(bitmap_count_ones(&flags), 256);
    assert_eq!(flags, [u64::MAX; 4]);
}

#[test]
fn bitmap_word_boundaries() {
    let mut flags = [0u64; 4];
    // Last bit of word 0
    bitmap_set(&mut flags, 63);
    assert_eq!(flags[0], 1u64 << 63);
    // First bit of word 1
    bitmap_set(&mut flags, 64);
    assert_eq!(flags[1], 1u64 << 0);
    // Last bit of word 1
    bitmap_set(&mut flags, 127);
    assert_eq!(flags[1], (1u64 << 0) | (1u64 << 63));
    // First bit of word 2
    bitmap_set(&mut flags, 128);
    assert_eq!(flags[2], 1u64 << 0);
}

// ---------- Streak tests ----------

#[test]
fn streak_same_day_noop() {
    let mut state = StreakState {
        current_streak: 3,
        longest_streak: 5,
        last_activity_ts: 86400 * 100, // day 100
    };
    // Same day, different second
    update_streak(&mut state, 86400 * 100 + 3600);
    assert_eq!(state.current_streak, 3);
    assert_eq!(state.longest_streak, 5);
}

#[test]
fn streak_consecutive_day_increments() {
    let mut state = StreakState {
        current_streak: 1,
        longest_streak: 1,
        last_activity_ts: 86400 * 100,
    };
    // Next day
    update_streak(&mut state, 86400 * 101);
    assert_eq!(state.current_streak, 2);
    assert_eq!(state.longest_streak, 2);
}

#[test]
fn streak_gap_resets_to_one() {
    let mut state = StreakState {
        current_streak: 10,
        longest_streak: 10,
        last_activity_ts: 86400 * 100,
    };
    // Skip a day (day 102, gap = 102 - 100 - 1 = 1 > 0)
    update_streak(&mut state, 86400 * 102);
    assert_eq!(state.current_streak, 1);
    assert_eq!(state.longest_streak, 10);
}

#[test]
fn streak_large_gap_resets_to_one() {
    let mut state = StreakState {
        current_streak: 50,
        longest_streak: 50,
        last_activity_ts: 86400 * 100,
    };
    update_streak(&mut state, 86400 * 200);
    assert_eq!(state.current_streak, 1);
    assert_eq!(state.longest_streak, 50);
}

#[test]
fn streak_milestone_detection() {
    assert!(is_milestone(7));
    assert!(is_milestone(30));
    assert!(is_milestone(100));
    assert!(is_milestone(365));
    assert!(!is_milestone(1));
    assert!(!is_milestone(6));
    assert!(!is_milestone(8));
    assert!(!is_milestone(29));
    assert!(!is_milestone(31));
    assert!(!is_milestone(99));
    assert!(!is_milestone(366));
}

#[test]
fn streak_longest_updates_only_when_exceeded() {
    let mut state = StreakState {
        current_streak: 3,
        longest_streak: 10,
        last_activity_ts: 86400 * 100,
    };
    update_streak(&mut state, 86400 * 101);
    assert_eq!(state.current_streak, 4);
    assert_eq!(state.longest_streak, 10); // unchanged

    // Build streak to 11
    for day in 102..=107 {
        update_streak(&mut state, 86400 * day);
    }
    assert_eq!(state.current_streak, 10);
    assert_eq!(state.longest_streak, 10); // still tied

    update_streak(&mut state, 86400 * 108);
    assert_eq!(state.current_streak, 11);
    assert_eq!(state.longest_streak, 11); // now updated
}

#[test]
fn streak_rebuild_after_break() {
    let mut state = StreakState {
        current_streak: 5,
        longest_streak: 5,
        last_activity_ts: 86400 * 100,
    };
    // Break streak
    update_streak(&mut state, 86400 * 103);
    assert_eq!(state.current_streak, 1);

    // Rebuild
    for day in 104..=110 {
        update_streak(&mut state, 86400 * day);
    }
    assert_eq!(state.current_streak, 8);
    assert_eq!(state.longest_streak, 8);
}

#[test]
fn streak_from_zero() {
    let mut state = StreakState {
        current_streak: 0,
        longest_streak: 0,
        last_activity_ts: 0, // epoch
    };
    // First activity on day 100
    update_streak(&mut state, 86400 * 100);
    // gap = 100 - 0 - 1 = 99, so streak resets to 1
    assert_eq!(state.current_streak, 1);
    assert_eq!(state.longest_streak, 1);
}

// ---------- Daily XP tests ----------

#[test]
fn daily_xp_new_day_resets() {
    let mut state = DailyXpState {
        xp_earned_today: 500,
        last_xp_day: 100,
    };
    // Day 101 => reset
    let result = check_daily_xp(&mut state, 1000, 50, 86400 * 101);
    assert_eq!(result, Ok(50));
    assert_eq!(state.xp_earned_today, 50);
    assert_eq!(state.last_xp_day, 101);
}

#[test]
fn daily_xp_same_day_accumulates() {
    let mut state = DailyXpState {
        xp_earned_today: 0,
        last_xp_day: 100,
    };
    let _ = check_daily_xp(&mut state, 1000, 200, 86400 * 100);
    assert_eq!(state.xp_earned_today, 200);

    let _ = check_daily_xp(&mut state, 1000, 300, 86400 * 100);
    assert_eq!(state.xp_earned_today, 500);
}

#[test]
fn daily_xp_at_cap_succeeds() {
    let mut state = DailyXpState {
        xp_earned_today: 900,
        last_xp_day: 100,
    };
    let result = check_daily_xp(&mut state, 1000, 100, 86400 * 100);
    assert_eq!(result, Ok(1000));
    assert_eq!(state.xp_earned_today, 1000);
}

#[test]
fn daily_xp_exceeds_cap_fails() {
    let mut state = DailyXpState {
        xp_earned_today: 900,
        last_xp_day: 100,
    };
    let result = check_daily_xp(&mut state, 1000, 101, 86400 * 100);
    assert_eq!(result, Err("exceeded"));
    // state should NOT be updated on failure
    assert_eq!(state.xp_earned_today, 900);
}

#[test]
fn daily_xp_overflow_handling() {
    let mut state = DailyXpState {
        xp_earned_today: u32::MAX,
        last_xp_day: 100,
    };
    let result = check_daily_xp(&mut state, u32::MAX, 1, 86400 * 100);
    assert_eq!(result, Err("overflow"));
}

#[test]
fn daily_xp_zero_amount() {
    let mut state = DailyXpState {
        xp_earned_today: 500,
        last_xp_day: 100,
    };
    let result = check_daily_xp(&mut state, 1000, 0, 86400 * 100);
    assert_eq!(result, Ok(500));
}

#[test]
fn daily_xp_reset_then_full_cap() {
    let mut state = DailyXpState {
        xp_earned_today: 999,
        last_xp_day: 100,
    };
    // New day, earn full cap
    let result = check_daily_xp(&mut state, 1000, 1000, 86400 * 101);
    assert_eq!(result, Ok(1000));
    // One more should fail
    let result2 = check_daily_xp(&mut state, 1000, 1, 86400 * 101);
    assert_eq!(result2, Err("exceeded"));
}

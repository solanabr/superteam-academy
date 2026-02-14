use anchor_lang::prelude::*;

use crate::errors::AcademyError;
use crate::state::LearnerProfile;

/// Update streak as a side effect of completing a lesson.
/// Called from complete_lesson. Uses UTC day boundaries.
pub fn update_streak(learner: &mut LearnerProfile) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let today = now / 86400;
    let last_day = learner.last_activity_date / 86400;

    if today > last_day {
        if today == last_day + 1 {
            // Consecutive day
            learner.current_streak = learner
                .current_streak
                .checked_add(1)
                .ok_or(AcademyError::ArithmeticOverflow)?;
        } else if today == last_day + 2 && learner.streak_freezes > 0 {
            // Missed one day, use freeze
            learner.streak_freezes -= 1;
            learner.current_streak = learner
                .current_streak
                .checked_add(1)
                .ok_or(AcademyError::ArithmeticOverflow)?;
        } else if today > last_day + 1 {
            // Streak broken
            emit!(StreakBroken {
                learner: learner.authority,
                final_streak: learner.current_streak,
                timestamp: now,
            });
            learner.current_streak = 1;
        }

        // Milestone events
        let milestones: [u16; 4] = [7, 30, 100, 365];
        if milestones.contains(&learner.current_streak) {
            emit!(StreakMilestone {
                learner: learner.authority,
                milestone: learner.current_streak,
                timestamp: now,
            });
        }

        if learner.current_streak > learner.longest_streak {
            learner.longest_streak = learner.current_streak;
        }

        learner.last_activity_date = now;
    }

    Ok(())
}

/// Check and update daily XP rate limit.
/// Resets counter on new UTC day. Rejects if adding xp_amount would exceed max.
pub fn check_and_update_daily_xp(
    learner: &mut LearnerProfile,
    xp_amount: u32,
    max_daily_xp: u32,
) -> Result<()> {
    let today = (Clock::get()?.unix_timestamp / 86400) as u16;

    if today > learner.last_xp_day {
        learner.xp_earned_today = 0;
        learner.last_xp_day = today;
    }

    let new_total = learner
        .xp_earned_today
        .checked_add(xp_amount)
        .ok_or(AcademyError::ArithmeticOverflow)?;

    require!(new_total <= max_daily_xp, AcademyError::DailyXPLimitExceeded);

    learner.xp_earned_today = new_total;
    Ok(())
}

/// Count set bits across a lesson_flags bitmap.
pub fn popcount_bitmap(flags: &[u64; 4]) -> u32 {
    flags.iter().map(|w| w.count_ones()).sum()
}

// -- Events used by utils --

#[event]
pub struct StreakBroken {
    pub learner: Pubkey,
    pub final_streak: u16,
    pub timestamp: i64,
}

#[event]
pub struct StreakMilestone {
    pub learner: Pubkey,
    pub milestone: u16,
    pub timestamp: i64,
}

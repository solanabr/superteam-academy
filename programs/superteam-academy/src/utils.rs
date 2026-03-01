use anchor_lang::prelude::*;
use crate::state::LearnerProfile;

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
        .ok_or(crate::errors::AcademyError::MathOverflow)?;

    require!(
        new_total <= max_daily_xp,
        crate::errors::AcademyError::DailyXPLimitExceeded
    );

    learner.xp_earned_today = new_total;
    Ok(())
}

pub fn update_streak(learner: &mut LearnerProfile) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let today = now / 86400;
    let last_day = learner.last_activity_date / 86400;

    if today > last_day {
        if today == last_day + 1 {
            learner.current_streak = learner.current_streak.saturating_add(1);
        } else if today == last_day + 2 && learner.streak_freezes > 0 {
            learner.streak_freezes = learner.streak_freezes.saturating_sub(1);
            learner.current_streak = learner.current_streak.saturating_add(1);
        } else if today > last_day + 1 {
            emit!(crate::events::StreakBroken {
                learner: learner.authority,
                final_streak: learner.current_streak,
                timestamp: now,
            });
            learner.current_streak = 1;
        }

        let milestones = [7u16, 30, 100, 365];
        if milestones.contains(&learner.current_streak) {
            emit!(crate::events::StreakMilestone {
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

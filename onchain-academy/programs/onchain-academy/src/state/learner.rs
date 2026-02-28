use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct LearnerProfile {
    /// Learner wallet
    pub authority: Pubkey,
    /// Current consecutive-day streak
    pub current_streak: u16,
    /// Longest streak ever achieved
    pub longest_streak: u16,
    /// Last activity (unix timestamp)
    pub last_activity_date: i64,
    /// Available streak freezes
    pub streak_freezes: u8,
    /// Bitmap of claimed achievements (256 possible)
    pub achievement_flags: [u64; 4],
    /// XP earned today (resets daily)
    pub xp_earned_today: u32,
    /// Day number of last XP earn (unix_ts / 86400)
    pub last_xp_day: u16,
    /// Number of successful referrals
    pub referral_count: u16,
    /// Whether this learner has already registered a referrer
    pub has_referrer: bool,
    /// Reserved for future use
    pub _reserved: [u8; 16],
    /// PDA bump
    pub bump: u8,
}

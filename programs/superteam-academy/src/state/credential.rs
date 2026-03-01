use anchor_lang::prelude::*;

/// ZK Compressed Credential Data Structure
/// This represents the data that gets stored in a compressed account via Light Protocol
#[derive(Clone, Debug, Default, AnchorSerialize, AnchorDeserialize)]
pub struct CredentialData {
    /// Owner/learner
    pub learner: Pubkey,
    /// Track identifier
    pub track_id: u16,
    /// Current level in track (1=beginner, 2=intermediate, 3=advanced)
    pub current_level: u8,
    /// Number of courses completed in this track
    pub courses_completed: u8,
    /// Total XP earned in this track
    pub total_xp_earned: u32,
    /// First credential earned timestamp
    pub first_earned: i64,
    /// Last upgrade timestamp
    pub last_updated: i64,
    /// Arweave TX hash for display metadata
    pub metadata_hash: [u8; 32],
}

impl CredentialData {
    pub const SIZE: usize = 32 + 2 + 1 + 1 + 4 + 8 + 8 + 32;

    /// Derive the credential address for a learner + track combination
    pub fn derive_address(learner: &Pubkey, track_id: u16) -> Vec<u8> {
        let mut seeds = Vec::with_capacity(44);
        seeds.extend_from_slice(b"credential");
        seeds.extend_from_slice(learner.as_ref());
        seeds.extend_from_slice(&track_id.to_le_bytes());
        seeds
    }
}

/// Credential state for on-chain tracking (optional, for indexers)
/// The actual credential data lives in ZK compressed state
#[account]
pub struct Credential {
    /// Learner who owns this credential
    pub learner: Pubkey,
    /// Track this credential is for
    pub track_id: u16,
    /// Current level achieved
    pub current_level: u8,
    /// Bump for PDA
    pub bump: u8,
}

impl Credential {
    pub const SIZE: usize = 8 + 32 + 2 + 1 + 1;

    pub fn seeds(learner: &Pubkey, track_id: u16) -> Vec<u8> {
        CredentialData::derive_address(learner, track_id)
    }
}

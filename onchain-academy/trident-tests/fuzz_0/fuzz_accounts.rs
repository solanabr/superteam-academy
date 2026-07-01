use trident_fuzz::fuzzing::*;

/// Centralized address storage shared across init + flows.
///
/// `#[init]` populates the singleton platform accounts (authority, xp_mint,
/// config, backend MinterRole, the course). Each `flow_enroll` adds a fresh
/// learner to `learners` and the matching `enrollment` / `learner_ata`, so the
/// later flows (`complete_lesson`, `finalize_course`) can pick a random learner
/// that actually has an enrollment + XP token account.
///
/// Docs: https://ackee.xyz/trident/docs/latest/trident-api-macro/trident-types/fuzz-accounts/
#[derive(Default)]
pub struct AccountAddresses {
    /// Platform authority == backend_signer == XP mint authority (the Config PDA
    /// signs the mint CPI; the authority is the fee payer / admin signer).
    pub authority: AddressStorage,
    /// The Token-2022 XP mint, created by `initialize`.
    pub xp_mint: AddressStorage,
    /// Config PDA (`["config"]`).
    pub config: AddressStorage,
    /// Backend MinterRole PDA (`["minter", authority]`).
    pub backend_minter_role: AddressStorage,
    /// The single course PDA (`["course", course_id]`) created in init.
    pub course: AddressStorage,
    /// The creator's XP ATA (creator == authority here), for finalize rewards.
    pub creator_ata: AddressStorage,

    /// Learners enrolled this iteration.
    pub learners: AddressStorage,
    /// Enrollment PDAs, index-aligned with `learners`.
    pub enrollment: AddressStorage,
    /// Learner XP ATAs, index-aligned with `learners`.
    pub learner_ata: AddressStorage,
}

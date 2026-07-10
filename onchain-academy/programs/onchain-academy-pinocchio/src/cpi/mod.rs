pub mod mpl_core;
pub mod system;
pub mod token2022;

use pinocchio::cpi::Seed;

use crate::consts::{CONFIG_BUMP, CONFIG_SEED};

/// Signer seeds for the Config PDA — the authority for every token-2022 and
/// mpl-core CPI this program makes. Usage:
/// `let seeds = config_seeds(); let signer = Signer::from(&seeds);`
#[inline(always)]
pub fn config_seeds() -> [Seed<'static>; 2] {
    const BUMP: [u8; 1] = [CONFIG_BUMP];
    [Seed::from(CONFIG_SEED), Seed::from(&BUMP)]
}

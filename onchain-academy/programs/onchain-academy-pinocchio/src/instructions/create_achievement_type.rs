//! `create_achievement_type(params)` — authority-gated: creates the
//! AchievementType PDA and its Metaplex Core collection (update authority =
//! Config PDA).
//! Accounts: config | achievement_type (init, payer = payer) | collection
//! (signer, mut — new keypair) | authority (signer, == config.authority @
//! Unauthorized) | payer (signer, mut) | mpl_core_program (address) |
//! system_program.

use pinocchio::{
    cpi::{Seed, Signer},
    AccountView, ProgramResult,
};

use crate::consts::*;
use crate::cpi::system::create_pda_account;
use crate::cpi::{config_seeds, mpl_core};
use crate::errors::AcademyError;
use crate::state::achievement::InitAchievementType;
use crate::validation as v;
use crate::{events, require, state, take_accounts};

pub fn process(accounts: &mut [AccountView], data: &[u8]) -> ProgramResult {
    let mut cur = v::Cursor::new(data);
    let achievement_id = cur.str()?;
    let name = cur.str()?;
    let metadata_uri = cur.str()?;
    let max_supply = cur.u32()?;
    let xp_reward = cur.u32()?;

    take_accounts!(
        [
            config,
            achievement_type,
            collection,
            authority,
            payer,
            mpl_core_program,
            system_program
        ] = accounts
    );

    // -- extraction phase ----------------------------------------------------
    v::expect_account(config, &ACC_CONFIG)?;
    v::expect_signer(collection)?;
    v::expect_signer(authority)?;
    v::expect_signer(payer)?;
    v::expect_system_program(system_program)?;

    // -- constraint phase ----------------------------------------------------
    v::expect_config_pda(config)?;
    // achievement_type `init` (payer = payer)
    let bump = v::expect_found_pda(
        achievement_type,
        &[ACHIEVEMENT_SEED, achievement_id.as_bytes()],
    )?;
    {
        let bump_seed = [bump];
        let seeds = [
            Seed::from(ACHIEVEMENT_SEED),
            Seed::from(achievement_id.as_bytes()),
            Seed::from(&bump_seed),
        ];
        create_pda_account(
            payer,
            achievement_type,
            ACHIEVEMENT_TYPE_SIZE,
            &ID,
            &Signer::from(&seeds),
        )?;
    }
    v::expect_writable(collection)?;
    {
        let cfg = config.try_borrow()?;
        v::expect_key(
            authority,
            &state::config::authority(&cfg),
            AcademyError::Unauthorized,
        )?;
    }
    v::expect_writable(payer)?;
    v::expect_address(mpl_core_program, &MPL_CORE_ID)?;

    // -- handler ---------------------------------------------------------------
    require!(
        !achievement_id.is_empty() && achievement_id.len() <= MAX_ACHIEVEMENT_ID_LEN,
        AcademyError::AchievementIdTooLong
    );
    require!(
        !name.is_empty() && name.len() <= MAX_ACHIEVEMENT_NAME_LEN,
        AcademyError::AchievementNameTooLong
    );
    require!(
        !metadata_uri.is_empty() && metadata_uri.len() <= MAX_ACHIEVEMENT_URI_LEN,
        AcademyError::AchievementUriTooLong
    );
    require!(xp_reward > 0, AcademyError::InvalidXpReward);
    // max_supply: 0 = unlimited, >0 = capped supply

    let seeds = config_seeds();
    mpl_core::create_collection_v2_signed(
        collection,
        config,
        payer,
        system_program,
        name.as_bytes(),
        metadata_uri.as_bytes(),
        &Signer::from(&seeds),
    )?;

    let now = v::now()?;
    {
        let mut d = achievement_type.try_borrow_mut()?;
        state::achievement::init_achievement_type(
            &mut d,
            &InitAchievementType {
                achievement_id: achievement_id.as_bytes(),
                name: name.as_bytes(),
                metadata_uri: metadata_uri.as_bytes(),
                collection: collection.address(),
                creator: authority.address(),
                max_supply,
                xp_reward,
                now,
                bump,
            },
        );
    }

    events::emit_achievement_type_created(
        achievement_id.as_bytes(),
        collection.address(),
        authority.address(),
        max_supply,
        xp_reward,
        now,
    );
    Ok(())
}

use crate::helpers::*;
use anchor_lang::{InstructionData, ToAccountMetas};
use solana_sdk::{
    instruction::Instruction,
    signature::{Keypair, Signer},
    system_program,
    transaction::Transaction,
};
use superteam_academy::state::Config;

#[test]
fn initialize_creates_config_with_correct_fields() {
    let (mut svm, authority) = setup();
    let max_daily = 5000u32;
    let max_achievement = 1000u32;
    let (config_addr, xp_mint) = initialize_config(&mut svm, &authority, max_daily, max_achievement);

    let config: Config = get_account_data(&svm, &config_addr);

    assert_eq!(config.authority, authority.pubkey());
    assert_eq!(config.backend_signer, authority.pubkey());
    assert_eq!(config.xp_mint, xp_mint.pubkey());
    assert_eq!(config.max_daily_xp, max_daily);
    assert_eq!(config.max_achievement_xp, max_achievement);
    assert_eq!(config._reserved, [0u8; 32]);
}

#[test]
fn initialize_stores_correct_bump() {
    let (mut svm, authority) = setup();
    let (config_addr, _) = initialize_config(&mut svm, &authority, 5000, 1000);

    let config: Config = get_account_data(&svm, &config_addr);
    let (expected_addr, expected_bump) = config_pda();

    assert_eq!(config_addr, expected_addr);
    assert_eq!(config.bump, expected_bump);
}

#[test]
fn initialize_xp_mint_owned_by_token_2022() {
    let (mut svm, authority) = setup();
    let (_, xp_mint) = initialize_config(&mut svm, &authority, 5000, 1000);

    let mint_account = svm
        .get_account(&xp_mint.pubkey())
        .expect("mint account not found");
    assert_eq!(mint_account.owner, spl_token_2022::id());
}

#[test]
fn initialize_double_init_fails() {
    let (mut svm, authority) = setup();
    initialize_config(&mut svm, &authority, 5000, 1000);

    // Second init with a new mint keypair should fail (Config PDA already exists)
    let (config_addr, _) = config_pda();
    let xp_mint2 = Keypair::new();

    let data = superteam_academy::instruction::Initialize {
        max_daily_xp: 5000,
        max_achievement_xp: 1000,
    };

    let accounts = superteam_academy::accounts::Initialize {
        config: config_addr,
        xp_mint: xp_mint2.pubkey(),
        authority: authority.pubkey(),
        system_program: system_program::id(),
        token_program: spl_token_2022::id(),
    };

    let ix = Instruction {
        program_id: PROGRAM_ID,
        accounts: accounts.to_account_metas(None),
        data: data.data(),
    };

    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&authority.pubkey()),
        &[&authority, &xp_mint2],
        svm.latest_blockhash(),
    );

    let result = svm.send_transaction(tx);
    assert!(
        result.is_err(),
        "Double initialize should fail but succeeded"
    );
}

#[test]
fn initialize_config_pda_is_deterministic() {
    let (pda1, bump1) = config_pda();
    let (pda2, bump2) = config_pda();
    assert_eq!(pda1, pda2);
    assert_eq!(bump1, bump2);
}

#[test]
fn initialize_with_zero_max_daily_xp() {
    let (mut svm, authority) = setup();
    let (config_addr, _) = initialize_config(&mut svm, &authority, 0, 0);

    let config: Config = get_account_data(&svm, &config_addr);
    assert_eq!(config.max_daily_xp, 0);
    assert_eq!(config.max_achievement_xp, 0);
}

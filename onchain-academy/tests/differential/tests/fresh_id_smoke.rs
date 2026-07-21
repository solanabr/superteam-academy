//! Pre-deploy smoke test for the `fresh-id` flavor (self-owned devnet
//! instance, see docs/DEPLOY-PROGRAM.md § "Fresh devnet instance"):
//!
//! 1. the fresh artifact initializes at its own program id and writes a
//!    byte-correct Config at its own const CONFIG_PDA, and
//! 2. the default (upstream-id) artifact deployed at the fresh id fails its
//!    very first instruction with `DeclaredProgramIdMismatch` (4100) — the
//!    wrong-artifact guard the runbook relies on.
//!
//! Skips (with a notice) when `onchain_academy_pinocchio_fresh.so` hasn't
//! been built — it is a local deploy artifact, not a CI artifact. Build it
//! with `pnpm build:pinocchio:fresh`.

use litesvm::LiteSVM;
use onchain_academy_differential::harness::deploy_artifact;
use solana_sdk::{
    instruction::{AccountMeta, Instruction},
    message::Message,
    pubkey::Pubkey,
    signature::{Keypair, Signer},
    transaction::Transaction,
};
use std::str::FromStr;

const FRESH_PROGRAM_ID: &str = "Dsro2Cd9Mhgk8L71imh3LLPwYU5PU8hvBY5HEcPrcx5u";
const FRESH_CONFIG_PDA: &str = "E9GVGKbyoWNSf9B1iR8gNVecwDwqnzNbUxcBzVCVSXan";
const IX_INITIALIZE: [u8; 8] = [175, 175, 109, 31, 13, 152, 155, 237];
const ACC_CONFIG: [u8; 8] = [155, 12, 170, 224, 30, 250, 204, 130];

fn initialize_ix(program_id: &Pubkey, xp_mint: &Pubkey, authority: &Pubkey) -> Instruction {
    let config = Pubkey::find_program_address(&[b"config"], program_id).0;
    let minter = Pubkey::find_program_address(&[b"minter", authority.as_ref()], program_id).0;
    let token_2022 = Pubkey::from_str("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb").unwrap();
    Instruction {
        program_id: *program_id,
        accounts: vec![
            AccountMeta::new(config, false),
            AccountMeta::new(*xp_mint, true),
            AccountMeta::new(*authority, true),
            AccountMeta::new(minter, false),
            AccountMeta::new_readonly(Pubkey::default(), false),
            AccountMeta::new_readonly(token_2022, false),
        ],
        data: IX_INITIALIZE.to_vec(),
    }
}

fn read_fresh_so() -> Option<Vec<u8>> {
    let path = std::env::var("ACADEMY_PINOCCHIO_FRESH_SO")
        .unwrap_or_else(|_| deploy_artifact("onchain_academy_pinocchio_fresh.so"));
    match std::fs::read(&path) {
        Ok(bytes) => Some(bytes),
        Err(_) => {
            eprintln!("SKIP fresh_id_smoke: {path} not built (pnpm build:pinocchio:fresh)");
            None
        }
    }
}

#[test]
fn fresh_artifact_initializes_at_its_own_id() {
    let Some(so) = read_fresh_so() else { return };
    let fresh_id = Pubkey::from_str(FRESH_PROGRAM_ID).unwrap();
    let config = Pubkey::find_program_address(&[b"config"], &fresh_id).0;
    assert_eq!(
        config.to_string(),
        FRESH_CONFIG_PDA,
        "consts.rs fresh-id CONFIG_PDA is stale"
    );

    let mut svm = LiteSVM::new();
    svm.add_program(fresh_id, &so).expect("load fresh .so");

    let authority = Keypair::new();
    let xp_mint = Keypair::new();
    svm.airdrop(&authority.pubkey(), 1_000_000_000).unwrap();

    let ix = initialize_ix(&fresh_id, &xp_mint.pubkey(), &authority.pubkey());
    let tx = Transaction::new(
        &[&authority, &xp_mint],
        Message::new(&[ix], Some(&authority.pubkey())),
        svm.latest_blockhash(),
    );
    let meta = svm
        .send_transaction(tx)
        .unwrap_or_else(|e| panic!("initialize failed: {:?}\nlogs: {:?}", e.err, e.meta.logs));
    // initialize emits no event (Anchor parity); the entry log proves dispatch.
    assert!(meta
        .logs
        .iter()
        .any(|l| l.contains("Instruction: Initialize")));

    // Config bytes exactly as the devnet init will write them.
    let cfg = svm.get_account(&config).expect("config created");
    assert_eq!(cfg.owner, fresh_id);
    assert_eq!(cfg.data.len(), 113);
    assert_eq!(cfg.data[0..8], ACC_CONFIG);
    assert_eq!(cfg.data[8..40], authority.pubkey().to_bytes()); // authority
    assert_eq!(cfg.data[40..72], authority.pubkey().to_bytes()); // backend_signer
    assert_eq!(cfg.data[72..104], xp_mint.pubkey().to_bytes()); // xp_mint
    assert_eq!(cfg.data[112], 254); // stored canonical bump

    // XP mint lives under token-2022 with the config PDA as mint authority.
    let mint = svm.get_account(&xp_mint.pubkey()).expect("mint created");
    assert_eq!(
        mint.owner,
        Pubkey::from_str("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb").unwrap()
    );
    assert_eq!(mint.data.len(), 274);
}

#[test]
fn default_artifact_at_fresh_id_fails_with_4100() {
    let default_so = std::fs::read(deploy_artifact("onchain_academy_pinocchio.so"))
        .expect("build first: pnpm build:pinocchio");
    let fresh_id = Pubkey::from_str(FRESH_PROGRAM_ID).unwrap();

    let mut svm = LiteSVM::new();
    svm.add_program(fresh_id, &default_so).unwrap();

    let authority = Keypair::new();
    let xp_mint = Keypair::new();
    svm.airdrop(&authority.pubkey(), 1_000_000_000).unwrap();

    let ix = initialize_ix(&fresh_id, &xp_mint.pubkey(), &authority.pubkey());
    let tx = Transaction::new(
        &[&authority, &xp_mint],
        Message::new(&[ix], Some(&authority.pubkey())),
        svm.latest_blockhash(),
    );
    let err = svm
        .send_transaction(tx)
        .expect_err("wrong-flavor artifact must refuse to run");
    let msg = format!("{:?}", err.err);
    assert!(
        msg.contains("Custom(4100)"), // DeclaredProgramIdMismatch
        "expected the declared-id self-check, got: {msg}\nlogs: {:?}",
        err.meta.logs
    );
}

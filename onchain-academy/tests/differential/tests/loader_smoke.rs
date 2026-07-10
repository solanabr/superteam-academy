use litesvm::LiteSVM;
use onchain_academy_differential::harness::{deploy_artifact, program_id};
use solana_sdk::{
    instruction::Instruction,
    message::Message,
    signature::{Keypair, Signer},
    transaction::Transaction,
};

/// The pinocchio .so is produced by platform-tools v1.54 (rustc 1.89 needed by
/// pinocchio 0.11.2); this test proves the emitted SBF bytecode loads and
/// executes on the LiteSVM runtime the differential suite uses.
#[test]
fn pinocchio_so_loads_and_executes() {
    let program_id = program_id();
    let mut svm = LiteSVM::new();
    let so = std::fs::read(deploy_artifact("onchain_academy_pinocchio.so"))
        .expect("build first: cargo build-sbf --manifest-path programs/onchain-academy-pinocchio/Cargo.toml --tools-version v1.54");
    svm.add_program(program_id, &so)
        .expect("load pinocchio .so");

    let payer = Keypair::new();
    svm.airdrop(&payer.pubkey(), 1_000_000_000).unwrap();

    let ix = Instruction {
        program_id,
        accounts: vec![],
        data: vec![1, 2, 3],
    };
    let tx = Transaction::new(
        &[&payer],
        Message::new(&[ix], Some(&payer.pubkey())),
        svm.latest_blockhash(),
    );

    let err = svm.send_transaction(tx).expect_err("short data must fail");
    let msg = format!("{:?}", err.err);
    // Anchor-compatible fallback error (101 InstructionFallbackNotFound)
    // proves the dispatcher executed on this runtime.
    assert!(
        msg.contains("Custom(101)"),
        "program did not execute (loader problem?): {msg}\nlogs: {:?}",
        err.meta.logs
    );
}

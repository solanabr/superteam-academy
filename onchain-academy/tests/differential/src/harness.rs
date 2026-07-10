//! Pinocchio integration harness: loads the pinocchio `.so` (+ the mpl-core
//! fixture) into a LiteSVM and runs transactions, asserting the expected
//! result / error code.
//!
//! This crate began as a dual-VM differential harness (pinocchio vs the Anchor
//! oracle). The Anchor build has since been retired, and the security fixes
//! (course generation, unenroll lock, mandatory backend-role retirement) make
//! pinocchio intentionally diverge from that old oracle — so the harness now
//! runs a single VM and asserts behavior directly.

use litesvm::LiteSVM;
use solana_sdk::account::Account;
use solana_sdk::clock::Clock;
use solana_sdk::instruction::Instruction;
use solana_sdk::pubkey::Pubkey;
use solana_sdk::signature::Keypair;
use solana_sdk::signer::Signer;
use solana_sdk::transaction::Transaction;
use std::str::FromStr;

use crate::ixs;

pub const PROGRAM_ID_STR: &str = ixs::PROGRAM_ID;

pub fn program_id() -> Pubkey {
    Pubkey::from_str(PROGRAM_ID_STR).unwrap()
}

/// Path to a build artifact under the shared program-workspace target dir.
pub fn deploy_artifact(name: &str) -> String {
    format!(
        "{}/../../target/deploy/{}",
        env!("CARGO_MANIFEST_DIR"),
        name
    )
}

fn fixture(name: &str) -> String {
    format!("{}/../fixtures/{}", env!("CARGO_MANIFEST_DIR"), name)
}

fn read_so(env_var: &str, preferred: &str) -> Vec<u8> {
    if let Ok(path) = std::env::var(env_var) {
        return std::fs::read(&path).unwrap_or_else(|e| panic!("{env_var}={path}: {e}"));
    }
    let path = deploy_artifact(preferred);
    std::fs::read(&path).unwrap_or_else(|e| {
        panic!("missing artifact {path}: {e}\nbuild first: pnpm build:pinocchio")
    })
}

/// Single-VM pinocchio harness. The `DiffHarness` alias keeps the historical
/// name working across the existing scenario suites.
pub struct Harness {
    pub svm: LiteSVM,
}

pub type DiffHarness = Harness;

impl Default for Harness {
    fn default() -> Self {
        Self::new()
    }
}

impl Harness {
    /// Loads the pinocchio build + the mpl-core fixture into a fresh VM.
    pub fn new() -> Self {
        let pino_so = read_so("ACADEMY_PINOCCHIO_SO", "onchain_academy_pinocchio.so");
        let mpl_so = std::fs::read(fixture("mpl_core.so")).expect("tests/fixtures/mpl_core.so");

        let mut svm = LiteSVM::new();
        svm.add_program(program_id(), &pino_so)
            .expect("load pinocchio .so");
        svm.add_program(ixs::mpl_core_id(), &mpl_so)
            .expect("load mpl fixture");

        Self { svm }
    }

    pub fn airdrop(&mut self, key: &Pubkey, lamports: u64) {
        self.svm.airdrop(key, lamports).unwrap();
    }

    pub fn set_account(&mut self, key: Pubkey, account: Account) {
        self.svm.set_account(key, account).unwrap();
    }

    /// Advances the clock by `seconds`.
    pub fn warp(&mut self, seconds: i64) {
        let mut clock: Clock = self.svm.get_sysvar();
        clock.unix_timestamp += seconds;
        self.svm.set_sysvar(&clock);
    }

    /// Runs the instruction list and returns the result (logs on success, the
    /// error + logs on failure).
    pub fn run(
        &mut self,
        _label: &str,
        ixs_list: &[Instruction],
        payer: &Keypair,
        signers: &[&Keypair],
    ) -> Result<(), solana_sdk::transaction::TransactionError> {
        Self::execute(&mut self.svm, ixs_list, payer, signers)
            .map(|_| ())
            .map_err(|(err, _)| err)
    }

    /// Asserts the tx succeeds.
    pub fn run_ok(
        &mut self,
        label: &str,
        ixs_list: &[Instruction],
        payer: &Keypair,
        signers: &[&Keypair],
    ) {
        match Self::execute(&mut self.svm, ixs_list, payer, signers) {
            Ok(_) => {}
            Err((err, logs)) => panic!("[{label}] expected success, got {err:?}\nlogs: {logs:#?}"),
        }
    }

    /// Asserts the tx fails with the given custom program error code.
    pub fn run_expect_custom(
        &mut self,
        label: &str,
        ixs_list: &[Instruction],
        payer: &Keypair,
        signers: &[&Keypair],
        code: u32,
    ) {
        use solana_sdk::instruction::InstructionError;
        use solana_sdk::transaction::TransactionError;
        match self.run(label, ixs_list, payer, signers) {
            Err(TransactionError::InstructionError(_, InstructionError::Custom(c)))
                if c == code => {}
            other => panic!("[{label}] expected Custom({code}), got {other:?}"),
        }
    }

    /// Asserts the tx fails (any error).
    pub fn run_expect_err(
        &mut self,
        label: &str,
        ixs_list: &[Instruction],
        payer: &Keypair,
        signers: &[&Keypair],
    ) {
        if self.run(label, ixs_list, payer, signers).is_ok() {
            panic!("[{label}] expected failure but tx succeeded");
        }
    }

    #[allow(clippy::type_complexity)]
    fn execute(
        svm: &mut LiteSVM,
        ixs_list: &[Instruction],
        payer: &Keypair,
        signers: &[&Keypair],
    ) -> Result<Vec<String>, (solana_sdk::transaction::TransactionError, Vec<String>)> {
        // Fresh blockhash per send so identical retried transactions are never
        // deduplicated as AlreadyProcessed.
        svm.expire_blockhash();
        let mut all_signers: Vec<&Keypair> = vec![payer];
        for s in signers {
            if s.pubkey() != payer.pubkey() {
                all_signers.push(s);
            }
        }
        let tx = Transaction::new_signed_with_payer(
            ixs_list,
            Some(&payer.pubkey()),
            &all_signers,
            svm.latest_blockhash(),
        );
        match svm.send_transaction(tx) {
            Ok(meta) => Ok(meta.logs),
            Err(failed) => Err((failed.err, failed.meta.logs)),
        }
    }
}

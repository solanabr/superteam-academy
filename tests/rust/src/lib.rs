use litesvm::LiteSVM;
use solana_sdk::{signature::Keypair, signer::Signer};

pub mod fixtures;
pub mod unit;
pub mod integration;

pub struct TestContext {
    pub svm: LiteSVM,
    pub authority: Keypair,
    pub backend_signer: Keypair,
    pub learner: Keypair,
    pub creator: Keypair,
}

impl TestContext {
    pub fn new() -> Self {
        let mut svm = LiteSVM::new();
        
        let authority = Keypair::new();
        let backend_signer = Keypair::new();
        let learner = Keypair::new();
        let creator = Keypair::new();
        
        // Airdrop SOL to accounts
        svm.airdrop(&authority.pubkey(), 10_000_000_000).unwrap();
        svm.airdrop(&backend_signer.pubkey(), 1_000_000_000).unwrap();
        svm.airdrop(&learner.pubkey(), 1_000_000_000).unwrap();
        svm.airdrop(&creator.pubkey(), 1_000_000_000).unwrap();
        
        Self {
            svm,
            authority,
            backend_signer,
            learner,
            creator,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_context_creation() {
        let ctx = TestContext::new();
        assert!(ctx.svm.get_balance(&ctx.authority.pubkey()).unwrap() > 0);
    }
}

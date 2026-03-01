export interface Lesson {
  id: number;
  title: string;
  duration: string;
  content: string;
  codeExample?: string;
}

export const COURSE_CONTENT: Record<string, Lesson[]> = {
  "anchor-fundamentals": [
    { id: 1, title: "Introduction to Solana & Anchor", duration: "15 min", content: "Learn why Solana is the fastest blockchain and how Anchor framework simplifies development. Understand PDAs, accounts, and the Solana runtime." },
    { id: 2, title: "Setting Up Your Development Environment", duration: "20 min", content: "Install Rust, Solana CLI, and Anchor. Configure your local environment and connect to devnet." },
    { id: 3, title: "Understanding Accounts", duration: "25 min", content: "Everything on Solana is an account. Learn about account structure, rent, and the differences between executable and data accounts." },
    { id: 4, title: "Program Derived Addresses (PDAs)", duration: "30 min", content: "Master PDAs - the key to Solana development. Learn how to create deterministic addresses that are controlled by your program." },
    { id: 5, title: "Writing Your First Instruction", duration: "25 min", content: "Build a counter program. Learn about instruction handlers, context, and account validation." },
    { id: 6, title: "Account Validation & Constraints", duration: "30 min", content: "Use Anchor's constraint system to validate accounts. Learn about init, payer, space, and seeds constraints." },
    { id: 7, title: "Working with Tokens", duration: "35 min", content: "Integrate SPL tokens into your program. Learn about token accounts, mints, and transfers." },
    { id: 8, title: "Cross-Program Invocations (CPI)", duration: "40 min", content: "Call other programs from your program. Learn about CPI and how to compose with existing protocols." },
    { id: 9, title: "Error Handling & Events", duration: "25 min", content: "Create custom errors and emit events. Best practices for debugging and monitoring." },
    { id: 10, title: "Testing with Anchor", duration: "35 min", content: "Write comprehensive tests using Anchor's test framework. Test on localnet and devnet." },
    { id: 11, title: "Security Best Practices", duration: "30 min", content: "Common vulnerabilities and how to avoid them. Signer validation, ownership checks, and reentrancy." },
    { id: 12, title: "Building a Complete dApp", duration: "45 min", content: "Capstone project: Build a full-stack application with React frontend and Anchor backend. Deploy to devnet!" },
  ],
  "token-2022-mastery": [
    { id: 1, title: "Token-2022 Overview", duration: "20 min", content: "Why Token-2022? New features, backward compatibility, and when to use it over Token program." },
    { id: 2, title: "Non-Transferable Tokens", duration: "30 min", content: "Create soulbound tokens. Perfect for credentials, memberships, and achievements." },
    { id: 3, title: "Transfer Fees", duration: "25 min", content: "Implement transfer fees. Build sustainable tokenomics for your project." },
    { id: 4, title: "Permanent Delegate", duration: "25 min", content: "Master the permanent delegate extension. Platform-controlled burns and modifications." },
    { id: 5, title: "Metadata Pointer & Token Metadata", duration: "35 min", content: "On-chain metadata for tokens. No more external JSON files!" },
    { id: 6, title: "Interest-Bearing Tokens", duration: "30 min", content: "Create tokens that accrue interest over time. DeFi building blocks." },
    { id: 7, title: "Confidential Transfers", duration: "40 min", content: "Privacy-preserving token transfers using zero-knowledge proofs." },
    { id: 8, title: "Capstone: Build a Reward Token", duration: "50 min", content: "Create a complete Token-2022 reward system with non-transferable achievements and transfer fees." },
  ],
  "zk-compression": [
    { id: 1, title: "Introduction to ZK Compression", duration: "25 min", content: "What is ZK Compression? Benefits, use cases, and how it scales Solana." },
    { id: 2, title: "Light Protocol Overview", duration: "30 min", content: "Architecture of Light Protocol. State trees, validity proofs, and compression." },
    { id: 3, title: "Creating Compressed Accounts", duration: "35 min", content: "Build your first compressed account. Significantly reduce rent costs." },
    { id: 4, title: "Validity Proofs", duration: "40 min", content: "Understanding validity proofs. How to verify state without storing everything on-chain." },
    { id: 5, title: "Compressed PDAs", duration: "35 min", content: "Create compressed Program Derived Addresses. Deterministic and rent-free." },
    { id: 6, title: "Photon Indexer", duration: "30 min", content: "Query compressed state with Photon. Fetch proofs and account data." },
    { id: 7, title: "Migrating from Regular PDAs", duration: "45 min", content: "Strategies for migrating existing programs to use ZK compression." },
    { id: 8, title: "Batch Operations", duration: "35 min", content: "Handle multiple compressed accounts in a single transaction." },
    { id: 9, title: "Cost Optimization", duration: "30 min", content: "Calculate savings and optimize your compression strategy." },
    { id: 10, title: "Capstone: Compressed Credential System", duration: "60 min", content: "Build a complete credential system using ZK compression. Issue, update, and verify credentials at 1/100th the cost!" },
  ],
  "security-auditing": [
    { id: 1, title: "Security Mindset", duration: "20 min", content: "Think like an attacker. Common attack vectors on Solana." },
    { id: 2, title: "Signer Validation", duration: "30 min", content: "The #1 vulnerability. Always validate signers and ownership." },
    { id: 3, title: "Integer Overflow & Underflow", duration: "25 min", content: "Rust protects you, but be careful with manual math. Use checked arithmetic." },
    { id: 4, title: "Reentrancy Attacks", duration: "30 min", content: "Understanding reentrancy on Solana. State validation before CPI." },
    { id: 5, title: "Account Validation", duration: "35 min", content: "Comprehensive account checks. Owners, seeds, and program IDs." },
    { id: 6, title: "PDA Security", duration: "30 min", content: "Secure PDA derivation. Prevent collisions and unauthorized access." },
    { id: 7, title: "Access Control Patterns", duration: "40 min", content: "Role-based access control. Admin, moderator, and user permissions." },
    { id: 8, title: "Token Security", duration: "35 min", content: "Secure token handling. Prevent drain attacks and unauthorized transfers." },
    { id: 9, title: "Formal Verification", duration: "30 min", content: "Introduction to formal verification. Prove your program is correct." },
    { id: 10, title: "Audit Methodology", duration: "40 min", content: "How professional auditors work. Checklists and tools." },
    { id: 11, title: "Bug Bounty Programs", duration: "25 min", content: "Set up bug bounties. Incentivize white hats to find bugs before black hats." },
    { id: 12, title: "Capstone: Audit a Real Program", duration: "60 min", content: "Perform a complete security audit on an open-source program. Find the bugs!" },
  ],
  "defi-primitives": [
    { id: 1, title: "DeFi Fundamentals", duration: "25 min", content: "Understanding DeFi primitives. AMMs, lending, vaults, and oracles." },
    { id: 2, title: "Building an AMM", duration: "50 min", content: "Create an Automated Market Maker. Constant product formula and liquidity pools." },
    { id: 3, title: "Lending Protocol Architecture", duration: "45 min", content: "Build a lending protocol. Collateral, borrow factors, and liquidations." },
    { id: 4, title: "Interest Rate Models", duration: "35 min", content: "Implement dynamic interest rates based on utilization." },
    { id: 5, title: "Price Oracles", duration: "40 min", content: "Integrate Pyth and Switchboard. Secure price feeds for your protocol." },
    { id: 6, title: "Liquidation Mechanics", duration: "45 min", content: "Build a liquidation system. Incentivize liquidators to keep protocol solvent." },
    { id: 7, title: "Yield Vaults", duration: "40 min", content: "Create yield-bearing vaults. Auto-compound strategies." },
    { id: 8, title: "Flash Loans", duration: "35 min", content: "Implement flash loans. Arbitrage and refinancing in a single transaction." },
    { id: 9, title: "Governance Tokens", duration: "30 min", content: "Build a governance system. Proposal creation, voting, and execution." },
    { id: 10, title: "MEV Protection", duration: "30 min", content: "Protect your protocol from MEV. Slippage protection and private mempools." },
    { id: 11, title: "Testing DeFi Protocols", duration: "35 min", content: "Comprehensive testing strategies. Fuzzing and invariant testing." },
    { id: 12, title: "Capstone: Complete DeFi Protocol", duration: "70 min", content: "Build a complete DeFi protocol with AMM, lending, and governance. Production-ready!" },
  ],
  "nft-infrastructure": [
    { id: 1, title: "NFT Standards", duration: "20 min", content: "Metaplex Token Metadata vs Token-2022. Choosing the right standard." },
    { id: 2, title: "Creating NFT Collections", duration: "35 min", content: "Build a collection with Candy Machine. Metadata, assets, and launch." },
    { id: 3, title: "Compressed NFTs (cNFTs)", duration: "40 min", content: "Scale to millions of NFTs with cNFTs. Bubblegum and merkle trees." },
    { id: 4, title: "NFT Marketplace", duration: "50 min", content: "Build an NFT marketplace. Listings, bids, and escrow." },
    { id: 5, title: "Royalties & Creator Economy", duration: "30 min", content: "Implement royalties. Support creators while allowing free trading." },
    { id: 6, title: "Dynamic NFTs", duration: "35 min", content: "Create NFTs that evolve. On-chain and off-chain updates." },
    { id: 7, title: "NFT Staking", duration: "40 min", content: "Build NFT staking systems. Reward holders with tokens." },
    { id: 8, title: "Launchpad", duration: "45 min", content: "Create a launchpad for new collections. Whitelists and fair launches." },
    { id: 9, title: "NFT Lending", duration: "35 min", content: "Use NFTs as collateral. Flash loans against JPEGs." },
    { id: 10, title: "Metadata Standards", duration: "25 min", content: "Best practices for metadata. Attributes, categories, and display." },
    { id: 11, title: "Capstone: NFT Ecosystem", duration: "65 min", content: "Build a complete NFT ecosystem: collection, marketplace, staking, and launchpad. The full stack!" },
  ],
};

export function getCourseContent(courseId: string): Lesson[] {
  return COURSE_CONTENT[courseId] || [];
}

export function getLesson(courseId: string, lessonId: number): Lesson | undefined {
  const course = COURSE_CONTENT[courseId];
  return course?.find(l => l.id === lessonId);
}

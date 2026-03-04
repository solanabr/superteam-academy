import {
  Blocks,
  Anchor,
  Landmark,
  Shield,
  Wallet,
  Coins,
  TestTube,
  ArrowLeftRight,
  GitBranch,
  type LucideIcon,
} from "lucide-react";

/* ── Types ── */

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: "video" | "reading" | "challenge";
  completed: boolean;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface CourseDetail {
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  topic: string;
  topicLabel: string;
  duration: string;
  lessons: number;
  completed: number;
  xp: number;
  accent: string;
  icon: LucideIcon;
  codePreview: string[];
  instructor: { name: string; role: string };
  modules: Module[];
  reviews: { name: string; rating: number; text: string }[];
}

/* ── Helper ── */

function lesson(
  id: string,
  title: string,
  duration: string,
  type: Lesson["type"] = "reading"
): Lesson {
  return { id, title, duration, type, completed: false };
}

/* ── Course data ── */

export const courses: CourseDetail[] = [
  {
    slug: "solana-fundamentals",
    title: "Solana Fundamentals",
    description:
      "Accounts, transactions, PDAs, and the runtime model. The foundation for everything you build on Solana.",
    longDescription:
      "Master the core concepts that power the Solana blockchain. You'll learn how accounts work, how transactions are processed, how Program Derived Addresses enable deterministic account creation, and how the Solana runtime executes programs. By the end, you'll have the mental model needed to build any Solana application.",
    difficulty: "Beginner",
    topic: "Core",
    topicLabel: "CORE",
    duration: "4h",
    lessons: 24,
    completed: 0,
    xp: 2400,
    accent: "#34d399",
    icon: Blocks,
    codePreview: [
      "let account = ctx.accounts.data;",
      "account.authority = *ctx.accounts",
      "  .signer.key;",
      'msg!("PDA initialized");',
    ],
    instructor: { name: "Lucas Silva", role: "Core Contributor" },
    modules: [
      {
        id: "m1",
        title: "The Solana Model",
        lessons: [
          lesson("l1", "What Makes Solana Different", "8 min", "video"),
          lesson("l2", "Accounts & the Account Model", "12 min", "reading"),
          lesson("l3", "Rent & Account Lifecycle", "6 min", "reading"),
          lesson("l4", "Quiz: Account Basics", "5 min", "challenge"),
        ],
      },
      {
        id: "m2",
        title: "Transactions & Instructions",
        lessons: [
          lesson("l5", "Anatomy of a Transaction", "10 min", "video"),
          lesson("l6", "Instructions & Programs", "8 min", "reading"),
          lesson("l7", "Signing & Fees", "7 min", "reading"),
          lesson("l8", "Build Your First Transaction", "15 min", "challenge"),
        ],
      },
      {
        id: "m3",
        title: "Program Derived Addresses",
        lessons: [
          lesson("l9", "What Are PDAs?", "10 min", "video"),
          lesson("l10", "Deriving Addresses with Seeds", "8 min", "reading"),
          lesson("l11", "PDA Signing & CPIs", "12 min", "reading"),
          lesson("l12", "Challenge: PDA Counter", "20 min", "challenge"),
        ],
      },
      {
        id: "m4",
        title: "The Runtime Model",
        lessons: [
          lesson("l13", "Parallel Execution & Sealevel", "10 min", "video"),
          lesson("l14", "Compute Units & Budgets", "8 min", "reading"),
          lesson("l15", "Syscalls & Sysvars", "7 min", "reading"),
          lesson("l16", "Runtime Constraints Quiz", "5 min", "challenge"),
        ],
      },
      {
        id: "m5",
        title: "Solana CLI & Tooling",
        lessons: [
          lesson("l17", "Setting Up Your Environment", "10 min", "video"),
          lesson("l18", "Solana CLI Deep Dive", "12 min", "reading"),
          lesson("l19", "Using Solana Explorer", "6 min", "reading"),
          lesson("l20", "Deploy Your First Program", "20 min", "challenge"),
        ],
      },
      {
        id: "m6",
        title: "Capstone Project",
        lessons: [
          lesson("l21", "Project Brief: Note Keeper", "5 min", "reading"),
          lesson("l22", "Build the Program", "30 min", "challenge"),
          lesson("l23", "Write Client Code", "20 min", "challenge"),
          lesson("l24", "Submit & Earn Credential", "5 min", "challenge"),
        ],
      },
    ],
    reviews: [
      {
        name: "Rafael M.",
        rating: 5,
        text: "Best Solana intro I've found. The PDA section finally made everything click.",
      },
      {
        name: "Ana P.",
        rating: 5,
        text: "Clear, concise, and the challenges are actually useful. Loved it.",
      },
      {
        name: "Diego L.",
        rating: 4,
        text: "Great foundation course. Would love even more hands-on exercises.",
      },
    ],
  },
  {
    slug: "wallets-and-transactions",
    title: "Wallets & Transactions",
    description:
      "Key pairs, signing, transaction lifecycle, and fee mechanics. Understand what happens under the hood.",
    longDescription:
      "Dive deep into the transaction layer of Solana. From key pair generation and wallet standards to the full transaction lifecycle — serialization, signing, sending, confirmation, and finality. You'll understand fees, priority fees, and how to build reliable transaction flows.",
    difficulty: "Beginner",
    topic: "Core",
    topicLabel: "CORE",
    duration: "2h",
    lessons: 12,
    completed: 0,
    xp: 1200,
    accent: "#34d399",
    icon: Wallet,
    codePreview: [
      "const tx = new Transaction();",
      "tx.add(transferInstruction);",
      "const sig = await sendAndConfirm",
      "  (connection, tx, [payer]);",
    ],
    instructor: { name: "Mariana Costa", role: "Developer Relations" },
    modules: [
      {
        id: "m1",
        title: "Keys & Wallets",
        lessons: [
          lesson("l1", "Public & Private Keys", "8 min", "video"),
          lesson("l2", "Wallet Standards (Wallet Adapter)", "10 min", "reading"),
          lesson("l3", "Generate a Keypair", "10 min", "challenge"),
        ],
      },
      {
        id: "m2",
        title: "Transaction Lifecycle",
        lessons: [
          lesson("l4", "Building Transactions", "10 min", "video"),
          lesson("l5", "Signing & Serialization", "8 min", "reading"),
          lesson("l6", "Sending & Confirmation", "8 min", "reading"),
          lesson("l7", "Build a Transfer Flow", "15 min", "challenge"),
        ],
      },
      {
        id: "m3",
        title: "Fees & Optimization",
        lessons: [
          lesson("l8", "Fee Mechanics", "8 min", "video"),
          lesson("l9", "Priority Fees & Compute", "7 min", "reading"),
          lesson("l10", "Versioned Transactions", "8 min", "reading"),
          lesson("l11", "Retry Strategies", "6 min", "reading"),
          lesson("l12", "Final Quiz", "5 min", "challenge"),
        ],
      },
    ],
    reviews: [
      {
        name: "Carlos B.",
        rating: 5,
        text: "Finally understand how transactions actually work end to end.",
      },
      {
        name: "Julia R.",
        rating: 4,
        text: "Good pace. The retry strategies section was especially helpful.",
      },
    ],
  },
  {
    slug: "token-program-basics",
    title: "Token Program Basics",
    description:
      "SPL tokens, minting, associated token accounts, and Token-2022 extensions. Build your first token.",
    longDescription:
      "Learn everything about tokens on Solana — from the original SPL Token Program to the new Token-2022 extensions. Create mints, manage associated token accounts, mint and transfer tokens, and explore extensions like transfer fees, interest-bearing tokens, and non-transferable tokens.",
    difficulty: "Beginner",
    topic: "Core",
    topicLabel: "CORE",
    duration: "3h",
    lessons: 16,
    completed: 0,
    xp: 1600,
    accent: "#34d399",
    icon: Coins,
    codePreview: [
      "let mint = &ctx.accounts.mint;",
      "let ata = get_associated_token",
      "  _address(&owner, &mint.key());",
      "mint_to(cpi_ctx, amount)?;",
    ],
    instructor: { name: "Lucas Silva", role: "Core Contributor" },
    modules: [
      {
        id: "m1",
        title: "Token Fundamentals",
        lessons: [
          lesson("l1", "How Tokens Work on Solana", "10 min", "video"),
          lesson("l2", "Mints & Token Accounts", "8 min", "reading"),
          lesson("l3", "Associated Token Accounts", "8 min", "reading"),
          lesson("l4", "Create Your First Token", "15 min", "challenge"),
        ],
      },
      {
        id: "m2",
        title: "Token Operations",
        lessons: [
          lesson("l5", "Minting & Burning", "8 min", "video"),
          lesson("l6", "Transfers & Approvals", "8 min", "reading"),
          lesson("l7", "Freeze & Thaw", "6 min", "reading"),
          lesson("l8", "Token Operations Challenge", "15 min", "challenge"),
        ],
      },
      {
        id: "m3",
        title: "Token-2022 Extensions",
        lessons: [
          lesson("l9", "Introduction to Token-2022", "10 min", "video"),
          lesson("l10", "Transfer Fees", "8 min", "reading"),
          lesson("l11", "Non-Transferable Tokens", "8 min", "reading"),
          lesson("l12", "Interest-Bearing Tokens", "7 min", "reading"),
          lesson("l13", "Permanent Delegate", "6 min", "reading"),
          lesson("l14", "Metadata Extension", "6 min", "reading"),
          lesson("l15", "Build a Token-2022 Mint", "20 min", "challenge"),
          lesson("l16", "Final Assessment", "10 min", "challenge"),
        ],
      },
    ],
    reviews: [
      {
        name: "Pedro H.",
        rating: 5,
        text: "Token-2022 section is gold. Nowhere else explains extensions this well.",
      },
      {
        name: "Fernanda S.",
        rating: 5,
        text: "Loved the hands-on approach. Actually built a token by the end!",
      },
    ],
  },
  {
    slug: "anchor-development",
    title: "Anchor Development",
    description:
      "Build and deploy programs with the Anchor framework. Macros, IDL generation, and account validation.",
    longDescription:
      "Go from zero to deploying production programs with Anchor. Learn the macro system, account constraints, error handling, events, IDL generation, and client-side integration. By the end, you'll build and deploy a fully functional program with a TypeScript client.",
    difficulty: "Intermediate",
    topic: "Framework",
    topicLabel: "FRAMEWORK",
    duration: "5h",
    lessons: 18,
    completed: 0,
    xp: 1800,
    accent: "#eab308",
    icon: Anchor,
    codePreview: [
      "#[program]",
      "pub mod counter {",
      "  pub fn increment(ctx: Ctx)",
      "    -> Result<()> { .. }",
    ],
    instructor: { name: "Thiago Ramos", role: "Anchor Maintainer" },
    modules: [
      {
        id: "m1",
        title: "Anchor Basics",
        lessons: [
          lesson("l1", "Why Anchor?", "8 min", "video"),
          lesson("l2", "Project Structure & Setup", "10 min", "reading"),
          lesson("l3", "The #[program] Macro", "10 min", "reading"),
          lesson("l4", "Hello World Program", "15 min", "challenge"),
        ],
      },
      {
        id: "m2",
        title: "Accounts & Constraints",
        lessons: [
          lesson("l5", "Account Structs & Validation", "12 min", "video"),
          lesson("l6", "Init, Mut, Signer, Seeds", "10 min", "reading"),
          lesson("l7", "Has One, Close, Realloc", "8 min", "reading"),
          lesson("l8", "Build a Counter Program", "20 min", "challenge"),
        ],
      },
      {
        id: "m3",
        title: "Advanced Anchor",
        lessons: [
          lesson("l9", "Error Handling & Events", "10 min", "video"),
          lesson("l10", "CPIs in Anchor", "12 min", "reading"),
          lesson("l11", "IDL & Client Generation", "8 min", "reading"),
          lesson("l12", "TypeScript Client Integration", "10 min", "reading"),
          lesson("l13", "Full-Stack Anchor App", "25 min", "challenge"),
        ],
      },
      {
        id: "m4",
        title: "Deployment & Testing",
        lessons: [
          lesson("l14", "Local Validator & Bankrun", "10 min", "video"),
          lesson("l15", "Writing Anchor Tests", "12 min", "reading"),
          lesson("l16", "Deploying to Devnet", "8 min", "reading"),
          lesson("l17", "Upgrade Authority & Verification", "8 min", "reading"),
          lesson("l18", "Capstone: Deploy & Verify", "20 min", "challenge"),
        ],
      },
    ],
    reviews: [
      {
        name: "Matheus G.",
        rating: 5,
        text: "Anchor finally makes sense. The constraint deep-dive was exactly what I needed.",
      },
      {
        name: "Isabella F.",
        rating: 4,
        text: "Great course. Would love a section on Anchor 0.31 migration.",
      },
      {
        name: "Ricardo N.",
        rating: 5,
        text: "Best Anchor course available. The capstone project ties everything together perfectly.",
      },
    ],
  },
  {
    slug: "testing-with-bankrun",
    title: "Testing with Bankrun",
    description:
      "Unit tests, integration tests, and fuzzing for Solana programs. Mollusk, LiteSVM, and test patterns.",
    longDescription:
      "Learn how to thoroughly test Solana programs. From fast unit tests with Mollusk to integration tests with LiteSVM and Bankrun, to fuzz testing with Trident. You'll build a comprehensive test suite that catches bugs before they hit mainnet.",
    difficulty: "Intermediate",
    topic: "Framework",
    topicLabel: "FRAMEWORK",
    duration: "3h",
    lessons: 14,
    completed: 0,
    xp: 1400,
    accent: "#eab308",
    icon: TestTube,
    codePreview: [
      "let mut ctx = ProgramTest::new(",
      '  "my_program",',
      "  program_id,",
      "  processor!(process));",
    ],
    instructor: { name: "Thiago Ramos", role: "Anchor Maintainer" },
    modules: [
      {
        id: "m1",
        title: "Testing Fundamentals",
        lessons: [
          lesson("l1", "Why Testing Matters on Solana", "8 min", "video"),
          lesson("l2", "Testing Tools Overview", "6 min", "reading"),
          lesson("l3", "Setting Up Test Infrastructure", "10 min", "challenge"),
        ],
      },
      {
        id: "m2",
        title: "Unit Testing",
        lessons: [
          lesson("l4", "Mollusk for Fast Unit Tests", "10 min", "video"),
          lesson("l5", "Testing Instructions Individually", "12 min", "reading"),
          lesson("l6", "Mocking Accounts & Sysvars", "8 min", "reading"),
          lesson("l7", "Write Unit Tests", "15 min", "challenge"),
        ],
      },
      {
        id: "m3",
        title: "Integration & Fuzz Testing",
        lessons: [
          lesson("l8", "LiteSVM & Bankrun", "10 min", "video"),
          lesson("l9", "End-to-End Test Flows", "12 min", "reading"),
          lesson("l10", "Fuzz Testing with Trident", "10 min", "reading"),
          lesson("l11", "Build a Full Test Suite", "20 min", "challenge"),
        ],
      },
      {
        id: "m4",
        title: "CU Profiling & Optimization",
        lessons: [
          lesson("l12", "Measuring Compute Units", "8 min", "video"),
          lesson("l13", "CU Optimization Patterns", "10 min", "reading"),
          lesson("l14", "Profile & Optimize Challenge", "15 min", "challenge"),
        ],
      },
    ],
    reviews: [
      {
        name: "André K.",
        rating: 5,
        text: "Finally a proper testing course for Solana. The Mollusk section is excellent.",
      },
      {
        name: "Laura M.",
        rating: 4,
        text: "Practical and well-structured. Saved me hours of debugging.",
      },
    ],
  },
  {
    slug: "program-security",
    title: "Program Security",
    description:
      "Common vulnerabilities, access control patterns, and audit techniques. Secure your programs before mainnet.",
    longDescription:
      "Learn to think like an auditor. This course covers the most common Solana program vulnerabilities — missing signer checks, account validation flaws, arithmetic overflow, re-initialization attacks — and teaches you the defensive patterns to prevent them. Includes real-world case studies from past exploits.",
    difficulty: "Intermediate",
    topic: "Security",
    topicLabel: "SECURITY",
    duration: "4h",
    lessons: 20,
    completed: 0,
    xp: 2000,
    accent: "#f472b6",
    icon: Shield,
    codePreview: [
      "require!(ctx.accounts.authority",
      "  .key() == config.admin,",
      "  ErrorCode::Unauthorized);",
      "// checked_add prevents overflow",
    ],
    instructor: { name: "Camila Duarte", role: "Security Researcher" },
    modules: [
      {
        id: "m1",
        title: "Security Mindset",
        lessons: [
          lesson("l1", "Why Security Matters", "8 min", "video"),
          lesson("l2", "Solana's Trust Model", "8 min", "reading"),
          lesson("l3", "Common Vulnerability Classes", "10 min", "reading"),
          lesson("l4", "Spot the Bug Quiz", "10 min", "challenge"),
        ],
      },
      {
        id: "m2",
        title: "Account Validation",
        lessons: [
          lesson("l5", "Missing Signer Checks", "10 min", "video"),
          lesson("l6", "Owner & Type Validation", "8 min", "reading"),
          lesson("l7", "PDA Verification Patterns", "10 min", "reading"),
          lesson("l8", "Account Validation Challenge", "15 min", "challenge"),
        ],
      },
      {
        id: "m3",
        title: "Arithmetic & State",
        lessons: [
          lesson("l9", "Integer Overflow & Underflow", "8 min", "video"),
          lesson("l10", "Checked vs Unchecked Math", "8 min", "reading"),
          lesson("l11", "Re-initialization Attacks", "8 min", "reading"),
          lesson("l12", "State Manipulation Challenge", "15 min", "challenge"),
        ],
      },
      {
        id: "m4",
        title: "Advanced Patterns",
        lessons: [
          lesson("l13", "CPI Security", "10 min", "video"),
          lesson("l14", "Closing Accounts Safely", "8 min", "reading"),
          lesson("l15", "Frontrunning & MEV", "8 min", "reading"),
          lesson("l16", "Advanced Security Challenge", "15 min", "challenge"),
        ],
      },
      {
        id: "m5",
        title: "Audit Practices",
        lessons: [
          lesson("l17", "Case Study: Past Exploits", "12 min", "video"),
          lesson("l18", "Audit Checklist", "8 min", "reading"),
          lesson("l19", "Self-Audit Your Program", "20 min", "challenge"),
          lesson("l20", "Final Assessment", "10 min", "challenge"),
        ],
      },
    ],
    reviews: [
      {
        name: "Marcos V.",
        rating: 5,
        text: "Essential course. The exploit case studies really drive the lessons home.",
      },
      {
        name: "Beatriz A.",
        rating: 5,
        text: "Every Solana dev should take this. Found two bugs in my own code after.",
      },
      {
        name: "Gustavo T.",
        rating: 4,
        text: "Thorough and practical. The audit checklist is now my go-to reference.",
      },
    ],
  },
  {
    slug: "amm-design",
    title: "AMM Design",
    description:
      "Constant product AMMs, concentrated liquidity, and swap mechanics. Build a decentralized exchange.",
    longDescription:
      "Build a decentralized exchange from scratch. Start with the constant product formula (x*y=k), implement swap mechanics, add liquidity provision, and explore concentrated liquidity concepts. You'll deploy a working AMM program on devnet by the end.",
    difficulty: "Advanced",
    topic: "DeFi",
    topicLabel: "DEFI",
    duration: "5h",
    lessons: 15,
    completed: 0,
    xp: 1500,
    accent: "#22d3ee",
    icon: ArrowLeftRight,
    codePreview: [
      "let pool = &ctx.accounts.pool;",
      "let price = pool.sqrt_price;",
      "swap_exact_in(pool, amount,",
      "  min_out)?;",
    ],
    instructor: { name: "Felipe Moura", role: "DeFi Engineer" },
    modules: [
      {
        id: "m1",
        title: "AMM Fundamentals",
        lessons: [
          lesson("l1", "What Are AMMs?", "10 min", "video"),
          lesson("l2", "The Constant Product Formula", "10 min", "reading"),
          lesson("l3", "Price Impact & Slippage", "8 min", "reading"),
          lesson("l4", "AMM Math Quiz", "10 min", "challenge"),
        ],
      },
      {
        id: "m2",
        title: "Building the Pool",
        lessons: [
          lesson("l5", "Pool Account Design", "10 min", "video"),
          lesson("l6", "Initialize Pool Instruction", "12 min", "reading"),
          lesson("l7", "Add Liquidity", "12 min", "reading"),
          lesson("l8", "Build Pool Program", "25 min", "challenge"),
        ],
      },
      {
        id: "m3",
        title: "Swap Mechanics",
        lessons: [
          lesson("l9", "Swap Implementation", "12 min", "video"),
          lesson("l10", "Fee Structure", "8 min", "reading"),
          lesson("l11", "Remove Liquidity", "8 min", "reading"),
          lesson("l12", "Full Swap Challenge", "25 min", "challenge"),
        ],
      },
      {
        id: "m4",
        title: "Advanced Topics",
        lessons: [
          lesson("l13", "Concentrated Liquidity Concepts", "12 min", "video"),
          lesson("l14", "Oracle Integration", "10 min", "reading"),
          lesson("l15", "Deploy Your AMM", "20 min", "challenge"),
        ],
      },
    ],
    reviews: [
      {
        name: "Henrique S.",
        rating: 5,
        text: "Actually built a working AMM. The math explanations are crystal clear.",
      },
      {
        name: "Valentina R.",
        rating: 4,
        text: "Challenging but rewarding. Would love a Part 2 on CLMM.",
      },
    ],
  },
  {
    slug: "lending-protocols",
    title: "Lending Protocols",
    description:
      "Collateral management, interest rate models, and liquidation mechanics. Understand DeFi primitives.",
    longDescription:
      "Understand how lending protocols work at the program level. Design collateral vaults, implement interest rate curves, build health factor calculations, and code liquidation mechanics. Essential knowledge for any DeFi developer.",
    difficulty: "Advanced",
    topic: "DeFi",
    topicLabel: "DEFI",
    duration: "4h",
    lessons: 12,
    completed: 0,
    xp: 1200,
    accent: "#22d3ee",
    icon: Landmark,
    codePreview: [
      "let health = collateral_value",
      "  .checked_div(debt_value)?;",
      "require!(health >= MIN_HEALTH,",
      "  ErrorCode::Undercollat);",
    ],
    instructor: { name: "Felipe Moura", role: "DeFi Engineer" },
    modules: [
      {
        id: "m1",
        title: "Lending Fundamentals",
        lessons: [
          lesson("l1", "How Lending Protocols Work", "10 min", "video"),
          lesson("l2", "Collateral & Borrowing", "8 min", "reading"),
          lesson("l3", "Interest Rate Models", "10 min", "reading"),
        ],
      },
      {
        id: "m2",
        title: "Building the Protocol",
        lessons: [
          lesson("l4", "Vault Account Design", "10 min", "video"),
          lesson("l5", "Deposit & Withdraw", "12 min", "reading"),
          lesson("l6", "Borrow & Repay", "12 min", "reading"),
          lesson("l7", "Build Lending Program", "25 min", "challenge"),
        ],
      },
      {
        id: "m3",
        title: "Risk & Liquidation",
        lessons: [
          lesson("l8", "Health Factor Calculation", "10 min", "video"),
          lesson("l9", "Liquidation Mechanics", "10 min", "reading"),
          lesson("l10", "Oracle Price Feeds", "8 min", "reading"),
          lesson("l11", "Implement Liquidation", "20 min", "challenge"),
          lesson("l12", "Final Assessment", "10 min", "challenge"),
        ],
      },
    ],
    reviews: [
      {
        name: "Rodrigo F.",
        rating: 5,
        text: "Finally understand how Solend/Marginfi work under the hood. Incredible.",
      },
      {
        name: "Camila N.",
        rating: 5,
        text: "The liquidation implementation section is worth the entire course.",
      },
    ],
  },
  {
    slug: "cross-program-invocations",
    title: "Cross-Program Invocations",
    description:
      "CPIs, program-derived addresses, and composable program design. Connect programs together.",
    longDescription:
      "Master the art of composable Solana programs. Learn how to call other programs via CPIs, sign with PDAs, handle cross-program account validation, and design programs that compose cleanly with the broader ecosystem.",
    difficulty: "Advanced",
    topic: "DeFi",
    topicLabel: "DEFI",
    duration: "3h",
    lessons: 10,
    completed: 0,
    xp: 1000,
    accent: "#22d3ee",
    icon: GitBranch,
    codePreview: [
      "let cpi_ctx = CpiContext::new(",
      "  token_program.to_account_info(),",
      "  Transfer { from, to, auth },",
      ").with_signer(&[&seeds]);",
    ],
    instructor: { name: "Thiago Ramos", role: "Anchor Maintainer" },
    modules: [
      {
        id: "m1",
        title: "CPI Fundamentals",
        lessons: [
          lesson("l1", "What Are CPIs?", "8 min", "video"),
          lesson("l2", "invoke vs invoke_signed", "10 min", "reading"),
          lesson("l3", "PDA Signing in CPIs", "10 min", "reading"),
        ],
      },
      {
        id: "m2",
        title: "Common CPI Patterns",
        lessons: [
          lesson("l4", "Token Transfers via CPI", "10 min", "video"),
          lesson("l5", "Creating Accounts via CPI", "10 min", "reading"),
          lesson("l6", "CPI to System Program", "8 min", "reading"),
          lesson("l7", "Multi-CPI Challenge", "20 min", "challenge"),
        ],
      },
      {
        id: "m3",
        title: "Composable Design",
        lessons: [
          lesson("l8", "Designing for Composability", "10 min", "video"),
          lesson("l9", "Account Reloading After CPI", "8 min", "reading"),
          lesson("l10", "Build a Composable Program", "25 min", "challenge"),
        ],
      },
    ],
    reviews: [
      {
        name: "Bruno T.",
        rating: 5,
        text: "CPIs went from terrifying to intuitive. The PDA signing section is perfect.",
      },
      {
        name: "Larissa D.",
        rating: 4,
        text: "Short but packed with value. Every example is practical.",
      },
    ],
  },
];

export function getCourseBySlug(slug: string): CourseDetail | undefined {
  return courses.find((c) => c.slug === slug);
}

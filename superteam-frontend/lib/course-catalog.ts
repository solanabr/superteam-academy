export interface Course {
  slug: string;
  title: string;
  description: string;
  instructor: string;
  instructorAvatar: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  lessons: number;
  modules: Module[];
  rating: number;
  enrolled: number;
  tags: string[];
  progress: number;
  xp: number;
  thumbnail: string;
}

export interface Module {
  title: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  type: "video" | "reading" | "challenge";
  duration: string;
  completed: boolean;
}

export const courses: Course[] = [
  {
    slug: "solana-fundamentals",
    title: "Solana Fundamentals",
    description:
      "Master the basics of Solana blockchain development. Learn about accounts, transactions, programs, and the Solana runtime from scratch.",
    instructor: "Ana Silva",
    instructorAvatar: "AS",
    difficulty: "Beginner",
    duration: "12h 30m",
    lessons: 42,
    rating: 4.9,
    enrolled: 0,
    tags: ["Solana", "Blockchain", "Rust"],
    progress: 0,
    xp: 2400,
    thumbnail: "/solana.jpg",
    modules: [
      {
        title: "Introduction to Solana",
        lessons: [
          {
            id: "1-1",
            title: "What is Solana?",
            type: "reading",
            duration: "8m",
            completed: false,
          },
          {
            id: "1-2",
            title: "Architecture Overview",
            type: "video",
            duration: "15m",
            completed: false,
          },
          {
            id: "1-3",
            title: "Setting Up Your Environment",
            type: "challenge",
            duration: "20m",
            completed: false,
          },
        ],
      },
      {
        title: "Accounts & Data",
        lessons: [
          {
            id: "2-1",
            title: "Account Model Deep Dive",
            type: "reading",
            duration: "12m",
            completed: false,
          },
          {
            id: "2-2",
            title: "Creating Accounts",
            type: "challenge",
            duration: "25m",
            completed: false,
          },
          {
            id: "2-3",
            title: "Program Derived Addresses",
            type: "video",
            duration: "18m",
            completed: false,
          },
        ],
      },
      {
        title: "Transactions & Instructions",
        lessons: [
          {
            id: "3-1",
            title: "Transaction Anatomy",
            type: "reading",
            duration: "10m",
            completed: false,
          },
          {
            id: "3-2",
            title: "Building Transactions",
            type: "challenge",
            duration: "30m",
            completed: false,
          },
          {
            id: "3-3",
            title: "Error Handling",
            type: "video",
            duration: "14m",
            completed: false,
          },
        ],
      },
      {
        title: "Building Your First Program",
        lessons: [
          {
            id: "4-1",
            title: "Hello World Program",
            type: "challenge",
            duration: "35m",
            completed: false,
          },
          {
            id: "4-2",
            title: "Testing Programs",
            type: "reading",
            duration: "15m",
            completed: false,
          },
          {
            id: "4-3",
            title: "Deploying to Devnet",
            type: "challenge",
            duration: "20m",
            completed: false,
          },
        ],
      },
    ],
  },
  {
    slug: "anchor-framework",
    title: "Anchor Framework Mastery",
    description:
      "Build production-ready Solana programs with Anchor. Cover PDAs, CPIs, token management, and security patterns.",
    instructor: "Carlos Mendes",
    instructorAvatar: "CM",
    difficulty: "Intermediate",
    duration: "18h 45m",
    lessons: 56,
    rating: 4.8,
    enrolled: 0,
    tags: ["Anchor", "Solana", "Rust"],
    progress: 0,
    xp: 3600,
    thumbnail: "/anchor.jpg",
    modules: [
      {
        title: "Getting Started with Anchor",
        lessons: [
          {
            id: "a-1-1",
            title: "Why Anchor?",
            type: "reading",
            duration: "10m",
            completed: false,
          },
          {
            id: "a-1-2",
            title: "Project Setup",
            type: "challenge",
            duration: "20m",
            completed: false,
          },
          {
            id: "a-1-3",
            title: "Anchor Account Types",
            type: "video",
            duration: "22m",
            completed: false,
          },
        ],
      },
      {
        title: "Advanced Account Management",
        lessons: [
          {
            id: "a-2-1",
            title: "PDAs in Anchor",
            type: "reading",
            duration: "15m",
            completed: false,
          },
          {
            id: "a-2-2",
            title: "Account Constraints",
            type: "challenge",
            duration: "30m",
            completed: false,
          },
          {
            id: "a-2-3",
            title: "Cross-Program Invocations",
            type: "video",
            duration: "25m",
            completed: false,
          },
        ],
      },
    ],
  },
  {
    slug: "defi-development",
    title: "DeFi Protocol Development",
    description:
      "Design and implement decentralized finance protocols. AMMs, lending platforms, yield aggregators, and oracle integration.",
    instructor: "Lucia Oliveira",
    instructorAvatar: "LO",
    difficulty: "Advanced",
    duration: "24h 10m",
    lessons: 64,
    rating: 4.7,
    enrolled: 0,
    tags: ["DeFi", "Solana", "Smart Contracts"],
    progress: 0,
    xp: 5200,
    thumbnail: "/defi.jpg",
    modules: [
      {
        title: "DeFi Fundamentals",
        lessons: [
          {
            id: "d-1-1",
            title: "What is DeFi?",
            type: "reading",
            duration: "12m",
            completed: false,
          },
          {
            id: "d-1-2",
            title: "AMM Mathematics",
            type: "video",
            duration: "30m",
            completed: false,
          },
          {
            id: "d-1-3",
            title: "Liquidity Pools",
            type: "challenge",
            duration: "40m",
            completed: false,
          },
        ],
      },
    ],
  },
  {
    slug: "nft-marketplace",
    title: "NFT Marketplace Builder",
    description:
      "Build a full-featured NFT marketplace on Solana. Minting, listing, bidding, and collection management with Metaplex.",
    instructor: "Rafael Costa",
    instructorAvatar: "RC",
    difficulty: "Intermediate",
    duration: "16h 20m",
    lessons: 48,
    rating: 4.6,
    enrolled: 0,
    tags: ["NFT", "Metaplex", "Solana"],
    progress: 0,
    xp: 3200,
    thumbnail: "/nft.jpg",
    modules: [
      {
        title: "NFT Standards on Solana",
        lessons: [
          {
            id: "n-1-1",
            title: "Token Metadata Program",
            type: "reading",
            duration: "15m",
            completed: false,
          },
          {
            id: "n-1-2",
            title: "Minting NFTs",
            type: "challenge",
            duration: "25m",
            completed: false,
          },
        ],
      },
    ],
  },
  {
    slug: "web3-security",
    title: "Web3 Security Auditing",
    description:
      "Learn to identify and prevent vulnerabilities in smart contracts. Reentrancy, overflow, access control, and formal verification.",
    instructor: "Mariana Santos",
    instructorAvatar: "MS",
    difficulty: "Advanced",
    duration: "20h 15m",
    lessons: 52,
    rating: 4.9,
    enrolled: 0,
    tags: ["Security", "Auditing", "Smart Contracts"],
    progress: 0,
    xp: 4800,
    thumbnail: "/security.jpg",
    modules: [
      {
        title: "Common Vulnerabilities",
        lessons: [
          {
            id: "s-1-1",
            title: "Reentrancy Attacks",
            type: "reading",
            duration: "20m",
            completed: false,
          },
          {
            id: "s-1-2",
            title: "Integer Overflow",
            type: "challenge",
            duration: "30m",
            completed: false,
          },
        ],
      },
    ],
  },
  {
    slug: "rust-for-blockchain",
    title: "Rust for Blockchain Devs",
    description:
      "Learn Rust programming language specifically tailored for blockchain development. Ownership, lifetimes, and async patterns.",
    instructor: "Pedro Almeida",
    instructorAvatar: "PA",
    difficulty: "Beginner",
    duration: "15h 40m",
    lessons: 50,
    rating: 4.8,
    enrolled: 0,
    tags: ["Rust", "Programming", "Blockchain"],
    progress: 0,
    xp: 2800,
    thumbnail: "/rust.jpg",
    modules: [
      {
        title: "Rust Basics",
        lessons: [
          {
            id: "r-1-1",
            title: "Variables and Types",
            type: "reading",
            duration: "10m",
            completed: false,
          },
          {
            id: "r-1-2",
            title: "Ownership & Borrowing",
            type: "video",
            duration: "25m",
            completed: false,
          },
          {
            id: "r-1-3",
            title: "Structs & Enums",
            type: "challenge",
            duration: "20m",
            completed: false,
          },
        ],
      },
    ],
  },
  {
    slug: "token-extensions",
    title: "Token Extensions (Token-2022)",
    description:
      "Master Solana's Token-2022 program with extensions like transfer fees, non-transferable tokens, metadata pointers, and confidential transfers.",
    instructor: "Beatriz Ferreira",
    instructorAvatar: "BF",
    difficulty: "Intermediate",
    duration: "14h 20m",
    lessons: 44,
    rating: 4.7,
    enrolled: 0,
    tags: ["Token-2022", "SPL", "Solana"],
    progress: 0,
    xp: 3400,
    thumbnail: "/solana.jpg",
    modules: [
      {
        title: "Token-2022 Overview",
        lessons: [
          {
            id: "te-1-1",
            title: "SPL Token vs Token-2022",
            type: "reading",
            duration: "10m",
            completed: false,
          },
          {
            id: "te-1-2",
            title: "Extension Architecture",
            type: "video",
            duration: "18m",
            completed: false,
          },
          {
            id: "te-1-3",
            title: "Creating a Token-2022 Mint",
            type: "challenge",
            duration: "25m",
            completed: false,
          },
        ],
      },
      {
        title: "Core Extensions",
        lessons: [
          {
            id: "te-2-1",
            title: "Transfer Fees",
            type: "reading",
            duration: "12m",
            completed: false,
          },
          {
            id: "te-2-2",
            title: "Non-Transferable Tokens",
            type: "video",
            duration: "15m",
            completed: false,
          },
          {
            id: "te-2-3",
            title: "Permanent Delegate",
            type: "challenge",
            duration: "20m",
            completed: false,
          },
        ],
      },
      {
        title: "Metadata Extensions",
        lessons: [
          {
            id: "te-3-1",
            title: "MetadataPointer Extension",
            type: "reading",
            duration: "10m",
            completed: false,
          },
          {
            id: "te-3-2",
            title: "TokenMetadata Extension",
            type: "video",
            duration: "20m",
            completed: false,
          },
          {
            id: "te-3-3",
            title: "Build a Soulbound Token",
            type: "challenge",
            duration: "35m",
            completed: false,
          },
        ],
      },
    ],
  },
  {
    slug: "compressed-nfts",
    title: "Compressed NFTs & State Compression",
    description:
      "Learn ZK Compression and Bubblegum for minting millions of NFTs at a fraction of the cost using concurrent Merkle trees.",
    instructor: "Diego Martinez",
    instructorAvatar: "DM",
    difficulty: "Advanced",
    duration: "16h 50m",
    lessons: 40,
    rating: 4.6,
    enrolled: 0,
    tags: ["cNFT", "ZK Compression", "Metaplex"],
    progress: 0,
    xp: 4200,
    thumbnail: "/nft.jpg",
    modules: [
      {
        title: "State Compression Fundamentals",
        lessons: [
          {
            id: "cn-1-1",
            title: "Merkle Trees Explained",
            type: "reading",
            duration: "15m",
            completed: false,
          },
          {
            id: "cn-1-2",
            title: "Concurrent Merkle Trees",
            type: "video",
            duration: "22m",
            completed: false,
          },
          {
            id: "cn-1-3",
            title: "Creating a Merkle Tree",
            type: "challenge",
            duration: "30m",
            completed: false,
          },
        ],
      },
      {
        title: "Bubblegum Protocol",
        lessons: [
          {
            id: "cn-2-1",
            title: "Bubblegum Architecture",
            type: "reading",
            duration: "12m",
            completed: false,
          },
          {
            id: "cn-2-2",
            title: "Minting cNFTs",
            type: "challenge",
            duration: "35m",
            completed: false,
          },
          {
            id: "cn-2-3",
            title: "Transferring & Burning cNFTs",
            type: "video",
            duration: "18m",
            completed: false,
          },
        ],
      },
      {
        title: "DAS API & Indexing",
        lessons: [
          {
            id: "cn-3-1",
            title: "Digital Asset Standard API",
            type: "reading",
            duration: "10m",
            completed: false,
          },
          {
            id: "cn-3-2",
            title: "Querying cNFT Collections",
            type: "challenge",
            duration: "25m",
            completed: false,
          },
          {
            id: "cn-3-3",
            title: "Building a cNFT Gallery",
            type: "challenge",
            duration: "40m",
            completed: false,
          },
        ],
      },
    ],
  },
  {
    slug: "solana-mobile",
    title: "Solana Mobile Development",
    description:
      "Build mobile dApps with the Solana Mobile Stack. Mobile Wallet Adapter, dApp Store, and React Native integration.",
    instructor: "Sofia Rodrigues",
    instructorAvatar: "SR",
    difficulty: "Intermediate",
    duration: "13h 15m",
    lessons: 36,
    rating: 4.5,
    enrolled: 0,
    tags: ["Mobile", "React Native", "Solana"],
    progress: 0,
    xp: 3000,
    thumbnail: "/solana.jpg",
    modules: [
      {
        title: "Solana Mobile Stack",
        lessons: [
          {
            id: "sm-1-1",
            title: "SMS Overview",
            type: "reading",
            duration: "8m",
            completed: false,
          },
          {
            id: "sm-1-2",
            title: "Mobile Wallet Adapter",
            type: "video",
            duration: "20m",
            completed: false,
          },
          {
            id: "sm-1-3",
            title: "Setting Up React Native",
            type: "challenge",
            duration: "30m",
            completed: false,
          },
        ],
      },
      {
        title: "Building Mobile dApps",
        lessons: [
          {
            id: "sm-2-1",
            title: "Connecting Wallets on Mobile",
            type: "reading",
            duration: "12m",
            completed: false,
          },
          {
            id: "sm-2-2",
            title: "Signing Transactions",
            type: "challenge",
            duration: "25m",
            completed: false,
          },
          {
            id: "sm-2-3",
            title: "Displaying On-Chain Data",
            type: "video",
            duration: "18m",
            completed: false,
          },
        ],
      },
      {
        title: "dApp Store & Distribution",
        lessons: [
          {
            id: "sm-3-1",
            title: "dApp Store Submission",
            type: "reading",
            duration: "10m",
            completed: false,
          },
          {
            id: "sm-3-2",
            title: "Testing on Device",
            type: "challenge",
            duration: "20m",
            completed: false,
          },
          {
            id: "sm-3-3",
            title: "Publishing Your dApp",
            type: "video",
            duration: "15m",
            completed: false,
          },
        ],
      },
    ],
  },
  {
    slug: "cross-program-invocations",
    title: "Cross-Program Invocations",
    description:
      "Master composability on Solana. Learn CPI patterns, PDA signing, token transfers between programs, and building modular architectures.",
    instructor: "Thiago Nascimento",
    instructorAvatar: "TN",
    difficulty: "Advanced",
    duration: "11h 30m",
    lessons: 32,
    rating: 4.8,
    enrolled: 0,
    tags: ["CPI", "Composability", "Anchor"],
    progress: 0,
    xp: 4000,
    thumbnail: "/anchor.jpg",
    modules: [
      {
        title: "CPI Fundamentals",
        lessons: [
          {
            id: "cpi-1-1",
            title: "What Are CPIs?",
            type: "reading",
            duration: "10m",
            completed: false,
          },
          {
            id: "cpi-1-2",
            title: "invoke vs invoke_signed",
            type: "video",
            duration: "20m",
            completed: false,
          },
          {
            id: "cpi-1-3",
            title: "Your First CPI",
            type: "challenge",
            duration: "30m",
            completed: false,
          },
        ],
      },
      {
        title: "PDA Signing & Token CPIs",
        lessons: [
          {
            id: "cpi-2-1",
            title: "PDA Signers in CPIs",
            type: "reading",
            duration: "12m",
            completed: false,
          },
          {
            id: "cpi-2-2",
            title: "Token Transfer via CPI",
            type: "challenge",
            duration: "35m",
            completed: false,
          },
          {
            id: "cpi-2-3",
            title: "Mint & Burn via CPI",
            type: "video",
            duration: "22m",
            completed: false,
          },
        ],
      },
      {
        title: "Advanced Patterns",
        lessons: [
          {
            id: "cpi-3-1",
            title: "Reloading Accounts After CPI",
            type: "reading",
            duration: "10m",
            completed: false,
          },
          {
            id: "cpi-3-2",
            title: "CPI Depth Limits",
            type: "video",
            duration: "15m",
            completed: false,
          },
          {
            id: "cpi-3-3",
            title: "Building a Modular Protocol",
            type: "challenge",
            duration: "45m",
            completed: false,
          },
        ],
      },
    ],
  },
  {
    slug: "solana-pay",
    title: "Solana Pay Integration",
    description:
      "Integrate Solana Pay for instant, fee-less payments. QR codes, transaction requests, and point-of-sale systems.",
    instructor: "Camila Rocha",
    instructorAvatar: "CR",
    difficulty: "Beginner",
    duration: "8h 45m",
    lessons: 28,
    rating: 4.7,
    enrolled: 0,
    tags: ["Solana Pay", "Payments", "Commerce"],
    progress: 0,
    xp: 2000,
    thumbnail: "/solana.jpg",
    modules: [
      {
        title: "Solana Pay Basics",
        lessons: [
          {
            id: "sp-1-1",
            title: "How Solana Pay Works",
            type: "reading",
            duration: "8m",
            completed: false,
          },
          {
            id: "sp-1-2",
            title: "Transfer Requests",
            type: "video",
            duration: "15m",
            completed: false,
          },
          {
            id: "sp-1-3",
            title: "Generating Payment QR Codes",
            type: "challenge",
            duration: "20m",
            completed: false,
          },
        ],
      },
      {
        title: "Transaction Requests",
        lessons: [
          {
            id: "sp-2-1",
            title: "Transaction Request Spec",
            type: "reading",
            duration: "10m",
            completed: false,
          },
          {
            id: "sp-2-2",
            title: "Building a Payment API",
            type: "challenge",
            duration: "30m",
            completed: false,
          },
          {
            id: "sp-2-3",
            title: "Verifying Payments",
            type: "video",
            duration: "18m",
            completed: false,
          },
        ],
      },
      {
        title: "Point of Sale",
        lessons: [
          {
            id: "sp-3-1",
            title: "Building a POS Terminal",
            type: "challenge",
            duration: "35m",
            completed: false,
          },
          {
            id: "sp-3-2",
            title: "Receipt Tokens",
            type: "reading",
            duration: "12m",
            completed: false,
          },
          {
            id: "sp-3-3",
            title: "Production Deployment",
            type: "video",
            duration: "15m",
            completed: false,
          },
        ],
      },
    ],
  },
  {
    slug: "dao-governance",
    title: "DAO Governance on Solana",
    description:
      "Build decentralized governance systems with SPL Governance. Proposals, voting, treasury management, and council-based DAOs.",
    instructor: "Fernando Lima",
    instructorAvatar: "FL",
    difficulty: "Intermediate",
    duration: "15h 10m",
    lessons: 38,
    rating: 4.5,
    enrolled: 0,
    tags: ["DAO", "Governance", "SPL"],
    progress: 0,
    xp: 3200,
    thumbnail: "/defi.jpg",
    modules: [
      {
        title: "Governance Fundamentals",
        lessons: [
          {
            id: "dao-1-1",
            title: "What is a DAO?",
            type: "reading",
            duration: "10m",
            completed: false,
          },
          {
            id: "dao-1-2",
            title: "SPL Governance Overview",
            type: "video",
            duration: "22m",
            completed: false,
          },
          {
            id: "dao-1-3",
            title: "Creating a Realm",
            type: "challenge",
            duration: "25m",
            completed: false,
          },
        ],
      },
      {
        title: "Proposals & Voting",
        lessons: [
          {
            id: "dao-2-1",
            title: "Proposal Lifecycle",
            type: "reading",
            duration: "12m",
            completed: false,
          },
          {
            id: "dao-2-2",
            title: "Token-Weighted Voting",
            type: "video",
            duration: "18m",
            completed: false,
          },
          {
            id: "dao-2-3",
            title: "Creating & Executing Proposals",
            type: "challenge",
            duration: "35m",
            completed: false,
          },
        ],
      },
      {
        title: "Treasury & Advanced Patterns",
        lessons: [
          {
            id: "dao-3-1",
            title: "Treasury Management",
            type: "reading",
            duration: "10m",
            completed: false,
          },
          {
            id: "dao-3-2",
            title: "Multi-sig Councils",
            type: "video",
            duration: "20m",
            completed: false,
          },
          {
            id: "dao-3-3",
            title: "Building a Full DAO",
            type: "challenge",
            duration: "45m",
            completed: false,
          },
        ],
      },
    ],
  },
];

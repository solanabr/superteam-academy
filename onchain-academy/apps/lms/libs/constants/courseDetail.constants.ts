// ─── Course Detail Page — Extended Mock Data ─────────────────
// Enriches existing mockData courses with deeper module/lesson
// trees, more reviews, prerequisite info, and learning outcomes.

import type { Course } from './mockData'

export interface CourseDetailExtra {
  longDescription: string
  learningOutcomes: string[]
  prerequisites: string[]
  enrolledCount: number
  rating: number
  ratingCount: number
  lastUpdated: string
  language: string
  certificate: boolean
  onChainCredential: boolean
}

/** Extended detail for each course slug */
export const courseDetailExtras: Record<string, CourseDetailExtra> = {
  'solana-fundamentals': {
    longDescription:
      'This comprehensive course takes you from zero to confidently building on Solana. You will learn how accounts work, how transactions flow through the runtime, how to derive program addresses (PDAs), and how to write your first on-chain program. Each module blends video lectures with hands-on code challenges so knowledge is immediately applied.',
    learningOutcomes: [
      'Understand Solana"s account model and runtime architecture',
      'Construct and submit transactions using @solana/web3.js',
      'Derive and use Program Derived Addresses (PDAs)',
      'Perform Cross-Program Invocations (CPIs)',
      'Set up a local Solana development environment',
      'Deploy your first program to devnet',
    ],
    prerequisites: [
      'Basic programming knowledge (any language)',
      'Command-line familiarity',
    ],
    enrolledCount: 2847,
    rating: 4.8,
    ratingCount: 312,
    lastUpdated: 'Feb 2025',
    language: 'English',
    certificate: true,
    onChainCredential: true,
  },
  'anchor-development': {
    longDescription:
      'Master the Anchor framework — the production standard for Solana program development. This course covers project scaffolding, account validation, error handling, testing strategies, and deployment workflows. By the end, you will be able to build, test, and ship Anchor programs with confidence.',
    learningOutcomes: [
      'Scaffold Anchor projects from scratch',
      'Define accounts with proper validation constraints',
      'Implement custom error handling and events',
      'Write comprehensive integration tests',
      'Deploy and upgrade programs safely',
      'Use Anchor"s IDL for client generation',
    ],
    prerequisites: ['Solana Fundamentals (or equivalent)', 'Rust basics'],
    enrolledCount: 1563,
    rating: 4.7,
    ratingCount: 189,
    lastUpdated: 'Jan 2025',
    language: 'English',
    certificate: true,
    onChainCredential: true,
  },
  'defi-protocols': {
    longDescription:
      'Dive deep into DeFi protocol design on Solana. You will build an AMM from scratch, implement a lending pool, design yield aggregation strategies, and learn how to audit DeFi smart contracts for common vulnerabilities. Real-world case studies from Raydium, Marinade, and Drift are included.',
    learningOutcomes: [
      'Design and implement an AMM with constant product formula',
      'Build a lending/borrowing protocol with interest accrual',
      'Implement oracle integrations (Pyth, Switchboard)',
      'Understand liquidation mechanisms',
      'Audit DeFi programs for reentrancy and overflow bugs',
      'Deploy a full DeFi stack to devnet',
    ],
    prerequisites: [
      'Anchor Framework Mastery',
      'Intermediate Rust',
      'Basic DeFi concepts',
    ],
    enrolledCount: 892,
    rating: 4.9,
    ratingCount: 97,
    lastUpdated: 'Jan 2025',
    language: 'English',
    certificate: true,
    onChainCredential: true,
  },
  'solana-frontend': {
    longDescription:
      'Connect beautiful frontends to on-chain Solana programs. This course covers wallet adapters, transaction building in the browser, real-time account subscriptions, and UI patterns for common dApp flows like token swaps, NFT minting, and staking dashboards.',
    learningOutcomes: [
      'Integrate Solana wallet adapters into React apps',
      'Build and send transactions from the browser',
      'Subscribe to real-time account changes',
      'Display on-chain data with proper loading states',
      'Handle transaction confirmation UX',
      'Build responsive dApp interfaces',
    ],
    prerequisites: ['React basics', 'JavaScript/TypeScript fundamentals'],
    enrolledCount: 2103,
    rating: 4.5,
    ratingCount: 156,
    lastUpdated: 'Dec 2024',
    language: 'English',
    certificate: true,
    onChainCredential: false,
  },
  'solana-security': {
    longDescription:
      'Learn to think like an auditor. This course covers the most common Solana vulnerabilities — from missing signer checks and PDA seed collisions to arithmetic overflows and reentrancy via CPI. Each module includes a vulnerable program for you to exploit and then fix.',
    learningOutcomes: [
      'Identify missing signer and owner checks',
      'Detect PDA seed collision vulnerabilities',
      'Find arithmetic overflow/underflow bugs',
      'Understand CPI-based reentrancy risks',
      'Write comprehensive security test suites',
      'Produce a professional audit report',
    ],
    prerequisites: ['Anchor Framework Mastery', 'Intermediate Rust'],
    enrolledCount: 674,
    rating: 4.9,
    ratingCount: 82,
    lastUpdated: 'Feb 2025',
    language: 'English',
    certificate: true,
    onChainCredential: true,
  },
  'nft-development': {
    longDescription:
      'From Metaplex to compressed NFTs — master every aspect of NFT development on Solana. This course covers metadata standards, minting flows, royalty enforcement, compressed NFT trees, and marketplace integration patterns.',
    learningOutcomes: [
      'Create NFT collections using Metaplex',
      'Implement candy machine minting flows',
      'Work with compressed NFTs (cNFTs) and Bubblegum',
      'Enforce on-chain royalties',
      'Build NFT marketplace features',
      'Integrate with Magic Eden and Tensor APIs',
    ],
    prerequisites: ['Solana Fundamentals', 'Basic Anchor knowledge'],
    enrolledCount: 1241,
    rating: 4.6,
    ratingCount: 134,
    lastUpdated: 'Jan 2025',
    language: 'English',
    certificate: true,
    onChainCredential: true,
  },
}

/** Extended modules for courses that only have stubs in mockData */
export const extendedModules: Record<string, Course['modules']> = {
  'anchor-development': [
    {
      id: 'm1',
      title: 'Anchor Basics',
      lessons: [
        {
          id: 'l1',
          title: 'Why Anchor?',
          type: 'Video',
          duration: '10 min',
          completed: false,
        },
        {
          id: 'l2',
          title: 'Project Setup',
          type: 'Code Challenge',
          duration: '15 min',
          completed: false,
        },
        {
          id: 'l3',
          title: 'Program Structure',
          type: 'Reading',
          duration: '12 min',
          completed: false,
        },
      ],
    },
    {
      id: 'm2',
      title: 'Account Validation',
      lessons: [
        {
          id: 'l4',
          title: 'Account Constraints',
          type: 'Video',
          duration: '18 min',
          completed: false,
        },
        {
          id: 'l5',
          title: 'Custom Validation Logic',
          type: 'Reading',
          duration: '10 min',
          completed: false,
        },
        {
          id: 'l6',
          title: 'Build a Token Vault',
          type: 'Code Challenge',
          duration: '30 min',
          completed: false,
        },
      ],
    },
    {
      id: 'm3',
      title: 'Error Handling & Events',
      lessons: [
        {
          id: 'l7',
          title: 'Custom Errors',
          type: 'Video',
          duration: '14 min',
          completed: false,
          locked: true,
        },
        {
          id: 'l8',
          title: 'Event Emission',
          type: 'Reading',
          duration: '8 min',
          completed: false,
          locked: true,
        },
        {
          id: 'l9',
          title: 'Error Recovery Patterns',
          type: 'Code Challenge',
          duration: '25 min',
          completed: false,
          locked: true,
        },
      ],
    },
    {
      id: 'm4',
      title: 'Testing & Deployment',
      lessons: [
        {
          id: 'l10',
          title: 'Integration Tests',
          type: 'Video',
          duration: '20 min',
          completed: false,
          locked: true,
        },
        {
          id: 'l11',
          title: 'Deploy to Devnet',
          type: 'Code Challenge',
          duration: '20 min',
          completed: false,
          locked: true,
        },
      ],
    },
  ],
  'defi-protocols': [
    {
      id: 'm1',
      title: 'DeFi Foundations',
      lessons: [
        {
          id: 'l1',
          title: 'DeFi Landscape on Solana',
          type: 'Video',
          duration: '15 min',
          completed: false,
        },
        {
          id: 'l2',
          title: 'Token Standards & SPL',
          type: 'Reading',
          duration: '10 min',
          completed: false,
        },
      ],
    },
    {
      id: 'm2',
      title: 'AMM Architecture',
      lessons: [
        {
          id: 'l3',
          title: 'Constant Product Formula',
          type: 'Video',
          duration: '20 min',
          completed: false,
        },
        {
          id: 'l4',
          title: 'Liquidity Pool Design',
          type: 'Reading',
          duration: '15 min',
          completed: false,
        },
        {
          id: 'l5',
          title: 'Build a Swap Program',
          type: 'Code Challenge',
          duration: '40 min',
          completed: false,
        },
      ],
    },
    {
      id: 'm3',
      title: 'Lending Protocols',
      lessons: [
        {
          id: 'l6',
          title: 'Interest Rate Models',
          type: 'Video',
          duration: '18 min',
          completed: false,
          locked: true,
        },
        {
          id: 'l7',
          title: 'Collateral & Liquidation',
          type: 'Reading',
          duration: '15 min',
          completed: false,
          locked: true,
        },
        {
          id: 'l8',
          title: 'Build a Lending Pool',
          type: 'Code Challenge',
          duration: '45 min',
          completed: false,
          locked: true,
        },
      ],
    },
  ],
  'solana-frontend': [
    {
      id: 'm1',
      title: 'Wallet Integration',
      lessons: [
        {
          id: 'l1',
          title: 'Wallet Adapter Setup',
          type: 'Video',
          duration: '12 min',
          completed: true,
        },
        {
          id: 'l2',
          title: 'Connect Button UX',
          type: 'Code Challenge',
          duration: '15 min',
          completed: true,
        },
      ],
    },
    {
      id: 'm2',
      title: 'Transaction Building',
      lessons: [
        {
          id: 'l3',
          title: 'Building Transactions in React',
          type: 'Video',
          duration: '18 min',
          completed: true,
        },
        {
          id: 'l4',
          title: 'Transaction Confirmation UI',
          type: 'Reading',
          duration: '10 min',
          completed: false,
          active: true,
        },
        {
          id: 'l5',
          title: 'Token Transfer dApp',
          type: 'Code Challenge',
          duration: '25 min',
          completed: false,
        },
      ],
    },
    {
      id: 'm3',
      title: 'Real-time Data',
      lessons: [
        {
          id: 'l6',
          title: 'Account Subscriptions',
          type: 'Video',
          duration: '14 min',
          completed: false,
          locked: true,
        },
        {
          id: 'l7',
          title: 'WebSocket Patterns',
          type: 'Reading',
          duration: '10 min',
          completed: false,
          locked: true,
        },
      ],
    },
  ],
  'solana-security': [
    {
      id: 'm1',
      title: 'Security Mindset',
      lessons: [
        {
          id: 'l1',
          title: 'Thinking Like an Auditor',
          type: 'Video',
          duration: '15 min',
          completed: false,
        },
        {
          id: 'l2',
          title: 'Common Solana Exploits',
          type: 'Reading',
          duration: '12 min',
          completed: false,
        },
      ],
    },
    {
      id: 'm2',
      title: 'Access Control Vulnerabilities',
      lessons: [
        {
          id: 'l3',
          title: 'Missing Signer Checks',
          type: 'Video',
          duration: '16 min',
          completed: false,
        },
        {
          id: 'l4',
          title: 'Owner Validation',
          type: 'Reading',
          duration: '10 min',
          completed: false,
        },
        {
          id: 'l5',
          title: 'Exploit & Fix Lab',
          type: 'Code Challenge',
          duration: '35 min',
          completed: false,
        },
      ],
    },
    {
      id: 'm3',
      title: 'Arithmetic & PDA Attacks',
      lessons: [
        {
          id: 'l6',
          title: 'Overflow/Underflow',
          type: 'Video',
          duration: '14 min',
          completed: false,
          locked: true,
        },
        {
          id: 'l7',
          title: 'PDA Seed Collisions',
          type: 'Reading',
          duration: '12 min',
          completed: false,
          locked: true,
        },
        {
          id: 'l8',
          title: 'Attack Vector Lab',
          type: 'Code Challenge',
          duration: '40 min',
          completed: false,
          locked: true,
        },
      ],
    },
  ],
  'nft-development': [
    {
      id: 'm1',
      title: 'NFT Fundamentals',
      lessons: [
        {
          id: 'l1',
          title: 'Metadata Standards',
          type: 'Video',
          duration: '12 min',
          completed: false,
        },
        {
          id: 'l2',
          title: 'Token Metadata Program',
          type: 'Reading',
          duration: '10 min',
          completed: false,
        },
        {
          id: 'l3',
          title: 'Mint Your First NFT',
          type: 'Code Challenge',
          duration: '20 min',
          completed: false,
        },
      ],
    },
    {
      id: 'm2',
      title: 'Collections & Candy Machine',
      lessons: [
        {
          id: 'l4',
          title: 'Collection Setup',
          type: 'Video',
          duration: '15 min',
          completed: false,
        },
        {
          id: 'l5',
          title: 'Candy Machine v3',
          type: 'Reading',
          duration: '12 min',
          completed: false,
        },
        {
          id: 'l6',
          title: 'Build a Mint Page',
          type: 'Code Challenge',
          duration: '30 min',
          completed: false,
        },
      ],
    },
    {
      id: 'm3',
      title: 'Compressed NFTs',
      lessons: [
        {
          id: 'l7',
          title: 'cNFT Architecture',
          type: 'Video',
          duration: '18 min',
          completed: false,
          locked: true,
        },
        {
          id: 'l8',
          title: 'Bubblegum SDK',
          type: 'Reading',
          duration: '10 min',
          completed: false,
          locked: true,
        },
        {
          id: 'l9',
          title: 'Mint 1M cNFTs',
          type: 'Code Challenge',
          duration: '35 min',
          completed: false,
          locked: true,
        },
      ],
    },
  ],
}

/** Extended reviews for courses with empty reviews in mockData */
export const extendedReviews: Record<string, Course['reviews']> = {
  'anchor-development': [
    {
      name: 'Miguel P.',
      rating: 5,
      text: 'Finally understood account validation after this course. The code challenges are incredible.',
      date: '1 week ago',
    },
    {
      name: 'Laura V.',
      rating: 4,
      text: 'Solid content. Some lessons could use more real-world examples but overall excellent.',
      date: '3 weeks ago',
    },
    {
      name: 'Ricardo M.',
      rating: 5,
      text: 'Best Anchor tutorial out there. Went from zero to deploying a real program.',
      date: '1 month ago',
    },
  ],
  'defi-protocols': [
    {
      name: 'Alejandro B.',
      rating: 5,
      text: 'The AMM module alone is worth it. Built my own swap protocol after completing it.',
      date: '2 weeks ago',
    },
    {
      name: 'Natalia K.',
      rating: 5,
      text: 'Incredibly thorough. The real-world case studies from Raydium were eye-opening.',
      date: '1 month ago',
    },
  ],
  'solana-frontend': [
    {
      name: 'David L.',
      rating: 4,
      text: 'Great for React devs getting into Solana. Wallet adapter setup was super clear.',
      date: '3 days ago',
    },
    {
      name: 'Carmen S.',
      rating: 5,
      text: 'Perfect bridge between web2 and web3 frontend development.',
      date: '2 weeks ago',
    },
  ],
  'solana-security': [
    {
      name: 'Fernando R.',
      rating: 5,
      text: 'Exploit-and-fix labs are genius. You really learn by breaking things first.',
      date: '1 week ago',
    },
    {
      name: 'Isabel M.',
      rating: 5,
      text: 'Essential for anyone writing production Solana code. Must-take course.',
      date: '3 weeks ago',
    },
  ],
  'nft-development': [
    {
      name: 'Pablo G.',
      rating: 4,
      text: 'Compressed NFTs section is fantastic. Saved me weeks of research.',
      date: '5 days ago',
    },
    {
      name: 'Elena T.',
      rating: 5,
      text: 'Launched my NFT collection after completing this. Highly recommend!',
      date: '2 weeks ago',
    },
    {
      name: 'Tomás A.',
      rating: 4,
      text: 'Good coverage of Metaplex. Would love a module on programmable NFTs.',
      date: '1 month ago',
    },
  ],
}

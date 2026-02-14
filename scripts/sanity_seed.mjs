import { createClient } from '@sanity/client'
import dotenv from 'dotenv'

// Load env from .env.local when running locally
dotenv.config({ path: '.env.local' })

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const token = process.env.SANITY_API_TOKEN

if (!projectId || !dataset || !token) {
  console.error('[seed] Missing Sanity env: NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_API_TOKEN')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2024-01-01',
  useCdn: false,
})

function id(suffix) {
  return `${Date.now()}-${suffix}`
}

async function run() {
  console.log('[seed] Seeding Superteam Academy sample content to Sanity...')

  // Code Challenge and Quiz docs to reference from lessons
  const codeChallengeId = id('cc-hello-solana')
  const quizId = id('quiz-accounts')

  const codeChallenge = {
    _id: codeChallengeId,
    _type: 'codeChallenge',
    title: 'Hello Solana - Anchor Program',
    language: 'rust',
    description: [
      { _type: 'block', style: 'normal', children: [{ _type: 'span', text: 'Write a minimal Anchor program that logs "Hello, Solana!"' }] },
    ],
    starterCode: {
      _type: 'code',
      language: 'rust',
      code:
`use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod hello_solana {
    use super::*;
    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        // TODO: log a message
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}`,
    },
    solution: {
      _type: 'code',
      language: 'rust',
      code:
`use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod hello_solana {
    use super::*;
    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        msg!("Hello, Solana!");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}`,
    },
    testCases: [
      { input: 'initialize()', expectedOutput: 'Hello, Solana!', isHidden: false }
    ],
    hints: ['Use msg! macro to log strings to the runtime'],
    difficulty: 'easy'
  }

  const quiz = {
    _id: quizId,
    _type: 'quiz',
    title: 'Solana Accounts Basics',
    passingScore: 70,
    questions: [
      {
        question: 'What is stored in a Solana account?',
        options: ['Only lamports', 'Data and lamports', 'Only program code', 'Validator state'],
        correctAnswerIndex: 1,
        explanation: 'Accounts store data and lamports; program code is in program accounts.'
      },
      {
        question: 'Which statement is true about PDAs?',
        options: ['They are private keys', 'They are derived from seeds and program ID', 'They are the same as user wallets', 'They cannot own data'],
        correctAnswerIndex: 1,
        explanation: 'Program Derived Addresses are created from seeds and the program ID and can own data.'
      }
    ]
  }

  // Lessons
  const lessonIntroId = id('lesson-intro')
  const lessonAccountId = id('lesson-account')
  const lessonCodingId = id('lesson-coding')
  const lessonRuntimeId = id('lesson-runtime')
  const lessonTxId = id('lesson-tx')
  const lessonPdaChallengeId = id('lesson-pda-challenge')
  const lessonAccountsQuizId = id('lesson-accounts-quiz')
  const lessonAnchorHandlersId = id('lesson-anchor-handlers')
  const lessonStateCompressionId = id('lesson-state-compression')
  const lessonMetaplexBasicsId = id('lesson-metaplex-basics')
  const lessonToken2022Id = id('lesson-token-2022')
  const lessonWeb3WalletAdapterId = id('lesson-web3-wallet-adapter')
  const lessonSolanaHistoryId = id('lesson-solana-history')

  const lessons = [
    {
      _id: lessonIntroId,
      _type: 'lesson',
      title: 'Introduction to Solana',
      slug: { _type: 'slug', current: 'introduction-to-solana' },
      description: 'Learn the basics of the Solana blockchain.',
      contentType: 'video',
      // Replace with real YouTube link
      videoUrl: 'https://www.youtube.com/watch?v=VIDEO_ID_SOLANA_INTRO',
      estimatedMinutes: 15,
      xpReward: 100,
      orderIndex: 0,
      isPublished: true,
    },
    {
      _id: lessonAccountId,
      _type: 'lesson',
      title: 'The Account Model',
      slug: { _type: 'slug', current: 'the-account-model' },
      description: 'Understand how Solana stores data using the account model.',
      contentType: 'article',
      content: [
        { _type: 'block', style: 'normal', children: [{ _type: 'span', text: 'Everything in Solana is an account...' }] },
      ],
      estimatedMinutes: 20,
      xpReward: 150,
      orderIndex: 1,
      isPublished: true,
    },
    {
      _id: lessonCodingId,
      _type: 'lesson',
      title: 'Hello Solana (Coding)',
      slug: { _type: 'slug', current: 'hello-solana-coding' },
      description: 'Write your first Anchor program.',
      contentType: 'interactive',
      content: [
        { _type: 'block', style: 'normal', children: [{ _type: 'span', text: 'Follow the starter code to build and run.' }] },
      ],
      estimatedMinutes: 30,
      xpReward: 200,
      orderIndex: 2,
      isPublished: true,
      codeChallenge: { _type: 'reference', _ref: codeChallengeId }
    },
    {
      _id: lessonRuntimeId,
      _type: 'lesson',
      title: 'Solana Runtime Overview',
      slug: { _type: 'slug', current: 'solana-runtime-overview' },
      description: 'Understand the Solana runtime architecture and execution model.',
      contentType: 'video',
      videoUrl: 'https://www.youtube.com/watch?v=VIDEO_ID_RUNTIME',
      estimatedMinutes: 18,
      xpReward: 120,
      orderIndex: 3,
      isPublished: true
    },
    {
      _id: lessonTxId,
      _type: 'lesson',
      title: 'Writing Your First Transaction',
      slug: { _type: 'slug', current: 'writing-your-first-transaction' },
      description: 'Learn to construct and send transactions using web3.js.',
      contentType: 'article',
      content: [
        { _type: 'block', style: 'normal', children: [{ _type: 'span', text: 'Transactions contain instructions executed by programs.' }] },
      ],
      estimatedMinutes: 22,
      xpReward: 150,
      orderIndex: 4,
      isPublished: true
    },
    {
      _id: lessonPdaChallengeId,
      _type: 'lesson',
      title: 'PDA Basics Challenge',
      slug: { _type: 'slug', current: 'pda-basics-challenge' },
      description: 'Derive a PDA from seeds and store simple data.',
      contentType: 'interactive',
      content: [
        { _type: 'block', style: 'normal', children: [{ _type: 'span', text: 'Use Pubkey::find_program_address for PDAs.' }] },
      ],
      estimatedMinutes: 35,
      xpReward: 250,
      orderIndex: 5,
      isPublished: true,
      codeChallenge: { _type: 'reference', _ref: codeChallengeId }
    },
    {
      _id: lessonAccountsQuizId,
      _type: 'lesson',
      title: 'Accounts Quiz',
      slug: { _type: 'slug', current: 'accounts-quiz' },
      description: 'Test your knowledge of Solana accounts.',
      contentType: 'quiz',
      estimatedMinutes: 10,
      xpReward: 100,
      orderIndex: 6,
      isPublished: true,
      quiz: { _type: 'reference', _ref: quizId }
    },
    {
      _id: lessonAnchorHandlersId,
      _type: 'lesson',
      title: 'Anchor Instruction Handlers',
      slug: { _type: 'slug', current: 'anchor-instruction-handlers' },
      description: 'Structure your Anchor instruction handlers effectively.',
      contentType: 'interactive',
      content: [
        { _type: 'block', style: 'normal', children: [{ _type: 'span', text: 'Separate validation, business logic, and account constraints.' }] },
      ],
      estimatedMinutes: 28,
      xpReward: 220,
      orderIndex: 7,
      isPublished: true,
      codeChallenge: { _type: 'reference', _ref: codeChallengeId }
    },
    {
      _id: lessonStateCompressionId,
      _type: 'lesson',
      title: 'State Compression & cNFTs',
      slug: { _type: 'slug', current: 'state-compression-cnfts' },
      description: 'Learn how state compression enables scalable cNFTs on Solana.',
      contentType: 'video',
      videoUrl: 'https://www.youtube.com/watch?v=VIDEO_ID_STATE_COMPRESSION',
      estimatedMinutes: 20,
      xpReward: 150,
      orderIndex: 8,
      isPublished: true
    },
    {
      _id: lessonMetaplexBasicsId,
      _type: 'lesson',
      title: 'Metaplex Basics',
      slug: { _type: 'slug', current: 'metaplex-basics' },
      description: 'Mint and manage NFTs using Metaplex tooling.',
      contentType: 'article',
      content: [
        { _type: 'block', style: 'normal', children: [{ _type: 'span', text: 'Use Metaplex JS SDK to mint and update NFT metadata.' }] },
      ],
      estimatedMinutes: 25,
      xpReward: 180,
      orderIndex: 9,
      isPublished: true
    },
    {
      _id: lessonToken2022Id,
      _type: 'lesson',
      title: 'Token-2022 & Non-Transferable XP',
      slug: { _type: 'slug', current: 'token-2022-non-transferable-xp' },
      description: 'Create a non-transferable token for XP using Token-2022.',
      contentType: 'interactive',
      content: [
        { _type: 'block', style: 'normal', children: [{ _type: 'span', text: 'Configure token extensions and mint to user accounts.' }] },
      ],
      estimatedMinutes: 30,
      xpReward: 220,
      orderIndex: 10,
      isPublished: true,
      codeChallenge: { _type: 'reference', _ref: codeChallengeId }
    },
    {
      _id: lessonWeb3WalletAdapterId,
      _type: 'lesson',
      title: 'Wallet Adapter Integration',
      slug: { _type: 'slug', current: 'wallet-adapter-integration' },
      description: 'Integrate Wallet Adapter in a web app and sign transactions.',
      contentType: 'video',
      videoUrl: 'https://www.youtube.com/watch?v=VIDEO_ID_WALLET_ADAPTER',
      estimatedMinutes: 16,
      xpReward: 120,
      orderIndex: 11,
      isPublished: true
    },
    {
      _id: lessonSolanaHistoryId,
      _type: 'lesson',
      title: 'A Brief History of Solana',
      slug: { _type: 'slug', current: 'brief-history-of-solana' },
      description: 'Explore the origins and evolution of the Solana blockchain.',
      contentType: 'article',
      content: [
        { _type: 'block', style: 'normal', children: [{ _type: 'span', text: 'From inception to high-throughput architecture and ecosystem growth.' }] },
      ],
      estimatedMinutes: 12,
      xpReward: 90,
      orderIndex: 12,
      isPublished: true
    },
  ]

  // Course
  const courseId = id('course-solana-fundamentals')
  const course = {
    _id: courseId,
    _type: 'course',
    title: 'Solana Fundamentals',
    slug: { _type: 'slug', current: 'solana-fundamentals' },
    description: 'Start from scratch and understand the Solana blockchain inside out.',
    longDescription: [
      { _type: 'block', style: 'normal', children: [{ _type: 'span', text: 'Master Solana development from zero to production-ready.' }] },
    ],
    difficulty: 'beginner',
    category: 'solana-development',
    estimatedHours: 2,
    prerequisites: ['Basic JavaScript', 'Git installed'],
    learningOutcomes: [
      'Understand Solana runtime and accounts',
      'Write a simple Anchor program',
      'Interact with programs using web3.js',
    ],
    lessons: lessons.map(l => ({ _type: 'reference', _ref: l._id })),
    isPublished: true,
  }

  // Additional courses
  const extraCourses = [
    {
      _id: id('course-defi-developer'),
      _type: 'course',
      title: 'DeFi Developer',
      slug: { _type: 'slug', current: 'defi-developer' },
      description: 'Master DeFi protocols and build your own decentralized finance applications.',
      difficulty: 'intermediate',
      category: 'defi',
      estimatedHours: 3,
      learningOutcomes: [
        'Understand liquidity pools',
        'Integrate with DeFi programs',
        'Build yield strategies on Solana'
      ],
      lessons: [
        { _type: 'reference', _ref: lessonIntroId },
        { _type: 'reference', _ref: lessonAccountId }
      ],
      isPublished: true
    },
    {
      _id: id('course-security-auditor'),
      _type: 'course',
      title: 'Security Auditor',
      slug: { _type: 'slug', current: 'security-auditor' },
      description: 'Find bugs, write audits, protect protocols.',
      difficulty: 'advanced',
      category: 'smart-contracts',
      estimatedHours: 2.7,
      learningOutcomes: [
        'Identify re-entrancy risks',
        'Write secure Anchor programs',
        'Use formal checks'
      ],
      lessons: [
        { _type: 'reference', _ref: lessonAccountId },
        { _type: 'reference', _ref: lessonCodingId }
      ],
      isPublished: true
    },
    {
      _id: id('course-anchor-basics'),
      _type: 'course',
      title: 'Anchor Basics',
      slug: { _type: 'slug', current: 'anchor-basics' },
      description: 'Learn Anchor framework essentials with hands-on coding.',
      difficulty: 'beginner',
      category: 'smart-contracts',
      estimatedHours: 1.5,
      learningOutcomes: [
        'Declare programs & accounts',
        'Write instructions & handlers',
        'Build and test locally'
      ],
      lessons: [
        { _type: 'reference', _ref: lessonAnchorHandlersId }
      ],
      isPublished: true
    },
    {
      _id: id('course-web3-integration'),
      _type: 'course',
      title: 'Web3 Integration',
      slug: { _type: 'slug', current: 'web3-integration' },
      description: 'Integrate Solana programs with web frontends.',
      difficulty: 'intermediate',
      category: 'web3',
      estimatedHours: 2,
      learningOutcomes: [
        'Wallet Adapter usage',
        'Program interactions from UI',
        'Transaction flows & UX'
      ],
      lessons: [
        { _type: 'reference', _ref: lessonTxId }
      ],
      isPublished: true
    },
    {
      _id: id('course-cnft-credentials'),
      _type: 'course',
      title: 'cNFT Credentials',
      slug: { _type: 'slug', current: 'cnft-credentials' },
      description: 'Issue and display evolving compressed NFTs for credentials.',
      difficulty: 'intermediate',
      category: 'nfts',
      estimatedHours: 2,
      learningOutcomes: [
        'Use Bubblegum for cNFTs',
        'Update metadata for progress',
        'Verify ownership on-chain'
      ],
      lessons: [
        { _type: 'reference', _ref: lessonRuntimeId }
      ],
      isPublished: true
    }
  ]

  try {
    await client.transaction()
      .createIfNotExists(course)
      .createIfNotExists(codeChallenge)
      .createIfNotExists(quiz)
      .createIfNotExists(lessons[0])
      .createIfNotExists(lessons[1])
      .createIfNotExists(lessons[2])
      .createIfNotExists(lessons[3])
      .createIfNotExists(lessons[4])
      .createIfNotExists(lessons[5])
      .createIfNotExists(lessons[6])
      .createIfNotExists(lessons[7])
      .createIfNotExists(lessons[8])
      .createIfNotExists(lessons[9])
      .createIfNotExists(lessons[10])
      .createIfNotExists(lessons[11])
      .createIfNotExists(lessons[12])
      .createIfNotExists(extraCourses[0])
      .createIfNotExists(extraCourses[1])
      .createIfNotExists(extraCourses[2])
      .createIfNotExists(extraCourses[3])
      .createIfNotExists(extraCourses[4])
      .commit({ visibility: 'sync' })

    console.log('[seed] Done. You can now query courses and lessons from Sanity.')
  } catch (e) {
    console.error('[seed] Failed:', e)
    process.exit(1)
  }
}

run()

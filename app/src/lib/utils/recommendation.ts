// ---------------------------------------------------------------------------
// Onboarding quiz recommendation algorithm
//
// Pure function — takes quiz answers, returns ranked recommendations.
// No side effects, no external dependencies, fully testable.
// ---------------------------------------------------------------------------

export type ExperienceLevel =
  | 'complete-beginner'
  | 'some-programming'
  | 'crypto-familiar'
  | 'solana-developer';

export type ProgrammingLanguage =
  | 'javascript'
  | 'typescript'
  | 'rust'
  | 'python'
  | 'c-cpp'
  | 'go'
  | 'other'
  | 'none';

export type Interest =
  | 'defi'
  | 'nfts'
  | 'daos'
  | 'gaming'
  | 'payments'
  | 'social'
  | 'infrastructure'
  | 'security';

export type Goal =
  | 'learn-fundamentals'
  | 'build-dapps'
  | 'get-certified'
  | 'career-change'
  | 'contribute-ecosystem';

export interface QuizAnswers {
  experience: ExperienceLevel;
  languages: ProgrammingLanguage[];
  interests: Interest[];
  goal: Goal;
}

export type Track =
  | 'solana-core'
  | 'defi'
  | 'nft'
  | 'security';

export interface CourseRecommendation {
  id: string;
  title: string;
  description: string;
  track: Track;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface Recommendation {
  primaryTrack: Track;
  trackScores: Record<Track, number>;
  suggestedDifficulty: 'beginner' | 'intermediate' | 'advanced';
  courses: CourseRecommendation[];
  summary: string;
}

// ---------------------------------------------------------------------------
// Course catalog (mock data for recommendations)
// ---------------------------------------------------------------------------

const COURSE_CATALOG: CourseRecommendation[] = [
  {
    id: 'solana-101',
    title: 'Solana 101: Getting Started',
    description: 'Learn the fundamentals of Solana blockchain, wallets, and your first transaction.',
    track: 'solana-core',
    difficulty: 'beginner',
  },
  {
    id: 'anchor-fundamentals',
    title: 'Anchor Framework Fundamentals',
    description: 'Build your first on-chain program with Anchor, PDAs, and instruction handlers.',
    track: 'solana-core',
    difficulty: 'intermediate',
  },
  {
    id: 'advanced-solana',
    title: 'Advanced Solana Programming',
    description: 'Cross-program invocations, versioned transactions, and performance optimization.',
    track: 'solana-core',
    difficulty: 'advanced',
  },
  {
    id: 'defi-basics',
    title: 'DeFi on Solana: Foundations',
    description: 'Understand AMMs, lending protocols, and token economics on Solana.',
    track: 'defi',
    difficulty: 'beginner',
  },
  {
    id: 'build-dex',
    title: 'Build a DEX on Solana',
    description: 'Create a fully functional decentralized exchange with order books and swaps.',
    track: 'defi',
    difficulty: 'intermediate',
  },
  {
    id: 'advanced-defi',
    title: 'Advanced DeFi Protocols',
    description: 'Build lending pools, yield aggregators, and oracle integrations.',
    track: 'defi',
    difficulty: 'advanced',
  },
  {
    id: 'nft-basics',
    title: 'NFTs on Solana',
    description: 'Create, mint, and manage NFTs using Metaplex Core and Token Metadata.',
    track: 'nft',
    difficulty: 'beginner',
  },
  {
    id: 'nft-marketplace',
    title: 'Build an NFT Marketplace',
    description: 'Full-stack NFT marketplace with listings, auctions, and royalty enforcement.',
    track: 'nft',
    difficulty: 'intermediate',
  },
  {
    id: 'security-fundamentals',
    title: 'Solana Security Fundamentals',
    description: 'Common vulnerabilities, attack vectors, and secure coding patterns.',
    track: 'security',
    difficulty: 'intermediate',
  },
  {
    id: 'audit-masterclass',
    title: 'Smart Contract Auditing',
    description: 'Learn to audit Solana programs, find bugs, and write security reports.',
    track: 'security',
    difficulty: 'advanced',
  },
];

// ---------------------------------------------------------------------------
// Scoring weights
// ---------------------------------------------------------------------------

const EXPERIENCE_DIFFICULTY_MAP: Record<ExperienceLevel, 'beginner' | 'intermediate' | 'advanced'> = {
  'complete-beginner': 'beginner',
  'some-programming': 'beginner',
  'crypto-familiar': 'intermediate',
  'solana-developer': 'advanced',
};

const INTEREST_TRACK_MAP: Record<Interest, Track[]> = {
  defi: ['defi'],
  nfts: ['nft'],
  daos: ['solana-core'],
  gaming: ['nft', 'solana-core'],
  payments: ['defi', 'solana-core'],
  social: ['solana-core', 'nft'],
  infrastructure: ['solana-core', 'security'],
  security: ['security'],
};

const GOAL_TRACK_BOOST: Record<Goal, Partial<Record<Track, number>>> = {
  'learn-fundamentals': { 'solana-core': 3 },
  'build-dapps': { 'solana-core': 2, defi: 1, nft: 1 },
  'get-certified': { 'solana-core': 2, security: 1 },
  'career-change': { 'solana-core': 3, defi: 1 },
  'contribute-ecosystem': { 'solana-core': 1, security: 2, defi: 1 },
};

const LANGUAGE_BOOST: Partial<Record<ProgrammingLanguage, Partial<Record<Track, number>>>> = {
  rust: { 'solana-core': 2, security: 1 },
  typescript: { 'solana-core': 1, defi: 1, nft: 1 },
  javascript: { nft: 1, defi: 1 },
  python: { defi: 1 },
  'c-cpp': { security: 1, 'solana-core': 1 },
};

// ---------------------------------------------------------------------------
// Algorithm
// ---------------------------------------------------------------------------

function computeTrackScores(answers: QuizAnswers): Record<Track, number> {
  const scores: Record<Track, number> = {
    'solana-core': 0,
    defi: 0,
    nft: 0,
    security: 0,
  };

  // Base score — everyone starts with solana-core having a slight advantage
  scores['solana-core'] += 1;

  // Score from interests (strongest signal)
  for (const interest of answers.interests) {
    const tracks = INTEREST_TRACK_MAP[interest];
    if (tracks) {
      for (const track of tracks) {
        scores[track] += 3;
      }
    }
  }

  // Score from goal
  const goalBoosts = GOAL_TRACK_BOOST[answers.goal];
  if (goalBoosts) {
    for (const [track, boost] of Object.entries(goalBoosts)) {
      scores[track as Track] += boost;
    }
  }

  // Score from programming languages
  for (const lang of answers.languages) {
    const boosts = LANGUAGE_BOOST[lang];
    if (boosts) {
      for (const [track, boost] of Object.entries(boosts)) {
        scores[track as Track] += boost;
      }
    }
  }

  return scores;
}

function selectDifficulty(answers: QuizAnswers): 'beginner' | 'intermediate' | 'advanced' {
  return EXPERIENCE_DIFFICULTY_MAP[answers.experience];
}

function generateSummary(
  primaryTrack: Track,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  answers: QuizAnswers,
): string {
  const trackNames: Record<Track, string> = {
    'solana-core': 'Solana Core',
    defi: 'DeFi',
    nft: 'NFT',
    security: 'Security',
  };

  const trackName = trackNames[primaryTrack];
  const goalDescriptions: Record<Goal, string> = {
    'learn-fundamentals': 'building a solid foundation in Solana development',
    'build-dapps': 'building production-ready decentralized applications',
    'get-certified': 'earning verifiable on-chain credentials',
    'career-change': 'transitioning into a Web3 development career',
    'contribute-ecosystem': 'contributing to the Solana ecosystem',
  };

  return `Based on your profile, we recommend starting with the ${trackName} track at the ${difficulty} level. This path is optimized for ${goalDescriptions[answers.goal]}.`;
}

export function getRecommendation(answers: QuizAnswers): Recommendation {
  const trackScores = computeTrackScores(answers);
  const difficulty = selectDifficulty(answers);

  // Find the highest-scoring track
  const sortedTracks = (Object.entries(trackScores) as [Track, number][])
    .sort((a, b) => b[1] - a[1]);
  const primaryTrack = sortedTracks[0]![0];

  // Select courses: prioritize primary track courses at the right difficulty,
  // then expand to adjacent difficulties and secondary tracks
  const primaryCourses = COURSE_CATALOG.filter(
    (c) => c.track === primaryTrack && c.difficulty === difficulty,
  );

  // If fewer than 3, fill from primary track (any difficulty) or secondary tracks
  const recommended = [...primaryCourses];

  if (recommended.length < 3) {
    const primaryAdjacent = COURSE_CATALOG.filter(
      (c) =>
        c.track === primaryTrack &&
        c.difficulty !== difficulty &&
        !recommended.some((r) => r.id === c.id),
    );
    recommended.push(...primaryAdjacent);
  }

  if (recommended.length < 3) {
    const secondaryTrack = sortedTracks[1]?.[0];
    if (secondaryTrack) {
      const secondaryCourses = COURSE_CATALOG.filter(
        (c) =>
          c.track === secondaryTrack &&
          !recommended.some((r) => r.id === c.id),
      );
      recommended.push(...secondaryCourses);
    }
  }

  return {
    primaryTrack,
    trackScores,
    suggestedDifficulty: difficulty,
    courses: recommended.slice(0, 3),
    summary: generateSummary(primaryTrack, difficulty, answers),
  };
}

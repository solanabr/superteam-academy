export type ChallengeDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type ChallengeCategory =
  | 'solana-fundamentals'
  | 'defi'
  | 'nft-metaplex'
  | 'security'
  | 'token-extensions';

export type ChallengeLanguage = 'rust' | 'typescript';

export interface TestCase {
  input: string;
  expectedOutput: string;
  description: string;
}

export interface CodingChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: ChallengeDifficulty;
  category: ChallengeCategory;
  language: ChallengeLanguage;
  starterCode: string;
  solution: string;
  testCases: [TestCase, TestCase, TestCase];
  hints: [string, string, string];
  xpReward: number;
  estimatedMinutes: number;
}

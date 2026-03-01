import type { CodingChallenge, ChallengeCategory, ChallengeDifficulty } from './types';
import { solanaFundamentalsChallenges } from './solana-fundamentals';
import { defiChallenges } from './defi';
import { nftMetaplexChallenges } from './nft-metaplex';
import { securityChallenges } from './security';
import { tokenExtensionsChallenges } from './token-extensions';

export type {
  CodingChallenge,
  ChallengeCategory,
  ChallengeDifficulty,
  ChallengeLanguage,
  TestCase,
} from './types';

const allChallenges: CodingChallenge[] = [
  ...solanaFundamentalsChallenges,
  ...defiChallenges,
  ...nftMetaplexChallenges,
  ...securityChallenges,
  ...tokenExtensionsChallenges,
];

export function getAllChallenges(): CodingChallenge[] {
  return allChallenges;
}

export function getChallengesByCategory(category: ChallengeCategory): CodingChallenge[] {
  return allChallenges.filter((c) => c.category === category);
}

export function getChallengesByDifficulty(difficulty: ChallengeDifficulty): CodingChallenge[] {
  return allChallenges.filter((c) => c.difficulty === difficulty);
}

export function getChallengeById(id: string): CodingChallenge | undefined {
  return allChallenges.find((c) => c.id === id);
}

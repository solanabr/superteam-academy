/**
 * Solana Integration Module
 * Exports all on-chain program utilities, services, and clients
 */

// Program configuration
export {
  PROGRAM_ID,
  XP_MINT,
  PROGRAM_AUTHORITY,
  TOKEN_2022_PROGRAM_ID,
  MPL_CORE_PROGRAM_ID,
  NETWORK,
  RPC_ENDPOINTS,
  HELIUS_RPC_URL,
  TRACK_IDS,
  DIFFICULTY_LEVELS,
} from './program-config';

// PDA derivation utilities
export {
  deriveConfigPda,
  deriveCoursePda,
  deriveEnrollmentPda,
  deriveMinterRolePda,
  deriveAchievementTypePda,
  deriveAchievementReceiptPda,
  deriveXpTokenAccount,
  deriveEnrollmentPdas,
  deriveCoursePdas,
  pdaExists,
  pda,
} from './pda';

// Program client for account fetching
export {
  getConnection,
  fetchConfig,
  fetchCourse,
  fetchAllCourses,
  fetchEnrollment,
  fetchLearnerEnrollments,
  fetchXpBalance,
  calculateLevel,
  xpForNextLevel,
  buildEnrollTransaction,
  buildCloseEnrollmentTransaction,
  isLessonCompleted,
  countCompletedLessons,
  getCompletedLessonIndices,
} from './program-client';

// Helius DAS API client
export {
  fetchCredentialNfts,
  fetchAssetsByCollection,
  fetchAsset,
  fetchXpLeaderboard,
  fetchWalletRankAndStats,
  parseCredential,
  fetchWalletCredentials,
  parseAchievement,
} from './helius-client';

export type {
  ParsedCredential,
  ParsedAchievement,
  HeliusAsset,
  HeliusTokenHolder,
} from './helius-client';

// Enrollment service
export {
  buildEnrollTransaction as buildEnroll,
  buildCloseEnrollmentTransaction as buildCloseEnroll,
  isEnrolled,
  getEnrollmentStatus,
  getLearnerCoursesWithProgress,
} from './enrollment-service';

export type { EnrollmentStatus, EnrollmentResult } from './enrollment-service';

// IDL types
export type {
  ConfigAccount,
  CourseAccount,
  EnrollmentAccount,
  MinterRoleAccount,
  AchievementTypeAccount,
  AchievementReceiptAccount,
  CourseWithMetadata,
  EnrollmentWithProgress,
  LeaderboardEntry,
  CreateCourseArgs,
  UpdateCourseArgs,
  RegisterMinterArgs,
  CreateAchievementTypeArgs,
  EnrolledEvent,
  LessonCompletedEvent,
  CourseFinalizedEvent,
  CredentialIssuedEvent,
  XpRewardedEvent,
  AchievementAwardedEvent,
} from './idl-types';

export { ProgramErrorCode, ERROR_MESSAGES } from './idl-types';

// Indexer provider abstraction (Custom / Helius / Alchemy)
export {
  INDEXER_PROVIDERS,
  DEFAULT_INDEXER_SETTINGS,
  CustomRpcIndexer,
  HeliusIndexer,
  AlchemyIndexer,
  buildIndexer,
  buildIndexerForProvider,
  getActiveIndexer,
  invalidateIndexerCache,
} from './indexer';

export type {
  IndexerProvider,
  IndexedLeaderboardEntry,
  WalletRankResult,
  LeaderboardIndexerClient,
  IndexerSettings,
} from './indexer';

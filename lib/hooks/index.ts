export { useI18n, I18nProvider } from './useI18n'
export { useLearningProgress } from './useLearningProgress'
export { useAuth, AuthProvider } from './useAuth'
export { useProgress, useAchievements, useLeaderboard, useUserRank } from './useProgress'
export { useTheme } from './useTheme'
export { useWallet } from './useWallet'
export { useProgram } from './useProgram'
export { useGamification } from './useGamification'

// On-Chain Integration Hooks
export { useCompleteLesson } from './useCompleteLesson'
export { useUserProgress } from './useUserProgress'
export { useLeaderboard as useOnChainLeaderboard } from './useLeaderboard'
export { useAwardXP } from './useAwardXP'

// Certificate & Credentials Hooks
export { useXpBalance, useXpLevel, useCredentials, useCredentialByTrack, useHasCredentials } from './useXp'
export { useCourseCompletion, useFinalizeCourse, useIssueCredential } from './useCourseCompletion'
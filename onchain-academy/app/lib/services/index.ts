// lib/services/index.ts

/**
 * SERVICE FACTORY
 * 
 * This is THE KEY to our Service Repository Pattern
 * 
 * Change ONE environment variable and the ENTIRE app switches
 * from mock data to blockchain without touching ANY UI code
 */

import { ILearningProgressService, MockLearningProgressService } from './learning-progress';
import { ICredentialService, MockCredentialService, OnChainCredentialService } from './credential';
import { IAnalyticsService, initializeAnalytics } from './analytics';
// @ts-ignore
import { ICourseService, MockCourseService, courseService } from './course';

// Singleton instances
let progressServiceInstance: ILearningProgressService | null = null;
let credentialServiceInstance: ICredentialService | null = null;
let analyticsServiceInstance: IAnalyticsService | null = null;

/**
 * Get Progress Service
 * 
 * Returns either Mock or OnChain implementation based on environment
 */
export function getProgressService(): ILearningProgressService {
  if (progressServiceInstance) return progressServiceInstance as any;

  const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const useOnChain = process.env.NEXT_PUBLIC_USE_ON_CHAIN === 'true';

  if (useOnChain) {
    console.log('🔗 Using ON-CHAIN LearningProgressService');
    console.log('📡 Network:', process.env.NEXT_PUBLIC_SOLANA_NETWORK);
    
    // In production, import and use OnChainLearningProgressService
    // For now, fallback to mock with warning
    console.warn('⚠️ OnChain service not yet implemented, using Mock');
    progressServiceInstance = new MockLearningProgressService() as any;
  } else if (useMock) {
    console.log('💾 Using MOCK LearningProgressService');
    progressServiceInstance = new MockLearningProgressService() as any;
  } else {
    console.log('⚠️ No service mode specified, defaulting to MOCK');
    progressServiceInstance = new MockLearningProgressService() as any;
  }

  return progressServiceInstance as any;
}

/**
 * Get Credential Service
 * 
 * Returns either Mock or OnChain implementation based on environment
 */
export function getCredentialService(): ICredentialService {
  if (credentialServiceInstance) return credentialServiceInstance;

  const useOnChain = process.env.NEXT_PUBLIC_USE_ON_CHAIN === 'true';

  if (useOnChain) {
    console.log('🔗 Using ON-CHAIN CredentialService');
    credentialServiceInstance = new OnChainCredentialService();
  } else {
    console.log('💾 Using MOCK CredentialService');
    credentialServiceInstance = new MockCredentialService();
  }

  return credentialServiceInstance;
}

/**
 * Get Analytics Service
 * 
 * Returns configured analytics service
 */
export function getAnalyticsService(): IAnalyticsService {
  if (!analyticsServiceInstance) {
    analyticsServiceInstance = initializeAnalytics();
  }
  return analyticsServiceInstance;
}

/**
 * Get Course Service
 * 
 * Returns course service (currently only mock available)
 */
export function getCourseService(): ICourseService {
  return courseService;
}

/**
 * Reset all service instances
 * Useful for testing
 */
export function resetServices() {
  progressServiceInstance = null;
  credentialServiceInstance = null;
  analyticsServiceInstance = null;
}

/**
 * Get current service types
 * Useful for debugging
 */
export function getServiceTypes(): {
  progress: 'mock' | 'on-chain' | 'unknown';
  credential: 'mock' | 'on-chain';
  analytics: 'initialized' | 'not-initialized';
  course: 'mock';
} {
  return {
    progress: progressServiceInstance instanceof MockLearningProgressService ? 'mock' : 'unknown',
    credential: credentialServiceInstance instanceof MockCredentialService ? 'mock' : 'on-chain',
    analytics: analyticsServiceInstance ? 'initialized' : 'not-initialized',
    course: 'mock',
  };
}

// Export services for direct import
export { courseService };
export { analytics } from './analytics';

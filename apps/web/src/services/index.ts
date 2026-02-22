/**
 * src/services/index.ts
 *
 * Factory pattern for swapping service implementations based on the environment (SolanaKit Pattern).
 */
import { ILearningService } from './interface';
import { OnChainService } from './onchain.service';
import { SupabaseService } from './supabase.service';

const createLearningService = (): ILearningService => {
  try {
    const useOnChain = process.env.NEXT_PUBLIC_USE_ONCHAIN === 'true';
    
    if (useOnChain) {
      return new OnChainService();
    }
    
    return new SupabaseService();
  } catch (error) {
    return new SupabaseService();
  }
};

export const learningService: ILearningService = createLearningService();

export type { ILearningService };

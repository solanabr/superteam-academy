import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';
import { OnchainCourseService } from '@/lib/services/onchain-course.service';

/**
 * Hook: Get all courses
 */
export function useAllCourses() {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ['courses:all'],
    queryFn: async () => {
      const service = new OnchainCourseService(connection);
      return await service.getAllCourses();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook: Get single course
 */
export function useCourse(courseId?: string) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      if (!courseId) return null;
      const service = new OnchainCourseService(connection);
      return await service.getCourse(courseId);
    },
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook: Get courses by track
 */
export function useCoursesByTrack(trackId?: number) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ['courses:track', trackId],
    queryFn: async () => {
      if (trackId === undefined) return [];
      const service = new OnchainCourseService(connection);
      return await service.getCoursesByTrack(trackId);
    },
    enabled: trackId !== undefined,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook: Get course progress for learner
 */
export function useCourseProgress(courseId?: string, learnerAddress?: PublicKey) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ['course:progress', courseId, learnerAddress?.toString()],
    queryFn: async () => {
      if (!courseId || !learnerAddress) return null;
      const service = new OnchainCourseService(connection);
      return await service.getCourseProgress(courseId, learnerAddress);
    },
    enabled: !!courseId && !!learnerAddress,
    staleTime: 1 * 60 * 1000, // 1 minute for progress updates
  });
}

/**
 * Hook: Get all learner enrollments
 */
export function useLearnerEnrollments(learnerAddress?: PublicKey) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ['enrollments', learnerAddress?.toString()],
    queryFn: async () => {
      if (!learnerAddress) return [];
      const service = new OnchainCourseService(connection);
      return await service.getLearnerEnrollments(learnerAddress);
    },
    enabled: !!learnerAddress,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook: Get completed courses
 */
export function useCompletedCourses(learnerAddress?: PublicKey) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ['courses:completed', learnerAddress?.toString()],
    queryFn: async () => {
      if (!learnerAddress) return [];
      const service = new OnchainCourseService(connection);
      return await service.getCompletedCourses(learnerAddress);
    },
    enabled: !!learnerAddress,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook: Search courses
 */
export function useSearchCourses(query?: string) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ['courses:search', query],
    queryFn: async () => {
      if (!query) return [];
      const service = new OnchainCourseService(connection);
      return await service.searchCourses(query);
    },
    enabled: !!query && query.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

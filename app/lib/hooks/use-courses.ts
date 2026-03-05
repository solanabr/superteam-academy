/**
 * @fileoverview React hooks for courses dashboard and general course state management using TanStack Query.
 */

import * as Sentry from "@sentry/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	getCoursesDashboardData,
	recordEnrollment,
} from "@/lib/actions/gamification";
import { LastAccessedCourse, UserStats } from "@/lib/data/courses";

/**
 * Represents the data structure for the courses dashboard.
 */
export interface DashboardData {
	stats: UserStats;
	lastAccessed: LastAccessedCourse | null;
}

/**
 * Hook to fetch the courses dashboard data (stats and last accessed course).
 * @param initialData - Optional initial data for the query (e.g. from server props)
 */
export function useCoursesDashboard(initialData?: Partial<DashboardData>) {
	return useQuery({
		queryKey: ["courses", "dashboard"],
		queryFn: async () => {
			const data = await getCoursesDashboardData();
			return data;
		},
		staleTime: 1000 * 60, // 1 minute
		initialData: initialData as DashboardData,
	});
}

/**
 * Hook to enroll in a course (DB only record, usually paired with on-chain enrollment).
 */
export function useEnrollInCourse() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (courseSlug: string) => {
			const result = await recordEnrollment(courseSlug);
			if (result.error) throw new Error(result.error);
			return result;
		},
		onSuccess: () => {
			// Invalidate dashboard data to reflect new enrollment/active course
			queryClient.invalidateQueries({ queryKey: ["courses", "dashboard"] });
		},
		onError: (error: Error) => {
			toast.error(`Failed to record enrollment: ${error.message}`);
			Sentry.captureException(error);
		},
	});
}

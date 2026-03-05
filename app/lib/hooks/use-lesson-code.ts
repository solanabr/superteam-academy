/**
 * @fileoverview TanStack Query hook for fetching and persisting lesson code.
 * Combines database storage with localStorage as an immediate fallback.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getLessonCode, saveLessonCode } from "@/lib/actions/lesson";

const QUERY_KEY = "lessonCode";
const LS_PREFIX = "lesson_code_";

/**
 * Hook to load and persist user code for a specific lesson.
 * @param lessonId - The unique ID of the lesson.
 * @param courseId - The slug of the course the lesson belongs to.
 * @param initialCode - The starter code from the course definition.
 */
export function useLessonCode(
	lessonId: string,
	courseId: string,
	initialCode: string,
) {
	const queryClient = useQueryClient();
	const lsKey = `${LS_PREFIX}${lessonId}`;

	// Fetch saved code from DB (falls back to localStorage then initialCode)
	const { data: savedProgress, isLoading } = useQuery({
		queryKey: [QUERY_KEY, lessonId],
		queryFn: async () => {
			const dbProgress = await getLessonCode(lessonId);
			return dbProgress;
		},
		staleTime: 60 * 1000 * 5, // 5 minutes
	});

	// The effective "current" code to display in the editor
	const savedCode =
		savedProgress?.code ??
		(typeof window !== "undefined" ? localStorage.getItem(lsKey) : null) ??
		initialCode;

	// Persist to DB (debounced by caller)
	const saveMutation = useMutation({
		mutationFn: async ({
			code,
			completed,
		}: {
			code: string;
			completed?: boolean;
		}) => {
			// 1. Immediately save to localStorage as a fast fallback
			if (typeof window !== "undefined") {
				localStorage.setItem(lsKey, code);
			}
			// 2. Persist to database
			return saveLessonCode({ courseId, lessonId, code, completed });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [QUERY_KEY, lessonId] });
		},
	});

	// Sync localStorage on initial load from DB
	useEffect(() => {
		if (savedProgress?.code && typeof window !== "undefined") {
			localStorage.setItem(lsKey, savedProgress.code);
		}
	}, [savedProgress, lsKey]);

	return {
		code: savedCode,
		isLoading,
		isSaving: saveMutation.isPending,
		isCompleted: savedProgress?.completed ?? false,
		save: saveMutation.mutate,
	};
}

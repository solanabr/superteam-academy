"use client";

import { useState, useEffect, useCallback } from "react";

interface UseAsyncDataOptions {
	/** Start in loading state (default: true) */
	initialLoading?: boolean;
	/** Skip the initial fetch (useful for conditional loading) */
	skip?: boolean;
}

interface UseAsyncDataResult<T> {
	data: T | null;
	loading: boolean;
	error: Error | null;
	refetch: () => Promise<void>;
}

export function useAsyncData<T>(
	fetcher: () => Promise<T>,
	deps: unknown[] = [],
	options: UseAsyncDataOptions = {}
): UseAsyncDataResult<T> {
	const { initialLoading = true, skip = false } = options;
	const [data, setData] = useState<T | null>(null);
	const [loading, setLoading] = useState(initialLoading);
	const [error, setError] = useState<Error | null>(null);

	const refetch = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const result = await fetcher();
			setData(result);
		} catch (e) {
			setError(e instanceof Error ? e : new Error(String(e)));
		} finally {
			setLoading(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
		// biome-ignore lint/correctness/useExhaustiveDependencies: deps passed as parameter
	}, deps);

	useEffect(() => {
		if (!skip) {
			refetch();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [refetch, skip]);

	return { data, loading, error, refetch };
}

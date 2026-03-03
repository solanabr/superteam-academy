"use client";

import { useState, useCallback, useRef } from "react";
import { isValidUsername, isUsernameAvailable } from "@/lib/username-utils";

interface UseUsernameValidationOptions {
	debounceMs?: number;
}

export function useUsernameValidation({ debounceMs = 500 }: UseUsernameValidationOptions = {}) {
	const [checking, setChecking] = useState(false);
	const [available, setAvailable] = useState<boolean | null>(null);
	const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

	const check = useCallback(async (username: string) => {
		if (!(await isValidUsername(username))) {
			setAvailable(null);
			return;
		}

		setChecking(true);
		try {
			const result = await isUsernameAvailable(username);
			setAvailable(result);
		} catch {
			setAvailable(null);
		} finally {
			setChecking(false);
		}
	}, []);

	const debouncedCheck = useCallback(
		(username: string) => {
			setAvailable(null);
			if (timerRef.current) clearTimeout(timerRef.current);
			timerRef.current = setTimeout(async () => {
				if (username && (await isValidUsername(username))) {
					check(username);
				}
			}, debounceMs);
		},
		[check, debounceMs]
	);

	const reset = useCallback(() => {
		setChecking(false);
		setAvailable(null);
		if (timerRef.current) clearTimeout(timerRef.current);
	}, []);

	return { checking, available, check, debouncedCheck, reset };
}

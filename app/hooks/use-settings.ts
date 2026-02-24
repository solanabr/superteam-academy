"use client";

import { useState, useEffect, useCallback } from "react";
import type { UserSettings } from "@superteam-academy/cms";

interface ProfileData {
	name: string;
	email: string;
	bio: string;
	location: string;
	website: string;
	image: string;
}

interface SettingsResponse {
	profile: ProfileData;
	settings: UserSettings;
}

let cachedData: SettingsResponse | null = null;

export function useSettings() {
	const [data, setData] = useState<SettingsResponse | null>(cachedData);
	const [loading, setLoading] = useState(!cachedData);

	useEffect(() => {
		if (cachedData) return;
		let cancelled = false;
		fetch("/api/settings")
			.then((res) => {
				if (!res.ok) throw new Error("Failed to load");
				return res.json() as Promise<SettingsResponse>;
			})
			.then((result) => {
				if (cancelled) return;
				cachedData = result;
				setData(result);
			})
			.catch(() => {
				/* silent — settings load is best-effort */
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const save = useCallback(async (patch: Record<string, unknown>) => {
		const res = await fetch("/api/settings", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(patch),
		});
		if (!res.ok) throw new Error("Failed to save");
		// Invalidate cache so next mount re-fetches
		cachedData = null;
	}, []);

	return { data, loading, save };
}

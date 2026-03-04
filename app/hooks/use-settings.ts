"use client";

import { useState, useEffect, useCallback } from "react";
import type { UserSettings } from "@superteam-academy/cms";
import { useToast } from "@/hooks/use-toast";

interface ProfileData {
	name: string;
	email: string;
	username?: string;
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

async function fetchSettings(): Promise<SettingsResponse> {
	const res = await fetch("/api/settings", { cache: "no-store" });
	if (!res.ok) throw new Error("Failed to load");
	return res.json() as Promise<SettingsResponse>;
}

export function useSettings() {
	const [data, setData] = useState<SettingsResponse | null>(cachedData);
	const [loading, setLoading] = useState(!cachedData);

	useEffect(() => {
		if (cachedData) return;
		let cancelled = false;
		fetchSettings()
			.then((result) => {
				if (cancelled) return;
				cachedData = result;
				setData(result);
			})
			.catch(() => {
				/* noop */
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
		const freshData = await fetchSettings();
		cachedData = freshData;
		setData(freshData);
	}, []);

	return { data, loading, save };
}

export function useSettingsSave(messages: {
	successTitle: string;
	successDescription?: string;
	errorTitle: string;
	errorDescription: string;
	onSuccess?: () => void;
}) {
	const { data, loading, save } = useSettings();
	const { toast } = useToast();
	const [saving, setSaving] = useState(false);

	const handleSave = useCallback(
		async (patch: Record<string, unknown>) => {
			setSaving(true);
			try {
				await save(patch);
				toast({ title: messages.successTitle, description: messages.successDescription });
				messages.onSuccess?.();
			} catch {
				toast({
					title: messages.errorTitle,
					description: messages.errorDescription,
					variant: "destructive",
				});
			} finally {
				setSaving(false);
			}
		},
		[
			save,
			toast,
			messages.successTitle,
			messages.successDescription,
			messages.errorTitle,
			messages.errorDescription,
			messages.onSuccess,
		]
	);

	return { data, loading, saving, handleSave };
}

export function useSettingsSection<T extends object>(
	sectionKey: keyof UserSettings,
	defaults: T,
	messages: {
		successTitle: string;
		successDescription?: string;
		errorTitle: string;
		errorDescription: string;
		onSuccess?: () => void;
	}
) {
	const { data, saving, handleSave: rawSave } = useSettingsSave(messages);
	const [settings, setSettings] = useState<T>(defaults);

	useEffect(() => {
		const section = data?.settings?.[sectionKey];
		if (!section) return;
		setSettings((prev) => ({ ...prev, ...(section as unknown as Partial<T>) }));
	}, [data, sectionKey]);

	const update = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
		setSettings((prev) => ({ ...prev, [key]: value }));
	}, []);

	const save = useCallback(
		() => rawSave({ settings: { [sectionKey]: settings } } as Record<string, unknown>),
		[rawSave, sectionKey, settings]
	);

	return { data, settings, saving, update, save };
}

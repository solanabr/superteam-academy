"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import {
	mockSyncStatus,
	SyncStatus as SyncStatusType,
	SystemLogEntry,
} from "@/lib/data/settings";

interface SettingsContextType {
	logs: SystemLogEntry[];
	syncStatus: SyncStatusType;
	addLog: (message: string, type?: SystemLogEntry["type"]) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
	undefined,
);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
	const [logs, setLogs] = useState<SystemLogEntry[]>(() => {
		if (typeof window === "undefined") return [];
		const savedLogs = localStorage.getItem("systemLogs");
		const initialLogs: SystemLogEntry[] = savedLogs
			? JSON.parse(savedLogs)
			: [
					{
						timestamp: new Date().toLocaleTimeString(),
						message: "System initialized. Operator session active.",
						type: "info",
					},
				];

		// If we loaded from storage, add a resume marker
		if (savedLogs) {
			initialLogs.push({
				timestamp: new Date().toLocaleTimeString(),
				message: "Session resumed. Cache verified.",
				type: "info",
			});
		}

		return initialLogs.slice(-10);
	});
	const [syncStatus, setSyncStatus] = useState<SyncStatusType>(mockSyncStatus);

	const addLog = useCallback(
		(message: string, type: SystemLogEntry["type"] = "info") => {
			const newLog: SystemLogEntry = {
				timestamp: new Date().toLocaleTimeString(),
				message,
				type,
			};
			setLogs((prev) => {
				const updated = [...prev, newLog].slice(-10);
				localStorage.setItem("systemLogs", JSON.stringify(updated));
				return updated;
			});
			setSyncStatus((prev) => ({
				...prev,
				lastSync: new Date().toLocaleTimeString(),
			}));
		},
		[],
	);

	return (
		<SettingsContext.Provider value={{ logs, syncStatus, addLog }}>
			{children}
		</SettingsContext.Provider>
	);
}

export function useSettings() {
	const context = useContext(SettingsContext);
	if (context === undefined) {
		throw new Error("useSettings must be used within a SettingsProvider");
	}
	return context;
}

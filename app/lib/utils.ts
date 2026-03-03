import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import md5 from "md5";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getGravatarUrl(email: string, size = 200): string {
	const hash = md5(email.trim().toLowerCase());
	return `https://gravatar.com/avatar/${hash}?s=${size}&d=retro`;
}

/**
 * Truncates an address to `${first4}...${last4}` format.
 */
export function truncateAddress(address: string, chars = 4): string {
	if (address.length <= chars * 2 + 3) return address;
	return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function getInitials(name: string, maxLength = 2): string {
	return name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, maxLength);
}

export function generateId(prefix?: string): string {
	const id = Math.random().toString(36).slice(2, 9);
	return prefix ? `${prefix}-${id}` : id;
}

export function formatDuration(minutes: number): string {
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	if (hours > 0) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
	return `${mins}m`;
}

export function formatTimestamp(seconds: number): string {
	const minutes = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export function formatDate(dateStr?: string, fallback = "Never"): string {
	if (!dateStr) return fallback;
	return new Date(dateStr).toLocaleDateString();
}

export function formatRelativeTime(date: string | Date): string {
	const now = new Date();
	const past = typeof date === "string" ? new Date(date) : date;
	const diffMs = now.getTime() - past.getTime();
	const diffMins = Math.floor(diffMs / 60_000);
	const diffHours = Math.floor(diffMins / 60);
	const diffDays = Math.floor(diffHours / 24);
	const diffWeeks = Math.floor(diffDays / 7);

	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 7) return `${diffDays}d ago`;
	if (diffWeeks < 4) return `${diffWeeks}w ago`;
	return past.toLocaleDateString();
}

export function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

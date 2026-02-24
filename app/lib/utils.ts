import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export async function getGravatarUrl(email: string, size = 200): Promise<string> {
	const trimmed = email.trim().toLowerCase();
	const data = new TextEncoder().encode(trimmed);
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	const hash = Array.from(new Uint8Array(hashBuffer))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	return `https://gravatar.com/avatar/${hash}?s=${size}&d=retro`;
}

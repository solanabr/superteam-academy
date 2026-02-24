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

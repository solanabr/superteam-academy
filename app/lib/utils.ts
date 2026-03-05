import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
export function resolveColor(color: string): string {
	if (typeof window === "undefined") return color;

	// Create a temporary element to resolve CSS variables or modern color syntax
	const temp = document.createElement("div");
	temp.style.color = color;
	document.body.appendChild(temp);
	const resolved = window.getComputedStyle(temp).color;
	document.body.removeChild(temp);

	return resolved; // This will return rgb() or rgba() which html2canvas supports
}

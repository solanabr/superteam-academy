/**
 * @fileoverview Custom hook for responsive design using media queries.
 */

"use client";

import { useEffect, useState } from "react";

/**
 * Returns true if the current window matches the given media query.
 * @param query - The media query to check (e.g., '(max-width: 1024px)')
 */
export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState(() => {
		if (typeof window !== "undefined") {
			return window.matchMedia(query).matches;
		}
		return false;
	});

	useEffect(() => {
		const media = window.matchMedia(query);

		const listener = () => setMatches(media.matches);
		media.addEventListener("change", listener);
		return () => media.removeEventListener("change", listener);
	}, [query]);

	return matches;
}

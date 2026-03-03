"use client";

import { useState, useCallback } from "react";

interface UseTagInputOptions {
	maxTags?: number;
	initialTags?: string[];
}

export function useTagInput({ maxTags = 5, initialTags = [] }: UseTagInputOptions = {}) {
	const [tags, setTags] = useState<string[]>(initialTags);
	const [tagInput, setTagInput] = useState("");

	const addTag = useCallback(
		(tag: string) => {
			const trimmed = tag.trim();
			if (trimmed && !tags.includes(trimmed) && tags.length < maxTags) {
				setTags((prev) => [...prev, trimmed]);
				return true;
			}
			return false;
		},
		[tags, maxTags]
	);

	const removeTag = useCallback((tag: string) => {
		setTags((prev) => prev.filter((t) => t !== tag));
	}, []);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter" && tagInput.trim()) {
				e.preventDefault();
				if (addTag(tagInput)) {
					setTagInput("");
				}
			}
		},
		[tagInput, addTag]
	);

	return { tags, tagInput, setTagInput, addTag, removeTag, handleKeyDown };
}

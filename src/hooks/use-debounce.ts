/**
 * Custom React hooks for common UI patterns.
 *
 * Per rules/typescript.md: "useDebounce for search inputs"
 *
 * @module hooks/use-debounce
 */

"use client";

import { useState, useEffect } from "react";

/**
 * Debounces a value, returning the latest value only after the
 * specified delay has elapsed without changes.
 *
 * Per rules/typescript.md: all search inputs should be debounced.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default 300ms)
 * @returns The debounced value
 *
 * @example
 * ```tsx
 * const [search, setSearch] = useState("");
 * const debouncedSearch = useDebounce(search, 300);
 *
 * useEffect(() => {
 *   // Only fires after 300ms of inactivity
 *   filterCourses(debouncedSearch);
 * }, [debouncedSearch]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

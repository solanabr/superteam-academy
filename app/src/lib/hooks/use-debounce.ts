import { useState, useEffect } from "react";

/**
 * Returns a debounced version of the provided value.
 * The returned value only updates after the specified delay
 * has passed without a new value being set.
 *
 * @param value - The value to debounce
 * @param delay - Debounce delay in milliseconds (default 300)
 * @returns A tuple of [debouncedValue, isPending] where isPending
 *          is true while waiting for the debounce to settle
 */
export function useDebounce<T>(value: T, delay = 300): [T, boolean] {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  // Derive pending from comparing current value to debounced value
  const isPending = value !== debouncedValue;

  return [debouncedValue, isPending];
}

"use client";

import { useState, useCallback, useRef } from "react";

interface UseOptimisticMutationOptions<TState, TResult = unknown> {
  initialState: TState;
  onMutate: (state: TState) => TState;
  mutationFn: () => Promise<TResult>;
  onSuccess?: (result: TResult) => void;
  onError?: (error: Error, rollback: () => void) => void;
}

interface UseOptimisticMutationReturn<TState> {
  state: TState;
  mutate: () => void;
  isPending: boolean;
  error: Error | null;
  reset: () => void;
}

export function useOptimisticMutation<TState, TResult = unknown>({
  initialState,
  onMutate,
  mutationFn,
  onSuccess,
  onError,
}: UseOptimisticMutationOptions<
  TState,
  TResult
>): UseOptimisticMutationReturn<TState> {
  const [state, setState] = useState<TState>(initialState);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const rollbackRef = useRef<TState>(initialState);

  const mutate = useCallback(() => {
    rollbackRef.current = state;
    const optimistic = onMutate(state);
    setState(optimistic);
    setIsPending(true);
    setError(null);

    mutationFn()
      .then((result) => {
        onSuccess?.(result);
      })
      .catch((err: unknown) => {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        setState(rollbackRef.current);
        onError?.(e, () => setState(rollbackRef.current));
      })
      .finally(() => {
        setIsPending(false);
      });
  }, [state, onMutate, mutationFn, onSuccess, onError]);

  const reset = useCallback(() => {
    setState(initialState);
    setIsPending(false);
    setError(null);
  }, [initialState]);

  return { state, mutate, isPending, error, reset };
}

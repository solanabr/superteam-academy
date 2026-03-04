import { useQuery } from "@tanstack/react-query";

export type SigningMode = "onchain" | "stub";

export function useSigningMode(): SigningMode {
  const { data } = useQuery<{ mode: SigningMode }>({
    queryKey: ["signing-mode"],
    queryFn: () => fetch("/api/signing-mode").then((r) => r.json()),
    staleTime: Infinity,
    retry: false,
  });
  // Default to "stub" while loading or on error — safe fallback.
  return data?.mode ?? "stub";
}

import { getConfigPda } from "@/pdas.js";
import { getAuthorityProgram, getBackendProgram } from "@/program.js";
import { withRpcRetry } from "@/lib/rpc.js";

export type HealthStatus = "ok" | "degraded" | "unhealthy";

export type LivenessResult = {
  ok: true;
  service: string;
  version?: string;
};

export type ReadinessResult = {
  ok: boolean;
  service: string;
  version?: string;
  checks?: {
    keypairs: "ok" | "missing";
    rpc: "ok" | "error";
  };
  error?: string;
};

export function checkLiveness(): LivenessResult {
  return {
    ok: true,
    service: "academy-backend",
  };
}

export async function checkReadiness(): Promise<ReadinessResult> {
  const base = {
    ok: false,
    service: "academy-backend",
    version: "1",
  };

  const authority = getAuthorityProgram();
  const backend = getBackendProgram();
  const keypairsOk = authority !== null && backend !== null;

  if (!keypairsOk) {
    return {
      ...base,
      checks: {
        keypairs: "missing",
        rpc: "ok",
      },
      error: "Authority or backend keypair not configured",
    };
  }

  try {
    const configPda = getConfigPda(backend!.programId);
    await withRpcRetry(
      () =>
        (backend!.account as { config: { fetch: (p: unknown) => Promise<unknown> } })
          .config.fetch(configPda),
      { timeoutMs: 5_000, maxRetries: 0, label: "readiness" }
    );
    return {
      ...base,
      ok: true,
      checks: {
        keypairs: "ok",
        rpc: "ok",
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ...base,
      checks: {
        keypairs: "ok",
        rpc: "error",
      },
      error: msg,
    };
  }
}

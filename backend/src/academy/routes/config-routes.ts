import type { Hono } from "hono";
import { PublicKey } from "@solana/web3.js";
import { getConfigPda } from "@/pdas.js";
import { withRouteErrorHandling } from "@/lib/errors.js";
import { readJsonObject, readRequiredPublicKey } from "@/lib/validation.js";
import { requireAuthorityProgram, requireProviderPublicKey } from "@/academy/shared.js";

type UpdateConfigMethods = {
  updateConfig: (params: { newBackendSigner: PublicKey }) => {
    accountsPartial: (accounts: Record<string, PublicKey>) => {
      rpc: () => Promise<string>;
    };
  };
};

export function registerConfigRoutes(app: Hono): void {
  app.post(
    "/update-config",
    withRouteErrorHandling(async (c) => {
      const program = requireAuthorityProgram();
      const authority = requireProviderPublicKey(program);
      const body = await readJsonObject(c);

      const newBackendSigner = readRequiredPublicKey(body, "newBackendSigner");
      const configPda = getConfigPda(program.programId);

      const methods = program.methods as unknown as UpdateConfigMethods;
      const tx = await methods
        .updateConfig({ newBackendSigner })
        .accountsPartial({
          config: configPda,
          authority,
        })
        .rpc();

      return c.json({ tx });
    })
  );
}

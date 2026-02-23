import anchor from "@coral-xyz/anchor";
import type { BN as BNType } from "@coral-xyz/anchor";
import type { Hono } from "hono";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { getConfigPda, getMinterRolePda } from "../../pdas.js";
import { withRouteErrorHandling } from "../../lib/errors.js";
import {
  readJsonObject,
  readOptionalNumber,
  readOptionalString,
  readRequiredNumber,
  readRequiredPublicKey,
} from "../../lib/validation.js";
import {
  ensureToken2022Ata,
  fetchConfig,
  requireAuthorityProgram,
  requireBackendProgram,
  requireProviderPublicKey,
} from "../shared.js";

const { BN } = anchor;

type RegisterMinterMethods = {
  registerMinter: (params: {
    minter: PublicKey;
    label: string;
    maxXpPerCall: BNType;
  }) => {
    accountsPartial: (accounts: Record<string, PublicKey>) => {
      rpc: () => Promise<string>;
    };
  };
};

type RevokeMinterMethods = {
  revokeMinter: () => {
    accountsPartial: (accounts: Record<string, PublicKey>) => {
      rpc: () => Promise<string>;
    };
  };
};

type RewardXpMethods = {
  rewardXp: (amount: BNType, memo: string) => {
    accountsPartial: (accounts: Record<string, PublicKey>) => {
      rpc: () => Promise<string>;
    };
  };
};

export function registerMinterRoutes(app: Hono): void {
  app.post(
    "/register-minter",
    withRouteErrorHandling(async (c) => {
      const program = requireAuthorityProgram();
      const authority = requireProviderPublicKey(program);
      const body = await readJsonObject(c);

      const minter = readRequiredPublicKey(body, "minter");
      const label = readOptionalString(body, "label", "custom") ?? "custom";
      const maxXpPerCall = readOptionalNumber(body, "maxXpPerCall", {
        defaultValue: 0,
        integer: true,
        min: 0,
      });

      const configPda = getConfigPda(program.programId);
      const minterRolePda = getMinterRolePda(minter, program.programId);

      const methods = program.methods as unknown as RegisterMinterMethods;
      const tx = await methods
        .registerMinter({
          minter,
          label,
          maxXpPerCall: new BN(maxXpPerCall ?? 0),
        })
        .accountsPartial({
          config: configPda,
          minterRole: minterRolePda,
          authority,
          payer: authority,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return c.json({ tx });
    })
  );

  app.post(
    "/revoke-minter",
    withRouteErrorHandling(async (c) => {
      const program = requireAuthorityProgram();
      const authority = requireProviderPublicKey(program);
      const body = await readJsonObject(c);

      const minter = readRequiredPublicKey(body, "minter");
      const configPda = getConfigPda(program.programId);
      const minterRolePda = getMinterRolePda(minter, program.programId);

      const methods = program.methods as unknown as RevokeMinterMethods;
      const tx = await methods
        .revokeMinter()
        .accountsPartial({
          config: configPda,
          minterRole: minterRolePda,
          authority,
        })
        .rpc();

      return c.json({ tx });
    })
  );

  app.post(
    "/reward-xp",
    withRouteErrorHandling(async (c) => {
      const program = requireBackendProgram();
      const backendSigner = requireProviderPublicKey(program);
      const body = await readJsonObject(c);

      const recipient = readRequiredPublicKey(body, "recipient");
      const amount = readRequiredNumber(body, "amount", {
        integer: true,
        min: 1,
      });
      const memo = readOptionalString(body, "memo", "") ?? "";

      const { configPda, config } = await fetchConfig(program);
      const recipientTokenAccount = await ensureToken2022Ata(
        program,
        config.xpMint,
        recipient
      );
      const minterRolePda = getMinterRolePda(backendSigner, program.programId);

      const methods = program.methods as unknown as RewardXpMethods;
      const tx = await methods
        .rewardXp(new BN(amount), memo)
        .accountsPartial({
          config: configPda,
          minterRole: minterRolePda,
          xpMint: config.xpMint,
          recipientTokenAccount,
          minter: backendSigner,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();

      return c.json({ tx });
    })
  );
}

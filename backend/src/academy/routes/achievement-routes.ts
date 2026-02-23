import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import type { Hono } from "hono";
import { badRequest, withRouteErrorHandling } from "@/lib/errors.js";
import {
  readJsonObject,
  readOptionalNumber,
  readRequiredPublicKey,
  readRequiredString,
} from "@/lib/validation.js";
import {
  getAchievementReceiptPda,
  getAchievementTypePda,
  getConfigPda,
  getMinterRolePda,
} from "@/pdas.js";
import {
  ensureToken2022Ata,
  fetchAchievementType,
  fetchConfig,
  MPL_CORE_PROGRAM_ID,
  requireAuthorityProgram,
  requireAuthoritySigner,
  requireBackendProgram,
  requireBackendSigner,
  requireProviderPublicKey,
  sendLegacyTransaction,
} from "@/academy/shared.js";

type CreateAchievementTypeMethods = {
  createAchievementType: (params: {
    achievementId: string;
    name: string;
    metadataUri: string;
    maxSupply: number;
    xpReward: number;
  }) => {
    accountsPartial: (accounts: Record<string, PublicKey>) => {
      signers: (signers: Keypair[]) => {
        transaction: () => Promise<Transaction>;
      };
    };
  };
};

type AwardAchievementMethods = {
  awardAchievement: () => {
    accountsPartial: (accounts: Record<string, PublicKey>) => {
      signers: (signers: Keypair[]) => {
        transaction: () => Promise<Transaction>;
      };
    };
  };
};

type DeactivateAchievementTypeMethods = {
  deactivateAchievementType: () => {
    accountsPartial: (accounts: Record<string, PublicKey>) => {
      rpc: () => Promise<string>;
    };
  };
};

export function registerAchievementRoutes(app: Hono): void {
  app.post(
    "/create-achievement-type",
    withRouteErrorHandling(async (c) => {
      const program = requireAuthorityProgram();
      const authority = requireProviderPublicKey(program);
      const authoritySigner = requireAuthoritySigner();
      const body = await readJsonObject(c);

      const achievementId = readRequiredString(body, "achievementId");
      const name = readRequiredString(body, "name");
      const metadataUri = readRequiredString(body, "metadataUri");
      const maxSupply = readOptionalNumber(body, "maxSupply", {
        defaultValue: 0,
        integer: true,
        min: 0,
      });
      const xpReward = readOptionalNumber(body, "xpReward", {
        defaultValue: 100,
        integer: true,
        min: 0,
      });

      const { configPda } = await fetchConfig(program);
      const achievementTypePda = getAchievementTypePda(
        achievementId,
        program.programId
      );
      const collection = Keypair.generate();

      const methods = program.methods as unknown as CreateAchievementTypeMethods;
      const tx = await methods
        .createAchievementType({
          achievementId,
          name,
          metadataUri,
          maxSupply: maxSupply ?? 0,
          xpReward: xpReward ?? 100,
        })
        .accountsPartial({
          config: configPda,
          achievementType: achievementTypePda,
          collection: collection.publicKey,
          authority,
          payer: authority,
          mplCoreProgram: MPL_CORE_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([collection])
        .transaction();

      if (!(tx instanceof Transaction)) {
        throw badRequest(
          "Versioned transactions are not supported for create-achievement-type"
        );
      }

      const signature = await sendLegacyTransaction(
        program,
        authoritySigner,
        tx,
        [collection]
      );

      return c.json({
        tx: signature,
        collection: collection.publicKey.toBase58(),
      });
    })
  );

  app.post(
    "/award-achievement",
    withRouteErrorHandling(async (c) => {
      const program = requireBackendProgram();
      const backendSigner = requireProviderPublicKey(program);
      const backendKeypair = requireBackendSigner();
      const body = await readJsonObject(c);

      const achievementId = readRequiredString(body, "achievementId");
      const recipient = readRequiredPublicKey(body, "recipient");
      const providedCollection = readRequiredPublicKey(body, "collection");

      const { configPda, config } = await fetchConfig(program);
      const { achievementTypePda, achievementType } = await fetchAchievementType(
        program,
        achievementId
      );

      if (!achievementType.collection.equals(providedCollection)) {
        throw badRequest(
          "collection does not match the on-chain achievement type collection"
        );
      }

      const achievementReceipt = getAchievementReceiptPda(
        achievementId,
        recipient,
        program.programId
      );
      const minterRolePda = getMinterRolePda(backendSigner, program.programId);
      const recipientTokenAccount = await ensureToken2022Ata(
        program,
        config.xpMint,
        recipient
      );
      const asset = Keypair.generate();

      const methods = program.methods as unknown as AwardAchievementMethods;
      const tx = await methods
        .awardAchievement()
        .accountsPartial({
          config: configPda,
          achievementType: achievementTypePda,
          achievementReceipt,
          minterRole: minterRolePda,
          asset: asset.publicKey,
          collection: achievementType.collection,
          recipient,
          recipientTokenAccount,
          xpMint: config.xpMint,
          payer: backendSigner,
          minter: backendSigner,
          mplCoreProgram: MPL_CORE_PROGRAM_ID,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([asset])
        .transaction();

      if (!(tx instanceof Transaction)) {
        throw badRequest(
          "Versioned transactions are not supported for award-achievement"
        );
      }

      const signature = await sendLegacyTransaction(program, backendKeypair, tx, [asset]);

      return c.json({ tx: signature, asset: asset.publicKey.toBase58() });
    })
  );

  app.post(
    "/deactivate-achievement-type",
    withRouteErrorHandling(async (c) => {
      const program = requireAuthorityProgram();
      const authority = requireProviderPublicKey(program);
      const body = await readJsonObject(c);

      const achievementId = readRequiredString(body, "achievementId");
      const configPda = getConfigPda(program.programId);
      const achievementTypePda = getAchievementTypePda(
        achievementId,
        program.programId
      );

      const methods = program.methods as unknown as DeactivateAchievementTypeMethods;
      const tx = await methods
        .deactivateAchievementType()
        .accountsPartial({
          config: configPda,
          achievementType: achievementTypePda,
          authority,
        })
        .rpc();

      return c.json({ tx });
    })
  );
}

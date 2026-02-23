import anchor from "@coral-xyz/anchor";
import type { BN as BNType } from "@coral-xyz/anchor";
import type { Hono } from "hono";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { getConfigPda, getCoursePda, getEnrollmentPda } from "../../pdas.js";
import { badRequest, withRouteErrorHandling } from "../../lib/errors.js";
import {
  readJsonObject,
  readOptionalNumber,
  readOptionalString,
  readRequiredPublicKey,
  readRequiredString,
} from "../../lib/validation.js";
import {
  MPL_CORE_PROGRAM_ID,
  requireBackendProgram,
  requireProviderPublicKey,
} from "../shared.js";

const { BN } = anchor;

type IssueCredentialMethods = {
  issueCredential: (
    credentialName: string,
    metadataUri: string,
    coursesCompleted: number,
    totalXp: BNType
  ) => {
    accountsPartial: (accounts: Record<string, PublicKey>) => {
      signers: (signers: Keypair[]) => { rpc: () => Promise<string> };
    };
  };
};

type UpgradeCredentialMethods = {
  upgradeCredential: (
    credentialName: string,
    metadataUri: string,
    coursesCompleted: number,
    totalXp: BNType
  ) => {
    accountsPartial: (accounts: Record<string, PublicKey>) => {
      rpc: () => Promise<string>;
    };
  };
};

export function registerCredentialRoutes(app: Hono): void {
  app.post(
    "/issue-credential",
    withRouteErrorHandling(async (c) => {
      const program = requireBackendProgram();
      const backendSigner = requireProviderPublicKey(program);
      const body = await readJsonObject(c);

      const courseId = readOptionalString(body, "courseId", "test-course-1");
      const learner = readRequiredPublicKey(body, "learner");
      const credentialName = readRequiredString(body, "credentialName");
      const metadataUri = readRequiredString(body, "metadataUri");
      const trackCollection = readRequiredPublicKey(body, "trackCollection");
      const coursesCompleted = readOptionalNumber(body, "coursesCompleted", {
        defaultValue: 1,
        integer: true,
        min: 0,
      });
      const totalXp = readOptionalNumber(body, "totalXp", {
        defaultValue: 0,
        integer: true,
        min: 0,
      });

      if (!courseId || coursesCompleted === undefined || totalXp === undefined) {
        throw badRequest("courseId, coursesCompleted and totalXp are required");
      }

      const configPda = getConfigPda(program.programId);
      const coursePda = getCoursePda(courseId, program.programId);
      const enrollmentPda = getEnrollmentPda(courseId, learner, program.programId);
      const payer = requireProviderPublicKey(program);
      const credentialAsset = Keypair.generate();

      const methods = program.methods as unknown as IssueCredentialMethods;
      const tx = await methods
        .issueCredential(
          credentialName,
          metadataUri,
          coursesCompleted,
          new BN(totalXp)
        )
        .accountsPartial({
          config: configPda,
          course: coursePda,
          enrollment: enrollmentPda,
          learner,
          credentialAsset: credentialAsset.publicKey,
          trackCollection,
          payer,
          backendSigner,
          mplCoreProgram: MPL_CORE_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([credentialAsset])
        .rpc();

      return c.json({ tx, credentialAsset: credentialAsset.publicKey.toBase58() });
    })
  );

  app.post(
    "/upgrade-credential",
    withRouteErrorHandling(async (c) => {
      const program = requireBackendProgram();
      const backendSigner = requireProviderPublicKey(program);
      const body = await readJsonObject(c);

      const courseId = readOptionalString(body, "courseId", "test-course-1");
      const learner = readRequiredPublicKey(body, "learner");
      const credentialAsset = readRequiredPublicKey(body, "credentialAsset");
      const credentialName = readRequiredString(body, "credentialName");
      const metadataUri = readRequiredString(body, "metadataUri");
      const trackCollection = readRequiredPublicKey(body, "trackCollection");
      const coursesCompleted = readOptionalNumber(body, "coursesCompleted", {
        defaultValue: 1,
        integer: true,
        min: 0,
      });
      const totalXp = readOptionalNumber(body, "totalXp", {
        defaultValue: 0,
        integer: true,
        min: 0,
      });

      if (!courseId || coursesCompleted === undefined || totalXp === undefined) {
        throw badRequest("courseId, coursesCompleted and totalXp are required");
      }

      const configPda = getConfigPda(program.programId);
      const coursePda = getCoursePda(courseId, program.programId);
      const enrollmentPda = getEnrollmentPda(courseId, learner, program.programId);
      const payer = requireProviderPublicKey(program);

      const methods = program.methods as unknown as UpgradeCredentialMethods;
      const tx = await methods
        .upgradeCredential(
          credentialName,
          metadataUri,
          coursesCompleted,
          new BN(totalXp)
        )
        .accountsPartial({
          config: configPda,
          course: coursePda,
          enrollment: enrollmentPda,
          learner,
          credentialAsset,
          trackCollection,
          payer,
          backendSigner,
          mplCoreProgram: MPL_CORE_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return c.json({ tx });
    })
  );
}

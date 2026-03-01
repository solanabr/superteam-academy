import BN from "bn.js";
import type { Hono } from "hono";
import { Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { getAchievementTypePda, getConfigPda, getCoursePda, getEnrollmentPda } from "@/pdas.js";
import { badRequest, withRouteErrorHandling } from "@/lib/errors.js";
import {
  readJsonObject,
  readOptionalNumber,
  readOptionalString,
  readRequiredPublicKey,
  readRequiredString,
} from "@/lib/validation.js";
import {
  MPL_CORE_PROGRAM_ID,
  requireAuthorityProgram,
  requireAuthoritySigner,
  requireBackendProgram,
  requireProviderPublicKey,
  fetchConfig,
  fetchCourseOrThrow,
  sendLegacyTransaction,
} from "@/academy/shared.js";
import { runCredentialAfterFinalize } from "@/academy/credential-automation.js";
import {
  getNextTrackIdAsync,
  getCredentialCollectionsListAsync,
  setCredentialCollectionAsync,
} from "@/academy/credential-collections-store.js";
import { invalidateTrackCollectionsCache } from "@/academy/track-config.js";
import { buildCredentialMetadata } from "@/academy/credential-metadata.js";
import { uploadCredentialMetadataToPinata, uploadImageToPinata } from "@/academy/pinata.js";

type IssueCredentialMethods = {
  issueCredential: (
    credentialName: string,
    metadataUri: string,
    coursesCompleted: number,
    totalXp: BN
  ) => {
    accountsPartial: (accounts: Record<string, PublicKey>) => {
      signers: (signers: Keypair[]) => { rpc: () => Promise<string> };
    };
  };
};

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

type UpgradeCredentialMethods = {
  upgradeCredential: (
    credentialName: string,
    metadataUri: string,
    coursesCompleted: number,
    totalXp: BN
  ) => {
    accountsPartial: (accounts: Record<string, PublicKey>) => {
      rpc: () => Promise<string>;
    };
  };
};

const PLACEHOLDER_URI = process.env.CREDENTIAL_PLACEHOLDER_URI?.trim() ?? null;

export function registerCredentialRoutes(app: Hono): void {
  app.post(
    "/upload-credential-metadata",
    withRouteErrorHandling(async (c) => {
      const body = await readJsonObject(c);
      const name = readRequiredString(body, "name");
      const description = readOptionalString(body, "description");
      const imageBase64 = readOptionalString(body, "imageBase64");
      const imageFilename = readOptionalString(body, "imageFilename", "credential-image.png");
      const attrs = body.attributes as Record<string, string | number> | undefined;
      let imageUrl: string | null = null;
      if (imageBase64) {
        const buf = Buffer.from(imageBase64, "base64");
        imageUrl = await uploadImageToPinata(buf, imageFilename ?? "credential-image.png");
      }
      const payload = buildCredentialMetadata(name, {
        description: description ?? undefined,
        image: imageUrl ?? undefined,
        attributes: attrs
          ? {
              track_id: attrs.track_id as number | undefined,
              level: attrs.level as number | undefined,
              courses_completed: attrs.courses_completed as number | undefined,
              total_xp: attrs.total_xp as number | undefined,
              course_id: attrs.course_id as string | undefined,
            }
          : undefined,
      });
      const uri = await uploadCredentialMetadataToPinata(
        payload as unknown as Record<string, unknown>,
        `credential-${Date.now()}.json`
      );
      if (!uri) {
        throw badRequest("Pinata upload failed. Set PINATA_JWT.");
      }
      return c.json({ uri });
    })
  );

  app.get("/credential-collections", async (c) => {
    const list = await getCredentialCollectionsListAsync();
    const collections: Record<string, string> = {};
    for (const item of list) {
      collections[String(item.trackId)] = item.collectionAddress;
    }
    return c.json({ collections, list });
  });

  app.post(
    "/create-credential-collection",
    withRouteErrorHandling(async (c) => {
      const program = requireAuthorityProgram();
      const authority = requireProviderPublicKey(program);
      const authoritySigner = requireAuthoritySigner();
      const body = await readJsonObject(c);

      const name = readRequiredString(body, "name");
      const description = readOptionalString(body, "description");
      const imageBase64 = readOptionalString(body, "imageBase64");
      const imageFilename = readOptionalString(body, "imageFilename", "collection-image.png");

      let trackId = await getNextTrackIdAsync();
      const maxAttempts = 100;
      for (let i = 0; i < maxAttempts; i++) {
        const candidateId = `credential-track-${trackId}`;
        const pda = getAchievementTypePda(candidateId, program.programId);
        const info = await program.provider.connection.getAccountInfo(pda);
        if (!info) break;
        trackId++;
      }
      const achievementId = `credential-track-${trackId}`;

      let metadataUri: string | null = null;
      let imageUrl: string | null = null;
      if (imageBase64) {
        const buf = Buffer.from(imageBase64, "base64");
        imageUrl = await uploadImageToPinata(buf, imageFilename ?? "collection-image.png");
      }
      const metadataPayload = {
        name,
        description: description ?? `Track ${trackId} credential collection`,
        ...(imageUrl && { image: imageUrl }),
      };
      metadataUri = await uploadCredentialMetadataToPinata(
        metadataPayload as unknown as Record<string, unknown>,
        `credential-collection-${trackId}.json`
      );
      if (!metadataUri && PLACEHOLDER_URI) metadataUri = PLACEHOLDER_URI;
      if (!metadataUri) {
        throw badRequest("Pinata upload failed. Set CREDENTIAL_PLACEHOLDER_URI or PINATA_JWT.");
      }

      const { configPda } = await fetchConfig(program);
      const achievementTypePda = getAchievementTypePda(achievementId, program.programId);
      const collection = Keypair.generate();

      const methods = program.methods as unknown as CreateAchievementTypeMethods;
      const tx = await methods
        .createAchievementType({
          achievementId,
          name,
          metadataUri,
          maxSupply: 0,
          xpReward: 1,
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
        throw badRequest("Versioned transactions not supported for create-credential-collection");
      }

      const signature = await sendLegacyTransaction(program, authoritySigner, tx, [collection]);

      await setCredentialCollectionAsync(trackId, collection.publicKey.toBase58(), name, imageUrl, metadataUri);
      invalidateTrackCollectionsCache();

      return c.json({
        tx: signature,
        collection: collection.publicKey.toBase58(),
        trackId,
      });
    })
  );

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

      const { course } = await fetchCourseOrThrow(
        program,
        courseId,
        `Course "${courseId}" not found.`
      );
      const courseTrackId =
        (course as { track_id?: number }).track_id ??
        (course as { trackId?: number }).trackId;
      if (courseTrackId != null) {
        const list = await getCredentialCollectionsListAsync();
        const trackCollectionStr = trackCollection.toBase58();
        const row = list.find((r) => r.collectionAddress === trackCollectionStr);
        if (row && row.trackId !== courseTrackId) {
          throw badRequest(
            `Selected collection is for track ${row.trackId} but the course is track ${courseTrackId}. Use a collection for the same track.`
          );
        }
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

      const { course } = await fetchCourseOrThrow(
        program,
        courseId,
        `Course "${courseId}" not found.`
      );
      const courseTrackId =
        (course as { track_id?: number }).track_id ??
        (course as { trackId?: number }).trackId;
      if (courseTrackId != null) {
        const list = await getCredentialCollectionsListAsync();
        const trackCollectionStr = trackCollection.toBase58();
        const row = list.find((r) => r.collectionAddress === trackCollectionStr);
        if (row && row.trackId !== courseTrackId) {
          throw badRequest(
            `Selected collection is for track ${row.trackId} but the course is track ${courseTrackId}. Use a collection for the same track.`
          );
        }
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

  app.post(
    "/issue-credential-for-completion",
    withRouteErrorHandling(async (c) => {
      const program = requireBackendProgram();
      const body = await readJsonObject(c);

      const courseId = readOptionalString(body, "courseId", "test-course-1");
      const learner = readRequiredPublicKey(body, "learner");
      const trackCollectionOverride = readOptionalString(body, "trackCollection");

      if (!courseId) {
        throw badRequest("courseId is required");
      }

      const { coursePda, course } = await fetchCourseOrThrow(
        program,
        courseId,
        `Course "${courseId}" not found.`
      );

      await runCredentialAfterFinalize(
        program,
        courseId,
        learner,
        course,
        trackCollectionOverride ?? undefined
      );

      return c.json({ ok: true });
    })
  );
}

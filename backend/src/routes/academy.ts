import { Hono } from "hono";
import anchor from "@coral-xyz/anchor";
import type { BN as BNType } from "@coral-xyz/anchor";

const { BN } = anchor;
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import {
  getAuthorityKeypair,
  getAuthorityProgram,
  getBackendProgram,
  getBackendSignerKeypair,
} from "../program.js";
import {
  getAchievementReceiptPda,
  getAchievementTypePda,
  getConfigPda,
  getCoursePda,
  getEnrollmentPda,
  getMinterRolePda,
} from "../pdas.js";

const MPL_CORE_PROGRAM_ID = new PublicKey(
  "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
);

const app = new Hono();

app.post("/create-course", async (c) => {
  try {
    const program = getAuthorityProgram();
    if (!program) {
      return c.json(
        { error: "ACADEMY_AUTHORITY_KEYPAIR not configured" },
        500
      );
    }
    const body = await c.req.json<{
      courseId?: string;
      lessonCount?: number;
      xpPerLesson?: number;
      creator?: string;
    }>();
    const {
      courseId = "test-course-1",
      lessonCount = 3,
      xpPerLesson = 100,
      creator,
    } = body;
    const configPda = getConfigPda(program.programId);
    const coursePda = getCoursePda(courseId, program.programId);
    const creatorPubkey = creator
      ? new PublicKey(creator)
      : program.provider.publicKey!;
    const contentTxId = new Array<number>(32).fill(0);
    const tx = await (
      program.methods as unknown as {
        createCourse: (args: {
          courseId: string;
          creator: PublicKey;
          contentTxId: number[];
          lessonCount: number;
          difficulty: number;
          xpPerLesson: number;
          trackId: number;
          trackLevel: number;
          prerequisite: null;
          creatorRewardXp: number;
          minCompletionsForReward: number;
        }) => {
          accountsPartial: (accs: Record<string, PublicKey>) => {
            rpc: () => Promise<string>;
          };
        }
      }
    )
      .createCourse({
        courseId,
        creator: creatorPubkey,
        contentTxId,
        lessonCount,
        difficulty: 1,
        xpPerLesson,
        trackId: 1,
        trackLevel: 1,
        prerequisite: null,
        creatorRewardXp: 50,
        minCompletionsForReward: 3,
      })
      .accountsPartial({
        course: coursePda,
        config: configPda,
        authority: program.provider.publicKey!,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    return c.json({ tx });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

app.post("/complete-lesson", async (c) => {
  try {
    const program = getBackendProgram();
    if (!program) {
      return c.json(
        { error: "ACADEMY_BACKEND_SIGNER_KEYPAIR not configured" },
        500
      );
    }
    const body = await c.req.json<{
      courseId?: string;
      learner: string;
      lessonIndex?: number;
    }>();
    const { courseId = "test-course-1", learner, lessonIndex = 0 } = body;
    const learnerPubkey = new PublicKey(learner);
    const configPda = getConfigPda(program.programId);
    const config = await (
      program.account as {
        config: {
          fetch: (p: PublicKey) => Promise<{ xpMint: PublicKey }>;
        };
      }
    ).config.fetch(configPda);
    const coursePda = getCoursePda(courseId, program.programId);
    try {
      await (
        program.account as { course: { fetch: (p: PublicKey) => Promise<unknown> } }
      ).course.fetch(coursePda);
    } catch (e) {
      const msg = String(e);
      if (msg.includes("Account does not exist") || msg.includes("could not find account")) {
        return c.json(
          { error: `Course "${courseId}" not found. Create it first via create-course.` },
          400
        );
      }
      throw e;
    }
    const enrollmentPda = getEnrollmentPda(
      courseId,
      learnerPubkey,
      program.programId
    );
    const xpAta = getAssociatedTokenAddressSync(
      config.xpMint,
      learnerPubkey,
      false,
      TOKEN_2022_PROGRAM_ID
    );
    try {
      await program.provider.connection.getTokenAccountBalance(xpAta);
    } catch {
      const { Transaction } = await import("@solana/web3.js");
      const ix = createAssociatedTokenAccountInstruction(
        program.provider.publicKey!,
        xpAta,
        learnerPubkey,
        config.xpMint,
        TOKEN_2022_PROGRAM_ID
      );
      const tx = new Transaction().add(ix);
      await program.provider.sendAndConfirm!(tx);
    }
    const tx = await (
      program.methods as unknown as {
        completeLesson: (idx: number) => {
          accountsPartial: (accs: Record<string, PublicKey>) => {
            rpc: () => Promise<string>;
          };
        };
      }
    )
      .completeLesson(lessonIndex)
      .accountsPartial({
        config: configPda,
        course: coursePda,
        enrollment: enrollmentPda,
        learner: learnerPubkey,
        learnerTokenAccount: xpAta,
        xpMint: config.xpMint,
        backendSigner: program.provider.publicKey!,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .rpc();
    return c.json({ tx });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

app.post("/finalize-course", async (c) => {
  try {
    const program = getBackendProgram();
    if (!program) {
      return c.json(
        { error: "ACADEMY_BACKEND_SIGNER_KEYPAIR not configured" },
        500
      );
    }
    const body = await c.req.json<{
      courseId?: string;
      learner: string;
    }>();
    const { courseId = "test-course-1", learner } = body;
    const learnerPubkey = new PublicKey(learner);
    const configPda = getConfigPda(program.programId);
    const config = await (
      program.account as {
        config: {
          fetch: (p: PublicKey) => Promise<{ xpMint: PublicKey }>;
        };
      }
    ).config.fetch(configPda);
    const coursePda = getCoursePda(courseId, program.programId);
    let course: { creator: PublicKey };
    try {
      course = await (
        program.account as {
          course: {
            fetch: (p: PublicKey) => Promise<{ creator: PublicKey }>;
          };
        }
      ).course.fetch(coursePda);
    } catch (e) {
      const msg = String(e);
      if (msg.includes("Account does not exist") || msg.includes("could not find account")) {
        return c.json(
          {
            error: `Course "${courseId}" not found. Create it first via POST /academy/create-course.`,
          },
          400
        );
      }
      throw e;
    }
    const enrollmentPda = getEnrollmentPda(
      courseId,
      learnerPubkey,
      program.programId
    );
    const learnerXpAta = getAssociatedTokenAddressSync(
      config.xpMint,
      learnerPubkey,
      false,
      TOKEN_2022_PROGRAM_ID
    );
    const creatorXpAta = getAssociatedTokenAddressSync(
      config.xpMint,
      course.creator,
      false,
      TOKEN_2022_PROGRAM_ID
    );
    try {
      await program.provider.connection.getTokenAccountBalance(creatorXpAta);
    } catch {
      const { Transaction } = await import("@solana/web3.js");
      const ix = createAssociatedTokenAccountInstruction(
        program.provider.publicKey!,
        creatorXpAta,
        course.creator,
        config.xpMint,
        TOKEN_2022_PROGRAM_ID
      );
      const setupTx = new Transaction().add(ix);
      await program.provider.sendAndConfirm!(setupTx);
    }
    const tx = await (
      program.methods as unknown as {
        finalizeCourse: () => {
          accountsPartial: (accs: Record<string, PublicKey>) => {
            rpc: () => Promise<string>;
          };
        };
      }
    )
      .finalizeCourse()
      .accountsPartial({
        config: configPda,
        course: coursePda,
        enrollment: enrollmentPda,
        learner: learnerPubkey,
        learnerTokenAccount: learnerXpAta,
        creatorTokenAccount: creatorXpAta,
        creator: course.creator,
        xpMint: config.xpMint,
        backendSigner: program.provider.publicKey!,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .rpc();
    return c.json({ tx });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

app.post("/update-config", async (c) => {
  try {
    const program = getAuthorityProgram();
    if (!program) {
      return c.json(
        { error: "ACADEMY_AUTHORITY_KEYPAIR not configured" },
        500
      );
    }
    const body = await c.req.json<{ newBackendSigner?: string }>();
    const { newBackendSigner } = body;
    if (!newBackendSigner) {
      return c.json(
        { error: "newBackendSigner (pubkey) required" },
        400
      );
    }
    const configPda = getConfigPda(program.programId);
    const newSignerPubkey = new PublicKey(newBackendSigner);
    const tx = await (
      program.methods as unknown as {
        updateConfig: (params: { newBackendSigner: PublicKey }) => {
          accountsPartial: (accs: Record<string, PublicKey>) => {
            rpc: () => Promise<string>;
          };
        };
      }
    )
      .updateConfig({ newBackendSigner: newSignerPubkey })
      .accountsPartial({
        config: configPda,
        authority: program.provider.publicKey!,
      })
      .rpc();
    return c.json({ tx });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

app.post("/update-course", async (c) => {
  try {
    const program = getAuthorityProgram();
    if (!program) {
      return c.json(
        { error: "ACADEMY_AUTHORITY_KEYPAIR not configured" },
        500
      );
    }
    const body = await c.req.json<{
      courseId?: string;
      newContentTxId?: number[] | null;
      newIsActive?: boolean | null;
      newXpPerLesson?: number | null;
      newCreatorRewardXp?: number | null;
      newMinCompletionsForReward?: number | null;
    }>();
    const {
      courseId = "test-course-1",
      newContentTxId = null,
      newIsActive = null,
      newXpPerLesson = null,
      newCreatorRewardXp = null,
      newMinCompletionsForReward = null,
    } = body;
    const configPda = getConfigPda(program.programId);
    const coursePda = getCoursePda(courseId, program.programId);
    const params = {
      newContentTxId: newContentTxId ?? null,
      newIsActive: newIsActive ?? null,
      newXpPerLesson:
        newXpPerLesson != null &&
        Number.isFinite(newXpPerLesson) &&
        newXpPerLesson >= 0
          ? newXpPerLesson
          : null,
      newCreatorRewardXp:
        newCreatorRewardXp != null &&
        Number.isFinite(newCreatorRewardXp) &&
        newCreatorRewardXp >= 0
          ? newCreatorRewardXp
          : null,
      newMinCompletionsForReward:
        newMinCompletionsForReward != null &&
        Number.isFinite(newMinCompletionsForReward) &&
        newMinCompletionsForReward >= 0
          ? newMinCompletionsForReward
          : null,
    };
    const tx = await (
      program.methods as unknown as {
        updateCourse: (p: Record<string, unknown>) => {
          accountsPartial: (accs: Record<string, PublicKey>) => {
            rpc: () => Promise<string>;
          };
        };
      }
    )
      .updateCourse(params)
      .accountsPartial({
        config: configPda,
        course: coursePda,
        authority: program.provider.publicKey!,
      })
      .rpc();
    return c.json({ tx });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

app.post("/issue-credential", async (c) => {
  try {
    const program = getBackendProgram();
    if (!program) {
      return c.json(
        { error: "ACADEMY_BACKEND_SIGNER_KEYPAIR not configured" },
        500
      );
    }
    const body = await c.req.json<{
      courseId?: string;
      learner: string;
      credentialName: string;
      metadataUri: string;
      coursesCompleted?: number;
      totalXp?: number;
      trackCollection: string;
    }>();
    const {
      courseId = "test-course-1",
      learner,
      credentialName,
      metadataUri,
      coursesCompleted = 1,
      totalXp = 0,
      trackCollection,
    } = body;
    const learnerPubkey = new PublicKey(learner);
    const trackCollectionPubkey = new PublicKey(trackCollection);
    const configPda = getConfigPda(program.programId);
    const config = await (
      program.account as {
        config: { fetch: (p: PublicKey) => Promise<{ xpMint: PublicKey }> };
      }
    ).config.fetch(configPda);
    const coursePda = getCoursePda(courseId, program.programId);
    const enrollmentPda = getEnrollmentPda(
      courseId,
      learnerPubkey,
      program.programId
    );
    const credentialAsset = Keypair.generate();
    const payer = program.provider.publicKey!;
    const tx = await (
      program.methods as unknown as {
        issueCredential: (
          name: string,
          uri: string,
          completed: number,
          xp: BNType
        ) => {
          accountsPartial: (accs: Record<string, PublicKey>) => {
            signers: (s: Keypair[]) => { rpc: () => Promise<string> };
          };
        };
      }
    )
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
        learner: learnerPubkey,
        credentialAsset: credentialAsset.publicKey,
        trackCollection: trackCollectionPubkey,
        payer,
        backendSigner: program.provider.publicKey!,
        mplCoreProgram: MPL_CORE_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([credentialAsset])
      .rpc();
    return c.json({ tx, credentialAsset: credentialAsset.publicKey.toBase58() });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

app.post("/upgrade-credential", async (c) => {
  try {
    const program = getBackendProgram();
    if (!program) {
      return c.json(
        { error: "ACADEMY_BACKEND_SIGNER_KEYPAIR not configured" },
        500
      );
    }
    const body = await c.req.json<{
      courseId?: string;
      learner: string;
      credentialAsset: string;
      credentialName: string;
      metadataUri: string;
      coursesCompleted?: number;
      totalXp?: number;
      trackCollection: string;
    }>();
    const {
      courseId = "test-course-1",
      learner,
      credentialAsset,
      credentialName,
      metadataUri,
      coursesCompleted = 1,
      totalXp = 0,
      trackCollection,
    } = body;
    const learnerPubkey = new PublicKey(learner);
    const credentialAssetPubkey = new PublicKey(credentialAsset);
    const trackCollectionPubkey = new PublicKey(trackCollection);
    const configPda = getConfigPda(program.programId);
    const coursePda = getCoursePda(courseId, program.programId);
    const enrollmentPda = getEnrollmentPda(
      courseId,
      learnerPubkey,
      program.programId
    );
    const payer = program.provider.publicKey!;
    const tx = await (
      program.methods as unknown as {
        upgradeCredential: (
          name: string,
          uri: string,
          completed: number,
          xp: BNType
        ) => {
          accountsPartial: (accs: Record<string, PublicKey>) => {
            rpc: () => Promise<string>;
          };
        };
      }
    )
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
        learner: learnerPubkey,
        credentialAsset: credentialAssetPubkey,
        trackCollection: trackCollectionPubkey,
        payer,
        backendSigner: program.provider.publicKey!,
        mplCoreProgram: MPL_CORE_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    return c.json({ tx });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

app.post("/register-minter", async (c) => {
  try {
    const program = getAuthorityProgram();
    if (!program) {
      return c.json(
        { error: "ACADEMY_AUTHORITY_KEYPAIR not configured" },
        500
      );
    }
    const body = await c.req.json<{
      minter: string;
      label?: string;
      maxXpPerCall?: number;
    }>();
    const {
      minter,
      label = "custom",
      maxXpPerCall = 0,
    } = body;
    const minterPubkey = new PublicKey(minter);
    const configPda = getConfigPda(program.programId);
    const minterRolePda = getMinterRolePda(minterPubkey, program.programId);
    const payer = program.provider.publicKey!;
    const tx = await (
      program.methods as unknown as {
        registerMinter: (params: {
          minter: PublicKey;
          label: string;
          maxXpPerCall: BNType;
        }) => {
          accountsPartial: (accs: Record<string, PublicKey>) => {
            rpc: () => Promise<string>;
          };
        };
      }
    )
      .registerMinter({
        minter: minterPubkey,
        label,
        maxXpPerCall: new BN(maxXpPerCall),
      })
      .accountsPartial({
        config: configPda,
        minterRole: minterRolePda,
        authority: program.provider.publicKey!,
        payer,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    return c.json({ tx });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

app.post("/revoke-minter", async (c) => {
  try {
    const program = getAuthorityProgram();
    if (!program) {
      return c.json(
        { error: "ACADEMY_AUTHORITY_KEYPAIR not configured" },
        500
      );
    }
    const body = await c.req.json<{ minter: string }>();
    const { minter } = body;
    if (!minter) {
      return c.json({ error: "minter (pubkey) required" }, 400);
    }
    const minterPubkey = new PublicKey(minter);
    const configPda = getConfigPda(program.programId);
    const minterRolePda = getMinterRolePda(minterPubkey, program.programId);
    const tx = await (
      program.methods as unknown as {
        revokeMinter: () => {
          accountsPartial: (accs: Record<string, PublicKey>) => {
            rpc: () => Promise<string>;
          };
        };
      }
    )
      .revokeMinter()
      .accountsPartial({
        config: configPda,
        minterRole: minterRolePda,
        authority: program.provider.publicKey!,
      })
      .rpc();
    return c.json({ tx });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

app.post("/reward-xp", async (c) => {
  try {
    const program = getBackendProgram();
    if (!program) {
      return c.json(
        { error: "ACADEMY_BACKEND_SIGNER_KEYPAIR not configured" },
        500
      );
    }
    const body = await c.req.json<{
      recipient: string;
      amount: number;
      memo?: string;
    }>();
    const { recipient, amount, memo = "" } = body;
    if (!recipient || amount <= 0) {
      return c.json(
        { error: "recipient (pubkey) and amount (>0) required" },
        400
      );
    }
    const recipientPubkey = new PublicKey(recipient);
    const configPda = getConfigPda(program.programId);
    const config = await (
      program.account as {
        config: { fetch: (p: PublicKey) => Promise<{ xpMint: PublicKey }> };
      }
    ).config.fetch(configPda);
    const minterRolePda = getMinterRolePda(
      program.provider.publicKey!,
      program.programId
    );
    const recipientXpAta = getAssociatedTokenAddressSync(
      config.xpMint,
      recipientPubkey,
      false,
      TOKEN_2022_PROGRAM_ID
    );
    try {
      await program.provider.connection.getTokenAccountBalance(recipientXpAta);
    } catch {
      const { Transaction } = await import("@solana/web3.js");
      const ix = createAssociatedTokenAccountInstruction(
        program.provider.publicKey!,
        recipientXpAta,
        recipientPubkey,
        config.xpMint,
        TOKEN_2022_PROGRAM_ID
      );
      const setupTx = new Transaction().add(ix);
      await program.provider.sendAndConfirm!(setupTx);
    }
    const tx = await (
      program.methods as unknown as {
        rewardXp: (amount: BNType, memo: string) => {
          accountsPartial: (accs: Record<string, PublicKey>) => {
            rpc: () => Promise<string>;
          };
        };
      }
    )
      .rewardXp(new BN(amount), memo)
      .accountsPartial({
        config: configPda,
        minterRole: minterRolePda,
        xpMint: config.xpMint,
        recipientTokenAccount: recipientXpAta,
        minter: program.provider.publicKey!,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .rpc();
    return c.json({ tx });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

app.post("/create-achievement-type", async (c) => {
  try {
    const program = getAuthorityProgram();
    const authorityKeypair = getAuthorityKeypair();
    if (!program || !authorityKeypair) {
      return c.json(
        { error: "ACADEMY_AUTHORITY_KEYPAIR not configured" },
        500
      );
    }
    const body = await c.req.json<{
      achievementId: string;
      name: string;
      metadataUri: string;
      maxSupply?: number;
      xpReward?: number;
    }>();
    const {
      achievementId,
      name,
      metadataUri,
      maxSupply = 0,
      xpReward = 100,
    } = body;
    if (!achievementId || !name || !metadataUri) {
      return c.json(
        { error: "achievementId, name, metadataUri required" },
        400
      );
    }
    const collection = Keypair.generate();
    const configPda = getConfigPda(program.programId);
    const achievementTypePda = getAchievementTypePda(
      achievementId,
      program.programId
    );
    const payer = program.provider.publicKey!;
    const tx = await (
      program.methods as unknown as {
        createAchievementType: (params: {
          achievementId: string;
          name: string;
          metadataUri: string;
          maxSupply: number;
          xpReward: number;
        }) => {
          accountsPartial: (accs: Record<string, PublicKey>) => {
            signers: (s: Keypair[]) => { transaction: () => Promise<Transaction> };
          };
        };
      }
    )
      .createAchievementType({
        achievementId,
        name,
        metadataUri,
        maxSupply,
        xpReward,
      })
      .accountsPartial({
        config: configPda,
        achievementType: achievementTypePda,
        collection: collection.publicKey,
        authority: program.provider.publicKey!,
        payer,
        mplCoreProgram: MPL_CORE_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([collection])
      .transaction();
    if (!(tx instanceof Transaction)) {
      return c.json(
        { error: "VersionedTransaction not yet supported for create-achievement-type" },
        500
      );
    }
    tx.recentBlockhash = (
      await program.provider.connection.getLatestBlockhash()
    ).blockhash;
    tx.feePayer = authorityKeypair.publicKey;
    tx.partialSign(collection, authorityKeypair);
    const sig = await program.provider.connection.sendRawTransaction(
      tx.serialize()
    );
    await program.provider.connection.confirmTransaction(sig, "confirmed");
    return c.json({
      tx: sig,
      collection: collection.publicKey.toBase58(),
    });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

app.post("/award-achievement", async (c) => {
  try {
    const program = getBackendProgram();
    const backendKeypair = getBackendSignerKeypair();
    if (!program || !backendKeypair) {
      return c.json(
        { error: "ACADEMY_BACKEND_SIGNER_KEYPAIR not configured" },
        500
      );
    }
    const body = await c.req.json<{
      achievementId: string;
      recipient: string;
      collection: string;
    }>();
    const { achievementId, recipient, collection } = body;
    if (!achievementId || !recipient || !collection) {
      return c.json(
        {
          error:
            "achievementId, recipient, collection (pubkey) required",
        },
        400
      );
    }
    const recipientPubkey = new PublicKey(recipient);
    const collectionPubkey = new PublicKey(collection);
    const configPda = getConfigPda(program.programId);
    const config = await (
      program.account as {
        config: { fetch: (p: PublicKey) => Promise<{ xpMint: PublicKey }> };
      }
    ).config.fetch(configPda);
    const achievementTypePda = getAchievementTypePda(
      achievementId,
      program.programId
    );
    const achievementType = await (
      program.account as {
        achievementType: {
          fetch: (p: PublicKey) => Promise<{
            collection: PublicKey;
            xpReward: bigint;
          }>;
        };
      }
    ).achievementType.fetch(achievementTypePda);
    const receiptPda = getAchievementReceiptPda(
      achievementId,
      recipientPubkey,
      program.programId
    );
    const minterRolePda = getMinterRolePda(
      program.provider.publicKey!,
      program.programId
    );
    const asset = Keypair.generate();
    const recipientXpAta = getAssociatedTokenAddressSync(
      config.xpMint,
      recipientPubkey,
      false,
      TOKEN_2022_PROGRAM_ID
    );
    try {
      await program.provider.connection.getTokenAccountBalance(recipientXpAta);
    } catch {
      const { Transaction } = await import("@solana/web3.js");
      const ix = createAssociatedTokenAccountInstruction(
        program.provider.publicKey!,
        recipientXpAta,
        recipientPubkey,
        config.xpMint,
        TOKEN_2022_PROGRAM_ID
      );
      const setupTx = new Transaction().add(ix);
      await program.provider.sendAndConfirm!(setupTx);
    }
    const payer = program.provider.publicKey!;
    const tx = await (
      program.methods as unknown as {
        awardAchievement: () => {
          accountsPartial: (accs: Record<string, PublicKey>) => {
            signers: (s: Keypair[]) => {
              transaction: () => Promise<Transaction>;
            };
          };
        };
      }
    )
      .awardAchievement()
      .accountsPartial({
        config: configPda,
        achievementType: achievementTypePda,
        achievementReceipt: receiptPda,
        minterRole: minterRolePda,
        asset: asset.publicKey,
        collection:
          achievementType.collection ?? collectionPubkey,
        recipient: recipientPubkey,
        recipientTokenAccount: recipientXpAta,
        xpMint: config.xpMint,
        payer,
        minter: program.provider.publicKey!,
        mplCoreProgram: MPL_CORE_PROGRAM_ID,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([asset])
      .transaction();
    if (!(tx instanceof Transaction)) {
      return c.json(
        {
          error:
            "VersionedTransaction not yet supported for award-achievement",
        },
        500
      );
    }
    tx.recentBlockhash = (
      await program.provider.connection.getLatestBlockhash()
    ).blockhash;
    tx.feePayer = backendKeypair.publicKey;
    tx.partialSign(asset, backendKeypair);
    const sig = await program.provider.connection.sendRawTransaction(
      tx.serialize()
    );
    await program.provider.connection.confirmTransaction(sig, "confirmed");
    return c.json({ tx: sig, asset: asset.publicKey.toBase58() });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

app.post("/deactivate-achievement-type", async (c) => {
  try {
    const program = getAuthorityProgram();
    if (!program) {
      return c.json(
        { error: "ACADEMY_AUTHORITY_KEYPAIR not configured" },
        500
      );
    }
    const body = await c.req.json<{ achievementId: string }>();
    const { achievementId } = body;
    if (!achievementId) {
      return c.json({ error: "achievementId required" }, 400);
    }
    const configPda = getConfigPda(program.programId);
    const achievementTypePda = getAchievementTypePda(
      achievementId,
      program.programId
    );
    const tx = await (
      program.methods as unknown as {
        deactivateAchievementType: () => {
          accountsPartial: (accs: Record<string, PublicKey>) => {
            rpc: () => Promise<string>;
          };
        };
      }
    )
      .deactivateAchievementType()
      .accountsPartial({
        config: configPda,
        achievementType: achievementTypePda,
        authority: program.provider.publicKey!,
      })
      .rpc();
    return c.json({ tx });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

export default app;

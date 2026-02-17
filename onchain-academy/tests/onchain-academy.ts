import * as anchor from "@coral-xyz/anchor";
import { Program, BN, AnchorError } from "@coral-xyz/anchor";
import { SuperteamAcademy } from "../target/types/superteam_academy";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
} from "@solana/spl-token";
import { expect } from "chai";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createCollectionV2,
  fetchAssetV1,
  fetchCollectionV1,
  mplCore,
} from "@metaplex-foundation/mpl-core";
import {
  generateSigner,
  publicKey as umiPublicKey,
  signerIdentity,
  createSignerFromKeypair as umiCreateSignerFromKeypair,
} from "@metaplex-foundation/umi";
import {
  fromWeb3JsKeypair,
  fromWeb3JsPublicKey,
  toWeb3JsPublicKey,
} from "@metaplex-foundation/umi-web3js-adapters";

describe("onchain-academy", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace
    .superteamAcademy as Program<SuperteamAcademy>;
  const authority = provider.wallet as anchor.Wallet;

  // Shared state
  let xpMintKeypair: Keypair;
  let configPda: PublicKey;
  let configBump: number;

  const courseId = "solana-101";
  let coursePda: PublicKey;
  let courseBump: number;

  const learner = Keypair.generate();
  let learnerTokenAccount: PublicKey;
  let enrollmentPda: PublicKey;
  let enrollmentBump: number;

  const creator = Keypair.generate();
  let creatorTokenAccount: PublicKey;

  const XP_PER_LESSON = 100;
  const LESSON_COUNT = 3;
  // Completion bonus is now 50% of total lesson XP = (XP_PER_LESSON * LESSON_COUNT) / 2
  const EXPECTED_BONUS_XP = Math.floor((XP_PER_LESSON * LESSON_COUNT) / 2);
  const CREATOR_REWARD_XP = 50;
  const MIN_COMPLETIONS_FOR_REWARD = 1;

  const contentTxId = new Array(32).fill(1);

  before(async () => {
    [configPda, configBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );
    [coursePda, courseBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("course"), Buffer.from(courseId)],
      program.programId
    );
    [enrollmentPda, enrollmentBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("enrollment"),
        Buffer.from(courseId),
        learner.publicKey.toBuffer(),
      ],
      program.programId
    );

    xpMintKeypair = Keypair.generate();

    for (const wallet of [learner.publicKey, creator.publicKey]) {
      const sig = await provider.connection.requestAirdrop(
        wallet,
        5 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(sig, "confirmed");
    }
  });

  // ===========================================================================
  // 1. Initialize
  // ===========================================================================
  describe("1. Initialize", () => {
    it("initializes config and XP mint", async () => {
      const [backendMinterRole] = PublicKey.findProgramAddressSync(
        [Buffer.from("minter"), authority.publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .initialize()
        .accountsPartial({
          config: configPda,
          xpMint: xpMintKeypair.publicKey,
          authority: authority.publicKey,
          backendMinterRole,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([xpMintKeypair])
        .rpc();

      const configAccount = await program.account.config.fetch(configPda);

      expect(configAccount.authority.toBase58()).to.equal(
        authority.publicKey.toBase58()
      );
      expect(configAccount.backendSigner.toBase58()).to.equal(
        authority.publicKey.toBase58()
      );
      expect(configAccount.xpMint.toBase58()).to.equal(
        xpMintKeypair.publicKey.toBase58()
      );
      expect(configAccount.bump).to.equal(configBump);

      // Verify auto-registered backend minter role
      const minterRole = await program.account.minterRole.fetch(
        backendMinterRole
      );
      expect(minterRole.minter.toBase58()).to.equal(
        authority.publicKey.toBase58()
      );
      expect(minterRole.label).to.equal("backend");
      expect(minterRole.maxXpPerCall.toNumber()).to.equal(0);
      expect(minterRole.totalXpMinted.toNumber()).to.equal(0);
      expect(minterRole.isActive).to.equal(true);
    });

    it("double initialize fails", async () => {
      const secondMint = Keypair.generate();
      const [backendMinterRole] = PublicKey.findProgramAddressSync(
        [Buffer.from("minter"), authority.publicKey.toBuffer()],
        program.programId
      );

      try {
        await program.methods
          .initialize()
          .accountsPartial({
            config: configPda,
            xpMint: secondMint.publicKey,
            authority: authority.publicKey,
            backendMinterRole,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .signers([secondMint])
          .rpc();
        expect.fail("Should have thrown");
      } catch (err) {
        // Double-init fails because the config account already exists
        expect(err.toString()).to.contain("Error");
      }
    });
  });

  // ===========================================================================
  // 2. Update Config
  // ===========================================================================
  describe("2. Update Config", () => {
    it("rotates backend signer", async () => {
      const newSigner = Keypair.generate();

      await program.methods
        .updateConfig({
          newBackendSigner: newSigner.publicKey,
        })
        .accountsPartial({
          config: configPda,
          authority: authority.publicKey,
        })
        .rpc();

      const configAccount = await program.account.config.fetch(configPda);
      expect(configAccount.backendSigner.toBase58()).to.equal(
        newSigner.publicKey.toBase58()
      );

      // Rotate back for subsequent tests
      await program.methods
        .updateConfig({
          newBackendSigner: authority.publicKey,
        })
        .accountsPartial({
          config: configPda,
          authority: authority.publicKey,
        })
        .rpc();

      const restored = await program.account.config.fetch(configPda);
      expect(restored.backendSigner.toBase58()).to.equal(
        authority.publicKey.toBase58()
      );
    });

    it("no-op update with null keeps signer unchanged", async () => {
      const before = await program.account.config.fetch(configPda);

      await program.methods
        .updateConfig({
          newBackendSigner: null,
        })
        .accountsPartial({
          config: configPda,
          authority: authority.publicKey,
        })
        .rpc();

      const after = await program.account.config.fetch(configPda);
      expect(after.backendSigner.toBase58()).to.equal(
        before.backendSigner.toBase58()
      );
    });

    it("fails with wrong authority", async () => {
      const imposter = Keypair.generate();
      const airdropSig = await provider.connection.requestAirdrop(
        imposter.publicKey,
        LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(airdropSig, "confirmed");

      try {
        await program.methods
          .updateConfig({
            newBackendSigner: imposter.publicKey,
          })
          .accountsPartial({
            config: configPda,
            authority: imposter.publicKey,
          })
          .signers([imposter])
          .rpc();
        expect.fail("Should have thrown");
      } catch (err) {
        if (err instanceof AnchorError) {
          expect(err.error.errorCode.code).to.equal("Unauthorized");
        } else {
          expect(err.toString()).to.contain("Error");
        }
      }
    });
  });

  // ===========================================================================
  // 3. Create Course
  // ===========================================================================
  describe("3. Create Course", () => {
    it("creates course with all fields", async () => {
      await program.methods
        .createCourse({
          courseId: courseId,
          creator: creator.publicKey,
          contentTxId: contentTxId,
          lessonCount: LESSON_COUNT,
          difficulty: 2,
          xpPerLesson: XP_PER_LESSON,
          trackId: 1,
          trackLevel: 1,
          prerequisite: null,
          creatorRewardXp: CREATOR_REWARD_XP,
          minCompletionsForReward: MIN_COMPLETIONS_FOR_REWARD,
        })
        .accountsPartial({
          course: coursePda,
          config: configPda,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const course = await program.account.course.fetch(coursePda);

      expect(course.courseId).to.equal(courseId);
      expect(course.creator.toBase58()).to.equal(
        creator.publicKey.toBase58()
      );
      expect(course.version).to.equal(1);
      expect(course.lessonCount).to.equal(LESSON_COUNT);
      expect(course.difficulty).to.equal(2);
      expect(course.xpPerLesson).to.equal(XP_PER_LESSON);
      expect(course.trackId).to.equal(1);
      expect(course.trackLevel).to.equal(1);
      expect(course.prerequisite).to.be.null;
      expect(course.creatorRewardXp).to.equal(CREATOR_REWARD_XP);
      expect(course.minCompletionsForReward).to.equal(
        MIN_COMPLETIONS_FOR_REWARD
      );
      expect(course.totalCompletions).to.equal(0);
      expect(course.totalEnrollments).to.equal(0);
      expect(course.isActive).to.equal(true);
      expect(course.createdAt.toNumber()).to.be.greaterThan(0);
      expect(course.bump).to.equal(courseBump);
    });

    it("fails with empty course_id", async () => {
      const emptyId = "";
      const [emptyPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("course"), Buffer.from(emptyId)],
        program.programId
      );

      try {
        await program.methods
          .createCourse({
            courseId: emptyId,
            creator: creator.publicKey,
            contentTxId: contentTxId,
            lessonCount: 1,
            difficulty: 1,
            xpPerLesson: 10,
            trackId: 1,
            trackLevel: 1,
            prerequisite: null,
            creatorRewardXp: 0,
            minCompletionsForReward: 0,
          })
          .accountsPartial({
            course: emptyPda,
            config: configPda,
            authority: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        expect.fail("Should have thrown");
      } catch (err) {
        if (err instanceof AnchorError) {
          expect(err.error.errorCode.code).to.equal("CourseIdEmpty");
        } else {
          expect(err.toString()).to.contain("CourseIdEmpty");
        }
      }
    });

    it("fails with course_id too long (33 chars)", async () => {
      const longId = "a".repeat(33);

      try {
        const [longPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("course"), Buffer.from(longId)],
          program.programId
        );

        await program.methods
          .createCourse({
            courseId: longId,
            creator: creator.publicKey,
            contentTxId: contentTxId,
            lessonCount: 1,
            difficulty: 1,
            xpPerLesson: 10,
            trackId: 1,
            trackLevel: 1,
            prerequisite: null,
            creatorRewardXp: 0,
            minCompletionsForReward: 0,
          })
          .accountsPartial({
            course: longPda,
            config: configPda,
            authority: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        expect.fail("Should have thrown");
      } catch (err) {
        // Either AnchorError from program or TypeError from seed length exceeded
        if (err instanceof AnchorError) {
          expect(err.error.errorCode.code).to.equal("CourseIdTooLong");
        } else {
          expect(err.toString()).to.contain("Error");
        }
      }
    });

    it("fails with invalid difficulty 0", async () => {
      const badId = "bad-diff-0";
      const [badPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("course"), Buffer.from(badId)],
        program.programId
      );

      try {
        await program.methods
          .createCourse({
            courseId: badId,
            creator: creator.publicKey,
            contentTxId: contentTxId,
            lessonCount: 1,
            difficulty: 0,
            xpPerLesson: 10,
            trackId: 1,
            trackLevel: 1,
            prerequisite: null,
            creatorRewardXp: 0,
            minCompletionsForReward: 0,
          })
          .accountsPartial({
            course: badPda,
            config: configPda,
            authority: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        expect.fail("Should have thrown");
      } catch (err) {
        if (err instanceof AnchorError) {
          expect(err.error.errorCode.code).to.equal("InvalidDifficulty");
        } else {
          expect(err.toString()).to.contain("InvalidDifficulty");
        }
      }
    });

    it("fails with invalid difficulty 4", async () => {
      const badId = "bad-diff-4";
      const [badPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("course"), Buffer.from(badId)],
        program.programId
      );

      try {
        await program.methods
          .createCourse({
            courseId: badId,
            creator: creator.publicKey,
            contentTxId: contentTxId,
            lessonCount: 1,
            difficulty: 4,
            xpPerLesson: 10,
            trackId: 1,
            trackLevel: 1,
            prerequisite: null,
            creatorRewardXp: 0,
            minCompletionsForReward: 0,
          })
          .accountsPartial({
            course: badPda,
            config: configPda,
            authority: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        expect.fail("Should have thrown");
      } catch (err) {
        if (err instanceof AnchorError) {
          expect(err.error.errorCode.code).to.equal("InvalidDifficulty");
        } else {
          expect(err.toString()).to.contain("InvalidDifficulty");
        }
      }
    });

    it("fails with lesson_count 0", async () => {
      const badId = "bad-lessons-0";
      const [badPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("course"), Buffer.from(badId)],
        program.programId
      );

      try {
        await program.methods
          .createCourse({
            courseId: badId,
            creator: creator.publicKey,
            contentTxId: contentTxId,
            lessonCount: 0,
            difficulty: 1,
            xpPerLesson: 10,
            trackId: 1,
            trackLevel: 1,
            prerequisite: null,
            creatorRewardXp: 0,
            minCompletionsForReward: 0,
          })
          .accountsPartial({
            course: badPda,
            config: configPda,
            authority: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        expect.fail("Should have thrown");
      } catch (err) {
        if (err instanceof AnchorError) {
          expect(err.error.errorCode.code).to.equal("InvalidLessonCount");
        } else {
          expect(err.toString()).to.contain("InvalidLessonCount");
        }
      }
    });

    it("course_id at max length (32 chars) succeeds", async () => {
      const maxId = "b".repeat(32);
      const [maxPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("course"), Buffer.from(maxId)],
        program.programId
      );

      await program.methods
        .createCourse({
          courseId: maxId,
          creator: creator.publicKey,
          contentTxId: contentTxId,
          lessonCount: 1,
          difficulty: 1,
          xpPerLesson: 10,
          trackId: 1,
          trackLevel: 1,
          prerequisite: null,
          creatorRewardXp: 0,
          minCompletionsForReward: 0,
        })
        .accountsPartial({
          course: maxPda,
          config: configPda,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const course = await program.account.course.fetch(maxPda);
      expect(course.courseId).to.equal(maxId);
      expect(course.courseId.length).to.equal(32);
    });

    it("all 3 valid difficulties (1, 2, 3) succeed", async () => {
      for (const difficulty of [1, 2, 3]) {
        const diffId = `diff-${difficulty}`;
        const [diffPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("course"), Buffer.from(diffId)],
          program.programId
        );

        await program.methods
          .createCourse({
            courseId: diffId,
            creator: creator.publicKey,
            contentTxId: contentTxId,
            lessonCount: 1,
            difficulty: difficulty,
            xpPerLesson: 10,
            trackId: 10,
            trackLevel: difficulty,
            prerequisite: null,
            creatorRewardXp: 0,
            minCompletionsForReward: 0,
          })
          .accountsPartial({
            course: diffPda,
            config: configPda,
            authority: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        const course = await program.account.course.fetch(diffPda);
        expect(course.difficulty).to.equal(difficulty);
      }
    });
  });

  // ===========================================================================
  // 4. Update Course
  // ===========================================================================
  describe("4. Update Course", () => {
    it("updates content and increments version", async () => {
      const newContent = new Array(32).fill(2);

      await program.methods
        .updateCourse({
          newContentTxId: newContent,
          newIsActive: null,
          newXpPerLesson: null,
          newCreatorRewardXp: null,
          newMinCompletionsForReward: null,
        })
        .accountsPartial({
          course: coursePda,
          config: configPda,
          authority: authority.publicKey,
        })
        .rpc();

      const course = await program.account.course.fetch(coursePda);
      expect(course.version).to.equal(2);
      expect(Array.from(course.contentTxId)).to.deep.equal(newContent);
    });

    it("toggles is_active", async () => {
      await program.methods
        .updateCourse({
          newContentTxId: null,
          newIsActive: false,
          newXpPerLesson: null,
          newCreatorRewardXp: null,
          newMinCompletionsForReward: null,
        })
        .accountsPartial({
          course: coursePda,
          config: configPda,
          authority: authority.publicKey,
        })
        .rpc();

      let course = await program.account.course.fetch(coursePda);
      expect(course.isActive).to.equal(false);

      // Re-activate for subsequent tests
      await program.methods
        .updateCourse({
          newContentTxId: null,
          newIsActive: true,
          newXpPerLesson: null,
          newCreatorRewardXp: null,
          newMinCompletionsForReward: null,
        })
        .accountsPartial({
          course: coursePda,
          config: configPda,
          authority: authority.publicKey,
        })
        .rpc();

      course = await program.account.course.fetch(coursePda);
      expect(course.isActive).to.equal(true);
    });

    it("updates multiple fields atomically", async () => {
      const diffId = "diff-1";
      const [diffPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("course"), Buffer.from(diffId)],
        program.programId
      );

      const newContent = new Array(32).fill(99);
      await program.methods
        .updateCourse({
          newContentTxId: newContent,
          newIsActive: null,
          newXpPerLesson: 200,
          newCreatorRewardXp: 50,
          newMinCompletionsForReward: 5,
        })
        .accountsPartial({
          course: diffPda,
          config: configPda,
          authority: authority.publicKey,
        })
        .rpc();

      const course = await program.account.course.fetch(diffPda);
      expect(course.xpPerLesson).to.equal(200);
      expect(course.creatorRewardXp).to.equal(50);
      expect(course.minCompletionsForReward).to.equal(5);
      expect(Array.from(course.contentTxId)).to.deep.equal(newContent);
      expect(course.version).to.equal(2);
    });

    it("fails with wrong authority", async () => {
      const imposter = Keypair.generate();
      const airdropSig = await provider.connection.requestAirdrop(
        imposter.publicKey,
        LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(airdropSig, "confirmed");

      try {
        await program.methods
          .updateCourse({
            newContentTxId: null,
            newIsActive: false,
            newXpPerLesson: null,
            newCreatorRewardXp: null,
            newMinCompletionsForReward: null,
          })
          .accountsPartial({
            course: coursePda,
            config: configPda,
            authority: imposter.publicKey,
          })
          .signers([imposter])
          .rpc();
        expect.fail("Should have thrown");
      } catch (err) {
        if (err instanceof AnchorError) {
          expect(err.error.errorCode.code).to.equal("Unauthorized");
        } else {
          expect(err.toString()).to.contain("Error");
        }
      }
    });
  });

  // ===========================================================================
  // 5. Enroll
  // ===========================================================================
  describe("5. Enroll", () => {
    before(async () => {
      // Create Token-2022 ATAs for learner and creator
      learnerTokenAccount = getAssociatedTokenAddressSync(
        xpMintKeypair.publicKey,
        learner.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      creatorTokenAccount = getAssociatedTokenAddressSync(
        xpMintKeypair.publicKey,
        creator.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const createLearnerAtaIx = createAssociatedTokenAccountInstruction(
        authority.publicKey,
        learnerTokenAccount,
        learner.publicKey,
        xpMintKeypair.publicKey,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const createCreatorAtaIx = createAssociatedTokenAccountInstruction(
        authority.publicKey,
        creatorTokenAccount,
        creator.publicKey,
        xpMintKeypair.publicKey,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const tx = new anchor.web3.Transaction()
        .add(createLearnerAtaIx)
        .add(createCreatorAtaIx);
      await provider.sendAndConfirm(tx);
    });

    it("enrolls learner in course", async () => {
      await program.methods
        .enroll(courseId)
        .accountsPartial({
          course: coursePda,
          enrollment: enrollmentPda,
          learner: learner.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([learner])
        .rpc();

      const enrollment = await program.account.enrollment.fetch(enrollmentPda);

      expect(enrollment.course.toBase58()).to.equal(coursePda.toBase58());
      expect(enrollment.enrolledAt.toNumber()).to.be.greaterThan(0);
      expect(enrollment.completedAt).to.be.null;
      expect(enrollment.credentialAsset).to.be.null;
      expect(enrollment.bump).to.equal(enrollmentBump);

      // Verify all lesson_flags are zero
      for (const word of enrollment.lessonFlags) {
        expect(word.toNumber()).to.equal(0);
      }

      // Verify enrollment count incremented
      const course = await program.account.course.fetch(coursePda);
      expect(course.totalEnrollments).to.equal(1);
    });

    it("enroll on inactive course fails", async () => {
      // Deactivate course
      await program.methods
        .updateCourse({
          newContentTxId: null,
          newIsActive: false,
          newXpPerLesson: null,
          newCreatorRewardXp: null,
          newMinCompletionsForReward: null,
        })
        .accountsPartial({
          course: coursePda,
          config: configPda,
          authority: authority.publicKey,
        })
        .rpc();

      const secondLearner = Keypair.generate();
      const airdropSig = await provider.connection.requestAirdrop(
        secondLearner.publicKey,
        LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(airdropSig, "confirmed");

      const [secondEnrollmentPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("enrollment"),
          Buffer.from(courseId),
          secondLearner.publicKey.toBuffer(),
        ],
        program.programId
      );

      try {
        await program.methods
          .enroll(courseId)
          .accountsPartial({
            course: coursePda,
            enrollment: secondEnrollmentPda,
            learner: secondLearner.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([secondLearner])
          .rpc();
        expect.fail("Should have thrown");
      } catch (err) {
        if (err instanceof AnchorError) {
          expect(err.error.errorCode.code).to.equal("CourseNotActive");
        } else {
          expect(err.toString()).to.contain("CourseNotActive");
        }
      }

      // Re-activate for subsequent tests
      await program.methods
        .updateCourse({
          newContentTxId: null,
          newIsActive: true,
          newXpPerLesson: null,
          newCreatorRewardXp: null,
          newMinCompletionsForReward: null,
        })
        .accountsPartial({
          course: coursePda,
          config: configPda,
          authority: authority.publicKey,
        })
        .rpc();
    });
  });

  // ===========================================================================
  // 6. Complete Lesson
  // ===========================================================================
  describe("6. Complete Lesson", () => {
    it("completes lesson 0 and mints XP", async () => {
      const sig = await program.methods
        .completeLesson(0)
        .accountsPartial({
          config: configPda,
          course: coursePda,
          enrollment: enrollmentPda,
          learner: learner.publicKey,
          learnerTokenAccount: learnerTokenAccount,
          xpMint: xpMintKeypair.publicKey,
          backendSigner: authority.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();
      await provider.connection.confirmTransaction(sig, "confirmed");

      const enrollment = await program.account.enrollment.fetch(enrollmentPda);
      expect(enrollment.lessonFlags[0].toNumber() & 1).to.equal(1);

      // Verify XP minted
      const ata = await getAccount(
        provider.connection,
        learnerTokenAccount,
        "confirmed",
        TOKEN_2022_PROGRAM_ID
      );
      expect(Number(ata.amount)).to.equal(XP_PER_LESSON);
    });

    it("duplicate completion fails", async () => {
      try {
        await program.methods
          .completeLesson(0)
          .accountsPartial({
            config: configPda,
            course: coursePda,
            enrollment: enrollmentPda,
            learner: learner.publicKey,
            learnerTokenAccount: learnerTokenAccount,
            xpMint: xpMintKeypair.publicKey,
            backendSigner: authority.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .rpc();
        expect.fail("Should have thrown");
      } catch (err) {
        if (err instanceof AnchorError) {
          expect(err.error.errorCode.code).to.equal("LessonAlreadyCompleted");
        } else {
          expect(err.toString()).to.contain("LessonAlreadyCompleted");
        }
      }
    });

    it("out-of-bounds lesson index fails", async () => {
      try {
        await program.methods
          .completeLesson(LESSON_COUNT)
          .accountsPartial({
            config: configPda,
            course: coursePda,
            enrollment: enrollmentPda,
            learner: learner.publicKey,
            learnerTokenAccount: learnerTokenAccount,
            xpMint: xpMintKeypair.publicKey,
            backendSigner: authority.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .rpc();
        expect.fail("Should have thrown");
      } catch (err) {
        if (err instanceof AnchorError) {
          expect(err.error.errorCode.code).to.equal("LessonOutOfBounds");
        } else {
          expect(err.toString()).to.contain("LessonOutOfBounds");
        }
      }
    });

    it("wrong backend signer fails", async () => {
      const wrongSigner = Keypair.generate();
      const airdropSig = await provider.connection.requestAirdrop(
        wrongSigner.publicKey,
        LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(airdropSig, "confirmed");

      try {
        await program.methods
          .completeLesson(1)
          .accountsPartial({
            config: configPda,
            course: coursePda,
            enrollment: enrollmentPda,
            learner: learner.publicKey,
            learnerTokenAccount: learnerTokenAccount,
            xpMint: xpMintKeypair.publicKey,
            backendSigner: wrongSigner.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .signers([wrongSigner])
          .rpc();
        expect.fail("Should have thrown");
      } catch (err) {
        if (err instanceof AnchorError) {
          expect(err.error.errorCode.code).to.equal("Unauthorized");
        } else {
          expect(err.toString()).to.contain("Error");
        }
      }
    });

    it("completes remaining lessons (1 and 2)", async () => {
      const sig1 = await program.methods
        .completeLesson(1)
        .accountsPartial({
          config: configPda,
          course: coursePda,
          enrollment: enrollmentPda,
          learner: learner.publicKey,
          learnerTokenAccount: learnerTokenAccount,
          xpMint: xpMintKeypair.publicKey,
          backendSigner: authority.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();
      await provider.connection.confirmTransaction(sig1, "confirmed");

      const sig2 = await program.methods
        .completeLesson(2)
        .accountsPartial({
          config: configPda,
          course: coursePda,
          enrollment: enrollmentPda,
          learner: learner.publicKey,
          learnerTokenAccount: learnerTokenAccount,
          xpMint: xpMintKeypair.publicKey,
          backendSigner: authority.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();
      await provider.connection.confirmTransaction(sig2, "confirmed");

      const enrollment = await program.account.enrollment.fetch(enrollmentPda);
      // Bits 0, 1, 2 set: 0b111 = 7
      expect(enrollment.lessonFlags[0].toNumber() & 0x7).to.equal(7);

      // Verify cumulative XP: 3 lessons * 100 = 300
      const ata = await getAccount(
        provider.connection,
        learnerTokenAccount,
        "confirmed",
        TOKEN_2022_PROGRAM_ID
      );
      expect(Number(ata.amount)).to.equal(XP_PER_LESSON * LESSON_COUNT);
    });
  });

  // ===========================================================================
  // 7. Finalize Course
  // ===========================================================================
  describe("7. Finalize Course", () => {
    it("finalizes with all lessons done, mints bonus + creator XP", async () => {
      const sig = await program.methods
        .finalizeCourse()
        .accountsPartial({
          config: configPda,
          course: coursePda,
          enrollment: enrollmentPda,
          learner: learner.publicKey,
          learnerTokenAccount: learnerTokenAccount,
          creatorTokenAccount: creatorTokenAccount,
          creator: creator.publicKey,
          xpMint: xpMintKeypair.publicKey,
          backendSigner: authority.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();
      await provider.connection.confirmTransaction(sig, "confirmed");

      const enrollment = await program.account.enrollment.fetch(enrollmentPda);
      expect(enrollment.completedAt).to.not.be.null;
      expect(enrollment.completedAt.toNumber()).to.be.greaterThan(0);

      const course = await program.account.course.fetch(coursePda);
      expect(course.totalCompletions).to.equal(1);

      // Learner XP: 3*100 (lessons) + 150 (bonus = floor(100*3/2)) = 450
      const learnerAta = await getAccount(
        provider.connection,
        learnerTokenAccount,
        "confirmed",
        TOKEN_2022_PROGRAM_ID
      );
      expect(Number(learnerAta.amount)).to.equal(
        XP_PER_LESSON * LESSON_COUNT + EXPECTED_BONUS_XP
      );

      // Creator XP: 50 (reward met since totalCompletions=1 >= minCompletionsForReward=1)
      const creatorAta = await getAccount(
        provider.connection,
        creatorTokenAccount,
        "confirmed",
        TOKEN_2022_PROGRAM_ID
      );
      expect(Number(creatorAta.amount)).to.equal(CREATOR_REWARD_XP);
    });

    it("double finalize fails", async () => {
      try {
        await program.methods
          .finalizeCourse()
          .accountsPartial({
            config: configPda,
            course: coursePda,
            enrollment: enrollmentPda,
            learner: learner.publicKey,
            learnerTokenAccount: learnerTokenAccount,
            creatorTokenAccount: creatorTokenAccount,
            creator: creator.publicKey,
            xpMint: xpMintKeypair.publicKey,
            backendSigner: authority.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .rpc();
        expect.fail("Should have thrown");
      } catch (err) {
        if (err instanceof AnchorError) {
          expect(err.error.errorCode.code).to.equal("CourseAlreadyFinalized");
        } else {
          expect(err.toString()).to.contain("CourseAlreadyFinalized");
        }
      }
    });

    it("finalize with incomplete lessons fails", async () => {
      const incompleteId = "incomplete-course";
      const [incompletePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("course"), Buffer.from(incompleteId)],
        program.programId
      );

      await program.methods
        .createCourse({
          courseId: incompleteId,
          creator: creator.publicKey,
          contentTxId: contentTxId,
          lessonCount: 5,
          difficulty: 1,
          xpPerLesson: 10,
          trackId: 2,
          trackLevel: 1,
          prerequisite: null,
          creatorRewardXp: 10,
          minCompletionsForReward: 1,
        })
        .accountsPartial({
          course: incompletePda,
          config: configPda,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const [incompleteEnrollPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("enrollment"),
          Buffer.from(incompleteId),
          learner.publicKey.toBuffer(),
        ],
        program.programId
      );

      await program.methods
        .enroll(incompleteId)
        .accountsPartial({
          course: incompletePda,
          enrollment: incompleteEnrollPda,
          learner: learner.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([learner])
        .rpc();

      // Complete only lesson 0 of 5
      await program.methods
        .completeLesson(0)
        .accountsPartial({
          config: configPda,
          course: incompletePda,
          enrollment: incompleteEnrollPda,
          learner: learner.publicKey,
          learnerTokenAccount: learnerTokenAccount,
          xpMint: xpMintKeypair.publicKey,
          backendSigner: authority.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();

      try {
        await program.methods
          .finalizeCourse()
          .accountsPartial({
            config: configPda,
            course: incompletePda,
            enrollment: incompleteEnrollPda,
            learner: learner.publicKey,
            learnerTokenAccount: learnerTokenAccount,
            creatorTokenAccount: creatorTokenAccount,
            creator: creator.publicKey,
            xpMint: xpMintKeypair.publicKey,
            backendSigner: authority.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .rpc();
        expect.fail("Should have thrown");
      } catch (err) {
        if (err instanceof AnchorError) {
          expect(err.error.errorCode.code).to.equal("CourseNotCompleted");
        } else {
          expect(err.toString()).to.contain("CourseNotCompleted");
        }
      }
    });
  });

  // ===========================================================================
  // 8. Close Enrollment
  // ===========================================================================
  describe("8. Close Enrollment", () => {
    it("closes completed enrollment immediately", async () => {
      const balanceBefore = await provider.connection.getBalance(
        learner.publicKey
      );

      await program.methods
        .closeEnrollment()
        .accountsPartial({
          course: coursePda,
          enrollment: enrollmentPda,
          learner: learner.publicKey,
        })
        .signers([learner])
        .rpc();

      const enrollmentInfo = await provider.connection.getAccountInfo(
        enrollmentPda
      );
      expect(enrollmentInfo).to.be.null;

      const balanceAfter = await provider.connection.getBalance(
        learner.publicKey
      );
      expect(balanceAfter).to.be.greaterThan(balanceBefore);
    });

    it("close incomplete enrollment before 24h cooldown fails", async () => {
      const freshId = "fresh-close-test";
      const [freshCoursePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("course"), Buffer.from(freshId)],
        program.programId
      );

      await program.methods
        .createCourse({
          courseId: freshId,
          creator: creator.publicKey,
          contentTxId: contentTxId,
          lessonCount: 3,
          difficulty: 1,
          xpPerLesson: 10,
          trackId: 3,
          trackLevel: 1,
          prerequisite: null,
          creatorRewardXp: 0,
          minCompletionsForReward: 0,
        })
        .accountsPartial({
          course: freshCoursePda,
          config: configPda,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const [freshEnrollPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("enrollment"),
          Buffer.from(freshId),
          learner.publicKey.toBuffer(),
        ],
        program.programId
      );

      await program.methods
        .enroll(freshId)
        .accountsPartial({
          course: freshCoursePda,
          enrollment: freshEnrollPda,
          learner: learner.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([learner])
        .rpc();

      // Try to close immediately -- 24h cooldown not met
      try {
        await program.methods
          .closeEnrollment()
          .accountsPartial({
            course: freshCoursePda,
            enrollment: freshEnrollPda,
            learner: learner.publicKey,
          })
          .signers([learner])
          .rpc();
        expect.fail("Should have thrown");
      } catch (err) {
        if (err instanceof AnchorError) {
          expect(err.error.errorCode.code).to.equal("UnenrollCooldown");
        } else {
          expect(err.toString()).to.contain("UnenrollCooldown");
        }
      }
    });

    // Note: time warp is not straightforward on localnet; the above test
    // verifies the cooldown enforcement. On devnet or with a custom validator
    // slot override, we could advance time past 24h and verify close succeeds.
  });

  // ===========================================================================
  // 9. Multi-learner flow
  // ===========================================================================
  describe("9. Multi-learner flow", () => {
    const learner2 = Keypair.generate();
    let learner2TokenAccount: PublicKey;
    let learner2EnrollPda: PublicKey;

    before(async () => {
      const sig = await provider.connection.requestAirdrop(
        learner2.publicKey,
        5 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(sig, "confirmed");

      [learner2EnrollPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("enrollment"),
          Buffer.from(courseId),
          learner2.publicKey.toBuffer(),
        ],
        program.programId
      );

      learner2TokenAccount = getAssociatedTokenAddressSync(
        xpMintKeypair.publicKey,
        learner2.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const createAtaIx = createAssociatedTokenAccountInstruction(
        authority.publicKey,
        learner2TokenAccount,
        learner2.publicKey,
        xpMintKeypair.publicKey,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      const tx = new anchor.web3.Transaction().add(createAtaIx);
      await provider.sendAndConfirm(tx);
    });

    it("second learner enrolls, completes, and finalizes same course", async () => {
      await program.methods
        .enroll(courseId)
        .accountsPartial({
          course: coursePda,
          enrollment: learner2EnrollPda,
          learner: learner2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([learner2])
        .rpc();

      // Complete all 3 lessons
      for (let i = 0; i < LESSON_COUNT; i++) {
        const lsig = await program.methods
          .completeLesson(i)
          .accountsPartial({
            config: configPda,
            course: coursePda,
            enrollment: learner2EnrollPda,
            learner: learner2.publicKey,
            learnerTokenAccount: learner2TokenAccount,
            xpMint: xpMintKeypair.publicKey,
            backendSigner: authority.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .rpc();
        await provider.connection.confirmTransaction(lsig, "confirmed");
      }

      // Finalize
      const fsig = await program.methods
        .finalizeCourse()
        .accountsPartial({
          config: configPda,
          course: coursePda,
          enrollment: learner2EnrollPda,
          learner: learner2.publicKey,
          learnerTokenAccount: learner2TokenAccount,
          creatorTokenAccount: creatorTokenAccount,
          creator: creator.publicKey,
          xpMint: xpMintKeypair.publicKey,
          backendSigner: authority.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();
      await provider.connection.confirmTransaction(fsig, "confirmed");

      const enrollment = await program.account.enrollment.fetch(
        learner2EnrollPda
      );
      expect(enrollment.completedAt).to.not.be.null;

      const course = await program.account.course.fetch(coursePda);
      expect(course.totalCompletions).to.equal(2);
      // learner1 enrolled (1), then learner2 enrolled (2)
      // (the inactive-course test used a different learner that failed, no init)
      expect(course.totalEnrollments).to.equal(2);

      // Learner2 XP: 300 (lessons) + 150 (bonus = floor(100*3/2)) = 450
      const l2ata = await getAccount(
        provider.connection,
        learner2TokenAccount,
        "confirmed",
        TOKEN_2022_PROGRAM_ID
      );
      expect(Number(l2ata.amount)).to.equal(
        XP_PER_LESSON * LESSON_COUNT + EXPECTED_BONUS_XP
      );

      // Creator XP should now be 50 + 50 = 100 (reward for both completions)
      const creatorAta = await getAccount(
        provider.connection,
        creatorTokenAccount,
        "confirmed",
        TOKEN_2022_PROGRAM_ID
      );
      expect(Number(creatorAta.amount)).to.equal(CREATOR_REWARD_XP * 2);
    });

    it("second learner can close their completed enrollment", async () => {
      await program.methods
        .closeEnrollment()
        .accountsPartial({
          course: coursePda,
          enrollment: learner2EnrollPda,
          learner: learner2.publicKey,
        })
        .signers([learner2])
        .rpc();

      const info = await provider.connection.getAccountInfo(learner2EnrollPda);
      expect(info).to.be.null;
    });
  });

  // ===========================================================================
  // 10. Enrollment/Course mismatch
  // ===========================================================================
  describe("10. Enrollment/Course mismatch", () => {
    const mismatchLearner = Keypair.generate();
    let mismatchLearnerTokenAccount: PublicKey;

    const otherCourseId = "other-mismatch";
    let otherCoursePda: PublicKey;
    let otherEnrollPda: PublicKey;

    before(async () => {
      const sig = await provider.connection.requestAirdrop(
        mismatchLearner.publicKey,
        5 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(sig, "confirmed");

      [otherCoursePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("course"), Buffer.from(otherCourseId)],
        program.programId
      );

      mismatchLearnerTokenAccount = getAssociatedTokenAddressSync(
        xpMintKeypair.publicKey,
        mismatchLearner.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const createAtaIx = createAssociatedTokenAccountInstruction(
        authority.publicKey,
        mismatchLearnerTokenAccount,
        mismatchLearner.publicKey,
        xpMintKeypair.publicKey,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      const tx = new anchor.web3.Transaction().add(createAtaIx);
      await provider.sendAndConfirm(tx);

      // Create the other course
      await program.methods
        .createCourse({
          courseId: otherCourseId,
          creator: creator.publicKey,
          contentTxId: contentTxId,
          lessonCount: 2,
          difficulty: 1,
          xpPerLesson: 10,
          trackId: 5,
          trackLevel: 1,
          prerequisite: null,
          creatorRewardXp: 0,
          minCompletionsForReward: 0,
        })
        .accountsPartial({
          course: otherCoursePda,
          config: configPda,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Enroll mismatchLearner in the "other" course
      [otherEnrollPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("enrollment"),
          Buffer.from(otherCourseId),
          mismatchLearner.publicKey.toBuffer(),
        ],
        program.programId
      );

      await program.methods
        .enroll(otherCourseId)
        .accountsPartial({
          course: otherCoursePda,
          enrollment: otherEnrollPda,
          learner: mismatchLearner.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([mismatchLearner])
        .rpc();
    });

    it("complete_lesson with wrong course/enrollment pair fails", async () => {
      // Pass the enrollment for "other-mismatch" but the course for "solana-101"
      // PDA seed validation rejects: seeds ["enrollment", "solana-101", learner] != otherEnrollPda
      try {
        await program.methods
          .completeLesson(0)
          .accountsPartial({
            config: configPda,
            course: coursePda, // solana-101
            enrollment: otherEnrollPda, // enrolled in other-mismatch
            learner: mismatchLearner.publicKey,
            learnerTokenAccount: mismatchLearnerTokenAccount,
            xpMint: xpMintKeypair.publicKey,
            backendSigner: authority.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .rpc();
        expect.fail("Should have thrown");
      } catch (err) {
        if (err instanceof AnchorError) {
          expect(err.error.errorCode.code).to.equal("ConstraintSeeds");
        } else {
          expect(err.toString()).to.contain("ConstraintSeeds");
        }
      }
    });

    it("finalize_course with wrong course/enrollment pair fails", async () => {
      try {
        await program.methods
          .finalizeCourse()
          .accountsPartial({
            config: configPda,
            course: coursePda, // solana-101
            enrollment: otherEnrollPda, // enrolled in other-mismatch
            learner: mismatchLearner.publicKey,
            learnerTokenAccount: mismatchLearnerTokenAccount,
            creatorTokenAccount: creatorTokenAccount,
            creator: creator.publicKey,
            xpMint: xpMintKeypair.publicKey,
            backendSigner: authority.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .rpc();
        expect.fail("Should have thrown");
      } catch (err) {
        if (err instanceof AnchorError) {
          expect(err.error.errorCode.code).to.equal("ConstraintSeeds");
        } else {
          expect(err.toString()).to.contain("ConstraintSeeds");
        }
      }
    });
  });

  // ===========================================================================
  // 11. Finalize without creator reward (below threshold)
  // ===========================================================================
  describe("11. Creator reward threshold", () => {
    const threshId = "threshold-test";
    let threshCoursePda: PublicKey;
    const threshLearner = Keypair.generate();
    let threshLearnerTokenAccount: PublicKey;
    let threshEnrollPda: PublicKey;
    let threshCreatorTokenAccount: PublicKey;
    const threshCreator = Keypair.generate();

    before(async () => {
      for (const wallet of [
        threshLearner.publicKey,
        threshCreator.publicKey,
      ]) {
        const sig = await provider.connection.requestAirdrop(
          wallet,
          3 * LAMPORTS_PER_SOL
        );
        await provider.connection.confirmTransaction(sig, "confirmed");
      }

      [threshCoursePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("course"), Buffer.from(threshId)],
        program.programId
      );

      // Course with min_completions_for_reward = 10 (high threshold)
      await program.methods
        .createCourse({
          courseId: threshId,
          creator: threshCreator.publicKey,
          contentTxId: contentTxId,
          lessonCount: 1,
          difficulty: 1,
          xpPerLesson: 50,
          trackId: 7,
          trackLevel: 1,
          prerequisite: null,
          creatorRewardXp: 100,
          minCompletionsForReward: 10,
        })
        .accountsPartial({
          course: threshCoursePda,
          config: configPda,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      threshLearnerTokenAccount = getAssociatedTokenAddressSync(
        xpMintKeypair.publicKey,
        threshLearner.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      threshCreatorTokenAccount = getAssociatedTokenAddressSync(
        xpMintKeypair.publicKey,
        threshCreator.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const createLearnerAtaIx = createAssociatedTokenAccountInstruction(
        authority.publicKey,
        threshLearnerTokenAccount,
        threshLearner.publicKey,
        xpMintKeypair.publicKey,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const createCreatorAtaIx = createAssociatedTokenAccountInstruction(
        authority.publicKey,
        threshCreatorTokenAccount,
        threshCreator.publicKey,
        xpMintKeypair.publicKey,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const tx = new anchor.web3.Transaction()
        .add(createLearnerAtaIx)
        .add(createCreatorAtaIx);
      await provider.sendAndConfirm(tx);

      [threshEnrollPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("enrollment"),
          Buffer.from(threshId),
          threshLearner.publicKey.toBuffer(),
        ],
        program.programId
      );

      await program.methods
        .enroll(threshId)
        .accountsPartial({
          course: threshCoursePda,
          enrollment: threshEnrollPda,
          learner: threshLearner.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([threshLearner])
        .rpc();

      const clSig = await program.methods
        .completeLesson(0)
        .accountsPartial({
          config: configPda,
          course: threshCoursePda,
          enrollment: threshEnrollPda,
          learner: threshLearner.publicKey,
          learnerTokenAccount: threshLearnerTokenAccount,
          xpMint: xpMintKeypair.publicKey,
          backendSigner: authority.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();
      await provider.connection.confirmTransaction(clSig, "confirmed");
    });

    it("creator gets no reward when below threshold", async () => {
      const sig = await program.methods
        .finalizeCourse()
        .accountsPartial({
          config: configPda,
          course: threshCoursePda,
          enrollment: threshEnrollPda,
          learner: threshLearner.publicKey,
          learnerTokenAccount: threshLearnerTokenAccount,
          creatorTokenAccount: threshCreatorTokenAccount,
          creator: threshCreator.publicKey,
          xpMint: xpMintKeypair.publicKey,
          backendSigner: authority.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();
      await provider.connection.confirmTransaction(sig, "confirmed");

      const enrollment = await program.account.enrollment.fetch(
        threshEnrollPda
      );
      expect(enrollment.completedAt).to.not.be.null;

      // Learner gets lesson XP + bonus: 50 + 25 = 75
      const learnerAta = await getAccount(
        provider.connection,
        threshLearnerTokenAccount,
        "confirmed",
        TOKEN_2022_PROGRAM_ID
      );
      expect(Number(learnerAta.amount)).to.equal(50 + 25);

      // Creator gets 0 (totalCompletions=1 < minCompletionsForReward=10)
      const creatorAta = await getAccount(
        provider.connection,
        threshCreatorTokenAccount,
        "confirmed",
        TOKEN_2022_PROGRAM_ID
      );
      expect(Number(creatorAta.amount)).to.equal(0);
    });
  });

  // ===========================================================================
  // 12. Prerequisite enforcement
  // ===========================================================================
  describe("12. Prerequisite enforcement", () => {
    const advancedId = "advanced-course";
    let advancedCoursePda: PublicKey;
    const prereqLearner = Keypair.generate();
    let prereqLearnerTokenAccount: PublicKey;

    before(async () => {
      const sig = await provider.connection.requestAirdrop(
        prereqLearner.publicKey,
        5 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(sig, "confirmed");

      [advancedCoursePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("course"), Buffer.from(advancedId)],
        program.programId
      );

      // Create advanced course that requires solana-101 completion
      await program.methods
        .createCourse({
          courseId: advancedId,
          creator: creator.publicKey,
          contentTxId: contentTxId,
          lessonCount: 1,
          difficulty: 3,
          xpPerLesson: 200,
          trackId: 1,
          trackLevel: 2,
          prerequisite: coursePda, // requires solana-101
          creatorRewardXp: 0,
          minCompletionsForReward: 0,
        })
        .accountsPartial({
          course: advancedCoursePda,
          config: configPda,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      prereqLearnerTokenAccount = getAssociatedTokenAddressSync(
        xpMintKeypair.publicKey,
        prereqLearner.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const createAtaIx = createAssociatedTokenAccountInstruction(
        authority.publicKey,
        prereqLearnerTokenAccount,
        prereqLearner.publicKey,
        xpMintKeypair.publicKey,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      const tx = new anchor.web3.Transaction().add(createAtaIx);
      await provider.sendAndConfirm(tx);
    });

    it("enroll in prerequisite course fails without completed enrollment", async () => {
      const [advEnrollPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("enrollment"),
          Buffer.from(advancedId),
          prereqLearner.publicKey.toBuffer(),
        ],
        program.programId
      );

      // Try to enroll without providing any remaining accounts
      try {
        await program.methods
          .enroll(advancedId)
          .accountsPartial({
            course: advancedCoursePda,
            enrollment: advEnrollPda,
            learner: prereqLearner.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([prereqLearner])
          .rpc();
        expect.fail("Should have thrown");
      } catch (err) {
        if (err instanceof AnchorError) {
          expect(err.error.errorCode.code).to.equal("PrerequisiteNotMet");
        } else {
          expect(err.toString()).to.contain("PrerequisiteNotMet");
        }
      }
    });

    it("enroll with incomplete prerequisite enrollment fails", async () => {
      // Enroll prereqLearner in solana-101 but do NOT complete it
      const [prereqEnrollPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("enrollment"),
          Buffer.from(courseId),
          prereqLearner.publicKey.toBuffer(),
        ],
        program.programId
      );

      await program.methods
        .enroll(courseId)
        .accountsPartial({
          course: coursePda,
          enrollment: prereqEnrollPda,
          learner: prereqLearner.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([prereqLearner])
        .rpc();

      const [advEnrollPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("enrollment"),
          Buffer.from(advancedId),
          prereqLearner.publicKey.toBuffer(),
        ],
        program.programId
      );

      // Pass the incomplete enrollment as remaining account
      try {
        await program.methods
          .enroll(advancedId)
          .accountsPartial({
            course: advancedCoursePda,
            enrollment: advEnrollPda,
            learner: prereqLearner.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .remainingAccounts([
            {
              pubkey: coursePda,
              isWritable: false,
              isSigner: false,
            },
            {
              pubkey: prereqEnrollPda,
              isWritable: false,
              isSigner: false,
            },
          ])
          .signers([prereqLearner])
          .rpc();
        expect.fail("Should have thrown");
      } catch (err) {
        if (err instanceof AnchorError) {
          expect(err.error.errorCode.code).to.equal("PrerequisiteNotMet");
        } else {
          expect(err.toString()).to.contain("PrerequisiteNotMet");
        }
      }
    });

    it("enroll with completed prerequisite succeeds", async () => {
      // Complete all lessons + finalize for prereqLearner on solana-101
      const [prereqEnrollPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("enrollment"),
          Buffer.from(courseId),
          prereqLearner.publicKey.toBuffer(),
        ],
        program.programId
      );

      for (let i = 0; i < LESSON_COUNT; i++) {
        await program.methods
          .completeLesson(i)
          .accountsPartial({
            config: configPda,
            course: coursePda,
            enrollment: prereqEnrollPda,
            learner: prereqLearner.publicKey,
            learnerTokenAccount: prereqLearnerTokenAccount,
            xpMint: xpMintKeypair.publicKey,
            backendSigner: authority.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .rpc();
      }

      await program.methods
        .finalizeCourse()
        .accountsPartial({
          config: configPda,
          course: coursePda,
          enrollment: prereqEnrollPda,
          learner: prereqLearner.publicKey,
          learnerTokenAccount: prereqLearnerTokenAccount,
          creatorTokenAccount: creatorTokenAccount,
          creator: creator.publicKey,
          xpMint: xpMintKeypair.publicKey,
          backendSigner: authority.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();

      // Now enroll in advanced course with completed prereq
      const [advEnrollPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("enrollment"),
          Buffer.from(advancedId),
          prereqLearner.publicKey.toBuffer(),
        ],
        program.programId
      );

      await program.methods
        .enroll(advancedId)
        .accountsPartial({
          course: advancedCoursePda,
          enrollment: advEnrollPda,
          learner: prereqLearner.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .remainingAccounts([
          {
            pubkey: coursePda,
            isWritable: false,
            isSigner: false,
          },
          {
            pubkey: prereqEnrollPda,
            isWritable: false,
            isSigner: false,
          },
        ])
        .signers([prereqLearner])
        .rpc();

      const enrollment = await program.account.enrollment.fetch(advEnrollPda);
      expect(enrollment.course.toBase58()).to.equal(
        advancedCoursePda.toBase58()
      );
    });
  });

  // ===========================================================================
  // Phase 6: Credentials (Metaplex Core)
  // ===========================================================================
  describe("Phase 6: Credentials", () => {
    const MPL_CORE_PROGRAM_ID = new PublicKey(
      "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
    );

    const credLearner = Keypair.generate();
    let credLearnerTokenAccount: PublicKey;
    const credCourseId = "cred-test-course";
    let credCoursePda: PublicKey;
    let credEnrollPda: PublicKey;
    let collectionAddress: PublicKey;
    let credentialKeypair: Keypair;

    before(async () => {
      // Airdrop to credential learner
      const sig = await provider.connection.requestAirdrop(
        credLearner.publicKey,
        10 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(sig, "confirmed");

      // Create UMI instance and signer from authority wallet
      const umi = createUmi("http://127.0.0.1:8899").use(mplCore());
      const umiAuthority = umi.eddsa.createKeypairFromSecretKey(
        authority.payer.secretKey
      );
      umi.use(signerIdentity(umiCreateSignerFromKeypair(umi, umiAuthority)));

      // Create a Metaplex Core collection with update authority = Config PDA
      const collectionSigner = generateSigner(umi);
      await createCollectionV2(umi, {
        collection: collectionSigner,
        name: "Track 1 Credentials",
        uri: "https://arweave.net/collection-metadata",
        updateAuthority: fromWeb3JsPublicKey(configPda),
      }).sendAndConfirm(umi);

      collectionAddress = toWeb3JsPublicKey(collectionSigner.publicKey);

      // Create course for credential tests
      [credCoursePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("course"), Buffer.from(credCourseId)],
        program.programId
      );

      await program.methods
        .createCourse({
          courseId: credCourseId,
          creator: creator.publicKey,
          contentTxId: contentTxId,
          lessonCount: 2,
          difficulty: 1,
          xpPerLesson: 50,
          trackId: 1,
          trackLevel: 1,
          prerequisite: null,
          creatorRewardXp: 0,
          minCompletionsForReward: 0,
        })
        .accountsPartial({
          course: credCoursePda,
          config: configPda,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Create ATA for credential learner
      credLearnerTokenAccount = getAssociatedTokenAddressSync(
        xpMintKeypair.publicKey,
        credLearner.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const createAtaIx = createAssociatedTokenAccountInstruction(
        authority.publicKey,
        credLearnerTokenAccount,
        credLearner.publicKey,
        xpMintKeypair.publicKey,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      const tx = new anchor.web3.Transaction().add(createAtaIx);
      await provider.sendAndConfirm(tx);

      // Enroll credential learner
      [credEnrollPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("enrollment"),
          Buffer.from(credCourseId),
          credLearner.publicKey.toBuffer(),
        ],
        program.programId
      );

      await program.methods
        .enroll(credCourseId)
        .accountsPartial({
          course: credCoursePda,
          enrollment: credEnrollPda,
          learner: credLearner.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([credLearner])
        .rpc();

      // Complete all lessons
      for (let i = 0; i < 2; i++) {
        const lsig = await program.methods
          .completeLesson(i)
          .accountsPartial({
            config: configPda,
            course: credCoursePda,
            enrollment: credEnrollPda,
            learner: credLearner.publicKey,
            learnerTokenAccount: credLearnerTokenAccount,
            xpMint: xpMintKeypair.publicKey,
            backendSigner: authority.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .rpc();
        await provider.connection.confirmTransaction(lsig, "confirmed");
      }

      // Finalize
      const fsig = await program.methods
        .finalizeCourse()
        .accountsPartial({
          config: configPda,
          course: credCoursePda,
          enrollment: credEnrollPda,
          learner: credLearner.publicKey,
          learnerTokenAccount: credLearnerTokenAccount,
          creatorTokenAccount: creatorTokenAccount,
          creator: creator.publicKey,
          xpMint: xpMintKeypair.publicKey,
          backendSigner: authority.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();
      await provider.connection.confirmTransaction(fsig, "confirmed");
    });

    it("issues credential NFT for completed course", async () => {
      credentialKeypair = Keypair.generate();

      const sig = await program.methods
        .issueCredential("Solana Track - Level 1", "https://arweave.net/cred-metadata-v1", 1, new anchor.BN(500))
        .accountsPartial({
          config: configPda,
          course: credCoursePda,
          enrollment: credEnrollPda,
          learner: credLearner.publicKey,
          credentialAsset: credentialKeypair.publicKey,
          trackCollection: collectionAddress,
          payer: authority.publicKey,
          backendSigner: authority.publicKey,
          mplCoreProgram: MPL_CORE_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([credentialKeypair])
        .rpc();
      await provider.connection.confirmTransaction(sig, "confirmed");

      // Verify enrollment.credential_asset is set
      const enrollment = await program.account.enrollment.fetch(credEnrollPda);
      expect(enrollment.credentialAsset).to.not.be.null;
      expect(enrollment.credentialAsset.toBase58()).to.equal(
        credentialKeypair.publicKey.toBase58()
      );

      // Verify the credential NFT exists and is owned by Metaplex Core
      const assetInfo = await provider.connection.getAccountInfo(credentialKeypair.publicKey);
      expect(assetInfo).to.not.be.null;
      expect(assetInfo.owner.toBase58()).to.equal(MPL_CORE_PROGRAM_ID.toBase58());
      // First byte = Key::AssetV1 = 1
      expect(assetInfo.data[0]).to.equal(1);

      // Fetch asset via UMI and verify properties
      const umi = createUmi(provider.connection.rpcEndpoint, { commitment: "confirmed" }).use(mplCore());
      const asset = await fetchAssetV1(
        umi,
        fromWeb3JsPublicKey(credentialKeypair.publicKey)
      );

      expect(asset.name).to.equal("Solana Track - Level 1");
      expect(asset.uri).to.equal("https://arweave.net/cred-metadata-v1");
      expect(asset.owner.toString()).to.equal(
        fromWeb3JsPublicKey(credLearner.publicKey).toString()
      );

      // Verify frozen (PermanentFreezeDelegate)
      expect(asset.permanentFreezeDelegate).to.exist;
      expect(asset.permanentFreezeDelegate.frozen).to.equal(true);

      // Verify attributes
      expect(asset.attributes).to.exist;
      const attrList = asset.attributes.attributeList;
      const trackIdAttr = attrList.find((a) => a.key === "track_id");
      const levelAttr = attrList.find((a) => a.key === "level");
      const coursesAttr = attrList.find((a) => a.key === "courses_completed");
      const xpAttr = attrList.find((a) => a.key === "total_xp");

      expect(trackIdAttr.value).to.equal("1");
      expect(levelAttr.value).to.equal("1");
      expect(coursesAttr.value).to.equal("1");
      expect(xpAttr.value).to.equal("500"); // Passed as param from backend
    });

    it("fails to issue credential for unfinalized enrollment", async () => {
      // Create a separate enrollment that is NOT finalized
      const unfinalizedLearner = Keypair.generate();
      const airdropSig = await provider.connection.requestAirdrop(
        unfinalizedLearner.publicKey,
        5 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(airdropSig, "confirmed");

      const [unfinalizedEnrollPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("enrollment"),
          Buffer.from(credCourseId),
          unfinalizedLearner.publicKey.toBuffer(),
        ],
        program.programId
      );

      await program.methods
        .enroll(credCourseId)
        .accountsPartial({
          course: credCoursePda,
          enrollment: unfinalizedEnrollPda,
          learner: unfinalizedLearner.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([unfinalizedLearner])
        .rpc();

      const newAssetKeypair = Keypair.generate();

      try {
        await program.methods
          .issueCredential("Should Fail", "https://arweave.net/fail", 1, new anchor.BN(500))
          .accountsPartial({
            config: configPda,
            course: credCoursePda,
            enrollment: unfinalizedEnrollPda,
            learner: unfinalizedLearner.publicKey,
            credentialAsset: newAssetKeypair.publicKey,
            trackCollection: collectionAddress,
            payer: authority.publicKey,
            backendSigner: authority.publicKey,
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([newAssetKeypair])
          .rpc();
        expect.fail("Should have thrown");
      } catch (err) {
        if (err instanceof AnchorError) {
          expect(err.error.errorCode.code).to.equal("CourseNotFinalized");
        } else {
          expect(err.toString()).to.contain("CourseNotFinalized");
        }
      }
    });

    it("double issue_credential fails (already issued)", async () => {
      const anotherAsset = Keypair.generate();
      try {
        await program.methods
          .issueCredential("Duplicate", "https://arweave.net/dup", 1, new anchor.BN(500))
          .accountsPartial({
            config: configPda,
            course: credCoursePda,
            enrollment: credEnrollPda,
            learner: credLearner.publicKey,
            credentialAsset: anotherAsset.publicKey,
            trackCollection: collectionAddress,
            payer: authority.publicKey,
            backendSigner: authority.publicKey,
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([anotherAsset])
          .rpc();
        expect.fail("Should have thrown");
      } catch (err) {
        if (err instanceof AnchorError) {
          expect(err.error.errorCode.code).to.equal("CredentialAlreadyIssued");
        } else {
          expect(err.toString()).to.contain("CredentialAlreadyIssued");
        }
      }
    });

    it("upgrades existing credential", async () => {
      const sig = await program.methods
        .upgradeCredential("Solana Track - Level 1 (Updated)", "https://arweave.net/cred-metadata-v2", 2, new anchor.BN(1000))
        .accountsPartial({
          config: configPda,
          course: credCoursePda,
          enrollment: credEnrollPda,
          learner: credLearner.publicKey,
          credentialAsset: credentialKeypair.publicKey,
          trackCollection: collectionAddress,
          payer: authority.publicKey,
          backendSigner: authority.publicKey,
          mplCoreProgram: MPL_CORE_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      await provider.connection.confirmTransaction(sig, "confirmed");

      // Fetch updated asset via UMI
      const umi = createUmi(provider.connection.rpcEndpoint, { commitment: "confirmed" }).use(mplCore());
      const asset = await fetchAssetV1(
        umi,
        fromWeb3JsPublicKey(credentialKeypair.publicKey)
      );

      expect(asset.name).to.equal("Solana Track - Level 1 (Updated)");
      expect(asset.uri).to.equal("https://arweave.net/cred-metadata-v2");

      // Enrollment credential_asset should remain unchanged
      const enrollment = await program.account.enrollment.fetch(credEnrollPda);
      expect(enrollment.credentialAsset.toBase58()).to.equal(
        credentialKeypair.publicKey.toBase58()
      );
    });

    it("fails with wrong credential asset on upgrade", async () => {
      const wrongAssetKeypair = Keypair.generate();

      try {
        await program.methods
          .upgradeCredential("Wrong Asset", "https://arweave.net/wrong", 2, new anchor.BN(1000))
          .accountsPartial({
            config: configPda,
            course: credCoursePda,
            enrollment: credEnrollPda,
            learner: credLearner.publicKey,
            credentialAsset: wrongAssetKeypair.publicKey,
            trackCollection: collectionAddress,
            payer: authority.publicKey,
            backendSigner: authority.publicKey,
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        expect.fail("Should have thrown");
      } catch (err) {
        if (err instanceof AnchorError) {
          expect(err.error.errorCode.code).to.equal("CredentialAssetMismatch");
        } else {
          expect(err.toString()).to.contain("CredentialAssetMismatch");
        }
      }
    });
  });

  // ===========================================================================
  // 13. PDA seed validation (security)
  // ===========================================================================
  describe("13. PDA seed validation (security)", () => {
    const secLearnerA = Keypair.generate();
    const secLearnerB = Keypair.generate();
    const secCourseId = "sec-pda-test";
    let secCoursePda: PublicKey;
    let secEnrollPdaA: PublicKey;
    let secLearnerATokenAccount: PublicKey;
    let secLearnerBTokenAccount: PublicKey;

    before(async () => {
      for (const wallet of [secLearnerA.publicKey, secLearnerB.publicKey]) {
        const sig = await provider.connection.requestAirdrop(
          wallet,
          5 * LAMPORTS_PER_SOL
        );
        await provider.connection.confirmTransaction(sig, "confirmed");
      }

      [secCoursePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("course"), Buffer.from(secCourseId)],
        program.programId
      );

      await program.methods
        .createCourse({
          courseId: secCourseId,
          creator: creator.publicKey,
          contentTxId: contentTxId,
          lessonCount: 2,
          difficulty: 1,
          xpPerLesson: 10,
          trackId: 20,
          trackLevel: 1,
          prerequisite: null,
          creatorRewardXp: 0,
          minCompletionsForReward: 0,
        })
        .accountsPartial({
          course: secCoursePda,
          config: configPda,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      [secEnrollPdaA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("enrollment"),
          Buffer.from(secCourseId),
          secLearnerA.publicKey.toBuffer(),
        ],
        program.programId
      );

      await program.methods
        .enroll(secCourseId)
        .accountsPartial({
          course: secCoursePda,
          enrollment: secEnrollPdaA,
          learner: secLearnerA.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([secLearnerA])
        .rpc();

      // Create ATAs for both learners
      secLearnerATokenAccount = getAssociatedTokenAddressSync(
        xpMintKeypair.publicKey,
        secLearnerA.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      secLearnerBTokenAccount = getAssociatedTokenAddressSync(
        xpMintKeypair.publicKey,
        secLearnerB.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const createAtaAIx = createAssociatedTokenAccountInstruction(
        authority.publicKey,
        secLearnerATokenAccount,
        secLearnerA.publicKey,
        xpMintKeypair.publicKey,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const createAtaBIx = createAssociatedTokenAccountInstruction(
        authority.publicKey,
        secLearnerBTokenAccount,
        secLearnerB.publicKey,
        xpMintKeypair.publicKey,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const tx = new anchor.web3.Transaction()
        .add(createAtaAIx)
        .add(createAtaBIx);
      await provider.sendAndConfirm(tx);
    });

    it("close enrollment by wrong learner fails", async () => {
      // Learner B tries to close learner A's enrollment.
      // The enrollment PDA is derived from learner A's key, so passing
      // learner B as the signer will cause a ConstraintSeeds error because
      // seeds = ["enrollment", course_id, learner.key()] won't match.
      try {
        await program.methods
          .closeEnrollment()
          .accountsPartial({
            course: secCoursePda,
            enrollment: secEnrollPdaA,
            learner: secLearnerB.publicKey,
          })
          .signers([secLearnerB])
          .rpc();
        expect.fail("Should have thrown");
      } catch (err) {
        if (err instanceof AnchorError) {
          expect(err.error.errorCode.code).to.equal("ConstraintSeeds");
        } else {
          expect(err.toString()).to.contain("ConstraintSeeds");
        }
      }
    });

    it("complete lesson with wrong learner fails", async () => {
      // Pass learner B's pubkey but learner A's enrollment PDA.
      // seeds = ["enrollment", course_id, learner.key()] with learner B
      // won't match secEnrollPdaA (derived from learner A).
      try {
        await program.methods
          .completeLesson(0)
          .accountsPartial({
            config: configPda,
            course: secCoursePda,
            enrollment: secEnrollPdaA,
            learner: secLearnerB.publicKey,
            learnerTokenAccount: secLearnerBTokenAccount,
            xpMint: xpMintKeypair.publicKey,
            backendSigner: authority.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .rpc();
        expect.fail("Should have thrown");
      } catch (err) {
        if (err instanceof AnchorError) {
          expect(err.error.errorCode.code).to.equal("ConstraintSeeds");
        } else {
          expect(err.toString()).to.contain("ConstraintSeeds");
        }
      }
    });
  });

  // ===========================================================================
  // 14. Edge cases
  // ===========================================================================
  describe("14. Edge cases", () => {
    it("finalize with computed bonus and zero creator reward", async () => {
      const zeroCourseId = "zero-bonus-course";
      const [zeroCoursePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("course"), Buffer.from(zeroCourseId)],
        program.programId
      );

      const zeroLearner = Keypair.generate();
      const airdropSig = await provider.connection.requestAirdrop(
        zeroLearner.publicKey,
        5 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(airdropSig, "confirmed");

      // Create course with zero creator reward (bonus is now computed automatically)
      await program.methods
        .createCourse({
          courseId: zeroCourseId,
          creator: creator.publicKey,
          contentTxId: contentTxId,
          lessonCount: 2,
          difficulty: 1,
          xpPerLesson: 75,
          trackId: 30,
          trackLevel: 1,
          prerequisite: null,
          creatorRewardXp: 0,
          minCompletionsForReward: 0,
        })
        .accountsPartial({
          course: zeroCoursePda,
          config: configPda,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const zeroLearnerTokenAccount = getAssociatedTokenAddressSync(
        xpMintKeypair.publicKey,
        zeroLearner.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const createAtaIx = createAssociatedTokenAccountInstruction(
        authority.publicKey,
        zeroLearnerTokenAccount,
        zeroLearner.publicKey,
        xpMintKeypair.publicKey,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      const ataT = new anchor.web3.Transaction().add(createAtaIx);
      await provider.sendAndConfirm(ataT);

      const [zeroEnrollPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("enrollment"),
          Buffer.from(zeroCourseId),
          zeroLearner.publicKey.toBuffer(),
        ],
        program.programId
      );

      await program.methods
        .enroll(zeroCourseId)
        .accountsPartial({
          course: zeroCoursePda,
          enrollment: zeroEnrollPda,
          learner: zeroLearner.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([zeroLearner])
        .rpc();

      // Complete both lessons
      for (let i = 0; i < 2; i++) {
        const lsig = await program.methods
          .completeLesson(i)
          .accountsPartial({
            config: configPda,
            course: zeroCoursePda,
            enrollment: zeroEnrollPda,
            learner: zeroLearner.publicKey,
            learnerTokenAccount: zeroLearnerTokenAccount,
            xpMint: xpMintKeypair.publicKey,
            backendSigner: authority.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .rpc();
        await provider.connection.confirmTransaction(lsig, "confirmed");
      }

      // Finalize
      const fsig = await program.methods
        .finalizeCourse()
        .accountsPartial({
          config: configPda,
          course: zeroCoursePda,
          enrollment: zeroEnrollPda,
          learner: zeroLearner.publicKey,
          learnerTokenAccount: zeroLearnerTokenAccount,
          creatorTokenAccount: creatorTokenAccount,
          creator: creator.publicKey,
          xpMint: xpMintKeypair.publicKey,
          backendSigner: authority.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();
      await provider.connection.confirmTransaction(fsig, "confirmed");

      const enrollment = await program.account.enrollment.fetch(zeroEnrollPda);
      expect(enrollment.completedAt).to.not.be.null;

      // Learner XP: 75 * 2 (lessons) + floor(75*2/2) (bonus) = 150 + 75 = 225
      const learnerAta = await getAccount(
        provider.connection,
        zeroLearnerTokenAccount,
        "confirmed",
        TOKEN_2022_PROGRAM_ID
      );
      expect(Number(learnerAta.amount)).to.equal(75 * 2 + Math.floor((75 * 2) / 2));
    });

    it("course with single lesson", async () => {
      const singleId = "single-lesson-course";
      const [singleCoursePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("course"), Buffer.from(singleId)],
        program.programId
      );

      const singleLearner = Keypair.generate();
      const airdropSig = await provider.connection.requestAirdrop(
        singleLearner.publicKey,
        5 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(airdropSig, "confirmed");

      await program.methods
        .createCourse({
          courseId: singleId,
          creator: creator.publicKey,
          contentTxId: contentTxId,
          lessonCount: 1,
          difficulty: 2,
          xpPerLesson: 200,
          trackId: 31,
          trackLevel: 1,
          prerequisite: null,
          creatorRewardXp: 10,
          minCompletionsForReward: 1,
        })
        .accountsPartial({
          course: singleCoursePda,
          config: configPda,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const singleLearnerTokenAccount = getAssociatedTokenAddressSync(
        xpMintKeypair.publicKey,
        singleLearner.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const createAtaIx = createAssociatedTokenAccountInstruction(
        authority.publicKey,
        singleLearnerTokenAccount,
        singleLearner.publicKey,
        xpMintKeypair.publicKey,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      const ataT = new anchor.web3.Transaction().add(createAtaIx);
      await provider.sendAndConfirm(ataT);

      const [singleEnrollPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("enrollment"),
          Buffer.from(singleId),
          singleLearner.publicKey.toBuffer(),
        ],
        program.programId
      );

      await program.methods
        .enroll(singleId)
        .accountsPartial({
          course: singleCoursePda,
          enrollment: singleEnrollPda,
          learner: singleLearner.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([singleLearner])
        .rpc();

      // Complete the single lesson
      const clSig = await program.methods
        .completeLesson(0)
        .accountsPartial({
          config: configPda,
          course: singleCoursePda,
          enrollment: singleEnrollPda,
          learner: singleLearner.publicKey,
          learnerTokenAccount: singleLearnerTokenAccount,
          xpMint: xpMintKeypair.publicKey,
          backendSigner: authority.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();
      await provider.connection.confirmTransaction(clSig, "confirmed");

      // Finalize: creator gets reward since minCompletionsForReward=1
      // Need a dedicated creator ATA for this course's creator (reuse existing)
      const fsig = await program.methods
        .finalizeCourse()
        .accountsPartial({
          config: configPda,
          course: singleCoursePda,
          enrollment: singleEnrollPda,
          learner: singleLearner.publicKey,
          learnerTokenAccount: singleLearnerTokenAccount,
          creatorTokenAccount: creatorTokenAccount,
          creator: creator.publicKey,
          xpMint: xpMintKeypair.publicKey,
          backendSigner: authority.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();
      await provider.connection.confirmTransaction(fsig, "confirmed");

      const enrollment = await program.account.enrollment.fetch(
        singleEnrollPda
      );
      expect(enrollment.completedAt).to.not.be.null;

      const course = await program.account.course.fetch(singleCoursePda);
      expect(course.totalCompletions).to.equal(1);

      // Learner XP: 200 (lesson) + 100 (bonus = floor(200*1/2)) = 300
      const learnerAta = await getAccount(
        provider.connection,
        singleLearnerTokenAccount,
        "confirmed",
        TOKEN_2022_PROGRAM_ID
      );
      expect(Number(learnerAta.amount)).to.equal(200 + 100);
    });
  });

  // ===========================================================================
  // 15. Minter Roles
  // ===========================================================================
  describe("15. Minter Roles", () => {
    const MPL_CORE_PROGRAM_ID = new PublicKey(
      "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
    );

    const testMinter = Keypair.generate();
    let testMinterRolePda: PublicKey;
    const minterRecipient = Keypair.generate();
    let minterRecipientTokenAccount: PublicKey;

    before(async () => {
      [testMinterRolePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("minter"), testMinter.publicKey.toBuffer()],
        program.programId
      );

      for (const wallet of [
        testMinter.publicKey,
        minterRecipient.publicKey,
      ]) {
        const sig = await provider.connection.requestAirdrop(
          wallet,
          5 * LAMPORTS_PER_SOL
        );
        await provider.connection.confirmTransaction(sig, "confirmed");
      }

      // Create Token-2022 ATA for recipient
      minterRecipientTokenAccount = getAssociatedTokenAddressSync(
        xpMintKeypair.publicKey,
        minterRecipient.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const createAtaIx = createAssociatedTokenAccountInstruction(
        authority.publicKey,
        minterRecipientTokenAccount,
        minterRecipient.publicKey,
        xpMintKeypair.publicKey,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      const tx = new anchor.web3.Transaction().add(createAtaIx);
      await provider.sendAndConfirm(tx);
    });

    it("register_minter", async () => {
      await program.methods
        .registerMinter({
          minter: testMinter.publicKey,
          label: "test-minter",
          maxXpPerCall: new BN(1000),
        })
        .accountsPartial({
          config: configPda,
          minterRole: testMinterRolePda,
          authority: authority.publicKey,
          payer: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const role = await program.account.minterRole.fetch(testMinterRolePda);
      expect(role.minter.toBase58()).to.equal(
        testMinter.publicKey.toBase58()
      );
      expect(role.label).to.equal("test-minter");
      expect(role.maxXpPerCall.toNumber()).to.equal(1000);
      expect(role.totalXpMinted.toNumber()).to.equal(0);
      expect(role.isActive).to.equal(true);
    });

    it("reward_xp", async () => {
      const sig = await program.methods
        .rewardXp(new BN(500), "test reward")
        .accountsPartial({
          config: configPda,
          minterRole: testMinterRolePda,
          xpMint: xpMintKeypair.publicKey,
          recipientTokenAccount: minterRecipientTokenAccount,
          minter: testMinter.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([testMinter])
        .rpc();
      await provider.connection.confirmTransaction(sig, "confirmed");

      const ata = await getAccount(
        provider.connection,
        minterRecipientTokenAccount,
        "confirmed",
        TOKEN_2022_PROGRAM_ID
      );
      expect(Number(ata.amount)).to.equal(500);

      const role = await program.account.minterRole.fetch(testMinterRolePda);
      expect(role.totalXpMinted.toNumber()).to.equal(500);
    });

    it("reward_xp fails when exceeding max", async () => {
      try {
        await program.methods
          .rewardXp(new BN(1500), "too much")
          .accountsPartial({
            config: configPda,
            minterRole: testMinterRolePda,
            xpMint: xpMintKeypair.publicKey,
            recipientTokenAccount: minterRecipientTokenAccount,
            minter: testMinter.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .signers([testMinter])
          .rpc();
        expect.fail("Should have thrown");
      } catch (err) {
        const anchorErr = err as AnchorError;
        expect(anchorErr.error.errorCode.code).to.equal(
          "MinterAmountExceeded"
        );
      }
    });

    it("reward_xp with amount=0 fails", async () => {
      try {
        await program.methods
          .rewardXp(new BN(0), "zero amount")
          .accountsPartial({
            config: configPda,
            minterRole: testMinterRolePda,
            xpMint: xpMintKeypair.publicKey,
            recipientTokenAccount: minterRecipientTokenAccount,
            minter: testMinter.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .signers([testMinter])
          .rpc();
        expect.fail("Should have thrown");
      } catch (err) {
        const anchorErr = err as AnchorError;
        expect(anchorErr.error.errorCode.code).to.equal("InvalidAmount");
      }
    });

    it("revoke_minter", async () => {
      const balanceBefore = await provider.connection.getBalance(
        authority.publicKey
      );

      await program.methods
        .revokeMinter()
        .accountsPartial({
          config: configPda,
          minterRole: testMinterRolePda,
          authority: authority.publicKey,
        })
        .rpc();

      const info = await provider.connection.getAccountInfo(
        testMinterRolePda
      );
      expect(info).to.be.null;

      const balanceAfter = await provider.connection.getBalance(
        authority.publicKey
      );
      expect(balanceAfter).to.be.greaterThan(balanceBefore);
    });

    it("reward_xp fails with revoked minter", async () => {
      try {
        await program.methods
          .rewardXp(new BN(100), "after revoke")
          .accountsPartial({
            config: configPda,
            minterRole: testMinterRolePda,
            xpMint: xpMintKeypair.publicKey,
            recipientTokenAccount: minterRecipientTokenAccount,
            minter: testMinter.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .signers([testMinter])
          .rpc();
        expect.fail("Should have thrown");
      } catch (err) {
        // Account is closed, so this will fail with AccountNotInitialized
        // or similar deserialization error
        expect(err.toString()).to.contain("Error");
      }
    });
  });

  // ===========================================================================
  // 16. Achievement System
  // ===========================================================================
  describe("16. Achievement System", () => {
    const MPL_CORE_PROGRAM_ID = new PublicKey(
      "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
    );

    const achievementId = "first-course";
    let achievementTypePda: PublicKey;
    let achievementCollectionKeypair: Keypair;

    const achievementRecipient = Keypair.generate();
    let achievementRecipientTokenAccount: PublicKey;
    let achievementReceiptPda: PublicKey;

    before(async () => {
      [achievementTypePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("achievement"), Buffer.from(achievementId)],
        program.programId
      );

      [achievementReceiptPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("achievement_receipt"),
          Buffer.from(achievementId),
          achievementRecipient.publicKey.toBuffer(),
        ],
        program.programId
      );

      const sig = await provider.connection.requestAirdrop(
        achievementRecipient.publicKey,
        5 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(sig, "confirmed");

      // Create Token-2022 ATA for achievement recipient
      achievementRecipientTokenAccount = getAssociatedTokenAddressSync(
        xpMintKeypair.publicKey,
        achievementRecipient.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const createAtaIx = createAssociatedTokenAccountInstruction(
        authority.publicKey,
        achievementRecipientTokenAccount,
        achievementRecipient.publicKey,
        xpMintKeypair.publicKey,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      const tx = new anchor.web3.Transaction().add(createAtaIx);
      await provider.sendAndConfirm(tx);
    });

    it("create_achievement_type", async () => {
      achievementCollectionKeypair = Keypair.generate();

      await program.methods
        .createAchievementType({
          achievementId: achievementId,
          name: "First Course Completed",
          metadataUri: "https://arweave.net/test",
          maxSupply: 100,
          xpReward: 200,
        })
        .accountsPartial({
          config: configPda,
          achievementType: achievementTypePda,
          collection: achievementCollectionKeypair.publicKey,
          authority: authority.publicKey,
          payer: authority.publicKey,
          mplCoreProgram: MPL_CORE_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([achievementCollectionKeypair])
        .rpc();

      const achievement = await program.account.achievementType.fetch(
        achievementTypePda
      );
      expect(achievement.achievementId).to.equal(achievementId);
      expect(achievement.name).to.equal("First Course Completed");
      expect(achievement.metadataUri).to.equal("https://arweave.net/test");
      expect(achievement.collection.toBase58()).to.equal(
        achievementCollectionKeypair.publicKey.toBase58()
      );
      expect(achievement.creator.toBase58()).to.equal(
        authority.publicKey.toBase58()
      );
      expect(achievement.maxSupply).to.equal(100);
      expect(achievement.currentSupply).to.equal(0);
      expect(achievement.xpReward).to.equal(200);
      expect(achievement.isActive).to.equal(true);
      expect(achievement.createdAt.toNumber()).to.be.greaterThan(0);
    });

    it("create_achievement_type with xp_reward=0 fails", async () => {
      const badAchId = "zero-xp-ach";
      const [badAchPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("achievement"), Buffer.from(badAchId)],
        program.programId
      );
      const badCollectionKeypair = Keypair.generate();

      try {
        await program.methods
          .createAchievementType({
            achievementId: badAchId,
            name: "Zero XP Achievement",
            metadataUri: "https://arweave.net/zero-xp",
            maxSupply: 100,
            xpReward: 0,
          })
          .accountsPartial({
            config: configPda,
            achievementType: badAchPda,
            collection: badCollectionKeypair.publicKey,
            authority: authority.publicKey,
            payer: authority.publicKey,
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([badCollectionKeypair])
          .rpc();
        expect.fail("Should have thrown");
      } catch (err) {
        const anchorErr = err as AnchorError;
        expect(anchorErr.error.errorCode.code).to.equal("InvalidXpReward");
      }
    });

    it("award_achievement", async () => {
      const assetKeypair = Keypair.generate();

      // Use the backend minter role (auto-registered during initialize)
      const [backendMinterRole] = PublicKey.findProgramAddressSync(
        [Buffer.from("minter"), authority.publicKey.toBuffer()],
        program.programId
      );

      const sig = await program.methods
        .awardAchievement()
        .accountsPartial({
          config: configPda,
          achievementType: achievementTypePda,
          achievementReceipt: achievementReceiptPda,
          minterRole: backendMinterRole,
          asset: assetKeypair.publicKey,
          collection: achievementCollectionKeypair.publicKey,
          recipient: achievementRecipient.publicKey,
          recipientTokenAccount: achievementRecipientTokenAccount,
          xpMint: xpMintKeypair.publicKey,
          payer: authority.publicKey,
          minter: authority.publicKey,
          mplCoreProgram: MPL_CORE_PROGRAM_ID,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([assetKeypair])
        .rpc();
      await provider.connection.confirmTransaction(sig, "confirmed");

      // Verify AchievementReceipt created
      const receipt = await program.account.achievementReceipt.fetch(
        achievementReceiptPda
      );
      expect(receipt.asset.toBase58()).to.equal(
        assetKeypair.publicKey.toBase58()
      );
      expect(receipt.awardedAt.toNumber()).to.be.greaterThan(0);

      // Verify NFT exists and is soulbound via UMI
      const umi = createUmi(provider.connection.rpcEndpoint, {
        commitment: "confirmed",
      }).use(mplCore());
      const asset = await fetchAssetV1(
        umi,
        fromWeb3JsPublicKey(assetKeypair.publicKey)
      );
      expect(asset.name).to.equal("First Course Completed");
      expect(asset.uri).to.equal("https://arweave.net/test");
      expect(asset.owner.toString()).to.equal(
        fromWeb3JsPublicKey(achievementRecipient.publicKey).toString()
      );
      expect(asset.permanentFreezeDelegate).to.exist;
      expect(asset.permanentFreezeDelegate.frozen).to.equal(true);

      // Verify attributes
      expect(asset.attributes).to.exist;
      const attrList = asset.attributes.attributeList;
      const achIdAttr = attrList.find((a) => a.key === "achievement_id");
      const supplyAttr = attrList.find((a) => a.key === "supply_number");
      expect(achIdAttr.value).to.equal(achievementId);
      expect(supplyAttr.value).to.equal("1");

      // Verify XP was minted (200 from xp_reward)
      const ata = await getAccount(
        provider.connection,
        achievementRecipientTokenAccount,
        "confirmed",
        TOKEN_2022_PROGRAM_ID
      );
      expect(Number(ata.amount)).to.equal(200);

      // Verify achievement_type.current_supply incremented
      const achievement = await program.account.achievementType.fetch(
        achievementTypePda
      );
      expect(achievement.currentSupply).to.equal(1);
    });

    it("award_achievement double-award fails", async () => {
      const secondAssetKeypair = Keypair.generate();
      const [backendMinterRole] = PublicKey.findProgramAddressSync(
        [Buffer.from("minter"), authority.publicKey.toBuffer()],
        program.programId
      );

      try {
        await program.methods
          .awardAchievement()
          .accountsPartial({
            config: configPda,
            achievementType: achievementTypePda,
            achievementReceipt: achievementReceiptPda,
            minterRole: backendMinterRole,
            asset: secondAssetKeypair.publicKey,
            collection: achievementCollectionKeypair.publicKey,
            recipient: achievementRecipient.publicKey,
            recipientTokenAccount: achievementRecipientTokenAccount,
            xpMint: xpMintKeypair.publicKey,
            payer: authority.publicKey,
            minter: authority.publicKey,
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([secondAssetKeypair])
          .rpc();
        expect.fail("Should have thrown");
      } catch (err) {
        // PDA init collision: achievement_receipt already exists
        expect(err.toString()).to.contain("Error");
      }
    });

    it("deactivate_achievement_type", async () => {
      await program.methods
        .deactivateAchievementType()
        .accountsPartial({
          config: configPda,
          achievementType: achievementTypePda,
          authority: authority.publicKey,
        })
        .rpc();

      const achievement = await program.account.achievementType.fetch(
        achievementTypePda
      );
      expect(achievement.isActive).to.equal(false);
    });

    it("award_achievement fails when deactivated", async () => {
      const anotherRecipient = Keypair.generate();
      const airdropSig = await provider.connection.requestAirdrop(
        anotherRecipient.publicKey,
        2 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(airdropSig, "confirmed");

      const anotherRecipientAta = getAssociatedTokenAddressSync(
        xpMintKeypair.publicKey,
        anotherRecipient.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const createAtaIx = createAssociatedTokenAccountInstruction(
        authority.publicKey,
        anotherRecipientAta,
        anotherRecipient.publicKey,
        xpMintKeypair.publicKey,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      const ataTx = new anchor.web3.Transaction().add(createAtaIx);
      await provider.sendAndConfirm(ataTx);

      const [anotherReceiptPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("achievement_receipt"),
          Buffer.from(achievementId),
          anotherRecipient.publicKey.toBuffer(),
        ],
        program.programId
      );

      const [backendMinterRole] = PublicKey.findProgramAddressSync(
        [Buffer.from("minter"), authority.publicKey.toBuffer()],
        program.programId
      );

      const anotherAsset = Keypair.generate();

      try {
        await program.methods
          .awardAchievement()
          .accountsPartial({
            config: configPda,
            achievementType: achievementTypePda,
            achievementReceipt: anotherReceiptPda,
            minterRole: backendMinterRole,
            asset: anotherAsset.publicKey,
            collection: achievementCollectionKeypair.publicKey,
            recipient: anotherRecipient.publicKey,
            recipientTokenAccount: anotherRecipientAta,
            xpMint: xpMintKeypair.publicKey,
            payer: authority.publicKey,
            minter: authority.publicKey,
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([anotherAsset])
          .rpc();
        expect.fail("Should have thrown");
      } catch (err) {
        const anchorErr = err as AnchorError;
        expect(anchorErr.error.errorCode.code).to.equal(
          "AchievementNotActive"
        );
      }
    });

    it("achievement supply exhaustion (maxSupply=1)", async () => {
      const limitedAchId = "limited-ach";
      const [limitedAchPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("achievement"), Buffer.from(limitedAchId)],
        program.programId
      );
      const limitedCollectionKeypair = Keypair.generate();

      // Create achievement type with maxSupply=1
      await program.methods
        .createAchievementType({
          achievementId: limitedAchId,
          name: "Limited Achievement",
          metadataUri: "https://arweave.net/limited",
          maxSupply: 1,
          xpReward: 50,
        })
        .accountsPartial({
          config: configPda,
          achievementType: limitedAchPda,
          collection: limitedCollectionKeypair.publicKey,
          authority: authority.publicKey,
          payer: authority.publicKey,
          mplCoreProgram: MPL_CORE_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([limitedCollectionKeypair])
        .rpc();

      const [backendMinterRole] = PublicKey.findProgramAddressSync(
        [Buffer.from("minter"), authority.publicKey.toBuffer()],
        program.programId
      );

      // First award succeeds
      const firstRecipient = Keypair.generate();
      const airdropSig1 = await provider.connection.requestAirdrop(
        firstRecipient.publicKey,
        2 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(airdropSig1, "confirmed");

      const firstRecipientAta = getAssociatedTokenAddressSync(
        xpMintKeypair.publicKey,
        firstRecipient.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      const createAta1Ix = createAssociatedTokenAccountInstruction(
        authority.publicKey,
        firstRecipientAta,
        firstRecipient.publicKey,
        xpMintKeypair.publicKey,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      await provider.sendAndConfirm(new anchor.web3.Transaction().add(createAta1Ix));

      const [firstReceiptPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("achievement_receipt"),
          Buffer.from(limitedAchId),
          firstRecipient.publicKey.toBuffer(),
        ],
        program.programId
      );
      const firstAsset = Keypair.generate();

      const sig = await program.methods
        .awardAchievement()
        .accountsPartial({
          config: configPda,
          achievementType: limitedAchPda,
          achievementReceipt: firstReceiptPda,
          minterRole: backendMinterRole,
          asset: firstAsset.publicKey,
          collection: limitedCollectionKeypair.publicKey,
          recipient: firstRecipient.publicKey,
          recipientTokenAccount: firstRecipientAta,
          xpMint: xpMintKeypair.publicKey,
          payer: authority.publicKey,
          minter: authority.publicKey,
          mplCoreProgram: MPL_CORE_PROGRAM_ID,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([firstAsset])
        .rpc();
      await provider.connection.confirmTransaction(sig, "confirmed");

      const achievement = await program.account.achievementType.fetch(limitedAchPda);
      expect(achievement.currentSupply).to.equal(1);

      // Second award to different recipient fails with supply exhausted
      const secondRecipient = Keypair.generate();
      const airdropSig2 = await provider.connection.requestAirdrop(
        secondRecipient.publicKey,
        2 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(airdropSig2, "confirmed");

      const secondRecipientAta = getAssociatedTokenAddressSync(
        xpMintKeypair.publicKey,
        secondRecipient.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      const createAta2Ix = createAssociatedTokenAccountInstruction(
        authority.publicKey,
        secondRecipientAta,
        secondRecipient.publicKey,
        xpMintKeypair.publicKey,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      await provider.sendAndConfirm(new anchor.web3.Transaction().add(createAta2Ix));

      const [secondReceiptPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("achievement_receipt"),
          Buffer.from(limitedAchId),
          secondRecipient.publicKey.toBuffer(),
        ],
        program.programId
      );
      const secondAsset = Keypair.generate();

      try {
        await program.methods
          .awardAchievement()
          .accountsPartial({
            config: configPda,
            achievementType: limitedAchPda,
            achievementReceipt: secondReceiptPda,
            minterRole: backendMinterRole,
            asset: secondAsset.publicKey,
            collection: limitedCollectionKeypair.publicKey,
            recipient: secondRecipient.publicKey,
            recipientTokenAccount: secondRecipientAta,
            xpMint: xpMintKeypair.publicKey,
            payer: authority.publicKey,
            minter: authority.publicKey,
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([secondAsset])
          .rpc();
        expect.fail("Should have thrown");
      } catch (err) {
        const anchorErr = err as AnchorError;
        expect(anchorErr.error.errorCode.code).to.equal(
          "AchievementSupplyExhausted"
        );
      }
    });
  });

  // ===========================================================================
  // 17. Bitmap boundary lessons
  // ===========================================================================
  describe("17. Bitmap boundary lessons", () => {
    const bitmapCourseId = "bitmap-boundary";
    let bitmapCoursePda: PublicKey;
    const bitmapLearner = Keypair.generate();
    let bitmapLearnerTokenAccount: PublicKey;
    let bitmapEnrollPda: PublicKey;

    before(async () => {
      const sig = await provider.connection.requestAirdrop(
        bitmapLearner.publicKey,
        5 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(sig, "confirmed");

      [bitmapCoursePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("course"), Buffer.from(bitmapCourseId)],
        program.programId
      );

      // Create course with 65 lessons (crosses u64 word boundary at index 64)
      await program.methods
        .createCourse({
          courseId: bitmapCourseId,
          creator: creator.publicKey,
          contentTxId: contentTxId,
          lessonCount: 65,
          difficulty: 1,
          xpPerLesson: 10,
          trackId: 40,
          trackLevel: 1,
          prerequisite: null,
          creatorRewardXp: 0,
          minCompletionsForReward: 0,
        })
        .accountsPartial({
          course: bitmapCoursePda,
          config: configPda,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      bitmapLearnerTokenAccount = getAssociatedTokenAddressSync(
        xpMintKeypair.publicKey,
        bitmapLearner.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const createAtaIx = createAssociatedTokenAccountInstruction(
        authority.publicKey,
        bitmapLearnerTokenAccount,
        bitmapLearner.publicKey,
        xpMintKeypair.publicKey,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      await provider.sendAndConfirm(new anchor.web3.Transaction().add(createAtaIx));

      [bitmapEnrollPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("enrollment"),
          Buffer.from(bitmapCourseId),
          bitmapLearner.publicKey.toBuffer(),
        ],
        program.programId
      );

      await program.methods
        .enroll(bitmapCourseId)
        .accountsPartial({
          course: bitmapCoursePda,
          enrollment: bitmapEnrollPda,
          learner: bitmapLearner.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([bitmapLearner])
        .rpc();
    });

    it("completes lessons at bitmap word boundary (indices 63 and 64)", async () => {
      // Lesson 63 = last bit of first u64 word (word_index=0, bit_index=63)
      const sig63 = await program.methods
        .completeLesson(63)
        .accountsPartial({
          config: configPda,
          course: bitmapCoursePda,
          enrollment: bitmapEnrollPda,
          learner: bitmapLearner.publicKey,
          learnerTokenAccount: bitmapLearnerTokenAccount,
          xpMint: xpMintKeypair.publicKey,
          backendSigner: authority.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();
      await provider.connection.confirmTransaction(sig63, "confirmed");

      let enrollment = await program.account.enrollment.fetch(bitmapEnrollPda);
      // Bit 63 of word 0 should be set: 1 << 63 = 0x8000000000000000
      const bit63 = new BN("8000000000000000", 16);
      expect(enrollment.lessonFlags[0].eq(bit63)).to.be.true;

      // Lesson 64 = first bit of second u64 word (word_index=1, bit_index=0)
      const sig64 = await program.methods
        .completeLesson(64)
        .accountsPartial({
          config: configPda,
          course: bitmapCoursePda,
          enrollment: bitmapEnrollPda,
          learner: bitmapLearner.publicKey,
          learnerTokenAccount: bitmapLearnerTokenAccount,
          xpMint: xpMintKeypair.publicKey,
          backendSigner: authority.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();
      await provider.connection.confirmTransaction(sig64, "confirmed");

      enrollment = await program.account.enrollment.fetch(bitmapEnrollPda);
      // Bit 0 of word 1 should be set: 1 << 0 = 1
      expect(enrollment.lessonFlags[1].toNumber() & 1).to.equal(1);

      // Verify XP minted for both lessons
      const ata = await getAccount(
        provider.connection,
        bitmapLearnerTokenAccount,
        "confirmed",
        TOKEN_2022_PROGRAM_ID
      );
      expect(Number(ata.amount)).to.equal(10 * 2);
    });
  });

  // ===========================================================================
  // 18. Re-enrollment after close
  // ===========================================================================
  describe("18. Re-enrollment after close", () => {
    const reEnrollCourseId = "re-enroll-course";
    let reEnrollCoursePda: PublicKey;
    const reEnrollLearner = Keypair.generate();
    let reEnrollLearnerTokenAccount: PublicKey;
    let reEnrollEnrollPda: PublicKey;

    before(async () => {
      const sig = await provider.connection.requestAirdrop(
        reEnrollLearner.publicKey,
        5 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(sig, "confirmed");

      [reEnrollCoursePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("course"), Buffer.from(reEnrollCourseId)],
        program.programId
      );

      await program.methods
        .createCourse({
          courseId: reEnrollCourseId,
          creator: creator.publicKey,
          contentTxId: contentTxId,
          lessonCount: 1,
          difficulty: 1,
          xpPerLesson: 10,
          trackId: 41,
          trackLevel: 1,
          prerequisite: null,
          creatorRewardXp: 0,
          minCompletionsForReward: 0,
        })
        .accountsPartial({
          course: reEnrollCoursePda,
          config: configPda,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      reEnrollLearnerTokenAccount = getAssociatedTokenAddressSync(
        xpMintKeypair.publicKey,
        reEnrollLearner.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const createAtaIx = createAssociatedTokenAccountInstruction(
        authority.publicKey,
        reEnrollLearnerTokenAccount,
        reEnrollLearner.publicKey,
        xpMintKeypair.publicKey,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      await provider.sendAndConfirm(new anchor.web3.Transaction().add(createAtaIx));

      [reEnrollEnrollPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("enrollment"),
          Buffer.from(reEnrollCourseId),
          reEnrollLearner.publicKey.toBuffer(),
        ],
        program.programId
      );

      // Enroll, complete, finalize, close
      await program.methods
        .enroll(reEnrollCourseId)
        .accountsPartial({
          course: reEnrollCoursePda,
          enrollment: reEnrollEnrollPda,
          learner: reEnrollLearner.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([reEnrollLearner])
        .rpc();

      const clSig = await program.methods
        .completeLesson(0)
        .accountsPartial({
          config: configPda,
          course: reEnrollCoursePda,
          enrollment: reEnrollEnrollPda,
          learner: reEnrollLearner.publicKey,
          learnerTokenAccount: reEnrollLearnerTokenAccount,
          xpMint: xpMintKeypair.publicKey,
          backendSigner: authority.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();
      await provider.connection.confirmTransaction(clSig, "confirmed");

      await program.methods
        .finalizeCourse()
        .accountsPartial({
          config: configPda,
          course: reEnrollCoursePda,
          enrollment: reEnrollEnrollPda,
          learner: reEnrollLearner.publicKey,
          learnerTokenAccount: reEnrollLearnerTokenAccount,
          creatorTokenAccount: creatorTokenAccount,
          creator: creator.publicKey,
          xpMint: xpMintKeypair.publicKey,
          backendSigner: authority.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();

      // Close completed enrollment
      await program.methods
        .closeEnrollment()
        .accountsPartial({
          course: reEnrollCoursePda,
          enrollment: reEnrollEnrollPda,
          learner: reEnrollLearner.publicKey,
        })
        .signers([reEnrollLearner])
        .rpc();

      // Verify closed
      const closedInfo = await provider.connection.getAccountInfo(reEnrollEnrollPda);
      expect(closedInfo).to.be.null;
    });

    it("re-enrollment after close_enrollment succeeds", async () => {
      await program.methods
        .enroll(reEnrollCourseId)
        .accountsPartial({
          course: reEnrollCoursePda,
          enrollment: reEnrollEnrollPda,
          learner: reEnrollLearner.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([reEnrollLearner])
        .rpc();

      const enrollment = await program.account.enrollment.fetch(reEnrollEnrollPda);
      expect(enrollment.course.toBase58()).to.equal(reEnrollCoursePda.toBase58());
      expect(enrollment.completedAt).to.be.null;
      // Lesson flags should be reset to zero
      for (const word of enrollment.lessonFlags) {
        expect(word.toNumber()).to.equal(0);
      }
    });
  });

  // ===========================================================================
  // 19. update_config deactivates old MinterRole
  // ===========================================================================
  describe("19. update_config deactivates old MinterRole", () => {
    const rotationMinter = Keypair.generate();
    let rotationMinterRolePda: PublicKey;

    before(async () => {
      const sig = await provider.connection.requestAirdrop(
        rotationMinter.publicKey,
        2 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(sig, "confirmed");

      [rotationMinterRolePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("minter"), authority.publicKey.toBuffer()],
        program.programId
      );
    });

    it("backend_signer rotation deactivates old MinterRole via remaining_accounts", async () => {
      // Verify old minter role is active before rotation
      const roleBefore = await program.account.minterRole.fetch(rotationMinterRolePda);
      expect(roleBefore.isActive).to.equal(true);

      const newSigner = Keypair.generate();

      // Rotate backend signer, passing old MinterRole PDA as remaining account
      await program.methods
        .updateConfig({
          newBackendSigner: newSigner.publicKey,
        })
        .accountsPartial({
          config: configPda,
          authority: authority.publicKey,
        })
        .remainingAccounts([
          {
            pubkey: rotationMinterRolePda,
            isWritable: true,
            isSigner: false,
          },
        ])
        .rpc();

      // Verify old MinterRole is deactivated
      const roleAfter = await program.account.minterRole.fetch(rotationMinterRolePda);
      expect(roleAfter.isActive).to.equal(false);

      // Verify config was updated
      const config = await program.account.config.fetch(configPda);
      expect(config.backendSigner.toBase58()).to.equal(
        newSigner.publicKey.toBase58()
      );

      // Restore backend signer to authority for subsequent tests
      await program.methods
        .updateConfig({
          newBackendSigner: authority.publicKey,
        })
        .accountsPartial({
          config: configPda,
          authority: authority.publicKey,
        })
        .rpc();

      // Re-activate the minter role manually by registering it again
      // The old role PDA still exists but is deactivated; we need it active
      // for other tests that might run after this.
      // Since it's still allocated, we can't re-init it. Just confirm it's deactivated.
      const roleFinal = await program.account.minterRole.fetch(rotationMinterRolePda);
      expect(roleFinal.isActive).to.equal(false);
    });
  });
});

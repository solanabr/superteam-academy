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

describe("superteam-academy", () => {
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
  const COMPLETION_BONUS_XP = 500;
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
      await program.methods
        .initialize()
        .accountsPartial({
          config: configPda,
          xpMint: xpMintKeypair.publicKey,
          authority: authority.publicKey,
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
    });

    it("double initialize fails", async () => {
      const secondMint = Keypair.generate();

      try {
        await program.methods
          .initialize()
          .accountsPartial({
            config: configPda,
            xpMint: secondMint.publicKey,
            authority: authority.publicKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .signers([secondMint])
          .rpc();
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).to.exist;
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
          completionBonusXp: COMPLETION_BONUS_XP,
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
      expect(course.authority.toBase58()).to.equal(
        authority.publicKey.toBase58()
      );
      expect(course.version).to.equal(1);
      expect(course.lessonCount).to.equal(LESSON_COUNT);
      expect(course.difficulty).to.equal(2);
      expect(course.xpPerLesson).to.equal(XP_PER_LESSON);
      expect(course.trackId).to.equal(1);
      expect(course.trackLevel).to.equal(1);
      expect(course.prerequisite).to.be.null;
      expect(course.completionBonusXp).to.equal(COMPLETION_BONUS_XP);
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
            completionBonusXp: 10,
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
          expect(err).to.exist;
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
            completionBonusXp: 10,
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
          expect(err).to.exist;
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
            completionBonusXp: 10,
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
          expect(err).to.exist;
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
            completionBonusXp: 10,
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
          expect(err).to.exist;
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
            completionBonusXp: 10,
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
          expect(err).to.exist;
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
          completionBonusXp: 0,
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
            completionBonusXp: 10,
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
          newAuthority: null,
          newXpPerLesson: null,
          newCompletionBonusXp: null,
          newCreatorRewardXp: null,
          newMinCompletionsForReward: null,
        })
        .accountsPartial({
          course: coursePda,
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
          newAuthority: null,
          newXpPerLesson: null,
          newCompletionBonusXp: null,
          newCreatorRewardXp: null,
          newMinCompletionsForReward: null,
        })
        .accountsPartial({
          course: coursePda,
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
          newAuthority: null,
          newXpPerLesson: null,
          newCompletionBonusXp: null,
          newCreatorRewardXp: null,
          newMinCompletionsForReward: null,
        })
        .accountsPartial({
          course: coursePda,
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
          newAuthority: null,
          newXpPerLesson: 200,
          newCompletionBonusXp: 999,
          newCreatorRewardXp: 50,
          newMinCompletionsForReward: 5,
        })
        .accountsPartial({
          course: diffPda,
          authority: authority.publicKey,
        })
        .rpc();

      const course = await program.account.course.fetch(diffPda);
      expect(course.xpPerLesson).to.equal(200);
      expect(course.completionBonusXp).to.equal(999);
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
            newAuthority: null,
            newXpPerLesson: null,
            newCompletionBonusXp: null,
            newCreatorRewardXp: null,
            newMinCompletionsForReward: null,
          })
          .accountsPartial({
            course: coursePda,
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
          newAuthority: null,
          newXpPerLesson: null,
          newCompletionBonusXp: null,
          newCreatorRewardXp: null,
          newMinCompletionsForReward: null,
        })
        .accountsPartial({
          course: coursePda,
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
          expect(err).to.exist;
        }
      }

      // Re-activate for subsequent tests
      await program.methods
        .updateCourse({
          newContentTxId: null,
          newIsActive: true,
          newAuthority: null,
          newXpPerLesson: null,
          newCompletionBonusXp: null,
          newCreatorRewardXp: null,
          newMinCompletionsForReward: null,
        })
        .accountsPartial({
          course: coursePda,
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
          expect(err).to.exist;
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
          expect(err).to.exist;
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

      // Learner XP: 3*100 (lessons) + 500 (bonus) = 800
      const learnerAta = await getAccount(
        provider.connection,
        learnerTokenAccount,
        "confirmed",
        TOKEN_2022_PROGRAM_ID
      );
      expect(Number(learnerAta.amount)).to.equal(
        XP_PER_LESSON * LESSON_COUNT + COMPLETION_BONUS_XP
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
          expect(err).to.exist;
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
          completionBonusXp: 100,
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
          expect(err).to.exist;
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
          completionBonusXp: 100,
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
          expect(err).to.exist;
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

      // Learner2 XP: 300 (lessons) + 500 (bonus) = 800
      const l2ata = await getAccount(
        provider.connection,
        learner2TokenAccount,
        "confirmed",
        TOKEN_2022_PROGRAM_ID
      );
      expect(Number(l2ata.amount)).to.equal(
        XP_PER_LESSON * LESSON_COUNT + COMPLETION_BONUS_XP
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
          completionBonusXp: 0,
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
          expect(err.error.errorCode.code).to.equal(
            "EnrollmentCourseMismatch"
          );
        } else {
          expect(err).to.exist;
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
          expect(err.error.errorCode.code).to.equal(
            "EnrollmentCourseMismatch"
          );
        } else {
          expect(err).to.exist;
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
          completionBonusXp: 25,
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
          completionBonusXp: 100,
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
          expect(err).to.exist;
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
          expect(err).to.exist;
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
  // Phase 6: Credentials (Metaplex Core -- skipped on localnet)
  // ===========================================================================
  describe("Phase 6: Credentials", () => {
    // TODO: issue_credential tests require Metaplex Core program on localnet.
    // To test:
    //   1. Clone mpl-core from mainnet: solana program dump CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d mpl_core.so
    //   2. Add to Anchor.toml [test.validator]:
    //      [[test.validator.clone]]
    //      address = "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
    //   3. OR use surfpool with mainnet state cloning
    //
    // The flow would be:
    //   - Enroll + complete + finalize a course
    //   - Create a track collection via Metaplex Core
    //   - Call issue_credential with credential_name + metadata_uri
    //   - Verify enrollment.credential_asset is set
    //   - Call issue_credential again to test upgrade path
    //   - Verify credential_asset_mismatch error with wrong asset
    it.skip("issue_credential (requires Metaplex Core on localnet)", () => {});
  });
});

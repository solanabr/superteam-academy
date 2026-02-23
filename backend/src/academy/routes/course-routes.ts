import type { Hono } from "hono";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { getCoursePda, getEnrollmentPda } from "@/pdas.js";
import { badRequest, withRouteErrorHandling } from "@/lib/errors.js";
import {
  readFixedLengthNumberArrayOrNull,
  readJsonObject,
  readNullableBoolean,
  readNullableNumber,
  readOptionalNumber,
  readOptionalPublicKey,
  readOptionalString,
  readRequiredPublicKey,
} from "@/lib/validation.js";
import {
  ensureToken2022Ata,
  fetchConfig,
  fetchCourseOrThrow,
  requireAuthorityProgram,
  requireBackendProgram,
  requireProviderPublicKey,
} from "@/academy/shared.js";

type CreateCourseMethods = {
  createCourse: (params: {
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
    accountsPartial: (accounts: Record<string, PublicKey>) => {
      rpc: () => Promise<string>;
    };
  };
};

type CompleteLessonMethods = {
  completeLesson: (lessonIndex: number) => {
    accountsPartial: (accounts: Record<string, PublicKey>) => {
      rpc: () => Promise<string>;
    };
  };
};

type FinalizeCourseMethods = {
  finalizeCourse: () => {
    accountsPartial: (accounts: Record<string, PublicKey>) => {
      rpc: () => Promise<string>;
    };
  };
};

type UpdateCourseMethods = {
  updateCourse: (params: {
    newContentTxId: number[] | null;
    newIsActive: boolean | null;
    newXpPerLesson: number | null;
    newCreatorRewardXp: number | null;
    newMinCompletionsForReward: number | null;
  }) => {
    accountsPartial: (accounts: Record<string, PublicKey>) => {
      rpc: () => Promise<string>;
    };
  };
};

export function registerCourseRoutes(app: Hono): void {
  app.post(
    "/create-course",
    withRouteErrorHandling(async (c) => {
      const program = requireAuthorityProgram();
      const authority = requireProviderPublicKey(program);
      const body = await readJsonObject(c);

      const courseId = readOptionalString(body, "courseId", "test-course-1");
      const lessonCount = readOptionalNumber(body, "lessonCount", {
        defaultValue: 3,
        integer: true,
        min: 1,
      });
      const xpPerLesson = readOptionalNumber(body, "xpPerLesson", {
        defaultValue: 100,
        integer: true,
        min: 0,
      });

      if (!courseId || lessonCount === undefined || xpPerLesson === undefined) {
        throw badRequest("courseId, lessonCount and xpPerLesson are required");
      }

      const creator =
        readOptionalPublicKey(body, "creator", authority) ?? authority;

      const { configPda } = await fetchConfig(program);
      const coursePda = getCoursePda(courseId, program.programId);

      const methods = program.methods as unknown as CreateCourseMethods;
      const tx = await methods
        .createCourse({
          courseId,
          creator,
          contentTxId: new Array<number>(32).fill(0),
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
          authority,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return c.json({ tx });
    })
  );

  app.post(
    "/complete-lesson",
    withRouteErrorHandling(async (c) => {
      const program = requireBackendProgram();
      const backendSigner = requireProviderPublicKey(program);
      const body = await readJsonObject(c);

      const courseId = readOptionalString(body, "courseId", "test-course-1");
      const learner = readRequiredPublicKey(body, "learner");
      const lessonIndex = readOptionalNumber(body, "lessonIndex", {
        defaultValue: 0,
        integer: true,
        min: 0,
      });

      if (!courseId || lessonIndex === undefined) {
        throw badRequest("courseId and lessonIndex are required");
      }

      const { configPda, config } = await fetchConfig(program);
      const { coursePda } = await fetchCourseOrThrow(
        program,
        courseId,
        `Course "${courseId}" not found. Create it first via POST /v1/academy/create-course.`
      );

      const enrollmentPda = getEnrollmentPda(courseId, learner, program.programId);
      const learnerTokenAccount = await ensureToken2022Ata(
        program,
        config.xpMint,
        learner
      );

      const methods = program.methods as unknown as CompleteLessonMethods;
      const tx = await methods
        .completeLesson(lessonIndex)
        .accountsPartial({
          config: configPda,
          course: coursePda,
          enrollment: enrollmentPda,
          learner,
          learnerTokenAccount,
          xpMint: config.xpMint,
          backendSigner,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();

      return c.json({ tx });
    })
  );

  app.post(
    "/finalize-course",
    withRouteErrorHandling(async (c) => {
      const program = requireBackendProgram();
      const backendSigner = requireProviderPublicKey(program);
      const body = await readJsonObject(c);

      const courseId = readOptionalString(body, "courseId", "test-course-1");
      const learner = readRequiredPublicKey(body, "learner");

      if (!courseId) {
        throw badRequest("courseId is required");
      }

      const { configPda, config } = await fetchConfig(program);
      const { coursePda, course } = await fetchCourseOrThrow(
        program,
        courseId,
        `Course "${courseId}" not found. Create it first via POST /v1/academy/create-course.`
      );

      const enrollmentPda = getEnrollmentPda(courseId, learner, program.programId);
      const learnerTokenAccount = await ensureToken2022Ata(
        program,
        config.xpMint,
        learner
      );
      const creatorTokenAccount = await ensureToken2022Ata(
        program,
        config.xpMint,
        course.creator
      );

      const methods = program.methods as unknown as FinalizeCourseMethods;
      const tx = await methods
        .finalizeCourse()
        .accountsPartial({
          config: configPda,
          course: coursePda,
          enrollment: enrollmentPda,
          learner,
          learnerTokenAccount,
          creatorTokenAccount,
          creator: course.creator,
          xpMint: config.xpMint,
          backendSigner,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();

      return c.json({ tx });
    })
  );

  app.post(
    "/update-course",
    withRouteErrorHandling(async (c) => {
      const program = requireAuthorityProgram();
      const authority = requireProviderPublicKey(program);
      const body = await readJsonObject(c);

      const courseId = readOptionalString(body, "courseId", "test-course-1");
      if (!courseId) {
        throw badRequest("courseId is required");
      }

      const newContentTxId = readFixedLengthNumberArrayOrNull(
        body,
        "newContentTxId",
        32
      );
      const newIsActive = readNullableBoolean(body, "newIsActive");
      const newXpPerLesson = readNullableNumber(body, "newXpPerLesson", {
        integer: true,
        min: 0,
      });
      const newCreatorRewardXp = readNullableNumber(
        body,
        "newCreatorRewardXp",
        {
          integer: true,
          min: 0,
        }
      );
      const newMinCompletionsForReward = readNullableNumber(
        body,
        "newMinCompletionsForReward",
        {
          integer: true,
          min: 0,
        }
      );

      const { configPda } = await fetchConfig(program);
      const coursePda = getCoursePda(courseId, program.programId);

      const methods = program.methods as unknown as UpdateCourseMethods;
      const tx = await methods
        .updateCourse({
          newContentTxId,
          newIsActive,
          newXpPerLesson,
          newCreatorRewardXp,
          newMinCompletionsForReward,
        })
        .accountsPartial({
          config: configPda,
          course: coursePda,
          authority,
        })
        .rpc();

      return c.json({ tx });
    })
  );
}

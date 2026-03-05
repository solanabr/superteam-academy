import { apiFetch } from "@/lib/api-client";
import type { ChallengeExecutionResult } from "@/types/domain";
import type {
  ChallengeExecutionService,
  ChallengeRunInput,
} from "./interfaces";

class BackendChallengeExecutionService implements ChallengeExecutionService {
  async runChallenge(
    input: ChallengeRunInput,
    token?: string,
  ): Promise<ChallengeExecutionResult> {
    return apiFetch<ChallengeExecutionResult>(
      `/challenges/${input.challengeId}/run`,
      {
        method: "POST",
        body: JSON.stringify({
          courseId: input.courseId,
          lessonId: input.lessonId,
          code: input.code,
          language: input.language,
        }),
        ...(token ? { token } : {}),
      },
    );
  }
}

export const challengeExecutionService: ChallengeExecutionService =
  new BackendChallengeExecutionService();

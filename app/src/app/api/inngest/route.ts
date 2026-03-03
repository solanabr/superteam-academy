import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
    handleGraduation,
    confirmEnrollment,
    confirmLessonCompletion,
    confirmCourseCreation,
    confirmUnenrollment,
    handleAchievementClaim,
    handleQuizCompletion
} from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        handleGraduation,
        confirmEnrollment,
        confirmLessonCompletion,
        confirmCourseCreation,
        confirmUnenrollment,
        handleAchievementClaim,
        handleQuizCompletion
    ],
});

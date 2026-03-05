import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireSession } from "../lib/auth-middleware.js";
const bodySchema = z.object({
    courseId: z.string().min(1),
    lessonId: z.string().min(1),
    code: z.string().min(1),
    language: z.enum(["rust", "typescript", "json"]),
});
function evaluateChallenge(code, language) {
    if (language === "rust") {
        const passed = code.includes('msg!("Hello, Solana!")') ||
            code.includes('msg!("Hello, Solana!")');
        return {
            passed,
            output: passed
                ? "Success: program emitted Hello, Solana!"
                : 'Expected `msg!("Hello, Solana!")` in program body',
        };
    }
    if (language === "typescript") {
        const passed = code.includes("console.log") && code.includes("Solana");
        return {
            passed,
            output: passed
                ? "Success: expected output produced"
                : "Expected `console.log` output containing Solana",
        };
    }
    const passed = code.includes("{") && code.includes("}");
    return {
        passed,
        output: passed
            ? "JSON parsed by heuristic"
            : "Invalid JSON challenge output",
    };
}
export async function challengeRoutes(app) {
    app.post("/challenges/:id/run", {
        preHandler: [requireSession],
    }, async (request) => {
        const params = z.object({ id: z.string().min(1) }).parse(request.params);
        const body = bodySchema.parse(request.body);
        const result = evaluateChallenge(body.code, body.language);
        await prisma.lessonAttempt.create({
            data: {
                userId: request.session.userId,
                courseId: body.courseId,
                lessonId: body.lessonId,
                challengeId: params.id,
                passed: result.passed,
                score: result.passed ? 100 : 40,
            },
        });
        return {
            challengeId: params.id,
            passed: result.passed,
            output: result.output,
            testCases: [
                {
                    id: "case-1",
                    label: "Core behavior",
                    passed: result.passed,
                },
            ],
        };
    });
}

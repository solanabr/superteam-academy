import { type NextRequest, NextResponse } from "next/server";
import { getChallengePageData } from "@/lib/challenge-content";
import { incrementMetric, recordDuration } from "@/lib/runtime-observability";

interface RunRequest {
	code?: string;
	language?: string;
	submit?: boolean;
	validateOnly?: boolean;
}

const SUPPORTED_LANGUAGES = new Set(["rust", "typescript", "javascript", "python"]);
const MAX_CODE_SIZE = 60_000;
const MAX_TEST_RESULTS = 100;
const EXECUTION_UNAVAILABLE_MESSAGE =
	"Automated Solana execution is currently unavailable. Use this challenge as a guided exercise for now.";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ challengeId: string }> }
) {
	const startedAt = performance.now();
	incrementMetric("challenge.run.requests.total");
	try {
		const { challengeId } = await params;
		const body = (await request.json()) as RunRequest;
		const courseId = request.nextUrl.searchParams.get("courseId");
		if (!courseId) {
			incrementMetric("challenge.run.requests.invalid");
			return NextResponse.json({ error: "Missing courseId" }, { status: 400 });
		}

		if (!body.code || typeof body.code !== "string") {
			incrementMetric("challenge.run.requests.invalid");
			return NextResponse.json({ error: "Missing code" }, { status: 400 });
		}

		if (!body.language || typeof body.language !== "string") {
			incrementMetric("challenge.run.requests.invalid");
			return NextResponse.json({ error: "Missing language" }, { status: 400 });
		}

		const language = body.language.toLowerCase();
		if (!SUPPORTED_LANGUAGES.has(language)) {
			incrementMetric("challenge.run.requests.unsupported_language");
			return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
		}

		if (body.code.length > MAX_CODE_SIZE) {
			incrementMetric("challenge.run.requests.code_too_large");
			return NextResponse.json(
				{ error: `Code exceeds ${MAX_CODE_SIZE} characters` },
				{ status: 400 }
			);
		}

		const pageData = await getChallengePageData(courseId, challengeId);
		if (!pageData) {
			incrementMetric("challenge.run.requests.not_found");
			return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
		}

		const challenge = pageData.challenge;
		const challengeLanguage = challenge.language.toLowerCase();
		if (challengeLanguage !== language) {
			incrementMetric("challenge.run.requests.language_mismatch");
			return NextResponse.json(
				{ error: "Language does not match challenge configuration" },
				{ status: 400 }
			);
		}

		if (!Array.isArray(challenge.tests) || challenge.tests.length === 0) {
			incrementMetric("challenge.run.requests.invalid_challenge_tests");
			return NextResponse.json(
				{ error: "Challenge has no configured tests" },
				{ status: 422 }
			);
		}

		if (challenge.tests.length > MAX_TEST_RESULTS) {
			incrementMetric("challenge.run.requests.too_many_tests");
			return NextResponse.json(
				{ error: `Challenge test limit exceeded (${MAX_TEST_RESULTS})` },
				{ status: 422 }
			);
		}

		if (body.validateOnly) {
			incrementMetric("challenge.run.validations.total");
			incrementMetric("challenge.run.execution_disabled.total");
			recordDuration("challenge.run.request.latency_ms", performance.now() - startedAt);
			return NextResponse.json({
				validation: {
					valid: false,
					error: EXECUTION_UNAVAILABLE_MESSAGE,
				},
			});
		}

		const testResults = challenge.tests.map((test) => ({
			testId: test.id,
			passed: false,
			executionTime: 0,
			error: EXECUTION_UNAVAILABLE_MESSAGE,
		}));
		incrementMetric("challenge.run.execution_disabled.total");

		if (body.submit) {
			const totalTime = 0;
			const testsPassed = 0;

			incrementMetric("challenge.run.submissions.total");
			incrementMetric("challenge.run.submissions.failed");

			recordDuration("challenge.run.request.latency_ms", performance.now() - startedAt);

			return NextResponse.json({
				result: {
					passed: false,
					score: 0,
					maxScore: 100,
					executionTime: totalTime,
					testsPassed,
					totalTests: challenge.tests.length,
					executionProvider: "manual-feedback",
					authoritative: false,
					feedback: [EXECUTION_UNAVAILABLE_MESSAGE],
					xpEarned: 0,
				},
			});
		}

		incrementMetric("challenge.run.executions.total");
		recordDuration("challenge.run.request.latency_ms", performance.now() - startedAt);

		return NextResponse.json({ testResults });
	} catch {
		incrementMetric("challenge.run.requests.error");
		recordDuration("challenge.run.request.latency_ms", performance.now() - startedAt);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

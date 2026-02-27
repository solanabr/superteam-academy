import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/challenge-content", () => ({
	getChallengePageData: vi.fn(),
}));

vi.mock("@/lib/runtime-observability", () => ({
	incrementMetric: vi.fn(),
	recordDuration: vi.fn(),
}));

import { POST } from "./route";
import { getChallengePageData } from "@/lib/challenge-content";

const getChallengePageDataMock = vi.mocked(getChallengePageData);
const EXECUTION_UNAVAILABLE_MESSAGE =
	"Automated Solana execution is currently unavailable. Use this challenge as a guided exercise for now.";

describe("POST /api/challenges/[challengeId]/run", () => {
	beforeEach(() => {
		getChallengePageDataMock.mockReset();
	});

	it("rejects when submitted language does not match challenge language", async () => {
		getChallengePageDataMock.mockResolvedValue({
			challenge: {
				language: "rust",
				starterCode: "fn initialize() {}",
				tests: [{ id: "t1", description: "Compile", type: "unit" }],
				xpReward: 100,
			},
		} as unknown as NonNullable<Awaited<ReturnType<typeof getChallengePageData>>>);

		const request = new NextRequest(
			"http://localhost:3000/api/challenges/1-1/run?courseId=solana-intro",
			{
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					code: "function solve() { return 1; }",
					language: "javascript",
				}),
			}
		);

		const response = await POST(request, { params: Promise.resolve({ challengeId: "1-1" }) });
		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({
			error: "Language does not match challenge configuration",
		});
	});

	it("returns test results for a valid run request", async () => {
		getChallengePageDataMock.mockResolvedValue({
			challenge: {
				language: "rust",
				starterCode: "fn initialize() {}",
				tests: [
					{ id: "t1", description: "initialize to 0", type: "unit" },
					{ id: "t2", description: "increment updates count", type: "unit" },
				],
				xpReward: 100,
			},
		} as unknown as NonNullable<Awaited<ReturnType<typeof getChallengePageData>>>);

		const request = new NextRequest(
			"http://localhost:3000/api/challenges/1-1/run?courseId=solana-intro",
			{
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					code: "fn initialize() { let count = 0; } fn increment() { let mut count = 0; count += 1; }",
					language: "rust",
				}),
			}
		);

		const response = await POST(request, { params: Promise.resolve({ challengeId: "1-1" }) });
		expect(response.status).toBe(200);
		const data = await response.json();

		expect(Array.isArray(data.testResults)).toBe(true);
		expect(data.testResults).toHaveLength(2);
		expect(data.testResults.every((result: { passed: boolean }) => !result.passed)).toBe(true);
		expect(
			data.testResults.every(
				(result: { error?: string }) => result.error === EXECUTION_UNAVAILABLE_MESSAGE
			)
		).toBe(true);
	});

	it("returns live validation feedback without executing tests", async () => {
		getChallengePageDataMock.mockResolvedValue({
			challenge: {
				language: "rust",
				starterCode: "fn initialize() {}",
				tests: [{ id: "t1", description: "Compile", type: "unit" }],
				xpReward: 100,
			},
		} as unknown as NonNullable<Awaited<ReturnType<typeof getChallengePageData>>>);

		const request = new NextRequest(
			"http://localhost:3000/api/challenges/1-1/run?courseId=solana-intro",
			{
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					code: "fn initialize() { let count = 0; }",
					language: "rust",
					validateOnly: true,
				}),
			}
		);

		const response = await POST(request, { params: Promise.resolve({ challengeId: "1-1" }) });
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			validation: {
				valid: false,
				error: EXECUTION_UNAVAILABLE_MESSAGE,
			},
		});
	});

	it("includes execution provider metadata on submit", async () => {
		getChallengePageDataMock.mockResolvedValue({
			challenge: {
				language: "rust",
				starterCode: "fn initialize() {}",
				tests: [{ id: "t1", description: "compile", type: "unit" }],
				xpReward: 100,
			},
		} as unknown as NonNullable<Awaited<ReturnType<typeof getChallengePageData>>>);

		const request = new NextRequest(
			"http://localhost:3000/api/challenges/1-1/run?courseId=solana-intro",
			{
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					code: "fn initialize() { let count = 0; }",
					language: "rust",
					submit: true,
				}),
			}
		);

		const response = await POST(request, { params: Promise.resolve({ challengeId: "1-1" }) });
		expect(response.status).toBe(200);
		const data = await response.json();

		expect(data.result.executionProvider).toBe("manual-feedback");
		expect(data.result.authoritative).toBe(false);
		expect(data.result.passed).toBe(false);
		expect(data.result.feedback).toEqual([EXECUTION_UNAVAILABLE_MESSAGE]);
		expect(data.result.xpEarned).toBe(0);
	});

	it("returns unavailable message on run without failing request", async () => {
		getChallengePageDataMock.mockResolvedValue({
			challenge: {
				language: "rust",
				starterCode: "fn initialize() {}",
				tests: [{ id: "t1", description: "compile", type: "unit" }],
				xpReward: 100,
			},
		} as unknown as NonNullable<Awaited<ReturnType<typeof getChallengePageData>>>);

		const request = new NextRequest(
			"http://localhost:3000/api/challenges/1-1/run?courseId=solana-intro",
			{
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					code: "fn initialize() { let count = 0; }",
					language: "rust",
				}),
			}
		);

		const response = await POST(request, { params: Promise.resolve({ challengeId: "1-1" }) });
		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data.testResults).toHaveLength(1);
		expect(data.testResults[0].error).toBe(EXECUTION_UNAVAILABLE_MESSAGE);
	});
});

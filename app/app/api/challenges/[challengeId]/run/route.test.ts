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
		expect(data.testResults.every((result: { passed: boolean }) => result.passed)).toBe(true);
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
				valid: true,
				error: undefined,
			},
		});
	});
});

import { describe, it, expect, beforeEach } from "vitest";
import { challengeService } from "./challenge-service";

const WALLET = "TestWallet111111111111111111111111111111111";

describe("challengeService", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("getDailyChallenges", () => {
    it("returns 3 challenges", () => {
      const state = challengeService.getDailyChallenges();
      expect(state.challenges).toHaveLength(3);
    });

    it("sets today's date", () => {
      const state = challengeService.getDailyChallenges();
      const today = new Date().toISOString().slice(0, 10);
      expect(state.date).toBe(today);
    });

    it("initializes all challenges with 0 progress", () => {
      const state = challengeService.getDailyChallenges();
      for (const c of state.challenges) {
        expect(c.progress).toBe(0);
        expect(c.completed).toBe(false);
        expect(c.claimedAt).toBeUndefined();
      }
    });

    it("persists and reloads state for a wallet", () => {
      const first = challengeService.getDailyChallenges(WALLET);
      const second = challengeService.getDailyChallenges(WALLET);
      expect(second).toEqual(first);
    });

    it("returns same challenges for same date (deterministic)", () => {
      const a = challengeService.getDailyChallenges();
      const b = challengeService.getDailyChallenges();
      expect(a.challenges.map((c) => c.id)).toEqual(
        b.challenges.map((c) => c.id),
      );
    });
  });

  describe("updateProgress", () => {
    it("increments progress for matching type", () => {
      const state = challengeService.getDailyChallenges(WALLET);
      const challenge = state.challenges[0];

      challengeService.updateProgress(WALLET, challenge.type, 1);

      const updated = challengeService.getDailyChallenges(WALLET);
      const updatedChallenge = updated.challenges.find(
        (c) => c.id === challenge.id,
      )!;
      expect(updatedChallenge.progress).toBeGreaterThanOrEqual(1);
    });

    it("marks challenge completed when target reached", () => {
      const state = challengeService.getDailyChallenges(WALLET);
      const challenge = state.challenges[0];

      challengeService.updateProgress(WALLET, challenge.type, challenge.target);

      const updated = challengeService.getDailyChallenges(WALLET);
      const updatedChallenge = updated.challenges.find(
        (c) => c.id === challenge.id,
      )!;
      expect(updatedChallenge.completed).toBe(true);
    });

    it("does not exceed target", () => {
      const state = challengeService.getDailyChallenges(WALLET);
      const challenge = state.challenges[0];

      challengeService.updateProgress(
        WALLET,
        challenge.type,
        challenge.target + 100,
      );

      const updated = challengeService.getDailyChallenges(WALLET);
      const updatedChallenge = updated.challenges.find(
        (c) => c.id === challenge.id,
      )!;
      expect(updatedChallenge.progress).toBe(challenge.target);
    });
  });

  describe("claimReward", () => {
    it("returns 0 for incomplete challenge", () => {
      challengeService.getDailyChallenges(WALLET);
      const state = challengeService.getDailyChallenges(WALLET);
      const challenge = state.challenges[0];

      const reward = challengeService.claimReward(WALLET, challenge.id);
      expect(reward).toBe(0);
    });

    it("returns xpReward for completed challenge", () => {
      const state = challengeService.getDailyChallenges(WALLET);
      const challenge = state.challenges[0];

      challengeService.updateProgress(WALLET, challenge.type, challenge.target);
      const reward = challengeService.claimReward(WALLET, challenge.id);
      expect(reward).toBe(challenge.xpReward);
    });

    it("prevents double-claiming", () => {
      const state = challengeService.getDailyChallenges(WALLET);
      const challenge = state.challenges[0];

      challengeService.updateProgress(WALLET, challenge.type, challenge.target);
      challengeService.claimReward(WALLET, challenge.id);

      const secondClaim = challengeService.claimReward(WALLET, challenge.id);
      expect(secondClaim).toBe(0);
    });
  });

  describe("getTimeUntilReset", () => {
    it("returns a positive number", () => {
      const ms = challengeService.getTimeUntilReset();
      expect(ms).toBeGreaterThan(0);
    });

    it("returns less than 24 hours", () => {
      const ms = challengeService.getTimeUntilReset();
      expect(ms).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
    });
  });
});

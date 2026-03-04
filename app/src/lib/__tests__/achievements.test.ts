import { describe, it, expect } from "vitest";
import {
  ACHIEVEMENT_DEFINITIONS,
  CATEGORIES,
  isAchievementUnlocked,
  type AchievementCategory,
  type AchievementDefinition,
} from "../gamification/achievements";

// ---------------------------------------------------------------------------
// ACHIEVEMENT_DEFINITIONS structure
// ---------------------------------------------------------------------------

describe("ACHIEVEMENT_DEFINITIONS — structure", () => {
  it("has exactly 15 achievement definitions", () => {
    expect(ACHIEVEMENT_DEFINITIONS).toHaveLength(15);
  });

  it("every definition has a unique id", () => {
    const ids = ACHIEVEMENT_DEFINITIONS.map((a) => a.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ACHIEVEMENT_DEFINITIONS.length);
  });

  it("every definition has a unique bitmapIndex", () => {
    const indices = ACHIEVEMENT_DEFINITIONS.map((a) => a.bitmapIndex);
    const unique = new Set(indices);
    expect(unique.size).toBe(ACHIEVEMENT_DEFINITIONS.length);
  });

  it("bitmapIndex values range from 0 to 14", () => {
    const indices = ACHIEVEMENT_DEFINITIONS.map((a) => a.bitmapIndex);
    expect(Math.min(...indices)).toBe(0);
    expect(Math.max(...indices)).toBe(14);
  });

  it("every definition has a non-empty icon string", () => {
    for (const def of ACHIEVEMENT_DEFINITIONS) {
      expect(def.icon).toBeTruthy();
    }
  });

  it("every definition has a positive xpReward", () => {
    for (const def of ACHIEVEMENT_DEFINITIONS) {
      expect(def.xpReward).toBeGreaterThan(0);
    }
  });

  it("every definition has a valid category", () => {
    const validCategories: AchievementCategory[] = ["progress", "streaks", "skills", "community", "special"];
    for (const def of ACHIEVEMENT_DEFINITIONS) {
      expect(validCategories).toContain(def.category);
    }
  });
});

// ---------------------------------------------------------------------------
// Category distribution — spec requires 3 per category
// ---------------------------------------------------------------------------

describe("ACHIEVEMENT_DEFINITIONS — category counts", () => {
  function countByCategory(cat: AchievementCategory): number {
    return ACHIEVEMENT_DEFINITIONS.filter((a) => a.category === cat).length;
  }

  it("has 3 progress achievements", () => {
    expect(countByCategory("progress")).toBe(3);
  });

  it("has 3 streak achievements", () => {
    expect(countByCategory("streaks")).toBe(3);
  });

  it("has 3 skills achievements", () => {
    expect(countByCategory("skills")).toBe(3);
  });

  it("has 3 community achievements", () => {
    expect(countByCategory("community")).toBe(3);
  });

  it("has 3 special achievements", () => {
    expect(countByCategory("special")).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Specific achievement IDs match bounty spec names
// ---------------------------------------------------------------------------

describe("ACHIEVEMENT_DEFINITIONS — bounty spec badges", () => {
  function findById(id: string): AchievementDefinition {
    const found = ACHIEVEMENT_DEFINITIONS.find((a) => a.id === id);
    if (!found) throw new Error(`Achievement not found: ${id}`);
    return found;
  }

  // Progress
  it("first_steps is a progress achievement with bitmapIndex 0", () => {
    const a = findById("first_steps");
    expect(a.name).toBe("First Steps");
    expect(a.category).toBe("progress");
    expect(a.bitmapIndex).toBe(0);
  });

  it("course_completer is a progress achievement", () => {
    const a = findById("course_completer");
    expect(a.name).toBe("Course Completer");
    expect(a.category).toBe("progress");
  });

  it("speed_runner is a progress achievement", () => {
    const a = findById("speed_runner");
    expect(a.name).toBe("Speed Runner");
    expect(a.category).toBe("progress");
  });

  // Streaks
  it("week_warrior is a streaks achievement", () => {
    const a = findById("week_warrior");
    expect(a.name).toBe("Week Warrior");
    expect(a.category).toBe("streaks");
  });

  it("monthly_master is a streaks achievement", () => {
    const a = findById("monthly_master");
    expect(a.name).toBe("Monthly Master");
    expect(a.category).toBe("streaks");
  });

  it("consistency_king is a streaks achievement with xpReward 1000", () => {
    const a = findById("consistency_king");
    expect(a.name).toBe("Consistency King");
    expect(a.category).toBe("streaks");
    expect(a.xpReward).toBe(1000);
  });

  // Skills
  it("rust_rookie is a skills achievement", () => {
    const a = findById("rust_rookie");
    expect(a.name).toBe("Rust Rookie");
    expect(a.category).toBe("skills");
  });

  it("anchor_expert is a skills achievement", () => {
    const a = findById("anchor_expert");
    expect(a.name).toBe("Anchor Expert");
    expect(a.category).toBe("skills");
  });

  it("full_stack_solana is a skills achievement", () => {
    const a = findById("full_stack_solana");
    expect(a.name).toBe("Full Stack Solana");
    expect(a.category).toBe("skills");
  });

  // Community
  it("helper is a community achievement", () => {
    const a = findById("helper");
    expect(a.name).toBe("Helper");
    expect(a.category).toBe("community");
  });

  it("first_comment is a community achievement", () => {
    const a = findById("first_comment");
    expect(a.name).toBe("First Comment");
    expect(a.category).toBe("community");
  });

  it("top_contributor is a community achievement", () => {
    const a = findById("top_contributor");
    expect(a.name).toBe("Top Contributor");
    expect(a.category).toBe("community");
  });

  // Special
  it("early_adopter is a special achievement with xpReward 500", () => {
    const a = findById("early_adopter");
    expect(a.name).toBe("Early Adopter");
    expect(a.category).toBe("special");
    expect(a.xpReward).toBe(500);
  });

  it("bug_hunter is a special achievement", () => {
    const a = findById("bug_hunter");
    expect(a.name).toBe("Bug Hunter");
    expect(a.category).toBe("special");
  });

  it("perfect_score is a special achievement with bitmapIndex 14", () => {
    const a = findById("perfect_score");
    expect(a.name).toBe("Perfect Score");
    expect(a.category).toBe("special");
    expect(a.bitmapIndex).toBe(14);
  });
});

// ---------------------------------------------------------------------------
// isAchievementUnlocked
// ---------------------------------------------------------------------------

describe("isAchievementUnlocked — bitmap checks", () => {
  it("returns false for any index when bitmap is 0n", () => {
    expect(isAchievementUnlocked(0n, 0)).toBe(false);
    expect(isAchievementUnlocked(0n, 7)).toBe(false);
    expect(isAchievementUnlocked(0n, 14)).toBe(false);
  });

  it("returns true for index 0 when bit 0 is set", () => {
    expect(isAchievementUnlocked(1n, 0)).toBe(true);
  });

  it("returns false for index 1 when only bit 0 is set", () => {
    expect(isAchievementUnlocked(1n, 1)).toBe(false);
  });

  it("returns true for index 1 when bit 1 is set", () => {
    expect(isAchievementUnlocked(2n, 1)).toBe(true);
  });

  it("returns true for index 5 when bit 5 is set", () => {
    const bitmap = 1n << 5n;
    expect(isAchievementUnlocked(bitmap, 5)).toBe(true);
  });

  it("returns false for index 4 when only bit 5 is set", () => {
    const bitmap = 1n << 5n;
    expect(isAchievementUnlocked(bitmap, 4)).toBe(false);
  });

  it("returns true for index 14 when bit 14 is set", () => {
    const bitmap = 1n << 14n;
    expect(isAchievementUnlocked(bitmap, 14)).toBe(true);
  });

  it("returns true for all indices when all 15 bits are set", () => {
    const bitmap = (1n << 15n) - 1n;
    for (let i = 0; i < 15; i++) {
      expect(isAchievementUnlocked(bitmap, i)).toBe(true);
    }
  });

  it("correctly identifies multiple unlocked achievements simultaneously", () => {
    const bitmap = (1n << 0n) | (1n << 5n) | (1n << 14n);
    expect(isAchievementUnlocked(bitmap, 0)).toBe(true);
    expect(isAchievementUnlocked(bitmap, 5)).toBe(true);
    expect(isAchievementUnlocked(bitmap, 14)).toBe(true);
    expect(isAchievementUnlocked(bitmap, 1)).toBe(false);
    expect(isAchievementUnlocked(bitmap, 7)).toBe(false);
  });

  it("bitmap with all bits set except index 7 returns false for index 7", () => {
    const allSet = (1n << 15n) - 1n;
    const withoutSeven = allSet & ~(1n << 7n);
    expect(isAchievementUnlocked(withoutSeven, 7)).toBe(false);
    expect(isAchievementUnlocked(withoutSeven, 6)).toBe(true);
    expect(isAchievementUnlocked(withoutSeven, 8)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Category filtering
// ---------------------------------------------------------------------------

describe("ACHIEVEMENT_DEFINITIONS — category filtering", () => {
  it("filtering by progress returns only progress achievements", () => {
    const progress = ACHIEVEMENT_DEFINITIONS.filter((a) => a.category === "progress");
    expect(progress.every((a) => a.category === "progress")).toBe(true);
  });

  it("filtering by streaks returns exactly 3 items", () => {
    const streaks = ACHIEVEMENT_DEFINITIONS.filter((a) => a.category === "streaks");
    expect(streaks).toHaveLength(3);
  });

  it("all categories together cover all 15 achievements", () => {
    const allCategories: AchievementCategory[] = ["progress", "streaks", "skills", "community", "special"];
    const total = allCategories.reduce(
      (sum, cat) => sum + ACHIEVEMENT_DEFINITIONS.filter((a) => a.category === cat).length,
      0
    );
    expect(total).toBe(15);
  });
});

// ---------------------------------------------------------------------------
// CATEGORIES array
// ---------------------------------------------------------------------------

describe("CATEGORIES — structure", () => {
  it("has 5 categories", () => {
    expect(CATEGORIES).toHaveLength(5);
  });

  it("includes all expected category keys", () => {
    const keys = CATEGORIES.map((c) => c.key);
    expect(keys).toContain("progress");
    expect(keys).toContain("streaks");
    expect(keys).toContain("skills");
    expect(keys).toContain("community");
    expect(keys).toContain("special");
  });

  it("every category has a non-empty color string", () => {
    for (const cat of CATEGORIES) {
      expect(cat.color).toBeTruthy();
    }
  });

  it("progress category uses blue color", () => {
    const prog = CATEGORIES.find((c) => c.key === "progress");
    expect(prog?.color).toContain("blue");
  });

  it("streaks category uses orange color", () => {
    const streaks = CATEGORIES.find((c) => c.key === "streaks");
    expect(streaks?.color).toContain("orange");
  });
});

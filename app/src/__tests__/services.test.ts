import { describe, it, expect } from "vitest";
import { StubCourseService } from "@/lib/services/course";
import { StubEnrollmentService } from "@/lib/services/enrollment";
import { StubXpService } from "@/lib/services/xp";
import { StubCredentialService } from "@/lib/services/credential";
import { StubLessonService } from "@/lib/services/lesson";

describe("StubCourseService", () => {
  const service = new StubCourseService();

  it("returns courses", async () => {
    const courses = await service.getCourses();
    expect(courses.length).toBeGreaterThan(0);
    expect(courses[0]).toHaveProperty("courseId");
    expect(courses[0]).toHaveProperty("lessonCount");
    expect(courses[0]).toHaveProperty("xpPerLesson");
  });

  it("returns a specific course", async () => {
    const course = await service.getCourse("solana-101");
    expect(course).not.toBeNull();
    expect(course?.courseId).toBe("solana-101");
  });

  it("returns null for unknown course", async () => {
    const course = await service.getCourse("nonexistent");
    expect(course).toBeNull();
  });

  it("filters by track", async () => {
    const courses = await service.getCoursesByTrack(1);
    expect(courses.every((c) => c.trackId === 1)).toBe(true);
  });
});

describe("StubEnrollmentService", () => {
  const service = new StubEnrollmentService();

  it("enrolls in a course", async () => {
    const result = await service.enroll("defi-basics");
    expect(result.success).toBe(true);
    expect(result.signature).toBeTruthy();
  });

  it("returns enrollment data", async () => {
    const enrollment = await service.getEnrollment("solana-101", "test-wallet");
    // May or may not have data depending on stub state
    if (enrollment) {
      expect(enrollment).toHaveProperty("course");
      expect(enrollment).toHaveProperty("lessonFlags");
    }
  });
});

describe("StubXpService", () => {
  const service = new StubXpService();

  it("returns XP balance", async () => {
    const balance = await service.getXpBalance("test-wallet");
    expect(typeof balance).toBe("number");
    expect(balance).toBeGreaterThanOrEqual(0);
  });

  it("returns leaderboard", async () => {
    const leaderboard = await service.getLeaderboard(10);
    expect(leaderboard.length).toBeLessThanOrEqual(10);
    if (leaderboard.length > 0) {
      expect(leaderboard[0]).toHaveProperty("wallet");
      expect(leaderboard[0]).toHaveProperty("xp");
      expect(leaderboard[0]).toHaveProperty("level");
      expect(leaderboard[0]).toHaveProperty("rank");
    }
  });
});

describe("StubCredentialService", () => {
  const service = new StubCredentialService();

  it("returns credentials", async () => {
    const creds = await service.getCredentials("test-wallet");
    expect(Array.isArray(creds)).toBe(true);
  });
});

describe("StubLessonService", () => {
  const service = new StubLessonService();

  it("completes a lesson", async () => {
    const result = await service.completeLesson("solana-101", 0);
    expect(result.success).toBe(true);
    expect(result.signature).toBeTruthy();
  });

  it("finalizes a course", async () => {
    const result = await service.finalizeCourse("solana-101");
    expect(result.success).toBe(true);
  });
});

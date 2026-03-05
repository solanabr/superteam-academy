import type { Step } from "react-joyride";

/**
 * Per-page tutorial step definitions.
 * Each key is a page identifier. Steps reference elements by CSS selector
 * (data-tutorial attributes on key UI elements).
 */
export const tutorialSteps: Record<string, Step[]> = {
    dashboard: [
        {
            target: '[data-tutorial="stats-row"]',
            content: "Here&apos;s your learning overview — XP earned, current level, streak days, and courses completed.",
            disableBeacon: true,
            placement: "bottom",
        },
        {
            target: '[data-tutorial="level-progress"]',
            content: "Track your XP progress toward the next level. Complete lessons and quizzes to earn XP!",
            placement: "bottom",
        },
        {
            target: '[data-tutorial="active-courses"]',
            content: "Your enrolled courses appear here with a Duolingo-style learning path. Click any lesson node to jump in.",
            placement: "top",
        },
        {
            target: '[data-tutorial="streak-calendar"]',
            content: "Your learning streak calendar — keep it going by studying every day!",
            placement: "left",
        },
    ],

    courseDetail: [
        {
            target: '[data-tutorial="course-header"]',
            content: "Course overview — difficulty, duration, track, and instructor info.",
            disableBeacon: true,
            placement: "bottom",
        },
        {
            target: '[data-tutorial="course-modules"]',
            content: "The curriculum is organized into modules. Expand each to see individual lessons.",
            placement: "top",
        },
        {
            target: '[data-tutorial="enroll-button"]',
            content: "Enroll in the course to start your learning journey and track progress!",
            placement: "left",
        },
    ],

    lessonView: [
        {
            target: '[data-tutorial="lesson-content"]',
            content: "Read through the lesson content. Some lessons include interactive code editors or quizzes.",
            disableBeacon: true,
            placement: "bottom",
        },
        {
            target: '[data-tutorial="lesson-sidebar"]',
            content: "Navigate between lessons in the current module using this sidebar.",
            placement: "left",
        },
        {
            target: '[data-tutorial="complete-button"]',
            content: "Mark the lesson complete to earn XP and unlock the next one!",
            placement: "top",
        },
    ],

    profile: [
        {
            target: '[data-tutorial="profile-header"]',
            content: "Your public profile. Other learners can see your achievements and credentials.",
            disableBeacon: true,
            placement: "bottom",
        },
        {
            target: '[data-tutorial="credentials-section"]',
            content: "Completed courses earn you on-chain NFT credentials here.",
            placement: "top",
        },
    ],
};

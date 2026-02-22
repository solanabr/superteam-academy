"use client";

import { SkillRadarChart, deriveSkillsFromCourses } from "./skill-radar-chart";

interface SkillRadarConnectedProps {
	courses: Array<{
		id: string;
		status: "completed" | "in_progress" | "not_started";
		progress?: { completedLessons: number; totalLessons: number };
	}>;
}

export function SkillRadarConnected({ courses }: SkillRadarConnectedProps) {
	const skills = deriveSkillsFromCourses(courses);
	if (skills.length < 3) return null;
	return <SkillRadarChart skills={skills} />;
}

export {
	PROGRAM_ID,
	isLessonCompleted,
	countCompletedLessons,
} from "./idl";
export type {
	ConfigAccount,
	CourseAccount,
	EnrollmentAccount,
	MinterRoleAccount,
	AchievementTypeAccount,
	AchievementReceiptAccount,
	CreateCourseParams,
	UpdateCourseParams,
	UpdateConfigParams,
	RegisterMinterParams,
	CreateAchievementTypeParams,
} from "./idl";
export {
	findConfigPDA,
	findCoursePDA,
	findEnrollmentPDA,
	findMinterRolePDA,
	findAchievementTypePDA,
	findAchievementReceiptPDA,
} from "./pda";
export { AcademyClient } from "./client";
export {
	buildEnrollInstruction,
	buildCloseEnrollmentInstruction,
	buildCompleteLessonInstruction,
	buildFinalizeCourseInstruction,
	buildIssueCredentialInstruction,
	buildUpgradeCredentialInstruction,
	buildAwardAchievementInstruction,
	buildCreateCourseInstruction,
	buildUpdateCourseInstruction,
} from "./instructions";

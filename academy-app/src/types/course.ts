import { ILesson } from "./lesson";
import { ITrack } from "./track";

export enum Difficulty {
   BEGINNER, INTERMIDIATE, ADVANCE
}

export interface ICreator {
   creatorName: string,
   creatorPubkey: string
}

export interface ICourse {
   courseId: string,
   creator: ICreator,
   lessonCount: number,
   lessons: Array<ILesson>
   difficulty: Difficulty,
   xpPerLesson: number,
   track: ITrack,
   prerequisite: Array<ICourse> | null,
   creatorRewardXp: number,
   minCompletionsForReward: number,
}

export interface ICreateCourse {
   courseId: string,
   creatorPubkey: string,
   contentTxId: Int8Array, //arweave tx bytes
   lessonCount: number,
   difficulty: number,
   xpPerLesson: number,
   trackId: number,
   trackLevel: number,
   prerequisite: Array<string> | null,
   creatorRewardXp: number,
   minCompletionsForReward: number,
}

export interface IUpdateCourse {
   newContentTxId: Int8Array,
   newIsActive: boolean,
   newXpPerLesson: number,
   newCreatorRewardXp: number,
   newMinCompletionsForReward: number,
}

export const buildCreateCourseInterface = (course: ICourse, contentTxId: Int8Array): ICreateCourse => ({
   contentTxId,
   courseId: course.courseId,
   creatorPubkey: course.creator.creatorPubkey,
   lessonCount: course.lessonCount,
   difficulty: course.difficulty,
   xpPerLesson: course.xpPerLesson,
   trackId: course.track.trackId,
   trackLevel: course.track.trackLevel,
   prerequisite: course.prerequisite?.map(c => c.courseId) ?? null,
   creatorRewardXp: course.creatorRewardXp,
   minCompletionsForReward: course.minCompletionsForReward,
})
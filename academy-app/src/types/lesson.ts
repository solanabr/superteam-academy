
export enum LessonType {
   VIDEO = 1, DOCUMENT = 2, CHALLENGE = 3
}

export interface ILesson {
   lessonId: number,  // alias lessonIndex
   lessonType: LessonType,
   materialUrl: string
}
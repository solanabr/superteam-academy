"use client";

import { create } from "zustand";

export const MAX_XP_PER_LESSON = 15;
export const MAX_COURSE_XP = 300;

export interface QuizQuestionDraft {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizDraft {
  passingScore: number;
  questions: QuizQuestionDraft[];
}

export interface ChallengeDraft {
  prompt: string;
  objectives: string[];
  starterCode: string;
  language: "rust" | "typescript" | "json";
  hints: string[];
}

export interface LessonDraft {
  title: string;
  description: string;
  type: "content" | "challenge" | "quiz" | "video";
  content: string;
  videoUrl: string;
  xp: number;
  duration: string;
  quiz: QuizDraft;
  challenge: ChallengeDraft;
}

const emptyQuiz: QuizDraft = {
  passingScore: 70,
  questions: [{ question: "", options: ["", ""], correctIndex: 0, explanation: "" }],
};

const emptyChallenge: ChallengeDraft = {
  prompt: "",
  objectives: [],
  starterCode: "",
  language: "typescript",
  hints: [],
};

function newLesson(xp: number): LessonDraft {
  return {
    title: "",
    description: "",
    type: "content",
    content: "",
    videoUrl: "",
    xp: Math.min(xp, MAX_XP_PER_LESSON),
    duration: "",
    quiz: { ...emptyQuiz, questions: [{ question: "", options: ["", ""], correctIndex: 0, explanation: "" }] },
    challenge: { ...emptyChallenge, objectives: [], hints: [] },
  };
}

export interface ModuleDraft {
  title: string;
  description: string;
  lessons: LessonDraft[];
}

export interface CourseFormState {
  // Step 1 — Basics
  title: string;
  description: string;
  difficulty: 1 | 2 | 3;
  trackId: number;
  duration: string;
  xpPerLesson: number;
  whatYouLearn: string[];
  instructorName: string;
  instructorBio: string;
  thumbnailPreview: string | null;

  // Step 2 & 3 — Modules & Lessons
  modules: ModuleDraft[];

  // Meta
  currentStep: number;

  // Actions
  setField: <K extends keyof CourseFormState>(key: K, value: CourseFormState[K]) => void;
  setStep: (step: number) => void;
  addModule: () => void;
  removeModule: (index: number) => void;
  updateModule: (index: number, field: keyof ModuleDraft, value: string) => void;
  addLesson: (moduleIndex: number) => void;
  removeLesson: (moduleIndex: number, lessonIndex: number) => void;
  updateLesson: (moduleIndex: number, lessonIndex: number, field: keyof LessonDraft, value: string | number) => void;
  updateLessonQuiz: (moduleIndex: number, lessonIndex: number, quiz: QuizDraft) => void;
  updateLessonChallenge: (moduleIndex: number, lessonIndex: number, challenge: ChallengeDraft) => void;
  addWhatYouLearn: (item: string) => void;
  removeWhatYouLearn: (index: number) => void;
  loadCourse: (data: {
    title: string;
    description: string;
    difficulty: 1 | 2 | 3;
    trackId: number;
    duration: string;
    xpPerLesson: number;
    whatYouLearn: string[];
    instructorName: string;
    instructorBio: string;
    thumbnailPreview: string | null;
    modules: ModuleDraft[];
  }) => void;
  reset: () => void;
}

const initialState = {
  title: "",
  description: "",
  difficulty: 1 as const,
  trackId: 1,
  duration: "",
  xpPerLesson: MAX_XP_PER_LESSON,
  whatYouLearn: [],
  instructorName: "",
  instructorBio: "",
  thumbnailPreview: null,
  modules: [
    {
      title: "",
      description: "",
      lessons: [newLesson(MAX_XP_PER_LESSON)],
    },
  ],
  currentStep: 1,
};

export const useCourseFormStore = create<CourseFormState>((set) => ({
  ...initialState,

  setField: (key, value) => set({ [key]: value }),
  setStep: (step) => set({ currentStep: step }),

  addModule: () =>
    set((state) => ({
      modules: [
        ...state.modules,
        { title: "", description: "", lessons: [newLesson(state.xpPerLesson)] },
      ],
    })),

  removeModule: (index) =>
    set((state) => ({
      modules: state.modules.filter((_, i) => i !== index),
    })),

  updateModule: (index, field, value) =>
    set((state) => ({
      modules: state.modules.map((m, i) =>
        i === index ? { ...m, [field]: value } : m,
      ),
    })),

  addLesson: (moduleIndex) =>
    set((state) => ({
      modules: state.modules.map((m, i) =>
        i === moduleIndex
          ? { ...m, lessons: [...m.lessons, newLesson(state.xpPerLesson)] }
          : m,
      ),
    })),

  removeLesson: (moduleIndex, lessonIndex) =>
    set((state) => ({
      modules: state.modules.map((m, i) =>
        i === moduleIndex
          ? { ...m, lessons: m.lessons.filter((_, li) => li !== lessonIndex) }
          : m,
      ),
    })),

  updateLesson: (moduleIndex, lessonIndex, field, value) =>
    set((state) => ({
      modules: state.modules.map((m, i) =>
        i === moduleIndex
          ? {
              ...m,
              lessons: m.lessons.map((l, li) =>
                li === lessonIndex ? { ...l, [field]: field === "xp" ? Math.min(Number(value), MAX_XP_PER_LESSON) : value } : l,
              ),
            }
          : m,
      ),
    })),

  updateLessonQuiz: (moduleIndex, lessonIndex, quiz) =>
    set((state) => ({
      modules: state.modules.map((m, i) =>
        i === moduleIndex
          ? {
              ...m,
              lessons: m.lessons.map((l, li) =>
                li === lessonIndex ? { ...l, quiz } : l,
              ),
            }
          : m,
      ),
    })),

  updateLessonChallenge: (moduleIndex, lessonIndex, challenge) =>
    set((state) => ({
      modules: state.modules.map((m, i) =>
        i === moduleIndex
          ? {
              ...m,
              lessons: m.lessons.map((l, li) =>
                li === lessonIndex ? { ...l, challenge } : l,
              ),
            }
          : m,
      ),
    })),

  addWhatYouLearn: (item) =>
    set((state) => ({ whatYouLearn: [...state.whatYouLearn, item] })),

  removeWhatYouLearn: (index) =>
    set((state) => ({
      whatYouLearn: state.whatYouLearn.filter((_, i) => i !== index),
    })),

  loadCourse: (data) =>
    set({
      title: data.title,
      description: data.description,
      difficulty: data.difficulty,
      trackId: data.trackId,
      duration: data.duration,
      xpPerLesson: data.xpPerLesson,
      whatYouLearn: data.whatYouLearn,
      instructorName: data.instructorName,
      instructorBio: data.instructorBio,
      thumbnailPreview: data.thumbnailPreview,
      modules: data.modules,
      currentStep: 1,
    }),

  reset: () => set(initialState),
}));

export interface CourseLesson {
  title: string;
  description: string;
  type: "content" | "challenge" | "quiz";
  duration: string;
  content?: string;
  quiz?: {
    passingScore: number;
    questions: {
      question: string;
      options: string[];
      correctIndex: number;
      explanation?: string;
    }[];
  };
  challenge?: {
    prompt: string;
    objectives: string[];
    starterCode: string;
    language: string;
    solution?: string;
    hints?: string[];
    testCases?: {
      id: string;
      name: string;
      input?: string;
      expectedOutput: string;
      hidden?: boolean;
    }[];
  };
}

export interface CourseModule {
  title: string;
  description: string;
  lessons: CourseLesson[];
}

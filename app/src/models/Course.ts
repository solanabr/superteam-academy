import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITestCase {
  id: string;
  description: string;
  input?: string;
  expectedOutput: string;
  hidden?: boolean;
}

export interface IChallengeConfig {
  prompt: string;
  starterCode: string;
  solution: string;
  language: 'typescript' | 'javascript' | 'rust' | 'json';
  testCases: ITestCase[];
  functionName?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  timeEstimate?: number;
}

export interface ICourseLesson {
  id: string;
  slug: string;
  title: string;
  type: 'content' | 'challenge' | 'video' | 'reading' | 'quiz';
  order: number;
  moduleId: string;
  xpReward: number;
  duration: number; // Estimated reading time in minutes
  videoDurationSeconds?: number; // Video duration in seconds for completion tracking
  content: string;
  videoUrl?: string;
  videoProvider?: 'youtube' | 'vimeo' | 'facebook' | 'direct';
  challenge?: IChallengeConfig; // Challenge/activity configuration
  hints?: string[];
  prevLesson?: { slug: string; title: string };
  nextLesson?: { slug: string; title: string };
}

export interface ICourseModule {
  id: string;
  title: string;
  order: number;
  description?: string;
  lessons: ICourseLesson[];
}

export interface ICourse extends Document {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnail: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  xpReward: number;
  track?: string;
  lessonsCount: number;
  modulesCount: number;
  tags?: string[];
  prerequisites?: string[];
  learningObjectives?: string[];
  modules: ICourseModule[];
  published: boolean;
  created_at: Date;
  updated_at: Date;
}

const TestCaseSchema = new Schema(
  {
    id: { type: String, required: true },
    description: { type: String, required: true },
    input: { type: String },
    expectedOutput: { type: String, required: true },
    hidden: { type: Boolean, default: false },
  },
  { _id: false }
);

const ChallengeConfigSchema = new Schema(
  {
    prompt: { type: String, required: true },
    starterCode: { type: String, required: true },
    solution: { type: String, required: true },
    language: {
      type: String,
      enum: ['typescript', 'javascript', 'rust', 'json'],
      default: 'typescript',
    },
    testCases: { type: [TestCaseSchema], default: [] },
    functionName: { type: String },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
    timeEstimate: { type: Number, default: 15 },
  },
  { _id: false }
);

const LessonSchema = new Schema<ICourseLesson>(
  {
    id: { type: String, required: true },
    slug: { type: String, required: true },
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ['content', 'challenge', 'video', 'reading', 'quiz'],
      required: true,
    },
    order: { type: Number, required: true },
    moduleId: { type: String, required: true },
    xpReward: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
    videoDurationSeconds: { type: Number, default: 0 },
    content: { type: String, default: '' },
    videoUrl: { type: String },
    videoProvider: { type: String, enum: ['youtube', 'vimeo', 'facebook', 'direct'] },
    challenge: { type: ChallengeConfigSchema },
    hints: [{ type: String }],
    prevLesson: {
      slug: { type: String },
      title: { type: String },
    },
    nextLesson: {
      slug: { type: String },
      title: { type: String },
    },
  },
  { _id: false }
);

const ModuleSchema = new Schema<ICourseModule>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    order: { type: Number, required: true },
    description: { type: String },
    lessons: { type: [LessonSchema], default: [] },
  },
  { _id: false }
);

const CourseSchema = new Schema<ICourse>(
  {
    id: { type: String, required: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    thumbnail: { type: String, default: '' },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
      index: true,
    },
    duration: { type: Number, default: 0 },
    xpReward: { type: Number, default: 0 },
    track: { type: String, index: true },
    lessonsCount: { type: Number, default: 0 },
    modulesCount: { type: Number, default: 0 },
    tags: [{ type: String, index: true }],
    prerequisites: [{ type: String }],
    learningObjectives: [{ type: String }],
    modules: { type: [ModuleSchema], default: [] },
    published: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

CourseSchema.index({ title: 'text', description: 'text', tags: 'text' });

export const Course: Model<ICourse> =
  mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);

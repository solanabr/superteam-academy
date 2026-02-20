import mongoose, { Document, Schema } from "mongoose";

// ─── Enums & Types ────────────────────────────────────────────────────────────

export type Difficulty = "beginner" | "intermediate" | "advanced";
export type CourseStatus = "draft" | "published" | "archived";
export type CourseTopic =
  | "solana-basics"
  | "smart-contracts"
  | "defi"
  | "nfts"
  | "tokens"
  | "web3-frontend"
  | "security"
  | "tooling";

export type ResourceType = "video" | "document" | "text";
export type TestType = "quiz" | "code_challenge";

// ─── Resource ─────────────────────────────────────────────────────────────────

export interface IResource {
  _id?: mongoose.Types.ObjectId;
  title: string;
  type: ResourceType;
  content?: string;   // For "text" type — raw markdown
  url?: string;       // For "video" or "document" type
  duration?: number;  // For videos — estimated minutes
  order: number;      // Position within milestone (max 5)
}

// ─── Test ─────────────────────────────────────────────────────────────────────

export interface IQuizOption {
  label: string;
  isCorrect: boolean;
}

export interface IQuizQuestion {
  _id?: mongoose.Types.ObjectId;
  question: string;
  options: IQuizOption[];
  explanation?: string; // Shown after answering — teaches the why
}

export interface ICodeChallenge {
  prompt: string;
  starterCode: string;
  language: "typescript" | "rust" | "javascript";
  testCases: {
    input: string;
    expectedOutput: string;
    description: string;
  }[];
}

export interface ITest {
  _id?: mongoose.Types.ObjectId;
  title: string;
  type: TestType;
  passThreshold: number;        // Always 80 (stored for flexibility)
  // Only one of these will be populated depending on type
  questions?: IQuizQuestion[];  // For "quiz" type
  codeChallenge?: ICodeChallenge; // For "code_challenge" type
}

// ─── Milestone ────────────────────────────────────────────────────────────────

export interface IMilestone {
  _id?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  order: number;          // 1 through 5
  resources: IResource[]; // Max 5 resources per milestone
  tests: ITest[];         // Admin decides how many and what type
  xpReward: number;       // Locked until course completion
}

// ─── Course ───────────────────────────────────────────────────────────────────

export interface ICourse extends Document {
  title: string;
  slug: string;
  sanityId?: string;

  description: string;
  shortDescription: string;
  thumbnail: string;
  tags: string[];

  difficulty: Difficulty;
  topic: CourseTopic;
  status: CourseStatus;

  milestones: IMilestone[];   // Always 5

  // Denormalized stats (for catalog page — no aggregation needed)
  totalXP: number;            // Sum of all milestone XP — auto-calculated
  duration: number;           // Sum of all resource durations — auto-calculated
  enrollmentCount: number;
  completionCount: number;

  author: {
    name: string;
    avatar?: string;
    title?: string;
  };

  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Sub-Schemas ──────────────────────────────────────────────────────────────

const ResourceSchema = new Schema<IResource>({
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ["video", "document", "text"],
    required: true,
  },
  content: { type: String },  // populated if type === "text"
  url: { type: String },      // populated if type === "video" | "document"
  duration: { type: Number }, // minutes, for videos
  order: { type: Number, required: true },
});

const QuizOptionSchema = new Schema<IQuizOption>(
  {
    label: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false }
);

const QuizQuestionSchema = new Schema<IQuizQuestion>({
  question: { type: String, required: true },
  options: [QuizOptionSchema],
  explanation: { type: String },
});

const CodeChallengeSchema = new Schema<ICodeChallenge>(
  {
    prompt: { type: String, required: true },
    starterCode: { type: String, required: true },
    language: {
      type: String,
      enum: ["typescript", "rust", "javascript"],
      default: "typescript",
    },
    testCases: [
      {
        input: { type: String, required: true },
        expectedOutput: { type: String, required: true },
        description: { type: String, required: true },
        _id: false,
      },
    ],
  },
  { _id: false }
);

const TestSchema = new Schema<ITest>({
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ["quiz", "code_challenge"],
    required: true,
  },
  passThreshold: { type: Number, default: 80 },
  questions: [QuizQuestionSchema],
  codeChallenge: { type: CodeChallengeSchema, default: undefined },
});

const MilestoneSchema = new Schema<IMilestone>({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  order: { type: Number, required: true, min: 1, max: 5 },
  resources: {
    type: [ResourceSchema],
    validate: {
      validator: (v: IResource[]) => v.length <= 5,
      message: "A milestone cannot have more than 5 resources",
    },
  },
  tests: [TestSchema],
  xpReward: { type: Number, required: true, default: 100 },
});

// ─── Course Schema ────────────────────────────────────────────────────────────

const CourseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    sanityId: { type: String, sparse: true },

    description: { type: String, required: true },
    shortDescription: { type: String, required: true, maxlength: 160 },
    thumbnail: { type: String, default: "" },
    tags: [{ type: String }],

    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true,
    },
    topic: {
      type: String,
      enum: [
        "solana-basics",
        "smart-contracts",
        "defi",
        "nfts",
        "tokens",
        "web3-frontend",
        "security",
        "tooling",
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },

    milestones: {
      type: [MilestoneSchema],
      validate: {
        validator: (v: IMilestone[]) => v.length === 5,
        message: "A course must have exactly 5 milestones",
      },
    },

    // Denormalized — auto-calculated in pre-save hook
    totalXP: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
    enrollmentCount: { type: Number, default: 0 },
    completionCount: { type: Number, default: 0 },

    author: {
      name: { type: String, required: true },
      avatar: { type: String },
      title: { type: String },
    },

    publishedAt: { type: Date },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

CourseSchema.index({ slug: 1 });
CourseSchema.index({ status: 1, difficulty: 1, topic: 1 }); // Catalog filters
CourseSchema.index({ tags: 1 });

// ─── Pre-save: Auto-calculate totalXP and duration ────────────────────────────

CourseSchema.pre("save", function (next) {
  let totalXP = 0;
  let duration = 0;

  this.milestones.forEach((milestone) => {
    totalXP += milestone.xpReward;

    milestone.resources.forEach((resource) => {
      if (resource.duration) duration += resource.duration;
    });
  });

  this.totalXP = totalXP;
  this.duration = duration;

  next();
});

export const Course = mongoose.model<ICourse>("Course", CourseSchema);
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITestCase {
  id: string;
  description: string;
  input?: unknown;
  expectedOutput: unknown;
  hidden?: boolean;
  timeout?: number;
}

export interface IChallenge extends Document {
  _id: mongoose.Types.ObjectId;
  id: string;
  slug: string;
  title: string;
  description: string;
  prompt: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  xp_reward: number;
  time_estimate: number;
  language: 'typescript' | 'javascript' | 'rust';
  starter_code: string;
  solution_code: string;
  test_cases: ITestCase[];
  function_name?: string;
  hints?: string[];
  tags?: string[];
  course_id?: string;
  lesson_id?: string;
  order?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const TestCaseSchema = new Schema<ITestCase>(
  {
    id: { type: String, required: true },
    description: { type: String, required: true },
    input: { type: Schema.Types.Mixed },
    expectedOutput: { type: Schema.Types.Mixed, required: true },
    hidden: { type: Boolean, default: false },
    timeout: { type: Number, default: 5000 },
  },
  { _id: false }
);

const ChallengeSchema = new Schema<IChallenge>(
  {
    id: { type: String, required: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    prompt: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'easy',
      index: true,
    },
    category: { type: String, required: true, index: true },
    xp_reward: { type: Number, default: 50 },
    time_estimate: { type: Number, default: 15 },
    language: {
      type: String,
      enum: ['typescript', 'javascript', 'rust'],
      default: 'typescript',
    },
    starter_code: { type: String, required: true },
    solution_code: { type: String, required: true },
    test_cases: { type: [TestCaseSchema], default: [] },
    function_name: { type: String },
    hints: [{ type: String }],
    tags: [{ type: String, index: true }],
    course_id: { type: String, index: true },
    lesson_id: { type: String },
    order: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

export const Challenge: Model<IChallenge> =
  mongoose.models.Challenge || mongoose.model<IChallenge>('Challenge', ChallengeSchema);

import mongoose, { Schema, type Document } from "mongoose";
import type { PracticeCategory, PracticeDifficulty } from "@/types/practice";

export interface IDailyChallenge extends Document {
  date: string;
  title: string;
  description: string;
  difficulty: PracticeDifficulty;
  category: PracticeCategory;
  language: "rust" | "typescript";
  xpReward: number;
  starterCode: string;
  solution: string;
  testCases: { id: string; name: string; input: string; expected: string }[];
  hints: string[];
  generatedAt: Date;
}

const DailyChallengeSchema = new Schema<IDailyChallenge>({
  date: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
  category: {
    type: String,
    enum: ["accounts", "transactions", "pdas", "tokens", "cpi", "serialization", "security", "anchor", "defi", "advanced"],
    required: true,
  },
  language: { type: String, enum: ["rust", "typescript"], required: true },
  xpReward: { type: Number, required: true },
  starterCode: { type: String, required: true },
  solution: { type: String, required: true },
  testCases: [
    {
      id: { type: String, required: true },
      name: { type: String, required: true },
      input: { type: String, default: "" },
      expected: { type: String, default: "" },
    },
  ],
  hints: { type: [String], default: [] },
  generatedAt: { type: Date, default: Date.now },
});

export const DailyChallenge =
  mongoose.models.DailyChallenge ||
  mongoose.model<IDailyChallenge>("DailyChallenge", DailyChallengeSchema);

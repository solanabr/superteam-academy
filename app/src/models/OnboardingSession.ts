import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOnboardingSession extends Document {
  _id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  skill_level: 'beginner' | 'intermediate' | 'advanced';
  interests: string[];
  goals: string[];
  learning_path_id?: string;
  profile_setup_complete: boolean;
  assessment_complete: boolean;
  profile_photo_set: boolean;
  bio_set: boolean;
  social_links_set: boolean;
  first_achievement_unlocked: boolean;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const OnboardingSessionSchema = new Schema<IOnboardingSession>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    skill_level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    interests: [
      {
        type: String,
        enum: ['web3', 'blockchain', 'solana', 'rust', 'frontend', 'backend', 'devops', 'security'],
      },
    ],
    goals: [
      {
        type: String,
        enum: [
          'learn_basics',
          'build_dapp',
          'contribute_to_projects',
          'get_job',
          'start_business',
          'improve_skills',
        ],
      },
    ],
    learning_path_id: {
      type: String,
    },
    profile_setup_complete: {
      type: Boolean,
      default: false,
    },
    assessment_complete: {
      type: Boolean,
      default: false,
    },
    profile_photo_set: {
      type: Boolean,
      default: false,
    },
    bio_set: {
      type: Boolean,
      default: false,
    },
    social_links_set: {
      type: Boolean,
      default: false,
    },
    first_achievement_unlocked: {
      type: Boolean,
      default: false,
    },
    completed_at: {
      type: Date,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Mark onboarding as complete when all steps are done
OnboardingSessionSchema.methods.checkCompletion = function () {
  if (this.assessment_complete && this.profile_setup_complete && this.first_achievement_unlocked) {
    this.completed_at = new Date();
  }
};

export const OnboardingSession: Model<IOnboardingSession> =
  mongoose.models.OnboardingSession ||
  mongoose.model<IOnboardingSession>('OnboardingSession', OnboardingSessionSchema);

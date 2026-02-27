import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICertificate extends Document {
  user_id: mongoose.Types.ObjectId;
  course_id: string;
  course_slug: string;
  course_name: string;
  course_description: string;
  credential_id: string;
  recipient_name: string;
  recipient_address: string;
  issuer_name: string;
  issuer_logo: string;
  grade: string;
  xp_earned: number;
  lessons_completed: number;
  challenges_solved: number;
  completion_time: string;
  skills: string[];
  status: 'pending' | 'minted' | 'verified' | 'revoked';
  on_chain: boolean;
  mint_address?: string;
  transaction_signature?: string;
  metadata_uri?: string;
  issued_at: Date;
  expires_at?: Date;
  verified_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const CertificateSchema = new Schema<ICertificate>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    course_id: {
      type: String,
      required: true,
    },
    course_slug: {
      type: String,
      required: true,
    },
    course_name: {
      type: String,
      required: true,
    },
    course_description: {
      type: String,
      default: '',
    },
    credential_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    recipient_name: {
      type: String,
      required: true,
    },
    recipient_address: {
      type: String,
      required: true,
      index: true,
    },
    issuer_name: {
      type: String,
      default: 'CapySolBuild Academy',
    },
    issuer_logo: {
      type: String,
      default: '/logo.png',
    },
    grade: {
      type: String,
      default: 'Pass',
    },
    xp_earned: {
      type: Number,
      default: 0,
    },
    lessons_completed: {
      type: Number,
      default: 0,
    },
    challenges_solved: {
      type: Number,
      default: 0,
    },
    completion_time: {
      type: String,
      default: '',
    },
    skills: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'minted', 'verified', 'revoked'],
      default: 'pending',
    },
    on_chain: {
      type: Boolean,
      default: false,
    },
    mint_address: {
      type: String,
      sparse: true,
    },
    transaction_signature: {
      type: String,
      sparse: true,
    },
    metadata_uri: {
      type: String,
      sparse: true,
    },
    issued_at: {
      type: Date,
      default: Date.now,
    },
    expires_at: {
      type: Date,
    },
    verified_at: {
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

// Indexes
CertificateSchema.index({ user_id: 1, course_id: 1 }, { unique: true });

export const Certificate: Model<ICertificate> =
  mongoose.models.Certificate || mongoose.model<ICertificate>('Certificate', CertificateSchema);

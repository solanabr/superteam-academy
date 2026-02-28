import mongoose, { Schema, type Document } from "mongoose";

export interface IEndorsement extends Document {
  endorser: string;
  endorsee: string;
  message: string | null;
  txHash: string | null;
  createdAt: Date;
}

const EndorsementSchema = new Schema<IEndorsement>(
  {
    endorser: { type: String, required: true },
    endorsee: { type: String, required: true },
    message: { type: String, default: null },
    txHash: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

EndorsementSchema.index({ endorser: 1, endorsee: 1 }, { unique: true });
EndorsementSchema.index({ endorsee: 1 });

export const Endorsement =
  mongoose.models.Endorsement ||
  mongoose.model<IEndorsement>("Endorsement", EndorsementSchema);

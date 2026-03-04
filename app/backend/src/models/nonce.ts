import mongoose, { Document, Schema } from "mongoose";

export interface INonce extends Document {
  publicKey: string;
  nonce: string;
  expiresAt: Date;
  createdAt: Date;
}

const NonceSchema = new Schema<INonce>(
  {
    publicKey: { type: String, required: true, unique: true },
    nonce: { type: String, required: true },
    // Auto-delete from MongoDB after expiry (TTL index)
    expiresAt: { type: Date, required: true },
  },
  {
    timestamps: true,
  }
);

// MongoDB will automatically delete the document after expiresAt
NonceSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
NonceSchema.index({ publicKey: 1 });

export const Nonce = mongoose.model<INonce>("Nonce", NonceSchema);
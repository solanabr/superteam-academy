import mongoose, { Document, Schema } from "mongoose";

export interface IWalletAuth extends Document {
  userId: mongoose.Types.ObjectId;
  publicKey: string;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WalletAuthSchema = new Schema<IWalletAuth>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    publicKey: { type: String, required: true, unique: true, trim: true },
    isPrimary: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

WalletAuthSchema.index({ publicKey: 1 });
WalletAuthSchema.index({ userId: 1 });

export const WalletAuth = mongoose.model<IWalletAuth>("WalletAuth", WalletAuthSchema);
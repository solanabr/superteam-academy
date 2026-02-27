import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPartner extends Document {
  name: string;
  logo_url: string;
  website_url?: string;
  is_active: boolean;
  order: number;
  created_at: Date;
  updated_at: Date;
}

const PartnerSchema = new Schema<IPartner>(
  {
    name: { type: String, required: true },
    logo_url: { type: String, required: true },
    website_url: { type: String },
    is_active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

PartnerSchema.index({ is_active: 1, order: 1 });

export const Partner: Model<IPartner> =
  mongoose.models.Partner || mongoose.model<IPartner>('Partner', PartnerSchema);

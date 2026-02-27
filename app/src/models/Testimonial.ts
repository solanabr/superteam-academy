import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITestimonial extends Document {
  name: string;
  role: string;
  avatar_url?: string;
  content: string;
  rating: number;
  is_active: boolean;
  order: number;
  created_at: Date;
  updated_at: Date;
}

const TestimonialSchema = new Schema<ITestimonial>(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    avatar_url: { type: String },
    content: { type: String, required: true },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    is_active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

TestimonialSchema.index({ is_active: 1, order: 1 });

export const Testimonial: Model<ITestimonial> =
  mongoose.models.Testimonial || mongoose.model<ITestimonial>('Testimonial', TestimonialSchema);

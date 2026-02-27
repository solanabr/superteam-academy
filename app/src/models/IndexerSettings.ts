/**
 * IndexerSettings Mongoose Model
 *
 * Singleton document that stores the admin's preferred indexer
 * provider and associated API keys / RPC URLs.
 */
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IIndexerSettings extends Document {
  key: string; // always "indexer"
  activeProvider: string; // 'custom' | 'helius' | 'alchemy'
  heliusApiKey: string;
  heliusRpcUrl: string;
  alchemyApiKey: string;
  alchemyRpcUrl: string;
  customRpcUrl: string;
  updatedAt: Date;
}

const IndexerSettingsSchema = new Schema<IIndexerSettings>(
  {
    key: { type: String, required: true, unique: true, default: 'indexer' },
    activeProvider: {
      type: String,
      enum: ['custom', 'helius', 'alchemy'],
      default: 'custom',
    },
    heliusApiKey: { type: String, default: '' },
    heliusRpcUrl: { type: String, default: '' },
    alchemyApiKey: { type: String, default: '' },
    alchemyRpcUrl: { type: String, default: '' },
    customRpcUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

export const IndexerSettingsModel: Model<IIndexerSettings> =
  mongoose.models.IndexerSettings ||
  mongoose.model<IIndexerSettings>('IndexerSettings', IndexerSettingsSchema);

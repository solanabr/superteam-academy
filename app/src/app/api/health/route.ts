
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET() {
  let error = null;
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }
  } catch (e) {
    error = String(e);
  }

  const envCheck = {
    hasMongoUri: !!process.env.MONGODB_URI,
    hasSolanaKey: !!process.env.SOLANA_PRIVATE_KEY,
    hasXpMintAddress: !!process.env.NEXT_PUBLIC_XP_MINT_ADDRESS,
    mongoConnectionState: mongoose.connection.readyState,
    nodeEnv: process.env.NODE_ENV,
    error,
  };

  return NextResponse.json({ status: error ? 'error' : 'ok', env: envCheck });
}

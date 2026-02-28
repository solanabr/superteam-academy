import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV ?? 'development',
    services: {
      sanity: Boolean(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID),
      sentry: Boolean(process.env.SENTRY_ORG),
      solanaRpc: process.env.NEXT_PUBLIC_RPC_ENDPOINT ?? 'https://api.devnet.solana.com',
    },
  });
}

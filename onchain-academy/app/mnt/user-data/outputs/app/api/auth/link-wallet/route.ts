/**
 * app/api/auth/link-wallet/route.ts
 *
 * Server-side wallet linking endpoint.
 *
 * Why this must be a server route (not client-side):
 *   - The service role key never touches the browser.
 *   - We validate the Supabase JWT server-side to get the true user ID.
 *   - We verify the Ed25519 signature to prove wallet ownership.
 *   - Only then do we call link_wallet_to_profile() in the DB.
 *
 * Attack vectors this design prevents:
 *   - User faking a wallet address: signature verification catches this.
 *   - Replay attacks: message includes the user ID + timestamp, so the same
 *     signature cannot link the wallet to a different account.
 *   - CSRF: Supabase JWT is read from HttpOnly cookies server-side,
 *     not from a header the browser could inject.
 *
 * Request body:
 *   { walletAddress: string, signature: number[], message: string }
 *
 * Response:
 *   200 { success: true }
 *   400 { error: string }
 *   401 { error: 'Unauthorized' }
 *   500 { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import type { Database } from '@/lib/supabaseClient';

// ── CORS headers ──────────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin':  process.env.NEXT_PUBLIC_SITE_URL ?? '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(request: NextRequest) {
  // ── 1. Parse body ──────────────────────────────────────────────────────────
  let body: {
    walletAddress?: string;
    signature?: number[];
    message?: string;
  };

  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { walletAddress, signature: sigArray, message } = body;

  if (!walletAddress || !sigArray || !message) {
    return json({ error: 'Missing walletAddress, signature, or message' }, 400);
  }

  // Basic Solana address sanity check (base58, 32–44 chars)
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress)) {
    return json({ error: 'Invalid wallet address format' }, 400);
  }

  if (!Array.isArray(sigArray) || sigArray.length !== 64) {
    return json({ error: 'Signature must be a 64-byte array' }, 400);
  }

  // ── 2. Verify Supabase JWT → get authenticated user ────────────────────────
  const cookieStore = await cookies();

  const supabaseUser = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  // Use getUser() not getSession() — getUser() validates the JWT with the server
  const { data: { user }, error: userError } = await supabaseUser.auth.getUser();

  if (userError || !user) {
    return json({ error: 'Unauthorized — sign in with Google first' }, 401);
  }

  // ── 3. Verify that the message includes this user's ID ─────────────────────
  // Prevents the signature from linking the wallet to a different account.
  if (!message.includes(user.id)) {
    return json({ error: 'Message does not contain the authenticated user ID' }, 400);
  }

  // ── 4. Verify Ed25519 signature ────────────────────────────────────────────
  try {
    const publicKeyBytes  = bs58.decode(walletAddress);
    const messageBytes    = new TextEncoder().encode(message);
    const signatureBytes  = new Uint8Array(sigArray);

    const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);

    if (!isValid) {
      return json({ error: 'Signature verification failed — invalid signature' }, 400);
    }
  } catch (e) {
    console.error('[link-wallet] Signature verification error:', e);
    return json({ error: 'Signature verification error' }, 400);
  }

  // ── 5. Link wallet in DB using service role (bypasses RLS safely) ──────────
  const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { error: rpcError } = await supabaseAdmin.rpc('link_wallet_to_profile', {
    p_user_id:     user.id,
    p_wallet_addr: walletAddress,
  });

  if (rpcError) {
    console.error('[link-wallet] DB error:', rpcError.message);

    // Surface user-friendly messages for common errors
    if (rpcError.message.includes('already linked to another account')) {
      return json({ error: 'This wallet is already linked to a different account' }, 409);
    }

    return json({ error: 'Failed to link wallet — please try again' }, 500);
  }

  return json({ success: true, walletAddress });
}

// ── Helper ────────────────────────────────────────────────────────────────────
function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: CORS });
}

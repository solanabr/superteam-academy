/**
 * app/api/auth/link-wallet/route.ts
 *
 * Links a verified Solana wallet address to the authenticated user's profile.
 *
 * Flow:
 *   1. Validate request body (walletAddress, signature, message).
 *   2. Authenticate the caller via Supabase JWT (getUser).
 *   3. Verify the signed message contains the authenticated userId (replay-attack guard).
 *   4. Verify the Ed25519 signature against the walletAddress public key (tweetnacl).
 *   5. Call the `link_wallet_to_profile` Supabase RPC.
 *   6. Return 200 { success, walletAddress } on success.
 *
 * Every response — including error responses — carries CORS headers so the
 * browser's preflight (OPTIONS) and subsequent POST both succeed from any origin.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies }                   from 'next/headers';
import { createServerClient }        from '@supabase/ssr';
import { createClient }              from '@supabase/supabase-js';
import nacl                          from 'tweetnacl';
import bs58                          from 'bs58';

// ─── CORS headers attached to every response ──────────────────────────────────

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ─── Small helpers ─────────────────────────────────────────────────────────────

function json(data: unknown, status: number): NextResponse {
  return NextResponse.json(data, { status, headers: CORS_HEADERS });
}

// ─── OPTIONS — CORS preflight ──────────────────────────────────────────────────

export function OPTIONS(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// ─── POST — link wallet ────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {

  // ── 1. Parse body ────────────────────────────────────────────────────────────

  let body: Record<string, unknown>;

  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { walletAddress, signature, message } = body;

  // ── 2. Presence checks ───────────────────────────────────────────────────────

  if (!walletAddress) return json({ error: 'Missing walletAddress'  }, 400);
  if (!signature)     return json({ error: 'Missing signature'      }, 400);
  if (!message)       return json({ error: 'Missing message'        }, 400);

  // ── 3. Wallet address format — base58, length 32-44 chars ───────────────────

  if (
    typeof walletAddress !== 'string'         ||
    walletAddress.length < 32                 ||
    walletAddress.length > 44                 ||
    !/^[1-9A-HJ-NP-Za-km-z]+$/.test(walletAddress)   // standard base58 alphabet (no 0, O, I, l)
  ) {
    return json({ error: 'Invalid wallet address format' }, 400);
  }

  // ── 4. Signature must be a 64-element array ───────────────────────────────

  if (
    !Array.isArray(signature)  ||
    signature.length !== 64
  ) {
    return json({ error: 'signature must be a 64-byte array' }, 400);
  }

  // ── 5. Authenticate caller via Supabase JWT ──────────────────────────────────

  const cookieStore = await cookies();

  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL  ?? 'http://localhost',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'anon',
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list: { name: string; value: string; options: any }[]) =>
          list.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
      },
    }
  );

  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

  if (authError || !user) {
    return json(
      { error: 'Unauthorized — please sign in before linking a wallet.' },
      401
    );
  }

  // ── 6. Message must contain the authenticated userId (replay-attack guard) ───

  if (typeof message !== 'string' || !message.includes(user.id)) {
    return json(
      { error: 'Message does not contain the authenticated user ID.' },
      400
    );
  }

  // ── 7. Ed25519 signature verification ────────────────────────────────────────

  let pubKeyBytes: Uint8Array;
  try {
    pubKeyBytes = bs58.decode(walletAddress);
  } catch {
    return json({ error: 'Invalid wallet address format' }, 400);
  }

  const messageBytes  = new TextEncoder().encode(message as string);
  const signatureBytes = new Uint8Array(signature as number[]);

  const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, pubKeyBytes);

  if (!isValid) {
    return json({ error: 'Signature verification failed.' }, 400);
  }

  // ── 8. Persist via Supabase RPC ──────────────────────────────────────────────

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL      ?? 'http://localhost',
    process.env.SUPABASE_SERVICE_ROLE_KEY     ?? 'service-role'
  );

  const { error: rpcError } = await supabaseAdmin.rpc('link_wallet_to_profile', {
    p_user_id:     user.id,
    p_wallet_addr: walletAddress,
  });

  if (rpcError) {
    if (rpcError.message.toLowerCase().includes('already linked')) {
      return json(
        { error: 'This wallet is already linked to a different account.' },
        409
      );
    }
    return json({ error: 'Database error — please try again later.' }, 500);
  }

  // ── 9. Success ───────────────────────────────────────────────────────────────

  return json({ success: true, walletAddress }, 200);
}

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { verifySIWSRequest } from "@/lib/solana/verify-siws";
import { generateWalletName } from "@/lib/utils/generate-wallet-name";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";
import { retryPendingOnchainActions } from "@/lib/solana/onchain-queue";
import type { Database } from "@/lib/supabase/types";

interface WalletAuthRequest {
  message: string;
  signature: number[];
  publicKey: string;
}

function walletEmail(publicKey: string): string {
  return `${publicKey}@wallet.superteam-lms.local`;
}

export async function POST(request: NextRequest) {
  try {
    // Env var guards
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      console.error("Missing required Supabase environment variables");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const bodyText = await request.text();
    if (bodyText.length > 10_000) {
      return NextResponse.json({ error: "Request too large" }, { status: 413 });
    }
    const body = JSON.parse(bodyText) as WalletAuthRequest;

    // Verify SIWS request (nonce, domain, expiry, signature)
    const verification = await verifySIWSRequest({
      message: body.message,
      signature: body.signature,
      publicKey: body.publicKey,
      expectedHost: request.headers.get("host") ?? "",
    });

    if (!verification.success) {
      return NextResponse.json(
        { error: verification.error },
        { status: verification.statusCode ?? 400 }
      );
    }

    // Admin client for user management (no cookies needed)
    const supabaseAdmin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const syntheticEmail = walletEmail(body.publicKey);

    // Check if wallet already has an account (e.g. Google user who linked this wallet)
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("wallet_address", body.publicKey)
      .maybeSingle();

    let authEmail = syntheticEmail;

    if (existingProfile) {
      // Wallet is linked to an existing account — resolve their actual auth email
      // so the magic link logs into the CORRECT user (not a new synthetic one).
      const { data: existingUser } = await supabaseAdmin.auth.admin.getUserById(
        existingProfile.id
      );
      if (existingUser?.user?.email) {
        authEmail = existingUser.user.email;
      }
    } else {
      // No account with this wallet — create a new user with synthetic email
      const { error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: syntheticEmail,
        email_confirm: true,
        user_metadata: {
          wallet_address: body.publicKey,
          username: `user_${body.publicKey.slice(0, 8)}`,
        },
      });

      // If user already exists, that's fine — we'll generate a magic link for them
      if (
        createError &&
        !createError.message.includes("already been registered")
      ) {
        console.error("User creation error:", createError.message);
        return NextResponse.json(
          { error: "Authentication failed" },
          { status: 500 }
        );
      }
    }

    // Generate magic link → extract hashed_token
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: authEmail,
      });

    if (linkError || !linkData) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 500 }
      );
    }

    const tokenHash = linkData.properties.hashed_token;

    // Use cookies() from next/headers — the Supabase-recommended pattern
    const cookieStore = await cookies();

    const supabaseAnon = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // Verify OTP — cookies are set via cookieStore.set() in setAll
    const { data: sessionData, error: verifyError } =
      await supabaseAnon.auth.verifyOtp({
        type: "magiclink",
        token_hash: tokenHash,
      });

    if (verifyError || !sessionData.session) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 500 }
      );
    }

    const userId = sessionData.session.user.id;

    // Update profile with wallet address
    await supabaseAdmin
      .from("profiles")
      .update({ wallet_address: body.publicKey })
      .eq("id", userId);

    // Assign a fun generated name if profile still has the placeholder
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .single();

    if (profile?.username?.startsWith("user_")) {
      // Retry up to 5 times in case of (extremely unlikely) uniqueness collision
      for (let attempt = 0; attempt < 5; attempt++) {
        const name = generateWalletName();
        const { error: nameError } = await supabaseAdmin
          .from("profiles")
          .update({ username: name })
          .eq("id", userId);
        if (!nameError) break;
      }
    }

    retryPendingOnchainActions(userId).catch((err: unknown) =>
      logError({
        errorId: ERROR_IDS.WALLET_AUTH_FAILED,
        error: err instanceof Error ? err : new Error(String(err)),
        context: { note: "retryPendingOnchainActions failed", userId },
      })
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    logError({
      errorId: ERROR_IDS.WALLET_AUTH_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: { route: "/api/auth/wallet" },
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

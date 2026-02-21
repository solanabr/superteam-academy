import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import nacl from "tweetnacl";
import bs58 from "bs58";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getSessionTokens(
  email: string,
  password: string,
  walletAddress: string
): Promise<{ access_token: string; refresh_token: string; userId: string; isNew: boolean } | null> {
  // Try to sign in first (existing user)
  const { data: signInData } =
    await supabaseAdmin.auth.signInWithPassword({ email, password });

  if (signInData?.session) {
    return {
      access_token: signInData.session.access_token,
      refresh_token: signInData.session.refresh_token,
      userId: signInData.session.user.id,
      isNew: false,
    };
  }

  // Create a new user
  const { data: signUpData, error: signUpError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        wallet_address: walletAddress,
        username: `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`,
        full_name: `Wallet ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`,
      },
    });

  if (signUpError || !signUpData.user) {
    return null;
  }

  // Sign in the newly created user
  const { data: newSession } =
    await supabaseAdmin.auth.signInWithPassword({ email, password });

  if (!newSession?.session) {
    return null;
  }

  return {
    access_token: newSession.session.access_token,
    refresh_token: newSession.session.refresh_token,
    userId: signUpData.user.id,
    isNew: true,
  };
}

async function ensureProfileExists(userId: string, walletAddress: string) {
  const displayName = `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;

  const { error } = await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        id: userId,
        wallet_address: walletAddress,
        username: walletAddress.slice(0, 8).toLowerCase(),
        display_name: `Wallet ${displayName}`,
        bio: "",
        is_public: true,
        preferred_language: "en",
        theme: "light",
      },
      { onConflict: "id", ignoreDuplicates: true }
    );

  if (error) {
    console.error("[Wallet Auth] Failed to ensure profile:", error.message);
  }
}

export async function POST(request: Request) {
  try {
    const { walletAddress, signature, message } = await request.json();

    if (!walletAddress || !signature || !message) {
      return NextResponse.json(
        { error: "Missing walletAddress, signature, or message" },
        { status: 400 }
      );
    }

    // Verify the signature
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = bs58.decode(walletAddress);

    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Check if message contains expected format (prevent replay)
    if (!message.includes("Superteam Academy") || !message.includes(walletAddress)) {
      return NextResponse.json(
        { error: "Invalid message format" },
        { status: 400 }
      );
    }

    // Use wallet address as a deterministic email for Supabase auth
    const email = `${walletAddress.toLowerCase()}@wallet.superteam.academy`;
    const password = `wallet_${walletAddress}_${process.env.SUPABASE_SERVICE_ROLE_KEY!.slice(-16)}`;

    const tokens = await getSessionTokens(email, password, walletAddress);

    if (!tokens) {
      return NextResponse.json(
        { error: "Failed to authenticate wallet" },
        { status: 500 }
      );
    }

    // Ensure profile row exists (admin client bypasses RLS)
    await ensureProfileExists(tokens.userId, walletAddress);

    // Set session cookies using the SSR server client — same as OAuth callback
    const supabaseServer = await createSupabaseServerClient();
    await supabaseServer.auth.setSession({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Wallet auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bs58 from "bs58";
import nacl from "tweetnacl";
import crypto from "crypto";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Generate a deterministic password from wallet address
function generateWalletPassword(walletAddress: string): string {
  return crypto
    .createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback-secret")
    .update(walletAddress)
    .digest("hex")
    .slice(0, 32);
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Wallet auth not configured" },
        { status: 503 }
      );
    }

    const { walletAddress, signature, message } = await request.json();

    if (!walletAddress || !signature || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    const email = `${walletAddress.slice(0, 8)}@wallet.caminho.dev`;
    const password = generateWalletPassword(walletAddress);

    // First, check if user exists by wallet
    const { data: existingWallet, error: walletError } = await supabaseAdmin
      .from("linked_wallets")
      .select("user_id")
      .eq("wallet_address", walletAddress)
      .single();

    if (walletError && walletError.code !== "PGRST116") {
      console.error("Error checking existing wallet:", walletError);
    }

    if (existingWallet?.user_id) {
      // User exists - update their password
      console.log("Existing user found:", existingWallet.user_id);
      
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingWallet.user_id,
        { 
          password,
          user_metadata: {
            wallet_address: walletAddress,
            auth_method: "wallet",
          }
        }
      );

      if (updateError) {
        console.error("Failed to update user password:", updateError);
        return NextResponse.json(
          { error: "Failed to update credentials: " + updateError.message },
          { status: 500 }
        );
      }

      console.log("User password updated successfully");

      // Get the user's email
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(existingWallet.user_id);
      
      if (userError || !userData.user) {
        console.error("Failed to get user data:", userError);
        return NextResponse.json(
          { error: "Failed to retrieve user data" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        email: userData.user.email,
        password,
        isNewUser: false,
      });
    }

    // Create new user
    console.log("Creating new user for wallet:", walletAddress);
    
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        wallet_address: walletAddress,
        display_name: `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`,
        auth_method: "wallet",
      },
    });

    if (createError || !newUser.user) {
      console.error("Failed to create user:", createError);
      
      // Check if user already exists (race condition)
      if (createError?.message?.includes("already been registered")) {
        return NextResponse.json(
          { error: "Wallet already registered. Please try signing in again." },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: createError?.message || "Failed to create user" },
        { status: 500 }
      );
    }

    console.log("New user created:", newUser.user.id);

    // Create profile
    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: newUser.user.id,
      display_name: `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`,
      username: `wallet_${walletAddress.slice(0, 6)}`,
    });

    if (profileError) {
      console.error("Failed to create profile:", profileError);
      // Don't fail here, user is created
    }

    // Link wallet
    const { error: linkError } = await supabaseAdmin.from("linked_wallets").insert({
      user_id: newUser.user.id,
      wallet_address: walletAddress,
      is_primary: true,
    });

    if (linkError) {
      console.error("Failed to link wallet:", linkError);
      // Don't fail here, user is created
    }

    console.log("Wallet linked successfully");

    return NextResponse.json({
      success: true,
      email,
      password,
      isNewUser: true,
    });
  } catch (error) {
    console.error("Wallet auth error:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
}

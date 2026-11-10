import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { xAccountOf } from "@/lib/profiles/x-account";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";
import { serverEnv } from "@/lib/env.server";

/**
 * The X account linked to the signed-in profile (`profiles.x_id`, `x_username`).
 *
 * Settings links X with `supabase.auth.linkIdentity({ provider: "x" })`, a
 * full-page OAuth round trip that leaves an `x` identity on the auth user.
 * POST copies that identity onto the profile; DELETE drops the identity and
 * clears the columns. Both read the identity from the session, never from the
 * body, and write with the service role: the columns are locked to it because
 * the handle is shown publicly as an account the author proved they own.
 *
 * X is not a sign-in method (no sign-in screen offers it), so dropping it is
 * not subject to /api/auth/unlink's "keep a way back in" rules.
 */

async function sessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { supabase, user: error ? null : user };
}

function configured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && serverEnv.SUPABASE_SERVICE_ROLE_KEY
  );
}

function serverError(err: unknown, method: string) {
  logError({
    errorId: ERROR_IDS.X_ACCOUNT_FAILED,
    error: err instanceof Error ? err : new Error(String(err)),
    context: { route: "/api/auth/x-account", method },
  });
  return NextResponse.json({ error: "xAccountFailed" }, { status: 500 });
}

export async function POST() {
  try {
    if (!configured()) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const { user } = await sessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const identity = user.identities?.find((id) => id.provider === "x");
    if (!identity) {
      return NextResponse.json({ error: "xNotLinked" }, { status: 400 });
    }
    const account = xAccountOf(identity);
    if (!account) {
      return NextResponse.json({ error: "xIdentityInvalid" }, { status: 422 });
    }

    const { error } = await createAdminClient()
      .from("profiles")
      .update({ x_id: account.id, x_username: account.username })
      .eq("id", user.id);

    if (error) {
      // x_id is unique: the X account is already on another profile.
      if (error.code === "23505") {
        return NextResponse.json({ error: "xAlreadyLinked" }, { status: 409 });
      }
      return serverError(new Error(error.message), "POST");
    }

    return NextResponse.json({ xUsername: account.username });
  } catch (err: unknown) {
    return serverError(err, "POST");
  }
}

export async function DELETE() {
  try {
    if (!configured()) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const { supabase, user } = await sessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const identity = user.identities?.find((id) => id.provider === "x");
    if (identity) {
      const { error } = await supabase.auth.unlinkIdentity(identity);
      if (error) return serverError(new Error(error.message), "DELETE");
    }

    const { error } = await createAdminClient()
      .from("profiles")
      .update({ x_id: null, x_username: null })
      .eq("id", user.id);
    if (error) return serverError(new Error(error.message), "DELETE");

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return serverError(err, "DELETE");
  }
}

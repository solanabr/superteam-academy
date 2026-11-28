// Seed the walk stack through its service role: one test learner and one test
// admin. Safe to run again: it updates the rows it finds.
//
// - Enrolled means a row in `enrollments` for the user and the course id. The
//   lesson page reads it with the learner's own session.
// - The course is visible only when `onchain_deployments` has it as synced and
//   active (lib/content/deployments.ts).
// - Admin means a row in `admin_users` (lib/admin/auth.ts).

import { createClient } from "@supabase/supabase-js";
import { Keypair } from "@solana/web3.js";
import { PILOT, USERS, fail, requireStack, userPassword } from "./lib.mjs";

function check(step, { error }) {
  if (error) fail(`seed: ${step}: ${error.message}`);
}

async function ensureUser(db, { email }, password) {
  const list = await db.auth.admin.listUsers({ perPage: 1000 });
  check("list users", list);
  const existing = list.data.users.find((user) => user.email === email);
  if (existing) {
    const update = await db.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    });
    check(`update ${email}`, update);
    return existing.id;
  }
  const created = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  check(`create ${email}`, created);
  return created.data.user.id;
}

export async function seed() {
  const stack = requireStack();
  const db = createClient(stack.url, stack.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const password = (user) => userPassword(stack.serviceRoleKey, user.email);
  const learnerId = await ensureUser(
    db,
    USERS.learner,
    password(USERS.learner)
  );
  const adminId = await ensureUser(db, USERS.admin, password(USERS.admin));

  // A wallet address nobody holds the key for. Without a linked wallet the
  // lesson page shows the "link a wallet" notice instead of the normal state.
  const profile = await db
    .from("profiles")
    .select("wallet_address")
    .eq("id", learnerId)
    .single();
  check("read learner profile", profile);
  const wallet =
    profile.data.wallet_address ?? Keypair.generate().publicKey.toBase58();

  // The auth trigger made the profile rows; give them their test names.
  check(
    "learner profile",
    await db
      .from("profiles")
      .update({
        username: USERS.learner.username,
        wallet_address: wallet,
        wallet_kind: "external",
      })
      .eq("id", learnerId)
  );
  check(
    "admin profile",
    await db
      .from("profiles")
      .update({ username: USERS.admin.username })
      .eq("id", adminId)
  );

  check(
    "course deployment",
    await db.from("onchain_deployments").upsert({
      content_id: PILOT.courseId,
      kind: "course",
      status: "synced",
      is_active: true,
    })
  );
  check(
    "enrollment",
    await db.from("enrollments").upsert(
      {
        user_id: learnerId,
        course_id: PILOT.courseId,
        wallet_address: wallet,
      },
      { onConflict: "user_id,course_id" }
    )
  );
  check(
    "admin allowlist",
    await db
      .from("admin_users")
      .upsert({ user_id: adminId, granted_by: "walk seed" })
  );

  console.log(
    `[walk] seeded ${USERS.learner.email} (enrolled in ${PILOT.courseSlug}) and ${USERS.admin.email} (admin)`
  );
}

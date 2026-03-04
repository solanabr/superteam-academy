import { supabaseRest } from "./server-supabase";

type UserRow = {
  learner_id: string;
  display_name: string | null;
  email: string | null;
  wallet_address: string | null;
  auth_method: string;
};

export async function ensureUser(learnerId: string) {
  if (!supabaseRest.hasConfig()) return;
  const existingRows = await supabaseRest.select<UserRow>({
    table: "academy_users",
    select: "learner_id,display_name,email,wallet_address,auth_method",
    filters: { learner_id: `eq.${learnerId}` },
    limit: 1,
  });
  if (existingRows?.[0]) {
    return;
  }
  await supabaseRest.upsert<UserRow>(
    "academy_users",
    {
      learner_id: learnerId,
      auth_method: "supabase",
      wallet_address: null,
    },
    "learner_id",
  );
}

export function computeStreak(activeDays: string[]) {
  if (activeDays.length === 0) {
    return { current: 0, longest: 0 };
  }
  const sorted = [...activeDays]
    .map((d) => new Date(`${d}T00:00:00.000Z`))
    .sort((a, b) => a.getTime() - b.getTime());

  let longest = 1;
  let running = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    const diff = Math.round((sorted[i].getTime() - sorted[i - 1].getTime()) / 86400000);
    if (diff === 1) {
      running += 1;
      longest = Math.max(longest, running);
    } else if (diff > 1) {
      running = 1;
    }
  }

  let current = 1;
  for (let i = sorted.length - 1; i > 0; i -= 1) {
    const diff = Math.round((sorted[i].getTime() - sorted[i - 1].getTime()) / 86400000);
    if (diff === 1) {
      current += 1;
    } else {
      break;
    }
  }

  return { current, longest };
}

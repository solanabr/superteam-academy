import { ModerationClient } from "./moderation-client";

/**
 * `/admin/moderation` — the community-flags surface, moved from the stacked
 * admin page (SP3-A Task 2). The flag-count badge state lives in the local
 * `ModerationClient` wrapper (it needs `useState` for `onCountChange`), not
 * in any shared layout/global fetch.
 */
export default function AdminModerationPage() {
  return <ModerationClient />;
}

import { InsightsClient } from "./insights-client";

/**
 * `/admin/insights` — platform-behaviour aggregates (#836): AI-tutor usage,
 * spend, and learning activity. Read-only; all data arrives pre-aggregated
 * from `/api/admin/insights`.
 */
export default function AdminInsightsPage() {
  return <InsightsClient />;
}

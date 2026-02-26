/** Swallows requests for third-party source maps (e.g. PostHog) to avoid 404 noise. */
export function GET() {
  return new Response(null, { status: 204 });
}

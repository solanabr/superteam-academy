/**
 * OPERATOR TOOL — dormant registration tooling for the Helius program webhook.
 * The live webhook was registered out-of-band and is not managed from the app;
 * this module is kept as ops tooling for re-registration (a cluster move, a
 * rotated secret, a new deployment URL), with zero app imports BY DESIGN. It
 * lives under scripts/ precisely because an unimported file is the norm here.
 *
 * Standalone: plain `process.env` + Node's built-in `fetch`, no `@/` aliases and
 * no `server-only`, so it runs under `npx tsx` outside the Next build.
 *
 *   HELIUS_API_KEY=... HELIUS_WEBHOOK_SECRET=... NEXT_PUBLIC_PROGRAM_ID=... \
 *   NEXT_PUBLIC_SOLANA_NETWORK=devnet npx tsx -e \
 *     "import('./scripts/helius-webhook-config.ts').then(m => m.listWebhooks()).then(console.log)"
 */
const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID;
const WEBHOOK_SECRET = process.env.HELIUS_WEBHOOK_SECRET;
const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";

interface HeliusWebhookResponse {
  webhookID: string;
  wallet: string;
  webhookURL: string;
  transactionTypes: string[];
  accountAddresses: string[];
  webhookType: string;
}

/**
 * DOC AMBIGUITY (left as-is deliberately): Helius documents the webhook REST
 * API under the single host `api.helius.xyz`, with the network selected by the
 * API KEY's own cluster rather than by hostname; the per-cluster
 * `api-{mainnet,devnet}.helius-rpc.com` hosts below are what this code has
 * always used and what the out-of-band registration was done against. Changing
 * the host is a separate, testable change — the enum fix is not.
 */
function getHeliusBaseUrl(): string {
  return NETWORK === "mainnet-beta"
    ? "https://api-mainnet.helius-rpc.com"
    : "https://api-devnet.helius-rpc.com";
}

/**
 * `webhookType` is a documented ENUM, and devnet is a distinct VALUE — not a
 * property of the host or the key. Registering with "raw" while targeting
 * devnet is the classic silent-drift failure: the call succeeds and the webhook
 * simply never fires. ("enhanced"/"enhancedDevnet" are the parsed-payload
 * variants; the decoder here consumes RAW transactions.)
 */
function rawWebhookType(): "raw" | "rawDevnet" {
  return NETWORK === "mainnet-beta" ? "raw" : "rawDevnet";
}

export async function registerWebhook(
  webhookUrl: string
): Promise<HeliusWebhookResponse> {
  if (!HELIUS_API_KEY || !PROGRAM_ID || !WEBHOOK_SECRET) {
    throw new Error(
      "Missing HELIUS_API_KEY, PROGRAM_ID, or HELIUS_WEBHOOK_SECRET"
    );
  }

  const res = await fetch(
    `${getHeliusBaseUrl()}/v0/webhooks?api-key=${HELIUS_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        webhookURL: webhookUrl,
        transactionTypes: ["ANY"],
        accountAddresses: [PROGRAM_ID],
        webhookType: rawWebhookType(),
        authHeader: `Bearer ${WEBHOOK_SECRET}`,
        // No `txnStatus`: it is not a documented field of this API, so it was
        // being silently ignored while reading as if failed transactions were
        // filtered upstream. They are filtered where it is actually verified —
        // the event decoder drops any transaction with a non-null `meta.err`.
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to register webhook: ${res.status} ${body}`);
  }

  return (await res.json()) as HeliusWebhookResponse;
}

export async function listWebhooks(): Promise<HeliusWebhookResponse[]> {
  if (!HELIUS_API_KEY) throw new Error("Missing HELIUS_API_KEY");

  const res = await fetch(
    `${getHeliusBaseUrl()}/v0/webhooks?api-key=${HELIUS_API_KEY}`
  );
  // Without this, a 401/429/5xx body (an error OBJECT, not an array) was cast
  // straight to `HeliusWebhookResponse[]` — so an auth failure surfaced far
  // away as "no webhooks registered" rather than as an error.
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Failed to list webhooks: ${res.status} ${body.slice(0, 300)}`
    );
  }
  const parsed: unknown = await res.json();
  if (!Array.isArray(parsed)) {
    throw new Error(
      `Unexpected webhook list shape: expected an array, got ${typeof parsed}`
    );
  }
  return parsed as HeliusWebhookResponse[];
}

import "server-only";

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

function getHeliusBaseUrl(): string {
  return NETWORK === "mainnet-beta"
    ? "https://api-mainnet.helius-rpc.com"
    : "https://api-devnet.helius-rpc.com";
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
        webhookType: "raw",
        authHeader: `Bearer ${WEBHOOK_SECRET}`,
        txnStatus: "success",
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
  return (await res.json()) as HeliusWebhookResponse[];
}

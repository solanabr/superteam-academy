import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabaseRest } from "@/lib/backend/server-supabase";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CertificatePage({ params }: Props) {
  const { id } = await params;
  const explorer = `https://explorer.solana.com/address/${id}?cluster=devnet`;
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
  const accountResponse = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "certificate-verify",
      method: "getAccountInfo",
      params: [id, { encoding: "jsonParsed", commitment: "confirmed" }],
    }),
    cache: "no-store",
  });
  const accountData = (await accountResponse.json()) as { result?: { value?: unknown } };
  const verified = Boolean(accountData.result?.value);

  const [matchedUser] =
    (await supabaseRest.select<{ display_name: string | null; learner_id: string }>({
      table: "academy_users",
      select: "display_name,learner_id",
      filters: { wallet_address: `eq.${id}` },
      limit: 1,
    })) ?? [];
  const recipient = matchedUser?.display_name || `${id.slice(0, 4)}...${id.slice(-4)}`;

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <h1 className="text-3xl font-semibold">Credential Certificate</h1>
        <p className="text-zinc-300">
          Recipient: {recipient} · Track: Core · Issued: {new Date().toLocaleDateString()}
        </p>
        <p className="text-sm text-zinc-400">Mint: {id}</p>
        <p className={`text-sm ${verified ? "text-emerald-400" : "text-red-400"}`}>
          {verified ? "Verified on Devnet" : "Unable to verify on Devnet"}
        </p>
        <a className="text-emerald-400" href={explorer} target="_blank" rel="noreferrer">
          Verify on Solana Explorer
        </a>
        <div className="flex gap-2">
          <Button>Share</Button>
          <Button variant="outline">Download image</Button>
        </div>
      </Card>
    </div>
  );
}

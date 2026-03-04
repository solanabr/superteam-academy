import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <div className="border border-primary/30 rounded-2xl p-10 bg-card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
        <div className="text-5xl mb-4">🏆</div>
        <Badge variant="outline" className="mb-4">Verified On-Chain Credential</Badge>
        <h1 className="text-3xl font-bold mb-2">Solana Fundamentals</h1>
        <p className="text-muted-foreground mb-6">Successfully completed by a Superteam Academy learner</p>
        <div className="grid grid-cols-2 gap-4 mb-8 text-left">
          <div className="bg-background rounded-xl p-4 border border-border">
            <div className="text-xs text-muted-foreground mb-1">NFT Mint</div>
            <div className="text-sm font-mono truncate">{id}</div>
          </div>
          <div className="bg-background rounded-xl p-4 border border-border">
            <div className="text-xs text-muted-foreground mb-1">Network</div>
            <div className="text-sm font-semibold">Solana Devnet</div>
          </div>
          <div className="bg-background rounded-xl p-4 border border-border">
            <div className="text-xs text-muted-foreground mb-1">XP Earned</div>
            <div className="text-sm font-bold text-primary">1,200 XP</div>
          </div>
          <div className="bg-background rounded-xl p-4 border border-border">
            <div className="text-xs text-muted-foreground mb-1">Level Achieved</div>
            <div className="text-sm font-bold">Level 3</div>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <a href={"https://explorer.solana.com/address/" + id + "?cluster=devnet"} target="_blank" className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors">View on Explorer</a>
          <Button>Share Certificate</Button>
        </div>
      </div>
    </div>
  );
}
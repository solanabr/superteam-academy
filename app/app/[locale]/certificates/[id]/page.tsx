import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

async function getCredentialMetadata(mintAddress: string) {
  try {
    const response = await fetch(
      `https://api.devnet.helius-rpc.com?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY || ''}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: '1',
          method: 'getAsset',
          params: { id: mintAddress },
        }),
      }
    );
    const data = await response.json();
    return data.result || null;
  } catch {
    return null;
  }
}

export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const metadata = await getCredentialMetadata(id);
  
  const credentialName = metadata?.content?.metadata?.name || "Solana Fundamentals";
  const xpEarned = metadata?.content?.metadata?.attributes?.find((a: { trait_type: string }) => a.trait_type === 'xp')?.value || 1200;
  const level = metadata?.content?.metadata?.attributes?.find((a: { trait_type: string }) => a.trait_type === 'level')?.value || 3;
  const track = metadata?.content?.metadata?.attributes?.find((a: { trait_type: string }) => a.trait_type === 'track')?.value || 'Solana';
  
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `I just completed ${credentialName} on Superteam Academy! 🎉`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <div className="border border-primary/30 rounded-2xl p-10 bg-card relative overflow-hidden" id="certificate">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
        <div className="text-5xl mb-4">🏆</div>
        <Badge variant="outline" className="mb-4">Verified On-Chain Credential</Badge>
        <h1 className="text-3xl font-bold mb-2">{credentialName}</h1>
        <p className="text-muted-foreground mb-6">Successfully completed by a Superteam Academy learner</p>
        <div className="grid grid-cols-2 gap-4 mb-8 text-left">
          <div className="bg-background rounded-xl p-4 border border-border">
            <div className="text-xs text-muted-foreground mb-1">NFT Mint</div>
            <div className="text-sm font-mono truncate">{id.slice(0, 8)}...{id.slice(-8)}</div>
          </div>
          <div className="bg-background rounded-xl p-4 border border-border">
            <div className="text-xs text-muted-foreground mb-1">Track</div>
            <div className="text-sm font-semibold">{track}</div>
          </div>
          <div className="bg-background rounded-xl p-4 border border-border">
            <div className="text-xs text-muted-foreground mb-1">XP Earned</div>
            <div className="text-sm font-bold text-primary">{Number(xpEarned).toLocaleString()} XP</div>
          </div>
          <div className="bg-background rounded-xl p-4 border border-border">
            <div className="text-xs text-muted-foreground mb-1">Level Achieved</div>
            <div className="text-sm font-bold">Level {level}</div>
          </div>
        </div>
        <div className="flex gap-3 justify-center flex-wrap">
          <a href={"https://explorer.solana.com/address/" + id + "?cluster=devnet"} target="_blank" className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors">View on Explorer</a>
          <Button onClick={() => {
            const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
            window.open(url, '_blank');
          }}>Share on X</Button>
          <Button variant="outline" onClick={() => {
            const canvas = document.createElement('canvas');
            const certificate = document.getElementById('certificate');
            if (!certificate) return;
            // Simple download - in production use html2canvas
            const link = document.createElement('a');
            link.download = `certificate-${id.slice(0, 8)}.png`;
            link.href = shareUrl;
            link.click();
          }}>Download</Button>
        </div>
      </div>
    </div>
  );
}
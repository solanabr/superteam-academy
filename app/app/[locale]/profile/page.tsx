"use client";
import { useWallet } from "@/hooks/use-wallet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ACHIEVEMENTS = [
  { icon: "🌟", name: "Early Adopter", desc: "Joined during launch" },
  { icon: "🔥", name: "Week Warrior", desc: "7-day streak" },
  { icon: "⚡", name: "First Steps", desc: "Completed first lesson" },
  { icon: "🦀", name: "Rust Rookie", desc: "First Rust program" },
];

const SKILLS = [
  { name: "Rust", level: 65 },
  { name: "Anchor", level: 40 },
  { name: "Frontend", level: 75 },
  { name: "DeFi", level: 30 },
  { name: "Security", level: 20 },
];

export default function ProfilePage() {
  const { address } = useWallet();
  const shortAddr = address ? address.slice(0,4) + "..." + address.slice(-4) : "Not connected";
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex items-start gap-6 mb-10">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-3xl">👤</div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{shortAddr}</h1>
          <p className="text-muted-foreground">Solana Developer · LATAM</p>
          <div className="flex gap-2 mt-3">
            <Badge variant="outline">Level 5</Badge>
            <Badge variant="outline">🔥 12 day streak</Badge>
            <Badge variant="outline">2,700 XP</Badge>
          </div>
        </div>
        <Button variant="outline">Edit Profile</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-border rounded-xl p-6 bg-card">
          <h2 className="font-bold mb-4">Skills</h2>
          <div className="flex flex-col gap-3">
            {SKILLS.map(s => (
              <div key={s.name}>
                <div className="flex justify-between text-sm mb-1"><span>{s.name}</span><span>{s.level}%</span></div>
                <div className="w-full bg-border rounded-full h-2"><div className="bg-primary h-2 rounded-full" style={{ width: s.level + "%" }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="border border-border rounded-xl p-6 bg-card">
          <h2 className="font-bold mb-4">Achievements</h2>
          <div className="grid grid-cols-2 gap-3">
            {ACHIEVEMENTS.map(a => (
              <div key={a.name} className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
                <span className="text-2xl">{a.icon}</span>
                <div><div className="text-sm font-medium">{a.name}</div><div className="text-xs text-muted-foreground">{a.desc}</div></div>
              </div>
            ))}
          </div>
        </div>
        <div className="border border-border rounded-xl p-6 bg-card md:col-span-2">
          <h2 className="font-bold mb-4">On-Chain Credentials</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-4 p-4 rounded-xl border border-primary/30 bg-primary/5">
              <span className="text-3xl">🏆</span>
              <div><div className="font-semibold">Solana Fundamentals</div><div className="text-xs text-muted-foreground">Metaplex Core NFT · Devnet</div></div>
              <Badge variant="outline" className="ml-auto">Lvl 1</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
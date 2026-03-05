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
  { name: "Rust", level: 65, angle: 0 },
  { name: "Anchor", level: 40, angle: 72 },
  { name: "Frontend", level: 75, angle: 144 },
  { name: "DeFi", level: 30, angle: 216 },
  { name: "Security", level: 20, angle: 288 },
];

function SkillRadar() {
  const center = 80;
  const maxRadius = 60;
  
  return (
    <div className="border border-border rounded-xl p-6 bg-card">
      <h2 className="font-bold mb-4">Skill Radar</h2>
      <svg viewBox="0 0 200 200" className="w-full h-auto">
        {[20, 40, 60, 80, 100].map((r, i) => (
          <circle key={r} cx={center} cy={center} r={maxRadius * r / 100} fill="none" stroke="#374151" strokeWidth="1" />
        ))}
        {[0, 72, 144, 216, 288].map((angle, i) => (
          <line key={angle} x1={center} y1={center} x2={center + maxRadius * Math.sin(angle * Math.PI / 180)} y2={center - maxRadius * Math.cos(angle * Math.PI / 180)} stroke="#374151" strokeWidth="1" />
        ))}
        {SKILLS.map((skill, i) => {
          const angle = (skill.angle - 90) * Math.PI / 180;
          const r = maxRadius * skill.level / 100;
          const x = center + r * Math.cos(angle);
          const y = center + r * Math.sin(angle);
          return (
            <g key={skill.name}>
              <circle cx={x} cy={y} r="4" fill="#a855f7" />
              <text x={center + (maxRadius + 15) * Math.cos(angle)} y={center + (maxRadius + 15) * Math.sin(angle)} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="#9ca3af">
                {skill.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

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
        <SkillRadar />
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
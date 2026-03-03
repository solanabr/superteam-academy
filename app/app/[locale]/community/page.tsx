"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePrivy } from "@privy-io/react-auth";

const MOCK_THREADS = [
  { id: 1, title: "How do PDAs work in Anchor?", author: "sol_dev_br", replies: 12, upvotes: 34, tag: "Question", time: "2h ago" },
  { id: 2, title: "My first deployed dApp on Devnet!", author: "latam_builder", replies: 8, upvotes: 56, tag: "Showcase", time: "5h ago" },
  { id: 3, title: "Error: account not initialized — how to fix?", author: "anchor_noob", replies: 6, upvotes: 12, tag: "Help", time: "1d ago" },
  { id: 4, title: "Best resources for learning Rust for Solana?", author: "newbie_sol", replies: 21, upvotes: 89, tag: "Resources", time: "2d ago" },
  { id: 5, title: "Bounty: Find bug in my token program — 50 XP reward", author: "defi_dev", replies: 3, upvotes: 44, tag: "Bounty", time: "3d ago" },
];

const TAG_COLORS: Record<string, string> = {
  Question: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Showcase: "bg-green-500/10 text-green-400 border-green-500/20",
  Help: "bg-red-500/10 text-red-400 border-red-500/20",
  Resources: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Bounty: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

export default function CommunityPage() {
  const { login, authenticated } = usePrivy();
  const [filter, setFilter] = useState("All");
  const tags = ["All", "Question", "Showcase", "Help", "Resources", "Bounty"];
  const filtered = filter === "All" ? MOCK_THREADS : MOCK_THREADS.filter(t => t.tag === filter);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Community</h1>
          <p className="text-muted-foreground mt-1">Ask questions, share projects, earn XP</p>
        </div>
        {authenticated ? (
          <Button>New Thread</Button>
        ) : (
          <Button onClick={login}>Sign in to Post</Button>
        )}
      </div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {tags.map(tag => (
          <button key={tag} onClick={() => setFilter(tag)}
            className={"px-3 py-1 rounded-full text-sm border transition-all " + (filter === tag ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50")}
          >{tag}</button>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {filtered.map(thread => (
          <div key={thread.id} className="border border-border rounded-xl p-4 hover:border-primary/40 transition-all cursor-pointer bg-card">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={"text-xs px-2 py-0.5 rounded-full border " + (TAG_COLORS[thread.tag] || "")}>{thread.tag}</span>
                  <span className="text-xs text-muted-foreground">{thread.time}</span>
                </div>
                <h3 className="font-semibold text-foreground hover:text-primary transition-colors">{thread.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">by {thread.author}</p>
              </div>
              <div className="flex flex-col items-end gap-1 text-sm text-muted-foreground">
                <span>▲ {thread.upvotes}</span>
                <span>💬 {thread.replies}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
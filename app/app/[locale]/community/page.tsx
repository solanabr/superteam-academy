"use client";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { usePrivy } from "@privy-io/react-auth";
import { supabase, type Thread } from "@/lib/supabase";

const TAG_COLORS: Record<string, string> = {
  Question: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Showcase: "bg-green-500/10 text-green-400 border-green-500/20",
  Help: "bg-red-500/10 text-red-400 border-red-500/20",
  Resources: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Bounty: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

const TAGS = ["All", "Question", "Showcase", "Help", "Resources", "Bounty"];

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function CommunityPage() {
  const { login, authenticated, user } = usePrivy();
  const [filter, setFilter] = useState("All");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newTag, setNewTag] = useState("Question");
  const [submitting, setSubmitting] = useState(false);

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("threads")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });
    if (filter !== "All") query = query.contains("tags", [filter]);
    const { data } = await query;
    setThreads(data || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchThreads(); }, [fetchThreads]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("threads")
      .on("postgres_changes", { event: "*", schema: "public", table: "threads" }, fetchThreads)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchThreads]);

  const handleUpvote = async (threadId: string, current: number) => {
    if (!authenticated) { login(); return; }
    const wallet = user?.wallet?.address || user?.id || "anonymous";
    const { error } = await supabase.from("upvotes").insert({
      target_id: threadId, target_type: "thread", voter_wallet: wallet
    });
    if (!error) {
      await supabase.from("threads").update({ upvotes: current + 1 }).eq("id", threadId);
      fetchThreads();
    }
  };

  const handleSubmit = async () => {
    if (!newTitle.trim() || !newBody.trim()) return;
    setSubmitting(true);
    const wallet = user?.wallet?.address || user?.id || "anonymous";
    await supabase.from("threads").insert({
      title: newTitle,
      body: newBody,
      author_wallet: wallet,
      author_name: user?.email?.address || wallet.slice(0, 8) + "...",
      tags: [newTag],
    });
    setNewTitle(""); setNewBody(""); setShowNew(false);
    setSubmitting(false);
    fetchThreads();
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Community</h1>
          <p className="text-muted-foreground mt-1">Ask questions, share projects, earn XP</p>
        </div>
        {authenticated ? (
          <Button onClick={() => setShowNew(!showNew)}>
            {showNew ? "Cancel" : "+ New Thread"}
          </Button>
        ) : (
          <Button onClick={login}>Sign in to Post</Button>
        )}
      </div>

      {/* New Thread Form */}
      {showNew && (
        <div className="border border-primary/40 rounded-xl p-5 mb-6 bg-card space-y-3">
          <input
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
            placeholder="Thread title..."
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
          />
          <textarea
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary min-h-[100px]"
            placeholder="Describe your question or showcase..."
            value={newBody}
            onChange={e => setNewBody(e.target.value)}
          />
          <div className="flex gap-2 flex-wrap">
            {TAGS.filter(t => t !== "All").map(tag => (
              <button key={tag} onClick={() => setNewTag(tag)}
                className={"text-xs px-3 py-1 rounded-full border transition-all " +
                  (newTag === tag ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50 " + (TAG_COLORS[tag] || ""))}>
                {tag}
              </button>
            ))}
          </div>
          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? "Posting..." : "Post Thread"}
          </Button>
        </div>
      )}

      {/* Tag Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TAGS.map(tag => (
          <button key={tag} onClick={() => setFilter(tag)}
            className={"px-3 py-1 rounded-full text-sm border transition-all " +
              (filter === tag ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50")}>
            {tag}
          </button>
        ))}
      </div>

      {/* Threads */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3].map(i => (
            <div key={i} className="border border-border rounded-xl p-4 animate-pulse bg-card h-20" />
          ))}
        </div>
      ) : threads.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">No threads yet.</p>
          <p className="text-sm mt-1">Be the first to post!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {threads.map(thread => (
            <div key={thread.id}
              className={"border rounded-xl p-4 hover:border-primary/40 transition-all cursor-pointer bg-card " +
                (thread.is_pinned ? "border-yellow-500/40" : "border-border")}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {thread.is_pinned && <span className="text-xs text-yellow-400">📌 Pinned</span>}
                    {thread.tags.map(tag => (
                      <span key={tag} className={"text-xs px-2 py-0.5 rounded-full border " + (TAG_COLORS[tag] || "")}>
                        {tag}
                      </span>
                    ))}
                    {thread.bounty_usdc > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                        💰 {thread.bounty_usdc} USDC
                      </span>
                    )}
                    {thread.is_solved && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">✓ Solved</span>
                    )}
                    <span className="text-xs text-muted-foreground">{timeAgo(thread.created_at)}</span>
                  </div>
                  <h3 className="font-semibold text-foreground hover:text-primary transition-colors">{thread.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    by {thread.author_name || thread.author_wallet.slice(0, 8) + "..."}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 text-sm text-muted-foreground">
                  <button
                    onClick={e => { e.stopPropagation(); handleUpvote(thread.id, thread.upvotes); }}
                    className="flex items-center gap-1 hover:text-primary transition-colors px-2 py-1 rounded hover:bg-primary/10">
                    ▲ {thread.upvotes}
                  </button>
                  <span>💬 {thread.views}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

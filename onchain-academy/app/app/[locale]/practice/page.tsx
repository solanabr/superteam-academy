"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { usePrivy } from "@privy-io/react-auth";
import { supabase, type PracticeChallenge } from "@/lib/supabase";
import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const DIFF_COLORS = { beginner: "bg-green-500/10 text-green-400 border-green-500/20", intermediate: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", advanced: "bg-red-500/10 text-red-400 border-red-500/20" };
const CAT_ICONS: Record<string,string> = { typescript: "🟦", rust: "🦀", concept: "💡", solana: "◎" };

export default function PracticePage() {
  const { authenticated, login, user } = usePrivy();
  const [challenges, setChallenges] = useState<PracticeChallenge[]>([]);
  const [selected, setSelected] = useState<PracticeChallenge | null>(null);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState<{ passed: boolean; message: string; xp?: number } | null>(null);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [hintIndex, setHintIndex] = useState(0);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    supabase.from("practice_challenges").select("*").order("order_index").then(({ data }) => setChallenges(data || []));
  }, []);

  useEffect(() => {
    if (!user || !challenges.length) return;
    const wallet = user?.wallet?.address || user?.id;
    supabase.from("challenge_attempts").select("challenge_id").eq("user_wallet", wallet).eq("passed", true)
      .then(({ data }) => {
      const ids = new Set((data || []).map((a: { challenge_id: string }) => a.challenge_id));
        setCompleted(new Set(challenges.filter(c => ids.has(c.id)).map(c => c.slug)));
      });
  }, [user, challenges]);

  const select = (c: PracticeChallenge) => { setSelected(c); setCode(c.starter_code || ""); setOutput(null); setHintIndex(0); };

  const run = async () => {
    if (!selected) return;
    if (!authenticated) { login(); return; }
    setRunning(true); setOutput(null);
    try {
      let passed = false; let message = "";
      const tcs = selected.test_cases;
      if (selected.category === "rust") {
        passed = !code.includes("todo!()") && code.length > (selected.starter_code?.length || 0) + 10;
        message = passed ? "✅ Implementation looks complete!" : "❌ Remove todo!() and complete the implementation";
      } else {
        const fnMatch = code.match(/export function (\w+)/);
        const fnName = fnMatch?.[1];
        if (!fnName) { setOutput({ passed: false, message: "❌ No exported function found" }); setRunning(false); return; }
        const clean = code.replace(/^export /gm, "");
        const results: string[] = []; let allPassed = true;
        for (const tc of tcs.filter(t => !t.hidden)) {
          try {
            const fn = new Function(`${clean}; return ${fnName};`)();
            const result = Array.isArray(tc.input) ? fn(...tc.input) : fn(tc.input);
            const ok = JSON.stringify(result) === JSON.stringify(tc.expected);
            if (!ok) allPassed = false;
            results.push(ok ? `✅ f(${JSON.stringify(tc.input)}) → ${result}` : `❌ f(${JSON.stringify(tc.input)}) → got ${result}, expected ${tc.expected}`);
          } catch (e: unknown) { allPassed = false; results.push(`❌ Error: ${e instanceof Error ? e.message : String(e)}`); }
        }
        passed = allPassed; message = results.join("\n");
      }
      const wallet = user?.wallet?.address || user?.id || "anon";
      await supabase.from("challenge_attempts").insert({ challenge_id: selected.id, user_wallet: wallet, code, passed, score: passed ? selected.xp_reward : 0 });
      if (passed) {
        setCompleted(prev => new Set([...prev, selected.slug]));
        await supabase.from("xp_transactions").insert({ user_wallet: wallet, amount: selected.xp_reward, reason: `challenge:${selected.slug}` });
      }
      setOutput({ passed, message, xp: passed ? selected.xp_reward : undefined });
    } catch (e: unknown) { setOutput({ passed: false, message: `❌ ${e instanceof Error ? e.message : String(e)}` }); }
    setRunning(false);
  };

  const cats = ["All", "typescript", "rust", "concept"];
  const filtered = filter === "All" ? challenges : challenges.filter(c => c.category === filter);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Practice Arena</h1>
        <p className="text-muted-foreground mt-1">Solve challenges, earn XP, level up your Solana skills</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-2">
          <div className="flex gap-2 flex-wrap mb-4">
            {cats.map(cat => (
              <button key={cat} onClick={() => setFilter(cat)}
                className={"text-xs px-3 py-1 rounded-full border transition-all " + (filter === cat ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50")}>
                {CAT_ICONS[cat] || "🔍"} {cat}
              </button>
            ))}
          </div>
          {filtered.map(c => (
            <div key={c.id} onClick={() => select(c)}
              className={"border rounded-xl p-4 cursor-pointer transition-all " + (selected?.id === c.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 bg-card")}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{CAT_ICONS[c.category]}</span>
                    <span className={"text-xs px-2 py-0.5 rounded-full border " + DIFF_COLORS[c.difficulty]}>{c.difficulty}</span>
                    {completed.has(c.slug) && <span className="text-green-400 text-xs">✓</span>}
                  </div>
                  <p className="font-medium text-sm">{c.title}</p>
                </div>
                <span className="text-xs text-yellow-400 font-bold">+{c.xp_reward}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2">
          {!selected ? (
            <div className="border border-border rounded-xl h-96 flex items-center justify-center text-muted-foreground bg-card">
              <div className="text-center"><p className="text-4xl mb-3">⚡</p><p>Select a challenge to start</p></div>
            </div>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden bg-card">
              <div className="p-4 border-b border-border">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="font-bold text-lg">{selected.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{selected.description}</p>
                  </div>
                  <span className="text-yellow-400 font-bold">+{selected.xp_reward} XP</span>
                </div>
                <div className="mt-3 flex gap-2 flex-wrap">
                  {selected.test_cases.filter(t => !t.hidden).map((tc, i) => (
                    <div key={i} className="text-xs bg-background border border-border rounded-lg px-2 py-1 font-mono">
                      f({tc.input !== null ? JSON.stringify(tc.input) : ""}) → {JSON.stringify(tc.expected)}
                    </div>
                  ))}
                  {selected.test_cases.some(t => t.hidden) && <div className="text-xs bg-background border border-border rounded-lg px-2 py-1 text-muted-foreground">+ hidden tests</div>}
                </div>
              </div>
              <div className="h-64">
                <MonacoEditor height="100%" language={selected.category === "rust" ? "rust" : "typescript"} value={code}
                  onChange={v => setCode(v || "")} theme="vs-dark"
                  options={{ fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false, padding: { top: 12 } }} />
              </div>
              <div className="p-4 border-t border-border space-y-3">
                <div className="flex gap-3">
                  <Button onClick={run} disabled={running} className="flex-1">{running ? "Running..." : "▶ Run Code"}</Button>
                  {selected.hints.length > 0 && (
                    <Button variant="outline" onClick={() => setHintIndex(i => Math.min(i + 1, selected.hints.length))}>
                      💡 Hint {Math.min(hintIndex + 1, selected.hints.length)}/{selected.hints.length}
                    </Button>
                  )}
                </div>
                {hintIndex > 0 && (
                  <div className="text-sm bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-yellow-300">
                    {selected.hints[hintIndex - 1]}
                  </div>
                )}
                {output && (
                  <div className={"rounded-lg p-3 text-sm font-mono whitespace-pre-wrap " + (output.passed ? "bg-green-500/10 border border-green-500/20 text-green-300" : "bg-red-500/10 border border-red-500/20 text-red-300")}>
                    {output.message}
                    {output.xp && <div className="mt-2 text-yellow-400 font-bold">🎉 +{output.xp} XP earned!</div>}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

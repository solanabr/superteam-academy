"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, CheckCircle, Play, Terminal } from "lucide-react";
import { mockCourses } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { useXP } from "@/context/XPContext";
import { useWallet } from "@solana/wallet-adapter-react";
import Editor from "@monaco-editor/react";

const mockContent = {
  title: "Introduction & Setup",
  content: [
    { type: "heading", text: "Welcome to Solana Development" },
    { type: "text", text: "Solana is a high-performance blockchain supporting builders around the world creating crypto apps that scale today." },
    { type: "subheading", text: "What you'll learn" },
    { type: "bullet", text: "The Solana programming model" },
    { type: "bullet", text: "How accounts work on Solana" },
    { type: "bullet", text: "Your first interaction with the network" },
    { type: "subheading", text: "The Account Model" },
    { type: "text", text: "Every piece of data on Solana lives in an account. Think of accounts like files in a filesystem." },
    { type: "code", lang: "rust", text: `pub struct MyAccount {\n    pub authority: Pubkey,\n    pub data: u64,\n    pub bump: u8,\n}` },
    { type: "subheading", text: "Setting Up Your Environment" },
    { type: "code", lang: "bash", text: `# Install Rust\ncurl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh\n\n# Install Solana CLI\nsh -c "$(curl -sSfL https://release.solana.com/stable/install)"` },
  ],
  challenge: {
    prompt: "Write a function that returns the string 'Hello, Solana!'",
    starterCode: `pub fn hello() -> String {\n    // Your code here\n    \n}`,
    tests: [
      { name: "returns correct string", passing: false },
      { name: "function compiles", passing: false },
    ],
  },
};

export default function LessonPage() {
  const params = useParams();
  const slug = params.slug as string;
  const id = Number(params.id);
  const { publicKey } = useWallet();
  const { addXP } = useXP();

  const [code, setCode] = useState(mockContent.challenge.starterCode);
  const [output, setOutput] = useState("");
  const [tests, setTests] = useState(mockContent.challenge.tests);
  const [completed, setCompleted] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "challenge">("content");
  const [showXPToast, setShowXPToast] = useState(false);

  const course = mockCourses.find((c) => c.id === slug);

  // Load completion state from localStorage
  useEffect(() => {
    if (!publicKey) return;
    const key = `lesson_${publicKey.toBase58()}_${slug}_${id}`;
    const done = localStorage.getItem(key);
    if (done === "true") setCompleted(true);
  }, [publicKey, slug, id]);

  function markComplete(xpAmount: number) {
    if (!publicKey || completed) return;
    const key = `lesson_${publicKey.toBase58()}_${slug}_${id}`;
    localStorage.setItem(key, "true");
    setCompleted(true);
    if (!xpAwarded) {
      addXP(xpAmount);
      setXpAwarded(true);
      setShowXPToast(true);
      setTimeout(() => setShowXPToast(false), 3000);
    }
  }

  function runCode() {
    setOutput("Compiling...");
    setTimeout(() => {
      const passing = code.includes("Hello, Solana!");
      setTests(tests.map((t) => ({ ...t, passing })));
      if (passing) {
        setOutput("✓ All tests passed!\n⚡ +100 XP minted to your wallet");
        markComplete(100);
      } else {
        setOutput('✗ Tests failed\n  Expected: "Hello, Solana!"\n  Got: undefined');
      }
    }, 800);
  }

  return (
    <div className="h-screen bg-[#020202] flex flex-col overflow-hidden">

      {/* XP Toast */}
      {showXPToast && (
        <div className="fixed top-20 right-6 z-50 bg-[#14f195] text-black px-4 py-3 font-mono text-xs uppercase tracking-widest flex items-center gap-2 animate-pulse">
          <CheckCircle className="w-4 h-4" />
          +XP EARNED! LEVEL UP POSSIBLE
        </div>
      )}

      {/* Top bar */}
      <div className="border-b border-[#1a1a1a] px-6 py-3 flex items-center justify-between shrink-0">
        <Link
          href={`/courses/${slug}`}
          className="flex items-center gap-2 text-[10px] font-mono text-[#444] hover:text-[#9945ff] transition-colors uppercase tracking-widest"
        >
          <ArrowLeft className="w-3 h-3" />
          {course?.title || "BACK"}
        </Link>

        <div className="flex items-center gap-4">
          <span className="text-[10px] font-mono text-[#333]">
            LESSON_{id.toString().padStart(2, "0")}
          </span>
          {completed && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-[#14f195]">
              <CheckCircle className="w-3 h-3" /> COMPLETE
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {id > 0 ? (
            <Link href={`/courses/${slug}/lessons/${id - 1}`}>
              <button className="p-2 text-[#444] hover:text-[#f5f5f0] transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </Link>
          ) : (
            <button disabled className="p-2 text-[#444] opacity-20 cursor-not-allowed">
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}
          <Link href={`/courses/${slug}/lessons/${id + 1}`}>
            <button className="p-2 text-[#444] hover:text-[#f5f5f0] transition-colors">
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="border-b border-[#1a1a1a] flex shrink-0">
        <button
          onClick={() => setActiveTab("content")}
          className={cn(
            "px-6 py-3 text-[10px] font-mono uppercase tracking-widest transition-colors border-r border-[#1a1a1a]",
            activeTab === "content" ? "text-[#9945ff] bg-[#0a0a0a]" : "text-[#444] hover:text-[#f5f5f0]"
          )}
        >
          LESSON_CONTENT
        </button>
        <button
          onClick={() => setActiveTab("challenge")}
          className={cn(
            "px-6 py-3 text-[10px] font-mono uppercase tracking-widest transition-colors",
            activeTab === "challenge" ? "text-[#9945ff] bg-[#0a0a0a]" : "text-[#444] hover:text-[#f5f5f0]"
          )}
        >
          CODE_CHALLENGE
        </button>

        {/* Progress indicator */}
        <div className="ml-auto flex items-center px-6 gap-3">
          {completed ? (
            <span className="flex items-center gap-1.5 text-[10px] font-mono text-[#14f195]">
              <CheckCircle className="w-3 h-3" />
              LESSON_COMPLETE +100_XP
            </span>
          ) : (
            <span className="text-[10px] font-mono text-[#333]">
              +100_XP ON_COMPLETION
            </span>
          )}
        </div>
      </div>

      {/* Content tab */}
      {activeTab === "content" ? (
        <div className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto px-6 py-12">
            <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-8">
              // {mockContent.title}
            </div>
            <div className="space-y-4">
              {mockContent.content.map((block, i) => {
                if (block.type === "heading") return (
                  <h1 key={i} className="font-display font-black text-3xl uppercase tracking-tight text-[#f5f5f0] mt-8 mb-4">{block.text}</h1>
                );
                if (block.type === "subheading") return (
                  <h2 key={i} className="font-display font-black text-xl uppercase tracking-tight text-[#9945ff] mt-8 mb-3">{block.text}</h2>
                );
                if (block.type === "text") return (
                  <p key={i} className="text-sm font-mono text-[#555] leading-relaxed">{block.text}</p>
                );
                if (block.type === "bullet") return (
                  <div key={i} className="flex items-start gap-3 text-sm font-mono text-[#555]">
                    <span className="text-[#9945ff] mt-0.5">→</span>
                    <span>{block.text}</span>
                  </div>
                );
                if (block.type === "code") return (
                  <div key={i} className="border border-[#1a1a1a] bg-[#0a0a0a] my-4">
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-[#1a1a1a]">
                      <Terminal className="w-3 h-3 text-[#333]" />
                      <span className="text-[10px] font-mono text-[#333] uppercase">{block.lang}</span>
                    </div>
                    <pre className="p-4 text-xs font-mono text-[#14f195] overflow-x-auto leading-relaxed">{block.text}</pre>
                  </div>
                );
                return null;
              })}
            </div>

            {/* Bottom actions */}
            <div className="mt-12 flex items-center justify-between">
              <button
                onClick={() => markComplete(100)}
                disabled={completed}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 font-mono text-xs uppercase tracking-widest transition-colors",
                  completed
                    ? "bg-[#14f195] text-black cursor-default"
                    : "border border-[#1a1a1a] text-[#444] hover:border-[#14f195] hover:text-[#14f195]"
                )}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                {completed ? "COMPLETED ✓" : "MARK_COMPLETE (+100 XP)"}
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab("challenge")}
                  className="px-5 py-3 border border-[#1a1a1a] text-[#444] font-mono text-xs uppercase tracking-widest hover:border-[#9945ff] hover:text-[#9945ff] transition-colors"
                >
                  TRY_CHALLENGE
                </button>
                <Link href={`/courses/${slug}/lessons/${id + 1}`}>
                  <button className="flex items-center gap-2 px-6 py-3 bg-[#9945ff] text-white font-mono text-xs uppercase tracking-widest hover:bg-[#8835ef] transition-colors">
                    NEXT_LESSON <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

      ) : (
        /* Challenge tab */
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">

          {/* Left: prompt + tests + output */}
          <div className="border-r border-[#1a1a1a] overflow-auto">
            <div className="p-6">
              <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-4">// CHALLENGE</div>
              <h2 className="font-display font-black text-2xl uppercase tracking-tight mb-6">
                {mockContent.challenge.prompt}
              </h2>

              <div className="space-y-2 mb-6">
                {tests.map((test, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs font-mono">
                    <span className={test.passing ? "text-[#14f195]" : "text-[#333]"}>
                      {test.passing ? "✓" : "○"}
                    </span>
                    <span className={test.passing ? "text-[#14f195]" : "text-[#444]"}>
                      {test.name}
                    </span>
                  </div>
                ))}
              </div>

              {output && (
                <div className="border border-[#1a1a1a] bg-[#0a0a0a] p-4 mb-6">
                  <pre className={cn(
                    "text-xs font-mono whitespace-pre-wrap leading-relaxed",
                    output.includes("✓") ? "text-[#14f195]" : "text-[#ff3366]"
                  )}>
                    {output}
                  </pre>
                </div>
              )}

              {completed && (
                <div className="border border-[#14f195]/30 bg-[#14f195]/5 p-4">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-[#14f195] uppercase tracking-widest">
                    <CheckCircle className="w-3.5 h-3.5" />
                    CHALLENGE COMPLETE — +100 XP EARNED
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Monaco editor */}
          <div className="flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1a1a1a] shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff3366]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#14f195]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#9945ff]" />
              <span className="ml-2 text-[10px] font-mono text-[#333]">main.rs</span>
            </div>

            <div className="flex-1" style={{ minHeight: 0 }}>
              <Editor
                height="100%"
                defaultLanguage="rust"
                value={code}
                onChange={(val) => setCode(val || "")}
                theme="vs-dark"
                options={{
                  fontSize: 13,
                  fontFamily: "Space Mono, monospace",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  lineNumbers: "on",
                  roundedSelection: false,
                  padding: { top: 16, bottom: 16 },
                  cursorStyle: "line",
                  automaticLayout: true,
                  tabSize: 4,
                  wordWrap: "on",
                }}
              />
            </div>

            <div className="border-t border-[#1a1a1a] p-4 flex items-center justify-between shrink-0">
              <span className="text-[10px] font-mono text-[#333] uppercase tracking-widest">
                RUST // SOLANA_PROGRAM
              </span>
              <button
                onClick={runCode}
                className="flex items-center gap-2 px-5 py-2 bg-[#9945ff] text-white font-mono text-xs uppercase tracking-widest hover:bg-[#8835ef] transition-colors"
              >
                <Play className="w-3 h-3" /> RUN_TESTS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
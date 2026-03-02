"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, ArrowRight, CheckCircle, Play, Terminal, Lightbulb, Eye, EyeOff, Save } from "lucide-react";
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
    solutionCode: `pub fn hello() -> String {\n    String::from("Hello, Solana!")\n}`,
    hints: [
      "Use String::from() to create an owned String",
      "The function must return exactly 'Hello, Solana!' with the exclamation mark",
      "String::from(\"Hello, Solana!\") is the correct syntax",
    ],
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

  const AUTO_SAVE_KEY = `autosave_${slug}_${id}`;

  const [code, setCode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(AUTO_SAVE_KEY) || mockContent.challenge.starterCode;
    }
    return mockContent.challenge.starterCode;
  });

  const [output, setOutput] = useState("");
  const [tests, setTests] = useState(mockContent.challenge.tests);
  const [completed, setCompleted] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "challenge">("content");
  const [showXPToast, setShowXPToast] = useState(false);

  // Hints
  const [showHints, setShowHints] = useState(false);
  const [revealedHints, setRevealedHints] = useState(0);

  // Solution
  const [showSolution, setShowSolution] = useState(false);

  // Auto-save
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [saveIndicator, setSaveIndicator] = useState(false);

  const course = mockCourses.find((c) => c.id === slug);

  // Load completion state
  useEffect(() => {
    if (!publicKey) return;
    const key = `lesson_${publicKey.toBase58()}_${slug}_${id}`;
    if (localStorage.getItem(key) === "true") setCompleted(true);
  }, [publicKey, slug, id]);

  // Auto-save code every 3 seconds
  const autoSave = useCallback((val: string) => {
    localStorage.setItem(AUTO_SAVE_KEY, val);
    setLastSaved(new Date().toLocaleTimeString());
    setSaveIndicator(true);
    setTimeout(() => setSaveIndicator(false), 1500);
  }, [AUTO_SAVE_KEY]);

  useEffect(() => {
    const timer = setTimeout(() => autoSave(code), 3000);
    return () => clearTimeout(timer);
  }, [code, autoSave]);

  function handleCodeChange(val: string | undefined) {
    setCode(val || "");
  }

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

  function revealNextHint() {
    if (revealedHints < mockContent.challenge.hints.length) {
      setRevealedHints(prev => prev + 1);
    }
  }

  function resetCode() {
    setCode(mockContent.challenge.starterCode);
    localStorage.removeItem(AUTO_SAVE_KEY);
    setShowSolution(false);
  }

  return (
    <div className="h-screen bg-[#020202] flex flex-col overflow-hidden">

      {/* XP Toast */}
      {showXPToast && (
        <div className="fixed top-20 right-4 md:right-6 z-50 bg-[#14f195] text-black px-4 py-3 font-mono text-xs uppercase tracking-widest flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          +XP EARNED! LEVEL UP POSSIBLE
        </div>
      )}

      {/* Top bar */}
      <div className="border-b border-[#1a1a1a] px-4 md:px-6 py-3 flex items-center justify-between shrink-0 gap-2">
        <Link
          href={`/courses/${slug}`}
          className="flex items-center gap-2 text-[10px] font-mono text-[#444] hover:text-[#9945ff] transition-colors uppercase tracking-widest shrink-0"
        >
          <ArrowLeft className="w-3 h-3" />
          <span className="hidden sm:block">{course?.title || "BACK"}</span>
        </Link>

        <div className="flex items-center gap-3">
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
            "px-4 md:px-6 py-3 text-[10px] font-mono uppercase tracking-widest transition-colors border-r border-[#1a1a1a]",
            activeTab === "content" ? "text-[#9945ff] bg-[#0a0a0a]" : "text-[#444] hover:text-[#f5f5f0]"
          )}
        >
          CONTENT
        </button>
        <button
          onClick={() => setActiveTab("challenge")}
          className={cn(
            "px-4 md:px-6 py-3 text-[10px] font-mono uppercase tracking-widest transition-colors border-r border-[#1a1a1a]",
            activeTab === "challenge" ? "text-[#9945ff] bg-[#0a0a0a]" : "text-[#444] hover:text-[#f5f5f0]"
          )}
        >
          CHALLENGE
        </button>

        <div className="ml-auto flex items-center px-4 gap-3">
          {/* Auto-save indicator */}
          {saveIndicator && (
            <span className="flex items-center gap-1 text-[9px] font-mono text-[#14f195]">
              <Save className="w-3 h-3" /> SAVED
            </span>
          )}
          {lastSaved && !saveIndicator && (
            <span className="text-[9px] font-mono text-[#333] hidden sm:block">
              SAVED {lastSaved}
            </span>
          )}
          {completed ? (
            <span className="flex items-center gap-1.5 text-[10px] font-mono text-[#14f195]">
              <CheckCircle className="w-3 h-3" />
              <span className="hidden sm:block">COMPLETE +100_XP</span>
            </span>
          ) : (
            <span className="text-[10px] font-mono text-[#333] hidden sm:block">
              +100_XP ON_COMPLETION
            </span>
          )}
        </div>
      </div>

      {/* Content tab */}
      {activeTab === "content" ? (
        <div className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
            <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-8">
              // {mockContent.title}
            </div>
            <div className="space-y-4">
              {mockContent.content.map((block, i) => {
                if (block.type === "heading") return (
                  <h1 key={i} className="font-display font-black text-2xl md:text-3xl uppercase tracking-tight text-[#f5f5f0] mt-8 mb-4">{block.text}</h1>
                );
                if (block.type === "subheading") return (
                  <h2 key={i} className="font-display font-black text-lg md:text-xl uppercase tracking-tight text-[#9945ff] mt-8 mb-3">{block.text}</h2>
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
            <div className="mt-12 flex items-center justify-between flex-wrap gap-4">
              <button
                onClick={() => markComplete(100)}
                disabled={completed}
                className={cn(
                  "flex items-center gap-2 px-5 md:px-6 py-3 font-mono text-xs uppercase tracking-widest transition-colors",
                  completed
                    ? "bg-[#14f195] text-black cursor-default"
                    : "border border-[#1a1a1a] text-[#444] hover:border-[#14f195] hover:text-[#14f195]"
                )}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                {completed ? "COMPLETED ✓" : "MARK_COMPLETE (+100 XP)"}
              </button>

              <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                <button
                  onClick={() => setActiveTab("challenge")}
                  className="px-4 md:px-5 py-3 border border-[#1a1a1a] text-[#444] font-mono text-xs uppercase tracking-widest hover:border-[#9945ff] hover:text-[#9945ff] transition-colors"
                >
                  TRY_CHALLENGE
                </button>
                <Link href={`/courses/${slug}/lessons/${id + 1}`}>
                  <button className="flex items-center gap-2 px-5 md:px-6 py-3 bg-[#9945ff] text-white font-mono text-xs uppercase tracking-widest hover:bg-[#8835ef] transition-colors">
                    NEXT <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

      ) : (
        /* Challenge tab */
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">

          {/* Left: prompt + hints + tests + output */}
          <div className="border-r border-[#1a1a1a] overflow-auto">
            <div className="p-4 md:p-6">
              <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-4">// CHALLENGE</div>
              <h2 className="font-display font-black text-xl md:text-2xl uppercase tracking-tight mb-6">
                {mockContent.challenge.prompt}
              </h2>

              {/* Tests */}
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

              {/* Output */}
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

              {/* Hints section */}
              <div className="border border-[#1a1a1a] mb-4">
                <button
                  onClick={() => setShowHints(!showHints)}
                  className="w-full flex items-center justify-between px-4 py-3 text-[10px] font-mono text-[#444] hover:text-[#f5a623] transition-colors uppercase tracking-widest"
                >
                  <span className="flex items-center gap-2">
                    <Lightbulb className="w-3.5 h-3.5" />
                    HINTS ({revealedHints}/{mockContent.challenge.hints.length})
                  </span>
                  <span>{showHints ? "▲" : "▼"}</span>
                </button>
                {showHints && (
                  <div className="border-t border-[#1a1a1a] p-4 space-y-3">
                    {mockContent.challenge.hints.slice(0, revealedHints).map((hint, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs font-mono text-[#f5a623]">
                        <span className="shrink-0">#{i + 1}</span>
                        <span>{hint}</span>
                      </div>
                    ))}
                    {revealedHints < mockContent.challenge.hints.length ? (
                      <button
                        onClick={revealNextHint}
                        className="text-[10px] font-mono text-[#f5a623] border border-[#f5a623]/30 px-3 py-1.5 hover:bg-[#f5a623]/10 transition-colors uppercase tracking-widest"
                      >
                        REVEAL HINT #{revealedHints + 1}
                      </button>
                    ) : (
                      <div className="text-[10px] font-mono text-[#333]">All hints revealed</div>
                    )}
                  </div>
                )}
              </div>

              {/* Solution toggle */}
              <div className="border border-[#ff3366]/20 mb-4">
                <button
                  onClick={() => setShowSolution(!showSolution)}
                  className="w-full flex items-center justify-between px-4 py-3 text-[10px] font-mono text-[#ff3366]/60 hover:text-[#ff3366] transition-colors uppercase tracking-widest"
                >
                  <span className="flex items-center gap-2">
                    {showSolution ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showSolution ? "HIDE SOLUTION" : "SHOW SOLUTION"}
                  </span>
                  <span className="text-[9px] text-[#333]">SPOILER</span>
                </button>
                {showSolution && (
                  <div className="border-t border-[#ff3366]/20">
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-[#ff3366]/10 bg-[#ff3366]/5">
                      <span className="text-[9px] font-mono text-[#ff3366] uppercase tracking-widest">Solution</span>
                    </div>
                    <pre className="p-4 text-xs font-mono text-[#14f195] leading-relaxed overflow-x-auto">
                      {mockContent.challenge.solutionCode}
                    </pre>
                    <div className="px-4 pb-3">
                      <button
                        onClick={() => { setCode(mockContent.challenge.solutionCode); setShowSolution(false); }}
                        className="text-[10px] font-mono text-[#9945ff] border border-[#9945ff]/30 px-3 py-1.5 hover:bg-[#9945ff]/10 transition-colors uppercase tracking-widest"
                      >
                        USE SOLUTION
                      </button>
                    </div>
                  </div>
                )}
              </div>

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
              <div className="ml-auto flex items-center gap-3">
                {saveIndicator && (
                  <span className="flex items-center gap-1 text-[9px] font-mono text-[#14f195]">
                    <Save className="w-3 h-3" /> AUTO-SAVED
                  </span>
                )}
                <button
                  onClick={resetCode}
                  className="text-[9px] font-mono text-[#333] hover:text-[#ff3366] transition-colors uppercase tracking-widest"
                >
                  RESET
                </button>
              </div>
            </div>

            <div className="flex-1" style={{ minHeight: 0 }}>
              <Editor
                height="100%"
                defaultLanguage="rust"
                value={code}
                onChange={handleCodeChange}
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

            <div className="border-t border-[#1a1a1a] p-3 md:p-4 flex items-center justify-between shrink-0">
              <span className="text-[10px] font-mono text-[#333] uppercase tracking-widest hidden sm:block">
                RUST // SOLANA_PROGRAM
              </span>
              <button
                onClick={runCode}
                className="flex items-center gap-2 px-4 md:px-5 py-2 bg-[#9945ff] text-white font-mono text-xs uppercase tracking-widest hover:bg-[#8835ef] transition-colors ml-auto"
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
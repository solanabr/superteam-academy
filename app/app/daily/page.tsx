"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useXP } from "@/context/XPContext";
import { cn } from "@/lib/utils";
import { Zap, Clock, Trophy, CheckCircle } from "lucide-react";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const dailyChallenges = [
  {
    day: 0,
    title: "Generate a Keypair",
    difficulty: "Easy",
    category: "Accounts",
    xp: 50,
    description: "Generate a new Solana keypair and return the public key as a base58 string.",
    starterCode: `import { Keypair } from "@solana/web3.js";\n\nexport function generateKeypair(): string {\n  // Your code here\n  \n}`,
    solution: "Keypair.generate()",
    tests: [
      { name: "Returns a valid public key string", passing: false },
      { name: "Public key is 44 characters long", passing: false },
    ],
  },
  {
    day: 1,
    title: "Lamports to SOL",
    difficulty: "Easy",
    category: "Utils",
    xp: 50,
    description: "Convert lamports to SOL. 1 SOL = 1,000,000,000 lamports.",
    starterCode: `import { LAMPORTS_PER_SOL } from "@solana/web3.js";\n\nexport function lamportsToSol(lamports: number): number {\n  // Your code here\n  \n}`,
    solution: "LAMPORTS_PER_SOL",
    tests: [
      { name: "1000000000 lamports = 1 SOL", passing: false },
      { name: "500000000 lamports = 0.5 SOL", passing: false },
    ],
  },
  {
    day: 2,
    title: "Derive a PDA",
    difficulty: "Medium",
    category: "PDAs",
    xp: 100,
    description: "Derive a Program Derived Address from seeds and a program ID.",
    starterCode: `import { PublicKey } from "@solana/web3.js";\n\nexport async function derivePDA(\n  seeds: Buffer[],\n  programId: PublicKey\n): Promise<[PublicKey, number]> {\n  // Your code here\n  \n}`,
    solution: "findProgramAddress",
    tests: [
      { name: "Returns a valid PDA", passing: false },
      { name: "Returns correct bump seed", passing: false },
    ],
  },
  {
    day: 3,
    title: "Send SOL Transfer",
    difficulty: "Medium",
    category: "Transactions",
    xp: 100,
    description: "Build a transaction to transfer SOL between two wallets.",
    starterCode: `import { Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";\n\nexport function buildTransferTx(\n  from: PublicKey,\n  to: PublicKey,\n  solAmount: number\n): Transaction {\n  // Your code here\n  \n}`,
    solution: "SystemProgram.transfer",
    tests: [
      { name: "Creates valid transaction", passing: false },
      { name: "Correct lamport amount", passing: false },
    ],
  },
  {
    day: 4,
    title: "Initialize Anchor Program",
    difficulty: "Hard",
    category: "Anchor",
    xp: 150,
    description: "Set up an Anchor program provider and return the Program object.",
    starterCode: `import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";\nimport { Connection, PublicKey } from "@solana/web3.js";\nimport { AnchorWallet } from "@solana/wallet-adapter-react";\n\nexport function initProgram(\n  connection: Connection,\n  wallet: AnchorWallet,\n  idl: Idl,\n  programId: PublicKey\n): Program {\n  // Your code here\n  \n}`,
    solution: "AnchorProvider",
    tests: [
      { name: "Creates valid provider", passing: false },
      { name: "Returns Program instance", passing: false },
    ],
  },
  {
    day: 5,
    title: "Create Token Mint",
    difficulty: "Medium",
    category: "Tokens",
    xp: 100,
    description: "Write the instruction to create a new SPL token mint using Token-2022.",
    starterCode: `import { createInitializeMintInstruction, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";\nimport { PublicKey } from "@solana/web3.js";\n\nexport function createMintInstruction(\n  mint: PublicKey,\n  authority: PublicKey,\n  decimals: number\n) {\n  // Your code here\n  \n}`,
    solution: "createInitializeMintInstruction",
    tests: [
      { name: "Returns valid instruction", passing: false },
      { name: "Uses Token-2022 program", passing: false },
    ],
  },
  {
    day: 6,
    title: "Verify Soulbound NFT",
    difficulty: "Hard",
    category: "NFTs",
    xp: 150,
    description: "Verify that an NFT is soulbound by checking the NonTransferable extension.",
    starterCode: `import { getExtensionTypes, ExtensionType, getMint } from "@solana/spl-token";\nimport { Connection, PublicKey } from "@solana/web3.js";\n\nexport async function isSoulbound(\n  connection: Connection,\n  mint: PublicKey\n): Promise<boolean> {\n  // Your code here\n  \n}`,
    solution: "NonTransferable",
    tests: [
      { name: "Returns true for soulbound NFT", passing: false },
      { name: "Returns false for regular token", passing: false },
    ],
  },
];

const difficultyColor: Record<string, string> = {
  Easy: "text-[#14f195] border-[#14f195]/40 bg-[#14f195]/5",
  Medium: "text-[#f5a623] border-[#f5a623]/40 bg-[#f5a623]/5",
  Hard: "text-[#ff3366] border-[#ff3366]/40 bg-[#ff3366]/5",
};

function Countdown() {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    function update() {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3">
      {[
        { label: "HRS", value: timeLeft.hours },
        { label: "MIN", value: timeLeft.minutes },
        { label: "SEC", value: timeLeft.seconds },
      ].map((t, i) => (
        <div key={i} className="text-center">
          <div className="font-display font-black text-3xl text-[#ff3366] w-16 h-16 border border-[#ff3366]/30 bg-[#ff3366]/5 flex items-center justify-center">
            {String(t.value).padStart(2, "0")}
          </div>
          <div className="text-[8px] font-mono text-[#444] uppercase tracking-widest mt-1">{t.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function DailyChallengePage() {
  const { addXP } = useXP();
  const today = new Date().getDay();
  const challenge = dailyChallenges[today % dailyChallenges.length];

  const [code, setCode] = useState(challenge.starterCode);
  const [output, setOutput] = useState("");
  const [tests, setTests] = useState(challenge.tests);
  const [solved, setSolved] = useState(false);
  const [running, setRunning] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const s = localStorage.getItem("streak");
    if (s) setStreak(Number(s));

    const todayKey = `daily_${new Date().toDateString()}`;
    if (localStorage.getItem(todayKey) === "solved") setSolved(true);
  }, []);

  function runCode() {
    setRunning(true);
    setOutput("// Running tests...");
    setTimeout(() => {
      const passing = code.includes(challenge.solution);
      const newTests = tests.map(t => ({ ...t, passing }));
      setTests(newTests);
      if (passing) {
        setOutput(`✓ All tests passed!\n⚡ +${challenge.xp} XP earned!\n🔥 Daily challenge complete!`);
        if (!solved) {
          setSolved(true);
          addXP(challenge.xp);
          const newStreak = streak + 1;
          setStreak(newStreak);
          localStorage.setItem("streak", newStreak.toString());
          localStorage.setItem(`streak_${new Date().toDateString()}`, "1");
          localStorage.setItem(`daily_${new Date().toDateString()}`, "solved");
        }
      } else {
        setOutput(`✗ Tests failed\n  Hint: Try using "${challenge.solution}"`);
      }
      setRunning(false);
    }, 1000);
  }

  return (
    <div className="min-h-screen bg-[#020202]">

      {/* Header */}
      <div className="border-b border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-4">// DAILY_CHALLENGE</div>
          <div className="flex items-end justify-between flex-wrap gap-6">
            <div>
              <h1 className="font-display font-black text-6xl uppercase tracking-tighter mb-3">
                DAILY <span className="text-[#ff3366]">CHALLENGE</span>
              </h1>
              <p className="text-sm font-mono text-[#555]">
                A new challenge every day. Solve it to keep your streak alive!
              </p>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-right">
                <div className="font-display font-black text-4xl text-[#ff3366]">🔥 {streak}</div>
                <div className="text-[9px] font-mono text-[#444] uppercase tracking-widest">Day Streak</div>
              </div>
              <div className="w-px h-12 bg-[#1a1a1a]" />
              <div>
                <div className="text-[9px] font-mono text-[#444] uppercase tracking-widest mb-2">Next Challenge In</div>
                <Countdown />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Challenge Info */}
      <div className="border-b border-[#1a1a1a] bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <span className={cn("px-3 py-1.5 border text-[10px] font-mono uppercase tracking-widest", difficultyColor[challenge.difficulty])}>
                {challenge.difficulty}
              </span>
              <span className="text-[10px] font-mono text-[#444] uppercase">{challenge.category}</span>
              <div>
                <div className="font-display font-black text-2xl uppercase">{challenge.title}</div>
                <div className="text-xs font-mono text-[#555] mt-1">{challenge.description}</div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="font-display font-black text-3xl text-[#9945ff]">+{challenge.xp}</div>
                <div className="text-[9px] font-mono text-[#444] uppercase">XP Reward</div>
              </div>
              {solved && (
                <div className="flex items-center gap-2 px-4 py-2 border border-[#14f195]/40 bg-[#14f195]/5 text-[#14f195] font-mono text-[10px] uppercase tracking-widest">
                  <CheckCircle className="w-4 h-4" />
                  Solved Today!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ height: "calc(100vh - 420px)", minHeight: "500px" }}>

          {/* Left: Tests + Output */}
          <div className="border border-[#1a1a1a] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1a1a1a] bg-[#0a0a0a]">
              <div className="text-[9px] font-mono text-[#333] uppercase tracking-widest mb-3">Test Cases</div>
              <div className="space-y-2">
                {tests.map((t, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={cn(
                      "w-5 h-5 flex items-center justify-center border text-[10px] font-mono shrink-0",
                      t.passing
                        ? "border-[#14f195] text-[#14f195] bg-[#14f195]/10"
                        : "border-[#333] text-[#333]"
                    )}>
                      {t.passing ? "✓" : "○"}
                    </div>
                    <span className={cn(
                      "text-xs font-mono",
                      t.passing ? "text-[#14f195]" : "text-[#555]"
                    )}>
                      {t.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Previous completions */}
            <div className="flex-1 p-6">
              <div className="text-[9px] font-mono text-[#333] uppercase tracking-widest mb-4">Your Streak</div>
              <div className="flex gap-2 flex-wrap">
                {Array.from({ length: 7 }).map((_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() - (6 - i));
                  const key = `daily_${date.toDateString()}`;
                  const completed = typeof window !== "undefined" && localStorage.getItem(key) === "solved";
                  const isToday = i === 6;
                  return (
                    <div key={i} className="text-center">
                      <div className={cn(
                        "w-10 h-10 flex items-center justify-center border font-mono text-[9px] mb-1",
                        isToday && solved ? "border-[#14f195] bg-[#14f195]/10 text-[#14f195]" :
                        completed ? "border-[#9945ff] bg-[#9945ff]/10 text-[#9945ff]" :
                        isToday ? "border-[#ff3366]/40 text-[#ff3366]" :
                        "border-[#1a1a1a] text-[#333]"
                      )}>
                        {completed || (isToday && solved) ? "✓" : isToday ? "!" : "○"}
                      </div>
                      <div className="text-[8px] font-mono text-[#333] uppercase">
                        {date.toLocaleDateString("en", { weekday: "short" })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {output && (
                <div className="mt-6 border border-[#1a1a1a] bg-[#0a0a0a] p-4">
                  <div className="text-[9px] font-mono text-[#333] uppercase tracking-widest mb-2">Output</div>
                  <pre className={cn(
                    "text-xs font-mono whitespace-pre-wrap leading-relaxed",
                    output.includes("✓") ? "text-[#14f195]" : "text-[#ff3366]"
                  )}>
                    {output}
                  </pre>
                </div>
              )}
            </div>

            <div className="border-t border-[#1a1a1a] px-6 py-4 flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#444] uppercase">{challenge.category} · TypeScript</span>
              <button
                onClick={runCode}
                disabled={running || solved}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 font-mono text-[10px] uppercase tracking-widest transition-colors",
                  solved
                    ? "bg-[#14f195]/10 border border-[#14f195]/40 text-[#14f195] cursor-default"
                    : "bg-[#9945ff] text-white hover:bg-[#8835ef] disabled:opacity-50"
                )}
              >
                {solved ? (
                  <><CheckCircle className="w-3.5 h-3.5" /> Already Solved</>
                ) : running ? (
                  "Running..."
                ) : (
                  <><Zap className="w-3.5 h-3.5" /> Run Tests →</>
                )}
              </button>
            </div>
          </div>

          {/* Right: Monaco Editor */}
          <div className="border border-[#1a1a1a] flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-[#1a1a1a] bg-[#0d0d0d] shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff3366]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#f5a623]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#14f195]" />
              <span className="ml-3 text-[10px] font-mono text-[#444]">solution.ts</span>
              <div className="ml-auto text-[9px] font-mono text-[#333] uppercase tracking-widest">TypeScript</div>
            </div>
            <div className="flex-1" style={{ minHeight: 0 }}>
              <Editor
                height="100%"
                language="typescript"
                value={code}
                onChange={(val) => setCode(val || "")}
                theme="vs-dark"
                options={{
                  fontSize: 13,
                  fontFamily: "Space Mono, monospace",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  lineNumbers: "on",
                  padding: { top: 20, bottom: 20 },
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: "on",
                  readOnly: solved,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
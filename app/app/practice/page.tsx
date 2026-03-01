"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useXP } from "@/context/XPContext";
import { cn } from "@/lib/utils";
import { Terminal, Zap, CheckCircle } from "lucide-react";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const challenges = [
  {
    id: 1,
    title: "Generate a Keypair",
    difficulty: "Easy",
    category: "Accounts",
    language: "TypeScript",
    xp: 10,
    description: "Generate a new Solana keypair and return the public key as a base58 string.",
    starterCode: `import { Keypair } from "@solana/web3.js";\n\nexport function generateKeypair(): string {\n  // Your code here\n  \n}`,
    solution: "Keypair.generate()",
    tests: [
      { name: "Returns a valid public key string", passing: false },
      { name: "Public key is 44 characters long", passing: false },
    ],
  },
  {
    id: 2,
    title: "Validate a Public Key",
    difficulty: "Easy",
    category: "Accounts",
    language: "TypeScript",
    xp: 10,
    description: "Write a function that validates whether a string is a valid Solana public key.",
    starterCode: `import { PublicKey } from "@solana/web3.js";\n\nexport function isValidPublicKey(address: string): boolean {\n  // Your code here\n  \n}`,
    solution: "PublicKey",
    tests: [
      { name: "Returns true for valid public key", passing: false },
      { name: "Returns false for invalid string", passing: false },
    ],
  },
  {
    id: 3,
    title: "Create a Connection",
    difficulty: "Easy",
    category: "Network",
    language: "TypeScript",
    xp: 15,
    description: "Create a connection to the Solana devnet cluster.",
    starterCode: `import { Connection, clusterApiUrl } from "@solana/web3.js";\n\nexport function createDevnetConnection(): Connection {\n  // Your code here\n  \n}`,
    solution: "clusterApiUrl",
    tests: [
      { name: "Returns a Connection object", passing: false },
      { name: "Connects to devnet", passing: false },
    ],
  },
  {
    id: 4,
    title: "Lamports to SOL",
    difficulty: "Easy",
    category: "Utils",
    language: "TypeScript",
    xp: 10,
    description: "Convert lamports to SOL. 1 SOL = 1,000,000,000 lamports.",
    starterCode: `import { LAMPORTS_PER_SOL } from "@solana/web3.js";\n\nexport function lamportsToSol(lamports: number): number {\n  // Your code here\n  \n}`,
    solution: "LAMPORTS_PER_SOL",
    tests: [
      { name: "1000000000 lamports = 1 SOL", passing: false },
      { name: "500000000 lamports = 0.5 SOL", passing: false },
    ],
  },
  {
    id: 5,
    title: "Derive a PDA",
    difficulty: "Medium",
    category: "PDAs",
    language: "TypeScript",
    xp: 25,
    description: "Derive a Program Derived Address (PDA) from seeds and a program ID.",
    starterCode: `import { PublicKey } from "@solana/web3.js";\n\nexport async function derivePDA(\n  seeds: Buffer[],\n  programId: PublicKey\n): Promise<[PublicKey, number]> {\n  // Your code here\n  \n}`,
    solution: "findProgramAddress",
    tests: [
      { name: "Returns a valid PDA", passing: false },
      { name: "Returns correct bump seed", passing: false },
    ],
  },
  {
    id: 6,
    title: "Send SOL Transfer",
    difficulty: "Medium",
    category: "Transactions",
    language: "TypeScript",
    xp: 30,
    description: "Build a transaction to transfer SOL between two wallets using SystemProgram.",
    starterCode: `import { Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";\n\nexport function buildTransferTx(\n  from: PublicKey,\n  to: PublicKey,\n  solAmount: number\n): Transaction {\n  // Your code here\n  \n}`,
    solution: "SystemProgram.transfer",
    tests: [
      { name: "Creates valid transaction", passing: false },
      { name: "Correct lamport amount", passing: false },
    ],
  },
  {
    id: 7,
    title: "Decode Account Data",
    difficulty: "Medium",
    category: "Accounts",
    language: "TypeScript",
    xp: 25,
    description: "Use Borsh deserialization to decode account data from a Buffer.",
    starterCode: `import { deserializeUnchecked } from "borsh";\n\nclass MyAccount {\n  authority: Uint8Array;\n  balance: number;\n  constructor(fields: any) {\n    this.authority = fields.authority;\n    this.balance = fields.balance;\n  }\n}\n\nexport function decodeAccount(data: Buffer): MyAccount {\n  // Your code here\n  \n}`,
    solution: "deserializeUnchecked",
    tests: [
      { name: "Decodes authority field", passing: false },
      { name: "Decodes balance field", passing: false },
    ],
  },
  {
    id: 8,
    title: "Create Token Mint",
    difficulty: "Medium",
    category: "Tokens",
    language: "TypeScript",
    xp: 35,
    description: "Write the instruction to create a new SPL token mint using Token-2022.",
    starterCode: `import { createInitializeMintInstruction, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";\nimport { PublicKey } from "@solana/web3.js";\n\nexport function createMintInstruction(\n  mint: PublicKey,\n  authority: PublicKey,\n  decimals: number\n) {\n  // Your code here\n  \n}`,
    solution: "createInitializeMintInstruction",
    tests: [
      { name: "Returns valid instruction", passing: false },
      { name: "Uses Token-2022 program", passing: false },
    ],
  },
  {
    id: 9,
    title: "Initialize Anchor Program",
    difficulty: "Hard",
    category: "Anchor",
    language: "TypeScript",
    xp: 50,
    description: "Set up an Anchor program provider and return the Program object.",
    starterCode: `import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";\nimport { Connection, PublicKey } from "@solana/web3.js";\nimport { AnchorWallet } from "@solana/wallet-adapter-react";\n\nexport function initProgram(\n  connection: Connection,\n  wallet: AnchorWallet,\n  idl: Idl,\n  programId: PublicKey\n): Program {\n  // Your code here\n  \n}`,
    solution: "AnchorProvider",
    tests: [
      { name: "Creates valid provider", passing: false },
      { name: "Returns Program instance", passing: false },
    ],
  },
  {
    id: 10,
    title: "Verify Soulbound NFT",
    difficulty: "Hard",
    category: "NFTs",
    language: "TypeScript",
    xp: 60,
    description: "Verify that an NFT is soulbound by checking the NonTransferable extension.",
    starterCode: `import { getExtensionTypes, ExtensionType, getMint } from "@solana/spl-token";\nimport { Connection, PublicKey } from "@solana/web3.js";\n\nexport async function isSoulbound(\n  connection: Connection,\n  mint: PublicKey\n): Promise<boolean> {\n  // Your code here\n  \n}`,
    solution: "NonTransferable",
    tests: [
      { name: "Returns true for soulbound NFT", passing: false },
      { name: "Returns false for regular token", passing: false },
    ],
  },
  {
    id: 11,
    title: "Build Merkle Root",
    difficulty: "Hard",
    category: "Advanced",
    language: "TypeScript",
    xp: 75,
    description: "Implement a simple Merkle tree and return the root hash from an array of leaves.",
    starterCode: `import { createHash } from "crypto";\n\nexport function buildMerkleRoot(leaves: string[]): string {\n  // Your code here\n  \n}`,
    solution: "createHash",
    tests: [
      { name: "Returns correct root hash", passing: false },
      { name: "Handles single leaf", passing: false },
    ],
  },
  {
    id: 12,
    title: "Concurrent Merkle Tree Append",
    difficulty: "Hard",
    category: "Advanced",
    language: "TypeScript",
    xp: 80,
    description: "Implement the append logic for a concurrent Merkle tree used by Bubblegum.",
    starterCode: `import { PublicKey } from "@solana/web3.js";\n\nexport function appendLeaf(\n  tree: PublicKey,\n  leaf: Buffer,\n  proof: Buffer[]\n): Promise<string> {\n  // Your code here\n  \n}`,
    solution: "proof",
    tests: [
      { name: "Appends leaf correctly", passing: false },
      { name: "Updates root hash", passing: false },
    ],
  },
];

const difficultyColor: Record<string, string> = {
  Easy: "text-[#14f195] border-[#14f195]/40 bg-[#14f195]/5",
  Medium: "text-[#f5a623] border-[#f5a623]/40 bg-[#f5a623]/5",
  Hard: "text-[#ff3366] border-[#ff3366]/40 bg-[#ff3366]/5",
};

export default function PracticePage() {
  const { publicKey } = useWallet();
  const { addXP } = useXP();
  const [selected, setSelected] = useState(challenges[0]);
  const [code, setCode] = useState(challenges[0].starterCode);
  const [output, setOutput] = useState("");
  const [tests, setTests] = useState(challenges[0].tests);
  const [solved, setSolved] = useState<number[]>([]);
  const [running, setRunning] = useState(false);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const todayChallenge = challenges[0]; // Always use first challenge as daily

  const filtered = challenges.filter(c => {
    const matchDiff = filter === "All" || c.difficulty === filter;
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    return matchDiff && matchSearch;
  });

  const totalXP = solved.reduce((acc, id) => {
    const ch = challenges.find(c => c.id === id);
    return acc + (ch?.xp || 0);
  }, 0);

  function selectChallenge(c: typeof challenges[0]) {
    setSelected(c);
    setCode(c.starterCode);
    setOutput("");
    setTests(c.tests);
  }

  function runCode() {
    setRunning(true);
    setOutput("// Running tests...");
    setTimeout(() => {
      const passing = code.includes(selected.solution);
      const newTests = tests.map(t => ({ ...t, passing }));
      setTests(newTests);
      if (passing) {
        setOutput(`✓ All tests passed!\n⚡ +${selected.xp} XP earned!`);
        if (!solved.includes(selected.id)) {
          setSolved(prev => [...prev, selected.id]);
          addXP(selected.xp);
        }
      } else {
        setOutput(`✗ Tests failed\n  Hint: Try using "${selected.solution}"`);
      }
      setRunning(false);
    }, 1000);
  }

  return (
    <div className="min-h-screen bg-[#020202] flex flex-col">

      {/* Page Header */}
      <div className="border-b border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-8 py-10">
          <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-3">// PRACTICE_ARENA</div>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="font-display font-black text-6xl uppercase tracking-tighter leading-none mb-3">
                PRACTICE <span className="text-[#9945ff]">ARENA</span>
              </h1>
              <p className="text-sm font-mono text-[#555]">
                Sharpen your Solana skills with hands-on coding challenges
              </p>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-right">
                <div className="font-display font-black text-4xl text-[#14f195]">
                  {solved.length}<span className="text-[#333] text-2xl">/{challenges.length}</span>
                </div>
                <div className="text-[10px] font-mono text-[#444] uppercase tracking-widest">Solved</div>
              </div>
              <div className="w-px h-12 bg-[#1a1a1a]" />
              <div className="text-right">
                <div className="font-display font-black text-4xl text-[#9945ff]">{totalXP}</div>
                <div className="text-[10px] font-mono text-[#444] uppercase tracking-widest">XP Earned</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Challenge */}
      <div className="border-b border-[#1a1a1a] bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2 shrink-0">
                <Zap className="w-4 h-4 text-[#ff3366]" />
                <span className="text-[11px] font-mono text-[#ff3366] uppercase tracking-widest font-bold">
                  Daily Challenge
                </span>
              </div>
              <div className={cn("px-3 py-1 border text-[10px] font-mono uppercase tracking-widest rounded-sm shrink-0", difficultyColor[todayChallenge.difficulty])}>
                {todayChallenge.difficulty}
              </div>
              <div>
                <div className="text-sm font-mono text-[#f5f5f0] uppercase font-bold">
                  {todayChallenge.title}
                </div>
                <div className="text-[10px] font-mono text-[#555] mt-0.5">
                  {todayChallenge.description}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6 shrink-0">
              <div className="text-right">
                <div className="text-sm font-mono text-[#9945ff] font-bold">+{todayChallenge.xp * 2} XP</div>
                <div className="text-[9px] font-mono text-[#444] uppercase">Bonus Reward</div>
              </div>
              <button
  onClick={() => {
    setFilter("All");
    setSearch("");
    selectChallenge(challenges[0]);
  }}
  className="px-6 py-3 bg-[#9945ff] text-white font-mono text-[11px] uppercase tracking-widest hover:bg-[#8835ef] transition-colors flex items-center gap-2"
>
  <Zap className="w-3.5 h-3.5" />
  Solve Now →
</button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex flex-1 max-w-7xl mx-auto w-full" style={{ height: "calc(100vh - 340px)", minHeight: "580px" }}>

        {/* Left Panel - Challenge List */}
        <div className="w-[380px] border-r border-[#1a1a1a] flex flex-col shrink-0">

          {/* Search & Filter */}
          <div className="p-5 border-b border-[#1a1a1a] space-y-3">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search challenges..."
              className="w-full bg-[#0a0a0a] border border-[#1a1a1a] px-4 py-2.5 text-[11px] font-mono text-[#f5f5f0] placeholder-[#333] focus:outline-none focus:border-[#9945ff] transition-colors"
            />
            <div className="flex gap-2">
              {["All", "Easy", "Medium", "Hard"].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "flex-1 py-2 text-[10px] font-mono uppercase tracking-widest border transition-colors",
                    filter === f
                      ? "border-[#9945ff] text-[#9945ff] bg-[#9945ff]/10"
                      : "border-[#1a1a1a] text-[#444] hover:text-[#f5f5f0] hover:border-[#333]"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Rank Progress */}
          <div className="px-5 py-4 border-b border-[#1a1a1a] bg-[#0a0a0a]">
            <div className="text-[9px] font-mono text-[#333] uppercase tracking-widest mb-3">Rank Progress</div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Bronze", req: 3, icon: "🥉" },
                { label: "Silver", req: 6, icon: "🥈" },
                { label: "Gold", req: 9, icon: "🥇" },
                { label: "Diamond", req: 12, icon: "💎" },
              ].map(rank => (
                <div key={rank.label} className={cn(
                  "flex flex-col items-center p-2 border text-center transition-colors",
                  solved.length >= rank.req
                    ? "border-[#14f195]/40 bg-[#14f195]/5"
                    : "border-[#1a1a1a]"
                )}>
                  <span className="text-lg mb-1">{rank.icon}</span>
                  <div className="text-[8px] font-mono text-[#444] uppercase">{rank.label}</div>
                  <div className={cn(
                    "text-[9px] font-mono mt-0.5",
                    solved.length >= rank.req ? "text-[#14f195]" : "text-[#333]"
                  )}>
                    {Math.min(solved.length, rank.req)}/{rank.req}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Challenge List */}
          <div className="flex-1 overflow-auto">
            {filtered.map((c, i) => (
              <button
                key={c.id}
                onClick={() => selectChallenge(c)}
                className={cn(
                  "w-full flex items-center gap-4 px-5 py-4 text-left transition-all border-b border-[#1a1a1a] hover:bg-[#0a0a0a]",
                  selected.id === c.id
                    ? "bg-[#0a0a0a] border-l-2 border-l-[#9945ff] pl-[18px]"
                    : "border-l-2 border-l-transparent"
                )}
              >
                {/* Number / Check */}
                <div className="w-7 h-7 flex items-center justify-center shrink-0 border border-[#1a1a1a] bg-[#020202]">
                  {solved.includes(c.id) ? (
                    <CheckCircle className="w-3.5 h-3.5 text-[#14f195]" />
                  ) : (
                    <span className="text-[10px] font-mono text-[#333]">{i + 1}</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "text-[11px] font-mono uppercase font-bold truncate mb-1.5",
                    selected.id === c.id ? "text-[#9945ff]" : "text-[#f5f5f0]"
                  )}>
                    {c.title}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[9px] font-mono uppercase px-1.5 py-0.5 border", difficultyColor[c.difficulty])}>
                      {c.difficulty}
                    </span>
                    <span className="text-[9px] font-mono text-[#444] uppercase">{c.category}</span>
                  </div>
                </div>

                {/* XP */}
                <span className="text-[11px] font-mono text-[#9945ff] shrink-0 font-bold">
                  +{c.xp}XP
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Panel - Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Challenge Info */}
          <div className="border-b border-[#1a1a1a] px-8 py-5 shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className={cn("px-3 py-1 border text-[10px] font-mono uppercase tracking-widest", difficultyColor[selected.difficulty])}>
                    {selected.difficulty}
                  </span>
                  <span className="text-[10px] font-mono text-[#444] uppercase tracking-widest">{selected.category}</span>
                  <span className="text-[10px] font-mono text-[#333] uppercase tracking-widest">{selected.language}</span>
                </div>
                <h2 className="font-display font-black text-3xl uppercase tracking-tight mb-2">
                  {selected.title}
                </h2>
                <p className="text-xs font-mono text-[#555] max-w-xl leading-relaxed">
                  {selected.description}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="font-display font-black text-4xl text-[#9945ff]">+{selected.xp}</div>
                <div className="text-[10px] font-mono text-[#444] uppercase tracking-widest">XP Reward</div>
                {solved.includes(selected.id) && (
                  <div className="flex items-center gap-1 text-[10px] font-mono text-[#14f195] mt-2 justify-end">
                    <CheckCircle className="w-3 h-3" /> SOLVED
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Test Cases */}
          <div className="border-b border-[#1a1a1a] px-8 py-4 bg-[#0a0a0a] shrink-0">
            <div className="text-[9px] font-mono text-[#333] uppercase tracking-widest mb-3">Test Cases</div>
            <div className="flex items-center gap-8">
              {tests.map((t, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className={cn(
                    "w-4 h-4 flex items-center justify-center border text-[9px] font-mono",
                    t.passing
                      ? "border-[#14f195] text-[#14f195] bg-[#14f195]/10"
                      : "border-[#333] text-[#333]"
                  )}>
                    {t.passing ? "✓" : "○"}
                  </div>
                  <span className={cn(
                    "text-[11px] font-mono",
                    t.passing ? "text-[#14f195]" : "text-[#555]"
                  )}>
                    {t.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 flex flex-col" style={{ minHeight: 0 }}>
            <div className="flex items-center gap-2 px-5 py-3 border-b border-[#1a1a1a] bg-[#0d0d0d] shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff3366]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#f5a623]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#14f195]" />
              <span className="ml-3 text-[10px] font-mono text-[#444]">
                {selected.language === "TypeScript" ? "solution.ts" : "main.rs"}
              </span>
              <div className="ml-auto text-[9px] font-mono text-[#333] uppercase tracking-widest">
                {selected.language}
              </div>
            </div>
            <div className="flex-1" style={{ minHeight: 0 }}>
              <Editor
                height="100%"
                language={selected.language === "TypeScript" ? "typescript" : "rust"}
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
                  renderLineHighlight: "all",
                }}
              />
            </div>
          </div>

          {/* Output + Run Button */}
          <div className="border-t border-[#1a1a1a] shrink-0">
            {output && (
              <div className="px-8 py-4 border-b border-[#1a1a1a] bg-[#0a0a0a]">
                <div className="text-[9px] font-mono text-[#333] uppercase tracking-widest mb-2">Output</div>
                <pre className={cn(
                  "text-xs font-mono whitespace-pre-wrap leading-relaxed",
                  output.includes("✓") ? "text-[#14f195]" : "text-[#ff3366]"
                )}>
                  {output}
                </pre>
              </div>
            )}
            <div className="px-8 py-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-mono text-[#444] uppercase tracking-widest">
                  {selected.category} · {selected.language}
                </span>
              </div>
              <button
                onClick={runCode}
                disabled={running}
                className="flex items-center gap-3 px-8 py-3 bg-[#9945ff] text-white font-mono text-[11px] uppercase tracking-widest hover:bg-[#8835ef] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Terminal className="w-4 h-4" />
                {running ? "Running..." : "Run Tests →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
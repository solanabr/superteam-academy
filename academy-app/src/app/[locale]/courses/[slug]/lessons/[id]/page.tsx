"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

// ── DATA ──────────────────────────────────────────────────────────────────────
const LESSON = {
   id: "l7", title: "PDAs and Seeds",
   module: "Accounts & Data Modeling",
   duration: "22 min", xp: 120,
   courseSlug: "anchor-framework",
   courseTitle: "Anchor Framework Deep Dive",
   prev: { id: "l6", title: "#[account] macros deep dive" },
   next: { id: "l8", title: "Rent and storage costs" },
   content: `## Program Derived Addresses (PDAs)

PDAs are a fundamental concept in Solana development. They are **deterministic addresses** that are derived from a program ID and a set of seeds — and crucially, they have **no corresponding private key**.

This makes them perfect for program-controlled accounts that no external wallet can sign for.

### How PDAs are derived

\`\`\`rust
// In your Anchor program
#[account(
    init,
    payer = user,
    space = 8 + UserAccount::INIT_SPACE,
    seeds = [b"user-account", user.key().as_ref()],
    bump,
)]
pub user_account: Account<'info, UserAccount>,
\`\`\`

Anchor automatically handles the \`find_program_address\` call and stores the bump in your account for future use.

### Why PDAs matter

1. **Deterministic** — anyone can recompute the same address from the same seeds
2. **Trustless** — no private key means only the program can sign for it
3. **Composable** — other programs can verify ownership by re-deriving the PDA

### The bump seed

When Solana computes a PDA, it tries seeds with a \`bump\` value (255 down to 0) until it finds a valid off-curve address. Anchor stores this \`bump\` in your account struct:

\`\`\`rust
#[account]
#[derive(InitSpace)]
pub struct UserAccount {
    pub owner: Pubkey,
    pub score: u64,
    pub bump: u8,       // always save the canonical bump!
}
\`\`\`

### Your challenge

In the code editor on the right, complete the \`create_vault\` instruction so that:

- The vault PDA uses seeds \`["vault", user.key()]\`
- The vault account stores the \`owner\` and \`bump\`
- The constraint correctly validates the bump

> 💡 **Hint**: Look at how the \`#[account]\` constraint derives the PDA and how you access \`ctx.bumps.vault\` to get the canonical bump.
`,
   hints: [
      "Use `seeds = [b\"vault\", user.key().as_ref()]` in the account constraint.",
      "Access the canonical bump via `ctx.bumps.vault` inside the instruction handler.",
      "Always store the bump — it saves compute on future validations.",
   ],
   starterCode: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpo...");

#[program]
pub mod vault_program {
    use super::*;

    // TODO: Complete this instruction
    pub fn create_vault(ctx: Context<CreateVault>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        
        // Set the vault owner
        vault.owner = // ???
        
        // Store the canonical bump
        vault.bump = // ???
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateVault<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + VaultAccount::INIT_SPACE,
        // TODO: Add seeds and bump constraints
    )]
    pub vault: Account<'info, VaultAccount>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct VaultAccount {
    pub owner: Pubkey,
    pub bump: u8,
}
`,
   solutionCode: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpo...");

#[program]
pub mod vault_program {
    use super::*;

    pub fn create_vault(ctx: Context<CreateVault>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        
        vault.owner = ctx.accounts.user.key();
        vault.bump  = ctx.bumps.vault;
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateVault<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + VaultAccount::INIT_SPACE,
        seeds = [b"vault", user.key().as_ref()],
        bump,
    )]
    pub vault: Account<'info, VaultAccount>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct VaultAccount {
    pub owner: Pubkey,
    pub bump: u8,
}
`,
};

const MODULE_LESSONS = [
   { id: "l5", title: "Account types in Anchor", done: true },
   { id: "l6", title: "#[account] macros deep dive", done: true },
   { id: "l7", title: "PDAs and seeds", done: false, active: true },
   { id: "l8", title: "Rent and storage costs", done: false },
   { id: "l9", title: "Account validation constraints", done: false },
];

// ── MARKDOWN RENDERER ─────────────────────────────────────────────────────────
function MarkdownContent({ content }: { content: string }) {
   const lines = content.split("\n");
   const out = [];
   let i = 0, codeBlock = null;

   while (i < lines.length) {
      const line = lines[i];

      if (line.startsWith("```")) {
         if (codeBlock !== null) {
            out.push(
               <pre key={`cb-${i}`}
                  className="bg-sol-bg border border-sol-border rounded-xl p-4 my-4
                       overflow-x-auto font-mono text-xs text-sol-green leading-relaxed">
                  <code>{codeBlock}</code>
               </pre>
            );
            codeBlock = null;
         } else { codeBlock = ""; }
         i++; continue;
      }
      if (codeBlock !== null) { codeBlock += line + "\n"; i++; continue; }

      if (line.startsWith("## ")) {
         out.push(
            <h2 key={i} className="text-xl font-bold text-sol-text mt-8 mb-3 flex items-center gap-2">
               <span className="w-1 h-5 bg-sol-green rounded-full shrink-0" />
               {line.slice(3)}
            </h2>
         );
      } else if (line.startsWith("### ")) {
         out.push(<h3 key={i} className="text-base font-bold text-sol-text mt-6 mb-2">{line.slice(4)}</h3>);
      } else if (/^\d+\./.test(line)) {
         const items = [line];
         while (lines[i + 1] && /^\d+\./.test(lines[i + 1])) { i++; items.push(lines[i]); }
         out.push(
            <ol key={i} className="list-decimal list-inside space-y-1.5 my-3 text-sol-subtle text-sm">
               {items.map((it, j) => <li key={j}>{renderInline(it.replace(/^\d+\. /, ""))}</li>)}
            </ol>
         );
      } else if (line.startsWith("> ")) {
         out.push(
            <div key={i} className="border-l-2 border-sol-yellow/60 pl-4 py-1 my-3 bg-sol-yellow/5 rounded-r-lg">
               <p className="text-sm text-sol-subtle italic">{line.slice(2)}</p>
            </div>
         );
      } else if (line.trim()) {
         out.push(<p key={i} className="text-sol-subtle text-sm leading-relaxed my-2">{renderInline(line)}</p>);
      }
      i++;
   }
   return <div>{out}</div>;
}

function renderInline(text: string) {
   return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/).map((p: string, i: number) => {
      if (p.startsWith("**") && p.endsWith("**"))
         return <strong key={i} className="text-sol-text font-semibold">{p.slice(2, -2)}</strong>;
      if (p.startsWith("`") && p.endsWith("`"))
         return <code key={i} className="bg-sol-green/10 text-sol-green px-1.5 py-0.5 rounded text-[11px] font-mono">{p.slice(1, -1)}</code>;
      return p;
   });
}

export default function Page() {
   const [code, setCode] = useState(LESSON.starterCode);
   const [showSolution, setShowSolution] = useState(false);
   const [hintIdx, setHintIdx] = useState(-1);
   const [completed, setCompleted] = useState(false);
   const [panelWidth, setPanelWidth] = useState(50);
   const [sidebarOpen, setSidebarOpen] = useState(false);
   const [runOutput, setRunOutput] = useState<{ ok: boolean, msg: string } | null>(null);
   const dragging = useRef(false);
   const containerRef = useRef(null);

   const onMouseDown = useCallback((e: any) => { dragging.current = true; e.preventDefault(); }, []);

   useEffect(() => {
      const onMove = (e: any) => {
         if (!dragging.current || !containerRef.current) return;
         // @ts-ignore
         const rect = containerRef.current.getBoundingClientRect();
         const pct = ((e.clientX - rect.left) / rect.width) * 100;
         setPanelWidth(Math.min(Math.max(pct, 25), 75));
      };
      const onUp = () => { dragging.current = false; };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
      return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
   }, []);

   const handleRun = () => {
      setRunOutput(null);
      setTimeout(() => {
         const hasOwner = code.includes("ctx.accounts.user.key()");
         const hasBump = code.includes("ctx.bumps.vault");
         const hasSeeds = code.includes(`b"vault"`);
         if (hasOwner && hasBump && hasSeeds) {
            setRunOutput({ ok: true, msg: "✓ All tests passed! (3/3)\n  ✓ vault.owner == user.key()\n  ✓ vault.bump == canonical bump\n  ✓ PDA seeds correct" });
            setTimeout(() => setCompleted(true), 600);
         } else {
            const missing = [];
            if (!hasOwner) missing.push("vault.owner not set correctly");
            if (!hasBump) missing.push("vault.bump not set");
            if (!hasSeeds) missing.push("seeds constraint missing");
            setRunOutput({ ok: false, msg: `✗ Tests failed:\n  - ${missing.join("\n  - ")}` });
         }
      }, 800);
   };

   return (
      <div className="h-screen flex flex-col bg-sol-bg font-display overflow-hidden">

         {/* ── Top nav ── */}
         <header className="h-12 flex items-center justify-between px-4
                         bg-sol-surface border-b border-sol-border flex-shrink-0 z-30">
            <div className="flex items-center gap-2 min-w-0">
               {/* Mobile sidebar toggle */}
               <button onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-1.5 rounded-lg hover:bg-sol-border text-sol-subtle hover:text-sol-text transition-colors lg:hidden flex-shrink-0">
                  ☰
               </button>
               <Link href={`/courses/${LESSON.courseSlug}`}
                  className="text-xs text-sol-muted hover:text-sol-green transition-colors hidden sm:block flex-shrink-0">
                  ← {LESSON.courseTitle}
               </Link>
               <span className="text-sol-border hidden sm:block">/</span>
               <span className="text-xs text-sol-subtle hidden sm:block flex-shrink-0">{LESSON.module}</span>
               <span className="text-sol-border">/</span>
               <span className="text-xs text-sol-text font-semibold truncate">{LESSON.title}</span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
               {/* XP badge */}
               <span className="sol-badge bg-sol-yellow/20 text-sol-yellow-dk border-sol-yellow/50 hidden sm:inline-flex">
                  ⚡ +{LESSON.xp} XP
               </span>
               {completed && (
                  <span className="sol-badge bg-sol-green/20 text-sol-green border-sol-green/40 animate-fade-up">
                     ✓ Completed!
                  </span>
               )}
               {LESSON.prev && (
                  <Link href={`/courses/${LESSON.courseSlug}/lessons/${LESSON.prev.id}`}
                     className="sol-btn-ghost py-1.5 text-xs hidden md:inline-flex">
                     ← Prev
                  </Link>
               )}
               {LESSON.next && (
                  <Link href={`/courses/${LESSON.courseSlug}/lessons/${LESSON.next.id}`}
                     className="sol-btn-primary py-1.5 text-xs">
                     Next →
                  </Link>
               )}
            </div>
         </header>

         <div className="flex flex-1 overflow-hidden relative">

            {/* ── Module sidebar ── */}
            <aside className={[
               "absolute lg:relative z-20 h-full w-64 bg-sol-surface border-r border-sol-border",
               "flex-shrink-0 flex flex-col transition-transform duration-200",
               sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
            ].join(" ")}>
               <div className="px-4 py-3 border-b border-sol-border">
                  <div className="text-[10px] font-bold text-sol-muted uppercase tracking-widest mb-0.5">Module</div>
                  <div className="text-sm font-semibold text-sol-text">{LESSON.module}</div>
               </div>
               <div className="flex-1 overflow-y-auto py-2">
                  {MODULE_LESSONS.map(l => (
                     <Link key={l.id}
                        href={`/courses/${LESSON.courseSlug}/lessons/${l.id}`}
                        onClick={() => setSidebarOpen(false)}
                        className={[
                           "flex items-center gap-3 px-4 py-2.5 text-xs transition-colors",
                           l.active
                              ? "bg-sol-green/10 text-sol-green border-r-2 border-sol-green"
                              : "text-sol-subtle hover:bg-sol-border/20 hover:text-sol-text",
                        ].join(" ")}>
                        <div className={[
                           "w-4 h-4 rounded-full border flex items-center justify-center text-[9px] flex-shrink-0",
                           l.done ? "bg-sol-green/20 border-sol-green/50 text-sol-green" :
                              l.active ? "border-sol-green text-sol-green" :
                                 "border-sol-muted text-sol-muted",
                        ].join(" ")}>
                           {l.done ? "✓" : l.active ? "▶" : ""}
                        </div>
                        <span className="leading-tight">{l.title}</span>
                     </Link>
                  ))}
               </div>
            </aside>

            {/* ── Split panel ── */}
            <div ref={containerRef} className="flex flex-1 overflow-hidden">

               {/* LEFT: content */}
               <div className="overflow-y-auto flex-shrink-0" style={{ width: `${panelWidth}%` }}>
                  <div className="max-w-2xl mx-auto px-6 py-6 pb-24">

                     {/* Lesson header */}
                     <div className="mb-6">
                        <div className="flex items-center gap-2 text-xs text-sol-muted mb-2">
                           <span className="animate-pulse-dot w-1.5 h-1.5 rounded-full bg-sol-green inline-block" />
                           {LESSON.duration} · {LESSON.module}
                        </div>
                        <h1 className="text-2xl font-extrabold text-sol-text">{LESSON.title}</h1>
                     </div>

                     <MarkdownContent content={LESSON.content} />

                     {/* Hints */}
                     <div className="mt-8 card-base p-4 border-sol-yellow/30">
                        <div className="flex items-center justify-between mb-3">
                           <span className="text-sm font-bold text-sol-text flex items-center gap-2">
                              💡 Hints
                           </span>
                           <span className="text-xs text-sol-muted">
                              {Math.max(0, hintIdx + 1)}/{LESSON.hints.length}
                           </span>
                        </div>
                        {hintIdx >= 0 && (
                           <div className="space-y-2 mb-3">
                              {LESSON.hints.slice(0, hintIdx + 1).map((h, i) => (
                                 <div key={i}
                                    className="text-xs text-sol-subtle bg-sol-yellow/5 rounded-lg p-3
                                   border border-sol-yellow/25 animate-fade-up">
                                    {i + 1}. {h}
                                 </div>
                              ))}
                           </div>
                        )}
                        <button
                           onClick={() => setHintIdx(Math.min(hintIdx + 1, LESSON.hints.length - 1))}
                           disabled={hintIdx >= LESSON.hints.length - 1}
                           className="sol-btn-ghost text-xs py-1.5 disabled:opacity-40 disabled:cursor-not-allowed">
                           {hintIdx < 0
                              ? "Show first hint"
                              : hintIdx >= LESSON.hints.length - 1
                                 ? "No more hints"
                                 : "Next hint →"}
                        </button>
                     </div>

                     {/* Solution toggle */}
                     <div className="mt-4 card-base p-4">
                        <button
                           onClick={() => setShowSolution(!showSolution)}
                           className="flex items-center justify-between w-full text-sm font-bold
                             text-sol-subtle hover:text-sol-text transition-colors">
                           <span className="flex items-center gap-2">
                              🔓 {showSolution ? "Hide" : "Show"} Solution
                           </span>
                           <span className="text-xs opacity-60">{showSolution ? "▲" : "▼"}</span>
                        </button>
                        {showSolution && (
                           <div className="mt-3 animate-fade-up">
                              <pre className="bg-sol-bg border border-sol-border rounded-xl p-4 overflow-x-auto
                                    font-mono text-xs text-sol-green leading-relaxed">
                                 <code>{LESSON.solutionCode}</code>
                              </pre>
                              <button
                                 onClick={() => { setCode(LESSON.solutionCode); setShowSolution(false); }}
                                 className="mt-2 sol-btn-ghost text-xs py-1.5">
                                 Copy to editor
                              </button>
                           </div>
                        )}
                     </div>
                  </div>
               </div>

               {/* ── Divider ── */}
               <div onMouseDown={onMouseDown}
                  className="w-1 bg-sol-border hover:bg-sol-green/40 cursor-col-resize
                       flex-shrink-0 transition-colors duration-150 relative group z-10">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                            w-3 h-8 rounded-full bg-sol-muted group-hover:bg-sol-green
                            transition-colors duration-150 opacity-50" />
               </div>

               {/* RIGHT: editor */}
               <div className="flex flex-col flex-1 overflow-hidden bg-sol-bg">

                  {/* Editor toolbar */}
                  <div className="flex items-center justify-between px-4 py-2
                            bg-sol-surface border-b border-sol-border flex-shrink-0">
                     <div className="flex items-center gap-2">
                        {/* Fake traffic lights using brand colors */}
                        <div className="flex gap-1.5">
                           <span className="w-3 h-3 rounded-full bg-red-500" />
                           <span className="w-3 h-3 rounded-full bg-sol-yellow" />
                           <span className="w-3 h-3 rounded-full bg-sol-green" />
                        </div>
                        <span className="text-xs text-sol-muted font-mono ml-1">lib.rs</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <button onClick={() => setCode(LESSON.starterCode)}
                           className="sol-btn-ghost py-1 text-xs">Reset</button>
                        <button onClick={handleRun}
                           className="sol-btn-primary py-1 text-xs">▶ Run Tests</button>
                     </div>
                  </div>

                  {/* Code area */}
                  <div className="flex-1 relative overflow-hidden">
                     <textarea
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        spellCheck={false}
                        className="absolute inset-0 w-full h-full p-4 bg-transparent
                           font-mono text-xs text-sol-green leading-relaxed
                           resize-none focus:outline-none
                           selection:bg-sol-green/20"
                        style={{ tabSize: 4, paddingLeft: "44px" }}
                     />
                     {/* Line numbers */}
                     <div className="absolute left-0 top-0 bottom-0 w-10 bg-sol-surface/60
                              border-r border-sol-border/50 pointer-events-none
                              flex flex-col pt-4 pr-2">
                        {code.split("\n").map((_, i) => (
                           <div key={i} className="text-[10px] text-sol-muted font-mono leading-relaxed text-right">
                              {i + 1}
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Output panel */}
                  {runOutput !== null && (
                     <div className={[
                        "border-t flex-shrink-0 p-4 font-mono text-xs leading-relaxed animate-fade-up",
                        runOutput.ok
                           ? "bg-sol-green/5 border-sol-green/30 text-sol-green"
                           : "bg-red-800/10 border-red-700/30 text-red-400",
                     ].join(" ")}>
                        <pre className="whitespace-pre-wrap">{runOutput.msg}</pre>
                     </div>
                  )}
               </div>
            </div>
         </div>

         {/* Bottom progress strip */}
         <div className="h-1 bg-sol-border flex-shrink-0">
            <div
               className="h-full bg-gradient-to-r from-sol-green to-sol-forest transition-all duration-700"
               style={{ width: completed ? "100%" : "60%" }}
            />
         </div>
      </div>
   );
}
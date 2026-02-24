"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/providers/auth-context";
import { coursesApi } from "@/lib/courses";
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    CheckCircle2,
    ChevronRight,
    Code2,
    Copy,
    Flame,
    Lightbulb,
    List,
    Loader2,
    Play,
    RotateCcw,
    Shield,
    Sparkles,
    Terminal,
    X,
    Zap,
} from "lucide-react";

/* ── stub lesson data ────────────────────────────────────── */
const lessonData = {
    id: "l5",
    title: "Instructions & Programs",
    type: "doc" as const,
    content: `
# Instructions & Programs on Solana

Every transaction on Solana is composed of one or more **instructions**. Each instruction targets a specific **program** (smart contract) deployed on-chain.

## Anatomy of an Instruction

\`\`\`rust
pub struct Instruction {
    /// The program that will process this instruction
    pub program_id: Pubkey,
    /// Accounts required by the instruction
    pub accounts: Vec<AccountMeta>,
    /// Serialized instruction data
    pub data: Vec<u8>,
}
\`\`\`

### Key Concepts

1. **Program ID** — The public key of the on-chain program
2. **Account Metas** — List of accounts the instruction reads/writes
3. **Instruction Data** — Serialized arguments for the program

## System Program Example

The System Program is one of Solana's built-in programs:

\`\`\`typescript
import { SystemProgram, Transaction } from "@solana/web3.js";

const tx = new Transaction().add(
  SystemProgram.transfer({
    fromPubkey: sender.publicKey,
    toPubkey: receiver.publicKey,
    lamports: 1_000_000_000, // 1 SOL
  })
);
\`\`\`

> **💡 Tip:** Every SOL transfer is just an instruction to the System Program!

## Cross-Program Invocations (CPI)

Programs can call other programs using CPIs. This is how composability works on Solana — like LEGO blocks snapping together.
    `,
    milestone: { id: "m2", title: "Transactions Deep Dive" },
    course: { slug: "intro-to-solana", title: "Intro to Solana" },
    prev: { id: "l4", title: "Transaction Structure" },
    next: { id: "l6", title: "Build a Transaction" },
    xpReward: 25,
    completed: false,
    hasChallenge: true,
    challenge: {
        title: "Create a Transfer Instruction",
        description: "Write a function that creates a SOL transfer instruction using the System Program. The function should accept sender, receiver, and amount parameters.",
        starterCode: `import { SystemProgram, PublicKey } from "@solana/web3.js";

function createTransferInstruction(
  sender: PublicKey,
  receiver: PublicKey,
  lamports: number
) {
  // TODO: Return a SystemProgram.transfer instruction
  
}`,
        testCases: [
            { id: "t1", name: "Returns a valid instruction object", passed: null as boolean | null },
            { id: "t2", name: "Uses correct sender public key", passed: null as boolean | null },
            { id: "t3", name: "Transfers correct lamport amount", passed: null as boolean | null },
        ],
        expectedOutput: "✓ All 3 test cases passed!",
        xp: 50,
    },
};

const sidebarLessons = [
    { id: "l4", title: "Transaction Structure", type: "video", completed: true },
    { id: "l5", title: "Instructions & Programs", type: "doc", completed: false },
    { id: "l6", title: "Build a Transaction", type: "test", completed: false },
];

const typeIcons: Record<string, { icon: typeof Play; color: string }> = {
    video: { icon: Play, color: "text-neon-cyan" },
    doc: { icon: BookOpen, color: "text-neon-purple" },
    test: { icon: Shield, color: "text-amber-400" },
};

/* ── simple markdown-ish renderer ─────────────────────── */
function renderContent(md: string) {
    const lines = md.trim().split("\n");
    const elements: React.ReactNode[] = [];
    let codeBlock: string[] | null = null;
    let codeLanguage = "";

    lines.forEach((line, i) => {
        // code fences
        if (line.trim().startsWith("```")) {
            if (codeBlock !== null) {
                elements.push(
                    <div key={`code-${i}`} className="my-6 border border-white/[0.08] bg-[#0a0f1a] overflow-hidden relative group">
                        {/* Corner brackets */}
                        <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-neon-green/30" />
                        <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-neon-green/30" />

                        <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.08] bg-white/[0.02]">
                            <span className="text-[10px] text-zinc-500 font-black font-mono uppercase tracking-widest">
                                <span className="text-neon-green/40">$ </span>
                                {codeLanguage || "code"}
                            </span>
                            <button className="text-zinc-500 hover:text-neon-green transition-colors">
                                <Copy className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <pre className="p-4 text-[13px] text-zinc-300 overflow-x-auto font-mono leading-relaxed bg-[#050810]">
                            <code>{codeBlock.join("\n")}</code>
                        </pre>
                    </div>
                );
                codeBlock = null;
            } else {
                codeLanguage = line.trim().replace("```", "");
                codeBlock = [];
            }
            return;
        }
        if (codeBlock !== null) { codeBlock.push(line); return; }

        // headings
        if (line.startsWith("# ")) {
            elements.push(
                <div key={i} className="mt-12 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-neon-green font-mono text-sm">{">"}</span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">core_module</span>
                        <div className="flex-1 h-px bg-white/[0.06]" />
                    </div>
                    <h1 className="text-3xl font-black text-white font-mono tracking-tight">{line.slice(2)}</h1>
                </div>
            );
            return;
        }
        if (line.startsWith("## ")) {
            elements.push(
                <h2 key={i} className="text-xl font-black text-white mt-10 mb-4 font-mono flex items-center gap-2">
                    <span className="text-neon-cyan/40">#</span> {line.slice(3)}
                </h2>
            );
            return;
        }
        if (line.startsWith("### ")) {
            elements.push(
                <h3 key={i} className="text-lg font-bold text-white mt-6 mb-3 font-mono flex items-center gap-2">
                    <span className="text-neon-purple/40">##</span> {line.slice(4)}
                </h3>
            );
            return;
        }

        // blockquote
        if (line.startsWith("> ")) {
            elements.push(
                <div key={i} className="my-6 p-4 border border-neon-green/20 bg-neon-green/5 font-mono relative">
                    <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-neon-green/40" />
                    <div className="text-sm text-zinc-300 leading-relaxed italic">
                        <span className="text-neon-green/60 font-black not-italic mr-2">TIP //</span>
                        {line.slice(2).replace("**💡 Tip:**", "").trim()}
                    </div>
                </div>
            );
            return;
        }

        // numbered list
        if (/^\d+\.\s/.test(line.trim())) {
            elements.push(
                <li key={i} className="text-sm text-zinc-400 ml-4 mb-2 list-none font-mono flex items-start gap-3">
                    <span className="text-neon-cyan shrink-0 font-black">{line.match(/^\d+/)?.[0].padStart(2, '0')}</span>
                    <span className="leading-relaxed">{line.replace(/^\d+\.\s/, "")}</span>
                </li>
            );
            return;
        }

        // empty line
        if (line.trim() === "") { elements.push(<div key={i} className="h-4" />); return; }

        // paragraph — handle inline code
        const parts = line.split(/(`[^`]+`)/g);
        elements.push(
            <p key={i} className="text-sm text-zinc-400 leading-relaxed mb-4 font-mono">
                {parts.map((part, j) =>
                    part.startsWith("`") && part.endsWith("`")
                        ? <code key={j} className="px-1.5 py-0.5 border border-neon-cyan/20 bg-neon-cyan/5 text-neon-cyan text-[11px] font-mono mx-0.5">{part.slice(1, -1)}</code>
                        : <span key={j}>{part}</span>
                )}
            </p>
        );
    });
    return elements;
}

export default function LessonPage() {
    const { slug, id } = useParams<{ slug: string; id: string }>();
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();

    const [lesson, setLesson] = useState<any>(null);
    const [milestone, setMilestone] = useState<any>(null);
    const [sidebarLessons, setSidebarLessons] = useState<any[]>([]);
    const [nextLesson, setNextLesson] = useState<any>(null);
    const [prevLesson, setPrevLesson] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [showSidebar, setShowSidebar] = useState(false);
    const [showHint, setShowHint] = useState(false);

    /* Code challenge state */
    const [code, setCode] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [output, setOutput] = useState<string | null>(null);
    const [testResults, setTestResults] = useState<any[]>([]);
    const [challengeCompleted, setChallengeCompleted] = useState(false);
    const [showChallenge, setShowChallenge] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!authLoading) {
            coursesApi.getCourseBySlug(slug as string).then(res => {
                const c = res.data;
                let currentMilestone: any = null;
                let currentResource: any = null;
                let allItems: any[] = [];

                c.milestones.forEach((m: any) => {
                    const sortedResources = [...(m.resources || [])].sort((a, b) => a.order - b.order);
                    const items = [...sortedResources, ...(m.tests || []).map((t: any) => ({ ...t, isTest: true }))];
                    allItems = [...allItems, ...items.map(i => ({ ...i, milestoneId: m._id || m.id, mTitle: m.title, mXp: m.xpReward }))];
                });

                const currentIndex = allItems.findIndex(i => (i._id || i.id) === id);
                if (currentIndex !== -1) {
                    currentResource = allItems[currentIndex];
                    const prev = allItems[currentIndex - 1] || null;
                    const next = allItems[currentIndex + 1] || null;
                    currentMilestone = c.milestones.find((m: any) => (m._id || m.id) === currentResource.milestoneId);

                    const mItems = currentMilestone ? [
                        ...(currentMilestone.resources || []).map((r: any) => ({
                            id: r._id || r.id, title: r.title, type: r.type === "video" ? "video" : "doc", completed: false
                        })),
                        ...(currentMilestone.tests || []).map((t: any) => ({
                            id: t._id || t.id, title: t.title, type: "test", completed: false
                        }))
                    ] : [];
                    setSidebarLessons(mItems);

                    const mappedLesson = {
                        id: currentResource._id || currentResource.id,
                        title: currentResource.title,
                        type: currentResource.isTest ? "test" : (currentResource.type === "video" ? "video" : "doc"),
                        content: currentResource.content || (currentResource.isTest ? "# Challenge Time!\nRead the description and start coding." : "# Content\nContent goes here."),
                        hasChallenge: currentResource.isTest,
                        challenge: currentResource.isTest && currentResource.codeChallenge ? {
                            title: "Code Challenge",
                            description: currentResource.codeChallenge.prompt,
                            starterCode: currentResource.codeChallenge.starterCode || "",
                            testCases: currentResource.codeChallenge.testCases.map((tc: any, idx: number) => ({
                                id: `t${idx}`, name: tc.description, passed: null
                            })),
                            xp: currentMilestone.xpReward || 50
                        } : null,
                        course: { title: c.title },
                        milestone: { title: currentMilestone?.title },
                        xpReward: currentMilestone?.xpReward || 0,
                    };

                    setLesson(mappedLesson);
                    setMilestone(currentMilestone);
                    setPrevLesson(prev ? { id: prev._id || prev.id, title: prev.title } : null);
                    setNextLesson(next ? { id: next._id || next.id, title: next.title } : null);

                    if (mappedLesson.hasChallenge && mappedLesson.challenge) {
                        setCode(mappedLesson.challenge.starterCode);
                        setTestResults(mappedLesson.challenge.testCases);
                    }
                } else {
                    setLesson(lessonData); // fallback to stub
                }
                setLoading(false);
            }).catch(err => {
                console.error(err);
                setLesson(lessonData);
                setLoading(false);
            });
        }
    }, [slug, id, authLoading]);

    /* Divider drag state */
    const [splitPercent, setSplitPercent] = useState(55);
    const dragging = useRef(false);

    const handleMouseDown = useCallback(() => { dragging.current = true; }, []);
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!dragging.current) return;
        const container = (e.currentTarget as HTMLElement);
        const rect = container.getBoundingClientRect();
        const pct = ((e.clientX - rect.left) / rect.width) * 100;
        setSplitPercent(Math.min(80, Math.max(30, pct)));
    }, []);
    const handleMouseUp = useCallback(() => { dragging.current = false; }, []);

    /* Simulated test run */
    const runTests = useCallback(() => {
        setIsRunning(true);
        setOutput(null);
        setTimeout(async () => {
            if (lesson?.challenge) {
                const results = lesson.challenge.testCases.map((tc: any) => ({
                    ...tc,
                    passed: true,
                }));
                setTestResults(results);
                setOutput(`✓ All ${results.length} test cases passed!`);
                setChallengeCompleted(true);

                // Submit test status
                try {
                    await coursesApi.completeMilestone(slug as string, milestone._id || milestone.id, lesson.id, 100);
                    // Claim XP
                    await coursesApi.claimMilestoneXP(slug as string, milestone._id || milestone.id);
                } catch (e) {
                    console.error("Failed to complete milestone/claim xp", e);
                }
            } else {
                try {
                    await coursesApi.completeMilestone(slug as string, milestone._id || milestone.id, lesson.id, 100);
                    await coursesApi.claimMilestoneXP(slug as string, milestone._id || milestone.id);
                    setChallengeCompleted(true);
                    setOutput("✓ Quiz completed successfully!");
                } catch (e) { console.error("Error", e); }
            }
            setIsRunning(false);
        }, 1500);
    }, [code, lesson, slug, milestone]);

    const resetCode = () => {
        setCode(lesson.challenge.starterCode);
        setTestResults(lesson.challenge.testCases);
        setOutput(null);
        setChallengeCompleted(false);
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#020408]">
                <div className="w-6 h-6 border-2 border-neon-green/30 border-t-neon-green animate-spin" />
            </div>
        );
    }

    if (!lesson) return <div className="h-screen bg-[#020408] text-white p-10 font-mono">Lesson not found.</div>;

    return (
        <div className="h-screen flex flex-col bg-[#020408] overflow-hidden" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>

            {/* Top Bar */}
            <header className="shrink-0 z-20 border-b border-white/[0.06] bg-[#020408]">
                <div className="px-4 h-12 flex items-center justify-between gap-4 font-mono">
                    <div className="flex items-center gap-3 min-w-0">
                        <Link href={`/courses/${slug}`} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-neon-green transition-colors shrink-0 group">
                            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                            cd ../
                        </Link>
                        <div className="h-4 w-px bg-white/10" />
                        <span className="text-[10px] text-zinc-600 truncate uppercase tracking-wider">{lesson.course.title}</span>
                        <ChevronRight className="w-3 h-3 text-zinc-700 shrink-0" />
                        <span className="text-[10px] text-zinc-500 truncate uppercase tracking-wider">{lesson.milestone.title}</span>
                        <ChevronRight className="w-3 h-3 text-zinc-700 shrink-0" />
                        <span className="text-xs text-white font-black truncate uppercase tracking-widest">{lesson.title}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => setShowSidebar(!showSidebar)}
                            className="p-2 border border-white/5 hover:bg-white/5 transition-colors text-zinc-500 hover:text-white"
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-neon-green/10 border border-neon-green/20 text-neon-green text-[10px] font-black uppercase tracking-wider">
                            <Zap className="w-3 h-3" /> +{lesson.xpReward} XP
                        </span>
                    </div>
                </div>
            </header>

            {/* Main split area */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* ── Left: Content ── */}
                <div className="overflow-y-auto bg-[#020408] relative" style={{ width: `${splitPercent}%` }}>
                    {/* Background Scanlines */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.015]" style={{
                        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,163,0.08) 2px, rgba(0,255,163,0.08) 4px)",
                    }} />

                    <div className="max-w-3xl mx-auto px-10 py-10 relative z-10">
                        {renderContent(lesson.content)}

                        {/* Challenge toggle */}
                        {lesson.hasChallenge && (
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => setShowChallenge(!showChallenge)}
                                className="mt-12 w-full flex items-center gap-4 p-5 border border-neon-green/20 bg-neon-green/5 hover:bg-neon-green/10 transition-all text-left group relative"
                            >
                                <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-neon-green/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-neon-green/40 opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="w-12 h-12 border border-neon-green/20 flex items-center justify-center bg-neon-green/5 text-neon-green shrink-0">
                                    <Code2 className="w-6 h-6" />
                                </div>
                                <div className="flex-1 font-mono">
                                    <div className="text-sm font-black text-white uppercase tracking-wider">{lesson.challenge.title}</div>
                                    <div className="text-[10px] text-zinc-500 mt-0.5">
                                        <span className="text-neon-green/40">$ </span>
                                        run --challenge --reward={lesson.challenge.xp}xp
                                    </div>
                                </div>
                                <ChevronRight className={`w-5 h-5 text-neon-green transition-transform ${showChallenge ? "rotate-90" : ""}`} />
                            </motion.button>
                        )}

                        {/* Hint */}
                        <div className="mt-8">
                            <button onClick={() => setShowHint(!showHint)} className="flex items-center gap-2 text-xs text-zinc-600 hover:text-amber-400 transition-colors font-mono">
                                <span className="text-neon-green/40">$ </span>
                                {showHint ? "hide_hint" : "show_hint"}
                            </button>
                            <AnimatePresence>
                                {showHint && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                        <div className="mt-4 p-5 border border-amber-400/20 bg-amber-400/5 font-mono relative">
                                            <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-amber-400/40" />
                                            <div className="text-[11px] text-amber-300/80 leading-relaxed">
                                                <span className="text-amber-400 font-black mr-2">HINT //</span>
                                                Remember that <code className="px-1 py-0.5 border border-amber-400/20 bg-amber-400/10 text-amber-300 font-mono text-[11px]">SystemProgram.transfer()</code> accepts an object with <code className="px-1 py-0.5 border border-amber-400/20 bg-amber-400/10 text-amber-300 font-mono text-[11px]">fromPubkey</code>, <code className="px-1 py-0.5 border border-amber-400/20 bg-amber-400/10 text-amber-300 font-mono text-[11px]">toPubkey</code>, and <code className="px-1 py-0.5 border border-amber-400/20 bg-amber-400/10 text-amber-300 font-mono text-[11px]">lamports</code> fields.
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Nav */}
                        <div className="flex items-center justify-between mt-16 pt-8 border-t border-white/[0.08] font-mono">
                            {prevLesson ? (
                                <Link href={`/courses/${slug}/lessons/${prevLesson.id}`} className="flex flex-col items-start gap-1 group">
                                    <span className="text-[9px] text-zinc-600 uppercase tracking-widest group-hover:text-neon-green transition-colors">Previous Module</span>
                                    <div className="flex items-center gap-2 text-xs text-zinc-400 group-hover:text-white transition-colors">
                                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                                        {prevLesson.title}
                                    </div>
                                </Link>
                            ) : <div />}
                            {nextLesson ? (
                                <Link href={`/courses/${slug}/lessons/${nextLesson.id}`} className="flex flex-col items-end gap-1 group text-right">
                                    <span className="text-[9px] text-zinc-600 uppercase tracking-widest group-hover:text-neon-cyan transition-colors">Next Module</span>
                                    <div className="flex items-center gap-2 text-xs text-zinc-400 group-hover:text-white transition-colors">
                                        {nextLesson.title}
                                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </Link>
                            ) : <div />}
                        </div>

                        <div className="h-20" />
                    </div>
                </div>

                {/* ── Drag divider ── */}
                <div
                    onMouseDown={handleMouseDown}
                    className="w-[2px] shrink-0 cursor-col-resize bg-white/[0.06] hover:bg-neon-green/30 active:bg-neon-green/60 transition-colors z-10"
                />

                {/* ── Right: Code editor / Challenge ── */}
                <div className="flex-1 flex flex-col overflow-hidden bg-[#050810] relative">
                    {/* Editor Background Grain */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

                    {showChallenge && lesson.hasChallenge ? (
                        <>
                            {/* Challenge header */}
                            <div className="shrink-0 px-4 py-3 border-b border-white/[0.08] bg-[#080c14] flex items-center justify-between font-mono relative z-10">
                                <div className="flex items-center gap-2">
                                    <Terminal className="w-4 h-4 text-neon-green" />
                                    <span className="text-xs font-black text-white uppercase tracking-wider">{lesson.challenge.title}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={resetCode} className="p-1.5 border border-white/5 hover:bg-white/5 text-zinc-500 hover:text-white transition-colors" title="Reset code">
                                        <RotateCcw className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => setShowChallenge(false)} className="p-1.5 border border-white/5 hover:bg-white/5 text-zinc-500 hover:text-white transition-colors">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Challenge description */}
                            <div className="shrink-0 px-4 py-4 border-b border-white/[0.08] bg-[#050810]/50 relative z-10 font-mono">
                                <div className="text-[11px] text-zinc-400 leading-relaxed">
                                    <span className="text-neon-green/40">$ </span>
                                    {lesson.challenge.description}
                                </div>
                            </div>

                            {/* Code textarea */}
                            <div className="flex-1 overflow-hidden relative z-10 bg-transparent">
                                <div className="absolute top-4 left-4 text-[10px] text-zinc-800 pointer-events-none font-mono tracking-widest">
                                    {id}.ts [EDITABLE]
                                </div>
                                <textarea
                                    ref={textareaRef}
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    spellCheck={false}
                                    className="w-full h-full p-6 pt-10 bg-transparent text-[13px] text-zinc-300 font-mono resize-none focus:outline-none leading-relaxed placeholder:text-zinc-800 scrollbar-thin scrollbar-thumb-white/5"
                                    placeholder="Write your code here..."
                                />
                            </div>

                            {/* Test cases */}
                            <div className="shrink-0 border-t border-white/[0.1] relative z-10 bg-[#080c14]">
                                <div className="px-4 py-2 flex items-center gap-2 border-b border-white/[0.05]">
                                    <List className="w-3.5 h-3.5 text-zinc-600" />
                                    <span className="text-[10px] text-zinc-500 font-black font-mono uppercase tracking-[0.2em]">verification_status</span>
                                </div>
                                <div className="px-4 py-3 space-y-2 max-h-32 overflow-y-auto font-mono">
                                    {testResults.map((tc) => (
                                        <div key={tc.id} className="flex items-center gap-3 text-[11px]">
                                            {tc.passed === null ? (
                                                <div className="w-4 h-4 border border-zinc-800" />
                                            ) : tc.passed ? (
                                                <div className="w-4 h-4 border border-neon-green bg-neon-green/10 flex items-center justify-center">
                                                    <CheckCircle2 className="w-3 h-3 text-neon-green" />
                                                </div>
                                            ) : (
                                                <div className="w-4 h-4 border border-red-500 bg-red-500/10 flex items-center justify-center">
                                                    <X className="w-3 h-3 text-red-500" />
                                                </div>
                                            )}
                                            <span className={tc.passed === null ? "text-zinc-600" : tc.passed ? "text-neon-green" : "text-red-500"}>
                                                {tc.passed === null ? "[WAITING]" : tc.passed ? "[PASSED]" : "[FAILED]"} {tc.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Output console */}
                            <AnimatePresence>
                                {output && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className={`shrink-0 border-t border-white/[0.1] px-4 py-3 bg-[#0a0f1a] relative z-10`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className={`w-1.5 h-1.5 ${challengeCompleted ? "bg-neon-green" : "bg-red-500"} animate-pulse`} />
                                            <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest">system_output</span>
                                        </div>
                                        <p className={`text-xs font-mono font-bold ${challengeCompleted ? "text-neon-green" : "text-red-400"}`}>
                                            {output}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Run / Complete bar */}
                            <div className="shrink-0 px-4 py-4 border-t border-white/[0.1] bg-[#080c14] flex items-center justify-between relative z-10 font-mono">
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-zinc-600 uppercase tracking-widest">Expected Reward</span>
                                    <span className="flex items-center gap-1.5 text-neon-green font-black text-xs uppercase">
                                        <Zap className="w-3.5 h-3.5" /> +{lesson.challenge.xp} XP
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {challengeCompleted && (
                                        <motion.div
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-neon-green/10 border border-neon-green/30 text-neon-green text-[10px] font-black uppercase tracking-wider"
                                        >
                                            <Sparkles className="w-3.5 h-3.5" /> Success
                                        </motion.div>
                                    )}
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={runTests}
                                        disabled={isRunning}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-neon-green text-black text-xs font-black uppercase tracking-[0.1em] hover:bg-neon-green/90 transition-all shadow-[0_0_20px_rgba(0,255,163,0.1)] group disabled:opacity-50"
                                    >
                                        {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                                        {isRunning ? "Verifying…" : "Run Protocol"}
                                    </motion.button>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Placeholder when no challenge active */
                        <div className="flex-1 flex items-center justify-center p-12 text-center font-mono">
                            <div className="max-w-xs space-y-4">
                                <div className="w-16 h-16 border border-white/5 bg-white/[0.02] flex items-center justify-center mx-auto relative group">
                                    <Code2 className="w-8 h-8 text-zinc-800 transition-colors group-hover:text-zinc-600" />
                                    <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/10" />
                                    <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/10" />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[11px] text-zinc-700 uppercase tracking-widest font-black">Waiting for Action</p>
                                    <p className="text-[10px] text-zinc-800 leading-relaxed uppercase">
                                        {lesson.hasChallenge
                                            ? "$ open --challenge to begin development environment"
                                            : "$ no_challenge --status=ready"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Sidebar overlay ── */}
                <AnimatePresence>
                    {showSidebar && (
                        <>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 font-mono" onClick={() => setShowSidebar(false)} />
                            <motion.div
                                initial={{ x: "100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "100%" }}
                                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                                className="absolute right-0 top-0 bottom-0 w-80 bg-[#080c14] border-l border-white/[0.08] z-40 overflow-y-auto font-mono flex flex-col"
                            >
                                <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#0a0f1a]">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] text-neon-green/60 uppercase tracking-widest">Module Contents</span>
                                        <span className="text-xs font-black text-white truncate uppercase tracking-wider">{lesson.milestone.title}</span>
                                    </div>
                                    <button onClick={() => setShowSidebar(false)} className="p-2 border border-white/5 hover:bg-white/5 text-zinc-500 transition-colors"><X className="w-4 h-4" /></button>
                                </div>
                                <div className="p-3 flex-1 space-y-1 bg-[#050810]/50">
                                    {sidebarLessons.map((sl) => {
                                        const ti = typeIcons[sl.type] || typeIcons.doc;
                                        const Icon = ti.icon;
                                        const isActive = sl.id === id || sl.id === lesson.id;
                                        return (
                                            <Link
                                                key={sl.id}
                                                href={`/courses/${slug}/lessons/${sl.id}`}
                                                className={`flex items-center gap-4 px-4 py-3 border transition-all ${isActive
                                                    ? "bg-neon-green/5 border-neon-green/30 text-neon-green shadow-[0_0_15px_rgba(0,255,163,0.05)]"
                                                    : "bg-white/[0.01] border-white/5 text-zinc-500 hover:border-white/20 hover:text-zinc-300"}`}
                                            >
                                                <Icon className={`w-4 h-4 ${isActive ? "text-neon-green" : ti.color} shrink-0`} />
                                                <div className="flex-1 min-w-0">
                                                    <div className={`text-[11px] font-black uppercase tracking-wider ${isActive ? "text-white" : ""}`}>{sl.title}</div>
                                                    <div className="text-[9px] text-zinc-600 mt-0.5 uppercase tracking-widest">
                                                        {sl.type} {sl.completed ? "— [COMPLETED]" : "— [PENDING]"}
                                                    </div>
                                                </div>
                                                {sl.completed && <CheckCircle2 className="w-4 h-4 text-neon-green shrink-0" />}
                                                {isActive && <div className="w-1 h-4 bg-neon-green" />}
                                            </Link>
                                        );
                                    })}
                                </div>
                                <div className="p-5 border-t border-white/[0.08] bg-[#0a0f1a]">
                                    <button className="w-full py-3 border border-white/10 text-[10px] text-zinc-500 uppercase font-black tracking-widest hover:text-white hover:border-white/20 transition-all">
                                        View Full Catalog
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom bar */}
            <div className="shrink-0 border-t border-white/[0.08] bg-[#020408] px-6 py-3 flex items-center justify-between font-mono relative z-10">
                <div className="flex items-center gap-4">
                    {prevLesson ? (
                        <Link href={`/courses/${slug}/lessons/${prevLesson.id}`} className="flex items-center gap-2 group text-xs text-zinc-500 hover:text-neon-green transition-colors">
                            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                            <span className="hidden sm:inline uppercase tracking-widest">Previous</span>
                        </Link>
                    ) : <div />}
                </div>

                <div className="flex items-center gap-4">
                    <div className="h-6 w-px bg-white/10 hidden sm:block" />
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            if (lesson.type !== "test") {
                                if (nextLesson) {
                                    router.push(`/courses/${slug}/lessons/${nextLesson.id}`);
                                } else {
                                    router.push(`/courses/${slug}`);
                                }
                            }
                        }}
                        className="flex items-center gap-2.5 px-6 py-2 bg-white/[0.03] border border-white/10 hover:border-neon-green/40 hover:text-neon-green transition-all text-zinc-400 text-[10px] font-black uppercase tracking-widest group"
                    >
                        <CheckCircle2 className="w-4 h-4 group-hover:text-neon-green" />
                        {lesson.type === "test" ? "View Challenge" : (nextLesson ? "Mark Done & Continue" : "Complete Part")}
                    </motion.button>
                    <div className="h-6 w-px bg-white/10 hidden sm:block" />
                </div>

                <div className="flex items-center gap-4">
                    {nextLesson ? (
                        <Link href={`/courses/${slug}/lessons/${nextLesson.id}`} className="flex items-center gap-2 group text-xs text-zinc-500 hover:text-neon-cyan transition-colors">
                            <span className="hidden sm:inline uppercase tracking-widest">Next Lesson</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    ) : (
                        <div className="text-[10px] text-zinc-700 uppercase tracking-widest font-black">Quest Complete</div>
                    )}
                </div>
            </div>
        </div>
    );
}

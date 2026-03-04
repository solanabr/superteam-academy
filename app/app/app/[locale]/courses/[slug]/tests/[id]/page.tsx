"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/providers/auth-context";
import { coursesApi } from "@/lib/courses";
import { MonacoCodeEditor } from "@/components/ui/monaco-code-editor";
import { executeInSandbox } from "@/lib/code-sandbox";
import type { TestCase } from "@/lib/code-sandbox";
import {
    ArrowLeft,
    CheckCircle2,
    Code2,
    Loader2,
    Play,
    Shield,
    Sparkles,
    Terminal,
    X,
    Zap,
    AlertCircle,
    Swords,
    Trophy,
} from "lucide-react";

export default function TestPage() {
    const { slug, id } = useParams<{ slug: string; id: string }>();
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();

    const [test, setTest] = useState<any>(null);
    const [milestone, setMilestone] = useState<any>(null);
    const [courseTitle, setCourseTitle] = useState("");
    const [loading, setLoading] = useState(true);

    /* UI & Challenge State */
    const [code, setCode] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [output, setOutput] = useState<string | null>(null);
    const [testResults, setTestResults] = useState<any[]>([]);
    const [isPassed, setIsPassed] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [showTerminal, setShowTerminal] = useState(false);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});

    useEffect(() => {
        if (!authLoading && !isAuthenticated) router.push("/auth");
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            coursesApi.getCourseBySlug(slug as string).then(res => {
                const { course: c, milestoneProgress } = res.data;
                let foundTest: any = null;
                let foundMilestone: any = null;

                c.milestones.forEach((m: any) => {
                    const t = m.tests?.find((t: any) => t._id === id);
                    if (t) {
                        foundTest = t;
                        foundMilestone = m;
                    }
                });

                if (foundTest) {
                    const progress = milestoneProgress?.find((p: any) => p.milestoneId === foundMilestone._id);
                    const attempt = progress?.testAttempts?.find((a: any) => a.testId === id);

                    setIsPassed(attempt?.passed || false);
                    setCourseTitle(c.title);
                    setMilestone(foundMilestone);
                    setTest({
                        ...foundTest,
                        type: foundTest.questions?.length > 0 ? "quiz" : "code_challenge"
                    });

                    if (foundTest.codeChallenge) {
                        setCode(foundTest.codeChallenge.starterCode || "");
                        setTestResults(foundTest.codeChallenge.testCases?.map((tc: any, idx: number) => ({
                            id: `t${idx}`, name: tc.description, passed: null
                        })) || []);
                    }
                }
                setLoading(false);
            }).catch(err => {
                console.error(err);
                setLoading(false);
            });
        }
    }, [slug, id, authLoading, isAuthenticated]);

    const runEvaluation = async () => {
        setIsRunning(true);
        setOutput(null);
        setShowFeedback(false);
        setShowTerminal(true);

        try {
            if (test.type === "code_challenge") {
                // Pre-execution linting
                const lintError = import("@/lib/code-sandbox").then(m => m.lintCode(code));
                const error = await lintError;
                if (error) {
                    setOutput(error);
                    setIsRunning(false);
                    return;
                }

                const cases: TestCase[] = test.codeChallenge.testCases.map((tc: any, idx: number) => ({
                    id: `t${idx}`,
                    name: tc.description,
                    input: tc.input,
                    expectedOutput: tc.expectedOutput
                }));

                const result = await executeInSandbox(code, cases);
                const animatedResults: any[] = [];
                const submissionResults: any[] = [];

                // Capturing console logs to output
                if (result.output && result.output.length > 0) {
                    setOutput(result.output.join("\n"));
                }

                for (let i = 0; i < cases.length; i++) {
                    await new Promise(r => setTimeout(r, 400));
                    const sandboxResult = result.testResults.find(r => r.id === cases[i].id);
                    const passed = sandboxResult ? sandboxResult.passed : false;

                    animatedResults.push({
                        ...cases[i],
                        passed,
                    });

                    submissionResults.push({
                        input: cases[i].input,
                        output: sandboxResult?.actualOutput || ""
                    });

                    setTestResults([...animatedResults, ...cases.slice(i + 1).map(t => ({ ...t, passed: null }))]);
                }

                const allPassed = animatedResults.every(r => r.passed);
                if (allPassed) {
                    try {
                        await coursesApi.completeMilestone(slug as string, milestone._id, id, {
                            codeResults: submissionResults
                        });
                        setIsPassed(true);
                        setOutput(prev => (prev ? prev + "\n\n" : "") + "DECIPHERING COMPLETE. ACCESS GRANTED.");
                    } catch (err: any) {
                        console.error("Submission failed:", err);
                        setOutput(prev => (prev ? prev + "\n\n" : "") + `[BREACH SYSTEM ERROR]: ${err.message || "PROTOCOL_SYNC_FAILED"}`);
                    }
                } else {
                    setOutput(prev => (prev ? prev + "\n\n" : "") + "SEQUENCE ERROR. BREACH FAILED.");
                }
            } else {
                // Quiz logic
                const total = test.questions.length;
                if (Object.keys(selectedAnswers).length < total) {
                    setOutput("EVALUATION INCOMPLETE. ANSWER ALL PROMPTS.");
                    setIsRunning(false);
                    return;
                }

                await new Promise(r => setTimeout(r, 1000));

                const answers = test.questions.map((q: any, idx: number) => ({
                    questionId: q._id,
                    selectedLabel: q.options[selectedAnswers[idx]]?.label
                }));

                let correct = 0;
                test.questions.forEach((q: any, idx: number) => {
                    if (q.options[selectedAnswers[idx]]?.isCorrect) correct++;
                });

                const passed = correct === total;
                setShowFeedback(true);

                if (passed) {
                    await coursesApi.completeMilestone(slug as string, milestone._id, id, {
                        quizAnswers: answers
                    });
                    setIsPassed(true);
                    setOutput("PROTOCOL VALIDATED. NEURAL SYNC SUCCESSFUL.");
                } else {
                    setOutput(`ACCURACY: ${Math.round((correct / total) * 100)}%. RETRY RECOMMENDED.`);
                }
            }
        } catch (err) {
            console.error(err);
            setOutput("SYSTEM ERROR: UNSTABLE UPLINK");
        } finally {
            setIsRunning(false);
        }
    };

    if (loading) return <div className="h-screen bg-[#020408] flex items-center justify-center"><Loader2 className="w-6 h-6 text-neon-cyan animate-spin" /></div>;
    if (!test) return <div className="h-screen bg-[#020408] text-white p-10 font-mono">Test not found.</div>;

    const passedCount = testResults.filter(r => r.passed === true).length;
    const totalCount = testResults.length;
    const hpPercent = totalCount > 0 ? 100 - (passedCount / totalCount * 100) : 100;

    return (
        <div className="h-screen flex flex-col bg-[#020408] overflow-hidden font-mono text-zinc-400">
            {/* Boss Header */}
            <div className="shrink-0 border-b border-white/[0.06] bg-[#050810] px-6 h-14 flex items-center justify-between relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent pointer-events-none" />

                <div className="flex items-center gap-4 relative z-10">
                    <Link href={`/courses/${slug}`} className="text-[10px] text-zinc-500 hover:text-white transition-colors flex items-center gap-1.5">
                        <ArrowLeft className="w-3.5 h-3.5" /> RETREAT
                    </Link>
                    <div className="h-4 w-px bg-white/10" />
                    <div className="flex flex-col">
                        <span className="text-[9px] text-zinc-600 uppercase tracking-widest font-black">BOSS_CHALLENGE</span>
                        <span className="text-xs text-white font-black uppercase tracking-wider">{test.title}</span>
                    </div>
                </div>

                <div className="flex items-center gap-6 relative z-10">
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-[9px] text-zinc-600 uppercase tracking-widest">Milestone Reward</span>
                        <div className="flex items-center gap-1.5 text-neon-green font-black text-[11px]">
                            <Zap className="w-3 h-3" /> +{milestone.xpReward} XP
                        </div>
                    </div>
                    {isPassed ? (
                        <div className="px-3 py-1 bg-neon-green/10 border border-neon-green/30 text-neon-green text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                            <Trophy className="w-3.5 h-3.5" /> CONQUERED
                        </div>
                    ) : (
                        <div className="px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                            <Swords className="w-3.5 h-3.5 animate-pulse" /> BOSS ACTIVE
                        </div>
                    )}
                </div>
            </div>

            <main className="flex-1 flex overflow-hidden relative">
                {/* Pane 1: Instructions & HP */}
                <div className="w-[400px] border-r border-white/[0.06] bg-[#020408] flex flex-col">
                    <div className="shrink-0 p-6 border-b border-white/[0.06] bg-red-500/5 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Boss Status</span>
                            <span className="text-[10px] text-zinc-500 font-bold uppercase">{Math.round(hpPercent)}% HP</span>
                        </div>
                        <div className="h-2 bg-zinc-900 border border-white/5 relative overflow-hidden">
                            <motion.div
                                initial={{ width: "100%" }}
                                animate={{ width: `${hpPercent}%` }}
                                className="h-full bg-gradient-to-r from-red-600 to-red-400"
                            />
                            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.1)_50%,transparent_100%)] w-20 animate-shimmer" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                        <div className="space-y-4">
                            <h3 className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-neon-cyan" /> Briefing
                            </h3>
                            <p className="text-[11px] leading-relaxed text-zinc-500 uppercase">
                                {test.type === "code_challenge" ? test.codeChallenge?.prompt : "Validate your knowledge of this module through this final evaluation. Errors will result in protocol failure."}
                            </p>
                        </div>

                        {test.type === "quiz" && (
                            <div className="space-y-10">
                                {test.questions.map((q: any, idx: number) => (
                                    <div key={idx} className="space-y-4">
                                        <div className="flex gap-4">
                                            <span className="text-neon-cyan/40 font-black">0{(idx + 1)}.</span>
                                            <h3 className="text-sm font-bold text-white uppercase tracking-wider leading-relaxed">{q.question}</h3>
                                        </div>
                                        <div className="grid gap-2 pl-9">
                                            {q.options.map((opt: any, oIdx: number) => {
                                                const isSelected = selectedAnswers[idx] === oIdx;
                                                const isCorrect = opt.isCorrect;
                                                const showExp = showFeedback && (isSelected || isCorrect);

                                                return (
                                                    <div key={oIdx} className="space-y-2">
                                                        <button
                                                            disabled={showFeedback && isPassed}
                                                            onClick={() => setSelectedAnswers(prev => ({ ...prev, [idx]: oIdx }))}
                                                            className={`w-full p-4 text-left border transition-all text-[10px] uppercase tracking-widest relative group ${isSelected
                                                                ? (showFeedback ? (isCorrect ? "bg-neon-green/10 border-neon-green/40 text-neon-green" : "bg-red-500/10 border-red-500/40 text-red-400") : "bg-neon-cyan/10 border-neon-cyan/40 text-neon-cyan")
                                                                : (showFeedback && isCorrect ? "bg-neon-green/5 border-neon-green/20 text-neon-green/60" : "bg-white/[0.02] border-white/5 text-zinc-500 hover:border-white/20 hover:text-zinc-300")
                                                                }`}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span>{opt.label}</span>
                                                                {isSelected && <div className={`w-1.5 h-1.5 ${showFeedback ? (isCorrect ? "bg-neon-green" : "bg-red-500") : "bg-neon-cyan"}`} />}
                                                            </div>
                                                        </button>
                                                        {showExp && q.explanation && (
                                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pl-4 border-l border-white/10 text-[9px] text-zinc-600 py-1">
                                                                {q.explanation}
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {test.type === "code_challenge" && (
                            <div className="space-y-4 pt-4 border-t border-white/[0.06]">
                                <h3 className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-amber-400" /> Objectives
                                </h3>
                                <div className="space-y-2">
                                    {testResults.map((tr, i) => (
                                        <div key={i} className="flex items-center justify-between px-3 py-2 border border-white/5 bg-white/[0.01] text-[10px]">
                                            <span className="truncate w-64 text-zinc-500 uppercase">{tr.name}</span>
                                            {tr.passed === null ? (
                                                <div className="w-2 h-2 rounded-full bg-zinc-800" />
                                            ) : tr.passed ? (
                                                <CheckCircle2 className="w-3.5 h-3.5 text-neon-green" />
                                            ) : (
                                                <X className="w-3.5 h-3.5 text-red-500" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-white/[0.06] bg-black/40 space-y-4">
                        {isPassed && (
                            <button
                                onClick={() => router.push(`/courses/${slug}`)}
                                className="w-full py-3 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-[10px] font-black uppercase tracking-widest hover:bg-neon-cyan/20 transition-all flex items-center justify-center gap-2"
                            >
                                <Zap className="w-3.5 h-3.5" /> Continue Quest
                            </button>
                        )}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={runEvaluation}
                            disabled={isRunning || (isPassed && test.type === "quiz")}
                            className={`w-full py-4 font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-2xl text-xs ${isRunning ? "bg-zinc-800 text-zinc-500" : "bg-neon-green hover:bg-neon-green/90 text-black"
                                }`}
                        >
                            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                            {isRunning ? "Running..." : "Execute Protocol"}
                        </motion.button>
                    </div>
                </div>

                {/* Pane 2: Editor */}
                <div className="flex-1 bg-[#050810] flex flex-col relative overflow-hidden">
                    <div className="flex-1">
                        <MonacoCodeEditor
                            code={code}
                            language={test.codeChallenge?.language || "typescript"}
                            onChange={setCode}
                        />
                    </div>

                    {/* Sliding Terminal */}
                    <AnimatePresence>
                        {showTerminal && (
                            <motion.div
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="absolute bottom-0 left-0 right-0 h-[300px] border-t-2 border-neon-green/30 bg-[#020408] z-20 flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
                            >
                                <div className="h-9 px-4 bg-[#0a0f1a] border-b border-white/[0.06] flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="flex gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20" />
                                            <div className="w-2.5 h-2.5 rounded-full bg-neon-green/20" />
                                        </div>
                                        <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest flex items-center gap-2">
                                            <Terminal className="w-3.5 h-3.5" /> Node_Console_Raw
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setShowTerminal(false)}
                                        className="text-zinc-600 hover:text-white transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex-1 p-6 font-mono text-xs overflow-y-auto custom-scrollbar">
                                    {output ? (
                                        <div className={`space-y-4 whitespace-pre-wrap ${isPassed ? "text-neon-cyan" : "text-zinc-400"}`}>
                                            {output.split("\n").map((line, i) => (
                                                <div key={i} className="flex gap-3">
                                                    <span className="text-zinc-700 select-none">[{i + 1}]</span>
                                                    <span>{line}</span>
                                                </div>
                                            ))}
                                            <div className="animate-pulse inline-block w-2 h-4 bg-neon-cyan/50 ml-1" />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 text-zinc-800 italic">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            Initializing runtime environment...
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}

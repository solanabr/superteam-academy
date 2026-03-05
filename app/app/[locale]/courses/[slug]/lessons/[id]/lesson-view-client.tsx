"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Play,
    RotateCcw,
    Lightbulb,
    Eye,
    Zap,
    ChevronDown,
    ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Course, Lesson } from "@/lib/types";
import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { progressService } from "@/lib/services/local-progress.service";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { superteamTheme } from "@/lib/editor-theme";
import { InteractiveQuiz } from "@/components/interactive-quiz";

interface LessonViewClientProps {
    course: Course;
    lesson: Lesson;
    moduleTitle: string;
    currentIndex: number;
    totalLessons: number;
    prevLessonId?: string;
    nextLessonId?: string;
}

const sampleContent: Record<string, string> = {
    reading: `## Understanding the Concept

When building on Solana, it's essential to understand how the runtime processes your instructions. Every transaction is composed of one or more instructions, and each instruction targets a specific program.

### Key Points

- **Accounts are data containers** — they hold state and are owned by programs
- **Programs are stateless** — they read from and write to accounts
- **Transactions are atomic** — all instructions succeed or all fail

### Code Example

\`\`\`typescript
import { Connection, PublicKey } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com");
const accountInfo = await connection.getAccountInfo(
  new PublicKey("...")
);

console.log("Owner:", accountInfo?.owner.toBase58());
console.log("Lamports:", accountInfo?.lamports);
console.log("Data length:", accountInfo?.data.length);
\`\`\`

### What's Next

In the next lesson, we'll put this theory into practice by writing actual transactions.`,
    code: `// Complete the function below to create a new token mint
import { createMint } from "@solana/spl-token";
import { Connection, Keypair } from "@solana/web3.js";

const connection = new Connection(
  "https://api.devnet.solana.com"
);

const payer = Keypair.generate();
const mintAuthority = Keypair.generate();

// TODO: Create the mint
const mint = await createMint(
  connection,
  payer,
  mintAuthority.publicKey,
  null,
  9  // decimals
);

console.log("Mint created:", mint.toBase58());`,
};

const sampleTests = [
    { id: "t1", description: "createMint is called with correct parameters", passed: true },
    { id: "t2", description: "Mint has 9 decimal places", passed: true },
    { id: "t3", description: "Mint authority is correctly set", passed: undefined },
];

export function LessonViewClient({
    course,
    lesson,
    moduleTitle,
    currentIndex,
    totalLessons,
    prevLessonId,
    nextLessonId,
}: LessonViewClientProps) {
    const t = useTranslations("Lesson");
    const { publicKey } = useWallet();
    const [showHint, setShowHint] = useState(false);
    const [showSolution, setShowSolution] = useState(false);
    const [isCompleted, setIsCompleted] = useState(lesson.isCompleted ?? false);
    const [isCompleting, setIsCompleting] = useState(false);
    const [testsRun, setTestsRun] = useState(false);
    const [quizPassed, setQuizPassed] = useState(false);

    const content = sampleContent[lesson.type] ?? sampleContent.reading;
    const isCodeLesson = lesson.type === "code";

    // Code Editor state
    const [code, setCode] = useState(content);

    // Reset code when lesson changes
    useEffect(() => {
        setCode(sampleContent[lesson.type] ?? "");
    }, [lesson.id, lesson.type]);
    useEffect(() => {
        if (!publicKey) return;
        progressService.getEnrollment(course.id, publicKey.toString())
            .then(enrollment => {
                if (enrollment && enrollment.completedLessons.includes(currentIndex)) {
                    setIsCompleted(true);
                }
            })
            .catch(console.error);
    }, [course.id, currentIndex, publicKey]);

    const handleComplete = async () => {
        if (!publicKey) {
            alert("Please connect your wallet first.");
            return;
        }
        setIsCompleting(true);
        try {
            await progressService.completeLesson(course.id, currentIndex, publicKey.toString());
            setIsCompleted(true);
        } catch (e) {
            console.error("Failed to complete lesson", e);
        } finally {
            setIsCompleting(false);
        }
    };

    return (
        <div className="flex h-screen flex-col bg-background">
            {/* Top Bar */}
            <header className="flex h-14 items-center justify-between border-b border-border/50 bg-card/80 px-4 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <Link
                        href={`/courses/${course.slug}`}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {t("backToCourse")}
                    </Link>
                    <span className="text-muted-foreground/30">|</span>
                    <span className="text-xs text-muted-foreground">{moduleTitle}</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                        {t("step", { current: currentIndex + 1, total: totalLessons })}
                    </span>
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-accent">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-solana-purple to-solana-green transition-all"
                            style={{ width: `${((currentIndex + 1) / totalLessons) * 100}%` }}
                        />
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden" data-tutorial="lesson-content">
                {/* Content Panel */}
                <div className={`flex-1 overflow-y-auto ${isCodeLesson ? "border-r border-border/50" : ""}`}>
                    <div className={`mx-auto ${isCodeLesson ? "max-w-2xl" : "max-w-3xl"} px-8 py-8`}>
                        {/* Lesson header */}
                        <div className="mb-8">
                            <span className="text-xs font-medium uppercase tracking-wider text-solana-purple">
                                {lesson.type === "code" ? t("challenge") : lesson.type}
                            </span>
                            <h1 className="mt-2 font-display text-2xl font-bold md:text-3xl">{lesson.title}</h1>
                            <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
                                <span>{lesson.duration}</span>
                                <span className="flex items-center gap-1 text-solana-green">
                                    <Zap className="h-3 w-3" />+{lesson.xp} XP
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        {!isCodeLesson && (
                            <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-display prose-code:text-solana-purple">
                                {content.split("\n").map((line, i) => {
                                    if (line.startsWith("## ")) return <h2 key={i} className="mt-8 mb-4 text-xl font-bold">{line.slice(3)}</h2>;
                                    if (line.startsWith("### ")) return <h3 key={i} className="mt-6 mb-3 text-lg font-semibold">{line.slice(4)}</h3>;
                                    if (line.startsWith("- ")) return <li key={i} className="ml-4 text-muted-foreground">{line.slice(2)}</li>;
                                    if (line.startsWith("```")) return null;
                                    if (line.trim() === "") return <br key={i} />;
                                    return <p key={i} className="text-muted-foreground leading-relaxed">{line}</p>;
                                })}
                            </div>
                        )}

                        {/* Code challenge description (for code lessons) */}
                        {isCodeLesson && (
                            <div className="space-y-6">
                                <div className="rounded-xl border border-border/60 bg-card/50 p-5">
                                    <h3 className="text-sm font-semibold">{t("objectives")}</h3>
                                    <ul className="mt-3 space-y-2">
                                        {["Call createMint with the correct parameters", "Set 9 decimal places", "Use the payer and mintAuthority keypairs"].map((obj, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                                                {obj}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Hints */}
                                <button
                                    onClick={() => setShowHint(!showHint)}
                                    className="flex items-center gap-2 text-sm text-solana-purple hover:underline"
                                >
                                    <Lightbulb className="h-4 w-4" />
                                    {t("hint")}
                                    {showHint ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                </button>
                                <AnimatePresence>
                                    {showHint && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="rounded-lg border border-solana-purple/20 bg-solana-purple/5 p-4 text-sm"
                                        >
                                            Use the createMint function from @solana/spl-token. It takes connection, payer, mintAuthority, freezeAuthority (null), and decimals.
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Test cases */}
                                {testsRun && (
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-semibold">{t("testCases")}</h3>
                                        {sampleTests.map((test) => (
                                            <div key={test.id} className="flex items-center gap-2 text-sm">
                                                {test.passed === true ? (
                                                    <CheckCircle2 className="h-4 w-4 text-solana-green" />
                                                ) : test.passed === false ? (
                                                    <span className="h-4 w-4 rounded-full border-2 border-red-500" />
                                                ) : (
                                                    <span className="h-4 w-4 rounded-full border border-muted-foreground/30" />
                                                )}
                                                <span className={test.passed ? "text-foreground" : "text-muted-foreground"}>
                                                    {test.description}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Interactive Quiz (appended to any lesson type) */}
                        {lesson.quiz && lesson.quiz.questions && lesson.quiz.questions.length > 0 && (
                            <InteractiveQuiz
                                quiz={lesson.quiz}
                                onComplete={(passed) => {
                                    if (passed) setQuizPassed(true);
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Code Editor Panel (for code lessons) */}
                {isCodeLesson && (
                    <div className="flex w-1/2 flex-col border-l border-border/50">
                        {/* Editor header */}
                        <div className="flex items-center justify-between border-b border-border/50 px-4 py-2.5">
                            <div className="flex items-center gap-2">
                                <div className="flex gap-1.5">
                                    <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                                    <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                                </div>
                                <span className="text-xs text-muted-foreground font-mono">solution.ts</span>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 gap-1 text-xs"
                                    onClick={() => setCode(content)}
                                >
                                    <RotateCcw className="h-3 w-3" />{t("resetCode")}
                                </Button>
                            </div>
                        </div>

                        {/* Code content using CodeMirror */}
                        <div className="flex-1 overflow-auto bg-card/10">
                            <CodeMirror
                                value={code}
                                height="100%"
                                extensions={[javascript({ typescript: true })]}
                                onChange={(value) => setCode(value)}
                                theme={superteamTheme}
                                className="h-full text-sm font-mono leading-relaxed [&>.cm-editor]:h-full [&>.cm-editor]:outline-none"
                            />
                        </div>

                        {/* Editor footer */}
                        <div className="flex items-center justify-between border-t border-border/50 px-4 py-3">
                            <button
                                onClick={() => setShowSolution(!showSolution)}
                                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Eye className="h-3.5 w-3.5" />{t("solution")}
                            </button>
                            <Button
                                size="sm"
                                onClick={() => setTestsRun(true)}
                                className="gap-1.5 rounded-full bg-gradient-to-r from-solana-purple to-solana-green text-white hover:brightness-110"
                            >
                                <Play className="h-3.5 w-3.5" />{t("runCode")}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Navigation */}
            <footer className="flex items-center justify-between border-t border-border/50 bg-card/80 px-6 py-3 backdrop-blur-xl">
                <div>
                    {prevLessonId && (
                        <Link href={`/courses/${course.slug}/lessons/${prevLessonId}`}>
                            <Button variant="ghost" size="sm" className="gap-1.5">
                                <ArrowLeft className="h-4 w-4" />{t("previous")}
                            </Button>
                        </Link>
                    )}
                </div>

                <Button
                    data-tutorial="complete-button"
                    onClick={handleComplete}
                    disabled={
                        isCompleted ||
                        isCompleting ||
                        !publicKey ||
                        (lesson.quiz?.isRequired && !quizPassed)
                    }
                    className={`rounded-full px-6 ${isCompleted
                        ? "bg-solana-green/10 text-solana-green border border-solana-green/30"
                        : "bg-gradient-to-r from-solana-purple to-solana-green text-white hover:brightness-110"
                        }`}
                >
                    {isCompleting ? (
                        <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                    ) : isCompleted ? (
                        <><CheckCircle2 className="mr-2 h-4 w-4" />{t("completed")} · +{lesson.xp} XP</>
                    ) : (
                        <>{!publicKey ? "Connect Wallet to Complete" : t("complete")}</>
                    )}
                </Button>

                <div>
                    {nextLessonId && (
                        <Link href={`/courses/${course.slug}/lessons/${nextLessonId}`}>
                            <Button variant="ghost" size="sm" className="gap-1.5">
                                {t("next")}<ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    )}
                </div>
            </footer>
        </div>
    );
}

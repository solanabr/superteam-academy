"use client";

import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import {
    CheckCircle2,
    Lock,
    Star,
    Trophy,
    Zap,
    BookOpen,
    Code2,
    PlayCircle,
    FileText,
    Gamepad2,
} from "lucide-react";
import type { Course, Lesson } from "@/lib/types";

const lessonTypeIcons: Record<string, React.ElementType> = {
    reading: FileText,
    code: Code2,
    quiz: Star,
    video: PlayCircle,
    game: Gamepad2,
};

interface PathNode {
    type: "lesson" | "milestone";
    lesson?: Lesson;
    isModuleCompleted?: boolean;
    courseSlug: string;
    milestoneTitle?: string;
}

function buildPathNodes(course: Course): PathNode[] {
    const nodes: PathNode[] = [];

    course.modules.forEach((mod) => {
        nodes.push({
            type: "milestone",
            isModuleCompleted: mod.isCompleted,
            courseSlug: course.slug,
            milestoneTitle: mod.title,
        });

        mod.lessons.forEach((lesson) => {
            nodes.push({
                type: "lesson",
                lesson,
                courseSlug: course.slug,
            });
        });
    });

    return nodes;
}

/**
 * S-curve horizontal offset using sine wave.
 * Returns a value from -1 to 1 representing the horizontal position.
 */
function getOffsetRatio(index: number): number {
    return Math.sin((index * Math.PI) / 4);
}

const AMPLITUDE = 120; // px — how far left/right nodes swing
const NODE_GAP = 24; // gap between connector and node (px)
const CONNECTOR_HEIGHT = 48; // height of the SVG connector
const CONNECTOR_WIDTH = AMPLITUDE * 2 + 80; // wide enough for curves

/**
 * Draws an SVG cubic bezier curve between two horizontal offsets.
 * Control points stay at the FROM and TO x-positions but at 1/3 and 2/3 of the height,
 * creating a smooth S-curve that visually arcs between the two positions.
 */
function CurveConnector({
    fromOffset,
    toOffset,
    isCompleted,
    isLocked,
    index,
}: {
    fromOffset: number;
    toOffset: number;
    isCompleted: boolean;
    isLocked: boolean;
    index: number;
}) {
    const centerX = CONNECTOR_WIDTH / 2;
    const x1 = centerX + fromOffset;
    const x2 = centerX + toOffset;

    // Cubic bezier: control points stay at their respective x but at 1/3 and 2/3 height
    // This creates a smooth S-curve that sweeps from one column to another
    const cp1x = x1;
    const cp1y = CONNECTOR_HEIGHT * 0.65;
    const cp2x = x2;
    const cp2y = CONNECTOR_HEIGHT * 0.35;

    return (
        <div className="flex justify-center" style={{ height: CONNECTOR_HEIGHT }}>
            <svg
                width={CONNECTOR_WIDTH}
                height={CONNECTOR_HEIGHT}
                viewBox={`0 0 ${CONNECTOR_WIDTH} ${CONNECTOR_HEIGHT}`}
                fill="none"
                className="overflow-visible"
            >
                <motion.path
                    d={`M ${x1} 0 C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${CONNECTOR_HEIGHT}`}
                    stroke={isCompleted ? "var(--solana-green)" : "currentColor"}
                    strokeWidth={isLocked ? 2 : 3}
                    strokeDasharray={isLocked ? "6 4" : "none"}
                    strokeLinecap="round"
                    className={isCompleted ? "opacity-50" : "text-border/60"}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{
                        delay: index * 0.06,
                        duration: 0.35,
                        ease: "easeOut",
                    }}
                />
            </svg>
        </div>
    );
}

export function LearningPath({ course }: { course: Course }) {
    const nodes = buildPathNodes(course);

    return (
        <div className="flex flex-col items-center py-4">
            {nodes.map((node, i) => {
                const offset = getOffsetRatio(i) * AMPLITUDE;
                const prevOffset = i > 0 ? getOffsetRatio(i - 1) * AMPLITUDE : 0;

                // Determine connector state
                const prevNode = i > 0 ? nodes[i - 1] : null;
                const prevCompleted = prevNode
                    ? prevNode.type === "milestone"
                        ? !!prevNode.isModuleCompleted
                        : !!prevNode.lesson?.isCompleted
                    : false;
                const isLocked = node.type === "lesson" && !!node.lesson?.isLocked;

                return (
                    <div key={`${node.type}-${i}`} className="flex flex-col items-center w-full">
                        {/* Curved connector */}
                        {i > 0 && (
                            <CurveConnector
                                fromOffset={prevOffset}
                                toOffset={offset}
                                isCompleted={prevCompleted}
                                isLocked={isLocked}
                                index={i}
                            />
                        )}

                        {/* Node — use framer-motion x for proper transform composition */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.7, x: offset }}
                            animate={{ opacity: 1, scale: 1, x: offset }}
                            transition={{
                                delay: i * 0.06,
                                duration: 0.3,
                                type: "spring",
                                stiffness: 260,
                                damping: 20,
                            }}
                        >
                            {node.type === "milestone" ? (
                                <MilestoneNode node={node} />
                            ) : (
                                <LessonNode node={node} />
                            )}
                        </motion.div>
                    </div>
                );
            })}
        </div>
    );
}

function MilestoneNode({ node }: { node: PathNode }) {
    const isCompleted = node.isModuleCompleted;

    return (
        <div className="flex flex-col items-center gap-2 my-1">
            <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg transition-transform hover:scale-105 ${isCompleted
                    ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-amber-500/25"
                    : "bg-gradient-to-br from-solana-purple/15 to-solana-green/15 text-solana-purple border-2 border-solana-purple/20"
                    }`}
            >
                <Trophy className="h-7 w-7" />
            </div>
            <span className="text-[11px] font-bold text-center max-w-[130px] leading-snug">
                {node.milestoneTitle}
            </span>
        </div>
    );
}

function LessonNode({ node }: { node: PathNode }) {
    const lesson = node.lesson!;
    const isCompleted = lesson.isCompleted;
    const isLocked = lesson.isLocked;
    const isCurrent = !isCompleted && !isLocked;
    const isGame = lesson.type === "game";
    const Icon = isCompleted
        ? CheckCircle2
        : isLocked
            ? Lock
            : lessonTypeIcons[lesson.type] || BookOpen;

    const nodeContent = (
        <div className="group flex flex-col items-center gap-1.5 my-1">
            <div className="relative">
                {/* Pulse for current */}
                {isCurrent && (
                    <div className="absolute -inset-2.5 rounded-full bg-gradient-to-br from-solana-purple/20 to-solana-green/20 animate-pulse" />
                )}

                <div
                    className={`relative flex items-center justify-center rounded-full transition-transform ${isGame ? "h-16 w-16" : "h-14 w-14"
                        } ${isCompleted
                            ? "bg-solana-green text-white shadow-lg shadow-solana-green/25"
                            : isCurrent
                                ? "bg-gradient-to-br from-solana-purple to-solana-green text-white shadow-xl shadow-solana-purple/25 ring-4 ring-solana-purple/10"
                                : "bg-card border-2 border-dashed border-border/60 text-muted-foreground/30"
                        } ${!isLocked ? "group-hover:scale-110" : ""}`}
                >
                    <Icon className={isCurrent || isGame ? "h-6 w-6" : "h-5 w-5"} />
                </div>

                {/* XP badge */}
                {!isLocked && (
                    <div className="absolute -bottom-1 -right-2 flex items-center gap-0.5 rounded-full bg-card border border-border/60 px-1.5 py-0.5 shadow-sm">
                        <Zap className="h-2.5 w-2.5 text-solana-green" />
                        <span className="text-[9px] font-bold text-solana-green">
                            {lesson.xp}
                        </span>
                    </div>
                )}

                {/* Game badge */}
                {isGame && !isLocked && !isCompleted && (
                    <div className="absolute -top-1 -left-1 flex items-center rounded-full bg-amber-500 px-1.5 py-0.5 shadow-sm">
                        <span className="text-[8px] font-bold text-white uppercase">Play</span>
                    </div>
                )}
            </div>

            <span
                className={`text-[11px] font-medium text-center max-w-[100px] leading-snug ${isCompleted
                    ? "text-muted-foreground"
                    : isCurrent
                        ? "text-foreground font-bold"
                        : "text-muted-foreground/30"
                    }`}
            >
                {lesson.title}
            </span>
        </div>
    );

    if (isLocked) {
        return <div className="cursor-not-allowed">{nodeContent}</div>;
    }

    return (
        <Link href={`/courses/${node.courseSlug}/lessons/${lesson.id}`}>
            {nodeContent}
        </Link>
    );
}

"use client";

import { useState } from "react";
import { Code2, Plus, Trash2, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCourseFormStore, type ChallengeDraft } from "@/store/course-form-store";

interface ChallengeEditorProps {
    mi: number;
    li: number;
}

export function ChallengeEditor({ mi, li }: ChallengeEditorProps) {
    const store = useCourseFormStore();
    const lesson = store.modules[mi].lessons[li];
    const challenge = lesson.challenge;
    const [objectiveInput, setObjectiveInput] = useState("");
    const [hintInput, setHintInput] = useState("");

    const updateChallenge = (partial: Partial<typeof challenge>) => {
        store.updateLessonChallenge(mi, li, { ...challenge, ...partial });
    };

    return (
        <div className="space-y-4 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
            <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-emerald-500" />
                <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    Challenge Builder
                </h4>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    Challenge Instructions (Prompt)
                </label>
                <textarea
                    value={challenge.prompt}
                    onChange={(e) => updateChallenge({ prompt: e.target.value })}
                    placeholder="Describe the task for the student..."
                    rows={3}
                    className="w-full text-xs rounded-lg border bg-background px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-xs font-medium">Programming Language</label>
                    <select
                        value={challenge.language}
                        onChange={(e) => updateChallenge({ language: e.target.value as ChallengeDraft["language"] })}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                    >
                        <option value="rust">Rust (Solana)</option>
                        <option value="javascript">JavaScript (Web3.js)</option>
                        <option value="typescript">TypeScript</option>
                    </select>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    Objectives
                </label>
                <div className="flex gap-2">
                    <Input
                        value={objectiveInput}
                        onChange={(e) => setObjectiveInput(e.target.value)}
                        placeholder="Add an objective..."
                        className="h-9"
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && objectiveInput.trim()) {
                                updateChallenge({
                                    objectives: [...challenge.objectives, objectiveInput.trim()],
                                });
                                setObjectiveInput("");
                            }
                        }}
                    />
                    <Button
                        size="sm"
                        onClick={() => {
                            if (objectiveInput.trim()) {
                                updateChallenge({
                                    objectives: [...challenge.objectives, objectiveInput.trim()],
                                });
                                setObjectiveInput("");
                            }
                        }}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                    {challenge.objectives.map((obj, i) => (
                        <Badge
                            key={i}
                            variant="secondary"
                            className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        >
                            {obj}
                            <button
                                onClick={() =>
                                    updateChallenge({
                                        objectives: challenge.objectives.filter((_, idx) => idx !== i),
                                    })
                                }
                                className="ml-1 hover:text-emerald-900"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    Hints
                </label>
                <div className="flex gap-2">
                    <Input
                        value={hintInput}
                        onChange={(e) => setHintInput(e.target.value)}
                        placeholder="Add a hint..."
                        className="h-9"
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && hintInput.trim()) {
                                updateChallenge({
                                    hints: [...challenge.hints, hintInput.trim()],
                                });
                                setHintInput("");
                            }
                        }}
                    />
                    <Button
                        size="sm"
                        onClick={() => {
                            if (hintInput.trim()) {
                                updateChallenge({
                                    hints: [...challenge.hints, hintInput.trim()],
                                });
                                setHintInput("");
                            }
                        }}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                    {challenge.hints.map((hint, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                            {hint}
                            <button
                                onClick={() =>
                                    updateChallenge({
                                        hints: challenge.hints.filter((_, idx) => idx !== i),
                                    })
                                }
                                className="ml-1 hover:text-destructive"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                    <label className="text-xs font-medium">Starter Code</label>
                    <textarea
                        value={challenge.starterCode}
                        onChange={(e) => updateChallenge({ starterCode: e.target.value })}
                        placeholder="Snippet providing the initial logic structure"
                        rows={6}
                        className="w-full font-mono text-xs rounded-lg border bg-background px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-medium">Expected Output (Validation)</label>
                    <textarea
                        value={challenge.solutionCode}
                        onChange={(e) => updateChallenge({ solutionCode: e.target.value })}
                        placeholder="The exact output string the runner expects"
                        rows={6}
                        className="w-full font-mono text-xs rounded-lg border bg-background px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
            </div>
        </div>
    );
}

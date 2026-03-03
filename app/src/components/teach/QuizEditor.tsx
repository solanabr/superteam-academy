"use client";

import { HelpCircle, Trash2, X, Plus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCourseFormStore, type QuizQuestionDraft } from "@/store/course-form-store";

interface QuizEditorProps {
    mi: number;
}

export function QuizEditor({ mi }: QuizEditorProps) {
    const store = useCourseFormStore();
    const quiz = store.modules[mi].quiz;

    const updateQuiz = (partial: Partial<typeof quiz>) => {
        store.updateModuleQuiz(mi, { ...quiz, ...partial });
    };

    const updateQuestion = (qi: number, partial: Partial<QuizQuestionDraft>) => {
        const updated = quiz.questions.map((q, i) =>
            i === qi ? { ...q, ...partial } : q,
        );
        updateQuiz({ questions: updated });
    };

    const addQuestion = () => {
        updateQuiz({
            questions: [
                ...quiz.questions,
                { question: "", options: ["", ""], correctIndex: 0, explanation: "" },
            ],
        });
    };

    const removeQuestion = (qi: number) => {
        if (quiz.questions.length <= 1) return;
        updateQuiz({ questions: quiz.questions.filter((_, i) => i !== qi) });
    };

    const addOption = (qi: number) => {
        const q = quiz.questions[qi];
        if (q.options.length >= 6) return;
        updateQuestion(qi, { options: [...q.options, ""] });
    };

    const removeOption = (qi: number, oi: number) => {
        const q = quiz.questions[qi];
        if (q.options.length <= 2) return;
        const newOptions = q.options.filter((_, i) => i !== oi);
        const newCorrect =
            q.correctIndex >= newOptions.length ? 0 : q.correctIndex;
        updateQuestion(qi, { options: newOptions, correctIndex: newCorrect });
    };

    const updateOption = (qi: number, oi: number, value: string) => {
        const q = quiz.questions[qi];
        const newOptions = q.options.map((o, i) => (i === oi ? value : o));
        updateQuestion(qi, { options: newOptions });
    };

    return (
        <div className="space-y-4 rounded-lg border border-violet-200 dark:border-violet-900 bg-violet-50/50 dark:bg-violet-950/20 p-4">
            <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-violet-500" />
                <h4 className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                    Quiz Builder
                </h4>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-medium">Passing Score (%)</label>
                <Input
                    type="number"
                    value={quiz.passingScore}
                    onChange={(e) =>
                        updateQuiz({
                            passingScore: Math.min(
                                100,
                                Math.max(1, Number(e.target.value)),
                            ),
                        })
                    }
                    min={1}
                    max={100}
                    className="h-9 w-32"
                />
            </div>

            {quiz.questions.map((q, qi) => (
                <div key={qi} className="rounded-lg border bg-background p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                            Question {qi + 1}
                        </span>
                        {quiz.questions.length > 1 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeQuestion(qi)}
                                className="h-7 px-2 text-destructive hover:text-destructive"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </div>

                    <textarea
                        value={q.question}
                        onChange={(e) => updateQuestion(qi, { question: e.target.value })}
                        placeholder="Type your question..."
                        rows={2}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                    />

                    <div className="space-y-2">
                        <label className="text-xs font-medium">
                            Options (select the correct one)
                        </label>
                        {q.options.map((opt, oi) => (
                            <div key={oi} className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => updateQuestion(qi, { correctIndex: oi })}
                                    className={`h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${q.correctIndex === oi
                                        ? "border-emerald-500 bg-emerald-500"
                                        : "border-muted-foreground/40 hover:border-muted-foreground"
                                        }`}
                                >
                                    {q.correctIndex === oi && (
                                        <CheckCircle2 className="h-3 w-3 text-white" />
                                    )}
                                </button>
                                <Input
                                    value={opt}
                                    onChange={(e) => updateOption(qi, oi, e.target.value)}
                                    placeholder={`Option ${oi + 1}`}
                                    className="h-9 flex-1"
                                />
                                {q.options.length > 2 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeOption(qi, oi)}
                                        className="h-7 px-1.5 text-muted-foreground"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                            </div>
                        ))}
                        {q.options.length < 6 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => addOption(qi)}
                                className="text-xs"
                            >
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                Add Option
                            </Button>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium">
                            Explanation (shown after answer)
                        </label>
                        <Input
                            value={q.explanation}
                            onChange={(e) =>
                                updateQuestion(qi, { explanation: e.target.value })
                            }
                            placeholder="Why is this the correct answer?"
                            className="h-9"
                        />
                    </div>
                </div>
            ))}

            <Button variant="outline" size="sm" onClick={addQuestion}>
                <Plus className="h-4 w-4 mr-1" />
                Add Question
            </Button>
        </div>
    );
}

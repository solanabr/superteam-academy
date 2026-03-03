/**
 * Quiz section — interactive quiz with pass/fail.
 */
'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import type { Quiz } from '@/context/types/course';

interface QuizSectionProps {
    quiz: Quiz;
    onPass: () => void;
    disabled?: boolean;
}

export function QuizSection({ quiz, onPass, disabled = false }: QuizSectionProps) {
    const t = useTranslations('lesson');
    const tc = useTranslations('common');
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);

    const handleSelect = useCallback((questionId: string, optionIndex: number) => {
        if (submitted || disabled) return;
        setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
    }, [submitted, disabled]);

    const handleSubmit = () => {
        let correct = 0;
        for (const q of quiz.questions) {
            if (answers[q.id] === q.correctIndex) {
                correct++;
            }
        }
        const pct = Math.round((correct / quiz.questions.length) * 100);
        setScore(pct);
        setSubmitted(true);

        if (pct >= quiz.passThreshold) {
            onPass();
        }
    };

    const handleRetry = () => {
        // Preserve correct answers so students only need to fix wrong ones
        const preserved: Record<string, number> = {};
        for (const q of quiz.questions) {
            if (answers[q.id] === q.correctIndex) {
                preserved[q.id] = answers[q.id];
            }
        }
        setAnswers(preserved);
        setSubmitted(false);
        setScore(0);
    };

    const passed = submitted && score >= quiz.passThreshold;
    const failed = submitted && score < quiz.passThreshold;
    const allAnswered = quiz.questions.every(q => answers[q.id] !== undefined);

    return (
        <div className="quiz-section">
            <h3 className="quiz-title">{t('quizTitle')}</h3>

            <div className="questions">
                {quiz.questions.map((q, qi) => {
                    const selectedIdx = answers[q.id];
                    const isCorrect = submitted && selectedIdx === q.correctIndex;
                    const isWrong = submitted && selectedIdx !== undefined && selectedIdx !== q.correctIndex;

                    return (
                        <div key={q.id} className="question-block">
                            <p className="question-text">
                                {qi + 1}. {q.question}
                            </p>
                            <div className="options">
                                {q.options.map((opt, oi) => {
                                    let optionClass = 'option';
                                    if (submitted) {
                                        if (oi === q.correctIndex) optionClass += ' option-correct';
                                        else if (oi === selectedIdx && isWrong) optionClass += ' option-wrong';
                                    } else if (oi === selectedIdx) {
                                        optionClass += ' option-selected';
                                    }

                                    return (
                                        <button
                                            key={oi}
                                            className={optionClass}
                                            onClick={() => handleSelect(q.id, oi)}
                                            disabled={submitted || disabled}
                                            type="button"
                                        >
                                            <span className="option-letter">
                                                {String.fromCharCode(65 + oi)}
                                            </span>
                                            <span className="option-text">{opt}</span>
                                            {submitted && oi === q.correctIndex && <span className="option-mark">✓</span>}
                                            {submitted && oi === selectedIdx && isWrong && <span className="option-mark">✗</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {!submitted ? (
                <button
                    className="quiz-submit"
                    onClick={handleSubmit}
                    disabled={!allAnswered || disabled}
                    type="button"
                >
                    {t('submitAnswers')}
                </button>
            ) : (
                <div className={`quiz-result ${passed ? 'result-pass' : 'result-fail'}`}>
                    <div className="result-text">
                        {passed ? t('quizPassed', { score, threshold: quiz.passThreshold }) : t('quizFailed', { score, threshold: quiz.passThreshold })}
                    </div>
                    {failed && (
                        <button className="quiz-retry" onClick={handleRetry} type="button">
                            {tc('retry')}
                        </button>
                    )}
                </div>
            )}

            <style jsx>{`
                .quiz-section {
                    margin-top: 32px;
                    padding: 24px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                }
                .quiz-title {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: rgba(255, 255, 255, 0.9);
                    margin: 0 0 20px;
                }
                .questions {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }
                .question-text {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.85);
                    margin: 0 0 12px;
                    line-height: 1.5;
                }
                .options {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .option {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 14px;
                    border-radius: 10px;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    cursor: pointer;
                    transition: all 0.15s;
                    text-align: left;
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 0.85rem;
                    width: 100%;
                }
                .option:hover:not(:disabled) {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: rgba(255, 255, 255, 0.12);
                }
                .option-selected {
                    border-color: rgba(153, 69, 255, 0.5);
                    background: rgba(153, 69, 255, 0.08);
                }
                .option-correct {
                    border-color: rgba(20, 241, 149, 0.5) !important;
                    background: rgba(20, 241, 149, 0.08) !important;
                    color: #14F195;
                }
                .option-wrong {
                    border-color: rgba(255, 107, 107, 0.5) !important;
                    background: rgba(255, 107, 107, 0.08) !important;
                    color: #ff6b6b;
                }
                .option-letter {
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 6px;
                    background: rgba(255, 255, 255, 0.06);
                    font-size: 0.72rem;
                    font-weight: 700;
                    flex-shrink: 0;
                }
                .option-text {
                    flex: 1;
                }
                .option-mark {
                    font-weight: 700;
                    font-size: 0.85rem;
                }
                .quiz-submit {
                    margin-top: 20px;
                    width: 100%;
                    padding: 12px;
                    border: none;
                    border-radius: 10px;
                    background: linear-gradient(135deg, #9945FF, #14F195);
                    color: white;
                    font-size: 0.9rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: opacity 0.2s;
                }
                .quiz-submit:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }
                .quiz-result {
                    margin-top: 20px;
                    padding: 16px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .result-pass {
                    background: rgba(20, 241, 149, 0.08);
                    border: 1px solid rgba(20, 241, 149, 0.2);
                }
                .result-fail {
                    background: rgba(255, 107, 107, 0.08);
                    border: 1px solid rgba(255, 107, 107, 0.2);
                }
                .result-text {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.85);
                }
                .quiz-retry {
                    padding: 8px 16px;
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 8px;
                    background: transparent;
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s;
                }
                .quiz-retry:hover {
                    background: rgba(255, 255, 255, 0.05);
                }
            `}</style>
        </div>
    );
}

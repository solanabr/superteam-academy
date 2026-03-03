"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, RotateCcw, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { formatTimestamp } from "@/lib/utils";

interface QuizQuestion {
	id: string;
	question: string;
	options: string[];
	correctAnswer: number;
	explanation?: string;
}

interface LessonQuizProps {
	quiz: {
		id: string;
		title: string;
		questions: QuizQuestion[];
		passingScore: number; // percentage
		timeLimit?: number; // in minutes
	};
	onComplete?: (score: number, passed: boolean) => void;
	onRetry?: () => void;
}

export function LessonQuiz({ quiz, onComplete, onRetry }: LessonQuizProps) {
	const t = useTranslations("lessonQuiz");
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [answers, setAnswers] = useState<Record<string, number>>({});
	const [showResults, setShowResults] = useState(false);
	const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
	const [quizCompleted, setQuizCompleted] = useState(false);
	const validQuestions = quiz.questions.filter(
		(question) =>
			Boolean(question?.id) &&
			Boolean(question?.question) &&
			Array.isArray(question?.options) &&
			question.options.length > 0
	);
	const hasQuestions = validQuestions.length > 0;

	const handleSubmitQuiz = useCallback(() => {
		if (!hasQuestions) return;
		setShowResults(true);
		setQuizCompleted(true);

		const correctAnswers = validQuestions.filter(
			(q) => answers[q.id] === q.correctAnswer
		).length;
		const score = (correctAnswers / validQuestions.length) * 100;
		const passed = score >= quiz.passingScore;

		onComplete?.(score, passed);
	}, [validQuestions, hasQuestions, quiz.passingScore, answers, onComplete]);

	useEffect(() => {
		if (quiz.timeLimit && !showResults && !quizCompleted) {
			setTimeRemaining(quiz.timeLimit * 60); // convert to seconds
		}
	}, [quiz.timeLimit, showResults, quizCompleted]);

	useEffect(() => {
		if (timeRemaining === null || timeRemaining <= 0) return;

		const timer = setInterval(() => {
			setTimeRemaining((prev) => {
				if (prev === null || prev <= 1) {
					handleSubmitQuiz();
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [timeRemaining, handleSubmitQuiz]);

	const currentQuestion = validQuestions[currentQuestionIndex];
	const progress = hasQuestions ? ((currentQuestionIndex + 1) / validQuestions.length) * 100 : 0;

	const handleAnswerSelect = (questionId: string, answerIndex: number) => {
		setAnswers((prev) => ({
			...prev,
			[questionId]: answerIndex,
		}));
	};

	const handleNext = () => {
		if (currentQuestionIndex < validQuestions.length - 1) {
			setCurrentQuestionIndex((prev) => prev + 1);
		} else {
			handleSubmitQuiz();
		}
	};

	const handlePrevious = () => {
		if (currentQuestionIndex > 0) {
			setCurrentQuestionIndex((prev) => prev - 1);
		}
	};

	const handleRetry = () => {
		setCurrentQuestionIndex(0);
		setAnswers({});
		setShowResults(false);
		setQuizCompleted(false);
		setTimeRemaining(quiz.timeLimit ? quiz.timeLimit * 60 : null);
		onRetry?.();
	};

	const calculateScore = () => {
		if (!hasQuestions) return 0;

		const correctAnswers = validQuestions.filter(
			(q) => answers[q.id] === q.correctAnswer
		).length;
		return (correctAnswers / validQuestions.length) * 100;
	};

	if (showResults) {
		const score = calculateScore();
		const passed = score >= quiz.passingScore;
		const correctAnswers = validQuestions.filter(
			(q) => answers[q.id] === q.correctAnswer
		).length;

		return (
			<div className="space-y-6">
				<Card>
					<CardHeader className="text-center">
						<div className="mx-auto mb-4">
							{passed ? (
								<Trophy className="h-16 w-16 text-yellow-500" />
							) : (
								<XCircle className="h-16 w-16 text-red-500" />
							)}
						</div>
						<CardTitle className="text-2xl">
							{passed ? t("results.congratulations") : t("results.tryAgain")}
						</CardTitle>
					</CardHeader>
					<CardContent className="text-center space-y-4">
						<div>
							<div className="text-3xl font-bold mb-2">{score.toFixed(1)}%</div>
							<p className="text-muted-foreground">
								{t("results.correctCount", {
									correct: correctAnswers,
									total: validQuestions.length,
								})}
							</p>
						</div>

						<Badge variant={passed ? "default" : "destructive"} className="text-sm">
							{passed ? t("results.passed") : t("results.failed")} (
							{t("results.required", {
								score: quiz.passingScore,
							})}
							)
						</Badge>

						<Button onClick={handleRetry} className="w-full">
							<RotateCcw className="h-4 w-4 mr-2" />
							{t("results.tryAgain")}
						</Button>
					</CardContent>
				</Card>

				<div className="space-y-4">
					<h3 className="text-lg font-semibold">{t("results.reviewAnswers")}</h3>
					{validQuestions.map((question, index) => {
						const userAnswer = answers[question.id];
						const isCorrect = userAnswer === question.correctAnswer;

						return (
							<Card key={question.id}>
								<CardHeader className="pb-3">
									<CardTitle className="text-sm flex items-center gap-2">
										{isCorrect ? (
											<CheckCircle className="h-4 w-4 text-green-500" />
										) : (
											<XCircle className="h-4 w-4 text-red-500" />
										)}
										{t("results.question", { number: index + 1 })}
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3">
									<p className="font-medium">{question.question}</p>

									<div className="space-y-2">
										{question.options.map((option, optionIndex) => {
											const isUserAnswer = userAnswer === optionIndex;
											const isCorrectAnswer =
												question.correctAnswer === optionIndex;

											return (
												<div
													key={optionIndex}
													className={`p-3 rounded-lg border ${
														isCorrectAnswer
															? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
															: isUserAnswer && !isCorrect
																? "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
																: "bg-muted/50"
													}`}
												>
													<div className="flex items-center gap-2">
														<div
															className={`w-4 h-4 rounded-full border-2 ${
																isCorrectAnswer
																	? "bg-green-500 border-green-500"
																	: isUserAnswer && !isCorrect
																		? "bg-red-500 border-red-500"
																		: "border-muted-foreground"
															}`}
														/>
														<span
															className={
																isCorrectAnswer
																	? "font-medium text-green-700 dark:text-green-300"
																	: ""
															}
														>
															{option}
														</span>
													</div>
												</div>
											);
										})}
									</div>

									{question.explanation && (
										<div className="bg-blue-50 border border-blue-200 rounded-lg p-3 dark:bg-blue-950 dark:border-blue-800">
											<p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
												{t("results.explanation")}
											</p>
											<p className="text-sm text-blue-700 dark:text-blue-300">
												{question.explanation}
											</p>
										</div>
									)}
								</CardContent>
							</Card>
						);
					})}
				</div>
			</div>
		);
	}

	if (!hasQuestions || !currentQuestion) {
		return (
			<div className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>{quiz.title}</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">{t("notAvailable")}</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>{quiz.title}</CardTitle>
						{timeRemaining !== null && (
							<Badge variant={timeRemaining < 300 ? "destructive" : "secondary"}>
								{formatTimestamp(timeRemaining)}
							</Badge>
						)}
					</div>
					<div className="space-y-2">
						<div className="flex justify-between text-sm">
							<span>
								{t("progress.questionOf", {
									current: currentQuestionIndex + 1,
									total: validQuestions.length,
								})}
							</span>
							<span>{t("progress.complete", { percent: Math.round(progress) })}</span>
						</div>
						<Progress value={progress} className="h-2" />
					</div>
				</CardHeader>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
				</CardHeader>
				<CardContent>
					<RadioGroup
						value={answers[currentQuestion.id]?.toString()}
						onValueChange={(value) =>
							handleAnswerSelect(currentQuestion.id, parseInt(value, 10))
						}
					>
						<div className="space-y-3">
							{currentQuestion.options.map((option, index) => (
								<div key={index} className="flex items-center space-x-2">
									<RadioGroupItem
										value={index.toString()}
										id={`option-${index}`}
									/>
									<Label
										htmlFor={`option-${index}`}
										className="flex-1 cursor-pointer p-3 rounded-lg border hover:bg-muted/50 transition-colors"
									>
										{option}
									</Label>
								</div>
							))}
						</div>
					</RadioGroup>
				</CardContent>
			</Card>

			<div className="flex gap-2">
				<Button
					onClick={handlePrevious}
					disabled={currentQuestionIndex === 0}
					variant="outline"
					className="flex-1"
				>
					{t("actions.previous")}
				</Button>
				<Button
					onClick={handleNext}
					disabled={answers[currentQuestion.id] === undefined}
					className="flex-1"
				>
					{currentQuestionIndex === validQuestions.length - 1
						? t("actions.submitQuiz")
						: t("actions.next")}
				</Button>
			</div>
		</div>
	);
}

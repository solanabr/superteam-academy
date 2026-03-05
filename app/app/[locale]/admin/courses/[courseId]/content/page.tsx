"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Link } from "@superteam-academy/i18n/navigation";
import {
	ArrowLeft,
	Loader2,
	Plus,
	Save,
	Trash2,
	Code2,
	CircleHelp,
	ListChecks,
	Video,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { generateId } from "@/lib/utils";

type LessonRef = {
	_id: string;
	title: string;
	slug?: { current: string };
	moduleTitle: string;
};

type CourseData = {
	_id: string;
	title: string;
	modules?: Array<{
		_id: string;
		title: string;
		lessons?: Array<{
			_id: string;
			title: string;
			slug?: { current: string };
		}>;
	}>;
};

type ChallengeInstruction = { title: string; content: string };
type ChallengeTest = { id: string; description: string; type: "unit" | "integration" };
type ChallengeHint = { content: string; cost: number };

type ChallengeDraft = {
	title: string;
	description: string;
	difficulty: "beginner" | "intermediate" | "advanced";
	estimatedTime: string;
	xpReward: number;
	language: string;
	starterCode: string;
	instructions: ChallengeInstruction[];
	objectives: string[];
	tests: ChallengeTest[];
	hints: ChallengeHint[];
	published: boolean;
};

type QuizOption = { id: string; text: string };
type QuizQuestion = {
	id: string;
	prompt: string;
	options: QuizOption[];
	correctOptionId: string;
	explanation?: string;
};

type QuizDraft = {
	title: string;
	passingScore: number;
	questions: QuizQuestion[];
	published: boolean;
};

type LessonContentResponse = {
	content: {
		challenge: (ChallengeDraft & { _id: string }) | null;
		quiz: (QuizDraft & { _id: string }) | null;
		videoUrl: string;
	};
};

function defaultChallenge(lessonTitle: string): ChallengeDraft {
	return {
		title: `${lessonTitle} Challenge`,
		description: "",
		difficulty: "beginner",
		estimatedTime: "30 min",
		xpReward: 100,
		language: "rust",
		starterCode: "// Write your solution here\n",
		instructions: [],
		objectives: [],
		tests: [],
		hints: [],
		published: false,
	};
}

function defaultQuiz(lessonTitle: string): QuizDraft {
	return {
		title: `${lessonTitle} Quiz`,
		passingScore: 70,
		questions: [],
		published: false,
	};
}

export default function CourseLessonContentPage() {
	const params = useParams();
	const courseId = params.courseId as string;

	const [course, setCourse] = useState<CourseData | null>(null);
	const [loadingCourse, setLoadingCourse] = useState(true);
	const [selectedLessonId, setSelectedLessonId] = useState<string>("");
	const [loadingContent, setLoadingContent] = useState(false);
	const [saving, setSaving] = useState(false);

	const [challengeEnabled, setChallengeEnabled] = useState(false);
	const [challenge, setChallenge] = useState<ChallengeDraft>(defaultChallenge("Lesson"));
	const [quizEnabled, setQuizEnabled] = useState(false);
	const [quiz, setQuiz] = useState<QuizDraft>(defaultQuiz("Lesson"));
	const [videoUrl, setVideoUrl] = useState("");
	const [error, setError] = useState<string>("");

	const lessons = useMemo<LessonRef[]>(() => {
		if (!course?.modules) return [];
		return course.modules.flatMap((module) =>
			(module.lessons ?? []).map((lesson) => ({
				...lesson,
				moduleTitle: module.title,
			}))
		);
	}, [course]);

	const selectedLesson = useMemo(
		() => lessons.find((lesson) => lesson._id === selectedLessonId) ?? null,
		[lessons, selectedLessonId]
	);

	const fetchCourse = useCallback(async () => {
		setLoadingCourse(true);
		try {
			const res = await fetch(`/api/admin/courses/${courseId}`);
			if (!res.ok) {
				setError("Failed to load course");
				return;
			}
			const data = (await res.json()) as { course: CourseData };
			setCourse(data.course);
			const firstLesson =
				data.course.modules?.flatMap((module) => module.lessons ?? [])[0]?._id ?? "";
			setSelectedLessonId(firstLesson);
		} finally {
			setLoadingCourse(false);
		}
	}, [courseId]);

	const fetchLessonContent = useCallback(
		async (lessonId: string, lessonTitle: string) => {
			if (!lessonId) return;
			setLoadingContent(true);
			setError("");
			try {
				const res = await fetch(
					`/api/admin/courses/${courseId}/lessons/${lessonId}/content`
				);
				if (!res.ok) {
					setChallengeEnabled(false);
					setChallenge(defaultChallenge(lessonTitle));
					setQuizEnabled(false);
					setQuiz(defaultQuiz(lessonTitle));
					setVideoUrl("");
					return;
				}
				const data = (await res.json()) as LessonContentResponse;
				setChallengeEnabled(Boolean(data.content.challenge));
				setChallenge(data.content.challenge ?? defaultChallenge(lessonTitle));
				setQuizEnabled(Boolean(data.content.quiz));
				setQuiz(data.content.quiz ?? defaultQuiz(lessonTitle));
				setVideoUrl(data.content.videoUrl ?? "");
			} finally {
				setLoadingContent(false);
			}
		},
		[courseId]
	);

	useEffect(() => {
		fetchCourse();
	}, [fetchCourse]);

	useEffect(() => {
		if (!selectedLesson) return;
		fetchLessonContent(selectedLesson._id, selectedLesson.title);
	}, [fetchLessonContent, selectedLesson]);

	const saveContent = async () => {
		if (!selectedLesson) return;
		setSaving(true);
		setError("");
		try {
			const res = await fetch(
				`/api/admin/courses/${courseId}/lessons/${selectedLesson._id}/content`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						challenge: challengeEnabled ? challenge : null,
						quiz: quizEnabled ? quiz : null,
						videoUrl,
					}),
				}
			);
			if (!res.ok) {
				const data = (await res.json()) as { error?: string };
				setError(data.error ?? "Failed to save content");
			}
		} finally {
			setSaving(false);
		}
	};

	if (loadingCourse) {
		return (
			<div className="p-6 space-y-4">
				<div className="h-8 w-80 bg-muted animate-pulse rounded-lg" />
				<div className="h-24 bg-muted animate-pulse rounded-lg" />
				<div className="h-80 bg-muted animate-pulse rounded-lg" />
			</div>
		);
	}

	return (
		<div className="p-6 space-y-6 max-w-6xl">
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="icon" asChild>
					<Link href={`/admin/courses/${courseId}`}>
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div className="flex-1">
					<h1 className="text-3xl font-bold">Lesson Content Builder</h1>
					<p className="text-muted-foreground">
						{course?.title ?? "Course"} · Challenges and quizzes
					</p>
				</div>
				<Button onClick={saveContent} disabled={saving || !selectedLesson}>
					{saving ? (
						<Loader2 className="h-4 w-4 mr-2 animate-spin" />
					) : (
						<Save className="h-4 w-4 mr-2" />
					)}
					Save Content
				</Button>
			</div>

			{error && (
				<Card className="border-destructive">
					<CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader>
					<CardTitle>Select Lesson</CardTitle>
				</CardHeader>
				<CardContent>
					<Select value={selectedLessonId} onValueChange={setSelectedLessonId}>
						<SelectTrigger>
							<SelectValue placeholder="Choose a lesson" />
						</SelectTrigger>
						<SelectContent>
							{lessons.map((lesson) => (
								<SelectItem key={lesson._id} value={lesson._id}>
									{lesson.moduleTitle} · {lesson.title}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</CardContent>
			</Card>

			{selectedLesson &&
				(loadingContent ? (
					<div className="h-72 bg-muted animate-pulse rounded-xl" />
				) : (
					<>
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Video className="h-5 w-5" /> Video
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2">
								<Label htmlFor="videoUrl">YouTube / Video URL</Label>
								<Input
									id="videoUrl"
									placeholder="https://www.youtube.com/watch?v=..."
									value={videoUrl}
									onChange={(e) => setVideoUrl(e.target.value)}
								/>
								<p className="text-xs text-muted-foreground">
									Supports YouTube, Vimeo, or direct .mp4 links
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Code2 className="h-5 w-5" /> Challenge
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center gap-3">
									<Switch
										checked={challengeEnabled}
										onCheckedChange={setChallengeEnabled}
									/>
									<Label>Enable challenge for this lesson</Label>
									{challengeEnabled && (
										<Badge
											variant={challenge.published ? "default" : "secondary"}
										>
											{challenge.published ? "Published" : "Draft"}
										</Badge>
									)}
								</div>

								{challengeEnabled && (
									<div className="space-y-5">
										<div className="grid md:grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label>Title</Label>
												<Input
													value={challenge.title}
													onChange={(e) =>
														setChallenge((prev) => ({
															...prev,
															title: e.target.value,
														}))
													}
												/>
											</div>
											<div className="space-y-2">
												<Label>Language</Label>
												<Input
													value={challenge.language}
													onChange={(e) =>
														setChallenge((prev) => ({
															...prev,
															language: e.target.value,
														}))
													}
												/>
											</div>
										</div>

										<div className="grid md:grid-cols-4 gap-4">
											<div className="space-y-2 md:col-span-1">
												<Label>Difficulty</Label>
												<Select
													value={challenge.difficulty}
													onValueChange={(value) =>
														setChallenge((prev) => ({
															...prev,
															difficulty:
																value as ChallengeDraft["difficulty"],
														}))
													}
												>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="beginner">
															Beginner
														</SelectItem>
														<SelectItem value="intermediate">
															Intermediate
														</SelectItem>
														<SelectItem value="advanced">
															Advanced
														</SelectItem>
													</SelectContent>
												</Select>
											</div>
											<div className="space-y-2">
												<Label>Estimated Time</Label>
												<Input
													value={challenge.estimatedTime}
													onChange={(e) =>
														setChallenge((prev) => ({
															...prev,
															estimatedTime: e.target.value,
														}))
													}
												/>
											</div>
											<div className="space-y-2">
												<Label>XP Reward</Label>
												<Input
													type="number"
													value={challenge.xpReward}
													onChange={(e) =>
														setChallenge((prev) => ({
															...prev,
															xpReward: Number(e.target.value),
														}))
													}
												/>
											</div>
											<div className="space-y-2 flex items-end">
												<div className="flex items-center gap-2 pb-2">
													<Switch
														checked={challenge.published}
														onCheckedChange={(checked) =>
															setChallenge((prev) => ({
																...prev,
																published: checked,
															}))
														}
													/>
													<Label>Published</Label>
												</div>
											</div>
										</div>

										<div className="space-y-2">
											<Label>Description</Label>
											<Textarea
												rows={3}
												value={challenge.description}
												onChange={(e) =>
													setChallenge((prev) => ({
														...prev,
														description: e.target.value,
													}))
												}
											/>
										</div>

										<div className="space-y-2">
											<Label>Starter Code</Label>
											<Textarea
												rows={8}
												className="font-mono"
												value={challenge.starterCode}
												onChange={(e) =>
													setChallenge((prev) => ({
														...prev,
														starterCode: e.target.value,
													}))
												}
											/>
										</div>

										<Separator />

										<div className="space-y-3">
											<div className="flex items-center justify-between">
												<Label>Instructions</Label>
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														setChallenge((prev) => ({
															...prev,
															instructions: [
																...prev.instructions,
																{ title: "", content: "" },
															],
														}))
													}
												>
													<Plus className="h-3 w-3 mr-1" /> Add
												</Button>
											</div>
											{challenge.instructions.map((instruction, index) => (
												<div
													key={index}
													className="grid md:grid-cols-2 gap-3"
												>
													<Input
														placeholder="Title"
														value={instruction.title}
														onChange={(e) =>
															setChallenge((prev) => ({
																...prev,
																instructions: prev.instructions.map(
																	(item, i) =>
																		i === index
																			? {
																					...item,
																					title: e.target
																						.value,
																				}
																			: item
																),
															}))
														}
													/>
													<div className="flex gap-2">
														<Input
															placeholder="Content"
															value={instruction.content}
															onChange={(e) =>
																setChallenge((prev) => ({
																	...prev,
																	instructions:
																		prev.instructions.map(
																			(item, i) =>
																				i === index
																					? {
																							...item,
																							content:
																								e
																									.target
																									.value,
																						}
																					: item
																		),
																}))
															}
														/>
														<Button
															variant="ghost"
															size="icon"
															onClick={() =>
																setChallenge((prev) => ({
																	...prev,
																	instructions:
																		prev.instructions.filter(
																			(_, i) => i !== index
																		),
																}))
															}
														>
															<Trash2 className="h-4 w-4 text-destructive" />
														</Button>
													</div>
												</div>
											))}
										</div>

										<div className="space-y-3">
											<div className="flex items-center justify-between">
												<Label>Objectives</Label>
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														setChallenge((prev) => ({
															...prev,
															objectives: [...prev.objectives, ""],
														}))
													}
												>
													<Plus className="h-3 w-3 mr-1" /> Add
												</Button>
											</div>
											{challenge.objectives.map((objective, index) => (
												<div key={index} className="flex gap-2">
													<Input
														value={objective}
														onChange={(e) =>
															setChallenge((prev) => ({
																...prev,
																objectives: prev.objectives.map(
																	(item, i) =>
																		i === index
																			? e.target.value
																			: item
																),
															}))
														}
													/>
													<Button
														variant="ghost"
														size="icon"
														onClick={() =>
															setChallenge((prev) => ({
																...prev,
																objectives: prev.objectives.filter(
																	(_, i) => i !== index
																),
															}))
														}
													>
														<Trash2 className="h-4 w-4 text-destructive" />
													</Button>
												</div>
											))}
										</div>

										<div className="space-y-3">
											<div className="flex items-center justify-between">
												<Label>Tests</Label>
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														setChallenge((prev) => ({
															...prev,
															tests: [
																...prev.tests,
																{
																	id: generateId("test"),
																	description: "",
																	type: "unit",
																},
															],
														}))
													}
												>
													<Plus className="h-3 w-3 mr-1" /> Add
												</Button>
											</div>
											{challenge.tests.map((test, index) => (
												<div
													key={test.id}
													className="grid md:grid-cols-4 gap-2"
												>
													<Input
														value={test.id}
														onChange={(e) =>
															setChallenge((prev) => ({
																...prev,
																tests: prev.tests.map((item, i) =>
																	i === index
																		? {
																				...item,
																				id: e.target.value,
																			}
																		: item
																),
															}))
														}
													/>
													<Input
														className="md:col-span-2"
														placeholder="Description"
														value={test.description}
														onChange={(e) =>
															setChallenge((prev) => ({
																...prev,
																tests: prev.tests.map((item, i) =>
																	i === index
																		? {
																				...item,
																				description:
																					e.target.value,
																			}
																		: item
																),
															}))
														}
													/>
													<div className="flex gap-2">
														<Select
															value={test.type}
															onValueChange={(value) =>
																setChallenge((prev) => ({
																	...prev,
																	tests: prev.tests.map(
																		(item, i) =>
																			i === index
																				? {
																						...item,
																						type: value as ChallengeTest["type"],
																					}
																				: item
																	),
																}))
															}
														>
															<SelectTrigger className="w-28">
																<SelectValue />
															</SelectTrigger>
															<SelectContent>
																<SelectItem value="unit">
																	unit
																</SelectItem>
																<SelectItem value="integration">
																	integration
																</SelectItem>
															</SelectContent>
														</Select>
														<Button
															variant="ghost"
															size="icon"
															onClick={() =>
																setChallenge((prev) => ({
																	...prev,
																	tests: prev.tests.filter(
																		(_, i) => i !== index
																	),
																}))
															}
														>
															<Trash2 className="h-4 w-4 text-destructive" />
														</Button>
													</div>
												</div>
											))}
										</div>

										<div className="space-y-3">
											<div className="flex items-center justify-between">
												<Label>Hints</Label>
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														setChallenge((prev) => ({
															...prev,
															hints: [
																...prev.hints,
																{ content: "", cost: 5 },
															],
														}))
													}
												>
													<Plus className="h-3 w-3 mr-1" /> Add
												</Button>
											</div>
											{challenge.hints.map((hint, index) => (
												<div
													key={index}
													className="grid md:grid-cols-4 gap-2"
												>
													<Input
														className="md:col-span-3"
														value={hint.content}
														onChange={(e) =>
															setChallenge((prev) => ({
																...prev,
																hints: prev.hints.map((item, i) =>
																	i === index
																		? {
																				...item,
																				content:
																					e.target.value,
																			}
																		: item
																),
															}))
														}
													/>
													<div className="flex gap-2">
														<Input
															type="number"
															value={hint.cost}
															onChange={(e) =>
																setChallenge((prev) => ({
																	...prev,
																	hints: prev.hints.map(
																		(item, i) =>
																			i === index
																				? {
																						...item,
																						cost: Number(
																							e.target
																								.value
																						),
																					}
																				: item
																	),
																}))
															}
														/>
														<Button
															variant="ghost"
															size="icon"
															onClick={() =>
																setChallenge((prev) => ({
																	...prev,
																	hints: prev.hints.filter(
																		(_, i) => i !== index
																	),
																}))
															}
														>
															<Trash2 className="h-4 w-4 text-destructive" />
														</Button>
													</div>
												</div>
											))}
										</div>
									</div>
								)}
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<CircleHelp className="h-5 w-5" /> Quiz
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center gap-3">
									<Switch
										checked={quizEnabled}
										onCheckedChange={setQuizEnabled}
									/>
									<Label>Enable quiz for this lesson</Label>
									{quizEnabled && (
										<Badge variant={quiz.published ? "default" : "secondary"}>
											{quiz.published ? "Published" : "Draft"}
										</Badge>
									)}
								</div>

								{quizEnabled && (
									<div className="space-y-5">
										<div className="grid md:grid-cols-3 gap-4">
											<div className="space-y-2 md:col-span-2">
												<Label>Title</Label>
												<Input
													value={quiz.title}
													onChange={(e) =>
														setQuiz((prev) => ({
															...prev,
															title: e.target.value,
														}))
													}
												/>
											</div>
											<div className="space-y-2">
												<Label>Passing Score</Label>
												<Input
													type="number"
													value={quiz.passingScore}
													onChange={(e) =>
														setQuiz((prev) => ({
															...prev,
															passingScore: Number(e.target.value),
														}))
													}
												/>
											</div>
										</div>

										<div className="flex items-center gap-2">
											<Switch
												checked={quiz.published}
												onCheckedChange={(checked) =>
													setQuiz((prev) => ({
														...prev,
														published: checked,
													}))
												}
											/>
											<Label>Published</Label>
										</div>

										<Separator />

										<div className="space-y-3">
											<div className="flex items-center justify-between">
												<Label className="flex items-center gap-2">
													<ListChecks className="h-4 w-4" /> Questions
												</Label>
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														setQuiz((prev) => ({
															...prev,
															questions: [
																...prev.questions,
																{
																	id: generateId("q"),
																	prompt: "",
																	options: [
																		{ id: "a", text: "" },
																		{ id: "b", text: "" },
																	],
																	correctOptionId: "a",
																},
															],
														}))
													}
												>
													<Plus className="h-3 w-3 mr-1" /> Add Question
												</Button>
											</div>
											{quiz.questions.map((question, qIndex) => (
												<Card key={question.id} className="border-dashed">
													<CardContent className="pt-6 space-y-3">
														<div className="flex items-center gap-2">
															<Badge variant="outline">
																Q{qIndex + 1}
															</Badge>
															<Input
																className="flex-1"
																placeholder="Prompt"
																value={question.prompt}
																onChange={(e) =>
																	setQuiz((prev) => ({
																		...prev,
																		questions:
																			prev.questions.map(
																				(item, i) =>
																					i === qIndex
																						? {
																								...item,
																								prompt: e
																									.target
																									.value,
																							}
																						: item
																			),
																	}))
																}
															/>
															<Button
																variant="ghost"
																size="icon"
																onClick={() =>
																	setQuiz((prev) => ({
																		...prev,
																		questions:
																			prev.questions.filter(
																				(_, i) =>
																					i !== qIndex
																			),
																	}))
																}
															>
																<Trash2 className="h-4 w-4 text-destructive" />
															</Button>
														</div>

														{question.options.map((option, oIndex) => (
															<div
																key={option.id}
																className="grid grid-cols-12 gap-2"
															>
																<Input
																	className="col-span-2"
																	value={option.id}
																	onChange={(e) =>
																		setQuiz((prev) => ({
																			...prev,
																			questions:
																				prev.questions.map(
																					(item, i) => {
																						if (
																							i !==
																							qIndex
																						)
																							return item;
																						const options =
																							item.options.map(
																								(
																									opt,
																									oi
																								) =>
																									oi ===
																									oIndex
																										? {
																												...opt,
																												id: e
																													.target
																													.value,
																											}
																										: opt
																							);
																						const correctOptionId =
																							item.correctOptionId ===
																							option.id
																								? e
																										.target
																										.value
																								: item.correctOptionId;
																						return {
																							...item,
																							options,
																							correctOptionId,
																						};
																					}
																				),
																		}))
																	}
																/>
																<Input
																	className="col-span-8"
																	placeholder="Option text"
																	value={option.text}
																	onChange={(e) =>
																		setQuiz((prev) => ({
																			...prev,
																			questions:
																				prev.questions.map(
																					(item, i) =>
																						i === qIndex
																							? {
																									...item,
																									options:
																										item.options.map(
																											(
																												opt,
																												oi
																											) =>
																												oi ===
																												oIndex
																													? {
																															...opt,
																															text: e
																																.target
																																.value,
																														}
																													: opt
																										),
																								}
																							: item
																				),
																		}))
																	}
																/>
																<Button
																	className="col-span-2"
																	variant="ghost"
																	size="icon"
																	onClick={() =>
																		setQuiz((prev) => ({
																			...prev,
																			questions:
																				prev.questions.map(
																					(item, i) =>
																						i === qIndex
																							? {
																									...item,
																									options:
																										item.options.filter(
																											(
																												_,
																												oi
																											) =>
																												oi !==
																												oIndex
																										),
																									correctOptionId:
																										item.correctOptionId ===
																										option.id
																											? (item.options.find(
																													(
																														_,
																														oi
																													) =>
																														oi !==
																														oIndex
																												)
																													?.id ??
																												"")
																											: item.correctOptionId,
																								}
																							: item
																				),
																		}))
																	}
																>
																	<Trash2 className="h-4 w-4 text-destructive" />
																</Button>
															</div>
														))}

														<div className="flex gap-2 items-center">
															<Button
																variant="outline"
																size="sm"
																onClick={() =>
																	setQuiz((prev) => ({
																		...prev,
																		questions:
																			prev.questions.map(
																				(item, i) =>
																					i === qIndex
																						? {
																								...item,
																								options:
																									[
																										...item.options,
																										{
																											id: generateId(
																												"o"
																											),
																											text: "",
																										},
																									],
																							}
																						: item
																			),
																	}))
																}
															>
																<Plus className="h-3 w-3 mr-1" />{" "}
																Add Option
															</Button>
															<Select
																value={question.correctOptionId}
																onValueChange={(value) =>
																	setQuiz((prev) => ({
																		...prev,
																		questions:
																			prev.questions.map(
																				(item, i) =>
																					i === qIndex
																						? {
																								...item,
																								correctOptionId:
																									value,
																							}
																						: item
																			),
																	}))
																}
															>
																<SelectTrigger className="w-56">
																	<SelectValue placeholder="Correct option" />
																</SelectTrigger>
																<SelectContent>
																	{question.options.map(
																		(option) => (
																			<SelectItem
																				key={option.id}
																				value={option.id}
																			>
																				{option.id}
																			</SelectItem>
																		)
																	)}
																</SelectContent>
															</Select>
														</div>

														<Textarea
															rows={2}
															placeholder="Explanation (optional)"
															value={question.explanation ?? ""}
															onChange={(e) =>
																setQuiz((prev) => ({
																	...prev,
																	questions: prev.questions.map(
																		(item, i) =>
																			i === qIndex
																				? {
																						...item,
																						explanation:
																							e.target
																								.value,
																					}
																				: item
																	),
																}))
															}
														/>
													</CardContent>
												</Card>
											))}
										</div>
									</div>
								)}
							</CardContent>
						</Card>
					</>
				))}
		</div>
	);
}

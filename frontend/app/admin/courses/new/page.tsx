"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, GripVertical, Loader2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface LessonDraft {
	id: string;
	title: string;
	xpReward: number;
	duration: string;
}

interface ModuleDraft {
	id: string;
	title: string;
	description: string;
	lessons: LessonDraft[];
}

function generateId() {
	return Math.random().toString(36).slice(2, 9);
}

export default function NewCoursePage() {
	const router = useRouter();
	const [saving, setSaving] = useState(false);

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [level, setLevel] = useState("beginner");
	const [duration, setDuration] = useState("");
	const [xpReward, setXpReward] = useState(100);
	const [track, setTrack] = useState("");
	const [published, setPublished] = useState(false);
	const [modules, setModules] = useState<ModuleDraft[]>([]);

	const addModule = () => {
		setModules((prev) => [
			...prev,
			{ id: generateId(), title: "", description: "", lessons: [] },
		]);
	};

	const removeModule = (moduleId: string) => {
		setModules((prev) => prev.filter((m) => m.id !== moduleId));
	};

	const updateModule = (moduleId: string, field: keyof ModuleDraft, value: string) => {
		setModules((prev) => prev.map((m) => (m.id === moduleId ? { ...m, [field]: value } : m)));
	};

	const addLesson = (moduleId: string) => {
		setModules((prev) =>
			prev.map((m) =>
				m.id === moduleId
					? {
							...m,
							lessons: [
								...m.lessons,
								{ id: generateId(), title: "", xpReward: 50, duration: "" },
							],
						}
					: m
			)
		);
	};

	const removeLesson = (moduleId: string, lessonId: string) => {
		setModules((prev) =>
			prev.map((m) =>
				m.id === moduleId
					? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) }
					: m
			)
		);
	};

	const updateLesson = (
		moduleId: string,
		lessonId: string,
		field: keyof LessonDraft,
		value: string | number
	) => {
		setModules((prev) =>
			prev.map((m) =>
				m.id === moduleId
					? {
							...m,
							lessons: m.lessons.map((l) =>
								l.id === lessonId ? { ...l, [field]: value } : l
							),
						}
					: m
			)
		);
	};

	const handleSubmit = async () => {
		if (!title.trim()) return;
		setSaving(true);

		const body = {
			title: title.trim(),
			description: description.trim(),
			level,
			duration: duration.trim(),
			xpReward,
			track: track.trim(),
			published,
			modules: modules
				.filter((m) => m.title.trim())
				.map((m, mi) => ({
					title: m.title.trim(),
					description: m.description.trim(),
					order: mi + 1,
					lessons: m.lessons
						.filter((l) => l.title.trim())
						.map((l, li) => ({
							title: l.title.trim(),
							order: li + 1,
							xpReward: l.xpReward,
							duration: l.duration.trim(),
						})),
				})),
		};

		const res = await fetch("/api/admin/courses", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});

		if (res.ok) {
			router.push("/admin/courses");
		}
		setSaving(false);
	};

	return (
		<div className="p-6 space-y-6 max-w-4xl">
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link href="/admin/courses">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div>
					<h1 className="text-3xl font-bold">Create Course</h1>
					<p className="text-muted-foreground">Add a new course to the platform</p>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Course Details</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="title">Title *</Label>
						<Input
							id="title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Introduction to Solana"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="A comprehensive introduction to building on Solana..."
							rows={3}
						/>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="space-y-2">
							<Label>Level</Label>
							<Select value={level} onValueChange={setLevel}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="beginner">Beginner</SelectItem>
									<SelectItem value="intermediate">Intermediate</SelectItem>
									<SelectItem value="advanced">Advanced</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="duration">Duration</Label>
							<Input
								id="duration"
								value={duration}
								onChange={(e) => setDuration(e.target.value)}
								placeholder="4 hours"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="xpReward">XP Reward</Label>
							<Input
								id="xpReward"
								type="number"
								value={xpReward}
								onChange={(e) => setXpReward(Number(e.target.value))}
								min={0}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="track">Track</Label>
						<Input
							id="track"
							value={track}
							onChange={(e) => setTrack(e.target.value)}
							placeholder="defi, nft, core..."
						/>
					</div>

					<div className="flex items-center gap-3">
						<Switch id="published" checked={published} onCheckedChange={setPublished} />
						<Label htmlFor="published">Publish immediately</Label>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0">
					<CardTitle>Modules & Lessons</CardTitle>
					<Button variant="outline" size="sm" onClick={addModule}>
						<Plus className="h-4 w-4 mr-2" />
						Add Module
					</Button>
				</CardHeader>
				<CardContent className="space-y-6">
					{modules.length === 0 && (
						<p className="text-sm text-muted-foreground text-center py-8">
							No modules yet. Click &quot;Add Module&quot; to start building your
							course structure.
						</p>
					)}

					{modules.map((mod, mi) => (
						<div key={mod.id} className="border rounded-lg p-4 space-y-4">
							<div className="flex items-center gap-3">
								<GripVertical className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm font-medium text-muted-foreground">
									Module {mi + 1}
								</span>
								<div className="flex-1" />
								<Button
									variant="ghost"
									size="icon"
									onClick={() => removeModule(mod.id)}
								>
									<Trash2 className="h-4 w-4 text-destructive" />
								</Button>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label>Module Title</Label>
									<Input
										value={mod.title}
										onChange={(e) =>
											updateModule(mod.id, "title", e.target.value)
										}
										placeholder="Getting Started"
									/>
								</div>
								<div className="space-y-2">
									<Label>Description</Label>
									<Input
										value={mod.description}
										onChange={(e) =>
											updateModule(mod.id, "description", e.target.value)
										}
										placeholder="Brief description..."
									/>
								</div>
							</div>

							<div className="pl-6 space-y-3">
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium">Lessons</span>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => addLesson(mod.id)}
									>
										<Plus className="h-3 w-3 mr-1" />
										Add Lesson
									</Button>
								</div>

								{mod.lessons.map((lesson, li) => (
									<div
										key={lesson.id}
										className="flex items-center gap-3 bg-muted/50 rounded-md p-3"
									>
										<span className="text-xs text-muted-foreground w-6">
											{li + 1}.
										</span>
										<Input
											className="flex-1"
											value={lesson.title}
											onChange={(e) =>
												updateLesson(
													mod.id,
													lesson.id,
													"title",
													e.target.value
												)
											}
											placeholder="Lesson title"
										/>
										<Input
											className="w-20"
											type="number"
											value={lesson.xpReward}
											onChange={(e) =>
												updateLesson(
													mod.id,
													lesson.id,
													"xpReward",
													Number(e.target.value)
												)
											}
											min={0}
											placeholder="XP"
										/>
										<Input
											className="w-24"
											value={lesson.duration}
											onChange={(e) =>
												updateLesson(
													mod.id,
													lesson.id,
													"duration",
													e.target.value
												)
											}
											placeholder="10 min"
										/>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => removeLesson(mod.id, lesson.id)}
										>
											<Trash2 className="h-3 w-3 text-destructive" />
										</Button>
									</div>
								))}
							</div>
						</div>
					))}
				</CardContent>
			</Card>

			<div className="flex items-center justify-end gap-3">
				<Button variant="outline" asChild>
					<Link href="/admin/courses">Cancel</Link>
				</Button>
				<Button onClick={handleSubmit} disabled={saving || !title.trim()}>
					{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
					Create Course
				</Button>
			</div>
		</div>
	);
}

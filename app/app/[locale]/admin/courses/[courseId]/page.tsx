"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, GripVertical, Loader2, Save, Code2 } from "lucide-react";
import { Link } from "@superteam-academy/i18n/navigation";
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
import { ImageUpload } from "@/components/ui/image-upload";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useTranslations } from "next-intl";

interface LessonData {
	_id?: string;
	title: string;
	slug?: { current: string };
	xpReward: number;
	duration?: string;
	order: number;
}

interface ModuleData {
	_id?: string;
	title: string;
	slug?: { current: string };
	description?: string;
	order: number;
	lessons?: LessonData[];
}

interface CourseData {
	_id: string;
	title: string;
	slug?: { current: string };
	description?: string;
	level: string;
	duration?: string;
	xpReward: number;
	track?: string;
	published: boolean;
	onchainStatus?: string;
	image?: { _type: "image"; asset: { _ref: string; _type: "reference" } };
	imageUrl?: string;
	overview?: string;
	learningObjectives?: string;
	requirements?: string;
	targetAudience?: string;
	modules?: ModuleData[];
}

export default function EditCoursePage() {
	const t = useTranslations("admin.editCourse");
	const router = useRouter();
	const params = useParams();
	const courseId = params.courseId as string;

	const [course, setCourse] = useState<CourseData | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [level, setLevel] = useState("beginner");
	const [duration, setDuration] = useState("");
	const [xpReward, setXpReward] = useState(100);
	const [track, setTrack] = useState("");
	const [published, setPublished] = useState(false);
	const [image, setImage] = useState<{
		_type: "image";
		asset: { _ref: string; _type: "reference" };
	} | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [overview, setOverview] = useState("");
	const [learningObjectives, setLearningObjectives] = useState("");
	const [requirements, setRequirements] = useState("");
	const [targetAudience, setTargetAudience] = useState("");

	const fetchCourse = useCallback(async () => {
		try {
			const res = await fetch(`/api/admin/courses/${courseId}`);
			if (res.ok) {
				const data = (await res.json()) as { course: CourseData };
				const c = data.course;
				setCourse(c);
				setTitle(c.title);
				setDescription(c.description ?? "");
				setLevel(c.level);
				setDuration(c.duration ?? "");
				setXpReward(c.xpReward);
				setTrack(c.track ?? "");
				setPublished(c.published);
				if (c.image) setImage(c.image);
				if (c.imageUrl) setImagePreview(c.imageUrl);
				setOverview(c.overview ?? "");
				setLearningObjectives(c.learningObjectives ?? "");
				setRequirements(c.requirements ?? "");
				setTargetAudience(c.targetAudience ?? "");
			}
		} finally {
			setLoading(false);
		}
	}, [courseId]);

	useEffect(() => {
		fetchCourse();
	}, [fetchCourse]);

	const handleSave = async () => {
		setSaving(true);
		const res = await fetch(`/api/admin/courses/${courseId}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				title: title.trim(),
				description: description.trim(),
				level,
				duration: duration.trim(),
				xpReward,
				track: track.trim(),
				published,
				image,
				overview,
				learningObjectives,
				requirements,
				targetAudience,
			}),
		});

		if (res.ok) {
			router.push("/admin/courses");
		}
		setSaving(false);
	};

	if (loading) {
		return (
			<div className="p-6 space-y-6">
				<div className="h-6 w-24 bg-muted animate-pulse rounded-lg" />
				<div className="h-8 w-64 bg-muted animate-pulse rounded-lg" />
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
					))}
				</div>
				<div className="h-48 bg-muted animate-pulse rounded-xl" />
			</div>
		);
	}

	if (!course) {
		return (
			<div className="p-6 text-center">
				<h1 className="text-xl font-bold">Course not found</h1>
				<Button variant="outline" asChild className="mt-4">
					<Link href="/admin/courses">Back to Courses</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="p-6 space-y-6 max-w-4xl">
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link href="/admin/courses">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div className="flex-1">
					<h1 className="text-3xl font-bold">Edit Course</h1>
					<p className="text-muted-foreground">{course.slug?.current}</p>
				</div>
				<Badge variant={course.onchainStatus === "succeeded" ? "default" : "secondary"}>
					On-chain: {course.onchainStatus ?? "draft"}
				</Badge>
				<Button variant="outline" asChild>
					<Link href={`/admin/courses/${courseId}/content`}>
						<Code2 className="h-4 w-4 mr-2" />
						Challenges & Quizzes
					</Link>
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Course Details</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label>Thumbnail</Label>
						<ImageUpload
							value={image ? image.asset._ref : null}
							onChange={setImage}
							previewUrl={imagePreview}
							onPreviewChange={setImagePreview}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="title">Title</Label>
						<Input
							id="title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
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
						/>
					</div>

					<div className="flex items-center gap-3">
						<Switch id="published" checked={published} onCheckedChange={setPublished} />
						<Label htmlFor="published">Published</Label>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Course Content</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label>Overview</Label>
						<RichTextEditor
							value={overview}
							onChange={setOverview}
							placeholder="Provide a detailed overview of this course..."
						/>
					</div>

					<div className="space-y-2">
						<Label>What You&apos;ll Learn</Label>
						<RichTextEditor
							value={learningObjectives}
							onChange={setLearningObjectives}
							placeholder="List the key learning objectives..."
						/>
					</div>

					<div className="space-y-2">
						<Label>Requirements</Label>
						<RichTextEditor
							value={requirements}
							onChange={setRequirements}
							placeholder="What should learners know before starting..."
						/>
					</div>

					<div className="space-y-2">
						<Label>Target Audience</Label>
						<RichTextEditor
							value={targetAudience}
							onChange={setTargetAudience}
							placeholder="Who is this course designed for..."
						/>
					</div>
				</CardContent>
			</Card>

			{course.modules && course.modules.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Modules ({course.modules.length})</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{course.modules.map((mod, mi) => (
							<div key={mod._id ?? mi} className="border rounded-lg p-4 space-y-3">
								<div className="flex items-center gap-3">
									<GripVertical className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm font-medium text-muted-foreground">
										Module {mod.order}
									</span>
									<span className="font-medium">{mod.title}</span>
								</div>

								{mod.lessons && mod.lessons.length > 0 && (
									<div className="pl-8 space-y-2">
										{mod.lessons.map((lesson, li) => (
											<div
												key={lesson._id ?? li}
												className="flex items-center gap-3 text-sm bg-muted/50 rounded-md p-2"
											>
												<span className="text-muted-foreground w-6">
													{lesson.order}.
												</span>
												<span className="flex-1">{lesson.title}</span>
												<Badge variant="outline">
													{lesson.xpReward} XP
												</Badge>
												{lesson.duration && (
													<span className="text-muted-foreground text-xs">
														{lesson.duration}
													</span>
												)}
											</div>
										))}
									</div>
								)}
							</div>
						))}
					</CardContent>
				</Card>
			)}

			<div className="flex items-center justify-end gap-3">
				<Button variant="outline" asChild>
					<Link href="/admin/courses">Cancel</Link>
				</Button>
				<Button onClick={handleSave} disabled={saving || !title.trim()}>
					{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
					<Save className="h-4 w-4 mr-2" />
					{t("saveChanges")}
				</Button>
			</div>
		</div>
	);
}

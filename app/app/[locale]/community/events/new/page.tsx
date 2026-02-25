"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "@superteam-academy/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const EVENT_TYPES = [
	{ value: "workshop", label: "Workshop" },
	{ value: "ama", label: "AMA" },
	{ value: "hackathon", label: "Hackathon" },
	{ value: "meetup", label: "Meetup" },
	{ value: "conference", label: "Conference" },
];

export default function NewEventPage() {
	const router = useRouter();
	const { toast } = useToast();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isOnline, setIsOnline] = useState(true);
	const [tags, setTags] = useState<string[]>([]);
	const [tagInput, setTagInput] = useState("");

	const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && tagInput.trim()) {
			e.preventDefault();
			if (!tags.includes(tagInput.trim()) && tags.length < 5) {
				setTags([...tags, tagInput.trim()]);
				setTagInput("");
			}
		}
	};

	const handleRemoveTag = (tagToRemove: string) => {
		setTags(tags.filter((tag) => tag !== tagToRemove));
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			const formData = new FormData(e.currentTarget);
			const title = formData.get("title") as string;
			const description = formData.get("description") as string;
			const type = formData.get("type") as string;
			const startDate = formData.get("startDate") as string;
			const endDate = (formData.get("endDate") as string) || undefined;
			const timezone = formData.get("timezone") as string;
			const location = isOnline ? undefined : (formData.get("location") as string);
			const maxAttendeesRaw = formData.get("maxAttendees") as string;
			const maxAttendees = maxAttendeesRaw ? Number(maxAttendeesRaw) : undefined;
			const registrationUrl = (formData.get("registrationUrl") as string) || undefined;

			const res = await fetch("/api/community/events", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title,
					description,
					type,
					startDate,
					endDate,
					timezone,
					location,
					isOnline,
					maxAttendees,
					registrationUrl,
					tags,
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || "Failed to create event");
			}

			toast({
				title: "Event created!",
				description: "Your event has been posted to the community.",
			});

			router.push("/community/events");
		} catch (err) {
			toast({
				title: "Error",
				description:
					err instanceof Error
						? err.message
						: "Failed to create event. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="max-w-3xl mx-auto space-y-6">
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="sm" asChild>
					<Link href="/community/events">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div>
					<h1 className="text-2xl font-bold">Create Event</h1>
					<p className="text-sm text-muted-foreground">
						Host a workshop, AMA, hackathon, or meetup for the community
					</p>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="rounded-2xl border border-border/60 bg-card p-6 space-y-5">
					<div className="space-y-2">
						<label htmlFor="title" className="text-sm font-medium">
							Event Name *
						</label>
						<Input
							id="title"
							name="title"
							placeholder="Solana Security Workshop"
							className="h-11"
							required
							maxLength={200}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<label htmlFor="type" className="text-sm font-medium">
								Type *
							</label>
							<Select name="type" defaultValue="workshop" required>
								<SelectTrigger className="h-11">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{EVENT_TYPES.map((type) => (
										<SelectItem key={type.value} value={type.value}>
											{type.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<label htmlFor="timezone" className="text-sm font-medium">
								Timezone *
							</label>
							<Input
								id="timezone"
								name="timezone"
								placeholder="UTC"
								className="h-11"
								required
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<label htmlFor="startDate" className="text-sm font-medium">
								Start Date & Time *
							</label>
							<Input
								id="startDate"
								name="startDate"
								type="datetime-local"
								className="h-11"
								required
							/>
						</div>

						<div className="space-y-2">
							<label htmlFor="endDate" className="text-sm font-medium">
								End Date & Time
							</label>
							<Input
								id="endDate"
								name="endDate"
								type="datetime-local"
								className="h-11"
							/>
						</div>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Location *</label>
						<div className="flex gap-2 mb-2">
							<Button
								type="button"
								variant={isOnline ? "default" : "outline"}
								size="sm"
								onClick={() => setIsOnline(true)}
							>
								Online
							</Button>
							<Button
								type="button"
								variant={isOnline ? "outline" : "default"}
								size="sm"
								onClick={() => setIsOnline(false)}
							>
								In Person
							</Button>
						</div>
						{!isOnline && (
							<Input
								id="location"
								name="location"
								placeholder="Berlin, Germany"
								className="h-11"
								required
							/>
						)}
					</div>

					<div className="space-y-2">
						<label htmlFor="description" className="text-sm font-medium">
							Description *
						</label>
						<Textarea
							id="description"
							name="description"
							placeholder="What will attendees learn or experience at this event?"
							className="min-h-37.5 resize-y"
							required
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<label htmlFor="maxAttendees" className="text-sm font-medium">
								Max Attendees (optional)
							</label>
							<Input
								id="maxAttendees"
								name="maxAttendees"
								type="number"
								placeholder="Unlimited"
								className="h-11"
								min="1"
							/>
						</div>

						<div className="space-y-2">
							<label htmlFor="registrationUrl" className="text-sm font-medium">
								Registration URL (optional)
							</label>
							<Input
								id="registrationUrl"
								name="registrationUrl"
								type="url"
								placeholder="https://..."
								className="h-11"
							/>
						</div>
					</div>

					<div className="space-y-2">
						<label htmlFor="tags" className="text-sm font-medium">
							Tags (optional)
						</label>
						<Input
							id="tags"
							value={tagInput}
							onChange={(e) => setTagInput(e.target.value)}
							onKeyDown={handleAddTag}
							placeholder="Press Enter to add tags (max 5)"
							disabled={tags.length >= 5}
						/>
						{tags.length > 0 && (
							<div className="flex flex-wrap gap-2 mt-2">
								{tags.map((tag) => (
									<Badge
										key={tag}
										variant="secondary"
										className="gap-1 cursor-pointer"
										onClick={() => handleRemoveTag(tag)}
									>
										{tag}
										<span className="text-muted-foreground">×</span>
									</Badge>
								))}
							</div>
						)}
					</div>
				</div>

				<div className="flex items-center justify-between">
					<Button type="button" variant="ghost" asChild>
						<Link href="/community/events">Cancel</Link>
					</Button>
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
						Create Event
					</Button>
				</div>
			</form>
		</div>
	);
}

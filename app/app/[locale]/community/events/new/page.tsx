"use client";

import { useState } from "react";
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
import { useTranslations } from "next-intl";
import { useTagInput } from "@/hooks/use-tag-input";
import { useFormSubmit } from "@/hooks/use-form-submit";

const EVENT_TYPES = [
	{ value: "workshop" },
	{ value: "ama" },
	{ value: "hackathon" },
	{ value: "meetup" },
	{ value: "conference" },
];

export default function NewEventPage() {
	const t = useTranslations("community.createEvent");
	const [isOnline, setIsOnline] = useState(true);
	const { tags, tagInput, setTagInput, removeTag, handleKeyDown } = useTagInput();
	const { isSubmitting, submit } = useFormSubmit({
		endpoint: "/api/community/events",
		successToast: {
			title: t("toast.createdTitle"),
			description: t("toast.createdDescription"),
		},
		errorToast: {
			title: t("toast.errorTitle"),
			fallbackDescription: t("errors.createFailedRetry"),
		},
		redirectTo: "/community/events",
	});

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const maxAttendeesRaw = formData.get("maxAttendees") as string;

		await submit({
			title: formData.get("title") as string,
			description: formData.get("description") as string,
			type: formData.get("type") as string,
			startDate: formData.get("startDate") as string,
			endDate: (formData.get("endDate") as string) || undefined,
			timezone: formData.get("timezone") as string,
			location: isOnline ? undefined : (formData.get("location") as string),
			isOnline,
			maxAttendees: maxAttendeesRaw ? Number(maxAttendeesRaw) : undefined,
			registrationUrl: (formData.get("registrationUrl") as string) || undefined,
			tags,
		});
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
					<h1 className="text-2xl font-bold">{t("title")}</h1>
					<p className="text-sm text-muted-foreground">{t("description")}</p>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="rounded-2xl border border-border/60 bg-card p-6 space-y-5">
					<div className="space-y-2">
						<label htmlFor="title" className="text-sm font-medium">
							{t("fields.eventName")}
						</label>
						<Input
							id="title"
							name="title"
							placeholder={t("placeholders.eventName")}
							className="h-11"
							required
							maxLength={200}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<label htmlFor="type" className="text-sm font-medium">
								{t("fields.type")}
							</label>
							<Select name="type" defaultValue="workshop" required>
								<SelectTrigger className="h-11">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{EVENT_TYPES.map((type) => (
										<SelectItem key={type.value} value={type.value}>
											{t(`eventTypes.${type.value}`)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<label htmlFor="timezone" className="text-sm font-medium">
								{t("fields.timezone")}
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
								{t("fields.startDateTime")}
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
								{t("fields.endDateTime")}
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
						<label className="text-sm font-medium">{t("fields.location")}</label>
						<div className="flex gap-2 mb-2">
							<Button
								type="button"
								variant={isOnline ? "default" : "outline"}
								size="sm"
								onClick={() => setIsOnline(true)}
							>
								{t("location.online")}
							</Button>
							<Button
								type="button"
								variant={isOnline ? "outline" : "default"}
								size="sm"
								onClick={() => setIsOnline(false)}
							>
								{t("location.inPerson")}
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
							{t("fields.description")}
						</label>
						<Textarea
							id="description"
							name="description"
							placeholder={t("placeholders.description")}
							className="min-h-37.5 resize-y"
							required
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<label htmlFor="maxAttendees" className="text-sm font-medium">
								{t("fields.maxAttendees")}
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
								{t("fields.registrationUrl")}
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
							{t("fields.tags")}
						</label>
						<Input
							id="tags"
							value={tagInput}
							onChange={(e) => setTagInput(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder={t("placeholders.tags")}
							disabled={tags.length >= 5}
						/>
						{tags.length > 0 && (
							<div className="flex flex-wrap gap-2 mt-2">
								{tags.map((tag) => (
									<Badge
										key={tag}
										variant="secondary"
										className="gap-1 cursor-pointer"
										onClick={() => removeTag(tag)}
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
						<Link href="/community/events">{t("actions.cancel")}</Link>
					</Button>
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
						{t("actions.createEvent")}
					</Button>
				</div>
			</form>
		</div>
	);
}

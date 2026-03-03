"use client";

import { ExternalLink, Download, FileText, Video, Link as LinkIcon, BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatFileSize, formatDuration } from "@/lib/utils";

interface Resource {
	id: string;
	title: string;
	description: string;
	type: "article" | "video" | "document" | "link" | "book" | "tool";
	url: string;
	author?: string;
	duration?: number; // in minutes
	fileSize?: number; // in bytes
	tags?: string[];
}

interface LessonResourcesProps {
	resources: Resource[];
	onResourceClick?: (resource: Resource) => void;
}

export function LessonResources({ resources, onResourceClick }: LessonResourcesProps) {
	const getResourceIcon = (type: string) => {
		switch (type) {
			case "article":
				return <FileText className="h-5 w-5" />;
			case "video":
				return <Video className="h-5 w-5" />;
			case "document":
				return <Download className="h-5 w-5" />;
			case "book":
				return <BookOpen className="h-5 w-5" />;
			case "tool":
				return <LinkIcon className="h-5 w-5" />;
			default:
				return <ExternalLink className="h-5 w-5" />;
		}
	};

	const getResourceColor = (type: string) => {
		switch (type) {
			case "article":
				return "text-blue-500";
			case "video":
				return "text-red-500";
			case "document":
				return "text-green-500";
			case "book":
				return "text-purple-500";
			case "tool":
				return "text-orange-500";
			default:
				return "text-gray-500";
		}
	};

	const handleResourceClick = (resource: Resource) => {
		onResourceClick?.(resource);
		window.open(resource.url, "_blank", "noopener,noreferrer");
	};

	if (resources.length === 0) {
		return (
			<Card>
				<CardContent className="pt-6">
					<div className="text-center text-muted-foreground">
						<BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
						<p>No additional resources available</p>
						<p className="text-sm">Check back later for more learning materials</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2 mb-4">
				<BookOpen className="h-5 w-5" />
				<h3 className="text-lg font-semibold">Additional Resources</h3>
				<Badge variant="secondary">{resources.length}</Badge>
			</div>

			<div className="grid gap-4">
				{resources.map((resource) => (
					<Card key={resource.id} className="hover:shadow-md transition-shadow">
						<CardHeader className="pb-3">
							<div className="flex items-start justify-between">
								<div className="flex items-center gap-3">
									<div className={getResourceColor(resource.type)}>
										{getResourceIcon(resource.type)}
									</div>
									<div className="flex-1 min-w-0">
										<CardTitle className="text-base leading-tight">
											{resource.title}
										</CardTitle>
										{resource.author && (
											<p className="text-sm text-muted-foreground mt-1">
												by {resource.author}
											</p>
										)}
									</div>
								</div>
								<Badge variant="outline" className="capitalize">
									{resource.type}
								</Badge>
							</div>
						</CardHeader>
						<CardContent className="pt-0">
							<p className="text-sm text-muted-foreground mb-4">
								{resource.description}
							</p>

							<div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
								{resource.duration && (
									<div className="flex items-center gap-1">
										<Video className="h-3 w-3" />
										<span>{formatDuration(resource.duration)}</span>
									</div>
								)}
								{resource.fileSize && (
									<div className="flex items-center gap-1">
										<Download className="h-3 w-3" />
										<span>{formatFileSize(resource.fileSize)}</span>
									</div>
								)}
							</div>

							{resource.tags && resource.tags.length > 0 && (
								<div className="flex flex-wrap gap-1 mb-4">
									{resource.tags.map((tag) => (
										<Badge key={tag} variant="secondary" className="text-xs">
											{tag}
										</Badge>
									))}
								</div>
							)}

							<Button
								onClick={() => handleResourceClick(resource)}
								className="w-full"
								variant="outline"
							>
								{resource.type === "video" && <Video className="h-4 w-4 mr-2" />}
								{resource.type === "document" && (
									<Download className="h-4 w-4 mr-2" />
								)}
								{resource.type === "article" && (
									<FileText className="h-4 w-4 mr-2" />
								)}
								{resource.type === "book" && <BookOpen className="h-4 w-4 mr-2" />}
								{(resource.type === "link" || resource.type === "tool") && (
									<ExternalLink className="h-4 w-4 mr-2" />
								)}
								{resource.type === "video"
									? "Watch Video"
									: resource.type === "document"
										? "Download"
										: resource.type === "article"
											? "Read Article"
											: resource.type === "book"
												? "Read Book"
												: "Open Link"}
							</Button>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}

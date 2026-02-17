"use client";

import { useState } from "react";
import {
    ChevronDown,
    ChevronRight,
    FileText,
    Link,
    Download,
    ImageIcon,
    Video,
    CircleHelp,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

interface LessonContentProps {
	content: {
		sections: Array<{
			id: string;
			title: string;
			type: "text" | "code" | "image" | "video" | "quiz";
			content: string;
			order: number;
		}>;
		resources?: Array<{
			id: string;
			title: string;
			type: "pdf" | "link" | "download";
			url: string;
			description?: string;
		}>;
	};
}

export function LessonContent({ content }: LessonContentProps) {
	const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

	const toggleSection = (sectionId: string) => {
		const newExpanded = new Set(expandedSections);
		if (newExpanded.has(sectionId)) {
			newExpanded.delete(sectionId);
		} else {
			newExpanded.add(sectionId);
		}
		setExpandedSections(newExpanded);
	};

	const renderContent = (section: LessonContentProps["content"]["sections"][0]) => {
		switch (section.type) {
			case "text":
				return (
					<div
						className="prose prose-sm max-w-none dark:prose-invert"
						dangerouslySetInnerHTML={{ __html: section.content }}
					/>
				);
			case "code":
				return (
					<pre className="bg-muted p-4 rounded-lg overflow-x-auto">
						<code>{section.content}</code>
					</pre>
				);
			case "image":
				return (
					<div className="flex justify-center">
						<img
							src={section.content}
							alt={section.title}
							className="max-w-full h-auto rounded-lg"
						/>
					</div>
				);
			case "video":
				return (
					<div className="aspect-video">
						<video
							src={section.content}
							controls={true}
							className="w-full h-full rounded-lg"
						/>
					</div>
				);
			case "quiz":
				return (
					<div className="bg-muted p-4 rounded-lg">
						<p className="text-sm text-muted-foreground mb-2">Quiz: {section.title}</p>
						<Button variant="outline" size="sm">
							Start Quiz
						</Button>
					</div>
				);
			default:
				return <p>{section.content}</p>;
		}
	};

	const getSectionIcon = (type: string) => {
		switch (type) {
			case "text":
				return <FileText className="h-4 w-4" />;
			case "code":
				return <span className="text-xs font-mono">{}</span>;
			case "image":
				return <ImageIcon className="h-4 w-4" />;
			case "video":
				return <Video className="h-4 w-4" />;
			case "quiz":
				return <CircleHelp className="h-4 w-4" />;
			default:
				return <FileText className="h-4 w-4" />;
		}
	};

	return (
		<div className="space-y-6">
			<div className="space-y-4">
				{content.sections
					.sort((a, b) => a.order - b.order)
					.map((section) => (
						<Card key={section.id}>
							<Collapsible
								open={expandedSections.has(section.id)}
								onOpenChange={() => toggleSection(section.id)}
							>
								<CollapsibleTrigger asChild={true}>
									<CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
										<CardTitle className="flex items-center gap-3 text-lg">
											{expandedSections.has(section.id) ? (
												<ChevronDown className="h-5 w-5" />
											) : (
												<ChevronRight className="h-5 w-5" />
											)}
											{getSectionIcon(section.type)}
											<span>{section.title}</span>
											<Badge variant="secondary" className="ml-auto">
												{section.type}
											</Badge>
										</CardTitle>
									</CardHeader>
								</CollapsibleTrigger>
								<CollapsibleContent>
									<CardContent className="pt-0">
										{renderContent(section)}
									</CardContent>
								</CollapsibleContent>
							</Collapsible>
						</Card>
					))}
			</div>

			{content.resources && content.resources.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Download className="h-5 w-5" />
							Resources
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{content.resources.map((resource) => (
								<div
									key={resource.id}
									className="flex items-center justify-between p-3 border rounded-lg"
								>
									<div className="flex items-center gap-3">
										{resource.type === "link" ? (
											<Link className="h-4 w-4 text-blue-500" />
										) : (
											<Download className="h-4 w-4 text-green-500" />
										)}
										<div>
											<p className="font-medium">{resource.title}</p>
											{resource.description && (
												<p className="text-sm text-muted-foreground">
													{resource.description}
												</p>
											)}
										</div>
									</div>
									<Button variant="outline" size="sm" asChild={true}>
										<a
											href={resource.url}
											target={resource.type === "link" ? "_blank" : undefined}
											rel={
												resource.type === "link"
													? "noopener noreferrer"
													: undefined
											}
											download={resource.type === "download"}
										>
											{resource.type === "link" ? "Open" : "Download"}
										</a>
									</Button>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

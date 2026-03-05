"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

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
					<pre className="bg-muted p-3 rounded-md overflow-x-auto text-sm">
						<code>{section.content}</code>
					</pre>
				);
			case "image":
				return (
					<div className="flex justify-center">
						<img
							src={section.content}
							alt={section.title}
							className="max-w-full h-auto rounded-md"
						/>
					</div>
				);
			case "video":
				return (
					<div className="aspect-video">
						<video
							src={section.content}
							controls={true}
							className="w-full h-full rounded-md"
						>
							<track kind="captions" />
						</video>
					</div>
				);
			case "quiz":
				return (
					<div className="bg-muted p-3 rounded-md">
						<p className="text-xs text-muted-foreground">Quiz: {section.title}</p>
					</div>
				);
			default:
				return <p className="text-sm">{section.content}</p>;
		}
	};

	return (
		<div className="space-y-6">
			{content.sections
				.sort((a, b) => a.order - b.order)
				.map((section) => (
					<div key={section.id}>
						<h3 className="text-sm font-semibold mb-2">{section.title}</h3>
						{renderContent(section)}
					</div>
				))}

			{content.resources && content.resources.length > 0 && (
				<div className="border-t pt-4 mt-6">
					<h4 className="text-xs font-medium mb-2">Resources</h4>
					<div className="space-y-1.5">
						{content.resources.map((resource) => (
							<div
								key={resource.id}
								className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors"
							>
								<div className="flex-1 min-w-0">
									<p className="text-sm truncate">{resource.title}</p>
									{resource.description && (
										<p className="text-xs text-muted-foreground truncate">
											{resource.description}
										</p>
									)}
								</div>
								<Button
									variant="ghost"
									size="sm"
									className="h-7 text-xs shrink-0"
									asChild={true}
								>
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
										<ExternalLink className="h-3 w-3 mr-1" />
										{resource.type === "link" ? "Open" : "Download"}
									</a>
								</Button>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

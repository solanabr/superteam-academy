interface RichTextContentProps {
	html: string;
	className?: string;
}

export function RichTextContent({ html, className }: RichTextContentProps) {
	if (!html || html === "<p></p>") return null;

	return (
		<div
			className={`prose prose-sm dark:prose-invert max-w-none ${className ?? ""}`}
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
}

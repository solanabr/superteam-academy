"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TiptapLink from "@tiptap/extension-link";
import {
	Bold,
	Italic,
	List,
	ListOrdered,
	Heading2,
	Heading3,
	LinkIcon,
	Undo,
	Redo,
} from "lucide-react";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";

interface RichTextEditorProps {
	value: string;
	onChange: (html: string) => void;
	placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
	const editor = useEditor({
		immediatelyRender: false,
		extensions: [
			StarterKit.configure({
				heading: { levels: [2, 3] },
			}),
			Placeholder.configure({ placeholder: placeholder ?? "Start writing..." }),
			TiptapLink.configure({ openOnClick: false }),
		],
		content: value,
		onUpdate: ({ editor: e }) => {
			onChange(e.getHTML());
		},
		editorProps: {
			attributes: {
				class: "prose prose-sm dark:prose-invert max-w-none min-h-[120px] px-3 py-2 focus:outline-none",
			},
		},
	});

	const setLink = useCallback(() => {
		if (!editor) return;
		const prev = editor.getAttributes("link").href as string | undefined;
		const url = window.prompt("URL", prev);
		if (url === null) return;
		if (!url) {
			editor.chain().focus().extendMarkRange("link").unsetLink().run();
			return;
		}
		editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
	}, [editor]);

	if (!editor) return null;

	return (
		<div className="border rounded-md overflow-hidden bg-background">
			<div className="flex items-center gap-0.5 border-b px-2 py-1 bg-muted/30 flex-wrap">
				<ToolbarButton
					active={editor.isActive("heading", { level: 2 })}
					onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
				>
					<Heading2 className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					active={editor.isActive("heading", { level: 3 })}
					onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
				>
					<Heading3 className="h-4 w-4" />
				</ToolbarButton>
				<div className="w-px h-5 bg-border mx-1" />
				<ToolbarButton
					active={editor.isActive("bold")}
					onClick={() => editor.chain().focus().toggleBold().run()}
				>
					<Bold className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					active={editor.isActive("italic")}
					onClick={() => editor.chain().focus().toggleItalic().run()}
				>
					<Italic className="h-4 w-4" />
				</ToolbarButton>
				<div className="w-px h-5 bg-border mx-1" />
				<ToolbarButton
					active={editor.isActive("bulletList")}
					onClick={() => editor.chain().focus().toggleBulletList().run()}
				>
					<List className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					active={editor.isActive("orderedList")}
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
				>
					<ListOrdered className="h-4 w-4" />
				</ToolbarButton>
				<div className="w-px h-5 bg-border mx-1" />
				<ToolbarButton active={editor.isActive("link")} onClick={setLink}>
					<LinkIcon className="h-4 w-4" />
				</ToolbarButton>
				<div className="w-px h-5 bg-border mx-1" />
				<ToolbarButton
					active={false}
					onClick={() => editor.chain().focus().undo().run()}
					disabled={!editor.can().undo()}
				>
					<Undo className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					active={false}
					onClick={() => editor.chain().focus().redo().run()}
					disabled={!editor.can().redo()}
				>
					<Redo className="h-4 w-4" />
				</ToolbarButton>
			</div>
			<EditorContent editor={editor} />
		</div>
	);
}

function ToolbarButton({
	active,
	onClick,
	disabled,
	children,
}: {
	active: boolean;
	onClick: () => void;
	disabled?: boolean;
	children: React.ReactNode;
}) {
	return (
		<Button
			type="button"
			variant="ghost"
			size="icon"
			className={`h-7 w-7 ${active ? "bg-accent text-accent-foreground" : ""}`}
			onClick={onClick}
			disabled={disabled}
		>
			{children}
		</Button>
	);
}

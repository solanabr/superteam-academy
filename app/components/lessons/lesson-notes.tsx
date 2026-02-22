"use client";

import { useState, useEffect } from "react";
import { Save, Edit3, Trash2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Note {
	id: string;
	timestamp: number; // in seconds
	title: string;
	content: string;
	createdAt: Date;
	updatedAt: Date;
}

interface LessonNotesProps {
	lessonId: string;
	currentTime: number;
	onSaveNote?: (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => void;
	onDeleteNote?: (noteId: string) => void;
	onUpdateNote?: (noteId: string, updates: Partial<Note>) => void;
}

export function LessonNotes({
	lessonId,
	currentTime,
	onSaveNote,
	onDeleteNote,
	onUpdateNote,
}: LessonNotesProps) {
	const [notes, setNotes] = useState<Note[]>([]);
	const [isAddingNote, setIsAddingNote] = useState(false);
	const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
	const [newNoteTitle, setNewNoteTitle] = useState("");
	const [newNoteContent, setNewNoteContent] = useState("");
	const [editTitle, setEditTitle] = useState("");
	const [editContent, setEditContent] = useState("");

	// Load notes from localStorage on mount
	useEffect(() => {
		const savedNotes = localStorage.getItem(`lesson-notes-${lessonId}`);
		if (savedNotes) {
			try {
				interface StoredNote {
					id: string;
					timestamp: number;
					title: string;
					content: string;
					createdAt: string;
					updatedAt: string;
				}
				const parsedNotes = (JSON.parse(savedNotes) as StoredNote[]).map((note) => ({
					...note,
					createdAt: new Date(note.createdAt),
					updatedAt: new Date(note.updatedAt),
				}));
				setNotes(parsedNotes);
			} catch (error) {
				console.error("Failed to load notes:", error);
			}
		}
	}, [lessonId]);

	// Save notes to localStorage whenever notes change
	useEffect(() => {
		localStorage.setItem(`lesson-notes-${lessonId}`, JSON.stringify(notes));
	}, [notes, lessonId]);

	const formatTime = (seconds: number) => {
		const minutes = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${minutes}:${secs.toString().padStart(2, "0")}`;
	};

	const addNote = () => {
		if (!newNoteTitle.trim() || !newNoteContent.trim()) return;

		const note: Note = {
			id: Date.now().toString(),
			timestamp: currentTime,
			title: newNoteTitle.trim(),
			content: newNoteContent.trim(),
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const updatedNotes = [...notes, note].sort((a, b) => a.timestamp - b.timestamp);
		setNotes(updatedNotes);
		onSaveNote?.(note);

		setNewNoteTitle("");
		setNewNoteContent("");
		setIsAddingNote(false);
	};

	const updateNote = (noteId: string) => {
		if (!editTitle.trim() || !editContent.trim()) return;

		const updatedNotes = notes.map((note) =>
			note.id === noteId
				? {
						...note,
						title: editTitle.trim(),
						content: editContent.trim(),
						updatedAt: new Date(),
					}
				: note
		);
		setNotes(updatedNotes);
		onUpdateNote?.(noteId, {
			title: editTitle.trim(),
			content: editContent.trim(),
			updatedAt: new Date(),
		});

		setEditingNoteId(null);
		setEditTitle("");
		setEditContent("");
	};

	const deleteNote = (noteId: string) => {
		const updatedNotes = notes.filter((note) => note.id !== noteId);
		setNotes(updatedNotes);
		onDeleteNote?.(noteId);
	};

	const startEditing = (note: Note) => {
		setEditingNoteId(note.id);
		setEditTitle(note.title);
		setEditContent(note.content);
	};

	const cancelEditing = () => {
		setEditingNoteId(null);
		setEditTitle("");
		setEditContent("");
	};

	return (
		<div className="space-y-4">
			<Button
				onClick={() => setIsAddingNote(true)}
				className="w-full"
				variant="outline"
				disabled={isAddingNote}
			>
				<Plus className="h-4 w-4 mr-2" />
				Add Note at {formatTime(currentTime)}
			</Button>

			{isAddingNote && (
				<Card>
					<CardHeader>
						<CardTitle className="text-sm">New Note</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<Input
							placeholder="Note title..."
							value={newNoteTitle}
							onChange={(e) => setNewNoteTitle(e.target.value)}
						/>
						<Textarea
							placeholder="Write your note here..."
							value={newNoteContent}
							onChange={(e) => setNewNoteContent(e.target.value)}
							rows={4}
						/>
						<div className="flex gap-2">
							<Button onClick={addNote} size="sm">
								<Save className="h-4 w-4 mr-2" />
								Save
							</Button>
							<Button
								onClick={() => {
									setIsAddingNote(false);
									setNewNoteTitle("");
									setNewNoteContent("");
								}}
								variant="outline"
								size="sm"
							>
								Cancel
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			<div className="space-y-3">
				{notes.length === 0 ? (
					<Card>
						<CardContent className="pt-6">
							<div className="text-center text-muted-foreground">
								<Edit3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
								<p>No notes yet</p>
								<p className="text-sm">
									Add your first note to remember important points
								</p>
							</div>
						</CardContent>
					</Card>
				) : (
					notes.map((note) => (
						<Card key={note.id}>
							<CardHeader className="pb-3">
								<div className="flex items-center justify-between">
									{editingNoteId === note.id ? (
										<Input
											value={editTitle}
											onChange={(e) => setEditTitle(e.target.value)}
											className="text-sm font-medium"
										/>
									) : (
										<CardTitle className="text-sm flex items-center gap-2">
											<Badge variant="secondary" className="text-xs">
												{formatTime(note.timestamp)}
											</Badge>
											{note.title}
										</CardTitle>
									)}
									<div className="flex gap-1">
										{editingNoteId === note.id ? (
											<>
												<Button
													onClick={() => updateNote(note.id)}
													size="sm"
													variant="outline"
												>
													<Save className="h-3 w-3" />
												</Button>
												<Button
													onClick={cancelEditing}
													size="sm"
													variant="outline"
												>
													Cancel
												</Button>
											</>
										) : (
											<>
												<Button
													onClick={() => startEditing(note)}
													size="sm"
													variant="ghost"
												>
													<Edit3 className="h-3 w-3" />
												</Button>
												<Button
													onClick={() => deleteNote(note.id)}
													size="sm"
													variant="ghost"
													className="text-destructive hover:text-destructive"
												>
													<Trash2 className="h-3 w-3" />
												</Button>
											</>
										)}
									</div>
								</div>
							</CardHeader>
							<CardContent className="pt-0">
								{editingNoteId === note.id ? (
									<Textarea
										value={editContent}
										onChange={(e) => setEditContent(e.target.value)}
										rows={4}
									/>
								) : (
									<p className="text-sm whitespace-pre-wrap">{note.content}</p>
								)}
								<p className="text-xs text-muted-foreground mt-2">
									{note.updatedAt > note.createdAt ? "Updated" : "Created"}{" "}
									{note.updatedAt.toLocaleDateString()}
								</p>
							</CardContent>
						</Card>
					))
				)}
			</div>
		</div>
	);
}

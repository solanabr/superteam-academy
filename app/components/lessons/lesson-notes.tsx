"use client";

import { useState, useEffect, useCallback } from "react";
import { Save, Edit3, Trash2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatTimestamp } from "@/lib/utils";

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

interface ApiNote {
	_id: string;
	_createdAt?: string;
	_updatedAt?: string;
	lessonId: string;
	title: string;
	content: string;
	timestamp: number;
}

function apiNoteToNote(n: ApiNote): Note {
	return {
		id: n._id,
		timestamp: n.timestamp ?? 0,
		title: n.title,
		content: n.content,
		createdAt: new Date(n._createdAt ?? Date.now()),
		updatedAt: new Date(n._updatedAt ?? Date.now()),
	};
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
	const [useApi, setUseApi] = useState(false);

	const loadLocalNotes = useCallback(() => {
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
				return (JSON.parse(savedNotes) as StoredNote[]).map((note) => ({
					...note,
					createdAt: new Date(note.createdAt),
					updatedAt: new Date(note.updatedAt),
				}));
			} catch {
				return [];
			}
		}
		return [];
	}, [lessonId]);

	useEffect(() => {
		let cancelled = false;
		async function load() {
			try {
				const res = await fetch(
					`/api/lessons/notes?lessonId=${encodeURIComponent(lessonId)}`
				);
				if (res.ok) {
					const data = await res.json();
					if (!cancelled && Array.isArray(data.notes) && data.notes.length > 0) {
						setNotes(data.notes.map(apiNoteToNote));
						setUseApi(true);
						return;
					}
					if (!cancelled && res.ok) {
						setUseApi(true);
					}
				}
			} catch {
				// API not available — fall back to localStorage
			}
			if (!cancelled) {
				const local = loadLocalNotes();
				setNotes(local);
			}
		}
		load();
		return () => {
			cancelled = true;
		};
	}, [lessonId, loadLocalNotes]);

	useEffect(() => {
		if (!useApi) {
			localStorage.setItem(`lesson-notes-${lessonId}`, JSON.stringify(notes));
		}
	}, [notes, lessonId, useApi]);

	const formatTime = formatTimestamp;

	const addNote = async () => {
		if (!newNoteTitle.trim() || !newNoteContent.trim()) return;

		const note: Note = {
			id: Date.now().toString(),
			timestamp: currentTime,
			title: newNoteTitle.trim(),
			content: newNoteContent.trim(),
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		if (useApi) {
			try {
				const res = await fetch("/api/lessons/notes", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						lessonId,
						title: note.title,
						content: note.content,
						timestamp: note.timestamp,
					}),
				});
				if (res.ok) {
					const data = await res.json();
					note.id = data.note._id;
				}
			} catch {
				// Silently fall back to local
			}
		}

		const updatedNotes = [...notes, note].sort((a, b) => a.timestamp - b.timestamp);
		setNotes(updatedNotes);
		onSaveNote?.(note);

		setNewNoteTitle("");
		setNewNoteContent("");
		setIsAddingNote(false);
	};

	const updateNote = async (noteId: string) => {
		if (!editTitle.trim() || !editContent.trim()) return;

		if (useApi) {
			try {
				await fetch("/api/lessons/notes", {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						noteId,
						title: editTitle.trim(),
						content: editContent.trim(),
					}),
				});
			} catch {
				// Silently fall back to local
			}
		}

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

	const deleteNote = async (noteId: string) => {
		if (useApi) {
			try {
				await fetch(`/api/lessons/notes?noteId=${encodeURIComponent(noteId)}`, {
					method: "DELETE",
				});
			} catch {
				// Silently fall back to local
			}
		}

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

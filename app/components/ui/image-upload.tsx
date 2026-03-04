"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
	value: string | null;
	onChange: (
		imageRef: { _type: "image"; asset: { _ref: string; _type: "reference" } } | null
	) => void;
	previewUrl: string | null;
	onPreviewChange: (url: string | null) => void;
}

export function ImageUpload({ onChange, previewUrl, onPreviewChange }: ImageUploadProps) {
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleUpload = async (file: File) => {
		setUploading(true);
		setError(null);

		const formData = new FormData();
		formData.append("file", file);

		try {
			const res = await fetch("/api/admin/upload", {
				method: "POST",
				body: formData,
			});

			if (!res.ok) {
				const data = (await res.json()) as { error?: string };
				setError(data.error ?? "Upload failed");
				return;
			}

			const data = (await res.json()) as {
				asset: {
					_id: string;
					_type: "image";
					asset: { _ref: string; _type: "reference" };
					url: string;
				};
			};

			onChange({ _type: "image", asset: data.asset.asset });
			onPreviewChange(data.asset.url);
		} catch {
			setError("Upload failed");
		} finally {
			setUploading(false);
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) handleUpload(file);
	};

	const handleRemove = () => {
		onChange(null);
		onPreviewChange(null);
		if (inputRef.current) inputRef.current.value = "";
	};

	return (
		<div className="space-y-2">
			{previewUrl ? (
				<div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
					<Image
						src={previewUrl}
						alt="Course thumbnail"
						fill
						className="object-cover"
						sizes="(max-width: 768px) 100vw, 50vw"
					/>
					<Button
						type="button"
						variant="destructive"
						size="icon"
						className="absolute top-2 right-2 h-7 w-7"
						onClick={handleRemove}
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
			) : (
				<button
					type="button"
					onClick={() => inputRef.current?.click()}
					disabled={uploading}
					className="w-full aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground cursor-pointer"
				>
					{uploading ? (
						<Loader2 className="h-8 w-8 animate-spin" />
					) : (
						<>
							<Upload className="h-8 w-8" />
							<span className="text-sm">Click to upload thumbnail</span>
							<span className="text-xs">JPEG, PNG, WebP or GIF (max 5MB)</span>
						</>
					)}
				</button>
			)}

			{error && <p className="text-sm text-destructive">{error}</p>}

			<input
				ref={inputRef}
				type="file"
				accept="image/jpeg,image/png,image/webp,image/gif"
				onChange={handleFileChange}
				className="hidden"
			/>
		</div>
	);
}

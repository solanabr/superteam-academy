"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { formatTimestamp } from "@/lib/utils";

interface LessonVideoPlayerProps {
	videoUrl: string;
	title: string;
	onProgress?: (progress: number) => void;
	onComplete?: () => void;
}

/**
 * Extract an embeddable URL from YouTube or Vimeo links.
 * Returns null for direct video files (.mp4, .webm, etc.).
 */
function getEmbedUrl(url: string): string | null {
	if (!url) return null;

	// YouTube: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
	const ytMatch = url.match(
		/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
	);
	if (ytMatch) {
		return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;
	}

	// Vimeo: vimeo.com/ID or vimeo.com/video/ID
	const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
	if (vimeoMatch) {
		return `https://player.vimeo.com/video/${vimeoMatch[1]}?dnt=1&transparent=0`;
	}

	return null;
}

export function LessonVideoPlayer({
	videoUrl,
	title,
	onProgress,
	onComplete,
}: LessonVideoPlayerProps) {
	const embedUrl = useMemo(() => getEmbedUrl(videoUrl), [videoUrl]);

	// Embedded player (YouTube / Vimeo)
	if (embedUrl) {
		return (
			<div className="relative bg-black rounded-b-lg overflow-hidden">
				<iframe
					src={embedUrl}
					title={title}
					className="w-full aspect-video border-0"
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
					allowFullScreen
					referrerPolicy="strict-origin-when-cross-origin"
					loading="lazy"
				/>
			</div>
		);
	}

	// Direct video file — use native <video> with custom controls
	return (
		<NativeVideoPlayer
			videoUrl={videoUrl}
			title={title}
			onProgress={onProgress}
			onComplete={onComplete}
		/>
	);
}

function NativeVideoPlayer({ videoUrl, title, onProgress, onComplete }: LessonVideoPlayerProps) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [volume, setVolume] = useState(1);
	const [isMuted, setIsMuted] = useState(false);
	const [showControls, setShowControls] = useState(true);
	const [_isFullscreen, setIsFullscreen] = useState(false);

	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

		const handleTimeUpdate = () => {
			setCurrentTime(video.currentTime);
			const progress = (video.currentTime / video.duration) * 100;
			onProgress?.(progress);
		};

		const handleLoadedMetadata = () => {
			setDuration(video.duration);
		};

		const handleEnded = () => {
			setIsPlaying(false);
			onComplete?.();
		};

		video.addEventListener("timeupdate", handleTimeUpdate);
		video.addEventListener("loadedmetadata", handleLoadedMetadata);
		video.addEventListener("ended", handleEnded);

		return () => {
			video.removeEventListener("timeupdate", handleTimeUpdate);
			video.removeEventListener("loadedmetadata", handleLoadedMetadata);
			video.removeEventListener("ended", handleEnded);
		};
	}, [onProgress, onComplete]);

	const togglePlay = () => {
		const video = videoRef.current;
		if (!video) return;

		if (isPlaying) {
			video.pause();
		} else {
			video.play();
		}
		setIsPlaying(!isPlaying);
	};

	const handleSeek = (value: number[]) => {
		const video = videoRef.current;
		if (!video) return;

		const newTime = (value[0] / 100) * duration;
		video.currentTime = newTime;
		setCurrentTime(newTime);
	};

	const handleVolumeChange = (value: number[]) => {
		const video = videoRef.current;
		if (!video) return;

		const newVolume = value[0] / 100;
		video.volume = newVolume;
		setVolume(newVolume);
		setIsMuted(newVolume === 0);
	};

	const toggleMute = () => {
		const video = videoRef.current;
		if (!video) return;

		if (isMuted) {
			video.volume = volume;
			setIsMuted(false);
		} else {
			video.volume = 0;
			setIsMuted(true);
		}
	};

	const skip = (seconds: number) => {
		const video = videoRef.current;
		if (!video) return;

		video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
	};

	const toggleFullscreen = () => {
		if (document.fullscreenElement) {
			document.exitFullscreen();
			setIsFullscreen(false);
		} else {
			videoRef.current?.requestFullscreen();
			setIsFullscreen(true);
		}
	};

	return (
		<div
			className="relative group bg-black"
			onMouseEnter={() => setShowControls(true)}
			onMouseLeave={() => setShowControls(false)}
		>
			<video
				ref={videoRef}
				src={videoUrl}
				className="w-full aspect-video"
				onClick={togglePlay}
				poster={`/api/video-thumbnail?title=${encodeURIComponent(title)}`}
			>
				<track kind="captions" />
			</video>

			<div
				className={`absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${
					showControls || !isPlaying ? "opacity-100" : "opacity-0"
				}`}
			>
				<div className="absolute inset-0 flex items-center justify-center">
					<Button
						variant="secondary"
						size="lg"
						className="rounded-full w-16 h-16 opacity-80 hover:opacity-100"
						onClick={togglePlay}
					>
						{isPlaying ? (
							<Pause className="h-8 w-8" />
						) : (
							<Play className="h-8 w-8 ml-1" />
						)}
					</Button>
				</div>

				<div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
					<div className="flex items-center gap-2">
						<span className="text-white text-sm font-mono">
							{formatTimestamp(currentTime)}
						</span>
						<Slider
							value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
							onValueChange={handleSeek}
							max={100}
							step={0.1}
							className="flex-1"
						/>
						<span className="text-white text-sm font-mono">
							{formatTimestamp(duration)}
						</span>
					</div>

					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Button variant="ghost" size="sm" onClick={togglePlay}>
								{isPlaying ? (
									<Pause className="h-4 w-4" />
								) : (
									<Play className="h-4 w-4" />
								)}
							</Button>

							<Button variant="ghost" size="sm" onClick={() => skip(-10)}>
								<SkipBack className="h-4 w-4" />
							</Button>

							<Button variant="ghost" size="sm" onClick={() => skip(10)}>
								<SkipForward className="h-4 w-4" />
							</Button>

							<div className="flex items-center gap-2">
								<Button variant="ghost" size="sm" onClick={toggleMute}>
									{isMuted ? (
										<VolumeX className="h-4 w-4" />
									) : (
										<Volume2 className="h-4 w-4" />
									)}
								</Button>
								<Slider
									value={[isMuted ? 0 : volume * 100]}
									onValueChange={handleVolumeChange}
									max={100}
									step={1}
									className="w-20"
								/>
							</div>
						</div>

						<div className="flex items-center gap-2">
							<Button variant="ghost" size="sm" onClick={toggleFullscreen}>
								<Maximize className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

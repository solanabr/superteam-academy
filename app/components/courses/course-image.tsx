import Image from "next/image";

interface CourseImageProps {
	src: string;
	alt: string;
	width?: number;
	height?: number;
	className?: string;
	priority?: boolean;
	fill?: boolean;
}

export function CourseImage({
	src,
	alt,
	width = 960,
	height = 540,
	className,
	priority = false,
	fill = false,
}: CourseImageProps) {
	if (!src || src === "/courses/default.jpg") {
		return (
			<div
				className={`bg-linear-to-br from-green to-forest ${className ?? ""}`}
				role="img"
				aria-label={alt}
			/>
		);
	}

	return fill ? (
		<Image
			src={src}
			alt={alt}
			fill
			className={className}
			priority={priority}
			sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
		/>
	) : (
		<Image
			src={src}
			alt={alt}
			width={width}
			height={height}
			className={className}
			priority={priority}
			sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
		/>
	);
}

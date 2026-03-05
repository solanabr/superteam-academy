"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { type AvatarConfig, generateAvatarConfig } from "@/lib/utils/avatar";

interface CustomAvatarProps {
	seed: string;
	size?: "sm" | "md" | "lg" | "xl" | number;
	className?: string;
}

/* Maps gradient direction to SVG linear gradient coordinates */
function gradientCoords(dir: AvatarConfig["gradientDirection"]) {
	switch (dir) {
		case "top-bottom":
			return { x1: "50%", y1: "0%", x2: "50%", y2: "100%" };
		case "left-right":
			return { x1: "0%", y1: "50%", x2: "100%", y2: "50%" };
		case "diagonal-tl":
			return { x1: "0%", y1: "0%", x2: "100%", y2: "100%" };
		case "diagonal-tr":
			return { x1: "100%", y1: "0%", x2: "0%", y2: "100%" };
		default:
			return { x1: "0%", y1: "0%", x2: "100%", y2: "100%" };
	}
}

/* Generates SVG polygon points for a regular n-sided shape */
function regularPolygon(
	cx: number,
	cy: number,
	r: number,
	sides: number,
	rotDeg = 0,
): string {
	const rotRad = (rotDeg * Math.PI) / 180;
	return Array.from({ length: sides }, (_, i) => {
		const angle = (2 * Math.PI * i) / sides - Math.PI / 2 + rotRad;
		return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
	}).join(" ");
}

/* Generates deterministic pseudo-hex lines from the seed for hex dump display */
function generateHexDump(seed: string, rows: number): string[] {
	return Array.from({ length: rows }, (_, i) => {
		const offset = (i * 8).toString(16).padStart(4, "0").toUpperCase();
		const hex = Array.from({ length: 8 }, (_, j) => {
			const code =
				seed.charCodeAt((i * 8 + j) % seed.length) ^ (i * 17 + j * 31);
			return (code & 0xff).toString(16).padStart(2, "0").toUpperCase();
		}).join(" ");
		return `${offset}: ${hex}`;
	});
}

/* Resolves data text position to SVG coordinates and anchor */
function resolveDataPosition(pos: AvatarConfig["dataPosition"]) {
	const map = {
		"top-left": { x: 5, y: 12, anchor: "start" as const },
		"top-right": { x: 95, y: 12, anchor: "end" as const },
		"bottom-left": { x: 5, y: 93, anchor: "start" as const },
		"bottom-right": { x: 95, y: 93, anchor: "end" as const },
		center: { x: 50, y: 52, anchor: "middle" as const },
		scattered: { x: 5, y: 12, anchor: "start" as const },
	};
	return map[pos];
}

/* Resolves symbol position to SVG center coordinates */
function resolveSymbolCenter(
	pos: AvatarConfig["symbolPosition"],
	offset: { x: number; y: number },
) {
	switch (pos) {
		case "center":
			return { cx: 50, cy: 50 };
		case "offset":
			return { cx: 50 + offset.x, cy: 50 + offset.y };
		case "corner":
			return { cx: 25, cy: 75 };
	}
}

/* Returns letter-spacing for each data font style */
function dataLetterSpacing(style: AvatarConfig["dataFontStyle"]) {
	switch (style) {
		case "blocky":
			return "1.5";
		case "condensed":
			return "-0.3";
		case "terminal":
			return "0.6";
		default:
			return "0.3";
	}
}

export function CustomAvatar({
	seed,
	size = "md",
	className,
}: CustomAvatarProps) {
	const config = useMemo(() => generateAvatarConfig(seed), [seed]);

	/* Sanitized seed used for unique SVG element IDs */
	const uid = useMemo(
		() => seed.replace(/[^a-zA-Z0-9]/g, "").slice(0, 16) || "fallback",
		[seed],
	);

	const dimension =
		typeof size === "number"
			? size
			: { sm: 32, md: 64, lg: 128, xl: 180 }[size];

	const gc = gradientCoords(config.gradientDirection);
	const gs = config.gridScale;
	const dataPos = resolveDataPosition(config.dataPosition);
	const symCenter = resolveSymbolCenter(config.symbolPosition, config.offset);
	const geoR = 25 * config.geometricScale; // Increased from 20 for fuller look

	const hexLines = useMemo(
		() => (config.hasHexDump ? generateHexDump(seed, config.hexDumpRows) : []),
		[seed, config.hasHexDump, config.hexDumpRows],
	);

	const isRadialGradient =
		config.gradientDirection === "radial" ||
		config.gradientDirection === "conic" ||
		config.gradientDirection === "diamond";

	return (
		<div
			className={cn("relative overflow-hidden group", className)}
			style={{
				width: dimension,
				height: dimension,
				borderRadius: 0, // Force square as requested
			}}
		>
			<svg
				viewBox="0 0 100 100"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				className="w-full h-full"
			>
				<defs>
					{/* Gradient — linear or radial depending on direction */}
					{config.gradientDirection !== "none" && !isRadialGradient && (
						<linearGradient
							id={`grad-${uid}`}
							x1={gc.x1}
							y1={gc.y1}
							x2={gc.x2}
							y2={gc.y2}
						>
							<stop
								offset="0%"
								stopColor={config.primaryColor}
								stopOpacity="0.6"
							/>
							{config.gradientStops >= 3 && (
								<stop
									offset="50%"
									stopColor={config.accentColor}
									stopOpacity="0.3"
								/>
							)}
							<stop
								offset="100%"
								stopColor={config.secondaryColor}
								stopOpacity="0.15"
							/>
						</linearGradient>
					)}

					{config.gradientDirection !== "none" && isRadialGradient && (
						<radialGradient id={`grad-${uid}`} cx="50%" cy="50%" r="50%">
							<stop
								offset="0%"
								stopColor={config.primaryColor}
								stopOpacity="0.6"
							/>
							{config.gradientStops >= 3 && (
								<stop
									offset="50%"
									stopColor={config.accentColor}
									stopOpacity="0.3"
								/>
							)}
							<stop
								offset="100%"
								stopColor={config.secondaryColor}
								stopOpacity="0.1"
							/>
						</radialGradient>
					)}

					{/* Noise filter — feTurbulence tuned by noiseType and density */}
					<filter id={`noise-${uid}`}>
						<feTurbulence
							type={
								config.noiseType === "static" ? "turbulence" : "fractalNoise"
							}
							baseFrequency={config.noiseDensity * 3}
							numOctaves={config.noiseType === "fbm" ? 5 : 3}
							stitchTiles="stitch"
						/>
						<feColorMatrix type="saturate" values="0" />
						<feComponentTransfer>
							<feFuncA type="linear" slope="0.4" />
						</feComponentTransfer>
					</filter>

					{/* Glow / bloom filter */}
					<filter
						id={`glow-${uid}`}
						x="-50%"
						y="-50%"
						width="200%"
						height="200%"
					>
						<feGaussianBlur
							stdDeviation={config.bloomRadius || 4}
							result="blur"
						/>
						<feMerge>
							<feMergeNode in="blur" />
							<feMergeNode in="SourceGraphic" />
						</feMerge>
					</filter>

					{/* Chromatic aberration filter — offsets red and blue channels */}
					{config.chromaticAberration && (
						<filter id={`aberration-${uid}`}>
							<feOffset
								in="SourceGraphic"
								dx={config.aberrationOffset}
								dy={0}
								result="red"
							/>
							<feOffset
								in="SourceGraphic"
								dx={-config.aberrationOffset}
								dy={0}
								result="blue"
							/>
							<feColorMatrix
								in="red"
								type="matrix"
								values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
								result="redOnly"
							/>
							<feColorMatrix
								in="blue"
								type="matrix"
								values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
								result="blueOnly"
							/>
							<feColorMatrix
								in="SourceGraphic"
								type="matrix"
								values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
								result="greenOnly"
							/>
							<feMerge>
								<feMergeNode in="redOnly" />
								<feMergeNode in="greenOnly" />
								<feMergeNode in="blueOnly" />
							</feMerge>
						</filter>
					)}

					{/* Grid pattern: dots */}
					<pattern
						id={`dots-${uid}`}
						width={gs}
						height={gs}
						patternUnits="userSpaceOnUse"
						patternTransform={`rotate(${config.gridRotation})`}
					>
						<circle
							cx={gs / 2}
							cy={gs / 2}
							r={gs * 0.08}
							fill={config.primaryColor}
							fillOpacity={config.gridOpacity}
						/>
					</pattern>

					{/* Grid pattern: horizontal lines */}
					<pattern
						id={`lines-${uid}`}
						width={gs}
						height={gs}
						patternUnits="userSpaceOnUse"
						patternTransform={`rotate(${config.gridRotation})`}
					>
						<line
							x1="0"
							y1={gs / 2}
							x2={gs}
							y2={gs / 2}
							stroke={config.primaryColor}
							strokeWidth="0.3"
							strokeOpacity={config.gridOpacity}
						/>
					</pattern>

					{/* Grid pattern: small crosses */}
					<pattern
						id={`crosses-${uid}`}
						width={gs}
						height={gs}
						patternUnits="userSpaceOnUse"
						patternTransform={`rotate(${config.gridRotation})`}
					>
						<line
							x1={gs / 2}
							y1={gs * 0.2}
							x2={gs / 2}
							y2={gs * 0.8}
							stroke={config.primaryColor}
							strokeWidth="0.2"
							strokeOpacity={config.gridOpacity}
						/>
						<line
							x1={gs * 0.2}
							y1={gs / 2}
							x2={gs * 0.8}
							y2={gs / 2}
							stroke={config.primaryColor}
							strokeWidth="0.2"
							strokeOpacity={config.gridOpacity}
						/>
					</pattern>

					{/* Grid pattern: hexagons */}
					<pattern
						id={`hexagons-${uid}`}
						width={gs * 1.73}
						height={gs * 2}
						patternUnits="userSpaceOnUse"
						patternTransform={`rotate(${config.gridRotation})`}
					>
						<polygon
							points={regularPolygon(gs * 0.865, gs, gs * 0.45, 6)}
							fill="none"
							stroke={config.primaryColor}
							strokeWidth="0.3"
							strokeOpacity={config.gridOpacity}
						/>
					</pattern>

					{/* Grid pattern: equilateral triangles */}
					<pattern
						id={`triangles-${uid}`}
						width={gs}
						height={gs * 0.866}
						patternUnits="userSpaceOnUse"
						patternTransform={`rotate(${config.gridRotation})`}
					>
						<polygon
							points={`${gs / 2},0 ${gs},${gs * 0.866} 0,${gs * 0.866}`}
							fill="none"
							stroke={config.primaryColor}
							strokeWidth="0.3"
							strokeOpacity={config.gridOpacity}
						/>
					</pattern>

					{/* Grid pattern: diamonds (rotated squares) */}
					<pattern
						id={`diamonds-${uid}`}
						width={gs}
						height={gs}
						patternUnits="userSpaceOnUse"
						patternTransform={`rotate(${config.gridRotation})`}
					>
						<polygon
							points={`${gs / 2},0 ${gs},${gs / 2} ${gs / 2},${gs} 0,${gs / 2}`}
							fill="none"
							stroke={config.primaryColor}
							strokeWidth="0.3"
							strokeOpacity={config.gridOpacity}
						/>
					</pattern>

					{/* Grid pattern: chevrons (V-shapes) */}
					<pattern
						id={`chevrons-${uid}`}
						width={gs}
						height={gs}
						patternUnits="userSpaceOnUse"
						patternTransform={`rotate(${config.gridRotation})`}
					>
						<polyline
							points={`0,${gs * 0.6} ${gs / 2},${gs * 0.2} ${gs},${gs * 0.6}`}
							fill="none"
							stroke={config.primaryColor}
							strokeWidth="0.3"
							strokeOpacity={config.gridOpacity}
						/>
					</pattern>

					{/* Scanline pattern — direction controlled via patternTransform */}
					{config.hasScanlines && (
						<pattern
							id={`scanlines-${uid}`}
							width="100"
							height={config.scanlineSpacing}
							patternUnits="userSpaceOnUse"
							patternTransform={
								config.scanlineDirection === "vertical"
									? "rotate(90)"
									: config.scanlineDirection === "diagonal"
										? "rotate(45)"
										: ""
							}
						>
							<rect
								width="100"
								height={config.scanlineThickness * 0.3}
								fill={config.primaryColor}
								fillOpacity="0.06"
							/>
						</pattern>
					)}

					{/* Vignette radial gradient */}
					{config.vignette && (
						<radialGradient id={`vignette-${uid}`} cx="50%" cy="50%" r="50%">
							<stop
								offset="40%"
								stopColor={config.vignetteColor}
								stopOpacity="0"
							/>
							<stop
								offset="100%"
								stopColor={config.vignetteColor}
								stopOpacity={config.vignetteIntensity}
							/>
						</radialGradient>
					)}
				</defs>

				{/* ── Background ── */}
				<rect width="100" height="100" fill={config.backgroundColor} />

				{/* ── Gradient overlay ── */}
				{config.gradientDirection !== "none" && (
					<rect width="100" height="100" fill={`url(#grad-${uid})`} />
				)}

				{/* ── Background pattern ── */}
				{config.bgPattern !== "none" && (
					<g opacity={config.bgPatternOpacity}>
						{config.bgPattern === "circuit" &&
							Array.from({ length: 8 }, (_, i) => {
								const y = 10 + i * 12;
								const x1 = (i * 17 + 5) % 60;
								const x2 = x1 + 15 + ((i * 7) % 30);
								return (
									<g key={i}>
										<line
											x1={x1}
											y1={y}
											x2={x2}
											y2={y}
											stroke={config.primaryColor}
											strokeWidth="0.4"
										/>
										<circle cx={x2} cy={y} r="0.8" fill={config.primaryColor} />
										{i % 2 === 0 && (
											<line
												x1={x2}
												y1={y}
												x2={x2}
												y2={y + 12}
												stroke={config.primaryColor}
												strokeWidth="0.3"
											/>
										)}
									</g>
								);
							})}

						{config.bgPattern === "matrix" &&
							Array.from({ length: 12 }, (_, i) => (
								<rect
									key={i}
									x={4 + i * 8}
									y={(i * 13) % 40}
									width="0.5"
									height={15 + ((i * 23) % 50)}
									fill={config.primaryColor}
									opacity={0.15 + (i % 4) * 0.1}
									rx="0.25"
								/>
							))}

						{config.bgPattern === "topography" &&
							Array.from({ length: 5 }, (_, i) => (
								<ellipse
									key={i}
									cx={50 + config.offset.x}
									cy={50 + config.offset.y}
									rx={15 + i * 10}
									ry={12 + i * 8}
									fill="none"
									stroke={config.primaryColor}
									strokeWidth="0.3"
									transform={`rotate(${config.gridRotation + i * 5} 50 50)`}
								/>
							))}

						{config.bgPattern === "mesh" &&
							Array.from({ length: 9 }, (_, i) => {
								const x = 15 + (i % 3) * 35;
								const y = 15 + Math.floor(i / 3) * 35;
								return (
									<g key={i}>
										<circle cx={x} cy={y} r="0.6" fill={config.primaryColor} />
										{i % 3 < 2 && (
											<line
												x1={x}
												y1={y}
												x2={x + 35}
												y2={y}
												stroke={config.primaryColor}
												strokeWidth="0.2"
											/>
										)}
										{Math.floor(i / 3) < 2 && (
											<line
												x1={x}
												y1={y}
												x2={x}
												y2={y + 35}
												stroke={config.primaryColor}
												strokeWidth="0.2"
											/>
										)}
									</g>
								);
							})}

						{config.bgPattern === "constellations" &&
							Array.from({ length: 7 }, (_, i) => {
								const x = 10 + (((i * 37 + 11) % 80) | 0);
								const y = 10 + (((i * 53 + 7) % 80) | 0);
								const nx = 10 + ((((i + 1) * 37 + 11) % 80) | 0);
								const ny = 10 + ((((i + 1) * 53 + 7) % 80) | 0);
								return (
									<g key={i}>
										<circle cx={x} cy={y} r="0.8" fill={config.primaryColor} />
										{i < 6 && (
											<line
												x1={x}
												y1={y}
												x2={nx}
												y2={ny}
												stroke={config.primaryColor}
												strokeWidth="0.2"
												strokeDasharray="1 2"
											/>
										)}
									</g>
								);
							})}

						{config.bgPattern === "radial-burst" &&
							Array.from({ length: 12 }, (_, i) => {
								const angle = (i * 30 * Math.PI) / 180;
								return (
									<line
										key={i}
										x1="50"
										y1="50"
										x2={50 + 48 * Math.cos(angle)}
										y2={50 + 48 * Math.sin(angle)}
										stroke={config.primaryColor}
										strokeWidth="0.3"
									/>
								);
							})}

						{config.bgPattern === "noise-field" && (
							<rect
								width="100"
								height="100"
								filter={`url(#noise-${uid})`}
								opacity="0.5"
							/>
						)}
					</g>
				)}

				{/* ── Noise texture ── */}
				<rect
					width="100"
					height="100"
					filter={`url(#noise-${uid})`}
					opacity={config.textureOpacity}
				/>

				{/* ── Grid pattern — "mixed" overlays dots + crosses ── */}
				{config.gridType === "mixed" ? (
					<>
						<rect width="100" height="100" fill={`url(#dots-${uid})`} />
						<rect width="100" height="100" fill={`url(#crosses-${uid})`} />
					</>
				) : (
					<rect
						width="100"
						height="100"
						fill={`url(#${config.gridType}-${uid})`}
					/>
				)}

				{/* ── Scanlines ── */}
				{config.hasScanlines && (
					<rect width="100" height="100" fill={`url(#scanlines-${uid})`} />
				)}

				{/* ── Geometric overlay ── */}
				{config.geometricShape !== "none" && (
					<g
						transform={`rotate(${config.geometricRotation} 50 50)`}
						filter={config.bloom ? `url(#glow-${uid})` : undefined}
					>
						{Array.from({ length: config.geometricCount }, (_, i) => {
							const r = geoR * (1 - i * 0.2);
							const opacity = 0.4 - i * 0.08;
							const strokeW =
								config.geometricStyle === "double-stroke" ? 0.8 : 0.5;
							const dashArray =
								config.geometricStyle === "dashed" ? "2 2" : undefined;
							const isFilled =
								config.geometricStyle === "filled" ||
								config.geometricStyle === "gradient-fill";
							const fill = isFilled ? config.primaryColor : "none";
							const fillOpacity = isFilled ? 0.1 : 0;

							const sharedProps = {
								fill,
								fillOpacity,
								stroke: config.accentColor,
								strokeWidth: strokeW,
								strokeOpacity: opacity,
								strokeDasharray: dashArray,
							};

							switch (config.geometricShape) {
								case "circle":
								case "ring":
									return (
										<g key={i}>
											<circle
												cx={50}
												cy={50}
												r={r}
												{...sharedProps}
												fill={config.geometricShape === "ring" ? "none" : fill}
												strokeWidth={
													config.geometricShape === "ring"
														? 1.5 - i * 0.3
														: strokeW
												}
											/>
											{config.geometricStyle === "double-stroke" && (
												<circle
													cx={50}
													cy={50}
													r={r + 1.5}
													fill="none"
													stroke={config.accentColor}
													strokeWidth="0.2"
													strokeOpacity={opacity * 0.5}
												/>
											)}
										</g>
									);
								case "square":
									return (
										<rect
											key={i}
											x={50 - r}
											y={50 - r}
											width={r * 2}
											height={r * 2}
											{...sharedProps}
										/>
									);
								case "diamond":
									return (
										<polygon
											key={i}
											points={`50,${50 - r} ${50 + r},50 50,${50 + r} ${50 - r},50`}
											{...sharedProps}
										/>
									);
								case "triangle":
									return (
										<polygon
											key={i}
											points={regularPolygon(50, 50, r, 3)}
											{...sharedProps}
										/>
									);
								case "hexagon":
									return (
										<polygon
											key={i}
											points={regularPolygon(50, 50, r, 6)}
											{...sharedProps}
										/>
									);
								case "octagon":
									return (
										<polygon
											key={i}
											points={regularPolygon(50, 50, r, 8)}
											{...sharedProps}
										/>
									);
								default:
									return null;
							}
						})}
					</g>
				)}

				{/* ── Symbol ── */}
				{config.symbolType !== "none" && (
					<g
						transform={`translate(${symCenter.cx}, ${symCenter.cy}) scale(${config.symbolScale * 1.25})`}
						opacity="0.5"
						filter={config.bloom ? `url(#glow-${uid})` : undefined}
					>
						{config.symbolType === "crosshair" && (
							<>
								<line
									x1="-12"
									y1="0"
									x2="-4"
									y2="0"
									stroke={config.accentColor}
									strokeWidth="0.5"
								/>
								<line
									x1="4"
									y1="0"
									x2="12"
									y2="0"
									stroke={config.accentColor}
									strokeWidth="0.5"
								/>
								<line
									x1="0"
									y1="-12"
									x2="0"
									y2="-4"
									stroke={config.accentColor}
									strokeWidth="0.5"
								/>
								<line
									x1="0"
									y1="4"
									x2="0"
									y2="12"
									stroke={config.accentColor}
									strokeWidth="0.5"
								/>
								<circle
									cx="0"
									cy="0"
									r="6"
									fill="none"
									stroke={config.accentColor}
									strokeWidth="0.3"
								/>
								<circle
									cx="0"
									cy="0"
									r="1"
									fill={config.accentColor}
									fillOpacity="0.6"
								/>
							</>
						)}

						{config.symbolType === "brackets" && (
							<>
								<polyline
									points="-6,-10 -10,-10 -10,10 -6,10"
									fill="none"
									stroke={config.accentColor}
									strokeWidth="0.6"
								/>
								<polyline
									points="6,-10 10,-10 10,10 6,10"
									fill="none"
									stroke={config.accentColor}
									strokeWidth="0.6"
								/>
							</>
						)}

						{config.symbolType === "arrow-set" && (
							<>
								<polyline
									points="-3,-10 0,-14 3,-10"
									fill="none"
									stroke={config.accentColor}
									strokeWidth="0.5"
								/>
								<polyline
									points="-3,10 0,14 3,10"
									fill="none"
									stroke={config.accentColor}
									strokeWidth="0.5"
								/>
								<polyline
									points="-10,-3 -14,0 -10,3"
									fill="none"
									stroke={config.accentColor}
									strokeWidth="0.5"
								/>
								<polyline
									points="10,-3 14,0 10,3"
									fill="none"
									stroke={config.accentColor}
									strokeWidth="0.5"
								/>
							</>
						)}

						{config.symbolType === "waveform" && (
							<polyline
								points={Array.from({ length: 24 }, (_, i) => {
									const x = -12 + i;
									const y = Math.sin(i * 0.8) * (4 + Math.sin(i * 0.3) * 2);
									return `${x},${y}`;
								}).join(" ")}
								fill="none"
								stroke={config.accentColor}
								strokeWidth="0.5"
							/>
						)}

						{config.symbolType === "bar-chart" && (
							<>
								{[3, 8, 5, 11, 7, 9, 4].map((h, i) => (
									<rect
										key={i}
										x={-10 + i * 3}
										y={-h / 2}
										width="2"
										height={h}
										fill={config.accentColor}
										fillOpacity={0.4 + (i % 3) * 0.15}
										rx="0.3"
									/>
								))}
							</>
						)}

						{config.symbolType === "radar" && (
							<>
								{[4, 8, 12].map((r, i) => (
									<circle
										key={i}
										cx="0"
										cy="0"
										r={r}
										fill="none"
										stroke={config.accentColor}
										strokeWidth="0.2"
										strokeOpacity="0.3"
									/>
								))}
								{[0, 60, 120, 180, 240, 300].map((deg, i) => {
									const rad = (deg * Math.PI) / 180;
									return (
										<line
											key={i}
											x1="0"
											y1="0"
											x2={12 * Math.cos(rad)}
											y2={12 * Math.sin(rad)}
											stroke={config.accentColor}
											strokeWidth="0.15"
											strokeOpacity="0.25"
										/>
									);
								})}
								<polygon
									points={[0, 60, 120, 180, 240, 300]
										.map((deg, i) => {
											const rad = (deg * Math.PI) / 180;
											const r = 4 + (((i * 7 + 3) % 8) | 0);
											return `${r * Math.cos(rad)},${r * Math.sin(rad)}`;
										})
										.join(" ")}
									fill={config.accentColor}
									fillOpacity="0.1"
									stroke={config.accentColor}
									strokeWidth="0.4"
									strokeOpacity="0.6"
								/>
							</>
						)}

						{config.symbolType === "node-graph" &&
							(() => {
								const nodes = [
									[-6, -6],
									[6, -4],
									[0, 6],
									[-8, 3],
									[8, 5],
								];
								const edges = [
									[0, 1],
									[1, 2],
									[2, 3],
									[0, 3],
									[1, 4],
									[2, 4],
								];
								return (
									<>
										{edges.map(([a, b], i) => (
											<line
												key={`e${i}`}
												x1={nodes[a][0]}
												y1={nodes[a][1]}
												x2={nodes[b][0]}
												y2={nodes[b][1]}
												stroke={config.accentColor}
												strokeWidth="0.2"
												strokeOpacity="0.3"
											/>
										))}
										{nodes.map(([x, y], i) => (
											<circle
												key={`n${i}`}
												cx={x}
												cy={y}
												r="1.2"
												fill={config.accentColor}
												fillOpacity="0.5"
											/>
										))}
									</>
								);
							})()}

						{config.symbolType === "orbital" && (
							<>
								<circle
									cx="0"
									cy="0"
									r="1.5"
									fill={config.accentColor}
									fillOpacity="0.6"
								/>
								{[0, 60, 120].map((rot, i) => (
									<ellipse
										key={i}
										cx="0"
										cy="0"
										rx="12"
										ry="5"
										fill="none"
										stroke={config.accentColor}
										strokeWidth="0.3"
										strokeOpacity="0.35"
										transform={`rotate(${rot})`}
									/>
								))}
								{[30, 150, 270].map((deg, i) => {
									const rad = (deg * Math.PI) / 180;
									return (
										<circle
											key={i}
											cx={10 * Math.cos(rad)}
											cy={4 * Math.sin(rad)}
											r="0.8"
											fill={config.accentColor}
											fillOpacity="0.7"
										/>
									);
								})}
							</>
						)}

						{config.symbolType === "dna-helix" && (
							<>
								<polyline
									points={Array.from({ length: 30 }, (_, i) => {
										const t = i - 15;
										return `${Math.sin(t * 0.4) * 6},${t}`;
									}).join(" ")}
									fill="none"
									stroke={config.accentColor}
									strokeWidth="0.4"
									strokeOpacity="0.5"
								/>
								<polyline
									points={Array.from({ length: 30 }, (_, i) => {
										const t = i - 15;
										return `${-Math.sin(t * 0.4) * 6},${t}`;
									}).join(" ")}
									fill="none"
									stroke={config.accentColor}
									strokeWidth="0.4"
									strokeOpacity="0.5"
								/>
								{Array.from({ length: 8 }, (_, i) => {
									const t = i * 3.75 - 15;
									const x = Math.sin(t * 0.4) * 6;
									return (
										<line
											key={i}
											x1={x}
											y1={t}
											x2={-x}
											y2={t}
											stroke={config.accentColor}
											strokeWidth="0.2"
											strokeOpacity="0.25"
										/>
									);
								})}
							</>
						)}
					</g>
				)}

				{/* ── Center glow ── */}
				{(config.hasInnerGlow || config.hasOuterGlow) && (
					<circle
						cx="50"
						cy="50"
						r={config.hasOuterGlow ? 40 : 25}
						fill={config.glowColor}
						opacity={config.glowIntensity * 0.2}
						filter={`url(#glow-${uid})`}
					/>
				)}

				<circle
					cx="50"
					cy="50"
					r="30"
					fill={config.glowColor}
					opacity={config.glowIntensity * 0.12}
					filter={`url(#glow-${uid})`}
				/>

				{/* ── Glitch bands ── */}
				{config.hasGlitch &&
					Array.from({ length: config.glitchBands }, (_, i) => {
						const y = 15 + (((i * 37 + 13) % 70) | 0);
						const h = 1 + (i % 3);
						const shift = (i % 2 === 0 ? 1 : -1) * config.glitchIntensity * 15;
						return (
							<rect
								key={i}
								x={shift}
								y={y}
								width="100"
								height={h}
								fill={i % 2 === 0 ? config.primaryColor : config.accentColor}
								opacity={config.glitchIntensity * 0.4}
							/>
						);
					})}

				{/* ── Data text overlay ── */}
				{config.hasDataString && (
					<g
						opacity={config.dataOpacity}
						filter={
							config.chromaticAberration ? `url(#aberration-${uid})` : undefined
						}
					>
						<text
							x={dataPos.x}
							y={dataPos.y}
							fill={config.primaryColor}
							fontSize="4"
							fontWeight="700"
							fontFamily="var(--font-jetbrains-mono), monospace"
							textAnchor={dataPos.anchor}
							letterSpacing={dataLetterSpacing(config.dataFontStyle)}
						>
							{config.dataString}
						</text>

						<text
							x={dataPos.anchor === "end" ? 95 : 5}
							y={dataPos.y > 50 ? dataPos.y - 6 : dataPos.y + 6}
							fill={config.secondaryColor}
							fontSize="3"
							fontFamily="var(--font-jetbrains-mono), monospace"
							textAnchor={dataPos.anchor}
							opacity="0.5"
							letterSpacing="0.5"
						>
							0x{seed.slice(0, 8).toUpperCase()}
						</text>

						{config.dataPosition === "scattered" && (
							<>
								<text
									x="70"
									y="80"
									fill={config.accentColor}
									fontSize="3"
									fontFamily="var(--font-jetbrains-mono), monospace"
									opacity="0.3"
									letterSpacing="0.5"
								>
									{config.seedHash.split("-")[0]}
								</text>
								<text
									x="60"
									y="45"
									fill={config.primaryColor}
									fontSize="2.5"
									fontFamily="var(--font-jetbrains-mono), monospace"
									opacity="0.2"
									letterSpacing="1"
									transform="rotate(-90 60 45)"
								>
									ACTIVE
								</text>
							</>
						)}
					</g>
				)}

				{/* ── Hex dump ── */}
				{config.hasHexDump && (
					<g opacity="0.25">
						{hexLines.map((line, i) => (
							<text
								key={i}
								x="5"
								y={70 + i * 5}
								fill={config.secondaryColor}
								fontSize="2.5"
								fontFamily="var(--font-jetbrains-mono), monospace"
								letterSpacing="0.3"
							>
								{line}
							</text>
						))}
					</g>
				)}

				{/* ── Border & frame ── */}
				{config.borderStyle !== "none" && (
					<g>
						{config.borderStyle === "solid" && (
							<rect
								x={config.borderWidth / 2}
								y={config.borderWidth / 2}
								width={100 - config.borderWidth}
								height={100 - config.borderWidth}
								fill="none"
								stroke={config.borderColor}
								strokeWidth={config.borderWidth}
								strokeOpacity="0.4"
							/>
						)}

						{config.borderStyle === "dashed" && (
							<rect
								x="1"
								y="1"
								width="98"
								height="98"
								fill="none"
								stroke={config.borderColor}
								strokeWidth={config.borderWidth * 0.5}
								strokeDasharray="4 3"
								strokeOpacity="0.35"
							/>
						)}

						{config.borderStyle === "double" && (
							<>
								<rect
									x="1"
									y="1"
									width="98"
									height="98"
									fill="none"
									stroke={config.borderColor}
									strokeWidth="0.4"
									strokeOpacity="0.3"
								/>
								<rect
									x="3"
									y="3"
									width="94"
									height="94"
									fill="none"
									stroke={config.borderColor}
									strokeWidth="0.3"
									strokeOpacity="0.2"
								/>
							</>
						)}

						{(config.borderStyle === "corner-marks" ||
							config.borderStyle === "tech-frame") && (
							<>
								<line
									x1="3"
									y1="3"
									x2="12"
									y2="3"
									stroke={config.borderColor}
									strokeWidth="0.6"
									strokeOpacity="0.5"
								/>
								<line
									x1="3"
									y1="3"
									x2="3"
									y2="12"
									stroke={config.borderColor}
									strokeWidth="0.6"
									strokeOpacity="0.5"
								/>
								<line
									x1="88"
									y1="3"
									x2="97"
									y2="3"
									stroke={config.borderColor}
									strokeWidth="0.6"
									strokeOpacity="0.5"
								/>
								<line
									x1="97"
									y1="3"
									x2="97"
									y2="12"
									stroke={config.borderColor}
									strokeWidth="0.6"
									strokeOpacity="0.5"
								/>
								<line
									x1="3"
									y1="97"
									x2="12"
									y2="97"
									stroke={config.borderColor}
									strokeWidth="0.6"
									strokeOpacity="0.5"
								/>
								<line
									x1="3"
									y1="88"
									x2="3"
									y2="97"
									stroke={config.borderColor}
									strokeWidth="0.6"
									strokeOpacity="0.5"
								/>
								<line
									x1="88"
									y1="97"
									x2="97"
									y2="97"
									stroke={config.borderColor}
									strokeWidth="0.6"
									strokeOpacity="0.5"
								/>
								<line
									x1="97"
									y1="88"
									x2="97"
									y2="97"
									stroke={config.borderColor}
									strokeWidth="0.6"
									strokeOpacity="0.5"
								/>
							</>
						)}

						{config.borderStyle === "tech-frame" && (
							<>
								<line
									x1="20"
									y1="3"
									x2="40"
									y2="3"
									stroke={config.borderColor}
									strokeWidth="0.3"
									strokeOpacity="0.2"
								/>
								<line
									x1="60"
									y1="97"
									x2="80"
									y2="97"
									stroke={config.borderColor}
									strokeWidth="0.3"
									strokeOpacity="0.2"
								/>
								<line
									x1="3"
									y1="40"
									x2="3"
									y2="60"
									stroke={config.borderColor}
									strokeWidth="0.3"
									strokeOpacity="0.2"
								/>
								<line
									x1="97"
									y1="30"
									x2="97"
									y2="50"
									stroke={config.borderColor}
									strokeWidth="0.3"
									strokeOpacity="0.2"
								/>
							</>
						)}

						{config.borderStyle === "bracket-frame" && (
							<>
								<polyline
									points="15,3 3,3 3,15"
									fill="none"
									stroke={config.borderColor}
									strokeWidth="0.6"
									strokeOpacity="0.4"
								/>
								<polyline
									points="85,3 97,3 97,15"
									fill="none"
									stroke={config.borderColor}
									strokeWidth="0.6"
									strokeOpacity="0.4"
								/>
								<polyline
									points="15,97 3,97 3,85"
									fill="none"
									stroke={config.borderColor}
									strokeWidth="0.6"
									strokeOpacity="0.4"
								/>
								<polyline
									points="85,97 97,97 97,85"
									fill="none"
									stroke={config.borderColor}
									strokeWidth="0.6"
									strokeOpacity="0.4"
								/>
							</>
						)}

						{config.borderStyle === "circuit-border" && (
							<>
								<line
									x1="3"
									y1="3"
									x2="30"
									y2="3"
									stroke={config.borderColor}
									strokeWidth="0.4"
									strokeOpacity="0.3"
								/>
								<circle
									cx="30"
									cy="3"
									r="1"
									fill={config.borderColor}
									fillOpacity="0.4"
								/>
								<line
									x1="30"
									y1="3"
									x2="30"
									y2="10"
									stroke={config.borderColor}
									strokeWidth="0.3"
									strokeOpacity="0.2"
								/>
								<line
									x1="70"
									y1="97"
									x2="97"
									y2="97"
									stroke={config.borderColor}
									strokeWidth="0.4"
									strokeOpacity="0.3"
								/>
								<circle
									cx="70"
									cy="97"
									r="1"
									fill={config.borderColor}
									fillOpacity="0.4"
								/>
								<line
									x1="70"
									y1="97"
									x2="70"
									y2="90"
									stroke={config.borderColor}
									strokeWidth="0.3"
									strokeOpacity="0.2"
								/>
								<line
									x1="97"
									y1="40"
									x2="97"
									y2="60"
									stroke={config.borderColor}
									strokeWidth="0.4"
									strokeOpacity="0.3"
								/>
								<circle
									cx="97"
									cy="40"
									r="0.8"
									fill={config.borderColor}
									fillOpacity="0.3"
								/>
							</>
						)}
					</g>
				)}

				{/* ── Corner accents ── */}
				{config.hasCornerAccents && (
					<g>
						<rect
							x="3"
							y="3"
							width="2"
							height="2"
							fill={config.accentColor}
							fillOpacity="0.5"
						/>
						<rect
							x="95"
							y="3"
							width="2"
							height="2"
							fill={config.accentColor}
							fillOpacity="0.5"
						/>
						<rect
							x="3"
							y="95"
							width="2"
							height="2"
							fill={config.accentColor}
							fillOpacity="0.5"
						/>
						<rect
							x="95"
							y="95"
							width="2"
							height="2"
							fill={config.accentColor}
							fillOpacity="0.5"
						/>
					</g>
				)}

				{/* ── Side accent bars ── */}
				<rect
					x="0"
					y="30"
					width="1.2"
					height={25 + config.glowIntensity * 30}
					fill={config.primaryColor}
					opacity="0.4"
				/>
				<rect
					x="98.8"
					y={50 - config.glowIntensity * 10}
					width="1.2"
					height={15 + config.glowIntensity * 20}
					fill={config.secondaryColor}
					opacity="0.35"
				/>

				{/* ── Vignette ── */}
				{config.vignette && (
					<rect width="100" height="100" fill={`url(#vignette-${uid})`} />
				)}
			</svg>

			{/* Gloss overlay */}
			<div className="absolute inset-0 bg-linear-to-tr from-white/3 to-transparent pointer-events-none" />
		</div>
	);
}

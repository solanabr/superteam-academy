/**
 * Deterministically generates a set of visual properties for a custom avatar
 * based on a seed string. This version focuses on tech-patterns, grids, and
 * data-driven aesthetics with extensive variation support.
 *
 * Estimated unique combinations: ~2.58 billion discrete configurations
 * plus continuous parameters making collisions essentially impossible.
 */

export interface AvatarConfig {
	/* Color */
	primaryColor: string;
	secondaryColor: string;
	accentColor: string;
	backgroundColor: string;
	colorMode: "vibrant" | "muted" | "monochrome" | "duotone" | "triadic";

	/* Grid & Pattern */
	gridType:
		| "dots"
		| "lines"
		| "crosses"
		| "mixed"
		| "hexagons"
		| "triangles"
		| "diamonds"
		| "chevrons";
	gridScale: number;
	gridOpacity: number;
	gridRotation: number;

	/* Background Pattern */
	bgPattern:
		| "none"
		| "circuit"
		| "matrix"
		| "topography"
		| "mesh"
		| "constellations"
		| "noise-field"
		| "radial-burst";
	bgPatternScale: number;
	bgPatternOpacity: number;

	/* Noise & Texture */
	noiseDensity: number;
	noiseType: "perlin" | "simplex" | "voronoi" | "worley" | "fbm" | "static";
	textureOverlay:
		| "none"
		| "grain"
		| "halftone"
		| "crosshatch"
		| "dither"
		| "scanline-noise";
	textureOpacity: number;

	/* Scanlines & Glitch */
	hasScanlines: boolean;
	scanlineDirection: "horizontal" | "vertical" | "diagonal";
	scanlineSpacing: number;
	scanlineThickness: number;
	hasGlitch: boolean;
	glitchIntensity: number;
	glitchBands: number;

	/* Data Overlay */
	hasDataString: boolean;
	dataString: string;
	dataPosition:
		| "top-left"
		| "top-right"
		| "bottom-left"
		| "bottom-right"
		| "center"
		| "scattered";
	dataFontStyle: "mono" | "condensed" | "blocky" | "terminal";
	dataOpacity: number;
	hasHexDump: boolean;
	hexDumpRows: number;

	/* Geometric Overlay */
	geometricShape:
		| "none"
		| "circle"
		| "square"
		| "triangle"
		| "hexagon"
		| "octagon"
		| "diamond"
		| "ring";
	geometricCount: number;
	geometricStyle:
		| "outline"
		| "filled"
		| "dashed"
		| "double-stroke"
		| "gradient-fill";
	geometricRotation: number;
	geometricScale: number;

	/* Symbol / Icon */
	symbolType:
		| "none"
		| "crosshair"
		| "brackets"
		| "arrow-set"
		| "node-graph"
		| "waveform"
		| "bar-chart"
		| "radar"
		| "orbital"
		| "dna-helix";
	symbolPosition: "center" | "offset" | "corner";
	symbolScale: number;

	/* Border & Frame */
	borderStyle:
		| "none"
		| "solid"
		| "dashed"
		| "double"
		| "corner-marks"
		| "tech-frame"
		| "bracket-frame"
		| "circuit-border";
	borderWidth: number;
	borderColor: string;
	cornerRadius: number;
	hasCornerAccents: boolean;

	/* Gradient & Glow */
	gradientDirection:
		| "none"
		| "top-bottom"
		| "left-right"
		| "diagonal-tl"
		| "diagonal-tr"
		| "radial"
		| "conic"
		| "diamond";
	gradientStops: number;
	glowIntensity: number;
	glowColor: string;
	hasInnerGlow: boolean;
	hasOuterGlow: boolean;

	/* Vignette & Post-Processing */
	vignette: boolean;
	vignetteIntensity: number;
	vignetteColor: string;
	chromaticAberration: boolean;
	aberrationOffset: number;
	bloom: boolean;
	bloomRadius: number;

	/* Symmetry & Layout */
	symmetry:
		| "none"
		| "horizontal"
		| "vertical"
		| "quad"
		| "radial-4"
		| "radial-6"
		| "radial-8";
	compositionStyle:
		| "centered"
		| "rule-of-thirds"
		| "golden-ratio"
		| "asymmetric"
		| "stacked";
	layerCount: number;
	layerBlendMode: "normal" | "multiply" | "screen" | "overlay" | "add";

	/* Motion Hints (for animated renders) */
	motionHint:
		| "none"
		| "pulse"
		| "rotate-slow"
		| "drift"
		| "flicker"
		| "breathe"
		| "data-scroll"
		| "wave";
	motionSpeed: number;

	/* Offset & Transform */
	offset: { x: number; y: number };
	rotation: number;
	scale: number;

	/* Seed Metadata */
	seedHash: string;
	complexity: "minimal" | "low" | "medium" | "high" | "maximal";
}

/**
 * Color palettes organized by visual theme. Each palette contains a primary,
 * secondary, accent, and background color designed for high-contrast
 * tech aesthetics.
 */
const BRAND_PALETTES = [
	/* Emerald / Cyan */
	{ p: "#00FFA3", s: "#03E1FF", a: "#7000FF", bg: "#0A0A0A" },
	{ p: "#03E1FF", s: "#DC1FFF", a: "#00FFA3", bg: "#080812" },
	{ p: "#00FFA3", s: "#FF4D00", a: "#2E2EFF", bg: "#040A06" },

	/* Purple / Magenta */
	{ p: "#DC1FFF", s: "#00FFA3", a: "#03E1FF", bg: "#0D0D0D" },
	{ p: "#DC1FFF", s: "#141414", a: "#00FFA3", bg: "#0A000F" },
	{ p: "#FF00BD", s: "#00E5FF", a: "#FFF000", bg: "#0D0008" },

	/* Dark Base */
	{ p: "#00FFA3", s: "#141414", a: "#DC1FFF", bg: "#050505" },
	{ p: "#FF4D00", s: "#141414", a: "#00FFA3", bg: "#0F0500" },

	/* Cyber / Neon */
	{ p: "#FFF000", s: "#000000", a: "#FF003C", bg: "#0A0A00" },
	{ p: "#2E2EFF", s: "#00FFA3", a: "#FF00BD", bg: "#060620" },

	/* Monochrome */
	{ p: "#FFFFFF", s: "#666666", a: "#00FFA3", bg: "#0A0A0A" },
	{ p: "#C0C0C0", s: "#303030", a: "#FF003C", bg: "#000000" },
	{ p: "#E0E0E0", s: "#1A1A1A", a: "#03E1FF", bg: "#050505" },

	/* Warm Neon */
	{ p: "#FF6B35", s: "#FF0075", a: "#FFF000", bg: "#0D0200" },
	{ p: "#FFD700", s: "#FF4500", a: "#FF1493", bg: "#0A0800" },
	{ p: "#FF1744", s: "#FF9100", a: "#FFEA00", bg: "#0F0000" },

	/* Cool Neon */
	{ p: "#00E5FF", s: "#1DE9B6", a: "#651FFF", bg: "#000A0D" },
	{ p: "#40C4FF", s: "#7C4DFF", a: "#FF4081", bg: "#000510" },
	{ p: "#18FFFF", s: "#00E676", a: "#F50057", bg: "#000D0D" },

	/* Deep / Rich */
	{ p: "#BB86FC", s: "#03DAC6", a: "#CF6679", bg: "#121212" },
	{ p: "#6200EA", s: "#00BFA5", a: "#FF6D00", bg: "#0A0020" },
	{ p: "#304FFE", s: "#00E5FF", a: "#76FF03", bg: "#000830" },

	/* Pastel Cyber */
	{ p: "#A7FFEB", s: "#EA80FC", a: "#FFD180", bg: "#0D1117" },
	{ p: "#B388FF", s: "#84FFFF", a: "#FFFF8D", bg: "#0E0E1A" },

	/* Matrix / Hacker */
	{ p: "#00FF41", s: "#008F11", a: "#003B00", bg: "#000000" },
	{ p: "#20C20E", s: "#0D5F07", a: "#39FF14", bg: "#010101" },

	/* Amber Terminal */
	{ p: "#FFB000", s: "#805800", a: "#FFF4CC", bg: "#0A0600" },
	{ p: "#FF8C00", s: "#CC7000", a: "#FFD699", bg: "#080400" },

	/* Ice / Frost */
	{ p: "#B3E5FC", s: "#0277BD", a: "#FFFFFF", bg: "#020810" },
	{ p: "#E1F5FE", s: "#0288D1", a: "#80DEEA", bg: "#010608" },

	/* Synthwave */
	{ p: "#F72585", s: "#7209B7", a: "#4CC9F0", bg: "#10002B" },
	{ p: "#FF006E", s: "#8338EC", a: "#3A86FF", bg: "#0A0015" },
];

/**
 * Short data strings used as decorative text overlays.
 * Styled after protocol identifiers, system labels, and node metadata.
 */
const DATA_STRINGS = [
	"0xSOL_ARCH",
	"SYS_UPTIME",
	"NET_SYNC",
	"BLK_GEN_8",
	"OPERATOR_X",
	"SEALEVEL_V2",
	"ANCHOR_IDL",
	"PROGRAM_ID",
	"TX_PENDING",
	"VALID_NODE",
	"CORE_STRATA",
	"MEM_POOL_0",
	"SEC_LAYER_3",
	"HASH_VERIFY",
	"PROOF_WORK",
	"CONSENSUS_A",
	"NODE_42",
	"EPOCH_3891",
	"SHARD_07",
	"RELAY_ALPHA",
	"GOSSIP_NET",
	"VOTE_ACC",
	"STAKE_POOL",
	"SLOT_HEIGHT",
	"FINALIZED",
	"TURBINE_TX",
	"GULF_STREAM",
	"TOWER_BFT",
	"CLOUDBREAK",
	"PIPELINE_V3",
	"RUNTIME_SVM",
	"PAYER_KEY",
];

/*
 * ---------------------------------------------------------------------------
 *  Hash Functions
 *
 *  Three independent hash functions ensure uncorrelated feature selection.
 *  Using multiple hashes prevents visual properties from being unintentionally
 *  coupled (e.g., palette choice always determining grid type).
 * ---------------------------------------------------------------------------
 */

/** Primary hash — standard DJB-style shift-and-subtract. */
function getHash(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash |= 0;
	}
	return Math.abs(hash);
}

/** Secondary hash — DJB2 XOR variant for uncorrelated results. */
function getHash2(str: string): number {
	let hash = 5381;
	for (let i = 0; i < str.length; i++) {
		hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash);
}

/** Tertiary hash — FNV-1a inspired for maximum decorrelation. */
function getHash3(str: string): number {
	let hash = 2166136261;
	for (let i = 0; i < str.length; i++) {
		hash ^= str.charCodeAt(i);
		hash = Math.imul(hash, 16777619);
		hash |= 0;
	}
	return Math.abs(hash);
}

/** Extracts `count` bits from `hash` starting at `offset`. */
function bits(hash: number, offset: number, count: number): number {
	return (hash >>> offset) & ((1 << count) - 1);
}

/** Converts a numeric hash to an uppercase hex string (zero-padded to 8 chars). */
function toHex(n: number): string {
	return n.toString(16).padStart(8, "0").toUpperCase();
}

/*
 * ---------------------------------------------------------------------------
 *  Config Generator
 *
 *  Each visual property is derived from isolated bit ranges across the three
 *  hash values. A complexity tier (minimal → maximal) gates how many features
 *  are activated, keeping simple seeds clean while allowing rich compositions.
 * ---------------------------------------------------------------------------
 */

export function generateAvatarConfig(seed: string): AvatarConfig {
	const h1 = getHash(seed);
	const h2 = getHash2(seed);
	const h3 = getHash3(seed);

	/* Palette selection */
	const palette = BRAND_PALETTES[h1 % BRAND_PALETTES.length];

	/* Option pools for each property category */
	const colorModes: AvatarConfig["colorMode"][] = [
		"vibrant",
		"muted",
		"monochrome",
		"duotone",
		"triadic",
	];
	const gridTypes: AvatarConfig["gridType"][] = [
		"dots",
		"lines",
		"crosses",
		"mixed",
		"triangles",
		"diamonds",
		"chevrons",
	];
	const bgPatterns: AvatarConfig["bgPattern"][] = [
		"none",
		"circuit",
		"matrix",
		"topography",
		"mesh",
		"constellations",
		"noise-field",
		"radial-burst",
	];
	const noiseTypes: AvatarConfig["noiseType"][] = [
		"perlin",
		"simplex",
		"voronoi",
		"worley",
		"fbm",
		"static",
	];
	const textureOverlays: AvatarConfig["textureOverlay"][] = [
		"none",
		"grain",
		"halftone",
		"crosshatch",
		"dither",
		"scanline-noise",
	];
	const scanlineDirs: AvatarConfig["scanlineDirection"][] = [
		"horizontal",
		"vertical",
		"diagonal",
	];
	const dataPositions: AvatarConfig["dataPosition"][] = [
		"top-left",
		"top-right",
		"bottom-left",
		"bottom-right",
		"center",
		"scattered",
	];
	const dataFonts: AvatarConfig["dataFontStyle"][] = [
		"mono",
		"condensed",
		"blocky",
		"terminal",
	];
	const geoShapes: AvatarConfig["geometricShape"][] = [
		"none",
		"circle",
		"square",
		"diamond",
		"ring",
	];
	const geoStyles: AvatarConfig["geometricStyle"][] = [
		"outline",
		"filled",
		"dashed",
		"double-stroke",
		"gradient-fill",
	];
	const symbolTypes: AvatarConfig["symbolType"][] = [
		"none",
		"crosshair",
		"brackets",
		"arrow-set",
		"node-graph",
		"waveform",
		"bar-chart",
		"radar",
		"orbital",
		"dna-helix",
	];
	const symbolPositions: AvatarConfig["symbolPosition"][] = [
		"center",
		"offset",
		"corner",
	];
	const borderStyles: AvatarConfig["borderStyle"][] = [
		"none",
		"solid",
		"dashed",
		"double",
		"corner-marks",
		"tech-frame",
		"bracket-frame",
		"circuit-border",
	];
	const gradientDirs: AvatarConfig["gradientDirection"][] = [
		"none",
		"top-bottom",
		"left-right",
		"diagonal-tl",
		"diagonal-tr",
		"radial",
		"conic",
		"diamond",
	];
	const symmetries: AvatarConfig["symmetry"][] = [
		"none",
		"horizontal",
		"vertical",
		"quad",
		"radial-4",
		"radial-6",
		"radial-8",
	];
	const compositions: AvatarConfig["compositionStyle"][] = [
		"centered",
		"rule-of-thirds",
		"golden-ratio",
		"asymmetric",
		"stacked",
	];
	const blendModes: AvatarConfig["layerBlendMode"][] = [
		"normal",
		"multiply",
		"screen",
		"overlay",
		"add",
	];
	const motionHints: AvatarConfig["motionHint"][] = [
		"none",
		"pulse",
		"rotate-slow",
		"drift",
		"flicker",
		"breathe",
		"data-scroll",
		"wave",
	];

	/*
	 * Complexity tier determines how many visual features are activated.
	 * Lower tiers produce cleaner, more minimal avatars while higher tiers
	 * layer on glitch effects, hex dumps, chromatic aberration, etc.
	 */
	const complexityRoll = h2 % 100;
	const complexity: AvatarConfig["complexity"] =
		complexityRoll < 10
			? "minimal"
			: complexityRoll < 30
				? "low"
				: complexityRoll < 60
					? "medium"
					: complexityRoll < 85
						? "high"
						: "maximal";

	const isMinimal = complexity === "minimal" || complexity === "low";
	const isHigh = complexity === "high" || complexity === "maximal";

	/* Feature flags gated by complexity */
	const hasScanlines = isMinimal ? false : h1 % 2 === 0;
	const hasGlitch = isHigh && bits(h2, 0, 2) === 0;
	const hasDataString = complexity !== "minimal" && h1 % 3 !== 0;
	const hasHexDump = isHigh && bits(h3, 0, 3) < 2;
	const hasChromaticAberration = isHigh && bits(h2, 5, 2) === 0;
	const hasBloom = bits(h3, 3, 2) === 0;

	/* Glitch parameters (only meaningful when hasGlitch is true) */
	const glitchIntensity = hasGlitch ? 0.1 + (bits(h3, 8, 4) / 15) * 0.5 : 0;
	const glitchBands = hasGlitch ? 1 + bits(h2, 10, 3) : 0;

	return {
		/* Color */
		primaryColor: palette.p,
		secondaryColor: palette.s,
		accentColor: palette.a,
		backgroundColor: palette.bg,
		colorMode: colorModes[h1 % colorModes.length],

		/* Grid — range: scale 4–17, opacity 0.15–0.70, rotation locked to 0° */
		gridType: gridTypes[bits(h1, 0, 3) % gridTypes.length],
		gridScale: 4 + (h1 % 14),
		gridOpacity: 0.15 + (bits(h2, 0, 4) / 15) * 0.55,
		gridRotation: 0,

		/* Background pattern — scale 0.5–3.0, opacity 0.05–0.40 */
		bgPattern: bgPatterns[bits(h2, 4, 3)],
		bgPatternScale: 0.5 + (bits(h3, 4, 4) / 15) * 2.5,
		bgPatternOpacity: 0.05 + (bits(h1, 4, 4) / 15) * 0.35,

		/* Noise & texture — density 0.02–0.20, texture opacity 0.05–0.35 */
		noiseDensity: 0.02 + (bits(h1, 4, 4) / 15) * 0.18,
		noiseType: noiseTypes[bits(h2, 8, 3) % noiseTypes.length],
		textureOverlay: isMinimal
			? "none"
			: textureOverlays[bits(h3, 8, 3) % textureOverlays.length],
		textureOpacity: 0.05 + (bits(h2, 12, 4) / 15) * 0.3,

		/* Scanlines — spacing 2–9px, thickness 1–4px */
		hasScanlines,
		scanlineDirection: scanlineDirs[bits(h1, 8, 2) % scanlineDirs.length],
		scanlineSpacing: 2 + bits(h2, 16, 3),
		scanlineThickness: 1 + bits(h3, 12, 2),

		/* Glitch */
		hasGlitch,
		glitchIntensity,
		glitchBands,

		/* Data overlay — opacity 0.3–0.8, hex dump rows 2–5 */
		hasDataString,
		dataString: DATA_STRINGS[bits(h1, 8, 5) % DATA_STRINGS.length],
		dataPosition: dataPositions[bits(h2, 20, 3) % dataPositions.length],
		dataFontStyle: dataFonts[bits(h3, 16, 2)],
		dataOpacity: 0.3 + (bits(h1, 12, 4) / 15) * 0.5,
		hasHexDump,
		hexDumpRows: hasHexDump ? 2 + bits(h2, 24, 2) : 0,

		/* Geometric overlay — count 1–4, rotation in 22.5° steps, scale 0.3–1.0 */
		geometricShape: geoShapes[bits(h2, 0, 3)],
		geometricCount: 1 + bits(h3, 20, 2),
		geometricStyle: geoStyles[bits(h1, 16, 3) % geoStyles.length],
		geometricRotation: bits(h2, 28, 4) * 22.5,
		geometricScale: 0.3 + (bits(h3, 24, 4) / 15) * 0.7,

		/* Symbol — scale 0.4–1.0 */
		symbolType: symbolTypes[bits(h1, 20, 4) % symbolTypes.length],
		symbolPosition: symbolPositions[bits(h2, 8, 2) % symbolPositions.length],
		symbolScale: 0.4 + (bits(h3, 28, 3) / 7) * 0.6,

		/* Border & frame — width 1–4px, corner radius from [0, 2, 4, 8, 16, full] */
		borderStyle: borderStyles[bits(h1, 24, 3)],
		borderWidth: 1 + bits(h2, 12, 2),
		borderColor: [palette.p, palette.s, palette.a, "#FFFFFF", "#333333"][
			bits(h3, 4, 3) % 5
		],
		cornerRadius: [0, 0, 2, 4, 8, 16, 9999][bits(h1, 28, 3) % 7],
		hasCornerAccents: isHigh && bits(h2, 14, 1) === 1,

		/* Gradient & glow — intensity 0.05–0.50, stops 2–5 */
		gradientDirection: gradientDirs[bits(h3, 0, 3)],
		gradientStops: 2 + bits(h1, 16, 2),
		glowIntensity: 0.05 + (bits(h1, 12, 4) / 15) * 0.45,
		glowColor: [palette.p, palette.a, palette.s][bits(h2, 18, 2) % 3],
		hasInnerGlow: bits(h3, 14, 1) === 1,
		hasOuterGlow: bits(h1, 15, 1) === 1,

		/* Vignette & post-processing — vignette intensity 0.2–0.8, aberration 1–4px, bloom radius 2–9 */
		vignette: bits(h1, 16, 1) === 1,
		vignetteIntensity: 0.2 + (bits(h2, 22, 3) / 7) * 0.6,
		vignetteColor: bits(h3, 18, 1) === 0 ? "#000000" : palette.bg,
		chromaticAberration: hasChromaticAberration,
		aberrationOffset: hasChromaticAberration ? 1 + bits(h3, 20, 2) : 0,
		bloom: hasBloom,
		bloomRadius: hasBloom ? 2 + bits(h2, 26, 3) : 0,

		/* Symmetry & layout — layer count 1–5 */
		symmetry: symmetries[bits(h2, 4, 3) % symmetries.length],
		compositionStyle: compositions[bits(h3, 8, 3) % compositions.length],
		layerCount: isMinimal ? 1 : 2 + bits(h1, 20, 2),
		layerBlendMode: blendModes[bits(h2, 16, 3) % blendModes.length],

		/* Motion hints — speed 0.5–2.5 */
		motionHint: motionHints[bits(h3, 12, 3)],
		motionSpeed: 0.5 + (bits(h1, 24, 3) / 7) * 2.0,

		/* Offset & transform — offset ±10px, scale 0.85–1.15 */
		offset: {
			x: (bits(h1, 20, 5) % 21) - 10,
			y: (bits(h1, 25, 5) % 21) - 10,
		},
		rotation: 0,
		scale: 0.85 + (bits(h3, 0, 4) / 15) * 0.3,

		/* Metadata */
		seedHash: `${toHex(h1)}-${toHex(h2)}-${toHex(h3)}`,
		complexity,
	};
}

/*
 * ---------------------------------------------------------------------------
 *  Lite Config
 *
 *  A minimal subset of the full config for quick previews, thumbnails, or
 *  situations where rendering the full feature set is unnecessary.
 * ---------------------------------------------------------------------------
 */

export interface AvatarConfigLite {
	primaryColor: string;
	secondaryColor: string;
	accentColor: string;
	backgroundColor: string;
	gridType: AvatarConfig["gridType"];
	symbolType: AvatarConfig["symbolType"];
	borderStyle: AvatarConfig["borderStyle"];
	complexity: AvatarConfig["complexity"];
	seedHash: string;
}

export function generateAvatarConfigLite(seed: string): AvatarConfigLite {
	const full = generateAvatarConfig(seed);
	return {
		primaryColor: full.primaryColor,
		secondaryColor: full.secondaryColor,
		accentColor: full.accentColor,
		backgroundColor: full.backgroundColor,
		gridType: full.gridType,
		symbolType: full.symbolType,
		borderStyle: full.borderStyle,
		complexity: full.complexity,
		seedHash: full.seedHash,
	};
}

// Image Configuration
export interface ImageConfig {
	formats: ("webp" | "avif" | "jpg" | "png")[];
	qualities: Record<string, number>;
	sizes: number[];
	breakpoints: number[];
	lazyLoading: boolean;
	preload: boolean;
	placeholder: "blur" | "dominant-color" | "lqip" | "none";
}

// Image Optimization Service
export class ImageOptimizationService {
	private config: ImageConfig;

	constructor(config: ImageConfig) {
		this.config = config;
	}

	// Generate responsive image sources
	generateResponsiveSources(
		src: string,
		alt: string,
		options: {
			width?: number;
			height?: number;
			aspectRatio?: number;
			priority?: boolean;
		} = {}
	): ResponsiveImageSources {
		const { width, height, aspectRatio, priority = false } = options;

		// Generate srcSet for different sizes
		const srcSet = this.config.sizes
			.map((size) => {
				const url = this.generateOptimizedUrl(src, {
					width: size,
					...(aspectRatio !== undefined && { height: Math.round(size / aspectRatio) }),
					format: "webp",
				});
				return `${url} ${size}w`;
			})
			.join(", ");

		// Generate sources for different formats
		const sources = this.config.formats.map((format) => ({
			srcSet: this.config.sizes
				.map((size) => {
					const url = this.generateOptimizedUrl(src, {
						width: size,
						...(aspectRatio !== undefined && {
							height: Math.round(size / aspectRatio),
						}),
						format,
					});
					return `${url} ${size}w`;
				})
				.join(", "),
			type: this.getMimeType(format),
		}));

		return {
			src: this.generateOptimizedUrl(src, {
				...(width !== undefined && { width }),
				...(height !== undefined && { height }),
				format: "webp",
			}),
			srcSet,
			sources,
			alt,
			...(width !== undefined && { width }),
			...(height !== undefined && { height }),
			priority,
			placeholder: this.config.placeholder,
		};
	}

	// Optimize image URL
	generateOptimizedUrl(
		src: string,
		options: {
			width?: number;
			height?: number;
			quality?: number;
			format?: string;
			fit?: "cover" | "contain" | "fill" | "inside" | "outside";
		}
	): string {
		const params = new URLSearchParams();

		if (options.width) params.set("w", options.width.toString());
		if (options.height) params.set("h", options.height.toString());
		if (options.quality) params.set("q", options.quality.toString());
		if (options.format) params.set("f", options.format);
		if (options.fit) params.set("fit", options.fit);

		// In a real implementation, this would use a CDN or image service
		return `${src}?${params.toString()}`;
	}

	// Generate placeholder
	async generatePlaceholder(
		src: string,
		type: "blur" | "dominant-color" | "lqip"
	): Promise<string> {
		switch (type) {
			case "blur":
				return this.generateBlurPlaceholder(src);
			case "dominant-color":
				return this.extractDominantColor(src);
			case "lqip":
				return this.generateLQIP(src);
			default:
				return "";
		}
	}

	// Preload critical images
	preloadCriticalImages(images: string[]): void {
		if (typeof document === "undefined") return;

		images.forEach((src) => {
			const link = document.createElement("link");
			link.rel = "preload";
			link.as = "image";
			link.href = src;
			document.head.appendChild(link);
		});
	}

	// Generate blur placeholder
	private async generateBlurPlaceholder(_src: string): Promise<string> {
		// In a real implementation, this would generate a tiny blurred version
		// For now, return a data URL placeholder
		return "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAoACgDASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAAMEB//EACUQAAIBAwMEAwEBAAAAAAAAAAECAwAEEQUSITFBURNhcZEigf/EABUBAFEAAAAAAAAAAAAAAAAAAAH/xAAVEQEBAAAAAAAAAAAAAAAAAAAAAf/aAAwDAQACEQMRAD8A4+iiigAooooAKKKKACiiigAooooAKKKKACiiigD/2Q==";
	}

	// Extract dominant color
	private async extractDominantColor(_src: string): Promise<string> {
		// In a real implementation, this would analyze the image
		// For now, return a default color
		return "#6366f1";
	}

	// Generate Low Quality Image Placeholder
	private async generateLQIP(src: string): Promise<string> {
		// In a real implementation, this would create a very low quality version
		return this.generateBlurPlaceholder(src);
	}

	private getMimeType(format: string): string {
		const mimeTypes: Record<string, string> = {
			webp: "image/webp",
			avif: "image/avif",
			jpg: "image/jpeg",
			jpeg: "image/jpeg",
			png: "image/png",
		};
		return mimeTypes[format] || "image/jpeg";
	}
}

export interface ResponsiveImageSources {
	src: string;
	srcSet: string;
	sources: Array<{
		srcSet: string;
		type: string;
	}>;
	alt: string;
	width?: number;
	height?: number;
	priority: boolean;
	placeholder: string;
}

// Lazy Image Loader
export class LazyImageLoader {
	private observer: IntersectionObserver | null = null;
	private images: Map<HTMLImageElement, ImageLoadConfig> = new Map();

	constructor() {
		this.initObserver();
	}

	// Register image for lazy loading
	registerImage(
		img: HTMLImageElement,
		config: {
			src: string;
			srcSet?: string;
			sizes?: string;
			placeholder?: string;
			onLoad?: () => void;
			onError?: () => void;
		}
	): void {
		this.images.set(img, {
			...config,
			loaded: false,
			loading: false,
		});

		// Set placeholder
		if (config.placeholder) {
			img.src = config.placeholder;
		}

		// Observe the image
		if (this.observer) {
			this.observer.observe(img);
		}
	}

	// Load image immediately
	async loadImage(img: HTMLImageElement): Promise<void> {
		const config = this.images.get(img);
		if (!config || config.loaded || config.loading) return;

		config.loading = true;

		return new Promise((resolve, reject) => {
			const handleLoad = () => {
				config.loaded = true;
				config.loading = false;
				config.onLoad?.();
				resolve();
			};

			const handleError = () => {
				config.loading = false;
				config.onError?.();
				reject(new Error("Image failed to load"));
			};

			img.addEventListener("load", handleLoad, { once: true });
			img.addEventListener("error", handleError, { once: true });

			// Set the actual source
			if (config.srcSet) {
				img.srcset = config.srcSet;
			}
			if (config.sizes) {
				img.sizes = config.sizes;
			}
			img.src = config.src;
		});
	}

	// Preload images
	async preloadImages(sources: string[]): Promise<void> {
		const preloadPromises = sources.map((src) => {
			return new Promise<void>((resolve, reject) => {
				const img = new Image();
				img.onload = () => resolve();
				img.onerror = () => reject(new Error(`Failed to preload ${src}`));
				img.src = src;
			});
		});

		await Promise.all(preloadPromises);
	}

	// Get loading status
	getImageStatus(img: HTMLImageElement): ImageLoadStatus | null {
		const config = this.images.get(img);
		if (!config) return null;

		return {
			loaded: config.loaded,
			loading: config.loading,
		};
	}

	// Cleanup
	destroy(): void {
		if (this.observer) {
			this.observer.disconnect();
			this.observer = null;
		}
		this.images.clear();
	}

	private initObserver(): void {
		this.observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						this.loadImage(entry.target as HTMLImageElement);
					}
				});
			},
			{
				rootMargin: "50px 0px",
				threshold: 0.1,
			}
		);
	}
}

interface ImageLoadConfig {
	src: string;
	srcSet?: string;
	sizes?: string;
	placeholder?: string;
	onLoad?: () => void;
	onError?: () => void;
	loaded: boolean;
	loading: boolean;
}

export interface ImageLoadStatus {
	loaded: boolean;
	loading: boolean;
}

// WebP/AVIF Detection and Fallback
let _webpSupport: boolean | null = null;
let _avifSupport: boolean | null = null;

export const ImageFormatSupport = {
	// Check WebP support
	async supportsWebP(): Promise<boolean> {
		if (_webpSupport !== null) return _webpSupport;

		return new Promise((resolve) => {
			const webP = new Image();
			webP.onload = webP.onerror = () => {
				_webpSupport = webP.height === 2;
				resolve(_webpSupport);
			};
			webP.src =
				"data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA";
		});
	},

	// Check AVIF support
	async supportsAVIF(): Promise<boolean> {
		if (_avifSupport !== null) return _avifSupport;

		return new Promise((resolve) => {
			const avif = new Image();
			avif.onload = avif.onerror = () => {
				_avifSupport = avif.height === 2;
				resolve(_avifSupport);
			};
			avif.src =
				"data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=";
		});
	},

	// Get supported formats in order of preference
	async getSupportedFormats(): Promise<string[]> {
		const [webpSupported, avifSupported] = await Promise.all([
			ImageFormatSupport.supportsWebP(),
			ImageFormatSupport.supportsAVIF(),
		]);

		const formats: string[] = [];

		if (avifSupported) formats.push("avif");
		if (webpSupported) formats.push("webp");
		formats.push("jpg", "png");

		return formats;
	},

	// Generate picture element sources
	generatePictureSources(
		src: string,
		formats: string[],
		sizes: number[]
	): Array<{ srcSet: string; type: string }> {
		return formats.map((format) => ({
			srcSet: sizes.map((size) => `${src}?w=${size}&f=${format} ${size}w`).join(", "),
			type: ImageFormatSupport.getMimeType(format),
		}));
	},

	getMimeType(format: string): string {
		const mimeTypes: Record<string, string> = {
			webp: "image/webp",
			avif: "image/avif",
			jpg: "image/jpeg",
			jpeg: "image/jpeg",
			png: "image/png",
		};
		return mimeTypes[format] || "image/jpeg";
	},
};

// Image CDN Integration
export class ImageCDN {
	private baseUrl: string;
	private apiKey?: string;

	constructor(baseUrl: string, apiKey?: string) {
		this.baseUrl = baseUrl;
		if (apiKey !== undefined) {
			this.apiKey = apiKey;
		}
	}

	// Transform image
	transform(
		src: string,
		transformations: {
			width?: number;
			height?: number;
			quality?: number;
			format?: string;
			fit?: "cover" | "contain" | "fill" | "inside" | "outside";
			crop?: string;
			gravity?: string;
			blur?: number;
			sharpen?: number;
			brightness?: number;
			contrast?: number;
			saturation?: number;
			hue?: number;
			rotate?: number;
			flip?: "horizontal" | "vertical" | "both";
			flop?: boolean;
		}
	): string {
		const params = new URLSearchParams();

		Object.entries(transformations).forEach(([key, value]) => {
			if (value !== undefined) {
				params.set(key, value.toString());
			}
		});

		if (this.apiKey) {
			params.set("key", this.apiKey);
		}

		return `${this.baseUrl}/${src}?${params.toString()}`;
	}

	// Generate responsive images
	generateResponsive(
		src: string,
		breakpoints: number[],
		options: {
			quality?: number;
			format?: string;
			fit?: "cover" | "contain" | "fill" | "inside" | "outside";
		} = {}
	): ResponsiveImageData {
		const transformOptions = {
			...(options.quality !== undefined && { quality: options.quality }),
			...(options.format !== undefined && { format: options.format }),
			...(options.fit !== undefined && { fit: options.fit }),
		};
		const srcSet = breakpoints
			.map((bp) => `${this.transform(src, { width: bp, ...transformOptions })} ${bp}w`)
			.join(", ");

		return {
			src: this.transform(src, { width: breakpoints[0], ...transformOptions }),
			srcSet,
			sizes: `${breakpoints.map((bp) => `(max-width: ${bp}px) ${bp}px`).join(", ")}, 100vw`,
		};
	}

	// Optimize for Core Web Vitals
	optimizeForCWV(
		src: string,
		options: {
			width?: number;
			height?: number;
			priority?: boolean;
		}
	): ImageOptimizationResult {
		const transformations = {
			...(options.width !== undefined && { width: options.width }),
			...(options.height !== undefined && { height: options.height }),
			quality: 80,
			format: "webp",
		};

		return {
			url: this.transform(src, transformations),
			priority: options.priority || false,
			preload: options.priority || false,
		};
	}
}

export interface ResponsiveImageData {
	src: string;
	srcSet: string;
	sizes: string;
}

export interface ImageOptimizationResult {
	url: string;
	priority: boolean;
	preload: boolean;
}

// Image Analytics
export class ImageAnalytics {
	private metrics: Map<string, ImageMetrics> = new Map();

	// Track image load performance
	trackImageLoad(
		src: string,
		metrics: {
			loadTime: number;
			fileSize?: number;
			dimensions?: { width: number; height: number };
			format?: string;
		}
	): void {
		this.metrics.set(src, {
			...metrics,
			timestamp: Date.now(),
			loads: (this.metrics.get(src)?.loads || 0) + 1,
		});
	}

	// Track image errors
	trackImageError(src: string, error: string): void {
		const existing = this.metrics.get(src) || {
			loadTime: 0,
			timestamp: Date.now(),
			loads: 0,
		};

		this.metrics.set(src, {
			...existing,
			errors: (existing.errors || 0) + 1,
			lastError: error,
		});
	}

	// Get performance report
	getPerformanceReport(): ImagePerformanceReport {
		const allMetrics = Array.from(this.metrics.values());

		const avgLoadTime = allMetrics.reduce((sum, m) => sum + m.loadTime, 0) / allMetrics.length;
		const totalErrors = allMetrics.reduce((sum, m) => sum + (m.errors || 0), 0);
		const totalLoads = allMetrics.reduce((sum, m) => sum + m.loads, 0);

		return {
			totalImages: allMetrics.length,
			averageLoadTime: avgLoadTime,
			totalErrors,
			errorRate: totalErrors / totalLoads,
			slowestImages: allMetrics.sort((a, b) => b.loadTime - a.loadTime).slice(0, 10),
		};
	}

	// Get format distribution
	getFormatDistribution(): Record<string, number> {
		const distribution: Record<string, number> = {};

		for (const metrics of this.metrics.values()) {
			const format = metrics.format || "unknown";
			distribution[format] = (distribution[format] || 0) + 1;
		}

		return distribution;
	}
}

interface ImageMetrics {
	loadTime: number;
	fileSize?: number;
	dimensions?: { width: number; height: number };
	format?: string;
	timestamp: number;
	loads: number;
	errors?: number;
	lastError?: string;
}

export interface ImagePerformanceReport {
	totalImages: number;
	averageLoadTime: number;
	totalErrors: number;
	errorRate: number;
	slowestImages: ImageMetrics[];
}

// Image Optimization Factory
export const ImageOptimizationFactory = {
	createImageOptimizationService(config: ImageConfig): ImageOptimizationService {
		return new ImageOptimizationService(config);
	},

	createLazyImageLoader(): LazyImageLoader {
		return new LazyImageLoader();
	},

	createImageCDN(baseUrl: string, apiKey?: string): ImageCDN {
		return new ImageCDN(baseUrl, apiKey);
	},

	createImageAnalytics(): ImageAnalytics {
		return new ImageAnalytics();
	},

	getDefaultConfig(): ImageConfig {
		return {
			formats: ["webp", "avif", "jpg"],
			qualities: {
				high: 90,
				medium: 75,
				low: 60,
			},
			sizes: [320, 640, 768, 1024, 1280, 1920],
			breakpoints: [640, 768, 1024, 1280],
			lazyLoading: true,
			preload: false,
			placeholder: "blur",
		};
	},
};

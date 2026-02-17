/**
 * Security utilities for input sanitization and XSS prevention
 */

/**
 * Basic HTML sanitizer to prevent XSS attacks
 * Removes potentially dangerous HTML tags and attributes
 */
export function sanitizeHtml(input: string): string {
	if (typeof input !== "string") {
		return "";
	}

	// Remove script tags and their content
	let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

	// Remove event handlers (on* attributes)
	sanitized = sanitized.replace(/ on\w+="[^"]*"/gi, "");
	sanitized = sanitized.replace(/ on\w+='[^']*'/gi, "");

	// Remove javascript: URLs
	sanitized = sanitized.replace(/javascript:[^"']*/gi, "");

	// Remove potentially dangerous tags
	const dangerousTags = ["script", "iframe", "object", "embed", "form", "input", "meta", "link"];
	dangerousTags.forEach((tag) => {
		const regex = new RegExp(`<${tag}\\b[^>]*>.*?</${tag}>`, "gi");
		sanitized = sanitized.replace(regex, "");
		const selfClosingRegex = new RegExp(`<${tag}\\b[^>]*/>`, "gi");
		sanitized = sanitized.replace(selfClosingRegex, "");
	});

	// Remove style tags that could contain CSS-based XSS
	sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

	return sanitized;
}

/**
 * Sanitize user input for safe display
 * Escapes HTML entities
 */
export function escapeHtml(input: string): string {
	if (typeof input !== "string") {
		return "";
	}

	const htmlEscapes: Record<string, string> = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#x27;",
		"/": "&#x2F;",
	};

	return input.replace(/[&<>"'/]/g, (char) => htmlEscapes[char]);
}

/**
 * Validate and sanitize email input
 */
export function sanitizeEmail(email: string): string {
	if (typeof email !== "string") {
		return "";
	}

	// Basic email validation and sanitization
	const sanitized = email.trim().toLowerCase();

	// Remove any HTML
	return escapeHtml(sanitized);
}

/**
 * Validate and sanitize URL input
 */
export function sanitizeUrl(url: string): string {
	if (typeof url !== "string") {
		return "";
	}

	try {
		const parsedUrl = new URL(url);

		// Only allow http and https protocols
		if (!["http:", "https:"].includes(parsedUrl.protocol)) {
			return "";
		}

		return parsedUrl.toString();
	} catch {
		return "";
	}
}

/**
 * Sanitize general text input
 */
export function sanitizeText(input: string): string {
	if (typeof input !== "string") {
		return "";
	}

	// Trim whitespace and escape HTML
	return escapeHtml(input.trim());
}

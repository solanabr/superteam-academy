/**
 * PostHog analytics — thin wrapper around the official `posthog-js` SDK.
 *
 * Usage:
 *   import { initPostHog, captureEvent, identifyUser } from "@superteam-academy/analytics";
 *   initPostHog({ apiKey: "phc_..." });
 *   captureEvent("course_started", { courseId: "solana-101" });
 */

import posthog from "posthog-js";

export interface PostHogConfig {
	apiKey: string;
	apiHost?: string;
	autocapture?: boolean;
	capturePageview?: boolean;
	capturePageleave?: boolean;
	enableHeatmaps?: boolean;
	enableSessionRecording?: boolean;
	sessionRecordingSampleRate?: number;
	persistence?: "localStorage" | "cookie" | "memory";
	debug?: boolean;
}

const DEFAULT_HOST = "https://us.i.posthog.com";

export function initPostHog(config: PostHogConfig): void {
	if (typeof window === "undefined") return;

	posthog.init(config.apiKey, {
		api_host: config.apiHost ?? DEFAULT_HOST,
		autocapture: config.autocapture ?? true,
		capture_pageview: config.capturePageview ?? true,
		capture_pageleave: config.capturePageleave ?? true,
		enable_heatmaps: config.enableHeatmaps ?? true,
		enable_recording_console_log: false,
		persistence: config.persistence ?? "localStorage",
		person_profiles: "identified_only",
		debug: config.debug ?? false,
	});
}

export function captureEvent(eventName: string, properties?: Record<string, unknown>): void {
	posthog.capture(eventName, properties);
}

export function identifyUser(userId: string, traits?: Record<string, unknown>): void {
	posthog.identify(userId, traits);
}

export function resetPostHogUser(): void {
	posthog.reset();
}

export function setPostHogPersonProperties(properties: Record<string, unknown>): void {
	posthog.setPersonProperties(properties);
}

export function isFeatureEnabled(flagKey: string): boolean {
	return posthog.isFeatureEnabled(flagKey) ?? false;
}

export function getFeatureFlagPayload(flagKey: string): unknown {
	return posthog.getFeatureFlagPayload(flagKey);
}

export function optIn(): void {
	posthog.opt_in_capturing();
}

export function optOut(): void {
	posthog.opt_out_capturing();
}

export function hasOptedOut(): boolean {
	return posthog.has_opted_out_capturing();
}

export { posthog };

// Main exports
export * from "./config";
export * from "./routing";
export * from "./utils";
export * from "./middleware";
export * from "./ssr";

// Re-export next-intl functions for convenience
export { getTranslations, getFormatter, getNow, getTimeZone } from "next-intl/server";
export { useTranslations, useFormatter, useNow, useTimeZone } from "next-intl";

// Type exports
export type { TranslationKey, NestedKeyOf } from "./utils";
export type { ValidationResult } from "./validation";
export type { ExtractedKey, ExtractionResult } from "./extraction";

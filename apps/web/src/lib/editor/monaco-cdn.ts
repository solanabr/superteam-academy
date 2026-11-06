/**
 * The one place the Monaco CDN version lives. The loader
 * (`components/editor/monaco-loader.ts`) and the page CSP (`lib/csp.ts`) both
 * read it, so they can't point at different versions.
 *
 * Bump this with the `monaco-editor` dev dependency; `__tests__/monaco-cdn.test.ts`
 * fails until they match. `@monaco-editor/loader` has its own default version,
 * which this overrides, so upgrading that package doesn't move the CDN path.
 */
export const MONACO_VERSION = "0.55.1";

/** The AMD `vs` root. The loader appends `/loader.js`, so no trailing slash. */
export const MONACO_VS_PATH = `https://cdn.jsdelivr.net/npm/monaco-editor@${MONACO_VERSION}/min/vs`;

/**
 * The CSP source for everything Monaco loads. The trailing slash makes it a
 * prefix match; without it the source would match only that exact path.
 */
export const MONACO_CDN_SOURCE = `${MONACO_VS_PATH}/`;

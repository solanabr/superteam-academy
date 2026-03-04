/**
 * Payload initialization for seed scripts.
 *
 * Payload's `loadEnv.js` does `import nextEnvImport from '@next/env'` which
 * fails under tsx due to CJS/ESM default-import interop. We patch Module._resolveFilename
 * to redirect `@next/env` to a CJS stub that exports `loadEnvConfig` as the default.
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Module = require("module");
const origResolve = Module._resolveFilename;

Module._resolveFilename = function (
  request: string,
  parent: unknown,
  ...args: unknown[]
) {
  if (request === "@next/env") {
    return require.resolve("./next-env-stub.cjs");
  }
  return origResolve.call(this, request, parent, ...args);
};

export async function getPayload() {
  const { getPayload: _getPayload } = await import("payload");
  const config = (await import("../../payload.config.ts")).default;
  return _getPayload({ config });
}

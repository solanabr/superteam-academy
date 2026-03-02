// Stub for @next/env used by seed scripts outside the Next.js runtime.
// Payload's loadEnv.js does `import nextEnvImport from '@next/env'` then
// `const { loadEnvConfig } = nextEnvImport`. The default export must be an
// object with loadEnvConfig.
module.exports = {
  loadEnvConfig: function () {
    return { loadedEnvFiles: [] };
  },
};

// Also set as default for ESM interop
module.exports.default = module.exports;

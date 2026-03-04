#!/usr/bin/env node
/**
 * Postinstall script to patch React's CJS exports to include `useEffectEvent`.
 *
 * Sanity imports `useEffectEvent` directly from 'react', but it's an internal
 * experimental API not exported from the public React package.
 *
 * Next.js uses its OWN compiled React (next/dist/compiled/react/) during builds,
 * not node_modules/react. We must patch both locations.
 *
 * The patch uses a direct unconditional `exports.xxx = ...` assignment so that
 * webpack's static CJS named-export analyzer can detect it.
 */

const fs = require('fs');
const path = require('path');

const MARKER = '// [postinstall] useEffectEvent polyfill';

const POLYFILL = `
// [postinstall] useEffectEvent polyfill
// Sanity imports useEffectEvent from 'react' but it is not a public export.
// This unconditional assignment ensures webpack static analysis detects the export.
exports.useEffectEvent = function useEffectEvent(fn) {
  var ref = { current: fn };
  return function () { return ref.current.apply(this, arguments); };
};
`;

const root = process.cwd();

const files = [
  // node_modules/react
  path.join(root, 'node_modules/react/cjs/react.production.js'),
  path.join(root, 'node_modules/react/cjs/react.development.js'),
  // Next.js bundled React — this is what webpack actually resolves during build
  path.join(root, 'node_modules/next/dist/compiled/react/cjs/react.production.js'),
  path.join(root, 'node_modules/next/dist/compiled/react/cjs/react.development.js'),
];

let patched = 0;
for (const file of files) {
  if (!fs.existsSync(file)) {
    console.log(`[postinstall] Skipping ${path.basename(file)} (${path.dirname(file).split('/').slice(-3).join('/')} - not found)`);
    continue;
  }

  let content = fs.readFileSync(file, 'utf8');

  // Strip any previous patch (idempotent cleanup)
  const markerIndex = content.indexOf(MARKER);
  if (markerIndex !== -1) {
    const lineStart = content.lastIndexOf('\n', markerIndex - 1);
    content = content.slice(0, lineStart > 0 ? lineStart : markerIndex);
  }

  // Skip if already correctly patched (has unconditional export)
  if (content.includes('exports.useEffectEvent')) {
    console.log(`[postinstall] Already has useEffectEvent: ${path.relative(root, file)}`);
    continue;
  }

  fs.writeFileSync(file, content + POLYFILL, 'utf8');
  console.log(`[postinstall] Patched: ${path.relative(root, file)}`);
  patched++;
}

console.log(`[postinstall] ✅ useEffectEvent polyfill complete (${patched} file(s) updated).`);

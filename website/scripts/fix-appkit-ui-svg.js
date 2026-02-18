#!/usr/bin/env node
/**
 * Fix SVG attributes for React: fill-rule → fillRule, clip-rule → clipRule.
 *
 * Root cause: React expects camelCase DOM props (fillRule, clipRule). Privy's
 * dependencies (@reown/appkit-ui, @walletconnect/ethereum-provider,
 * @coinbase/wallet-sdk, etc.) ship hyphenated attributes, causing "Invalid DOM
 * property 'fill-rule'. Did you mean 'fillRule'?" warnings.
 *
 * This script patches node_modules on disk (postinstall). Production builds
 * also run string-replace-loader in next.config webpack so the fix applies
 * at bundle time. We do not run the loader in Turbopack (dev) because it
 * broke ESM (@privy-io/chains); dev uses this on-disk patch only.
 *
 * Patches: 1) All @reown/appkit-ui copies. 2) Any .js/.mjs in node_modules
 * containing fill-rule= or clip-rule=.
 */
const fs = require("fs");
const path = require("path");

const nodeModules = path.join(__dirname, "../node_modules");
if (!fs.existsSync(nodeModules)) {
  process.exit(0);
}

const JS_EXTS = [".js", ".mjs", ".cjs.js", ".umd.js"];

function isJsFile(filePath) {
  const name = path.basename(filePath);
  return JS_EXTS.some((ext) => name.endsWith(ext));
}

function findAppkitUiDirs(dir, acc = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (_) {
    return acc;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "appkit-ui") {
        const pkgPath = path.join(full, "package.json");
        if (fs.existsSync(pkgPath)) {
          try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
            if (pkg.name === "@reown/appkit-ui") acc.push(full);
          } catch (_) {}
        }
      }
      findAppkitUiDirs(full, acc);
    }
  }
  return acc;
}

function walk(dir, callback, opts = {}) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (_) {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!opts.allDirs && e.name === "node_modules") continue;
      walk(full, callback, opts);
    } else if (e.isFile() && (opts.checkExt ? isJsFile(full) : (e.name.endsWith(".js") || e.name.endsWith(".mjs")))) {
      callback(full);
    }
  }
}

function patchFile(filePath) {
  let s;
  try {
    s = fs.readFileSync(filePath, "utf8");
  } catch (_) {
    return false;
  }
  if (!s.includes("fill-rule=") && !s.includes("clip-rule=")) return false;
  const orig = s;
  s = s.replace(/\bfill-rule=/g, "fillRule=").replace(/\bclip-rule=/g, "clipRule=");
  if (s === orig) return false;
  fs.writeFileSync(filePath, s);
  return true;
}

// 1) Patch all @reown/appkit-ui copies
const appkitDirs = findAppkitUiDirs(nodeModules, []);
let appkitTotal = 0;
const seen = new Set();
for (const d of appkitDirs) {
  let real;
  try {
    real = fs.realpathSync(d);
  } catch (_) {
    real = d;
  }
  if (seen.has(real)) continue;
  seen.add(real);
  walk(d, (file) => {
    if (patchFile(file)) appkitTotal++;
  });
}

// 2) Patch any other JS in node_modules that still has fill-rule= or clip-rule=
let otherTotal = 0;
walk(nodeModules, (file) => {
  if (patchFile(file)) otherTotal++;
}, { allDirs: true, checkExt: true });

const total = appkitTotal + otherTotal;
if (total > 0) {
  console.log(
    "[fix-appkit-ui-svg] Patched",
    total,
    "file(s):",
    appkitTotal,
    "in @reown/appkit-ui,",
    otherTotal,
    "in other packages"
  );
}

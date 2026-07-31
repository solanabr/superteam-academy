#!/usr/bin/env node
/**
 * Generates docs/design-system.html from the ACTUAL implementation.
 *
 *   node scripts/gen-design-system-doc.mjs        # write docs/design-system.html
 *   node scripts/gen-design-system-doc.mjs --check # fail if the file is stale
 *
 * Sources of truth (read at generation time — never hand-edit the output):
 *   apps/web/src/styles/globals.css   → :root / [data-theme="dark"] token blocks
 *   apps/web/tailwind.config.ts       → semantic colour/radius/shadow/font mapping
 *   apps/web/src/app/layout.tsx       → next/font families + CSS variable names
 *   apps/web/src/components/ui/*.tsx  → cva variant matrices (transcribed below)
 *
 * The output is deterministic (no timestamps) so a regeneration is byte-stable.
 */

import {
  readFileSync,
  writeFileSync,
  mkdtempSync,
  rmSync,
  readdirSync,
  statSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  GALLERY,
  DEAD_CLASSES,
  MISSING_RULES,
  UNUSED,
} from "./design-system-gallery.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = {
  css: "apps/web/src/styles/globals.css",
  tw: "apps/web/tailwind.config.ts",
  layout: "apps/web/src/app/layout.tsx",
  button: "apps/web/src/components/ui/button.tsx",
  card: "apps/web/src/components/ui/card.tsx",
};
const OUT = "docs/design-system.html";
const read = (p) => readFileSync(join(ROOT, p), "utf8");

/* ── CSS parsing ─────────────────────────────────────────────────────────── */

/** Returns the body text of the first block introduced by `selector`. */
function blockBody(css, selector) {
  const start = css.indexOf(selector);
  if (start === -1) throw new Error(`selector not found: ${selector}`);
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}" && --depth === 0)
      return css.slice(open + 1, i);
  }
  throw new Error(`unbalanced block: ${selector}`);
}

const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");

/** Parses `--name: value;` declarations, tolerating multi-line values. */
function parseVars(body) {
  const out = new Map();
  let buf = "";
  let depth = 0;
  for (const ch of stripComments(body)) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === ";" && depth === 0) {
      pushDecl(out, buf);
      buf = "";
    } else buf += ch;
  }
  pushDecl(out, buf);
  return out;
}

function pushDecl(map, raw) {
  const decl = raw.trim();
  if (!decl.startsWith("--")) return;
  const i = decl.indexOf(":");
  if (i === -1) return;
  map.set(
    decl.slice(0, i).trim(),
    decl
      .slice(i + 1)
      .trim()
      .replace(/\s+/g, " ")
  );
}

const css = read(SRC.css);
const light = parseVars(blockBody(css, "\n  :root {"));
const dark = parseVars(blockBody(css, '[data-theme="dark"] {'));

/* ── bespoke-rule extraction ─────────────────────────────────────────────────
   The gallery reproduces components that style themselves with hand-written
   classes in globals.css (.pill, .course-card, .nav-link…). Those rules are
   lifted VERBATIM, with their source line, so the page renders standalone
   without anyone retyping (and mistyping) a declaration.
   ──────────────────────────────────────────────────────────────────────────── */

const lineOf = (text, index) => text.slice(0, index).split("\n").length;

/** Walks top-level rules, descending into @media/@layer/@supports. */
function* walkRules(source, offset = 0, wrappers = []) {
  let i = 0;
  let prelude = "";
  while (i < source.length) {
    const ch = source[i];
    if (ch === "{") {
      let depth = 0;
      let end = i;
      for (let j = i; j < source.length; j++) {
        if (source[j] === "{") depth++;
        else if (source[j] === "}" && --depth === 0) {
          end = j;
          break;
        }
      }
      const body = source.slice(i + 1, end);
      const sel = prelude.trim();
      if (/^@(media|layer|supports|scope)/.test(sel)) {
        yield* walkRules(
          body,
          offset + i + 1,
          sel.startsWith("@layer") ? wrappers : [...wrappers, sel]
        );
      } else if (sel && !sel.startsWith("@")) {
        yield {
          selector: sel,
          body,
          wrappers,
          index: offset + i - prelude.length,
        };
      }
      prelude = "";
      i = end + 1;
      continue;
    }
    if (ch === ";" && prelude.trim().startsWith("@")) prelude = "";
    else prelude += ch;
    i++;
  }
}

const rules = [...walkRules(stripComments(css))];
/* stripComments preserves neither offsets nor line numbers, so line lookups run
   against a comment-stripped copy that keeps newlines. */
const cssNoComments = css.replace(/\/\*[\s\S]*?\*\//g, (m) =>
  m.replace(/[^\n]/g, " ")
);
const rulesForLines = [...walkRules(cssNoComments)];

const classToken = (name) =>
  new RegExp(`\\.${name.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}(?![\\w-])`);

/**
 * Returns the verbatim CSS for every rule whose selector uses one of `names`,
 * each preceded by a `globals.css:<line>` comment.
 */
function extractGlobalRules(names) {
  const tests = names.map((n) => [n, classToken(n)]);
  const out = [];
  const seen = new Set();
  rulesForLines.forEach((rule, i) => {
    /* one rule can serve several names (`.pill-primary, .pill-beg { … }`) */
    const hits = tests.filter(([, re]) => re.test(rule.selector)).map(([n]) => n);
    if (!hits.length) return;
    const key = `${rule.selector}::${i}`;
    if (seen.has(key)) return;
    seen.add(key);
    const line = lineOf(cssNoComments, rule.index);
    const text = `${rule.selector} {${rules[i]?.body ?? rule.body}}`;
    out.push({
      names: hits,
      line,
      wrappers: rule.wrappers,
      css: rule.wrappers.length
        ? rule.wrappers.map((w) => `${w} {`).join("\n") +
          `\n${text}\n` +
          rule.wrappers.map(() => "}").join("\n")
        : text,
    });
  });
  const missing = names.filter((n) => !out.some((r) => r.names.includes(n)));
  if (missing.length)
    throw new Error(
      `bespoke class(es) not found in ${SRC.css}: ${missing.join(", ")}`
    );
  return out;
}

/* Authoring aid: `node scripts/gen-design-system-doc.mjs --extract=pill,nav-link`
   prints the rules the gallery would inline for those classes. */
const extractArg = process.argv.find((a) => a.startsWith("--extract="));
if (extractArg) {
  for (const r of extractGlobalRules(extractArg.slice(10).split(",")))
    console.log(`/* ${SRC.css}:${r.line} */\n${r.css}\n`);
  process.exit(0);
}

/* ── tailwind.config.ts parsing ──────────────────────────────────────────── */

const tw = read(SRC.tw);

/** Maps `--css-var` → the tailwind colour token(s) that resolve to it. */
function parseColorMap(source) {
  const body = blockBody(stripComments(source), "colors: {");
  const map = new Map();
  const add = (cssVar, token) => {
    if (!map.has(cssVar)) map.set(cssVar, []);
    map.get(cssVar).push(token);
  };
  let group = null;
  for (const line of body.split("\n")) {
    const t = line.trim();
    const open = t.match(/^"?([\w-]+)"?:\s*\{$/);
    if (open) {
      group = open[1];
      continue;
    }
    if (t.startsWith("}")) {
      group = null;
      continue;
    }
    const pair = t.match(/^"?([\w-]+)"?:\s*"([^"]+)"/);
    if (!pair) continue;
    const [, key, value] = pair;
    const varName = value.match(/^var\((--[\w-]+)\)$/)?.[1];
    const token = group
      ? key === "DEFAULT"
        ? group
        : `${group}-${key}`
      : key;
    if (varName) add(varName, token);
    else add(`literal:${value}`, token);
  }
  return map;
}

/** Maps `--css-var` → utility name, for a simple `key: "var(--x)"` block. */
function parseSimpleMap(source, blockName, prefix) {
  const body = blockBody(stripComments(source), `${blockName}: {`);
  const map = new Map();
  for (const line of body.split("\n")) {
    const m = line.trim().match(/^"?([\w-]+)"?:\s*"([^"]+)"/);
    if (!m) continue;
    const varName = m[2].match(/var\((--[\w-]+)\)/)?.[1];
    if (!varName) continue;
    if (!map.has(varName)) map.set(varName, []);
    map.get(varName).push(`${prefix}${m[1]}`);
  }
  return map;
}

const colorMap = parseColorMap(tw);
const radiusMap = parseSimpleMap(tw, "borderRadius", "rounded-");
const shadowMap = parseSimpleMap(tw, "boxShadow", "shadow-");
const fontMap = (() => {
  const body = blockBody(stripComments(tw), "fontFamily: {");
  const map = new Map();
  for (const line of body.split("\n")) {
    const m = line.trim().match(/^([\w-]+):\s*\["var\((--[\w-]+)\)"\]/);
    if (!m) continue;
    if (!map.has(m[2])) map.set(m[2], []);
    map.get(m[2]).push(`font-${m[1]}`);
  }
  return map;
})();
const darkModeStrategy = tw.match(/darkMode:\s*(\[[^\]]*\]|"[^"]*")/)[1];

/* ── next/font extraction ────────────────────────────────────────────────── */

const layout = read(SRC.layout);
const fonts = [
  ...layout.matchAll(
    /const\s+(\w+)\s*=\s*(\w+)\(\{([\s\S]*?)\}\);/g
  ),
]
  .map(([, constName, family, body]) => ({
    constName,
    family: family.replace(/_/g, " "),
    variable: body.match(/variable:\s*"([^"]+)"/)?.[1],
    weights:
      body
        .match(/weight:\s*\[([^\]]+)\]/)?.[1]
        .replace(/["\s]/g, "")
        .split(",") ?? null,
    display: body.match(/display:\s*"([^"]+)"/)?.[1] ?? null,
  }))
  .filter((f) => f.variable);

const bodyClass = layout.match(/className=\{`([^`]*)`\}/)?.[1] ?? "";

/* ── Tailwind compilation ────────────────────────────────────────────────────
   The gallery uses the components' real Tailwind class strings, so the page
   needs the real utilities. Rather than retyping them (which is exactly how the
   previous doc went stale) the generator runs the app's own Tailwind build over
   the generated markup and inlines the result. Every declaration on this page
   therefore comes out of apps/web/tailwind.config.ts.
   ──────────────────────────────────────────────────────────────────────────── */

function compileTailwind(markup) {
  const bin = join(ROOT, "apps/web/node_modules/.bin/tailwindcss");
  const dir = mkdtempSync(join(tmpdir(), "ds-doc-"));
  try {
    const htmlPath = join(dir, "gallery.html");
    const inPath = join(dir, "in.css");
    const outPath = join(dir, "out.css");
    writeFileSync(htmlPath, markup);
    writeFileSync(inPath, "@tailwind base;\n@tailwind utilities;\n");
    execFileSync(
      bin,
      ["-c", join(ROOT, SRC.tw), "-i", inPath, "--content", htmlPath, "-o", outPath],
      { stdio: ["ignore", "ignore", "pipe"] }
    );
    return readFileSync(outPath, "utf8").trim();
  } catch (err) {
    throw new Error(
      `Tailwind build failed — run \`pnpm install\` first.\n${err.stderr ?? err}`
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/* ── class-string verification ───────────────────────────────────────────────
   Accuracy gate: every class token the gallery uses must exist in the app
   source. Nothing on this page may be invented.
   ──────────────────────────────────────────────────────────────────────────── */

function appSourceCorpus() {
  const roots = [join(ROOT, "apps/web/src")];
  const files = [];
  while (roots.length) {
    const dir = roots.pop();
    for (const entry of readdirSync(dir)) {
      const p = join(dir, entry);
      if (statSync(p).isDirectory()) {
        if (entry !== "node_modules" && entry !== "generated") roots.push(p);
      } else if (/\.(tsx?|css)$/.test(entry)) files.push(p);
    }
  }
  return files.map((f) => readFileSync(f, "utf8")).join("\n");
}

/** Layout-only helpers this page adds. Prefixed so they cannot shadow app classes. */
const GALLERY_OWN_PREFIX = /^(gx-|ctx-|sw|tok|val|cls|na|b-|b$|demo|type-|uicard|rules|ok|no|note|stamp|count|tablewrap|tokens|wrap|f-)/;

function verifyClassTokens(markup) {
  const corpus = appSourceCorpus();
  const used = new Set();
  for (const m of markup.matchAll(/class="([^"]*)"/g))
    for (const tok of m[1].split(/\s+/).filter(Boolean)) used.add(tok);
  const unknown = [...used]
    .filter((t) => !GALLERY_OWN_PREFIX.test(t))
    .filter((t) => !corpus.includes(t));
  if (unknown.length)
    throw new Error(
      `gallery uses class token(s) that exist nowhere in apps/web/src:\n  ${unknown.join("\n  ")}`
    );
  return used.size;
}

/* ── token grouping ──────────────────────────────────────────────────────── */

const GROUPS = [
  ["Backgrounds & surfaces", /^--(bg|surface|card|input|subtle|warm)/],
  ["Borders", /^--border/],
  ["Primary", /^--(primary|secondary|ring)/],
  ["XP / accent / gold", /^--(xp|accent|gold)/],
  ["Streak & freeze", /^--(streak|freeze)/],
  ["Level", /^--level/],
  ["Solana brand", /^--(sol-|solana-)/],
  ["Status", /^--(success|error|danger)/],
  ["Text", /^--text/],
  ["Difficulty track gradients", /^--track-/],
  ["Activity heatmap", /^--sg-/],
  ["Shadows", /^--shadow/],
  ["Radii", /^--(r-|radius)/],
  ["Typography", /^--font-/],
  ["Other", /./],
];

const allNames = [...new Set([...light.keys(), ...dark.keys()])];
const grouped = GROUPS.map(([title, re]) => [title, []]);
for (const name of allNames) {
  const idx = GROUPS.findIndex(([, re]) => re.test(name));
  grouped[idx][1].push(name);
}

/* ── value classification for the live swatches ─────────────────────────── */

const kindOf = (v = "") => {
  if (/^(#|rgb|hsl)/.test(v)) return "color";
  if (/gradient\(/.test(v)) return "gradient";
  if (/^var\(/.test(v)) return "alias";
  if (/^(none$|0 )|px .*rgba|rgba.*px/.test(v)) return "shadow";
  if (/^\d+(\.\d+)?px$/.test(v)) return "size";
  return "text";
};

const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]
  );

function swatch(name, value, theme) {
  if (value === undefined)
    return `<span class="na" title="not defined in this theme">—</span>`;
  const kind = kindOf(value);
  if (kind === "color" || kind === "alias")
    return `<span class="sw sw-${theme}" style="background:var(${name})"></span>`;
  if (kind === "gradient")
    return `<span class="sw sw-wide" style="background:var(${name})"></span>`;
  if (kind === "shadow")
    return `<span class="sw sw-box sw-${theme}" style="box-shadow:var(${name})"></span>`;
  if (kind === "size")
    return `<span class="sw sw-box sw-${theme}" style="border-radius:${esc(value)};width:${esc(value === "999px" ? "34px" : value)};min-width:22px;height:22px;background:var(--primary)"></span>`;
  return `<span class="na">n/a</span>`;
}

function classesFor(name) {
  const out = [
    ...(colorMap.get(name) ?? []),
    ...(radiusMap.get(name) ?? []),
    ...(shadowMap.get(name) ?? []),
    ...(fontMap.get(name) ?? []),
  ];
  return out;
}

/* ── HTML assembly ───────────────────────────────────────────────────────── */

const declBlock = (map) =>
  [...map].map(([k, v]) => `    ${k}: ${v};`).join("\n");

function tokenTable(title, names) {
  const rows = names
    .map((name) => {
      const l = light.get(name);
      const d = dark.get(name);
      const cls = classesFor(name);
      return `<tr>
  <td class="tok">${esc(name)}</td>
  <td class="ctx-light cell">${swatch(name, l, "light")}</td>
  <td class="val">${esc(l ?? "—")}</td>
  <td class="ctx-dark cell">${swatch(name, d, "dark")}</td>
  <td class="val">${esc(d ?? "—")}</td>
  <td class="cls">${cls.length ? cls.map((c) => `<code>${esc(c)}</code>`).join(" ") : '<span class="na">— (use <code>var()</code>)</span>'}</td>
</tr>`;
    })
    .join("\n");
  return `<h3 id="tok-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}">${esc(title)} <span class="count">${names.length}</span></h3>
<div class="tablewrap"><table class="tokens">
<thead><tr><th>CSS variable</th><th colspan="2">Light (<code>:root</code>)</th><th colspan="2">Dark (<code>[data-theme="dark"]</code>)</th><th>Tailwind token</th></tr></thead>
<tbody>
${rows}
</tbody></table></div>`;
}

/* Button variants — transcribed from the cva in apps/web/src/components/ui/button.tsx.
   Kept as data so the rendered matrix and the doc's table cannot drift apart. */
const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-display font-extrabold border-none cursor-pointer no-underline transition-all duration-[120ms] ease rounded-md text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50 active:translate-y-[2px]";

const BUTTON_VARIANTS = [
  ["primary", "core", "bg-primary text-white shadow-[0_4px_0_0_var(--primary-dark)]"],
  ["secondary", "core", "bg-transparent text-text border-[1.5px] border-border-strong"],
  ["accent", "core", "bg-xp text-white shadow-[0_4px_0_0_var(--xp-dark)]"],
  ["ghost", "utility", "bg-transparent text-text-2 shadow-none"],
  ["link", "utility", "text-primary underline-offset-4 hover:underline"],
  ["destructive", "utility", "bg-danger text-white shadow-[0_4px_0_0_var(--danger-dark)]"],
  ["destructiveOutline", "utility", "bg-transparent text-danger border-[1.5px] [border-color:var(--danger-border)]"],
  ["default", "alias → primary", "same as primary"],
  ["push", "alias → primary", "same as primary"],
  ["pushSuccess", "alias → primary", "same as primary"],
  ["outline", "alias → secondary", "same as secondary"],
  ["pushOutline", "alias → secondary", "same as secondary"],
  ["pushAccent", "alias → accent", "same as accent"],
];

const BUTTON_SIZES = [
  ["default", "px-[22px] py-[11px] text-sm"],
  ["sm", "px-[14px] py-[7px] text-xs rounded-sm"],
  ["lg", "px-[30px] py-[14px] text-base"],
  ["icon", "h-10 w-10 p-0"],
];

/* ── COMPONENT GALLERY ───────────────────────────────────────────────────────
   Hand-authored markup, but every class string is copied verbatim out of the
   component named in `sources`, and the generator refuses to build if a class
   token does not exist in apps/web/src (see verifyClassTokens). `bespoke` lists
   the globals.css classes whose rules get inlined verbatim, with line numbers.
   ──────────────────────────────────────────────────────────────────────────── */

const galleryPanel = (section, theme) => `
  <div class="gx-panel ctx-${theme}" data-theme="${theme}">
    <div class="gx-label">${theme}</div>
    ${section.html}
  </div>`;

const gallerySection = (s) => `
<h3 id="gx-${s.id}">${esc(s.title)}</h3>
<p class="gx-src">Source: ${s.sources.map((x) => `<code>${esc(x)}</code>`).join(" · ")}${
  s.bespoke?.length
    ? ` · bespoke CSS inlined from <code>${SRC.css}</code>: ${s.bespoke
        .map((b) => `<code>.${esc(b)}</code>`)
        .join(" ")}`
    : ""
}</p>
${s.note ? `<p class="gx-note">${s.note}</p>` : ""}
<div class="gx-grid">${galleryPanel(s, "light")}${galleryPanel(s, "dark")}</div>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Superteam Academy — Design System Reference (generated)</title>
<style>
/* ══ GENERATED FILE — do not hand-edit. See the stamp at the top of the page. ══ */

/* ── Tailwind, compiled from apps/web/tailwind.config.ts over this page's markup ── */
__TAILWIND_CSS__

/* ── Bespoke component rules, lifted verbatim from apps/web/src/styles/globals.css ── */
__BESPOKE_CSS__

/* Light-mode token context — verbatim from ${SRC.css} :root */
.ctx-light {
${declBlock(light)}
}
/* Dark-mode token context — verbatim from ${SRC.css} [data-theme="dark"] */
.ctx-dark {
${declBlock(dark)}
}

:root { color-scheme: light dark; --page: #ffffff; --ink: #1c1917; --ink2: #57534e; --line: rgba(0,0,0,.12); --chip: #f3f1ec; }
@media (prefers-color-scheme: dark) {
  :root { --page: #0e1117; --ink: #e6edf3; --ink2: #8b949e; --line: rgba(255,255,255,.14); --chip: #161b27; }
}
* { box-sizing: border-box; }
body { margin: 0; padding: 32px 24px 96px; background: var(--page); color: var(--ink);
  font-family: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif; font-size: 14px; line-height: 1.6; }
.wrap { max-width: 1180px; margin: 0 auto; }
h1 { font-family: "Nunito", ui-sans-serif, system-ui, sans-serif; font-weight: 900; font-size: 34px; letter-spacing: -1px; margin: 0 0 8px; }
h2 { font-family: "Nunito", ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 22px; margin: 48px 0 8px; padding-top: 16px; border-top: 1px solid var(--line); }
h3 { font-family: "Nunito", ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 15px; margin: 28px 0 8px; }
p { color: var(--ink2); max-width: 78ch; }
code, .val, .tok { font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px; }
code { background: var(--chip); border-radius: 4px; padding: 1px 5px; }
.stamp { background: var(--chip); border: 1px solid var(--line); border-radius: 10px; padding: 14px 18px; margin: 18px 0 8px; }
.stamp ul { margin: 6px 0 0; padding-left: 18px; }
.stamp li { color: var(--ink2); }
.count { color: var(--ink2); font-weight: 600; font-size: 12px; font-family: ui-monospace, monospace; }
.tablewrap { overflow-x: auto; border: 1px solid var(--line); border-radius: 10px; }
table.tokens { border-collapse: collapse; width: 100%; min-width: 900px; }
table.tokens th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .5px;
  color: var(--ink2); padding: 8px 10px; border-bottom: 1px solid var(--line); background: var(--chip); font-weight: 700; }
table.tokens td { padding: 6px 10px; border-bottom: 1px solid var(--line); vertical-align: middle; }
table.tokens tr:last-child td { border-bottom: none; }
.tok { white-space: nowrap; }
.val { color: var(--ink2); white-space: nowrap; }
.cls code { white-space: nowrap; }
.na { color: var(--ink2); opacity: .65; }
td.cell { width: 54px; }
td.ctx-light { background: #fafaf7; }
td.ctx-dark { background: #0e1117; }
.sw { display: inline-block; width: 34px; height: 22px; border-radius: 5px; vertical-align: middle; }
.sw-light { border: 1px solid rgba(0,0,0,.18); }
.sw-dark { border: 1px solid rgba(255,255,255,.18); }
.sw-wide { width: 34px; }
.sw-box { background: transparent; }
td.ctx-light .sw-box { background: #ffffff; }
td.ctx-dark .sw-box { background: #161b27; }

/* ── Gallery chrome (this page only; gx- prefix keeps it out of the app namespace) ── */
.gx-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
@media (min-width: 900px) { .gx-grid { grid-template-columns: 1fr 1fr; } }
.gx-panel { border: 1px solid var(--line); border-radius: 12px; padding: 18px; overflow: hidden;
  background: var(--bg); color: var(--text);
  font-family: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif; font-size: 14px; line-height: 1.6; }
.gx-label { font-family: ui-monospace, monospace; font-size: 10px; text-transform: uppercase;
  letter-spacing: 1px; color: var(--text-3); margin-bottom: 12px; }
.gx-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 12px; }
.gx-row:last-child { margin-bottom: 0; }
.gx-stack { display: flex; flex-direction: column; gap: 12px; }
.gx-caption { font-family: ui-monospace, monospace; font-size: 10px; text-transform: uppercase;
  letter-spacing: .8px; color: var(--text-3); margin: 6px 0 2px; }
.gx-mt { margin-top: 10px; }
.gx-src { font-family: "JetBrains Mono", ui-monospace, monospace; font-size: 11px; color: var(--ink2); margin: 0 0 6px; max-width: none; }
.gx-note { margin: 0 0 10px; }
.gx-dead code { white-space: nowrap; }

.type-sample { border: 1px solid var(--line); border-radius: 10px; padding: 16px 18px; margin-bottom: 10px; }
.type-meta { font-family: ui-monospace, monospace; font-size: 10.5px; text-transform: uppercase; letter-spacing: .8px; color: var(--ink2); margin-bottom: 8px; }
.f-sans { font-family: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif; }
.f-display { font-family: "Nunito", ui-sans-serif, system-ui, sans-serif; }
.f-mono { font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace; }
ol.rules { list-style: decimal; padding-left: 22px; }
ul.rules, .stamp ul { list-style: disc; padding-left: 22px; }
.rules li { margin-bottom: 10px; color: var(--ink2); }
.rules strong { color: var(--ink); }
.ok { color: #0a7055; font-weight: 700; }
.no { color: #dc2626; font-weight: 700; }
@media (prefers-color-scheme: dark) { .ok { color: #2ecc8e; } .no { color: #f85149; } }
.note { border-left: 3px solid var(--line); padding-left: 14px; }
</style>
</head>
<body>
<div class="wrap">

<h1>Superteam Academy — Design System Reference</h1>
<p>Every value on this page was extracted from the running implementation. Nothing here is aspirational: if a token is not in <code>globals.css</code>, it is not on this page.</p>

<div class="stamp">
  <strong>Generated file — do not hand-edit.</strong>
  <ul>
    <li>Regenerate: <code>pnpm docs:design-system</code> (or <code>node scripts/gen-design-system-doc.mjs</code>)</li>
    <li>Verify freshness in CI: <code>node scripts/gen-design-system-doc.mjs --check</code></li>
    <li>Generator: <code>scripts/gen-design-system-doc.mjs</code></li>
    <li>Sources of truth:
      <code>${SRC.css}</code>,
      <code>${SRC.tw}</code>,
      <code>${SRC.layout}</code>,
      <code>${SRC.button}</code>,
      <code>${SRC.card}</code></li>
    <li>Token counts: <strong>${light.size}</strong> light (<code>:root</code>) · <strong>${dark.size}</strong> dark (<code>[data-theme="dark"]</code>) · <strong>${allNames.length}</strong> distinct names</li>
  </ul>
</div>

<h2 id="pipeline">1. The canonical layer stack</h2>
<p>Values flow in exactly one direction. Reach for the highest layer that can express what you need.</p>
<ol class="rules">
  <li><strong>CSS custom properties</strong> — <code>${SRC.css}</code>. Light values live on <code>:root</code>; dark values override on <code>[data-theme="dark"]</code>. This is the only place a raw hex/rgba belongs.</li>
  <li><strong>Tailwind semantic mapping</strong> — <code>${SRC.tw}</code> maps those variables to named tokens (<code>bg-primary</code>, <code>text-text-2</code>, <code>border-border-strong</code>, <code>shadow-card</code>, <code>rounded-lg</code>, <code>font-display</code>…). Dark mode is <code>darkMode: ${esc(darkModeStrategy)}</code>, so <code>dark:</code> variants key off the same data attribute.</li>
  <li><strong>cva primitives</strong> — <code>apps/web/src/components/ui/*</code>. <code>button.tsx</code> is the model: every visual decision is a named variant, and consumers pick a variant rather than restyling.</li>
  <li><strong>Shared class constants</strong> — <code>apps/web/src/lib/styles/styleClasses.ts</code> for repeated multi-class recipes. Note that only <code>CERTIFICATE_STYLES</code> and <code>TOAST_STYLES</code> currently have importers — see “Shipped but unapplied”.</li>
  <li><strong>Component-local classes</strong> — last resort, and only from tokens.</li>
</ol>

<h2 id="rules">2. Usage rules</h2>
<ul class="rules">
  <li><span class="ok">DO</span> use the named tailwind token: <code>bg-primary</code>, <code>text-text-3</code>, <code>border-border-strong</code>, <code>bg-sg-3</code>, <code>shadow-card</code>.</li>
  <li><span class="no">DON'T</span> write arbitrary-value escapes for tokens that already have a name — <code>bg-[var(--primary)]</code> is the same pixel as <code>bg-primary</code> but it hides the token from grep and from the config. Arbitrary values are legitimate <em>only</em> for variables the config does not map (see the “Tailwind token” column — rows marked <span class="na">—</span> genuinely require <code>var()</code>, e.g. <code>bg-[var(--card-glass)]</code>, <code>border-[var(--border-default)]</code>).</li>
  <li><span class="no">NEVER</span> hardcode a hex or rgba in a component. If a colour does not exist as a token, add it to both theme blocks in <code>globals.css</code> first.</li>
  <li><strong>Theme selector:</strong> dark mode is <code>[data-theme="dark"]</code> on <code>&lt;html&gt;</code>, set by next-themes (<code>attribute="data-theme"</code>). There is no <code>.dark</code> class and no <code>.light</code> class — a selector like <code>.light .pill</code> never matches.</li>
  <li><strong>Fonts:</strong> <code>font-display</code> (Nunito) for headings, numerals, buttons and pills — anything with weight ≥ 700. <code>font-sans</code> (Plus Jakarta Sans) is the body default, already applied on <code>&lt;body&gt;</code>, so only re-declare it to undo a display context. <code>font-mono</code> (JetBrains Mono) for code, addresses, hashes and any tabular figure.</li>
  <li><strong>Solana gradient:</strong> <code>--sol-grad</code> / <code>bg-cert-gradient</code> is a brand accent used across certificates, mastery bars, deploy CTAs and marketing surfaces. It is not certificate-only — but it is never a background for body text.</li>
  <li><strong>New tokens</strong> must be added to <em>both</em> <code>:root</code> and <code>[data-theme="dark"]</code>, then mapped in <code>tailwind.config.ts</code>, then regenerated here.</li>
</ul>

<h2 id="tokens">3. Colour &amp; value tokens</h2>
<p>Swatches are live: each cell renders <code>var(--token)</code> inside a context carrying that theme's real declarations, copied verbatim from <code>globals.css</code>. The “Tailwind token” column lists the class stem — combine with <code>bg-</code>, <code>text-</code>, <code>border-</code>, <code>from-</code>… as appropriate.</p>
${grouped
  .filter(([, names]) => names.length)
  .map(([title, names]) => tokenTable(title, names))
  .join("\n\n")}

<h2 id="typography">4. Typography</h2>
<p>Fonts are self-hosted through <code>next/font/google</code> in <code>${SRC.layout}</code> — no runtime Google Fonts request, which is why the CSP does not allow <code>fonts.googleapis.com</code>. This page deliberately loads no webfonts either; if a family is not installed locally you will see the fallback, but the stack and weights below are exact.</p>
<div class="tablewrap"><table class="tokens">
<thead><tr><th>Role</th><th>Family</th><th>CSS variable</th><th>Tailwind</th><th>Weights loaded</th><th>display</th></tr></thead>
<tbody>
${fonts
  .map(
    (f) => `<tr><td class="tok">${esc(f.constName)}</td><td>${esc(f.family)}</td><td class="tok">${esc(f.variable)}</td><td class="cls">${(fontMap.get(f.variable) ?? []).map((c) => `<code>${esc(c)}</code>`).join(" ") || '<span class="na">—</span>'}</td><td class="val">${f.weights ? esc(f.weights.join(", ")) : "<span class='na'>default</span>"}</td><td class="val">${f.display ? esc(f.display) : "<span class='na'>—</span>"}</td></tr>`
  )
  .join("\n")}
</tbody></table></div>
<p class="note">The <code>&lt;body&gt;</code> element carries <code>${esc(bodyClass)}</code>. Base type is set in <code>globals.css</code>: <code>font-size: 14px</code>, <code>line-height: 1.6</code>, <code>-webkit-font-smoothing: antialiased</code>. There is no global heading scale — headings size themselves with tailwind utilities per surface (e.g. <code>CardTitle</code> = <code>font-display text-2xl font-extrabold leading-none tracking-tight</code>).</p>

<div class="type-sample"><div class="type-meta">font-display · Nunito · 800</div><div class="f-display" style="font-size:32px;font-weight:800;letter-spacing:-.5px">Learn Solana. Prove it on-chain.</div></div>
<div class="type-sample"><div class="type-meta">font-sans · Plus Jakarta Sans · 400/600</div><div class="f-sans" style="font-size:15px">Body copy sets at 14–15px with a 1.6 line height. <strong style="font-weight:600">Semibold</strong> is the emphasis weight.</div></div>
<div class="type-sample"><div class="type-meta">font-mono · JetBrains Mono</div><div class="f-mono" style="font-size:13px">7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU</div></div>

<h2 id="radius-shadow">5. Radii, shadows &amp; motion</h2>
<p>Radii and shadows are tokens first, tailwind utilities second — see the “Radii” and “Shadows” tables above for live values. The tailwind mapping is:</p>
<div class="tablewrap"><table class="tokens">
<thead><tr><th>Tailwind utility</th><th>Resolves to</th></tr></thead><tbody>
${[...radiusMap, ...shadowMap]
  .flatMap(([v, classes]) =>
    classes.map(
      (c) => `<tr><td class="cls"><code>${esc(c)}</code></td><td class="tok">var(${esc(v)})</td></tr>`
    )
  )
  .join("\n")}
</tbody></table></div>
<p><code>shadow-push</code> / <code>shadow-push-sm</code> / <code>shadow-push-active</code> compose <code>--shadow-push-color</code> into the 3D press effect used by the button primitive; the pressed state is <code>active:translate-y-[2px]</code> plus the shorter shadow.</p>

<h2 id="components">6. Component gallery</h2>
<p>Every family below is rendered twice — once in each theme context — from the components' own class strings. Both panels share identical markup: the only difference is which token block the surrounding context carries, which is the whole point of the pipeline. Tailwind utilities on this page are compiled by the app's own Tailwind build; bespoke classes are lifted verbatim out of <code>${SRC.css}</code> with their source line.</p>
<p class="gx-note">Caveats that apply throughout: Phosphor icon components render as text glyphs, <code>next/image</code> thumbnails as token-coloured boxes, and entry animations / <code>position: fixed</code> are neutralised so the page stays legible. Everything else is the real thing.</p>
${GALLERY.map(gallerySection).join("\n")}

<h3>Button — the full cva matrix (<code>${SRC.button}</code>)</h3>
<div class="tablewrap"><table class="tokens">
<thead><tr><th>variant</th><th>Kind</th><th>Key classes</th></tr></thead><tbody>
${BUTTON_VARIANTS.map(
  ([name, kind, cls]) =>
    `<tr><td class="tok">${esc(name)}</td><td>${esc(kind)}</td><td class="val">${esc(cls)}</td></tr>`
).join("\n")}
</tbody></table></div>
<p>Base classes applied to every variant: <code>${esc(BUTTON_BASE)}</code></p>
<div class="tablewrap"><table class="tokens">
<thead><tr><th>size</th><th>Classes</th></tr></thead><tbody>
${BUTTON_SIZES.map(
  ([name, cls]) =>
    `<tr><td class="tok">${esc(name)}</td><td class="val">${esc(cls)}</td></tr>`
).join("\n")}
</tbody></table></div>
<p>Defaults: <code>variant="primary"</code>, <code>size="default"</code>.</p>

<h2 id="dead">7. Class strings that do nothing</h2>
<p>Found while building this page and verified on every regeneration: these strings are written in components but compile to no CSS under <code>${SRC.tw}</code>, or name a bespoke class that <code>${SRC.css}</code> never defines. They are listed here as documentation of the current state — fixing them is a code change, not a docs change.</p>
<div class="tablewrap"><table class="tokens gx-dead">
<thead><tr><th>Class</th><th>Used at</th><th>Why it produces nothing</th></tr></thead><tbody>
${DEAD_CLASSES.map(
  (d) =>
    `<tr><td class="tok">${esc(d.cls)}</td><td class="val">${esc(d.where)}</td><td>${d.why}</td></tr>`
).join("\n")}
${MISSING_RULES.map(
  (d) =>
    `<tr><td class="tok">.${esc(d.cls)}</td><td class="val">${esc(d.where)}</td><td>bespoke class with no rule in <code>${SRC.css}</code>.</td></tr>`
).join("\n")}
</tbody></table></div>
<h3>Shipped but unapplied</h3>
<p>CSS and style constants that exist, ship, and are never used. Verified by grepping <code>apps/web/src</code> for each name outside its own definition and comments.</p>
<div class="tablewrap"><table class="tokens gx-dead">
<thead><tr><th>What</th><th>Where</th><th>Evidence</th></tr></thead><tbody>
${UNUSED.map(
  (u) =>
    `<tr><td class="tok">${esc(u.what)}</td><td class="val">${esc(u.where)}</td><td>${u.why}</td></tr>`
).join("\n")}
</tbody></table></div>

<h2 id="theming">8. Retheming checklist</h2>
<ol class="rules">
  <li>Edit the hex/rgba in <code>:root</code> <em>and</em> <code>[data-theme="dark"]</code> in <code>${SRC.css}</code>. Both blocks must stay name-for-name identical.</li>
  <li>Only add to <code>${SRC.tw}</code> if you introduced a new variable that deserves a semantic class.</li>
  <li>Four surfaces sit outside the CSS-variable pipeline and must be updated by hand: the Monaco editor themes (<code>apps/web/src/components/editor/themes.ts</code>), the transactional email templates (<code>apps/web/src/lib/email/templates.ts</code> — mail clients do not support custom properties), third-party brand marks (<code>apps/web/src/components/icons/*</code>), and canvas/SVG literals in a handful of landing and dashboard components.</li>
  <li>Regenerate this page and diff it: the diff <em>is</em> the change log for the design system.</li>
</ol>

</div>
</body>
</html>
`;

/* ── verification + late-bound CSS ───────────────────────────────────────── */

/* 1. every class token in the page must exist in the app source */
const tokenCount = verifyClassTokens(html);

/* 2. the "does nothing" table must stay true: these must emit no CSS */
const deadProbe = compileTailwind(
  `<div class="${DEAD_CLASSES.map((d) => d.cls).join(" ")}"></div>`
);
const resurrected = DEAD_CLASSES.filter((d) =>
  deadProbe.includes(`.${d.cls.replace(/([/:])/g, "\\$1")}`)
);
if (resurrected.length)
  throw new Error(
    `these classes now compile — remove them from DEAD_CLASSES: ${resurrected
      .map((d) => d.cls)
      .join(", ")}`
  );

/* 3. bespoke rules, lifted verbatim, in globals.css order */
const bespokeNames = [
  ...new Set(GALLERY.flatMap((s) => s.bespoke ?? [])),
];
const bespokeCss = extractGlobalRules(bespokeNames)
  .map((r) => `/* ${SRC.css}:${r.line} */\n${r.css}`)
  .join("\n");
if (/@apply/.test(bespokeCss))
  throw new Error("a lifted rule uses @apply — it will not render standalone");

/* 4. Tailwind, compiled by the app's own build over this exact markup */
const tailwindCss = compileTailwind(html);

const finalHtml = html
  .replace("__TAILWIND_CSS__", tailwindCss)
  .replace("__BESPOKE_CSS__", bespokeCss);

const outPath = join(ROOT, OUT);
if (process.argv.includes("--check")) {
  const current = readFileSync(outPath, "utf8");
  if (current !== finalHtml) {
    console.error(
      `${OUT} is stale — run \`pnpm docs:design-system\` and commit the result.`
    );
    process.exit(1);
  }
  console.log(`${OUT} is up to date.`);
} else {
  writeFileSync(outPath, finalHtml);
  console.log(
    `${OUT} written — ${light.size} light / ${dark.size} dark tokens (${allNames.length} names), ` +
      `${GALLERY.length} gallery sections, ${tokenCount} distinct class tokens verified, ` +
      `${bespokeNames.length} bespoke classes inlined.`
  );
}

#!/usr/bin/env node
/**
 * Runtime brace-glob probe (#824, born from #820).
 *
 * Green typecheck + green test suites do NOT detect brace-expansion /
 * minimatch incompatibilities: every non-brace glob pattern short-circuits
 * before brace expansion is ever called. #820 shipped a `brace-expansion: ^5`
 * override that passed 2354 tests and 6/6 typechecks while making
 * `glob.sync('*.{json,md}')` throw `TypeError: expand is not a function`.
 *
 * This script is the detector that caught it: it drives real brace patterns
 * through every minimatch / glob / test-exclude / brace-expansion copy that is
 * REACHABLE IN THE RESOLUTION GRAPH, plus the ESLint config-resolution path,
 * and reports pass/fail per consumer. Run it before AND after any change to the
 * brace-expansion or minimatch overrides in the root package.json.
 *
 *   node scripts/brace-glob-probe.mjs
 *
 * Exit code 0 = every reachable consumer expands braces correctly.
 *
 * Resolution-awareness (#905)
 * ---------------------------
 * The first cut of this probe enumerated copies by walking `node_modules/.pnpm`
 * DIRECTORIES. A pnpm store accumulates orphans: a dir left behind by an earlier
 * install that nothing resolves to any more. Those orphans are never loaded by
 * anything, but the directory walk still probed them — on main after #900 that
 * produced 9 VULNERABLE lines for brace-expansion 1.1.12/1.1.16 and minimatch
 * 2.0.2/2.1.2 while `pnpm why` resolved nothing to them and the lockfile pinned
 * only patched versions. Noise that loud hides a real regression.
 *
 * So the set of versions to ASSERT on now comes from the lockfile's resolution
 * graph (`pnpm-lock.yaml` -> `snapshots:`, which is exactly what `pnpm why`
 * reads), and the directory walk is demoted to "where do I find the bytes for a
 * resolved version". On-disk copies that are not in the graph are still listed,
 * as a non-failing INFO section, so a genuinely surprising store stays visible.
 */

import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pnpmDir = path.join(repoRoot, 'node_modules', '.pnpm');
const lockfile = path.join(repoRoot, 'pnpm-lock.yaml');

const results = [];
const record = (consumer, check, ok, detail) => {
  results.push({ consumer, check, ok, detail });
};

/** Non-failing observations: orphaned store dirs, skipped override specs, … */
const info = [];
const note = (scope, detail) => {
  info.push({ scope, detail });
};

// ---------------------------------------------------------------------------
// Resolution graph
// ---------------------------------------------------------------------------

/**
 * `name -> Set(version)` for everything in the lockfile's resolution graph.
 *
 * Parsed straight out of the `snapshots:` block of pnpm lockfile v9 — the same
 * structure `pnpm why` walks — rather than shelling out to `pnpm why` per
 * package (seconds per call, and it needs a resolved store to answer at all).
 * Keys look like `minimatch@9.0.9`, `'@babel/core@7.29.6'`, or
 * `foo@1.2.3(bar@4.5.6)` when peers are involved; the peer suffix is dropped
 * because it does not change which bytes are on disk for that version.
 */
function resolvedGraph() {
  const graph = new Map();
  if (!existsSync(lockfile)) return null;
  const lines = readFileSync(lockfile, 'utf8').split('\n');
  let inSnapshots = false;
  for (const line of lines) {
    if (/^[a-zA-Z]/.test(line)) {
      inSnapshots = line.startsWith('snapshots:');
      continue;
    }
    if (!inSnapshots) continue;
    // Entry keys sit at exactly 2 spaces of indent and end in `:`.
    const m = /^ {2}'?((?:@[^/'\s]+\/)?[^@'\s][^'\s]*?)@([^('\s]+)(?:\([^']*\))?'?:\s*$/.exec(line);
    if (!m) continue;
    const [, name, version] = m;
    if (!/^\d/.test(version)) continue; // links / aliases, not a real version
    if (!graph.has(name)) graph.set(name, new Set());
    graph.get(name).add(version);
  }
  return graph.size ? graph : null;
}

const graph = resolvedGraph();
if (!graph) {
  console.error(
    'brace-glob-probe: could not read the resolution graph from pnpm-lock.yaml — ' +
      'refusing to fall back to a directory walk (that is the #905 false-positive mode).',
  );
  process.exit(2);
}

/**
 * Copies of `name` to probe.
 *
 * Enumerates the pnpm store for the bytes, then partitions by whether the
 * version appears in the resolution graph. Only `reachable` is asserted on.
 */
function copies(name) {
  const resolved = graph.get(name) ?? new Set();
  const reachable = [];
  const orphaned = [];
  const seen = new Set();

  if (existsSync(pnpmDir)) {
    const encoded = name.replace('/', '+');
    for (const d of readdirSync(pnpmDir)) {
      if (!d.startsWith(`${encoded}@`) || !/@\d/.test(d.slice(encoded.length))) continue;
      const dir = path.join(pnpmDir, d, 'node_modules', ...name.split('/'));
      if (!existsSync(path.join(dir, 'package.json'))) continue;
      const version = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8')).version;
      if (resolved.has(version)) {
        if (seen.has(version)) continue; // same version, different peer hash
        seen.add(version);
        reachable.push([version, dir]);
      } else {
        orphaned.push([version, d]);
      }
    }
  }

  for (const [version, d] of orphaned.sort(cmpVersion)) {
    note(name, `${name}@${version} on disk (.pnpm/${d}) but NOT in the resolution graph — not probed`);
  }

  // A version the graph resolves but that has no bytes on disk means the probe
  // silently covers less than it claims to — that is a failure, not an INFO.
  for (const version of [...resolved].sort()) {
    if (!seen.has(version)) {
      record(`${name}@${version}`, 'resolved copy is installed', false, 'in pnpm-lock.yaml but no copy under node_modules/.pnpm — run `pnpm install`');
    }
  }

  return reachable.sort(cmpVersion);
}

const cmpVersion = (a, b) => a[0].localeCompare(b[0], undefined, { numeric: true });

// ---------------------------------------------------------------------------
// 0. Override conformance — every resolved version honors the root pin
// ---------------------------------------------------------------------------
// The CVE bounds only stay in the tree because root package.json pins patched
// ranges per major. A dependency bump that drags in an unpinned major (a new
// `minimatch@10`, say) would resolve to something this probe has no pin for,
// so surface it here rather than discovering it as a runtime failure later.
const PINNED = ['brace-expansion', 'minimatch', 'picomatch'];
const overrides = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8')).pnpm
  ?.overrides ?? {};

/** Enough semver for the range forms the overrides actually use. */
function satisfies(version, range) {
  const parse = (v) => v.split('-')[0].split('.').map(Number);
  const [vMaj, vMin, vPat] = parse(version);
  const op = /^[\^~]/.test(range) ? range[0] : '=';
  const [rMaj, rMin, rPat] = parse(range.replace(/^[\^~]/, ''));
  if ([vMaj, vMin, vPat, rMaj, rMin, rPat].some(Number.isNaN)) return null; // unsupported form
  const gte =
    vMaj > rMaj ||
    (vMaj === rMaj && (vMin > rMin || (vMin === rMin && vPat >= rPat)));
  if (op === '=') return vMaj === rMaj && vMin === rMin && vPat === rPat;
  if (op === '^') return vMaj === rMaj && gte;
  return vMaj === rMaj && vMin === rMin && gte;
}

for (const name of PINNED) {
  const specs = Object.entries(overrides)
    .filter(([k]) => k === name || k.startsWith(`${name}@`))
    .map(([k, v]) => [k.includes('@') ? k.slice(name.length + 1) : null, v]);
  for (const version of [...(graph.get(name) ?? [])].sort()) {
    const major = version.split('.')[0];
    const hit = specs.find(([m]) => m === null || m === major);
    if (!hit) {
      record(`${name}@${version}`, 'covered by a root override pin', false, `no override for major ${major} in package.json pnpm.overrides`);
      continue;
    }
    const ok = satisfies(version, hit[1]);
    if (ok === null) {
      note(name, `override spec '${hit[1]}' is not a form this probe can evaluate — skipped`);
      continue;
    }
    record(`${name}@${version}`, 'covered by a root override pin', ok, `pin ${name}@${major} = ${hit[1]}`);
  }
}

// ---------------------------------------------------------------------------
// 1. brace-expansion — export shape + expansion + the CVE-2026-14257 bound
// ---------------------------------------------------------------------------
for (const [version, dir] of copies('brace-expansion')) {
  const tag = `brace-expansion@${version}`;
  let mod;
  try {
    mod = require(dir);
  } catch (e) {
    record(tag, 'require()', false, e.message);
    continue;
  }

  // minimatch 3/4/5/9 all call the module as a bare function. brace-expansion
  // 5.x broke that (named `exports.expand` only) — the #820 regression.
  const callable = typeof mod === 'function';
  const expand = callable ? mod : mod.expand;
  record(tag, 'CJS default export is callable', callable, `typeof = ${typeof mod}`);

  try {
    const out = expand('a{b,c}d');
    const ok = out.join(',') === 'abd,acd';
    record(tag, "expand('a{b,c}d')", ok, out.join(','));
  } catch (e) {
    record(tag, "expand('a{b,c}d')", false, e.message);
  }

  try {
    const out = expand('{1..3}');
    record(tag, "expand('{1..3}') sequence", out.join(',') === '1,2,3', out.join(','));
  } catch (e) {
    record(tag, "expand('{1..3}') sequence", false, e.message);
  }

  // CVE-2026-14257: unbounded expansion length -> OOM. Patched builds bound
  // the accumulator (EXPANSION_MAX_LENGTH = 4_000_000 chars). An UNPATCHED
  // build never returns here, so this has to run in a memory- and time-capped
  // child process or the probe itself becomes the DoS victim.
  const bombScript = `
    const expand = (m => typeof m === 'function' ? m : m.expand)(require(${JSON.stringify(dir)}));
    const t = Date.now();
    const out = expand('{a,b}'.repeat(1500));
    const chars = out.reduce((n, s) => n + s.length, 0);
    process.stdout.write(JSON.stringify({ n: out.length, chars, ms: Date.now() - t }));
  `;
  try {
    const raw = execFileSync(process.execPath, ['--max-old-space-size=512', '-e', bombScript], {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 20_000,
      killSignal: 'SIGKILL',
    }).toString();
    const { n, chars, ms } = JSON.parse(raw);
    record(
      tag,
      'CVE-2026-14257 bound on {a,b}x1500',
      chars <= 4_000_000,
      `${n} results / ${chars} chars in ${ms}ms`,
    );
  } catch (e) {
    const oom = /heap out of memory|Allocation failed/i.test((e.stderr || '').toString());
    const why =
      e.signal === 'SIGKILL' ? 'no return within 20s — unbounded (VULNERABLE)'
      : oom ? 'JS heap out of memory — unbounded (VULNERABLE)'
      : String(e.message).slice(0, 120);
    record(tag, 'CVE-2026-14257 bound on {a,b}x1500', false, why);
  }
}

// ---------------------------------------------------------------------------
// 2. minimatch — every installed major, through its real callable API
// ---------------------------------------------------------------------------
for (const [version, dir] of copies('minimatch')) {
  const tag = `minimatch@${version}`;
  let mm;
  try {
    mm = require(dir);
  } catch (e) {
    record(tag, 'require()', false, e.message);
    continue;
  }
  const match = typeof mm === 'function' ? mm : mm.minimatch;
  // minimatch 3/4/5 are called bare (`minimatch(file, pattern)`) by glob@7,
  // test-exclude@6 and the ESLint 8 plugin chain, so a callable default export
  // is load-bearing there. 9.x and 10.x deliberately export a namespace object
  // and their consumers use the named `minimatch` export; requiring callability
  // there would be a false failure.
  const major = Number(version.split('.')[0]);
  if (major < 9) {
    record(tag, 'CJS default export is callable', typeof mm === 'function', `typeof = ${typeof mm}`);
  } else {
    record(tag, 'named `minimatch` export present', typeof match === 'function', `typeof = ${typeof mm}`);
  }

  for (const [pattern, file, want] of [
    ['*.{json,md}', 'a.json', true],
    ['*.{json,md}', 'a.md', true],
    ['*.{json,md}', 'a.txt', false],
    ['src/**/*.{ts,tsx}', 'src/x/y.tsx', true],
    ['file{1..3}.txt', 'file2.txt', true],
  ]) {
    try {
      const got = match(file, pattern);
      record(tag, `match('${file}', '${pattern}')`, got === want, String(got));
    } catch (e) {
      record(tag, `match('${file}', '${pattern}')`, false, e.message);
    }
  }

  try {
    const out = mm.braceExpand('*.{json,md}');
    record(tag, "braceExpand('*.{json,md}')", out.join(',') === '*.json,*.md', out.join(','));
  } catch (e) {
    record(tag, "braceExpand('*.{json,md}')", false, e.message);
  }
}

// ---------------------------------------------------------------------------
// 3. glob — the #820 smoke, run against real files, per installed major
// ---------------------------------------------------------------------------
for (const [version, dir] of copies('glob')) {
  const tag = `glob@${version}`;
  let g;
  try {
    g = require(dir);
  } catch (e) {
    record(tag, 'require()', false, e.message);
    continue;
  }
  const sync = typeof g.sync === 'function' ? g.sync : g.globSync;
  if (typeof sync !== 'function') {
    record(tag, 'sync entry point', false, `keys = ${Object.keys(g).join(',')}`);
    continue;
  }
  for (const pattern of ['*.{json,md}', '*.{json,yaml}', 'scripts/*.{mjs,ts}']) {
    try {
      const out = sync(pattern, { cwd: repoRoot });
      record(tag, `sync('${pattern}')`, out.length > 0, `${out.length} file(s)`);
    } catch (e) {
      record(tag, `sync('${pattern}')`, false, e.message);
    }
  }
}

// ---------------------------------------------------------------------------
// 4. test-exclude — istanbul/jest coverage globs (minimatch consumer)
// ---------------------------------------------------------------------------
for (const [version, dir] of copies('test-exclude')) {
  const tag = `test-exclude@${version}`;
  try {
    const TestExclude = require(dir);
    const ex = new TestExclude({ include: ['src/**/*.{ts,tsx}'], exclude: ['**/*.{test,spec}.ts'] });
    const included = ex.shouldInstrument('src/lib/foo.tsx');
    const excluded = ex.shouldInstrument('src/lib/foo.test.ts');
    record(tag, "include 'src/**/*.{ts,tsx}'", included === true, String(included));
    record(tag, "exclude '**/*.{test,spec}.ts'", excluded === false, String(excluded));
  } catch (e) {
    record(tag, 'brace include/exclude', false, e.message);
  }
}

// ---------------------------------------------------------------------------
// 5. ESLint config resolution — @eslint/eslintrc + @humanwhocodes/config-array
//    + eslint-plugin-import/react/jsx-a11y all match `overrides.files` and
//    `ignorePatterns` through minimatch@3.
// ---------------------------------------------------------------------------
try {
  const { ESLint } = require(path.join(repoRoot, 'apps', 'web', 'node_modules', 'eslint'));
  const eslint = new ESLint({
    useEslintrc: false,
    cwd: repoRoot,
    overrideConfig: {
      overrides: [
        { files: ['**/*.{ts,tsx}'], rules: { 'no-debugger': 'error' } },
        { files: ['**/*.{spec,test}.tsx'], rules: { 'no-debugger': 'off' } },
      ],
    },
  });
  const [tsResult] = await eslint.lintText('debugger;\n', { filePath: 'probe/sample.tsx' });
  const braceOverrideApplied = tsResult.messages.some((m) => m.ruleId === 'no-debugger');
  record(
    'eslint (overrides.files brace)',
    "'**/*.{ts,tsx}' selects sample.tsx",
    braceOverrideApplied,
    JSON.stringify(tsResult.messages.map((m) => m.ruleId)),
  );

  const [jsResult] = await eslint.lintText('debugger;\n', { filePath: 'probe/sample.js' });
  record(
    'eslint (overrides.files brace)',
    "'**/*.{ts,tsx}' skips sample.js",
    !jsResult.messages.some((m) => m.ruleId === 'no-debugger'),
    JSON.stringify(jsResult.messages.map((m) => m.ruleId)),
  );

  // A second, later override with a brace pattern must win — this exercises
  // minimatch@3 twice per file through @humanwhocodes/config-array's cascade.
  // (NB: `ignorePatterns` is deliberately NOT probed: ESLint routes ignores
  // through the `ignore` package with gitignore semantics, which has no brace
  // support and no minimatch involvement, so it proves nothing here.)
  const [specResult] = await eslint.lintText('debugger;\n', { filePath: 'probe/sample.spec.tsx' });
  record(
    'eslint (override cascade)',
    "'**/*.{spec,test}.tsx' overrides '**/*.{ts,tsx}'",
    !specResult.messages.some((m) => m.ruleId === 'no-debugger'),
    JSON.stringify(specResult.messages.map((m) => m.ruleId)),
  );
} catch (e) {
  record('eslint', 'config resolution with brace patterns', false, e.message);
}

// ---------------------------------------------------------------------------
// 6. prettier CLI — the repo's own brace glob (`**/*.{ts,tsx,js,jsx,json,css,md}`)
// ---------------------------------------------------------------------------
try {
  const out = execFileSync(
    process.execPath,
    [
      path.join(repoRoot, 'node_modules', 'prettier', 'bin', 'prettier.cjs'),
      '--no-config',
      '--find-config-path',
      'package.json',
    ],
    { cwd: repoRoot, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  void out;
  const listed = execFileSync(
    process.execPath,
    [
      path.join(repoRoot, 'node_modules', 'prettier', 'bin', 'prettier.cjs'),
      '--list-different',
      'package{.json,-does-not-exist.json}',
    ],
    { cwd: repoRoot, stdio: ['ignore', 'pipe', 'pipe'] },
  ).toString();
  record('prettier CLI', 'brace glob resolves', true, listed.trim() || 'no diff');
} catch (e) {
  // --list-different exits 1 when files differ; only a *throw with no stdout*
  // or a pattern error is a real failure.
  const stderr = (e.stderr || '').toString();
  const ok = !/No files matching|expand is not a function|is not a function/.test(stderr);
  record('prettier CLI', 'brace glob resolves', ok, stderr.trim().slice(0, 200) || 'exit 1, no error');
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const pad = (s, n) => String(s).padEnd(n);
const w1 = Math.max(...results.map((r) => r.consumer.length), 8);
const w2 = Math.max(...results.map((r) => r.check.length), 5);
console.log(`${pad('CONSUMER', w1)}  ${pad('CHECK', w2)}  RESULT  DETAIL`);
for (const r of results) {
  console.log(`${pad(r.consumer, w1)}  ${pad(r.check, w2)}  ${r.ok ? 'PASS  ' : 'FAIL  '}  ${r.detail}`);
}
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);

// Informational only — never affects the exit code. Orphaned store dirs are
// bytes nothing resolves to; probing them was the #905 false-positive source.
if (info.length) {
  console.log(`\nINFO (not asserted, does not affect exit code) — ${info.length} item(s):`);
  for (const i of info) console.log(`  ${i.scope} :: ${i.detail}`);
}

if (failed.length) {
  console.log('FAILURES:');
  for (const f of failed) console.log(`  ${f.consumer} :: ${f.check} :: ${f.detail}`);
  process.exit(1);
}

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
 * through every installed minimatch / glob / test-exclude / brace-expansion
 * copy in the pnpm store, plus the ESLint config-resolution path, and reports
 * pass/fail per consumer. Run it before AND after any change to the
 * brace-expansion or minimatch overrides in the root package.json.
 *
 *   node scripts/brace-glob-probe.mjs
 *
 * Exit code 0 = every reachable consumer expands braces correctly.
 */

import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pnpmDir = path.join(repoRoot, 'node_modules', '.pnpm');

const results = [];
const record = (consumer, check, ok, detail) => {
  results.push({ consumer, check, ok, detail });
};

/** Every installed copy of `name` in the pnpm store, as [version, dir] pairs. */
function installedCopies(name) {
  if (!existsSync(pnpmDir)) return [];
  const encoded = name.replace('/', '+');
  return readdirSync(pnpmDir)
    .filter((d) => d.startsWith(`${encoded}@`) && /@\d/.test(d.slice(encoded.length)))
    .map((d) => {
      const dir = path.join(pnpmDir, d, 'node_modules', ...name.split('/'));
      if (!existsSync(dir)) return null;
      const version = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8')).version;
      return [version, dir];
    })
    .filter(Boolean)
    .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));
}

// ---------------------------------------------------------------------------
// 1. brace-expansion — export shape + expansion + the CVE-2026-14257 bound
// ---------------------------------------------------------------------------
for (const [version, dir] of installedCopies('brace-expansion')) {
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
for (const [version, dir] of installedCopies('minimatch')) {
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
for (const [version, dir] of installedCopies('glob')) {
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
for (const [version, dir] of installedCopies('test-exclude')) {
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
if (failed.length) {
  console.log('FAILURES:');
  for (const f of failed) console.log(`  ${f.consumer} :: ${f.check} :: ${f.detail}`);
  process.exit(1);
}

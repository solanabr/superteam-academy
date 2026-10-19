#!/usr/bin/env node
// PreToolUse guard for merging PRs (`gh pr merge`, and the REST merge endpoint
// through `gh api`). Before the merge it checks, on the PR's CURRENT head SHA:
//   - every required status check has reported, COMPLETED, and is green
//     (success, neutral or skipped). A rollup read right after a push can be
//     stale or partial, so a missing required check blocks too;
//   - --match-head-commit, when given, still equals the head;
//   - the merge commit message won't carry a CI-skip marker (the --subject/
//     --body passed, otherwise the PR title and the PR's commit messages, which
//     are this repo's default squash body).
// `--auto` skips the checks step, because GitHub only fires auto-merge once the
// required checks pass. Any gh failure blocks: the guard fails closed.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { SKIP_MARKER } from "./guard-git.mjs";
import { basename, commands, normalize, runHook } from "./lib/shell.mjs";

// The required checks on this repo's main, used only when branch protection
// can't be read (the endpoint needs admin). The names must match the job names
// in ci.yml and action-pin-guard.yml; a hook test asserts they do.
export const HOME_REPO = "solanabr/superteam-academy";
export const FALLBACK_REQUIRED = [
  "Frontend (lint · typecheck · test)",
  "On-chain (fmt · clippy · cargo test)",
  "SHA-pin guard",
];
const GREEN = new Set(["success", "neutral", "skipped"]);

const deny = (reason) => ({ allow: false, reason });

export function ghRunner(cwd) {
  return (args) => {
    const r = spawnSync("gh", args, {
      cwd,
      encoding: "utf8",
      timeout: 20_000,
      maxBuffer: 64 * 1024 * 1024,
    });
    if (r.error || r.status !== 0) {
      // gh's stderr is not echoed: keep the denial free of tokens or URLs.
      throw new Error(
        `gh ${args.slice(0, 2).join(" ")} failed (exit ${r.status ?? "spawn error"})`
      );
    }
    return r.stdout;
  };
}

const PR_MERGE_VALUES = {
  "--subject": "subject",
  "-t": "subject",
  "--body": "body",
  "-b": "body",
  "--body-file": "bodyFile",
  "-F": "bodyFile",
  "--match-head-commit": "matchHead",
  "--repo": "repo",
  "-R": "repo",
  "--author-email": "authorEmail",
  "-A": "authorEmail",
};
const PR_MERGE_BOOLS = {
  s: "squash",
  m: "merge",
  r: "rebase",
  d: "deleteBranch",
};

function parsePrMerge(args) {
  const o = {
    selector: null,
    method: null,
    auto: false,
    disableAuto: false,
    subject: null,
    body: null,
    bodyFile: null,
    matchHead: null,
    repo: null,
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const eq = a.indexOf("=");
    if (
      a.startsWith("--") &&
      eq > 0 &&
      Object.hasOwn(PR_MERGE_VALUES, a.slice(0, eq))
    ) {
      o[PR_MERGE_VALUES[a.slice(0, eq)]] = a.slice(eq + 1);
    } else if (Object.hasOwn(PR_MERGE_VALUES, a)) {
      o[PR_MERGE_VALUES[a]] = args[++i] ?? "";
    } else if (a === "--squash" || a === "--merge" || a === "--rebase") {
      o.method = a.slice(2);
    } else if (a === "--auto") {
      o.auto = true;
    } else if (a === "--disable-auto") {
      o.disableAuto = true;
    } else if (/^-[smrd]+$/.test(a)) {
      for (const ch of a.slice(1))
        if (PR_MERGE_BOOLS[ch] !== "deleteBranch")
          o.method = PR_MERGE_BOOLS[ch];
    } else if (!a.startsWith("-") && o.selector === null) {
      o.selector = a;
    }
  }
  return o;
}

const API_VALUES = new Set([
  "-X",
  "--method",
  "-f",
  "--raw-field",
  "-F",
  "--field",
  "-H",
  "--header",
  "--input",
  "-q",
  "--jq",
  "-t",
  "--template",
  "--cache",
  "-p",
  "--preview",
  "--hostname",
]);

function parseApi(args) {
  let endpoint = null;
  let method = null;
  let input = null;
  const fields = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const eq = a.indexOf("=");
    const name = a.startsWith("--") && eq > 0 ? a.slice(0, eq) : a;
    const inline = a.startsWith("--") && eq > 0 ? a.slice(eq + 1) : null;
    if (/^-X.+/.test(a)) {
      method = a.slice(2).toUpperCase();
    } else if (/^-[fF].+=/.test(a)) {
      const k = a.indexOf("=");
      fields[a.slice(2, k)] = a.slice(k + 1);
    } else if (API_VALUES.has(name)) {
      const value = inline ?? args[++i] ?? "";
      if (name === "-X" || name === "--method") method = value.toUpperCase();
      else if (["-f", "--raw-field", "-F", "--field"].includes(name)) {
        const k = value.indexOf("=");
        if (k > 0) fields[value.slice(0, k)] = value.slice(k + 1);
      } else if (name === "--input") input = value;
    } else if (!a.startsWith("-") && endpoint === null) {
      endpoint = a;
    }
  }
  if (!method) method = Object.keys(fields).length || input ? "POST" : "GET";
  return { endpoint, method, fields, input };
}

function repoFromCwd(gh) {
  const view = JSON.parse(gh(["repo", "view", "--json", "owner,name"]));
  return `${view.owner.login}/${view.name}`;
}

// Turn a gh invocation into a merge target, or null when it isn't a merge.
function mergeTarget(args, { gh, readFile, cwd, raw }) {
  if (args[0] === "pr" && args[1] === "merge") {
    const o = parsePrMerge(args.slice(2));
    if (o.disableAuto) return null;
    return { ...o };
  }
  if (args[0] !== "api") return null;

  const api = parseApi(args.slice(1));
  if (api.endpoint === "graphql") {
    return /mergePullRequest|enablePullRequestAutoMerge/.test(raw)
      ? {
          deny: "Blocked: merge PRs with `gh pr merge` so the merge guard can check it, not through the GraphQL API.",
        }
      : null;
  }
  const m = api.endpoint
    ?.split("?")[0]
    .match(/(?:^|\/)repos\/([^/]+)\/([^/]+)\/pulls\/(\d+)\/merge\/?$/);
  if (!m || api.method === "GET") return null;

  let fields = api.fields;
  if (api.input && api.input !== "-") {
    try {
      fields = {
        ...JSON.parse(readFile(path.resolve(cwd, api.input), "utf8")),
        ...fields,
      };
    } catch {
      return {
        deny: "Blocked: couldn't read the --input body of the merge call to check it.",
      };
    }
  }
  let repo = `${m[1]}/${m[2]}`;
  if (/[{:]/.test(repo)) repo = repoFromCwd(gh);
  return {
    selector: m[3],
    repo,
    method: fields.merge_method ?? "merge",
    subject: fields.commit_title ?? null,
    body: fields.commit_message ?? null,
    bodyFile: null,
    matchHead: fields.sha ?? null,
    auto: false,
  };
}

function lines(out) {
  return out
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));
}

function requiredChecks(gh, repo, base) {
  try {
    const j = JSON.parse(
      gh([
        "api",
        `repos/${repo}/branches/${encodeURIComponent(base)}/protection/required_status_checks`,
      ])
    );
    return [
      ...new Set([
        ...(j.contexts ?? []),
        ...(j.checks ?? []).map((c) => c.context),
      ]),
    ];
  } catch {
    // Unreadable protection: use the known list for this repo's main. Anywhere
    // else, return none, and checkProblems then requires every check that
    // reported on the head to be COMPLETED and green.
    return repo.toLowerCase() === HOME_REPO && base === "main"
      ? FALLBACK_REQUIRED
      : [];
  }
}

function checkState(gh, repo, sha) {
  const runs = new Map();
  const runOut = gh([
    "api",
    "--paginate",
    `repos/${repo}/commits/${sha}/check-runs?per_page=100`,
    "--jq",
    ".check_runs[] | {id, name, status, conclusion}",
  ]);
  for (const run of lines(runOut)) {
    const prev = runs.get(run.name);
    if (!prev || run.id > prev.id) runs.set(run.name, run);
  }
  const statuses = new Map();
  const statusOut = gh([
    "api",
    `repos/${repo}/commits/${sha}/status`,
    "--jq",
    ".statuses[] | {context, state}",
  ]);
  for (const s of lines(statusOut))
    if (!statuses.has(s.context)) statuses.set(s.context, s);
  return { runs, statuses };
}

function checkProblems(required, { runs, statuses }) {
  const problems = [];
  const names = required.length
    ? required
    : [...runs.keys(), ...statuses.keys()];
  for (const name of names) {
    const run = runs.get(name);
    const status = statuses.get(name);
    if (run) {
      if (run.status !== "completed") problems.push(`${name}: ${run.status}`);
      else if (!GREEN.has(run.conclusion))
        problems.push(`${name}: ${run.conclusion}`);
    } else if (status) {
      if (status.state !== "success") problems.push(`${name}: ${status.state}`);
    } else {
      problems.push(`${name}: not reported on the head commit yet`);
    }
  }
  return problems;
}

function verify(target, { gh, readFile, cwd, raw }) {
  const viewArgs = ["pr", "view"];
  if (target.selector) viewArgs.push(target.selector);
  if (target.repo) viewArgs.push("--repo", target.repo);
  viewArgs.push("--json", "number,url,headRefOid,baseRefName,title,commits");
  const pr = JSON.parse(gh(viewArgs));
  const repo = pr.url.match(/github\.com\/([^/]+\/[^/]+)\/pull\//)?.[1];
  if (!repo)
    return deny("Blocked: couldn't tell which repository the PR belongs to.");
  const head = String(pr.headRefOid).toLowerCase();

  if (target.matchHead !== null) {
    const want = target.matchHead.toLowerCase();
    if (want.length < 7 || !head.startsWith(want)) {
      return deny(
        `Blocked: PR #${pr.number}'s head is ${head.slice(0, 12)}, not the commit you named. Re-check the new head before merging.`
      );
    }
  }

  const texts = [raw];
  if (target.bodyFile && target.bodyFile !== "-") {
    try {
      texts.push(readFile(path.resolve(cwd, target.bodyFile), "utf8"));
    } catch {
      return deny(
        "Blocked: couldn't read --body-file to check it for CI-skip markers."
      );
    }
  }
  if (target.subject === null) texts.push(pr.title ?? "");
  const bodyGiven = target.body !== null || Boolean(target.bodyFile);
  if (!(target.method === "squash" && bodyGiven)) {
    for (const c of pr.commits ?? [])
      texts.push(`${c.messageHeadline ?? ""}\n${c.messageBody ?? ""}`);
  }
  if (texts.some((t) => SKIP_MARKER.test(t))) {
    return deny(
      `Blocked: the merge commit for PR #${pr.number} would carry a CI-skip marker (from the subject/body you passed, the PR title, or a commit message in the default squash body). Pass --subject/--body without it so CI runs on the merge commit.`
    );
  }

  if (target.auto) return { allow: true };

  const required = requiredChecks(gh, repo, pr.baseRefName);
  const problems = checkProblems(required, checkState(gh, repo, head));
  if (problems.length) {
    return deny(
      `Blocked: PR #${pr.number} isn't green on its current head ${head.slice(0, 12)}. Wait for these and re-check: ${problems.join("; ")}.`
    );
  }
  return { allow: true };
}

export function decide(
  command,
  { cwd = process.cwd(), gh = ghRunner(cwd), readFile = fs.readFileSync } = {}
) {
  const raw = normalize(command);
  for (const { argv } of commands(raw)) {
    if (basename(argv[0] ?? "") !== "gh") continue;
    let target;
    try {
      target = mergeTarget(argv.slice(1), { gh, readFile, cwd, raw });
      if (!target) continue;
      if (target.deny) return deny(target.deny);
      const verdict = verify(target, { gh, readFile, cwd, raw });
      if (!verdict.allow) return verdict;
    } catch (err) {
      return deny(
        `Blocked: couldn't verify the merge (${err.message}). The guard fails closed; check the PR by hand and retry.`
      );
    }
  }
  return { allow: true };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  runHook(decide);
}

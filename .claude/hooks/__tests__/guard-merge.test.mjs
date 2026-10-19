import assert from "node:assert/strict";
import { test } from "node:test";

import { decide, FALLBACK_REQUIRED } from "../guard-merge.mjs";

const HEAD = "a".repeat(40);
const OLD = "b".repeat(40);
const REQUIRED = FALLBACK_REQUIRED;

const greenRuns = () => [
  ...REQUIRED.map((name, i) => ({
    id: 100 + i,
    name,
    status: "completed",
    conclusion: "success",
  })),
  {
    id: 200,
    name: "E2E (Playwright · learner paths)",
    status: "completed",
    conclusion: "skipped",
  },
];

// A fake `gh` that answers from a scenario and records what it was asked.
function fakeGh(s = {}) {
  const calls = [];
  const pr = {
    number: 42,
    url: "https://github.com/solanabr/superteam-academy/pull/42",
    headRefOid: HEAD,
    baseRefName: "main",
    title: "fix(web): stop the double submit",
    commits: [
      { messageHeadline: "fix(web): stop the double submit", messageBody: "" },
    ],
    ...s.pr,
  };
  const gh = (args) => {
    calls.push(args);
    const joined = args.join(" ");
    if (args[0] === "pr" && args[1] === "view") {
      if (s.prViewFails) throw new Error("gh pr view failed (exit 1)");
      return JSON.stringify(pr);
    }
    if (args[0] === "repo" && args[1] === "view")
      return JSON.stringify({
        owner: { login: "solanabr" },
        name: "superteam-academy",
      });
    if (joined.includes("/protection/required_status_checks")) {
      if (s.protection === "forbidden")
        throw new Error("gh api failed (exit 1)");
      return JSON.stringify({ contexts: s.protection ?? REQUIRED, checks: [] });
    }
    if (joined.includes("/check-runs")) {
      if (!joined.includes(`/commits/${pr.headRefOid}/`))
        throw new Error("asked for the wrong SHA");
      return (s.runs ?? greenRuns()).map((r) => JSON.stringify(r)).join("\n");
    }
    if (
      joined.endsWith("/status --jq .statuses[] | {context, state}") ||
      joined.includes("/status")
    ) {
      return (s.statuses ?? []).map((r) => JSON.stringify(r)).join("\n");
    }
    throw new Error(`unexpected gh call: ${joined}`);
  };
  return { gh, calls };
}

const run = (cmd, scenario) => {
  const { gh, calls } = fakeGh(scenario);
  return { v: decide(cmd, { cwd: "/repo", gh, readFile: () => "" }), calls };
};

test("allows a squash merge when every required check is green on the head", () => {
  const { v, calls } = run("gh pr merge 42 --squash --delete-branch");
  assert.deepEqual(v, { allow: true });
  assert.ok(
    calls.some((c) => c.join(" ").includes(`/commits/${HEAD}/check-runs`))
  );
});

test("allows with a matching --match-head-commit", () => {
  assert.deepEqual(
    run(`gh pr merge 42 --squash --match-head-commit ${HEAD}`).v,
    { allow: true }
  );
});

test("allows when a required check is a commit status instead of a check run", () => {
  const runs = greenRuns().filter((r) => r.name !== "SHA-pin guard");
  const { v } = run("gh pr merge 42 --squash", {
    runs,
    statuses: [{ context: "SHA-pin guard", state: "success" }],
  });
  assert.deepEqual(v, { allow: true });
});

test("uses the latest run when a check was re-run", () => {
  const runs = [
    ...greenRuns(),
    { id: 50, name: REQUIRED[0], status: "completed", conclusion: "failure" },
  ];
  assert.deepEqual(run("gh pr merge 42 --squash", { runs }).v, { allow: true });
});

test("falls back to the known required checks when protection can't be read", () => {
  const runs = greenRuns().filter(
    (r) => r.name !== "On-chain (fmt · clippy · cargo test)"
  );
  const { v } = run("gh pr merge 42 --squash", {
    protection: "forbidden",
    runs,
  });
  assert.equal(v.allow, false);
  assert.match(v.reason, /On-chain .*not reported/);
});

test("blocks when a required check is still running", () => {
  const runs = greenRuns().map((r) =>
    r.name === REQUIRED[0]
      ? { ...r, status: "in_progress", conclusion: null }
      : r
  );
  const { v } = run("gh pr merge 42 --squash", { runs });
  assert.equal(v.allow, false);
  assert.match(v.reason, /Frontend .*in_progress/);
});

test("blocks when a required check failed", () => {
  const runs = greenRuns().map((r) =>
    r.name === REQUIRED[1] ? { ...r, conclusion: "failure" } : r
  );
  const { v } = run("gh pr merge 42 --squash", { runs });
  assert.equal(v.allow, false);
  assert.match(v.reason, /failure/);
});

test("blocks a stale rollup: required checks haven't reported on the new head", () => {
  const { v } = run("gh pr merge 42 --squash", { runs: [] });
  assert.equal(v.allow, false);
  assert.match(v.reason, /not reported on the head commit yet/);
});

test("blocks when --match-head-commit names an older commit", () => {
  const { v } = run(`gh pr merge 42 --squash --match-head-commit ${OLD}`);
  assert.equal(v.allow, false);
  assert.match(v.reason, /head is aaaaaaaaaaaa/);
});

test("blocks a CI-skip marker in --body", () => {
  const { v } = run('gh pr merge 42 --squash --body "Bump [skip ci]"');
  assert.equal(v.allow, false);
  assert.match(v.reason, /CI-skip marker/);
});

test("blocks a marker in a PR commit when the default squash body would carry it", () => {
  const pr = {
    commits: [{ messageHeadline: "wip", messageBody: "[ci skip]" }],
  };
  assert.equal(run("gh pr merge 42 --squash", { pr }).v.allow, false);
});

test("allows that PR once --body replaces the commit list", () => {
  const pr = {
    commits: [{ messageHeadline: "wip", messageBody: "[ci skip]" }],
  };
  assert.deepEqual(
    run('gh pr merge 42 --squash --body "Fixes the double submit."', { pr }).v,
    { allow: true }
  );
});

test("blocks a marker in the PR title unless --subject replaces it", () => {
  const pr = { title: "chore: bump lockfile [skip ci]", commits: [] };
  assert.equal(run("gh pr merge 42 --squash", { pr }).v.allow, false);
  assert.deepEqual(
    run('gh pr merge 42 --squash --subject "chore: bump lockfile (#42)"', {
      pr,
    }).v,
    { allow: true }
  );
});

test("--auto checks markers but leaves required checks to GitHub", () => {
  assert.deepEqual(run("gh pr merge 42 --squash --auto", { runs: [] }).v, {
    allow: true,
  });
  assert.equal(
    run('gh pr merge 42 --squash --auto --body "[no ci]"').v.allow,
    false
  );
});

test("--disable-auto is not a merge", () => {
  const { v, calls } = run("gh pr merge 42 --disable-auto");
  assert.deepEqual(v, { allow: true });
  assert.equal(calls.length, 0);
});

test("fails closed when gh can't read the PR", () => {
  const { v } = run("gh pr merge 42 --squash", { prViewFails: true });
  assert.equal(v.allow, false);
  assert.match(v.reason, /fails closed/);
});

test("guards the REST merge endpoint through gh api", () => {
  const cmd =
    "gh api -X PUT repos/solanabr/superteam-academy/pulls/42/merge -f merge_method=squash";
  assert.equal(run(cmd, { runs: [] }).v.allow, false);
  assert.deepEqual(run(cmd).v, { allow: true });
  assert.equal(run(`${cmd} -f sha=${OLD}`).v.allow, false);
  assert.equal(run(`${cmd} -f commit_message='[skip ci]'`).v.allow, false);
});

test("resolves {owner}/{repo} placeholders", () => {
  const cmd =
    "gh api --method PUT 'repos/{owner}/{repo}/pulls/42/merge' -f merge_method=squash";
  assert.deepEqual(run(cmd).v, { allow: true });
});

test("blocks a GraphQL merge so it goes through gh pr merge", () => {
  const { v } = run(
    `gh api graphql -f query='mutation { mergePullRequest(input: {pullRequestId: "x"}) { clientMutationId } }'`
  );
  assert.equal(v.allow, false);
});

test("ignores unrelated gh commands", () => {
  for (const cmd of [
    "gh pr view 42",
    "gh pr checks 42",
    "gh api repos/solanabr/superteam-academy/pulls/42/merge",
    "gh pr list --search merge",
  ]) {
    const { v, calls } = run(cmd);
    assert.deepEqual(v, { allow: true }, cmd);
    assert.equal(calls.length, 0, cmd);
  }
});

test("blocks when protection lists no required checks and none have reported yet", () => {
  const pr = { url: "https://github.com/solanabr/academy-courses/pull/42" };
  const { v } = run("gh pr merge 42 --squash", {
    pr,
    protection: "forbidden",
    runs: [],
  });
  assert.equal(v.allow, false);
  assert.match(
    v.reason,
    /no checks have reported on aaaaaaaaaaaa yet; wait for CI, or merge by hand if this repo has no CI/
  );
  const empty = run("gh pr merge 42 --squash", {
    pr,
    protection: [],
    runs: [],
  });
  assert.equal(empty.v.allow, false);
  const baseOff = run("gh pr merge 42 --squash", {
    pr: { baseRefName: "feature" },
    protection: "forbidden",
    runs: [],
  });
  assert.equal(baseOff.v.allow, false);
});

// B1 regressions: a heredoc with an apostrophe used to swallow the merge.
const HEREDOC_PR = `gh pr create --title x --body "$(cat <<'EOF'\nIt's done\nEOF\n)"`;
const HEREDOC_COMMIT = `git commit -m "$(cat <<'EOF'\nfix: don't drop the nonce\nEOF\n)"`;

test("sees a merge after a heredoc PR body with an apostrophe", () => {
  const cmd = `${HEREDOC_PR} && gh pr merge 7 --squash --auto`;
  const pr = {
    commits: [{ messageHeadline: "wip", messageBody: "[skip ci]" }],
  };
  const { v, calls } = run(cmd, { pr });
  assert.ok(calls.length > 0, "the merge was never evaluated");
  assert.equal(v.allow, false);
});

test("sees a merge after a heredoc commit, push and merge chain", () => {
  const cmd = `${HEREDOC_COMMIT} && git push && gh pr merge 7 --squash`;
  const { v } = run(cmd, { runs: [] });
  assert.equal(v.allow, false);
  assert.match(v.reason, /not reported/);
});

test("parses -XPUT and strips a query string from the endpoint", () => {
  const cmd =
    "gh api -XPUT 'repos/solanabr/superteam-academy/pulls/42/merge?x=1' -f merge_method=squash";
  assert.equal(run(cmd, { runs: [] }).v.allow, false);
  assert.deepEqual(run(cmd).v, { allow: true });
  const attached =
    "gh api --method PUT repos/solanabr/superteam-academy/pulls/42/merge -fcommit_message=[no ci]";
  assert.equal(run(attached).v.allow, false);
});

test("another repo without readable protection needs every reported check green, no invented names", () => {
  const pr = { url: "https://github.com/someone/fork/pull/42" };
  const runs = [
    { id: 1, name: "build", status: "completed", conclusion: "success" },
    { id: 2, name: "lint", status: "in_progress", conclusion: null },
  ];
  const blocked = run("gh pr merge 42 --squash", {
    pr,
    protection: "forbidden",
    runs,
  });
  assert.equal(blocked.v.allow, false);
  assert.match(blocked.v.reason, /lint: in_progress/);
  assert.doesNotMatch(blocked.v.reason, /Frontend|SHA-pin/);
  const green = runs.map((r) => ({
    ...r,
    status: "completed",
    conclusion: "success",
  }));
  assert.deepEqual(
    run("gh pr merge 42 --squash", { pr, protection: "forbidden", runs: green })
      .v,
    { allow: true }
  );
});

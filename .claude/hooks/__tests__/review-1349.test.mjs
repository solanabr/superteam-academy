// The release review of the guard-wrap change: its visible case list and every
// example in its report, through the one hook (guard.mjs). "M" is the main
// checkout on main; "W" is a worktree on branch w1. Writes to the guard files
// (the review's class 9) have their own change.

import assert from "node:assert/strict";
import { test } from "node:test";

import { decide } from "../guard.mjs";

const onBranch = (branch) => (args) =>
  args[0] === "symbolic-ref" ? branch : `origin/${branch}`;
const failingGh = () => {
  throw new Error("gh pr view failed (exit 1)");
};
const run = (command, where = "W") =>
  decide(command, {
    git: onBranch(where === "M" ? "main" : "w1"),
    gh: failingGh,
    env: {},
    readFile: () => "",
  });

const PASS = [
  ["git status"],
  ["git push origin w1", "W"],
  ["git push -u origin HEAD", "W"],
  ['git commit -m "fix: tidy"', "W"],
  ["vercel deploy"],
  ["vercel env pull --environment=preview"],
  ["pnpm --filter web exec vercel build"],
  ["solana program show 11111111111111111111111111111111 -um"],
  ["anchor build"],
  ["gh pr view 7"],
  ["wrangler dev"],
  ['echo "git push origin main; vercel --prod"'],
  ['grep -rn "vercel --prod" .claude'],
  ["bash ./w.sh git status"],
  // The review's nit: a commit message is text, not a command line.
  ['git commit -m "vercel --prod is refused by the guard"'],
  ["git log --grep='vercel --prod'"],
  ['gh pr create --title "git push origin main" --body x'],
  ["bash /x/heavy.sh pnpm test"],
];

const DENY = [
  // Direct forms.
  ["git push origin main", "M"],
  ["git push origin HEAD:main"],
  ["git push", "M"],
  ["vercel --prod"],
  ["npx vercel@latest deploy --prod"],
  ["wrangler deploy"],
  ["solana program deploy -um x.so"],
  ["anchor deploy --provider.cluster mainnet"],
  ["gh pr merge 7 --squash"],
  // Wrappers and interpreter scripts with the command in their arguments.
  ["bash ./w.sh git push origin HEAD:main"],
  ["caffeinate -i git push origin HEAD:main"],
  ["timeout -s KILL 5 git push origin HEAD:main"],
  ["python3 w.py git push origin HEAD:main"],
  ["node w.js vercel --prod"],
  ["PATH=.:$PATH w git push origin HEAD:main"],
  ["find . -maxdepth 0 -exec git push origin HEAD:main \\;"],
  // Inline interpreter code that names the tool.
  [
    "python3 -c \"import subprocess; subprocess.run(['git','push','origin','HEAD:main'])\"",
  ],
  [
    "node -e \"require('child_process').execSync('git push origin HEAD:main')\"",
  ],
  ["perl -e 'system(\"git push origin HEAD:main\")'"],
  ['ruby -e \'system("git", "push", "origin", "HEAD:main")\''],
  ["python3 -c \"import os; os.system('vercel --prod')\""],
  // xargs, alone and with a runner.
  ["echo HEAD:main | xargs git push origin"],
  ["echo git push origin HEAD:main | xargs env"],
  ["echo git push origin HEAD:main | xargs command"],
  ["echo git push origin HEAD:main | xargs nohup"],
  ["printf 'git\\0push' | xargs -0 timeout 5"],
  ["echo vercel --prod | xargs npx"],
  ["echo vercel --prod | xargs pnpm exec"],
  ["echo vercel --prod | xargs bunx"],
  ["echo git | xargs -I{} {} push origin HEAD:main"],
  // Substitutions, variables, quote splices and braces.
  ["$(echo git) push origin HEAD:main"],
  ["`echo git` push origin HEAD:main"],
  ['"$(command -v git)" push origin HEAD:main'],
  ["g=git; $g push origin HEAD:main"],
  ["$'git' push origin HEAD:main"],
  ['$"git" push origin HEAD:main'],
  ["{git,push} origin HEAD:main"],
  ["git $(echo push) origin HEAD:main"],
  ["git $'push' origin HEAD:main"],
  ["git {push,origin} HEAD:main"],
  ["S=push; git $S origin HEAD:main"],
  ["git push origin {HEAD:main,}"],
  ["$(echo vercel) --prod"],
  ["vercel deploy $'--prod'"],
  ["vercel {--prod,}"],
  ["vercel deploy --{prod,}"],
  ["{vercel,--prod}"],
  ["T=production; vercel deploy --target=$T"],
  ['vercel deploy --target "$(echo production)"'],
  ["vercel $(echo promote) https://x.vercel.app"],
  ["vercel env pull --environment=$'production'"],
  ["solana $(echo program) deploy -um x.so"],
  ["anchor $(echo deploy) --provider.cluster mainnet"],
  ["gh pr $(echo merge) 7 --admin --squash"],
  ["gh $'pr' merge 7 --admin"],
  ["gh api $(echo repos/o/r/pulls/7/merge) -X PUT"],
  ["wrangler $(echo deploy)"],
  ['wrangler "$(echo secret)" put K'],
  // A shell fed by a substitution, and nesting past the limit.
  ["bash -c \"$(printf 'git push origin HEAD:main')\""],
  ["bash -c \"$(cat <<'EOF'\ngit push origin HEAD:main\nEOF\n)\""],
  ['zsh -c "$(echo git push origin HEAD:main)"'],
  ["X='git push origin HEAD:main'; sh -c \"$X\""],
  [`${"echo $(".repeat(9)}git push origin HEAD:main${")".repeat(9)}`],
  // env -S.
  ["env -S 'git push origin HEAD:main'"],
  ["env -S'git push origin HEAD:main'"],
  ["env -S 'vercel --prod'"],
  ["/usr/bin/env -S 'npx vercel --prod'"],
  // Case.
  ["GIT push origin HEAD:main"],
  ["Vercel --prod"],
  ["SOLANA program deploy -um x.so"],
  ["GH pr merge 7 --admin"],
  ["Wrangler deploy"],
  // Shells reading stdin, source, functions, git config env, pack writes.
  ["bash <<'EOF'\ngit push origin HEAD:main\nEOF"],
  ["bash -s <<< 'git push origin HEAD:main'"],
  ["source /dev/stdin <<< 'git push origin HEAD:main'"],
  ["source -- /dev/stdin <<< 'git push origin HEAD:main'"],
  [". -- /dev/stdin <<< 'git push origin HEAD:main'"],
  ["bash /dev/fd/3 3<<'EOF'\ngit push origin HEAD:main\nEOF"],
  ['g() { git "$@"; }; g push origin HEAD:main'],
  [`GIT_CONFIG_PARAMETERS="'alias.p=!git push origin HEAD:main'" git p`],
  [
    "GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=remote.origin.push GIT_CONFIG_VALUE_0=HEAD:main git push",
  ],
  ["git send-pack ../origin.git HEAD:refs/heads/main"],
  // GitHub API writes outside issues, comments and labels.
  [
    "gh api -X POST repos/solanabr/superteam-academy/merges -f base=main -f head=w1",
  ],
  [
    "gh api -X PATCH repos/solanabr/superteam-academy/git/refs/heads/main -f sha=x",
  ],
  [
    "gh api -X PUT repos/solanabr/superteam-academy/contents/x.txt -f branch=main",
  ],
  ["gh api graphql -F query=@q.graphql"],
  ["gh api graphql --input q.json"],
  // Vercel and wrangler mutations outside the allow list.
  ["vercel projects rm academy"],
  ["vercel git disconnect"],
  ["vercel blob del x"],
  ["vercel cache purge"],
  ["wrangler d1 delete db"],
  ["wrangler d1 time-travel restore db"],
  ["wrangler r2 bucket delete b"],
  ["wrangler kv namespace delete --namespace-id x"],
  ["wrangler versions secret put K"],
  ["wrangler triggers deploy"],
  ["wrangler queues delete q"],
  ["wrangler pages project delete p"],
  // Mainnet through a config the guard does not read.
  ["HOME=/tmp/evilhome solana program deploy x.so"],
  [
    "cp mainnet.yml ~/.config/solana/cli/config.yml && solana program deploy x.so",
  ],
  ["cd other && anchor deploy"],
];

test("the review's allowed work passes the one hook", () => {
  for (const [command, where] of PASS)
    assert.deepEqual(run(command, where), { allow: true }, command);
});

test("every case the review let through is denied", () => {
  for (const [command, where] of DENY) {
    const verdict = run(command, where);
    assert.equal(verdict.allow, false, `let through: ${command}`);
    assert.match(verdict.reason, /^Blocked:/, command);
  }
});

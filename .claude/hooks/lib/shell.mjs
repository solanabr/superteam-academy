// Best-effort shell parsing for the PreToolUse guards. It splits a Bash command
// into simple commands (recursing into $(...), backticks, `sh -c` and `eval`),
// strips leading VAR=value assignments and common wrappers, and never throws.
// It is not a full shell parser: when in doubt it yields more commands, so a
// guard sees more, not less.

import fs from "node:fs";

const SHELLS = new Set(["sh", "bash", "zsh", "dash", "ksh", "fish"]);
const KEYWORDS = new Set([
  "if",
  "then",
  "else",
  "elif",
  "do",
  "while",
  "until",
  "!",
  "{",
]);
const ASSIGN = /^[A-Za-z_][A-Za-z0-9_]*=/;
const PNPM_VALUE_FLAGS = new Set([
  "--filter",
  "-F",
  "-C",
  "--dir",
  "--workspace-dir",
  "--reporter",
  "--loglevel",
]);

export function basename(word = "") {
  return word.split("/").pop();
}

// A program name without a package version: `vercel@latest` -> `vercel`.
export function toolName(word = "") {
  return basename(word).replace(/^([^@]+)@[\w.^~<>=*-]*$/, "$1");
}

// Join backslash-newline continuations so a wrapped command stays one command.
export function normalize(command) {
  return String(command ?? "").replace(/\\\r?\n/g, " ");
}

// Read a heredoc delimiter word starting at i (just after `<<` or `<<-`).
function readHeredocDelim(src, i, strip) {
  while (i < src.length && (src[i] === " " || src[i] === "\t")) i++;
  let raw = "";
  while (i < src.length && !/[\s;&|()<>]/.test(src[i])) raw += src[i++];
  return { delim: raw.replace(/['"\\]/g, ""), strip, next: i };
}

// Skip the bodies of pending heredocs, starting at the line after the operator.
// Their lines are data, not commands. Returns [nextIndex, allTerminated].
function skipHeredocs(src, i, pending) {
  let terminated = true;
  while (pending.length) {
    const { delim, strip } = pending.shift();
    let found = false;
    while (i < src.length) {
      const end = src.indexOf("\n", i);
      let line = end < 0 ? src.slice(i) : src.slice(i, end);
      i = end < 0 ? src.length : end + 1;
      line = line.replace(/\r$/, "");
      if ((strip ? line.replace(/^\t+/, "") : line) === delim) {
        found = true;
        break;
      }
    }
    if (!found) terminated = false;
  }
  return [i, terminated];
}

// Returns [inner, indexAfterClosingParen]. Tracks quotes, nesting, comments and
// heredoc bodies (an apostrophe in a heredoc must not open a quote). Sets
// state.unbalanced when the input ends before the closing paren.
function readParen(src, start, state) {
  let depth = 1;
  let i = start;
  let quote = null;
  const pending = [];
  while (i < src.length) {
    const c = src[i];
    if (quote === "'") {
      if (c === "'") quote = null;
      i++;
      continue;
    }
    if (quote === '"') {
      if (c === "\\") i += 2;
      else if (c === '"') {
        quote = null;
        i++;
      } else if (c === "$" && src[i + 1] === "(") {
        i = readParen(src, i + 2, state)[1];
      } else i++;
      continue;
    }
    if (c === "\\") {
      i += 2;
      continue;
    }
    if (c === "'" || c === '"') {
      quote = c;
      i++;
      continue;
    }
    if (c === "#" && (i === start || /[\s;&|(]/.test(src[i - 1]))) {
      const end = src.indexOf("\n", i);
      i = end < 0 ? src.length : end;
      continue;
    }
    if (c === "<") {
      let j = i;
      while (src[j] === "<") j++;
      if (j - i === 2) {
        const strip = src[j] === "-";
        const d = readHeredocDelim(src, strip ? j + 1 : j, strip);
        if (d.delim) pending.push(d);
        i = d.next;
      } else {
        i = j;
      }
      continue;
    }
    if (c === "\n") {
      i++;
      if (pending.length) {
        const [next, ok] = skipHeredocs(src, i, pending);
        if (!ok) state.unbalanced = true;
        i = next;
      }
      continue;
    }
    if (c === "(") depth++;
    else if (c === ")") {
      depth--;
      if (depth === 0) return [src.slice(start, i), i + 1];
    }
    i++;
  }
  state.unbalanced = true;
  return [src.slice(start), src.length];
}

function readBacktick(src, start, state) {
  const end = src.indexOf("`", start);
  if (end < 0) state.unbalanced = true;
  return end < 0
    ? [src.slice(start), src.length]
    : [src.slice(start, end), end + 1];
}

// Lex into words and separators. Collect command substitutions for recursion.
function lex(src) {
  const items = [];
  const subs = [];
  const heredocs = [];
  const state = { unbalanced: false };
  let word = null;
  let i = 0;
  const pushWord = () => {
    if (word !== null) items.push({ type: "word", value: word });
    word = null;
  };
  const pushOp = () => {
    pushWord();
    items.push({ type: "op" });
  };

  while (i < src.length) {
    const c = src[i];

    if (c === "'") {
      const end = src.indexOf("'", i + 1);
      if (end < 0) state.unbalanced = true;
      word =
        (word ?? "") + (end < 0 ? src.slice(i + 1) : src.slice(i + 1, end));
      i = end < 0 ? src.length : end + 1;
      continue;
    }

    if (c === '"') {
      word = word ?? "";
      i++;
      while (i < src.length && src[i] !== '"') {
        if (src[i] === "\\" && i + 1 < src.length) {
          word += src[i + 1];
          i += 2;
        } else if (src[i] === "$" && src[i + 1] === "(") {
          const [inner, next] = readParen(src, i + 2, state);
          subs.push(inner);
          word += `$(${inner})`;
          i = next;
        } else if (src[i] === "`") {
          const [inner, next] = readBacktick(src, i + 1, state);
          subs.push(inner);
          word += `\`${inner}\``;
          i = next;
        } else {
          word += src[i];
          i++;
        }
      }
      if (i >= src.length) state.unbalanced = true;
      i++;
      continue;
    }

    if (c === "\\") {
      word = (word ?? "") + (src[i + 1] ?? "");
      i += 2;
      continue;
    }

    if (c === "$" && src[i + 1] === "(") {
      const [inner, next] = readParen(src, i + 2, state);
      subs.push(inner);
      word = (word ?? "") + `$(${inner})`;
      i = next;
      continue;
    }

    if (c === "`") {
      const [inner, next] = readBacktick(src, i + 1, state);
      subs.push(inner);
      word = (word ?? "") + `\`${inner}\``;
      i = next;
      continue;
    }

    if (c === "#" && word === null) {
      const end = src.indexOf("\n", i);
      i = end < 0 ? src.length : end;
      continue;
    }

    if (c === "<" || c === ">") {
      // A bare fd number before the operator (2>&1) is not an argument.
      if (word !== null && /^\d+$/.test(word)) word = null;
      pushWord();
      let op = "";
      while (i < src.length && "<>&|".includes(src[i])) op += src[i++];
      if (op === "<<") {
        const strip = src[i] === "-";
        const d = readHeredocDelim(src, strip ? i + 1 : i, strip);
        if (d.delim) heredocs.push(d);
        i = d.next;
        continue;
      }
      // Read and drop the redirection target.
      while (i < src.length && (src[i] === " " || src[i] === "\t")) i++;
      while (i < src.length && !/[\s;&|()<>]/.test(src[i])) i++;
      continue;
    }

    if (c === "\n") {
      pushOp();
      i++;
      if (heredocs.length) {
        const [next, ok] = skipHeredocs(src, i, heredocs);
        if (!ok) state.unbalanced = true;
        i = next;
      }
      continue;
    }

    if (c === ";" || c === "&" || c === "|" || c === "(" || c === ")") {
      pushOp();
      i++;
      continue;
    }

    if (c === " " || c === "\t" || c === "\r") {
      pushWord();
      i++;
      continue;
    }

    word = (word ?? "") + c;
    i++;
  }
  pushWord();
  return { items, subs, unbalanced: state.unbalanced };
}

// Fail-safe for input the lexer couldn't balance (an unclosed quote, paren,
// backtick or heredoc): split the raw text on every operator, ignoring quotes,
// so whatever follows the broken part is still seen as a command.
function looseCommands(src) {
  return src
    .split(/&&|\|\||\$\(|[;&|\n()`]/)
    .map((seg) =>
      seg
        .replace(/['"\\]/g, "")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
    )
    .filter((words) => words.length);
}

function stripWrappers(words) {
  const assigns = [];
  let argv = words.slice();
  for (let guard = 0; guard < 20 && argv.length; guard++) {
    const head = argv[0];
    if (ASSIGN.test(head)) {
      assigns.push(head);
      argv.shift();
    } else if (KEYWORDS.has(head)) {
      argv.shift();
    } else if (
      ["command", "builtin", "exec", "nohup", "time"].includes(basename(head))
    ) {
      argv.shift();
      while (argv[0]?.startsWith("-")) argv.shift();
    } else if (basename(head) === "env") {
      argv.shift();
      while (argv.length && (argv[0].startsWith("-") || ASSIGN.test(argv[0]))) {
        const a = argv.shift();
        if (ASSIGN.test(a)) assigns.push(a);
        else if (a === "-u" || a === "--unset" || a === "-C" || a === "--chdir")
          argv.shift();
      }
    } else if (basename(head) === "nice") {
      argv.shift();
      if (argv[0] === "-n") argv.splice(0, 2);
      else if (argv[0]?.startsWith("-")) argv.shift();
    } else if (basename(head) === "timeout") {
      argv.shift();
      while (argv[0]?.startsWith("-")) argv.shift();
      argv.shift(); // duration
    } else if (basename(head) === "npx") {
      argv.shift();
      while (argv[0]?.startsWith("-")) {
        const a = argv.shift();
        if (a === "-p" || a === "--package") argv.shift();
      }
    } else if (basename(head) === "pnpm") {
      // `pnpm [--filter x] exec <cmd>` and `pnpm dlx <cmd>` run <cmd>.
      let j = 1;
      while (argv[j]?.startsWith("-"))
        j += PNPM_VALUE_FLAGS.has(argv[j]) ? 2 : 1;
      if (argv[j] !== "exec" && argv[j] !== "dlx") break;
      argv.splice(0, j + 1);
      while (argv[0]?.startsWith("-")) {
        const a = argv.shift();
        if (a === "--package" || a === "-p") argv.shift();
      }
    } else {
      break;
    }
  }
  return { argv, assigns };
}

// Tools the guards check. A wrapper the parser doesn't know (a script such as
// heavy.sh, caffeinate, stdbuf, flock, a package runner) still runs its
// arguments, so every guarded word in a command starts another candidate.
export const GUARDED = new Set([
  "git",
  "gh",
  "solana",
  "anchor",
  "vercel",
  "wrangler",
]);
// These run their arguments, so a shell, eval or xargs later in a command line
// starts a candidate too.
const TAIL_HEADS = new Set([...GUARDED, ...SHELLS, "eval", "xargs"]);
// These print or search their arguments and never run them. No candidates
// start inside them.
const TEXT_HEADS = new Set([
  "echo",
  "printf",
  "grep",
  "egrep",
  "fgrep",
  "rg",
  "ag",
  "ack",
  "cat",
  "less",
  "head",
  "tail",
  "wc",
  "jq",
  "ls",
  "sort",
  "uniq",
  "diff",
]);
// Programs that run the command after them: package runners and wrappers.
const RUNNERS = [
  "npx",
  "pnpx",
  "bunx",
  "bun",
  "pnpm",
  "yarn",
  "npm",
  "env",
  "exec",
  "command",
  "nohup",
  "nice",
  "time",
  "timeout",
  "caffeinate",
  "stdbuf",
  "ionice",
  "flock",
  "watch",
  "sudo",
];
// A quoted argument that is itself a command line (`flock f -c '…'`,
// `watch '…'`, `su -c '…'`): it starts with a guarded tool, a shell, eval,
// xargs or a runner.
const COMMAND_STRING = new RegExp(
  `^\\s*(?:[A-Za-z_][A-Za-z0-9_]*=\\S*\\s+)*(?:\\S*/)?(?:${[...TAIL_HEADS, ...RUNNERS].join("|")})\\s`
);

// The candidate commands inside one simple command: the command itself, then
// the rest of the line from every guarded tool, shell, eval or xargs after the
// head. Assignments just before a candidate, and the wrapper's own, carry over:
// the wrapper passes its environment on.
function tails(cmd) {
  const out = [cmd];
  const { argv } = cmd;
  if (TEXT_HEADS.has(basename(argv[0] ?? ""))) return out;
  for (let k = 1; k < argv.length; k++) {
    if (!TAIL_HEADS.has(toolName(argv[k]))) continue;
    const between = [];
    for (let j = k - 1; j >= 1 && ASSIGN.test(argv[j]); j--)
      between.unshift(argv[j]);
    out.push({
      argv: argv.slice(k),
      assigns: [...cmd.assigns, ...between],
      tail: true,
    });
  }
  return out;
}

// Flatten a command string into simple commands: [{ argv, assigns, tail? }].
// `tail` marks a candidate found after the head of a command.
export function commands(command, depth = 0) {
  if (depth > 8) return [];
  const source = normalize(command);
  const { items, subs, unbalanced } = lex(source);
  const out = [];
  let words = [];
  const flush = () => {
    if (words.length) {
      const top = stripWrappers(words);
      for (const cmd of tails(top)) {
        out.push(cmd);
        const [head, ...rest] = cmd.argv;
        if (SHELLS.has(basename(head))) {
          const ci = rest.findIndex((a) => /^-[a-z]*c[a-z]*$/.test(a));
          if (ci >= 0 && rest[ci + 1] !== undefined)
            out.push(...commands(rest[ci + 1], depth + 1));
        } else if (head === "eval") {
          out.push(...commands(rest.join(" "), depth + 1));
        }
      }
      if (!TEXT_HEADS.has(basename(top.argv[0] ?? ""))) {
        for (const word of top.argv.slice(1)) {
          if (COMMAND_STRING.test(word)) out.push(...commands(word, depth + 1));
        }
      }
    }
    words = [];
  };
  for (const item of items) {
    if (item.type === "op") flush();
    else words.push(item.value);
  }
  flush();
  for (const sub of subs) out.push(...commands(sub, depth + 1));
  if (unbalanced) {
    for (const words of looseCommands(source)) out.push(stripWrappers(words));
  }
  return out;
}

const STDIN_OPERAND = /^(-|\/dev\/stdin|\/dev\/fd\/\d+|\/proc\/self\/fd\/\d+)$/;
const SHELL_VALUE_OPTS = new Set([
  "-o",
  "+o",
  "-O",
  "+O",
  "--rcfile",
  "--init-file",
]);
const XARGS_VALUE_OPTS = new Set([
  "-I",
  "-n",
  "-P",
  "-L",
  "-d",
  "-E",
  "-s",
  "-a",
  "-J",
  "-R",
  "-S",
]);
const PLAIN_FILE = /^[\w@%+=:,./~-]+$/;

export const HIDDEN = {
  eval: "Blocked: eval builds the command at run time, so the guard can't check it. Run the command directly.",
  stdin:
    "Blocked: a shell that reads its commands from a pipe, a heredoc or stdin hides them from the guard. Run the command directly, or put it in a file and run that file.",
  xargs:
    "Blocked: xargs adds arguments from its input, which the guard can't see. Run the command directly with its arguments.",
  source:
    "Blocked: source or . of something other than a plain file path hides the commands from the guard. Run the command directly.",
};

// A shell with no -c string and no script file operand (or with -s, -, or
// /dev/stdin) runs whatever arrives on its input.
function shellReadsStdin(argv) {
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") {
      const next = argv[i + 1];
      return next === undefined || STDIN_OPERAND.test(next);
    }
    if (SHELL_VALUE_OPTS.has(a)) {
      i++;
      continue;
    }
    if (/^-[A-Za-z]*c[A-Za-z]*$/.test(a)) return false;
    if (/^-[A-Za-z]*s[A-Za-z]*$/.test(a)) return true;
    if (a.startsWith("-") || a.startsWith("+")) continue;
    return STDIN_OPERAND.test(a);
  }
  return true;
}

// xargs running a guarded tool, a shell or eval: its input adds the arguments.
function xargsRunsHidden(argv) {
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (XARGS_VALUE_OPTS.has(a)) {
      i++;
      continue;
    }
    if (a.startsWith("-")) continue;
    const name = basename(a);
    return GUARDED.has(name) || SHELLS.has(name) || name === "eval";
  }
  return false;
}

// When a command names one of `words` (guarded tools), refuse the constructs
// that hide the rest of the command from the parser: eval, a shell reading its
// input, xargs feeding a guarded tool, and source of anything but a plain file.
// A shell running a script file stays allowed: the file's body is not checked.
export function hiddenReason(command, words) {
  const raw = normalize(command);
  const named = new RegExp(`(^|[^\\w-])(${[...words].join("|")})(?=$|[^\\w-])`);
  if (!named.test(raw)) return null;
  for (const { argv, tail } of commands(raw)) {
    const name = basename(argv[0] ?? "");
    if (name === "eval") return HIDDEN.eval;
    if (SHELLS.has(name) && shellReadsStdin(argv)) return HIDDEN.stdin;
    if (name === "xargs" && xargsRunsHidden(argv)) return HIDDEN.xargs;
    if (!tail && (name === "source" || name === ".")) {
      const file = argv[1];
      if (
        file === undefined ||
        !PLAIN_FILE.test(file) ||
        STDIN_OPERAND.test(file) ||
        /^\/(dev|proc)\//.test(file)
      )
        return HIDDEN.source;
    }
  }
  return null;
}

// Value of a long or short option: --name value, --name=value, -x value, -xvalue.
export function optionValues(argv, names) {
  const values = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    for (const name of names) {
      if (a === name) {
        if (argv[i + 1] !== undefined) values.push(argv[i + 1]);
        i++;
        break;
      }
      if (name.startsWith("--") && a.startsWith(`${name}=`)) {
        values.push(a.slice(name.length + 1));
        break;
      }
      if (
        !name.startsWith("--") &&
        a.startsWith(name) &&
        a.length > name.length &&
        !a.startsWith("--")
      ) {
        values.push(a.slice(name.length).replace(/^=/, ""));
        break;
      }
    }
  }
  return values;
}

// The PreToolUse payload, or null when stdin isn't a JSON object.
export function readStdinJson() {
  try {
    const value = JSON.parse(fs.readFileSync(0, "utf8"));
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : null;
  } catch {
    return null;
  }
}

const UNREADABLE =
  "Blocked: the guard couldn't read the command from the hook input, so it fails closed.";

// Run a guard's decide() against the PreToolUse payload on stdin. A denial
// exits 2 with the reason on stderr, which Claude Code shows to Claude and
// treats as a block. Anything else exits 0 with no output (no opinion).
//
// Set process.exitCode and return instead of calling process.exit(): Node
// 24.7 intermittently segfaults (exit 139) inside process.exit, and with
// onFailure "block" every crash blocks the user's command.
export async function runHook(decide, deps = {}) {
  process.exitCode = 0;
  const input = readStdinJson();
  if (input?.tool_name && input.tool_name !== "Bash") return;
  const command = input?.tool_input?.command;
  if (input === null || typeof command !== "string") {
    fs.writeSync(2, `${UNREADABLE}\n`);
    process.exitCode = 2;
    return;
  }
  if (!command.trim()) return;
  let verdict;
  try {
    verdict = await decide(command, {
      cwd: input.cwd || process.cwd(),
      ...deps,
    });
  } catch (err) {
    verdict = {
      allow: false,
      reason: `guard failed to evaluate the command (${err?.name ?? "Error"}); blocked to fail closed`,
    };
  }
  if (verdict?.allow === false) {
    fs.writeSync(2, `${verdict.reason}\n`);
    process.exitCode = 2;
  }
}

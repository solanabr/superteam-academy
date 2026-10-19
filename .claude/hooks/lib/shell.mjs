// Best-effort shell parsing for the PreToolUse guards. It splits a Bash command
// into simple commands (recursing into $(...), backticks, `sh -c` and `eval`),
// strips leading VAR=value assignments and common wrappers, and never throws.
// It is not a full shell parser: when in doubt it yields more commands, so a
// guard sees more, not less.

import fs from "node:fs";

const SHELLS = new Set(["sh", "bash", "zsh", "dash", "ksh"]);
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

export function basename(word = "") {
  return word.split("/").pop();
}

// Join backslash-newline continuations so a wrapped command stays one command.
export function normalize(command) {
  return String(command ?? "").replace(/\\\r?\n/g, " ");
}

// Returns [inner, indexAfterClosingParen]. Tracks quotes and nesting.
function readParen(src, start) {
  let depth = 1;
  let i = start;
  let quote = null;
  while (i < src.length) {
    const c = src[i];
    if (quote) {
      if (c === "\\" && quote === '"') {
        i += 2;
        continue;
      }
      if (c === quote) quote = null;
      i++;
      continue;
    }
    if (c === "'" || c === '"') quote = c;
    else if (c === "(") depth++;
    else if (c === ")") {
      depth--;
      if (depth === 0) return [src.slice(start, i), i + 1];
    }
    i++;
  }
  return [src.slice(start), src.length];
}

function readBacktick(src, start) {
  const end = src.indexOf("`", start);
  return end < 0
    ? [src.slice(start), src.length]
    : [src.slice(start, end), end + 1];
}

// Lex into words and separators. Collect command substitutions for recursion.
function lex(src) {
  const items = [];
  const subs = [];
  const heredocs = [];
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
          const [inner, next] = readParen(src, i + 2);
          subs.push(inner);
          word += `$(${inner})`;
          i = next;
        } else if (src[i] === "`") {
          const [inner, next] = readBacktick(src, i + 1);
          subs.push(inner);
          word += `\`${inner}\``;
          i = next;
        } else {
          word += src[i];
          i++;
        }
      }
      i++;
      continue;
    }

    if (c === "\\") {
      word = (word ?? "") + (src[i + 1] ?? "");
      i += 2;
      continue;
    }

    if (c === "$" && src[i + 1] === "(") {
      const [inner, next] = readParen(src, i + 2);
      subs.push(inner);
      word = (word ?? "") + `$(${inner})`;
      i = next;
      continue;
    }

    if (c === "`") {
      const [inner, next] = readBacktick(src, i + 1);
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
      while (i < src.length && (src[i] === " " || src[i] === "\t")) i++;
      // Read and drop the redirection target (or heredoc delimiter).
      let target = "";
      while (i < src.length && !/[\s;&|()<>]/.test(src[i])) target += src[i++];
      if (op.startsWith("<<") && !op.startsWith("<<<")) {
        heredocs.push({
          delim: target.replace(/^-/, "").replace(/['"]/g, ""),
          strip: target.startsWith("-"),
        });
      }
      continue;
    }

    if (c === "\n") {
      pushOp();
      i++;
      // Skip pending heredoc bodies: their lines are data, not commands.
      while (heredocs.length) {
        const { delim, strip } = heredocs.shift();
        while (i < src.length) {
          const end = src.indexOf("\n", i);
          const line = end < 0 ? src.slice(i) : src.slice(i, end);
          i = end < 0 ? src.length : end + 1;
          if ((strip ? line.trim() : line) === delim) break;
        }
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
  return { items, subs };
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
    } else {
      break;
    }
  }
  return { argv, assigns };
}

// Flatten a command string into simple commands: [{ argv, assigns }].
export function commands(command, depth = 0) {
  if (depth > 8) return [];
  const { items, subs } = lex(normalize(command));
  const out = [];
  let words = [];
  const flush = () => {
    if (words.length) {
      const cmd = stripWrappers(words);
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
    words = [];
  };
  for (const item of items) {
    if (item.type === "op") flush();
    else words.push(item.value);
  }
  flush();
  for (const sub of subs) out.push(...commands(sub, depth + 1));
  return out;
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

export function readStdinJson() {
  try {
    return JSON.parse(fs.readFileSync(0, "utf8") || "{}");
  } catch {
    return {};
  }
}

// Run a guard's decide() against the PreToolUse payload on stdin. A denial
// exits 2 with the reason on stderr, which Claude Code shows to Claude and
// treats as a block. Anything else exits 0 with no output (no opinion).
export async function runHook(decide, deps = {}) {
  const input = readStdinJson();
  const command = input?.tool_input?.command;
  if (input?.tool_name && input.tool_name !== "Bash") process.exit(0);
  if (typeof command !== "string" || !command.trim()) process.exit(0);
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
    // writeSync: on macOS a pipe write is async and process.exit would cut it off.
    fs.writeSync(2, `${verdict.reason}\n`);
    process.exit(2);
  }
  process.exit(0);
}

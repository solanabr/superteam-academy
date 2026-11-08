/**
 * Token-level checks on a Rust submission before the grader compiles it. Matching
 * on code rather than text means spacing and comments can't change the result, and
 * a word in a comment or string can't get an honest submission rejected.
 */

/** Macros that read the assembled source or the build environment. */
const SOURCE_MACROS =
  "include_str|include_bytes|include|file|module_path|env|option_env";

/**
 * Constructs a graded function has no use for. Each pattern names the construct,
 * not a bare word, so an honest `T: PartialEq` bound, a variant called `File` or a
 * variable called `fs` stays allowed.
 */
const DISALLOWED_CONSTRUCTS: RegExp[] = [
  // a source or environment macro invoked, or renamed in a use
  new RegExp(`\\b(?:${SOURCE_MACROS})\\s*!(?!=)`),
  new RegExp(`\\buse\\b[^;]*\\b(?:${SOURCE_MACROS})\\s+as\\b`),
  // macro definitions, foreign code and inline assembly
  /\bmacro_rules\s*!(?!=)/,
  /\bextern\b/,
  /\b(?:global_)?asm\s*!(?!=)/,
  // std's filesystem, environment and process modules, however they're reached
  /\bstd\s*::\s*(?:fs|env|process)\b/,
  /\bstd\s*::\s*\{[^}]*\b(?:fs|env|process)\b/,
  /\bstd\s+as\b/,
  /\bstd\s*::\s*\*/,
  /\bstd\s*::\s*\{[^}]*(?:\bself\b|\*)/,
  // the trait renamed (a hand-written impl is checked by implementsPartialEq)
  /\bPartialEq\s+as\b/,
];

/**
 * True if some `impl` block implements PartialEq by hand. Only the trait position
 * counts, between the impl's own generics and `for`, so a `T: PartialEq` bound
 * in the generics stays allowed.
 */
function implementsPartialEq(code: string): boolean {
  for (const match of code.matchAll(/\bimpl\b/g)) {
    let i = (match.index ?? 0) + "impl".length;
    while (/\s/.test(code[i] ?? "")) i += 1;
    if (code[i] === "<") {
      let depth = 0;
      for (; i < code.length; i += 1) {
        if (code[i] === "<") depth += 1;
        else if (code[i] === ">" && code[i - 1] !== "-") depth -= 1;
        if (depth === 0) break;
      }
      i += 1;
    }
    const rest = code.slice(i);
    const end = rest.search(/\bfor\b|[{;]/);
    if (end === -1 || !/^\s*for\b/.test(rest.slice(end))) continue;
    if (/\bPartialEq\b/.test(rest.slice(0, end).replace(/<[^]*$/, "")))
      return true;
  }
  return false;
}

const isWordChar = (c: string | undefined): boolean =>
  c !== undefined && /[\p{L}\p{N}_]/u.test(c);

function skipBlockComment(chars: string[], start: number): number | null {
  let i = start + 2;
  let depth = 1;
  while (depth > 0) {
    if (i >= chars.length) return null;
    if (chars[i] === "/" && chars[i + 1] === "*") {
      depth += 1;
      i += 2;
    } else if (chars[i] === "*" && chars[i + 1] === "/") {
      depth -= 1;
      i += 2;
    } else {
      i += 1;
    }
  }
  return i;
}

function skipString(chars: string[], start: number): number | null {
  let i = start + 1;
  while (i < chars.length) {
    if (chars[i] === "\\") i += 2;
    else if (chars[i] === '"') return i + 1;
    else i += 1;
  }
  return null;
}

function skipRawString(
  chars: string[],
  start: number,
  hashes: number
): number | null {
  for (let i = start; i < chars.length; i += 1) {
    if (chars[i] !== '"') continue;
    let closed = true;
    for (let h = 1; h <= hashes; h += 1) {
      if (chars[i + h] !== "#") closed = false;
    }
    if (closed) return i + 1 + hashes;
  }
  return null;
}

/** A `'` opens a char literal or a lifetime; a lifetime keeps its name as a word. */
function skipCharLiteral(chars: string[], start: number): number | null {
  if (chars[start + 1] === "\\") {
    for (let i = start + 3; i < chars.length; i += 1) {
      if (chars[i] === "'") return i + 1;
    }
    return null;
  }
  return chars[start + 2] === "'" ? start + 3 : start + 1;
}

/**
 * `source` with comments and string, byte and char literals replaced by a space.
 * `null` if one never closes: rustc rejects that anyway, and nothing after it can
 * be told apart from code.
 */
export function rustCodeOnly(source: string): string | null {
  const chars = Array.from(source);
  let out = "";
  let i = 0;

  while (i < chars.length) {
    const c = chars[i] as string;
    const next = chars[i + 1];
    let end: number | null;

    if (c === "/" && next === "/") {
      while (i < chars.length && chars[i] !== "\n") i += 1;
      out += " ";
    } else if (c === "/" && next === "*") {
      end = skipBlockComment(chars, i);
      if (end === null) return null;
      i = end;
      out += " ";
    } else if (c === '"') {
      end = skipString(chars, i);
      if (end === null) return null;
      i = end;
      out += " ";
    } else if (c === "'") {
      end = skipCharLiteral(chars, i);
      if (end === null) return null;
      i = end;
      out += " ";
    } else if (isWordChar(c)) {
      const start = i;
      while (isWordChar(chars[i])) i += 1;
      const word = chars.slice(start, i).join("");
      const after = chars[i];

      if ((word === "b" || word === "c") && after === '"') {
        end = skipString(chars, i);
        if (end === null) return null;
        i = end;
        out += " ";
      } else if (word === "b" && after === "'") {
        end = skipCharLiteral(chars, i);
        if (end === null) return null;
        i = end;
        out += " ";
      } else if (
        (word === "r" || word === "br" || word === "cr") &&
        (after === '"' || after === "#")
      ) {
        let hashes = 0;
        while (chars[i + hashes] === "#") hashes += 1;
        if (chars[i + hashes] === '"') {
          end = skipRawString(chars, i + hashes + 1, hashes);
          if (end === null) return null;
          i = end;
          out += " ";
        } else if (word === "r" && hashes === 1) {
          // `r#name` is the identifier `name`.
          i += 1;
        } else {
          out += word;
        }
      } else {
        out += word;
      }
    } else {
      out += c;
      i += 1;
    }
  }
  return out;
}

/** True if the submission can't be graded as written. */
export function hasDisallowedRustConstruct(source: string): boolean {
  const code = rustCodeOnly(source);
  if (code === null) return true;
  return (
    DISALLOWED_CONSTRUCTS.some((pattern) => pattern.test(code)) ||
    implementsPartialEq(code)
  );
}

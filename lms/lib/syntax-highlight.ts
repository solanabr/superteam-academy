// Single-pass syntax highlighter — no multi-regex corruption
// Uses one combined regex per language so tokens never overlap

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function highlight(raw: string, lang: string): string {
  const code = esc(raw);
  if (lang === "bash" || lang === "sh" || lang === "shell" || lang === "zsh") return hlBash(code);
  if (lang === "rust" || lang === "rs") return hlRust(code);
  if (lang === "json") return hlJSON(code);
  return hlTS(code);
}

function wrap(cls: string, text: string): string {
  return `<span class="${cls}">${text}</span>`;
}

// ── Bash ──
const BASH_RE = new RegExp([
  `(#[^\\n]*)`,                                         // 1: comment
  `(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;)`,              // 2: string
  `(\\$\\w+|\\$\\{[^}]+\\})`,                           // 3: variable
  `(\\s)(--?[\\w-]+)`,                                   // 4+5: space + flag
  `^(\\s*)(curl|sh|cd|mkdir|npm|bun|cargo|solana|anchor|git|echo|export|source|rustup|npx|yarn|pip|apt|brew)(\\s)`, // 6+7+8
].join("|"), "gm");

function hlBash(code: string): string {
  return code.replace(BASH_RE, (...m) => {
    if (m[1]) return wrap("hl-cm", m[1]);
    if (m[2]) return wrap("hl-str", m[2]);
    if (m[3]) return wrap("hl-macro", m[3]);
    if (m[5]) return m[4] + wrap("hl-flag", m[5]);
    if (m[7]) return m[6] + wrap("hl-fn", m[7]) + m[8];
    return m[0];
  });
}

// ── Rust ──
const RUST_KW = "fn|let|mut|pub|use|struct|enum|impl|trait|mod|const|static|type|where|for|in|if|else|match|return|self|super|crate|as|ref|move|async|await|unsafe|extern|dyn|true|false";
const RUST_TY = "Self|Option|Result|Vec|String|Box|Rc|Arc|HashMap|HashSet|Pubkey|Account|Signer|Program|Context|Clock|bool|u8|u16|u32|u64|u128|i8|i16|i32|i64|i128|f32|f64|usize|isize";

const RUST_RE = new RegExp([
  `(\\/\\/[^\\n]*)`,                                     // 1: comment
  `(&quot;(?:[^&\\\\]|\\\\.)*?&quot;)`,                  // 2: string
  `(#\\[[^\\]]*\\])`,                                    // 3: attribute
  `(\\b\\w+!)`,                                          // 4: macro
  `(\\b(?:${RUST_TY})\\b)`,                              // 5: type (before keywords)
  `(\\b(?:${RUST_KW})\\b)`,                              // 6: keyword
  `(\\b\\d[\\d_]*(?:\\.\\d+)?\\b)`,                      // 7: number
  `(\\b[a-z_]\\w*)(?=\\()`,                              // 8: function call
].join("|"), "gm");

function hlRust(code: string): string {
  return code.replace(RUST_RE, (...m) => {
    if (m[1]) return wrap("hl-cm", m[1]);
    if (m[2]) return wrap("hl-str", m[2]);
    if (m[3]) return wrap("hl-attr", m[3]);
    if (m[4]) return wrap("hl-macro", m[4]);
    if (m[5]) return wrap("hl-type", m[5]);
    if (m[6]) return wrap("hl-kw", m[6]);
    if (m[7]) return wrap("hl-num", m[7]);
    if (m[8]) return wrap("hl-fn", m[8]);
    return m[0];
  });
}

// ── JSON ──
const JSON_RE = new RegExp([
  `(&quot;(?:[^&\\\\]|\\\\.)*?&quot;)(?=\\s*:)`,             // 1: key
  `(&quot;(?:[^&\\\\]|\\\\.)*?&quot;)`,                       // 2: string value
  `(\\b(?:true|false|null)\\b)`,                              // 3: keyword
  `(-?\\b\\d[\\d_]*(?:\\.\\d+)?(?:[eE][+-]?\\d+)?\\b)`,      // 4: number
].join("|"), "gm");

function hlJSON(code: string): string {
  return code.replace(JSON_RE, (...m) => {
    if (m[1]) return wrap("hl-attr", m[1]);
    if (m[2]) return wrap("hl-str", m[2]);
    if (m[3]) return wrap("hl-kw", m[3]);
    if (m[4]) return wrap("hl-num", m[4]);
    return m[0];
  });
}

// ── TypeScript / JavaScript ──
const TS_KW = "import|export|from|const|let|var|function|async|await|return|if|else|for|of|in|while|do|class|interface|type|extends|implements|new|throw|try|catch|finally|switch|case|default|break|continue|typeof|instanceof|as|is|true|false|this|super|yield|delete|void";
const TS_TY = "Promise|Array|Map|Set|Record|Partial|Readonly|Required|Pick|Omit|Exclude|Extract|string|number|boolean|null|undefined|never|any|unknown|object|bigint|symbol|Uint8Array|Buffer|PublicKey|Keypair|Connection|Transaction|SystemProgram|Signer|AccountInfo|TransactionInstruction|LAMPORTS_PER_SOL";

const TS_RE = new RegExp([
  `(\\/\\/[^\\n]*)`,                                     // 1: comment
  `(&quot;(?:[^&\\\\]|\\\\.)*?&quot;)`,                  // 2: double string
  `(&#39;(?:[^&\\\\]|\\\\.)*?&#39;)`,                    // 3: single string
  `(\\b(?:${TS_TY})\\b)`,                                // 4: type (before keywords)
  `(\\b(?:${TS_KW})\\b)`,                                // 5: keyword
  `(\\b\\d[\\d_]*(?:\\.\\d+)?\\b)`,                      // 6: number
  `(@\\w+)`,                                             // 7: decorator
  `(\\b[a-z_]\\w*)(?=\\()`,                              // 8: function call
  `(=&gt;)`,                                             // 9: arrow
].join("|"), "gm");

function hlTS(code: string): string {
  return code.replace(TS_RE, (...m) => {
    if (m[1]) return wrap("hl-cm", m[1]);
    if (m[2]) return wrap("hl-str", m[2]);
    if (m[3]) return wrap("hl-str", m[3]);
    if (m[4]) return wrap("hl-type", m[4]);
    if (m[5]) return wrap("hl-kw", m[5]);
    if (m[6]) return wrap("hl-num", m[6]);
    if (m[7]) return wrap("hl-attr", m[7]);
    if (m[8]) return wrap("hl-fn", m[8]);
    if (m[9]) return wrap("hl-op", m[9]);
    return m[0];
  });
}

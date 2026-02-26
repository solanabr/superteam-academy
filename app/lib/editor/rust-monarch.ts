/**
 * Monarch grammar for Rust syntax highlighting in Monaco.
 * Enables Rust as a language with VS Code-like coloring.
 */
import type { languages } from "monaco-editor";

export const rustLanguageConfig: languages.LanguageConfiguration = {
  comments: {
    lineComment: "//",
    blockComment: ["/*", "*/"],
  },
  brackets: [
    ["{", "}"],
    ["[", "]"],
    ["(", ")"],
  ],
  autoClosingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
  surroundingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
};

export const rustMonarchGrammar: languages.IMonarchLanguage = {
  defaultToken: "",
  tokenPostfix: ".rs",
  keywords: [
    "as", "async", "await", "break", "const", "continue", "crate", "dyn", "else",
    "enum", "extern", "false", "fn", "for", "if", "impl", "in", "let", "loop",
    "match", "mod", "move", "mut", "pub", "ref", "return", "self", "Self",
    "static", "struct", "super", "trait", "true", "try", "type", "unsafe",
    "use", "where", "while",
  ],
  typeKeywords: ["i8", "i16", "i32", "i64", "i128", "u8", "u16", "u32", "u64", "u128", "usize", "isize", "f32", "f64", "bool", "char", "str", "String", "Option", "Result", "Vec", "Box", "Rc", "Arc", "RefCell", "Cow"],
  operators: ["!", "!=", "%", "%=", "&", "&&", "&=", "*", "*=", "+", "+=", "-", "-=", "->", ".", "..", "...", "..=", "/", "/=", ":", "::", ";", "<", "<<", "<<=", "<=", "=", "==", "=>", ">", ">=", ">>", ">>=", "?", "@", "^", "^=", "|", "|=", "||", "_"],
  symbols: /[=><!~?:&|+\-*\/\^%]+/,
  escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,2}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
  tokenizer: {
    root: [
      [/[a-zA-Z_]\w*/, {
        cases: {
          "@keywords": "keyword",
          "@typeKeywords": "type",
          "@default": "identifier",
        },
      }],
      [/r#"[^"]*"#/, "string"],
      [/r"[^"]*"/, "string"],
      [/"([^"\\]|\\.)*$/, "string.invalid"],
      [/"/, "string", "@string"],
      [/'[^'\\]|\\./, "string"],
      [/'[a-zA-Z_]\w*/, "string"],
      [/\d[\d_]*\.\d+([eE][+-]?\d+)?[fF]?/, "number.float"],
      [/\d[\d_]*/, "number"],
      [/\/\/.*$/, "comment"],
      [/\/\*/, "comment", "@comment"],
      [/[{}()\[\]<>]/, "@brackets"],
      [/@symbols/, { cases: { "@operators": "operator", "@default": "" } }],
      [/[;,.]/, "delimiter"],
      [/\s+/, ""],
    ],
    string: [
      [/[^\\"]+/, "string"],
      [/@escapes/, "string.escape"],
      [/\\./, "string.escape.invalid"],
      [/"/, "string", "@pop"],
    ],
    comment: [
      [/[^\/*]+/, "comment"],
      [/\/\*/, "comment", "@push"],
      [/\*\//, "comment", "@pop"],
      [/[\/*]/, "comment"],
    ],
  },
};

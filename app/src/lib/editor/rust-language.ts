import type Monaco from "monaco-editor";

export function registerRustLanguage(monaco: typeof Monaco) {
  if (monaco.languages.getLanguages().some((l) => l.id === "rust")) return;

  monaco.languages.register({ id: "rust" });

  monaco.languages.setMonarchTokensProvider("rust", {
    keywords: [
      "fn", "let", "mut", "pub", "use", "struct", "enum", "impl", "trait",
      "where", "type", "const", "static", "unsafe", "async", "await", "move",
      "ref", "return", "if", "else", "loop", "while", "for", "in", "match",
      "break", "continue", "as", "mod", "extern", "crate", "super", "self", "Self",
    ],
    typeKeywords: [
      "i8", "i16", "i32", "i64", "i128", "u8", "u16", "u32", "u64", "u128",
      "f32", "f64", "bool", "char", "str", "String", "Vec", "Option", "Result", "Box",
    ],
    tokenizer: {
      root: [
        [/[a-zA-Z_]\w*!/, "keyword.control"],
        [/[a-zA-Z_]\w*/, { cases: {
          "@keywords": "keyword",
          "@typeKeywords": "type",
          "@default": "identifier",
        }}],
        [/\/\/\/.*$/, "comment.doc"],
        [/\/\/.*$/, "comment"],
        [/\/\*/, "comment", "@comment"],
        [/"/, "string", "@string"],
        [/'[^']*'/, "string.char"],
        [/r#*"/, "string", "@rawstring"],
        [/0x[0-9a-fA-F_]+/, "number.hex"],
        [/\d[\d_]*\.[\d_]*([eE][-+]?\d+)?/, "number.float"],
        [/\d[\d_]*/, "number"],
        [/[{}()[\]]/, "delimiter"],
        [/[;,.]/, "delimiter"],
      ],
      comment: [
        [/[^/*]+/, "comment"],
        [/\*\//, "comment", "@pop"],
        [/[/*]/, "comment"],
      ],
      string: [
        [/[^\\"]+/, "string"],
        [/\\./, "string.escape"],
        [/"/, "string", "@pop"],
      ],
      rawstring: [
        [/[^"]+/, "string"],
        [/"#*/, "string", "@pop"],
      ],
    },
  });

  monaco.languages.setLanguageConfiguration("rust", {
    comments: { lineComment: "//", blockComment: ["/*", "*/"] },
    brackets: [["(", ")"], ["{", "}"], ["[", "]"]],
    autoClosingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: '"', close: '"', notIn: ["string"] },
    ],
  });

  monaco.languages.registerCompletionItemProvider("rust", {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };
      const keywords = [
        "fn", "let", "mut", "pub", "struct", "impl", "use", "match",
        "if", "else", "loop", "while", "for", "return", "async", "await",
      ];
      return {
        suggestions: keywords.map((k) => ({
          label: k,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: k,
          range,
        })),
      };
    },
  });
}

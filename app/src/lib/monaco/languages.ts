export const LANGUAGE_CONFIG = {
  typescript: {
    id: "typescript",
    extensions: [".ts", ".tsx"],
    defaultCode:
      '// Write your TypeScript solution here\nfunction solution(input: string): string {\n  return "";\n}\n',
  },
  rust: {
    id: "rust",
    extensions: [".rs"],
    defaultCode:
      "// Write your Rust solution here\nfn solution(input: &str) -> String {\n    String::new()\n}\n",
  },
} as const;

export type SupportedLanguage = keyof typeof LANGUAGE_CONFIG;

"use client";

import { useMemo, useState } from "react";
import Editor from "@monaco-editor/react";

type Language = "typescript" | "rust";

const boilerplate: Record<Language, string> = {
  typescript: `import { Connection, clusterApiUrl } from "@solana/web3.js";

async function main() {
  const connection = new Connection(clusterApiUrl("devnet"));
  console.log("Connected to", connection.rpcEndpoint);
}

main();`,
  rust: `fn main() {
  println!("Solana program simulation started");
}`,
};

export function CodeEditor({ initialLanguage = "typescript" }: { initialLanguage?: Language }) {
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [code, setCode] = useState(boilerplate[initialLanguage]);
  const [result, setResult] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const outputClass = useMemo(
    () =>
      result?.type === "success"
        ? "bg-emerald-50 text-emerald-700"
        : "bg-red-50 text-red-700",
    [result?.type],
  );

  return (
    <div className="rounded-2xl border border-zinc-200">
      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2">
        <select
          className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs"
          value={language}
          onChange={(e) => {
            const next = e.target.value as Language;
            setLanguage(next);
            setCode(boilerplate[next]);
            setResult(null);
          }}
        >
          <option value="typescript">TypeScript</option>
          <option value="rust">Rust</option>
        </select>
        <button
          type="button"
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs text-white"
          onClick={() => {
            const hasError = code.toLowerCase().includes("error") || code.trim().length < 5;
            setResult(
              hasError
                ? { type: "error", text: "Mock run failed: syntax or runtime issue detected." }
                : { type: "success", text: "Mock run succeeded: tests passed in sandbox." },
            );
          }}
        >
          Run
        </button>
      </div>
      <Editor
        height="320px"
        language={language}
        theme="vs-dark"
        value={code}
        onChange={(value) => setCode(value ?? "")}
        options={{ minimap: { enabled: false }, fontSize: 13 }}
      />
      {result ? <div className={`m-3 rounded-lg px-3 py-2 text-xs ${outputClass}`}>{result.text}</div> : null}
    </div>
  );
}

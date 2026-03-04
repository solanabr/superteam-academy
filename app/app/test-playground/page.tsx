"use client";

import { useState, useCallback } from "react";
import { CodeEditor } from "@/components/app";
import { Button } from "@/components/ui/button";
import { Loader2, Play } from "lucide-react";
import type { CodeEditorLanguage } from "@/components/editor/CodeEditor";

const DEFAULT_TS = "// TypeScript\nconsole.log('Hello Solana!');";
const DEFAULT_RUST = `use solana_sdk::pubkey::Pubkey;
use solana_sdk::signature::{Keypair, Signer};
use std::str::FromStr;

fn main() {
    let keypair = Keypair::new();
    let pubkey = keypair.pubkey();
    println!("New keypair pubkey: {}", pubkey);

    let known = Pubkey::from_str("11111111111111111111111111111111").unwrap();
    println!("System program: {}", known);

    let bytes = pubkey.to_bytes();
    println!("Pubkey bytes length: {}", bytes.len());

    println!("Rust + Solana SDK test OK");
}`;

type ExecLanguage = "typescript" | "rust";

const LANGUAGE_OPTIONS: { value: ExecLanguage; label: string; code: string }[] = [
  { value: "typescript", label: "TypeScript", code: DEFAULT_TS },
  { value: "rust", label: "Rust", code: DEFAULT_RUST },
];

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 120_000; // 2 min (worker has 60s run + queue/container startup)

type ExecutionState = {
  status: "idle" | "queued" | "running" | "success" | "failed";
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  error?: string;
};

export default function TestPlaygroundPage() {
  const [language, setLanguage] = useState<ExecLanguage>("typescript");
  const [code, setCode] = useState(DEFAULT_TS);
  const [running, setRunning] = useState(false);
  const [execution, setExecution] = useState<ExecutionState>({ status: "idle" });

  const handleLanguageChange = (value: ExecLanguage) => {
    setLanguage(value);
    const option = LANGUAGE_OPTIONS.find((o) => o.value === value);
    if (option) setCode(option.code);
    setExecution({ status: "idle" });
  };

  const runCode = useCallback(async () => {
    setRunning(true);
    setExecution({ status: "queued" });
    try {
      const res = await fetch("/api/code/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: code, language }),
      });
      const data = (await res.json()) as { executionId?: string; error?: string };
      if (!res.ok || data.error) {
        setExecution({ status: "failed", error: data.error ?? "Failed to start execution" });
        return;
      }
      const executionId = data.executionId;
      if (!executionId) {
        setExecution({ status: "failed", error: "No execution id returned" });
        return;
      }

      const deadline = Date.now() + POLL_TIMEOUT_MS;
      const poll = async (): Promise<void> => {
        const getRes = await fetch(`/api/code/executions/${executionId}`);
        const getData = (await getRes.json()) as {
          status?: string;
          stdout?: string;
          stderr?: string;
          exitCode?: number;
          error?: string;
        };
        if (!getRes.ok) {
          setExecution({ status: "failed", error: (getData as { error?: string }).error ?? "Failed to fetch result" });
          return;
        }
        const status = getData.status ?? "queued";
        setExecution({
          status: status as ExecutionState["status"],
          stdout: getData.stdout,
          stderr: getData.stderr,
          exitCode: getData.exitCode,
          error: getData.error,
        });
        if (status === "queued" || status === "running") {
          if (Date.now() >= deadline) {
            setExecution((e) => ({ ...e, status: "failed", error: "Execution timed out" }));
            return;
          }
          setTimeout(poll, POLL_INTERVAL_MS);
        }
      };
      await poll();
    } catch (err) {
      setExecution({
        status: "failed",
        error: err instanceof Error ? err.message : "Request failed",
      });
    } finally {
      setRunning(false);
    }
  }, [code, language]);

  const editorLanguage: CodeEditorLanguage = language;
  const isRunDisabled =
    running || execution.status === "queued" || execution.status === "running";

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b border-border bg-muted/30 px-4 py-2 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold">Code playground</h1>
          <p className="text-sm text-muted-foreground">
            Run TypeScript or Rust code on the backend. Results appear below.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as ExecLanguage)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {LANGUAGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <Button onClick={runCode} disabled={isRunDisabled} size="sm">
            {isRunDisabled ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Play className="h-4 w-4 mr-1" />
                Run
              </>
            )}
          </Button>
        </div>
      </div>
      <div className="flex-1 min-h-0 flex flex-col md:flex-row">
        <div className="flex-1 overflow-hidden min-h-[200px] md:min-h-0">
          <CodeEditor
            value={code}
            onChange={setCode}
            language={editorLanguage}
            height="100%"
            className="h-full"
          />
        </div>
        <div className="border-t md:border-t-0 md:border-l border-border bg-muted/20 w-full md:w-[360px] flex flex-col min-h-[180px]">
          <div className="px-3 py-2 border-b border-border text-sm font-medium">Output</div>
          <div className="flex-1 overflow-auto p-3 font-mono text-sm whitespace-pre-wrap break-words">
            {execution.status === "idle" && (
              <span className="text-muted-foreground">Click Run to execute your code.</span>
            )}
            {(execution.status === "queued" || execution.status === "running") && (
              <span className="text-muted-foreground">Running…</span>
            )}
            {(execution.status === "success" || execution.status === "failed") && (
              <>
                {execution.stdout ? (
                  <div className="text-foreground mb-2">{execution.stdout}</div>
                ) : null}
                {execution.stderr ? (
                  <div className="text-destructive mb-2">{execution.stderr}</div>
                ) : null}
                {execution.error && execution.status === "failed" ? (
                  <div className="text-destructive">{execution.error}</div>
                ) : null}
                {typeof execution.exitCode === "number" && (
                  <div className="text-muted-foreground mt-2">Exit code: {execution.exitCode}</div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

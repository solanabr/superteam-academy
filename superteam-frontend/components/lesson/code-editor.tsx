"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Loader2,
  Circle,
  Zap,
  ArrowRight,
  PartyPopper,
  Lock,
  Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[hsl(200,10%,7%)]">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-sm">Loading editor...</span>
      </div>
    </div>
  ),
});

const defaultStarterCode = `use anchor_lang::prelude::*;

declare_id!("YourProgramId1111111111111111111111");

#[program]
pub mod counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        // TODO: Initialize the counter account
        // Set count to 0
        // Set authority to the signer
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        // TODO: Increment the counter
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + 8 + 32)]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut, has_one = authority)]
    pub counter: Account<'info, Counter>,
    pub authority: Signer<'info>,
}

#[account]
pub struct Counter {
    pub count: u64,
    pub authority: Pubkey,
}`;

const defaultTestCases: TestCase[] = [
  {
    name: "Initializes counter to 0",
    expected:
      "fn_sig:initialize(ctx: Context<Initialize>) -> Result<()>|assign:count = 0|assign:authority = ctx.accounts.authority.key()",
  },
  {
    name: "Defines Counter struct with required fields",
    expected: "struct_def:Counter{count: u64, authority: Pubkey}",
  },
  {
    name: "Increments counter correctly",
    expected:
      "fn_sig:increment(ctx: Context<Increment>) -> Result<()>|pattern:count.*(?:checked_add|\\+= 1|\\+ 1|wrapping_add)",
  },
  {
    name: "Enforces authority constraint on increment",
    expected:
      "pattern:has_one\\s*=\\s*authority|struct_field:Increment{authority: Signer}",
  },
];

type TestCase = {
  name: string;
  expected: string;
  passed?: boolean;
};

type CodeEditorProps = {
  language?: string;
  starterCode?: string;
  testCases?: TestCase[];
  onComplete?: () => void;
  courseSlug?: string;
  nextLessonId?: string | null;
};

// ---------------------------------------------------------------------------
// Validation engine
// ---------------------------------------------------------------------------

type ValidationRule =
  | { type: "fn_sig"; signature: string }
  | { type: "struct_def"; name: string; fields: string[] }
  | { type: "struct_field"; name: string; fields: string[] }
  | { type: "pattern"; regex: string }
  | { type: "assign"; fragment: string }
  | { type: "macro"; name: string }
  | { type: "api_call"; fragment: string };

function parseRules(expected: string): ValidationRule[] {
  return expected.split("|").map((segment) => {
    const colonIdx = segment.indexOf(":");
    if (colonIdx === -1)
      return { type: "pattern", regex: escapeRegex(segment) };
    const kind = segment.slice(0, colonIdx);
    const value = segment.slice(colonIdx + 1);

    switch (kind) {
      case "fn_sig":
        return { type: "fn_sig", signature: value };
      case "struct_def": {
        const match = value.match(/^(\w+)\{(.+)\}$/);
        if (match)
          return {
            type: "struct_def",
            name: match[1],
            fields: match[2].split(",").map((f) => f.trim()),
          };
        return { type: "pattern", regex: escapeRegex(value) };
      }
      case "struct_field": {
        const match = value.match(/^(\w+)\{(.+)\}$/);
        if (match)
          return {
            type: "struct_field",
            name: match[1],
            fields: match[2].split(",").map((f) => f.trim()),
          };
        return { type: "pattern", regex: escapeRegex(value) };
      }
      case "pattern":
        return { type: "pattern", regex: value };
      case "assign":
        return { type: "assign", fragment: value };
      case "macro":
        return { type: "macro", name: value };
      case "api_call":
        return { type: "api_call", fragment: value };
      default:
        return { type: "pattern", regex: escapeRegex(segment) };
    }
  });
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Strip single-line comments and block comments so they don't produce false positives. */
function stripComments(code: string): string {
  return code.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
}

/** Normalize whitespace for structural matching (collapse runs, trim). */
function normalizeWs(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function checkRule(
  rule: ValidationRule,
  code: string,
  stripped: string,
): { ok: boolean; reason: string } {
  switch (rule.type) {
    case "fn_sig": {
      // e.g. "initialize(ctx: Context<Initialize>) -> Result<()>"
      const fnName = rule.signature.split("(")[0].trim();
      const fnPattern = new RegExp(
        `pub\\s+fn\\s+${escapeRegex(fnName)}\\s*\\(`,
      );
      if (!fnPattern.test(stripped)) {
        return { ok: false, reason: `Missing function \`${fnName}\`` };
      }
      // Check the full signature loosely: normalize whitespace and match key parts
      const sigParts = rule.signature.match(/\(([^)]*)\)\s*->\s*(.+)/);
      if (sigParts) {
        const params = sigParts[1];
        const returnType = sigParts[2].trim();
        const paramTokens = params.split(",").map((p) =>
          p
            .trim()
            .split(":")
            .map((t) => t.trim()),
        );
        for (const [paramName, paramType] of paramTokens) {
          if (paramType) {
            const paramRegex = new RegExp(
              `${escapeRegex(paramName)}\\s*:\\s*${escapeRegex(paramType).replace(/\s+/g, "\\s*")}`,
            );
            if (!paramRegex.test(stripped)) {
              return {
                ok: false,
                reason: `Parameter \`${paramName}: ${paramType}\` not found in \`${fnName}\``,
              };
            }
          }
        }
        const retRegex = new RegExp(
          `fn\\s+${escapeRegex(fnName)}[^{]*->\\s*${escapeRegex(returnType).replace(/\s+/g, "\\s*")}`,
        );
        if (!retRegex.test(stripped)) {
          return {
            ok: false,
            reason: `Function \`${fnName}\` should return \`${returnType}\``,
          };
        }
      }
      return { ok: true, reason: "" };
    }

    case "struct_def": {
      // Verify that a #[account] (or plain) struct exists with the required fields
      const structRegex = new RegExp(
        `pub\\s+struct\\s+${escapeRegex(rule.name)}\\b[^{]*\\{([^}]*)\\}`,
        "s",
      );
      const m = structRegex.exec(stripped);
      if (!m) return { ok: false, reason: `Struct \`${rule.name}\` not found` };
      const body = normalizeWs(m[1]);
      for (const field of rule.fields) {
        const [fname, ftype] = field.split(":").map((s) => s.trim());
        if (ftype) {
          const fieldRegex = new RegExp(
            `${escapeRegex(fname)}\\s*:\\s*${escapeRegex(ftype)}`,
          );
          if (!fieldRegex.test(body)) {
            return {
              ok: false,
              reason: `Struct \`${rule.name}\` is missing field \`${fname}: ${ftype}\``,
            };
          }
        } else {
          if (!body.includes(fname)) {
            return {
              ok: false,
              reason: `Struct \`${rule.name}\` is missing field \`${fname}\``,
            };
          }
        }
      }
      return { ok: true, reason: "" };
    }

    case "struct_field": {
      // Like struct_def but matches #[derive(Accounts)] structs with Account<> / Signer<> types
      const structRegex = new RegExp(
        `pub\\s+struct\\s+${escapeRegex(rule.name)}\\b[^{]*\\{([\\s\\S]*?)\\}`,
      );
      const m = structRegex.exec(stripped);
      if (!m)
        return {
          ok: false,
          reason: `Accounts struct \`${rule.name}\` not found`,
        };
      const body = m[1];
      for (const field of rule.fields) {
        const [fname, ftype] = field.split(":").map((s) => s.trim());
        if (ftype) {
          const fieldRegex = new RegExp(
            `${escapeRegex(fname)}\\s*:\\s*${escapeRegex(ftype)}`,
          );
          if (!fieldRegex.test(body)) {
            return {
              ok: false,
              reason: `\`${rule.name}\` missing \`${fname}: ${ftype}\``,
            };
          }
        } else if (!body.includes(fname)) {
          return {
            ok: false,
            reason: `\`${rule.name}\` missing field \`${fname}\``,
          };
        }
      }
      return { ok: true, reason: "" };
    }

    case "pattern": {
      const re = new RegExp(rule.regex, "s");
      if (!re.test(stripped)) {
        return {
          ok: false,
          reason: `Expected pattern not found: /${rule.regex}/`,
        };
      }
      return { ok: true, reason: "" };
    }

    case "assign": {
      // e.g. "count = 0" -- look for an assignment in the uncommented code
      const parts = rule.fragment.split("=").map((s) => s.trim());
      if (parts.length < 2) {
        // Fallback: just search for the fragment
        if (!stripped.includes(rule.fragment)) {
          return {
            ok: false,
            reason: `Assignment \`${rule.fragment}\` not found`,
          };
        }
        return { ok: true, reason: "" };
      }
      const lhs = parts[0];
      const rhs = parts.slice(1).join("=").trim();
      // Build a loose regex: lhs (possibly preceded by a dot or ->) then = then rhs
      const assignRegex = new RegExp(
        `${escapeRegex(lhs).replace(/\s+/g, "\\s*")}\\s*=\\s*${escapeRegex(rhs).replace(/\s+/g, "\\s*")}`,
      );
      if (!assignRegex.test(stripped)) {
        return {
          ok: false,
          reason: `Expected assignment: \`${lhs} = ${rhs}\``,
        };
      }
      return { ok: true, reason: "" };
    }

    case "macro": {
      const macroRegex = new RegExp(`${escapeRegex(rule.name)}\\s*!`);
      if (!macroRegex.test(stripped)) {
        return { ok: false, reason: `Macro \`${rule.name}!\` not found` };
      }
      return { ok: true, reason: "" };
    }

    case "api_call": {
      if (!stripped.includes(rule.fragment)) {
        return { ok: false, reason: `API call \`${rule.fragment}\` not found` };
      }
      return { ok: true, reason: "" };
    }
  }
}

function runTestCase(
  testCase: { name: string; expected: string },
  code: string,
  stripped: string,
): { passed: boolean; reason: string } {
  const rules = parseRules(testCase.expected);
  for (const rule of rules) {
    const result = checkRule(rule, code, stripped);
    if (!result.ok) return { passed: false, reason: result.reason };
  }
  return { passed: true, reason: "" };
}

// ---------------------------------------------------------------------------
// Syntax checking (fallback when no test cases provided)
// ---------------------------------------------------------------------------

type SyntaxIssue = { line: number; message: string };

function checkSyntax(code: string): SyntaxIssue[] {
  const issues: SyntaxIssue[] = [];
  const lines = code.split("\n");

  // Bracket / brace / paren matching
  const stack: { char: string; line: number }[] = [];
  const openers: Record<string, string> = {
    "(": ")",
    "[": "]",
    "{": "}",
    "<": ">",
  };
  const closers: Record<string, string> = {
    ")": "(",
    "]": "[",
    "}": "{",
    ">": "<",
  };

  let inLineComment = false;
  let inBlockComment = false;
  let inString = false;
  let stringChar = "";

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    inLineComment = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      const next = line[i + 1];

      if (inBlockComment) {
        if (ch === "*" && next === "/") {
          inBlockComment = false;
          i++;
        }
        continue;
      }

      if (inLineComment) continue;

      if (inString) {
        if (ch === "\\" && i + 1 < line.length) {
          i++; // skip escaped char
          continue;
        }
        if (ch === stringChar) inString = false;
        continue;
      }

      if (ch === "/" && next === "/") {
        inLineComment = true;
        continue;
      }
      if (ch === "/" && next === "*") {
        inBlockComment = true;
        i++;
        continue;
      }
      if (ch === '"' || ch === "'") {
        inString = true;
        stringChar = ch;
        continue;
      }

      // Skip angle brackets in generics -- only track them around known patterns
      // This avoids false positives from comparison operators
      if (ch === "<" || ch === ">") {
        // Only track angle brackets when they look like generics
        if (ch === "<") {
          const before = line.slice(0, i);
          if (/\w$/.test(before)) {
            stack.push({ char: "<", line: lineIdx + 1 });
          }
        } else if (ch === ">") {
          // Pop the most recent '<' if any
          const lastAngle = stack.findLastIndex((s) => s.char === "<");
          if (lastAngle !== -1) {
            stack.splice(lastAngle, 1);
          }
        }
        continue;
      }

      if (openers[ch] && ch !== "<") {
        stack.push({ char: ch, line: lineIdx + 1 });
      } else if (closers[ch] && ch !== ">") {
        const expected = closers[ch];
        // Find the most recent matching opener
        const lastIdx = stack.findLastIndex((s) => s.char === expected);
        if (lastIdx === -1) {
          issues.push({
            line: lineIdx + 1,
            message: `Unexpected \`${ch}\` with no matching \`${expected}\``,
          });
        } else {
          stack.splice(lastIdx, 1);
        }
      }
    }
  }

  for (const unclosed of stack) {
    if (unclosed.char !== "<") {
      issues.push({
        line: unclosed.line,
        message: `Unclosed \`${unclosed.char}\` (opened on line ${unclosed.line})`,
      });
    }
  }

  // Check for common Rust/Anchor issues
  const stripped = stripComments(code);

  // Missing semicolons on let/assignment lines (heuristic)
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    // Skip empty, comments, attributes, closing braces, macros, control flow
    if (
      !trimmed ||
      trimmed.startsWith("//") ||
      trimmed.startsWith("/*") ||
      trimmed.startsWith("*") ||
      trimmed.startsWith("#[") ||
      trimmed === "}" ||
      trimmed === "{" ||
      trimmed === "};" ||
      trimmed.startsWith("pub mod") ||
      trimmed.startsWith("pub fn") ||
      trimmed.startsWith("fn ") ||
      trimmed.startsWith("use ") ||
      trimmed.startsWith("mod ") ||
      trimmed.startsWith("if ") ||
      trimmed.startsWith("} else") ||
      trimmed.startsWith("for ") ||
      trimmed.startsWith("while ") ||
      trimmed.startsWith("match ") ||
      trimmed.startsWith("loop") ||
      trimmed.startsWith("pub struct") ||
      trimmed.startsWith("pub enum") ||
      trimmed.startsWith("struct ") ||
      trimmed.startsWith("enum ") ||
      trimmed.startsWith("impl ") ||
      trimmed.startsWith("declare_id") ||
      trimmed.startsWith("msg!") ||
      trimmed.endsWith(",") ||
      trimmed.endsWith("{") ||
      trimmed.endsWith("}")
    )
      continue;

    if (
      trimmed.startsWith("let ") &&
      !trimmed.endsWith(";") &&
      !trimmed.endsWith("{")
    ) {
      issues.push({ line: i + 1, message: `Possible missing semicolon` });
    }
  }

  // Warn about empty function bodies (only Ok(()) with TODOs still present)
  const fnBodyRegex = /pub\s+fn\s+(\w+)[^{]*\{([^}]*)\}/g;
  let fnMatch;
  while ((fnMatch = fnBodyRegex.exec(stripped)) !== null) {
    const body = fnMatch[2].trim();
    if (body === "Ok(())") {
      // Find approximate line number
      const prefix = stripped.slice(0, fnMatch.index);
      const lineNum = prefix.split("\n").length;
      issues.push({
        line: lineNum,
        message: `Function \`${fnMatch[1]}\` has an empty body`,
      });
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Compilation simulation
// ---------------------------------------------------------------------------

type CompilationResult = {
  success: boolean;
  messages: string[];
  duration: number;
};

function simulateCompilation(
  code: string,
  language: string,
): CompilationResult {
  const syntaxIssues = checkSyntax(code);
  const stripped = stripComments(code);
  const duration = 800 + Math.floor(Math.random() * 400);

  const messages: string[] = [];

  if (language === "rust") {
    messages.push(`   Compiling academy_challenge v0.1.0`);
  } else if (language === "typescript") {
    messages.push(`   Compiling with tsc --noEmit`);
  } else {
    messages.push(`   Compiling source...`);
  }

  // Check for empty TODO bodies as warnings
  const todoWarnings: string[] = [];
  const todoRegex = /\/\/\s*TODO/gm;
  let todoMatch;
  while ((todoMatch = todoRegex.exec(code)) !== null) {
    const lineNum = code.slice(0, todoMatch.index).split("\n").length;
    todoWarnings.push(`warning: unresolved TODO comment on line ${lineNum}`);
  }

  const errors = syntaxIssues.filter(
    (i) =>
      !i.message.startsWith("Function") && !i.message.startsWith("Possible"),
  );
  const warnings = [
    ...syntaxIssues.filter(
      (i) =>
        i.message.startsWith("Function") || i.message.startsWith("Possible"),
    ),
  ];

  if (errors.length > 0) {
    for (const err of errors) {
      messages.push(`error[E0308]: ${err.message}`);
      messages.push(`  --> src/lib.rs:${err.line}`);
    }
    messages.push("");
    messages.push(
      `error: could not compile \`academy_challenge\` due to ${errors.length} error${errors.length > 1 ? "s" : ""}`,
    );
    return { success: false, messages, duration };
  }

  // Warnings don't block compilation
  for (const warn of todoWarnings) {
    messages.push(`${warn}`);
  }
  for (const warn of warnings) {
    messages.push(`warning: ${warn.message}`);
    messages.push(`  --> src/lib.rs:${warn.line}`);
  }

  // Successful compilation
  const warnCount = todoWarnings.length + warnings.length;
  if (language === "rust") {
    // Simulated linking and size info
    const programSize = (stripped.length * 2.3 + 1400).toFixed(0);
    messages.push(
      `    Finished release [optimized] target(s) in ${(duration / 1000).toFixed(2)}s`,
    );
    if (warnCount > 0) {
      messages.push(
        `    Generated ${warnCount} warning${warnCount > 1 ? "s" : ""}`,
      );
    }
    messages.push(`    Program size: ${programSize} bytes`);
  } else {
    messages.push(`    Finished in ${(duration / 1000).toFixed(2)}s`);
  }

  return { success: true, messages, duration };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CodeEditor({
  language = "rust",
  starterCode = defaultStarterCode,
  testCases: testCasesProp,
  onComplete,
  courseSlug,
  nextLessonId,
}: CodeEditorProps) {
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<unknown>(null);

  const initialTestCases = (testCasesProp ?? defaultTestCases).map((t) => ({
    ...t,
    passed: undefined as boolean | undefined,
  }));

  const [code, setCode] = useState(starterCode);
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [tests, setTests] = useState(initialTestCases);
  const [completed, setCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState("editor");
  const [readOnly, setReadOnly] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const completedRef = useRef(false);

  const monacoTheme = resolvedTheme === "dark" ? "vs-dark" : "light";

  const handleEditorDidMount = useCallback((editor: unknown) => {
    editorRef.current = editor;
    if (editor && typeof editor === "object" && "getModel" in editor) {
      const ed = editor as { getModel: () => unknown; focus: () => void };
      ed.focus();
    }
  }, []);

  const handleRun = useCallback(() => {
    setRunning(true);
    setOutput("");
    setActiveTab("output");

    // Phase 1: compilation (delayed to feel real)
    setTimeout(
      () => {
        const currentCode = code;
        const currentTests = testCasesProp ?? defaultTestCases;
        const hasTests = currentTests.length > 0;
        const stripped = stripComments(currentCode);

        const compilation = simulateCompilation(currentCode, language);
        const outputLines: string[] = [...compilation.messages];

        if (!compilation.success) {
          // Compilation failed -- all tests marked as not run
          setTests(currentTests.map((t) => ({ ...t, passed: false })));
          setOutput(outputLines.join("\n"));
          setRunning(false);
          setActiveTab("output");
          return;
        }

        // Phase 2: deploy simulation
        outputLines.push("");
        outputLines.push("   Deploying to local validator...");
        outputLines.push(`   Program deployed at: ${generateFakeAddress()}`);
        outputLines.push("");

        if (!hasTests) {
          // No test cases -- run syntax-only validation
          const issues = checkSyntax(currentCode);
          const realErrors = issues.filter(
            (i) =>
              !i.message.startsWith("Function") &&
              !i.message.startsWith("Possible"),
          );
          if (realErrors.length === 0) {
            outputLines.push("   No test cases defined. Syntax check passed.");
            outputLines.push("");
            const emptyFns = issues.filter((i) =>
              i.message.startsWith("Function"),
            );
            if (emptyFns.length > 0) {
              outputLines.push(
                `warning: ${emptyFns.length} function(s) have empty bodies`,
              );
              for (const fn of emptyFns) {
                outputLines.push(`  --> ${fn.message}`);
              }
            } else {
              outputLines.push("   All checks passed.");
            }
          } else {
            for (const err of realErrors) {
              outputLines.push(`error: line ${err.line}: ${err.message}`);
            }
          }
          setTests([]);
          setOutput(outputLines.join("\n"));
          setRunning(false);
          return;
        }

        // Phase 3: run test cases with pattern validation
        outputLines.push(
          "running " +
            currentTests.length +
            " test" +
            (currentTests.length > 1 ? "s" : ""),
        );
        const results: ((typeof initialTestCases)[number] & {
          reason: string;
        })[] = [];

        for (const t of currentTests) {
          const result = runTestCase(t, currentCode, stripped);
          results.push({ ...t, passed: result.passed, reason: result.reason });
        }

        setTests(results);

        const allPassed = results.every((t) => t.passed);
        const passCount = results.filter((t) => t.passed).length;
        const failCount = results.length - passCount;

        for (const r of results) {
          const icon = r.passed ? "\u2713" : "\u2717";
          outputLines.push(`test ${r.name} ... ${r.passed ? "ok" : "FAILED"}`);
          if (!r.passed && r.reason) {
            outputLines.push(`       ${r.reason}`);
          }
        }

        outputLines.push("");

        if (allPassed) {
          outputLines.push(`test result: ok. ${passCount} passed; 0 failed`);
          outputLines.push("");
          outputLines.push("Transaction confirmed: Success");

          if (!completedRef.current) {
            completedRef.current = true;
            setCompleted(true);
            setShowConfetti(true);
            onComplete?.();
            setTimeout(() => setShowConfetti(false), 3000);
          }
        } else {
          outputLines.push(
            `test result: FAILED. ${passCount} passed; ${failCount} failed`,
          );
          outputLines.push("");

          const failedResults = results.filter((r) => !r.passed);
          outputLines.push("failures:");
          outputLines.push("");
          for (const f of failedResults) {
            outputLines.push(`  ---- ${f.name} ----`);
            outputLines.push(`  ${f.reason}`);
            outputLines.push("");
          }
        }

        setOutput(outputLines.join("\n"));
        setRunning(false);
        setActiveTab("tests");
      },
      1200 + Math.floor(Math.random() * 600),
    );
  }, [code, testCasesProp, onComplete, language]);

  const handleReset = useCallback(() => {
    setCode(starterCode);
    setTests(initialTestCases);
    setOutput("");
    setCompleted(false);
    setShowConfetti(false);
    completedRef.current = false;
  }, [starterCode, initialTestCases]);

  const fileExtension =
    language === "rust"
      ? ".rs"
      : language === "typescript"
        ? ".ts"
        : language === "json"
          ? ".json"
          : "";
  const fileName = `main${fileExtension}`;
  const languageLabel = language.charAt(0).toUpperCase() + language.slice(1);

  return (
    <div className="flex h-full flex-col bg-[hsl(200,10%,7%)] relative overflow-hidden">
      {/* Confetti animation overlay */}
      {showConfetti && (
        <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <span
              key={i}
              className="confetti-particle absolute"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1.5 + Math.random() * 1.5}s`,
                backgroundColor: [
                  "hsl(var(--primary))",
                  "hsl(var(--gold))",
                  "#22c55e",
                  "#3b82f6",
                  "#f59e0b",
                  "#ec4899",
                ][i % 6],
              }}
            />
          ))}
          <style jsx>{`
            @keyframes confetti-fall {
              0% {
                transform: translateY(-10px) rotate(0deg) scale(1);
                opacity: 1;
              }
              100% {
                transform: translateY(100vh) rotate(720deg) scale(0.3);
                opacity: 0;
              }
            }
            .confetti-particle {
              width: 8px;
              height: 8px;
              border-radius: 2px;
              animation: confetti-fall linear forwards;
            }
          `}</style>
        </div>
      )}

      {/* Editor toolbar */}
      <div className="flex h-10 items-center justify-between border-b border-border bg-card px-3">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-[10px] border-border text-muted-foreground font-mono"
          >
            {fileName}
          </Badge>
          <Badge
            variant="outline"
            className="text-[10px] border-border text-muted-foreground"
          >
            {languageLabel}
          </Badge>
          {readOnly && (
            <Badge
              variant="outline"
              className="text-[10px] border-yellow-500/30 text-yellow-500"
            >
              Read Only
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReadOnly(!readOnly)}
            className="h-7 w-7 p-0 text-muted-foreground"
            title={readOnly ? "Enable editing" : "Set read-only"}
          >
            {readOnly ? (
              <Lock className="h-3 w-3" />
            ) : (
              <Unlock className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-7 text-xs text-muted-foreground gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={handleRun}
            disabled={running}
            className="h-7 bg-primary text-primary-foreground hover:bg-primary/90 gap-1 text-xs"
          >
            {running ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Play className="h-3 w-3" />
            )}
            {running ? "Running..." : "Run Code"}
          </Button>
        </div>
      </div>

      {/* Editor + output split */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <TabsList className="h-9 w-full justify-start rounded-none border-b border-border bg-card px-2">
          <TabsTrigger
            value="editor"
            className="text-xs data-[state=active]:bg-secondary data-[state=active]:text-foreground text-muted-foreground"
          >
            Editor
          </TabsTrigger>
          <TabsTrigger
            value="output"
            className="text-xs data-[state=active]:bg-secondary data-[state=active]:text-foreground text-muted-foreground"
          >
            Output
          </TabsTrigger>
          <TabsTrigger
            value="tests"
            className="text-xs data-[state=active]:bg-secondary data-[state=active]:text-foreground text-muted-foreground"
          >
            Tests
            {tests.some((t) => t.passed !== undefined) && (
              <span className="ml-1.5 text-[10px]">
                ({tests.filter((t) => t.passed).length}/{tests.length})
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="flex-1 m-0 overflow-hidden">
          <MonacoEditor
            height="100%"
            language={language}
            theme={monacoTheme}
            value={code}
            onChange={(value) => setCode(value ?? "")}
            onMount={handleEditorDidMount}
            options={{
              readOnly,
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontLigatures: true,
              lineNumbers: "on",
              minimap: { enabled: false },
              wordWrap: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 12, bottom: 12 },
              smoothScrolling: true,
              cursorSmoothCaretAnimation: "on",
              renderLineHighlight: "line",
              bracketPairColorization: { enabled: true },
              guides: {
                bracketPairs: true,
                indentation: true,
              },
              tabSize: 4,
              insertSpaces: true,
              overviewRulerBorder: false,
              hideCursorInOverviewRuler: true,
              scrollbar: {
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8,
              },
            }}
          />
        </TabsContent>

        <TabsContent value="output" className="flex-1 m-0 overflow-hidden">
          <div className="h-full overflow-auto p-4">
            {output ? (
              <pre className="font-mono text-xs whitespace-pre-wrap leading-relaxed">
                {output.split("\n").map((line, i) => {
                  let className = "text-muted-foreground";
                  if (line.startsWith("test result: ok")) {
                    className = "text-green-400 font-semibold";
                  } else if (line.startsWith("test result: FAILED")) {
                    className = "text-red-400 font-semibold";
                  } else if (line.includes("... ok")) {
                    className = "text-green-400";
                  } else if (line.includes("... FAILED")) {
                    className = "text-red-400";
                  } else if (line.startsWith("error")) {
                    className = "text-red-400";
                  } else if (line.startsWith("warning")) {
                    className = "text-yellow-400";
                  } else if (
                    line.startsWith("  -->") ||
                    line.startsWith("       ")
                  ) {
                    className = "text-muted-foreground/70";
                  } else if (line.includes("Compiling")) {
                    className = "text-green-400";
                  } else if (line.includes("Finished")) {
                    className = "text-green-400";
                  } else if (
                    line.includes("Deploying") ||
                    line.includes("deployed at")
                  ) {
                    className = "text-blue-400";
                  } else if (line.startsWith("Transaction confirmed")) {
                    className = "text-primary font-semibold";
                  } else if (line.startsWith("failures:")) {
                    className = "text-red-400 font-semibold";
                  } else if (line.startsWith("  ----")) {
                    className = "text-red-300";
                  }
                  return (
                    <span key={i} className={className}>
                      {line}
                      {"\n"}
                    </span>
                  );
                })}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">
                Click &quot;Run Code&quot; to see the output.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="tests" className="flex-1 m-0 overflow-hidden">
          <div className="h-full overflow-auto p-4 space-y-2">
            {tests.map((test) => (
              <div
                key={test.name}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
              >
                {test.passed === undefined ? (
                  <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                ) : test.passed ? (
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive shrink-0" />
                )}
                <span
                  className={`text-sm ${
                    test.passed === undefined
                      ? "text-muted-foreground"
                      : test.passed
                        ? "text-foreground"
                        : "text-destructive"
                  }`}
                >
                  {test.name}
                </span>
                {test.passed !== undefined && (
                  <Badge
                    variant="outline"
                    className={`ml-auto text-[10px] ${
                      test.passed
                        ? "border-primary/30 text-primary"
                        : "border-destructive/30 text-destructive"
                    }`}
                  >
                    {test.passed ? "PASS" : "FAIL"}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Success banner */}
      {completed && (
        <div className="border-t border-primary/30 bg-primary/10 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PartyPopper className="h-5 w-5 text-[hsl(var(--gold))]" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Challenge Complete!
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Zap className="h-3 w-3 text-primary" /> +120 XP earned
                </p>
              </div>
            </div>
            {nextLessonId && courseSlug && (
              <Link href={`/courses/${courseSlug}/lessons/${nextLessonId}`}>
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1"
                >
                  Next Lesson
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function generateFakeAddress(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789";
  const prefix = Array.from(
    { length: 4 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
  const suffix = Array.from(
    { length: 4 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
  return `${prefix}...${suffix}`;
}

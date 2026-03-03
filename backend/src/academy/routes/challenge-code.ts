import type { Hono } from "hono";
import { VM } from "vm2";
import { getPrisma } from "@/lib/prisma.js";
import { badRequest, withRouteErrorHandling } from "@/lib/errors.js";

type CodeTest = {
  id: string;
  label: string;
  input: unknown;
  expectedOutput: unknown;
  hidden?: boolean;
};

type CodeConfig = {
  kind: "code";
  language: "typescript" | "javascript" | "rust";
  starterCode: string;
  tests: CodeTest[];
};

type RunCodeResult = {
  tests: {
    id: string;
    label: string;
    passed: boolean;
    errorMessage?: string;
    hidden?: boolean;
  }[];
  allPassed: boolean;
};

export function registerChallengeCodeRoutes(app: Hono): void {
  app.post(
    "/challenges/:id/run-code",
    withRouteErrorHandling(async (c) => {
      const prisma = getPrisma();
      const idStr = c.req.param("id");
      const id = parseInt(idStr, 10);
      if (!Number.isInteger(id) || id < 1) {
        throw badRequest("Invalid challenge id");
      }

      const body = (await c.req.json().catch(() => ({}))) as {
        source?: string;
        language?: string;
      };

      const source = (body.source ?? "").toString();
      const language = (body.language ?? "typescript").toString();

      if (!source.trim()) {
        throw badRequest("source is required");
      }
      if (language !== "typescript") {
        throw badRequest("Only TypeScript is supported for now");
      }

      const challenge = await prisma.challenge.findUnique({ where: { id } });
      if (!challenge) {
        throw badRequest("Challenge not found");
      }

      const cfg = challenge.config as unknown as CodeConfig | null;
      if (!cfg || cfg.kind !== "code" || !Array.isArray(cfg.tests) || cfg.tests.length === 0) {
        throw badRequest("Challenge is not a code challenge or has no tests");
      }

      const results: RunCodeResult["tests"] = [];

      // Simple TypeScript handling: assume the code is valid JS/TS and can be
      // executed directly. In a full implementation we would transpile via
      // a proper compiler (esbuild/swc) before running.
      const wrappedSource = `${source}\n\nmodule.exports = typeof solution === "function" ? solution : undefined;`;

      for (const test of cfg.tests) {
        const vm = new VM({
          timeout: 2000,
          sandbox: { module: { exports: undefined as unknown } },
        });
        let passed = false;
        let errorMessage: string | undefined;

        try {
          const exported = vm.run(wrappedSource) as ((input: unknown) => unknown) | undefined;
          if (typeof exported !== "function") {
            throw new Error("Expected a function named solution(input)");
          }
          const output = exported(test.input);
          const expected = test.expectedOutput;
          const same =
            JSON.stringify(output, Object.keys(output as object).sort()) ===
            JSON.stringify(expected, Object.keys(expected as object).sort());
          passed = same;
          if (!same) {
            errorMessage = `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(output)}`;
          }
        } catch (err) {
          passed = false;
          errorMessage = err instanceof Error ? err.message : "Execution error";
        }

        results.push({
          id: test.id,
          label: test.label,
          passed,
          errorMessage,
          hidden: test.hidden,
        });
      }

      const allPassed = results.every((r) => r.passed);
      const payload: RunCodeResult = { tests: results, allPassed };

      return c.json(payload);
    })
  );
}


import type { Hono } from "hono";
import { getPrisma } from "@/lib/prisma.js";
import { addCodeExecutionJob } from "@/lib/queue.js";
import { badRequest, notFound, withRouteErrorHandling } from "@/lib/errors.js";

const MAX_SOURCE_BYTES = 50 * 1024; // 50 KB
const ALLOWED_LANGUAGES = ["typescript", "rust"] as const;

export function registerCodeExecuteRoutes(app: Hono): void {
  app.post(
    "/code/execute",
    withRouteErrorHandling(async (c) => {
      const body = (await c.req.json().catch(() => ({}))) as {
        source?: string;
        language?: string;
      };

      const source = typeof body.source === "string" ? body.source : "";
      const languageRaw = (body.language ?? "typescript").toString().toLowerCase();

      if (!source.trim()) {
        throw badRequest("source is required");
      }
      const sourceBytes = Buffer.byteLength(source, "utf8");
      if (sourceBytes > MAX_SOURCE_BYTES) {
        throw badRequest(`source exceeds ${MAX_SOURCE_BYTES} byte limit`);
      }
      if (!ALLOWED_LANGUAGES.includes(languageRaw as (typeof ALLOWED_LANGUAGES)[number])) {
        throw badRequest("language must be typescript or rust");
      }
      const language = languageRaw as "typescript" | "rust";

      const prisma = getPrisma();
      const execution = await prisma.codeExecution.create({
        data: {
          status: "queued",
          language,
          source,
        },
      });

      await addCodeExecutionJob({
        executionId: execution.id,
        language,
        source,
      });

      return c.json({ executionId: execution.id });
    })
  );

  app.get(
    "/code/executions/:id",
    withRouteErrorHandling(async (c) => {
      const id = c.req.param("id");
      if (!id) {
        throw badRequest("id is required");
      }

      const prisma = getPrisma();
      const execution = await prisma.codeExecution.findUnique({
        where: { id },
      });
      if (!execution) {
        throw notFound("Execution not found");
      }

      return c.json({
        id: execution.id,
        status: execution.status,
        language: execution.language,
        stdout: execution.stdout ?? undefined,
        stderr: execution.stderr ?? undefined,
        exitCode: execution.exitCode ?? undefined,
        error: execution.error ?? undefined,
        createdAt: execution.createdAt.toISOString(),
        updatedAt: execution.updatedAt.toISOString(),
      });
    })
  );
}

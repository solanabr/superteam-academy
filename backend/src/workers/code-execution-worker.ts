import "dotenv/config";
import { spawnSync } from "node:child_process";
import { writeFileSync, unlinkSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Worker } from "bullmq";
import { getPrisma } from "@/lib/prisma.js";
import {
  CODE_EXECUTION_QUEUE_NAME,
  getRedisConnectionForWorker,
  type CodeExecutionJobData,
} from "@/lib/queue.js";

const CONTAINER_NAME = process.env.CODE_EXECUTOR_CONTAINER ?? "code-executor";
const IMAGE_NAME = process.env.CODE_EXECUTOR_IMAGE ?? "code-executor";
const EXECUTION_TIMEOUT_MS = 60_000; // 60s (Rust compile + run can be slow)
const MAX_OUTPUT_BYTES = 100 * 1024; // 100 KB

function truncate(str: string, maxBytes: number): string {
  const buf = Buffer.from(str, "utf8");
  if (buf.length <= maxBytes) return str;
  return Buffer.from(buf.subarray(0, maxBytes)).toString("utf8", 0, maxBytes) + "\n...[truncated]";
}

function spawnError(
  result: { status: number | null; stdout?: unknown; stderr?: unknown; error?: Error },
  prefix: string
): string {
  const parts = [
    result.stderr,
    result.stdout,
    result.error?.message,
    result.status != null ? `exit code ${result.status}` : "",
  ].filter((s) => s != null && String(s).trim() !== "");
  return `${prefix}: ${parts.length > 0 ? parts.join("; ") : "no output"}`;
}

const DOCKER_CMD = process.env.DOCKER_CMD ?? "docker";
const DOCKER_USE_SUDO = process.env.DOCKER_USE_SUDO === "true" || process.env.DOCKER_USE_SUDO === "1";

function dockerSpawn(args: string[], opts: { encoding: "utf8"; timeout?: number; maxBuffer?: number }): ReturnType<typeof spawnSync> {
  const argv = DOCKER_USE_SUDO ? ["docker", ...args] : args;
  const cmd = DOCKER_USE_SUDO ? "sudo" : DOCKER_CMD;
  return spawnSync(cmd, argv, opts);
}

function ensureContainerRunning(): void {
  const inspect = dockerSpawn(["ps", "-q", "-f", `name=^${CONTAINER_NAME}$`], {
    encoding: "utf8",
    timeout: 5000,
  });
  if (inspect.status === 0 && String(inspect.stdout ?? "").trim().length > 0) {
    return;
  }
  const start = dockerSpawn(["start", CONTAINER_NAME], {
    encoding: "utf8",
    timeout: 5000,
  });
  if (start.status === 0) return;
  const run = dockerSpawn(
    ["run", "-d", "--name", CONTAINER_NAME, IMAGE_NAME, "sleep", "infinity"],
    { encoding: "utf8", timeout: 15_000 }
  );
  if (run.status !== 0) {
    throw new Error(spawnError(run, "Failed to start container"));
  }
}

function writeSourceToContainer(language: "typescript" | "rust", source: string): void {
  const dir = mkdtempSync(join(tmpdir(), "code-exec-"));
  const filename = language === "rust" ? "main.rs" : "run.ts";
  const localPath = join(dir, filename);
  writeFileSync(localPath, source, "utf8");
  // Rust: Cargo expects src/main.rs, not main.rs at project root
  const destPath =
    language === "rust"
      ? `${CONTAINER_NAME}:/workspace/rust/src/main.rs`
      : `${CONTAINER_NAME}:/workspace/${language}/${filename}`;
  const cp = dockerSpawn(["cp", localPath, destPath], {
    encoding: "utf8",
    timeout: 5000,
  });
  unlinkSync(localPath);
  if (cp.status !== 0) {
    rmSync(dir, { recursive: true, force: true });
    throw new Error(spawnError(cp, "Failed to copy source"));
  }
  rmSync(dir, { recursive: true, force: true });
}

function runInContainer(
  language: "typescript" | "rust"
): { stdout: string; stderr: string; exitCode: number } {
  const timeoutSec = Math.ceil(EXECUTION_TIMEOUT_MS / 1000);
  if (language === "rust") {
    const build = dockerSpawn(
      ["exec", CONTAINER_NAME, "bash", "-c", "cd /workspace/rust && cargo build --release 2>&1"],
      { encoding: "utf8", timeout: EXECUTION_TIMEOUT_MS, maxBuffer: MAX_OUTPUT_BYTES * 2 }
    );
    const buildOut = String(build.stdout ?? "").trim();
    const buildErr = String(build.stderr ?? "").trim();
    const buildCombined = [buildOut, buildErr].filter(Boolean).join("\n");
    if (build.status !== 0) {
      return {
        stdout: "",
        stderr: truncate(buildCombined, MAX_OUTPUT_BYTES),
        exitCode: build.status ?? 1,
      };
    }
    const run = dockerSpawn(
      ["exec", CONTAINER_NAME, "bash", "-c", "cd /workspace/rust && timeout " + timeoutSec + " ./target/release/rust 2>&1"],
      { encoding: "utf8", timeout: EXECUTION_TIMEOUT_MS + 10_000, maxBuffer: MAX_OUTPUT_BYTES * 2 }
    );
    const runOut = String(run.stdout ?? "").trim();
    const runErr = String(run.stderr ?? "").trim();
    return {
      stdout: truncate(runOut, MAX_OUTPUT_BYTES),
      stderr: truncate(runErr, MAX_OUTPUT_BYTES),
      exitCode: run.status ?? 0,
    };
  }
  const run = dockerSpawn(
    [
      "exec",
      CONTAINER_NAME,
      "bash",
      "-c",
      `cd /workspace/typescript && timeout ${timeoutSec} npx tsx run.ts 2>&1`,
    ],
    { encoding: "utf8", timeout: EXECUTION_TIMEOUT_MS + 10_000, maxBuffer: MAX_OUTPUT_BYTES * 2 }
  );
  const runOut = String(run.stdout ?? "").trim();
  const runErr = String(run.stderr ?? "").trim();
  return {
    stdout: truncate(runOut, MAX_OUTPUT_BYTES),
    stderr: truncate(runErr, MAX_OUTPUT_BYTES),
    exitCode: run.status ?? 0,
  };
}

export async function processCodeExecutionJob(data: CodeExecutionJobData): Promise<void> {
  const { executionId, language, source } = data;
  const prisma = getPrisma();

  await prisma.codeExecution.update({
    where: { id: executionId },
    data: { status: "running" },
  });

  try {
    ensureContainerRunning();
    writeSourceToContainer(language, source);
    const result = runInContainer(language);

    await prisma.codeExecution.update({
      where: { id: executionId },
      data: {
        status: result.exitCode === 0 ? "success" : "failed",
        stdout: result.stdout || null,
        stderr: result.stderr || null,
        exitCode: result.exitCode,
        error: result.exitCode !== 0 ? (result.stderr || `Exit code ${result.exitCode}`) : null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.codeExecution.update({
      where: { id: executionId },
      data: {
        status: "failed",
        error: message,
        stderr: message,
      },
    });
  }
}

async function main(): Promise<void> {
  const connection = getRedisConnectionForWorker();
  const worker = new Worker<CodeExecutionJobData>(
    CODE_EXECUTION_QUEUE_NAME,
    async (job) => {
      await processCodeExecutionJob(job.data);
    },
    { connection: connection as never, concurrency: 1 }
  );

  worker.on("completed", (job) => {
    console.log(`Job ${job.id} (execution ${job.data.executionId}) completed`);
  });
  worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
  });

  console.log("Code execution worker started");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

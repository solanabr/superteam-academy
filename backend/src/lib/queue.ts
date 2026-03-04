import { Queue } from "bullmq";
import { Redis } from "ioredis";

export const CODE_EXECUTION_QUEUE_NAME = "code-execution";

function getRedisConnection(): Redis {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  return new Redis(url, { maxRetriesPerRequest: null });
}

let queueInstance: Queue | null = null;

export function getCodeExecutionQueue(): Queue {
  if (!queueInstance) {
    const connection = getRedisConnection();
    queueInstance = new Queue(CODE_EXECUTION_QUEUE_NAME, {
      connection: connection as never,
      defaultJobOptions: {
        removeOnComplete: { count: 1000 },
        attempts: 1,
      },
    });
  }
  return queueInstance;
}

export type CodeExecutionJobData = {
  executionId: string;
  language: "typescript" | "rust";
  source: string;
};

export async function addCodeExecutionJob(data: CodeExecutionJobData): Promise<void> {
  const queue = getCodeExecutionQueue();
  await queue.add("run", data);
}

export function getRedisConnectionForWorker(): Redis {
  return getRedisConnection();
}

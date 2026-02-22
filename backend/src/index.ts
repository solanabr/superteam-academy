import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { config } from "./lib/config.js";
import completeLesson from "./routes/complete-lesson.js";
import finalizeCourse from "./routes/finalize-course.js";
import issueCredential from "./routes/issue-credential.js";
import rewardXp from "./routes/reward-xp.js";

const app = new Hono();

app.use("*", cors({
  origin: process.env.APP_ORIGIN || "http://localhost:3000",
  allowMethods: ["POST", "GET", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

app.get("/health", (c) => c.json({ status: "ok" }));

app.route("/complete-lesson", completeLesson);
app.route("/finalize-course", finalizeCourse);
app.route("/issue-credential", issueCredential);
app.route("/reward-xp", rewardXp);

app.onError((err, c) => {
  console.error(`[${c.req.method}] ${c.req.url}`, err);

  const message = err instanceof Error ? err.message : "Internal server error";
  return c.json({ error: message }, 500);
});

serve({
  fetch: app.fetch,
  port: config.port,
}, (info) => {
  console.log(`Backend listening on http://localhost:${info.port}`);
});

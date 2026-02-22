import { Hono } from "hono";
import { handle } from "hono/vercel";
import { cors } from "hono/cors";
import completeLesson from "../src/routes/complete-lesson.js";
import finalizeCourse from "../src/routes/finalize-course.js";
import issueCredential from "../src/routes/issue-credential.js";
import rewardXp from "../src/routes/reward-xp.js";

export const runtime = "nodejs";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: process.env.APP_ORIGIN || "http://localhost:3000",
    allowMethods: ["POST", "GET", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

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

export default handle(app);

import "dotenv/config";
import express from "express";
import cors from "cors";
import { completeLessonHandler } from "./routes/complete-lesson";
import { finalizeCourseHandler } from "./routes/finalize-course";
import { issueCredentialHandler } from "./routes/issue-credential";
import { leaderboardHandler } from "./routes/leaderboard";

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);

app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || "http://localhost:3000").split(","),
  methods: ["GET", "POST"],
}));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.post("/api/complete-lesson", completeLessonHandler);
app.post("/api/finalize-course", finalizeCourseHandler);
app.post("/api/issue-credential", issueCredentialHandler);
app.get("/api/leaderboard", leaderboardHandler);

app.listen(PORT, () => {
  console.log(`Backend signer running on :${PORT}`);
});

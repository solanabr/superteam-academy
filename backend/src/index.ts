import "dotenv/config";
import express from "express";
import cors from "cors";
import lessonsRouter from "./routes/lessons";
import credentialsRouter from "./routes/credentials";
import achievementsRouter from "./routes/achievements";

const app = express();
const PORT = Number(process.env.PORT ?? 3001);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:3000";

// Allow all localhost origins in development (any port)
const corsOptions = {
  origin: (origin: string | undefined, cb: (e: Error | null, ok?: boolean) => void) => {
    if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin) || origin === CORS_ORIGIN) {
      cb(null, true);
    } else {
      cb(new Error("CORS: not allowed"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

app.use("/lessons", lessonsRouter);
app.use("/credentials", credentialsRouter);
app.use("/achievements", achievementsRouter);

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[backend] Listening on http://localhost:${PORT}`);
  console.log(`[backend] Program: ${process.env.PROGRAM_ID ?? "64XGGSc32TUX7rxge5u4Qsv55RQN5ybSwS4B1eksWTxy"}`);
  console.log(`[backend] Network: ${process.env.RPC_URL ?? "devnet"}`);
});

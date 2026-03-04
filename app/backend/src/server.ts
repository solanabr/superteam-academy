import express, { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import swaggerUi from "swagger-ui-express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import dotenv from "dotenv";
import mongoSanitize from "express-mongo-sanitize";

dotenv.config();
// console.log("Mongo URI: ", process.env.MONGO_URI);

// Utils
const errorResponse = (
  res: Response,
  message: string,
  statusCode: number
): Response => {
  return res.status(statusCode).json({ success: false, message });
};

const app = express();

const environment: string = process.env.NODE_ENV || "production";
const isDevelopment: boolean = environment === "development";

// Set default port if not provided
const PORT: number = parseInt(process.env.PORT || "5050", 10);

// Tell Express we are behind a proxy (Cloudflare)
app.set("trust proxy", true);

// Middleware
app.use(express.json());

// NoSQL Injection protection — strips keys starting with $ or containing .
app.use(mongoSanitize());

// CORS
app.use(cors());

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err && err.message === "Not allowed by CORS") {
    return errorResponse(res, "Origin not allowed by CORS", 403);
  }
  return next(err);
});

// Configure CSP with Helmet
// In production: strict CSP without unsafe-inline
// In development: allow unsafe-inline for Swagger UI compatibility
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": [
          "'self'",
          ...(isDevelopment ? ["'unsafe-inline'"] : []),
        ],
        "style-src": [
          "'self'",
          ...(isDevelopment ? ["'unsafe-inline'"] : []),
        ],
        "img-src": ["'self'", "data:", "https:"],
        "connect-src": ["'self'", "https:", "wss:"],
        "font-src": ["'self'", "https:", "data:"],
        "object-src": ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

if (!isDevelopment) {
  app.use(
    helmet.hsts({
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    })
  );
}

app.use(morgan("dev"));

// Serve static files from public directory
app.use(express.static("public"));

// Routes
import authRoutes from "./routes/auth";
import courseRoutes from "./routes/courses";
import profileRoutes from "./routes/profile";
import dashboardRoutes from "./routes/dashboard";
import leaderboardRoutes from "./routes/leaderboard";
import uploadRoutes from "./routes/upload";
import achievementRoutes from "./routes/achievements";
import communityRoutes from "./routes/community";
import adminRoutes from "./routes/admin";
import swaggerSpecs from "./swagger";
import { seedAchievementTypes } from "./models/achievementType";
import { generalLimiter } from "./middlewares/rateLimit";

// Swagger UI (available in all environments)
if (isDevelopment) {
  app.use(
    "/api/v1/sollearn/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpecs, {
      explorer: true,
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "SolLearn API Documentation",
    })
  );
}

// Global rate limiter — safety net (200 req/min per IP)
app.use(generalLimiter);

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/courses", courseRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/leaderboard", leaderboardRoutes);
app.use("/api/v1/upload", uploadRoutes);
app.use("/api/v1/achievements", achievementRoutes);
app.use("/api/v1/community", communityRoutes);
app.use("/api/v1/admin", adminRoutes);

// Root route
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "SolLearn API - Decentralized Learning on Solana",
    documentation: isDevelopment
      ? `Visit /api/v1/sollearn/api-docs for API documentation`
      : "API documentation available in development mode",
  });
});

// MongoDB connection with retry logic
const connectDB = async (): Promise<void> => {
  const MONGO_URI = process.env.MONGO_URI;

  if (!MONGO_URI) {
    console.error("MONGO_URI is not defined in environment variables.");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
    });

    console.log("✅ MongoDB connected successfully");

    // Seed achievement types (upsert — safe to run every startup)
    await seedAchievementTypes();

    // Only register these AFTER successful connection
    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB disconnected.");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("🔄 MongoDB reconnected");
    });

  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
};
// // Mongoose connection event listeners
// mongoose.connection.on("disconnected", () => {
//   console.warn("⚠️  MongoDB disconnected. Attempting to reconnect...");
// });

// mongoose.connection.on("reconnected", () => {
//   console.log("🔄 MongoDB reconnected");
// });

// // Graceful shutdown
// const shutdown = async (): Promise<void> => {
//   console.log("\n🛑 Shutting down SolLearn server...");
//   await mongoose.connection.close();
//   console.log("MongoDB connection closed.");
//   process.exit(0);
// };

// process.on("SIGINT", shutdown);
// process.on("SIGTERM", shutdown);

// Bootstrap
const bootstrap = async (): Promise<void> => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 SolLearn API running on port ${PORT}`);
    console.log(`🌐 Environment: ${environment}`);
    if (isDevelopment) {
      console.log(
        `📚 API Docs: http://localhost:${PORT}/api/v1/sollearn/api-docs`
      );
    }
  });
};

bootstrap();

export default app;
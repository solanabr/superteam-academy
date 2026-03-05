import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./config/env.js";
import { registerRoutes } from "./routes/index.js";
export async function buildApp() {
    const app = Fastify({ logger: true });
    await app.register(cors, {
        origin: env.CORS_ORIGIN,
        credentials: true,
    });
    app.addHook("onRequest", async (request, reply) => {
        reply.header("x-request-id", request.id);
    });
    await registerRoutes(app);
    return app;
}

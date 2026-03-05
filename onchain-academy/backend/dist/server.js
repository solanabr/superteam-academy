import { buildApp } from "./app.js";
import { env } from "./config/env.js";
async function start() {
    const app = await buildApp();
    try {
        await app.listen({ port: env.BACKEND_PORT, host: "0.0.0.0" });
        app.log.info(`Backend listening on ${env.BACKEND_PORT}`);
    }
    catch (error) {
        app.log.error(error);
        process.exit(1);
    }
}
void start();

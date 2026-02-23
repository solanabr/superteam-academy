import { serve } from "@hono/node-server";
import "dotenv/config";
import { createApp } from "@/app.js";

const app = createApp();
const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Academy backend listening on http://localhost:${info.port}`);
});

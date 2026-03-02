import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
try {
  const resolved = require.resolve("@next/env");
  console.log("resolved:", resolved);
} catch (e: any) {
  console.log("not found:", e.message?.slice(0, 100));
}

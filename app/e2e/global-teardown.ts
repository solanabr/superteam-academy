import type { FullConfig } from "@playwright/test";

async function globalTeardown(_config: FullConfig) {}

export default globalTeardown;

import type { FullConfig } from "@playwright/test";

async function globalTeardown(_config: FullConfig) {
	// noop
}

export default globalTeardown;

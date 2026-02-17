import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts", "src/config.ts", "src/utils.ts", "src/mocks.ts", "src/factories.ts"],
	format: ["cjs", "esm"],
	dts: true,
	splitting: false,
	sourcemap: true,
	clean: true,
	external: [
		"react",
		"react-dom",
		"@testing-library/react",
		"@testing-library/jest-dom",
		"@testing-library/user-event",
		"vitest",
		"jsdom",
		"msw",
		"faker",
		"lodash",
	],
});

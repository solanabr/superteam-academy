import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    testTimeout: 30_000,
    // Gate 6's Rust oracle shells out to `cargo-build-sbf`. Off by default so
    // no unrelated fixture (the `good` template ships a buildable block)
    // silently spends minutes compiling Anchor on a machine that happens to
    // have the toolchain. gate6-rust.test.ts opts back in per test.
    env: { CONTENT_LINT_RUST_ORACLE: "off" },
  },
});

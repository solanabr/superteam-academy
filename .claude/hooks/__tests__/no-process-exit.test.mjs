// Node 24.7 intermittently segfaults inside process.exit(), and the hooks run
// with onFailure "block", so a crash blocks the user's command. The hooks must
// set process.exitCode and return instead.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const hooksDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

test("no hook script calls process.exit()", () => {
  const files = [
    ...fs.readdirSync(hooksDir).map((f) => path.join(hooksDir, f)),
    ...fs
      .readdirSync(path.join(hooksDir, "lib"))
      .map((f) => path.join(hooksDir, "lib", f)),
  ].filter((f) => f.endsWith(".mjs"));
  assert.ok(files.length > 0);
  for (const file of files) {
    const src = fs.readFileSync(file, "utf8").replace(/\/\/.*$/gm, "");
    assert.ok(
      !/process\.exit\s*\(/.test(src),
      `${path.basename(file)} calls process.exit()`
    );
  }
});

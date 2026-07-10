import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

/** Write a `path -> contents` map into a fresh temp dir; return the dir. */
export function makeTempRepo(tree: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "content-lint-"));
  for (const [rel, contents] of Object.entries(tree)) {
    const abs = join(root, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, contents, "utf8");
  }
  return root;
}

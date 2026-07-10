import { gzipSync } from "node:zlib";
import { stringify } from "yaml";

/**
 * Build a minimal, spec-compliant POSIX tar (512-byte records) in-memory.
 * Shared by tarball.test.ts and sync.test.ts so the archive layout stays in one
 * place. Keys are the full tar entry names (including the generated top dir).
 */
export function makeTar(
  files: Record<string, string | Uint8Array>
): Uint8Array {
  const enc = new TextEncoder();
  const blocks: Uint8Array[] = [];
  const pad = (b: Uint8Array): Uint8Array => {
    const rem = b.length % 512;
    return rem === 0 ? b : new Uint8Array([...b, ...new Uint8Array(512 - rem)]);
  };
  for (const [name, raw] of Object.entries(files)) {
    const body = typeof raw === "string" ? enc.encode(raw) : raw;
    const header = new Uint8Array(512);
    header.set(enc.encode(name), 0); // name (100)
    header.set(enc.encode("0000644"), 100); // mode
    header.set(enc.encode("0000000"), 108); // uid
    header.set(enc.encode("0000000"), 116); // gid
    const size = body.length.toString(8).padStart(11, "0");
    header.set(enc.encode(size), 124); // size (octal, 12)
    header.set(enc.encode("00000000000"), 136); // mtime
    header[156] = "0".charCodeAt(0); // typeflag: regular file
    header.set(enc.encode("ustar\0"), 257);
    header.set(enc.encode("00"), 263);
    // checksum: sum of bytes with the checksum field treated as spaces
    header.fill(32, 148, 156);
    let sum = 0;
    for (const byte of header) sum += byte;
    header.set(enc.encode(sum.toString(8).padStart(6, "0") + "\0 "), 148);
    blocks.push(header, pad(body));
  }
  blocks.push(new Uint8Array(1024)); // two zero blocks = end of archive
  const total = blocks.reduce((n, b) => n + b.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const b of blocks) {
    out.set(b, off);
    off += b.length;
  }
  return out;
}

/** A real 1x1 transparent PNG (68 bytes) — the image-size probe reads 1x1 from it. */
export const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64"
);

const courseYaml = stringify({
  id: "course-demo",
  slug: "demo",
  title: "Demo",
  description: "d",
  difficulty: "beginner",
  duration: 1,
  xpPerLesson: 10,
  xpReward: 100,
  creator: { githubId: "1" },
  modules: [{ key: "m", title: "M", lessons: ["lesson-accounts"] }],
});

const slotsLockJson = JSON.stringify({
  version: 1,
  slots: { "lesson-accounts": 0 },
  retired: [],
  next: 1,
});

function lessonYaml(withImage: boolean): string {
  void withImage;
  return stringify({
    id: "lesson-accounts",
    slug: "accounts",
    title: "Accounts",
    blocks: [{ key: "intro", type: "prose", src: "intro.md" }],
  });
}

/**
 * A one-course, one-lesson gzipped tarball (course.yaml, slots.lock.json,
 * lesson.yaml, intro.md), keyed under a generated `owner-repo-<sha>/` top dir so
 * `extractTarball` strips it exactly as it would a real GitHub tarball. With
 * `withImage: true` the tree also carries `assets/pixel.png` (PNG_1X1),
 * referenced from intro.md so the asset pipeline has something to sync.
 */
export function makeCourseTarball(
  sha: string,
  opts: { withImage?: boolean } = {}
): Uint8Array {
  const top = `solanabr-academy-courses-${sha}`;
  const lessonDir = `${top}/courses/demo/lessons/accounts`;
  const intro = opts.withImage
    ? "# Accounts\n\nSee ![pixel](assets/pixel.png) here.\n"
    : "# Accounts\n";
  const files: Record<string, string | Uint8Array> = {
    [`${top}/courses/demo/course.yaml`]: courseYaml,
    [`${top}/courses/demo/slots.lock.json`]: slotsLockJson,
    [`${lessonDir}/lesson.yaml`]: lessonYaml(opts.withImage ?? false),
    [`${lessonDir}/intro.md`]: intro,
  };
  if (opts.withImage) {
    files[`${lessonDir}/assets/pixel.png`] = new Uint8Array(PNG_1X1);
  }
  return gzipSync(Buffer.from(makeTar(files)));
}

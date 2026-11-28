// A local stand-in for the build server (docs/ARCHITECTURE.md, section 11), so
// the editor and the tutor can be walked without a build key. It compiles
// nothing: every build fails, with diagnostics in the real server's shape.
//
//   GET  /health  → 200
//   POST /build   → 200 { success: false, stderr, diagnostics, uuid, idl }
//
// The source picks the case. Put one of these in the code that is sent:
//   (nothing)          one error and one warning in /src/lib.rs
//   // walk:verify     one error in the hidden verification file /src/_verify.rs
//   // walk:both       the lib.rs error and the hidden-file error
//   // walk:none       a failed build with no diagnostics

import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { PORTS } from "./lib.mjs";

const LIB_PATH = "/src/lib.rs";
const VERIFY_PATH = "/src/_verify.rs";
const MAX_BODY_BYTES = 512 * 1024;

function send(res, status, body) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

/** The 1-based line and column span of the first code line after `fromLine`. */
function firstCodeSpan(content, fromLine = 1) {
  const lines = content.split("\n");
  for (let i = fromLine - 1; i < lines.length; i++) {
    const text = lines[i];
    const trimmed = text.trim();
    if (trimmed === "" || trimmed.startsWith("//") || trimmed.startsWith("#")) {
      continue;
    }
    if (trimmed === "mod _verify;") continue;
    const col = text.length - text.trimStart().length + 1;
    return { line: i + 1, col, end_line: i + 1, end_col: col + trimmed.length };
  }
  return { line: 1, col: 1, end_line: 1, end_col: 1 };
}

function buildAnswer(files, uuid) {
  const lib = files.find(([path]) => path === LIB_PATH)?.[1] ?? "";
  const source = files.map(([, content]) => content).join("\n");
  const wants = (marker) => source.includes(`walk:${marker}`);

  const errorSpan = firstCodeSpan(lib);
  const libError = {
    file: LIB_PATH,
    ...errorSpan,
    level: "error",
    code: "E0425",
    message: "cannot find function `ping` in this scope",
  };
  const libWarning = {
    file: LIB_PATH,
    ...firstCodeSpan(lib, errorSpan.line + 1),
    level: "warning",
    code: null,
    message: "unused variable: `walk_stub`",
  };
  const verifyError = {
    file: VERIFY_PATH,
    line: 4,
    col: 17,
    end_line: 4,
    end_col: 27,
    level: "error",
    code: "E0425",
    message: "cannot find function `initialize` in this scope",
  };

  let diagnostics = [libError, libWarning];
  if (wants("verify")) diagnostics = [verifyError];
  if (wants("both")) diagnostics = [libError, verifyError, libWarning];
  if (wants("none")) diagnostics = [];

  // Errors first, as the real server orders them.
  const stderr =
    diagnostics.length === 0
      ? "error: could not compile `program` (walk stub, no diagnostics)\n"
      : diagnostics
          .map(
            (d) =>
              `${d.level}${d.code ? `[${d.code}]` : ""}: ${d.message}\n` +
              ` --> ${d.file.slice(1)}:${d.line}:${d.col}\n`
          )
          .join("\n") + "\nerror: could not compile `program` (walk stub)\n";

  return { success: false, stderr, diagnostics, uuid, idl: null };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function isFiles(value) {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (file) =>
        Array.isArray(file) &&
        file.length === 2 &&
        typeof file[0] === "string" &&
        typeof file[1] === "string"
    )
  );
}

/** Start the stub. With `apiKey`, /build refuses another X-API-Key. */
export function startBuildStub({ port = PORTS.buildStub, apiKey } = {}) {
  const server = createServer(async (req, res) => {
    const { pathname } = new URL(req.url, "http://stub");
    if (req.method === "GET" && pathname === "/health") {
      return send(res, 200, { status: "ok", stub: true });
    }
    if (req.method !== "POST" || pathname !== "/build") {
      return send(res, 404, { error: "Not found" });
    }
    if (apiKey && req.headers["x-api-key"] !== apiKey) {
      return send(res, 401, { error: "Invalid API key" });
    }
    let payload;
    try {
      payload = JSON.parse(await readBody(req));
    } catch {
      return send(res, 400, { error: "Invalid request body" });
    }
    if (!isFiles(payload?.files)) {
      return send(res, 400, { error: "At least one source file is required" });
    }
    const uuid = typeof payload.uuid === "string" ? payload.uuid : randomUUID();
    const answer = buildAnswer(payload.files, uuid);
    console.log(
      `[build-stub] /build ${payload.files.map(([path]) => path).join(" ")} → ${answer.diagnostics.length} diagnostics`
    );
    return send(res, 200, answer);
  });
  server.listen(port, "127.0.0.1", () => {
    console.log(`[build-stub] listening on http://127.0.0.1:${port}`);
  });
  return server;
}

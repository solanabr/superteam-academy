#!/usr/bin/env node
/**
 * WebSocket proxy for LSP servers (Rust, TypeScript, JavaScript).
 * Spawns the right language server per connection and forwards JSON-RPC between
 * WebSocket (browser) and the process stdio (LSP).
 *
 * Run: node proxy.mjs   (listens on ws://localhost:8080)
 * Client: ws://localhost:8080?language=rust | typescript | javascript
 */

import { createServer } from "http";
import { spawn } from "child_process";
import { WebSocketServer } from "ws";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.LSP_PROXY_PORT) || 8080;

const LANGS = new Set(["rust", "typescript", "javascript"]);

function spawnRustAnalyzer() {
  return spawn("rust-analyzer", ["--stdio"], {
    stdio: ["pipe", "pipe", "pipe"],
    shell: process.platform === "win32",
  });
}

function spawnTypeScriptServer() {
  const pkgDir = join(__dirname, "node_modules", "typescript-language-server");
  const cliMjs = join(pkgDir, "lib", "cli.mjs");
  const cliJs = join(pkgDir, "lib", "cli.js");
  const cli = existsSync(cliMjs) ? cliMjs : existsSync(cliJs) ? cliJs : null;
  if (cli) {
    const tsLib = join(__dirname, "node_modules", "typescript", "lib");
    return spawn(process.execPath, [cli, "--stdio"], {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, TSSERVER_PATH: join(tsLib, "tsserver.js") },
    });
  }
  // Fallback: rely on PATH (e.g. npx or global install)
  return spawn("npx", ["typescript-language-server", "--stdio"], {
    stdio: ["pipe", "pipe", "pipe"],
    shell: true,
  });
}

function spawnServer(language) {
  if (language === "rust") return spawnRustAnalyzer();
  if (language === "typescript" || language === "javascript") return spawnTypeScriptServer();
  return null;
}

/** LSP stdio: parse Content-Length header then read N bytes. */
function createStdioToWs(stream, send) {
  let buffer = Buffer.alloc(0);
  let expectedLength = null;

  stream.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    while (true) {
      if (expectedLength == null) {
        const idx = buffer.indexOf("\r\n\r\n");
        if (idx === -1) break;
        const header = buffer.subarray(0, idx).toString("ascii");
        const m = header.match(/Content-Length:\s*(\d+)/i);
        expectedLength = m ? parseInt(m[1], 10) : 0;
        buffer = buffer.subarray(idx + 4);
      }
      if (buffer.length < expectedLength) break;
      const body = buffer.subarray(0, expectedLength).toString("utf8");
      buffer = buffer.subarray(expectedLength);
      expectedLength = null;
      send(body);
    }
  });
}

/** Send JSON string to LSP process stdin with Content-Length header. */
function sendToStdin(stdin, message) {
  const body = Buffer.from(message, "utf8");
  const header = `Content-Length: ${body.length}\r\n\r\n`;
  stdin.write(header + body);
}

const server = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("LSP WebSocket proxy. Connect with ws://localhost:" + PORT + "?language=rust|typescript|javascript");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
  const url = new URL(req.url || "", "http://localhost");
  const language = url.searchParams.get("language")?.toLowerCase() || "typescript";

  if (!LANGS.has(language)) {
    ws.close(4000, "Unsupported language. Use ?language=rust|typescript|javascript");
    return;
  }

  const proc = spawnServer(language);
  if (!proc) {
    ws.close(4001, "Failed to spawn server for: " + language);
    return;
  }

  const send = (text) => {
    if (ws.readyState === 1) ws.send(text);
  };

  createStdioToWs(proc.stdout, send);

  ws.on("message", (data) => {
    const text = typeof data === "string" ? data : data.toString("utf8");
    if (proc.stdin.writable) sendToStdin(proc.stdin, text);
  });

  ws.on("close", () => {
    proc.kill("SIGTERM");
  });

  proc.stderr.on("data", (d) => process.stderr.write(`[${language}] ${d}`));
  proc.on("error", (err) => {
    if (ws.readyState === 1) ws.close(4002, err.message);
  });
  proc.on("exit", (code) => {
    if (code !== 0 && code != null) process.stderr.write(`[${language}] exit ${code}\n`);
  });
});

server.listen(PORT, () => {
  console.log(`LSP proxy: ws://localhost:${PORT} (use ?language=rust|typescript|javascript)`);
});

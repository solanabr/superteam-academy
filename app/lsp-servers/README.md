# LSP Servers (Rust, TypeScript, JavaScript)

This directory runs Language Server Protocol (LSP) processes and a WebSocket proxy so the in-browser CodeMirror editor can use hover, completion, and diagnostics.

## Commands to install LSP servers

### 1. TypeScript & JavaScript (one server for both)

From this directory (`app/lsp-servers/`):

```bash
cd app/lsp-servers
pnpm install
# or: npm install
```

This installs `typescript` and `typescript-language-server`. The proxy will spawn:

- `typescript-language-server --stdio` for both **javascript** and **typescript** language IDs.

### 2. Rust

Install **rust-analyzer** (not inside this dir; system-wide or per Rust toolchain):

**Option A – via rustup (recommended):**

```bash
rustup component add rust-analyzer
```

Then ensure `rust-analyzer` is on your `PATH`. Typical path:

- macOS/Linux: `~/.rustup/toolchains/<toolchain>/bin/rust-analyzer`

**Option B – standalone binary:**

```bash
# macOS (Homebrew)
brew install rust-analyzer

# Or download from: https://github.com/rust-lang/rust-analyzer/releases
```

Verify:

```bash
rust-analyzer --version
```

---

## Run the WebSocket proxy

From the repo root or from `app/lsp-servers`:

```bash
cd app/lsp-servers
pnpm run proxy
# or: node proxy.mjs
```

Defaults:

- Listens on: `ws://localhost:8080`
- Query param: `?language=rust` | `?language=typescript` | `?language=javascript`

Example URL for the client: `ws://localhost:8080?language=typescript`

---

## Point the app at the proxy

In the Next.js app `.env.local`:

```env
NEXT_PUBLIC_LSP_WS_URL=ws://localhost:8080
```

The app adds `?language=rust|typescript|javascript` to the WebSocket URL automatically; the proxy reads it and spawns the matching server for that connection.

---

## How to check LSP in the editor (UI)

1. Start the proxy (`pnpm run proxy`), set `NEXT_PUBLIC_LSP_WS_URL=ws://localhost:8080`, restart the Next.js app.
2. Open a lesson with a code editor and choose **Rust**, **TypeScript**, or **JavaScript**.
3. **Hover** over a symbol (e.g. `println!`, `console`, a variable) — you should see a tooltip with docs/signature.
4. **Autocomplete**: type `console.` or `Vec::` and check that rich completions appear.
5. **Errors**: introduce a typo or wrong type — red squiggles should come from the LSP.
6. **Format**: **Shift+Alt+F** (or **Shift+Option+F** on Mac) to format via LSP.

If nothing happens, check the browser devtools console for WebSocket/LSP errors and that the proxy is running.

---

## Summary of commands

| Task | Command |
|------|--------|
| Install TS/JS LSP (from `app/lsp-servers`) | `pnpm install` or `npm install` |
| Install Rust LSP | `rustup component add rust-analyzer` or `brew install rust-analyzer` |
| Run WebSocket proxy | `cd app/lsp-servers && pnpm run proxy` |
| Check rust-analyzer | `rust-analyzer --version` |
| Check TS server | `npx typescript-language-server --version` |

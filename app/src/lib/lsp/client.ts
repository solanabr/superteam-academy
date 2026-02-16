/**
 * LSP Client setup for CodeMirror
 * Creates and manages LSP clients for different languages
 * 
 * NOTE: This module uses dynamic imports to gracefully handle
 * when @codemirror/lsp-client is not installed or unavailable.
 * The editor will work perfectly fine without LSP features.
 */

import type { Extension } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import { getLSPTransport } from "./transport";

// Cache for LSP clients to avoid recreating them
const clientCache = new Map<string, any>();

// Cache for LSP module (loaded dynamically)
let lspModule: any = null;
let lspModuleLoading: Promise<any> | null = null;

/**
 * Dynamically load @codemirror/lsp-client module
 * Returns null if package is not installed or fails to load
 */
async function loadLSPModule(): Promise<any> {
  // Return cached module if already loaded
  if (lspModule) {
    return lspModule;
  }

  // Return existing loading promise if already loading
  if (lspModuleLoading) {
    return lspModuleLoading;
  }

  // Start loading
  lspModuleLoading = (async () => {
    try {
      const module = await import("@codemirror/lsp-client");
      lspModule = module;
      return module;
    } catch (error) {
      // Package not installed or failed to load
      console.warn("@codemirror/lsp-client not available, LSP features disabled:", error);
      return null;
    } finally {
      lspModuleLoading = null;
    }
  })();

  return lspModuleLoading;
}

/**
 * Get or create an LSP client for a specific language
 * Returns null if LSP is not available
 */
export async function getLSPClient(
  language: "rust" | "typescript" | "javascript"
): Promise<any | null> {
  // Load LSP module first
  const module = await loadLSPModule();
  if (!module) {
    return null;
  }

  const cacheKey = language;

  // Return cached client if available
  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey)!;
  }

  // Get transport
  const transport = await getLSPTransport(language);
  if (!transport) {
    return null;
  }

  try {
    // Longer timeout: language servers (e.g. typescript-language-server) can take several seconds to start.
    const timeoutMs = 15_000;
    // Custom extensions with longer hoverTime so hover tooltips have time to appear (default can be too short).
    const extensionsWithHover = [
      module.serverCompletion(),
      module.hoverTooltips({ hoverTime: 400 }),
      keymap.of([
        ...module.formatKeymap,
        ...module.renameKeymap,
        ...module.jumpToDefinitionKeymap,
        ...module.findReferencesKeymap,
      ]),
      module.signatureHelp(),
      module.serverDiagnostics(),
    ];
    const client = new module.LSPClient({
      extensions: extensionsWithHover,
      rootUri: "file:///workspace",
      timeout: timeoutMs,
    }).connect(transport);

    // Cache the client
    clientCache.set(cacheKey, client);

    return client;
  } catch (error) {
    console.error("Failed to create LSP client:", error);
    return null;
  }
}

/**
 * Get LSP extensions for a specific language and file URI
 * Returns empty array if LSP is not available (graceful fallback)
 */
export async function getLSPExtensions(
  language: "rust" | "typescript" | "javascript",
  fileURI: string
): Promise<Extension[]> {
  // Load LSP module first
  const module = await loadLSPModule();
  if (!module) {
    return []; // Graceful fallback - no LSP extensions
  }

  const client = await getLSPClient(language);
  if (!client) {
    return []; // Graceful fallback - no transport available
  }

  try {
    // Wait for server to finish initialize; if it times out or fails, don't add LSP (avoids runtime error in UI).
    await client.initializing.catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("LSP server failed to initialize:", msg);
      clientCache.delete(language);
      return null;
    });
    // If initializing rejected, client may be in a bad state; don't attach plugin.
    if (!client.serverCapabilities) {
      return [];
    }

    const languageID = language === "rust" ? "rust" : language === "typescript" ? "typescript" : "javascript";

    return [
      module.languageServerSupport(client, fileURI, languageID),
    ];
  } catch (error) {
    console.error("Failed to create LSP extensions:", error);
    return [];
  }
}

/**
 * Get LSP command extensions (for manual triggering)
 * Returns null if LSP is not available
 */
export async function getLSPCommands(): Promise<{
  formatDocument: any;
  renameSymbol: any;
} | null> {
  const module = await loadLSPModule();
  if (!module) {
    return null;
  }

  return {
    formatDocument: module.formatDocument,
    renameSymbol: module.renameSymbol,
  };
}

/**
 * LSP Transport layer for CodeMirror
 * Handles communication with language servers via WebSocket or HTTP
 * 
 * NOTE: Transport interface is defined inline to avoid requiring
 * @codemirror/lsp-client at build time. The package is loaded dynamically.
 */

// Transport interface (matches @codemirror/lsp-client Transport type)
export interface Transport {
  send(message: string): void;
  subscribe(handler: (value: string) => void): void;
  unsubscribe(handler: (value: string) => void): void;
}

/**
 * WebSocket-based transport for LSP communication
 * Connects to a WebSocket server that proxies LSP requests
 */
export function createWebSocketTransport(wsUrl: string): Promise<Transport> {
  return new Promise((resolve, reject) => {
    const handlers: Array<(value: string) => void> = [];
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      resolve({
        send(message: string) {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(message);
          }
        },
        subscribe(handler: (value: string) => void) {
          handlers.push(handler);
        },
        unsubscribe(handler: (value: string) => void) {
          const index = handlers.indexOf(handler);
          if (index > -1) {
            handlers.splice(index, 1);
          }
        },
      });
    };

    socket.onmessage = (event) => {
      const message = event.data.toString();
      for (const handler of handlers) {
        handler(message);
      }
    };

    socket.onerror = (error) => {
      reject(error);
    };

    socket.onclose = () => {
      // Handle reconnection if needed
      console.warn("LSP WebSocket connection closed");
    };
  });
}

/**
 * HTTP-based transport for LSP communication
 * Uses POST requests to communicate with LSP server
 */
export function createHTTPTransport(baseUrl: string): Transport {
  let requestId = 0;
  const handlers: Array<(value: string) => void> = [];

  return {
    send(message: string) {
      const parsed = JSON.parse(message);
      const id = parsed.id || ++requestId;

      fetch(`${baseUrl}/lsp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: message,
      })
        .then((response) => response.text())
        .then((responseText) => {
          for (const handler of handlers) {
            handler(responseText);
          }
        })
        .catch((error) => {
          console.error("LSP HTTP request failed:", error);
        });
    },
    subscribe(handler: (value: string) => void) {
      handlers.push(handler);
    },
    unsubscribe(handler: (value: string) => void) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    },
  };
}

/**
 * Get transport based on environment configuration
 * Checks for WebSocket URL first, falls back to HTTP
 * Note: In Next.js, NEXT_PUBLIC_* env vars are available in browser
 */
export async function getLSPTransport(
  language: "rust" | "typescript" | "javascript"
): Promise<Transport | null> {
  const baseUrl = process.env.NEXT_PUBLIC_LSP_WS_URL;
  if (baseUrl) {
    // Proxy in app/lsp-servers expects ?language=rust|typescript|javascript
    const sep = baseUrl.includes("?") ? "&" : "?";
    const wsUrl = `${baseUrl}${sep}language=${language}`;
    try {
      return await createWebSocketTransport(wsUrl);
    } catch (error) {
      console.error("Failed to create WebSocket transport:", error);
    }
  }

  const httpUrl = process.env.NEXT_PUBLIC_LSP_HTTP_URL;
  if (httpUrl) {
    return createHTTPTransport(httpUrl);
  }

  return null;
}

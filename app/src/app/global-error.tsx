"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  const isDev = process.env.NODE_ENV === "development";
  const message = isDev
    ? error?.message || String(error)
    : "Algo falhou ao carregar o site.";

  return (
    <html lang="pt">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          background: "#0f1419",
          color: "#e6edf3",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{ textAlign: "center", padding: "2rem", maxWidth: "480px" }}
        >
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            Erro inesperado
          </h1>
          <p
            style={{
              marginTop: "0.5rem",
              color: "#8b949e",
              wordBreak: "break-word",
            }}
          >
            {message}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              padding: "0.5rem 1rem",
              fontSize: "1rem",
              borderRadius: "0.5rem",
              border: "none",
              background: "#f0b429",
              color: "#0f1419",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}

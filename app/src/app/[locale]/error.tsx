"use client";

import { useEffect } from "react";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
        padding: "1rem",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Algo deu errado</h1>
        <p style={{ marginTop: "0.5rem", color: "#6b7280" }}>
          Ocorreu um erro ao carregar esta página.
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        style={{
          padding: "0.5rem 1.25rem",
          fontSize: "1rem",
          borderRadius: "0.5rem",
          border: "none",
          background: "#eab308",
          color: "#0f1419",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Tentar novamente
      </button>
    </div>
  );
}

"use client";

import * as React from "react";
import { routing } from "@/i18n/routing";

type Props = { children: React.ReactNode };

class ErrorBoundaryClass extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.error("[ProvidersErrorBoundary]", err);
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export function ProvidersErrorBoundary({ children }: Props) {
  return (
    <ErrorBoundaryClass fallback={<ProvidersFallback />}>
      {children}
    </ErrorBoundaryClass>
  );
}

function ProvidersFallback() {
  const base = `/${routing.defaultLocale}`;
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        padding: "1.5rem",
        fontFamily: "system-ui, sans-serif",
        background: "#0f1419",
        color: "#e6edf3",
      }}
    >
      <p style={{ margin: 0, color: "#8b949e" }}>
        Parte do carregamento falhou. Tente recarregar ou acessar a página
        inicial.
      </p>
      <a
        href={base}
        style={{
          color: "#58a6ff",
          textDecoration: "none",
          fontWeight: 600,
        }}
      >
        Ir para a página inicial
      </a>
    </div>
  );
}

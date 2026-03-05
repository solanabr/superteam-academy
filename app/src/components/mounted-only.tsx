"use client";

import * as React from "react";

/**
 * Renderiza children apenas após o componente ter montado no cliente.
 * Evita "Can't perform a React state update on a component that hasn't mounted yet"
 * quando providers (ex.: next-themes, wallet) fazem setState no primeiro render.
 */
export function MountedOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) {
    return (
      <div
        aria-hidden
        style={{
          minHeight: "100vh",
          backgroundColor: "hsl(120 12% 7%)",
        }}
      />
    );
  }
  return <>{children}</>;
}

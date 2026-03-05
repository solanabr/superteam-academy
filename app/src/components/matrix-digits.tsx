"use client";

import { useEffect, useState } from "react";

const COLS = 4;
const ROWS = 4;
const COLS_FILL = 14;
const ROWS_FILL = 14;
const TICK_MS = 500;
const TICK_MS_FILL = 750;

const INITIAL_GRID: string[][] = [
  ["0", "1", "0", "1"],
  ["1", "0", "1", "0"],
  ["0", "1", "0", "1"],
  ["1", "0", "1", "0"],
];

const INITIAL_GRID_FILL: string[][] = Array(ROWS_FILL)
  .fill(0)
  .map((_, i) =>
    Array(COLS_FILL)
      .fill(0)
      .map((_, j) => ((i + j) % 2 === 0 ? "0" : "1")),
  );

type Props = { fill?: boolean };

export function MatrixDigits({ fill = false }: Props) {
  const [digits, setDigits] = useState<string[][]>(
    fill ? INITIAL_GRID_FILL : INITIAL_GRID,
  );

  useEffect(() => {
    const intervalMs = fill ? TICK_MS_FILL : TICK_MS;
    setDigits((prev) =>
      prev.map((row) => row.map(() => (Math.random() > 0.5 ? "1" : "0"))),
    );
    const id = setInterval(() => {
      setDigits((prev) =>
        prev.map((row) => row.map(() => (Math.random() > 0.5 ? "1" : "0"))),
      );
    }, intervalMs);
    return () => clearInterval(id);
  }, [fill]);

  if (fill) {
    return (
      <div
        className="grid h-full min-h-0 w-full min-w-0 gap-px font-mono text-[0.5rem] font-bold leading-none tabular-nums sm:text-[0.6rem]"
        style={{
          gridTemplateColumns: `repeat(${COLS_FILL}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS_FILL}, 1fr)`,
        }}
      >
        {digits.flat().map((d, i) => (
          <span
            key={i}
            className="flex items-center justify-center text-[hsl(var(--brand-logo-green))] dark:text-[hsl(129,75%,40%)]"
            style={{ opacity: 1 }}
          >
            {d}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div
      className="grid h-14 w-14 gap-0.5 font-mono text-xs font-bold leading-none tabular-nums sm:h-16 sm:w-16 sm:text-sm"
      style={{
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gridTemplateRows: `repeat(${ROWS}, 1fr)`,
      }}
    >
      {digits.flat().map((d, i) => (
        <span
          key={i}
          className="flex items-center justify-center text-amber-400 opacity-90 dark:text-[hsl(var(--brand-logo-green))]"
        >
          {d}
        </span>
      ))}
    </div>
  );
}

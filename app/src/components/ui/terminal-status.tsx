"use client";

import { useState, useEffect } from "react";

export function TerminalStatus() {
  const [time, setTime] = useState("");
  const [blockHeight, setBlockHeight] = useState(312_847_291);

  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString("en-US", { hour12: false }));
      setBlockHeight((prev) => prev + Math.floor(Math.random() * 3));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-4 font-mono text-[10px] text-[var(--c-text-2)]/60 select-none">
      <span className="flex items-center gap-1.5">
        <span className="status-dot" />
        devnet
      </span>
      <span>slot:{blockHeight.toLocaleString()}</span>
      <span>{time} UTC</span>
    </div>
  );
}

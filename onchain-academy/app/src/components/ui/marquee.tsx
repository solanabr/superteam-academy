"use client";

import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  speed?: number;
  className?: string;
};

export function Marquee({ children, speed = 30, className = "" }: Props) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      <div
        className="flex gap-8 whitespace-nowrap"
        style={{
          animation: `marquee ${speed}s linear infinite`,
        }}
      >
        {children}
        {children}
      </div>
    </div>
  );
}

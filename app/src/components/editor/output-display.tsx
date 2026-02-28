"use client";

export interface OutputDisplayProps {
  output: string;
  placeholder?: string;
}

export function OutputDisplay({
  output,
  placeholder = "Run your code to see output here.",
}: OutputDisplayProps) {
  return (
    <pre className="font-mono text-xs leading-relaxed text-[#ccc]">
      {output || placeholder}
    </pre>
  );
}

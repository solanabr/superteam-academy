"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

const variantStyles: Record<string, string> = {
  milestone:
    "bg-primary text-primary-foreground font-bold text-sm px-5 py-2.5 min-w-[200px] shadow-md",
  topic:
    "bg-card text-card-foreground font-medium text-sm px-4 py-2 min-w-[160px] border border-border",
  subtopic:
    "bg-secondary text-secondary-foreground text-xs px-3 py-1.5 min-w-[130px] border border-border/50",
};

const handleClass = "!bg-transparent !border-0 !w-2 !h-2 !min-h-0";

export function RoadmapNode({ data, selected }: NodeProps) {
  const { label, variant } = data as { label: string; variant: string };
  const selectedRing = selected
    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
    : "";

  return (
    <div
      className={`rounded-lg text-center cursor-pointer transition-shadow ${variantStyles[variant]} ${selectedRing}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className={handleClass}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className={handleClass}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        className={handleClass}
      />
      {label}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className={handleClass}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="s-left"
        className={handleClass}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="s-right"
        className={handleClass}
      />
    </div>
  );
}

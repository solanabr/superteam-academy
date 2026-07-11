"use client";

import dynamic from "next/dynamic";
import type { ProgramExplorerBlockData } from "@superteam-lms/types";
import type { BlockRenderProps } from "./types";

const GenericProgramExplorer = dynamic(
  () =>
    import("@/components/deploy/generic-program-explorer").then((mod) => ({
      default: mod.GenericProgramExplorer,
    })),
  { ssr: false }
);

export function ProgramExplorerBlock({ block, ctx }: BlockRenderProps) {
  const b = block as ProgramExplorerBlockData;
  if (!b.idl) return null;
  return (
    <GenericProgramExplorer
      idlJson={b.idl}
      courseSlug={ctx.courseSlug}
      courseId={ctx.courseId}
    />
  );
}

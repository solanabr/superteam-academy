"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import type { EditorLanguage } from "@/components/Playground/Editor";

const PlaygroundClient = dynamic(() => import("./PlaygroundClient"), {
  ssr: false,
});

type DeferredPlaygroundProps = {
  courseId: string;
  lessonIndex: number;
  lessonCount: number;
  starterCode: string;
  testCode: string;
  language?: EditorLanguage;
  fileName?: string;
};

export default function DeferredPlayground(props: DeferredPlaygroundProps) {
  const t = useTranslations("LessonPlayground");
  const [loaded, setLoaded] = useState(false);

  if (!loaded) {
    return (
      <div
        className="mb-4 rounded-xl p-4 sm:p-5"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <h3
          className="text-base font-semibold mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          {t("deferred.title")}
        </h3>
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
          {t("deferred.description")}
        </p>
        <button
          type="button"
          onClick={() => setLoaded(true)}
          className="inline-flex items-center min-h-[40px] rounded-lg px-4 text-sm font-medium"
          style={{
            background: "var(--solana-purple)",
            color: "#fff",
          }}
        >
          {t("deferred.loadButton")}
        </button>
      </div>
    );
  }

  return <PlaygroundClient {...props} />;
}


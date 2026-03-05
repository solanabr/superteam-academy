import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CodeIcon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";

interface LessonConsoleProps {
  bottomPanelHeight: number;
  testResults: { passed: boolean; message: string }[];
  consoleOutput: string[];
  allPassed: boolean;
  t: (key: string) => string;
}

export function LessonConsole({
  bottomPanelHeight,
  testResults,
  consoleOutput,
  allPassed,
  t,
}: LessonConsoleProps) {
  return (
    <div className="border-t border-border/50 bg-card/50 flex flex-col overflow-hidden" style={{ height: bottomPanelHeight }}>
      <div className="flex items-center justify-between border-b border-border/50 px-4 h-10 bg-muted/20">
        <div className="flex items-center gap-2 text-xs font-medium">
          <HugeiconsIcon icon={CodeIcon} size={12} />
          {t("console")}
          {testResults.length > 0 && (
            <span className={allPassed ? "text-green-500" : "text-red-500"}>
              {testResults.filter(r => r.passed).length}/{testResults.length}
            </span>
          )}
        </div>
        {allPassed && (
          <span className="text-xs text-green-500 flex items-center gap-1">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} />
            {t("allTestsPassed")}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-auto p-3 font-mono text-sm">
        {consoleOutput.length > 0 ? (
          consoleOutput.map((line, i) => (
            <div key={i} className={line.startsWith("✓") ? "text-green-500" : line.startsWith("✗") ? "text-red-500" : line.startsWith(">") ? "text-muted-foreground" : line.startsWith("---") ? "text-muted-foreground border-t border-border mt-2 pt-2" : "text-foreground"}>
              {line}
            </div>
          ))
        ) : (
          <div className="text-muted-foreground">{t("output")}: {t("runCode")}</div>
        )}
      </div>
    </div>
  );
}

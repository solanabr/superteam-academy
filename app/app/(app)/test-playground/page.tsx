"use client";

import { useState } from "react";
import { CodeEditor } from "@/components/app";

const DEFAULT_CODE = "// Test starter code\nconsole.log('Hello Solana!');";

export default function TestPlaygroundPage() {
  const [code, setCode] = useState(DEFAULT_CODE);

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b border-border bg-muted/30 px-4 py-2">
        <h1 className="text-lg font-semibold">Code Editor</h1>
        <p className="text-sm text-muted-foreground">
          In-app code editor (iframe). Edit code here.
        </p>
      </div>
      <div className="flex-1 overflow-hidden min-h-0">
        <CodeEditor
          value={code}
          onChange={setCode}
          language="typescript"
          height="100%"
          className="h-full"
        />
      </div>
    </div>
  );
}

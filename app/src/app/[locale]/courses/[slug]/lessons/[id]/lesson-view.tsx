'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { createStubLearningProgressService } from '@/lib/stub-learning-progress';
import { Check, Lightbulb } from 'lucide-react';

const SAMPLE_CONTENT = `
## What you'll learn

This lesson introduces the key concepts you need for the rest of the course.

- **Concept one** — explanation
- **Concept two** — with code examples below
- **Concept three** — try the challenge on the right when you're ready

### Code example

\`\`\`typescript
const greeting = "Hello, Solana!";
console.log(greeting);
\`\`\`

Complete the challenge on the right to mark this lesson complete and earn XP.
`;

export function LessonView({
  courseSlug,
  lessonIndex,
}: {
  courseSlug: string;
  lessonIndex: number;
}) {
  const { publicKey } = useWallet();
  const [completed, setCompleted] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);

  async function handleMarkComplete() {
    const userId = publicKey?.toBase58();
    if (userId) {
      const svc = createStubLearningProgressService();
      await svc.completeLesson(userId, courseSlug, lessonIndex);
    }
    setCompleted(true);
  }

  return (
    <div className="grid h-full grid-cols-1 gap-0 lg:grid-cols-2">
      {/* Left: content */}
      <div className="flex flex-col overflow-hidden border-r border-border lg:max-w-[50%]">
        <div className="flex-1 overflow-y-auto p-6">
          <h1 className="text-xl font-bold">Lesson {lessonIndex + 1}</h1>
          <div className="prose prose-invert mt-4 max-w-none text-sm">
            <pre className="whitespace-pre-wrap font-sans text-foreground">{SAMPLE_CONTENT.trim()}</pre>
          </div>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setHintOpen((o) => !o)}
              className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <Lightbulb className="h-4 w-4" />
              {hintOpen ? 'Hide hint' : 'Show hint'}
            </button>
            {hintOpen && (
              <p className="mt-2 rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                Hint: use the starter code and replace the comment with your implementation.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right: challenge */}
      <div className="flex flex-col overflow-hidden bg-muted/20">
        <div className="shrink-0 border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Code challenge</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Write a function that returns the sum of two numbers. Run tests to check your solution.
          </p>
        </div>
        <div className="min-h-0 flex-1 p-4">
          <textarea
            className="h-full min-h-[200px] w-full rounded-xl border border-input bg-background p-4 font-mono text-sm outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            placeholder="// Your code here"
            defaultValue={`fn sum(a: u64, b: u64) -> u64 {\n    // Your code here\n}`}
            spellCheck={false}
          />
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3 border-t border-border bg-background/50 px-4 py-3">
          <Button size="sm" variant="outline" className="rounded-lg">
            Run tests
          </Button>
          <Button
            size="sm"
            className="gap-2 rounded-lg"
            onClick={handleMarkComplete}
            disabled={completed}
          >
            {completed ? (
              <>
                <Check className="h-4 w-4" />
                Completed
              </>
            ) : (
              'Mark complete'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { COURSES } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CodeEditor } from "@/components/course/code-editor";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Code,
  HelpCircle,
  Swords,
  Zap,
} from "lucide-react";

const SAMPLE_CODE = `use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = 0;
        counter.authority = ctx.accounts.authority.key();
        counter.bump = ctx.bumps.counter;
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = counter.count.checked_add(1)
            .ok_or(ErrorCode::Overflow)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Counter::INIT_SPACE,
        seeds = [b"counter", authority.key().as_ref()],
        bump,
    )]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(
        mut,
        seeds = [b"counter", authority.key().as_ref()],
        bump = counter.bump,
        has_one = authority,
    )]
    pub counter: Account<'info, Counter>,
    pub authority: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Counter {
    pub count: u64,
    pub authority: Pubkey,
    pub bump: u8,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Counter overflow")]
    Overflow,
}`;

const LESSON_CONTENT: Record<string, string> = {
  reading: `
## What is Anchor?

Anchor is a framework for Solana's Sealevel runtime providing several convenient developer tools for writing smart programs (called "programs" on Solana).

### Key Benefits

- **Account Validation**: Anchor automatically validates accounts using constraints defined in your program structs, eliminating an entire class of security vulnerabilities.

- **Serialization**: Borsh serialization/deserialization is handled automatically for all account data, reducing boilerplate.

- **IDL Generation**: Anchor generates an Interface Description Language (IDL) file that client libraries can use to interact with your program.

- **Testing**: Built-in testing framework with TypeScript support.

### Why Anchor for Superteam Academy?

Our on-chain program uses Anchor 0.31+ with Token-2022 extensions for soulbound XP tokens. The framework's constraint system makes it easy to enforce:

- PDA derivation with seeds and bumps
- Authority checks via \`has_one\`
- Account initialization with \`init\`
- Account closing with \`close\`

In the next lesson, we'll set up your development environment and write your first Anchor program.
  `,
  code: `
## PDA Challenge: Counter Program

Your task: Create a counter program using Anchor that stores state in a PDA.

### Requirements

1. The counter PDA should be derived from \`["counter", authority]\`
2. \`initialize\` creates the counter with count = 0
3. \`increment\` adds 1 to the counter (with overflow check)
4. Only the authority can increment their own counter

### Instructions

Edit the code below and click **Run** to test your solution.
  `,
  challenge: `
## Final Project: Todo App

Build a complete on-chain Todo application with CRUD operations.

### Requirements

1. Create a \`TodoList\` PDA per user (max 10 items)
2. Each todo has: text (max 100 chars), completed (bool), created_at (i64)
3. Implement: \`create_todo\`, \`toggle_todo\`, \`delete_todo\`
4. All operations must validate the authority

### Bonus Points
- Add a \`clear_completed\` instruction
- Emit events for each operation
  `,
};

const TYPE_ICONS = {
  reading: BookOpen,
  code: Code,
  challenge: Swords,
  quiz: HelpCircle,
};

export default function LessonPage() {
  const params = useParams();
  const slug = params.slug as string;
  const lessonIndex = parseInt(params.index as string, 10);

  const course = COURSES.find((c) => c.slug === slug);
  if (!course) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold">Course not found</h1>
        <Link href="/courses">
          <Button className="mt-4">Back to Courses</Button>
        </Link>
      </div>
    );
  }

  const lesson = course.lessons[lessonIndex];
  if (!lesson) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold">Lesson not found</h1>
        <Link href={`/course/${slug}`}>
          <Button className="mt-4">Back to Course</Button>
        </Link>
      </div>
    );
  }

  const prevLesson = lessonIndex > 0 ? course.lessons[lessonIndex - 1] : null;
  const nextLesson =
    lessonIndex < course.lessons.length - 1
      ? course.lessons[lessonIndex + 1]
      : null;
  const TypeIcon = TYPE_ICONS[lesson.type];
  const overallProgress = Math.round(
    ((lessonIndex + 1) / course.lessonCount) * 100
  );

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <div className="border-b glass sticky top-16 z-40">
        <div className="container flex items-center justify-between h-12">
          <div className="flex items-center gap-3">
            <Link
              href={`/course/${slug}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {course.title}
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                {lessonIndex + 1}/{course.lessonCount}
              </span>
              <Progress value={overallProgress} className="h-1.5 w-24" />
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Lesson Header */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Badge variant="outline" className="flex items-center gap-1">
                <TypeIcon className="h-3 w-3" />
                {lesson.type.charAt(0).toUpperCase() + lesson.type.slice(1)}
              </Badge>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                ~{lesson.estimatedMinutes} min
              </span>
              <span className="flex items-center gap-1 text-xs text-solana-green font-medium">
                <Zap className="h-3 w-3" />
                +{lesson.xpReward} XP
              </span>
            </div>
            <h1 className="text-2xl font-bold">{lesson.title}</h1>
            <p className="text-muted-foreground mt-2">{lesson.description}</p>
          </div>

          {/* Content */}
          <Card>
            <CardContent className="pt-6 prose prose-invert prose-sm max-w-none">
              <div
                className="text-sm leading-relaxed space-y-4"
                dangerouslySetInnerHTML={{
                  __html: (
                    LESSON_CONTENT[lesson.type] || LESSON_CONTENT.reading
                  )
                    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
                    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
                    .replace(
                      /`([^`]+)`/g,
                      '<code class="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">$1</code>'
                    )
                    .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc text-muted-foreground">$1</li>')
                    .replace(
                      /\*\*(.*?)\*\*/g,
                      '<strong class="text-foreground">$1</strong>'
                    )
                    .replace(/\n\n/g, "</p><p>")
                    .replace(/\n/g, "<br/>"),
                }}
              />
            </CardContent>
          </Card>

          {/* Code Editor (for code/challenge lessons) */}
          {(lesson.type === "code" || lesson.type === "challenge") && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Code className="h-5 w-5 text-solana-green" />
                Code Editor
              </h2>
              <CodeEditor initialCode={SAMPLE_CODE} language="rust" />
            </div>
          )}

          {/* Completion */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-medium">Complete this lesson</p>
                  <p className="text-sm text-muted-foreground">
                    Earn {lesson.xpReward} XP and continue to the next lesson
                  </p>
                </div>
              </div>
              <Button variant="solana">
                Mark Complete
                <Zap className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            {prevLesson ? (
              <Link href={`/course/${slug}/lesson/${lessonIndex - 1}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {prevLesson.title}
                </Button>
              </Link>
            ) : (
              <div />
            )}
            {nextLesson ? (
              <Link href={`/course/${slug}/lesson/${lessonIndex + 1}`}>
                <Button variant="ghost" size="sm">
                  {nextLesson.title}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href={`/course/${slug}`}>
                <Button variant="solana" size="sm">
                  Finish Course
                  <CheckCircle2 className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

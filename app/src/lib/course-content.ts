// app/src/lib/course-content.ts

export interface LessonContent {
  id: string; // Уникальный ID урока (например, "lesson-1")
  title: string;
  markdown: string;
  initialCode: string;
}

export interface CourseContent {
  id: string;
  title: string;
  lessons: LessonContent[];
}

// Наша "База данных" контента
export const COURSE_CONTENT: Record<string, CourseContent> = {
  "solana-mock-test": {
    id: "solana-mock-test",
    title: "Intro to Anchor",
    lessons: [
      {
        id: "lesson-0", // Соответствует индексу 0
        title: "Hello World",
        markdown: `
# Welcome to Solana!

In this lesson, we will write our first "Hello World" program in Rust using the Anchor framework.

## Your Task

Complete the \`initialize\` function to print "Hello World" to the program logs using the \`msg!\` macro.

### Hints
- Rust uses macros for printing.
- Look for \`msg!("String")\`.
        `,
        initialCode: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod hello_anchor {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        // TODO: Print "Hello World" using msg! macro
        
        Ok(())
    }

    #[derive(Accounts)]
    pub struct Initialize {}
}
`
      },
      {
        id: "lesson-1", // Соответствует индексу 1
        title: "Accounts & Context",
        markdown: `
# Accounts in Anchor

Everything in Solana is an Account. In this lesson...
        `,
        initialCode: `// Lesson 2 placeholder code...`
      }
    ]
  }
};

export function getLessonContent(courseId: string, lessonIndex: number) {
  const course = COURSE_CONTENT[courseId];
  if (!course) return null;
  return course.lessons[lessonIndex] || null;
}
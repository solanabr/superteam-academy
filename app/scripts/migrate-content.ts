// app/scripts/migrate-content.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// КОПИРУЕМ ДАННЫЕ СЮДА, ЧТОБЫ ИЗБЕЖАТЬ ОШИБОК ИМПОРТА
const COURSE_CONTENT = {
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
      },
      {
        id: "lesson-2",
        title: "PDAs (Program Derived Addresses)",
        markdown: "# Understanding PDAs\n\nPDAs allow programs to sign for accounts...",
        initialCode: "// Write a PDA derivation..."
      },
      {
        id: "lesson-3",
        title: "CPI (Cross-Program Invocations)",
        markdown: "# Calling other programs\n\nLearn how to call the Token Program...",
        initialCode: "// CPI call..."
      },
      {
        id: "lesson-4",
        title: "Errors & Events",
        markdown: "# Handling Errors\n\nDefine custom errors and emit events...",
        initialCode: "// Custom error..."
      }
    ]
}

async function main() {
    console.log("🚀 Migrating course content to database...");

    const content = COURSE_CONTENT;

    try {
        // 1. Создаем курс
        const course = await prisma.course.upsert({
            where: { slug: content.id },
            update: {}, // Если уже есть, не трогаем
            create: {
                slug: content.id,
                title: content.title,
                description: "Master the basics of Solana development. Build real dApps, earn XP, and get certified on-chain.",
                difficulty: "Beginner",
                xpPerLesson: 50,
                isPublished: true,
                imageUrl: "https://arweave.net/Yx0n2TqR0GqNeJnoYx4SMCjZt0r9uS-KRwQoK_vG2Wc" 
            }
        });

        console.log(`✅ Course created/found: ${course.id}`);

        // 2. Создаем один модуль
        let module = await prisma.courseModule.findFirst({
            where: { courseId: course.id, title: "Module 1: Fundamentals" }
        });

        if (!module) {
            module = await prisma.courseModule.create({
                data: {
                    courseId: course.id,
                    title: "Module 1: Fundamentals",
                    order: 0
                }
            });
            console.log(`✅ Module created.`);
        }

        // 3. Создаем уроки
        for (let i = 0; i < content.lessons.length; i++) {
            const lessonData = content.lessons[i];
            
            let lesson = await prisma.lesson.findFirst({
                where: { moduleId: module.id, order: i }
            });

            if (!lesson) {
                await prisma.lesson.create({
                    data: {
                        moduleId: module.id,
                        title: lessonData.title,
                        content: lessonData.markdown,
                        initialCode: lessonData.initialCode,
                        order: i,
                        isChallenge: true
                    }
                });
                console.log(`   + Lesson ${i} migrated.`);
            } else {
                console.log(`   - Lesson ${i} already exists.`);
            }
        }

        console.log("\n🎉 Migration completed successfully!");

    } catch (error) {
        console.error("❌ Migration failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
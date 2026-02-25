import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const achievements = [
    {
      slug: "first-steps",
      name: "First Steps",
      description: "Complete your first lesson.",
      image: "https://arweave.net/achievement_1_img", 
      xpReward: 50
    },
    {
      slug: "course-champion",
      name: "Course Champion",
      description: "Complete a full course.",
      image: "https://arweave.net/achievement_2_img",
      xpReward: 200
    }
  ]

  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { slug: ach.slug },
      update: {},
      create: ach
    })
  }
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
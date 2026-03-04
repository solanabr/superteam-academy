import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const achievements = [
    {
      slug: "first-steps",
      name: "First Steps",
      description: "Complete your first lesson.",
      image: "/images/achievements/first-steps.png",
      xpReward: 50
    },
    {
      slug: "course-completer",
      name: "Course Completer",
      description: "Complete a full course.",
      image: "/images/achievements/course-completer.png",
      xpReward: 200
    },
    {
      slug: "speed-runner",
      name: "Speed Runner",
      description: "Complete 5 lessons in one day.",
      image: "/images/achievements/speed-runner.png",
      xpReward: 100
    },
    {
      slug: "week-warrior",
      name: "Week Warrior",
      description: "7 day streak.",
      image: "/images/achievements/week-warrior.png",
      xpReward: 150
    },
    {
      slug: "monthly-master",
      name: "Monthly Master",
      description: "30 day streak.",
      image: "/images/achievements/monthly-master.png",
      xpReward: 500
    },
    {
      slug: "consistency-king",
      name: "Consistency King",
      description: "100 day streak.",
      image: "/images/achievements/consistency-king.png",
      xpReward: 2000
    },
    {
      slug: "rust-rookie",
      name: "Rust Rookie",
      description: "Complete Rust module.",
      image: "/images/achievements/rust-rookie.png",
      xpReward: 100
    },
    {
      slug: "anchor-expert",
      name: "Anchor Expert",
      description: "Complete Anchor advanced course.",
      image: "/images/achievements/anchor-expert.png",
      xpReward: 300
    },
    {
      slug: "full-stack-solana",
      name: "Full Stack Solana",
      description: "Complete frontend & backend courses.",
      image: "/images/achievements/full-stack-solana.png",
      xpReward: 500
    },
    {
      slug: "helper",
      name: "Helper",
      description: "Helped others in Discord.",
      image: "/images/achievements/helper.png",
      xpReward: 100
    },
    {
      slug: "early-adopter",
      name: "Early Adopter",
      description: "Joined during beta.",
      image: "/images/achievements/early-adopter.png",
      xpReward: 50
    }
  ];

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
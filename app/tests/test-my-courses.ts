import { PrismaClient } from '@prisma/client'
import { createClient } from 'next-sanity'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

async function run() {
  const wallet = "HqenDH8hJid7fkTGXQLZrLkaCBGh85V78c9GCma7pW41"
  const user = await prisma.user.findUnique({
    where: { walletAddress: wallet },
    select: { id: true, role: true },
  });
  console.log("User:", user)

  const courses = await serverClient.fetch(
    `*[_type == "course" && createdBy.userId == $userId] | order(_createdAt desc) {
        _id,
        title,
        "slug": slug.current,
        description,
        instructor,
        duration,
        difficulty,
        track,
        published,
        _createdAt,
        _updatedAt
      }`,
    { userId: user?.id }
  );
  console.log("Courses length:", courses.length)
  console.log(JSON.stringify(courses, null, 2))
}

run()

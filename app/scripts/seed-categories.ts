
import { db } from "@/drizzle/db"
import { CategoryTable } from "@/drizzle/schema"

async function seedCategories() {
  console.log("Seeding categories...")
  
  try {
    await db.insert(CategoryTable).values([
      {
        name: "Process Engineering",
        slug: "process-engineering",
        description: "Courses on process engineering fundamentals and applications",
      },
      {
        name: "Project Management Consultancy",
        slug: "project-management",
        description: "Project management and consultancy courses",
      },
      {
        name: "Commissioning and Precommissioning",
        slug: "commissioning",
        description: "Commissioning and precommissioning procedures",
      },
      {
        name: "Plant Drafting and 3D Modeling",
        slug: "plant-drafting",
        description: "CAD and 3D modeling for plant design",
      },
      {
        name: "Mechanical Engineering",
        slug: "mechanical-engineering",
        description: "Mechanical engineering principles and applications",
      },
      {
        name: "Petroleum and Gas Engineering",
        slug: "petroleum-gas",
        description: "Oil and gas engineering courses",
      },
      {
        name: "Hazop/Hazid",
        slug: "hazop-hazid",
        description: "Hazard and operability studies",
      },
      {
        name: "Petrochemical Engineering",
        slug: "petrochemical",
        description: "Petrochemical processes and engineering",
      },
      {
        name: "Process Control/Automation/Instrumentation",
        slug: "process-control",
        description: "Process control, automation, and instrumentation systems",
      },
    ])
    
    console.log("✅ Categories seeded successfully!")
  } catch (error) {
    console.error("❌ Error seeding categories:", error)
  } finally {
    process.exit(0)
  }
}

seedCategories()

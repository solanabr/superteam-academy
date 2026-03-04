// import { env } from "@/data/env/server"
// import { defineConfig } from "drizzle-kit"



// export default defineConfig({
//     out: "./src/drizzle/migrations",
//     schema: "./src/drizzle/schema.ts",
//     strict: true,
//     verbose: true,
//     dialect: "postgresql",
//     dbCredentials: {
//         url: env.DATABASE_URL,
//     }
// })

import { config } from "dotenv";
config({ path: ".env.local" }); 

import { env } from "@/data/env/server"
import { defineConfig } from "drizzle-kit"

export default defineConfig({
    out: "./src/drizzle/migrations",
    schema: "./src/drizzle/schema.ts",
    strict: true,
    verbose: true,
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!, 
    }
})
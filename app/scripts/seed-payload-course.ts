/**
 * Seed a demo course via Payload Local API.
 * Run with: pnpm db:seed-payload
 */
import { getPayload } from "../src/lib/payload";

async function main() {
  const payload = await getPayload();

  // Check if already seeded
  const existing = await payload.find({
    collection: "courses",
    where: { slug: { equals: "building-on-solana-hands-on" } },
    limit: 1,
  });

  if (existing.docs.length > 0) {
    console.log("Demo course already exists, skipping seed.");
    process.exit(0);
  }

  const course = await payload.create({
    collection: "courses",
    data: {
      title: "Building on Solana — Hands-On Guide",
      slug: "building-on-solana-hands-on",
      description:
        "A practical, hands-on introduction to building programs and clients on Solana. You will write your first Anchor program, mint tokens, and interact with the chain from TypeScript.",
      difficulty: "intermediate",
      duration: "6 hours",
      xpTotal: 750,
      trackId: 1,
      trackLevel: 2,
      trackName: "Solana Development",
      creator: "Superteam Academy",
      isActive: true,
      tags: [{ tag: "solana" }, { tag: "anchor" }, { tag: "typescript" }, { tag: "rust" }],
      prerequisites: [{ slug: "solana-fundamentals" }],
      modules: [
        {
          title: "Solana Fundamentals",
          description: "Understand the core Solana programming model before writing any code.",
          order: 0,
          lessons: [
            {
              title: "Accounts and the Account Model",
              description: "How Solana stores state and why it differs from EVM chains.",
              type: "content",
              order: 0,
              xpReward: 50,
              duration: "20 min",
              content: {
                root: {
                  type: "root",
                  children: [
                    {
                      type: "heading",
                      tag: "h1",
                      children: [{ type: "text", text: "The Solana Account Model" }],
                    },
                    {
                      type: "paragraph",
                      children: [
                        {
                          type: "text",
                          text: "Everything on Solana lives in an account. An account is a fixed-size chunk of data stored on the network and owned by a program.",
                        },
                      ],
                    },
                    {
                      type: "heading",
                      tag: "h2",
                      children: [{ type: "text", text: "Key Properties" }],
                    },
                    {
                      type: "paragraph",
                      children: [
                        { type: "text", text: "Every account has:" },
                      ],
                    },
                    {
                      type: "list",
                      listType: "bullet",
                      children: [
                        {
                          type: "listitem",
                          children: [
                            { type: "text", text: "lamports", format: "bold" },
                            { type: "text", text: " — the SOL balance (1 SOL = 10^9 lamports)" },
                          ],
                        },
                        {
                          type: "listitem",
                          children: [
                            { type: "text", text: "data", format: "bold" },
                            { type: "text", text: " — arbitrary bytes (program state, token info, NFT metadata…)" },
                          ],
                        },
                        {
                          type: "listitem",
                          children: [
                            { type: "text", text: "owner", format: "bold" },
                            { type: "text", text: " — the program ID that controls this account" },
                          ],
                        },
                        {
                          type: "listitem",
                          children: [
                            { type: "text", text: "executable", format: "bold" },
                            { type: "text", text: " — whether this account IS a program" },
                          ],
                        },
                      ],
                    },
                    {
                      type: "code",
                      language: "typescript",
                      children: [
                        {
                          type: "text",
                          text: 'import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";\n\nconst connection = new Connection(clusterApiUrl("devnet"));\nconst pubkey = new PublicKey("11111111111111111111111111111111");\n\nconst accountInfo = await connection.getAccountInfo(pubkey);\nconsole.log("lamports:", accountInfo?.lamports);\nconsole.log("owner:   ", accountInfo?.owner.toBase58());\nconsole.log("data len:", accountInfo?.data.length);',
                        },
                      ],
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  version: 1,
                },
              },
            },
            {
              title: "Programs and Instructions",
              description: "What Solana programs are and how transactions invoke them.",
              type: "content",
              order: 1,
              xpReward: 50,
              duration: "25 min",
              content: {
                root: {
                  type: "root",
                  children: [
                    {
                      type: "heading",
                      tag: "h1",
                      children: [{ type: "text", text: "Programs and Instructions" }],
                    },
                    {
                      type: "paragraph",
                      children: [
                        {
                          type: "text",
                          text: "A Solana program is a stateless executable account. It processes instructions sent to it via transactions.",
                        },
                      ],
                    },
                    {
                      type: "code",
                      language: "rust",
                      children: [
                        {
                          type: "text",
                          text: 'use anchor_lang::prelude::*;\n\ndeclare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");\n\n#[program]\npub mod hello_solana {\n    use super::*;\n    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n        msg!("Hello from Solana!");\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct Initialize {}',
                        },
                      ],
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  version: 1,
                },
              },
            },
          ],
        },
        {
          title: "Writing Programs with Anchor",
          description: "Use the Anchor framework to write, test, and deploy your first Solana program.",
          order: 1,
          lessons: [
            {
              title: "Your First Anchor Program",
              description: "Scaffold and build a simple counter program using Anchor.",
              type: "content",
              order: 0,
              xpReward: 100,
              duration: "30 min",
              content: {
                root: {
                  type: "root",
                  children: [
                    {
                      type: "heading",
                      tag: "h1",
                      children: [{ type: "text", text: "Building a Counter with Anchor" }],
                    },
                    {
                      type: "paragraph",
                      children: [
                        {
                          type: "text",
                          text: "Anchor is the most popular Solana framework. It provides a Rust eDSL, IDL generation, and a TypeScript client — all from one project.",
                        },
                      ],
                    },
                    {
                      type: "code",
                      language: "rust",
                      children: [
                        {
                          type: "text",
                          text: 'use anchor_lang::prelude::*;\n\ndeclare_id!("COUNT111111111111111111111111111111111111111");\n\n#[program]\npub mod counter {\n    use super::*;\n    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n        ctx.accounts.counter.count = 0;\n        Ok(())\n    }\n    pub fn increment(ctx: Context<Increment>) -> Result<()> {\n        ctx.accounts.counter.count = ctx.accounts.counter.count\n            .checked_add(1)\n            .ok_or(ErrorCode::Overflow)?;\n        Ok(())\n    }\n}\n\n#[account]\npub struct Counter {\n    pub count: u64,\n}\n\n#[derive(Accounts)]\npub struct Initialize<\'info> {\n    #[account(init, payer = payer, space = 8 + 8)]\n    pub counter: Account<\'info, Counter>,\n    #[account(mut)]\n    pub payer: Signer<\'info>,\n    pub system_program: Program<\'info, System>,\n}\n\n#[derive(Accounts)]\npub struct Increment<\'info> {\n    #[account(mut)]\n    pub counter: Account<\'info, Counter>,\n}\n\n#[error_code]\npub enum ErrorCode {\n    Overflow,\n}',
                        },
                      ],
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  version: 1,
                },
              },
            },
            {
              title: "Implement the Increment Instruction",
              description:
                "Add an increment instruction to the counter program and write a TypeScript test for it.",
              type: "challenge",
              order: 1,
              xpReward: 200,
              duration: "45 min",
              challenge: {
                prompt: {
                  root: {
                    type: "root",
                    children: [
                      {
                        type: "heading",
                        tag: "h2",
                        children: [{ type: "text", text: "Challenge: Increment Counter" }],
                      },
                      {
                        type: "paragraph",
                        children: [
                          {
                            type: "text",
                            text: "Using the Anchor TypeScript client, call the ",
                          },
                          { type: "text", text: "increment", format: "code" },
                          {
                            type: "text",
                            text: " instruction on the counter account and assert the count increases by 1.",
                          },
                        ],
                      },
                    ],
                    direction: "ltr",
                    format: "",
                    indent: 0,
                    version: 1,
                  },
                },
                starterCode:
                  'import * as anchor from "@coral-xyz/anchor";\nimport { Program } from "@coral-xyz/anchor";\nimport { Counter } from "../target/types/counter";\nimport { assert } from "chai";\n\ndescribe("counter", () => {\n  const provider = anchor.AnchorProvider.env();\n  anchor.setProvider(provider);\n  const program = anchor.workspace.Counter as Program<Counter>;\n\n  it("increments the counter", async () => {\n    const counterKp = anchor.web3.Keypair.generate();\n\n    // TODO: initialize the counter account\n    // TODO: call increment\n    // TODO: fetch the account and assert count === 1\n  });\n});',
                language: "typescript",
                hints: [
                  {
                    hint: "Use `program.methods.initialize().accounts({ counter: counterKp.publicKey, payer: provider.wallet.publicKey, systemProgram: anchor.web3.SystemProgram.programId }).signers([counterKp]).rpc()` to initialize.",
                  },
                  {
                    hint: "Then call `program.methods.increment().accounts({ counter: counterKp.publicKey }).rpc()`.",
                  },
                  {
                    hint: "Fetch with `program.account.counter.fetch(counterKp.publicKey)` and check `.count.toNumber() === 1`.",
                  },
                ],
                solution:
                  'import * as anchor from "@coral-xyz/anchor";\nimport { Program } from "@coral-xyz/anchor";\nimport { Counter } from "../target/types/counter";\nimport { assert } from "chai";\n\ndescribe("counter", () => {\n  const provider = anchor.AnchorProvider.env();\n  anchor.setProvider(provider);\n  const program = anchor.workspace.Counter as Program<Counter>;\n\n  it("increments the counter", async () => {\n    const counterKp = anchor.web3.Keypair.generate();\n\n    await program.methods\n      .initialize()\n      .accounts({\n        counter: counterKp.publicKey,\n        payer: provider.wallet.publicKey,\n        systemProgram: anchor.web3.SystemProgram.programId,\n      })\n      .signers([counterKp])\n      .rpc();\n\n    await program.methods\n      .increment()\n      .accounts({ counter: counterKp.publicKey })\n      .rpc();\n\n    const account = await program.account.counter.fetch(counterKp.publicKey);\n    assert.equal(account.count.toNumber(), 1);\n  });\n});',
                testCases: [
                  {
                    name: "Counter increments to 1",
                    input: "initial count = 0",
                    expectedOutput: "count === 1",
                  },
                ],
              },
            },
          ],
        },
      ],
      _status: "published",
    },
  });

  console.log(`✓ Created course: "${course.title}" (id: ${course.id})`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

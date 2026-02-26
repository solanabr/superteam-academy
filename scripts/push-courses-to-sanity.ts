/**
 * Push all courses from mock data to Sanity CMS.
 *
 * Usage:
 *   cd app && npx tsx ../scripts/push-courses-to-sanity.ts
 *
 * Requires SANITY_API_TOKEN in app/.env.local
 */

import { createClient } from "@sanity/client";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../app/.env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2026-02-19",
  token: process.env.SANITY_API_TOKEN!,
  useCdn: false,
});

interface MockLesson {
  id: string;
  title: string;
  description: string;
  type: "content" | "challenge";
  order: number;
  xp: number;
  duration?: string;
  content?: string;
  challenge?: {
    prompt: string;
    objectives: string[];
    starterCode: string;
    language: string;
    solution?: string;
    hints?: string[];
    testCases?: {
      id: string;
      name: string;
      input?: string;
      expectedOutput: string;
      hidden?: boolean;
    }[];
  };
}

interface MockModule {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: MockLesson[];
}

interface MockCourse {
  id: string;
  courseId: string;
  title: string;
  slug: string;
  description: string;
  difficulty: number;
  lessonCount: number;
  xpPerLesson: number;
  trackId: number;
  trackLevel: number;
  isActive: boolean;
  prerequisite: string | null;
  totalCompletions: number;
  creatorRewardXp: number;
  duration?: string;
  thumbnailUrl?: string;
  creator: string;
  modules: MockModule[];
  whatYouLearn?: string[];
  instructor?: { name: string; bio?: string };
}

// ─── Course definitions ─────────────────────────────────

const COURSES: MockCourse[] = [
  {
    id: "anchor-fundamentals",
    courseId: "anchor-fundamentals",
    title: "Anchor Framework Fundamentals",
    slug: "anchor-fundamentals",
    description:
      "Master the Anchor framework for building Solana programs. Learn account validation, error handling, events, and testing patterns.",
    difficulty: 2,
    lessonCount: 10,
    xpPerLesson: 30,
    trackId: 1,
    trackLevel: 2,
    isActive: true,
    prerequisite: null,
    totalCompletions: 187,
    creatorRewardXp: 300,
    duration: "5 hours",
    creator: "Superteam Academy",
    modules: [
      {
        id: "anc-mod-1",
        title: "Getting Started with Anchor",
        description: "Setup, project structure, and your first program",
        order: 0,
        lessons: [
          {
            id: "anc-1-1",
            title: "Setting Up Anchor",
            description: "Install Anchor CLI and create your first project",
            type: "content",
            order: 0,
            xp: 30,
            duration: "15 min",
            content:
              "<h2>Anchor Setup</h2><p>Anchor is the most popular framework for building Solana programs. It provides account validation macros, IDL generation, and a TypeScript client.</p><h3>Installation</h3><pre><code>cargo install --git https://github.com/coral-xyz/anchor avm --force\navm install latest\navm use latest\n\n# Verify\nanchor --version</code></pre><h3>New Project</h3><pre><code>anchor init my-program\ncd my-program\nanchor build\nanchor test</code></pre>",
          },
          {
            id: "anc-1-2",
            title: "Account Validation",
            description: "Using #[derive(Accounts)] and constraint macros",
            type: "content",
            order: 1,
            xp: 30,
            duration: "25 min",
            content:
              '<h2>Account Validation in Anchor</h2><p>Anchor\'s <code>#[derive(Accounts)]</code> macro generates account validation code at compile time.</p><h3>Common Constraints</h3><pre><code>#[derive(Accounts)]\npub struct Initialize&lt;\'info&gt; {\n    #[account(\n        init,\n        payer = authority,\n        space = 8 + Config::INIT_SPACE,\n        seeds = [b"config"],\n        bump,\n    )]\n    pub config: Account&lt;\'info, Config&gt;,\n\n    #[account(mut)]\n    pub authority: Signer&lt;\'info&gt;,\n\n    pub system_program: Program&lt;\'info, System&gt;,\n}</code></pre><h3>Key Macros</h3><ul><li><code>init</code> — create + allocate account</li><li><code>seeds</code> + <code>bump</code> — PDA validation</li><li><code>has_one</code> — enforce account relationship</li><li><code>constraint</code> — custom boolean checks</li></ul>',
          },
          {
            id: "anc-1-3",
            title: "Error Handling",
            description: "Custom errors with #[error_code]",
            type: "content",
            order: 2,
            xp: 30,
            duration: "15 min",
            content:
              '<h2>Error Handling</h2><p>Anchor provides the <code>#[error_code]</code> macro for defining custom program errors.</p><pre><code>#[error_code]\npub enum AcademyError {\n    #[msg("Course is not active")]\n    CourseNotActive,\n\n    #[msg("Learner already enrolled")]\n    AlreadyEnrolled,\n\n    #[msg("Lesson already completed")]\n    LessonAlreadyCompleted,\n}</code></pre><p>Use <code>require!</code> for clean validation:</p><pre><code>require!(course.is_active, AcademyError::CourseNotActive);\nrequire!(!enrollment.is_completed, AcademyError::AlreadyCompleted);</code></pre>',
          },
          {
            id: "anc-1-4",
            title: "Events & Logging",
            description: "Emitting events for off-chain indexing",
            type: "content",
            order: 3,
            xp: 30,
            duration: "15 min",
            content:
              '<h2>Events in Anchor</h2><p>Events allow off-chain services to react to program state changes.</p><pre><code>#[event]\npub struct LessonCompleted {\n    pub enrollment: Pubkey,\n    pub lesson_index: u8,\n    pub xp_awarded: u64,\n    pub timestamp: i64,\n}</code></pre><p>Emit events in instruction handlers:</p><pre><code>emit!(LessonCompleted {\n    enrollment: ctx.accounts.enrollment.key(),\n    lesson_index,\n    xp_awarded: course.xp_per_lesson,\n    timestamp: Clock::get()?.unix_timestamp,\n});</code></pre>',
          },
          {
            id: "anc-1-5",
            title: "Write a Vault Program",
            description: "Build a SOL vault with deposit and withdraw",
            type: "challenge",
            order: 4,
            xp: 30,
            duration: "30 min",
            challenge: {
              prompt: "Complete the deposit instruction for a SOL vault program.",
              objectives: [
                "Transfer SOL from user to vault PDA",
                "Update the vault balance tracker",
                "Emit a DepositEvent",
              ],
              starterCode:
                'use anchor_lang::prelude::*;\nuse anchor_lang::system_program;\n\n#[program]\nmod vault {\n    use super::*;\n\n    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {\n        // TODO: Transfer SOL to vault\n        // TODO: Update vault.total_deposited\n        // TODO: Emit event\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct Deposit<\'info> {\n    #[account(mut)]\n    pub user: Signer<\'info>,\n    \n    #[account(mut, seeds = [b"vault"], bump)]\n    pub vault: Account<\'info, Vault>,\n    \n    pub system_program: Program<\'info, System>,\n}\n\n#[account]\npub struct Vault {\n    pub total_deposited: u64,\n    pub bump: u8,\n}',
              language: "rust",
              solution:
                'use anchor_lang::prelude::*;\nuse anchor_lang::system_program;\n\n#[program]\nmod vault {\n    use super::*;\n\n    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {\n        system_program::transfer(\n            CpiContext::new(\n                ctx.accounts.system_program.to_account_info(),\n                system_program::Transfer {\n                    from: ctx.accounts.user.to_account_info(),\n                    to: ctx.accounts.vault.to_account_info(),\n                },\n            ),\n            amount,\n        )?;\n\n        let vault = &mut ctx.accounts.vault;\n        vault.total_deposited = vault.total_deposited.checked_add(amount).unwrap();\n\n        emit!(DepositEvent {\n            user: ctx.accounts.user.key(),\n            amount,\n            total: vault.total_deposited,\n        });\n\n        Ok(())\n    }\n}',
              hints: [
                "Use system_program::transfer with CpiContext::new",
                "Always use checked_add for arithmetic safety",
                "Define a DepositEvent with #[event]",
              ],
              testCases: [
                { id: "tc-1", name: "Transfers SOL", expectedOutput: "system_program::transfer", hidden: false },
                { id: "tc-2", name: "Updates balance", expectedOutput: "checked_add", hidden: false },
              ],
            },
          },
        ],
      },
      {
        id: "anc-mod-2",
        title: "Testing & Deployment",
        description: "TypeScript testing and devnet deployment",
        order: 1,
        lessons: [
          {
            id: "anc-2-1",
            title: "TypeScript Test Setup",
            description: "Writing integration tests with Anchor",
            type: "content",
            order: 0,
            xp: 30,
            duration: "20 min",
            content:
              '<h2>Testing with Anchor</h2><p>Anchor generates a TypeScript client from your IDL automatically.</p><pre><code>import * as anchor from "@coral-xyz/anchor";\nimport { Program } from "@coral-xyz/anchor";\nimport { MyProgram } from "../target/types/my_program";\n\ndescribe("my-program", () =&gt; {\n  const provider = anchor.AnchorProvider.env();\n  anchor.setProvider(provider);\n  const program = anchor.workspace.myProgram as Program&lt;MyProgram&gt;;\n\n  it("initializes correctly", async () =&gt; {\n    const tx = await program.methods\n      .initialize()\n      .accounts({ ... })\n      .rpc();\n    console.log("tx:", tx);\n  });\n});</code></pre>',
          },
          {
            id: "anc-2-2",
            title: "Rust Unit Tests",
            description: "Testing with Mollusk and LiteSVM",
            type: "content",
            order: 1,
            xp: 30,
            duration: "20 min",
            content:
              '<h2>Rust Unit Testing</h2><p>Use <strong>Mollusk</strong> for instruction-level testing and <strong>LiteSVM</strong> for full integration tests.</p><h3>Mollusk Example</h3><pre><code>use mollusk_svm::Mollusk;\n\n#[test]\nfn test_initialize() {\n    let mollusk = Mollusk::new(&program_id, "onchain_academy");\n    let result = mollusk.process_instruction(\n        &instruction,\n        &accounts,\n    );\n    assert!(result.is_ok());\n}</code></pre>',
          },
          {
            id: "anc-2-3",
            title: "Devnet Deployment",
            description: "Deploy your program to Solana devnet",
            type: "content",
            order: 2,
            xp: 30,
            duration: "15 min",
            content:
              "<h2>Deploying to Devnet</h2><pre><code># Configure for devnet\nsolana config set --url devnet\n\n# Airdrop SOL for deployment\nsolana airdrop 2\n\n# Build verifiably\nanchor build --verifiable\n\n# Deploy\nanchor deploy --provider.cluster devnet</code></pre><h3>Verify Deployment</h3><pre><code># Check program\nsolana program show &lt;PROGRAM_ID&gt;\n\n# View on explorer\n# https://explorer.solana.com/address/&lt;PROGRAM_ID&gt;?cluster=devnet</code></pre>",
          },
          {
            id: "anc-2-4",
            title: "Write Integration Tests",
            description: "Complete an Anchor integration test",
            type: "challenge",
            order: 3,
            xp: 30,
            duration: "25 min",
            challenge: {
              prompt: "Write an integration test for the initialize instruction.",
              objectives: [
                "Derive the config PDA correctly",
                "Call the initialize method",
                "Assert the config account state",
              ],
              starterCode:
                'import * as anchor from "@coral-xyz/anchor";\nimport { expect } from "chai";\n\ndescribe("initialize", () => {\n  const provider = anchor.AnchorProvider.env();\n  anchor.setProvider(provider);\n\n  it("initializes the config account", async () => {\n    // TODO: Derive config PDA\n    // TODO: Call initialize\n    // TODO: Fetch and assert config state\n  });\n});',
              language: "typescript",
              solution:
                'import * as anchor from "@coral-xyz/anchor";\nimport { expect } from "chai";\n\ndescribe("initialize", () => {\n  const provider = anchor.AnchorProvider.env();\n  anchor.setProvider(provider);\n  const program = anchor.workspace.myProgram;\n\n  it("initializes the config account", async () => {\n    const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(\n      [Buffer.from("config")],\n      program.programId\n    );\n\n    await program.methods\n      .initialize()\n      .accounts({\n        config: configPda,\n        authority: provider.wallet.publicKey,\n        systemProgram: anchor.web3.SystemProgram.programId,\n      })\n      .rpc();\n\n    const config = await program.account.config.fetch(configPda);\n    expect(config.authority.toString()).to.equal(\n      provider.wallet.publicKey.toString()\n    );\n  });\n});',
              hints: [
                "Use PublicKey.findProgramAddressSync with [Buffer.from('config')]",
                "Call program.methods.initialize().accounts({...}).rpc()",
                "Fetch account with program.account.config.fetch(pda)",
              ],
              testCases: [
                { id: "tc-1", name: "Derives PDA", expectedOutput: "findProgramAddressSync", hidden: false },
                { id: "tc-2", name: "Fetches and asserts state", expectedOutput: "fetch", hidden: false },
              ],
            },
          },
          {
            id: "anc-2-5",
            title: "Security Best Practices",
            description: "Common vulnerabilities and how to prevent them",
            type: "content",
            order: 4,
            xp: 30,
            duration: "20 min",
            content:
              "<h2>Security Checklist</h2><ul><li><strong>Signer checks</strong> — always validate Signer constraint</li><li><strong>Owner checks</strong> — verify account owners match expected programs</li><li><strong>PDA bumps</strong> — store canonical bump, never recalculate</li><li><strong>Arithmetic</strong> — use checked_add/sub/mul, never raw +/-</li><li><strong>CPI targets</strong> — validate program_id before CPI</li><li><strong>Reinitialization</strong> — prevent re-init of existing accounts</li><li><strong>Account closing</strong> — zero data before closing to prevent revival</li></ul><p>Follow the <a href='https://github.com/coral-xyz/sealevel-attacks'>Sealevel Attacks</a> repo for a comprehensive list.</p>",
          },
        ],
      },
    ],
    whatYouLearn: [
      "Anchor framework setup and project structure",
      "Account validation with derive macros",
      "Custom errors and events",
      "Testing with TypeScript and Rust",
      "Devnet deployment workflow",
    ],
    instructor: { name: "Superteam Academy", bio: "Official Solana education platform" },
  },
  {
    id: "metaplex-core",
    courseId: "metaplex-core",
    title: "Metaplex Core NFTs",
    slug: "metaplex-core-nfts",
    description:
      "Build with Metaplex Core — the next-gen NFT standard. Create collections, mint NFTs, add plugins for soulbound credentials.",
    difficulty: 2,
    lessonCount: 5,
    xpPerLesson: 35,
    trackId: 4,
    trackLevel: 2,
    isActive: true,
    prerequisite: null,
    totalCompletions: 68,
    creatorRewardXp: 175,
    duration: "2.5 hours",
    creator: "Superteam Academy",
    modules: [
      {
        id: "mpx-mod-1",
        title: "Metaplex Core Fundamentals",
        description: "Collections, assets, and plugins",
        order: 0,
        lessons: [
          {
            id: "mpx-1-1",
            title: "Metaplex Core Overview",
            description: "Architecture of the Core NFT standard",
            type: "content",
            order: 0,
            xp: 35,
            duration: "15 min",
            content:
              "<h2>Metaplex Core</h2><p>Core is Metaplex's newest NFT standard — simpler, cheaper, and more flexible than Token Metadata.</p><h3>Key Features</h3><ul><li><strong>Single account</strong> — asset data lives in one account (not 3+)</li><li><strong>Plugin system</strong> — composable behaviors (freeze, royalties, attributes)</li><li><strong>~0.0014 SOL</strong> mint cost (vs 0.012 SOL for Token Metadata)</li><li><strong>Collection-level plugins</strong> — apply rules to all assets in a collection</li></ul>",
          },
          {
            id: "mpx-1-2",
            title: "Creating Collections",
            description: "Set up a credential collection",
            type: "content",
            order: 1,
            xp: 35,
            duration: "20 min",
            content:
              '<h2>Creating a Collection</h2><pre><code>use mpl_core::instructions::CreateCollectionV2Builder;\n\nCreateCollectionV2Builder::new()\n    .collection(collection.key())\n    .payer(payer.key())\n    .name("Superteam Credentials".to_string())\n    .uri(metadata_uri.to_string())\n    .plugins(vec![\n        PluginAuthorityPair {\n            plugin: Plugin::PermanentFreezeDelegate(\n                PermanentFreezeDelegate { frozen: true }\n            ),\n            authority: Some(PluginAuthority::UpdateAuthority),\n        },\n    ])\n    .invoke()?;</code></pre>',
          },
          {
            id: "mpx-1-3",
            title: "Minting Soulbound Credentials",
            description: "Create frozen NFTs as course credentials",
            type: "challenge",
            order: 2,
            xp: 35,
            duration: "30 min",
            challenge: {
              prompt: "Complete the credential minting function using Metaplex Core CPI.",
              objectives: [
                "Build the CreateV2 instruction",
                "Add PermanentFreezeDelegate plugin",
                "Set the credential attributes",
              ],
              starterCode:
                "// Complete the mint_credential function\npub fn mint_credential(\n    // accounts...\n    name: String,\n    uri: String,\n    track_id: u8,\n    total_xp: u64,\n) -> Result<()> {\n    // TODO: Build CreateV2 CPI\n    // TODO: Add PermanentFreezeDelegate\n    // TODO: Add Attributes plugin with track data\n    Ok(())\n}",
              language: "rust",
              solution:
                "// Mint credential with Metaplex Core\npub fn mint_credential(\n    // accounts...\n    name: String,\n    uri: String,\n    track_id: u8,\n    total_xp: u64,\n) -> Result<()> {\n    let create_ix = CreateV2Builder::new()\n        .asset(asset.key())\n        .collection(Some(collection.key()))\n        .payer(payer.key())\n        .owner(Some(learner.key()))\n        .name(name)\n        .uri(uri)\n        .plugins(vec![\n            PluginAuthorityPair {\n                plugin: Plugin::PermanentFreezeDelegate(\n                    PermanentFreezeDelegate { frozen: true }\n                ),\n                authority: Some(PluginAuthority::UpdateAuthority),\n            },\n            PluginAuthorityPair {\n                plugin: Plugin::Attributes(Attributes {\n                    attribute_list: vec![\n                        Attribute { key: \"track\".to_string(), value: track_id.to_string() },\n                        Attribute { key: \"xp\".to_string(), value: total_xp.to_string() },\n                    ],\n                }),\n                authority: Some(PluginAuthority::UpdateAuthority),\n            },\n        ])\n        .invoke()?;\n    Ok(())\n}",
              hints: [
                "Use CreateV2Builder from mpl_core",
                "PermanentFreezeDelegate with frozen: true makes it soulbound",
                "Attributes plugin stores key-value metadata",
              ],
              testCases: [
                { id: "tc-1", name: "Creates with freeze delegate", expectedOutput: "PermanentFreezeDelegate", hidden: false },
              ],
            },
          },
        ],
      },
      {
        id: "mpx-mod-2",
        title: "Credential Upgrades",
        description: "Updating attributes on existing credentials",
        order: 1,
        lessons: [
          {
            id: "mpx-2-1",
            title: "Updating Attributes",
            description: "Upgrade credential level when learner progresses",
            type: "content",
            order: 0,
            xp: 35,
            duration: "15 min",
            content:
              "<h2>Upgrading Credentials</h2><p>When a learner completes more courses in a track, their credential NFT can be upgraded via the <code>UpdatePluginV2</code> instruction.</p><pre><code>UpdatePluginV2Builder::new()\n    .asset(asset.key())\n    .collection(Some(collection.key()))\n    .payer(payer.key())\n    .plugin(Plugin::Attributes(Attributes {\n        attribute_list: vec![\n            Attribute { key: \"level\".to_string(), value: new_level.to_string() },\n            Attribute { key: \"xp\".to_string(), value: new_xp.to_string() },\n        ],\n    }))\n    .invoke()?;</code></pre>",
          },
          {
            id: "mpx-2-2",
            title: "Querying with DAS API",
            description: "Use Helius DAS to query NFT collections",
            type: "content",
            order: 1,
            xp: 35,
            duration: "15 min",
            content:
              '<h2>DAS API (Digital Asset Standard)</h2><p>Helius provides the DAS API for efficient NFT queries — much faster than iterating on-chain accounts.</p><pre><code>const response = await fetch(heliusUrl, {\n  method: "POST",\n  body: JSON.stringify({\n    jsonrpc: "2.0",\n    id: "1",\n    method: "getAssetsByOwner",\n    params: {\n      ownerAddress: wallet.publicKey.toBase58(),\n      page: 1,\n      limit: 100,\n    },\n  }),\n});\n\nconst assets = result.items.filter(\n  (a) => a.grouping?.[0]?.group_value === collectionAddress\n);</code></pre>',
          },
        ],
      },
    ],
    whatYouLearn: [
      "Metaplex Core architecture and plugin system",
      "Creating collections with permanent freeze",
      "Minting soulbound credential NFTs",
      "Upgrading credentials via attribute updates",
      "Querying collections with Helius DAS API",
    ],
    instructor: { name: "Superteam Academy", bio: "Official Solana education platform" },
  },
];

// ─── Helpers ────────────────────────────────────────────

function generateKey(): string {
  return Math.random().toString(36).substring(2, 14);
}

function buildSanityLesson(lesson: MockLesson) {
  const doc: Record<string, unknown> = {
    _key: generateKey(),
    _type: "lesson",
    title: lesson.title,
    description: lesson.description,
    type: lesson.type,
    order: lesson.order,
    xp: lesson.xp,
    duration: lesson.duration,
    htmlContent: lesson.content ?? null,
  };

  if (lesson.challenge) {
    doc.challenge = {
      prompt: lesson.challenge.prompt,
      objectives: lesson.challenge.objectives,
      starterCode: lesson.challenge.starterCode,
      language: lesson.challenge.language,
      solution: lesson.challenge.solution ?? null,
      hints: lesson.challenge.hints ?? [],
      testCases: (lesson.challenge.testCases ?? []).map((tc) => ({
        _key: generateKey(),
        _type: "object",
        name: tc.name,
        expectedOutput: tc.expectedOutput,
        hidden: tc.hidden ?? false,
      })),
    };
  }

  return doc;
}

function buildSanityModule(mod: MockModule) {
  return {
    _key: generateKey(),
    _type: "module",
    title: mod.title,
    description: mod.description,
    order: mod.order,
    lessons: mod.lessons.map(buildSanityLesson),
  };
}

function buildSanityCourse(course: MockCourse) {
  return {
    _id: `course-${course.courseId}`,
    _type: "course",
    title: course.title,
    slug: { _type: "slug", current: course.slug },
    courseId: course.courseId,
    description: course.description,
    difficulty: course.difficulty,
    duration: course.duration,
    trackId: course.trackId,
    trackLevel: course.trackLevel,
    xpPerLesson: course.xpPerLesson,
    lessonCount: course.lessonCount,
    isActive: course.isActive,
    isPublished: true,
    totalCompletions: course.totalCompletions,
    creatorRewardXp: course.creatorRewardXp,
    creator: course.creator,
    whatYouLearn: course.whatYouLearn ?? [],
    instructor: course.instructor
      ? { name: course.instructor.name, bio: course.instructor.bio }
      : undefined,
    modules: course.modules.map(buildSanityModule),
  };
}

// ─── Main ───────────────────────────────────────────────

async function main() {
  console.log("Pushing courses to Sanity...");
  console.log(`  Project: ${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}`);
  console.log(`  Dataset: ${process.env.NEXT_PUBLIC_SANITY_DATASET}`);

  const transaction = client.transaction();

  for (const course of COURSES) {
    const doc = buildSanityCourse(course);
    console.log(`\n  Creating: ${doc.title} (${doc._id})`);
    console.log(`    Modules: ${doc.modules.length}`);
    console.log(
      `    Lessons: ${doc.modules.reduce((s, m) => s + (m.lessons?.length ?? 0), 0)}`,
    );
    transaction.createOrReplace(doc);
  }

  const result = await transaction.commit();
  console.log(`\nDone! ${result.results.length} documents pushed.`);
  console.log("Transaction ID:", result.transactionId);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});

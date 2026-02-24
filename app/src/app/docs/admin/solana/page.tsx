import type { Metadata } from "next";
import { DocsPagination } from "@/components/docs";

export const metadata: Metadata = { title: "Solana Program" };

export default function SolanaPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Solana Program</h1>
      <p className="lead">
        The on-chain program is built with Anchor and handles enrollments, XP
        minting, credentials, and achievements. It&apos;s the backbone of the
        platform&apos;s Web3 features.
      </p>

      <h2>What the Program Does</h2>
      <ul>
        <li><strong>Course management</strong> — Create and manage courses on-chain</li>
        <li><strong>Enrollment</strong> — Record learner enrollments as PDAs</li>
        <li><strong>XP minting</strong> — Mint soulbound Token-2022 XP tokens</li>
        <li><strong>Lesson tracking</strong> — Track completed lessons via bitmaps</li>
        <li><strong>Credentials</strong> — Issue Metaplex Core NFT certificates</li>
        <li><strong>Achievements</strong> — Define and award achievement NFTs</li>
      </ul>

      <h2>Program Architecture</h2>
      <pre><code>{`onchain-academy/programs/onchain-academy/src/
├── lib.rs              ← Entry point (16 instructions)
├── state/              ← 6 PDA account structs
├── instructions/       ← One file per instruction
├── errors.rs           ← 26 error variants
├── events.rs           ← 15 events
└── utils.rs            ← Shared helpers (mint_xp)`}</code></pre>

      <h3>Instructions (16 total)</h3>
      <table>
        <thead>
          <tr><th>Instruction</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>initialize</code></td><td>Initialize platform config</td></tr>
          <tr><td><code>update_config</code></td><td>Update config (authority, signer rotation)</td></tr>
          <tr><td><code>create_course</code></td><td>Create a new course</td></tr>
          <tr><td><code>update_course</code></td><td>Update course metadata</td></tr>
          <tr><td><code>activate_course</code></td><td>Activate/deactivate a course</td></tr>
          <tr><td><code>enroll</code></td><td>Enroll a learner in a course</td></tr>
          <tr><td><code>complete_lesson</code></td><td>Mark a lesson as complete (bitmap update)</td></tr>
          <tr><td><code>finalize_course</code></td><td>Finalize course completion + award XP</td></tr>
          <tr><td><code>issue_credential</code></td><td>Issue Metaplex Core NFT credential</td></tr>
          <tr><td><code>register_achievement_type</code></td><td>Define a new achievement type</td></tr>
          <tr><td><code>award_achievement</code></td><td>Award achievement to a user</td></tr>
          <tr><td><code>grant_minter_role</code></td><td>Grant minter role to an address</td></tr>
          <tr><td><code>revoke_minter_role</code></td><td>Revoke minter role</td></tr>
          <tr><td><code>close_enrollment</code></td><td>Close an enrollment PDA</td></tr>
          <tr><td><code>initialize_xp_mint</code></td><td>Initialize the XP Token-2022 mint</td></tr>
          <tr><td><code>upgrade_credential</code></td><td>Upgrade credential attributes</td></tr>
        </tbody>
      </table>

      <h3>PDA Accounts (6 types)</h3>
      <table>
        <thead>
          <tr><th>PDA</th><th>Seeds</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr><td><code>Config</code></td><td><code>[&quot;config&quot;]</code></td><td>Platform configuration (authority, backend_signer, XP mint)</td></tr>
          <tr><td><code>Course</code></td><td><code>[&quot;course&quot;, course_id]</code></td><td>Course metadata (title, lesson count, XP per lesson)</td></tr>
          <tr><td><code>Enrollment</code></td><td><code>[&quot;enrollment&quot;, course_id, learner]</code></td><td>Learner enrollment (bitmap, XP earned)</td></tr>
          <tr><td><code>MinterRole</code></td><td><code>[&quot;minter_role&quot;, minter]</code></td><td>Authorized minter for achievements</td></tr>
          <tr><td><code>AchievementType</code></td><td><code>[&quot;achievement_type&quot;, achievement_id]</code></td><td>Achievement definition</td></tr>
          <tr><td><code>AchievementReceipt</code></td><td><code>[&quot;achievement_receipt&quot;, achievement_id, recipient]</code></td><td>Proof of achievement award</td></tr>
        </tbody>
      </table>

      <h2>Key Design Decisions</h2>
      <ul>
        <li><strong>XP = Token-2022</strong> — NonTransferable + PermanentDelegate extensions make XP soulbound</li>
        <li><strong>Credentials = Metaplex Core</strong> — Soulbound via PermanentFreezeDelegate</li>
        <li><strong>No LearnerProfile PDA</strong> — XP balance is read from the Token-2022 ATA directly</li>
        <li><strong>finalize_course / issue_credential split</strong> — XP awarding is decoupled from credential minting</li>
        <li><strong>Backend signer</strong> — Stored in Config PDA, rotatable via update_config</li>
        <li><strong>Reserved bytes</strong> — All accounts have reserved space for future fields</li>
      </ul>

      <h2>Building the Program</h2>
      <pre><code>{`cd onchain-academy
anchor build
cargo fmt
cargo clippy -- -W clippy::all`}</code></pre>

      <h2>Testing</h2>
      <pre><code>{`# Rust unit tests (77 tests)
cargo test --manifest-path tests/rust/Cargo.toml

# TypeScript integration tests (62 tests)
anchor test`}</code></pre>

      <h2>Deploying the Program</h2>
      <pre><code>{`# Generate vanity keypairs (optional)
solana-keygen grind --starts-with ACAD:1   # program
solana-keygen grind --starts-with XP:1     # XP mint

# Place keypairs
cp <program-keypair>.json wallets/program-keypair.json
cp <xp-mint-keypair>.json wallets/xp-mint-keypair.json

# Update program ID everywhere
./scripts/update-program-id.sh

# Deploy to devnet
anchor build
anchor deploy --provider.cluster devnet \\
  --program-keypair wallets/program-keypair.json`}</code></pre>

      <h2>Frontend Integration</h2>
      <p>
        The frontend interacts with the program through:
      </p>
      <ul>
        <li><code>lib/solana/program.ts</code> — PDA derivation helpers</li>
        <li><code>lib/solana/create-course.ts</code> — Server-side course creation with backend signer</li>
        <li><code>hooks/use-onchain.ts</code> — React hooks for on-chain reads/writes</li>
      </ul>

      <h3>PDA Derivation (Frontend)</h3>
      <pre><code>{`import { getConfigPda, getCoursePda, getEnrollmentPda } from '@/lib/solana/program';

const configPda = getConfigPda();
const coursePda = getCoursePda(courseId);
const enrollmentPda = getEnrollmentPda(courseId, learnerPublicKey);`}</code></pre>

      <DocsPagination />
    </article>
  );
}

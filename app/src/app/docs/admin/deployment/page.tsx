import type { Metadata } from "next";
import { DocsPagination } from "@/components/docs";

export const metadata: Metadata = { title: "Deployment" };

export default function DeploymentPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Deployment</h1>
      <p className="lead">
        Deploy Superteam Academy to Vercel (frontend) and Solana devnet/mainnet
        (on-chain program). This guide covers the complete deployment workflow.
      </p>

      <h2>Frontend Deployment (Vercel)</h2>

      <h3>Step 1: Connect Repository</h3>
      <ol>
        <li>Go to <a href="https://vercel.com/new" target="_blank" rel="noopener noreferrer">vercel.com/new</a></li>
        <li>Import your GitHub repository</li>
        <li>Select the <strong>app</strong> directory as the root directory</li>
        <li>Framework preset: <strong>Next.js</strong></li>
      </ol>

      <h3>Step 2: Configure Environment Variables</h3>
      <p>
        In Vercel Dashboard → Settings → Environment Variables, add all variables
        from the <a href="/docs/admin/env-variables">Environment Variables</a> page.
      </p>
      <p>
        Make sure to set them for the correct environments:
      </p>
      <ul>
        <li><strong>Production</strong> — Main deployment</li>
        <li><strong>Preview</strong> — PR preview deployments</li>
        <li><strong>Development</strong> — Not used (use <code>.env.local</code> locally)</li>
      </ul>

      <h3>Step 3: Configure Build Settings</h3>
      <table>
        <thead>
          <tr><th>Setting</th><th>Value</th></tr>
        </thead>
        <tbody>
          <tr><td>Framework Preset</td><td>Next.js</td></tr>
          <tr><td>Root Directory</td><td><code>app</code></td></tr>
          <tr><td>Build Command</td><td><code>pnpm build</code></td></tr>
          <tr><td>Output Directory</td><td><code>.next</code> (default)</td></tr>
          <tr><td>Install Command</td><td><code>pnpm install</code></td></tr>
          <tr><td>Node.js Version</td><td>18.x or 20.x</td></tr>
        </tbody>
      </table>

      <h3>Step 4: Deploy</h3>
      <p>
        Click <strong>Deploy</strong>. Vercel will build and deploy automatically.
        Future pushes to the main branch will trigger automatic deployments.
      </p>

      <h3>Step 5: Custom Domain (Optional)</h3>
      <ol>
        <li>Go to <strong>Settings → Domains</strong></li>
        <li>Add your custom domain (e.g., <code>superteam-academy-six.vercel.app</code>)</li>
        <li>Configure DNS records as shown by Vercel</li>
        <li>Update <code>NEXT_PUBLIC_PRODUCTION_URL</code> to match</li>
      </ol>

      <h2>Solana Program Deployment</h2>

      <h3>Prerequisites</h3>
      <ul>
        <li>Solana CLI installed and configured</li>
        <li>Anchor CLI installed</li>
        <li>SOL in deployer wallet (devnet: free from faucet; mainnet: real SOL)</li>
      </ul>

      <h3>Deploy to Devnet</h3>
      <pre><code>{`# Configure Solana CLI for devnet
solana config set --url devnet

# Get free devnet SOL
solana airdrop 5

# Build the program
cd onchain-academy
anchor build

# Deploy
anchor deploy --provider.cluster devnet \\
  --program-keypair wallets/program-keypair.json

# Note the program ID from the output
# Update it everywhere:
./scripts/update-program-id.sh`}</code></pre>

      <h3>Deploy to Mainnet</h3>
      <pre><code>{`# Configure for mainnet
solana config set --url mainnet-beta

# Ensure sufficient SOL in deployer wallet
solana balance

# Build with verifiable flag
anchor build --verifiable

# Deploy (requires explicit confirmation)
anchor deploy --provider.cluster mainnet-beta \\
  --program-keypair wallets/program-keypair.json`}</code></pre>

      <blockquote>
        <p>
          <strong>Warning:</strong> Mainnet deployment uses real SOL.
          Double-check everything before deploying. Follow the pre-mainnet
          checklist below.
        </p>
      </blockquote>

      <h2>Initialize the Program</h2>
      <p>After deploying, initialize the program config:</p>
      <pre><code>{`# This creates the Config PDA and XP mint
# Usually done via an initialization script or the first anchor test`}</code></pre>

      <h2>Pre-Mainnet Checklist</h2>
      <ul>
        <li>☐ All tests passing (Rust unit + TypeScript integration)</li>
        <li>☐ Security audit completed</li>
        <li>☐ Verifiable build (<code>anchor build --verifiable</code>)</li>
        <li>☐ CU (Compute Unit) budgets verified</li>
        <li>☐ Metaplex Core credential flow tested end-to-end</li>
        <li>☐ Devnet testing successful (multiple days)</li>
        <li>☐ Environment variables set correctly for mainnet</li>
        <li>☐ Supabase production project configured</li>
        <li>☐ Sanity production dataset populated</li>
        <li>☐ Sentry configured for production</li>
        <li>☐ Custom domain configured</li>
        <li>☐ SSL/HTTPS verified</li>
      </ul>

      <h2>CI/CD Setup</h2>
      <p>
        GitHub Actions can automate testing and deployment:
      </p>
      <pre><code>{`# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: cd app && pnpm install
      - run: cd app && pnpm build
      - run: cd app && npx tsc --noEmit
      - run: cd app && pnpm lint`}</code></pre>

      <h2>Environment-Specific Configuration</h2>
      <table>
        <thead>
          <tr><th>Variable</th><th>Development</th><th>Staging</th><th>Production</th></tr>
        </thead>
        <tbody>
          <tr><td>Solana Network</td><td>devnet</td><td>devnet</td><td>mainnet-beta</td></tr>
          <tr><td>Supabase</td><td>Dev project</td><td>Staging project</td><td>Prod project</td></tr>
          <tr><td>Sanity Dataset</td><td>development</td><td>staging</td><td>production</td></tr>
          <tr><td>Sentry Traces</td><td>100%</td><td>50%</td><td>10%</td></tr>
          <tr><td>RPC</td><td>Helius devnet</td><td>Helius devnet</td><td>Helius mainnet</td></tr>
        </tbody>
      </table>

      <h2>Rollback</h2>
      <p>
        Frontend: Vercel supports instant rollback from the Deployments tab.
        Click on a previous deployment and select &quot;Promote to Production&quot;.
      </p>
      <p>
        Program: Solana programs can be upgraded using <code>anchor upgrade</code>.
        To rollback, deploy the previous program binary.
      </p>

      <DocsPagination />
    </article>
  );
}

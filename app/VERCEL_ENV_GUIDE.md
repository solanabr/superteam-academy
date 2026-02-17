# Vercel Deployment Guide

## 1. Import Project
1. Go to your Vercel Dashboard and click "Add New Project" -> "Import"
2. Select your GitHub repository: `panzauto46-bot/superteam-academy`
3. Vercel will auto-detect Next.js inside the `app` folder? **Wait:** Since creating the repo, the `app` folder is at root or nested?
   - The user has `superteam_repo/app`.
   - Vercel usually detects the Next.js app automatically or asks for root directory.
   - **Important:** If your repo root is `superteam-academy` and the Next.js app is in `app/`, you must set "Root Directory" to `app` in Vercel settings during import.

## 2. Environment Variables
Add these variables in the "Environment Variables" section before deploying:

| Variable Name | Description | Value (Example/Where to find) |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity Project ID | From Sanity Dashboard |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity Dataset Name | Usually `production` |
| `NEXT_PUBLIC_SANITY_API_VERSION` | Sanity API Version | `2024-02-01` or similar |
| `NEXT_PUBLIC_SOLANA_NETWORK` | Solana Network | `devnet` (for testing) or `mainnet-beta` |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Helius/QuickNode/Native RPC | `https://api.devnet.solana.com` or custom RPC |
| `AUTH_SECRET` | NextAuth Secret | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | App URL | `https://your-project.vercel.app` (optional on Vercel) |

### Optional (If using Social Login)
| Variable Name | Description |
|---|---|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `GITHUB_ID` | GitHub OAuth Client ID |
| `GITHUB_SECRET` | GitHub OAuth Client Secret |

## 3. Build Settings
- **Framework Preset**: Next.js
- **Root Directory**: `app` (Ensure you select the folder containing `package.json`)
- **Build Command**: `next build` (Default)
- **Output Directory**: `.next` (Default)
- **Install Command**: `npm install` (Default)

## 4. Deploy
Click **Deploy** and wait for the build to complete!

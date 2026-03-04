# Superteam Academy - How to Run (Complete Guide)

## 🎯 Prerequisites

Before starting, ensure you have:

- ✅ **Node.js v20.x** installed
- ✅ **npm** or **yarn** package manager
- ✅ **Git** (for version control)
- ✅ **VS Code** (recommended editor)
- ✅ **Solana Wallet** (Phantom, Solflare, or Backpack)

**Check your Node version:**
```bash
node --version
# Should show: v20.x.x
```

---

## 📦 Part 1: Create Next.js Project

### Step 1: Create the Next.js App

```bash
# Navigate to your projects directory
cd ~/projects  # or wherever you keep projects

# Create Next.js app with TypeScript
npx create-next-app@14.1.0 superteam-academy

# When prompted, select:
✔ Would you like to use TypeScript? … Yes
✔ Would you like to use ESLint? … Yes
✔ Would you like to use Tailwind CSS? … Yes
✔ Would you like to use `src/` directory? … No
✔ Would you like to use App Router? … Yes
✔ Would you like to customize the default import alias? … No

# Navigate into the project
cd superteam-academy
```

**What this creates:**
- Next.js 14 with App Router
- TypeScript configured
- Tailwind CSS set up
- ESLint configured

---

### Step 2: Install Solana Wallet Adapter

```bash
npm install @solana/web3.js@^1.87.6 \
  @solana/wallet-adapter-base@^0.9.23 \
  @solana/wallet-adapter-react@^0.15.35 \
  @solana/wallet-adapter-react-ui@^0.9.35 \
  @solana/wallet-adapter-wallets@^0.19.32
```

**These packages provide:**
- `@solana/web3.js` - Solana blockchain interaction
- `@solana/wallet-adapter-react` - React hooks for wallets
- `@solana/wallet-adapter-react-ui` - Pre-built wallet UI
- `@solana/wallet-adapter-wallets` - Phantom, Solflare, Backpack

---

### Step 3: Install UI Dependencies

```bash
# shadcn/ui dependencies
npm install @radix-ui/react-slot@^1.0.2 \
  @radix-ui/react-dropdown-menu@^2.0.6 \
  tailwindcss-animate@^1.0.7

# Utility libraries
npm install clsx@^2.1.0 \
  tailwind-merge@^2.2.1 \
  class-variance-authority@^0.7.0

# Icons and animations
npm install lucide-react@^0.323.0 \
  framer-motion@^11.0.3

# Theme and dates
npm install next-themes@^0.2.1 \
  date-fns@^3.3.1
```

---

### Step 4: Install Markdown Dependencies

```bash
npm install react-markdown@^9.0.1 \
  remark-gfm@^4.0.0 \
  react-syntax-highlighter@^15.5.0

# TypeScript types for syntax highlighter
npm install -D @types/react-syntax-highlighter@^15.5.0
```

**For lesson content rendering:**
- `react-markdown` - Renders markdown to React
- `remark-gfm` - GitHub Flavored Markdown support
- `react-syntax-highlighter` - Code highlighting with themes

---

### Step 5: Install State Management

```bash
npm install zustand@^4.5.0
```

**For global state:**
- User profile
- Authentication status
- Progress tracking

---

### Step 6: Install Testing Dependencies

```bash
npm install -D vitest@^1.2.2 \
  @vitest/ui@^1.2.2 \
  @testing-library/react@^14.1.2 \
  @testing-library/jest-dom@^6.2.0 \
  jsdom@^24.0.0
```

---

## 🔧 Part 2: Configure the Project

### Step 7: Update next.config.js

Replace the content with:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

module.exports = nextConfig;
```

**Why:** Solana Web3.js requires polyfills for Node modules.

---

### Step 8: Update tsconfig.json

Ensure it has:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

### Step 9: Update tailwind.config.js

Replace with:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

---

### Step 10: Create postcss.config.js

Create file in root:

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

---

### Step 11: Create components.json (shadcn/ui)

Create file in root:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

---

### Step 12: Create vitest.config.ts

Create file in root:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

---

### Step 13: Create vitest.setup.ts

Create file in root:

```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
```

---

### Step 14: Create .env.local

Create file in root:

```env
# Service Mode (Development)
NEXT_PUBLIC_USE_MOCK_DATA=true
NEXT_PUBLIC_USE_ON_CHAIN=false

# Solana Configuration
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com

# Program IDs (Update when deployed)
NEXT_PUBLIC_PROGRAM_ID=11111111111111111111111111111111
```

---

### Step 15: Create .env.example

Create file in root (same as .env.local but for Git):

```env
# Service Mode
NEXT_PUBLIC_USE_MOCK_DATA=true
NEXT_PUBLIC_USE_ON_CHAIN=false

# Solana Configuration
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com

# Program IDs
NEXT_PUBLIC_PROGRAM_ID=11111111111111111111111111111111
```

---

### Step 16: Update .gitignore

Ensure it includes:

```
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
```

---

### Step 17: Update package.json Scripts

Add/update scripts section:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "type-check": "tsc --noEmit"
  }
}
```

---

## 📁 Part 3: Create Directory Structure

### Step 18: Create Directories

```bash
# Create all necessary directories at once
mkdir -p lib/types
mkdir -p lib/services
mkdir -p lib/store
mkdir -p components/ui
mkdir -p components/providers
mkdir -p components/wallet
mkdir -p components/layout
mkdir -p components/lesson
mkdir -p components/course
mkdir -p app/\(platform\)/dashboard
mkdir -p app/courses/\[slug\]/lessons/\[lessonId\]
mkdir -p app/leaderboard
mkdir -p __tests__/services
mkdir -p public/courses
mkdir -p types
```

---

## 🧪 Part 4: Verify Installation

### Step 19: Test the Setup

```bash
# 1. Check dependencies installed
npm list | head -20

# 2. Try building
npm run build

# 3. Start dev server
npm run dev
```

**Expected output:**
```
▲ Next.js 14.1.0
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000

✓ Ready in 2.5s
```

---

### Step 20: Open in Browser

Open http://localhost:3000

You should see the default Next.js page.

---

## 🔍 Part 5: Verify Dependencies

### Step 21: Check Key Packages

```bash
# Check Solana packages
npm list @solana/web3.js
npm list @solana/wallet-adapter-react

# Check UI packages
npm list react-markdown
npm list lucide-react

# Check all installed
npm list --depth=0
```

---

## 📦 Complete Dependencies List

Your `package.json` should include:

```json
{
  "dependencies": {
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-slot": "^1.0.2",
    "@solana/wallet-adapter-base": "^0.9.23",
    "@solana/wallet-adapter-react": "^0.15.35",
    "@solana/wallet-adapter-react-ui": "^0.9.35",
    "@solana/wallet-adapter-wallets": "^0.19.32",
    "@solana/web3.js": "^1.87.6",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "date-fns": "^3.3.1",
    "framer-motion": "^11.0.3",
    "lucide-react": "^0.323.0",
    "next": "14.1.0",
    "next-themes": "^0.2.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-markdown": "^9.0.1",
    "react-syntax-highlighter": "^15.5.0",
    "remark-gfm": "^4.0.0",
    "tailwind-merge": "^2.2.1",
    "tailwindcss-animate": "^1.0.7",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.2.0",
    "@testing-library/react": "^14.1.2",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@types/react-syntax-highlighter": "^15.5.0",
    "@vitest/ui": "^1.2.2",
    "autoprefixer": "^10.0.1",
    "eslint": "^8",
    "eslint-config-next": "14.1.0",
    "jsdom": "^24.0.0",
    "postcss": "^8",
    "tailwindcss": "^3.3.0",
    "typescript": "^5",
    "vitest": "^1.2.2"
  }
}
```

---

## 🎨 Part 6: Prepare for Development

### Step 22: Install VS Code Extensions (Optional but Recommended)

- **ES7+ React/Redux/React-Native snippets**
- **Tailwind CSS IntelliSense**
- **Pretty TypeScript Errors**
- **Error Lens**
- **Auto Rename Tag**

---

### Step 23: Configure VS Code (Optional)

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

---

## 🚀 Part 7: Ready for Code

At this point you should have:

- ✅ Next.js 14 project created
- ✅ All dependencies installed
- ✅ Configuration files set up
- ✅ Directory structure created
- ✅ Environment variables configured
- ✅ Dev server running

---

## 📝 Next Steps

Now you're ready to add:

1. **Part 3**: Core configuration files (layout.tsx, globals.css)
2. **Part 4**: Service layer (domain types, services)
3. **Part 5**: UI components (Button, Card, etc.)
4. **Part 6**: Wallet integration
5. **Part 7**: Pages (landing, courses, lessons)
6. **Part 8**: Tests

---

## 🐛 Troubleshooting

### Issue: "Module not found"

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Port 3000 already in use"

```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

### Issue: TypeScript errors

```bash
# Restart TypeScript server in VS Code
# Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### Issue: Tailwind not working

```bash
# Ensure globals.css is imported in layout.tsx
# Check tailwind.config.js content paths
```

---

## 📊 Installation Time Estimate

- **Steps 1-6**: ~5 minutes (downloading packages)
- **Steps 7-17**: ~2 minutes (configuration)
- **Steps 18-20**: ~1 minute (directories and test)
- **Total**: ~10 minutes

---

## ✅ Verification Checklist

Before proceeding to Part 2:

- [ ] Node v20.x installed and verified
- [ ] Next.js app created successfully
- [ ] All Solana packages installed
- [ ] All UI packages installed
- [ ] All markdown packages installed
- [ ] Testing packages installed
- [ ] Configuration files created
- [ ] Directories created
- [ ] Dev server starts without errors
- [ ] Can access http://localhost:3000

---

## 🎯 What's Next?

After completing this guide, you'll have a fully configured Next.js project ready for development.

**Continue to Part 2** for:
- Complete `package.json`
- Root layout with providers
- Global CSS with theme
- Core utility files

---

**You're ready to build! 🚀**

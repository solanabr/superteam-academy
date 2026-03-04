# 🚀 COMPLETE SETUP GUIDE - STEP BY STEP

## 📋 PREREQUISITES CHECKLIST

Before starting, make sure you have:

- [ ] **Node.js v20.x** installed
  ```bash
  node --version
  # Should output: v20.x.x
  ```

- [ ] **npm v10.x** or **yarn v1.22+**
  ```bash
  npm --version
  # Should output: 10.x.x
  ```

- [ ] **Git** installed
  ```bash
  git --version
  ```

- [ ] **Code Editor** (VS Code recommended)

- [ ] **Web Browser** (Chrome, Firefox, or Brave)

- [ ] **Solana Wallet** (Phantom, Solflare, or Backpack)
  - Install browser extension
  - Create wallet (save seed phrase!)
  - Switch to Devnet

---

## 📦 STEP 1: CREATE NEXT.JS PROJECT

### 1.1 Open Terminal

**Windows:** PowerShell or Command Prompt  
**Mac/Linux:** Terminal

### 1.2 Navigate to Your Projects Folder

```bash
# Create projects folder if it doesn't exist
mkdir ~/projects
cd ~/projects
```

### 1.3 Create Next.js Project

```bash
npx create-next-app@14.1.0 superteam-academy
```

**When prompted, select:**
```
✔ Would you like to use TypeScript? … Yes
✔ Would you like to use ESLint? … Yes
✔ Would you like to use Tailwind CSS? … Yes
✔ Would you like to use `src/` directory? … No
✔ Would you like to use App Router? … Yes
✔ Would you like to customize the default import alias? … No
```

### 1.4 Enter Project Directory

```bash
cd superteam-academy
```

### 1.5 Verify Installation

```bash
ls -la
# You should see: app/, node_modules/, package.json, etc.
```

✅ **Checkpoint:** You should have a fresh Next.js project

---

## 📁 STEP 2: ORGANIZE ALL FILES

### 2.1 Download All Files

You have **46 files** to place. Here's the organized list:

#### Root Directory (13 files)
- `PROJECT_STRUCTURE.md`
- `HOW_TO_RUN.md`
- `SECURITY_AUDIT.md`
- `COMPLETE_WINNER.md`
- `package.json` ← Replace with `package-COMPLETE.json`
- `next.config.js`
- `tailwind.config.js`
- `tsconfig.json`
- `postcss.config.js`
- `components.json`
- `i18n.ts`
- `.env.local`
- `.env.example`

#### Create vitest Files (2 files)
Create these manually in root:

**vitest.config.ts:**
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

**vitest.setup.ts:**
```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
```

### 2.2 Create Directory Structure

```bash
# Create all necessary directories
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
mkdir -p messages
mkdir -p public/courses
```

### 2.3 File Placement Map

**Copy files to these exact locations:**

```
app/
├── layout.tsx                      ← app-layout.tsx
├── page.tsx                        ← app-page.tsx
├── globals.css                     ← globals.css
├── (platform)/dashboard/
│   └── page.tsx                    ← app-platform-dashboard-page.tsx
├── courses/
│   ├── page.tsx                    ← First export from app-courses-pages.tsx
│   └── [slug]/
│       ├── page.tsx                ← Second export from app-courses-pages.tsx
│       └── lessons/[lessonId]/
│           └── page.tsx            ← Third export from app-courses-pages.tsx
└── leaderboard/
    └── page.tsx                    ← app-leaderboard-page.tsx

components/
├── ui/
│   ├── button.tsx                  ← components-ui-button.tsx
│   ├── card.tsx                    ← components-ui-card.tsx
│   ├── badge.tsx                   ← components-ui-badge.tsx
│   ├── progress.tsx                ← components-ui-progress.tsx
│   └── dropdown-menu.tsx           ← components-ui-dropdown-menu.tsx
├── providers/
│   ├── SolanaWalletProvider.tsx    ← components-providers-SolanaWalletProvider.tsx
│   └── ThemeProvider.tsx           ← components-providers-ThemeProvider.tsx
├── wallet/
│   └── WalletButton.tsx            ← components-wallet-WalletButton.tsx
├── layout/
│   ├── Navbar.tsx                  ← components-layout-Navbar.tsx
│   └── LanguageSwitcher.tsx        ← components-layout-LanguageSwitcher.tsx
└── lesson/
    ├── LessonView.tsx              ← components-lesson-LessonView.tsx
    ├── CodeEditor.tsx              ← components-lesson-CodeEditor.tsx
    └── MarkdownComponents.tsx      ← components-lesson-MarkdownComponents.tsx

lib/
├── types/
│   └── domain.ts                   ← lib-types-domain.ts
├── services/
│   ├── learning-progress.ts        ← lib-services-learning-progress.ts
│   ├── credential.ts               ← lib-services-credential.ts
│   ├── analytics.ts                ← lib-services-analytics.ts
│   ├── course.ts                   ← lib-services-course.ts
│   └── index.ts                    ← lib-services-index.ts
├── store/
│   └── user.ts                     ← lib-store-user.ts
└── utils.ts                        ← lib-utils.ts

messages/
├── en.json                         ← messages-en.json
├── pt-br.json                      ← messages-pt-br.json
└── es.json                         ← messages-es.json

__tests__/
└── services/
    └── learning-progress.test.ts   ← tests-learning-progress.test.ts
```

### 2.4 Special Note: app-courses-pages.tsx

This file contains **3 separate components**. Split them:

**File 1: `app/courses/page.tsx`**
```typescript
// Copy everything from "// app/courses/page.tsx" 
// until "// ============================================================================"
```

**File 2: `app/courses/[slug]/page.tsx`**
```typescript
// Copy everything from "// app/courses/[slug]/page.tsx"
// until next "// ============================================================================"
// Change: export default function CourseDetailPage()
```

**File 3: `app/courses/[slug]/lessons/[lessonId]/page.tsx`**
```typescript
// Copy everything from "// app/courses/[slug]/lessons/[lessonId]/page.tsx"
// until end
// Change: export default function LessonPage()
```

✅ **Checkpoint:** All 46 files should be in correct locations

---

## 🔧 STEP 3: INSTALL DEPENDENCIES

### 3.1 Replace package.json

```bash
# Delete the default package.json
rm package.json

# Copy package-COMPLETE.json to package.json
cp package-COMPLETE.json package.json
```

### 3.2 Install All Dependencies

```bash
npm install
```

**This will install:**
- ✅ Solana Wallet Adapter (5 packages)
- ✅ Monaco Editor
- ✅ next-intl (i18n)
- ✅ react-markdown & syntax-highlighter
- ✅ shadcn/ui dependencies
- ✅ Zustand
- ✅ Testing libraries
- ✅ All other dependencies

**Expected output:**
```
added 1247 packages in 1m
```

### 3.3 Verify Installation

```bash
# Check if Monaco Editor is installed
npm list @monaco-editor/react

# Check if Solana packages are installed
npm list @solana/wallet-adapter-react

# Should see version numbers
```

✅ **Checkpoint:** All dependencies installed successfully

---

## ⚙️ STEP 4: CONFIGURE ENVIRONMENT

### 4.1 Create .env.local

```bash
# If not already created, copy from .env.example
cp .env.example .env.local
```

### 4.2 Verify .env.local Contents

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

**No changes needed for development!**

✅ **Checkpoint:** Environment configured

---

## 🚀 STEP 5: START DEVELOPMENT SERVER

### 5.1 Start the Server

```bash
npm run dev
```

**Expected output:**
```
  ▲ Next.js 14.1.0
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

  ✓ Ready in 3.2s
```

### 5.2 Open in Browser

Open: **http://localhost:3000**

You should see:
- ✅ Landing page with hero section
- ✅ "Connect Wallet" button in navbar
- ✅ Dark theme by default
- ✅ No errors in browser console

✅ **Checkpoint:** App is running!

---

## 🔍 STEP 6: VERIFY ALL FEATURES

### 6.1 Test Wallet Connection

1. Click "Connect Wallet" in navbar
2. Select your wallet (Phantom/Solflare/Backpack)
3. Approve connection
4. Should see:
   - ✅ XP badge in navbar (0 XP, Level 1)
   - ✅ Dashboard link appears

### 6.2 Test Dashboard

1. Click "Dashboard" in navbar
2. Should see:
   - ✅ Welcome message
   - ✅ Stats cards (Total XP, Level, Streak, Courses)
   - ✅ Available courses grid

### 6.3 Test Course View

1. Click "Courses" in navbar
2. Click on "Solana Fundamentals"
3. Should see:
   - ✅ Course details
   - ✅ Progress bar (0%)
   - ✅ Module list
   - ✅ Lesson list

### 6.4 Test Lesson View

1. Click on "What is Solana?" lesson
2. Should see:
   - ✅ Lesson content (markdown rendered)
   - ✅ Code blocks with syntax highlighting
   - ✅ "Complete Lesson" button

### 6.5 Test Lesson Completion

1. Click "Complete Lesson"
2. Should see:
   - ✅ Alert: "🎉 Lesson completed! +50 XP earned!"
   - ✅ XP badge updates in navbar
   - ✅ Button changes to "Completed"

### 6.6 Test Code Editor (Challenge Lesson)

1. Go to a challenge lesson (Module 2)
2. Should see:
   - ✅ Monaco Editor (VS Code)
   - ✅ "Run Tests" button
   - ✅ Test cases displayed

### 6.7 Test Language Switching

1. Click globe icon in navbar
2. Select "Português"
3. Should see:
   - ✅ UI changes to Portuguese
   - ✅ Course names translated

### 6.8 Test Leaderboard

1. Click "Leaderboard" in navbar
2. Should see:
   - ✅ Your rank highlighted
   - ✅ Top users list
   - ✅ XP and levels displayed

✅ **Checkpoint:** All features working!

---

## 🧪 STEP 7: RUN TESTS

### 7.1 Run All Tests

```bash
npm test
```

**Expected output:**
```
✓ __tests__/services/learning-progress.test.ts (50 tests) 2543ms
  ✓ MockLearningProgressService (42 tests)
  ✓ Integration Tests (1 test)

 Test Files  1 passed (1)
      Tests  50 passed (50)
```

### 7.2 Run Type Check

```bash
npm run type-check
```

**Expected output:**
```
✓ No TypeScript errors
```

### 7.3 Run Linter

```bash
npm run lint
```

**Expected output:**
```
✓ No ESLint errors
```

✅ **Checkpoint:** All tests passing!

---

## 🔨 STEP 8: BUILD FOR PRODUCTION

### 8.1 Build the Project

```bash
npm run build
```

**Expected output:**
```
  ▲ Next.js 14.1.0

  Creating an optimized production build ...
  ✓ Compiled successfully
  ✓ Collecting page data
  ✓ Generating static pages (7/7)
  ✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    2.1 kB         120 kB
├ ○ /courses                             1.8 kB         118 kB
├ ○ /dashboard                           2.5 kB         122 kB
└ ○ /leaderboard                         1.9 kB         119 kB

○  (Static)  automatically rendered as static HTML
```

### 8.2 Test Production Build

```bash
npm run start
```

Open: **http://localhost:3000**

Verify everything still works.

✅ **Checkpoint:** Production build successful!

---

## 🎯 VERIFICATION CHECKLIST

Run through this checklist:

### Functionality Tests
- [ ] Landing page loads
- [ ] Can connect wallet
- [ ] Dashboard displays correctly
- [ ] Can view courses
- [ ] Can view lessons
- [ ] Markdown renders properly
- [ ] Code editor loads (Monaco)
- [ ] Can complete lessons
- [ ] XP updates in navbar
- [ ] Achievements unlock
- [ ] Leaderboard displays
- [ ] Language switcher works
- [ ] Mobile responsive

### Technical Tests
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] All tests passing
- [ ] Build completes
- [ ] No dependency warnings
- [ ] Environment variables set

### Performance Tests
- [ ] Page loads < 3 seconds
- [ ] Navigation is smooth
- [ ] No layout shifts
- [ ] Images load quickly

✅ **Checkpoint:** Everything verified!

---

## 🐛 TROUBLESHOOTING

### Problem: "Module not found"

**Solution:**
```bash
# Clear everything and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Problem: "Port 3000 already in use"

**Solution:**
```bash
# Kill the process
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

### Problem: Monaco Editor not loading

**Solution:**
```bash
# Ensure Monaco is installed
npm install @monaco-editor/react@^4.6.0

# Restart server
npm run dev
```

### Problem: Wallet not connecting

**Solution:**
1. Check wallet extension is installed
2. Switch wallet to Devnet
3. Refresh page
4. Try different wallet

### Problem: TypeScript errors

**Solution:**
```bash
# Restart TypeScript server in VS Code
# Cmd+Shift+P → "TypeScript: Restart TS Server"

# Or run type check
npm run type-check
```

### Problem: Styles not applying

**Solution:**
```bash
# Check Tailwind config
# Ensure globals.css is imported in layout.tsx
# Restart dev server
```

### Problem: Build fails

**Solution:**
```bash
# Check all files are in correct locations
# Run type check first
npm run type-check

# Fix any errors, then build
npm run build
```

### Problem: Tests failing

**Solution:**
```bash
# Install test dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom

# Run tests with output
npm test -- --reporter=verbose
```

---

## 📊 PROJECT STRUCTURE VERIFICATION

### Quick Check Commands

```bash
# Verify file structure
tree -L 3 -I 'node_modules'

# Count files
find . -type f -name "*.tsx" -o -name "*.ts" | wc -l
# Should be ~40 files

# Check for missing dependencies
npm list

# Check for security issues
npm audit
```

---

## 🚀 DEPLOYMENT (OPTIONAL)

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts
```

### Set Environment Variables in Vercel

1. Go to Vercel dashboard
2. Select your project
3. Settings → Environment Variables
4. Add all NEXT_PUBLIC_* variables

---

## ✅ FINAL CHECKLIST

Before submitting/deploying:

### Code Quality
- [ ] All 46 files in correct locations
- [ ] No TypeScript errors
- [ ] All tests passing
- [ ] No console errors
- [ ] Build succeeds

### Functionality
- [ ] Wallet connects
- [ ] Lessons complete
- [ ] XP updates
- [ ] Achievements unlock
- [ ] Languages switch
- [ ] Code editor works

### Performance
- [ ] Fast page loads
- [ ] Smooth navigation
- [ ] No memory leaks

### Security
- [ ] No sensitive data exposed
- [ ] Environment variables set
- [ ] Dependencies audited
- [ ] HTTPS in production

---

## 🎉 SUCCESS!

**You now have a fully functional Superteam Academy platform!**

**Next Steps:**
1. Test everything thoroughly
2. Submit to bounty
3. Win $4,800! 🏆

---

## 📞 SUPPORT

If you encounter issues:

1. Check SECURITY_AUDIT.md
2. Check COMPLETE_WINNER.md
3. Check PROJECT_STRUCTURE.md
4. Review error messages carefully
5. Check browser console for errors

**Common Issues:**
- File in wrong location → Check file placement map
- Dependency missing → Run `npm install`
- TypeScript error → Check imports and types
- Build failing → Run type check first

---

## 📚 DOCUMENTATION REFERENCE

- `HOW_TO_RUN.md` - Basic setup instructions
- `PROJECT_STRUCTURE.md` - Architecture overview
- `SECURITY_AUDIT.md` - Security analysis
- `COMPLETE_WINNER.md` - Feature showcase

---

**You're ready to WIN! 🚀🏆**

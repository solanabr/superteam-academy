// verify-setup.js

/**
 * PROJECT SETUP VERIFICATION SCRIPT
 * 
 * Run this to verify your project is set up correctly
 * Usage: node verify-setup.js
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function logSection(message) {
  log(`\n${colors.bold}${message}${colors.reset}`);
  log('='.repeat(50));
}

let errorCount = 0;
let warningCount = 0;
let successCount = 0;

// Check if file exists
function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    logSuccess(`${description}: ${filePath}`);
    successCount++;
    return true;
  } else {
    logError(`${description} MISSING: ${filePath}`);
    errorCount++;
    return false;
  }
}

// Check if directory exists
function checkDirectory(dirPath, description) {
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    logSuccess(`${description}: ${dirPath}`);
    successCount++;
    return true;
  } else {
    logError(`${description} MISSING: ${dirPath}`);
    errorCount++;
    return false;
  }
}

// Check package.json dependencies
function checkDependencies() {
  logSection('CHECKING DEPENDENCIES');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const requiredDeps = [
      '@monaco-editor/react',
      '@solana/wallet-adapter-react',
      '@solana/wallet-adapter-react-ui',
      '@solana/web3.js',
      'next-intl',
      'react-markdown',
      'react-syntax-highlighter',
      'zustand',
    ];
    
    requiredDeps.forEach(dep => {
      if (deps[dep]) {
        logSuccess(`${dep} - ${deps[dep]}`);
        successCount++;
      } else {
        logError(`${dep} - NOT INSTALLED`);
        errorCount++;
      }
    });
  } catch (error) {
    logError('Failed to read package.json');
    errorCount++;
  }
}

// Check node_modules
function checkNodeModules() {
  logSection('CHECKING NODE MODULES');
  
  if (fs.existsSync('node_modules')) {
    const nodeModules = fs.readdirSync('node_modules');
    logSuccess(`node_modules exists with ${nodeModules.length} packages`);
    successCount++;
  } else {
    logError('node_modules NOT FOUND - Run: npm install');
    errorCount++;
  }
}

// Main verification
function verify() {
  log(colors.bold + '\n🔍 SUPERTEAM ACADEMY - SETUP VERIFICATION\n' + colors.reset);
  
  // Check root files
  logSection('CHECKING ROOT FILES');
  checkFile('package.json', 'package.json');
  checkFile('next.config.js', 'Next.js config');
  checkFile('tailwind.config.js', 'Tailwind config');
  checkFile('tsconfig.json', 'TypeScript config');
  checkFile('postcss.config.js', 'PostCSS config');
  checkFile('components.json', 'shadcn/ui config');
  checkFile('i18n.ts', 'i18n config');
  checkFile('.env.local', 'Environment variables');
  
  // Check app directory
  logSection('CHECKING APP DIRECTORY');
  checkFile('app/layout.tsx', 'Root layout');
  checkFile('app/page.tsx', 'Landing page');
  checkFile('app/globals.css', 'Global styles');
  checkFile('app/(platform)/dashboard/page.tsx', 'Dashboard page');
  checkFile('app/courses/page.tsx', 'Courses page');
  checkFile('app/courses/[slug]/page.tsx', 'Course detail page');
  checkFile('app/courses/[slug]/lessons/[lessonId]/page.tsx', 'Lesson page');
  checkFile('app/leaderboard/page.tsx', 'Leaderboard page');
  
  // Check components
  logSection('CHECKING COMPONENTS');
  checkDirectory('components/ui', 'UI components directory');
  checkFile('components/ui/button.tsx', 'Button component');
  checkFile('components/ui/card.tsx', 'Card component');
  checkFile('components/ui/badge.tsx', 'Badge component');
  checkFile('components/ui/progress.tsx', 'Progress component');
  checkFile('components/ui/dropdown-menu.tsx', 'Dropdown menu component');
  
  checkDirectory('components/providers', 'Providers directory');
  checkFile('components/providers/SolanaWalletProvider.tsx', 'Wallet provider');
  checkFile('components/providers/ThemeProvider.tsx', 'Theme provider');
  
  checkDirectory('components/wallet', 'Wallet directory');
  checkFile('components/wallet/WalletButton.tsx', 'Wallet button');
  
  checkDirectory('components/layout', 'Layout directory');
  checkFile('components/layout/Navbar.tsx', 'Navbar');
  checkFile('components/layout/LanguageSwitcher.tsx', 'Language switcher');
  
  checkDirectory('components/lesson', 'Lesson directory');
  checkFile('components/lesson/LessonView.tsx', 'Lesson view');
  checkFile('components/lesson/CodeEditor.tsx', 'Code editor');
  checkFile('components/lesson/MarkdownComponents.tsx', 'Markdown components');
  
  // Check lib directory
  logSection('CHECKING LIB DIRECTORY');
  checkFile('lib/utils.ts', 'Utility functions');
  
  checkDirectory('lib/types', 'Types directory');
  checkFile('lib/types/domain.ts', 'Domain types');
  
  checkDirectory('lib/services', 'Services directory');
  checkFile('lib/services/learning-progress.ts', 'Learning progress service');
  checkFile('lib/services/credential.ts', 'Credential service');
  checkFile('lib/services/analytics.ts', 'Analytics service');
  checkFile('lib/services/course.ts', 'Course service');
  checkFile('lib/services/index.ts', 'Service factory');
  
  checkDirectory('lib/store', 'Store directory');
  checkFile('lib/store/user.ts', 'User store');
  
  // Check messages directory
  logSection('CHECKING I18N MESSAGES');
  checkDirectory('messages', 'Messages directory');
  checkFile('messages/en.json', 'English translations');
  checkFile('messages/pt-br.json', 'Portuguese translations');
  checkFile('messages/es.json', 'Spanish translations');
  
  // Check tests
  logSection('CHECKING TESTS');
  checkDirectory('__tests__', 'Tests directory');
  checkFile('__tests__/services/learning-progress.test.ts', 'Service tests');
  
  // Check dependencies
  checkDependencies();
  
  // Check node_modules
  checkNodeModules();
  
  // Check environment variables
  logSection('CHECKING ENVIRONMENT VARIABLES');
  try {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const requiredEnvVars = [
      'NEXT_PUBLIC_USE_MOCK_DATA',
      'NEXT_PUBLIC_SOLANA_NETWORK',
      'NEXT_PUBLIC_SOLANA_RPC_URL',
    ];
    
    requiredEnvVars.forEach(varName => {
      if (envContent.includes(varName)) {
        logSuccess(`${varName} is set`);
        successCount++;
      } else {
        logWarning(`${varName} is missing`);
        warningCount++;
      }
    });
  } catch (error) {
    logError('Failed to read .env.local');
    errorCount++;
  }
  
  // Final summary
  logSection('VERIFICATION SUMMARY');
  log(`\n${colors.green}✅ Success: ${successCount}${colors.reset}`);
  log(`${colors.yellow}⚠️  Warnings: ${warningCount}${colors.reset}`);
  log(`${colors.red}❌ Errors: ${errorCount}${colors.reset}\n`);
  
  if (errorCount === 0 && warningCount === 0) {
    log(colors.green + colors.bold + '\n🎉 VERIFICATION PASSED! Your project is ready!\n' + colors.reset);
    log('Next steps:');
    log('  1. Run: npm run dev');
    log('  2. Open: http://localhost:3000');
    log('  3. Connect your wallet and start testing!\n');
  } else if (errorCount === 0) {
    log(colors.yellow + colors.bold + '\n⚠️  VERIFICATION PASSED WITH WARNINGS\n' + colors.reset);
    log('Your project should work, but check the warnings above.\n');
  } else {
    log(colors.red + colors.bold + '\n❌ VERIFICATION FAILED\n' + colors.reset);
    log('Please fix the errors above before running the project.');
    log('\nCommon fixes:');
    log('  - Missing files: Check SETUP_GUIDE.md for file placement');
    log('  - Missing dependencies: Run npm install');
    log('  - Missing node_modules: Run npm install\n');
  }
}

// Run verification
verify();

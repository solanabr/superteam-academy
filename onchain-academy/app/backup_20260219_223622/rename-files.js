// rename-files.js - Automatically rename files to correct names

const fs = require('fs');
const path = require('path');

const renames = [
  // Components UI
  ['components/ui/components-ui-button.tsx', 'components/ui/button.tsx'],
  ['components/ui/components-ui-card.tsx', 'components/ui/card.tsx'],
  ['components/ui/components-ui-badge.tsx', 'components/ui/badge.tsx'],
  ['components/ui/components-ui-progress.tsx', 'components/ui/progress.tsx'],
  ['components/ui/components-ui-dropdown-menu.tsx', 'components/ui/dropdown-menu.tsx'],
  
  // Components Providers
  ['components/providers/components-providers-SolanaWalletProvider.tsx', 'components/providers/SolanaWalletProvider.tsx'],
  ['components/providers/components-providers-ThemeProvider.tsx', 'components/providers/ThemeProvider.tsx'],
  
  // Components Wallet
  ['components/wallet/components-wallet-WalletButton.tsx', 'components/wallet/WalletButton.tsx'],
  
  // Components Layout
  ['components/layout/components-layout-Navbar.tsx', 'components/layout/Navbar.tsx'],
  ['components/layout/components-layout-LanguageSwitcher.tsx', 'components/layout/LanguageSwitcher.tsx'],
  
  // Components Lesson
  ['components/lesson/components-lesson-LessonView.tsx', 'components/lesson/LessonView.tsx'],
  ['components/lesson/components-lesson-CodeEditor.tsx', 'components/lesson/CodeEditor.tsx'],
  ['components/lesson/components-lesson-MarkdownComponents.tsx', 'components/lesson/MarkdownComponents.tsx'],
  
  // Lib
  ['lib/lib-utils.ts', 'lib/utils.ts'],
  
  // Lib Types
  ['lib/types/lib-types-domain.ts', 'lib/types/domain.ts'],
  
  // Lib Services
  ['lib/services/lib-services-learning-progress.ts', 'lib/services/learning-progress.ts'],
  ['lib/services/lib-services-credential.ts', 'lib/services/credential.ts'],
  ['lib/services/lib-services-analytics.ts', 'lib/services/analytics.ts'],
  ['lib/services/lib-services-course.ts', 'lib/services/course.ts'],
  ['lib/services/lib-services-index.ts', 'lib/services/index.ts'],
  
  // Lib Store
  ['lib/store/lib-store-user.ts', 'lib/store/user.ts'],
  
  // Messages
  ['messages/messages-en.json', 'messages/en.json'],
  ['messages/messages-pt-br.json', 'messages/pt-br.json'],
  ['messages/messages-es.json', 'messages/es.json'],
  
  // App Pages
  ['app/(platform)/dashboard/app-platform-dashboard-page.tsx', 'app/(platform)/dashboard/page.tsx'],
  ['app/leaderboard/app-leaderboard-page.tsx', 'app/leaderboard/page.tsx'],
  
  // Tests
  ['__tests__/services/tests-learning-progress.test.ts', '__tests__/services/learning-progress.test.ts'],
];

console.log('🔧 AUTO-RENAME SCRIPT - Fixing file names...\n');
console.log('='.repeat(60));

let renamed = 0;
let notFound = 0;
let errors = 0;

renames.forEach(([oldPath, newPath]) => {
  if (fs.existsSync(oldPath)) {
    try {
      // Check if destination already exists
      if (fs.existsSync(newPath)) {
        console.log(`⚠️  Skipped (already exists): ${newPath}`);
        return;
      }
      
      fs.renameSync(oldPath, newPath);
      console.log(`✅ Renamed: ${path.basename(oldPath)} → ${path.basename(newPath)}`);
      console.log(`   Location: ${path.dirname(newPath)}`);
      renamed++;
    } catch (err) {
      console.log(`❌ Error renaming ${oldPath}:`);
      console.log(`   ${err.message}`);
      errors++;
    }
  } else {
    // File not found - might already be correctly named or not downloaded
    notFound++;
  }
});

console.log('\n' + '='.repeat(60));
console.log('📊 RESULTS:');
console.log('='.repeat(60));
console.log(`✅ Successfully renamed: ${renamed} files`);
console.log(`⚠️  Files not found: ${notFound} files`);
console.log(`❌ Errors: ${errors} files`);

if (renamed > 0) {
  console.log('\n🎉 SUCCESS! Files have been renamed!');
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Run: node verify-setup.js');
  console.log('2. Expected: All checks should pass ✅');
  console.log('3. Then run: npm run dev');
  console.log('4. Open: http://localhost:3000');
}

if (notFound > 0) {
  console.log('\n💡 NOTE:');
  console.log(`${notFound} files were not found. This is normal if:`);
  console.log('- Files are already correctly named');
  console.log('- Files are not downloaded yet');
  console.log('- Files are in different locations');
  console.log('\nRun "node diagnostic.js" to see what files exist.');
}

if (errors > 0) {
  console.log('\n🚨 ERRORS OCCURRED:');
  console.log('Check the error messages above.');
  console.log('Common issues:');
  console.log('- File permissions');
  console.log('- Destination file already exists');
  console.log('- File is open in another program');
}

console.log('\n');

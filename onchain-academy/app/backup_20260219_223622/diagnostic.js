// diagnostic.js - Check what files actually exist

const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNOSTIC - Checking actual files in your project\n');

// Function to list files in a directory
function listFiles(dir, label) {
  console.log(`\n📁 ${label}: ${dir}`);
  console.log('='.repeat(50));
  
  if (!fs.existsSync(dir)) {
    console.log('❌ Directory does not exist!');
    return;
  }
  
  const files = fs.readdirSync(dir);
  
  if (files.length === 0) {
    console.log('⚠️  Directory is empty!');
    return;
  }
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      console.log(`📂 ${file}/`);
    } else {
      console.log(`📄 ${file}`);
    }
  });
}

// Check all directories
console.log('=' .repeat(60));
console.log('CHECKING YOUR ACTUAL FILE STRUCTURE');
console.log('='.repeat(60));

// App directories
listFiles('app', 'APP Directory');
listFiles('app/(platform)', 'APP (platform)');
listFiles('app/(platform)/dashboard', 'APP Dashboard');
listFiles('app/leaderboard', 'APP Leaderboard');

// Components directories
listFiles('components/ui', 'COMPONENTS UI');
listFiles('components/providers', 'COMPONENTS Providers');
listFiles('components/wallet', 'COMPONENTS Wallet');
listFiles('components/layout', 'COMPONENTS Layout');
listFiles('components/lesson', 'COMPONENTS Lesson');

// Lib directories
console.log('\n\n');
console.log('=' .repeat(60));
console.log('LIB DIRECTORY');
console.log('='.repeat(60));
listFiles('lib', 'LIB Root');
listFiles('lib/types', 'LIB Types');
listFiles('lib/services', 'LIB Services');
listFiles('lib/store', 'LIB Store');

// Messages
listFiles('messages', 'MESSAGES');

// Tests
listFiles('__tests__', 'TESTS Root');
listFiles('__tests__/services', 'TESTS Services');

console.log('\n\n');
console.log('=' .repeat(60));
console.log('COMMON ISSUES TO CHECK:');
console.log('='.repeat(60));
console.log('1. ❌ Files have wrong names (like "components-ui-button.tsx" instead of "button.tsx")');
console.log('2. ❌ Files are in wrong directories');
console.log('3. ❌ File extensions are wrong (.txt instead of .tsx)');
console.log('4. ❌ Extra spaces in filenames');
console.log('5. ❌ Case sensitivity issues (Button.tsx vs button.tsx)');
console.log('\n');
console.log('📋 WHAT TO LOOK FOR:');
console.log('- In components/ui/ you should see: button.tsx, card.tsx, badge.tsx, etc.');
console.log('- NOT: components-ui-button.tsx');
console.log('\n');
console.log('If you see files with prefixes like "components-ui-", "lib-services-", etc.');
console.log('YOU NEED TO RENAME THEM!');
console.log('\n');

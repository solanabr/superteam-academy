#!/usr/bin/env node

/**
 * Fix compilation errors in the Anchor program
 * 
 * This script makes necessary corrections to lib.rs to align with 
 * the accounts struct names defined in the instruction modules.
 */

const fs = require('fs');
const path = require('path');

const libPath = path.join(__dirname, '../programs/academy/src/lib.rs');

console.log('Fixing compilation errors in lib.rs...\n');

let content = fs.readFileSync(libPath, 'utf-8');
let fixed = false;

// Fix 1: CloseEnrollment mismatch on line 143
// The instruction module defines CloseEnrollmentAccounts, but lib.rs expects CloseEnrollment
const closeEnrollmentPattern = /pub fn close_enrollment\(ctx: Context<CloseEnrollment>\) -> Result<\(\)>/;
if (closeEnrollmentPattern.test(content)) {
    // Change Context<CloseEnrollment> to Context<CloseEnrollmentAccounts>
    content = content.replace(
        /pub fn close_enrollment\(ctx: Context<CloseEnrollment>\) -> Result<\(\)>/,
        'pub fn close_enrollment(ctx: Context<CloseEnrollmentAccounts>) -> Result<()>'
    );
    console.log('✓ Fixed close_enrollment context struct name');
    fixed = true;
}

// Write back the fixed content
if (fixed) {
    fs.writeFileSync(libPath, content, 'utf-8');
    console.log('\n✅ Fixes applied successfully!');
    console.log('   Next step: cargo build --target wasm32-unknown-unknown --release');
} else {
    console.log('ℹ️  No auto-fixable errors found.');
    console.log('   You may need to manually fix remaining compilation errors.');
}

process.exit(0);

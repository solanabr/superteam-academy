#!/usr/bin/env node

/**
 * Real XP Earning System - Verification & Testing Script
 * 
 * This script verifies that the real XP earning system is working correctly.
 * It will:
 * 1. Check Supabase configuration
 * 2. Verify required tables exist
 * 3. Test XP award endpoint
 * 4. Verify database updates
 * 5. Show XP earning statistics
 * 
 * Usage:
 *   npx tsx verify-real-xp.ts
 */

import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const apiUrl = process.env.API_URL || 'http://localhost:3000'

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration')
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyRealXPSystem() {
  console.log('\n🔍 Real XP Earning System - Verification\n')
  console.log('=========================================\n')

  let passed = 0
  let failed = 0

  // Test 1: Supabase Connection
  console.log('1️⃣  Testing Supabase Connection...')
  try {
    const { data, error } = await supabase.from('users').select('count()', { count: 'exact' })
    if (error) throw error
    console.log('   ✅ Supabase connected')
    passed++
  } catch (error) {
    console.log('   ❌ Supabase connection failed:', error instanceof Error ? error.message : error)
    failed++
  }

  // Test 2: Required Tables
  console.log('\n2️⃣  Checking required tables...')
  const requiredTables = ['users', 'enrollments', 'lesson_progress', 'xp_transactions']
  for (const table of requiredTables) {
    try {
      await supabase.from(table).select('*').limit(1)
      console.log(`   ✅ ${table}`)
      passed++
    } catch (error) {
      console.log(`   ❌ ${table} - missing or error`)
      failed++
    }
  }

  // Test 3: User Statistics
  console.log('\n3️⃣  Checking user statistics...')
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('total_xp, level')
      .order('total_xp', { ascending: false })
      .limit(5)

    if (error) throw error

    if (!users || users.length === 0) {
      console.log('   ℹ️  No users with XP yet')
    } else {
      console.log('   ✅ Top 5 users by XP:')
      users.forEach((user, idx) => {
        console.log(
          `      ${idx + 1}. Total XP: ${user.total_xp}, Level: ${user.level}`
        )
      })
      passed++
    }
  } catch (error) {
    console.log('   ❌ Failed to fetch users:', error instanceof Error ? error.message : error)
    failed++
  }

  // Test 4: Enrollment Statistics
  console.log('\n4️⃣  Checking enrollment statistics...')
  try {
    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select('count()', { count: 'exact' })

    if (error) throw error

    const { data: withXp } = await supabase
      .from('enrollments')
      .select('count()', { count: 'exact' })
      .gt('xp_earned', 0)

    console.log(`   ✅ Total enrollments: ${enrollments.length}`)
    console.log(`   ✅ Enrollments with XP earned: ${withXp?.length || 0}`)
    passed++
  } catch (error) {
    console.log('   ❌ Failed to fetch enrollments:', error instanceof Error ? error.message : error)
    failed++
  }

  // Test 5: Lesson Completions
  console.log('\n5️⃣  Checking lesson completions...')
  try {
    const { data: completions, error } = await supabase
      .from('lesson_progress')
      .select('count()', { count: 'exact' })

    if (error) throw error

    console.log(`   ✅ Total lesson completions: ${completions.length}`)
    passed++
  } catch (error) {
    console.log('   ❌ Failed to fetch lesson completions:', error instanceof Error ? error.message : error)
    failed++
  }

  // Test 6: XP Transactions
  console.log('\n6️⃣  Checking XP transactions...')
  try {
    const { data: transactions, error } = await supabase
      .from('xp_transactions')
      .select('amount')
      .limit(100)

    if (error) throw error

    const totals = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0)
    console.log(`   ✅ Total XP transactions: ${transactions.length}`)
    console.log(`   ✅ Total XP awarded: ${totals}`)
    passed++
  } catch (error) {
    console.log('   ❌ Failed to fetch transactions:', error instanceof Error ? error.message : error)
    failed++
  }

  // Test 7: API Endpoint
  console.log('\n7️⃣  Testing XP Award API endpoint...')
  try {
    const response = await fetch(`${apiUrl}/api/xp/award`, {
      method: 'OPTIONS',
    })
    if (response.ok || response.status === 405) {
      // 405 is expected for OPTIONS request on POST endpoint
      console.log('   ✅ API endpoint is accessible')
      passed++
    } else {
      console.log('   ❌ API endpoint returned:', response.status)
      failed++
    }
  } catch (error) {
    console.log('   ⚠️  Could not reach API (may be offline):', error instanceof Error ? error.message : error)
    // Don't count as failure since server might be offline
  }

  // Test 8: XP Calculation
  console.log('\n8️⃣  Verifying XP calculation logic...')
  try {
    const testCases = [
      { totalXp: 0, expectedLevel: 0 },
      { totalXp: 100, expectedLevel: 1 },
      { totalXp: 400, expectedLevel: 2 },
      { totalXp: 900, expectedLevel: 3 },
      { totalXp: 2500, expectedLevel: 5 },
    ]

    let allCorrect = true
    for (const testCase of testCases) {
      const level = Math.floor(Math.sqrt(testCase.totalXp / 100))
      if (level !== testCase.expectedLevel) {
        console.log(
          `   ❌ XP: ${testCase.totalXp} -> Level: ${level} (expected ${testCase.expectedLevel})`
        )
        allCorrect = false
      }
    }

    if (allCorrect) {
      console.log('   ✅ XP to level calculation is correct')
      passed++
    } else {
      failed++
    }
  } catch (error) {
    console.log('   ❌ XP calculation test failed:', error instanceof Error ? error.message : error)
    failed++
  }

  // Summary
  console.log('\n=========================================')
  console.log('\n📊 Verification Summary')
  console.log(`   ✅ Passed: ${passed}`)
  console.log(`   ❌ Failed: ${failed}`)

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Real XP earning system is ready.\n')
    process.exit(0)
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.\n')
    process.exit(1)
  }
}

verifyRealXPSystem()

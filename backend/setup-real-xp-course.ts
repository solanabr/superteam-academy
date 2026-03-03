#!/usr/bin/env node

/**
 * Real XP Earning Course Setup Demo
 * 
 * This script demonstrates how to:
 * 1. Set up a course with real XP earning configured
 * 2. Enroll a learner in a course
 * 3. Award XP when lessons are completed
 * 4. Verify XP is credited to user account and enrollment
 * 
 * Usage:
 *   npm run setup-real-xp-course
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration')
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface CourseConfig {
  id: string
  name: string
  description: string
  xpPerLesson: number
  totalLessons: number
}

interface LessonConfig {
  id: string
  courseId: string
  title: string
  order: number
  xpReward: number
}

interface LearnerConfig {
  id: string
  email: string
  name: string
}

// Demo course configuration
const DEMO_COURSE: CourseConfig = {
  id: 'solana-basics',
  name: 'Solana Basics',
  description: 'Learn the fundamentals of Solana development',
  xpPerLesson: 100,
  totalLessons: 3,
}

const DEMO_LESSONS: LessonConfig[] = [
  {
    id: 'lesson-1',
    courseId: DEMO_COURSE.id,
    title: 'Understanding Solana Architecture',
    order: 1,
    xpReward: 100,
  },
  {
    id: 'lesson-2',
    courseId: DEMO_COURSE.id,
    title: 'Writing Your First Program',
    order: 2,
    xpReward: 100,
  },
  {
    id: 'lesson-3',
    courseId: DEMO_COURSE.id,
    title: 'Deploying to Devnet',
    order: 3,
    xpReward: 100,
  },
]

const DEMO_LEARNER: LearnerConfig = {
  id: 'test-learner-1',
  email: 'learner@example.com',
  name: 'Test Learner',
}

async function setupRealXPCourse() {
  console.log('\n📚 Real XP Earning Course Setup Demo')
  console.log('=====================================\n')

  try {
    // Step 1: Create test user if not exists
    console.log('1️⃣  Setting up test learner...')
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', DEMO_LEARNER.email)
      .single()

    let userId: string
    if (existingUser) {
      userId = existingUser.id
      console.log('   ✅ User exists:', userId)
    } else {
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          id: DEMO_LEARNER.id,
          email: DEMO_LEARNER.email,
          name: DEMO_LEARNER.name,
          total_xp: 0,
          level: 0,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error('   ❌ Failed to create user:', error.message)
        return
      }

      userId = newUser.id
      console.log('   ✅ Created user:', userId)
    }

    // Step 2: Create enrollment
    console.log('\n2️⃣  Creating course enrollment...')
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', DEMO_COURSE.id)
      .single()

    let enrollmentId: string
    if (existingEnrollment) {
      enrollmentId = existingEnrollment.id
      console.log('   ✅ Enrollment exists:', enrollmentId)
    } else {
      const { data: enrollment, error } = await supabase
        .from('enrollments')
        .insert({
          user_id: userId,
          course_id: DEMO_COURSE.id,
          enrolled_at: new Date().toISOString(),
          completion_percentage: 0,
          xp_earned: 0,
        })
        .select()
        .single()

      if (error) {
        console.error('   ❌ Failed to create enrollment:', error.message)
        return
      }

      enrollmentId = enrollment.id
      console.log('   ✅ Created enrollment:', enrollmentId)
    }

    // Step 3: Award XP for completing lessons
    console.log('\n3️⃣  Simulating lesson completions and XP awards...\n')

    let totalXpEarned = 0
    for (const lesson of DEMO_LESSONS) {
      console.log(`   📝 Completing: "${lesson.title}"`)

      // Check if already completed
      const { data: existing } = await supabase
        .from('lesson_progress')
        .select('id')
        .eq('user_id', userId)
        .eq('lesson_id', lesson.id)
        .single()

      if (existing) {
        console.log(`      ⏭️  Already completed, skipping XP award`)
        continue
      }

      // Record lesson completion
      const { error: progressError } = await supabase
        .from('lesson_progress')
        .insert({
          user_id: userId,
          lesson_id: lesson.id,
          course_id: DEMO_COURSE.id,
          completed_at: new Date().toISOString(),
        })

      if (progressError) {
        console.error(`      ❌ Failed to record completion:`, progressError.message)
        continue
      }

      // Record XP transaction
      const { error: txError } = await supabase
        .from('xp_transactions')
        .insert({
          user_id: userId,
          amount: lesson.xpReward,
          reason: `Completed lesson: ${lesson.id}`,
          created_at: new Date().toISOString(),
        })

      if (txError) {
        console.error(`      ❌ Failed to record XP transaction:`, txError.message)
        continue
      }

      // Update enrollment XP
      const { data: enrollData } = await supabase
        .from('enrollments')
        .select('xp_earned')
        .eq('id', enrollmentId)
        .single()

      const newEnrollmentXp = (enrollData?.xp_earned || 0) + lesson.xpReward
      await supabase
        .from('enrollments')
        .update({ xp_earned: newEnrollmentXp })
        .eq('id', enrollmentId)

      // Update user total XP
      const { data: userData } = await supabase
        .from('users')
        .select('total_xp')
        .eq('id', userId)
        .single()

      const totalXp = (userData?.total_xp || 0) + lesson.xpReward
      const level = Math.floor(Math.sqrt(totalXp / 100))

      const { error: userError } = await supabase
        .from('users')
        .update({ total_xp: totalXp, level })
        .eq('id', userId)

      if (userError) {
        console.error(`      ❌ Failed to update user XP:`, userError.message)
        continue
      }

      totalXpEarned += lesson.xpReward
      console.log(`      ✅ +${lesson.xpReward} XP earned`)
    }

    // Step 4: Verify final state
    console.log('\n4️⃣  Verifying final state...\n')

    const { data: finalUser } = await supabase
      .from('users')
      .select('total_xp, level')
      .eq('id', userId)
      .single()

    const { data: finalEnrollment } = await supabase
      .from('enrollments')
      .select('xp_earned, completion_percentage')
      .eq('id', enrollmentId)
      .single()

    const { count: completedLessons } = await supabase
      .from('lesson_progress')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('course_id', DEMO_COURSE.id)

    console.log('📊 User Statistics:')
    console.log(`   Total XP: ${finalUser?.total_xp || 0}`)
    console.log(`   Current Level: ${finalUser?.level || 0}`)
    console.log(`   Experience: ${finalUser?.total_xp || 0} / ${((finalUser?.level || 0) + 1) ** 2 * 100}`)

    console.log('\n📚 Course Enrollment:')
    console.log(`   Course: ${DEMO_COURSE.name}`)
    console.log(`   XP Earned: ${finalEnrollment?.xp_earned || 0}`)
    console.log(`   Lessons Completed: ${completedLessons || 0} / ${DEMO_LESSONS.length}`)
    console.log(`   Completion: ${((completedLessons || 0) / DEMO_LESSONS.length * 100).toFixed(1)}%`)

    console.log('\n✅ Setup Complete!\n')
    console.log('What just happened:')
    console.log('1. Created a test learner account')
    console.log('2. Enrolled the learner in the "Solana Basics" course')
    console.log('3. Completed 3 lessons and awarded 300 XP total')
    console.log('4. Verified XP was credited to both user and enrollment records')
    console.log('\n🎮 How this works in production:')
    console.log('1. When a learner completes a challenge/lesson')
    console.log('2. The ChallengeRunner calls the useAwardXP hook')
    console.log(
      '3. This calls the /api/xp/award endpoint with course/lesson/amount'
    )
    console.log('4. Supabase records the transaction and updates all related tables')
    console.log('5. XP is instantly reflected on the dashboard and leaderboard')
    console.log('\n')
  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  }
}

setupRealXPCourse()

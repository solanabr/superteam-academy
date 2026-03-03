import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function createTestData() {
  console.log('🔧 Creating test data...\n')

  try {
    // 1. Create test user
    console.log('📝 Creating user...')
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert(
        {
          id: 'user-1',
          username: 'testuser',
          email: 'test@example.com',
          display_name: 'Test User',
          wallet_address: '11111111111111111111111111111112',
          total_xp: 0,
          level: 0,
        },
        { onConflict: 'id' }
      )
      .select()

    if (userError) {
      console.error('❌ User creation failed:', userError)
    } else {
      console.log('✅ User created:', userData)
    }

    // 2. Create enrollment record
    console.log('\n📍 Creating enrollment...')
    const enrollmentId = `enrollment-user-1-c1`
    const { data: enrollData, error: enrollError } = await supabase
      .from('enrollments')
      .upsert(
        {
          id: enrollmentId,
          user_id: 'user-1',
          course_id: 'c1',
          lessons_completed: 0,
          total_xp_earned: 0,
        },
        { onConflict: 'id' }
      )
      .select()

    if (enrollError) {
      console.error('❌ Enrollment creation failed:', enrollError)
    } else {
      console.log('✅ Enrollment created:', enrollData)
    }

    console.log('\n✨ Test data ready!\n')
    console.log('📊 You can now test with:')
    console.log('curl -X POST http://localhost:3001/api/xp/award \\')
    console.log('  -H "Content-Type: application/json" \\')
    console.log('  -d \'{"userId":"user-1","courseId":"c1","lessonId":"l1","xpAmount":100}\'')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

createTestData()

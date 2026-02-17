'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { useRouter } from '@/i18n/routing'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export function EnrollButton({ 
  courseId, 
  firstLessonHref, 
  label,
  className 
}: { 
  courseId: string; 
  firstLessonHref: string; 
  label: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function onClick() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const url = typeof window !== 'undefined' ? `${window.location.origin}/api/enroll` : '/api/enroll'
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ courseId })
      })
      
      if (!response.ok) {
        console.error('Enrollment failed:', await response.text())
      }
      router.push(firstLessonHref)
    } catch (error) {
      console.error('Error during enrollment:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      size="lg" 
      className={cn(
        "h-14 px-8 text-lg font-bold rounded-xl shadow-[0_0_20px_rgba(20,241,149,0.2)] hover:shadow-[0_0_30px_rgba(20,241,149,0.3)] transition-all",
        className
      )} 
      onClick={onClick} 
      disabled={loading}
    >
      {label}
      <ArrowRight className="ml-2 h-5 w-5" />
    </Button>
  )
}

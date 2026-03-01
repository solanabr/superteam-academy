"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: true,
      persistSession: true,
    }
  }
)

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      const { data, error } = await supabase.auth.getSession()
      
      if (data.session) {
        router.push('/dashboard')
        return
      }

      // Handle hash fragment for implicit flow
      const hashParams = new URLSearchParams(
        window.location.hash.substring(1)
      )
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      if (accessToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        })
        router.push('/dashboard')
        return
      }

      router.push('/')
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-[#020202] flex items-center justify-center">
      <div className="text-center">
        <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-6">
          // AUTHENTICATING
        </div>
        <div className="flex items-center gap-2 justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-[#9945ff] animate-bounce" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#9945ff] animate-bounce [animation-delay:0.1s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#9945ff] animate-bounce [animation-delay:0.2s]" />
        </div>
      </div>
    </div>
  )
}
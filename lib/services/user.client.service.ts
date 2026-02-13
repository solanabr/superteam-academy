import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

export class UserClientService {
  async getProfile(userId: string): Promise<Profile | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) return null
    return data as Profile
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()
    if (error) return null
    return data as Profile
  }
}

export const userClientService = new UserClientService()

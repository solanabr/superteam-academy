import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProgressBar } from '@/components/ui/progress-bar'
import { Badge } from '@/components/ui/badge'
import { Flame, Star, Trophy, Wallet } from 'lucide-react'
import { Link } from '@/i18n/routing'

type Props = {
  params: Promise<{ locale: string; username: string }>
}

function formatWallet(wallet?: string | null) {
  if (!wallet) return null
  if (wallet.length <= 16) return wallet
  return `${wallet.slice(0, 6)}...${wallet.slice(-6)}`
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params
  const identifier = username?.trim()
  const supabase = await createClient()

  const profileFields = 'id, username, bio, avatar_url, wallet_address, created_at'
  let profile: any = null

  const usernameLookup = await supabase
    .from('profiles')
    .select(profileFields)
    .ilike('username', identifier)
    .maybeSingle()

  if (usernameLookup.data) {
    profile = usernameLookup.data
  } else {
    const walletLookup = await supabase
      .from('profiles')
      .select(profileFields)
      .eq('wallet_address', identifier)
      .maybeSingle()

    if (walletLookup.data) {
      profile = walletLookup.data
    } else {
      const idLookup = await supabase
        .from('profiles')
        .select(profileFields)
        .eq('id', identifier)
        .maybeSingle()
      profile = idLookup.data || null
    }
  }

  if (!profile) {
    notFound()
  }

  const [{ data: progress }, { data: enrollments }] = await Promise.all([
    supabase
      .from('user_progress')
      .select('total_xp, level, current_streak')
      .eq('user_id', profile.id)
      .single(),
    supabase
      .from('enrollments')
      .select('progress_percentage, completed_at')
      .eq('user_id', profile.id)
  ])

  const totalXp = progress?.total_xp || 0
  const level = progress?.level || 1
  const streak = progress?.current_streak || 0
  const completedCourses = (enrollments || []).filter((e) => Boolean(e.completed_at)).length
  const inProgressCourses = (enrollments || []).filter((e) => !e.completed_at).length
  const levelCap = (level + 1) * (level + 1) * 100
  const levelProgress = Math.max(0, Math.min(100, Math.round((totalXp / Math.max(1, levelCap)) * 100)))

  return (
    <div className="container py-12 space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Public Profile</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">{profile.username || 'Learner'}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{profile.bio || 'Solana builder in training.'}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-white/20 bg-black/20">
            <Wallet className="mr-1 h-3.5 w-3.5" />
            {formatWallet(profile.wallet_address) || 'Wallet not linked'}
          </Badge>
          <Badge variant="outline" className="border-white/20 bg-black/20">
            Joined {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : '-'}
          </Badge>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">XP</p>
          <p className="text-3xl font-black">{totalXp.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">Level</p>
          <p className="flex items-center gap-2 text-3xl font-black"><Star className="h-5 w-5 text-violet-400" />{level}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">Streak</p>
          <p className="flex items-center gap-2 text-3xl font-black"><Flame className="h-5 w-5 text-orange-400" />{streak}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">Completed</p>
          <p className="flex items-center gap-2 text-3xl font-black"><Trophy className="h-5 w-5 text-primary" />{completedCourses}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xl font-black">Level Progress</p>
          <p className="text-sm text-muted-foreground">{levelProgress}%</p>
        </div>
        <ProgressBar progress={levelProgress} showLabel={false} className="h-3 rounded-full bg-white/10" />
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xl font-black">Course Stats</p>
          <Link href="/leaderboard" className="text-xs font-bold uppercase tracking-widest text-primary">View Leaderboard</Link>
        </div>
        <p className="text-sm text-muted-foreground">{completedCourses} completed courses | {inProgressCourses} active enrollments</p>
      </section>
    </div>
  )
}

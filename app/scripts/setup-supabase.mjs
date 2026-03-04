import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const migrations = [
  // 1. Profiles table
  `CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    language TEXT NOT NULL DEFAULT 'en',
    theme TEXT NOT NULL DEFAULT 'dark',
    is_public BOOLEAN NOT NULL DEFAULT true,
    social_twitter TEXT,
    social_github TEXT,
    social_discord TEXT,
    social_website TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public profiles are viewable by everyone' AND tablename = 'profiles') THEN
      CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (is_public = true);
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own profile' AND tablename = 'profiles') THEN
      CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own profile' AND tablename = 'profiles') THEN
      CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own profile' AND tablename = 'profiles') THEN
      CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
    END IF;
  END $$`,

  // Auto-create profile on signup trigger
  `CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO public.profiles (id, display_name, avatar_url)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
    );
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public`,

  `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users`,
  `CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()`,

  // 2. Linked wallets
  `CREATE TABLE IF NOT EXISTS public.linked_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    label TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, wallet_address)
  )`,
  `ALTER TABLE public.linked_wallets ENABLE ROW LEVEL SECURITY`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own wallets' AND tablename = 'linked_wallets') THEN
      CREATE POLICY "Users can view their own wallets" ON public.linked_wallets FOR SELECT USING (auth.uid() = user_id);
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own wallets' AND tablename = 'linked_wallets') THEN
      CREATE POLICY "Users can insert their own wallets" ON public.linked_wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own wallets' AND tablename = 'linked_wallets') THEN
      CREATE POLICY "Users can update their own wallets" ON public.linked_wallets FOR UPDATE USING (auth.uid() = user_id);
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own wallets' AND tablename = 'linked_wallets') THEN
      CREATE POLICY "Users can delete their own wallets" ON public.linked_wallets FOR DELETE USING (auth.uid() = user_id);
    END IF;
  END $$`,

  // 3. Enrollments
  `CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL,
    lesson_progress BIGINT NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    UNIQUE(user_id, course_id)
  )`,
  `ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own enrollments' AND tablename = 'enrollments') THEN
      CREATE POLICY "Users can view their own enrollments" ON public.enrollments FOR SELECT USING (auth.uid() = user_id);
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own enrollments' AND tablename = 'enrollments') THEN
      CREATE POLICY "Users can insert their own enrollments" ON public.enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own enrollments' AND tablename = 'enrollments') THEN
      CREATE POLICY "Users can update their own enrollments" ON public.enrollments FOR UPDATE USING (auth.uid() = user_id);
    END IF;
  END $$`,

  // 4. XP events
  `CREATE TABLE IF NOT EXISTS public.xp_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    course_id TEXT,
    lesson_index INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own XP events' AND tablename = 'xp_events') THEN
      CREATE POLICY "Users can view their own XP events" ON public.xp_events FOR SELECT USING (auth.uid() = user_id);
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own XP events' AND tablename = 'xp_events') THEN
      CREATE POLICY "Users can insert their own XP events" ON public.xp_events FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
  END $$`,

  // 5. User XP summary
  `CREATE TABLE IF NOT EXISTS public.user_xp (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    total_xp INTEGER NOT NULL DEFAULT 0,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_active_date DATE,
    achievements BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view user XP for leaderboard' AND tablename = 'user_xp') THEN
      CREATE POLICY "Anyone can view user XP for leaderboard" ON public.user_xp FOR SELECT USING (true);
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own XP record' AND tablename = 'user_xp') THEN
      CREATE POLICY "Users can insert their own XP record" ON public.user_xp FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own XP record' AND tablename = 'user_xp') THEN
      CREATE POLICY "Users can update their own XP record" ON public.user_xp FOR UPDATE USING (auth.uid() = user_id);
    END IF;
  END $$`,

  // Auto-create user_xp row when profile is created
  `CREATE OR REPLACE FUNCTION public.handle_new_profile()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO public.user_xp (user_id) VALUES (NEW.id);
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public`,

  `DROP TRIGGER IF EXISTS on_profile_created ON public.profiles`,
  `CREATE TRIGGER on_profile_created AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile()`,

  // Indexes
  `CREATE INDEX IF NOT EXISTS idx_user_xp_total ON public.user_xp (total_xp DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_xp_events_user ON public.xp_events (user_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_enrollments_user ON public.enrollments (user_id)`,
];

async function setup() {
  console.log("Setting up Supabase tables for Caminho...\n");

  for (let i = 0; i < migrations.length; i++) {
    const sql = migrations[i];
    const label = sql.trim().substring(0, 60).replace(/\n/g, " ");
    process.stdout.write(`  [${i + 1}/${migrations.length}] ${label}... `);

    const { error } = await supabase.rpc("exec_sql", { sql_query: sql }).single();

    if (error) {
      // Try direct fetch as fallback
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ sql_query: sql }),
        }
      );

      if (!res.ok) {
        // Use the management API
        const mgmtRes = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/pg/query`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({ query: sql }),
          }
        );
        if (!mgmtRes.ok) {
          console.log(`SKIP (will try SQL Editor)`);
          continue;
        }
      }
    }
    console.log("OK");
  }

  console.log("\n✓ Setup complete!");
}

setup().catch(console.error);

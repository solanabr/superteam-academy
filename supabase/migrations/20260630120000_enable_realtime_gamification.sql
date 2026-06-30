-- Enable Supabase Realtime for the gamification tables.
--
-- The client (hooks/use-gamification-events.ts, mounted globally via
-- GamificationOverlays) subscribes to postgres_changes on these tables and
-- dispatches the XP / level-up / achievement / certificate popups. The rows are
-- written by the Helius webhook handler. Without the tables in the
-- `supabase_realtime` publication, those INSERT/UPDATE events are never
-- delivered to the browser, so completing a lesson awards XP but shows no
-- animation. Supabase tables are NOT realtime-enabled by default and no prior
-- migration added them.
--
-- Idempotent: only adds tables not already members of the publication, so it is
-- safe to re-run and safe if some tables were toggled on via the dashboard.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'xp_transactions',
    'user_xp',
    'user_achievements',
    'certificates'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

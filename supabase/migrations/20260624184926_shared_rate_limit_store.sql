-- ============================================
-- Shared rate-limit store (P1-7)
-- ============================================
-- In-memory Map limiters only bound a single serverless instance, so limits
-- don't hold across Vercel isolates. Move to a Supabase-backed fixed-window
-- counter that is atomic and shared across all instances.
--
-- check_rate_limit() is the only access path; the table is service_role-only
-- (RLS on, no policies). Callers go through lib/rate-limit.ts using the admin
-- client.

CREATE TABLE IF NOT EXISTS rate_limits (
  key          TEXT        NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count        INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (key, window_start)
);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role (which bypasses RLS) may touch this table.

-- Atomic fixed-window limiter. Returns TRUE when the caller is OVER budget for
-- the current window (i.e. should be rejected), having counted this request.
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key            TEXT,
  p_max_tokens     INT,
  p_window_seconds INT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_count        INT;
BEGIN
  -- Bucket now() into a fixed window of p_window_seconds.
  v_window_start := to_timestamp(
    floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds
  );

  -- Drop this key's older windows so the table stays bounded (~one row per
  -- active key).
  DELETE FROM public.rate_limits
  WHERE key = p_key AND window_start < v_window_start;

  INSERT INTO public.rate_limits (key, window_start, count)
  VALUES (p_key, v_window_start, 1)
  ON CONFLICT (key, window_start)
  DO UPDATE SET count = public.rate_limits.count + 1
  RETURNING count INTO v_count;

  RETURN v_count > p_max_tokens;
END;
$$;

REVOKE ALL ON FUNCTION check_rate_limit(TEXT, INT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit(TEXT, INT, INT) TO service_role;

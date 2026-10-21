-- Platform spend ledger: one row per Solana transaction the server sends or
-- co-signs, so every lamport the platform pays on-chain is accounted for.
--
-- A row is written PENDING right after broadcast (signature, action, payer,
-- learner context) and SETTLED later by the on-chain queue cron, which reads
-- the confirmed transaction and fills the amounts:
--   * fee_lamports    — the network fee, when a platform key paid it;
--   * rent_lamports   — other lamports platform keys spent (account rent),
--                       summed across every platform key in the transaction;
--   * refund_lamports — lamports platform keys received back (closed accounts).
--
-- It also enforces the sponsorship rule: a wallet gets at most one sponsored
-- `enroll` per course generation of a program, ever. A pending (in flight) or
-- confirmed `enroll_sponsor` row holds the slot; a failed, expired or
-- superseded one frees it. The key carries the program id and the on-chain
-- `Course.generation`, so a recreated course or a program move starts fresh.
-- `enroll_sponsor_reenroll` (re-initialising a stale enrollment from a
-- superseded generation, which costs only a fee) has its own slot, so it never
-- uses up the generation's sponsorship.
--
-- `superseded`: a pending sponsorship the learner abandoned (no on-chain trace
-- when they asked again). Settlement still follows it. If it lands after all
-- it becomes `superseded_landed`: its spend is recorded and the app counts it
-- as a used slot, but it stays out of the unique index, so it can never
-- collide with the replacement that holds the slot.
--
-- `platform_alert_state` + `claim_platform_alert()` throttle the cron's balance
-- snapshots and low-balance alerts across serverless invocations.
--
-- Service-role only: RLS on with no policies, plus explicit REVOKEs. Additive
-- and idempotent.

BEGIN;

CREATE TABLE IF NOT EXISTS public.platform_spend (
  id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  signature               TEXT NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  action                  TEXT NOT NULL,
  user_id                 UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  wallet                  TEXT,
  course_id               TEXT,
  program_id              TEXT,
  course_generation       BIGINT,
  payer                   TEXT NOT NULL,
  payer_role              TEXT NOT NULL,
  fee_lamports            BIGINT,
  rent_lamports           BIGINT,
  refund_lamports         BIGINT,
  cluster                 TEXT NOT NULL,
  status                  TEXT NOT NULL DEFAULT 'pending',
  last_valid_block_height BIGINT,
  settled_at              TIMESTAMPTZ,
  CONSTRAINT platform_spend_signature_key UNIQUE (signature),
  CONSTRAINT platform_spend_action_check
    CHECK (action ~ '^[a-z][a-z_]{0,39}$'),
  CONSTRAINT platform_spend_payer_role_check
    CHECK (payer_role IN ('sponsor', 'backend', 'authority')),
  CONSTRAINT platform_spend_status_check
    CHECK (
      status IN (
        'pending', 'confirmed', 'failed', 'expired',
        'superseded', 'superseded_landed'
      )
    ),
  CONSTRAINT platform_spend_amounts_check
    CHECK (
      COALESCE(fee_lamports, 0) >= 0
      AND COALESCE(rent_lamports, 0) >= 0
      AND COALESCE(refund_lamports, 0) >= 0
    ),
  -- The once-per index below keys on these; a NULL in any of them would make
  -- every such row distinct and bypass it.
  CONSTRAINT platform_spend_enroll_sponsor_keys_check
    CHECK (
      action NOT IN ('enroll_sponsor', 'enroll_sponsor_reenroll')
      OR (
        wallet IS NOT NULL
        AND course_id IS NOT NULL
        AND program_id IS NOT NULL
        AND course_generation IS NOT NULL
      )
    )
);

-- At most one live sponsorship per action, cluster, program, wallet, course
-- and course generation.
CREATE UNIQUE INDEX IF NOT EXISTS platform_spend_enroll_sponsor_once
  ON public.platform_spend
    (action, cluster, program_id, wallet, course_id, course_generation)
  WHERE action IN ('enroll_sponsor', 'enroll_sponsor_reenroll')
    AND status IN ('pending', 'confirmed');

-- The settle sweep reads the oldest unsettled rows.
CREATE INDEX IF NOT EXISTS platform_spend_unsettled_idx
  ON public.platform_spend (created_at)
  WHERE status IN ('pending', 'superseded');

CREATE INDEX IF NOT EXISTS platform_spend_user_id_idx
  ON public.platform_spend (user_id);

ALTER TABLE public.platform_spend ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_spend FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS public.platform_alert_state (
  key           TEXT PRIMARY KEY,
  last_fired_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE public.platform_alert_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_alert_state FROM PUBLIC, anon, authenticated;

-- True when the caller may fire `p_key` now: it was never fired, or last fired
-- more than `p_min_interval_seconds` ago. Claiming stamps the time in the same
-- statement, so two concurrent cron runs cannot both fire.
CREATE OR REPLACE FUNCTION public.claim_platform_alert(
  p_key                  TEXT,
  p_min_interval_seconds INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_claimed BOOLEAN;
BEGIN
  INSERT INTO public.platform_alert_state AS s (key, last_fired_at)
  VALUES (p_key, now())
  ON CONFLICT (key) DO UPDATE
    SET last_fired_at = now()
    WHERE s.last_fired_at < now() - make_interval(secs => p_min_interval_seconds)
  RETURNING true INTO v_claimed;
  RETURN COALESCE(v_claimed, false);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_platform_alert(TEXT, INTEGER)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_platform_alert(TEXT, INTEGER)
  TO service_role;

COMMIT;

/**
 * What deleting an account does to every table. `delete_account_data` is the
 * implementation; this is the list a new table has to join.
 * `__tests__/deletion-policy.test.ts` replays the migrations and fails when a table,
 * a column pointing at a person, or any text or JSON column has no decision here.
 *
 * Deleted accounts are anonymized, not removed. The row ids stay so on-chain
 * records, aggregates and idempotency keys keep working, and nothing left on the
 * row says who the id belonged to.
 *
 * On-chain references (`tx_signature`, `signature`, `mint_address`, `asset_address`)
 * are kept on purpose. They point at public chain records that can't be removed, and
 * idempotency and verification rely on them. A chain record can lead to a wallet, but
 * the row no longer leads to a person.
 */

export type TableDecision =
  /** The account's rows are removed. */
  | "delete"
  /** The row stays; the columns marked `scrub` are cleared or rewritten. */
  | "scrub"
  /** The row stays as is; what it holds is not identifying once the rest is gone. */
  | "keep"
  /** Platform data with no column about a person. */
  | "no_user_data";

export type ColumnDecision = "scrub" | "keep";

export interface TablePolicy {
  decision: TableDecision;
  why: string;
  columns?: Record<string, ColumnDecision>;
}

export const DELETION_POLICY: Record<string, TablePolicy> = {
  profiles: {
    decision: "scrub",
    why: "The tombstone row stays as the parent of everything kept; every personal value goes.",
    columns: {
      id: "keep",
      created_at: "keep",
      name_rerolls_used: "keep",
      deleted_at: "keep",
      deletion_requested_at: "keep",
      username: "scrub",
      display_name: "scrub",
      bio: "scrub",
      avatar_url: "scrub",
      social_links: "scrub",
      wallet_address: "scrub",
      wallet_kind: "scrub",
      wallet_xp_synced_at: "scrub",
      google_id: "scrub",
      github_id: "scrub",
      is_public: "scrub",
      verified: "scrub",
      verified_kind: "scrub",
      segment: "scrub",
      goal: "scrub",
      daily_goal: "scrub",
      prefs: "scrub",
      referral_code: "scrub",
      referred_by: "scrub",
    },
  },
  threads: {
    decision: "keep",
    why: "Owner decision: forum posts stay and show as a deleted user. The text is kept as written.",
    columns: {
      author_id: "keep",
      title: "keep",
      body: "keep",
      slug: "keep",
      short_id: "keep",
      type: "keep",
      course_id: "keep",
      lesson_id: "keep",
    },
  },
  answers: {
    decision: "keep",
    why: "Owner decision: forum posts stay and show as a deleted user. The text is kept as written.",
    columns: { author_id: "keep", body: "keep" },
  },
  votes: {
    decision: "keep",
    why: "Vote scores on other people's posts are derived from these rows.",
    columns: { user_id: "keep" },
  },
  flags: {
    decision: "scrub",
    why: "Moderators keep the report; the reporter's free text goes.",
    columns: {
      reporter_id: "keep",
      resolved_by: "keep",
      reason: "keep",
      status: "keep",
      details: "scrub",
    },
  },
  moderation_actions: {
    decision: "keep",
    why: "Moderation history, written about content rather than the actor's identity.",
    columns: { actor_id: "keep", action: "keep" },
  },
  thread_views: {
    decision: "delete",
    why: "Reading history. threads.view_count is its own counter and doesn't depend on it.",
    columns: { user_id: "keep" },
  },
  enrollments: {
    decision: "scrub",
    why: "Mirrors on-chain state, so the row stays; its wallet copy goes.",
    columns: {
      user_id: "keep",
      course_id: "keep",
      wallet_address: "scrub",
      tx_signature: "keep",
    },
  },
  user_progress: {
    decision: "keep",
    why: "Lesson bits the program refuses to re-set, and course completion counts.",
    columns: {
      user_id: "keep",
      course_id: "keep",
      lesson_id: "keep",
      tx_signature: "keep",
    },
  },
  user_xp: {
    decision: "keep",
    why: "Global totals. Public reads and leaderboards already skip tombstones.",
    columns: { user_id: "keep" },
  },
  xp_transactions: {
    decision: "keep",
    why: "Idempotency keys that stop an award landing twice.",
    columns: {
      user_id: "keep",
      reason: "keep",
      source: "keep",
      idempotency_key: "keep",
      tx_signature: "keep",
    },
  },
  user_achievements: {
    decision: "keep",
    why: "Mirrors minted on-chain assets and keeps their idempotency.",
    columns: {
      user_id: "keep",
      achievement_id: "keep",
      asset_address: "keep",
      tx_signature: "keep",
    },
  },
  user_daily_quests: {
    decision: "keep",
    why: "xp_granted is the idempotency guard for quest awards; holds no personal value.",
    columns: { user_id: "keep", quest_id: "keep" },
  },
  certificates: {
    decision: "keep",
    why: "Mirrors the on-chain credential, which stays. Its page on the Academy goes away, because public reads of this table skip tombstones.",
    columns: {
      user_id: "keep",
      course_id: "keep",
      course_title: "keep",
      credential_type: "keep",
      metadata_uri: "keep",
      mint_address: "keep",
      tx_signature: "keep",
    },
  },
  nft_metadata: {
    decision: "scrub",
    why: "Serves the on-chain credential's metadata, so the row stays and its Recipient becomes a neutral label. A copy pinned to permanent storage can't be changed, so new credentials name only the wallet.",
    columns: { data: "scrub" },
  },
  deployed_programs: {
    decision: "delete",
    why: "Only read to gate a live learner's capstone; the program id leads to a wallet.",
    columns: {
      user_id: "keep",
      course_id: "keep",
      lesson_id: "keep",
      program_id: "keep",
      network: "keep",
    },
  },
  pending_onchain_actions: {
    decision: "scrub",
    why: "Nothing can be delivered without a wallet: rows resolve and lose payload and error text. The unique key stays.",
    columns: {
      user_id: "keep",
      action_type: "keep",
      reference_id: "keep",
      payload: "scrub",
      last_error: "scrub",
    },
  },
  platform_spend: {
    decision: "scrub",
    why: "Spend totals stay. The wallet goes; sponsored rows keep a one-way key so a wallet is still sponsored only once.",
    columns: {
      user_id: "keep",
      wallet: "scrub",
      signature: "keep",
      action: "keep",
      course_id: "keep",
      program_id: "keep",
      payer: "keep",
      payer_role: "keep",
      cluster: "keep",
      status: "keep",
    },
  },
  challenge_assists: {
    decision: "scrub",
    why: "Conversation text goes; the usage counters stay for spend accounting.",
    columns: { user_id: "keep", lesson_id: "keep", chat_log: "scrub" },
  },
  review_items: {
    decision: "delete",
    why: "Personal study schedule with no use after deletion.",
    columns: { user_id: "keep", item_key: "keep" },
  },
  streak_freezes_used: {
    decision: "delete",
    why: "Personal calendar data with no use after deletion.",
    columns: { user_id: "keep" },
  },
  league_members: {
    decision: "keep",
    why: "Cohort boards and member counts; boards already anonymize deleted members.",
    columns: { user_id: "keep" },
  },
  email_subscriptions: {
    decision: "scrub",
    why: "Consent ends and the row stays as the dated record of the opt-out.",
    columns: { user_id: "keep", reminder_locale: "scrub" },
  },
  email_reminder_log: {
    decision: "delete",
    why: "Send ledger; no mail goes to a deleted account again.",
    columns: { user_id: "keep", kind: "keep" },
  },
  referral_events: {
    decision: "keep",
    why: "One row is the other person's point. Holds only ids once the profile's code and link are gone.",
    columns: {
      referrer_id: "keep",
      referred_id: "keep",
      kind: "keep",
      course_id: "keep",
    },
  },
  admin_users: {
    decision: "delete",
    why: "Admin rights end with the account.",
    columns: { user_id: "keep", granted_by: "keep" },
  },
  rate_limits: {
    decision: "scrub",
    why: "Rows keyed on the account id are removed. IP-keyed rows hold no account id and expire on their own.",
    columns: { key: "scrub" },
  },
  siws_nonces: {
    decision: "scrub",
    why: "A consumed nonce must stay consumed; its wallet and IP go.",
    columns: {
      nonce: "keep",
      status: "keep",
      wallet_address: "scrub",
      ip_address: "scrub",
    },
  },
  ai_spend_ledger: {
    decision: "scrub",
    why: "The account's rows go. IP rows hold no account id, so purge_ai_spend_ip_rows removes them by age.",
    columns: { scope: "keep", scope_key: "scrub" },
  },
  course_changelog: {
    decision: "no_user_data",
    why: "Course history.",
    columns: {
      course_id: "keep",
      kind: "keep",
      detail: "keep",
      tx_signature: "keep",
    },
  },
  forum_categories: {
    decision: "no_user_data",
    why: "Platform content.",
    columns: { name: "keep", slug: "keep", description: "keep" },
  },
  league_cohorts: {
    decision: "no_user_data",
    why: "Cohort totals.",
  },
  league_tiers: {
    decision: "no_user_data",
    why: "Configuration.",
  },
  onchain_deployments: {
    decision: "no_user_data",
    why: "Course and achievement deployment state.",
    columns: {
      content_id: "keep",
      kind: "keep",
      status: "keep",
      course_pda: "keep",
      tx_signature: "keep",
      collection_address: "keep",
      track_collection_address: "keep",
      achievement_pda: "keep",
    },
  },
  platform_alert_state: {
    decision: "no_user_data",
    why: "Alert throttling.",
    columns: { key: "keep" },
  },
  platform_freeze: {
    decision: "no_user_data",
    why: "Configuration.",
    columns: { reason: "keep" },
  },
  referral_seasons: {
    decision: "no_user_data",
    why: "Configuration.",
  },
  review_schedule: {
    decision: "no_user_data",
    why: "Configuration.",
  },
};

/** What deleting an account does to each Storage bucket. */
export const DELETION_STORAGE_BUCKETS: Record<string, string> = {
  avatars:
    "The account's folder is removed by the deletion route, and by the account-retention cron if the route couldn't.",
};

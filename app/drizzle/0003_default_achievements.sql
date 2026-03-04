INSERT INTO "achievements" (
  "achievement_id",
  "name",
  "metadata_uri",
  "image_url",
  "xp_reward",
  "supply_cap",
  "current_supply",
  "is_active",
  "criteria_type",
  "criteria_value"
)
VALUES (
  'registration_congrats',
  'Welcome to Superteam Academy',
  'achievement:registration_congrats',
  NULL,
  100,
  NULL,
  0,
  TRUE,
  'registration',
  NULL
)
ON CONFLICT ("achievement_id") DO NOTHING;

INSERT INTO "achievements" (
  "achievement_id",
  "name",
  "metadata_uri",
  "image_url",
  "xp_reward",
  "supply_cap",
  "current_supply",
  "is_active",
  "criteria_type",
  "criteria_value"
)
VALUES (
  'all_accounts_linked',
  'All accounts linked',
  'achievement:all_accounts_linked',
  NULL,
  300,
  NULL,
  0,
  TRUE,
  'all_accounts_linked',
  NULL
)
ON CONFLICT ("achievement_id") DO NOTHING;


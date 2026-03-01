-- Track whether user has completed or skipped onboarding
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarded BOOLEAN DEFAULT false;

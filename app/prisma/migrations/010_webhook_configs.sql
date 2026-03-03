-- Migration 010: Webhook Configs
-- Stores registered webhook endpoints for event delivery

CREATE TABLE IF NOT EXISTS webhook_configs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url         TEXT NOT NULL,
    secret      TEXT NOT NULL,
    events      TEXT[] NOT NULL DEFAULT '{}',
    active      BOOLEAN DEFAULT true,
    created_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_webhook_configs_active ON webhook_configs(active);

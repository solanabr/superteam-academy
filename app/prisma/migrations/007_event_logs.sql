-- Event Logs table for storing on-chain program events
-- Used by the Event Listener service for analytics and recovery

CREATE TABLE IF NOT EXISTS event_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    tx_hash TEXT NOT NULL,
    slot INTEGER NOT NULL DEFAULT 0,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data JSONB NOT NULL DEFAULT '{}',
    processed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_event_logs_event_type ON event_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_event_logs_tx_hash ON event_logs(tx_hash);
CREATE INDEX IF NOT EXISTS idx_event_logs_timestamp ON event_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_event_logs_processed ON event_logs(processed) WHERE processed = false;

-- Composite index for recovery queries
CREATE INDEX IF NOT EXISTS idx_event_logs_type_timestamp ON event_logs(event_type, timestamp DESC);

// Builds an in-process Postgres (pglite) from EVERY migration in apply order,
// so a test sees the real tables, constraints and triggers rather than a stub of
// them. Only what Supabase provides outside the migrations is stubbed; the auth
// columns match the production catalog.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

export function findRepoRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  while (!existsSync(resolve(dir, "supabase/schema.sql"))) {
    const parent = dirname(dir);
    if (parent === dir)
      throw new Error("repo root (supabase/schema.sql) not found");
    dir = parent;
  }
  return dir;
}

const SUPABASE_STUB = `
  CREATE ROLE anon;
  CREATE ROLE authenticated;
  CREATE ROLE service_role;
  CREATE ROLE supabase_auth_admin;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
  CREATE SCHEMA auth;
  CREATE SCHEMA extensions;
  CREATE SCHEMA storage;
  CREATE SCHEMA realtime;
  CREATE PUBLICATION supabase_realtime;

  CREATE TABLE auth.users (
    instance_id uuid,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    aud varchar(255),
    role varchar(255),
    email varchar(255),
    encrypted_password varchar(255),
    email_confirmed_at timestamptz,
    invited_at timestamptz,
    confirmation_token varchar(255),
    confirmation_sent_at timestamptz,
    recovery_token varchar(255),
    recovery_sent_at timestamptz,
    email_change_token_new varchar(255),
    email_change varchar(255),
    email_change_sent_at timestamptz,
    last_sign_in_at timestamptz,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz,
    phone text,
    phone_confirmed_at timestamptz,
    phone_change text DEFAULT '',
    phone_change_token varchar(255) DEFAULT '',
    phone_change_sent_at timestamptz,
    confirmed_at timestamptz GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current varchar(255) DEFAULT '',
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamptz,
    reauthentication_token varchar(255) DEFAULT '',
    reauthentication_sent_at timestamptz,
    is_sso_user boolean NOT NULL DEFAULT false,
    deleted_at timestamptz,
    is_anonymous boolean NOT NULL DEFAULT false
  );
  CREATE UNIQUE INDEX users_email_partial_key ON auth.users (email) WHERE is_sso_user = false;
  CREATE UNIQUE INDEX users_phone_key ON auth.users (phone);
  CREATE UNIQUE INDEX recovery_token_idx ON auth.users (recovery_token)
    WHERE recovery_token !~ '^[0-9 ]*$';

  CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamptz,
    created_at timestamptz,
    updated_at timestamptz,
    email text GENERATED ALWAYS AS (lower(identity_data ->> 'email')) STORED,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    UNIQUE (provider_id, provider)
  );
  CREATE TABLE auth.sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_agent text,
    ip inet
  );
  CREATE TABLE auth.refresh_tokens (
    id bigserial PRIMARY KEY,
    token varchar(255),
    user_id varchar(255),
    session_id uuid REFERENCES auth.sessions(id) ON DELETE CASCADE
  );
  CREATE TABLE auth.one_time_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_hash text NOT NULL,
    relates_to text NOT NULL
  );
  CREATE TABLE auth.flow_state (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    provider_access_token text
  );
  CREATE TABLE auth.mfa_factors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    phone text
  );
  CREATE TABLE auth.oauth_consents (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid);
  CREATE TABLE auth.oauth_authorizations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid);
  CREATE TABLE auth.webauthn_credentials (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid);
  CREATE TABLE auth.webauthn_challenges (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid);
  CREATE TABLE auth.mfa_recovery_code_sets (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid);
  CREATE TABLE auth.audit_log_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payload json,
    ip_address varchar(64) NOT NULL DEFAULT ''
  );

  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS 'SELECT NULL::uuid';
  CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS 'SELECT NULL::text';
  CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS 'SELECT NULL::jsonb';

  CREATE TABLE storage.buckets (id text PRIMARY KEY, name text, public boolean);
  CREATE TABLE storage.objects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket_id text,
    name text,
    owner uuid
  );
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql IMMUTABLE
    AS 'SELECT string_to_array($1, ''/'')';
`;

export function allMigrationFiles(): string[] {
  const dir = resolve(findRepoRoot(), "supabase/migrations");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

export function readMigration(file: string): string {
  return readFileSync(
    resolve(findRepoRoot(), "supabase/migrations", file),
    "utf8"
  );
}

/** A database holding every migration, optionally skipping some. */
export async function buildFullLineage(
  options: { except?: string[] } = {}
): Promise<PGlite> {
  const pg = await PGlite.create();
  await pg.exec(SUPABASE_STUB);
  for (const file of allMigrationFiles()) {
    if (options.except?.includes(file)) continue;
    await pg.exec(readMigration(file));
  }
  return pg;
}

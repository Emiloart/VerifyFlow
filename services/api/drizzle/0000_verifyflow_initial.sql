CREATE TABLE IF NOT EXISTS users (
  user_id text PRIMARY KEY,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS onboarding_sessions (
  onboarding_session_id uuid PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(user_id),
  claims jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS onboarding_sessions_user_idx ON onboarding_sessions(user_id);

CREATE TABLE IF NOT EXISTS provider_runs (
  provider_run_record_id uuid PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(user_id),
  onboarding_session_id uuid NOT NULL REFERENCES onboarding_sessions(onboarding_session_id),
  provider_id text NOT NULL,
  provider_run_id text NOT NULL,
  kyc_level text NOT NULL CHECK (kyc_level IN ('basic', 'enhanced')),
  status text NOT NULL CHECK (status IN ('active', 'revoked', 'superseded', 'expired')),
  artifact_digest text NOT NULL,
  issued_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  superseded_by_provider_run_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS provider_runs_provider_run_id_idx ON provider_runs(provider_run_id);
CREATE INDEX IF NOT EXISTS provider_runs_user_idx ON provider_runs(user_id);

CREATE TABLE IF NOT EXISTS verification_attempts (
  verification_attempt_id uuid PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(user_id),
  verification_id text NOT NULL,
  provider_run_id text,
  decision text NOT NULL CHECK (decision IN ('allow', 'deny', 'review')),
  reason_codes jsonb NOT NULL,
  evaluated_at timestamptz NOT NULL,
  provider_status text NOT NULL CHECK (provider_status IN ('active', 'revoked', 'superseded', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS verification_attempts_verification_id_idx ON verification_attempts(verification_id);
CREATE INDEX IF NOT EXISTS verification_attempts_user_idx ON verification_attempts(user_id);

CREATE TABLE IF NOT EXISTS tier_grants (
  tier_grant_id uuid PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(user_id),
  tier text NOT NULL CHECK (tier IN ('basic', 'verified', 'enhanced')),
  source_verification_id text,
  granted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tier_grants_user_idx ON tier_grants(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS tier_grants_source_verification_idx ON tier_grants(source_verification_id);

CREATE TABLE IF NOT EXISTS funnel_events (
  funnel_event_id uuid PRIMARY KEY,
  user_id text REFERENCES users(user_id),
  step text NOT NULL,
  outcome text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS funnel_events_step_idx ON funnel_events(step);

CREATE TABLE IF NOT EXISTS audit_events (
  audit_event_id uuid PRIMARY KEY,
  user_id text REFERENCES users(user_id),
  action text NOT NULL,
  resource_id text,
  outcome text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- EIS history, forecasts, and projects.
-- Apply with: npm run migrate
-- Requires DATABASE_URL. Does not seed measurements.

CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS observations (
  id BIGSERIAL PRIMARY KEY,
  series TEXT NOT NULL,
  region TEXT NOT NULL,
  ts TIMESTAMPTZ NOT NULL,
  value DOUBLE PRECISION NOT NULL,
  unit TEXT NOT NULL,
  truth_class TEXT NOT NULL CHECK (truth_class IN ('measured', 'reported', 'estimate')),
  source TEXT NOT NULL,
  source_url TEXT,
  retrieved_at TIMESTAMPTZ NOT NULL,
  UNIQUE (series, region, ts, source)
);

CREATE INDEX IF NOT EXISTS observations_series_region_ts
  ON observations (series, region, ts);

CREATE TABLE IF NOT EXISTS forecasts (
  id BIGSERIAL PRIMARY KEY,
  series TEXT NOT NULL,
  region TEXT NOT NULL,
  target_ts TIMESTAMPTZ NOT NULL,
  value DOUBLE PRECISION NOT NULL,
  p10 DOUBLE PRECISION,
  p90 DOUBLE PRECISION,
  model TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL,
  inputs JSONB,
  source_notes TEXT
);

CREATE INDEX IF NOT EXISTS forecasts_lookup
  ON forecasts (series, region, model, issued_at, target_ts);

CREATE TABLE IF NOT EXISTS projects (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  mw DOUBLE PRECISION,
  target_date DATE,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  substation_path TEXT,
  status TEXT,
  source TEXT NOT NULL,
  source_url TEXT,
  site_key TEXT,
  path_id TEXT,
  path_role TEXT
);

CREATE INDEX IF NOT EXISTS projects_site ON projects (site_key);

CREATE TABLE IF NOT EXISTS backtest_scores (
  id BIGSERIAL PRIMARY KEY,
  series TEXT NOT NULL,
  region TEXT NOT NULL,
  model TEXT NOT NULL,
  vintage_issued_at TIMESTAMPTZ NOT NULL,
  scored_at TIMESTAMPTZ NOT NULL,
  horizon_hours INTEGER,
  n INTEGER NOT NULL,
  mape DOUBLE PRECISION,
  mae DOUBLE PRECISION,
  rmse DOUBLE PRECISION,
  bias DOUBLE PRECISION,
  coverage_p10_p90 DOUBLE PRECISION,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS backtest_scores_lookup
  ON backtest_scores (series, region, model, vintage_issued_at);

CREATE TABLE IF NOT EXISTS analyst_notes (
  id BIGSERIAL PRIMARY KEY,
  issued_at TIMESTAMPTZ NOT NULL,
  region TEXT,
  body TEXT NOT NULL,
  citations JSONB NOT NULL,
  model TEXT
);

CREATE TABLE IF NOT EXISTS agent_runs (
  id BIGSERIAL PRIMARY KEY,
  agent TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL,
  message TEXT,
  detail JSONB
);

CREATE TABLE IF NOT EXISTS backfill_cursors (
  source TEXT NOT NULL,
  series TEXT NOT NULL,
  region TEXT NOT NULL,
  next_start TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (source, series, region)
);

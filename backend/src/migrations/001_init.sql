CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          VARCHAR(20) DEFAULT 'operator',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS params (
  id           SERIAL PRIMARY KEY,
  name         TEXT UNIQUE NOT NULL,
  category     TEXT NOT NULL,
  subcategory  TEXT NOT NULL,
  unit_default VARCHAR(20) DEFAULT 'dona',
  sort_order   INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS facts (
  id           SERIAL PRIMARY KEY,
  date         DATE NOT NULL,
  param_name   TEXT NOT NULL REFERENCES params(name) ON UPDATE CASCADE,
  category     TEXT NOT NULL,
  subcategory  TEXT NOT NULL,
  value        NUMERIC(12,3) NOT NULL,
  unit         VARCHAR(20) NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, param_name)
);

CREATE INDEX IF NOT EXISTS idx_facts_date     ON facts(date);
CREATE INDEX IF NOT EXISTS idx_facts_date_cat ON facts(date, category);

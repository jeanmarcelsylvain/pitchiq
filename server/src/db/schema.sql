-- MyFutbolPro Database Schema
-- Run this against your Railway PostgreSQL instance

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Players (profile data)
CREATE TABLE IF NOT EXISTS players (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL DEFAULT '',
  age           INT,
  height        NUMERIC(5,2),
  weight        NUMERIC(5,2),
  dominant_foot TEXT NOT NULL DEFAULT 'right' CHECK (dominant_foot IN ('left','right','both')),
  primary_position TEXT NOT NULL DEFAULT 'CM',
  secondary_position TEXT,
  club          TEXT NOT NULL DEFAULT '',
  jersey_number INT,
  nationality   TEXT,
  bio           TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Matches
CREATE TABLE IF NOT EXISTS matches (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          TEXT NOT NULL,
  date             DATE NOT NULL,
  opponent         TEXT NOT NULL,
  competition      TEXT NOT NULL DEFAULT '',
  venue            TEXT NOT NULL DEFAULT 'home' CHECK (venue IN ('home','away','neutral')),
  result           TEXT CHECK (result IN ('win','loss','draw')),
  team_score       INT DEFAULT 0,
  opponent_score   INT DEFAULT 0,
  position         TEXT NOT NULL DEFAULT 'CM',
  minutes_played   INT NOT NULL DEFAULT 90,
  goals            INT NOT NULL DEFAULT 0,
  assists          INT NOT NULL DEFAULT 0,
  shots            INT NOT NULL DEFAULT 0,
  shots_on_target  INT NOT NULL DEFAULT 0,
  pass_accuracy    NUMERIC(5,2) NOT NULL DEFAULT 0,
  tackles          INT NOT NULL DEFAULT 0,
  interceptions    INT NOT NULL DEFAULT 0,
  distance_covered NUMERIC(6,2) NOT NULL DEFAULT 0,
  sprint_speed     NUMERIC(5,2) NOT NULL DEFAULT 0,
  rating           NUMERIC(4,2) NOT NULL DEFAULT 7,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS matches_user_id_idx ON matches(user_id);
CREATE INDEX IF NOT EXISTS matches_date_idx ON matches(date DESC);

-- Goals (season targets)
CREATE TABLE IF NOT EXISTS goals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  category      TEXT NOT NULL DEFAULT 'custom' CHECK (category IN ('scoring','passing','fitness','minutes','training','custom')),
  target_value  NUMERIC NOT NULL DEFAULT 1,
  current_value NUMERIC NOT NULL DEFAULT 0,
  unit          TEXT NOT NULL DEFAULT '',
  deadline      DATE,
  completed     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS goals_user_id_idx ON goals(user_id);

-- Injuries
CREATE TABLE IF NOT EXISTS injuries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL,
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  type         TEXT NOT NULL,
  body_part    TEXT NOT NULL DEFAULT '',
  severity     TEXT NOT NULL DEFAULT 'unknown' CHECK (severity IN ('mild','moderate','severe','unknown')),
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','recovering','cleared')),
  plan         TEXT NOT NULL DEFAULT '',
  conversation JSONB NOT NULL DEFAULT '[]',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS injuries_user_id_idx ON injuries(user_id);

-- Scheduled Matches (calendar)
CREATE TABLE IF NOT EXISTS scheduled_matches (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL,
  date         DATE NOT NULL,
  opponent     TEXT NOT NULL,
  competition  TEXT NOT NULL DEFAULT '',
  venue        TEXT NOT NULL DEFAULT 'home' CHECK (venue IN ('home','away','neutral')),
  kickoff_time TEXT NOT NULL DEFAULT '',
  notes        TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS scheduled_matches_user_id_idx ON scheduled_matches(user_id);

-- Season Archive
CREATE TABLE IF NOT EXISTS season_archive (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  name        TEXT NOT NULL,
  start_date  DATE,
  end_date    DATE,
  matches     JSONB NOT NULL DEFAULT '[]',
  goals       INT NOT NULL DEFAULT 0,
  assists     INT NOT NULL DEFAULT 0,
  wins        INT NOT NULL DEFAULT 0,
  losses      INT NOT NULL DEFAULT 0,
  draws       INT NOT NULL DEFAULT 0,
  avg_rating  NUMERIC(4,2) NOT NULL DEFAULT 0,
  highlights  TEXT NOT NULL DEFAULT '',
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS season_archive_user_id_idx ON season_archive(user_id);

-- Training Plans
CREATE TABLE IF NOT EXISTS training_plans (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT NOT NULL,
  plan       JSONB NOT NULL DEFAULT '[]',
  raw_text   TEXT NOT NULL DEFAULT '',
  position   TEXT,
  days       INT NOT NULL DEFAULT 5,
  duration   INT NOT NULL DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS training_plans_user_id_idx ON training_plans(user_id);

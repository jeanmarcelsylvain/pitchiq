-- PitchIQ Database Schema
-- PostgreSQL 15+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid VARCHAR(128) UNIQUE NOT NULL,
  email        VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  photo_url    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);

-- ============================================================
-- PLAYER PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS player_profiles (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name               VARCHAR(100) NOT NULL,
  age                SMALLINT CHECK (age BETWEEN 10 AND 40),
  height             NUMERIC(5,1),       -- cm
  weight             NUMERIC(5,1),       -- kg
  dominant_foot      VARCHAR(10) CHECK (dominant_foot IN ('left','right','both')) DEFAULT 'right',
  primary_position   VARCHAR(5) NOT NULL,
  secondary_position VARCHAR(5),
  club               VARCHAR(150),
  jersey_number      SMALLINT CHECK (jersey_number BETWEEN 1 AND 99),
  nationality        VARCHAR(50),
  bio                TEXT,
  avatar_url         TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- MATCHES
-- ============================================================
CREATE TABLE IF NOT EXISTS matches (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date             DATE NOT NULL,
  opponent         VARCHAR(150) NOT NULL,
  competition      VARCHAR(150),
  venue            VARCHAR(10) CHECK (venue IN ('home','away','neutral')) DEFAULT 'home',
  result           VARCHAR(6) CHECK (result IN ('win','loss','draw')),
  team_score       SMALLINT CHECK (team_score >= 0),
  opponent_score   SMALLINT CHECK (opponent_score >= 0),
  position         VARCHAR(5) NOT NULL,
  minutes_played   SMALLINT NOT NULL CHECK (minutes_played BETWEEN 0 AND 120),
  goals            SMALLINT NOT NULL DEFAULT 0 CHECK (goals >= 0),
  assists          SMALLINT NOT NULL DEFAULT 0 CHECK (assists >= 0),
  shots            SMALLINT DEFAULT 0 CHECK (shots >= 0),
  shots_on_target  SMALLINT DEFAULT 0 CHECK (shots_on_target >= 0),
  pass_accuracy    NUMERIC(5,2) CHECK (pass_accuracy BETWEEN 0 AND 100),
  tackles          SMALLINT DEFAULT 0,
  interceptions    SMALLINT DEFAULT 0,
  distance_covered NUMERIC(5,2),        -- km
  sprint_speed     NUMERIC(5,2),        -- km/h
  rating           NUMERIC(3,1) CHECK (rating BETWEEN 1 AND 10),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_matches_user_id ON matches(user_id);
CREATE INDEX idx_matches_date ON matches(date DESC);
CREATE INDEX idx_matches_user_date ON matches(user_id, date DESC);

-- ============================================================
-- TRAINING SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS training_sessions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  type       VARCHAR(20) CHECK (type IN ('team','individual','fitness','technical','tactical')) NOT NULL,
  duration   SMALLINT NOT NULL CHECK (duration BETWEEN 10 AND 300), -- minutes
  intensity  SMALLINT NOT NULL CHECK (intensity BETWEEN 1 AND 5),
  focus      TEXT[],                   -- e.g. {'Passing','First Touch'}
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_training_user_date ON training_sessions(user_id, date DESC);

-- ============================================================
-- GOALS
-- ============================================================
CREATE TABLE IF NOT EXISTS goals (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  category      VARCHAR(20) CHECK (category IN ('scoring','passing','fitness','minutes','training','custom')) NOT NULL,
  target_value  NUMERIC(10,2) NOT NULL,
  current_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit          VARCHAR(50) NOT NULL,
  deadline      DATE,
  completed     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_user_completed ON goals(user_id, completed);

-- ============================================================
-- INSIGHTS (generated & stored for performance)
-- ============================================================
CREATE TABLE IF NOT EXISTS insights (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type           VARCHAR(20) CHECK (type IN ('improvement','warning','achievement','trend')) NOT NULL,
  title          VARCHAR(200) NOT NULL,
  body           TEXT NOT NULL,
  metric         VARCHAR(50),
  change_percent NUMERIC(6,2),
  generated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read           BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_insights_user_id ON insights(user_id);
CREATE INDEX idx_insights_user_read ON insights(user_id, read);

-- ============================================================
-- AGGREGATE STATS (materialised for fast dashboard loads)
-- ============================================================
CREATE TABLE IF NOT EXISTS season_statistics (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  season_label      VARCHAR(20) NOT NULL,    -- e.g. '2023-24'
  matches           INT DEFAULT 0,
  minutes_played    INT DEFAULT 0,
  goals             INT DEFAULT 0,
  assists           INT DEFAULT 0,
  avg_pass_accuracy NUMERIC(5,2),
  avg_rating        NUMERIC(4,2),
  avg_sprint_speed  NUMERIC(5,2),
  total_distance    NUMERIC(8,2),
  training_sessions INT DEFAULT 0,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, season_label)
);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','player_profiles','matches','goals','season_statistics']
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I;
      CREATE TRIGGER trg_%I_updated_at
      BEFORE UPDATE ON %I
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();',
      t, t, t, t);
  END LOOP;
END $$;

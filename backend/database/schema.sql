-- ═══════════════════════════════════════════════════════════════════════════
-- 50/50 Life — PostgreSQL Database Schema
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── USERS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  username              VARCHAR(30) UNIQUE NOT NULL,
  email                 VARCHAR(255) UNIQUE,
  phone                 VARCHAR(20) UNIQUE,
  password_hash         TEXT,
  first_name            VARCHAR(50),
  last_name             VARCHAR(50),
  avatar_url            TEXT,
  bio                   VARCHAR(300),
  date_of_birth         DATE,
  country               CHAR(2),
  timezone              VARCHAR(50),
  currency              CHAR(3) DEFAULT 'USD',

  -- Auth
  role                  VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user','moderator','admin','superadmin')),
  is_email_verified     BOOLEAN DEFAULT FALSE,
  is_phone_verified     BOOLEAN DEFAULT FALSE,
  email_verify_token    VARCHAR(100),
  email_verify_expires  TIMESTAMPTZ,
  password_reset_token  VARCHAR(100),
  password_reset_expires TIMESTAMPTZ,
  mfa_enabled           BOOLEAN DEFAULT FALSE,
  mfa_secret            TEXT,
  refresh_token_hash    TEXT,

  -- KYC
  kyc_status            VARCHAR(20) DEFAULT 'not_started' CHECK (kyc_status IN ('not_started','pending','verified','rejected')),
  kyc_verified_at       TIMESTAMPTZ,
  kyc_rejected_reason   TEXT,
  onfido_applicant_id   VARCHAR(100),

  -- Status
  is_active             BOOLEAN DEFAULT TRUE,
  is_banned             BOOLEAN DEFAULT FALSE,
  ban_reason            TEXT,
  banned_at             TIMESTAMPTZ,
  banned_by             UUID,
  is_suspended          BOOLEAN DEFAULT FALSE,
  suspended_until       TIMESTAMPTZ,

  -- OAuth
  google_id             VARCHAR(100) UNIQUE,
  facebook_id           VARCHAR(100) UNIQUE,
  apple_id              VARCHAR(100) UNIQUE,

  -- Responsible gambling
  deposit_limit         DECIMAL(18,2),
  daily_loss_limit      DECIMAL(18,2),
  self_excluded_until   TIMESTAMPTZ,

  -- Stats (denormalised)
  total_bets            INTEGER DEFAULT 0,
  total_wins            INTEGER DEFAULT 0,
  total_wagered         DECIMAL(18,2) DEFAULT 0,
  total_won             DECIMAL(18,2) DEFAULT 0,
  followers_count       INTEGER DEFAULT 0,
  following_count       INTEGER DEFAULT 0,
  posts_count           INTEGER DEFAULT 0,

  -- Notification prefs
  notify_bet_result     BOOLEAN DEFAULT TRUE,
  notify_followers      BOOLEAN DEFAULT TRUE,
  notify_messages       BOOLEAN DEFAULT TRUE,
  notify_promotions     BOOLEAN DEFAULT FALSE,
  fcm_token             TEXT,

  last_login_at         TIMESTAMPTZ,
  last_login_ip         VARCHAR(45),

  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ  -- soft delete
);

CREATE INDEX idx_users_username    ON users(username);
CREATE INDEX idx_users_email       ON users(email);
CREATE INDEX idx_users_kyc_status  ON users(kyc_status);
CREATE INDEX idx_users_created_at  ON users(created_at);
CREATE INDEX idx_users_country     ON users(country);

-- ─── WALLETS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallets (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance                DECIMAL(18,2) DEFAULT 0.00 CHECK (balance >= 0),
  escrow_balance         DECIMAL(18,2) DEFAULT 0.00 CHECK (escrow_balance >= 0),
  currency               CHAR(3) DEFAULT 'USD',
  total_deposited        DECIMAL(18,2) DEFAULT 0,
  total_withdrawn        DECIMAL(18,2) DEFAULT 0,
  total_wagered          DECIMAL(18,2) DEFAULT 0,
  total_won              DECIMAL(18,2) DEFAULT 0,
  total_commission_paid  DECIMAL(18,2) DEFAULT 0,
  withdrawal_count       INTEGER DEFAULT 0,
  withdrawal_count_month INTEGER DEFAULT 0,
  withdrawal_month_reset TIMESTAMPTZ,
  is_locked              BOOLEAN DEFAULT FALSE,
  lock_reason            TEXT,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TRANSACTIONS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id         UUID NOT NULL REFERENCES wallets(id),
  user_id           UUID NOT NULL REFERENCES users(id),
  type              VARCHAR(30) NOT NULL CHECK (type IN (
                      'deposit','withdrawal',
                      'bet_stake','bet_win','bet_refund','bet_commission',
                      'p2p_transfer_in','p2p_transfer_out',
                      'bonus','adjustment'
                    )),
  amount            DECIMAL(18,2) NOT NULL,
  balance_before    DECIMAL(18,2),
  balance_after     DECIMAL(18,2),
  status            VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','reversed')),
  currency          CHAR(3) DEFAULT 'USD',
  reference_id      UUID,
  reference_type    VARCHAR(50),
  payment_provider  VARCHAR(50),
  provider_tx_id    VARCHAR(255),
  provider_status   VARCHAR(50),
  description       TEXT,
  metadata          JSONB,
  ip_address        VARCHAR(45),
  failure_reason    TEXT,
  reviewed_by       UUID,
  reviewed_at       TIMESTAMPTZ,
  review_note       TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_txn_wallet_id    ON transactions(wallet_id);
CREATE INDEX idx_txn_user_id      ON transactions(user_id);
CREATE INDEX idx_txn_type         ON transactions(type);
CREATE INDEX idx_txn_status       ON transactions(status);
CREATE INDEX idx_txn_reference_id ON transactions(reference_id);
CREATE INDEX idx_txn_created_at   ON transactions(created_at);

-- ─── BETS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id        UUID NOT NULL REFERENCES users(id),
  type              VARCHAR(20) NOT NULL CHECK (type IN ('sportsbook','p2p','group')),
  sport             VARCHAR(50) NOT NULL,
  event_id          VARCHAR(100),
  event_name        TEXT NOT NULL,
  event_start_time  TIMESTAMPTZ,
  market            VARCHAR(100),
  selection         VARCHAR(255) NOT NULL,
  odds              DECIMAL(8,3),
  stake             DECIMAL(18,2) NOT NULL CHECK (stake >= 1),
  potential_payout  DECIMAL(18,2),
  commission_rate   DECIMAL(5,4) DEFAULT 0.10,   -- 10% platform commission
  commission_amount DECIMAL(18,2),
  net_payout        DECIMAL(18,2),               -- payout after 10% commission
  status            VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','matched','settled','cancelled','disputed','void')),
  result            VARCHAR(10) CHECK (result IN ('win','loss','void','push')),
  winner_id         UUID REFERENCES users(id),
  settled_at        TIMESTAMPTZ,
  settled_by        VARCHAR(10) DEFAULT 'auto' CHECK (settled_by IN ('auto','admin')),
  expires_at        TIMESTAMPTZ,
  visibility        VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public','followers','private')),
  description       TEXT,
  is_disputed       BOOLEAN DEFAULT FALSE,
  dispute_reason    TEXT,
  disputed_at       TIMESTAMPTZ,
  disputed_by       UUID,
  dispute_resolved_at TIMESTAMPTZ,
  dispute_resolved_by UUID,
  dispute_note      TEXT,
  official_result   JSONB,
  result_source     VARCHAR(100),
  room_id           UUID,
  shared_to_feed    BOOLEAN DEFAULT TRUE,
  share_post_id     VARCHAR(30),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bets_creator_id  ON bets(creator_id);
CREATE INDEX idx_bets_status      ON bets(status);
CREATE INDEX idx_bets_sport       ON bets(sport);
CREATE INDEX idx_bets_event_id    ON bets(event_id);
CREATE INDEX idx_bets_type        ON bets(type);
CREATE INDEX idx_bets_created_at  ON bets(created_at);
CREATE INDEX idx_bets_event_time  ON bets(event_start_time);

-- ─── BET PARTICIPANTS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bet_participants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bet_id          UUID NOT NULL REFERENCES bets(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id),
  role            VARCHAR(10) NOT NULL CHECK (role IN ('creator','acceptor')),
  selection       VARCHAR(255) NOT NULL,
  stake           DECIMAL(18,2) NOT NULL,
  potential_payout DECIMAL(18,2),
  commission_paid  DECIMAL(18,2) DEFAULT 0,
  net_payout       DECIMAL(18,2),
  result          VARCHAR(10) CHECK (result IN ('win','loss','void','push')),
  payout_received DECIMAL(18,2) DEFAULT 0,
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bet_id, user_id)
);

-- ─── BETTING ROOMS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS betting_rooms (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 VARCHAR(100) NOT NULL,
  description          TEXT,
  created_by           UUID NOT NULL REFERENCES users(id),
  sport                VARCHAR(50),
  event_id             VARCHAR(100),
  event_name           TEXT,
  entry_fee            DECIMAL(18,2) DEFAULT 0,
  payout_type          VARCHAR(30) DEFAULT 'winner_takes_all',
  max_participants     INTEGER DEFAULT 50,
  current_participants INTEGER DEFAULT 0,
  total_prize_pool     DECIMAL(18,2) DEFAULT 0,
  commission_amount    DECIMAL(18,2) DEFAULT 0,   -- 10% of prize pool
  net_prize_pool       DECIMAL(18,2) DEFAULT 0,
  status               VARCHAR(20) DEFAULT 'open',
  is_private           BOOLEAN DEFAULT FALSE,
  invite_code          VARCHAR(12) UNIQUE,
  banner_url           TEXT,
  starts_at            TIMESTAMPTZ,
  ends_at              TIMESTAMPTZ,
  settled_at           TIMESTAMPTZ,
  chat_enabled         BOOLEAN DEFAULT TRUE,
  mongo_room_id        VARCHAR(30),
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rooms_status     ON betting_rooms(status);
CREATE INDEX idx_rooms_sport      ON betting_rooms(sport);
CREATE INDEX idx_rooms_invite     ON betting_rooms(invite_code);

-- ─── ROOM PARTICIPANTS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS room_participants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id       UUID NOT NULL REFERENCES betting_rooms(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id),
  role          VARCHAR(10) DEFAULT 'member' CHECK (role IN ('admin','member')),
  selection     VARCHAR(255),
  entry_fee_paid DECIMAL(18,2) DEFAULT 0,
  points        INTEGER DEFAULT 0,
  rank          INTEGER,
  payout        DECIMAL(18,2) DEFAULT 0,
  paid_at       TIMESTAMPTZ,
  joined_at     TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- ─── PLATFORM REVENUE TRACKING ──────────────────────────────────────────────
-- Materialised view for real-time revenue dashboard
CREATE MATERIALIZED VIEW IF NOT EXISTS platform_revenue AS
  SELECT
    DATE_TRUNC('day', created_at) AS day,
    COUNT(*) AS transaction_count,
    SUM(ABS(amount)) AS total_amount
  FROM transactions
  WHERE type = 'bet_commission'
  AND status = 'completed'
  GROUP BY DATE_TRUNC('day', created_at)
  ORDER BY day DESC
WITH DATA;

CREATE UNIQUE INDEX ON platform_revenue(day);

-- Refresh revenue view (run in cron)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY platform_revenue;

-- ─── TRIGGERS ───────────────────────────────────────────────────────────────
-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','wallets','transactions','bets','bet_participants','betting_rooms','room_participants']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_updated_at ON %I; CREATE TRIGGER trg_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at();', t, t);
  END LOOP;
END $$;

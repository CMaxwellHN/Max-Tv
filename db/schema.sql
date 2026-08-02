-- ══════════════════════════════════════════
-- MaxTV — Esquema de base de datos (PostgreSQL)
-- ══════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Correos autorizados (lista blanca de acceso a la cuenta)
CREATE TABLE IF NOT EXISTS authorized_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','blocked')),
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Perfiles (hasta 5 por cuenta, con PIN)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  avatar TEXT DEFAULT '👤',
  pin_hash TEXT,                                   -- null = sin PIN
  kind TEXT NOT NULL DEFAULT 'standard' CHECK (kind IN ('admin','standard','kids')),
  adult_content_blocked BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','blocked')),
  daily_limit_minutes INT,                          -- null = sin límite
  night_mode BOOLEAN NOT NULL DEFAULT false,
  data_saver BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Horarios permitidos por perfil (control parental por hora del día)
CREATE TABLE IF NOT EXISTS parental_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=domingo
  hour INT NOT NULL CHECK (hour BETWEEN 0 AND 23),
  allowed BOOLEAN NOT NULL DEFAULT true
);

-- Dispositivos (los 4 TVs Hisense de la casa)
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                               -- 'TV Sala', 'TV Cuarto', etc
  device_key TEXT UNIQUE NOT NULL,                   -- identificador único del hardware VIDAA
  last_seen TIMESTAMPTZ,
  is_online BOOLEAN NOT NULL DEFAULT false,
  active_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Historial de reproducción
CREATE TABLE IF NOT EXISTS watch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('live','movie','series','anime','adult','emby')),
  content_id TEXT NOT NULL,                          -- id externo (Xtream stream_id o Emby item id)
  title TEXT NOT NULL,
  progress_seconds INT NOT NULL DEFAULT 0,
  duration_seconds INT,
  watched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Favoritos / Mi Lista
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  title TEXT NOT NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, content_type, content_id)
);

-- Calificaciones del usuario
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  stars INT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  rated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, content_type, content_id)
);

-- Recordatorios de programas (EPG)
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,
  program_title TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  notified BOOLEAN NOT NULL DEFAULT false
);

-- Cache local del catálogo Xtream (para no golpear su API en cada request)
CREATE TABLE IF NOT EXISTS xtream_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('live','vod','series','epg')),
  category TEXT,
  payload JSONB NOT NULL,
  refreshed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_xtream_cache_kind ON xtream_cache(kind);

CREATE INDEX IF NOT EXISTS idx_watch_history_profile ON watch_history(profile_id);
CREATE INDEX IF NOT EXISTS idx_favorites_profile ON favorites(profile_id);

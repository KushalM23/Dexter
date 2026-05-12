-- DexE Supabase schema

-- Extensions
create extension if not exists pgcrypto;

-- Enums
DO $$ BEGIN
  CREATE TYPE environment_type AS ENUM ('urban', 'rural');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE environment_scope AS ENUM ('urban', 'rural', 'any');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE rarity AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE challenge_type AS ENUM ('daily', 'weekly', 'achievement');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE photo_source AS ENUM ('inaturalist', 'gbif', 'wikipedia', 'silhouette');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE xp_event_source AS ENUM ('capture', 'challenge', 'achievement');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tables
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  google_name text,
  display_name text NOT NULL,
  avatar_id text NOT NULL,
  friend_code text NOT NULL UNIQUE,
  total_xp integer NOT NULL DEFAULT 0,
  environment_type environment_type NOT NULL DEFAULT 'urban',
  onboarding_complete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.species_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gbif_taxon_key bigint NOT NULL UNIQUE,
  common_name text NOT NULL,
  scientific_name text NOT NULL,
  kingdom text NOT NULL,
  phylum text NOT NULL,
  class_name text NOT NULL,
  order_name text NOT NULL,
  family text NOT NULL,
  genus text NOT NULL,
  species text NOT NULL,
  rarity rarity NOT NULL,
  xp_value integer NOT NULL,
  photo_url text,
  photo_source photo_source NOT NULL DEFAULT 'silhouette',
  lore text,
  occurrence_count integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  species_card_id uuid NOT NULL REFERENCES public.species_cards(id) ON DELETE RESTRICT,
  gbif_taxon_key bigint NOT NULL,
  rarity rarity NOT NULL,
  xp_awarded integer NOT NULL,
  captured_image_url text,
  captured_at timestamptz NOT NULL DEFAULT now(),
  capture_lat double precision,
  capture_lng double precision,
  capture_location_label text,
  country_code text,
  UNIQUE (user_id, gbif_taxon_key)
);

CREATE TABLE IF NOT EXISTS public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  type challenge_type NOT NULL,
  environment_type environment_scope NOT NULL,
  xp_reward integer NOT NULL,
  target_count integer NOT NULL,
  condition_type text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_challenge_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  progress integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  source xp_event_source NOT NULL,
  amount integer NOT NULL,
  label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Optional: only if you keep custom sessions
CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_collections_user_captured_at
  ON public.user_collections (user_id, captured_at DESC);

CREATE INDEX IF NOT EXISTS idx_xp_events_user_created_at
  ON public.xp_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_user
  ON public.user_challenge_progress (user_id);

CREATE INDEX IF NOT EXISTS idx_challenges_type_env
  ON public.challenges (type, environment_type);

-- Storage bucket for captures
INSERT INTO storage.buckets (id, name, public) 
VALUES ('captures', 'captures', true)
ON CONFLICT (id) DO NOTHING;

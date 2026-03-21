
-- Add user_id column to license_keys table
ALTER TABLE public.license_keys ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add version column to wallets table for optimistic locking
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 0;

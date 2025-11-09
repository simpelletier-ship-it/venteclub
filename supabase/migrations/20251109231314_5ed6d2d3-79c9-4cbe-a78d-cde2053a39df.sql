-- Ajouter le support des messages vocaux
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS voice_url TEXT,
ADD COLUMN IF NOT EXISTS voice_duration INTEGER;
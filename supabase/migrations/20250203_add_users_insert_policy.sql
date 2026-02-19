-- Add INSERT policy on users so ensureUserInPublic can create the row
-- when the auth trigger didn't run (e.g. Google OAuth). Run this in
-- Supabase SQL Editor if you get "Key is not present in table users".

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'users' AND policyname = 'Users can insert own data'
  ) THEN
    CREATE POLICY "Users can insert own data" ON users
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

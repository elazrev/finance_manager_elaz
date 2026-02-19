-- ============================================
-- Trigger to automatically create user record
-- ============================================

-- Function to handle new user creation (name from full_name / name / business_name in metadata)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  display_name TEXT;
BEGIN
  display_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'business_name'
  );
  IF display_name = '' THEN
    display_name := NULL;
  END IF;

  INSERT INTO public.users (id, email, business_name, is_patour, settings)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    display_name,
    true,
    '{
      "invoice_prefix": "INV",
      "quote_prefix": "QUO",
      "currency": "ILS",
      "language": "he",
      "payment_terms": 30,
      "email_signature": "",
      "whatsapp_enabled": false
    }'::jsonb
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger that fires when a new user is created in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Grant necessary permissions
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO authenticated;

-- הוספת payment_request_prefix להגדרות המשתמש
UPDATE users
SET settings = COALESCE(settings, '{}'::jsonb) || jsonb_build_object(
  'payment_request_prefix', COALESCE(settings->>'payment_request_prefix', 'DR')
);

-- הוספת themeColor ו-fontSize להגדרות המשתמש
UPDATE users
SET settings = COALESCE(settings, '{}'::jsonb) || jsonb_build_object(
  'themeColor', COALESCE(settings->>'themeColor', 'blue'),
  'fontSize', COALESCE(settings->>'fontSize', 'md')
);

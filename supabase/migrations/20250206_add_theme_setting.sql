-- הוספת theme להגדרות המשתמש
UPDATE users
SET settings = COALESCE(settings, '{}'::jsonb) || '{"theme": "system"}'::jsonb
WHERE settings->>'theme' IS NULL;

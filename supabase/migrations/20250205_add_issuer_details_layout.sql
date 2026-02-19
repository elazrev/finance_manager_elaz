-- הוספת issuer_details_layout להגדרות המסמכים
-- "row" = שורה אחת, "column" = רשימה טורית מתחת לשם העסק
-- JSONB גמיש - אין צורך ב-ALTER TABLE, רק מעדכנים רשומות קיימות

UPDATE users
SET settings = COALESCE(settings, '{}'::jsonb) || '{"issuer_details_layout": "row"}'::jsonb
WHERE settings->>'issuer_details_layout' IS NULL;

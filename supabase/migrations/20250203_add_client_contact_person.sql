-- הוספת שדה איש קשר והרחבת אורך שדות (למסד קיים)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255);
ALTER TABLE clients ALTER COLUMN phone TYPE VARCHAR(50);
ALTER TABLE clients ALTER COLUMN identity_number TYPE VARCHAR(30);

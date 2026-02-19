# הוראות הגדרת Supabase

## שלב 1: יצירת פרויקט Supabase

1. היכנס ל-[Supabase](https://supabase.com) והתחבר
2. לחץ על "New Project"
3. מלא את הפרטים:
   - **Name**: patour-accounting-app
   - **Database Password**: בחר סיסמה חזקה ושמור אותה
   - **Region**: בחר את האזור הקרוב ביותר (Europe West מומלץ)
4. לחץ על "Create new project"

## שלב 2: הגדרת Database Schema

1. בפרויקט שלך, לך ל-**SQL Editor**
2. פתח את הקובץ `supabase/schema.sql` מהפרויקט
3. העתק את כל התוכן
4. הדבק ב-SQL Editor ב-Supabase
5. לחץ על "Run" או Ctrl+Enter

זה ייצור את כל הטבלאות, Indexes, Functions, ו-RLS Policies.

### שלב 2ב: הרצת טריגר יצירת משתמש (חובה ל-Google OAuth)

כדי שמשתמש שנרשם עם Google יקבל אוטומטית רשומה בטבלת `public.users`:

1. פתח את הקובץ `supabase/triggers.sql`
2. העתק את כל התוכן
3. הדבק ב-SQL Editor ב-Supabase
4. לחץ על "Run"

⚠️ **בלי טריגר זה**, התחברות עם Google לא תיצור רשומה ב-`users`, ותקבל שגיאות (כמו "Key is not present in table users").

## שלב 3: הגדרת Authentication

1. לך ל-**Authentication** > **Settings**
2. ודא ש-Email Auth מופעל
3. (אופציונלי) הגדר Email Templates בעברית

## שלב 4: הגדרת Storage

1. לך ל-**Storage**
2. צור bucket חדש בשם `invoices`
3. הגדר את ה-Policies:
   - **Public**: false
   - **Allowed MIME types**: application/pdf
   - **File size limit**: 10MB

## שלב 5: קבלת API Keys

1. לך ל-**Settings** > **API**
2. העתק את ה-URL וה-Anon Key
3. הוסף אותם לקובץ `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## שלב 6: בדיקת ההגדרה

1. ודא שכל הטבלאות נוצרו (לך ל-**Table Editor**)
2. ודא ש-RLS מופעל על כל הטבלאות
3. בדוק שהפונקציות נוצרו (לך ל-**Database** > **Functions**)

## הערות חשובות

- **Row Level Security (RLS)**: כל הטבלאות מוגנות ב-RLS, כך שמשתמשים יכולים לראות רק את הנתונים שלהם
- **Triggers**: כל הטבלאות מעדכנות אוטומטית את `updated_at` בעת עדכון
- **Functions**: הפונקציות `generate_invoice_number` ו-`calculate_invoice_total` זמינות לשימוש

## שליחת חשבוניות באימייל (אופציונלי)

כדי לאפשר שליחת חשבוניות באימייל ללקוחות:

1. הירשם ל-[Resend](https://resend.com) (חינמי למספר אימיילים חודשי)
2. צור API Key ב-Dashboard
3. הוסף ל-`.env.local`:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxx
   RESEND_FROM_EMAIL=onboarding@resend.dev
   ```
   להערות: `onboarding@resend.dev` לשימוש בבדיקות בלבד. לפרודקשן צריך לוודא דומיין.

## ערכת נושא (Theme)

כדי להוסיף את ההגדרה `theme` למשתמשים קיימים, הרץ ב-SQL Editor:

```sql
-- מתוך supabase/migrations/20250206_add_theme_setting.sql
UPDATE users
SET settings = COALESCE(settings, '{}'::jsonb) || '{"theme": "system"}'::jsonb
WHERE settings->>'theme' IS NULL;
```

## הגדרת פרטי מנפיק במסמכים

כדי להוסיף את ההגדרה `issuer_details_layout` (שורה אחת / רשימה טורית) למשתמשים קיימים, הרץ ב-SQL Editor:

```sql
-- מתוך supabase/migrations/20250205_add_issuer_details_layout.sql
UPDATE users
SET settings = COALESCE(settings, '{}'::jsonb) || '{"issuer_details_layout": "row"}'::jsonb
WHERE settings->>'issuer_details_layout' IS NULL;
```

## דרישות תשלום

טבלת `payment_requests` כלולה ב-`schema.sql`. אם הרצת את ה-schema לפני שהוספנו אותה, הרץ ב-SQL Editor:

```sql
-- העתק את התוכן מ-supabase/migrations/20250204_add_payment_requests.sql
```

## הוצאות (Expenses)

כדי להוסיף טבלת הוצאות, הרץ ב-SQL Editor:

```sql
-- העתק את התוכן מ-supabase/migrations/20250207_add_expenses.sql
```

## פתרון בעיות

אם נתקלת בשגיאות:
1. ודא שהרצת את כל ה-SQL (לא רק חלק)
2. בדוק שה-UUID extension מופעל
3. ודא שאין טבלאות קיימות עם שמות זהים
4. **התחברות עם Google לא יוצרת user** – הרץ את `supabase/triggers.sql` (ראה שלב 2ב)
5. **שדה contact_person חסר ב-clients** – הרץ את `supabase/migrations/20250203_add_client_contact_person.sql`
6. **"new row violates row-level security policy for table users"** – הוסף policy ל-INSERT. ב-SQL Editor הרץ:

```sql
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);
```

(אם מקבל "policy already exists" – הוא כבר קיים, בדוק הגדרות אחרות)

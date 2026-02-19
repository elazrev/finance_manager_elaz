# הגדרת Google OAuth ב-Supabase

## האם זה חינמי?

**כן!** Google OAuth ב-Supabase הוא **חינמי לחלוטין** ואינו דורש תשלום נוסף.

## שלבי הגדרה:

### 1. הגדרת Google OAuth Console

1. היכנס ל-[Google Cloud Console](https://console.cloud.google.com/)
2. צור פרויקט חדש או בחר פרויקט קיים
3. לך ל-**APIs & Services** > **Credentials**
4. לחץ על **Create Credentials** > **OAuth client ID**
5. בחר **Web application**
6. מלא את הפרטים:
   - **Name**: Patour Accounting App (או שם אחר)
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (לפיתוח)
     - `https://your-domain.com` (ל-production)
   - **Authorized redirect URIs** (חשוב – רק כתובת Supabase!):
     - `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
     - ⚠️ אל תוסיף כאן את `http://localhost:3000/auth/callback` – גוגל מפנה ל-Supabase, ו-Supabase מפנה לאפליקציה.
7. לחץ **Create**
8. העתק את ה-**Client ID** וה-**Client Secret**

### 2. הגדרת Supabase – Providers

1. היכנס ל-[Supabase Dashboard](https://app.supabase.com)
2. בחר את הפרויקט שלך
3. לך ל-**Authentication** > **Providers**
4. מצא את **Google** ולחץ עליו
5. הפעל את ה-toggle **Enable Google provider**
6. הדבק את ה-**Client ID** וה-**Client Secret** מ-Google
7. לחץ **Save**

### 2ב. הגדרת Supabase – Redirect URLs (חובה)

1. באותו פרויקט ב-Supabase: **Authentication** > **URL Configuration**
2. תחת **Redirect URLs** הוסף (לחיצה על "Add URL"):
   - `http://localhost:3000/auth/callback` (לפיתוח)
   - `http://localhost:3000/**` (אופציונלי – מאפשר כל path תחת localhost)
3. **Site URL** – הגדר ל-`http://localhost:3000` (לפיתוח)
4. שמור

### 3. איפה מוצאים את ה-Project Ref של Supabase?

ב-Supabase: **Settings** > **API** – ה-URL של הפרויקט הוא:
`https://XXXXX.supabase.co` – החלק של `XXXXX` הוא ה-Project Ref.

ב-Google Console, ה-Redirect URI חייב להיות בדיוק:
```
https://XXXXX.supabase.co/auth/v1/callback
```
(החלף XXXXX ב-Project Ref האמיתי שלך)

### 4. בדיקה

1. הרץ את האפליקציה: `npm run dev`
2. לך ל-`/auth/login`
3. לחץ על "התחבר עם Google"
4. בחר חשבון Google והתחבר

## הערות חשובות:

- ✅ **חינמי לחלוטין** - אין עלויות נוספות
- ✅ **מובנה ב-Supabase** - לא צריך שרת נוסף
- ✅ **מאובטח** - משתמש ב-OAuth 2.0 הסטנדרטי
- ✅ **קל להגדרה** - רק צריך Client ID ו-Secret

## פתרון בעיות – התחברות עם גוגל לא עובדת

### טעות נפוצה 1: Redirect URI ב-Google לא נכון
- **ב-Google Console** ב-**Authorized redirect URIs** חייבת להיות **רק** הכתובת של Supabase:
  - `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
- **אל תוסיף** `http://localhost:3000/auth/callback` – גוגל לא מפנה ישירות לאפליקציה, אלא ל-Supabase.

### טעות נפוצה 2: ב-Supabase לא הוגדרו Redirect URLs
- ב-Supabase: **Authentication** > **URL Configuration** > **Redirect URLs**
- חובה להוסיף: `http://localhost:3000/auth/callback`
- בלי זה Supabase לא יפנה חזרה לאפליקציה אחרי ההתחברות.

### טעות נפוצה 3: OAuth consent screen לא מוגדר
- ב-Google Console: **APIs & Services** > **OAuth consent screen**
- אם המסך לא הוגדר, בחר User Type (למשל External), מלא שם אפליקציה וכתובת אימייל, ושמור.

### שגיאה: "redirect_uri_mismatch"
- ה-URI ב-Google חייב להיות **בדיוק** כמו ב-Supabase (כולל https, ללא סלאש בסוף).
- העתק מ-Supabase: **Authentication** > **Providers** > **Google** – שם מופיע ה-Callback URL.

### שגיאה: "invalid_client"
- ודא שה-Client ID וה-**Client Secret** הודבקו נכון ב-Supabase (ללא רווחים).
- ודא שבחרת ב-Google ב-**Web application** (לא Desktop/Android).

### המשתמש לא נוצר בטבלת users
- זה נורמלי - צריך ליצור trigger או לטפל בזה ב-callback
- ראה את הקובץ `supabase/triggers.sql` (אם קיים)

## מה קורה אחרי התחברות?

1. המשתמש מתחבר עם Google
2. Supabase יוצר משתמש ב-`auth.users`
3. צריך ליצור רשומה ב-`users` (ניתן לעשות זאת עם trigger)
4. המשתמש מועבר ל-`/dashboard`

## יצירת Trigger אוטומטי (מומלץ)

ניתן ליצור trigger שיוצר אוטומטית רשומה ב-`users` כשמשתמש חדש נרשם:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, is_patour, settings)
  VALUES (
    NEW.id,
    NEW.email,
    true,
    '{
      "invoice_prefix": "INV",
      "quote_prefix": "QUO",
      "currency": "ILS",
      "language": "he",
      "payment_terms": 30
    }'::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

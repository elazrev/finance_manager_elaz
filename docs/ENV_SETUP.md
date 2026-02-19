# הגדרת משתני סביבה

## בעיה: שגיאת 500

אם אתה מקבל שגיאת 500, זה כנראה בגלל שמשתני הסביבה של Supabase לא מוגדרים.

## פתרון:

1. **צור קובץ `.env.local`** בתיקיית הפרויקט (באותה רמה כמו `package.json`)

2. **העתק את התוכן הבא** והחלף בערכים שלך מ-Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
RESEND_API_KEY=your-resend-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **איך למצוא את הערכים ב-Supabase:**
   - היכנס ל-[Supabase Dashboard](https://app.supabase.com)
   - בחר את הפרויקט שלך
   - לך ל-**Settings** > **API**
   - העתק את:
     - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
     - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **הפעל מחדש את שרת הפיתוח:**
   ```bash
   # עצור את השרת (Ctrl+C)
   npm run dev
   ```

## הערות חשובות:

- ✅ הקובץ `.env.local` כבר ב-`.gitignore` - הוא לא יועלה ל-Git
- ✅ אל תשתף את המפתחות שלך בפומבי
- ✅ אחרי שינוי ב-`.env.local` תמיד הפעל מחדש את השרת

## בדיקה:

אחרי יצירת הקובץ והפעלה מחדש, נסה לגשת ל-`/quotes` - השגיאה אמורה להיעלם.

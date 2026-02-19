# התחלה מהירה - הוראות שלב אחר שלב

## ⚠️ שגיאה: "Your project's URL and Key are required"

אם אתה רואה את השגיאה הזו, זה אומר שמשתני הסביבה של Supabase לא מוגדרים.

## פתרון מהיר:

### שלב 1: צור קובץ `.env.local`

צור קובץ חדש בשם `.env.local` בתיקיית הפרויקט (באותה רמה כמו `package.json`)

### שלב 2: הוסף את התוכן הבא

העתק את הקוד הבא והחלף בערכים שלך מ-Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
RESEND_API_KEY=your-resend-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### שלב 3: איך למצוא את הערכים ב-Supabase

1. היכנס ל-[Supabase Dashboard](https://app.supabase.com)
2. בחר את הפרויקט שלך (או צור חדש)
3. לך ל-**Settings** (⚙️) > **API**
4. תמצא שני ערכים:
   - **Project URL** → העתק ל-`NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → העתק ל-`NEXT_PUBLIC_SUPABASE_ANON_KEY`

### שלב 4: הפעל מחדש את השרת

```bash
# עצור את השרת (Ctrl+C)
npm run dev
```

## ✅ אחרי זה:

1. האפליקציה תעבוד
2. תוכל להירשם ולהתחבר
3. תוכל ליצור הצעות מחיר

## 📝 הערות חשובות:

- ✅ הקובץ `.env.local` כבר ב-`.gitignore` - הוא לא יועלה ל-Git
- ✅ **אל תשתף** את המפתחות שלך בפומבי
- ✅ אחרי כל שינוי ב-`.env.local` צריך להפעיל מחדש את השרת
- ✅ ה-`RESEND_API_KEY` אופציונלי כרגע (נדרש רק לשליחת אימיילים)

## 🐛 עדיין יש בעיות?

1. ודא שהקובץ נקרא בדיוק `.env.local` (לא `.env.local.txt`)
2. ודא שאין רווחים לפני או אחרי ה-`=`
3. ודא שהערכים לא מוקפים בגרשיים
4. הפעל מחדש את השרת אחרי יצירת הקובץ

## 📚 שלבים נוספים:

לאחר שהכל עובד:
1. הרץ את ה-trigger ב-Supabase (`supabase/triggers.sql`)
2. הגדר Google OAuth (ראה [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md))

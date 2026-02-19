# מערכת אימות - סיכום

## ✅ מה נוצר:

### 1. דפי אימות
- ✅ `/auth/login` - דף התחברות עם אימייל/סיסמה ו-Google OAuth
- ✅ `/auth/register` - דף הרשמה עם אימייל/סיסמה ו-Google OAuth
- ✅ `/auth/callback` - טיפול ב-callback מ-Google OAuth
- ✅ `/auth/logout` - התנתקות

### 2. Middleware
- ✅ הגנה על דפים שדורשים התחברות
- ✅ Redirect אוטומטי לדף התחברות אם לא מחובר
- ✅ Redirect אוטומטי לדשבורד אם כבר מחובר

### 3. Header מעודכן
- ✅ מציג את מצב המשתמש (מחובר/לא מחובר)
- ✅ כפתורי התחברות/התנתקות דינמיים
- ✅ מציג את האימייל של המשתמש המחובר

### 4. Database Trigger
- ✅ יצירה אוטומטית של רשומה ב-`users` כשמשתמש חדש נרשם

## 🚀 איך להתחיל:

### שלב 1: הרץ את ה-Trigger ב-Supabase

1. היכנס ל-Supabase Dashboard
2. לך ל-**SQL Editor**
3. פתח את הקובץ `supabase/triggers.sql`
4. העתק והדבק את התוכן
5. לחץ **Run**

זה ייצור trigger שיוצר אוטומטית רשומה ב-`users` כשמשתמש חדש נרשם.

### שלב 2: הגדר Google OAuth (אופציונלי אבל מומלץ)

עקוב אחר ההוראות ב-[GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)

**זה חינמי לחלוטין!** 🎉

### שלב 3: בדוק את המערכת

1. הרץ את השרת: `npm run dev`
2. לך ל-`http://localhost:3000`
3. לחץ על "הרשמה" או "התחברות"
4. נסה להירשם או להתחבר

## 📋 דפים מוגנים (דורשים התחברות):

- `/dashboard`
- `/clients`
- `/invoices`
- `/quotes`
- `/items`
- `/reports`
- `/settings`

## 📋 דפים פתוחים (לא דורשים התחברות):

- `/` - דף בית
- `/auth/login`
- `/auth/register`

## 🔐 איך זה עובד:

1. **הרשמה רגילה**:
   - המשתמש ממלא טופס הרשמה
   - Supabase יוצר משתמש ב-`auth.users`
   - Trigger יוצר רשומה ב-`users`
   - המשתמש מועבר ל-`/dashboard`

2. **התחברות עם Google**:
   - המשתמש לוחץ "התחבר עם Google"
   - מועבר ל-Google להתחברות
   - Google מחזיר ל-`/auth/callback`
   - Supabase יוצר משתמש ב-`auth.users`
   - Trigger יוצר רשומה ב-`users`
   - המשתמש מועבר ל-`/dashboard`

3. **הגנה על דפים**:
   - Middleware בודק אם יש משתמש מחובר
   - אם לא → מעביר ל-`/auth/login`
   - אם כן → מאפשר גישה

## 🐛 פתרון בעיות:

### המשתמש לא נוצר ב-`users`
- ודא שהרצת את ה-trigger (`supabase/triggers.sql`)
- בדוק את ה-logs ב-Supabase

### Google OAuth לא עובד
- ודא שהגדרת את Client ID ו-Secret ב-Supabase
- ודא שה-URL ב-Google Console נכון
- ראה [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) לפרטים

### Middleware לא עובד
- ודא שקובץ `middleware.ts` קיים בתיקיית הפרויקט
- ודא שמשתני הסביבה מוגדרים ב-`.env.local`
- הפעל מחדש את השרת

## ✨ תכונות נוספות שניתן להוסיף:

- [ ] שחזור סיסמה (`/auth/forgot-password`)
- [ ] אימות דו-שלבי (2FA)
- [ ] עדכון פרופיל
- [ ] שינוי סיסמה
- [ ] ניהול סשנים

## 📝 הערות:

- כל הנתונים מוגנים ב-Row Level Security (RLS)
- כל משתמש רואה רק את הנתונים שלו
- Google OAuth הוא חינמי לחלוטין
- המערכת מוכנה ל-production

# צ'קליסט לפני קומיט ראשון ופריסה

## 🔐 אבטחה ומשתני סביבה

### לפני הקומיט
- [x] **ניקוי `.env.local.example`** – להחליף כל ערך אמיתי ב-placeholder בלבד
  - `NEXT_PUBLIC_SUPABASE_URL` → `https://your-project-id.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → `your_anon_key_here`
  - `RESEND_API_KEY` → `re_xxxxxxxxxxxx` (או placeholder אחר)
  - לתקן טעות כתיב: `shttps` → `https`
- [x] **וידוא `.gitignore`** – לבדוק ש־`.env`, `.env*.local` ומפתחות אינם נכנסים ל-Git
- [x] **סריקת קבצים** – לוודא שאין מפתחות, סיסמאות או tokens מודבקים בקוד

### בפריסה (Environment Variables)

כל המפתחות והמפתחים יוגדרו כמשתני סביבה בפלטפורמת הפריסה (Vercel, Netlify וכו'):

| משתנה | חובה | תיאור |
|-------|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | כתובת פרויקט Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | מפתח anon ציבורי מ-Supabase |
| `RESEND_API_KEY` | אופציונלי | לשליחת חשבוניות/הצעות באימייל |
| `RESEND_FROM_EMAIL` | אופציונלי | כתובת השולח (נדרש אם משתמשים ב-Resend) |
| `NEXT_PUBLIC_APP_URL` | מומלץ | כתובת האפליקציה בפרודקשן (למשל `https://your-app.vercel.app`) |

**הערה:** משתנים שמתחילים ב-`NEXT_PUBLIC_` נחשפים ללקוח. רק מפתחות שמורים (כמו anon key) יכולים להיות שם. `RESEND_API_KEY` לא אמור להתחיל ב-`NEXT_PUBLIC_` ולכן נשאר מוסתר בצד השרת.

---

## 📝 תיעוד

- [x] **README.md** – עדכון עם:
  - הוראות התקנה מלאות
  - קישור ל-`SUPABASE_SETUP.md`
  - מבנה פרויקט מעודכן
  - רשימת משתני סביבה נדרשים
- [x] **STATUS.md** – עדכון עם תכונות אחרונות (Theme, מובייל, הגדרות מסמכים)
- [x] **תוכנית_פיתוח.md** – משמש כרפרנס היסטורי; README מצביע על SUPABASE_SETUP ו-STATUS
- [x] **SUPABASE_SETUP.md** – מתועד; מיגרציות ב-`supabase/migrations/`

---

## 🧹 איכות קוד והרצה

- [x] **Lint:** הרצת `npm run lint` – תיקון כל השגיאות
- [x] **Build:** הרצת `npm run build` – וידוא שהבניה עוברת
- [x] **הסרת `console.log`** – אין debug בקוד המשתמש
- [ ] **imports** – הסרת imports לא בשימוש (אם יש)

---

## 🚀 פריסה

### הכנות
- [ ] **בחירת פלטפורמה** – Vercel (מומלץ ל-Next.js), Netlify, או אחר
- [ ] **הגדרת משתני סביבה** בפלטפורמת הפריסה – העתקת הערכים מ-`.env.local` (לא את הקובץ עצמו)
- [ ] **Supabase** – לוודא שהפרויקט תומך בבקשות מהדומיין של הפריסה (CORS, Redirect URLs)
- [ ] **Resend** – אם משתמשים: לוודא דומיין מאומת לפרודקשן

### הגדרות נוספות ב-Supabase
- [ ] **Authentication → URL Configuration:**
  - Site URL: `https://your-app-domain.com`
  - Redirect URLs: להוסיף את כתובת האפליקציה בפרודקשן
- [ ] **אם משתמשים ב-Google OAuth:** להוסיף את ה-URL של האפליקציה ב-Google Cloud Console

---

## 📦 קבצים ומבנה

- [ ] **LICENSE** – להוסיף אם הפרויקט פתוח (למשל MIT). פרויקט פרטי – לא נדרש
- [x] **.cursorignore / .gitignore** – `.next`, `node_modules`, `.env*` מוגדרים נכון
- [x] **package.json** – name, description, version מעודכנים

---

## ✅ בדיקה אחרונה

- [ ] הרצת האפליקציה לוקאלית עם `npm run dev`
- [ ] התחברות והתנתקות
- [ ] יצירת חשבונית / הצעת מחיר
- [ ] תצוגת מובייל בסיסית
- [ ] החלפת Theme (בהיר/כהה/מערכת)

---

## סיכום משתני סביבה לפריסה

```
# חובה
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# אופציונלי – אימייל
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=invoice@yourdomain.com

# מומלץ
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**חשוב:** אף מפתח אמיתי לא ייכנס ל-Git. בפריסה מגדירים את כל הערכים בממשק של פלטפורמת ההפצה.

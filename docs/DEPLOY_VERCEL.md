# פריסה ל-Vercel

מדריך להגדרת פריסה אוטומטית בכל push ל-`main`.

**שיטת הפריסה:** Vercel מחובר ישירות ל-GitHub – כל push ל-`main` מפעיל פריסה אוטומטית.  
**GitHub Actions** מריץ רק CI (lint + build) לוולידציה לפני שהקוד מגיע ל-main.

---

## שלב 1: חיבור הריפו ל-Vercel

1. היכנס ל-[vercel.com](https://vercel.com) (חינמי עם חשבון GitHub)
2. לחץ **Add New** → **Project**
3. ייבא את הריפו `finance_manager_elaz` מ-GitHub
4. **Deploy** – Vercel יפרוס אוטומטית בכל push ל-`main`

---

## שלב 2: משתני סביבה ב-Vercel

**חובה** – בלי זה הבילד ייכשל.

1. Vercel → הפרויקט → **Settings** → **Environment Variables**
2. הוסף (לכל הסביבות – Production, Preview, Development):

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | מפתח anon מ-Supabase (מתחיל ב-`eyJ`) |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |

3. **Redeploy** – אחרי הוספת המשתנים, הרץ פריסה מחדש.

**אופציונלי (לשליחת אימייל):**
| Name | Value |
|------|-------|
| `RESEND_API_KEY` | מפתח Resend |
| `RESEND_FROM_EMAIL` | כתובת השולח |

---

## שלב 3: הגדרות ב-Supabase

1. **Authentication** → **URL Configuration**
2. **Site URL:** `https://your-app.vercel.app`
3. **Redirect URLs:** הוסף `https://your-app.vercel.app/**`

---

## GitHub Actions (CI)

ה-workflow ב-`.github/workflows/deploy.yml` מריץ **lint** ו-**build** בכל push ל-`main`.  
זה לא מפריס – הפריסה נעשית על ידי Vercel.

**נדרש:** GitHub Secrets (לוולידציית build):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

**אם הבילד נכשל עם "משתני סביבה של Supabase לא מוגדרים"** – הוסף את ה-Secrets ב-GitHub: **Settings** → **Secrets and variables** → **Actions**.

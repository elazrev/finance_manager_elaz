# פריסה ל-Vercel עם GitHub Actions

מדריך להגדרת פריסה אוטומטית בכל push ל-`main`.

## שלב 1: יצירת פרויקט ב-Vercel

1. היכנס ל-[vercel.com](https://vercel.com) (חינמי עם חשבון GitHub)
2. לחץ **Add New** → **Project**
3. ייבא את הריפו מ-GitHub (חבר את חשבון GitHub אם צריך)
4. **אל תבצע Deploy עכשיו** – נגדיר דרך GitHub Actions. או שתבצע Deploy ראשון כדי ליצור את הפרויקט.

## שלב 2: קבלת מזהי Vercel

1. ב-Vercel: **Settings** → **General**
2. העתק את **Project ID**
3. עבור ל-**Account Settings** (פרופיל) → **General** → העתק את **Team/Org ID**

## שלב 3: יצירת Token ב-Vercel

1. [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. **Create Token** – שם (למשל `github-actions`)
3. העתק את ה-Token (מוצג פעם אחת בלבד)

## שלב 4: הגדרת GitHub Secrets

ב-GitHub: **Repository** → **Settings** → **Secrets and variables** → **Actions**

הוסף את ה-Secrets הבאים:

| Secret | תיאור |
|--------|-------|
| `VERCEL_TOKEN` | ה-Token מ-Vercel |
| `VERCEL_ORG_ID` | Team/Org ID מ-Vercel |
| `VERCEL_PROJECT_ID` | Project ID מ-Vercel |
| `NEXT_PUBLIC_SUPABASE_URL` | כתובת Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | מפתח anon מ-Supabase |
| `NEXT_PUBLIC_APP_URL` | כתובת האפליקציה (למשל `https://your-app.vercel.app`) |

**אופציונלי (לשליחת אימייל):**
| Secret | תיאור |
|--------|-------|
| `RESEND_API_KEY` | מפתח Resend |
| `RESEND_FROM_EMAIL` | כתובת השולח |

## שלב 5: הגדרות ב-Supabase

1. **Authentication** → **URL Configuration**
2. **Site URL:** `https://your-app.vercel.app`
3. **Redirect URLs:** הוסף `https://your-app.vercel.app/**`

## זרימת העבודה

- כל **push** ל-`main` מפעיל את ה-workflow
- הרצת `npm run lint` ו-`npm run build`
- פריסה ל-Vercel (Production)

## חלופה: פריסה ישירה מ-Vercel

אפשר גם לחבר את הריפו ל-Vercel בלי GitHub Actions – Vercel יפרוס אוטומטית בכל push.  
ה-workflow הנוכחי מוסיף בדיקות (lint, build) לפני הפריסה.

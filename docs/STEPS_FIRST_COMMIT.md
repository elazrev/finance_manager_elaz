# שלבים לקומיט הראשון

מדריך מסודר למי שמוכן לבצע את הקומיט הראשון ולפרוס לפרודקשן.

---

## 1. אתחול Git (אם עדיין לא)

```bash
git init
```

---

## 2. וידוא אבטחה – אין סודות בקוד

### ✅ בדוק ש־`.env.local` לא ייכנס

- הקובץ `.env.local` כבר ב־`.gitignore`
- **לעולם אל תוסיף** את `.env.local` ל־git

### ✅ ודא ש־`.env.local.example` נקי

הקובץ צריך להכיל רק placeholders:
- `NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here`
- `RESEND_API_KEY=re_xxxxxxxxxxxx`

### 🔍 סריקה ידנית

```bash
# ודא שאין מפתחות אמיתיים בקבצי הקוד
grep -r "eyJ" . --include="*.ts" --include="*.tsx" --include="*.js" 2>/dev/null | grep -v node_modules
# אם מוצא משהו – הסר!
```

---

## 3. הרצת בדיקות

```bash
# Lint – תיקון שגיאות
npm run lint

# Build – וידוא שהבניה עוברת
npm run build
```

אם יש שגיאות – תקן לפני הקומיט.

---

## 4. בדיקה מקדימה ל־`git status`

```bash
# ראה מה ייכנס לקומיט
git status

# ודא שאין כאן:
# - .env.local
# - .env
# - node_modules
# - .next
# - import-data.json
```

---

## 5. הוספה וקומיט

```bash
# הוסף את כל הקבצים (מעקב .gitignore)
git add .

# בדוק שוב
git status

# קומיט ראשון
git commit -m "Initial commit: אפליקציית ניהול חשבונות – פטור עוסק"
```

---

## 6. (אופציונלי) חיבור לריפו מרחוק

```bash
# לדוגמה – GitHub
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

---

## 7. פריסה (Vercel / Netlify)

### הכנות לפני הפריסה

1. **בחר פלטפורמה** – Vercel מומלץ ל־Next.js
2. **חבר את הריפו** – ייבוא הפרויקט מ־GitHub
3. **הגדר משתני סביבה** בממשק של הפלטפורמה:

   | משתנה | חובה |
   |-------|------|
   | `NEXT_PUBLIC_SUPABASE_URL` | ✅ |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ |
   | `NEXT_PUBLIC_APP_URL` | מומלץ (כתובת האפליקציה הפרושה) |
   | `RESEND_API_KEY` | אופציונלי |
   | `RESEND_FROM_EMAIL` | אופציונלי |

### הגדרות ב־Supabase

- **Authentication → URL Configuration:**
  - Site URL: `https://your-app.vercel.app` (או הדומיין שלך)
  - Redirect URLs: הוסף את כתובת האפליקציה

---

## סיכום מהיר

| # | פעולה |
|---|--------|
| 1 | `git init` (אם צריך) |
| 2 | בדיקה שאין סודות בקוד |
| 3 | `npm run lint` + `npm run build` |
| 4 | `git add .` + `git status` |
| 5 | `git commit -m "Initial commit: ..."` |
| 6 | `git remote add` + `git push` (אם רוצים) |
| 7 | פריסה + הגדרת משתני סביבה |

---

**ראו גם:** [CHECKLIST_PRE_COMMIT.md](./CHECKLIST_PRE_COMMIT.md)

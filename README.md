# אפליקציית ניהול חשבונות - פטור עוסק

מערכת ניהול חשבונות פשוטה וקלה לשימוש עבור עוסקים פטורים בישראל.

## טכנולוגיות

- **Next.js 14** - Framework ראשי עם App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Supabase** - Backend (Database, Auth, Storage)
- **React Query** - State management
- **Zod** - Validation
- **React Hook Form** - Form handling

## התקנה

### 1. התקנת תלויות

```bash
npm install
```

### 2. משתני סביבה

העתק את קובץ התבנית ועכל את הערכים:

```bash
cp .env.local.example .env.local
```

ערוך את `.env.local` והגדר:

| משתנה | חובה | תיאור |
|-------|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | כתובת פרויקט Supabase (Settings → API → Project URL) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | מפתח anon מ-Supabase (Settings → API → anon public) |
| `RESEND_API_KEY` | אופציונלי | לשליחת חשבוניות/הצעות באימייל ([resend.com](https://resend.com)) |
| `RESEND_FROM_EMAIL` | אופציונלי | כתובת השולח (לבדיקות: onboarding@resend.dev) |
| `NEXT_PUBLIC_APP_URL` | מומלץ | כתובת האפליקציה (לוקאלי: http://localhost:3000) |

### 3. הגדרת Supabase

עקוב אחר ההוראות המפורטות ב **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**:
- הרצת `supabase/schema.sql`
- הרצת `supabase/triggers.sql` (חובה ל-Google OAuth)
- מיגרציות: `supabase/migrations/`

### 4. הרצת שרת הפיתוח

```bash
npm run dev
```

פתח [http://localhost:3000](http://localhost:3000) בדפדפן.

## מבנה הפרויקט

```
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout (RTL, Theme)
│   ├── page.tsx           # דף בית
│   ├── dashboard/         # דשבורד
│   ├── invoices/          # חשבוניות
│   ├── quotes/            # הצעות מחיר
│   ├── payment-requests/  # דרישות תשלום
│   ├── clients/           # לקוחות
│   ├── items/             # פריטים
│   ├── reports/           # דוחות
│   ├── settings/          # הגדרות
│   └── auth/              # התחברות, הרשמה
├── components/
│   ├── ui/               # קומפוננטות Shadcn
│   ├── layout/           # Header, Sidebar, AppShell
│   └── theme-provider.tsx
├── lib/
│   ├── supabase/         # Supabase clients
│   ├── formatters.ts
│   ├── constants.ts
│   └── validations/      # Zod schemas
├── types/
├── supabase/
│   ├── schema.sql
│   ├── triggers.sql
│   └── migrations/
└── docs/                    # מסמכי פיתוח והגדרה
```

## תכונות

- **מסמכים:** חשבוניות, הצעות מחיר, דרישות תשלום
- **לקוחות ופריטים:** ניהול מלא
- **דשבורד:** סטטיסטיקות, גרפי הכנסות, פעולות אחרונות
- **דוחות:** ספר הכנסות, חייבים, לקוחות, הצעות – ייצוא ל-PDF ול-Excel
- **שליחת אימייל:** חשבוניות והצעות דרך Resend
- **תצוגת מובייל:** responsive, תפריט hamburger, כרטיסיות בטבלאות
- **ערכת נושא:** בהיר / כהה / לפי המערכת
- **הגדרות מסמכים:** לוגו, חתימה, פוטר, פרטי מנפיק (שורה/טורית)

## פריסה

לפני פריסה ראשונה – עיין ב **[docs/CHECKLIST_PRE_COMMIT.md](./docs/CHECKLIST_PRE_COMMIT.md)**.

**משתני סביבה בפריסה:** הגדר את כל הערכים ב-Vercel/Netlify – לא להעלות `.env.local` ל-Git.

## מסמכים נוספים

- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) – הגדרת מסד נתונים
- [STATUS.md](./STATUS.md) – סטטוס פיתוח
- [docs/](./docs/) – מדריכי התקנה, OAuth, צ'קליסט פריסה ועוד

## רישיון

Private - All rights reserved

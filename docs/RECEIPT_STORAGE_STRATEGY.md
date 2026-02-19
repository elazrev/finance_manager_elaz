# אסטרטגיית אחסון צילומי חשבוניות – חסכון במקום

## הרקע

- **Supabase Free**: 1 GB אחסון, עד 50 MB לקובץ
- **צילום טיפוסי ממסך**: 2–5 MB (רצף 12MP)
- **חישוב**: בלי דחיסה – 1 GB ≈ 200–500 תמונות בלבד

עם דחיסה מתאימה ניתן להגיע ל־**~80–150 KB** לצילום → כ־**7,000–12,000 תמונות ב־1 GB**.

---

## אסטרטגיות אפשריות

### 1. דחיסה בצד השרת (Sharp) – **מומלץ**

**רעיון:** דחיסה ב־API route לפני העלאה ל־Supabase.

```ts
// דוגמה: app/api/expenses/upload/route.ts
import sharp from "sharp";

// קלט: FormData עם file
const buffer = await file.arrayBuffer();
const compressed = await sharp(Buffer.from(buffer))
  .resize(1200, 1200, { fit: "inside", withoutEnlargement: true }) // מספיק לרוב הקבלות
  .webp({ quality: 80 })
  .toBuffer();
// העלאה ל-Supabase: compressed במקום הקובץ המקורי
```

| פרמטר | ערך | הסבר |
|-------|-----|------|
| רוחב מקסימלי | 1200px | מספיק לטקסט קריא לקבלה |
| פורמט | WebP | חיסכון ניכר מ־JPEG/PNG |
| איכות | 75–85 | מאזן בין גודל לאיכות |

**יתרונות:** שליטה מלאה, גודל קבוע לצפי, עובד מכל מכשיר.  
**חסרונות:** צורך ב־Sharp, עומס CPU בשרת.

---

### 2. דחיסה בצד הלקוח (browser-image-compression)

**רעיון:** דחיסה בדפדפן לפני השליחה לשרת.

```ts
import imageCompression from "browser-image-compression";

const options = {
  maxSizeMB: 0.2,        // עד 200 KB
  maxWidthOrHeight: 1200,
  useWebWorker: true,
};
const compressed = await imageCompression(file, options);
// שליחה ל-API
```

**יתרונות:** חיסכון ברוחב פס, פחות עומס על השרת.  
**חסרונות:** תוצאות לא אחידות, לא עובד טוב במובייל ישן.

---

### 3. גישה היברידית (מומלץ לטווח ארוך)

1. **לקוח:** דחיסה ראשונית (browser-image-compression) – הקטנת גודל לפני העלאה.
2. **שרת:** אם הקובץ עדיין גדול – דחיסה נוספת עם Sharp.
3. **אחסון:** שמירה בפורמט WebP ב־Supabase Storage.

---

### 4. Supabase Image Transformations – **לא לפתרון האחסון**

- Transformations משמשות **להצגה**, לא לאחסון.
- מניעות רק egress, לא מקטינות את הנפח ב־Storage.
- דורשות **Pro Plan** (100 תמונות origin בחינם, אח"כ $5 ל־1,000).

לכן זה לא פותר את בעיית האחסון.

---

## המלצה יישומית

| שלב | פעולה |
|-----|--------|
| 1 | הוספת `sharp` לפרויקט |
| 2 | API route שמקבל קובץ, מדחיס ב־Sharp, מעלה ל־Storage |
| 3 | הגבלת גודל קלט (למשל 10 MB) – דחייה אם גדול מדי |
| 4 | (אופציונלי) דחיסה מקדימה בלקוח – library קטנה, חיסכון ברוחב פס |

**פרמטרים לדחיסה לקבלות:**

- `resize`: 1200px (אורך הצלע הארוכה)
- `webp quality`: 80
- תוצאה טיפוסית: **80–200 KB** לקובץ

**חישוב להערכה:**
- 1 GB Free tier ÷ 150 KB ≈ **~6,500 תמונות**
- 100 משתמשים, 65 קבלות בממוצע למשתמש
- או: 500 משתמשים עם ~13 קבלות כל אחד

---

## תלות בפרויקט

```bash
npm install sharp
```

`sharp` הוא native module – עלול לדרוש build tools (python, node-gyp) בפרודקשן. ב־Vercel זה מוכן מהקופסה.

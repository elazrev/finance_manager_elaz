# מדריך התקנה - Node.js ו-npm

## אפשרות 1: התקנה עם Homebrew (מומלץ)

אם יש לך Homebrew מותקן:

```bash
# עדכן את Homebrew
brew update

# התקן את Node.js (כולל npm)
brew install node

# בדוק שההתקנה הצליחה
node --version
npm --version
```

## אפשרות 2: התקנה ישירה מ-Node.js

1. היכנס לאתר [nodejs.org](https://nodejs.org/)
2. הורד את הגרסה ה-LTS (Long Term Support) - מומלץ
3. פתח את קובץ ה-.pkg שהורדת
4. עקוב אחר הוראות ההתקנה
5. הפעל מחדש את הטרמינל
6. בדוק שההתקנה הצליחה:
   ```bash
   node --version
   npm --version
   ```

## אפשרות 3: התקנה עם nvm (Node Version Manager)

nvm מאפשר לך לנהל מספר גרסאות של Node.js:

```bash
# התקן את nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# הפעל מחדש את הטרמינל או הרץ:
source ~/.zshrc

# התקן את הגרסה האחרונה של Node.js LTS
nvm install --lts

# השתמש בגרסה הזו
nvm use --lts

# הגדר אותה כברירת מחדל
nvm alias default node

# בדוק שההתקנה הצליחה
node --version
npm --version
```

## בדיקת ההתקנה

לאחר ההתקנה, הרץ את הפקודות הבאות כדי לוודא שהכל עובד:

```bash
node --version   # צריך להציג משהו כמו v20.x.x או v18.x.x
npm --version    # צריך להציג משהו כמו 10.x.x או 9.x.x
```

## התקנת התלויות של הפרויקט

לאחר שהתקנת Node.js ו-npm, התקן את התלויות של הפרויקט:

```bash
cd "/Users/user/Programming Projects/Buisness_Management"
npm install
```

זה יתקין את כל החבילות הנדרשות (Next.js, React, Supabase, וכו').

## פתרון בעיות

### אם npm לא נמצא אחרי התקנת Node.js:
1. הפעל מחדש את הטרמינל
2. בדוק את ה-PATH:
   ```bash
   echo $PATH
   ```
3. אם צריך, הוסף ל-`~/.zshrc`:
   ```bash
   export PATH="/usr/local/bin:$PATH"
   ```

### אם יש שגיאות הרשאה:
```bash
# שנה את הבעלות על תיקיית npm הגלובלית
sudo chown -R $(whoami) ~/.npm
```

## גרסאות מומלצות

- **Node.js**: v20.x.x או v18.x.x (LTS)
- **npm**: מגיע עם Node.js, בדרך כלל v10.x.x או v9.x.x

## המשך לפיתוח

לאחר שהתקנת את Node.js ו-npm:

1. התקן את התלויות:
   ```bash
   npm install
   ```

2. הגדר את Supabase (ראה `SUPABASE_SETUP.md`)

3. צור קובץ `.env.local` עם ה-API keys

4. הרץ את שרת הפיתוח:
   ```bash
   npm run dev
   ```

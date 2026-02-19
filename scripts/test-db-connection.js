/**
 * סקריפט בדיקת קישוריות ל-Supabase
 * הרצה: node scripts/test-db-connection.js
 *
 * טוען אוטומטית מ-.env.local (אם קיים)
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// טעינת .env.local
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  content.split("\n").forEach((line) => {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  });
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function test() {
  console.log("🔍 בודק קישוריות ל-Supabase...\n");

  if (!url || !key) {
    console.error("❌ חסרים משתני סביבה.");
    console.error("   ודא שקובץ .env.local קיים בתיקיית הפרויקט עם:");
    console.error("   NEXT_PUBLIC_SUPABASE_URL ו-NEXT_PUBLIC_SUPABASE_ANON_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key);

  try {
    // בדיקה 1: גישה ל-REST API
    const { data, error } = await supabase.from("users").select("id").limit(1);
    
    if (error) {
      if (error.message?.includes("Could not resolve host") || error.message?.includes("getaddrinfo")) {
        console.error("❌ בעיית DNS – לא מצליח לפתור את כתובת Supabase");
        console.error("   בדוק חיבור אינטרנט, DNS, או חומת אש");
      } else if (error.message?.includes("timeout") || error.code === "ETIMEDOUT") {
        console.error("❌ Timeout – השרת לא מגיב. ייתכן חסימה ברשת");
      } else {
        console.error("❌ שגיאה:", error.message);
        console.error("   (שגיאת 401/PGRST301 היא תקינה – משמעותה שהחיבור עבד אבל אין הרשאה)");
      }
      process.exit(1);
    }

    console.log("✅ קישוריות תקינה! החיבור ל-Supabase עובד.");
    console.log("   (קבלת רשומות או רשימה ריקה – שניהם תקינים)\n");
  } catch (err) {
    console.error("❌ שגיאה:", err.message);
    if (err.cause?.code === "ENOTFOUND") {
      console.error("   DNS לא מצא את השרת – בדוק אינטרנט/DNS");
    }
    process.exit(1);
  }
}

test();

import { createBrowserClient } from "@supabase/ssr";

function isValidSupabaseUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export function createClient() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "משתני סביבה של Supabase לא מוגדרים. אנא צור קובץ .env.local עם NEXT_PUBLIC_SUPABASE_URL ו-NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  if (!isValidSupabaseUrl(supabaseUrl)) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL חייב להיות כתובת מלאה, למשל: https://your-project-id.supabase.co (ב-Supabase: Settings → API → Project URL)"
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_SETTINGS = {
  invoice_prefix: "INV",
  quote_prefix: "QUO",
  payment_request_prefix: "DR",
  currency: "ILS",
  language: "he",
  payment_terms: 30,
  email_signature: "",
  whatsapp_enabled: false,
};

/** שם תצוגה ממטא-דאטה (Google: full_name/name, הרשמה: business_name) */
function displayNameFromMetadata(meta: User["user_metadata"]): string | null {
  if (!meta) return null;
  const name =
    (meta as Record<string, unknown>).full_name ??
    (meta as Record<string, unknown>).name ??
    (meta as Record<string, unknown>).business_name;
  return typeof name === "string" && name.trim() ? name.trim() : null;
}

/**
 * מבטיח שלמשתמש המחובר יש רשומה בטבלת public.users.
 * שימושי כשמשתמש נרשם עם Google והטריגר לא רץ, או כש-users נוצר ידנית.
 * ממלא business_name משם המשתמש (full_name / name) אם קיים.
 */
export async function ensureUserInPublic(supabase: SupabaseClient, user: User): Promise<void> {
  const businessName =
    displayNameFromMetadata(user.user_metadata) ??
    (user.user_metadata?.business_name as string | undefined) ??
    null;
  const { error: upsertError } = await supabase.from("users").upsert(
    {
      id: user.id,
      email: user.email ?? "",
      business_name: businessName,
      is_patour: true,
      settings: DEFAULT_SETTINGS,
    },
    { onConflict: "id", ignoreDuplicates: true }
  );
  if (upsertError) {
    console.error("ensureUserInPublic:", upsertError);
    throw upsertError;
  }
  // אם המשתמש כבר היה בטבלה אבל בלי שם – למלא משם ה-OAuth
  if (businessName) {
    await supabase
      .from("users")
      .update({ business_name: businessName })
      .eq("id", user.id)
      .is("business_name", null);
  }
}

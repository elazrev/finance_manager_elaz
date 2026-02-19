import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUserInPublic } from "@/lib/supabase/ensure-user";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("redirect") || "/dashboard";
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  // If OAuth provider returned an error, redirect to login with message
  if (error) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("error", errorDescription || error);
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    // No code - redirect to dashboard (might be already logged in)
    return NextResponse.redirect(new URL(next, request.url));
  }

  const supabase = await createClient();
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("Auth callback error:", exchangeError);
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("error", exchangeError.message);
    return NextResponse.redirect(loginUrl);
  }

  // יוצר/מעדכן רשומת משתמש ב-public.users מיד אחרי התחברות (חשוב ל-Google OAuth)
  if (data?.user) {
    try {
      await ensureUserInPublic(supabase, data.user);
    } catch (err) {
      console.error("ensureUserInPublic in callback:", err);
      // לא עוצרים את ההתחברות – ensureUserInPublic יופעל גם ב-API
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) {
        setUser(u);
        setCountdown(3);
      }
    });
  }, []);

  useEffect(() => {
    if (!user || countdown === null) return;
    if (countdown <= 0) {
      router.replace("/dashboard");
      return;
    }
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [user, countdown, router]);

  const hasEnvVars = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  if (!hasEnvVars) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/40 to-slate-950 flex items-center justify-center p-6">
        <div className="max-w-lg w-full rounded-2xl bg-white/5 backdrop-blur-sm p-8 border border-white/10">
          <h1 className="text-xl font-bold text-amber-400 mb-4">משתני סביבה לא מוגדרים</h1>
          <p className="text-slate-300 text-sm mb-4">
            הגדר את משתני הסביבה של Supabase בקובץ .env.local
          </p>
          <pre className="p-4 bg-black/20 rounded-lg text-xs text-slate-400 overflow-x-auto">
            {`NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...`}
          </pre>
          <p className="text-slate-500 text-xs mt-4">
            ראה docs/QUICK_START.md להוראות
          </p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/40 to-slate-950 flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 text-amber-300 text-sm">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            מחובר · מפנה לדשבורד
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            ברוכים הבאים בחזרה
          </h1>
          <p className="text-slate-400 text-lg">
            {countdown !== null && countdown > 0
              ? `מעביר אותך לדשבורד בעוד ${countdown}...`
              : "מעביר..."}
          </p>
          <Link href="/dashboard">
            <Button className="mt-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold">
              מעבר מיידי לדשבורד
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/40 to-slate-950 flex flex-col items-center justify-center overflow-hidden">
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, white 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <main className="relative z-10 flex flex-col items-center justify-center flex-1 w-full max-w-2xl px-6 py-12">
        <h1
          className="text-5xl sm:text-6xl md:text-7xl font-bold text-white text-center mb-6 tracking-tight opacity-0 animate-landing-welcome drop-shadow-lg"
        >
          ברוכים הבאים
        </h1>

        <p
          className="text-slate-300 text-lg sm:text-xl text-center mb-12 max-w-md opacity-0 animate-landing-subtitle"
        >
          מערכת ניהול חשבונות לעוסק פטור
        </p>

        <div
          className="flex flex-col sm:flex-row gap-4 opacity-0 animate-landing-buttons"
        >
          <Link href="/auth/login">
            <Button
              size="lg"
              className="min-w-[140px] bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30 h-12 px-8 text-base backdrop-blur-sm"
            >
              התחברות
            </Button>
          </Link>
          <Link href="/auth/register">
            <Button
              size="lg"
              className="min-w-[140px] bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold h-12 px-8 text-base shadow-lg shadow-amber-900/20"
            >
              הרשמה
            </Button>
          </Link>
        </div>
      </main>

      <footer
        className="relative z-10 w-full py-8 px-6 text-center space-y-2 opacity-0 animate-landing-footer"
      >
        <p className="text-slate-400 text-base sm:text-lg font-medium tracking-wide">
          פשוט, זול, יעיל ואמין
        </p>
        <p className="text-slate-500 text-lg sm:text-xl font-semibold">
          נהל את העסק שלך כמו גדול
        </p>
      </footer>
    </div>
  );
}

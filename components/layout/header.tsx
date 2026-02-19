"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu } from "lucide-react";
import type { User } from "@supabase/supabase-js";

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Check current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    await fetch("/auth/logout", { method: "POST" });
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2 min-h-[56px]">
        <div className="flex items-center gap-3 min-w-0">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              className="md:hidden shrink-0 p-2 -m-2 rounded-lg hover:bg-accent touch-manipulation"
              aria-label="פתח תפריט"
            >
              <Menu className="h-6 w-6" />
            </button>
          )}
          <Link href="/" className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">ניהול חשבונות</h1>
          </Link>
        </div>
        <nav className="flex items-center gap-2 sm:gap-4 shrink-0">
          {loading ? (
            <div className="text-sm text-muted-foreground">טוען...</div>
          ) : user ? (
            <>
              <span className="text-sm text-muted-foreground truncate max-w-[120px] sm:max-w-none hidden sm:inline">
                {user.email}
              </span>
              <Button variant="ghost" size="sm" className="touch-manipulation min-h-[44px] min-w-[44px]" onClick={handleLogout}>
                התנתק
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="touch-manipulation min-h-[44px]">התחברות</Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm" className="touch-manipulation min-h-[44px]">הרשמה</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

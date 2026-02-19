"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LayoutDashboard, Users, FileText, Package, CreditCard, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const DOC_TYPES = [
  { name: "חשבוניות", href: "/invoices" },
  { name: "דרישות תשלום", href: "/payment-requests" },
  { name: "הצעות מחיר", href: "/quotes" },
] as const;

const NEW_DOC_LINKS = [
  { name: "חשבונית חדשה", href: "/invoices/new" },
  { name: "דרישת תשלום חדשה", href: "/payment-requests/new" },
  { name: "הצעת מחיר חדשה", href: "/quotes/new" },
] as const;

const navigation = [
  { name: "דשבורד", href: "/dashboard", icon: LayoutDashboard, isDoc: false },
  { name: "לקוחות", href: "/clients", icon: Users, isDoc: false },
  { name: "מסמכים", icon: FileText, isDoc: true },
  { name: "פריטים", href: "/items", icon: Package, isDoc: false },
  { name: "הוצאות", href: "/expenses", icon: CreditCard, isDoc: false },
  { name: "דוחות", href: "/reports", icon: BarChart3, isDoc: false },
  { name: "הגדרות", href: "/settings", icon: Settings, isDoc: false },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [docsOpen, setDocsOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  const isOnDocRoute =
    pathname.startsWith("/invoices") ||
    pathname.startsWith("/payment-requests") ||
    pathname.startsWith("/quotes");

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setDocsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const close = () => onNavigate?.();

  return (
    <aside ref={sidebarRef} className="w-64 min-h-screen p-4 border-l bg-background shadow-xl md:shadow-none">
      <nav className="space-y-2">
        {navigation.map((item) => {
          if (item.isDoc) {
            return (
              <div key="documents" className="space-y-1">
                <button
                  type="button"
                  onClick={() => setDocsOpen(!docsOpen)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors touch-manipulation min-h-[44px]",
                    isOnDocRoute ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" aria-hidden />
                  <span>{item.name}</span>
                  <ChevronDown
                    className={cn("mr-auto h-4 w-4 transition-transform", docsOpen && "rotate-180")}
                  />
                </button>
                {docsOpen && (
                  <div className="pr-4 space-y-1">
                    {DOC_TYPES.map((d) => (
                      <Link
                        key={d.href}
                        href={d.href}
                        onClick={() => { setDocsOpen(false); close(); }}
                        className={cn(
                          "block px-4 py-3 rounded-lg text-sm transition-colors touch-manipulation min-h-[44px]",
                          pathname.startsWith(d.href)
                            ? "bg-primary/20 text-primary font-medium"
                            : "hover:bg-accent"
                        )}
                      >
                        {d.name}
                      </Link>
                    ))}
                    <div className="border-t my-1 pt-1">
                      <div className="px-2 py-1 text-xs text-muted-foreground">מסמך חדש</div>
                      {NEW_DOC_LINKS.map((n) => (
                        <Link
                          key={n.href}
                          href={n.href}
                          onClick={() => { setDocsOpen(false); close(); }}
                          className="block px-4 py-3 rounded-lg text-sm hover:bg-accent touch-manipulation min-h-[44px]"
                        >
                          {n.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          }
          if (!item.href) return null;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors touch-manipulation min-h-[44px]",
                isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" aria-hidden />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

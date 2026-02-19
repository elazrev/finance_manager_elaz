"use client";

import { usePathname, useRouter } from "next/navigation";
import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronDown, FileText, Receipt, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const DOC_TYPES = [
  { value: "invoices", label: "חשבוניות", href: "/invoices", icon: Receipt },
  { value: "payment-requests", label: "דרישות תשלום", href: "/payment-requests", icon: FileCheck },
  { value: "quotes", label: "הצעות מחיר", href: "/quotes", icon: FileText },
] as const;

const NEW_DOC_LINKS = [
  { label: "חשבונית חדשה", href: "/invoices/new" },
  { label: "דרישת תשלום חדשה", href: "/payment-requests/new" },
  { label: "הצעת מחיר חדשה", href: "/quotes/new" },
] as const;

function getCurrentDocType(path: string): string {
  if (path.startsWith("/invoices")) return "invoices";
  if (path.startsWith("/payment-requests")) return "payment-requests";
  if (path.startsWith("/quotes")) return "quotes";
  return "invoices";
}

export function DocumentsNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [docTypeOpen, setDocTypeOpen] = useState(false);
  const [newDocOpen, setNewDocOpen] = useState(false);
  const docTypeRef = useRef<HTMLDivElement>(null);
  const newDocRef = useRef<HTMLDivElement>(null);

  const currentType = getCurrentDocType(pathname);
  const isOnDocRoute = DOC_TYPES.some((d) => pathname.startsWith(d.href));

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        (docTypeRef.current && !docTypeRef.current.contains(e.target as Node)) &&
        (newDocRef.current && !newDocRef.current.contains(e.target as Node))
      ) {
        setDocTypeOpen(false);
        setNewDocOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOnDocRoute) return null;

  const handleDocTypeChange = (value: string) => {
    const doc = DOC_TYPES.find((d) => d.value === value);
    if (doc) router.push(doc.href);
    setDocTypeOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6 p-3 rounded-lg bg-muted/50 border">
      <div className="relative" ref={docTypeRef}>
        <button
          type="button"
          onClick={() => { setDocTypeOpen(!docTypeOpen); setNewDocOpen(false); }}
          className="flex items-center gap-2 px-4 py-2 rounded-md border bg-background hover:bg-accent text-sm font-medium"
        >
          {(() => {
            const doc = DOC_TYPES.find((d) => d.value === currentType);
            const Icon = doc?.icon ?? FileText;
            return <Icon className="h-4 w-4" />;
          })()}
          {DOC_TYPES.find((d) => d.value === currentType)?.label ?? "מסמכים"}
          <ChevronDown className={cn("h-4 w-4 transition-transform", docTypeOpen && "rotate-180")} />
        </button>
        {docTypeOpen && (
          <div className="absolute top-full right-0 mt-1 min-w-[180px] py-1 rounded-md border bg-background shadow-lg z-50">
            {DOC_TYPES.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => handleDocTypeChange(d.value)}
                className={cn(
                  "w-full flex items-center gap-2 px-4 py-2 text-right text-sm hover:bg-accent",
                  currentType === d.value && "bg-accent font-medium"
                )}
              >
                <d.icon className="h-4 w-4" />
                {d.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative" ref={newDocRef}>
        <Button
          onClick={() => { setNewDocOpen(!newDocOpen); setDocTypeOpen(false); }}
          className="gap-2 touch-manipulation min-h-[44px]"
        >
          + מסמך חדש
          <ChevronDown className={cn("h-4 w-4 transition-transform", newDocOpen && "rotate-180")} />
        </Button>
        {newDocOpen && (
          <div className="absolute top-full right-0 mt-1 min-w-[200px] py-1 rounded-md border bg-background shadow-lg z-50">
            {NEW_DOC_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setNewDocOpen(false)}
                className="block px-4 py-2 text-right text-sm hover:bg-accent rounded-sm"
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

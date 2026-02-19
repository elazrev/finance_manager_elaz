"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "./app-shell";

export function LayoutSwitcher({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const useMinimalLayout = pathname === "/" || pathname?.startsWith("/auth/");

  if (useMinimalLayout) {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}

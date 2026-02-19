"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { UserSettings } from "@/types";

const THEME_KEY = "patour-theme";
const THEME_COLOR_KEY = "patour-theme-color";
const FONT_SIZE_KEY = "patour-font-size";

export type Theme = "light" | "dark" | "system";
export type ThemeColor = "blue" | "amber" | "emerald" | "violet" | "rose" | "slate";
export type FontSize = "sm" | "md" | "lg";

function getEffectiveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  }
  return theme;
}

function applyTheme(effective: "light" | "dark") {
  const root = document.documentElement;
  if (effective === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

function applyThemeColor(color: ThemeColor) {
  const root = document.documentElement;
  const colors: ThemeColor[] = ["blue", "amber", "emerald", "violet", "rose", "slate"];
  colors.forEach((c) => root.classList.remove(`theme-${c}`));
  root.classList.add(`theme-${color}`);
}

function applyFontSize(size: FontSize) {
  const root = document.documentElement;
  root.classList.remove("text-size-sm", "text-size-md", "text-size-lg");
  root.classList.add(`text-size-${size}`);
}

export function useThemeEffect(theme: Theme | undefined) {
  useEffect(() => {
    const resolved = theme ?? (typeof window !== "undefined" ? (localStorage.getItem(THEME_KEY) as Theme) : null) ?? "system";
    const effective = getEffectiveTheme(resolved);
    applyTheme(effective);
  }, [theme]);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await fetch("/api/user");
      if (!res.ok) return null;
      const j = await res.json();
      return j.data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const settings = (user?.settings || {}) as UserSettings;
  const theme = settings.theme ?? getStoredTheme() ?? "system";
  const themeColor = settings.themeColor ?? (typeof window !== "undefined" ? (localStorage.getItem(THEME_COLOR_KEY) as ThemeColor) : null) ?? "blue";
  const fontSize = settings.fontSize ?? (typeof window !== "undefined" ? (localStorage.getItem(FONT_SIZE_KEY) as FontSize) : null) ?? "md";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const resolved = theme ?? getStoredTheme() ?? "system";
    const effective = getEffectiveTheme(resolved);
    applyTheme(effective);
    applyThemeColor(themeColor);
    applyFontSize(fontSize);
    if (typeof window !== "undefined" && user) {
      if ((user.settings as UserSettings)?.theme) {
        localStorage.setItem(THEME_KEY, (user.settings as UserSettings).theme!);
      }
      if ((user.settings as UserSettings)?.themeColor) {
        localStorage.setItem(THEME_COLOR_KEY, (user.settings as UserSettings).themeColor!);
      }
      if ((user.settings as UserSettings)?.fontSize) {
        localStorage.setItem(FONT_SIZE_KEY, (user.settings as UserSettings).fontSize!);
      }
    }
  }, [mounted, theme, themeColor, fontSize, user]);

  useEffect(() => {
    if (!mounted) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") {
        applyTheme(mq.matches ? "dark" : "light");
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mounted, theme]);

  return <>{children}</>;
}

export function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(THEME_KEY);
  return stored === "light" || stored === "dark" || stored === "system" ? stored : null;
}

/** Apply theme immediately when user changes it in settings; also persist to localStorage */
export function setThemeImmediate(theme: Theme) {
  const effective = getEffectiveTheme(theme);
  applyTheme(effective);
  if (typeof window !== "undefined") {
    localStorage.setItem(THEME_KEY, theme);
  }
}

export function setThemeColorImmediate(color: ThemeColor) {
  applyThemeColor(color);
  if (typeof window !== "undefined") {
    localStorage.setItem(THEME_COLOR_KEY, color);
  }
}

export function setFontSizeImmediate(size: FontSize) {
  applyFontSize(size);
  if (typeof window !== "undefined") {
    localStorage.setItem(FONT_SIZE_KEY, size);
  }
}

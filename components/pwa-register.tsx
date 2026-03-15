"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("PWA: Service Worker registered");
        })
        .catch((err) => {
          console.warn("PWA: Service Worker registration failed", err);
        });
    }
  }, []);

  return null;
}

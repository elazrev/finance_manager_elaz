import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "מנהל כספים - פטור עוסק",
    short_name: "מנהל כספים",
    description: "מערכת ניהול חשבונות פשוטה וקלה לשימוש עבור עוסקים פטורים בישראל",
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    dir: "rtl",
    lang: "he",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["finance", "business", "productivity"],
  };
}

import type { Metadata } from "next";
import { Inter, Rubik } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { LayoutSwitcher } from "@/components/layout/layout-switcher";
import { PWARegister } from "@/components/pwa-register";

const inter = Inter({ subsets: ["latin"] });
const rubik = Rubik({ subsets: ["hebrew", "latin"] });

export const metadata: Metadata = {
  title: "אפליקציית ניהול חשבונות - פטור עוסק",
  description: "מערכת ניהול חשבונות פשוטה וקלה לשימוש עבור עוסקים פטורים בישראל",
  themeColor: "#1e293b",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "מנהל חשבונות",
  },
};

const themeInitScript = `
(function() {
  var t = localStorage.getItem('patour-theme') || 'system';
  var dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  var tc = localStorage.getItem('patour-theme-color') || 'blue';
  ['blue','amber','emerald','violet','rose','slate'].forEach(function(c){ document.documentElement.classList.remove('theme-' + c); });
  document.documentElement.classList.add('theme-' + tc);
  var fs = localStorage.getItem('patour-font-size') || 'md';
  document.documentElement.classList.remove('text-size-sm','text-size-md','text-size-lg');
  document.documentElement.classList.add('text-size-' + fs);
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${inter.className} ${rubik.className}`}>
        <PWARegister />
        <Providers>
          <LayoutSwitcher>{children}</LayoutSwitcher>
        </Providers>
      </body>
    </html>
  );
}

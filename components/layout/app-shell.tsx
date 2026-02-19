"use client";

import { useState, useEffect } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { DocumentsNav } from "@/components/documents-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex flex-col min-h-screen print:min-h-0">
      <div className="print:hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
      </div>
      <div className="flex flex-1 print:block relative">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={closeSidebar}
            aria-hidden="true"
          />
        )}
        {/* Sidebar - desktop always visible, mobile as overlay */}
        <div
          className={`
            print:hidden shrink-0
            fixed md:relative top-14 md:top-0 bottom-0 right-0 z-50
            w-64 min-h-[calc(100vh-3.5rem)] md:min-h-screen border-l
            transform transition-transform duration-200 ease-out
            md:transform-none
            ${sidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"}
          `}
        >
          <Sidebar onNavigate={closeSidebar} />
        </div>
        <main className="flex-1 min-w-0 p-4 sm:p-6 print:p-0 print:max-w-none">
          <div className="print:hidden">
            <DocumentsNav />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

"use client";

import { Sidebar } from "./Sidebar";
import { useEffect, useState } from "react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // Avoid hydration mismatch on initial render with localStorage

  return (
    <div className="flex min-h-screen bg-[#0A0A0A] text-white font-sans">
      <Sidebar />
      <main className="flex-1 md:ml-64 pt-24 pb-6 px-4 md:pt-8 md:pb-8 md:px-8 overflow-y-auto w-full max-w-7xl mx-auto">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}

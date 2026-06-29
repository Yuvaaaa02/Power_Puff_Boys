"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, PlusCircle, Settings, LogOut, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    const session = localStorage.getItem("roomsplit-session");
    if (session) {
      setUser(JSON.parse(session));
    } else {
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("roomsplit-session");
    router.push("/login");
  };

  if (!user) return null;

  const links = user.role === "admin"
    ? [
        { href: "/admin", label: "Admin Panel", icon: Settings },
      ]
    : [
        { href: `/dashboard/${user.name}`, label: "Dashboard", icon: LayoutDashboard },
        { href: "/add-expense", label: "Add Expense", icon: PlusCircle },
      ];

  const content = (
    <div className="flex flex-col h-full bg-[#111111] border-r border-[#222222] p-4 text-white">
      <div className="flex items-center space-x-3 mb-10 px-2">
        <span className="font-display font-bold text-xl tracking-tight text-[#C0FF34]">RoomSplit</span>
      </div>

      <nav className="flex-1 space-y-2">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                isActive 
                  ? "bg-[#C0FF34] text-black font-medium shadow-[0_0_15px_rgba(192,255,52,0.15)]" 
                  : "text-gray-400 hover:text-white hover:bg-[#1A1A1A]"
              }`}
            >
              <Icon size={20} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <div className="px-4 py-3 mb-4 rounded-xl bg-[#1A1A1A] border border-[#222] flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">
            {user.role === "admin" ? "Admin" : user.name}
          </span>
          <div className="w-2 h-2 rounded-full bg-[#4ADE80]"></div>
        </div>
        
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-gray-400 hover:text-[#F87171] hover:bg-[#F87171]/10 transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#111] border-b border-[#222] z-40 flex items-center justify-between px-4">
        <span className="font-display font-bold text-lg text-[#C0FF34]">RoomSplit</span>
        <button 
          className="p-2 text-white hover:bg-[#222] rounded-lg transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 h-screen fixed inset-y-0 left-0 z-40">
        {content}
      </div>

      {/* Mobile Sidebar overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm">
          <div className="w-64 h-full relative">
            {content}
          </div>
        </div>
      )}
    </>
  );
}

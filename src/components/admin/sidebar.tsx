"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarCheck,
  BedDouble,
  Euro,
  Link2,
  LogOut,
  Hotel,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/rooms", label: "Rooms", icon: BedDouble },
  { href: "/admin/pricing", label: "Pricing", icon: Euro },
  { href: "/admin/channels", label: "Channels", icon: Link2 },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/admin/login");
  }

  const nav = (
    <>
      <div className="p-6 pb-4">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-terracotta to-terracotta-dark text-white shadow-lg shadow-terracotta/20">
            <Hotel className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-serif text-lg font-bold text-white">
              Panorama
            </h1>
            <p className="text-[11px] text-white/40">Admin Panel</p>
          </div>
        </Link>
      </div>

      <div className="mx-5 mb-4 h-px bg-gradient-to-r from-white/0 via-white/10 to-white/0" />

      <nav className="flex-1 space-y-0.5 px-3">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-white/[0.12] text-white shadow-sm shadow-black/10"
                  : "text-white/50 hover:bg-white/[0.06] hover:text-white/80",
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-terracotta" />
              )}
              <item.icon className={cn("h-[18px] w-[18px] transition-colors", isActive ? "text-terracotta" : "text-white/40 group-hover:text-white/60")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mx-5 h-px bg-gradient-to-r from-white/0 via-white/10 to-white/0" />
      <div className="p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-white/40 transition-all duration-200 hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed left-4 top-4 z-50 rounded-xl bg-deep-blue p-2.5 text-white shadow-lg lg:hidden"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-gradient-to-b from-deep-blue to-[#152d4a] transition-transform duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {nav}
      </aside>
    </>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LanguageSwitcher } from "./language-switcher";
import { Button } from "@/components/ui/button";
import { PanoramaLogo } from "@/components/ui/panorama-logo";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", key: "home" },
  { href: "/rooms", key: "rooms" },
  { href: "/gallery", key: "gallery" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const;

export function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Only the home page has a dark hero - all other pages need dark header text
  const isHomePage = pathname === "/";
  const useDarkStyle = !isHomePage || scrolled;

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-50 transition-all duration-500",
        useDarkStyle
          ? "glass border-b border-sandy-dark/30 shadow-soft"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <PanoramaLogo
            variant={useDarkStyle ? "dark" : "light"}
            showIcon={false}
            glow={!useDarkStyle}
            className="transition-all duration-500"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300",
                pathname === link.href
                  ? useDarkStyle
                    ? "bg-sandy text-terracotta"
                    : "bg-white/20 text-white"
                  : useDarkStyle
                    ? "text-gray-700 hover:bg-sandy-light hover:text-deep-blue"
                    : "text-white/90 hover:bg-white/10 hover:text-white",
              )}
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          <div className={cn(useDarkStyle ? "" : "[&_button]:text-white")}>
            <LanguageSwitcher />
          </div>
          <Link href="/booking" className="hidden sm:block">
            <Button size="sm" className="btn-glow">{t("bookNow")}</Button>
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={cn(
              "rounded-lg p-2 transition-colors lg:hidden",
              useDarkStyle
                ? "text-deep-blue hover:bg-sandy-light"
                : "text-white hover:bg-white/10",
            )}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="glass border-t border-sandy-dark/30 lg:hidden animate-slide-down">
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-4 sm:px-6">
            {navLinks.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className={cn(
                  "rounded-lg px-4 py-3 text-base font-medium transition-colors",
                  pathname === link.href
                    ? "bg-sandy text-terracotta"
                    : "text-gray-700 hover:bg-sandy-light",
                )}
              >
                {t(link.key)}
              </Link>
            ))}
            <div className="mt-4 border-t border-sandy pt-4">
              <Link href="/booking">
                <Button className="w-full btn-glow">{t("bookNow")}</Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

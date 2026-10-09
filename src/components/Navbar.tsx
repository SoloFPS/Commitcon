"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  Utensils,
  HeartHandshake,
  ShieldCheck,
  Bell,
  LogOut,
  Menu,
  X,
  Package,
  PlusCircle,
  Truck,
  TrendingUp,
  UserCheck,
} from "lucide-react";

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const user = session?.user as { role?: string; name?: string; email?: string } | undefined;
  const role = user?.role;

  useEffect(() => {
    if (session) {
      fetch("/api/notifications")
        .then((r) => r.json())
        .then((data) => {
          if (data.unreadCount !== undefined) setUnreadCount(data.unreadCount);
        })
        .catch(() => {});
    }
  }, [session, pathname]);

  const navLinks = () => {
    if (role === "PROVIDER") {
      return [
        { href: "/restaurant/dashboard", label: "Dashboard", icon: TrendingUp },
        { href: "/restaurant/donations", label: "My Donations", icon: Package },
        { href: "/restaurant/donations/new", label: "Post Surplus", icon: PlusCircle },
        { href: "/allocations", label: "Allocations", icon: Truck },
      ];
    }
    if (role === "SHELTER") {
      return [
        { href: "/shelter/dashboard", label: "Dashboard", icon: TrendingUp },
        { href: "/shelter/donations", label: "Find Food", icon: Package },
        { href: "/shelter/requests", label: "My Requests", icon: HeartHandshake },
        { href: "/allocations", label: "Deliveries", icon: Truck },
        { href: "/profile", label: "Requirements", icon: UserCheck },
      ];
    }
    if (role === "ADMIN") {
      return [
        { href: "/admin", label: "Overview", icon: ShieldCheck },
        { href: "/admin/organizations", label: "Organizations", icon: UserCheck },
        { href: "/allocations", label: "All Allocations", icon: Truck },
      ];
    }
    return [];
  };

  const links = navLinks();

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-cream/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3.5">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest text-white transition-transform group-hover:scale-105 shadow-sm">
              <Utensils className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-forest">FoodBridge</span>
              <span className="text-[10px] text-ink/60 uppercase tracking-widest font-semibold -mt-1">
                Zero Waste
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          {session && (
            <nav className="hidden md:flex items-center gap-1">
              {links.map((link) => {
                const Icon = link.icon;
                const active = pathname === link.href || pathname.startsWith(link.href + "/");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? "bg-forest text-white shadow-xs"
                        : "text-ink/80 hover:bg-sage hover:text-forest"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2.5">
          {status === "loading" ? (
            <div className="h-8 w-24 animate-pulse rounded-md bg-ink/10" />
          ) : session ? (
            <>
              {/* Notification Bell */}
              <Link
                href="/notifications"
                className="relative rounded-lg p-2 text-ink/70 hover:bg-sage transition-colors"
                title="Notifications"
                aria-label="View notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-warn px-1 text-[10px] font-bold text-white shadow-xs animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              {/* Role badge */}
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-ink/10 bg-white px-3 py-1 shadow-2xs">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-ink/80">
                  {role === "ADMIN" ? "Admin" : role === "SHELTER" ? "Shelter" : "Provider"}
                </span>
              </div>

              {/* Sign out */}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="btn-ghost flex items-center gap-1.5 py-1.5 px-3 text-xs"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden rounded-lg p-2 text-ink/70 hover:bg-sage"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="btn-ghost py-1.5 px-3.5 text-xs font-semibold">
                Sign in
              </Link>
              <Link href="/register" className="btn py-1.5 px-3.5 text-xs font-semibold">
                Get started
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && session && (
        <div className="border-t border-ink/10 bg-white px-4 py-3 md:hidden space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium ${
                  active ? "bg-forest text-white" : "text-ink/80 hover:bg-sage"
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}

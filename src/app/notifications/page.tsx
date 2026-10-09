"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  HeartHandshake,
  Truck,
  Check,
} from "lucide-react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyMarkAll, setBusyMarkAll] = useState(false);

  const fetchNotifications = () => {
    setLoading(true);
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function markAllAsRead() {
    setBusyMarkAll(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      fetchNotifications();
    } catch {
      alert("Failed to mark notifications read");
    } finally {
      setBusyMarkAll(false);
    }
  }

  async function markSingleAsRead(id: string) {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "ORGANIZATION_VERIFIED":
        return <ShieldCheck className="h-5 w-5 text-emerald-600" />;
      case "ORGANIZATION_REJECTED":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case "OFFER_RECEIVED":
      case "OFFER_ACCEPTED":
        return <HeartHandshake className="h-5 w-5 text-amber-warn" />;
      case "PICKUP_CONFIRMED":
      case "DELIVERY_COMPLETED":
        return <Truck className="h-5 w-5 text-forest" />;
      default:
        return <Bell className="h-5 w-5 text-forest" />;
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-forest">Notifications</h1>
          <p className="mt-1 text-xs text-ink/65">
            Important allocation alerts, verification updates, and logistics status changes.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            disabled={busyMarkAll}
            className="btn-ghost py-1.5 px-3 text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
          >
            <Check className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-ink/10 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-ink/50 animate-pulse">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="mx-auto h-8 w-8 text-ink/30 mb-2" />
            <p className="text-xs text-ink/60">No notifications yet. You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-ink/10">
            {notifications.map((n) => (
              <div
                key={n._id}
                className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors ${
                  n.read ? "bg-white hover:bg-cream/40" : "bg-forest/5 hover:bg-forest/10"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 shrink-0 rounded-xl bg-white p-2 border border-ink/10 shadow-2xs">
                    {getIcon(n.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-forest">{n.title}</h4>
                      {!n.read && (
                        <span className="flex h-2 w-2 rounded-full bg-amber-warn" />
                      )}
                    </div>
                    <p className="text-xs text-ink/80 mt-1 leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-ink/40 mt-1.5 block">
                      {new Date(n.createdAt).toLocaleDateString()} at{" "}
                      {new Date(n.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {n.link && (
                    <Link
                      href={n.link}
                      onClick={() => markSingleAsRead(n._id)}
                      className="btn-ghost py-1 px-2.5 text-[11px] font-semibold flex items-center gap-1 shadow-2xs"
                    >
                      View
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                  {!n.read && (
                    <button
                      onClick={() => markSingleAsRead(n._id)}
                      className="rounded-lg p-1.5 text-ink/40 hover:text-ink/80"
                      title="Mark as read"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

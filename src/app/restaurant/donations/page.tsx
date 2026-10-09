"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  PlusCircle,
  Search,
  Filter,
  ArrowRight,
  Clock,
  Sparkles,
  AlertTriangle,
  Trash2,
} from "lucide-react";

export default function ProviderDonationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [busyWithdraw, setBusyWithdraw] = useState<string | null>(null);

  const fetchDonations = () => {
    setLoading(true);
    fetch("/api/donations?mine=true")
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  async function handleWithdraw(id: string) {
    if (!confirm("Are you sure you want to withdraw this donation listing?")) return;
    setBusyWithdraw(id);
    try {
      const res = await fetch(`/api/donations/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchDonations();
      } else {
        const d = await res.json();
        alert(d.error || "Cannot withdraw listing");
      }
    } catch {
      alert("Network error");
    } finally {
      setBusyWithdraw(null);
    }
  }

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      search === "" ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "ALL" || item.category === category;
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-forest">My Surplus Food Listings</h1>
          <p className="mt-1 text-xs text-ink/65">
            Manage your active and completed food redistribution listings.
          </p>
        </div>

        <Link
          href="/restaurant/donations/new"
          className="btn py-2 px-4 text-xs font-semibold flex items-center gap-1.5 shadow-xs shrink-0"
        >
          <PlusCircle className="h-4 w-4" />
          List New Surplus
        </Link>
      </div>

      {/* Search and Filters Bar */}
      <div className="mb-6 flex flex-wrap gap-3 items-center rounded-xl border border-ink/10 bg-white p-3.5 shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/40" />
          <input
            type="text"
            placeholder="Search by title or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 py-1.5 text-xs"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-auto py-1.5 text-xs bg-white"
        >
          <option value="ALL">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="PARTIALLY_ALLOCATED">Partially Allocated</option>
          <option value="ALLOCATED">Fully Allocated</option>
          <option value="WITHDRAWN">Withdrawn</option>
        </select>
      </div>

      {/* Table / List */}
      <div className="rounded-2xl border border-ink/10 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-ink/50 animate-pulse">
            Loading your donations...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="mx-auto h-8 w-8 text-ink/30 mb-2" />
            <p className="text-xs text-ink/60">No donations match your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-ink/10 bg-cream/60 text-ink/70">
                <tr>
                  <th className="py-3 px-4 font-semibold">Title & Category</th>
                  <th className="py-3 px-4 font-semibold">Available Quantity</th>
                  <th className="py-3 px-4 font-semibold">Dietary & Storage</th>
                  <th className="py-3 px-4 font-semibold">Pickup Deadline</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {filteredItems.map((item) => {
                  const hoursLeft = Math.max(
                    0,
                    (new Date(item.pickupDeadline).getTime() - Date.now()) / (1000 * 60 * 60)
                  );
                  return (
                    <tr key={item._id} className="hover:bg-cream/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/restaurant/donations/${item._id}`}
                          className="font-semibold text-forest hover:underline block"
                        >
                          {item.title}
                        </Link>
                        <span className="text-[11px] text-ink/60">{item.category}</span>
                      </td>

                      <td className="py-3.5 px-4 font-medium">
                        {item.remainingQuantity} / {item.totalQuantity} {item.unit}
                        {item.reservedQuantity > 0 && (
                          <span className="block text-[10px] text-amber-warn font-normal">
                            ({item.reservedQuantity} reserved)
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold mr-1.5 ${
                            item.dietary === "VEG"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {item.dietary}
                        </span>
                        <span className="text-[11px] text-ink/60">
                          {item.storageRequirements || "AMBIENT"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-ink/40" />
                          <span>
                            {new Date(item.pickupDeadline).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            , {new Date(item.pickupDeadline).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="text-[10px] text-ink/50 block mt-0.5">
                          {hoursLeft > 0 ? `${hoursLeft.toFixed(1)}h remaining` : "Expired"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                            item.status === "AVAILABLE"
                              ? "bg-emerald-100 text-emerald-800"
                              : item.status === "ALLOCATED"
                              ? "bg-blue-100 text-blue-800"
                              : item.status === "WITHDRAWN"
                              ? "bg-red-100 text-red-800"
                              : "bg-ink/10 text-ink/70"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/restaurant/donations/${item._id}`}
                            className="btn-ghost py-1 px-2 text-[11px] font-semibold flex items-center gap-1"
                          >
                            <Sparkles className="h-3 w-3 text-amber-warn" />
                            Smart Matches
                          </Link>

                          {item.status === "AVAILABLE" && item.reservedQuantity === 0 && (
                            <button
                              onClick={() => handleWithdraw(item._id)}
                              disabled={busyWithdraw === item._id}
                              className="rounded-md p-1.5 text-red-600 hover:bg-red-50"
                              title="Withdraw listing"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

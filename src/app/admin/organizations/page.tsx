"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  Filter,
  Search,
  ArrowLeft,
  MapPin,
  Phone,
} from "lucide-react";

export default function AdminOrganizationsPage() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [kindFilter, setKindFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchOrgs = () => {
    setLoading(true);
    fetch("/api/admin/organizations")
      .then((r) => r.json())
      .then((data) => {
        setOrgs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  async function handleVerify(orgId: string, status: "VERIFIED" | "REJECTED") {
    const notes = prompt(`Optional verification notes for ${status}:`) ?? undefined;
    setBusyId(orgId);

    try {
      const res = await fetch("/api/admin/organizations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, status, notes }),
      });

      setBusyId(null);
      if (!res.ok) {
        alert("Failed to update organization status");
        return;
      }
      fetchOrgs();
    } catch {
      setBusyId(null);
      alert("Network error updating organization");
    }
  }

  const filtered = orgs.filter((o) => {
    const matchesStatus = statusFilter === "ALL" || o.verificationStatus === statusFilter;
    const matchesKind = kindFilter === "ALL" || o.kind === kindFilter;
    const matchesSearch =
      search === "" ||
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.city.toLowerCase().includes(search.toLowerCase()) ||
      o.contactName.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesKind && matchesSearch;
  });

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/60 hover:text-forest mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Admin Overview
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-forest">
            Organizations Directory
          </h1>
          <p className="mt-1 text-xs text-ink/65">
            Manage provider and recipient registrations, approve verifications, and audit status.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-6 flex flex-wrap gap-3 items-center rounded-xl border border-ink/10 bg-white p-3.5 shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/40" />
          <input
            type="text"
            placeholder="Search by name, contact, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 py-1.5 text-xs"
          />
        </div>

        <select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value)}
          className="input w-auto py-1.5 text-xs bg-white"
        >
          <option value="ALL">All Kinds</option>
          <option value="PROVIDER">Food Providers</option>
          <option value="SHELTER">Shelters & Charities</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-auto py-1.5 text-xs bg-white"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending Review</option>
          <option value="VERIFIED">Verified</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Directory Table */}
      <div className="rounded-2xl border border-ink/10 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-ink/50 animate-pulse">
            Loading directory...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="mx-auto h-8 w-8 text-ink/30 mb-2" />
            <p className="text-xs text-ink/60">No organizations match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-ink/10 bg-cream/60 text-ink/70">
                <tr>
                  <th className="py-3 px-4 font-semibold">Organization</th>
                  <th className="py-3 px-4 font-semibold">Role</th>
                  <th className="py-3 px-4 font-semibold">Location</th>
                  <th className="py-3 px-4 font-semibold">Contact</th>
                  <th className="py-3 px-4 font-semibold">Verification</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {filtered.map((org) => (
                  <tr key={org._id} className="hover:bg-cream/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-forest">
                      {org.name}
                      <span className="text-[11px] text-ink/50 block font-normal">
                        {org.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="rounded-md bg-forest/5 px-2 py-0.5 font-bold text-forest text-[10px]">
                        {org.kind}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-ink font-medium">{org.address}</span>
                      <span className="text-[11px] text-ink/50 block">
                        {org.city} {org.postalCode}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-ink font-medium">{org.contactName}</span>
                      <span className="text-[11px] text-ink/50 block">{org.phone}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          org.verificationStatus === "VERIFIED"
                            ? "bg-emerald-100 text-emerald-800"
                            : org.verificationStatus === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {org.verificationStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {org.verificationStatus !== "VERIFIED" && (
                          <button
                            onClick={() => handleVerify(org._id, "VERIFIED")}
                            disabled={busyId === org._id}
                            className="rounded-lg bg-emerald-700 text-white px-2.5 py-1 text-[11px] font-semibold hover:bg-emerald-800 shadow-2xs"
                          >
                            Approve
                          </button>
                        )}
                        {org.verificationStatus !== "REJECTED" && (
                          <button
                            onClick={() => handleVerify(org._id, "REJECTED")}
                            disabled={busyId === org._id}
                            className="rounded-lg border border-red-300 text-red-700 px-2.5 py-1 text-[11px] font-semibold hover:bg-red-50"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

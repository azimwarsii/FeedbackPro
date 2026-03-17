"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, BarChart3, ClipboardList, AlertTriangle, RefreshCw } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { fetchAdminOverview } from "@/lib/adminApi";

type Overview = {
  users?: number;
  campaigns?: number;
  surveys?: number;
  responses?: number;
};

export default function AdminOverviewPage() {
  const role = useUserStore((s) => s.role);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<Overview>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (role && role !== "admin") {
      redirect("/");
    }
  }, [role]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetchAdminOverview();
    if (!res.ok) {
      setError(res.error);
      setOverview({});
      setLoading(false);
      return;
    }
    setOverview(res.data || {});
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cards = useMemo(
    () => [
      {
        title: "Users",
        value: overview.users ?? "—",
        icon: <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
        href: "/admin/users",
        bg: "from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20",
        iconBg: "bg-blue-100 dark:bg-blue-900/30",
      },
      {
        title: "Campaigns",
        value: overview.campaigns ?? "—",
        icon: <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
        href: "/admin/campaigns",
        bg: "from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20",
        iconBg: "bg-purple-100 dark:bg-purple-900/30",
      },
      {
        title: "Surveys",
        value: overview.surveys ?? "—",
        icon: <ClipboardList className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
        href: "/admin/surveys",
        bg: "from-emerald-50 to-lime-50 dark:from-emerald-900/20 dark:to-lime-900/20",
        iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
      },
    ],
    [overview]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Admin
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Track users, campaigns, and surveys across the platform.
          </p>
        </div>

        <button
          onClick={load}
          className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold">Admin endpoints not available (yet)</div>
              <div className="text-sm opacity-90">
                Backend returned: {error}. This page will work automatically once your API exposes
                `/admin/overview`, `/admin/users`, `/admin/campaigns`, `/admin/surveys`.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.title}
            href={c.href}
            className={`group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br ${c.bg} p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{c.title}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {loading ? "…" : c.value}
                </p>
              </div>
              <div className={`p-3 ${c.iconBg} rounded-xl`}>{c.icon}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/admin/users"
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-all dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="font-semibold text-gray-900 dark:text-white">Users</div>
          <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            View all user accounts and basic activity.
          </div>
        </Link>
        <Link
          href="/admin/campaigns"
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-all dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="font-semibold text-gray-900 dark:text-white">Campaigns</div>
          <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Monitor campaign volume, status, and response totals.
          </div>
        </Link>
      </div>
    </div>
  );
}


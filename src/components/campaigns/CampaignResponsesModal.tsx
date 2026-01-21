"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Download, Search, ChevronDown, ChevronUp } from "lucide-react";

type RewardStatus = "pending" | "paid" | "declined";

type PopulatedUser = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
};

type StoredAnswer = {
  question_title: string;
  question_description?: string;
  answer: string | number | string[] | null;
};

export type CampaignResponse = {
  _id?: string;
  id?: string;
  user?: PopulatedUser | string;
  survey?: unknown;
  campaign?: unknown;
  responders_email?: string;
  responders_phone?: string;
  answers?: StoredAnswer[];
  started_at?: string;
  completed_at?: string;
  bot_score?: number;
  is_suspected_bot?: boolean;
  reward_amount?: number;
  reward_status?: RewardStatus;
  ip_address?: string;
  user_agent?: string;
  createdAt?: string;
};

function formatDateTime(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function safeNumber(value: unknown, fallback = 0) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export default function CampaignResponsesModal(props: {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string | null;
  campaignName?: string;
}) {
  const { isOpen, onClose, campaignId, campaignName } = props;

  const [responses, setResponses] = useState<CampaignResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (!campaignId) return;

    const run = async () => {
      setIsLoading(true);
      setError(null);

      const baseUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        process.env.BACKEND_URL ||
        "http://localhost:5000";
      const endpoint = `${baseUrl.replace(/\/+$/, "")}/responses/campaign/${encodeURIComponent(
        campaignId
      )}`;

      try {
        const res = await fetch(endpoint, { method: "GET" });
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          const msg = (data && (data.error || data.message)) || "Failed to load responses.";
          setError(String(msg));
          setResponses([]);
          return;
        }

        const list = data?.responses || data?.response || (Array.isArray(data) ? data : []);
        setResponses(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error("Error fetching campaign responses:", e);
        setError("Network error while loading responses.");
        setResponses([]);
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, [isOpen, campaignId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return responses;

    return responses.filter((r) => {
      const email = (r.responders_email || "").toLowerCase();
      const phone = (r.responders_phone || "").toLowerCase();
      const reward = (r.reward_status || "").toLowerCase();

      const userObj = typeof r.user === "object" && r.user ? (r.user as PopulatedUser) : null;
      const userEmail = (userObj?.email || "").toLowerCase();
      const userName = (userObj?.name || "").toLowerCase();

      return (
        email.includes(q) ||
        phone.includes(q) ||
        reward.includes(q) ||
        userEmail.includes(q) ||
        userName.includes(q)
      );
    });
  }, [responses, search]);

  const exportCsv = () => {
    const headers = [
      "createdAt",
      "responders_email",
      "responders_phone",
      "user_name",
      "user_email",
      "started_at",
      "completed_at",
      "reward_status",
      "reward_amount",
      "bot_score",
      "is_suspected_bot",
    ];

    const rows = filtered.map((r) => {
      const userObj = typeof r.user === "object" && r.user ? (r.user as PopulatedUser) : null;
      const values = [
        r.createdAt || "",
        r.responders_email || "",
        r.responders_phone || "",
        userObj?.name || "",
        userObj?.email || "",
        r.started_at || "",
        r.completed_at || "",
        r.reward_status || "",
        String(safeNumber(r.reward_amount, 0)),
        String(safeNumber(r.bot_score, 0)),
        String(Boolean(r.is_suspected_bot)),
      ];
      return values
        .map((v) => `"${String(v).replaceAll('"', '""')}"`)
        .join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `campaign-responses-${campaignId || "unknown"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatAnswerValue = (value: StoredAnswer["answer"]) => {
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    if (value === null || value === undefined || value === "") {
      return "—";
    }
    return String(value);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="w-[min(1100px,95vw)] max-h-[90vh] overflow-hidden"
    >
      <div className="p-6 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Campaign Responses
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {campaignName ? (
                <>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {campaignName}
                  </span>{" "}
                  ·{" "}
                </>
              ) : null}
              {isLoading ? "Loading…" : `${filtered.length} response(s)`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search email / phone / status…"
                className="w-full sm:w-72 pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            {/* <button
              onClick={exportCsv}
              disabled={filtered.length === 0}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button> */}
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="mt-6 overflow-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/60">
              <tr className="text-left text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400">
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Responder</th>
                <th className="px-4 py-3">Started</th>
                <th className="px-4 py-3">Completed</th>
                <th className="px-4 py-3">Reward</th>
                <th className="px-4 py-3">Bot</th>
                <th className="px-4 py-3 text-right">Answers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td className="px-4 py-6 text-gray-600 dark:text-gray-400" colSpan={7}>
                    Loading responses…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-gray-600 dark:text-gray-400" colSpan={7}>
                    No responses found.
                  </td>
                </tr>
              ) : (
                filtered.map((r, idx) => {
                  const userObj =
                    typeof r.user === "object" && r.user ? (r.user as PopulatedUser) : null;
                  const rewardStatus = r.reward_status || "pending";
                  const rewardAmount = safeNumber(r.reward_amount, 0);
                  const botScore = safeNumber(r.bot_score, 0);

                  const rewardPill =
                    rewardStatus === "paid"
                      ? "text-green-700 bg-green-100 dark:bg-green-900/20 dark:text-green-400"
                      : rewardStatus === "declined"
                        ? "text-red-700 bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                        : "text-amber-700 bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400";

                  const rowKey = r._id || r.id || `${idx}`;

                  return (
                    <React.Fragment key={rowKey}>
                      <tr className="bg-white dark:bg-gray-900">
                        <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                          {formatDateTime(r.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-gray-900 dark:text-gray-100">
                            {r.responders_email || userObj?.email || "—"}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {r.responders_phone || "—"}
                            {userObj?.name ? ` · ${userObj.name}` : ""}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {formatDateTime(r.started_at)}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {formatDateTime(r.completed_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-xs ${rewardPill}`}
                            >
                              {rewardStatus}
                            </span>
                            <span className="text-xs text-gray-700 dark:text-gray-300">
                              {rewardAmount}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          <div className="text-xs">
                            score: {botScore.toFixed(2)}
                            {r.is_suspected_bot ? " · suspected" : ""}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId((current) =>
                                current === rowKey ? null : rowKey
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                          >
                            {expandedId === rowKey ? (
                              <>
                                <ChevronUp className="h-3 w-3" />
                                Hide answers
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3" />
                                View answers
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                      {expandedId === rowKey && (
                        <tr className="bg-gray-50 dark:bg-gray-950/60">
                          <td
                            className="px-4 py-4 text-sm text-gray-800 dark:text-gray-100"
                            colSpan={7}
                          >
                            {Array.isArray(r.answers) && r.answers.length > 0 ? (
                              <div className="space-y-3">
                                {r.answers.map((a, i) => (
                                  <div
                                    key={`${a.question_title}-${i}`}
                                    className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900"
                                  >
                                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                      {a.question_title || "Untitled Question"}
                                    </div>
                                    {a.question_description ? (
                                      <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                        {a.question_description}
                                      </div>
                                    ) : null}
                                    <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                                      {formatAnswerValue(a.answer)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                No answers recorded for this response.
                              </span>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}


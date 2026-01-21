"use client";

import React, { useState, useMemo } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Calendar,
  Users,
  Award,
  Clock,
  Target,
  Eye,
  ChevronDown,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Search,
  Shield,
  Bot,
  MapPin,
  Phone,
  User,
  Gift,
  AlertCircle,
  XCircle
} from "lucide-react";
import LineChartOne from "@/components/charts/line/LineChartOne";
import { useResponseStore } from "@/store/useResponseStore";
import { useCampaignStore } from "@/store/useCampaignStore";

interface Insight {
  id: number;
  title: string;
  description: string;
  type: "success" | "warning" | "info";
  icon: React.ReactNode;
}

interface UserAnalytics {
  id: string;
  customer: {
    name: string;
    phone: string;
  };
  campaign: string;
  location: {
    city: string;
    country: string;
    ip: string;
  };
  botDetection: "human" | "suspicious" | "bot";
  completionTime: string;
  status: "completed" | "pending" | "failed";
  reward: {
    amount: number;
    status: "claimed" | "pending";
  };
}

const normalizeEmail = (value?: string) => (value || "").trim().toLowerCase();
const normalizePhone = (value?: string) => (value || "").replace(/\D/g, "");

const parseDate = (value?: string): Date | null => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const getDateWindowStart = (filter: string) => {
  const now = new Date();
  const start = new Date(now);
  switch (filter) {
    case "Last 7 days":
      start.setDate(now.getDate() - 7);
      return start;
    case "Last 30 days":
      start.setDate(now.getDate() - 30);
      return start;
    case "Last 3 months":
      start.setMonth(now.getMonth() - 3);
      return start;
    case "Last year":
      start.setFullYear(now.getFullYear() - 1);
      return start;
    default:
      start.setDate(now.getDate() - 30);
      return start;
  }
};

const classifyBot = (r: { bot_score?: number; is_suspected_bot?: boolean }) => {
  const score = typeof r.bot_score === "number" ? r.bot_score : Number(r.bot_score || 0);
  const suspected = Boolean(r.is_suspected_bot);
  if (suspected && score >= 0.8) return "bot" as const;
  if (suspected || score >= 0.5) return "suspicious" as const;
  return "human" as const;
};

const getCampaignIdFromResponse = (r: unknown): string => {
  const anyR = r as {
    campaignId?: string;
    campaign?: { _id?: string; id?: string } | string;
  };

  if (anyR?.campaignId) return String(anyR.campaignId);
  if (typeof anyR?.campaign === "string") return anyR.campaign;
  const cObj = anyR?.campaign as { _id?: string; id?: string } | undefined;
  if (cObj?._id) return String(cObj._id);
  if (cObj?.id) return String(cObj.id);
  return "";
};

const getCampaignNameFromResponse = (r: unknown): string => {
  const anyR = r as { campaign?: { name?: string } | string; campaignId?: string };
  if (typeof anyR?.campaign === "object" && anyR.campaign?.name) return String(anyR.campaign.name);
  return anyR?.campaignId ? String(anyR.campaignId) : "—";
};

const safeNumber = (value: unknown, fallback = 0) => {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const formatDuration = (ms: number) => {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
};

export default function Analytics() {
  const responses = useResponseStore((state) => state.responses);
  const campaigns = useCampaignStore((state) => state.campaigns);
  const [detailedView, setDetailedView] = useState(false);
  const [dateFilter, setDateFilter] = useState("Last 30 days");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const responsesInWindow = useMemo(() => {
    const start = getDateWindowStart(dateFilter);
    const now = new Date();
    return responses.filter((r) => {
      const d = parseDate(r.completed_at || r.started_at || r.createdAt);
      if (!d) return false;
      return d >= start && d <= now;
    });
  }, [responses, dateFilter]);

  // Calculate response rate metrics
  const responseRateMetrics = useMemo(() => {
    // Calculate total invitations (sum of all campaign contacts)
    const totalInvitations = campaigns.reduce((sum, campaign) => {
      return sum + (campaign.contacts?.length || 0);
    }, 0);

    // Calculate total responses (responses with dates)
    const totalResponses = responses.filter((r) => r.completed_at || r.started_at).length;

    // Calculate overall response rate
    const overallResponseRate = totalInvitations === 0 ? 0 : (totalResponses / totalInvitations) * 100;

    // Calculate current month response rate
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthResponses = responses.filter((r) => {
      const dateStr = r.completed_at || r.started_at;
      if (!dateStr) return false;
      try {
        const responseDate = new Date(dateStr);
        return responseDate >= currentMonthStart && responseDate <= now;
      } catch {
        return false;
      }
    }).length;
    const currentMonthInvitations = campaigns.reduce((sum, campaign) => {
      const campaignDate = campaign.createdAt ? new Date(campaign.createdAt) : null;
      if (campaignDate && campaignDate >= currentMonthStart && campaignDate <= now) {
        return sum + (campaign.contacts?.length || 0);
      }
      return sum;
    }, 0);
    const currentMonthRate = currentMonthInvitations === 0 ? 0 : (currentMonthResponses / currentMonthInvitations) * 100;

    // Calculate previous month response rate
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const previousMonthResponses = responses.filter((r) => {
      const dateStr = r.completed_at || r.started_at;
      if (!dateStr) return false;
      try {
        const responseDate = new Date(dateStr);
        return responseDate >= previousMonthStart && responseDate <= previousMonthEnd;
      } catch {
        return false;
      }
    }).length;
    const previousMonthInvitations = campaigns.reduce((sum, campaign) => {
      const campaignDate = campaign.createdAt ? new Date(campaign.createdAt) : null;
      if (campaignDate && campaignDate >= previousMonthStart && campaignDate <= previousMonthEnd) {
        return sum + (campaign.contacts?.length || 0);
      }
      return sum;
    }, 0);
    const previousMonthRate = previousMonthInvitations === 0 ? 0 : (previousMonthResponses / previousMonthInvitations) * 100;

    // Calculate % increase
    const percentIncrease = previousMonthRate === 0 
      ? (currentMonthRate > 0 ? 100 : 0)
      : ((currentMonthRate - previousMonthRate) / previousMonthRate) * 100;

    return {
      overall: overallResponseRate,
      currentMonth: currentMonthRate,
      previousMonth: previousMonthRate,
      percentIncrease,
    };
  }, [responses, campaigns]);

  const averageReward = useMemo(() => {
    const paid = responsesInWindow.filter((r) => r.reward_status === "paid" && (r.reward_amount || 0) > 0);
    const sum = paid.reduce((acc, r) => acc + (r.reward_amount || 0), 0);
    return paid.length === 0 ? 0 : sum / paid.length;
  }, [responsesInWindow]);

  const rewardsClaimedTotal = useMemo(() => {
    return responsesInWindow
      .filter((r) => r.reward_status === "paid" && (r.reward_amount || 0) > 0)
      .reduce((sum, r) => sum + (r.reward_amount || 0), 0);
  }, [responsesInWindow]);

  const averageCompletionTimeMs = useMemo(() => {
    const completed = responsesInWindow
      .map((r) => {
        const s = parseDate(r.started_at);
        const c = parseDate(r.completed_at);
        if (!s || !c) return null;
        return c.getTime() - s.getTime();
      })
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0);
    if (completed.length === 0) return 0;
    return completed.reduce((a, b) => a + b, 0) / completed.length;
  }, [responsesInWindow]);

  const customerRetentionRate = useMemo(() => {
    // "Repeat responder rate" within current window: responders who appear >=2 times / unique responders
    const keys = responsesInWindow.map((r) => {
      const e = normalizeEmail(r.responders_email);
      const p = normalizePhone(r.responders_phone);
      return e || p || "";
    }).filter(Boolean);

    const counts = new Map<string, number>();
    keys.forEach((k) => counts.set(k, (counts.get(k) || 0) + 1));
    const unique = counts.size;
    const repeat = Array.from(counts.values()).filter((c) => c >= 2).length;
    return unique === 0 ? 0 : (repeat / unique) * 100;
  }, [responsesInWindow]);

  const botSummary = useMemo(() => {
    const counts = { human: 0, suspicious: 0, bot: 0 };
    responsesInWindow.forEach((r) => {
      const c = classifyBot(r);
      counts[c] += 1;
    });
    return counts;
  }, [responsesInWindow]);

  const campaignPerformance = useMemo(() => {
    const byCampaign = new Map<string, typeof responsesInWindow>();
    responsesInWindow.forEach((r) => {
      const id = getCampaignIdFromResponse(r);
      if (!id) return;
      const list = byCampaign.get(id) || [];
      list.push(r);
      byCampaign.set(id, list);
    });

    const mapped = campaigns.map((c) => {
      const id = c._id || c.id || "";
      const contacts = c.contacts?.length || 0;
      const resp = byCampaign.get(id) || [];
      const responsesCount = resp.length;
      const conversionRate = contacts === 0 ? 0 : (responsesCount / contacts) * 100;
      const rewardUtilizedFromCampaign = safeNumber(c.reward?.amount_utilized, 0);
      const rewardUtilizedFromResponses = resp
        .filter((r) => r.reward_status === "paid" && safeNumber(r.reward_amount, 0) > 0)
        .reduce((sum, r) => sum + safeNumber(r.reward_amount, 0), 0);
      const rewardUtilized =
        rewardUtilizedFromCampaign > 0 ? rewardUtilizedFromCampaign : rewardUtilizedFromResponses;

      const statusRaw = (c.status || "").toLowerCase();
      const status =
        statusRaw === "paused"
          ? ("Paused" as const)
          : statusRaw === "completed"
            ? ("Completed" as const)
            : ("Active" as const);

      const startDate = c.createdAt
        ? new Date(c.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
        : "—";

      return {
        id,
        name: c.name || "Untitled Campaign",
        conversionRate,
        rewardUtilized,
        status,
        participants: contacts,
        startDate,
      };
    });

    return mapped
      .sort((a, b) => b.rewardUtilized - a.rewardUtilized)
      .slice(0, 6);
  }, [campaigns, responsesInWindow]);

  const insights = useMemo<Insight[]>(() => {
    const now = new Date();
    const completedInWindow = responsesInWindow.filter((r) => Boolean(r.completed_at));
    const peakHour = (() => {
      const hours = new Array(24).fill(0);
      completedInWindow.forEach((r) => {
        const d = parseDate(r.completed_at || r.started_at || r.createdAt);
        if (!d) return;
        hours[d.getHours()] += 1;
      });
      const max = Math.max(...hours);
      const idx = hours.findIndex((h) => h === max);
      return max === 0 ? null : idx;
    })();

    const botRate = responsesInWindow.length === 0 ? 0 : (botSummary.bot / responsesInWindow.length) * 100;

    const list: Insight[] = [
      {
        id: 1,
        title: "Response Rate Trend",
        description:
          `Overall response rate is ${responseRateMetrics.overall.toFixed(1)}%. ` +
          `Change vs last month: ${responseRateMetrics.percentIncrease >= 0 ? "+" : ""}${responseRateMetrics.percentIncrease.toFixed(1)}%.`,
        type: responseRateMetrics.percentIncrease >= 0 ? "success" : "warning",
        icon: responseRateMetrics.percentIncrease >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />,
      },
      {
        id: 2,
        title: "Peak Completion Hour",
        description:
          peakHour === null
            ? "Not enough completions to determine peak hours yet."
            : `Most completions occur around ${peakHour}:00–${(peakHour + 1) % 24}:00. Consider scheduling invites near that time.`,
        type: "info",
        icon: <Clock className="w-5 h-5" />,
      },
      {
        id: 3,
        title: "Bot & Fraud Signals",
        description:
          `In the selected period (${dateFilter}), bot-detected rate is ${botRate.toFixed(1)}%. ` +
          `Suspicious: ${botSummary.suspicious}, Bots: ${botSummary.bot}.`,
        type: botRate >= 5 ? "warning" : "success",
        icon: botRate >= 5 ? <AlertTriangle className="w-5 h-5" /> : <Shield className="w-5 h-5" />,
      },
    ];

    // Keep deterministic order
    void now;
    return list;
  }, [responsesInWindow, botSummary, responseRateMetrics, dateFilter]);

  const userAnalyticsRows = useMemo<UserAnalytics[]>(() => {
    const rows = responsesInWindow.map((r, idx) => {
      const id = (r._id || r.id || `R${idx}`) as string;
      const detection = classifyBot(r);
      const started = parseDate(r.started_at);
      const completed = parseDate(r.completed_at);
      const completionTime = started && completed ? formatDuration(completed.getTime() - started.getTime()) : "—";

      const status: UserAnalytics["status"] =
        detection === "bot" ? "failed" : completed ? "completed" : "pending";

      const rewardAmount = r.reward_status === "paid" ? (r.reward_amount || 0) : 0;
      const rewardStatus: UserAnalytics["reward"]["status"] = r.reward_status === "paid" ? "claimed" : "pending";

      const campaignName = getCampaignNameFromResponse(r);

      return {
        id,
        customer: {
          name: normalizeEmail(r.responders_email) || "Responder",
          phone: r.responders_phone || "—",
        },
        campaign: campaignName,
        location: {
          city: "—",
          country: "—",
          ip: r.ip_address || "—",
        },
        botDetection: detection,
        completionTime,
        status,
        reward: {
          amount: rewardAmount,
          status: rewardStatus,
        },
      };
    });

    return rows;
  }, [responsesInWindow]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full";
    
    switch (status) {
      case "Active":
        return (
          <span className={`${baseClasses} text-green-700 bg-green-100 dark:bg-green-900/20 dark:text-green-400`}>
            <CheckCircle className="w-3 h-3" />
            Active
          </span>
        );
      case "Paused":
        return (
          <span className={`${baseClasses} text-amber-700 bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400`}>
            <Clock className="w-3 h-3" />
            Paused
          </span>
        );
      case "Completed":
        return (
          <span className={`${baseClasses} text-blue-700 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400`}>
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800";
      case "warning":
        return "bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800";
      case "info":
        return "bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800";
      default:
        return "bg-gray-50 border-gray-200 dark:bg-gray-900/10 dark:border-gray-800";
    }
  };

  const getInsightIconColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-600 dark:text-green-400";
      case "warning":
        return "text-amber-600 dark:text-amber-400";
      case "info":
        return "text-blue-600 dark:text-blue-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getBotDetectionBadge = (detection: string) => {
    const baseClasses = "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full";
    
    switch (detection) {
      case "human":
        return (
          <span className={`${baseClasses} text-green-700 bg-green-100 dark:bg-green-900/20 dark:text-green-400`}>
            <Shield className="w-3 h-3" />
            Human Verified
          </span>
        );
      case "suspicious":
        return (
          <span className={`${baseClasses} text-yellow-700 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400`}>
            <AlertCircle className="w-3 h-3" />
            Suspicious
          </span>
        );
      case "bot":
        return (
          <span className={`${baseClasses} text-red-700 bg-red-100 dark:bg-red-900/20 dark:text-red-400`}>
            <Bot className="w-3 h-3" />
            Bot Detected
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusBadgeDetailed = (status: string) => {
    const baseClasses = "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full";
    
    switch (status) {
      case "completed":
        return (
          <span className={`${baseClasses} text-green-700 bg-green-100 dark:bg-green-900/20 dark:text-green-400`}>
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        );
      case "pending":
        return (
          <span className={`${baseClasses} text-yellow-700 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400`}>
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case "failed":
        return (
          <span className={`${baseClasses} text-red-700 bg-red-100 dark:bg-red-900/20 dark:text-red-400`}>
            <XCircle className="w-3 h-3" />
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  const getRewardBadge = (status: string) => {
    const baseClasses = "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full";
    
    switch (status) {
      case "claimed":
        return (
          <span className={`${baseClasses} text-blue-700 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400`}>
            <Gift className="w-3 h-3" />
            Claimed
          </span>
        );
      case "pending":
        return (
          <span className={`${baseClasses} text-gray-700 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400`}>
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      default:
        return null;
    }
  };

  const filteredUserAnalytics = userAnalyticsRows.filter(user => {
    const matchesSearch = user.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.customer.phone.includes(searchQuery) ||
                         user.campaign.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {!detailedView ? (
        <>
          {/* Enhanced Header Section */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>
              <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Track performance metrics and gain insights into your survey campaigns
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setDetailedView(!detailedView)}
                  className={`inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors flex-1 sm:flex-none ${
                    detailedView 
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400" 
                      : "text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">{detailedView ? "Detailed View" : "Summary View"}</span>
                  <span className="sm:hidden">{detailedView ? "Detailed" : "Summary"}</span>
                </button>
                
                <div className="relative flex-1 sm:flex-none">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white appearance-none text-xs sm:text-sm"
                  >
                    <option value="Last 7 days">Last 7 days</option>
                    <option value="Last 30 days">Last 30 days</option>
                    <option value="Last 3 months">Last 3 months</option>
                    <option value="Last year">Last year</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                <button className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-1 sm:flex-none">
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">Refresh</span>
                  <span className="sm:hidden">Refresh</span>
                </button>
              </div>
              
              {/* <button className="inline-flex items-center justify-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export Report</span>
                <span className="sm:hidden">Export</span>
              </button> */}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Detailed Analytics Header */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Detailed User Analytics & Bot Detection</h2>
              <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Comprehensive user behavior analysis and fraud detection insights
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setDetailedView(!detailedView)}
                  className={`inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors flex-1 sm:flex-none ${
                    detailedView 
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400" 
                      : "text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">{detailedView ? "Detailed View" : "Summary View"}</span>
                  <span className="sm:hidden">{detailedView ? "Detailed" : "Summary"}</span>
                </button>
                
                <div className="relative flex-1 sm:flex-none">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white appearance-none text-xs sm:text-sm"
                  >
                    <option value="Last 7 days">Last 7 days</option>
                    <option value="Last 30 days">Last 30 days</option>
                    <option value="Last 3 months">Last 3 months</option>
                    <option value="Last year">Last year</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                <button className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-1 sm:flex-none">
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">Refresh</span>
                  <span className="sm:hidden">Refresh</span>
                </button>
              </div>
              
              {/* <button className="inline-flex items-center justify-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export Report</span>
                <span className="sm:hidden">Export</span>
              </button> */}
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by user, campaign, or ID…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white appearance-none min-w-[120px]"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Human Verified */}
            <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:from-green-900/20 dark:to-emerald-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Human Verified</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{botSummary.human.toLocaleString()}</p>
                  <div className="flex items-center mt-1">
                    <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <p className="ml-1 text-xs text-green-600 dark:text-green-400">From {dateFilter}</p>
                  </div>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            {/* Suspicious */}
            <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-yellow-50 to-amber-50 p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:from-yellow-900/20 dark:to-amber-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Suspicious</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{botSummary.suspicious.toLocaleString()}</p>
                  <div className="flex items-center mt-1">
                    <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    <p className="ml-1 text-xs text-yellow-600 dark:text-yellow-400">From {dateFilter}</p>
                  </div>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </div>

            {/* Bot Detected */}
            <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-red-50 to-pink-50 p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:from-red-900/20 dark:to-pink-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bot Detected</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{botSummary.bot.toLocaleString()}</p>
                  <div className="flex items-center mt-1">
                    <Bot className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <p className="ml-1 text-xs text-red-600 dark:text-red-400">From {dateFilter}</p>
                  </div>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                  <Bot className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>

            {/* Rewards Claimed */}
            <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:from-blue-900/20 dark:to-cyan-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rewards Claimed</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(rewardsClaimedTotal)}
                  </p>
                  <div className="flex items-center mt-1">
                    <Gift className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <p className="ml-1 text-xs text-blue-600 dark:text-blue-400">From {dateFilter}</p>
                  </div>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Gift className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
          </div>

          {/* User Analytics Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">User Analytics & Bot Detection</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Detailed user behavior and fraud detection analysis</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Campaign</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bot Detection</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Completion Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reward</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUserAnalytics.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{user.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{user.customer.name}</div>
                            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                              <Phone className="w-3 h-3" />
                              {user.customer.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{user.campaign}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-900 dark:text-white">{user.location.city}, {user.location.country}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{user.location.ip}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getBotDetectionBadge(user.botDetection)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-white">{user.completionTime}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadgeDetailed(user.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.reward.amount > 0 ? formatCurrency(user.reward.amount) : "N/A"}
                          </span>
                          {user.reward.amount > 0 && getRewardBadge(user.reward.status)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!detailedView && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Response Rate */}
            <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:from-purple-900/20 dark:to-pink-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Response Rate</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{responseRateMetrics.overall.toFixed(1)}%</p>
                  <div className="flex items-center mt-1">
                    {responseRateMetrics.percentIncrease >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                    )}
                    <p className={`ml-1 text-xs ${
                      responseRateMetrics.percentIncrease >= 0 
                        ? "text-green-600 dark:text-green-400" 
                        : "text-red-600 dark:text-red-400"
                    }`}>
                      {responseRateMetrics.percentIncrease >= 0 ? "+" : ""}{responseRateMetrics.percentIncrease.toFixed(1)}% from last month
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            {/* Average Reward */}
            <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:from-blue-900/20 dark:to-cyan-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Reward</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(averageReward)}</p>
                  <div className="flex items-center mt-1">
                    <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <p className="ml-1 text-xs text-blue-600 dark:text-blue-400">Paid rewards only · {dateFilter}</p>
                  </div>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Award className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            {/* Customer Retention */}
            <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:from-green-900/20 dark:to-emerald-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Customer Retention</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{customerRetentionRate.toFixed(1)}%</p>
                  <div className="flex items-center mt-1">
                    <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <p className="ml-1 text-xs text-green-600 dark:text-green-400">Repeat responders in {dateFilter}</p>
                  </div>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            {/* Average Completion Time */}
            <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:from-amber-900/20 dark:to-orange-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Completion Time</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                    {averageCompletionTimeMs > 0 ? formatDuration(averageCompletionTimeMs).replace(" ", "") : "—"}
                  </p>
                  <div className="flex items-center mt-1">
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <p className="ml-1 text-xs text-amber-600 dark:text-amber-400">Completed only · {dateFilter}</p>
                  </div>
                </div>
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                  <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Response Trends Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Response Trends</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Survey response rates over time</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span>Response Rate</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                    <span>Completion Rate</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <LineChartOne
                categories={(() => {
                  const now = new Date();
                  const labels: string[] = [];
                  for (let i = 11; i >= 0; i -= 1) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    labels.push(d.toLocaleDateString(undefined, { month: "short" }));
                  }
                  return labels;
                })()}
                series={(() => {
                  const now = new Date();
                  const buckets = new Array(12).fill(0);
                  const completedBuckets = new Array(12).fill(0);
                  const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
                  responses.forEach((r) => {
                    const d = parseDate(r.completed_at || r.started_at || r.createdAt);
                    if (!d) return;
                    if (d < start || d > now) return;
                    const idx = (d.getFullYear() - start.getFullYear()) * 12 + (d.getMonth() - start.getMonth());
                    if (idx < 0 || idx > 11) return;
                    buckets[idx] += 1;
                    if (r.completed_at) completedBuckets[idx] += 1;
                  });
                  return [
                    { name: "Responses", data: buckets },
                    { name: "Completions", data: completedBuckets },
                  ];
                })()}
              />
            </div>
          </div>

          {/* Bottom Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Campaign Performance */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Campaign Performance</h3>
                  <button className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium">
                    View All
                  </button>
                </div>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {campaignPerformance.map((campaign) => (
                  <div key={campaign.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{campaign.name}</h4>
                          {getStatusBadge(campaign.status)}
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                          <span>{campaign.participants.toLocaleString()} participants</span>
                          <span>Started {campaign.startDate}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatCurrency((campaign as { rewardUtilized?: number }).rewardUtilized || 0)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {campaign.conversionRate.toFixed(2)}% conversion
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Insights */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Key Insights</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Performance highlights and recommendations</p>
              </div>
              <div className="p-6 space-y-4">
                {insights.map((insight) => (
                  <div key={insight.id} className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getInsightColor(insight.type)}`}>
                        <div className={getInsightIconColor(insight.type)}>
                          {insight.icon}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{insight.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

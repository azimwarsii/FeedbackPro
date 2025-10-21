"use client";

import React, { useState } from "react";
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

interface Campaign {
  id: number;
  name: string;
  conversionRate: number;
  earnings: number;
  status: "Active" | "Paused" | "Completed";
  participants: number;
  startDate: string;
}

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

const mockCampaigns: Campaign[] = [
  {
    id: 1,
    name: "Q4 Customer Satisfaction Survey",
    conversionRate: 78.5,
    earnings: 2450.00,
    status: "Active",
    participants: 1250,
    startDate: "Dec 1, 2024"
  },
  {
    id: 2,
    name: "Product Feedback Campaign",
    conversionRate: 65.2,
    earnings: 1890.00,
    status: "Active",
    participants: 890,
    startDate: "Nov 15, 2024"
  },
  {
    id: 3,
    name: "Brand Awareness Study",
    conversionRate: 82.1,
    earnings: 3200.00,
    status: "Completed",
    participants: 2100,
    startDate: "Oct 20, 2024"
  },
  {
    id: 4,
    name: "Market Research Initiative",
    conversionRate: 71.3,
    earnings: 1560.00,
    status: "Paused",
    participants: 680,
    startDate: "Dec 5, 2024"
  }
];

const mockInsights: Insight[] = [
  {
    id: 1,
    title: "Response Rate Improvement",
    description: "Response rates have increased by 15% this month compared to last month, indicating better engagement strategies.",
    type: "success",
    icon: <TrendingUp className="w-5 h-5" />
  },
  {
    id: 2,
    title: "Peak Activity Hours",
    description: "Most survey completions occur between 2-4 PM. Consider scheduling campaigns during these hours.",
    type: "info",
    icon: <Clock className="w-5 h-5" />
  },
  {
    id: 3,
    title: "Customer Retention Alert",
    description: "Customer retention rate has dropped by 3% this week. Review engagement strategies and follow up with inactive users.",
    type: "warning",
    icon: <AlertTriangle className="w-5 h-5" />
  }
];

const mockUserAnalytics: UserAnalytics[] = [
  {
    id: "UA001",
    customer: { name: "John Smith", phone: "+1 (555) 123-4567" },
    campaign: "Q4 Customer Satisfaction",
    location: { city: "New York", country: "USA", ip: "192.168.1.1" },
    botDetection: "human",
    completionTime: "3m 24s",
    status: "completed",
    reward: { amount: 15.00, status: "claimed" }
  },
  {
    id: "UA002",
    customer: { name: "Sarah Johnson", phone: "+1 (555) 987-6543" },
    campaign: "Product Feedback",
    location: { city: "Los Angeles", country: "USA", ip: "192.168.1.2" },
    botDetection: "suspicious",
    completionTime: "1m 12s",
    status: "completed",
    reward: { amount: 12.50, status: "pending" }
  },
  {
    id: "UA003",
    customer: { name: "Mike Wilson", phone: "+1 (555) 456-7890" },
    campaign: "Brand Awareness",
    location: { city: "Chicago", country: "USA", ip: "192.168.1.3" },
    botDetection: "bot",
    completionTime: "0m 45s",
    status: "failed",
    reward: { amount: 0, status: "pending" }
  },
  {
    id: "UA004",
    customer: { name: "Emily Davis", phone: "+1 (555) 321-0987" },
    campaign: "Market Research",
    location: { city: "Houston", country: "USA", ip: "192.168.1.4" },
    botDetection: "human",
    completionTime: "4m 18s",
    status: "completed",
    reward: { amount: 20.00, status: "claimed" }
  },
  {
    id: "UA005",
    customer: { name: "David Brown", phone: "+1 (555) 654-3210" },
    campaign: "Customer Satisfaction",
    location: { city: "Phoenix", country: "USA", ip: "192.168.1.5" },
    botDetection: "human",
    completionTime: "2m 56s",
    status: "completed",
    reward: { amount: 18.75, status: "claimed" }
  },
  {
    id: "UA006",
    customer: { name: "Lisa Anderson", phone: "+1 (555) 789-0123" },
    campaign: "Product Feedback",
    location: { city: "Philadelphia", country: "USA", ip: "192.168.1.6" },
    botDetection: "suspicious",
    completionTime: "0m 58s",
    status: "pending",
    reward: { amount: 10.00, status: "pending" }
  }
];

export default function Analytics() {
  const [detailedView, setDetailedView] = useState(false);
  const [dateFilter, setDateFilter] = useState("Last 30 days");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

  const filteredUserAnalytics = mockUserAnalytics.filter(user => {
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
              
              <button className="inline-flex items-center justify-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export Report</span>
                <span className="sm:hidden">Export</span>
              </button>
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
              
              <button className="inline-flex items-center justify-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export Report</span>
                <span className="sm:hidden">Export</span>
              </button>
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
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">4,247</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <p className="ml-1 text-xs text-green-600 dark:text-green-400">+8.2% from last month</p>
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
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">156</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    <p className="ml-1 text-xs text-yellow-600 dark:text-yellow-400">+2.1% from last month</p>
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
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">89</p>
                  <div className="flex items-center mt-1">
                    <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <p className="ml-1 text-xs text-red-600 dark:text-red-400">-12.5% from last month</p>
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
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">$52,340</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <p className="ml-1 text-xs text-blue-600 dark:text-blue-400">+15.3% from last month</p>
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
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">78.5%</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <p className="ml-1 text-xs text-green-600 dark:text-green-400">+12.3% from last month</p>
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
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">$12.50</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <p className="ml-1 text-xs text-green-600 dark:text-green-400">+5.2% from last month</p>
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
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">85.2%</p>
                  <div className="flex items-center mt-1">
                    <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <p className="ml-1 text-xs text-red-600 dark:text-red-400">-2.1% from last month</p>
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
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">4.2m</p>
                  <div className="flex items-center mt-1">
                    <TrendingDown className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <p className="ml-1 text-xs text-green-600 dark:text-green-400">-0.8m from last month</p>
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
              <LineChartOne />
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
                {mockCampaigns.map((campaign) => (
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
                          {formatCurrency(campaign.earnings)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {campaign.conversionRate}% conversion
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
                {mockInsights.map((insight) => (
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

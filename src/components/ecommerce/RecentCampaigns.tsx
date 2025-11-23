"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Badge from "../ui/badge/Badge";
import { Users, DollarSign, Calendar, MoreHorizontal, Plus, Tag, Download } from "lucide-react";
import { useCampaignStore, Campaign as StoreCampaign } from "@/store/useCampaignStore";

// Define the TypeScript interface for display campaign data
interface Campaign {
  id: string;
  title: string;
  description: string;
  status: "Active" | "Paused" | "Completed";
  responses: number;
  budget: number;
  budgetUsed: number;
  endDate: string;
  rewardType?: "cash reward" | "promo code";
  promoCodesTotal?: number;
  promoCodesUtilized?: number;
  promoCode?: string;
}

// Helper function to mask promo code for security
const maskPromoCode = (code: string): string => {
  if (!code || code.length <= 4) {
    return code;
  }
  const visibleStart = code.substring(0, 2);
  const visibleEnd = code.substring(code.length - 2);
  const maskedLength = code.length - 4;
  const masked = "•".repeat(maskedLength);
  return `${visibleStart}${masked}${visibleEnd}`;
};

// Helper function to map store campaign to display campaign
const mapCampaignToDisplay = (storeCampaign: StoreCampaign): Campaign => {
  const id = storeCampaign._id || storeCampaign.id || "";
  
  let budget = 0;
  let budgetUsed = 0;
  let promoCodesTotal: number | undefined;
  let promoCodesUtilized: number | undefined;
  
  const contactsCount = storeCampaign.contacts?.length || 0;
  
  if (storeCampaign.reward) {
    if (storeCampaign.reward.type === "cash reward" && storeCampaign.reward.amount) {
      budget = storeCampaign.reward.amount * contactsCount;
      budgetUsed = storeCampaign.reward.amount_utilized ?? (storeCampaign.reward.amount * (storeCampaign.responses || 0));
    } else if (storeCampaign.reward.type === "promo code") {
      promoCodesTotal = contactsCount;
      promoCodesUtilized = storeCampaign.reward.codes_utilized ?? 0;
      budget = contactsCount * 0.02; // SMS cost per message
      budgetUsed = (storeCampaign.responses || 0) * 0.02;
    }
  } else {
    budget = contactsCount * 0.02;
    budgetUsed = (storeCampaign.responses || 0) * 0.02;
  }
  
  let status: "Active" | "Paused" | "Completed" = "Active";
  if (storeCampaign.status) {
    const storeStatus = storeCampaign.status.trim();
    const capitalizedStatus = storeStatus.charAt(0).toUpperCase() + storeStatus.slice(1).toLowerCase();
    const normalizedStatus = capitalizedStatus === "Draft" ? "Active" : capitalizedStatus;
    if (["Active", "Paused", "Completed"].includes(normalizedStatus)) {
      status = normalizedStatus as "Active" | "Paused" | "Completed";
    }
  }
  
  // Format end date (if available from updatedAt or createdAt)
  let endDate = "N/A";
  if (storeCampaign.updatedAt) {
    try {
      const date = new Date(storeCampaign.updatedAt);
      endDate = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      endDate = "N/A";
    }
  }
  
  return {
    id,
    title: storeCampaign.name,
    description: storeCampaign.description || "",
    status,
    responses: storeCampaign.responses || 0,
    budget,
    budgetUsed,
    endDate,
    rewardType: storeCampaign.reward?.type,
    promoCodesTotal,
    promoCodesUtilized,
    promoCode: storeCampaign.reward?.code,
  };
};

export default function RecentCampaigns() {
  const router = useRouter();
  const campaigns = useCampaignStore((state) => state.campaigns);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Map store campaigns to display format and get recent campaigns (last 6)
  const displayCampaigns: Campaign[] = useMemo(() => {
    return campaigns
      .map(mapCampaignToDisplay)
      .sort((a, b) => {
        // Sort by most recent - find original campaigns to get dates
        const campaignA = campaigns.find(c => (c._id || c.id) === a.id);
        const campaignB = campaigns.find(c => (c._id || c.id) === b.id);
        
        const dateA = campaignA?.updatedAt || campaignA?.createdAt || "";
        const dateB = campaignB?.updatedAt || campaignB?.createdAt || "";
        
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        
        return new Date(dateB).getTime() - new Date(dateA).getTime(); // Most recent first
      })
      .slice(0, 6); // Get most recent 6 campaigns
  }, [campaigns]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "success";
      case "Paused":
        return "warning";
      case "Completed":
        return "dark";
      default:
        return "light";
    }
  };

  const getBudgetPercentage = (used: number, total: number) => {
    return (used / total) * 100;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleMenuClick = (campaignId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenMenuId(openMenuId === campaignId ? null : campaignId);
  };


  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 pb-6 pt-6 dark:border-gray-700 dark:bg-gray-800">
      {/* Enhanced Header Section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Recent Campaigns</h3>
          <p className="mt-1 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Track your latest feedback campaigns and their performance
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-1 sm:flex-none">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
          <button 
            onClick={() => router.push("/campaign/create")}
            className="inline-flex items-center justify-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Campaign</span>
            <span className="sm:hidden">Create</span>
          </button>
        </div>
      </div>

      {/* Campaign Cards Grid */}
      {displayCampaigns.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No campaigns yet. Create your first campaign to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayCampaigns.map((campaign) => (
            <div
              key={campaign.id}
              onClick={() => router.push(`/campaign/${campaign.id}`)}
              className="relative rounded-xl border border-gray-200 bg-white p-5 shadow-theme-sm hover:shadow-theme-md transition-all duration-300 dark:border-gray-800 dark:bg-white/[0.03] hover:scale-[1.02] group cursor-pointer"
            >
              {/* Menu Button */}
              <div className="absolute top-4 right-4" ref={menuRef}>
                <button 
                  onClick={(e) => handleMenuClick(campaign.id, e)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 opacity-0 group-hover:opacity-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                
                {/* Dropdown Menu */}
                {openMenuId === campaign.id && (
                  <div className="absolute right-0 top-8 z-50 w-48 rounded-lg border border-gray-200 bg-white py-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/campaign/${campaign.id}`);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      View Details
                    </button>
                  </div>
                )}
              </div>

            {/* Campaign Title */}
            <h4 className="pr-8 text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {campaign.title}
            </h4>

            {/* Status Badge */}
            <div className="mb-3">
              <Badge size="sm" color={getStatusColor(campaign.status)}>
                {campaign.status}
              </Badge>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
              {campaign.description}
            </p>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-4 mb-4">
               {/* Responses */}
               <div className="text-center group/metric">
                 <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg mx-auto mb-2 dark:bg-gray-800 group-hover/metric:bg-purple-50 dark:group-hover/metric:bg-purple-500/20 transition-colors duration-200">
                   <Users className="text-gray-600 w-5 h-5 dark:text-gray-400 group-hover/metric:text-purple-500 dark:group-hover/metric:text-purple-400 transition-colors duration-200" />
                 </div>
                 <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Responses</p>
                 <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                   {campaign.responses}
                 </p>
               </div>

               {/* Budget or Promo Code */}
               {campaign.rewardType === "promo code" ? (
                 <div className="text-center group/metric">
                   <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg mx-auto mb-2 dark:bg-gray-800 group-hover/metric:bg-purple-50 dark:group-hover/metric:bg-purple-500/20 transition-colors duration-200">
                     <Tag className="text-gray-600 w-5 h-5 dark:text-gray-400 group-hover/metric:text-purple-500 dark:group-hover/metric:text-purple-400 transition-colors duration-200" />
                   </div>
                   <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Promo Code</p>
                   <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                     {campaign.promoCode ? maskPromoCode(campaign.promoCode) : "N/A"}
                   </p>
                 </div>
               ) : (
                 <div className="text-center group/metric">
                   <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg mx-auto mb-2 dark:bg-gray-800 group-hover/metric:bg-purple-50 dark:group-hover/metric:bg-purple-500/20 transition-colors duration-200">
                     <DollarSign className="text-gray-600 w-5 h-5 dark:text-gray-400 group-hover/metric:text-purple-500 dark:group-hover/metric:text-purple-400 transition-colors duration-200" />
                   </div>
                   <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Budget</p>
                   <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                     {formatCurrency(campaign.budget)}
                   </p>
                 </div>
               )}

               {/* End Date */}
               <div className="text-center group/metric">
                 <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg mx-auto mb-2 dark:bg-gray-800 group-hover/metric:bg-purple-50 dark:group-hover/metric:bg-purple-500/20 transition-colors duration-200">
                   <Calendar className="text-gray-600 w-5 h-5 dark:text-gray-400 group-hover/metric:text-purple-500 dark:group-hover/metric:text-purple-400 transition-colors duration-200" />
                 </div>
                 <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">End Date</p>
                 <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                   {campaign.endDate}
                 </p>
               </div>
            </div>

            {/* Budget Progress or Promo Code Progress */}
            {campaign.rewardType === "promo code" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Codes Used</span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {campaign.promoCodesUtilized || 0} / {campaign.promoCodesTotal || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 overflow-hidden">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${campaign.promoCodesTotal && campaign.promoCodesTotal > 0 ? ((campaign.promoCodesUtilized || 0) / campaign.promoCodesTotal) * 100 : 0}%`,
                      animationDelay: `${(campaign.id.charCodeAt(0) || 0) * 150}ms`,
                    }}
                  ></div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Budget Used</span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {formatCurrency(campaign.budgetUsed)} / {formatCurrency(campaign.budget)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 overflow-hidden">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${getBudgetPercentage(campaign.budgetUsed, campaign.budget)}%`,
                      animationDelay: `${(campaign.id.charCodeAt(0) || 0) * 150}ms`,
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      )}
    </div>
  );
}

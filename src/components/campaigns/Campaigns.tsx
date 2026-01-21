"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CreateCampaignDialog } from "./CreateCampaignDialog";
import { MoreHorizontal, BarChart3, Copy, Trash2, Users, DollarSign, Search, Filter, ChevronDown, Pause, Play, Tag } from "lucide-react";
import { useCampaignStore, Campaign as StoreCampaign } from "@/store/useCampaignStore";
import { useSession } from "next-auth/react";
import { SessionUser } from "@/types/session";

type Status = "Active" | "Paused" | "Completed";

type Campaign = {
  id: string;
  title: string;
  description: string;
  status: Status;
  responses: number;
  budget: number;
  spent: number;
  endDate: string;
  peopleInvited: number; // Number of people invited (contacts.length)
  rewardType?: "cash reward" | "promo code";
  promoCodesTotal?: number; // Total promo codes (contacts.length)
  promoCodesUtilized?: number; // codes_utilized from reward
  promoCode?: string; // The promo code itself
};

const statusColors: Record<Status, string> = {
  Active: "bg-emerald-100 text-emerald-700",
  Paused: "bg-amber-100 text-amber-700",
  Completed: "bg-sky-100 text-sky-700",
};

// Helper function to mask promo code for security
const maskPromoCode = (code: string): string => {
  if (!code || code.length <= 4) {
    return code; // Too short to mask
  }
  
  // Show first 2 and last 2 characters, mask the rest
  const visibleStart = code.substring(0, 2);
  const visibleEnd = code.substring(code.length - 2);
  const maskedLength = code.length - 4;
  const masked = "•".repeat(maskedLength);
  
  return `${visibleStart}${masked}${visibleEnd}`;
};

// Helper function to map store campaign to display campaign
const mapCampaignToDisplay = (storeCampaign: StoreCampaign): Campaign => {
  const id = storeCampaign._id || storeCampaign.id || "";
  
  // Calculate budget based on reward and contacts
  let budget = 0;
  let spent = 0;
  let promoCodesTotal: number | undefined;
  let promoCodesUtilized: number | undefined;
  
  const contactsCount = storeCampaign.contacts?.length || 0;
  
  if (storeCampaign.reward) {
    if (storeCampaign.reward.type === "cash reward" && storeCampaign.reward.amount) {
      budget = storeCampaign.reward.amount * contactsCount;
      // Use amount_utilized if available, otherwise estimate based on responses
      spent = storeCampaign.reward.amount_utilized ?? (storeCampaign.reward.amount * (storeCampaign.responses || 0));
    } else if (storeCampaign.reward.type === "promo code") {
      // For promo codes, show codes instead of budget
      promoCodesTotal = contactsCount;
      promoCodesUtilized = storeCampaign.reward.codes_utilized ?? 0;
      // Still calculate SMS costs for budget/spent
      budget = contactsCount * 0.02; // SMS cost per message
      spent = (storeCampaign.responses || 0) * 0.02;
    }
  } else {
    // No reward, just SMS costs
    budget = contactsCount * 0.02; // SMS cost per message
    spent = (storeCampaign.responses || 0) * 0.02;
  }
  
  // Get status from store, or calculate based on responses and dates
  let status: Status = "Active"; // Default to Active instead of Draft
  let hasValidStatusFromStore = false;
  
  // First, try to use status from storeCampaign
  if (storeCampaign.status) {
    const storeStatus = storeCampaign.status.trim();
    // Capitalize first letter and check if it's a valid Status
    const capitalizedStatus = storeStatus.charAt(0).toUpperCase() + storeStatus.slice(1).toLowerCase();
    // Map "Draft" to "Active" if it exists in store
    const normalizedStatus = capitalizedStatus === "Draft" ? "Active" : capitalizedStatus;
    if (["Active", "Paused", "Completed"].includes(normalizedStatus)) {
      status = normalizedStatus as Status;
      hasValidStatusFromStore = true;
    }
  }
  
  // If no valid status from store, calculate based on responses
  if (!hasValidStatusFromStore) {
    if (storeCampaign.responses > 0) {
      const totalContacts = contactsCount;
      if (totalContacts > 0) {
        const responseRate = storeCampaign.responses / totalContacts;
        if (responseRate >= 0.8) {
          status = "Completed";
        } else if (responseRate >= 0.3) {
          status = "Active";
        } else {
          status = "Paused";
        }
      } else {
        status = "Active"; // If no contacts but has responses, mark as active
      }
    }
  }
  
  // Format end date from createdAt (add 30 days as default)
  let endDate = "N/A";
  if (storeCampaign.createdAt) {
    const createdDate = new Date(storeCampaign.createdAt);
    const endDateObj = new Date(createdDate);
    endDateObj.setDate(endDateObj.getDate() + 30);
    endDate = endDateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  
  return {
    id,
    title: storeCampaign.name,
    description: storeCampaign.description || storeCampaign.message_template || "No description",
    status,
    responses: storeCampaign.responses || 0,
    budget: Math.round(budget * 100) / 100,
    spent: Math.round(spent * 100) / 100,
    endDate,
    peopleInvited: contactsCount,
    rewardType: storeCampaign.reward?.type,
    promoCodesTotal,
    promoCodesUtilized,
    promoCode: storeCampaign.reward?.code,
  };
};


export default function Campaigns() {
  const router = useRouter();
  const campaigns = useCampaignStore((state) => state.campaigns);
  const removeCampaign = useCampaignStore((state) => state.removeCampaign);
  const updateCampaign = useCampaignStore((state) => state.updateCampaign);
  const { data: session } = useSession();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const menuRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  
  // Map store campaigns to display format
  const displayCampaigns: Campaign[] = campaigns.map(mapCampaignToDisplay);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      let clickedInsideMenu = false;
      
      menuRefs.current.forEach((menuElement) => {
        if (menuElement && menuElement.contains(target)) {
          clickedInsideMenu = true;
        }
      });
      
      if (!clickedInsideMenu) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMenuClick = (campaignId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenMenuId(openMenuId === campaignId ? null : campaignId);
  };

  const handleToggleStatus = async (campaignId: string, currentStatus: Status, action: "pause" | "start") => {
    const safeUser = session?.user as SessionUser;
    const userId = safeUser?.id;

    if (!userId) {
      alert("You must be logged in to update a campaign.");
      return;
    }

    // Determine new status based on action
    // On Pause click: update status to "paused"
    // On Start click: update status to "active"
    const newStatus = action === "pause" ? "paused" : "active";

    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || "http://localhost:5000";

    try {
      const response = await fetch(
        `${baseUrl.replace(/\/+$/, "")}/campaigns/${campaignId}?userId=${encodeURIComponent(userId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      if (response.ok) {
        // Update campaign in local store with the new status
        updateCampaign(campaignId, {
          status: newStatus,
        });
        
        alert(`Campaign ${action === "start" ? "started" : "paused"} successfully!`);
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        alert(`Failed to update campaign: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error updating campaign status:", error);
      alert("An error occurred while updating the campaign. Please try again.");
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      "Are you sure you want to delete this campaign? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    const safeUser = session?.user as SessionUser;
    const userId = safeUser?.id;

    if (!userId) {
      alert("You must be logged in to delete a campaign.");
      return;
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || "http://localhost:5000";

    try {
      const response = await fetch(
        `${baseUrl.replace(/\/+$/, "")}/campaigns/${campaignId}?userId=${encodeURIComponent(userId)}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        // Remove campaign from local store
        removeCampaign(campaignId);
        alert("Campaign deleted successfully!");
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        alert(`Failed to delete campaign: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting campaign:", error);
      alert("An error occurred while deleting the campaign. Please try again.");
    }
  };

  const handleCopyFeedbackLink = async (campaignId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    try {
      const feedbackLink = `${window.location.origin}/feedback/${campaignId}`;
      await navigator.clipboard.writeText(feedbackLink);
      setOpenMenuId(null);
      alert("Feedback link copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy link:", err);
      alert("Failed to copy link. Please try again.");
    }
  };

  const handleMenuAction = (action: string, campaignId: string, currentStatus?: Status, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    if (action === "Delete") {
      setOpenMenuId(null); // Close menu first
      // Use setTimeout to ensure menu closes before confirmation dialog
      setTimeout(() => {
        handleDeleteCampaign(campaignId);
      }, 0);
    } else if (action === "Pause" && currentStatus === "Active") {
      setOpenMenuId(null); // Close menu first
      handleToggleStatus(campaignId, currentStatus, "pause");
    } else if (action === "Start" && currentStatus === "Paused") {
      setOpenMenuId(null); // Close menu first
      handleToggleStatus(campaignId, currentStatus, "start");
    } else {
      console.log(`${action} campaign ${campaignId}`);
      setOpenMenuId(null);
    }
  };

  const filteredCampaigns = displayCampaigns.filter((campaign) => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All Status" || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCampaigns = displayCampaigns.length;
  const activeCampaigns = displayCampaigns.filter(c => c.status === "Active").length;
  const totalResponses = displayCampaigns.reduce((sum, c) => sum + c.responses, 0);
  const totalBudget = displayCampaigns.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = displayCampaigns.reduce((sum, c) => sum + c.spent, 0);

  // Calculate campaigns created this month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const campaignsThisMonth = campaigns.filter(campaign => {
    if (!campaign.createdAt) return false;
    const createdDate = new Date(campaign.createdAt);
    return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
  }).length;

  return (
    <div className="space-y-6">
      {/* Enhanced Header Section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Campaigns</h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Manage your feedback campaigns and track their performance
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            {/* <button className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-1 sm:flex-none">
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">Refresh</span>
            </button> */}
            {/* <button className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-1 sm:flex-none">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
              <span className="sm:hidden">Export</span>
            </button> */}
          </div>
          <CreateCampaignDialog />
        </div>
      </div>

      {/* Enhanced Summary Cards with Icons */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:from-blue-900/20 dark:to-cyan-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Campaigns</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{totalCampaigns}</p>
              <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                {campaignsThisMonth > 0 ? `+${campaignsThisMonth} this month` : "No campaigns this month"}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:from-green-900/20 dark:to-emerald-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Campaigns</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{activeCampaigns}</p>
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">{totalCampaigns > 0 ? Math.round((activeCampaigns/totalCampaigns)*100) : 0}% active rate</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:from-purple-900/20 dark:to-pink-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Responses</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{totalResponses}</p>
              <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">Avg {totalCampaigns > 0 ? Math.round(totalResponses/totalCampaigns) : 0} per campaign</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:from-amber-900/20 dark:to-orange-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Budget Used</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">${totalSpent.toLocaleString()}</p>
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">of ${totalBudget.toLocaleString()} total</p>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
              <DollarSign className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Search and Filter Section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search campaigns by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors"
            />
          </div>
          
          <div className="flex gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white appearance-none min-w-[140px]"
              >
                <option value="All Status">All Status</option>
                <option value="Active">Active</option>
                <option value="Paused">Paused</option>
                <option value="Completed">Completed</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {filteredCampaigns.map((c) => {
          const isPromoCode = c.rewardType === "promo code";
          const percent = isPromoCode 
            ? (c.promoCodesUtilized && c.promoCodesTotal ? Math.round((c.promoCodesUtilized / c.promoCodesTotal) * 100) : 0)
            : (c.budget > 0 ? Math.round((c.spent / c.budget) * 100) : 0);
          return (
            <div 
              key={c.id} 
              onClick={(e) => {
                // Don't navigate if clicking on the menu button or menu itself
                const target = e.target as HTMLElement;
                if (!target.closest('.menu-button') && !target.closest('.menu-dropdown')) {
                  router.push(`/campaign/${c.id}`);
                }
              }}
              className="relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300 dark:border-gray-700 dark:bg-gray-800 hover:scale-[1.02] group cursor-pointer"
            >
              {/* Menu Button */}
              <div 
                className="absolute top-4 right-4 menu-button"
                ref={(el) => {
                  if (el) {
                    menuRefs.current.set(c.id, el);
                  } else {
                    menuRefs.current.delete(c.id);
                  }
                }}
              >
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuClick(c.id, e);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                
                {/* Dropdown Menu */}
                {openMenuId === c.id && (
                  <div 
                    className="absolute right-0 top-8 z-50 w-48 rounded-lg border border-gray-200 bg-white py-2 shadow-lg dark:border-gray-700 dark:bg-gray-800 menu-dropdown"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {c.status === "Active" && (
                      <button
                        onClick={(e) => handleMenuAction('Pause', c.id, c.status, e)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <Pause className="w-4 h-4" />
                        Pause
                      </button>
                    )}
                    {c.status === "Paused" && (
                      <button
                        onClick={(e) => handleMenuAction('Start', c.id, c.status, e)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Start
                      </button>
                    )}
                    <button
                      onClick={(e) => handleCopyFeedbackLink(c.id, e)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy Feedback Link
                    </button>
                    <button
                      onClick={(e) => handleMenuAction('Delete', c.id, undefined, e)}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Campaign Title */}
              <h3 className="pr-8 text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {c.title}
              </h3>

              {/* Status Badge */}
              <div className="mb-3">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[c.status]}`}>
                  {c.status}
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                {c.description}
              </p>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                {/* Responses */}
                <div className="text-center group/metric">
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg mx-auto mb-2 dark:bg-gray-800 transition-colors duration-200">
                    <Users className="text-gray-600 w-5 h-5 dark:text-gray-400 transition-colors duration-200" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Responses</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {c.responses}
                  </p>
                </div>

                {/* Budget or Promo Codes */}
                <div className="text-center group/metric">
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg mx-auto mb-2 dark:bg-gray-800 transition-colors duration-200">
                    {isPromoCode ? (
                      <Tag className="text-gray-600 w-5 h-5 dark:text-gray-400 transition-colors duration-200" />
                    ) : (
                      <DollarSign className="text-gray-600 w-5 h-5 dark:text-gray-400 transition-colors duration-200" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {isPromoCode ? "Promo Code" : "Budget"}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {isPromoCode 
                      ? (c.promoCode ? maskPromoCode(c.promoCode) : "N/A")
                      : `$${c.budget}`
                    }
                  </p>
                </div>

                {/* People Invited */}
                <div className="text-center group/metric">
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg mx-auto mb-2 dark:bg-gray-800 transition-colors duration-200">
                    <Users className="text-gray-600 w-5 h-5 dark:text-gray-400 transition-colors duration-200" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">People Invited</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {c.peopleInvited}
                  </p>
                </div>
              </div>

              {/* Budget Progress or Promo Code Utilization */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {isPromoCode ? "Promo Codes Utilized" : "Budget Used"}
                  </span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {isPromoCode 
                      ? `${c.promoCodesUtilized ?? 0} / ${c.promoCodesTotal ?? 0}`
                      : `$${c.spent} / $${c.budget}`
                    }
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 overflow-hidden">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${Math.min(percent, 100)}%`,
                      animationDelay: `${(c.id.charCodeAt(0) || 0) * 150}ms`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredCampaigns.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No campaigns found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Try adjusting your search or filter criteria
          </p>
          <CreateCampaignDialog />
        </div>
      )}
    </div>
  );
}



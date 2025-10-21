"use client";
import React, { useState, useEffect, useRef } from "react";
import Badge from "../ui/badge/Badge";
import { Users, DollarSign, Calendar, MoreHorizontal, Plus, Download, RefreshCw } from "lucide-react";

// Define the TypeScript interface for campaign data
interface Campaign {
  id: number;
  title: string;
  description: string;
  status: "Active" | "Paused" | "Completed";
  responses: number;
  budget: number;
  budgetUsed: number;
  endDate: string;
}

// Campaign data matching the image
const campaignData: Campaign[] = [
  {
    id: 1,
    title: "Q4 Product Feedback Survey",
    description: "Gathering insights about our latest product features and user experience improvements.",
    status: "Active",
    responses: 156,
    budget: 1000,
    budgetUsed: 650,
    endDate: "Dec 30",
  },
  {
    id: 2,
    title: "Holiday Shopping Experience",
    description: "Understanding customer satisfaction during the holiday season shopping period.",
    status: "Active",
    responses: 89,
    budget: 750,
    budgetUsed: 320,
    endDate: "Jan 15",
  },
  {
    id: 3,
    title: "Mobile App Usability Test",
    description: "Collecting feedback on mobile app navigation and feature accessibility.",
    status: "Paused",
    responses: 45,
    budget: 500,
    budgetUsed: 180,
    endDate: "Jan 31",
  },
];

export default function RecentCampaigns() {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const handleMenuClick = (campaignId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenMenuId(openMenuId === campaignId ? null : campaignId);
  };

  const handleMenuAction = (action: string, campaignId: number) => {
    console.log(`${action} campaign ${campaignId}`);
    setOpenMenuId(null);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 pb-6 pt-6 dark:border-gray-700 dark:bg-gray-800">
      {/* Enhanced Header Section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Campaigns</h3>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Track your latest feedback campaigns and their performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl">
            <Plus className="w-4 h-4" />
            Create Campaign
          </button>
        </div>
      </div>

      {/* Campaign Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {campaignData.map((campaign) => (
          <div
            key={campaign.id}
            className="relative rounded-xl border border-gray-200 bg-white p-5 shadow-theme-sm hover:shadow-theme-md transition-all duration-300 dark:border-gray-800 dark:bg-white/[0.03] hover:scale-[1.02] group"
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
                    onClick={() => handleMenuAction('Edit', campaign.id)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Edit Campaign
                  </button>
                  <button
                    onClick={() => handleMenuAction('View Analytics', campaign.id)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    View Analytics
                  </button>
                  <button
                    onClick={() => handleMenuAction('Duplicate', campaign.id)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={() => handleMenuAction('Delete', campaign.id)}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    Delete
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

               {/* Budget */}
               <div className="text-center group/metric">
                 <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg mx-auto mb-2 dark:bg-gray-800 group-hover/metric:bg-purple-50 dark:group-hover/metric:bg-purple-500/20 transition-colors duration-200">
                   <DollarSign className="text-gray-600 w-5 h-5 dark:text-gray-400 group-hover/metric:text-purple-500 dark:group-hover/metric:text-purple-400 transition-colors duration-200" />
                 </div>
                 <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Budget</p>
                 <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                   {formatCurrency(campaign.budget)}
                 </p>
               </div>

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

            {/* Budget Progress */}
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
                    animationDelay: `${campaign.id * 150}ms`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

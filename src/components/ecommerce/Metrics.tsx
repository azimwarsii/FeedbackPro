"use client";
import React, { useMemo } from "react";
import { Users, BarChart3, TrendingUp } from "lucide-react";
import { useCustomerStore } from "@/store/useCustomerStore";
import { useCampaignStore } from "@/store/useCampaignStore";

export const EcommerceMetrics = () => {
  const customers = useCustomerStore((state) => state.customers);
  const campaigns = useCampaignStore((state) => state.campaigns);

  // Calculate metrics from store data
  const totalCustomers = customers.length;
  const totalCampaigns = campaigns.length;
  const totalResponses = useMemo(() => {
    return campaigns.reduce((sum, campaign) => {
      return sum + (campaign.responses || 0);
    }, 0);
  }, [campaigns]);

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {/* Total Customers */}
      <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:from-green-900/20 dark:to-emerald-900/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Customers</p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{totalCustomers.toLocaleString()}</p>
            <p className="mt-1 text-xs text-green-600 dark:text-green-400">All registered customers</p>
          </div>
          <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
            <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </div>

      {/* Total Campaigns */}
      <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:from-blue-900/20 dark:to-cyan-900/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Campaigns</p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{totalCampaigns.toLocaleString()}</p>
            <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">All your campaigns</p>
          </div>
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

      {/* Total Responses */}
      <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:from-purple-900/20 dark:to-pink-900/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Responses</p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{totalResponses.toLocaleString()}</p>
            <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">Across all campaigns</p>
          </div>
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
            <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>

    </div>
  );
};

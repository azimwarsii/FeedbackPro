"use client";
import React from "react";
import { Users, BarChart3, TrendingUp } from "lucide-react";

export const EcommerceMetrics = () => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {/* Active Customers */}
      <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:from-green-900/20 dark:to-emerald-900/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Customers</p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">3,247</p>
            <p className="mt-1 text-xs text-green-600 dark:text-green-400">+11.01% from last month</p>
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
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">5,359</p>
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">-9.05% from last month</p>
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
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">12,847</p>
            <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">+23.5% this month</p>
          </div>
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
            <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>

    </div>
  );
};

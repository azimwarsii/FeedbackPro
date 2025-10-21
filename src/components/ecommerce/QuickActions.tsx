"use client";
import React from "react";
import { Sparkles, FileText, Wallet, BarChart3, Download, RefreshCw } from "lucide-react";

export default function QuickActions() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Quick Actions</h3>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Get started with your feedback campaigns
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
        </div>
      </div>
      
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Create Campaign Button */}
        <button className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:from-purple-900/20 dark:to-pink-900/20 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Create Campaign</p>
              <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">New Campaign</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </button>

        {/* New Survey Button */}
        <button className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:from-blue-900/20 dark:to-cyan-900/20 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">New Survey</p>
              <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">Create Survey</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </button>

        {/* Add Funds Button */}
        <button className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:from-green-900/20 dark:to-emerald-900/20 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Add Funds</p>
              <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">Top Up Wallet</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <Wallet className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </button>

        {/* View Analytics Button */}
        <button className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:from-amber-900/20 dark:to-orange-900/20 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">View Analytics</p>
              <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">Dashboard</p>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
              <BarChart3 className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

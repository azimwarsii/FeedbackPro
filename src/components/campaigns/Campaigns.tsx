"use client";

import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";
import { ShootingStarIcon } from "@/icons";
import { CreateCampaignDialog } from "./CreateCampaignDialog";
import { MoreHorizontal, Edit, BarChart3, Copy, Trash2, Users, DollarSign, Calendar, Plus, Download, RefreshCw, Search, Filter, ChevronDown } from "lucide-react";

type Status = "Active" | "Paused" | "Completed" | "Draft";

type Campaign = {
  id: string;
  title: string;
  description: string;
  status: Status;
  responses: number;
  budget: number;
  spent: number;
  endDate: string;
};

const statusColors: Record<Status, string> = {
  Active: "bg-emerald-100 text-emerald-700",
  Paused: "bg-amber-100 text-amber-700",
  Completed: "bg-sky-100 text-sky-700",
  Draft: "bg-zinc-100 text-zinc-600",
};

const mockCampaigns: Campaign[] = [
  {
    id: "1",
    title: "Q4 Product Feedback Survey",
    description:
      "Gathering insights about our latest product features and user experience improvements.",
    status: "Active",
    responses: 156,
    budget: 1000,
    spent: 650,
    endDate: "Dec 30",
  },
  {
    id: "2",
    title: "Holiday Shopping Experience",
    description:
      "Understanding customer satisfaction during the holiday season shopping period.",
    status: "Active",
    responses: 89,
    budget: 750,
    spent: 320,
    endDate: "Jan 15",
  },
  {
    id: "3",
    title: "Mobile App Usability Test",
    description:
      "Collecting feedback on mobile app navigation and feature accessibility.",
    status: "Paused",
    responses: 45,
    budget: 500,
    spent: 180,
    endDate: "Jan 31",
  },
  {
    id: "4",
    title: "Brand Awareness Survey",
    description:
      "Research on brand recognition and market positioning.",
    status: "Completed",
    responses: 200,
    budget: 800,
    spent: 800,
    endDate: "Nov 15",
  },
  {
    id: "5",
    title: "Website Redesign Feedback",
    description:
      "Collecting user feedback on the new website design and functionality.",
    status: "Draft",
    responses: 0,
    budget: 600,
    spent: 0,
    endDate: "Feb 28",
  },
];

function ProgressBar({ value, max }: { value: number; max: number }) {
  const percent = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="mt-4 h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700">
      <div
        className="h-2 rounded-full bg-violet-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export default function Campaigns() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
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

  const handleMenuClick = (campaignId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenMenuId(openMenuId === campaignId ? null : campaignId);
  };

  const handleMenuAction = (action: string, campaignId: string) => {
    console.log(`${action} campaign ${campaignId}`);
    setOpenMenuId(null);
  };

  const filteredCampaigns = mockCampaigns.filter((campaign) => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All Status" || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCampaigns = mockCampaigns.length;
  const activeCampaigns = mockCampaigns.filter(c => c.status === "Active").length;
  const totalResponses = mockCampaigns.reduce((sum, c) => sum + c.responses, 0);
  const totalBudget = mockCampaigns.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = mockCampaigns.reduce((sum, c) => sum + c.spent, 0);

  return (
    <div className="space-y-6">
      {/* Enhanced Header Section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Campaigns</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your feedback campaigns and track their performance
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
              <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">+2 this month</p>
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
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">{Math.round((activeCampaigns/totalCampaigns)*100)}% active rate</p>
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
              <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">Avg {Math.round(totalResponses/totalCampaigns)} per campaign</p>
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
                <option value="Draft">Draft</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {filteredCampaigns.map((c) => {
          const percent = Math.round((c.spent / c.budget) * 100);
          return (
            <div 
              key={c.id} 
              className="relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300 dark:border-gray-700 dark:bg-gray-800 hover:scale-[1.02] group"
              onMouseEnter={() => setHoveredCard(c.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Menu Button */}
              <div className="absolute top-4 right-4" ref={menuRef}>
                <button 
                  onClick={(e) => handleMenuClick(c.id, e)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 opacity-0 group-hover:opacity-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                
                {/* Dropdown Menu */}
                {openMenuId === c.id && (
                  <div className="absolute right-0 top-8 z-50 w-48 rounded-lg border border-gray-200 bg-white py-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    <button
                      onClick={() => handleMenuAction('Edit', c.id)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Campaign
                    </button>
                    <button
                      onClick={() => handleMenuAction('View Analytics', c.id)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <BarChart3 className="w-4 h-4" />
                      View Analytics
                    </button>
                    <button
                      onClick={() => handleMenuAction('Duplicate', c.id)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Duplicate
                    </button>
                    <button
                      onClick={() => handleMenuAction('Delete', c.id)}
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
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg mx-auto mb-2 dark:bg-gray-800 group-hover/metric:bg-purple-50 dark:group-hover/metric:bg-purple-500/20 transition-colors duration-200">
                    <Users className="text-gray-600 w-5 h-5 dark:text-gray-400 group-hover/metric:text-purple-500 dark:group-hover/metric:text-purple-400 transition-colors duration-200" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Responses</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {c.responses}
                  </p>
                </div>

                {/* Budget */}
                <div className="text-center group/metric">
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg mx-auto mb-2 dark:bg-gray-800 group-hover/metric:bg-purple-50 dark:group-hover/metric:bg-purple-500/20 transition-colors duration-200">
                    <DollarSign className="text-gray-600 w-5 h-5 dark:text-gray-400 group-hover/metric:text-purple-500 dark:group-hover/metric:text-purple-400 transition-colors duration-200" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Budget</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    ${c.budget}
                  </p>
                </div>

                {/* End Date */}
                <div className="text-center group/metric">
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg mx-auto mb-2 dark:bg-gray-800 group-hover/metric:bg-purple-50 dark:group-hover/metric:bg-purple-500/20 transition-colors duration-200">
                    <Calendar className="text-gray-600 w-5 h-5 dark:text-gray-400 group-hover/metric:text-purple-500 dark:group-hover/metric:text-purple-400 transition-colors duration-200" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">End Date</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {c.endDate}
                  </p>
                </div>
              </div>

              {/* Budget Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Budget Used</span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    ${c.spent} / ${c.budget}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 overflow-hidden">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${percent}%`,
                      animationDelay: `${parseInt(c.id) * 150}ms`,
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
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl">
            <Plus className="w-4 h-4" />
            Create First Campaign
          </button>
        </div>
      )}
    </div>
  );
}



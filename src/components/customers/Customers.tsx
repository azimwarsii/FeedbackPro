"use client";

import React, { useState } from "react";
import { 
  Download, 
  Mail, 
  Search, 
  Filter, 
  Phone, 
  Mail as MailIcon, 
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Star,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  ChevronDown,
  Plus,
  RefreshCw
} from "lucide-react";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";

interface Customer {
  id: number;
  name: string;
  initials: string;
  email: string;
  phone: string;
  surveys: number;
  rewards: number;
  status: "Active" | "Inactive";
  joinDate: string;
  lastActivity: string;
  engagement: "High" | "Medium" | "Low";
  avatar?: string;
}

const mockCustomers: Customer[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    initials: "SJ",
    email: "sarah.johnson@email.com",
    phone: "+1 (555) 123-4567",
    surveys: 12,
    rewards: 150,
    status: "Active",
    joinDate: "Dec 10, 2024",
    lastActivity: "2 hours ago",
    engagement: "High",
  },
  {
    id: 2,
    name: "Michael Chen",
    initials: "MC",
    email: "michael.chen@email.com",
    phone: "+1 (555) 234-5678",
    surveys: 8,
    rewards: 89,
    status: "Active",
    joinDate: "Dec 8, 2024",
    lastActivity: "1 day ago",
    engagement: "Medium",
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    initials: "ER",
    email: "emily.rodriguez@email.com",
    phone: "+1 (555) 345-6789",
    surveys: 18,
    rewards: 245,
    status: "Inactive",
    joinDate: "Nov 25, 2024",
    lastActivity: "1 week ago",
    engagement: "Low",
  },
  {
    id: 4,
    name: "David Thompson",
    initials: "DT",
    email: "david.thompson@email.com",
    phone: "+1 (555) 456-7890",
    surveys: 5,
    rewards: 67,
    status: "Active",
    joinDate: "Dec 15, 2024",
    lastActivity: "3 hours ago",
    engagement: "High",
  },
  {
    id: 5,
    name: "Lisa Wang",
    initials: "LW",
    email: "lisa.wang@email.com",
    phone: "+1 (555) 567-8901",
    surveys: 15,
    rewards: 200,
    status: "Active",
    joinDate: "Dec 5, 2024",
    lastActivity: "5 hours ago",
    engagement: "High",
  },
  {
    id: 6,
    name: "James Wilson",
    initials: "JW",
    email: "james.wilson@email.com",
    phone: "+1 (555) 678-9012",
    surveys: 3,
    rewards: 45,
    status: "Inactive",
    joinDate: "Nov 30, 2024",
    lastActivity: "2 weeks ago",
    engagement: "Low",
  },
];

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [engagementFilter, setEngagementFilter] = useState("All Engagement");
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [showActions, setShowActions] = useState<number | null>(null);

  const filteredCustomers = mockCustomers.filter((customer) => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All Status" || customer.status === statusFilter;
    const matchesEngagement = engagementFilter === "All Engagement" || customer.engagement === engagementFilter;
    return matchesSearch && matchesStatus && matchesEngagement;
  });

  const totalCustomers = mockCustomers.length;
  const activeCustomers = mockCustomers.filter(c => c.status === "Active").length;
  const totalRewardsPaid = mockCustomers.reduce((sum, c) => sum + c.rewards, 0);
  const avgSurveysPerCustomer = Math.round(mockCustomers.reduce((sum, c) => sum + c.surveys, 0) / mockCustomers.length);
  const highEngagementCustomers = mockCustomers.filter(c => c.engagement === "High").length;

  const getEngagementColor = (engagement: string) => {
    switch (engagement) {
      case "High": return "text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400";
      case "Medium": return "text-amber-600 bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400";
      case "Low": return "text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400";
      default: return "text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getEngagementIcon = (engagement: string) => {
    switch (engagement) {
      case "High": return <Star className="w-3 h-3" />;
      case "Medium": return <TrendingUp className="w-3 h-3" />;
      case "Low": return <TrendingDown className="w-3 h-3" />;
      default: return null;
    }
  };

  const toggleCustomerSelection = (customerId: number) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map(c => c.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header Section */}
      {/* <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Customers</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your customer base and track engagement metrics
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
          <button onClick={() => window.location.href = '/campaign'} className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl">
            <Mail className="w-4 h-4" />
            Send Campaign
            </button>
        </div>
      </div> */}
      {/* Header Section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Customers</h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Manage your customer base and track engagement metrics
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-1 sm:flex-none">
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">Refresh</span>
            </button>
            <button className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-1 sm:flex-none">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
          <button 
            onClick={() => window.location.href = '/customers/create'}
            className="inline-flex items-center justify-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
          >
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">Send Campaign</span>
            <span className="sm:hidden">Send Campaign</span>
          </button>
        </div>
      </div>

      {/* Enhanced Summary Cards with Icons */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:from-blue-900/20 dark:to-cyan-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Customers</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{totalCustomers}</p>
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">+12% from last month</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:from-green-900/20 dark:to-emerald-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Customers</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{activeCustomers}</p>
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">{Math.round((activeCustomers/totalCustomers)*100)}% active rate</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:from-purple-900/20 dark:to-pink-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Rewards Paid</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">${totalRewardsPaid.toLocaleString()}</p>
              <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">Avg ${Math.round(totalRewardsPaid/totalCustomers)} per customer</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:from-amber-900/20 dark:to-orange-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">High Engagement</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{highEngagementCustomers}</p>
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">Avg {avgSurveysPerCustomer} surveys per customer</p>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
              <Star className="w-6 h-6 text-amber-600 dark:text-amber-400" />
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
              placeholder="Search customers by name or email..."
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
                <option value="Inactive">Inactive</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={engagementFilter}
                onChange={(e) => setEngagementFilter(e.target.value)}
                className="pl-4 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white appearance-none min-w-[160px]"
              >
                <option value="All Engagement">All Engagement</option>
                <option value="High">High Engagement</option>
                <option value="Medium">Medium Engagement</option>
                <option value="Low">Low Engagement</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {selectedCustomers.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedCustomers.length} selected
            </span>
            <Button variant="outline" size="sm">
              Bulk Actions
            </Button>
          </div>
        )}
      </div>

      {/* Enhanced Customer Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Engagement
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Surveys
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rewards
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.includes(customer.id)}
                      onChange={() => toggleCustomerSelection(customer.id)}
                      className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-4">
                        <span className="text-sm font-bold text-white">
                          {customer.initials}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {customer.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Joined {customer.joinDate}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-900 dark:text-white">
                        <MailIcon className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="truncate max-w-[200px]">{customer.email}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        {customer.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getEngagementColor(customer.engagement)}`}>
                      {getEngagementIcon(customer.engagement)}
                      {customer.engagement}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {customer.surveys}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                      ${customer.rewards}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      size="sm"
                      color={customer.status === "Active" ? "success" : "light"}
                    >
                      {customer.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {customer.lastActivity}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative">
                      <button
                        onClick={() => setShowActions(showActions === customer.id ? null : customer.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {showActions === customer.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                          <div className="py-1">
                            <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                              <Eye className="w-4 h-4 mr-3" />
                              View Details
                            </button>
                            <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                              <Edit className="w-4 h-4 mr-3" />
                              Edit Customer
                            </button>
                            <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                              <Mail className="w-4 h-4 mr-3" />
                              Send Message
                            </button>
                            <hr className="my-1 border-gray-200 dark:border-gray-700" />
                            <button className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                              <Trash2 className="w-4 h-4 mr-3" />
                              Delete Customer
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination or Load More */}
      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No customers found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Try adjusting your search or filter criteria
          </p>
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl">
            <Plus className="w-4 h-4" />
            Add First Customer
          </button>
        </div>
      )}
    </div>
  );
}

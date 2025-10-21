"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, 
  Download, 
  RefreshCw, 
  MoreHorizontal, 
  Edit, 
  BarChart3, 
  Copy, 
  Trash2, 
  Play,
  Pause,
  CheckCircle,
  Clock,
  FileText,
  Users,
  Calendar,
  Target,
  TrendingUp,
  Star,
} from "lucide-react";

type SurveyStatus = "Active" | "Paused" | "Completed" | "Draft";
type SurveyType = "Product Feedback" | "Customer Satisfaction" | "Market Research" | "User Experience" | "Brand Awareness";

interface Survey {
  id: string;
  title: string;
  status: SurveyStatus;
  questions: number;
  responses: number;
  type: SurveyType;
  createdDate: string;
  description: string;
  targetAudience: string;
  completionRate: number;
}

interface Template {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  questions: number;
  estimatedTime: string;
}

const mockSurveys: Survey[] = [
  {
    id: "1",
    title: "Q4 Product Feedback Survey",
    status: "Active",
    questions: 12,
    responses: 156,
    type: "Product Feedback",
    createdDate: "Dec 1, 2024",
    description: "Gathering insights about our latest product features and user experience improvements.",
    targetAudience: "Existing Customers",
    completionRate: 78.5
  },
  {
    id: "2",
    title: "Customer Satisfaction Index",
    status: "Active",
    questions: 8,
    responses: 89,
    type: "Customer Satisfaction",
    createdDate: "Nov 28, 2024",
    description: "Measuring overall customer satisfaction with our services and support.",
    targetAudience: "All Users",
    completionRate: 82.1
  },
  {
    id: "3",
    title: "Market Research Study 2024",
    status: "Completed",
    questions: 15,
    responses: 234,
    type: "Market Research",
    createdDate: "Nov 15, 2024",
    description: "Comprehensive market research to understand industry trends and opportunities.",
    targetAudience: "General Public",
    completionRate: 91.2
  },
  {
    id: "4",
    title: "Mobile App Usability Test",
    status: "Paused",
    questions: 10,
    responses: 45,
    type: "User Experience",
    createdDate: "Dec 5, 2024",
    description: "Testing mobile app navigation and feature accessibility.",
    targetAudience: "Mobile Users",
    completionRate: 65.3
  },
  {
    id: "5",
    title: "Brand Awareness Survey",
    status: "Draft",
    questions: 6,
    responses: 0,
    type: "Brand Awareness",
    createdDate: "Dec 10, 2024",
    description: "Research on brand recognition and market positioning.",
    targetAudience: "Potential Customers",
    completionRate: 0
  },
  {
    id: "6",
    title: "Website Redesign Feedback",
    status: "Active",
    questions: 9,
    responses: 78,
    type: "User Experience",
    createdDate: "Dec 8, 2024",
    description: "Collecting user feedback on the new website design and functionality.",
    targetAudience: "Website Visitors",
    completionRate: 73.8
  }
];

const quickStartTemplates: Template[] = [
  {
    id: "1",
    title: "Product Feedback",
    description: "Collect detailed feedback about your products and features",
    icon: <Target className="w-6 h-6" />,
    color: "purple",
    questions: 10,
    estimatedTime: "5-7 min"
  },
  {
    id: "2",
    title: "Customer Satisfaction",
    description: "Measure customer satisfaction and identify improvement areas",
    icon: <Star className="w-6 h-6" />,
    color: "blue",
    questions: 8,
    estimatedTime: "3-5 min"
  },
  {
    id: "3",
    title: "Market Research",
    description: "Gather market insights and understand customer preferences",
    icon: <TrendingUp className="w-6 h-6" />,
    color: "green",
    questions: 12,
    estimatedTime: "8-10 min"
  }
];

export default function Surveys() {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [typeFilter, setTypeFilter] = useState("All Types");
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

  const handleMenuClick = (surveyId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenMenuId(openMenuId === surveyId ? null : surveyId);
  };

  const handleMenuAction = (action: string, surveyId: string) => {
    console.log(`${action} survey ${surveyId}`);
    setOpenMenuId(null);
  };

  const filteredSurveys = mockSurveys.filter((survey) => {
    const matchesSearch = survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         survey.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All Status" || survey.status === statusFilter;
    const matchesType = typeFilter === "All Types" || survey.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: SurveyStatus) => {
    const baseClasses = "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full";
    
    switch (status) {
      case "Active":
        return (
          <span className={`${baseClasses} text-green-700 bg-green-100 dark:bg-green-900/20 dark:text-green-400`}>
            <Play className="w-3 h-3" />
            Active
          </span>
        );
      case "Paused":
        return (
          <span className={`${baseClasses} text-amber-700 bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400`}>
            <Pause className="w-3 h-3" />
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
      case "Draft":
        return (
          <span className={`${baseClasses} text-gray-700 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400`}>
            <FileText className="w-3 h-3" />
            Draft
          </span>
        );
      default:
        return null;
    }
  };

  const getTemplateColor = (color: string) => {
    switch (color) {
      case "purple":
        return "bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20";
      case "blue":
        return "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20";
      case "green":
        return "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20";
      default:
        return "bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20";
    }
  };

  const getTemplateIconColor = (color: string) => {
    switch (color) {
      case "purple":
        return "text-purple-600 dark:text-purple-400";
      case "blue":
        return "text-blue-600 dark:text-blue-400";
      case "green":
        return "text-green-600 dark:text-green-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getTemplateIconBg = (color: string) => {
    switch (color) {
      case "purple":
        return "bg-purple-100 dark:bg-purple-900/30";
      case "blue":
        return "bg-blue-100 dark:bg-blue-900/30";
      case "green":
        return "bg-green-100 dark:bg-green-900/30";
      default:
        return "bg-gray-100 dark:bg-gray-900/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Surveys</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Create, manage, and analyze your feedback surveys
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
            <button 
            onClick={() => window.location.href = '/surveys/create'}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-4 h-4" />
            Create Survey
          </button>
        </div>
      </div>

      {/* Quick Start Templates Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Start Templates</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Get started quickly with pre-built survey templates</p>
        </div>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickStartTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => window.location.href = '/surveys/create'}
              className={`group relative overflow-hidden rounded-xl border border-gray-200 ${getTemplateColor(template.color)} p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 hover:scale-105`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-3 rounded-xl ${getTemplateIconBg(template.color)}`}>
                      <div className={getTemplateIconColor(template.color)}>
                        {template.icon}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{template.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{template.questions} questions</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{template.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {template.estimatedTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {template.questions} questions
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center flex-1">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search surveys by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors"
            />
          </div>
          
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white appearance-none min-w-[140px]"
            >
              <option value="All Status">All Status</option>
              <option value="Active">Active</option>
              <option value="Paused">Paused</option>
              <option value="Completed">Completed</option>
              <option value="Draft">Draft</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white appearance-none min-w-[140px]"
            >
              <option value="All Types">All Types</option>
              <option value="Product Feedback">Product Feedback</option>
              <option value="Customer Satisfaction">Customer Satisfaction</option>
              <option value="Market Research">Market Research</option>
              <option value="User Experience">User Experience</option>
              <option value="Brand Awareness">Brand Awareness</option>
            </select>
          </div>
        </div>
      </div>

      {/* Survey Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {filteredSurveys.map((survey) => (
          <div 
            key={survey.id} 
            className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300 dark:border-gray-700 dark:bg-gray-800 hover:scale-[1.02]"
          >
            {/* Menu Button */}
            <div className="absolute top-4 right-4" ref={menuRef}>
              <button 
                onClick={(e) => handleMenuClick(survey.id, e)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 opacity-0 group-hover:opacity-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              
              {/* Dropdown Menu */}
              {openMenuId === survey.id && (
                <div className="absolute right-0 top-8 z-50 w-48 rounded-lg border border-gray-200 bg-white py-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  <button
                    onClick={() => handleMenuAction('Edit', survey.id)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Survey
                  </button>
                  <button
                    onClick={() => handleMenuAction('View Results', survey.id)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <BarChart3 className="w-4 h-4" />
                    View Results
                  </button>
                  <button
                    onClick={() => handleMenuAction('Duplicate', survey.id)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => handleMenuAction('Delete', survey.id)}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>

            {/* Survey Title and Status */}
            <div className="pr-8 mb-4">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{survey.title}</h3>
                {getStatusBadge(survey.status)}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{survey.description}</p>
            </div>

            {/* Survey Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg mx-auto mb-2 dark:bg-gray-800">
                  <FileText className="text-gray-600 w-5 h-5 dark:text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Questions</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{survey.questions}</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg mx-auto mb-2 dark:bg-gray-800">
                  <Users className="text-gray-600 w-5 h-5 dark:text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Responses</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{survey.responses}</p>
              </div>
            </div>

            {/* Survey Details */}
            <div className="space-y-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span>{survey.type}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{survey.targetAudience}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Created {survey.createdDate}</span>
              </div>
            </div>

            {/* Completion Rate */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">Completion Rate</span>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{survey.completionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${survey.completionRate}%` }}
                ></div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-purple-700 rounded-lg hover:from-purple-600 hover:to-purple-800 transition-all duration-200">
                <BarChart3 className="w-4 h-4" />
                View Results
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredSurveys.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No surveys found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Try adjusting your search or filter criteria
          </p>
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl">
            <Plus className="w-4 h-4" />
            Create First Survey
          </button>
        </div>
      )}
    </div>
  );
}

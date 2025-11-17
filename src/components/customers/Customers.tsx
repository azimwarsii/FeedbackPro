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
  RefreshCw,
  Upload,
  File,
  X,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import * as XLSX from "xlsx";
import { useSession } from "next-auth/react";
import { useCustomerStore, Customer as StoreCustomer } from "@/store/useCustomerStore";
import { useResponseStore } from "@/store/useResponseStore";

interface Customer {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  surveys: number;
  rewards: number;
  joinDate: string;
  lastActivity: string;
  engagement: "High" | "Medium" | "Low";
  avatar?: string;
}

// Helper function to get initials from name
const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Helper function to format date
const formatDate = (dateString?: string): string => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "N/A";
  }
};

// Helper function to calculate time ago
const getTimeAgo = (dateString?: string): string => {
  if (!dateString) return "Never";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks !== 1 ? "s" : ""} ago`;
    return formatDate(dateString);
  } catch {
    return "Never";
  }
};

// Helper function to determine engagement level
const getEngagementLevel = (surveys: number): "High" | "Medium" | "Low" => {
  if (surveys >= 10) return "High";
  if (surveys >= 5) return "Medium";
  return "Low";
};

// Transform store customer to component customer
const transformCustomer = (storeCustomer: StoreCustomer): Customer => {
  const surveys = storeCustomer.responses?.length || storeCustomer.invitations?.length || 0;
  const rewards = storeCustomer.reward_received || 0;
  const lastActivityDate = storeCustomer.responses?.[storeCustomer.responses.length - 1]?.createdAt || 
                          storeCustomer.invitations?.[storeCustomer.invitations.length - 1]?.createdAt ||
                          storeCustomer.updatedAt ||
                          storeCustomer.createdAt;

  return {
    id: storeCustomer._id || storeCustomer.id || "",
    name: storeCustomer.name,
    initials: getInitials(storeCustomer.name),
    email: storeCustomer.email,
    phone: storeCustomer.phone,
    surveys,
    rewards,
    joinDate: formatDate(storeCustomer.createdAt),
    lastActivity: getTimeAgo(lastActivityDate),
    engagement: getEngagementLevel(surveys),
  };
};

export default function Customers() {
  const { data: session } = useSession();
  const storeCustomers = useCustomerStore((state) => state.customers);
  const addCustomers = useCustomerStore((state) => state.addCustomers);
  const removeCustomer = useCustomerStore((state) => state.removeCustomer);
  const updateCustomer = useCustomerStore((state) => state.updateCustomer);
  const responses = useResponseStore((state) => state.responses);
  const [searchTerm, setSearchTerm] = useState("");
  const [engagementFilter, setEngagementFilter] = useState("All Engagement");
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [showActions, setShowActions] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<Record<string, { top: number; left: number; position: "above" | "below" }>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editFormData, setEditFormData] = useState({ name: "", email: "", phone: "" });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedContacts, setParsedContacts] = useState<Array<{ name: string; phone: string; email: string; row: number; isValid: boolean; errors: string[] }>>([]);

  // Transform store customers to component format
  const customers = storeCustomers.map(transformCustomer);

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEngagement = engagementFilter === "All Engagement" || customer.engagement === engagementFilter;
    return matchesSearch && matchesEngagement;
  });

  const totalCustomers = customers.length;
  // Calculate total rewards paid from responses where reward_status === "paid"
  const totalRewardsPaid = responses
    .filter((r) => r.reward_status === "paid" && r.reward_amount && r.reward_amount > 0)
    .reduce((sum, r) => sum + (r.reward_amount || 0), 0);
  const avgSurveysPerCustomer = customers.length > 0 
    ? Math.round(customers.reduce((sum, c) => sum + c.surveys, 0) / customers.length)
    : 0;
  const highEngagementCustomers = customers.filter(c => c.engagement === "High").length;

  // Calculate customers created this month
  const customersThisMonth = storeCustomers.filter((customer) => {
    if (!customer.createdAt) return false;
    try {
      const createdDate = new Date(customer.createdAt);
      const now = new Date();
      return createdDate.getMonth() === now.getMonth() && 
             createdDate.getFullYear() === now.getFullYear();
    } catch {
      return false;
    }
  }).length;

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

  const toggleCustomerSelection = (customerId: string) => {
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (jsonData.length === 0) {
          alert("Excel file is empty");
          return;
        }
        
        const headers = (jsonData[0] as any[]).map((h: any) => String(h || '').trim().toLowerCase());
        const nameIndex = headers.findIndex(h => h === 'name');
        const phoneIndex = headers.findIndex(h => h === 'phone');
        const emailIndex = headers.findIndex(h => h === 'email');
        
        if (nameIndex === -1 || phoneIndex === -1 || emailIndex === -1) {
          alert("Excel file must contain 'name', 'phone', and 'email' columns");
          return;
        }
        
        // Create sets of existing emails and phones for quick lookup
        // Note: storeCustomers is already filtered by current user (via CustomerStoreInitializer)
        // So duplicates are checked only within the current user's customers, not across different users
        const existingEmails = new Set(storeCustomers.map(c => c.email.toLowerCase().trim()));
        const existingPhones = new Set(storeCustomers.map(c => c.phone.trim()));
        
        // Track duplicates within the file itself
        const fileEmails = new Map<string, number>();
        const filePhones = new Map<string, number>();
        
        const contacts = jsonData.slice(1).map((row: any[], index: number) => {
          const name = String(row[nameIndex] || '').trim();
          const phone = String(row[phoneIndex] || '').trim();
          const email = String(row[emailIndex] || '').trim();
          
          const errors: string[] = [];
          if (!name) errors.push("Name is required");
          if (!phone) errors.push("Phone is required");
          if (!email) errors.push("Email is required");
          
          // Check for duplicates in existing customers
          if (email && existingEmails.has(email.toLowerCase().trim())) {
            errors.push("Email already exists");
          }
          if (phone && existingPhones.has(phone.trim())) {
            errors.push("Phone already exists");
          }
          
          // Track duplicates within the file
          if (email) {
            const emailKey = email.toLowerCase().trim();
            fileEmails.set(emailKey, (fileEmails.get(emailKey) || 0) + 1);
          }
          if (phone) {
            filePhones.set(phone.trim(), (filePhones.get(phone.trim()) || 0) + 1);
          }
          
          return {
            name,
            phone,
            email,
            row: index + 2,
            isValid: errors.length === 0,
            errors
          };
        });
        
        // Check for duplicates within the file and add errors
        const contactsWithDuplicateErrors = contacts.map(contact => {
          const errors = [...contact.errors];
          const emailKey = contact.email.toLowerCase().trim();
          const phoneKey = contact.phone.trim();
          
          if (contact.email && fileEmails.get(emailKey)! > 1) {
            if (!errors.includes("Email already exists")) {
              errors.push("Duplicate email in file");
            }
          }
          if (contact.phone && filePhones.get(phoneKey)! > 1) {
            if (!errors.includes("Phone already exists")) {
              errors.push("Duplicate phone in file");
            }
          }
          
          return {
            ...contact,
            errors,
            isValid: errors.length === 0
          };
        });
        
        setParsedContacts(contactsWithDuplicateErrors);
        setUploadedFile(file);
      } else {
        alert("Unsupported file format. Please upload XLS or XLSX file.");
      }
    } catch (error) {
      console.error("Error parsing file:", error);
      alert("Error parsing file. Please make sure the file format is correct.");
    }
  };

  const handleSave = async () => {
    // Check if file is uploaded
    if (parsedContacts.length === 0) {
      alert("Please upload a file with customer data.");
      return;
    }

    // Check for duplicate errors
    const hasDuplicateErrors = parsedContacts.some(c => 
      c.errors.some(error => 
        error.includes("already exists") || error.includes("Duplicate")
      )
    );

    if (hasDuplicateErrors) {
      alert("Please fix duplicate email or phone number errors before saving. Contacts with duplicates are highlighted in red.");
      return;
    }

    const validContacts = parsedContacts.filter(c => c.isValid);
    if (validContacts.length === 0) {
      alert("Please ensure at least one valid contact in the uploaded file.");
      return;
    }

    const safeUser = session?.user as any;
    const userId = safeUser?.id as string | undefined;

    if (!userId) {
      alert("You must be logged in to add customers.");
      return;
    }

    // Prepare customers array for API
    const customersArray = validContacts.map(contact => ({
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
    }));

    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || "http://localhost:5000";

    try {
      const response = await fetch(
        `${baseUrl.replace(/\/+$/, "")}/customers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userId,
            customers: customersArray,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const createdCustomers = data?.customers || [];
        
        // Add customers to the store
        if (Array.isArray(createdCustomers) && createdCustomers.length > 0) {
          addCustomers(createdCustomers);
        }
        
        alert(`${data.count || validContacts.length} customer(s) saved successfully!`);
        setParsedContacts([]);
        setUploadedFile(null);
        setIsAddModalOpen(false);
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        alert(`Failed to save customers: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error saving customers:", error);
      alert("An error occurred while saving customers. Please try again.");
    }
  };

  const canSave = () => {
    if (parsedContacts.length === 0) return false;
    
    // Check if there are any duplicate errors
    const hasDuplicateErrors = parsedContacts.some(c => 
      c.errors.some(error => 
        error.includes("already exists") || error.includes("Duplicate")
      )
    );
    
    if (hasDuplicateErrors) return false;
    
    // Check if there are valid contacts
    const hasValidFileContacts = parsedContacts.some(c => c.isValid);
    return hasValidFileContacts;
  };

  const handleEditCustomerClick = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    });
    setIsEditModalOpen(true);
    setShowActions(null); // Close the dropdown
  };

  const handleEditCustomer = async () => {
    if (!editingCustomer) return;

    const safeUser = session?.user as any;
    const userId = safeUser?.id as string | undefined;

    if (!userId) {
      alert("You must be logged in to edit customers.");
      return;
    }

    // Validate form data
    if (!editFormData.name.trim() || !editFormData.email.trim() || !editFormData.phone.trim()) {
      alert("Please fill in all fields.");
      return;
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || "http://localhost:5000";

    try {
      const response = await fetch(
        `${baseUrl.replace(/\/+$/, "")}/customers/${editingCustomer.id}?userId=${encodeURIComponent(userId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editFormData.name.trim(),
            email: editFormData.email.trim(),
            phone: editFormData.phone.trim(),
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const updatedCustomer = data?.customer;
        
        // Update customer in the store
        if (updatedCustomer) {
          updateCustomer(editingCustomer.id, {
            name: updatedCustomer.name,
            email: updatedCustomer.email,
            phone: updatedCustomer.phone,
          });
        }
        
        setIsEditModalOpen(false);
        setEditingCustomer(null);
        setEditFormData({ name: "", email: "", phone: "" });
        alert("Customer updated successfully!");
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        alert(`Failed to update customer: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error updating customer:", error);
      alert("An error occurred while updating the customer. Please try again.");
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!customerId) {
      alert("Customer ID is required");
      return;
    }

    const safeUser = session?.user as any;
    const userId = safeUser?.id as string | undefined;

    if (!userId) {
      alert("You must be logged in to delete customers.");
      return;
    }

    // Confirm deletion
    if (!confirm("Are you sure you want to delete this customer? This action cannot be undone.")) {
      return;
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || "http://localhost:5000";

    try {
      const response = await fetch(
        `${baseUrl.replace(/\/+$/, "")}/customers/${customerId}?userId=${encodeURIComponent(userId)}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        // Remove customer from store
        removeCustomer(customerId);
        // Close the dropdown
        setShowActions(null);
        alert("Customer deleted successfully!");
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        alert(`Failed to delete customer: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting customer:", error);
      alert("An error occurred while deleting the customer. Please try again.");
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
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Customer</span>
            <span className="sm:hidden">Add Customer</span>
          </button>
        </div>
      </div>

      {/* Enhanced Summary Cards with Icons */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:from-blue-900/20 dark:to-cyan-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Customers</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{totalCustomers}</p>
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                +{customersThisMonth} {customersThisMonth === 1 ? 'user' : 'users'} this month
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {customer.lastActivity}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          const button = e.currentTarget;
                          const rect = button.getBoundingClientRect();
                          const viewportHeight = window.innerHeight;
                          const viewportWidth = window.innerWidth;
                          const spaceBelow = viewportHeight - rect.bottom;
                          const spaceAbove = rect.top;
                          const dropdownHeight = 180; // Approximate height of dropdown
                          const dropdownWidth = 192; // 48 * 4 (w-48 = 12rem = 192px)
                          
                          // Calculate horizontal position (right-aligned with button)
                          let left = rect.right - dropdownWidth;
                          // Ensure dropdown doesn't go off-screen on the left
                          if (left < 8) {
                            left = 8;
                          }
                          // Ensure dropdown doesn't go off-screen on the right
                          if (left + dropdownWidth > viewportWidth - 8) {
                            left = viewportWidth - dropdownWidth - 8;
                          }
                          
                          // Determine vertical position
                          let top: number;
                          let position: "above" | "below";
                          
                          if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
                            // Show above
                            top = rect.top - dropdownHeight - 8;
                            position = "above";
                          } else {
                            // Show below
                            top = rect.bottom + 8;
                            position = "below";
                          }
                          
                          // Ensure dropdown doesn't go off-screen at top
                          if (top < 8) {
                            top = 8;
                          }
                          // Ensure dropdown doesn't go off-screen at bottom
                          if (top + dropdownHeight > viewportHeight - 8) {
                            top = viewportHeight - dropdownHeight - 8;
                          }
                          
                          setDropdownPosition({ 
                            ...dropdownPosition, 
                            [customer.id]: { top, left, position } 
                          });
                          setShowActions(showActions === customer.id ? null : customer.id);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Dropdown Menu - Rendered outside table container */}
      {showActions && dropdownPosition[showActions] && (
        <>
          {/* Backdrop to close dropdown */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowActions(null)}
          />
          {/* Dropdown Menu */}
          <div 
            className="fixed w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
            style={{
              top: `${dropdownPosition[showActions].top}px`,
              left: `${dropdownPosition[showActions].left}px`,
            }}
          >
            <div className="py-1">
              <button 
                onClick={() => {
                  const customer = customers.find(c => c.id === showActions);
                  if (customer) {
                    // View Responses - placeholder for now
                  }
                  setShowActions(null);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Eye className="w-4 h-4 mr-3" />
                View Responses
              </button>
              <button 
                onClick={() => {
                  const customer = customers.find(c => c.id === showActions);
                  if (customer) {
                    handleEditCustomerClick(customer);
                  }
                  setShowActions(null);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Edit className="w-4 h-4 mr-3" />
                Edit Customer
              </button>
              <hr className="my-1 border-gray-200 dark:border-gray-700" />
              <button 
                onClick={() => {
                  if (showActions) {
                    handleDeleteCustomer(showActions);
                  }
                  setShowActions(null);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4 mr-3" />
                Delete Customer
              </button>
            </div>
          </div>
        </>
      )}

      {/* Pagination or Load More */}
      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No customers found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Try adjusting your search or filter criteria
          </p>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-4 h-4" />
            Add First Customer
          </button>
        </div>
      )}

      {/* Add Customer Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => {
        setIsAddModalOpen(false);
        setUploadedFile(null);
        setParsedContacts([]);
      }} className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-left">Add Customer</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Upload an Excel file with customer data</p>
          </div>

          <div className="space-y-6">
            {/* File Upload Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-left">Upload Excel File</h3>
              <div className="space-y-4">
                <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                  uploadedFile 
                    ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20" 
                    : "border-gray-300 hover:border-purple-400 hover:bg-purple-50 dark:border-gray-600 dark:hover:border-purple-500 dark:hover:bg-purple-900/10"
                }`}>
                  <div className={`w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full transition-colors ${
                    uploadedFile 
                      ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" 
                      : "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                  }`}>
                    {uploadedFile ? (
                      <CheckCircle className="w-8 h-8" />
                    ) : (
                      <Upload className="w-8 h-8" />
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className={`text-lg font-semibold ${
                        uploadedFile 
                          ? "text-green-900 dark:text-green-100" 
                          : "text-gray-900 dark:text-white"
                      }`}>
                        {uploadedFile ? "File Uploaded Successfully!" : "Upload Excel File"}
                      </p>
                      <p className={`text-sm ${
                        uploadedFile 
                          ? "text-green-700 dark:text-green-300" 
                          : "text-gray-600 dark:text-gray-400"
                      }`}>
                        {uploadedFile 
                          ? "Your file is ready to process" 
                          : "Upload an XLS or XLSX file with customer data"
                        }
                      </p>
                    </div>
                    
                    {uploadedFile ? (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                              <File className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{uploadedFile.name}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {(uploadedFile.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setUploadedFile(null);
                              setParsedContacts([]);
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <input
                          type="file"
                          id="file-upload"
                          accept=".xlsx,.xls"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <label
                          htmlFor="file-upload"
                          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
                        >
                          <Upload className="w-4 h-4" />
                          Choose File
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Supported formats: XLSX, XLS (Must include name, phone, and email columns)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Preview Table */}
                {parsedContacts.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white text-left">
                        Preview ({parsedContacts.length} contacts)
                      </h4>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-green-600 dark:text-green-400">
                          Valid: {parsedContacts.filter(c => c.isValid).length}
                        </span>
                        <span className="text-red-600 dark:text-red-400">
                          Invalid: {parsedContacts.filter(c => !c.isValid).length}
                        </span>
                      </div>
                    </div>

                    {parsedContacts.filter(c => !c.isValid).length > 0 && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                          <AlertCircle className="w-5 h-5" />
                          <p className="font-medium">
                            Some contacts have errors (missing fields, duplicate emails, or duplicate phone numbers). Please fix these issues before saving.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                      <table className="w-full border-collapse">
                        <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="border border-gray-200 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">Row</th>
                            <th className="border border-gray-200 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">Name</th>
                            <th className="border border-gray-200 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">Phone</th>
                            <th className="border border-gray-200 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">Email</th>
                            <th className="border border-gray-200 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedContacts.map((contact, index) => (
                            <tr 
                              key={index} 
                              className={contact.isValid 
                                ? "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700" 
                                : "bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30"
                              }
                            >
                              <td className="border border-gray-200 dark:border-gray-600 px-4 py-2 text-sm text-gray-900 dark:text-white">
                                {contact.row}
                              </td>
                              <td className={`border border-gray-200 dark:border-gray-600 px-4 py-2 text-sm ${
                                contact.name 
                                  ? "text-gray-900 dark:text-white" 
                                  : "text-red-600 dark:text-red-400 font-medium"
                              }`}>
                                {contact.name || "Missing"}
                              </td>
                              <td className={`border border-gray-200 dark:border-gray-600 px-4 py-2 text-sm ${
                                contact.phone 
                                  ? "text-gray-900 dark:text-white" 
                                  : "text-red-600 dark:text-red-400 font-medium"
                              }`}>
                                {contact.phone || "Missing"}
                              </td>
                              <td className={`border border-gray-200 dark:border-gray-600 px-4 py-2 text-sm ${
                                contact.email 
                                  ? "text-gray-900 dark:text-white" 
                                  : "text-red-600 dark:text-red-400 font-medium"
                              }`}>
                                {contact.email || "Missing"}
                              </td>
                              <td className="border border-gray-200 dark:border-gray-600 px-4 py-2 text-sm">
                                {contact.isValid ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                    <CheckCircle className="w-3 h-3" />
                                    Valid
                                  </span>
                                ) : (
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                      <AlertCircle className="w-3 h-3" />
                                      Invalid
                                    </span>
                                    <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                                      {contact.errors.join(", ")}
                                    </div>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setUploadedFile(null);
                  setParsedContacts([]);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!canSave()}
                className="bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingCustomer(null);
          setEditFormData({ name: "", email: "", phone: "" });
        }} 
        className="max-w-2xl"
      >
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-left">Edit Customer</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Update customer information</p>
          </div>

          <div className="space-y-6">
            {/* Name Field */}
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <input
                id="edit-name"
                type="text"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors"
                placeholder="Enter customer name"
              />
            </div>

            {/* Email Field */}
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <input
                id="edit-email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors"
                placeholder="Enter customer email"
              />
            </div>

            {/* Phone Field */}
            <div>
              <Label htmlFor="edit-phone">Phone</Label>
              <input
                id="edit-phone"
                type="tel"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors"
                placeholder="Enter customer phone"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingCustomer(null);
                  setEditFormData({ name: "", email: "", phone: "" });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditCustomer}
                className="bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800"
              >
                Update Customer
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

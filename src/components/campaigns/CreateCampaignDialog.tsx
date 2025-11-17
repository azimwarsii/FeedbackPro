"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import InputField from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Plus, Copy, Trash2, DollarSign, Users, FileText, MessageSquare, Mail, ArrowUp, ArrowDown, User, Search, File, CheckCircle, Gift, Upload, Sparkles, Filter, X, Eye, EyeOff, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { useSurveysStore } from "@/store/useSurveysStore";
import { useCampaignStore } from "@/store/useCampaignStore";
import { useCustomerStore } from "@/store/useCustomerStore";
import { useSession } from "next-auth/react";
import * as XLSX from "xlsx";

interface LogicRule {
  id: string;
  condition: "equals" | "not_equals" | "contains" | "greater_than" | "less_than";
  value: string;
  action: "show" | "hide" | "skip_to";
  targetQuestionId?: string;
}

interface SurveyQuestion {
  id: string;
  type: "text" | "multiple-choice" | "rating" | "yes-no";
  title: string;
  description: string;
  required: boolean;
  options?: string[];
  logicRules: LogicRule[];
}

interface Survey {
  id: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
  settings: {
    allowAnonymous: boolean;
    showProgressBar: boolean;
    randomizeQuestions: boolean;
    thankYouMessage: string;
  };
}

interface CustomerDisplay {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export function CreateCampaignDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState("details");
  const surveys = useSurveysStore((state) => state.surveys);
  const addCampaign = useCampaignStore((state) => state.addCampaign);
  const storeCustomers = useCustomerStore((state) => state.customers);
  const { data: session } = useSession();
  const userId = (session as any)?.user?.id;
  const [campaignData, setCampaignData] = useState({
    name: "",
    description: "",
    smsTemplate: "",
    surveyLink: "",
    selectedSurveyId: "",
    contactMethod: "upload" as "upload" | "previous",
    contacts: null as File | null,
    selectedCustomers: [] as string[],
    rewardType: "",
    rewardValue: "",
    promoDescription: "",
    budget: ""
  });

  // Transform store customers to display format
  const existingCustomers: CustomerDisplay[] = storeCustomers.map(customer => ({
    id: customer._id || customer.id || "",
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
  }));

  const [customerSearch, setCustomerSearch] = useState("");
  const [parsedContacts, setParsedContacts] = useState<Array<{ name: string; phone: string; email: string; row: number; isValid: boolean; errors: string[] }>>([]);

  const filteredCustomers = existingCustomers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                         customer.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
                         customer.phone.toLowerCase().includes(customerSearch.toLowerCase());
    return matchesSearch;
  });

  const handleCustomerToggle = (customerId: string) => {
    setCampaignData(prev => ({
      ...prev,
      selectedCustomers: prev.selectedCustomers.includes(customerId)
        ? prev.selectedCustomers.filter(id => id !== customerId)
        : [...prev.selectedCustomers, customerId]
    }));
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredCustomers.map(c => c.id);
    const allSelected = allFilteredIds.every(id => campaignData.selectedCustomers.includes(id));
    
    setCampaignData(prev => ({
      ...prev,
      selectedCustomers: allSelected
        ? prev.selectedCustomers.filter(id => !allFilteredIds.includes(id))
        : [...new Set([...prev.selectedCustomers, ...allFilteredIds])]
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'csv') {
        // Handle CSV
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const nameIndex = headers.findIndex(h => h === 'name');
        const phoneIndex = headers.findIndex(h => h === 'phone');
        const emailIndex = headers.findIndex(h => h === 'email');
        
        if (nameIndex === -1 || phoneIndex === -1 || emailIndex === -1) {
          alert("CSV file must contain 'name', 'phone', and 'email' columns");
          return;
        }
        
        // Create sets of existing emails and phones for quick lookup
        // Note: storeCustomers is already filtered by current user, so duplicates are checked only within the current user's customers
        const existingEmails = new Set(storeCustomers.map(c => c.email.toLowerCase().trim()));
        const existingPhones = new Set(storeCustomers.map(c => c.phone.trim()));
        
        // Track duplicates within the file itself
        const fileEmails = new Map<string, number>();
        const filePhones = new Map<string, number>();
        
        const contacts = lines.slice(1).map((line, index) => {
          const values = line.split(',').map(v => v.trim());
          const name = values[nameIndex] || '';
          const phone = values[phoneIndex] || '';
          const email = values[emailIndex] || '';
          
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
            row: index + 2, // +2 because index starts at 0 and we skip header
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
        setCampaignData(prev => ({ ...prev, contacts: file }));
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Handle Excel
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
        // Note: storeCustomers is already filtered by current user, so duplicates are checked only within the current user's customers
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
            row: index + 2, // +2 because index starts at 0 and we skip header
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
        setCampaignData(prev => ({ ...prev, contacts: file }));
      } else {
        alert("Unsupported file format. Please upload CSV, XLS, or XLSX file.");
      }
    } catch (error) {
      console.error("Error parsing file:", error);
      alert("Error parsing file. Please make sure the file format is correct.");
    }
  };

  const handleCreateCampaign = async () => {
    try {
      if (!userId) {
        alert("User not authenticated. Please sign in again.");
        return;
      }

      if (!campaignData.name) {
        alert("Campaign name is required");
        return;
      }

      // Prepare contacts array (full JSON objects)
      let contacts: Array<{ name: string; phone: string; email: string; filled?: false }> = [];
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || "http://localhost:5000";
      
      if (campaignData.contactMethod === "upload") {
        // Check for duplicate errors
        const hasDuplicateErrors = parsedContacts.some(c => 
          c.errors.some(error => 
            error.includes("already exists") || error.includes("Duplicate")
          )
        );

        if (hasDuplicateErrors) {
          alert("Please fix duplicate email or phone number errors before creating the campaign. Contacts with duplicates are highlighted in red.");
          return;
        }

        // Use valid parsed contacts
        contacts = parsedContacts
          .filter(c => c.isValid)
          .map(c => ({
            name: c.name,
            phone: c.phone,
            email: c.email
          }));
        
        if (contacts.length === 0) {
          alert("Please upload a file with valid contacts (all contacts must have name, phone, and email)");
          return;
        }
      } else {
        // Use selected customers from existing customers
        const selectedCustomersData = existingCustomers.filter(c => 
          campaignData.selectedCustomers.includes(c.id)
        );
        
        contacts = selectedCustomersData.map(c => ({
          name: c.name,
          phone: c.phone,
          email: c.email
        }));
        
        if (contacts.length === 0) {
          alert("Please select at least one customer");
          return;
        }
      }

      // Prepare reward object
      let reward: any = undefined;
      if (campaignData.rewardType) {
        if (campaignData.rewardType === "cash") {
          const amount = parseFloat(campaignData.rewardValue);
          if (!amount || amount <= 0) {
            alert("Cash reward amount must be greater than 0");
            return;
          }
          reward = {
            type: "cash reward",
            amount: amount
          };
        } else if (campaignData.rewardType === "promo") {
          if (!campaignData.rewardValue) {
            alert("Promo code is required");
            return;
          }
          if (!campaignData.promoDescription) {
            alert("Promo description is required");
            return;
          }
          reward = {
            type: "promo code",
            code: campaignData.rewardValue,
            description: campaignData.promoDescription
          };
        }
      }

      // Prepare request body with contacts (full JSON objects)
      const requestBody = {
        userId: userId,
        name: campaignData.name,
        description: campaignData.description || "",
        message_template: campaignData.smsTemplate || "",
        contacts: contacts, // Send full contact objects
        reward: reward,
        surveyId: campaignData.selectedSurveyId || undefined
      };

      const endpoint = `${baseUrl.replace(/\/+$/, "")}/campaigns`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("Failed to create campaign", errorData);
        alert(`Failed to create campaign: ${errorData.error || response.statusText}`);
        return;
      }

      const data = await response.json();
      console.log("Campaign created successfully", data);
      
      // Add campaign to store
      const createdCampaign = data?.campaign || data;
      if (createdCampaign) {
        addCampaign({
          _id: createdCampaign._id || createdCampaign.id,
          name: createdCampaign.name,
          description: createdCampaign.description || "",
          message_template: createdCampaign.message_template || "",
          contacts: createdCampaign.contacts || contacts, // Store contacts (full JSON objects)
          reward: createdCampaign.reward,
          survey: createdCampaign.survey,
          user: createdCampaign.user || userId,
          createdAt: createdCampaign.createdAt,
          updatedAt: createdCampaign.updatedAt,
          responses: 0,
          status: "active"
        });
      }
      
      alert("Campaign created successfully!");
      
      // Reset form
      setIsOpen(false);
      setCampaignData({
        name: "",
        description: "",
        smsTemplate: "",
        surveyLink: "",
        selectedSurveyId: "",
        contactMethod: "upload",
        contacts: null,
        selectedCustomers: [],
        rewardType: "",
        rewardValue: "",
        promoDescription: "",
        budget: ""
      });
      setParsedContacts([]);
      setCurrentStep("details");
    } catch (error) {
      console.error("Error creating campaign:", error);
      alert("An error occurred while creating the campaign. Please try again.");
    }
  };


  const isStepComplete = (step: string) => {
    switch (step) {
      case "details":
        return campaignData.name && campaignData.description;
      case "survey":
        return !!campaignData.selectedSurveyId;
      case "sms":
        return campaignData.smsTemplate;
      case "contacts":
        if (campaignData.contactMethod === "upload") {
          // Check for duplicate errors
          const hasDuplicateErrors = parsedContacts.some(c => 
            c.errors.some(error => 
              error.includes("already exists") || error.includes("Duplicate")
            )
          );
          if (hasDuplicateErrors) return false;
          return campaignData.contacts !== null && parsedContacts.length > 0 && parsedContacts.every(c => c.isValid);
        }
        return campaignData.selectedCustomers.length > 0;
      case "rewards":
        if (!campaignData.rewardType) return false;
        if (campaignData.rewardType === "cash") {
          const amount = parseFloat(campaignData.rewardValue);
          return amount > 0;
        } else if (campaignData.rewardType === "promo") {
          return campaignData.rewardValue && campaignData.promoDescription;
        }
        return false;
      default:
        return false;
    }
  };

  const canProceedToNext = () => {
    return isStepComplete(currentStep);
  };

  const getNextStep = () => {
    const steps = ["details", "survey", "sms", "contacts", "rewards"];
    const currentIndex = steps.indexOf(currentStep);
    return steps[currentIndex + 1] || "review";
  };

  const getPreviousStep = () => {
    const steps = ["details", "survey", "sms", "contacts", "rewards"];
    const currentIndex = steps.indexOf(currentStep);
    return steps[currentIndex - 1] || "details";
  };

  // Calculate price based on contacts and rewards
  const calculatePrice = () => {
    const numberOfRecipients = campaignData.contactMethod === "upload" 
      ? parsedContacts.filter(c => c.isValid).length // Use valid parsed contacts
      : campaignData.selectedCustomers.length;
    
    const rewardPerPerson = campaignData.rewardType === "cash" 
      ? parseFloat(campaignData.rewardValue) || 0 
      : 0; // Promo codes don't have direct cost
    
    const smsCostPerMessage = 0.02; // Average SMS cost
    
    const totalRewardCost = numberOfRecipients * rewardPerPerson;
    const totalSmsCost = numberOfRecipients * smsCostPerMessage;
    const totalCost = totalRewardCost + totalSmsCost;
    
    return {
      numberOfRecipients,
      rewardPerPerson,
      smsCostPerMessage,
      totalRewardCost,
      totalSmsCost,
      totalCost
    };
  };

  const priceBreakdown = calculatePrice();

  const steps = [
    { id: "details", label: "Details", icon: FileText },
    { id: "survey", label: "Select Survey", icon: MessageSquare },
    { id: "sms", label: "SMS Template", icon: Mail },
    { id: "contacts", label: "Contacts", icon: Users },
    { id: "rewards", label: "Rewards", icon: Gift }
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
      >
        <Sparkles className="w-4 h-4" />
        <span className="hidden sm:inline">Create Campaign</span>
        <span className="sm:hidden">Create</span>
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-left">Create New Campaign</h2>
          </div>

          {/* Progress Steps */}
          <div className="mb-6">
            {/* Desktop Layout */}
            <div className="hidden sm:flex items-center justify-center space-x-1">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors p-2 ${
                    currentStep === step.id 
                      ? "border-theme-purple-500 bg-theme-purple-500 text-white" 
                      : isStepComplete(step.id)
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-gray-300 bg-gray-100 text-gray-500"
                  }`}>
                    <step.icon className="w-4 h-4 flex-shrink-0" />
                  </div>
                  <span className={`ml-1 text-xs font-medium whitespace-nowrap ${
                    currentStep === step.id ? "text-gray-900 dark:text-white" : "text-gray-500"
                  }`}>
                    {step.label}
                  </span>
                  {index < 4 && (
                    <div className={`w-4 h-0.5 mx-1 ${
                      isStepComplete(step.id) ? "bg-green-500" : "bg-gray-300"
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {/* Mobile Layout */}
            <div className="sm:hidden">
              <div className="flex items-center justify-center space-x-1 mb-2">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors p-1.5 ${
                      currentStep === step.id 
                        ? "border-theme-purple-500 bg-theme-purple-500 text-white" 
                        : isStepComplete(step.id)
                        ? "border-green-500 bg-green-500 text-white"
                        : "border-gray-300 bg-gray-100 text-gray-500"
                    }`}>
                      <step.icon className="w-3 h-3 flex-shrink-0" />
                    </div>
                    {index < 4 && (
                      <div className={`w-3 h-0.5 mx-1 ${
                        isStepComplete(step.id) ? "bg-green-500" : "bg-gray-300"
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="text-center">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {steps.find(step => step.id === currentStep)?.label}
                </span>
              </div>
            </div>
          </div>

          {/* Campaign Details */}
          {currentStep === "details" && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 text-left">Campaign Details</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Set up the basic information for your feedback campaign</p>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="campaign-name">Campaign Name</Label>
                    <InputField
                      id="campaign-name"
                      placeholder="e.g., Q1 Product Feedback Survey"
                      defaultValue={campaignData.name}
                      onChange={(e) => setCampaignData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="campaign-description">Description</Label>
                    <textarea
                      id="campaign-description"
                      placeholder="Describe what this campaign is about and what feedback you're looking for..."
                      value={campaignData.description}
                      onChange={(e) => setCampaignData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="h-11 w-full rounded-lg border border-gray-300 appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 bg-transparent text-gray-800 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Select Survey Step */}
          {currentStep === "survey" && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 text-left">Select Survey</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Choose an existing survey or create a new one for this campaign</p>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="survey-select">Select Survey</Label>
                    <select
                      id="survey-select"
                      value={campaignData.selectedSurveyId}
                      onChange={(e) => setCampaignData(prev => ({ ...prev, selectedSurveyId: e.target.value }))}
                      className="h-11 w-full rounded-lg border border-gray-300 appearance-none px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 bg-transparent text-gray-800 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                    >
                      <option value="">-- Select a survey --</option>
                      {surveys.map((survey) => (
                        <option key={survey._id || survey.id} value={survey._id || survey.id}>
                          {survey.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {campaignData.selectedSurveyId && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                            {surveys.find(s => (s._id || s.id) === campaignData.selectedSurveyId)?.title}
                          </h4>
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            {surveys.find(s => (s._id || s.id) === campaignData.selectedSurveyId)?.description || "No description"}
                          </p>
                          <div className="mt-2 flex items-center gap-4 text-xs text-blue-700 dark:text-blue-300">
                            <span>
                              {Array.isArray(surveys.find(s => (s._id || s.id) === campaignData.selectedSurveyId)?.questions) 
                                ? surveys.find(s => (s._id || s.id) === campaignData.selectedSurveyId)?.questions.length 
                                : 0} questions
                            </span>
                            <span>
                              Status: {surveys.find(s => (s._id || s.id) === campaignData.selectedSurveyId)?.status || "draft"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">or</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        window.location.href = '/create';
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <Plus className="w-5 h-5" />
                      Create New Survey
                    </button>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                      You'll be redirected to create a new survey. Come back here after creating it.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SMS Template */}
          {currentStep === "sms" && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 text-left">SMS Template & Survey Link</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Create the message and survey link that will be sent to your customers</p>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* SMS Template Column */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="sms-template">Message Template</Label>
                      <textarea
                        id="sms-template"
                        placeholder="Hi {name}! We'd love your feedback on our recent service. Complete our quick survey and get {reward}! Click here: {link}"
                        value={campaignData.smsTemplate}
                        onChange={(e) => setCampaignData(prev => ({ ...prev, smsTemplate: e.target.value }))}
                        rows={6}
                        className="h-35 w-full rounded-lg border border-gray-300 appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 bg-transparent text-gray-800 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                      />
                      <div className="mt-2 space-x-2">
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800">
                          {"{name}"}
                        </span>
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800">
                          {"{reward}"}
                        </span>
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800">
                          {"{link}"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Use the variables above to personalize your message. Character count: {campaignData.smsTemplate.length}/160
                      </p>
                    </div>
                  </div>

                  {/* Survey Link Column */}
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Survey Link</h4>
                      <p className="text-sm text-blue-800 mb-2">
                        Your survey will be automatically hosted and a link will be generated.
                      </p>
                      <div className="bg-white rounded border border-blue-200 p-2">
                        <code className="text-xs text-blue-900 break-all">
                          https://yourdomain.com/survey/{campaignData.selectedSurveyId ? (surveys.find(s => (s._id || s.id) === campaignData.selectedSurveyId)?.title?.toLowerCase().replace(/\s+/g, '-') || 'untitled') : 'untitled'}
                        </code>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">SMS Tips:</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Link will be automatically shortened</li>
                        <li>• Survey is mobile-optimized by default</li>
                        <li>• Responses tracked automatically</li>
                        <li>• Real-time completion notifications</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Preview Section */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mt-6">
                  <h4 className="font-medium mb-2 text-gray-900 dark:text-white">SMS Preview:</h4>
                  <p className="text-sm font-mono bg-white dark:bg-gray-800 p-3 rounded border text-gray-900 dark:text-white">
                    {campaignData.smsTemplate
                      ? campaignData.smsTemplate
                          .replace("{name}", "John Doe")
                          .replace("{reward}", "$5 cash reward")
                          .replace("{link}", `yourdomain.com/s/${campaignData.selectedSurveyId ? (surveys.find(s => (s._id || s.id) === campaignData.selectedSurveyId)?.title?.substring(0, 6) || 'survey') : 'survey'}`)
                      : "Your personalized SMS message will appear here..."}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Final character count: {campaignData.smsTemplate
                      ? campaignData.smsTemplate
                          .replace("{name}", "John Doe")
                          .replace("{reward}", "$5 cash reward")
                          .replace("{link}", `yourdomain.com/s/${campaignData.selectedSurveyId ? (surveys.find(s => (s._id || s.id) === campaignData.selectedSurveyId)?.title?.substring(0, 6) || 'survey') : 'survey'}`).length
                      : 0}/160
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Contacts Upload */}
          {currentStep === "contacts" && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 text-left">Select Contacts</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Choose how you want to add contacts to this campaign</p>
                
                <div className="space-y-6">
                  {/* Contact Method Selection */}
                  <div className="flex space-x-4">
                    <Button
                      variant={campaignData.contactMethod === "upload" ? "primary" : "outline"}
                      onClick={() => {
                        setCampaignData(prev => ({ 
                          ...prev, 
                          contactMethod: "upload", 
                          selectedCustomers: [],
                          contacts: null
                        }));
                        setParsedContacts([]);
                      }}
                       startIcon={<Plus className="w-4 h-4" />}
                    >
                      Upload New Contacts
                    </Button>
                    <Button
                      variant={campaignData.contactMethod === "previous" ? "primary" : "outline"}
                      onClick={() => {
                        setCampaignData(prev => ({ 
                          ...prev, 
                          contactMethod: "previous", 
                          contacts: null,
                          selectedCustomers: []
                        }));
                        setParsedContacts([]);
                      }}
                       startIcon={<Users className="w-4 h-4" />}
                    >
                      Select from Preexisting Customers
                    </Button>
                  </div>

                  {/* Upload Contacts */}
                  {campaignData.contactMethod === "upload" && (
                    <div className="space-y-4">
                      <div className="relative">
                        <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                          campaignData.contacts 
                            ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20" 
                            : "border-gray-300 hover:border-purple-400 hover:bg-purple-50 dark:border-gray-600 dark:hover:border-purple-500 dark:hover:bg-purple-900/10"
                        }`}>
                          <div className={`w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full transition-colors ${
                            campaignData.contacts 
                              ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" 
                              : "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                          }`}>
                            {campaignData.contacts ? (
                              <CheckCircle className="w-8 h-8" />
                            ) : (
                              <Upload className="w-8 h-8" />
                            )}
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <p className={`text-lg font-semibold ${
                                campaignData.contacts 
                                  ? "text-green-900 dark:text-green-100" 
                                  : "text-gray-900 dark:text-white"
                              }`}>
                                {campaignData.contacts ? "File Uploaded Successfully!" : "Upload Contact List"}
                              </p>
                              <p className={`text-sm ${
                                campaignData.contacts 
                                  ? "text-green-700 dark:text-green-300" 
                                  : "text-gray-600 dark:text-gray-400"
                              }`}>
                                {campaignData.contacts 
                                  ? "Your contact file is ready to process" 
                                  : "Drag and drop your CSV or Excel file here, or click to browse"
                                }
                              </p>
                            </div>
                            
                            {campaignData.contacts ? (
                              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                      <File className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900 dark:text-white">{campaignData.contacts.name}</p>
                                      <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {(campaignData.contacts.size / 1024).toFixed(1)} KB
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setCampaignData(prev => ({ ...prev, contacts: null }));
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
                                  accept=".csv,.xlsx,.xls"
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
                                  Supported formats: CSV, XLSX, XLS (Max 10MB)
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Required File Format
                        </h4>
                        <div className="text-sm text-blue-800 dark:text-blue-200">
                          <p className="font-medium mb-2">Your CSV/Excel file must include these columns:</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span><strong>name</strong> - First Name or Full Name</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span><strong>phone</strong> - Phone with country code</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span><strong>email</strong> - Email address (Required)</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Display Parsed Contacts */}
                      {parsedContacts.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white text-left">
                              Parsed Contacts ({parsedContacts.length})
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
                                  Some contacts have errors (missing fields, duplicate emails, or duplicate phone numbers). Please fix these issues before proceeding.
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

                          {/* <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                              JSON Data:
                            </p>
                            <pre className="text-xs bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600 overflow-x-auto text-gray-900 dark:text-white max-h-48 overflow-y-auto">
                              {JSON.stringify(parsedContacts.map(c => ({ name: c.name, phone: c.phone, email: c.email })), null, 2)}
                            </pre>
                          </div> */}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Select from Preexisting Customers */}
                  {campaignData.contactMethod === "previous" && (
                    <div className="space-y-4">
                      {/* Search */}
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <InputField
                            placeholder="Search customers by name, email, or phone..."
                            defaultValue={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      {/* Select All */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="select-all"
                            checked={filteredCustomers.length > 0 && filteredCustomers.every(c => campaignData.selectedCustomers.includes(c.id))}
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 text-theme-purple-600 focus:ring-theme-purple-500"
                          />
                          <Label htmlFor="select-all" className="font-medium">
                            Select All ({filteredCustomers.length} customers)
                          </Label>
                        </div>
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800">
                          {campaignData.selectedCustomers.length} selected
                        </span>
                      </div>

                      {/* Customer List */}
                      <div className="max-h-96 overflow-y-auto space-y-2 border rounded-lg p-4">
                        {filteredCustomers.map((customer) => (
                          <div key={customer.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            <input
                              type="checkbox"
                              id={`customer-${customer.id}`}
                              checked={campaignData.selectedCustomers.includes(customer.id)}
                              onChange={() => handleCustomerToggle(customer.id)}
                              className="rounded border-gray-300 text-theme-purple-600 focus:ring-theme-purple-500"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-sm text-gray-900 dark:text-white">{customer.name}</p>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{customer.email}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{customer.phone}</p>
                            </div>
                          </div>
                        ))}
                        
                        {filteredCustomers.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <div className="w-8 h-8 mx-auto mb-2 opacity-50 flex items-center justify-center">
                              <User className="w-6 h-6" />
                            </div>
                            <p>No customers found matching your criteria</p>
                          </div>
                        )}
                      </div>

                      {campaignData.selectedCustomers.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-blue-800 font-medium">
                            ✅ {campaignData.selectedCustomers.length} customers selected
                          </p>
                          <p className="text-sm text-blue-600">
                            Ready to send campaign to selected customers
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Rewards Setup */}
          {currentStep === "rewards" && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 text-left">Reward Configuration</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Set up the rewards customers will receive for completing feedback</p>
                
                <div className="space-y-4">
                  <div>
                    <Label>Reward Type</Label>
                    <select 
                      value={campaignData.rewardType} 
                      onChange={(e) => setCampaignData(prev => ({ ...prev, rewardType: e.target.value }))}
                      className="h-11 w-full rounded-lg border border-gray-300 appearance-none px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 bg-transparent text-gray-800 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                    >
                      <option value="">Select reward type</option>
                      <option value="cash">Cash Reward</option>
                      <option value="promo">Promo Code</option>
                    </select>
                  </div>

                  {campaignData.rewardType === "cash" && (
                    <div>
                      <Label htmlFor="cash-amount">Cash Amount ($)</Label>
                      <InputField
                        id="cash-amount"
                        type="number"
                        min="1"
                        step={1}
                        placeholder="5.00"
                        defaultValue={campaignData.rewardValue}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Allow empty string for clearing
                          if (value === "") {
                            setCampaignData(prev => ({ ...prev, rewardValue: "" }));
                            return;
                          }
                          
                          const numValue = parseFloat(value);
                          // Only update if it's a valid positive number greater than 0
                          if (!isNaN(numValue) && numValue > 0) {
                            setCampaignData(prev => ({ ...prev, rewardValue: value }));
                          } else {
                            // Prevent invalid input by reverting to last valid value
                            e.target.value = campaignData.rewardValue || "";
                          }
                        }}
                        error={campaignData.rewardValue ? parseFloat(campaignData.rewardValue) <= 0 : false}
                      />
                      {campaignData.rewardValue && parseFloat(campaignData.rewardValue) <= 0 && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          Cash amount must be greater than 0
                        </p>
                      )}
                    </div>
                  )}

                  {campaignData.rewardType === "promo" && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="promo-code">Promo Code</Label>
                        <InputField
                          id="promo-code"
                          placeholder="FEEDBACK20"
                          defaultValue={campaignData.rewardValue}
                          onChange={(e) => setCampaignData(prev => ({ ...prev, rewardValue: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="promo-description">Promo Description</Label>
                        <InputField
                          id="promo-description"
                          placeholder="20% off your next purchase"
                          defaultValue={campaignData.promoDescription}
                          onChange={(e) => setCampaignData(prev => ({ ...prev, promoDescription: e.target.value }))}
                        />
                      </div>
                    </div>
                  )}

                  {campaignData.rewardType && (
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6 dark:from-purple-900/20 dark:to-pink-900/20 dark:border-purple-700">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center text-left">
                        <Gift className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                        Reward Configuration
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Details about the rewards customers will receive</p>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-600">
                          <div className="flex items-center text-sm">
                            <Gift className="w-4 h-4 mr-2 text-gray-500" />
                            <span className="text-gray-600 dark:text-gray-400">Reward Type</span>
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white capitalize">
                            {campaignData.rewardType === "cash" ? "Cash Reward" : "Promo Code"}
                          </span>
                        </div>

                        <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-600">
                          <div className="flex items-center text-sm">
                            <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                            <span className="text-gray-600 dark:text-gray-400">Reward Value</span>
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {campaignData.rewardType === "cash" 
                              ? `$${campaignData.rewardValue || "0.00"}`
                              : campaignData.rewardValue || "CODE"
                            }
                          </span>
                        </div>

                        <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-600">
                          <div className="flex items-center text-sm">
                            <Users className="w-4 h-4 mr-2 text-gray-500" />
                            <span className="text-gray-600 dark:text-gray-400">Recipients</span>
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {priceBreakdown.numberOfRecipients} customers
                          </span>
                        </div>

                        {campaignData.rewardType === "cash" && (
                          <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-600">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Total Reward Cost</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              ${priceBreakdown.totalRewardCost.toFixed(2)}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-600">
                          <div className="flex items-center text-sm">
                            <Mail className="w-4 h-4 mr-2 text-gray-500" />
                            <span className="text-gray-600 dark:text-gray-400">SMS Cost per Message</span>
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            ${priceBreakdown.smsCostPerMessage.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-600">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Total SMS Cost</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            ${priceBreakdown.totalSmsCost.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center pt-2 text-lg font-bold">
                          <span className="text-gray-900 dark:text-white">Total Campaign Cost</span>
                          <span className="text-purple-600 dark:text-purple-400">
                            ${priceBreakdown.totalCost.toFixed(2)}
                          </span>
                        </div>

                        {campaignData.budget && parseFloat(campaignData.budget) < priceBreakdown.totalCost && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3 dark:bg-yellow-900/20 dark:border-yellow-700">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                              ⚠️ Campaign cost (${priceBreakdown.totalCost.toFixed(2)}) exceeds your budget (${campaignData.budget})
                            </p>
                          </div>
                        )}

                        {campaignData.budget && parseFloat(campaignData.budget) >= priceBreakdown.totalCost && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3 dark:bg-green-900/20 dark:border-green-700">
                            <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                              ✅ Within budget - Remaining: ${(parseFloat(campaignData.budget) - priceBreakdown.totalCost).toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep(getPreviousStep())}
              disabled={currentStep === "details"}
            >
              Previous
            </Button>
            
            <div className="space-x-2">
              {currentStep !== "rewards" ? (
                <Button 
                  onClick={() => setCurrentStep(getNextStep())}
                  disabled={!canProceedToNext()}
                >
                  Next
                </Button>
              ) : (
                <Button 
                  onClick={handleCreateCampaign}
                  disabled={!canProceedToNext()}
                  className="bg-gradient-to-r from-theme-purple-500 to-theme-purple-600 hover:from-theme-purple-600 hover:to-theme-purple-700"
                >
                  Create Campaign
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}

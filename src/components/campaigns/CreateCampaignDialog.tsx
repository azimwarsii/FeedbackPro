"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import InputField from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Plus, Copy, Trash2, DollarSign, Users, FileText, MessageSquare, Mail, ArrowUp, ArrowDown, User, Search, File, CheckCircle, Gift, Upload, Sparkles, Filter, X, Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react";

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

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  lastCampaign: string;
  status: "completed" | "partial" | "not_started";
}

export function CreateCampaignDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState("details");
  const [campaignData, setCampaignData] = useState({
    name: "",
    description: "",
    smsTemplate: "",
    surveyLink: "",
    contactMethod: "upload" as "upload" | "previous",
    contacts: null as File | null,
    selectedCustomers: [] as string[],
    rewardType: "",
    rewardValue: "",
    budget: ""
  });

  // Survey creation state
  const [surveyData, setSurveyData] = useState<Survey>({
    id: Date.now().toString(),
    title: "",
    description: "",
    questions: [],
    settings: {
      allowAnonymous: true,
      showProgressBar: true,
      randomizeQuestions: false,
      thankYouMessage: "Thank you for completing the survey!"
    }
  });
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [showLogic, setShowLogic] = useState(false);
  const [currentPreviewQuestion, setCurrentPreviewQuestion] = useState(0);

  // Mock data for previous campaign customers
  const previousCustomers: Customer[] = [
    { id: "1", name: "John Doe", email: "john@email.com", phone: "+1234567890", lastCampaign: "Q3 Product Survey", status: "completed" },
    { id: "2", name: "Jane Smith", email: "jane@email.com", phone: "+1234567891", lastCampaign: "Holiday Feedback", status: "completed" },
    { id: "3", name: "Mike Johnson", email: "mike@email.com", phone: "+1234567892", lastCampaign: "Q3 Product Survey", status: "partial" },
    { id: "4", name: "Sarah Wilson", email: "sarah@email.com", phone: "+1234567893", lastCampaign: "Brand Awareness", status: "completed" },
    { id: "5", name: "David Brown", email: "david@email.com", phone: "+1234567894", lastCampaign: "Holiday Feedback", status: "not_started" },
    { id: "6", name: "Lisa Davis", email: "lisa@email.com", phone: "+1234567895", lastCampaign: "Q3 Product Survey", status: "completed" },
  ];

  const [customerSearch, setCustomerSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");

  const filteredCustomers = previousCustomers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                         customer.email.toLowerCase().includes(customerSearch.toLowerCase());
    const matchesFilter = customerFilter === "all" || customer.status === customerFilter;
    return matchesSearch && matchesFilter;
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCampaignData(prev => ({ ...prev, contacts: file }));
    }
  };

  const handleCreateCampaign = () => {
    // Mock campaign creation
    console.log("Campaign created:", campaignData);
    setIsOpen(false);
    setCampaignData({
      name: "",
      description: "",
      smsTemplate: "",
      surveyLink: "",
      contactMethod: "upload",
      contacts: null,
      selectedCustomers: [],
      rewardType: "",
      rewardValue: "",
      budget: ""
    });
    setCurrentStep("details");
  };

  // Survey management functions
  const addQuestion = () => {
    const newQuestion: SurveyQuestion = {
      id: `q-${Date.now()}`,
      type: "text",
      title: "",
      description: "",
      required: false,
      logicRules: [],
    };
    setSurveyData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
    setEditingQuestionId(newQuestion.id);
  };

  const updateQuestion = (questionId: string, updates: Partial<SurveyQuestion>) => {
    setSurveyData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, ...updates } : q
      )
    }));
  };

  const deleteQuestion = (questionId: string) => {
    setSurveyData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
    if (editingQuestionId === questionId) {
      setEditingQuestionId(null);
    }
  };

  const duplicateQuestion = (questionId: string) => {
    const question = surveyData.questions.find(q => q.id === questionId);
    if (question) {
      const newQuestion: SurveyQuestion = {
        ...question,
        id: `q-${Date.now()}`,
        title: `${question.title} (Copy)`,
        logicRules: question.logicRules.map(rule => ({
          ...rule,
          id: `rule-${Date.now()}-${Math.random()}`
        }))
      };
      setSurveyData(prev => ({
        ...prev,
        questions: [...prev.questions, newQuestion]
      }));
    }
  };

  // Logic rule management functions
  const addLogicRule = (questionId: string) => {
    const newRule: LogicRule = {
      id: `rule-${Date.now()}-${Math.random()}`,
      condition: "equals",
      value: "",
      action: "show"
    };
    
    setSurveyData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId 
          ? { ...q, logicRules: [...q.logicRules, newRule] }
          : q
      )
    }));
  };

  const updateLogicRule = (questionId: string, ruleId: string, updates: Partial<LogicRule>) => {
    setSurveyData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId 
          ? { 
              ...q, 
              logicRules: q.logicRules.map(rule => 
                rule.id === ruleId ? { ...rule, ...updates } : rule
              )
            }
          : q
      )
    }));
  };

  const deleteLogicRule = (questionId: string, ruleId: string) => {
    setSurveyData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId 
          ? { ...q, logicRules: q.logicRules.filter(rule => rule.id !== ruleId) }
          : q
      )
    }));
  };

  const moveQuestion = (questionId: string, direction: "up" | "down") => {
    const index = surveyData.questions.findIndex(q => q.id === questionId);
    if (
      (direction === "up" && index > 0) ||
      (direction === "down" && index < surveyData.questions.length - 1)
    ) {
      const newQuestions = [...surveyData.questions];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
      setSurveyData(prev => ({ ...prev, questions: newQuestions }));
    }
  };

  const getQuestionNumber = (questionId: string) => {
    const index = surveyData.questions.findIndex(q => q.id === questionId);
    return index + 1;
  };

  const nextPreviewQuestion = () => {
    if (currentPreviewQuestion < surveyData.questions.length - 1) {
      setCurrentPreviewQuestion(prev => prev + 1);
    }
  };

  const prevPreviewQuestion = () => {
    if (currentPreviewQuestion > 0) {
      setCurrentPreviewQuestion(prev => prev - 1);
    }
  };

  const isStepComplete = (step: string) => {
    switch (step) {
      case "details":
        return campaignData.name && campaignData.description;
      case "survey":
        return surveyData.title && surveyData.questions.length > 0;
      case "sms":
        return campaignData.smsTemplate;
      case "contacts":
        return campaignData.contactMethod === "upload" 
          ? campaignData.contacts !== null
          : campaignData.selectedCustomers.length > 0;
      case "rewards":
        return campaignData.rewardType && campaignData.rewardValue;
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
      ? 0 // Will be calculated after file upload
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
    { id: "survey", label: "Create Survey", icon: MessageSquare },
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Campaign</h2>
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Campaign Details</h3>
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
                  <div>
                    <Label htmlFor="campaign-budget">Campaign Budget</Label>
                    <InputField
                      id="campaign-budget"
                      type="number"
                      placeholder="1000"
                      defaultValue={campaignData.budget}
                      onChange={(e) => setCampaignData(prev => ({ ...prev, budget: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Create Survey Step */}
          {currentStep === "survey" && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Create Survey</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Build your survey that customers will complete</p>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="survey-title">Survey Title</Label>
                    <InputField
                      id="survey-title"
                      placeholder="e.g., Product Feedback Survey"
                      defaultValue={surveyData.title}
                      onChange={(e) => setSurveyData(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="survey-description">Survey Description</Label>
                    <textarea
                      id="survey-description"
                      placeholder="Tell respondents what this survey is about..."
                      value={surveyData.description}
                      onChange={(e) => setSurveyData(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                      className="h-11 w-full rounded-lg border border-gray-300 appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 bg-transparent text-gray-800 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Survey Builder */}
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Questions</h4>
                      <Button onClick={addQuestion} size="sm" startIcon={<Plus className="w-4 h-4" />}>
                        Add Question
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {surveyData.questions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <div className="w-12 h-12 mx-auto mb-3 opacity-50 flex items-center justify-center">
                            <FileText className="w-8 h-8" />
                          </div>
                          <p className="font-medium">No questions yet</p>
                          <p className="text-sm">Click &quot;Add Question&quot; to get started</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {surveyData.questions.map((question, index) => (
                            <div
                              key={question.id}
                              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                editingQuestionId === question.id
                                  ? "border-theme-purple-500 bg-theme-purple-50"
                                  : "border-gray-200 hover:border-theme-purple-300"
                              }`}
                              onClick={() => setEditingQuestionId(question.id)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800">
                                      {question.type}
                                    </span>
                                    {question.required && (
                                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-red-100 text-red-800">
                                        Required
                                      </span>
                                    )}
                                  </div>
                                  <p className="font-medium text-sm truncate">
                                    {question.title || `Question ${index + 1}`}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      moveQuestion(question.id, "up");
                                    }}
                                    disabled={index === 0}
                                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 rounded hover:bg-gray-100 transition-colors"
                                  >
                                    <ArrowUp className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      moveQuestion(question.id, "down");
                                    }}
                                    disabled={index === surveyData.questions.length - 1}
                                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 rounded hover:bg-gray-100 transition-colors"
                                  >
                                    <ArrowDown className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      duplicateQuestion(question.id);
                                    }}
                                    className="p-2 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 transition-colors"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteQuestion(question.id);
                                    }}
                                    className="p-2 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Question Editor */}
                  {editingQuestionId && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Edit Question</h4>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="question-title">Question Title</Label>
                          <InputField
                            id="question-title"
                            placeholder="Enter your question"
                            defaultValue={surveyData.questions.find(q => q.id === editingQuestionId)?.title || ""}
                            onChange={(e) => updateQuestion(editingQuestionId, { title: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="question-description">Description (Optional)</Label>
                          <textarea
                            id="question-description"
                            placeholder="Add a description if needed"
                            value={surveyData.questions.find(q => q.id === editingQuestionId)?.description || ""}
                            onChange={(e) => updateQuestion(editingQuestionId, { description: e.target.value })}
                            rows={2}
                            className="h-11 w-full rounded-lg border border-gray-300 appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 bg-transparent text-gray-800 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="required"
                            checked={surveyData.questions.find(q => q.id === editingQuestionId)?.required || false}
                            onChange={(e) => updateQuestion(editingQuestionId, { required: e.target.checked })}
                            className="rounded border-gray-300 text-theme-purple-600 focus:ring-theme-purple-500"
                          />
                          <Label htmlFor="required">Required field</Label>
                        </div>
                      </div>

                      {/* Question Logic Section */}
                      <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            <h5 className="text-lg font-semibold text-gray-900 dark:text-white">Question Logic</h5>
                          </div>
                          <button 
                            onClick={() => setShowLogic(!showLogic)}
                            className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1"
                          >
                            {showLogic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            {showLogic ? "Hide Logic" : "Show Logic"}
                          </button>
                        </div>
                        
                        {showLogic && (
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <h6 className="font-medium text-gray-900 dark:text-white mb-3">Conditional Logic</h6>
                            
                            {surveyData.questions.find(q => q.id === editingQuestionId)?.logicRules && surveyData.questions.find(q => q.id === editingQuestionId)!.logicRules.length > 0 ? (
                              <div className="space-y-3">
                                {surveyData.questions.find(q => q.id === editingQuestionId)?.logicRules.map((rule, index) => (
                                  <div key={rule.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Rule {index + 1}</span>
                                        {rule.value && rule.action && (
                                          <span className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                            If answer {rule.condition} &quot;{rule.value}&quot; then {rule.action} 
                                            {rule.targetQuestionId && ` Question ${getQuestionNumber(rule.targetQuestionId)}`}
                                          </span>
                                        )}
                                      </div>
                                      <button
                                        onClick={() => deleteLogicRule(editingQuestionId, rule.id)}
                                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                              
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Condition</label>
                                        <select
                                          value={rule.condition}
                                          onChange={(e) => updateLogicRule(editingQuestionId, rule.id, { 
                                            condition: e.target.value as LogicRule['condition'] 
                                          })}
                                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        >
                                          <option value="equals">Equals</option>
                                          <option value="not_equals">Not Equals</option>
                                          <option value="contains">Contains</option>
                                          <option value="greater_than">Greater Than</option>
                                          <option value="less_than">Less Than</option>
                                        </select>
                                      </div>
                                      
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Value</label>
                                        <input
                                          type="text"
                                          value={rule.value}
                                          onChange={(e) => updateLogicRule(editingQuestionId, rule.id, { value: e.target.value })}
                                          placeholder="Enter value"
                                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        />
                                      </div>
                                    </div>
                                    
                                    <div className="mt-3">
                                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Action</label>
                                      <select
                                        value={rule.action}
                                        onChange={(e) => updateLogicRule(editingQuestionId, rule.id, { 
                                          action: e.target.value as LogicRule['action'] 
                                        })}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                      >
                                        <option value="show">Show...</option>
                                        <option value="hide">Hide...</option>
                                        <option value="skip_to">Jump to...</option>
                                      </select>
                                    </div>
                              
                                    {/* Target Question Selection - Only show for hide and skip_to actions */}
                                    {(rule.action === "hide" || rule.action === "skip_to") && (
                                      <div className="mt-3">
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                          {rule.action === "hide" ? "Hide Question" : "Jump to Question"}
                                        </label>
                                        <select
                                          value={rule.targetQuestionId || ""}
                                          onChange={(e) => updateLogicRule(editingQuestionId, rule.id, { 
                                            targetQuestionId: e.target.value 
                                          })}
                                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        >
                                          <option value="">Select a question...</option>
                                          {surveyData.questions
                                            .filter(q => q.id !== editingQuestionId)
                                            .map(q => (
                                              <option key={q.id} value={q.id}>
                                                Question {getQuestionNumber(q.id)}: {q.title || `Untitled Question`}
                                              </option>
                                            ))}
                                        </select>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-4">
                                <Filter className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">No logic rules added</p>
                              </div>
                            )}
                            
                            <button
                              onClick={() => addLogicRule(editingQuestionId)}
                              className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                              Add Logic Rule
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Survey Preview */}
                <div className="lg:sticky lg:top-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Live Preview</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">How your survey will look to respondents</p>
                    
                    <div className="space-y-4">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 dark:text-white">{surveyData.title || "Survey Title"}</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{surveyData.description || "Survey description"}</p>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-600">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all duration-300" 
                          style={{ 
                            width: surveyData.questions.length > 0 
                              ? `${((currentPreviewQuestion + 1) / surveyData.questions.length) * 100}%` 
                              : "0%" 
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Question {surveyData.questions.length > 0 ? currentPreviewQuestion + 1 : 0} of {surveyData.questions.length}
                      </p>
                      
                      {/* Single Question Display */}
                      {surveyData.questions.length === 0 ? (
                        <div className="text-center py-8">
                          <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500 dark:text-gray-400">No questions yet</p>
                          <p className="text-sm text-gray-400 dark:text-gray-500">Add questions to see preview</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                Question {currentPreviewQuestion + 1}
                              </span>
                              {surveyData.questions[currentPreviewQuestion].required && (
                                <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                                  Required
                                </span>
                              )}
                              {surveyData.questions[currentPreviewQuestion].logicRules.length > 0 && (
                                <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                  Logic ({surveyData.questions[currentPreviewQuestion].logicRules.length})
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-900 dark:text-white mb-2">
                              {surveyData.questions[currentPreviewQuestion].title || "Question title"}
                            </p>
                            {surveyData.questions[currentPreviewQuestion].description && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                                {surveyData.questions[currentPreviewQuestion].description}
                              </p>
                            )}
                            <input
                              type="text"
                              placeholder="Enter your text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            />
                            {surveyData.questions[currentPreviewQuestion].logicRules.length > 0 && (
                              <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                                <span className="font-medium">Logic rules:</span>
                                {surveyData.questions[currentPreviewQuestion].logicRules.map((rule, ruleIndex) => (
                                  <span key={rule.id} className="ml-1">
                                    {ruleIndex > 0 && ", "}
                                    {rule.condition} &quot;{rule.value}&quot; → {rule.action}
                                    {rule.action === "skip_to" && rule.targetQuestionId && (
                                      <span> (Q{getQuestionNumber(rule.targetQuestionId)})</span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Navigation Buttons */}
                      {surveyData.questions.length > 0 && (
                        <div className="flex justify-between mt-6">
                          <button 
                            onClick={prevPreviewQuestion}
                            disabled={currentPreviewQuestion === 0}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                          </button>
                          
                          <button 
                            onClick={nextPreviewQuestion}
                            disabled={currentPreviewQuestion === surveyData.questions.length - 1}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-purple-700 rounded-lg hover:from-purple-600 hover:to-purple-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SMS Template */}
          {currentStep === "sms" && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">SMS Template & Survey Link</h3>
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
                          https://yourdomain.com/survey/{surveyData.title.toLowerCase().replace(/\s+/g, '-') || 'untitled'}
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
                          .replace("{link}", `yourdomain.com/s/${surveyData.title.substring(0, 6) || 'survey'}`)
                      : "Your personalized SMS message will appear here..."}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Final character count: {campaignData.smsTemplate
                      ? campaignData.smsTemplate
                          .replace("{name}", "John Doe")
                          .replace("{reward}", "$5 cash reward")
                          .replace("{link}", `yourdomain.com/s/${surveyData.title.substring(0, 6) || 'survey'}`).length
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Select Contacts</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Choose how you want to add contacts to this campaign</p>
                
                <div className="space-y-6">
                  {/* Contact Method Selection */}
                  <div className="flex space-x-4">
                    <Button
                      variant={campaignData.contactMethod === "upload" ? "primary" : "outline"}
                      onClick={() => setCampaignData(prev => ({ ...prev, contactMethod: "upload", selectedCustomers: [] }))}
                       startIcon={<Plus className="w-4 h-4" />}
                    >
                      Upload New Contacts
                    </Button>
                    <Button
                      variant={campaignData.contactMethod === "previous" ? "primary" : "outline"}
                      onClick={() => setCampaignData(prev => ({ ...prev, contactMethod: "previous", contacts: null }))}
                       startIcon={<Users className="w-4 h-4" />}
                    >
                      Select from Previous Campaigns
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
                                    onClick={() => setCampaignData(prev => ({ ...prev, contacts: null }))}
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
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              <span><strong>email</strong> - Optional backup contact</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Select from Previous Campaigns */}
                  {campaignData.contactMethod === "previous" && (
                    <div className="space-y-4">
                      {/* Search and Filter */}
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <InputField
                            placeholder="Search customers..."
                            defaultValue={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <select 
                          value={customerFilter} 
                          onChange={(e) => setCustomerFilter(e.target.value)}
                          className="h-11 w-full sm:w-48 rounded-lg border border-gray-300 appearance-none px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 bg-transparent text-gray-800 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                        >
                          <option value="all">All Customers</option>
                          <option value="completed">Completed</option>
                          <option value="partial">Partial</option>
                          <option value="not_started">Not Started</option>
                        </select>
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
                                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                  customer.status === "completed" ? "bg-blue-100 text-blue-800" :
                                  customer.status === "partial" ? "bg-gray-100 text-gray-800" : "bg-gray-100 text-gray-800"
                                }`}>
                                  {customer.status.replace("_", " ")}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{customer.email}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Last campaign: {customer.lastCampaign}</p>
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Reward Configuration</h3>
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
                        placeholder="5.00"
                        defaultValue={campaignData.rewardValue}
                        onChange={(e) => setCampaignData(prev => ({ ...prev, rewardValue: e.target.value }))}
                      />
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
                        />
                      </div>
                    </div>
                  )}

                  {campaignData.rewardType && (
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6 dark:from-purple-900/20 dark:to-pink-900/20 dark:border-purple-700">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
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

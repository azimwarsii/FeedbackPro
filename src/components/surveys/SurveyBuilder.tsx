"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSurveysStore } from "../../store/useSurveysStore";
import { 
  Plus, 
  Save, 
  Trash2,
  ArrowLeft,
  Type,
  FileText,
  CheckSquare,
  Circle,
  Star,
  Calendar,
  Mail,
  Phone,
  Hash,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
  Filter,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

type QuestionType = "short-text" | "long-text" | "multiple-choice" | "single-choice" | "rating-scale" | "date" | "email" | "phone" | "number";

interface LogicRule {
  id: string;
  condition: string;
  value: string;
  action: string;
  targetQuestion?: string;
}

interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description: string;
  required: boolean;
  options?: string[];
  ratingMax?: number;
  order: number;
  logic?: LogicRule[];
}

interface Survey {
  title: string;
  description: string;
  questions: Question[];
  thankYouMessage: string;
  goal : string;
  user : string;
}

const questionTypes = [
  { id: "short-text", label: "Short Text", icon: <Type className="w-4 h-4" />, description: "Single line text input" },
  { id: "long-text", label: "Long Text", icon: <FileText className="w-4 h-4" />, description: "Multi-line text input" },
  { id: "multiple-choice", label: "Multiple Choice", icon: <CheckSquare className="w-4 h-4" />, description: "Select multiple options" },
  { id: "single-choice", label: "Single Choice", icon: <Circle className="w-4 h-4" />, description: "Select one option" },
  { id: "rating-scale", label: "Rating Scale", icon: <Star className="w-4 h-4" />, description: "Rate from 1 to 5" },
  { id: "date", label: "Date", icon: <Calendar className="w-4 h-4" />, description: "Date picker" },
  { id: "email", label: "Email", icon: <Mail className="w-4 h-4" />, description: "Email address input" },
  { id: "phone", label: "Phone", icon: <Phone className="w-4 h-4" />, description: "Phone number input" },
  { id: "number", label: "Number", icon: <Hash className="w-4 h-4" />, description: "Numeric input" }
];

export default function CreateSurvey() {
  const [activeTab, setActiveTab] = useState<"builder" | "settings">("builder");
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [showLogic, setShowLogic] = useState(false);
  const [currentPreviewQuestion, setCurrentPreviewQuestion] = useState(0);
  const { data: session } = useSession();
  const userId = (session as any)?.user?.id;
  const { addSurvey } = useSurveysStore();
  const [survey, setSurvey] = useState<Survey>({
    title: "Untitled Survey",
    description: "Survey description",
    questions: [],
    thankYouMessage: "Thank you for your feedback!",
    goal: "Goal",
    user: userId
  });

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      type,
      title: "Untitled Question",
      description: "",
      required: false,
      options: type === "multiple-choice" || type === "single-choice" ? ["Option 1", "Option 2"] : undefined,
      ratingMax: type === "rating-scale" ? 5 : undefined,
      order: survey.questions.length
    };
    
    setSurvey(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
    setSelectedQuestion(newQuestion);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.map(q => q.id === id ? { ...q, ...updates } : q)
    }));
    
    if (selectedQuestion?.id === id) {
      setSelectedQuestion(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const deleteQuestion = (id: string) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id).map((q, index) => ({ ...q, order: index }))
    }));
    
    if (selectedQuestion?.id === id) {
      setSelectedQuestion(null);
    }
  };

  const addOption = (questionId: string) => {
    const question = survey.questions.find(q => q.id === questionId);
    if (question && question.options) {
      updateQuestion(questionId, {
        options: [...question.options, `Option ${question.options.length + 1}`]
      });
    }
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = survey.questions.find(q => q.id === questionId);
    if (question && question.options) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    const question = survey.questions.find(q => q.id === questionId);
    if (question && question.options && question.options.length > 1) {
      const newOptions = question.options.filter((_, index) => index !== optionIndex);
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const moveQuestion = (questionId: string, direction: "up" | "down") => {
    const questions = [...survey.questions];
    const currentIndex = questions.findIndex(q => q.id === questionId);
    
    if (direction === "up" && currentIndex > 0) {
      [questions[currentIndex], questions[currentIndex - 1]] = [questions[currentIndex - 1], questions[currentIndex]];
    } else if (direction === "down" && currentIndex < questions.length - 1) {
      [questions[currentIndex], questions[currentIndex + 1]] = [questions[currentIndex + 1], questions[currentIndex]];
    }
    
    const reorderedQuestions = questions.map((q, index) => ({ ...q, order: index }));
    setSurvey(prev => ({ ...prev, questions: reorderedQuestions }));
  };

  const addLogicRule = (questionId: string) => {
    const newRule: LogicRule = {
      id: Date.now().toString(),
      condition: "equals",
      value: "",
      action: "show",
      targetQuestion: ""
    };
    
    const question = survey.questions.find(q => q.id === questionId);
    if (question) {
      const updatedLogic = [...(question.logic || []), newRule];
      updateQuestion(questionId, { logic: updatedLogic });
    }
  };

  const updateLogicRule = (questionId: string, ruleId: string, updates: Partial<LogicRule>) => {
    const question = survey.questions.find(q => q.id === questionId);
    if (question && question.logic) {
      const updatedLogic = question.logic.map(rule => 
        rule.id === ruleId ? { ...rule, ...updates } : rule
      );
      updateQuestion(questionId, { logic: updatedLogic });
    }
  };

  const removeLogicRule = (questionId: string, ruleId: string) => {
    const question = survey.questions.find(q => q.id === questionId);
    if (question && question.logic) {
      const updatedLogic = question.logic.filter(rule => rule.id !== ruleId);
      updateQuestion(questionId, { logic: updatedLogic });
    }
  };

  const nextPreviewQuestion = () => {
    if (currentPreviewQuestion < survey.questions.length - 1) {
      setCurrentPreviewQuestion(prev => prev + 1);
    }
  };

  const prevPreviewQuestion = () => {
    if (currentPreviewQuestion > 0) {
      setCurrentPreviewQuestion(prev => prev - 1);
    }
  };

  const getQuestionNumber = (questionId: string) => {
    const index = survey.questions.findIndex(q => q.id === questionId);
    return index + 1;
  };

  const handleSave = async () => {
    try {

      if (!survey.title || survey.title.trim() === "") {
        alert("Please enter a survey title");
        return;
      }

      const baseUrl = process.env.BACKEND_URL || "http://localhost:5000";
      if (!baseUrl) {
        console.error("BACKEND_URL");
        alert("API configuration error. Please contact support.");
        return;
      }

      const endpoint = `${baseUrl.replace(/\/+$/, "")}/surveys`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: survey.user || userId,
          title: survey.title,
          description: survey.description || "",
          questions: survey.questions || [],
          thankYouMessage: survey.thankYouMessage || "",
          goal: survey.goal || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("Failed to save survey", errorData);
        alert(`Failed to save survey: ${errorData.error || response.statusText}`);
        return;
      }

      const data = await response.json();
      console.log("Survey saved successfully", data);
      
      // Add survey to store
      const savedSurvey = data.survey || data;
      if (savedSurvey) {
        addSurvey({
          title: savedSurvey.title || survey.title,
          description: savedSurvey.description || survey.description,
          questions: savedSurvey.questions || survey.questions,
          thankYouMessage: savedSurvey.thankYouMessage || survey.thankYouMessage,
          goal: savedSurvey.goal || survey.goal,
          user: savedSurvey.user || survey.user || userId,
          _id: savedSurvey._id,
          status: savedSurvey.status || "draft",
          responses: savedSurvey.responses || 0,
          createdAt: savedSurvey.createdAt,
          updatedAt: savedSurvey.updatedAt,
        });
      }
      
      alert("Survey saved successfully!");
    } catch (error) {
      console.error("Error saving survey:", error);
      alert("An error occurred while saving the survey. Please try again.");
    }
  };

  const renderQuestionPreview = (question: Question) => {
    const baseClasses = "w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white";
    
    switch (question.type) {
      case "short-text":
        return <input type="text" placeholder="Enter your answer..." className={baseClasses} disabled />;
      
      case "long-text":
        return <textarea placeholder="Enter your answer..." rows={3} className={baseClasses} disabled />;
      
      case "multiple-choice":
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center gap-2">
                <input type="checkbox" disabled className="w-4 h-4 text-purple-600" />
                <span className="text-gray-700 dark:text-gray-300">{option}</span>
              </label>
            ))}
          </div>
        );
      
      case "single-choice":
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center gap-2">
                <input type="radio" name={`question-${question.id}`} disabled className="w-4 h-4 text-purple-600" />
                <span className="text-gray-700 dark:text-gray-300">{option}</span>
              </label>
            ))}
          </div>
        );
      
      case "rating-scale":
        return (
          <div className="flex gap-2">
            {Array.from({ length: question.ratingMax || 5 }, (_, i) => (
              <button key={i} disabled className="w-8 h-8 text-gray-400 hover:text-yellow-400">
                <Star className="w-6 h-6" />
              </button>
            ))}
          </div>
        );
      
      case "date":
        return <input type="date" className={baseClasses} disabled />;
      
      case "email":
        return <input type="email" placeholder="Enter your email..." className={baseClasses} disabled />;
      
      case "phone":
        return <input type="tel" placeholder="Enter your phone number..." className={baseClasses} disabled />;
      
      case "number":
        return <input type="number" placeholder="Enter a number..." className={baseClasses} disabled />;
      
      default:
        return <div className="p-4 text-gray-500">Preview not available</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href='/surveys'  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">Survey Builder</h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">Create and customize your survey</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <Eye className="w-4 h-4" />
              Preview
            </button> */}
            {/* <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <Settings className="w-4 h-4" />
              Settings
            </button> */}
            <button 
              onClick={handleSave}
              className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Save Survey</span>
              <span className="sm:hidden">Save</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)]">
        {/* Left Sidebar */}
        <div className="w-full lg:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Tabs */}
          <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setActiveTab("builder")}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "builder"
                    ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Builder
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "settings"
                    ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Settings
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            {activeTab === "builder" ? (
              <div className="space-y-6">
                {/* Question Types */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Question Types</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                    {questionTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => addQuestion(type.id as QuestionType)}
                        className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 text-left text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        <div className="text-purple-600 dark:text-purple-400">{type.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm sm:text-base truncate">{type.label}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">{type.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Questions List */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Questions ({survey.questions.length})</h3>
                  <div className="space-y-2 max-h-60 lg:max-h-none overflow-y-auto">
                    {survey.questions.map((question, index) => (
                      <div
                        key={question.id}
                        className={`p-2 sm:p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedQuestion?.id === question.id
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                        onClick={() => setSelectedQuestion(question)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Q{index + 1}</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {question.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveQuestion(question.id, "up");
                              }}
                              disabled={index === 0}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveQuestion(question.id, "down");
                              }}
                              disabled={index === survey.questions.length - 1}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteQuestion(question.id);
                              }}
                              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Survey Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Goal
                      </label>
                      <select
                        value={survey.goal}
                        onChange={(e) => setSurvey(prev => ({ ...prev, goal: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Select a goal...</option>
                        <option value="product feedback">Product Feedback</option>
                        <option value="market research">Market Research</option>
                        <option value="customer satisfaction">Customer Satisfaction</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Survey Title
                      </label>
                      <input
                        type="text"
                        value={survey.title}
                        onChange={(e) => setSurvey(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Survey Description
                      </label>
                      <textarea
                        value={survey.description}
                        onChange={(e) => setSurvey(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Thank You Message
                      </label>
                      <textarea
                        value={survey.thankYouMessage}
                        onChange={(e) => setSurvey(prev => ({ ...prev, thankYouMessage: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Middle Section - Question Settings */}
        <div className="flex-1 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          {selectedQuestion ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">Question Settings</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Question Title
                    </label>
                    <input
                      type="text"
                      value={selectedQuestion.title}
                      onChange={(e) => updateQuestion(selectedQuestion.id, { title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={selectedQuestion.description}
                      onChange={(e) => updateQuestion(selectedQuestion.id, { description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Required Question
                    </label>
                    <button
                      onClick={() => updateQuestion(selectedQuestion.id, { required: !selectedQuestion.required })}
                      className="flex items-center gap-2"
                    >
                      {selectedQuestion.required ? (
                        <ToggleRight className="w-6 h-6 text-purple-600" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-gray-400" />
                      )}
                    </button>
                  </div>

                  {/* Options for multiple choice and single choice */}
                  {(selectedQuestion.type === "multiple-choice" || selectedQuestion.type === "single-choice") && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Options
                        </label>
                        <button
                          onClick={() => addOption(selectedQuestion.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                        >
                          <Plus className="w-4 h-4" />
                          Add Option
                        </button>
                      </div>
                      <div className="space-y-2">
                        {selectedQuestion.options?.map((option, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateOption(selectedQuestion.id, index, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                            <button
                              onClick={() => removeOption(selectedQuestion.id, index)}
                              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rating scale settings */}
                  {selectedQuestion.type === "rating-scale" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Maximum Rating
                      </label>
                      <select
                        value={selectedQuestion.ratingMax || 5}
                        onChange={(e) => updateQuestion(selectedQuestion.id, { ratingMax: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      >
                        <option value={3}>3 Stars</option>
                        <option value={4}>4 Stars</option>
                        <option value={5}>5 Stars</option>
                        <option value={10}>10 Points</option>
                      </select>
                    </div>
                  )}

                  {/* Question Logic */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Question Logic</h3>
                      </div>
                      <button
                        onClick={() => setShowLogic(!showLogic)}
                        className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                      >
                        {showLogic ? "Hide Logic" : "Show Logic"}
                      </button>
                    </div>

                    {showLogic && (
                      <div className="space-y-4">
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Conditional Logic</h4>
                          
                          {selectedQuestion.logic && selectedQuestion.logic.length > 0 ? (
                            <div className="space-y-3">
                              {selectedQuestion.logic.map((rule, index) => (
                                <div key={rule.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Rule {index + 1}</span>
                                      {rule.value && rule.action && (
                                        <span className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                          If answer {rule.condition} &quot;{rule.value}&quot; then {rule.action} 
                                          {rule.targetQuestion && ` Question ${getQuestionNumber(rule.targetQuestion)}`}
                                        </span>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => removeLogicRule(selectedQuestion.id, rule.id)}
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
                                        onChange={(e) => updateLogicRule(selectedQuestion.id, rule.id, { condition: e.target.value })}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                      >
                                        <option value="equals">Equals</option>
                                        <option value="not_equals">Not Equals</option>
                                        <option value="contains">Contains</option>
                                        <option value="not_contains">Not Contains</option>
                                        <option value="greater_than">Greater Than</option>
                                        <option value="less_than">Less Than</option>
                                      </select>
                                    </div>
                                    
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Value</label>
                                      <input
                                        type="text"
                                        value={rule.value}
                                        onChange={(e) => updateLogicRule(selectedQuestion.id, rule.id, { value: e.target.value })}
                                        placeholder="Enter value"
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                      />
                                    </div>
                                  </div>
                                  
                                  <div className="mt-3">
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Action</label>
                                    <select
                                      value={rule.action}
                                      onChange={(e) => updateLogicRule(selectedQuestion.id, rule.id, { action: e.target.value })}
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    >
                                      <option value="show">Show...</option>
                                      <option value="hide">Hide...</option>
                                      <option value="jump_to">Jump to...</option>
                                    </select>
                                  </div>

                                  {/* Target Question Selection - Only show for hide and jump_to actions */}
                                  {
                                  //(rule.action === "hide" || rule.action === "jump_to") && 
                                  (
                                    <div className="mt-3">
                                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {rule.action === "hide" ? "Hide Question" : "Jump to Question"}
                                      </label>
                                      <select
                                        value={rule.targetQuestion || ""}
                                        onChange={(e) => updateLogicRule(selectedQuestion.id, rule.id, { targetQuestion: e.target.value })}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                      >
                                        <option value="">Select a question...</option>
                                        {survey.questions
                                          .filter(q => q.id !== selectedQuestion.id) // Exclude current question
                                          .map((question) => (
                                            <option key={question.id} value={question.id}>
                                              Question {getQuestionNumber(question.id)}: {question.title}
                                            </option>
                                          ))
                                        }
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
                            onClick={() => addLogicRule(selectedQuestion.id)}
                            className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            Add Logic Rule
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Question Selected</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Select a question from the sidebar to edit its settings
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Section - Survey Preview */}
        <div className="w-full lg:w-96 bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
          <div className="sticky top-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">Live Preview</h3>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 sm:p-6">
              {/* Survey Header */}
              <div className="mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 break-words">{survey.title}</h2>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 break-words">{survey.description}</p>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300" 
                    style={{ 
                      width: survey.questions.length > 0 
                        ? `${((currentPreviewQuestion + 1) / survey.questions.length) * 100}%` 
                        : "0%" 
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Question {survey.questions.length > 0 ? currentPreviewQuestion + 1 : 0} of {survey.questions.length}
                </p>
              </div>

              {/* Questions */}
              <div className="space-y-6">
                {survey.questions.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">No questions yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Add questions from the sidebar</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1 break-words">
                        {survey.questions[currentPreviewQuestion].title}
                        {survey.questions[currentPreviewQuestion].required && <span className="text-red-500 ml-1">*</span>}
                      </h3>
                      {survey.questions[currentPreviewQuestion].description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 break-words">{survey.questions[currentPreviewQuestion].description}</p>
                      )}
                    </div>
                    {renderQuestionPreview(survey.questions[currentPreviewQuestion])}
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              {survey.questions.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-8">
                  <button 
                    onClick={prevPreviewQuestion}
                    disabled={currentPreviewQuestion === 0}
                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
                  </button>
                  
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 order-first sm:order-none">
                    <span>Question {currentPreviewQuestion + 1} of {survey.questions.length}</span>
                  </div>
                  
                  <button 
                    onClick={nextPreviewQuestion}
                    disabled={currentPreviewQuestion === survey.questions.length - 1}
                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-purple-700 rounded-lg hover:from-purple-600 hover:to-purple-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <span className="sm:hidden">Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

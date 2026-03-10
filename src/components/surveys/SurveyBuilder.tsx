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
  Filter,
  X
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { QuestionType, Question as BaseQuestion, LogicRule as BaseLogicRule } from "@/types/survey";

// Extended LogicRule with id for component use
interface LogicRule extends BaseLogicRule {
  id: string;
}

// Extended Question with LogicRule that has id
interface Question extends Omit<BaseQuestion, 'logic'> {
  logic?: LogicRule[];
}

interface Survey {
  title: string;
  description: string;
  questions: Question[];
  thankYouMessage: string;
  goal: string;
  user: string;
  status?: string;
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

export default function CreateSurvey({ surveyId }: { surveyId?: string }) {
  const searchParams = useSearchParams();
  const template = searchParams.get("template");
  const [activeTab, setActiveTab] = useState<"builder" | "logics" | "settings">("builder");

  const [showLogic, setShowLogic] = useState(false);
  const [currentPreviewQuestion, setCurrentPreviewQuestion] = useState(0);
  const [isLoading, setIsLoading] = useState(!!surveyId);
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id;
  const { addSurvey, updateSurvey, setSurveys, surveys } = useSurveysStore();

  const [survey, setSurvey] = useState<Survey>(
    !template ? {
      title: "Untitled Survey",
      description: "Survey description",
      questions: [],
      thankYouMessage: "Thank you for your feedback!",
      goal: "Goal",
      user: userId || ""
    } : template === "product-feedback" ? {
      "title": "Untitled Survey",
      "description": "Survey description",
      "questions": [
        {
          "id": "1",
          "type": "short-text",
          "title": "Untitled Question",
          "description": "",
          "required": false,
          "order": 0
        },
        {
          "id": "2",
          "type": "long-text",
          "title": "Untitled Question",
          "description": "",
          "required": false,
          "order": 1
        },
        {
          "id": "3",
          "type": "multiple-choice",
          "title": "Untitled Question",
          "description": "",
          "required": false,
          "options": [
            "Option 1",
            "Option 2"
          ],
          "order": 2
        },
        {
          "id": "4",
          "type": "single-choice",
          "title": "Untitled Question",
          "description": "",
          "required": false,
          "options": [
            "Option 1",
            "Option 2"
          ],
          "order": 3
        },
        {
          "id": "5",
          "type": "rating-scale",
          "title": "Untitled Question",
          "description": "",
          "required": false,
          "ratingMax": 5,
          "order": 4
        },
        {
          "id": "6",
          "type": "date",
          "title": "Untitled Question",
          "description": "",
          "required": false,
          "order": 5
        },
        {
          "id": "7",
          "type": "email",
          "title": "Untitled Question",
          "description": "",
          "required": false,
          "order": 6
        },
        {
          "id": "8",
          "type": "phone",
          "title": "Untitled Question",
          "description": "",
          "required": false,
          "order": 7
        },
        {
          "id": "9",
          "type": "number",
          "title": "Untitled Question",
          "description": "",
          "required": false,
          "order": 8
        }
      ],
      "thankYouMessage": "Thank you for your feedback!",
      "goal": "product feedback",
      "user": userId || ""
    } : template === "customer-satisfaction" ? {
      title: "Untitled Survey",
      description: "Survey description",
      questions: [],
      thankYouMessage: "Thank you for your feedback!",
      goal: "Goal",
      user: userId || ""
    } : template === "market-research" ? {
      title: "Untitled Survey",
      description: "Survey description",
      questions: [],
      thankYouMessage: "Thank you for your feedback!",
      goal: "Goal",
      user: userId || ""
    } : {
      title: "Untitled Survey",
      description: "Survey description",
      questions: [],
      thankYouMessage: "Thank you for your feedback!",
      goal: "Goal",
      user: userId || ""
    }
  );

  // Load survey data from local store when editing
  useEffect(() => {
    if (!surveyId) {
      setIsLoading(false);
      return;
    }

    // Wait for surveys to be loaded (retry mechanism)
    const findSurveyInStore = (surveysList: typeof surveys) => {
      const foundSurvey = surveysList.find(
        (s) => s._id === surveyId || s.id === surveyId
      );

      if (foundSurvey) {
        // Convert questions to ensure logic rules have ids
        const questionsWithLogicIds: Question[] = (foundSurvey.questions || []).map(q => ({
          ...q,
          logic: q.logic?.map((rule, index) => ({
            ...rule,
            id: (rule as LogicRule).id || `rule-${q.id}-${index}-${Date.now()}`,
          })) || undefined,
        }));

        setSurvey({
          title: foundSurvey.title || "Untitled Survey",
          description: foundSurvey.description || "",
          questions: questionsWithLogicIds,
          thankYouMessage: foundSurvey.thankYouMessage || "Thank you for your feedback!",
          goal: foundSurvey.goal || "",
          user: foundSurvey.user || userId || "",
          status: foundSurvey.status || "draft",
        });
        setIsLoading(false);
        return true;
      }
      return false;
    };

    // Try to find survey immediately
    if (findSurveyInStore(surveys)) {
      return;
    }

    // If surveys array is empty, wait a bit for store to load, then retry
    if (surveys.length === 0) {
      let retryCount = 0;
      const maxRetries = 50; // 5 seconds (50 * 100ms) - increased timeout
      let intervalId: NodeJS.Timeout | null = null;

      intervalId = setInterval(() => {
        retryCount++;
        // Re-check surveys from store on each retry
        const currentSurveys = useSurveysStore.getState().surveys;

        if (findSurveyInStore(currentSurveys)) {
          if (intervalId) clearInterval(intervalId);
        } else if (retryCount >= maxRetries) {
          if (intervalId) clearInterval(intervalId);
          const finalSurveys = useSurveysStore.getState().surveys;
          if (finalSurveys.length === 0) {
            console.error("Surveys not loaded in store after waiting");
            alert("Unable to load survey. The surveys list is still loading. Please wait a moment and try again.");
            setIsLoading(false);
            window.location.href = '/surveys';
          } else {
            // Surveys loaded but survey not found
            console.error("Survey not found in local store. Survey ID:", surveyId, "Available surveys:", finalSurveys.map(s => s._id || s.id));
            alert("Survey not found. Please try again.");
            setIsLoading(false);
            window.location.href = '/surveys';
          }
        }
      }, 100); // Check every 100ms

      return () => {
        if (intervalId) clearInterval(intervalId);
      };
    } else {
      // Surveys are loaded but survey not found
      console.error("Survey not found in local store. Survey ID:", surveyId, "Available surveys:", surveys.map(s => s._id || s.id));
      alert("Survey not found. Please try again.");
      setIsLoading(false);
      window.location.href = '/surveys';
    }
  }, [surveyId, surveys, userId]);


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
    setCurrentPreviewQuestion(survey.questions.length);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.map(q => q.id === id ? { ...q, ...updates } : q)
    }));


  };

  const deleteQuestion = (id: string) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id).map((q, index) => ({ ...q, order: index }))
    }));

    if (currentPreviewQuestion >= survey.questions.length - 1) {
      setCurrentPreviewQuestion(Math.max(0, survey.questions.length - 2));
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


  const handleSave = async () => {
    try {
      if (!survey.title || survey.title.trim() === "") {
        alert("Please enter a survey title");
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || "http://localhost:5000";
      if (!baseUrl) {
        console.error("BACKEND_URL or NEXT_PUBLIC_API_BASE_URL is not set");
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
          status: survey.status || "draft",
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

      // After successful save, refetch all surveys to sync store with database
      if (userId) {
        try {
          const fetchAllSurveysEndpoint = `${baseUrl.replace(/\/+$/, "")}/surveys?userId=${encodeURIComponent(userId)}`;
          const surveysResponse = await fetch(fetchAllSurveysEndpoint, {
            method: "GET",
          });

          if (surveysResponse.ok) {
            const surveysData = await surveysResponse.json().catch(() => null);
            const allSurveys = surveysData?.surveys || surveysData?.survey || (Array.isArray(surveysData) ? surveysData : []);
            if (Array.isArray(allSurveys)) {
              // Update store with latest surveys from database
              setSurveys(allSurveys);
            }
          }
        } catch (fetchError) {
          console.error("Error fetching updated surveys:", fetchError);
          // If refetch fails, still add survey to store
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
        }
      }

      alert("Survey saved successfully!");
      window.location.href = '/surveys';
    } catch (error) {
      console.error("Error saving survey:", error);
      alert("An error occurred while saving the survey. Please try again.");
    }
  };

  const handleUpdate = async () => {
    try {
      if (!surveyId) {
        alert("Survey ID is missing. Cannot update.");
        return;
      }

      if (!survey.title || survey.title.trim() === "") {
        alert("Please enter a survey title");
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || "http://localhost:5000";
      if (!baseUrl) {
        console.error("BACKEND_URL or NEXT_PUBLIC_API_BASE_URL is not set");
        alert("API configuration error. Please contact support.");
        return;
      }

      const endpoint = `${baseUrl.replace(/\/+$/, "")}/surveys/${surveyId}${userId ? `?userId=${encodeURIComponent(userId)}` : ""}`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: survey.title,
          description: survey.description || "",
          questions: survey.questions || [],
          thankYouMessage: survey.thankYouMessage || "",
          goal: survey.goal || "",
          status: survey.status || "draft",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("Failed to update survey", errorData);
        alert(`Failed to update survey: ${errorData.error || response.statusText}`);
        return;
      }

      const data = await response.json();
      console.log("Survey updated successfully", data);

      // After successful update, refetch all surveys to sync store with database
      if (userId) {
        try {
          const fetchAllSurveysEndpoint = `${baseUrl.replace(/\/+$/, "")}/surveys?userId=${encodeURIComponent(userId)}`;
          const surveysResponse = await fetch(fetchAllSurveysEndpoint, {
            method: "GET",
          });

          if (surveysResponse.ok) {
            const surveysData = await surveysResponse.json().catch(() => null);
            const allSurveys = surveysData?.surveys || surveysData?.survey || (Array.isArray(surveysData) ? surveysData : []);
            if (Array.isArray(allSurveys)) {
              // Update store with latest surveys from database
              setSurveys(allSurveys);
            }
          }
        } catch (fetchError) {
          console.error("Error fetching updated surveys:", fetchError);
          // If refetch fails, still update store with the updated survey data
          const updatedSurvey = data.survey || data;
          if (updatedSurvey) {
            updateSurvey(surveyId, {
              title: updatedSurvey.title || survey.title,
              description: updatedSurvey.description || survey.description,
              questions: updatedSurvey.questions || survey.questions,
              thankYouMessage: updatedSurvey.thankYouMessage || survey.thankYouMessage,
              goal: updatedSurvey.goal || survey.goal,
              status: updatedSurvey.status || "draft",
              updatedAt: updatedSurvey.updatedAt,
            });
          }
        }
      }

      alert("Survey updated successfully!");
      window.location.href = '/surveys';
    } catch (error) {
      console.error("Error updating survey:", error);
      alert("An error occurred while updating the survey. Please try again.");
    }
  };


  console.log("survey builder", survey);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading survey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href='/surveys' className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
                {surveyId ? "Edit Survey" : "Survey Builder"}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                {surveyId ? "Edit and customize your survey" : "Create and customize your survey"}
              </p>
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
              onClick={surveyId ? handleUpdate : handleSave}
              className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">{surveyId ? "Update Survey" : "Save Survey"}</span>
              <span className="sm:hidden">{surveyId ? "Update" : "Save"}</span>
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
                className={`flex-1 px-2 py-2 text-xs font-medium rounded-md transition-colors ${activeTab === "builder"
                  ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
              >
                Builder
              </button>
              <button
                onClick={() => setActiveTab("logics")}
                className={`flex-1 px-2 py-2 text-xs font-medium rounded-md transition-colors ${activeTab === "logics"
                  ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
              >
                Logics
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`flex-1 px-2 py-2 text-xs font-medium rounded-md transition-colors ${activeTab === "settings"
                  ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
              >
                Settings
              </button>
            </div>
          </div>

          {/* Content */}
          {activeTab === "builder" && (
            <div className="flex-1 flex flex-col h-full">
              <div className="p-4 space-y-6">
                {/* Question Types */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Add Elements</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {questionTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => addQuestion(type.id as QuestionType)}
                        className="flex items-center gap-3 p-3 text-left text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-800 hover:shadow-md transition-all group"
                      >
                        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform shadow-sm">
                          {type.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm">{type.label}</div>
                          <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">{type.id.replace('-', ' ')}</div>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-medium text-gray-400 group-hover:text-purple-500 transition-colors"><span>Add</span><Plus className="w-4 h-4" /></div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "logics" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 text-left">Overall Logic Configuration</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 text-left">Manage all question branchings and conditions from here.</p>

                <div className="space-y-4">
                  {survey.questions.map((q, idx) => (
                    <div key={q.id} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-400">Q{idx + 1}</span>
                        <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full">
                          {q.logic?.length || 0} Rules
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate mb-2 text-left">{q.title}</p>
                      <button
                        onClick={() => {
                          setActiveTab("builder");
                          setCurrentPreviewQuestion(idx);
                          setShowLogic(true);
                        }}
                        className="w-full text-xs py-1.5 text-center text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800 transition-colors"
                      >
                        Manage Logic
                      </button>
                    </div>
                  ))}
                  {survey.questions.length === 0 && (
                    <div className="text-center py-10 opacity-50">
                      <Filter className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-xs text-gray-500">No questions to add logic to.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
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

        {/* Right Section - Editable Live Preview (Replacing Middle & Right) */}
        <div className="flex-1 bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 overflow-y-auto custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Survey Editor</h3>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 sm:p-6">
              {/* Survey Header editable */}
              <div className="mb-8 border-b border-gray-100 dark:border-gray-700 pb-6">
                <input
                  type="text"
                  value={survey.title}
                  onChange={(e) => setSurvey(prev => ({ ...prev, title: e.target.value }))}
                  className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 w-full bg-transparent border-b border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus:border-purple-500 focus:outline-none transition-colors px-0 py-1"
                  placeholder="Survey Title"
                />
                <textarea
                  value={survey.description}
                  onChange={(e) => setSurvey(prev => ({ ...prev, description: e.target.value }))}
                  className="text-sm sm:text-base text-gray-600 dark:text-gray-400 w-full bg-transparent border-b border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus:border-purple-500 focus:outline-none transition-colors resize-none px-0 py-1"
                  placeholder="Survey Description"
                  rows={2}
                />
              </div>

              {/* Questions */}
              <div className="space-y-6">
                {survey.questions.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h4 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No questions yet</h4>
                    <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">Click any element in the left sidebar to add your first question and start building your survey.</p>
                  </div>
                ) : (
                  survey.questions.map((question, qIdx) => {
                    const isActive = currentPreviewQuestion === qIdx;
                    return (
                      <div
                        key={question.id}
                        className={`p-5 sm:p-6 rounded-2xl border-2 transition-all duration-200 ${isActive ? "border-purple-500 shadow-lg bg-white dark:bg-gray-800" : "border-transparent border-gray-100 dark:border-gray-700 hover:border-purple-300 bg-gray-50/50 dark:bg-gray-800/40 cursor-pointer"}`}
                        onClick={() => !isActive && setCurrentPreviewQuestion(qIdx)}
                      >
                        <div className="flex items-start justify-between gap-4 mb-5">
                          <div className="flex-1 flex gap-3 sm:gap-4">
                            <span className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${isActive ? "bg-purple-600 text-white" : "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"}`}>
                              {qIdx + 1}
                            </span>
                            <div className="flex-1">
                              {isActive ? (
                                <input
                                  type="text"
                                  value={question.title}
                                  onChange={(e) => updateQuestion(question.id, { title: e.target.value })}
                                  className="w-full text-lg sm:text-xl font-medium bg-transparent border-b border-gray-200 dark:border-gray-700 hover:border-gray-300 focus:border-purple-500 focus:outline-none pb-1"
                                  placeholder="Question Title"
                                />
                              ) : (
                                <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white">
                                  {question.title}
                                  {question.required && <span className="text-red-500 ml-1.5">*</span>}
                                </h3>
                              )}

                              {(isActive || question.description) && (
                                isActive ? (
                                  <textarea
                                    value={question.description || ""}
                                    onChange={(e) => updateQuestion(question.id, { description: e.target.value })}
                                    className="w-full mt-2 text-sm text-gray-600 dark:text-gray-400 bg-transparent border-b border-gray-200 dark:border-gray-700 hover:border-gray-300 focus:border-purple-500 focus:outline-none resize-none pb-1"
                                    placeholder="Description (Optional)"
                                    rows={1}
                                  />
                                ) : (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{question.description}</p>
                                )
                              )}
                            </div>
                          </div>

                          {isActive && (
                            <div className="flex items-center gap-1.5 flex-shrink-0 border bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 p-1 rounded-lg">
                              <button onClick={(e) => { e.stopPropagation(); moveQuestion(question.id, "up"); }} disabled={qIdx === 0} className="p-1.5 text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded disabled:opacity-30"><ArrowLeft className="w-4 h-4 rotate-90" /></button>
                              <button onClick={(e) => { e.stopPropagation(); moveQuestion(question.id, "down"); }} disabled={qIdx === survey.questions.length - 1} className="p-1.5 text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded disabled:opacity-30"><ArrowLeft className="w-4 h-4 -rotate-90" /></button>
                              <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                              <button onClick={(e) => { e.stopPropagation(); deleteQuestion(question.id); }} className="p-1.5 text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          )}
                        </div>

                        {/* Interactive Preview Element */}
                        <div className="mt-4 pl-0 sm:pl-12">
                          {question.type === "short-text" && (
                            <input type="text" placeholder="Short text answer..." className="w-full p-3 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white" disabled={!isActive} />
                          )}
                          {question.type === "long-text" && (
                            <textarea placeholder="Long text answer..." rows={3} className="w-full p-3 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white" disabled={!isActive} />
                          )}
                          {(question.type === "multiple-choice" || question.type === "single-choice") && (
                            <div className="space-y-3">
                              {question.options?.map((opt, oIdx) => (
                                <div key={oIdx} className="flex items-center gap-3">
                                  {question.type === "multiple-choice" ? (
                                    <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-500 rounded flex-shrink-0"></div>
                                  ) : (
                                    <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-500 rounded-full flex-shrink-0"></div>
                                  )}
                                  {isActive ? (
                                    <div className="flex items-center gap-2 flex-1">
                                      <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => updateOption(question.id, oIdx, e.target.value)}
                                        className="flex-1 px-3 py-1.5 text-base border-b border-transparent hover:border-gray-200 focus:border-purple-500 focus:outline-none bg-transparent"
                                      />
                                      {question.options!.length > 1 && (
                                        <button onClick={() => removeOption(question.id, oIdx)} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"><X className="w-4 h-4" /></button>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-700 py-1.5 dark:text-gray-300 text-base">{opt}</span>
                                  )}
                                </div>
                              ))}
                              {isActive && (
                                <button onClick={() => addOption(question.id)} className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 px-3 py-2 rounded-lg mt-3 font-medium transition-colors">
                                  <Plus className="w-4 h-4" /> Add Option
                                </button>
                              )}
                            </div>
                          )}
                          {question.type === "rating-scale" && (
                            <div className="space-y-4">
                              <div className="flex gap-2">
                                {Array.from({ length: question.ratingMax || 5 }, (_, i) => (
                                  <button key={i} disabled className="w-10 h-10 text-gray-300 dark:text-gray-600"><Star className="w-8 h-8" /></button>
                                ))}
                              </div>
                              {isActive && (
                                <div className="flex items-center gap-3 mt-4 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-700 w-fit">
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Max Rating:</span>
                                  <select
                                    value={question.ratingMax || 5}
                                    onChange={(e) => updateQuestion(question.id, { ratingMax: parseInt(e.target.value) })}
                                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 font-medium"
                                  >
                                    <option value={3}>3</option>
                                    <option value={4}>4</option>
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                  </select>
                                </div>
                              )}
                            </div>
                          )}
                          {question.type === "date" && <input type="date" className="w-full p-3 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white" disabled={!isActive} />}
                          {question.type === "email" && <input type="email" placeholder="Email address..." className="w-full p-3 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white" disabled={!isActive} />}
                          {question.type === "phone" && <input type="tel" placeholder="Phone number..." className="w-full p-3 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white" disabled={!isActive} />}
                          {question.type === "number" && <input type="number" placeholder="Numeric value..." className="w-full p-3 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white" disabled={!isActive} />}
                        </div>

                        {/* Settings & Logic Bar */}
                        {isActive && (
                          <div className="mt-8 pt-5 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4 pl-0 sm:pl-12">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center">
                                <span className="mr-3 text-sm font-medium text-gray-700 dark:text-gray-300">Required Question</span>
                                <button onClick={() => updateQuestion(question.id, { required: !question.required })} className="flex items-center gap-2 outline-none">
                                  {question.required ? <ToggleRight className="w-8 h-8 text-purple-600" /> : <ToggleLeft className="w-8 h-8 text-gray-400 hover:text-gray-500" />}
                                </button>
                              </div>
                            </div>

                            <button onClick={() => setShowLogic(!showLogic)} className={`text-sm font-medium flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${showLogic ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"}`}>
                              <Filter className="w-4 h-4" />
                              {showLogic ? "Hide Logic" : "Logic Rules"}
                            </button>
                          </div>
                        )}

                        {/* Logic Editor */}
                        {isActive && showLogic && (
                          <div className="mt-4 p-5 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 pl-0 sm:pl-12">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Filter className="w-4 h-4 text-purple-500" />
                                Branching & Logic
                              </h4>
                            </div>

                            {question.logic && question.logic.length > 0 ? (
                              <div className="space-y-3 mb-4">
                                {question.logic.map((rule, idx) => (
                                  <div key={rule.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm relative group">
                                    <div className="absolute -left-2 -top-2 w-6 h-6 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full flex items-center justify-center text-xs font-bold border border-purple-200 dark:border-purple-700">
                                      {idx + 1}
                                    </div>
                                    <button onClick={() => removeLogicRule(question.id, rule.id)} className="absolute right-2 top-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3 mt-1">
                                      <div>
                                        <label className="text-xs text-gray-500 mb-1 block uppercase tracking-wide">If answer</label>
                                        <select value={rule.condition} onChange={(e) => updateLogicRule(question.id, rule.id, { condition: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700">
                                          <option value="equals">Equals</option>
                                          <option value="not_equals">Does Not Equal</option>
                                          <option value="contains">Contains</option>
                                          <option value="not_contains">Does Not Contain</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="text-xs text-gray-500 mb-1 block uppercase tracking-wide">Value</label>
                                        <input type="text" value={rule.value} onChange={(e) => updateLogicRule(question.id, rule.id, { value: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700" placeholder="Type answer value..." />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <div>
                                        <label className="text-xs text-gray-500 mb-1 block uppercase tracking-wide">Then</label>
                                        <select value={rule.action} onChange={(e) => updateLogicRule(question.id, rule.id, { action: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700">
                                          <option value="show">Show</option>
                                          <option value="hide">Hide</option>
                                          <option value="jump_to">Jump To</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="text-xs text-gray-500 mb-1 block uppercase tracking-wide">Target</label>
                                        <select value={rule.targetQuestion || ""} onChange={(e) => updateLogicRule(question.id, rule.id, { targetQuestion: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700">
                                          <option value="">Select Target...</option>
                                          {survey.questions.filter(q => q.id !== question.id).map(q => (
                                            <option key={q.id} value={q.id}>Q: {q.title}</option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="py-4 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl mb-4">
                                <Filter className="w-6 h-6 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">No logic rules assigned.</p>
                              </div>
                            )}
                            <button onClick={() => addLogicRule(question.id)} className="w-full text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:border-purple-300 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors">
                              <Plus className="w-4 h-4" /> Add Logic Rule
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

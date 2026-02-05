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
  X,
  ChevronLeft,
  ChevronRight
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
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
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

      const baseUrl = process.env.BACKEND_URL || "http://localhost:5000";
      if (!baseUrl) {
        console.error("BACKEND_URL");
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
                        <Plus className="w-4 h-4 text-gray-300 group-hover:text-purple-500 transition-colors" />
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
                          setSelectedQuestion(q);
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

        {/* Middle Section - Question List & Settings */}
        <div className="flex-1 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
          {/* Question Selector List (Switch between questions) */}
          {survey.questions.length > 0 && (
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2 whitespace-nowrap">Switch Qs:</span>
              <div className="flex items-center gap-1.5">
                {survey.questions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => setSelectedQuestion(q)}
                    className={`h-8 min-w-[32px] px-2 rounded-lg flex items-center justify-center text-xs font-semibold transition-all ${selectedQuestion?.id === q.id
                      ? "bg-purple-600 text-white shadow-md shadow-purple-500/20 scale-105"
                      : "bg-white dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700 hover:border-purple-300"
                      }`}
                  >
                    Q{idx + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
            {selectedQuestion ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Question Settings</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => moveQuestion(selectedQuestion.id, "up")}
                      disabled={getQuestionNumber(selectedQuestion.id) === 1}
                      className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 bg-gray-50 dark:bg-gray-700 rounded-lg disabled:opacity-30 transition-colors"
                      title="Move Up"
                    >
                      <ArrowLeft className="w-4 h-4 rotate-90" />
                    </button>
                    <button
                      onClick={() => moveQuestion(selectedQuestion.id, "down")}
                      disabled={getQuestionNumber(selectedQuestion.id) === survey.questions.length}
                      className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 bg-gray-50 dark:bg-gray-700 rounded-lg disabled:opacity-30 transition-colors"
                      title="Move Down"
                    >
                      <ArrowLeft className="w-4 h-4 -rotate-90" />
                    </button>
                    <button
                      onClick={() => deleteQuestion(selectedQuestion.id)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 bg-red-50 dark:bg-red-900/10 rounded-lg transition-colors"
                      title="Delete Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

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
                                        .filter(q => q.id !== selectedQuestion.id)
                                        .map((question) => (
                                          <option key={question.id} value={question.id}>
                                            Question {getQuestionNumber(question.id)}: {question.title}
                                          </option>
                                        ))
                                      }
                                    </select>
                                  </div>
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
            ) : (
              <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto">
                <div className="w-20 h-20 bg-purple-50 dark:bg-purple-900/20 rounded-3xl flex items-center justify-center mb-6 text-purple-600 transition-transform hover:scale-110">
                  <FileText className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Build Your Survey</h3>
                <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
                  {survey.questions.length > 0
                    ? "Select a question from the top bar to edit or add a new one from the builder tab."
                    : "Start by picking a question type from the sidebar on the left. Your questions will appear here for editing."}
                </p>

                {survey.questions.length > 0 && (
                  <div className="grid grid-cols-1 w-full gap-3">
                    {survey.questions.map((q, idx) => (
                      <button
                        key={q.id}
                        onClick={() => setSelectedQuestion(q)}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 transition-all group hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg hover:shadow-purple-500/5"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400 group-hover:text-purple-600 transition-colors shadow-sm border border-gray-100 dark:border-gray-700">
                            {idx + 1}
                          </span>
                          <div className="text-left">
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate max-w-[200px]">{q.title}</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-tighter">{q.type.replace('-', ' ')}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-purple-500 transition-all transform group-hover:translate-x-1" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
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

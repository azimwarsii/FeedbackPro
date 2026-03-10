"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Star,
  FileText,
  Gift
} from "lucide-react";
import Button from "@/components/ui/button/Button";


interface QuestionLogic {
  id?: string; // Logic rule ID
  condition: "equals" | "not_equals" | "contains" | "not_contains" | "less_than" | "greater_than";
  value: string; // Value to compare against
  action: "hide" | "show" | "jump_to";
  targetQuestion: string; // ID of the question to affect (for hide/show) or jump to (for jump_to)
}

interface Question {
  id: string;
  type: "short-text" | "long-text" | "multiple-choice" | "single-choice" | "rating-scale" | "date" | "email" | "phone" | "number";
  title: string;
  description: string;
  required: boolean;
  options?: string[];
  ratingMax?: number;
  order: number;
  logic?: QuestionLogic[]; // Conditional logic rules
}

interface Survey {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  questions: Question[];
  thankYouMessage: string;
  responses?: number;
}

interface Campaign {
  _id?: string;
  id?: string;
  name: string;
  description: string;
  contacts?: Array<{ name: string; email: string; phone: string; filled?: boolean }>;
  survey?: string; // Survey ID (undefined for external surveys)
  externalSurveyLink?: string; // External survey URL
  code?: string; // 8-digit code for external survey
  user?: string; // Campaign owner/user ID
  userId?: string; // Alternative field name for user ID
  responses?: number;
  reward?: {
    type: "cash reward" | "promo code";
    amount?: number;
    amount_utilized?: number; // For cash reward
    code?: string; // For promo code
    description?: string; // For promo code
    codes_utilized?: number; // For promo code
  };
}

export default function FeedbackPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const campaignId = params.campaignId as string;
  useSession();

  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [survey, setSurvey] = useState<Survey | null>(null);
  // Removed emailVerified state
  const [botDetected, setBotDetected] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyFilled, setAlreadyFilled] = useState(false);
  const [formData, setFormData] = useState<Record<string, string | number | string[] | null>>({});
  const [submitted, setSubmitted] = useState(false);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [hiddenQuestions, setHiddenQuestions] = useState<Set<string>>(new Set());
  const [codeVerified, setCodeVerified] = useState(false);

  // New state for mobile verification
  const [showMobileInput, setShowMobileInput] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [verifyingMobile, setVerifyingMobile] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);

  // Honeypot field for bot detection (hidden from users)
  const [honeypot, setHoneypot] = useState("");

  // Bot detection metrics
  const [botMetrics, setBotMetrics] = useState({
    mouseMovements: 0,
    keystrokes: 0,
    scrollEvents: 0,
    focusEvents: 0,
    blurEvents: 0,
    timeOnPage: 0,
    averageTypingSpeed: 0,
    typingIntervals: [] as number[],
    lastTypingTime: 0,
    mousePositions: [] as Array<{ x: number; y: number; timestamp: number }>,
    suspiciousPatterns: 0,
  });

  // Track user interaction for bot detection
  useEffect(() => {
    const handleMouseMove = () => {
      setBotMetrics(prev => ({ ...prev, mouseMovements: prev.mouseMovements + 1 }));
    };
    const handleKeyDown = () => {
      setBotMetrics(prev => ({ ...prev, keystrokes: prev.keystrokes + 1 }));
    };
    const handleScroll = () => {
      setBotMetrics(prev => ({ ...prev, scrollEvents: prev.scrollEvents + 1 }));
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll);

    const startTime = Date.now();
    const interval = setInterval(() => {
      setBotMetrics(prev => ({ ...prev, timeOnPage: Math.floor((Date.now() - startTime) / 1000) }));
    }, 1000);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || "http://localhost:5000";
        // Don't pass userId for public access - backend allows this for feedback links
        const url = `${baseUrl.replace(/\/+$/, "")}/campaigns/${campaignId}`;
        console.log("Fetching campaign from:", url);

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
          console.error("Campaign fetch error:", response.status, errorData);

          if (response.status === 404) {
            setError("Campaign not found. Please check the link and try again.");
          } else if (response.status === 403) {
            setError("You are not authorized to view this campaign.");
          } else {
            setError(`Failed to load campaign: ${errorData.error || response.statusText}`);
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        console.log("Campaign data received:", data);
        const campaignData = data?.campaign || data;

        if (!campaignData || (!campaignData._id && !campaignData.id)) {
          setError("Invalid campaign data received");
          setLoading(false);
          return;
        }

        setCampaign(campaignData);

        // Check if survey is populated or if we need to fetch it separately
        let surveyData = null;
        if (campaignData.survey) {
          // If survey is populated (object), use it directly
          if (typeof campaignData.survey === 'object' && campaignData.survey._id) {
            surveyData = campaignData.survey;
            console.log("Survey data from populated field:", surveyData);
          } else {
            // If survey is just an ID, fetch it separately
            const surveyId = campaignData.survey;
            const surveyUrl = `${baseUrl.replace(/\/+$/, "")}/surveys/${surveyId}`;
            console.log("Fetching survey from:", surveyUrl);
            const surveyResponse = await fetch(surveyUrl);
            if (surveyResponse.ok) {
              const surveyResponseData = await surveyResponse.json();
              surveyData = surveyResponseData?.survey || surveyResponseData;
              console.log("Survey data received:", surveyData);
            } else {
              console.error("Survey fetch error:", surveyResponse.status);
              setError("Failed to load survey for this campaign");
              setLoading(false);
              return;
            }
          }
        }

        if (surveyData) {
          setSurvey(surveyData);
        } else if (campaignData.externalSurveyLink) {
          // External survey - no error, just don't set survey
          // The UI will show external survey link and code input
          console.log("External survey detected:", campaignData.externalSurveyLink);
        } else {
          setError("This campaign does not have a survey");
        }

        // Check for code in URL params and verify
        const codeFromUrl = searchParams.get('code');
        if (codeFromUrl && campaignData.code && codeFromUrl.toUpperCase() === campaignData.code.toUpperCase()) {
          setCodeVerified(true);
        }

      } catch (err) {
        console.error("Error fetching campaign:", err);
        setError(`Failed to load campaign: ${err instanceof Error ? err.message : "Unknown error"}`);
      } finally {
        setLoading(false);
      }
    };

    if (campaignId) {
      fetchCampaign();
    }
  }, [campaignId, searchParams]); // Add searchParams to dependency if we use it, but careful about loops. 
  // Actually, better to just read it once. eslint-disable-line or similar.

  // Removed email verification effect


  // Check bot detection (honeypot should be empty)
  useEffect(() => {
    if (honeypot !== "") {
      setBotDetected(true);
      setError("Bot detected. Please try again.");
    }
  }, [honeypot]);

  // Get visible questions sorted by order
  const getVisibleQuestions = useCallback(() => {
    if (!survey) return [];
    return survey.questions
      .filter(q => !hiddenQuestions.has(q.id))
      .sort((a, b) => a.order - b.order);
  }, [survey, hiddenQuestions]);

  // Evaluate logic for a question
  // Logic checks the current question's answer and applies action to targetQuestion
  const evaluateLogic = (logic: QuestionLogic, currentQuestionId: string, formData: Record<string, string | number | string[] | null>): boolean => {
    const sourceAnswer = formData[currentQuestionId];

    // If no answer, condition is not met
    if (sourceAnswer === undefined || sourceAnswer === null || sourceAnswer === "") {
      return false;
    }

    // Convert answer to string for comparison
    // For arrays (multiple choice), join with comma
    const sourceStr = Array.isArray(sourceAnswer)
      ? sourceAnswer.join(",")
      : String(sourceAnswer);
    const compareStr = String(logic.value);

    switch (logic.condition) {
      case "equals":
        return sourceStr === compareStr;
      case "not_equals":
        return sourceStr !== compareStr;
      case "contains":
        return sourceStr.toLowerCase().includes(compareStr.toLowerCase());
      case "not_contains":
        return !sourceStr.toLowerCase().includes(compareStr.toLowerCase());
      case "less_than":
        // For numeric comparison, try to parse as numbers
        const sourceNum = parseFloat(sourceStr);
        const compareNum = parseFloat(compareStr);
        if (!isNaN(sourceNum) && !isNaN(compareNum)) {
          return sourceNum < compareNum;
        }
        // Fallback to string comparison
        return sourceStr < compareStr;
      case "greater_than":
        // For numeric comparison, try to parse as numbers
        const sourceNum2 = parseFloat(sourceStr);
        const compareNum2 = parseFloat(compareStr);
        if (!isNaN(sourceNum2) && !isNaN(compareNum2)) {
          return sourceNum2 > compareNum2;
        }
        // Fallback to string comparison
        return sourceStr > compareStr;
      default:
        return false;
    }
  };

  // Apply logic rules and update hidden questions
  const applyQuestionLogic = useCallback((updatedFormData: Record<string, string | number | string[] | null>) => {
    if (!survey) return;

    const newHiddenQuestions = new Set<string>();

    // Process each question's logic rules
    // We need to evaluate ALL logic rules from ALL questions to determine what should be hidden
    survey.questions.forEach((question) => {
      if (!question.logic || question.logic.length === 0) return;

      question.logic.forEach((rule) => {
        // Skip if targetQuestion is empty
        if (!rule.targetQuestion || rule.targetQuestion.trim() === "") return;

        // Evaluate logic based on the question that has the logic rule
        const conditionMet = evaluateLogic(rule, question.id, updatedFormData);

        if (conditionMet) {
          if (rule.action === "hide") {
            // Hide the target question
            newHiddenQuestions.add(rule.targetQuestion);
          } else if (rule.action === "show") {
            // Show the target question (remove from hidden set)
            // Don't add it, it will remain visible
          }
          // jump_to is handled in handleNext, doesn't affect hidden state
        } else {
          // If condition not met, reverse the action
          if (rule.action === "hide") {
            // If hide condition not met, show the target question (don't add to hidden)
            // Don't add it, it will remain visible
          } else if (rule.action === "show") {
            // If show condition not met, hide the target question
            newHiddenQuestions.add(rule.targetQuestion);
          }
        }
      });
    });

    // Get current question using current hiddenQuestions state (before update)
    const currentVisibleQuestions = survey.questions
      .filter(q => !hiddenQuestions.has(q.id))
      .sort((a, b) => a.order - b.order);
    const currentQuestion = currentVisibleQuestions[currentStep];
    const currentQuestionId = currentQuestion?.id;

    // Check deep equality to avoid infinite loops
    let hasChanged = false;
    if (hiddenQuestions.size !== newHiddenQuestions.size) {
      hasChanged = true;
    } else {
      for (const id of newHiddenQuestions) {
        if (!hiddenQuestions.has(id)) {
          hasChanged = true;
          break;
        }
      }
    }

    if (!hasChanged) return;

    // Update hidden questions state
    setHiddenQuestions(newHiddenQuestions);

    // Adjust step if current question becomes hidden
    // We need to re-calculate visible questions based on the NEW hidden set
    const nextVisibleQuestions = survey.questions
      .filter(q => !newHiddenQuestions.has(q.id))
      .sort((a, b) => a.order - b.order);

    if (nextVisibleQuestions.length > 0) {
      if (!currentQuestionId || newHiddenQuestions.has(currentQuestionId)) {
        // Current question hidden, go to start
        setCurrentStep(0);
      } else {
        // Find new index
        const newIndex = nextVisibleQuestions.findIndex(q => q.id === currentQuestionId);
        if (newIndex !== -1 && newIndex !== currentStep) {
          setCurrentStep(newIndex);
        } else if (currentStep >= nextVisibleQuestions.length) {
          setCurrentStep(Math.max(0, nextVisibleQuestions.length - 1));
        }
      }
    } else {
      // No visible questions
      setCurrentStep(0);
    }
  }, [survey, hiddenQuestions, currentStep]);

  useEffect(() => {
    if (!survey || !showSurvey) return;

    applyQuestionLogic(formData);
  }, [formData, survey, showSurvey, applyQuestionLogic]);

  // Adjust step when hidden questions change
  useEffect(() => {
    if (!survey) return;

    const visibleQuestions = getVisibleQuestions();

    if (visibleQuestions.length === 0) {
      if (currentStep !== 0) setCurrentStep(0);
      return;
    }

    // If current step is beyond visible questions, adjust it
    if (currentStep >= visibleQuestions.length) {
      const newStep = Math.max(0, visibleQuestions.length - 1);
      if (newStep !== currentStep) setCurrentStep(newStep);
      return;
    }

    // If current question is hidden, go to first visible
    const currentQuestion = visibleQuestions[currentStep];
    if (!currentQuestion && currentStep !== 0) {
      setCurrentStep(0);
    }
  }, [hiddenQuestions, survey, currentStep, getVisibleQuestions]);

  const surveyInitializedRef = React.useRef(false);

  // Show survey once all checks pass
  // Show survey once checks pass (removed emailVerified check)
  useEffect(() => {
    if (
      (surveyInitializedRef.current && showSurvey) ||
      botDetected ||
      !survey
    ) {
      return;
    }

    surveyInitializedRef.current = true;

    setShowSurvey(true);
    setStartedAt(new Date());
    setCurrentStep(0);

    // Initial hidden questions (ONLY ONCE)
    const initialHidden = new Set<string>();

    survey.questions.forEach((question) => {
      question.logic?.forEach((rule) => {
        if (!rule.targetQuestion) return;

        // For "show", hide by default unless condition is met
        if (rule.action === "show") {
          initialHidden.add(rule.targetQuestion);
        }
      });
    });

    setHiddenQuestions(initialHidden);
  }, [botDetected, survey, showSurvey]);




  const handleInputChange = (questionId: string, value: string | number | string[] | null) => {
    // Update form data immediately
    const updatedFormData = {
      ...formData,
      [questionId]: value
    };

    // Update state (async, but we use updatedFormData directly)
    setFormData(updatedFormData);

    // Apply logic immediately with updated form data
    // This will evaluate all logic rules based on the new answer
    applyQuestionLogic(updatedFormData);

    // Check if current question has jump_to logic that should auto-advance
    // We need to get the question from survey directly since state might be stale
    if (!survey) return;

    const currentQuestion = survey.questions.find(q => q.id === questionId);
    if (currentQuestion && currentQuestion.logic) {
      // Get visible questions after logic is applied (will be updated by applyQuestionLogic)
      // We'll check this after a short delay to allow state to update
      setTimeout(() => {
        const visibleQuestions = getVisibleQuestions();
        const currentIndex = visibleQuestions.findIndex(q => q.id === questionId);

        // Check for jump_to actions
        if (currentQuestion.logic) {
          for (const rule of currentQuestion.logic) {
            if (rule.action === "jump_to" && rule.targetQuestion && rule.targetQuestion.trim() !== "") {
              const conditionMet = evaluateLogic(rule, questionId, updatedFormData);
              if (conditionMet) {
                // Find target in visible questions
                const targetIndex = visibleQuestions.findIndex(q => q.id === rule.targetQuestion);
                if (targetIndex !== -1) {
                  setCurrentStep(targetIndex);
                  return;
                }
              }
            }
          }
        }

        // For single-choice and rating-scale, auto-advance to next question after selection
        // (unless there's a jump_to that was already handled)
        if ((currentQuestion.type === "single-choice" || currentQuestion.type === "rating-scale") &&
          currentIndex !== -1 &&
          currentIndex < visibleQuestions.length - 1) {
          // Check if there's any jump_to logic that might prevent auto-advance
          const hasJumpLogic = currentQuestion.logic?.some(rule =>
            rule.action === "jump_to" &&
            evaluateLogic(rule, questionId, updatedFormData)
          );

          if (!hasJumpLogic) {
            // Auto-advance to next question
            setCurrentStep(currentIndex + 1);
          }
        }
      }, 150);
    }
  };

  // Get current question
  const getCurrentQuestion = () => {
    const visibleQuestions = getVisibleQuestions();
    return visibleQuestions[currentStep] || null;
  };

  // Navigate to next question
  const handleNext = () => {
    const visibleQuestions = getVisibleQuestions();
    const currentQuestion = getCurrentQuestion();

    if (!currentQuestion) return;

    // Check if current question has logic with jump_to action
    if (currentQuestion.logic) {
      for (const rule of currentQuestion.logic) {
        if (rule.action === "jump_to" && rule.targetQuestion && rule.targetQuestion.trim() !== "") {
          // Evaluate logic based on current question's answer
          const conditionMet = evaluateLogic(rule, currentQuestion.id, formData);
          if (conditionMet) {
            // Find the target question index in visible questions
            const targetIndex = visibleQuestions.findIndex(q => q.id === rule.targetQuestion);
            if (targetIndex !== -1) {
              setCurrentStep(targetIndex);
              return;
            } else {
              // Target question might be hidden, try to find it in all questions and show it
              if (survey) {
                const targetQuestion = survey.questions.find(q => q.id === rule.targetQuestion);
                if (targetQuestion) {
                  // Remove from hidden set to show it
                  setHiddenQuestions(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(rule.targetQuestion);
                    return newSet;
                  });
                  // Recalculate visible questions and find index
                  const updatedVisible = survey.questions
                    .filter(q => {
                      const isHidden = q.id === rule.targetQuestion ? false : hiddenQuestions.has(q.id);
                      return !isHidden;
                    })
                    .sort((a, b) => a.order - b.order);
                  const newTargetIndex = updatedVisible.findIndex(q => q.id === rule.targetQuestion);
                  if (newTargetIndex !== -1) {
                    setCurrentStep(newTargetIndex);
                    return;
                  }
                }
              }
            }
          }
        }
      }
    }

    // Normal next step
    if (currentStep < visibleQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Navigate to previous question
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Check if can proceed to next
  const canProceed = () => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return false;

    if (currentQuestion.required) {
      const answer = formData[currentQuestion.id];
      if (!answer || (Array.isArray(answer) && answer.length === 0)) {
        return false;
      }
    }

    return true;
  };

  const handleSubmitInit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (honeypot !== "") {
      setError("Bot detected. Submission blocked.");
      return;
    }

    const visibleQuestions = getVisibleQuestions();
    const requiredQuestions = visibleQuestions.filter(q => q.required);
    const missingFields = requiredQuestions.filter(q => {
      const value = formData[q.id];
      return !value || (Array.isArray(value) && value.length === 0);
    });

    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.map(q => q.title).join(", ")}`);
      return;
    }

    if (!campaign || !survey) {
      setError("Missing required information. Please refresh and try again.");
      return;
    }

    // Instead of submitting immediately, show mobile input
    setShowSurvey(false);
    setShowMobileInput(true);
  };

  const handleFinalSubmit = async () => {
    if (!mobileNumber || mobileNumber.trim().length < 6) {
      setError("Please enter a valid mobile number (at least 6 digits).");
      return;
    }

    setVerifyingMobile(true);
    setError(null);

    // Initial bot check logic (retained)
    const calculateBotScore = () => {
      let score = 1.0;
      if (honeypot !== "") return { score: 0.0, isBot: true };
      const timeOnPage = botMetrics.timeOnPage;
      if (timeOnPage < 10) score -= 0.3;
      else if (timeOnPage < 20) score -= 0.1;
      if (botMetrics.mouseMovements < 5) score -= 0.2;
      if (botMetrics.keystrokes === 0) score -= 0.2;
      score = Math.max(0, Math.min(1, score));
      return { score, isBot: score < 0.5 };
    };

    const { score: botScore, isBot: isSuspectedBot } = calculateBotScore();

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || "http://localhost:5000";
      const userId = campaign?.user || campaign?.userId || "";

      // Check if mobile number exists in contacts and not filled
      // Check if mobile number exists in contacts and not filled
      const contacts = campaign?.contacts || [];
      const cleanMobile = mobileNumber.replace(/\D/g, ""); // Remove non-digits

      console.log("Debugging Mobile Match (Internal):", {
        input: mobileNumber,
        cleanInput: cleanMobile,
        contactsCount: contacts.length,
        contactsSample: contacts.slice(0, 3).map(c => c.phone)
      });

      // Simple check - in real app might need more fuzzy matching
      const matchingContact = contacts.find(c => {
        const contactPhone = c.phone ? c.phone.replace(/\D/g, "") : "";
        // Check for exact match or suffix match (last 10 digits)
        const isMatch = contactPhone === cleanMobile ||
          (cleanMobile.length >= 10 && contactPhone.endsWith(cleanMobile.slice(-10))) ||
          (contactPhone.length >= 10 && cleanMobile.endsWith(contactPhone.slice(-10)));

        console.log(`Checking ${c.phone} (${contactPhone}) vs ${cleanMobile}: ${isMatch}`);
        return isMatch;
      });

      if (!matchingContact) {
        setError("This mobile number is not in the invitation list. Only invited users can submit this survey.");
        setVerifyingMobile(false);
        return;
      }

      if (matchingContact.filled) {
        setAlreadyFilled(true);
        setVerifyingMobile(false);
        return;
      }

      const visibleQuestionIds = new Set(survey!.questions
        .filter(q => !hiddenQuestions.has(q.id))
        .map(q => q.id));

      const answers = Object.entries(formData)
        .filter(([questionId]) => visibleQuestionIds.has(questionId))
        .map(([questionId, answer]) => {
          const question = survey!.questions.find(q => q.id === questionId);
          return {
            question_title: question?.title || "",
            question_description: question?.description || "",
            answer: answer
          };
        });

      const responseData = {
        userId: userId,
        surveyId: survey!._id || survey!.id,
        campaignId: campaignId,
        responders_email: matchingContact?.email || "", // Empty if anonymous/new
        responders_phone: mobileNumber,
        answers: answers,
        started_at: (startedAt || new Date()).toISOString(),
        completed_at: new Date().toISOString(),
        bot_score: botScore,
        is_suspected_bot: isSuspectedBot,
        reward_amount: matchingContact ? (campaign?.reward?.amount || 0) : 0,
        reward_status: matchingContact ? "pending" : "skipped", // Only reward if matched
        ip_address: "", // Server will handle
        user_agent: typeof window !== "undefined" ? window.navigator.userAgent : "",
      };

      const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(responseData),
      });

      if (response.ok) {
        // Update contact if matched
        if (matchingContact) {
          // Update campaign contacts locally and on server
          try {
            const currentContacts = campaign?.contacts || [];
            const updatedContacts = currentContacts.map(contact => {
              if (contact.phone === matchingContact.phone) { // Using original phone from matching contact
                return { ...contact, filled: true };
              }
              return contact;
            });

            // Update campaign
            await fetch(`${baseUrl.replace(/\/+$/, "")}/campaigns/${campaignId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contacts: updatedContacts,
                responses: (campaign?.responses || 0) + 1
              })
            });

            // Update store if needed (skipped for now as this is public page)
          } catch (e) {
            console.warn("Failed to update campaign contact status", e);
          }
          setMobileVerified(true); // Claimed!
        }
        setSubmitted(true);
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        setError(errorData.error || "Failed to submit survey.");
      }

    } catch (err) {
      console.error("Submission error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setVerifyingMobile(false);
    }
  };

  const handleExternalMobileSubmit = async () => {
    if (!mobileNumber || mobileNumber.trim().length < 6) {
      setError("Please enter a valid mobile number (at least 6 digits).");
      return;
    }
    setVerifyingMobile(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || "http://localhost:5000";
      const contacts = campaign?.contacts || [];
      const cleanMobile = mobileNumber.replace(/\D/g, "");

      console.log("Debugging Mobile Match (External):", {
        input: mobileNumber,
        cleanInput: cleanMobile,
        contactsCount: contacts.length,
        contactsSample: contacts.slice(0, 3).map(c => c.phone)
      });

      const matchingContact = contacts.find(c => {
        const contactPhone = c.phone ? c.phone.replace(/\D/g, "") : "";
        // Check for exact match or suffix match (last 10 digits)
        const isMatch = contactPhone === cleanMobile ||
          (cleanMobile.length >= 10 && contactPhone.endsWith(cleanMobile.slice(-10))) ||
          (contactPhone.length >= 10 && cleanMobile.endsWith(contactPhone.slice(-10)));

        console.log(`Checking ${c.phone} (${contactPhone}) vs ${cleanMobile}: ${isMatch}`);
        return isMatch;
      });

      if (!matchingContact) {
        setError("This mobile number is not in the invitation list. Only invited users can submit this survey.");
        setVerifyingMobile(false);
        return;
      }

      if (matchingContact.filled) {
        setAlreadyFilled(true);
      } else {
        // Update contact to filled
        const updatedContacts = contacts.map(c => {
          if (c === matchingContact) return { ...c, filled: true };
          return c;
        });

        // Update campaign
        await fetch(`${baseUrl.replace(/\/+$/, "")}/campaigns/${campaignId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contacts: updatedContacts,
            responses: (campaign?.responses || 0) + 1
          })
        });
        setMobileVerified(true);
        setCodeVerified(true); // Reusing this for success state in external
      }

    } catch (e) {
      console.error("Error verifying mobile:", e);
      setError("Failed to verify. Please try again.");
    } finally {
      setVerifyingMobile(false);
    }
  };

  const renderQuestion = (question: Question) => {
    const baseInputClasses = "w-full px-4 py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:focus:ring-brand-400 dark:focus:border-brand-400 transition-all duration-200";

    switch (question.type) {
      case "short-text":
        return (
          <input
            type="text"
            value={formData[question.id] || ""}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            placeholder="Type your answer here..."
            className={baseInputClasses}
            required={question.required}
          />
        );

      case "long-text":
        return (
          <textarea
            value={formData[question.id] || ""}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            placeholder="Type your answer here..."
            rows={5}
            className={`${baseInputClasses} resize-y min-h-[120px]`}
            required={question.required}
          />
        );

      case "multiple-choice":
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => {
              const currentValue = formData[question.id];
              const currentArray = Array.isArray(currentValue) ? currentValue : [];
              const isChecked = currentArray.includes(option);

              return (
                <label
                  key={index}
                  className={`flex items-center gap-3 cursor-pointer p-4 rounded-lg border-2 transition-all duration-200 ${isChecked
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 dark:border-brand-400"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-brand-300 dark:hover:border-brand-600 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleInputChange(question.id, [...currentArray, option]);
                      } else {
                        handleInputChange(question.id, currentArray.filter((v: string) => v !== option));
                      }
                    }}
                    className="w-5 h-5 text-brand-600 border-gray-300 rounded focus:ring-2 focus:ring-brand-500 focus:ring-offset-0 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <span className="text-sm sm:text-base text-gray-900 dark:text-gray-100 font-medium flex-1">
                    {option}
                  </span>
                </label>
              );
            })}
          </div>
        );

      case "single-choice":
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <label
                key={index}
                className={`flex items-center gap-3 cursor-pointer p-4 rounded-lg border-2 transition-all duration-200 ${formData[question.id] === option
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 dark:border-brand-400"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-brand-300 dark:hover:border-brand-600 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={formData[question.id] === option}
                  onChange={(e) => handleInputChange(question.id, e.target.value)}
                  className="w-5 h-5 text-brand-600 border-gray-300 focus:ring-2 focus:ring-brand-500 focus:ring-offset-0 dark:border-gray-600 dark:bg-gray-700"
                  required={question.required}
                />
                <span className="text-sm sm:text-base text-gray-900 dark:text-gray-100 font-medium flex-1">
                  {option}
                </span>
              </label>
            ))}
          </div>
        );

      case "rating-scale":
        return (
          <div className="flex flex-wrap gap-3 sm:gap-4 justify-center sm:justify-start py-2">
            {Array.from({ length: question.ratingMax || 5 }, (_, i) => {
              const ratingValue = formData[question.id];
              const numericValue = typeof ratingValue === 'number' ? ratingValue : 0;
              const isSelected = numericValue >= i + 1;

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleInputChange(question.id, i + 1)}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl transition-all duration-200 flex items-center justify-center ${isSelected
                    ? "text-yellow-400 bg-yellow-50 dark:bg-yellow-400/10 scale-110 shadow-lg"
                    : "text-gray-300 dark:text-gray-600 hover:text-yellow-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:scale-105"
                    }`}
                >
                  <Star className="w-full h-full fill-current" />
                </button>
              );
            })}
          </div>
        );

      case "date":
        return (
          <input
            type="date"
            value={formData[question.id] || ""}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            className={baseInputClasses}
            required={question.required}
          />
        );

      case "email":
        return (
          <input
            type="email"
            value={formData[question.id] || ""}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            placeholder="your.email@example.com"
            className={baseInputClasses}
            required={question.required}
          />
        );

      case "phone":
        return (
          <input
            type="tel"
            value={formData[question.id] || ""}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            placeholder="+1 (555) 123-4567"
            className={baseInputClasses}
            required={question.required}
          />
        );

      case "number":
        return (
          <input
            type="number"
            value={formData[question.id] || ""}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            placeholder="Enter a number..."
            className={baseInputClasses}
            required={question.required}
          />
        );

      default:
        return null;
    }
  };

  // Show already filled message
  if (alreadyFilled && campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-brand-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 px-4 sm:px-6">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-theme-lg p-8 sm:p-10 text-center border border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-brand-100 dark:bg-brand-500/20 mx-auto mb-6">
            <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-brand-600 dark:text-brand-400" strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Survey Already Completed
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-2 leading-relaxed">
            You have already submitted this survey.
          </p>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            Each contact can only submit once. Thank you for your participation!
          </p>
          {campaign.name && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Campaign</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{campaign.name}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-brand-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-500/20 mx-auto mb-4">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600 dark:text-brand-400" />
          </div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">Loading survey...</p>
        </div>
      </div>
    );
  }

  // Handle Unauthenticated - No longer needed as we allow anonymous access
  // But we might want to keep some form of access control if campaign is closed etc.



  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Thank You!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {survey?.thankYouMessage || "Your response has been recorded successfully."}
          </p>
          {mobileVerified && campaign?.reward && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="font-semibold text-green-800 dark:text-green-200">Reward Claimed!</p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                {campaign.reward.type === "cash reward"
                  ? "The reward will be sent to your bank within 3-4 days."
                  : "You will receive the reward promo code on your phone number."}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }



  // Handle Unauthenticated or Unverified state
  // With the new flow, we don't enforce authentication for filling the survey.
  // We only check if the survey is loaded.

  // If we are here, it means:
  // 1. Not loading
  // 2. Not already filled (checked above)
  // 3. Not submitted (checked above)
  // 4. Not showing mobile input (checked above)
  // 5. Not showing survey (checked next)

  // We should just render the survey if it exists and showSurvey is true
  // The showSurvey state is set in the effect ensuring bot detection passes.

  // If showSurvey is false but we are not loading, it might be that bot detection failed or some other error.
  if (!showSurvey && !loading && !error && !campaign?.externalSurveyLink) {
    // Fallback to loading or verifying access if no specific error
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-brand-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-500/20 mx-auto mb-4">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600 dark:text-brand-400" />
          </div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">Preparing survey...</p>
        </div>
      </div>
    );
  }

  // Generic Error Screen - Only show if no other UI is active and we have an error
  // This prevents validation errors from hiding the form
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-brand-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-theme-lg border border-gray-100 dark:border-gray-700/50">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-error-100 dark:bg-error-900/30">
            <AlertCircle className="h-6 w-6 text-error-600 dark:text-error-400" />
          </div>
          <div>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              Unable to Load Survey
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {error}
            </p>
          </div>
          <div className="mt-4">
            <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
              Reload Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // External Survey Success (Code/Mobile Verified)
  // Only show "Thank You" if BOTH code (if applicable) and mobile are verified
  // For internal surveys, codeVerified is false (or unused), so we rely on submitted/mobileVerified
  // But strictly for external flow:
  const isExternalFlow = campaign && !campaign.survey && campaign.externalSurveyLink;

  if (isExternalFlow && codeVerified && mobileVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Thank You!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your participation has been verified.
          </p>
          {mobileVerified && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="font-semibold text-green-800 dark:text-green-200">Reward Claimed!</p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                {campaign?.reward?.type === "cash reward"
                  ? "The reward will be sent to your bank within 3-4 days."
                  : campaign?.reward?.type === "promo code"
                    ? "You will receive the reward promo code on your phone number."
                    : "Your number has been verified."}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Mobile Verification Screen (for both internal flow after questions, and external flow)
  // Check if we should show mobile input
  const isExternal = campaign && !campaign.survey && campaign.externalSurveyLink;
  const hasCode = !!campaign?.code;

  // Show mobile screen if:
  // 1. Internal flow: showMobileInput is true
  // 2. External flow: Has code AND code is verified AND mobile NOT yet verified
  // If external flow has NO code, we never show mobile screen (user only sees link)
  const showMobileScreen = showMobileInput ||
    (isExternal && !alreadyFilled && hasCode && codeVerified && !mobileVerified);

  if (showMobileScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-brand-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-theme-lg p-6 sm:p-8 border border-gray-100 dark:border-gray-700/50">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                <Gift className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {isExternal ? "Claim Your Reward" : "Almost Done!"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Please enter your mobile number on which you received the invitation to claim your reward.
              </p>
            </div>

            {isExternal && (
              <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Survey Link:</p>
                <a href={campaign.externalSurveyLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all block mb-2">
                  {campaign.externalSurveyLink}
                </a>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  (Please make sure you have filled the form at the link above first)
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  id="mobile"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="e.g. 1234567890"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
                  {error}
                </div>
              )}

              <Button
                onClick={isExternal ? handleExternalMobileSubmit : handleFinalSubmit}
                className="w-full"
                disabled={verifyingMobile}
              >
                {verifyingMobile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Verifying...
                  </>
                ) : "Verify & Claim Reward"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show external survey UI if campaign has external survey and no internal survey
  // But not if already filled (that will be handled by the alreadyFilled check above)
  const isExternalOnly = campaign && !campaign.survey && campaign.externalSurveyLink;
  if (isExternalOnly && !botDetected && !alreadyFilled && !showMobileInput && !showMobileInput && !showMobileScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-brand-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* External Survey Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-theme-lg p-6 sm:p-8 border border-gray-100 dark:border-gray-700/50">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                <FileText className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                External Survey
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {campaign.name}
              </p>
            </div>

            {mobileVerified && !alreadyFilled && campaign?.reward && (
              <div className="bg-brand-50 dark:bg-brand-900/20 rounded-lg p-4 border border-brand-100 dark:border-brand-800">
                <h3 className="text-lg font-semibold text-brand-900 dark:text-brand-100 mb-2">
                  Reward Unlocked!
                </h3>
                <p className="text-brand-700 dark:text-brand-300 text-sm mb-3">
                  {campaign.reward.type === "cash reward"
                    ? `You've earned $${campaign.reward.amount}`
                    : "You've earned a promo code!"}
                </p>
                {campaign.reward.type === "promo code" && campaign.reward.code && (
                  <div className="bg-white dark:bg-gray-800 border border-brand-200 dark:border-brand-700 rounded p-2 font-mono text-lg font-bold text-brand-600 dark:text-brand-400 select-all">
                    {campaign.reward.code}
                  </div>
                )}
              </div>
            )}
            {/* External Survey Link */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 mb-6 border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Survey Link
              </h3>
              <div className="flex items-center gap-3 mb-4">
                <a
                  href={campaign.externalSurveyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 break-all text-sm sm:text-base underline"
                >
                  {campaign.externalSurveyLink}
                </a>
                <a
                  href={campaign.externalSurveyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Open Link
                </a>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg">
                <div className="flex items-start gap-3 text-error-800 dark:text-error-200">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm sm:text-base">{error}</p>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="mt-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                Instructions
              </h3>
              <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-400 mt-1">1.</span>
                  <span>Click the &quot;Open Link&quot; button or copy the survey link above to open the external survey in a new tab</span>
                </li>
                {campaign.code && (
                  <>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 dark:text-amber-400 mt-1">2.</span>
                      <span>Complete the survey on the external platform</span>
                    </li>
                  </>
                )}
                {!campaign.code && (
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 dark:text-amber-400 mt-1">2.</span>
                    <span>Complete the survey on the external platform</span>
                  </li>
                )}
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show survey form
  if (showSurvey && survey) {
    const visibleQuestions = getVisibleQuestions();
    const currentQuestion = getCurrentQuestion();

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-brand-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Survey Header */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-theme-lg p-6 sm:p-8 mb-6 border border-gray-100 dark:border-gray-700/50">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 dark:from-brand-600 dark:to-brand-700 shadow-lg shadow-brand-500/20">
                  <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                  {survey?.title}
                </h1>
                {survey?.description && (
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                    {survey?.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Question Form */}
          {currentQuestion && (
            <form
              onSubmit={(e) => { e.preventDefault(); handleNext(); }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-theme-lg p-6 sm:p-8 md:p-10 border border-gray-100 dark:border-gray-700/50 relative overflow-hidden"
            >
              {/* Decorative background element */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-brand-100/30 to-purple-100/30 dark:from-brand-900/20 dark:to-purple-900/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="relative z-10">
                {/* Honeypot field - hidden from users */}
                <input
                  type="text"
                  name="website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  style={{ position: "absolute", left: "-9999px", opacity: 0, pointerEvents: "none" }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                {/* Current Question */}
                <div className="mb-8">
                  <div className="mb-6 pb-4 border-b border-gray-100 dark:border-gray-700/50">
                    <label className="block">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0 mt-1">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-500/20">
                            <span className="text-sm font-bold text-brand-600 dark:text-brand-400">
                              Q
                            </span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start gap-2 flex-wrap">
                            <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                              {currentQuestion.title}
                            </span>
                            {currentQuestion.required && (
                              <span className="text-error-500 text-xl sm:text-2xl font-bold mt-0.5">*</span>
                            )}
                          </div>
                          {currentQuestion.description && (
                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-3 leading-relaxed">
                              {currentQuestion.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </label>
                  </div>
                  <div className="mt-6">
                    {renderQuestion(currentQuestion)}
                  </div>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg">
                    <div className="flex items-start gap-3 text-error-800 dark:text-error-200">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <p className="text-sm sm:text-base">{error}</p>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                    className="w-full sm:w-auto sm:min-w-[120px]"
                  >
                    Previous
                  </Button>

                  {currentStep < visibleQuestions.length - 1 ? (
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleNext}
                      disabled={!canProceed()}
                      className="w-full sm:w-auto sm:min-w-[120px]"
                    >
                      Next
                    </Button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e: React.MouseEvent) => {
                        e.preventDefault();
                        handleSubmitInit(e as unknown as React.FormEvent);
                      }}
                      disabled={!canProceed()}
                      className="w-full sm:w-auto sm:min-w-[140px] inline-flex items-center justify-center font-medium gap-2 rounded-lg transition px-5 py-3.5 text-sm bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Submit Survey
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-brand-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
      <div className="text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-500/20 mx-auto mb-4">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600 dark:text-brand-400" />
        </div>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">Verifying access...</p>
      </div>
    </div>
  );
}


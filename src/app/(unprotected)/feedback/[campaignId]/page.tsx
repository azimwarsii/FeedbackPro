"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { 
  Loader2, 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Star,
  FileText,
  Gift
} from "lucide-react";
import Button from "@/components/ui/button/Button";
import { useCampaignStore } from "@/store/useCampaignStore";
import { useSurveysStore } from "@/store/useSurveysStore";

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
  code?: string; // 4-digit code for external survey
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
  const campaignId = params.campaignId as string;
  const { data: session, status } = useSession();
  
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [botDetected, setBotDetected] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyFilled, setAlreadyFilled] = useState(false);
  const [formData, setFormData] = useState<Record<string, string | number | string[] | null>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [hiddenQuestions, setHiddenQuestions] = useState<Set<string>>(new Set());
  const [externalSurveyCode, setExternalSurveyCode] = useState(""); // For external survey code input
  const [codeVerified, setCodeVerified] = useState(false); // Track if code is verified

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
  }, [campaignId]);

  // Check email verification and if already filled when session is available
  useEffect(() => {
    if (status === "authenticated" && session?.user?.email && campaign) {
      const userEmail = session.user.email.toLowerCase().trim();
      const userContact = (campaign.contacts || []).find(
        c => c.email.toLowerCase().trim() === userEmail
      );
      
      if (userContact) {
        // Check if user has already filled the form
        if (userContact.filled === true) {
          setEmailVerified(false);
          setAlreadyFilled(true);
          return;
        }
        setAlreadyFilled(false);
        setEmailVerified(true);
      } else {
        setEmailVerified(false);
        setAlreadyFilled(false);
        setError("Your email is not authorized to fill this survey. Please use the email address that was invited.");
      }
    } else if (status === "unauthenticated") {
      // User needs to sign in
      setEmailVerified(false);
      setAlreadyFilled(false);
    }
  }, [status, session, campaign]);

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

    // Update hidden questions state
    setHiddenQuestions(newHiddenQuestions);
    
    // Adjust current step if current question becomes hidden
    const visibleQuestions = survey.questions
      .filter(q => !newHiddenQuestions.has(q.id))
      .sort((a, b) => a.order - b.order);
    
    if (visibleQuestions.length > 0) {
      if (!currentQuestionId || newHiddenQuestions.has(currentQuestionId)) {
        // Current question is now hidden, go to first visible question
        setCurrentStep(0);
      } else {
        // Update step index to match new visible questions order
        const newIndex = visibleQuestions.findIndex(q => q.id === currentQuestionId);
        if (newIndex !== -1 && newIndex !== currentStep) {
          setCurrentStep(newIndex);
        } else if (currentStep >= visibleQuestions.length) {
          // Step is beyond visible questions, go to last question
          setCurrentStep(Math.max(0, visibleQuestions.length - 1));
        }
      }
    }
  }, [survey, hiddenQuestions, currentStep]);

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

  // Show survey once all checks pass
  useEffect(() => {
    if (emailVerified && !botDetected && survey && status === "authenticated") {
      setShowSurvey(true);
      // Record when survey was started
      const startTime = new Date();
      setStartedAt(prev => prev || startTime);
      
      // Reset step and initialize logic evaluation
      setCurrentStep(0);
      // Initialize hidden questions based on initial logic evaluation
      // Start with all questions visible, then apply logic
      const initialHidden = new Set<string>();
      if (survey.questions) {
        survey.questions.forEach((question) => {
          if (question.logic && question.logic.length > 0) {
            question.logic.forEach((rule) => {
              if (!rule.targetQuestion || rule.targetQuestion.trim() === "") return;
              
              // For "show" actions, if condition not met initially, hide the target
              if (rule.action === "show") {
                const conditionMet = evaluateLogic(rule, question.id, formData);
                if (!conditionMet) {
                  initialHidden.add(rule.targetQuestion);
                }
              }
            });
          }
        });
      }
      setHiddenQuestions(initialHidden);
      // Apply full logic evaluation
      applyQuestionLogic(formData);
      
      // Initialize bot detection tracking
      // Track time on page
      const timeInterval = setInterval(() => {
        setBotMetrics(prev => ({
          ...prev,
          timeOnPage: prev.timeOnPage + 1
        }));
      }, 1000);

      // Track mouse movements
      const handleMouseMove = (e: MouseEvent) => {
        setBotMetrics(prev => ({
          ...prev,
          mouseMovements: prev.mouseMovements + 1,
          mousePositions: [
            ...prev.mousePositions.slice(-49), // Keep last 50 positions
            { x: e.clientX, y: e.clientY, timestamp: Date.now() }
          ]
        }));
      };

      // Track keyboard events
      const handleKeyPress = () => {
        const now = Date.now();
        setBotMetrics(prev => {
          const timeSinceLastKey = prev.lastTypingTime > 0 ? now - prev.lastTypingTime : 0;
          const intervals = timeSinceLastKey > 0 && timeSinceLastKey < 10000 
            ? [...prev.typingIntervals.slice(-19), timeSinceLastKey] 
            : prev.typingIntervals;
          
          // Calculate average typing speed (keys per second)
          const avgSpeed = intervals.length > 0
            ? intervals.reduce((a, b) => a + b, 0) / intervals.length
            : 0;

          return {
            ...prev,
            keystrokes: prev.keystrokes + 1,
            lastTypingTime: now,
            typingIntervals: intervals,
            averageTypingSpeed: avgSpeed
          };
        });
      };

      // Track scroll events
      const handleScroll = () => {
        setBotMetrics(prev => ({
          ...prev,
          scrollEvents: prev.scrollEvents + 1
        }));
      };

      // Track focus/blur events
      const handleFocus = () => {
        setBotMetrics(prev => ({
          ...prev,
          focusEvents: prev.focusEvents + 1
        }));
      };

      const handleBlur = () => {
        setBotMetrics(prev => ({
          ...prev,
          blurEvents: prev.blurEvents + 1
        }));
      };

      // Detect suspicious patterns
      const detectSuspiciousPatterns = () => {
        setBotMetrics(prev => {
          let suspicious = prev.suspiciousPatterns;
          
          // Check for too fast typing (less than 50ms between keystrokes consistently)
          if (prev.typingIntervals.length > 5) {
            const veryFastTyping = prev.typingIntervals.filter(t => t < 50).length;
            if (veryFastTyping > prev.typingIntervals.length * 0.3) {
              suspicious += 1;
            }
          }
          
          // Check for too slow/mechanical typing (exactly same intervals)
          if (prev.typingIntervals.length > 3) {
            const uniqueIntervals = new Set(prev.typingIntervals.map(t => Math.round(t / 10) * 10));
            if (uniqueIntervals.size < prev.typingIntervals.length * 0.3) {
              suspicious += 1;
            }
          }
          
          // Check for mouse movements that are too linear (robotic)
          if (prev.mousePositions.length > 10) {
            const recentPositions = prev.mousePositions.slice(-10);
            let linearCount = 0;
            for (let i = 1; i < recentPositions.length; i++) {
              const dx = recentPositions[i].x - recentPositions[i-1].x;
              const dy = recentPositions[i].y - recentPositions[i-1].y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const timeDiff = recentPositions[i].timestamp - recentPositions[i-1].timestamp;
              // Perfectly linear movement (same speed, same direction)
              if (timeDiff > 0 && distance / timeDiff < 0.1) {
                linearCount++;
              }
            }
            if (linearCount > recentPositions.length * 0.5) {
              suspicious += 1;
            }
          }
          
          return { ...prev, suspiciousPatterns: suspicious };
        });
      };

      // Set up event listeners
      if (typeof window !== "undefined") {
        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        window.addEventListener('keydown', handleKeyPress, { passive: true });
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('focus', handleFocus, { passive: true });
        window.addEventListener('blur', handleBlur, { passive: true });
      }
      
      // Run suspicious pattern detection periodically
      const patternInterval = setInterval(detectSuspiciousPatterns, 2000);

      // Cleanup function
      return () => {
        if (timeInterval) clearInterval(timeInterval);
        if (patternInterval) clearInterval(patternInterval);
        if (typeof window !== "undefined") {
          try {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('keydown', handleKeyPress);
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
          } catch (err) {
            // Ignore errors during cleanup
            console.warn("Error cleaning up event listeners:", err);
          }
        }
      };
    }
  }, [emailVerified, botDetected, survey, status, applyQuestionLogic, formData]);

  const handleSignIn = () => {
    signIn("google", { callbackUrl: window.location.href });
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Bot detection check
    if (honeypot !== "") {
      setError("Bot detected. Submission blocked.");
      return;
    }

    // Validate required fields (only for visible questions)
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

    if (!campaign || !survey || !session?.user?.email) {
      setError("Missing required information. Please refresh and try again.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || "http://localhost:5000";
      
      // Get responder's phone number from campaign contacts
      const responderEmail = session.user.email.toLowerCase().trim();
      const responderContact = campaign.contacts?.find(
        c => c.email.toLowerCase().trim() === responderEmail
      );
      const responderPhone = responderContact?.phone || "";

      // Calculate comprehensive bot score based on multiple factors
      const calculateBotScore = () => {
        let score = 1.0; // Start with perfect human score

        // Factor 1: Honeypot field (if filled, definitely a bot)
        if (honeypot !== "") {
          return { score: 0.0, isBot: true };
        }

        // Factor 2: Time on page (too fast = suspicious)
        const timeOnPage = botMetrics.timeOnPage;
        const minExpectedTime = 10; // Minimum 10 seconds for a real user
        if (timeOnPage < minExpectedTime) {
          score -= 0.3;
        } else if (timeOnPage < minExpectedTime * 2) {
          score -= 0.1;
        }

        // Factor 3: Mouse movements (humans move mouse, bots often don't)
        const mouseMovements = botMetrics.mouseMovements;
        if (mouseMovements < 5) {
          score -= 0.2;
        } else if (mouseMovements < 10) {
          score -= 0.1;
        }

        // Factor 4: Keystrokes (too few or too many = suspicious)
        const keystrokes = botMetrics.keystrokes;
        if (keystrokes === 0) {
          score -= 0.2;
        } else if (keystrokes > 1000) { // Unusually high
          score -= 0.1;
        }

        // Factor 5: Typing speed (too consistent = bot-like)
        const avgTypingSpeed = botMetrics.averageTypingSpeed;
        if (avgTypingSpeed > 0 && avgTypingSpeed < 30) { // Less than 30ms between keys (too fast)
          score -= 0.15;
        } else if (avgTypingSpeed > 0 && avgTypingSpeed > 2000) { // More than 2 seconds (too slow/mechanical)
          score -= 0.1;
        }

        // Factor 6: Scroll events (humans scroll, bots might not)
        const scrollEvents = botMetrics.scrollEvents;
        if (scrollEvents === 0 && timeOnPage > 5) {
          score -= 0.1;
        }

        // Factor 7: Focus/blur events (humans interact with page)
        const focusEvents = botMetrics.focusEvents;
        const blurEvents = botMetrics.blurEvents;
        if (focusEvents === 0 && blurEvents === 0 && timeOnPage > 5) {
          score -= 0.1;
        }

        // Factor 8: Suspicious patterns detected
        const suspiciousPatterns = botMetrics.suspiciousPatterns;
        if (suspiciousPatterns > 0) {
          score -= suspiciousPatterns * 0.15;
        }

        // Factor 9: Mouse movement patterns (linear/robotic movement)
        const mousePositions = botMetrics.mousePositions;
        if (mousePositions.length > 10) {
          let linearMovements = 0;
          for (let i = 1; i < mousePositions.length; i++) {
            const dx = mousePositions[i].x - mousePositions[i-1].x;
            const dy = mousePositions[i].y - mousePositions[i-1].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const timeDiff = mousePositions[i].timestamp - mousePositions[i-1].timestamp;
            // Check for perfectly linear movement
            if (timeDiff > 0 && distance > 0 && Math.abs(dx / dy - 1) < 0.1) {
              linearMovements++;
            }
          }
          const linearRatio = linearMovements / mousePositions.length;
          if (linearRatio > 0.5) {
            score -= 0.2;
          }
        }

        // Normalize score to 0-1 range
        score = Math.max(0, Math.min(1, score));

        // Determine if suspected bot (score < 0.5)
        const isSuspectedBot = score < 0.5;

        return { score, isBot: isSuspectedBot };
      };

      const botDetection = calculateBotScore();
      const botScore = botDetection.score;
      const isSuspectedBot = botDetection.isBot;

      // Transform formData into answers array format
      // Only include answers for visible (non-hidden) questions
      const visibleQuestionIds = new Set(getVisibleQuestions().map(q => q.id));
      const answers = Object.entries(formData)
        .filter(([questionId]) => visibleQuestionIds.has(questionId))
        .map(([questionId, answer]) => {
          const question = survey.questions.find(q => q.id === questionId);
          return {
            question_title: question?.title || "",
            question_description: question?.description || "",
            answer: answer
          };
        });

      // Get reward amount from campaign
      const rewardAmount = campaign.reward?.type === "cash reward" 
        ? campaign.reward.amount || 0 
        : undefined;

      // Get timestamps
      const completedAt = new Date();
      const startedAtDate = startedAt || completedAt;

      // Get IP address (try to fetch from a service, fallback to empty string)
      let ipAddress = "";
      try {
        // Try to get IP from a public service
        const ipResponse = await fetch("https://api.ipify.org?format=json");
        if (ipResponse.ok) {
          const ipData = await ipResponse.json();
          ipAddress = ipData.ip || "";
        }
      } catch (err) {
        // IP will be captured server-side from request headers
        console.warn("Could not fetch IP address client-side:", err);
      }
      
      // Get user_id (campaign owner)
      const userId = campaign.user || campaign.userId || "";

      if (!userId) {
        setError("Campaign owner information is missing. Please contact support.");
        setSubmitting(false);
        return;
      }

      // Prepare response data according to backend API schema
      const responseData = {
        userId: userId,
        surveyId: survey._id || survey.id,
        campaignId: campaignId,
        responders_email: responderEmail,
        responders_phone: responderPhone,
        answers: answers,
        started_at: startedAtDate.toISOString(),
        completed_at: completedAt.toISOString(),
        bot_score: botScore,
        is_suspected_bot: isSuspectedBot,
        reward_amount: rewardAmount || 0,
        reward_status: rewardAmount ? "pending" : "pending",
        ip_address: ipAddress,
        user_agent: typeof window !== "undefined" ? window.navigator.userAgent : "",
      };

      const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(responseData),
      });

      if (response.ok) {
        // Update customer to increment responses count
        try {
          // First, fetch the current customer to get the current responses count
          const getCustomerResponse = await fetch(
            `${baseUrl.replace(/\/+$/, "")}/customers/email/${encodeURIComponent(responderEmail)}?userId=${encodeURIComponent(userId)}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (getCustomerResponse.ok) {
            const customerData = await getCustomerResponse.json();
            const currentCustomer = customerData?.customer || customerData;
            // Ensure responses is a number, not a string or array
            const currentResponses = typeof currentCustomer?.responses === 'number' 
              ? currentCustomer.responses 
              : (typeof currentCustomer?.responses === 'string' 
                  ? parseInt(currentCustomer.responses, 10) || 0 
                  : 0);
            
            // Increment responses by 1 (ensure it's a number)
            const newResponsesCount = Number(currentResponses) + 1;
            
            // Increment responses by 1
            const customerUpdateResponse = await fetch(
              `${baseUrl.replace(/\/+$/, "")}/customers/email/${encodeURIComponent(responderEmail)}?userId=${encodeURIComponent(userId)}`,
              {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  responses: newResponsesCount,
                }),
              }
            );

            if (!customerUpdateResponse.ok) {
              console.warn("Failed to update customer response count:", await customerUpdateResponse.json().catch(() => ({})));
              // Don't fail the submission if customer update fails
            }
          } else {
            console.warn("Failed to fetch customer for response count update");
            // Don't fail the submission if customer fetch fails
          }
        } catch (err) {
          console.warn("Error updating customer:", err);
          // Don't fail the submission if customer update fails
        }

        // Update campaign to mark this contact as filled, increment responses, and update reward utilization
        try {
          // Get current campaign contacts
          const currentContacts = campaign.contacts || [];
          const updatedContacts = currentContacts.map(contact => {
            if (contact.email.toLowerCase().trim() === responderEmail.toLowerCase().trim()) {
              return { ...contact, filled: true };
            }
            return contact;
          });

          // Prepare campaign update payload
          const campaignUpdatePayload: {
            contacts: Array<{ name: string; email: string; phone: string; filled?: boolean }>;
            responses: number;
            reward?: {
              type: "cash reward" | "promo code";
              amount?: number;
              amount_utilized?: number;
              code?: string;
              description?: string;
              codes_utilized?: number;
            };
          } = {
            contacts: updatedContacts,
            responses: (campaign.responses || 0) + 1,
          };

          // Update reward utilization based on reward type
          if (campaign.reward) {
            if (campaign.reward.type === "cash reward" && campaign.reward.amount) {
              campaignUpdatePayload.reward = {
                ...campaign.reward,
                amount_utilized: (campaign.reward.amount_utilized || 0) + campaign.reward.amount,
              };
            } else if (campaign.reward.type === "promo code") {
              campaignUpdatePayload.reward = {
                ...campaign.reward,
                codes_utilized: (campaign.reward.codes_utilized || 0) + 1,
              };
            }
          }

          // Update campaign via API
          const campaignUpdateResponse = await fetch(
            `${baseUrl.replace(/\/+$/, "")}/campaigns/${campaignId}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(campaignUpdatePayload),
            }
          );

          if (!campaignUpdateResponse.ok) {
            console.warn("Failed to update campaign:", await campaignUpdateResponse.json().catch(() => ({})));
            // Don't fail the submission if campaign update fails
          } else {
            // Update local campaign state
            const updatedCampaign = {
              ...campaign,
              contacts: updatedContacts,
              responses: (campaign.responses || 0) + 1,
              reward: campaignUpdatePayload.reward || campaign.reward,
            };
            setCampaign(updatedCampaign);
            
            // Update campaign store
            const { updateCampaignContact, incrementCampaignResponse, updateRewardUtilization } = useCampaignStore.getState();
            updateCampaignContact(campaignId, responderEmail, true);
            incrementCampaignResponse(campaignId);
            if (campaign.reward?.type) {
              updateRewardUtilization(campaignId, campaign.reward.type);
            }
          }
        } catch (err) {
          console.warn("Error updating campaign:", err);
          // Don't fail the submission if campaign update fails
        }

        // Update survey to increment responses count
        try {
          const surveyId = survey._id || survey.id;
          if (surveyId) {
            // Update survey via API
            const surveyUpdateResponse = await fetch(
              `${baseUrl.replace(/\/+$/, "")}/surveys/${surveyId}`,
              {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  responses: (survey.responses || 0) + 1,
                }),
              }
            );

            if (!surveyUpdateResponse.ok) {
              console.warn("Failed to update survey response count:", await surveyUpdateResponse.json().catch(() => ({})));
              // Don't fail the submission if survey update fails
            } else {
              // Update local survey state
              setSurvey({
                ...survey,
                responses: (survey.responses || 0) + 1,
              });
              
              // Update survey store
              const { incrementSurveyResponse } = useSurveysStore.getState();
              incrementSurveyResponse(surveyId);
            }
          }
        } catch (err) {
          console.warn("Error updating survey response count:", err);
          // Don't fail the submission if survey update fails
        }

        setSubmitted(true);
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        setError(errorData.error || "Failed to submit survey. Please try again.");
      }
    } catch (err) {
      console.error("Error submitting survey:", err);
      setError("An error occurred while submitting the survey. Please try again.");
    } finally {
      setSubmitting(false);
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
                  className={`flex items-center gap-3 cursor-pointer p-4 rounded-lg border-2 transition-all duration-200 ${
                    isChecked
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
                className={`flex items-center gap-3 cursor-pointer p-4 rounded-lg border-2 transition-all duration-200 ${
                  formData[question.id] === option
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
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl transition-all duration-200 flex items-center justify-center ${
                    isSelected
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

  // Show generic error only if not authenticated or if it's not an email verification error
  if (error && !showSurvey && (status !== "authenticated" || emailVerified)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-brand-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 px-4 sm:px-6">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-theme-lg p-8 text-center border border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-error-100 dark:bg-error-500/20 mx-auto mb-6">
            <XCircle className="w-10 h-10 text-error-600 dark:text-error-400" strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">Error</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">{error}</p>
          {status === "unauthenticated" && (
            <Button onClick={handleSignIn} variant="primary" className="w-full sm:w-auto">
              Sign in with Google
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Thank You!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {survey?.thankYouMessage || "Your response has been recorded successfully."}
          </p>
        </div>
      </div>
    );
  }

  // Email verification check - must come before welcome screen
  if (status === "authenticated" && !emailVerified && campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Access Denied
            </h2>
          </div>

          {/* Current User Info */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              You are currently logged in as:
            </p>
            <p className="text-base font-semibold text-gray-900 dark:text-white">
              {session?.user?.name || "User"}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-mono mt-1">
              {session?.user?.email}
            </p>
          </div>

          {/* Campaign Info */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
              Campaign:
            </p>
            <p className="text-lg font-bold text-red-900 dark:text-red-100 mb-3">
              {campaign.name}
            </p>
            <p className="text-sm text-red-700 dark:text-red-300">
              <strong>This campaign does not allow access for your email address.</strong>
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
              Please sign in with the email address that received the survey invitation.
            </p>
          </div>

          {/* Logout Button */}
          <div className="space-y-3">
            <Button 
              onClick={() => signOut({ callbackUrl: window.location.href })}
              className="w-full"
            >
              Sign Out
            </Button>
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              After signing out, you can sign in with a different Google account that has access to this survey.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle external survey code verification
  const handleVerifyCode = async () => {
    if (!campaign?.code) {
      setError("No code is required for this external survey");
      return;
    }
    
    if (externalSurveyCode.length !== 4 || !/^\d{4}$/.test(externalSurveyCode)) {
      setError("Please enter a valid 4-digit code");
      return;
    }
    
    if (externalSurveyCode !== campaign.code) {
      setError("Invalid code. Please try again.");
      return;
    }

    // Code is valid - mark user as completed
    setCodeVerified(true);
    setError(null);
    setSubmitting(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || "http://localhost:5000";
      
      if (!campaign || !session?.user?.email) {
        setError("Missing required information. Please refresh and try again.");
        setSubmitting(false);
        return;
      }

      // Get responder's email
      const responderEmail = session.user.email.toLowerCase().trim();
      const responderContact = campaign.contacts?.find(
        c => c.email.toLowerCase().trim() === responderEmail
      );
      const responderPhone = responderContact?.phone || "";

      // Get current campaign contacts
      const currentContacts = campaign.contacts || [];
      const updatedContacts = currentContacts.map(contact => {
        if (contact.email.toLowerCase().trim() === responderEmail.toLowerCase().trim()) {
          return { ...contact, filled: true };
        }
        return contact;
      });

      // Prepare campaign update payload
      const campaignUpdatePayload: {
        contacts: Array<{ name: string; email: string; phone: string; filled?: boolean }>;
        responses: number;
        reward?: {
          type: "cash reward" | "promo code";
          amount?: number;
          amount_utilized?: number;
          code?: string;
          description?: string;
          codes_utilized?: number;
        };
      } = {
        contacts: updatedContacts,
        responses: (campaign.responses || 0) + 1,
      };

      // Update reward utilization based on reward type
      if (campaign.reward) {
        if (campaign.reward.type === "cash reward" && campaign.reward.amount) {
          campaignUpdatePayload.reward = {
            ...campaign.reward,
            amount_utilized: (campaign.reward.amount_utilized || 0) + campaign.reward.amount,
          };
        } else if (campaign.reward.type === "promo code") {
          campaignUpdatePayload.reward = {
            ...campaign.reward,
            codes_utilized: (campaign.reward.codes_utilized || 0) + 1,
          };
        }
      }

      // Update campaign via API
      const campaignUpdateResponse = await fetch(
        `${baseUrl.replace(/\/+$/, "")}/campaigns/${campaignId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(campaignUpdatePayload),
        }
      );

      if (!campaignUpdateResponse.ok) {
        const errorData = await campaignUpdateResponse.json().catch(() => ({ error: "Unknown error" }));
        console.error("Failed to update campaign:", errorData);
        setError(`Failed to mark survey as completed: ${errorData.error || "Unknown error"}`);
        setSubmitting(false);
        return;
      }

      // Update local campaign state
      const updatedCampaign = {
        ...campaign,
        contacts: updatedContacts,
        responses: (campaign.responses || 0) + 1,
        reward: campaignUpdatePayload.reward || campaign.reward,
      };
      setCampaign(updatedCampaign);
      
      // Update campaign store
      const { updateCampaignContact, incrementCampaignResponse, updateRewardUtilization } = useCampaignStore.getState();
      updateCampaignContact(campaignId, responderEmail, true);
      incrementCampaignResponse(campaignId);
      if (campaign.reward?.type) {
        updateRewardUtilization(campaignId, campaign.reward.type);
      }

      // Update customer to increment responses count
      try {
        const userId = campaign.user || campaign.userId || "";
        if (userId) {
          // First, fetch the current customer to get the current responses count
          const getCustomerResponse = await fetch(
            `${baseUrl.replace(/\/+$/, "")}/customers/email/${encodeURIComponent(responderEmail)}?userId=${encodeURIComponent(userId)}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (getCustomerResponse.ok) {
            const customerData = await getCustomerResponse.json();
            const currentCustomer = customerData?.customer || customerData;
            // Ensure responses is a number, not a string or array
            const currentResponses = typeof currentCustomer?.responses === 'number' 
              ? currentCustomer.responses 
              : (typeof currentCustomer?.responses === 'string' 
                  ? parseInt(currentCustomer.responses, 10) || 0 
                  : 0);
            
            // Increment responses by 1 (ensure it's a number)
            const newResponsesCount = Number(currentResponses) + 1;
            
            // Increment responses by 1
            const customerUpdateResponse = await fetch(
              `${baseUrl.replace(/\/+$/, "")}/customers/email/${encodeURIComponent(responderEmail)}?userId=${encodeURIComponent(userId)}`,
              {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  responses: newResponsesCount,
                }),
              }
            );

            if (!customerUpdateResponse.ok) {
              console.warn("Failed to update customer response count:", await customerUpdateResponse.json().catch(() => ({})));
              // Don't fail the submission if customer update fails
            }
          } else {
            console.warn("Failed to fetch customer for response count update");
            // Don't fail the submission if customer fetch fails
          }
        }
      } catch (err) {
        console.warn("Error updating customer:", err);
        // Don't fail the submission if customer update fails
      }

      // Mark as already filled so the "already completed" message shows
      setAlreadyFilled(true);
    } catch (err) {
      console.error("Error verifying code and marking as completed:", err);
      setError("An error occurred while marking the survey as completed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Authentication check - Show welcome screen with campaign details
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Welcome Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome to Our Feedback Survey
              </h1>
              {campaign && (
                <>
                  <h2 className="text-2xl font-semibold text-blue-600 dark:text-blue-400 mb-4">
                    {campaign.name}
                  </h2>
                  {campaign.description && (
                    <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                      {campaign.description}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Instructions Section */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                How to Participate
              </h3>
              <ol className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">1</span>
                  <span><strong>Sign in with Google</strong> using the email address where you received the survey invitation</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">2</span>
                  <span>Your email will be <strong>automatically verified</strong> to ensure you&apos;re authorized to participate</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">3</span>
                  <span>Fill out the survey form <strong>once</strong> - you can only submit your response more than one time</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">4</span>
                  <span>Complete all required fields and submit your feedback</span>
                </li>
              </ol>
            </div>

            {/* Reward Information */}
            {campaign?.reward && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 mb-6 border border-green-200 dark:border-green-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-green-600 dark:text-green-400" />
                  Reward Information
                </h3>
                {campaign.reward.type === "cash reward" && campaign.reward.amount && (
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                      ${campaign.reward.amount.toFixed(2)}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      You will receive <strong>${campaign.reward.amount.toFixed(2)}</strong> upon successful completion of this survey
                    </p>
                  </div>
                )}
                {campaign.reward.type === "promo code" && campaign.reward.code && (
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Promo Code Reward
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      {campaign.reward.description || "You will receive a promotional code upon completion"}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Guidelines */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                Important Guidelines
              </h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-400 mt-1">•</span>
                  <span>You can only submit this survey <strong>once</strong> - please review your answers carefully</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-400 mt-1">•</span>
                  <span>All fields marked with <span className="text-red-500">*</span> are required</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-400 mt-1">•</span>
                  <span>Please use the <strong>same email address</strong> that received the survey invitation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-400 mt-1">•</span>
                  <span>Your responses are confidential and will be used for research purposes only</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-400 mt-1">•</span>
                  <span>Rewards will be processed after survey completion and verification</span>
                </li>
              </ul>
            </div>

            {/* Sign In Button */}
            <Button onClick={handleSignIn} className="w-full text-lg py-4">
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.7511 10.1944C18.7511 9.47495 18.6915 8.94995 18.5626 8.40552H10.1797V11.6527H15.1003C15.0011 12.4597 14.4654 13.675 13.2749 14.4916L13.2582 14.6003L15.9087 16.6126L16.0924 16.6305C17.7788 15.1041 18.7511 12.8583 18.7511 10.1944Z" fill="#4285F4"/>
                  <path d="M10.1788 18.75C12.5895 18.75 14.6133 17.9722 16.0915 16.6305L13.274 14.4916C12.5201 15.0068 11.5081 15.3666 10.1788 15.3666C7.81773 15.3666 5.81379 13.8402 5.09944 11.7305L4.99473 11.7392L2.23868 13.8295L2.20264 13.9277C3.67087 16.786 6.68674 18.75 10.1788 18.75Z" fill="#34A853"/>
                  <path d="M5.10014 11.7305C4.91165 11.186 4.80257 10.6027 4.80257 9.99992C4.80257 9.3971 4.91165 8.81379 5.09022 8.26935L5.08523 8.1534L2.29464 6.02954L2.20333 6.0721C1.5982 7.25823 1.25098 8.5902 1.25098 9.99992C1.25098 11.4096 1.5982 12.7415 2.20333 13.9277L5.10014 11.7305Z" fill="#FBBC05"/>
                  <path d="M10.1789 4.63331C11.8554 4.63331 12.9864 5.34303 13.6312 5.93612L16.1511 3.525C14.6035 2.11528 12.5895 1.25 10.1789 1.25C6.68676 1.25 3.67088 3.21387 2.20264 6.07218L5.08953 8.26943C5.81381 6.15972 7.81776 4.63331 10.1789 4.63331Z" fill="#EB4335"/>
                </svg>
                Sign in with Google to Continue
              </span>
            </Button>
          </div>
        </div>
      </div>
    );
  }


  // Show external survey UI if campaign has external survey and no internal survey
  // But not if already filled (that will be handled by the alreadyFilled check above)
  if (campaign && !campaign.survey && campaign.externalSurveyLink && status === "authenticated" && emailVerified && !botDetected && !alreadyFilled) {
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

            {/* Code Input Section */}
            {campaign.code && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="external-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Enter 4-Digit Code
                  </label>
                  <div className="flex gap-3">
                    <input
                      id="external-code"
                      type="text"
                      maxLength={4}
                      value={externalSurveyCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ""); // Only allow digits
                        if (value.length <= 4) {
                          setExternalSurveyCode(value);
                          setError(null);
                        }
                      }}
                      placeholder="1234"
                      className="flex-1 h-11 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-center text-lg font-mono tracking-widest"
                    />
                    <Button
                      onClick={handleVerifyCode}
                      disabled={externalSurveyCode.length !== 4 || codeVerified || submitting}
                      className="px-6"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2 inline" />
                          Verifying...
                        </>
                      ) : codeVerified ? (
                        "Verified ✓"
                      ) : (
                        "Verify"
                      )}
                    </Button>
                  </div>
                  {codeVerified && (
                    <p className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Code verified successfully!
                    </p>
                  )}
                </div>
              </div>
            )}

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
                  <span>Click the "Open Link" button or copy the survey link above to open the external survey in a new tab</span>
                </li>
                {campaign.code && (
                  <>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 dark:text-amber-400 mt-1">2.</span>
                      <span>Enter the 4-digit code provided to you in the field above and click "Verify"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 dark:text-amber-400 mt-1">3.</span>
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
                  {survey.title}
                </h1>
                {survey.description && (
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                    {survey.description}
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
                      handleSubmit(e as unknown as React.FormEvent);
                    }}
                    disabled={!canProceed() || submitting}
                    className="w-full sm:w-auto sm:min-w-[140px] inline-flex items-center justify-center font-medium gap-2 rounded-lg transition px-5 py-3.5 text-sm bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {submitting ? "Submitting..." : "Submit Survey"}
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


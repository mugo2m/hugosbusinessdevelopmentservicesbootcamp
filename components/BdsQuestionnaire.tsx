// components/BdsQuestionnaire.tsx
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  Mic,
  Send,
  CheckCircle,
  Volume2,
  ChevronDown,
  CheckSquare,
} from "lucide-react";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";

interface BdsQuestionnaireProps {
  userName: string;
  userId?: string;
  profileImage?: string;
}

export default function BdsQuestionnaire({ userName, userId, profileImage }: BdsQuestionnaireProps) {
  const { t, i18n } = useTranslation();

  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [currentStep, setCurrentStep] = useState<"idle" | "configuring" | "submitting" | "done">("idle");
  const [configStep, setConfigStep] = useState(0);

  const [userInput, setUserInput] = useState<string | string[]>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingQuestion, setStreamingQuestion] = useState("");
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const questionWordsRef = useRef<string[]>([]);
  const wordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const voiceCacheRef = useRef<Record<string, SpeechSynthesisVoice | null>>({});
  const ttsWarmedUpRef = useRef(false);

  const safeT = useCallback(
    (key: string, fallback: string): string => {
      try {
        const result = t(key);
        return result && typeof result === "string" ? result : fallback;
      } catch {
        return fallback;
      }
    },
    [t]
  );

  const [formData, setFormData] = useState<any>({
    businessName: "",
    contactPhone: "",
    county: "",
    subCounty: "",
    ward: "",
    village: "",
    sector: [],
    age: "",
    performance: "",
    employees: "",
    records: "",
    mainCustomer: [],
    sellingChallenge: [],
    externalFunding: "",
    primaryGoal: "",
  });

  const questions = useMemo(() => [
    {
      id: "businessName",
      questionText: "What is the name of the business?",
      type: "text",
      placeholder: "e.g., Greenfield Aggregators",
      section: "1. Business Basics & Location",
    },
    {
      id: "contactPhone",
      questionText: "What is the phone number of the key person or owner?",
      type: "text",
      placeholder: "e.g., 0712345678",
      section: "1. Business Basics & Location",
    },
    {
      id: "county",
      questionText: "Which county is the business located in?",
      type: "text",
      placeholder: "e.g., Bungoma",
      section: "1. Business Basics & Location",
    },
    {
      id: "subCounty",
      questionText: "Which sub-county?",
      type: "text",
      placeholder: "e.g., Kimilili",
      section: "1. Business Basics & Location",
    },
    {
      id: "ward",
      questionText: "Which ward?",
      type: "text",
      placeholder: "e.g., Kibingei",
      section: "1. Business Basics & Location",
    },
    {
      id: "village",
      questionText: "Which sublocation or village?",
      type: "text",
      placeholder: "e.g., Sikulu",
      section: "1. Business Basics & Location",
    },
    {
      id: "sector",
      questionText: "What is the primary sector of the business? You may select multiple.",
      type: "multi-select",
      options: [
        { id: "crops", label: "Crop Production" },
        { id: "livestock", label: "Livestock & Poultry" },
        { id: "horticulture", label: "Horticulture" },
        { id: "aggregation", label: "Aggregation & Trading" },
        { id: "processing", label: "Processing" },
      ],
      section: "2. Business Details",
    },
    {
      id: "age",
      questionText: "How long has the business been operating?",
      type: "dropdown",
      options: [
        { id: "<1", label: "Less than 1 year" },
        { id: "1-3", label: "1 - 3 years" },
        { id: "3-5", label: "3 - 5 years" },
        { id: "5+", label: "5+ years" },
      ],
      section: "2. Business Details",
    },
    {
      id: "performance",
      questionText: "How do you rate your business performance compared to the last season?",
      type: "dropdown",
      options: [
        { id: "inc_10", label: "It has increased by more than 10%" },
        { id: "inc_40", label: "It has increased by more than 40% compared to last season" },
        { id: "dec_10", label: "It has reduced by more than 10% compared to last season" },
        { id: "dec_50", label: "It has reduced by more than 50% compared to previous season" },
        { id: "same", label: "It is the same (no increase, no reduce)" },
      ],
      section: "2. Business Details",
    },
    {
      id: "employees",
      questionText: "How many employees does the business have?",
      type: "dropdown",
      options: [
        { id: "owner", label: "Owner only" },
        { id: "1-5", label: "1 - 5 employees" },
        { id: "6-20", label: "6 - 20 employees" },
        { id: "20+", label: "20+ employees" },
      ],
      section: "3. Structure & Systems",
    },
    {
      id: "records",
      questionText: "Does the business keep written financial records?",
      type: "dropdown",
      options: [
        { id: "yes", label: "Yes, fully digital/standard" },
        { id: "somewhat", label: "Somewhat (Notebook)" },
        { id: "no", label: "No records kept" },
      ],
      section: "3. Structure & Systems",
    },
    {
      id: "mainCustomer",
      questionText: "Who are the main customers for the business? Select all that apply.",
      type: "multi-select",
      options: [
        { id: "local", label: "Local Traders / Retailers" },
        { id: "processors", label: "Processors / Wholesalers" },
        { id: "institutions", label: "Institutions (Schools, Hotels)" },
        { id: "exporters", label: "Exporters" },
      ],
      section: "4. Market Access",
    },
    {
      id: "sellingChallenge",
      questionText: "What are the biggest challenges in selling to buyers? Select all that apply.",
      type: "multi-select",
      options: [
        { id: "quality", label: "Quality rejection" },
        { id: "payment", label: "Late payments" },
        { id: "volume", label: "Insufficient volume" },
        { id: "buyers", label: "No access to suitable buyers" },
        { id: "pricing", label: "Low or uncertain margins" },
      ],
      section: "4. Market Access",
    },
    {
      id: "externalFunding",
      questionText: "Does the business currently rely on external funding?",
      type: "dropdown",
      options: [
        { id: "yes_loan", label: "Yes, currently have a loan" },
        { id: "yes_grant", label: "Yes, currently have a grant" },
        { id: "no", label: "No external funding" },
        { id: "planning", label: "Planning to apply" },
      ],
      section: "5. Finance & Goals",
    },
    {
      id: "primaryGoal",
      questionText: "What is the primary goal the business wants to achieve in the next 6 months?",
      type: "text",
      placeholder: "e.g., Increase sales volume by 20%...",
      section: "5. Finance & Goals",
    },
  ], []);

  const currentQuestion = questions[configStep];
  const totalQuestions = questions.length;

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (allVoices.length === 0) return;
      const lang = i18n.language || "en";
      const voiceLang = lang.startsWith("fr") ? "fr-FR" : lang.startsWith("es") ? "es-ES" : lang.startsWith("sw") ? "sw-KE" : "en-US";
      let voice = allVoices.find((v) => v.lang === voiceLang && !v.name.toLowerCase().includes("male"));
      if (!voice) voice = allVoices.find((v) => v.lang === voiceLang);
      voiceCacheRef.current[voiceLang] = voice || allVoices[0];
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, [i18n.language]);

  const warmUpTTS = useCallback(() => {
    if (ttsWarmedUpRef.current || typeof window === "undefined" || !window.speechSynthesis) return;
    const dummy = new SpeechSynthesisUtterance(" ");
    dummy.volume = 0;
    dummy.onend = () => { window.speechSynthesis.cancel(); ttsWarmedUpRef.current = true; };
    window.speechSynthesis.speak(dummy);
    setTimeout(() => { window.speechSynthesis.cancel(); ttsWarmedUpRef.current = true; }, 200);
  }, []);

  const streamQuestionWithVoice = useCallback((fullText: string, forceSpeak = false): Promise<void> => {
    return new Promise((resolve) => {
      if ((!voiceEnabled && !forceSpeak) || !window.speechSynthesis) {
        setStreamingQuestion(fullText);
        resolve();
        return;
      }
      if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
      if (wordTimerRef.current) clearTimeout(wordTimerRef.current);
      if (!fullText || fullText.trim().length === 0) { resolve(); return; }

      setIsStreaming(true);
      setStreamingQuestion("");
      setCurrentWordIndex(0);

      const words = fullText.split(" ");
      questionWordsRef.current = words;
      const utterance = new SpeechSynthesisUtterance(fullText);
      utterance.rate = 1.0;
      utterance.pitch = 1.1;

      const lang = i18n.language || "en";
      const voiceLang = lang.startsWith("fr") ? "fr-FR" : lang.startsWith("es") ? "es-ES" : lang.startsWith("sw") ? "sw-KE" : "en-US";
      utterance.lang = voiceLang;
      if (voiceCacheRef.current[voiceLang]) utterance.voice = voiceCacheRef.current[voiceLang];

      setIsSpeaking(true);
      let wordIndex = 0;
      let currentText = "";
      let isFinished = false;

      const finish = () => {
        if (isFinished) return;
        isFinished = true;
        if (wordTimerRef.current) clearTimeout(wordTimerRef.current);
        setStreamingQuestion(fullText);
        setIsStreaming(false);
        setIsSpeaking(false);
        resolve();
      };

      const scheduleNextWord = () => {
        if (isFinished || wordIndex >= words.length) return;
        const word = words[wordIndex];
        const duration = Math.max(150, Math.min(1200, word.length * 100));
        wordTimerRef.current = setTimeout(() => {
          currentText += (currentText ? " " : "") + word;
          setStreamingQuestion(currentText);
          setCurrentWordIndex(wordIndex + 1);
          wordIndex++;
          scheduleNextWord();
        }, duration);
      };

      if (words.length > 0) scheduleNextWord(); else finish();
      utterance.onend = finish;
      utterance.onerror = finish;
      window.speechSynthesis.speak(utterance);
    });
  }, [voiceEnabled, i18n.language]);

  const askQuestion = async (step: number) => {
    if (step >= totalQuestions) return;
    const q = questions[step];

    if (q.type === "multi-select") {
      setUserInput([]);
    } else {
      setUserInput("");
    }

    await streamQuestionWithVoice(q.questionText);
  };

  const startQuestionnaire = async () => {
    if (voiceEnabled && !ttsWarmedUpRef.current) warmUpTTS();
    setCurrentStep("configuring");
    setConfigStep(0);
    setTimeout(() => askQuestion(0), 500);
  };

  const toggleMultiSelect = (value: string) => {
    setUserInput((prev) => {
      const currentArr = Array.isArray(prev) ? prev : [];
      if (currentArr.includes(value)) {
        return currentArr.filter((v) => v !== value);
      } else {
        return [...currentArr, value];
      }
    });
  };

  const handleNext = async () => {
    if (Array.isArray(userInput) && userInput.length === 0) {
      toast.error("Please select at least one option.");
      return;
    }
    if (typeof userInput === "string" && !userInput.trim()) {
      toast.error("Please provide an answer.");
      return;
    }

    const currentId = currentQuestion.id;
    let valueToSave: any = userInput;
    let spokenAck = "";

    if (Array.isArray(userInput)) {
      const labels = userInput.map(id => currentQuestion.options?.find(o => o.id === id)?.label || id);
      spokenAck = `Recorded: ${labels.join(", ")}`;
    } else {
      valueToSave = userInput.trim();
      const matchedOpt = currentQuestion.options?.find(o => o.id === valueToSave);
      spokenAck = `Recorded: ${matchedOpt ? matchedOpt.label : valueToSave}`;
    }

    setFormData((prev: any) => ({ ...prev, [currentId]: valueToSave }));

    if (voiceEnabled) {
      await streamQuestionWithVoice(spokenAck, true);
    }

    if (configStep < totalQuestions - 1) {
      const nextStep = configStep + 1;
      setConfigStep(nextStep);
      setTimeout(() => askQuestion(nextStep), 1000);
    } else {
      handleFinalSubmit({ ...formData, [currentId]: valueToSave });
    }
  };

  const handleFinalSubmit = async (finalData: any) => {
    setCurrentStep("submitting");
    setIsSubmitting(true);

    if (voiceEnabled) {
      await streamQuestionWithVoice("Thank you. Saving your enterprise profile now.", true);
    }

    try {
      const currentUserId = userId || localStorage.getItem("userId") || `user-${Date.now()}`;
      const response = await fetch("/api/bds/questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUserId,
          ...finalData,
          createdAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to save data");

      toast.success("Enterprise profile saved successfully!");
      setCurrentStep("done");

      if (voiceEnabled) {
        await streamQuestionWithVoice("Profile saved. Redirecting you to your dashboard.", true);
      }
      setTimeout(() => { window.location.href = "/dashboard"; }, 2500);

    } catch (error: any) {
      console.error("Error submitting questionnaire:", error);
      toast.error("Failed to save profile. Please try again.");
      setCurrentStep("configuring");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stopEverything = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (wordTimerRef.current) clearTimeout(wordTimerRef.current);
    setCurrentStep("idle");
    setStreamingQuestion("");
    setIsStreaming(false);
    setUserInput("");
  };

  const renderInput = () => {
    if (!currentQuestion) return null;

    if (currentQuestion.type === "text") {
      return (
        <input
          type="text"
          value={userInput as string}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder={currentQuestion.placeholder}
          className="w-full px-4 py-3 border-2 rounded-xl text-blue-900 font-medium focus:border-blue-600 placeholder-gray-400"
        />
      );
    }

    if (currentQuestion.type === "dropdown") {
      return (
        <div className="relative">
          <select
            value={userInput as string}
            onChange={(e) => setUserInput(e.target.value)}
            className="w-full px-4 py-3 border-2 rounded-xl appearance-none text-blue-900 font-medium focus:border-blue-600 bg-white"
          >
            <option value="" disabled>Select option</option>
            {currentQuestion.options?.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-blue-600 pointer-events-none" />
        </div>
      );
    }

    if (currentQuestion.type === "multi-select") {
      const selectedArr = Array.isArray(userInput) ? userInput : [];
      return (
        <div className="flex flex-col gap-2">
          {currentQuestion.options?.map((opt) => {
            const isSelected = selectedArr.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleMultiSelect(opt.id)}
                className={`text-left px-4 py-3 rounded-xl border-2 transition-all flex items-center justify-between ${
                  isSelected
                    ? "bg-emerald-100 border-emerald-500 text-emerald-900 font-medium"
                    : "bg-white border-gray-200 text-gray-700 hover:border-emerald-300"
                }`}
              >
                {opt.label}
                {isSelected && <CheckSquare className="w-5 h-5 text-emerald-600" />}
              </button>
            );
          })}
        </div>
      );
    }

    return null;
  };

  return (
    // ✅ OUTER WRAPPER — full-screen background photo, no dark overlay
    <div
      className="min-h-screen w-full flex justify-center items-start bg-cover bg-center bg-no-repeat relative p-4"
      style={{ backgroundImage: "url('/njeruu.jpg')" }}
    >
      {/* ✅ ORIGINAL LAYOUT — untouched, wrapped in relative z-10 */}
      <div className="relative z-10 flex flex-col gap-6 p-4 rounded-2xl w-full max-w-4xl">

        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-xl border">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="flex items-center gap-4">
              <Image
                src={profileImage || "/farmer-avatar.png"}
                alt="Officer"
                width={48}
                height={48}
                className="rounded-full ring-4"
              />
              <div>
                <h4 className="font-bold text-xl">{userName || "Officer"}</h4>
                <p className="text-sm text-gray-500">Enterprise Profiling Setup</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="bg-white/80 rounded-xl px-2 py-1 border border-gray-200 shadow-sm">
                <CurrencySwitcher />
              </div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl px-3 py-2">
                <Mic className={`w-5 h-5 text-white ${isSpeaking ? "animate-pulse" : ""}`} />
                <button
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  disabled={currentStep === "submitting" || currentStep === "done"}
                  className="text-white font-medium text-sm focus:outline-none"
                >
                  {voiceEnabled ? "Voice ON" : "Voice OFF"}
                </button>
              </div>
              <button
                onClick={startQuestionnaire}
                disabled={currentStep !== "idle"}
                className={`px-6 py-2 rounded-xl font-bold text-sm ${
                  currentStep === "idle"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-105 transition-all"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {currentStep === "submitting" ? "Saving..." : "Start Questionnaire"}
              </button>
            </div>
          </div>
          {isSpeaking && (
            <div className="mt-2 text-xs text-blue-600 flex items-center gap-1">
              <Volume2 className="w-3 h-3 animate-pulse" />
              <span>Speaking... {currentWordIndex}/{questionWordsRef.current.length} words</span>
            </div>
          )}
        </div>

        {/* Questionnaire Body */}
        {currentStep === "configuring" && currentQuestion && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 md:p-8 shadow-xl border-2 border-green-300 min-h-[400px]">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center font-bold">
                {configStep + 1}
              </span>
              <div>
                <h4 className="font-bold text-xl text-emerald-800">
                  Question {configStep + 1} of {totalQuestions}
                </h4>
                <p className="text-sm text-emerald-600">{currentQuestion.section}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border-2 border-emerald-200 min-h-[120px] mb-6">
              {streamingQuestion ? (
                <p className="text-2xl md:text-3xl text-gray-800">
                  {streamingQuestion.split(" ").map((word, wordIdx, arr) => (
                    <span key={wordIdx}>
                      <span className="text-emerald-700 font-bold">{word}</span>
                      {wordIdx < arr.length - 1 ? " " : ""}
                    </span>
                  ))}
                </p>
              ) : (
                <p className="text-2xl md:text-3xl text-gray-400 italic">
                  {isStreaming ? "Speaking..." : "Ready for your answer..."}
                </p>
              )}
            </div>

            {!isStreaming && (
              <div className="bg-white rounded-xl border-2 border-purple-200 p-6 shadow-sm">
                {renderInput()}
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={handleNext}
                    disabled={
                      (Array.isArray(userInput) && userInput.length === 0) ||
                      (typeof userInput === "string" && !userInput.trim())
                    }
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.01] transition-transform"
                  >
                    <Send className="w-4 h-4" />
                    {configStep === totalQuestions - 1 ? "Submit Profile" : "Next Question"}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <button
                onClick={stopEverything}
                className="px-6 py-2 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-xl font-medium text-sm"
              >
                Stop Setup
              </button>
            </div>
          </div>
        )}

        {(currentStep === "submitting" || currentStep === "done") && (
          <div className="bg-white rounded-2xl p-12 shadow-xl border-2 border-emerald-300 text-center flex flex-col items-center justify-center min-h-[300px]">
            {currentStep === "submitting" ? (
              <>
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h3 className="text-xl font-bold text-gray-800">Saving Enterprise Profile...</h3>
              </>
            ) : (
              <>
                <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                <h3 className="text-2xl font-bold text-green-700">Profile Saved Successfully!</h3>
                <p className="text-gray-600 mt-2">Redirecting you to your dashboard...</p>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
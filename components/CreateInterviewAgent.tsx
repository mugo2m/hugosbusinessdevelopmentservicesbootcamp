"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  Mic,
  Send,
  CheckCircle,
  Volume2,
  ChevronDown,
} from "lucide-react";
import { useCurrency } from "@/lib/context/CurrencyContext";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";
import { BDS_TOPICS } from "@/lib/data/bdsTopics";

interface CreateInterviewAgentProps {
  userName: string;
  userId?: string;
  profileImage?: string;
}

const countryOptions = [
  "Algeria","Antigua and Barbuda","Argentina","Australia","Bahamas","Barbados","Belgium","Belize","Benin",
  "Bolivia","Botswana","Burkina Faso","Burundi","Cameroon","Canada","Central African Republic","Chad",
  "Chile","Colombia","Comoros","Congo (Brazzaville)","Congo (Kinshasa)","Costa Rica","Côte d'Ivoire","Cuba",
  "Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea",
  "Eswatini","Ethiopia","France","Gabon","Gambia","Ghana","Grenada","Guatemala","Guinea","Guinea-Bissau",
  "Guyana","Haiti","Honduras","India","Ireland","Jamaica","Kenya","Lesotho","Liberia","Libya","Madagascar",
  "Malawi","Mali","Mauritania","Mauritius","Mexico","Morocco","Mozambique","Namibia","New Zealand","Nicaragua",
  "Niger","Nigeria","Panama","Paraguay","Peru","Philippines","Rwanda","Saint Kitts and Nevis","Saint Lucia",
  "Saint Vincent and the Grenadines","Senegal","Seychelles","Sierra Leone","Singapore","Somalia","South Africa",
  "South Sudan","Spain","Sudan","Suriname","Tanzania","Togo","Trinidad and Tobago","Tunisia","Uganda",
  "United Kingdom","United States","Uruguay","Venezuela","Zambia","Zimbabwe",
].sort((a, b) => a.localeCompare(b));

const CreateInterviewAgent = ({
  userName,
  userId,
  profileImage,
}: CreateInterviewAgentProps) => {
  const { t, i18n } = useTranslation();
  const { setCountry, currency } = useCurrency();

  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userTranscript, setUserTranscript] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastSubmittedAnswer, setLastSubmittedAnswer] = useState("");
  const [recognitionLanguage, setRecognitionLanguage] = useState("en-US");
  const nameUsageCountRef = useRef(0);
  const voiceReadyToastShownRef = useRef(false);

  const getSpokenCurrencyName = (): string => currency.name;
  const getDisplaySymbol = (): string => currency.symbol;

  const safeT = useCallback(
    (key: string, params?: any): string => {
      try {
        const result = t(key, params);
        if (result && typeof result.then === "function") {
          console.warn(`Translation for "${key}" returned a Promise`);
          return key;
        }
        return typeof result === "string" ? result : String(result || "");
      } catch (e) {
        console.error("Translation error for key:", key, e);
        return key;
      }
    },
    [t]
  );

  const [currentStep, setCurrentStep] = useState<
    "idle" | "configuring" | "generating" | "redirecting" | "error"
  >("idle");
  const [configStep, setConfigStep] = useState(0);

  const [streamingQuestion, setStreamingQuestion] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const questionWordsRef = useRef<string[]>([]);

  const topicOptions = BDS_TOPICS;

  const [farmerDetails, setFarmerDetails] = useState({
    country: "",
    topic: "",
    topicLabel: "",
    county: "",
    subCounty: "",
    ward: "",
    village: "",
  });

  const [debugInfo, setDebugInfo] = useState({
    callStatus: "INACTIVE",
    currentQuestion: 0,
    totalQuestions: 0,
    isListening: false,
    userId: userId || "MISSING",
    voiceMode: "SIMULATED" as "REAL" | "SIMULATED",
    generatedSessionId: "",
  });

  const voiceAssistantRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const isRecognitionActiveRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const wordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const voiceCacheRef = useRef<Record<string, SpeechSynthesisVoice | null>>({});
  const ttsWarmedUpRef = useRef(false);

  const mapI18nToVoiceLanguage = (i18nLang: string): string => {
    switch (i18nLang) {
      case "sw": return "sw-KE";
      case "fr": return "fr-FR";
      case "es": return "es-ES";
      case "en-GB": return "en-GB";
      case "en-US": return "en-US";
      case "en": return "en-US";
      default: return "en-US";
    }
  };

  const previousLangRef = useRef<string>("");
  useEffect(() => {
    if (currentStep !== "idle") return;
    const newLang = i18n.language;
    if (!newLang) return;
    if (newLang === previousLangRef.current) return;
    previousLangRef.current = newLang;
    const voiceLang = mapI18nToVoiceLanguage(newLang);
    setRecognitionLanguage(voiceLang);
    if (recognitionRef.current) {
      recognitionRef.current.lang = voiceLang;
    }
  }, [i18n.language, currentStep]);

  const getQuestions = useCallback(() => {
    return [
      {
        id: "country",
        questionKey: "question_country",
        type: "dropdown",
        options: countryOptions as any[],
        sectionKey: "section_location",
      },
      {
        id: "topic",
        questionKey: "question_topic",
        type: "dropdown",
        options: topicOptions.map((t) => ({
          id: t.id,
          label: `${t.module} — ${safeT(t.topicLabel)}`,
        })) as any[],
        sectionKey: "section_topic",
      },
      {
        id: "county",
        questionKey: "question_county",
        type: "text",
        placeholder: safeT("county_placeholder", { default: "e.g., Nairobi" }),
        sectionKey: "section_location",
      },
      {
        id: "subCounty",
        questionKey: "question_sub_county",
        type: "text",
        placeholder: safeT("sub_county_placeholder", { default: "e.g., Westlands" }),
        sectionKey: "section_location",
      },
      {
        id: "ward",
        questionKey: "question_ward",
        type: "text",
        placeholder: safeT("ward_placeholder", { default: "e.g., Kangemi" }),
        sectionKey: "section_location",
      },
      {
        id: "village",
        questionKey: "question_village",
        type: "text",
        placeholder: safeT("village_placeholder", { default: "e.g., Mountain View" }),
        sectionKey: "section_location",
      },
    ];
  }, [topicOptions, safeT]);

  const allQuestions = useMemo(() => getQuestions(), [getQuestions]);
  const totalQuestions = allQuestions.length;

  useEffect(() => {
    setDebugInfo((prev) => ({ ...prev, totalQuestions }));
  }, [totalQuestions]);

  useEffect(() => {
    let isMounted = true;

    const checkVoiceSupport = () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window && isMounted) {
        const voices = window.speechSynthesis.getVoices();
        setDebugInfo((prev) => {
          const newMode = voices.length > 0 ? "REAL" : "SIMULATED";
          if (prev.voiceMode === newMode) return prev;
          return { ...prev, voiceMode: newMode };
        });
      }
    };

    checkVoiceSupport();
    const timeoutId = setTimeout(checkVoiceSupport, 500);

    if (
      typeof window !== "undefined" &&
      ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) &&
      !recognitionRef.current
    ) {
      const SpeechRecognition =
        (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = recognitionLanguage;
      recognitionRef.current.timeout = 15000;

      recognitionRef.current.onresult = (event: any) => {
        retryCountRef.current = 0;
        if (isRecognitionActiveRef.current) {
          isRecognitionActiveRef.current = false;
          setDebugInfo((prev) => ({ ...prev, isListening: false }));
        }
        const transcript = event.results[0][0].transcript;
        setUserTranscript(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        if (isRecognitionActiveRef.current) {
          isRecognitionActiveRef.current = false;
          setDebugInfo((prev) => ({ ...prev, isListening: false }));
        }
        if (event.error === "no-speech") {
          retryCountRef.current++;
          if (retryCountRef.current <= maxRetries) {
            toast.info(
              safeT("no_speech_detected", {
                current: retryCountRef.current,
                max: maxRetries,
              })
            );
            setTimeout(() => safeStartListening(), 2000);
          }
        }
      };

      recognitionRef.current.onend = () => {
        if (isRecognitionActiveRef.current) {
          isRecognitionActiveRef.current = false;
          setDebugInfo((prev) => ({ ...prev, isListening: false }));
        }
      };

      recognitionRef.current.onstart = () => {
        isRecognitionActiveRef.current = true;
        setDebugInfo((prev) => ({ ...prev, isListening: true }));
        retryCountRef.current = 0;
      };
    }

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (recognitionRef.current && isRecognitionActiveRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, [recognitionLanguage, safeT]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (allVoices.length === 0) return;
      const languages = ["en-US", "en-GB", "fr-FR", "es-ES", "sw-KE"];
      languages.forEach((lang) => {
        let voice = allVoices.find(
          (v) => v.lang === lang && !v.name.toLowerCase().includes("male")
        );
        if (!voice) voice = allVoices.find((v) => v.lang === lang);
        if (!voice) voice = allVoices.find((v) => v.lang.startsWith(lang.split("-")[0]));
        if (voice) voiceCacheRef.current[lang] = voice;
      });
      if (!voiceCacheRef.current["default"]) {
        voiceCacheRef.current["default"] = allVoices[0] || null;
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const warmUpTTS = useCallback(() => {
    if (ttsWarmedUpRef.current) return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    try {
      const dummy = new SpeechSynthesisUtterance(" ");
      dummy.volume = 0;
      dummy.rate = 1;
      dummy.pitch = 1;
      dummy.onend = () => {
        window.speechSynthesis.cancel();
        ttsWarmedUpRef.current = true;
      };
      dummy.onerror = () => {
        window.speechSynthesis.cancel();
        ttsWarmedUpRef.current = true;
      };
      window.speechSynthesis.speak(dummy);
      setTimeout(() => {
        window.speechSynthesis.cancel();
        ttsWarmedUpRef.current = true;
      }, 200);
    } catch {
      ttsWarmedUpRef.current = true;
    }
  }, []);

  const streamQuestionWithVoice = useCallback(
    (fullText: string): Promise<void> => {
      return new Promise((resolve) => {
        if (!voiceEnabled || !window.speechSynthesis) {
          setStreamingQuestion(fullText);
          resolve();
          return;
        }
        if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
        if (wordTimerRef.current) {
          clearTimeout(wordTimerRef.current);
          wordTimerRef.current = null;
        }
        if (!fullText || fullText.trim().length === 0) {
          setStreamingQuestion(fullText);
          resolve();
          return;
        }

        setIsStreaming(true);
        setStreamingQuestion("");
        setCurrentWordIndex(0);
        setUserTranscript("");

        const spokenCurrencyName = getSpokenCurrencyName();
        const currencySymbol = currency.symbol;
        const escapedSymbol = currencySymbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        let speechText = fullText.replace(
          new RegExp(`${escapedSymbol}\\s`, "g"),
          `${spokenCurrencyName} `
        );
        speechText = speechText.replace(
          new RegExp(`\\b${escapedSymbol}\\b`, "g"),
          spokenCurrencyName
        );

        if (recognitionRef.current && isRecognitionActiveRef.current) {
          try {
            recognitionRef.current.stop();
          } catch {}
          isRecognitionActiveRef.current = false;
          setDebugInfo((prev) => ({ ...prev, isListening: false }));
        }

        const words = speechText.split(" ");
        questionWordsRef.current = words;
        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.rate = 1.0;
        utterance.pitch = 1.1;
        utterance.lang = recognitionLanguage;

        const cachedVoice =
          voiceCacheRef.current[recognitionLanguage] ||
          voiceCacheRef.current["default"] ||
          null;
        if (cachedVoice) utterance.voice = cachedVoice;

        setIsSpeaking(true);

        let wordIndex = 0;
        let currentText = "";
        let isFinished = false;
        let speechEnded = false;

        const finish = () => {
          if (isFinished) return;
          isFinished = true;
          speechEnded = true;
          if (wordTimerRef.current) {
            clearTimeout(wordTimerRef.current);
            wordTimerRef.current = null;
          }
          let finalDisplay = fullText;
          const displaySymbol = getDisplaySymbol();
          if (displaySymbol !== currencySymbol) {
            finalDisplay = finalDisplay.replace(new RegExp(escapedSymbol, "g"), displaySymbol);
          }
          setStreamingQuestion(finalDisplay);
          setIsStreaming(false);
          setIsSpeaking(false);
          resolve();
        };

        const scheduleNextWord = () => {
          if (isFinished || wordIndex >= words.length) {
            if (wordTimerRef.current) {
              clearTimeout(wordTimerRef.current);
              wordTimerRef.current = null;
            }
            return;
          }
          const word = words[wordIndex];
          const duration = Math.max(150, Math.min(1200, word.length * 100));
          wordTimerRef.current = setTimeout(() => {
            currentText += (currentText ? " " : "") + word;
            let displayText = currentText;
            const displaySymbol = getDisplaySymbol();
            if (displaySymbol !== currencySymbol) {
              displayText = displayText.replace(new RegExp(spokenCurrencyName, "g"), displaySymbol);
            }
            setStreamingQuestion(displayText);
            setCurrentWordIndex(wordIndex + 1);
            wordIndex++;
            scheduleNextWord();
          }, duration);
        };

        if (words.length > 0) {
          scheduleNextWord();
        } else {
          finish();
          return;
        }

        const estimatedDuration = Math.max(5000, fullText.length * 100);
        const safetyTimeout = setTimeout(() => {
          if (!isFinished) {
            window.speechSynthesis.cancel();
            finish();
          }
        }, estimatedDuration + 5000);

        utterance.onend = () => {
          clearTimeout(safetyTimeout);
          if (!isFinished) {
            if (wordTimerRef.current) {
              clearTimeout(wordTimerRef.current);
              wordTimerRef.current = null;
            }
            let finalDisplay = fullText;
            const displaySymbol = getDisplaySymbol();
            if (displaySymbol !== currencySymbol) {
              finalDisplay = finalDisplay.replace(new RegExp(escapedSymbol, "g"), displaySymbol);
            }
            setStreamingQuestion(finalDisplay);
            setCurrentWordIndex(words.length);
            setIsStreaming(false);
            setIsSpeaking(false);
            resolve();
            isFinished = true;
          } else if (!speechEnded) {
            setIsStreaming(false);
            setIsSpeaking(false);
            resolve();
            speechEnded = true;
          }
        };

        utterance.onerror = () => {
          clearTimeout(safetyTimeout);
          if (!isFinished) {
            if (wordTimerRef.current) {
              clearTimeout(wordTimerRef.current);
              wordTimerRef.current = null;
            }
            let finalDisplay = fullText;
            const ds = getDisplaySymbol();
            if (ds !== currencySymbol) {
              finalDisplay = finalDisplay.replace(new RegExp(escapedSymbol, "g"), ds);
            }
            setStreamingQuestion(finalDisplay);
            setIsStreaming(false);
            setIsSpeaking(false);
            resolve();
            isFinished = true;
            speechEnded = true;
          } else if (!speechEnded) {
            setIsStreaming(false);
            setIsSpeaking(false);
            resolve();
            speechEnded = true;
          }
        };

        window.speechSynthesis.speak(utterance);
      });
    },
    [currency, voiceEnabled, recognitionLanguage, getSpokenCurrencyName, getDisplaySymbol]
  );

  useEffect(() => {
    if (!voiceEnabled) {
      voiceAssistantRef.current = null;
      voiceReadyToastShownRef.current = false;
      ttsWarmedUpRef.current = false;
      return;
    }
    voiceAssistantRef.current = {
      speak: async (text: string) => streamQuestionWithVoice(text),
    };
    if (!ttsWarmedUpRef.current) warmUpTTS();
    if (voiceEnabled && !voiceReadyToastShownRef.current) {
      toast.success(safeT("voice_ready"));
      voiceReadyToastShownRef.current = true;
    }
  }, [voiceEnabled, safeT, warmUpTTS, streamQuestionWithVoice]);

  const speakAcknowledgment = async (answer: string, fieldId: string) => {
    const spokenCurrencyName = getSpokenCurrencyName();
    const currencySymbol = currency.symbol;
    const escapedSymbol = currencySymbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    let spokenAnswer = answer.replace(
      new RegExp(`${escapedSymbol}\\s`, "g"),
      `${spokenCurrencyName} `
    );
    spokenAnswer = spokenAnswer.replace(
      new RegExp(`\\b${escapedSymbol}\\b`, "g"),
      spokenCurrencyName
    );

    let acknowledgment = "";
    if (fieldId === "country") {
      acknowledgment = safeT("ack_country", { answer: spokenAnswer });
      setCountry(answer.toLowerCase());
    } else if (fieldId === "topic") {
      const chosen = topicOptions.find((t) => t.id === answer);
      acknowledgment = safeT("ack_topic", {
        answer: chosen ? safeT(chosen.topicLabel) : spokenAnswer,
      });
    } else if (fieldId === "county") {
      acknowledgment = safeT("ack_county", { answer: spokenAnswer });
    } else if (fieldId === "subCounty") {
      acknowledgment = safeT("ack_sub_county", { answer: spokenAnswer });
    } else if (fieldId === "ward") {
      acknowledgment = safeT("ack_ward", { answer: spokenAnswer });
    } else if (fieldId === "village") {
      acknowledgment = safeT("ack_village", { answer: spokenAnswer });
    } else {
      acknowledgment = safeT("ack_generic", { answer: spokenAnswer });
    }

    if (voiceAssistantRef.current) {
      await voiceAssistantRef.current.speak(acknowledgment);
    }
    toast.success(safeT("recorded", { answer }));
  };

  const processAnswer = async (answer: string) => {
    if (currentStep !== "configuring") return;

    const currentConfig = allQuestions[configStep];
    let cleanAnswer = answer.trim();

    if (!cleanAnswer) {
      const msg = safeT("please_provide_answer");
      toast.warning(msg);
      if (voiceAssistantRef.current) {
        await voiceAssistantRef.current.speak(msg);
      }
      return;
    }

    let finalValue = cleanAnswer;

    if (currentConfig.type === "dropdown") {
      const strOpts = (currentConfig.options || []).filter(
        (o: any) => typeof o === "string"
      ) as string[];
      const objOpts = (currentConfig.options || []).filter(
        (o: any) => typeof o === "object"
      ) as Array<{ id: string; label: string }>;

      if (objOpts.length > 0) {
        const matched = objOpts.find(
          (o) =>
            o.id === cleanAnswer ||
            o.label.toLowerCase() === cleanAnswer.toLowerCase()
        );
        const chosen = matched || objOpts[0];
        finalValue = chosen.id;
        setFarmerDetails((prev) => ({ ...prev, topicLabel: chosen.label }));
      } else {
        const matched = strOpts.find(
          (o) => o.toLowerCase() === cleanAnswer.toLowerCase()
        );
        finalValue = matched ?? strOpts[0];
      }
    }

    setFarmerDetails((prev) => ({ ...prev, [currentConfig.id]: finalValue }));
    setLastSubmittedAnswer(cleanAnswer);

    await speakAcknowledgment(cleanAnswer, currentConfig.id);
    setUserTranscript("");

    if (configStep < allQuestions.length - 1) {
      const nextStep = configStep + 1;
      setConfigStep(nextStep);
      setTimeout(() => askQuestion(nextStep), 2500);
    } else {
      setCurrentStep("generating");
      generateSession();
    }
  };

  const safeStartListening = () => {
    if (isSpeaking || isStreaming) return;
    if (!recognitionRef.current || isRecognitionActiveRef.current) return;
    if (recognitionRef.current.lang !== recognitionLanguage) {
      recognitionRef.current.lang = recognitionLanguage;
    }
    try {
      recognitionRef.current.start();
      setDebugInfo((prev) => ({ ...prev, isListening: true }));
    } catch {}
  };

  const safeStopListening = () => {
    if (recognitionRef.current && isRecognitionActiveRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      isRecognitionActiveRef.current = false;
      setDebugInfo((prev) => ({ ...prev, isListening: false }));
    }
  };

  const startVoiceSetup = async () => {
    if (!voiceEnabled || !voiceAssistantRef.current) {
      toast.error(safeT("enable_voice_first"));
      return;
    }

    safeStopListening();
    setCurrentStep("configuring");
    setConfigStep(0);
    setUserTranscript("");
    setLastSubmittedAnswer("");
    nameUsageCountRef.current = 0;

    setFarmerDetails({
      country: "",
      topic: "",
      topicLabel: "",
      county: "",
      subCounty: "",
      ward: "",
      village: "",
    });

    await askQuestion(0);
  };

  const askQuestion = async (step: number) => {
    if (!voiceAssistantRef.current || step >= allQuestions.length) return;
    if (isSpeaking) await new Promise((resolve) => setTimeout(resolve, 500));

    const questionKey = allQuestions[step].questionKey;
    const question = safeT(questionKey);

    setDebugInfo((prev) => ({ ...prev, currentQuestion: step + 1 }));
    setUserTranscript("");
    setLastSubmittedAnswer("");

    await voiceAssistantRef.current.speak(question);

    const q = allQuestions[step];
    const textFields = ["county", "subCounty", "ward", "village"];
    if (q.type === "dropdown" && !textFields.includes(q.id)) {
      safeStartListening();
    }
  };

  const generateSession = async () => {
    if (!voiceAssistantRef.current) return;
    setIsLoading(true);

    await voiceAssistantRef.current.speak(safeT("creating_profile"));

    const currentUserId =
      userId || localStorage.getItem("userId") || `user-${Date.now()}`;
    localStorage.setItem("userId", currentUserId);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    const requestBody = {
      userid: currentUserId,
      country: farmerDetails.country.toLowerCase(),
      topic: farmerDetails.topic,
      topicLabel: farmerDetails.topicLabel,
      county: farmerDetails.county,
      subCounty: farmerDetails.subCounty,
      ward: farmerDetails.ward,
      village: farmerDetails.village,
      language: i18n.language,
    };

    console.log("📤 [generateSession] Sending BDS request:", requestBody);

    try {
      const response = await fetch("/api/vapi/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      console.log("📥 [generateSession] Response:", data);

      if (data.success && data.sessionId) {
        await voiceAssistantRef.current.speak(safeT("ready_redirect"));
        setTimeout(() => (window.location.href = `/interview/${data.sessionId}`), 2000);
        setCurrentStep("redirecting");
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("❌ [generateSession] Error:", error);
      if (error.name === "AbortError") {
        toast.error(safeT("request_timeout") || "Request timed out. Please try again.");
      } else {
        toast.error(
          safeT("error_creating_profile") || "Failed to create learning session. Please try again."
        );
      }
      setCurrentStep("error");
    } finally {
      setIsLoading(false);
    }
  };

  const stopEverything = () => {
    safeStopListening();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (wordTimerRef.current) {
      clearTimeout(wordTimerRef.current);
      wordTimerRef.current = null;
    }
    setCurrentStep("idle");
    setStreamingQuestion("");
    setIsStreaming(false);
    setUserTranscript("");
  };

  const submitAnswer = () => {
    if (userTranscript.trim()) processAnswer(userTranscript);
  };

  const renderInput = useCallback(() => {
    const q = allQuestions[configStep];
    if (!q) return null;

    if (q.type === "dropdown") {
      return (
        <div className="relative">
          <select
            value={userTranscript}
            onChange={(e) => setUserTranscript(e.target.value)}
            className="w-full px-4 py-3 border-2 rounded-xl appearance-none text-blue-900 font-medium focus:border-blue-600"
          >
            <option value="" className="text-gray-500">
              {safeT("select_option")}
            </option>
            {(q.options as any[])?.map((opt: any, index: number) => {
              if (typeof opt === "string") {
                return (
                  <option key={`${opt}-${index}`} value={opt} className="text-blue-900">
                    {opt}
                  </option>
                );
              }
              return (
                <option key={opt.id} value={opt.id} className="text-blue-900">
                  {opt.label}
                </option>
              );
            })}
          </select>
          <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-blue-600 pointer-events-none" />
        </div>
      );
    }

    if (q.type === "text") {
      return (
        <input
          key={`text-input-${configStep}`}
          autoFocus
          type="text"
          value={userTranscript}
          onChange={(e) => setUserTranscript(e.target.value)}
          placeholder={(q as any).placeholder || safeT("type_answer")}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          name="noautofill"
          id="noautofill"
          className="w-full px-4 py-3 border-2 rounded-xl text-blue-900 font-medium focus:border-blue-600 placeholder-gray-400"
        />
      );
    }

    return null;
  }, [configStep, allQuestions, userTranscript, safeT]);

  const colors = {
    background: "bg-gradient-to-br from-slate-50 to-white",
    card: "bg-white/80 backdrop-blur-sm",
  };

  const currentSectionKey = allQuestions[configStep]?.sectionKey;
  const currentSection = currentSectionKey ? safeT(currentSectionKey) : "";
  const wordProgress =
    currentWordIndex > 0 && questionWordsRef.current.length > 0
      ? `${currentWordIndex}/${questionWordsRef.current.length} ${safeT("words")}`
      : "";

  return (
    // ✅ OUTER WRAPPER — full-screen photo background (no dark overlay)
    <div
      className="min-h-screen w-full flex justify-center items-start bg-cover bg-center bg-no-repeat relative p-4"
      style={{ backgroundImage: "url('/muiruri.jpg')" }}
    >
      {/* ✅ YOUR ORIGINAL LAYOUT — untouched */}
      <div className="relative z-10 flex flex-col gap-6 p-4 rounded-2xl w-full max-w-4xl">

        {/* Header */}
        <div className={`${colors.card} rounded-2xl p-5 shadow-xl border`}>
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="flex items-center gap-4">
              <Image
                src={profileImage || "/farmer-avatar.png"}
                alt="Learner"
                width={48}
                height={48}
                className="rounded-full ring-4"
              />
              <div>
                <h4 className="font-bold text-xl">{userName || safeT("learner")}</h4>
                <p className="text-sm text-gray-500">
                  {safeT("bds_learner_building") || "BDS Learner • Building Your Business"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="bg-white/80 rounded-xl px-2 py-1 border border-gray-200 shadow-sm">
                <CurrencySwitcher />
              </div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl px-3 py-2 border border-white-30">
                <Mic className={`w-5 h-5 text-white ${isSpeaking ? "animate-pulse" : ""}`} />
                <button
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  disabled={currentStep === "generating" || currentStep === "redirecting"}
                  className={`text-white font-medium focus:outline-none ${
                    currentStep === "generating" || currentStep === "redirecting"
                      ? "opacity-50 cursor-not-allowed text-lg"
                      : "text-sm"
                  }`}
                >
                  {currentStep === "generating" || currentStep === "redirecting"
                    ? safeT("generating_please_wait")
                    : voiceEnabled
                    ? safeT("voice_on")
                    : safeT("voice_off")}
                </button>
              </div>
              <button
                onClick={startVoiceSetup}
                disabled={!voiceEnabled || currentStep !== "idle"}
                className={`px-6 py-2 rounded-xl font-bold text-sm ${
                  voiceEnabled && currentStep === "idle"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-105 transition-all"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {currentStep === "generating" || currentStep === "redirecting"
                  ? safeT("generating_please_wait")
                  : currentStep === "idle"
                  ? safeT("start_setup")
                  : safeT("loading")}
              </button>
            </div>
          </div>
          {isSpeaking && (
            <div className="mt-2 text-xs text-blue-600 flex items-center gap-1">
              <Volume2 className="w-3 h-3 animate-pulse" />
              <span>
                {safeT("speaking")} {wordProgress}
              </span>
            </div>
          )}
        </div>

        {/* Question Display */}
        {currentStep === "configuring" && allQuestions.length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 shadow-xl border-2 border-green-300 min-h-[300px]">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center font-bold">
                {configStep + 1}
              </span>
              <h4 className="font-bold text-xl text-emerald-800">
                {safeT("question_x_of_y", { current: configStep + 1, total: allQuestions.length })}
              </h4>
              {currentSection && <p className="text-sm text-emerald-600 ml-auto">{currentSection}</p>}
              {isStreaming && (
                <span className="ml-auto flex items-center gap-2 text-emerald-600">
                  <Volume2 className="w-5 h-5 animate-pulse" />
                  <span className="text-sm">{wordProgress}</span>
                </span>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 border-2 border-emerald-200 min-h-[120px]">
              {streamingQuestion ? (
                <p className="text-3xl text-gray-800">
                  {streamingQuestion.split(" ").map((word, wordIdx, arr) => (
                    <span key={wordIdx}>
                      <span className="text-emerald-700 font-bold">{word}</span>
                      {wordIdx < arr.length - 1 ? " " : ""}
                    </span>
                  ))}
                </p>
              ) : (
                <p className="text-3xl text-gray-400 italic">
                  {isStreaming ? safeT("speaking_dots") : safeT("ready_for_answer")}
                </p>
              )}
            </div>

            {!isStreaming && streamingQuestion && (
              <div className="mt-6">
                <div className="bg-white rounded-xl border-2 border-purple-200 p-6">
                  {renderInput()}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={submitAnswer}
                      disabled={!userTranscript.trim()}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-2.5 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {safeT("submit_answer")}
                    </button>
                  </div>
                </div>

                {lastSubmittedAnswer && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-xl border-2 border-blue-200">
                    <p className="text-sm text-blue-800 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                      {safeT("your_answer")}:{" "}
                      <span className="font-bold text-blue-900">{lastSubmittedAnswer}</span>
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {safeT("voice_confirmation_sent")}
                    </p>
                  </div>
                )}

                {debugInfo.isListening && (
                  <div className="mt-3 p-3 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-red-600">
                      {safeT("listening_speak_now")}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Stop Button */}
        {(currentStep === "configuring" || currentStep === "generating") && (
          <button
            onClick={stopEverything}
            className="px-5 py-3 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-xl mx-auto w-48 font-medium flex items-center justify-center gap-2"
          >
            <span>{safeT("stop_setup")}</span>
          </button>
        )}

      </div>
    </div>
  );
};

export default CreateInterviewAgent;
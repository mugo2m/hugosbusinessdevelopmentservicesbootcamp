// components/Agent.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { useOfflineTranslation } from "@/lib/hooks/useOfflineTranslation";
import VoiceService from "@/lib/voice/VoiceService";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { OfflineBanner } from "@/components/OfflineBanner";
import {
  Sparkles,
  Volume2,
  Mic,
  MicOff,
  Loader2,
  ArrowLeft,
  MessageCircle,
  Rocket,
  BookOpen,
  GraduationCap,
  CheckCircle2,
} from "lucide-react";

const LINE_BREAK = "␊";

interface AgentProps {
  userName: string;
  userId?: string;
  interviewId?: string;
  sessionData?: any;
}

interface LessonSection {
  id?: string;
  title: string;
  type: "text" | "example" | "quiz";
  content?: string;
  question?: string;
  options?: string[];
  correctIndex?: number;
}

const Agent = ({ userName, userId, interviewId, sessionData }: AgentProps) => {
  const { t, ready, i18n } = useOfflineTranslation();

  // ===== SAFE TRANSLATION (same pattern as working app) =====
  const safeT = (key: string, params?: any): string => {
    try {
      if (key && (key.includes(" ") || key.includes("\n") || key.includes("."))) return key;
      const template = i18n.t(key);
      if (!params) return template;
      let result = template;
      for (const [paramKey, paramValue] of Object.entries(params)) {
        result = result.replace(new RegExp(`{{${paramKey}}}`, "g"), String(paramValue));
      }
      return result;
    } catch {
      return key;
    }
  };

  // ===== STATE (mirrors working app) =====
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceInitializing, setVoiceInitializing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [welcomeSpoken, setWelcomeSpoken] = useState(false);
  const [sectionsSpoken, setSectionsSpoken] = useState(false);
  const [sections, setSections] = useState<LessonSection[]>([]);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [readSections, setReadSections] = useState<Set<number>>(new Set());
  const [sectionStreams, setSectionStreams] = useState<{ [key: number]: string }>({});
  const [activeStreamingSection, setActiveStreamingSection] = useState<number | null>(null);

  // Farmers comments
  const [learnerComment, setLearnerComment] = useState<string>("");
  const [isCommentSubmitting, setIsCommentSubmitting] = useState<boolean>(false);
  const [commentSubmitted, setCommentSubmitted] = useState<boolean>(false);

  const nameUsageCountRef = useRef(0);
  const voiceServiceRef = useRef<VoiceService | null>(null);
  const mountedRef = useRef(true);
  const voiceServiceInitializedRef = useRef(false);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const learnerName =
    sessionData?.learnerName || sessionData?.farmerName || userName || "Learner";
  const learnerCountry = sessionData?.country || "kenya";
  const topicLabel = sessionData?.topicLabel || "Lesson";
  const moduleName = sessionData?.module || "";
  const county = sessionData?.county || "";
  const country = sessionData?.country || "";

  // ===== LOAD SECTIONS =====
  useEffect(() => {
    const raw = sessionData?.lessonSections || sessionData?.structuredList || [];
    if (Array.isArray(raw) && raw.length > 0) {
      console.log(`✅ [Agent] Loaded ${raw.length} lesson sections`);
      setSections(raw);
    }
  }, [sessionData]);

  // ===== RECOGNITION LANGUAGE (from working app) =====
  const recognitionLanguage = (() => {
    const lang = i18n.language || "en";
    if (lang === "en-GB") return "en-GB";
    if (lang === "en") return "en-US";
    if (lang === "fr") return "fr-FR";
    if (lang === "sw") return "sw-KE";
    if (lang === "es") return "es-ES";
    return "en-US";
  })();

  // ===== GET BEST VOICE (identical to working app) =====
  const getBestVoice = () => {
    const voices = window.speechSynthesis.getVoices();

    const findBritishEnglishFemale = (): SpeechSynthesisVoice | null => {
      const femaleNames = ["libby", "hazel", "susan", "maisie", "sonia", "kate", "victoria", "millie", "olivia", "google uk english female", "microsoft libby", "microsoft hazel", "microsoft susan", "microsoft maisie", "microsoft sonia", "british english female", "uk english female"];
      for (const name of femaleNames) {
        const voice = voices.find((v) => v.lang === "en-GB" && v.name.toLowerCase().includes(name));
        if (voice) return voice;
      }
      const maleIndicators = ["george", "ryan", "thomas", "david", "mark", "james", "john", "paul", "michael"];
      const anyBritishFemale = voices.find((v) => v.lang === "en-GB" && !maleIndicators.some((m) => v.name.toLowerCase().includes(m)));
      if (anyBritishFemale) return anyBritishFemale;
      return voices.find((v) => v.lang === "en-GB") || null;
    };

    const findAmericanEnglishFemale = (): SpeechSynthesisVoice | null => {
      const femaleNames = ["samantha", "victoria", "zira", "jenny", "aria", "google us english female", "microsoft jenny", "microsoft zira", "microsoft aria", "us english female"];
      for (const name of femaleNames) {
        const voice = voices.find((v) => v.lang === "en-US" && v.name.toLowerCase().includes(name));
        if (voice) return voice;
      }
      const maleIndicators = ["david", "mark", "james", "john", "paul", "michael", "alex", "thomas"];
      const anyFemale = voices.find((v) => v.lang === "en-US" && !maleIndicators.some((m) => v.name.toLowerCase().includes(m)));
      if (anyFemale) return anyFemale;
      return voices.find((v) => v.lang === "en-US") || null;
    };

    const findFrenchVoice = (): SpeechSynthesisVoice | null => {
      const vivienne = voices.find((v) => v.lang.startsWith("fr") && v.name.toLowerCase().includes("vivienne"));
      if (vivienne) return vivienne;
      const frenchFemale = voices.find((v) => v.lang.startsWith("fr") && (v.name.toLowerCase().includes("denise") || v.name.toLowerCase().includes("google français female") || v.name.toLowerCase().includes("marie") || v.name.toLowerCase().includes("chloe")));
      if (frenchFemale) return frenchFemale;
      return voices.find((v) => v.lang.startsWith("fr")) || null;
    };

    const findSpanishVoice = (): SpeechSynthesisVoice | null => {
      const femaleNames = ["elena", "ximena", "maria", "paloma", "sofia", "catalina", "salome", "belkys", "ramona", "andrea", "lorena", "teresa", "marta", "karla", "dalia", "yolanda", "margarita", "tania", "camila", "karina", "elvira", "valentina", "paola", "michelle", "gabriela", "lucia", "laura", "fernanda", "victoria", "monica", "paulina", "sabina", "helena", "florencia"];
      for (const name of femaleNames) {
        const voice = voices.find((v) => v.lang.startsWith("es") && v.name.toLowerCase().includes(name));
        if (voice) return voice;
      }
      const nonMale = voices.find((v) => v.lang.startsWith("es") && !v.name.toLowerCase().includes("alvaro") && !v.name.toLowerCase().includes("jorge") && !v.name.toLowerCase().includes("manuel") && !v.name.toLowerCase().includes("andres") && !v.name.toLowerCase().includes("carlos") && !v.name.toLowerCase().includes("juan") && !v.name.toLowerCase().includes("luis") && !v.name.toLowerCase().includes("rodrigo") && !v.name.toLowerCase().includes("javier"));
      if (nonMale) return nonMale;
      return null;
    };

    const findSwahiliVoice = (): SpeechSynthesisVoice | null => {
      let swahiliVoices = voices.filter((v) => v.lang === "sw-KE" && (v.name.includes("Rafiki") || v.name.includes("Zuri") || v.name.includes("Aisha") || v.name.includes("Kenya")));
      if (swahiliVoices.length > 0) return swahiliVoices[0];
      swahiliVoices = voices.filter((v) => v.lang === "sw-KE");
      if (swahiliVoices.length > 0) return swahiliVoices[0];
      return null;
    };

    if (recognitionLanguage === "en-GB") {
      const britishVoice = findBritishEnglishFemale();
      if (britishVoice) return { voice: britishVoice, language: "en-GB" };
      const anyNonMale = voices.find((v) => v.lang.startsWith("en") && !v.name.toLowerCase().includes("male"));
      if (anyNonMale) return { voice: anyNonMale, language: "en-GB" };
    }
    if (recognitionLanguage === "en-US") {
      const usVoice = findAmericanEnglishFemale();
      if (usVoice) return { voice: usVoice, language: "en-US" };
      const anyNonMale = voices.find((v) => v.lang.startsWith("en") && !v.name.toLowerCase().includes("male"));
      if (anyNonMale) return { voice: anyNonMale, language: "en-US" };
    }
    if (recognitionLanguage === "fr-FR" || recognitionLanguage === "fr-CA" || recognitionLanguage.startsWith("fr")) {
      const frenchVoice = findFrenchVoice();
      if (frenchVoice) return { voice: frenchVoice, language: "fr-FR" };
    }
    if (recognitionLanguage === "es-ES" || recognitionLanguage.startsWith("es")) {
      const spanishVoice = findSpanishVoice();
      if (spanishVoice) return { voice: spanishVoice, language: "es-ES" };
    }
    if (recognitionLanguage === "sw-KE" || recognitionLanguage === "sw-TZ" || recognitionLanguage.startsWith("sw")) {
      const swahiliVoice = findSwahiliVoice();
      if (swahiliVoice) return { voice: swahiliVoice, language: "sw-KE" };
    }
    const anyEnglish = voices.find((v) => v.lang.startsWith("en") && !v.name.toLowerCase().includes("male"));
    if (anyEnglish) return { voice: anyEnglish, language: "en-GB" };
    if (voices.length > 0) return { voice: voices[0], language: "en-GB" };
    return { voice: null, language: "en-GB" };
  };

  // ===== WAIT FOR VOICES =====
  const waitForVoices = (maxAttempts = 10): Promise<void> => {
    return new Promise((resolve) => {
      const check = (attempt = 0) => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          setVoicesLoaded(true);
          resolve();
        } else if (attempt < maxAttempts) {
          setTimeout(() => check(attempt + 1), 300);
        } else {
          setVoicesLoaded(false);
          resolve();
        }
      };
      check();
    });
  };

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      waitForVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => waitForVoices();
      }
    }
  }, []);

  // ===== VOICE SERVICE INIT (same as working app) =====
  useEffect(() => {
    if (!mountedRef.current) return;
    if (voiceServiceInitializedRef.current && voiceServiceRef.current) return;

    if (!voiceEnabled) {
      if (voiceServiceRef.current) {
        voiceServiceRef.current.destroy();
        voiceServiceRef.current = null;
        voiceServiceInitializedRef.current = false;
      }
      return;
    }

    if (voiceEnabled && !voiceServiceRef.current && !voiceServiceInitializedRef.current) {
      let currentUserId = userId;
      if (!currentUserId) {
        currentUserId = localStorage.getItem("userId") || `user-${Date.now()}`;
        localStorage.setItem("userId", currentUserId);
      }

      try {
        voiceServiceRef.current = new VoiceService({
          interviewId: interviewId || `demo-${Date.now()}`,
          userId: currentUserId,
          type: "practice",
          speechRate: 0.9,
          speechVolume: 0.8,
          country: learnerCountry,
          farmerName: learnerName,
        });
        voiceServiceInitializedRef.current = true;
        setVoiceInitializing(false);
        toast.success(safeT("bds_tutor_here") || "BDS Tutor is here!");
      } catch (error: any) {
        console.error("Failed to initialize VoiceService:", error);
        toast.error(safeT("voice_service_failed") || "Failed to initialize voice service");
        setVoiceInitializing(false);
      }
    }
  }, [voiceEnabled, learnerName, learnerCountry, safeT]);

  if (!ready) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner fullScreen={false} message="Loading your lesson..." />
      </div>
    );
  }

  // ===== CLEAN TEXT (same) =====
  const cleanText = (text: string): string => {
    return text
      .replace(/[\u{1F600}-\u{1F64F}]/gu, "")
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, "")
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, "")
      .replace(/\*\*\*/g, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/#{1,6}\s?/g, "")
      .replace(/_/g, "")
      .replace(/~/g, "")
      .replace(/`/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  // ===== PREPARE FOR SPEECH (same, plus learner name rotation) =====
  const prepareForSpeech = (text: string): string => {
    let speechText = cleanText(text);

    nameUsageCountRef.current++;
    const useName = nameUsageCountRef.current % 3 === 0;
    speechText = speechText
      .replace(/\b(farmer|learner)\b/gi, useName ? learnerName : "the learner")
      .replace(/\b(you)\b/gi, useName ? learnerName : "you")
      .replace(/\b(your)\b/gi, useName ? `${learnerName}'s` : "your");
    return speechText;
  };

  // ===== STREAM KARAOKE (identical rAF-based reveal) =====
  const streamSectionKaraoke = async (rawText: string, index: number) => {
    if (!voiceEnabled || !window.speechSynthesis) return;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      await new Promise((r) => setTimeout(r, 200));
    }

    setActiveStreamingSection(index);
    setSectionStreams((prev) => ({ ...prev, [index]: "" }));

    const fullRawText = rawText;
    const speechText = prepareForSpeech(rawText);
    const totalChars = speechText.length;
    const totalDuration = Math.max(3000, totalChars * 80);
    let startTime = 0;
    let animationId: number | null = null;

    const updateProgress = (progress: number) => {
      const charIndex = Math.floor(progress * fullRawText.length);
      setSectionStreams((prev) => ({
        ...prev,
        [index]: fullRawText.substring(0, charIndex),
      }));
    };

    const startAnimation = () => {
      if (animationId) cancelAnimationFrame(animationId);
      startTime = 0;
      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(1, elapsed / totalDuration);
        updateProgress(progress);
        if (progress < 1) {
          animationId = requestAnimationFrame(animate);
        } else {
          setSectionStreams((prev) => ({ ...prev, [index]: fullRawText }));
          animationId = null;
        }
      };
      animationId = requestAnimationFrame(animate);
    };

    startAnimation();

    const utterance = new SpeechSynthesisUtterance(speechText);
    const { voice, language } = getBestVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = language;
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 1.0;

    await new Promise<void>((resolve) => {
      utterance.onend = () => {
        if (animationId) cancelAnimationFrame(animationId);
        setSectionStreams((prev) => ({ ...prev, [index]: fullRawText }));
        setReadSections((prev) => new Set(prev).add(index));
        setActiveStreamingSection(null);
        resolve();
      };
      utterance.onerror = (err) => {
        console.error("Speech error:", err);
        if (animationId) cancelAnimationFrame(animationId);
        setSectionStreams((prev) => ({ ...prev, [index]: fullRawText }));
        setReadSections((prev) => new Set(prev).add(index));
        setActiveStreamingSection(null);
        resolve();
      };
      window.speechSynthesis.speak(utterance);
      currentUtteranceRef.current = utterance;
    });
  };

  // ===== SPEAK WITH VOICE (short utterances like welcome) =====
  const speakWithVoice = async (text: string): Promise<void> => {
    if (!window.speechSynthesis) return;
    if (!voicesLoaded) await waitForVoices();
    const speechText = prepareForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(speechText);
    const { voice, language } = getBestVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = language;
    utterance.rate = 0.9;
    return new Promise((resolve) => {
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  };

  // ===== BUILD SPEECH TEXT FROM SECTION =====
  const buildSectionSpeech = (s: LessonSection): string => {
    if (s.type === "quiz" && s.question) {
      const opts = (s.options || [])
        .map((o, idx) => `${String.fromCharCode(65 + idx)}. ${o}`)
        .join(". ");
      return `${s.title}. ${s.question}. ${opts}.`;
    }
    return `${s.title}. ${s.content || ""}`;
  };

  // ===== STREAM ALL SECTIONS (adapted from streamAllRecommendations) =====
  const streamAllSections = async () => {
    if (sections.length === 0 || sectionsSpoken) return;

    setSectionsSpoken(true);
    nameUsageCountRef.current = 0;

    const introMessage = safeT(
      "prepared_lesson_recommendations",
      `Let's begin your lesson on ${topicLabel}.`
    );
    await speakWithVoice(introMessage);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    for (let i = 0; i < sections.length; i++) {
      const speechText = buildSectionSpeech(sections[i]);
      if (!speechText.trim()) {
        console.log(`⚠️ Skipping empty section at index ${i}`);
        continue;
      }
      await streamSectionKaraoke(speechText, i);
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    await speakWithVoice(
      safeT("post_lesson_recommendations", "That's your lesson. Well done!")
    );
  };

  // ===== START VOICE SESSION (button click — same pattern as working app, no payment) =====
  const startVoiceSession = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      if (!voiceEnabled) {
        toast.error("Please turn voice ON first by clicking the 'Voice ON' button");
        setIsProcessing(false);
        return;
      }

      if (!voiceServiceRef.current) {
        const initToast = toast.loading(safeT("initializing_voice", "Initializing voice..."));
        setVoiceInitializing(true);
        let attempts = 0;
        while (!voiceServiceRef.current && attempts < 15) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          attempts++;
        }
        toast.dismiss(initToast);
        setVoiceInitializing(false);
        if (!voiceServiceRef.current) {
          toast.error(safeT("voice_service_failed", "Voice service failed"));
          setIsProcessing(false);
          return;
        }
      }

      setIsLoading(true);

      if (sessionData && voiceServiceRef.current && typeof (voiceServiceRef.current as any).startFarmerSession === "function") {
        try {
          await (voiceServiceRef.current as any).startFarmerSession(sessionData);
        } catch (e) {
          console.warn("startFarmerSession ignored:", e);
        }
      }

      if (!welcomeSpoken) {
        setWelcomeSpoken(true);
        nameUsageCountRef.current = 0;
        setSectionStreams({});
        setReadSections(new Set());

        const welcomeText = safeT(
          "welcome_lesson_plan",
          `Welcome! Let's learn ${topicLabel}.`
        );
        await speakWithVoice(welcomeText);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await streamAllSections();
      }

      toast.success(safeT("ready_ask_away", "Ready! Ask away"));
    } catch (error: any) {
      console.error("Failed to start:", error);
      toast.error(safeT("failed_to_start", { message: error.message }) as unknown as string);
    } finally {
      setIsLoading(false);
      setIsProcessing(false);
    }
  };

  // ===== SUBMIT COMMENTS =====
  const submitLearnerComment = async () => {
    if (!learnerComment.trim() || !sessionData) return;
    setIsCommentSubmitting(true);
    setCommentSubmitted(false);

    try {
      const res = await fetch("/api/farmer/farmerscomments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: learnerComment,
          farmerName: learnerName,
          userId,
          sessionId: sessionData.id || interviewId,
          crop: sessionData.topicLabel || "BDS",
          country: sessionData.country || "kenya",
        }),
      });

      if (res.ok) {
        setCommentSubmitted(true);
        setLearnerComment("");
        toast.success(safeT("feedback_saved", "Comment saved successfully!"));
      } else {
        toast.error(safeT("feedback_failed", "Failed to save comment. Please try again."));
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
      toast.error(safeT("feedback_failed", "Failed to save comment. Please try again."));
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  // ===== BUTTON STATE =====
  const isStartButtonDisabled = isLoading || voiceInitializing || isProcessing;

  const getStartButtonText = () => {
    if (isLoading) return safeT("starting", "Starting...");
    if (voiceInitializing) return safeT("initializing", "Initializing...");
    if (!voiceEnabled) return "Turn Voice ON First";
    return safeT("start_voice_session", "Start Voice Session");
  };

  // ===== RENDER SECTION (matches renderRecommendationText) =====
  const renderSection = (section: LessonSection, idx: number) => {
    const isActive = activeStreamingSection === idx;
    const isRead = readSections.has(idx);
    if (!isActive && !isRead) return null;

    const displayedText = sectionStreams[idx] || "";
    const fullText = buildSectionSpeech(section);
    const finalText = isActive ? displayedText : fullText;
    const progressPercent =
      fullText.length > 0 ? (displayedText.length / fullText.length) * 100 : 0;

    return (
      <div
        key={idx}
        className={`rounded-xl p-5 transition-all duration-300 border-2 ${
          isActive
            ? "bg-purple-100 border-purple-500 shadow-2xl scale-105"
            : "bg-purple-50 border-purple-300"
        }`}
      >
        <div className="flex items-start gap-4">
          <span className="rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 bg-purple-500 text-white">
            {isRead && !isActive ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
          </span>
          <div className="flex-1">
            <h4 className="font-bold text-lg text-purple-900 mb-2">
              {section.title}
            </h4>

            {section.type === "quiz" ? (
              <div>
                <p className="text-xl text-gray-800 leading-relaxed">
                  {isActive ? displayedText : section.question}
                </p>
                {isRead && !isActive && section.options && (
                  <ul className="mt-3 space-y-2">
                    {section.options.map((opt, oi) => (
                      <li
                        key={oi}
                        className={`px-3 py-2 rounded-lg text-sm border ${
                          oi === section.correctIndex
                            ? "bg-green-100 text-green-800 font-semibold border-green-300"
                            : "bg-white text-gray-700 border-gray-200"
                        }`}
                      >
                        {String.fromCharCode(65 + oi)}. {opt}
                        {oi === section.correctIndex && " ✓"}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="text-xl text-gray-800 leading-relaxed whitespace-pre-wrap">
                {isActive ? displayedText : section.content}
              </p>
            )}

            {isActive && fullText.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 transition-all duration-150"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-sm text-purple-700 font-medium">
                  {Math.round(progressPercent)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ===== RENDER =====
  return (
    <div className="flex flex-col gap-6 p-4 bg-gradient-to-br from-slate-50 to-white rounded-2xl">

      {/* Header (same layout as working app) */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-emerald-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/interview/${interviewId}`}
              className="p-2 bg-emerald-100 hover:bg-emerald-200 rounded-xl"
            >
              <ArrowLeft className="w-5 h-5 text-emerald-700" />
            </Link>
            <div className="relative">
              <Image
                src="/beautiful-avatar.png"
                alt={userName}
                width={48}
                height={48}
                className="rounded-full size-12 ring-4 ring-emerald-200"
              />
            </div>
            <div>
              <h4 className="font-bold text-lg text-gray-800">{userName}</h4>
              <div className="flex flex-wrap gap-1 text-xs">
                {topicLabel && (
                  <span className="text-emerald-600">{topicLabel}</span>
                )}
                {county && <span className="text-gray-500">• {county}</span>}
                {country && <span className="text-gray-400">• {country}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 font-medium text-sm transition-all ${
                voiceEnabled
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                  : "bg-gradient-to-r from-gray-500 to-gray-600 text-white"
              }`}
            >
              {voiceEnabled ? (
                <>
                  <Mic className="w-4 h-4" />
                  <span>Voice ON</span>
                </>
              ) : (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>Voice OFF</span>
                </>
              )}
            </button>
            <button
              onClick={startVoiceSession}
              disabled={isStartButtonDisabled}
              className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap ${
                !isStartButtonDisabled
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <span className="flex items-center gap-2">
                {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                {getStartButtonText()}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick action buttons */}
      <div className="flex flex-row gap-4 justify-center">
        <Link href={`/ask/${interviewId}`} className="flex-1">
          <button className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 flex items-center justify-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Ask Questions
          </button>
        </Link>
      </div>

      {/* Lesson panel */}
      {sections.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border-2 border-purple-200 shadow-xl">
          <h3 className="font-bold text-2xl mb-4 flex items-center gap-2 text-purple-800">
            <Sparkles className="w-6 h-6 text-purple-600" />
            {moduleName || "Lesson"}
            {activeStreamingSection !== null && (
              <span className="ml-auto flex items-center gap-2 text-purple-600">
                <Volume2 className="w-5 h-5 animate-pulse" />
                <span className="text-sm">Speaking...</span>
              </span>
            )}
          </h3>

          <div className="mb-6 p-3 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-xl text-white">
            <p className="text-sm flex items-center gap-2">
              <Rocket className="w-4 h-4" />
              {safeT(
                "bds_lesson_tip",
                "Learn by listening. Each lesson is read aloud — follow along and answer the quiz at the end."
              )}
            </p>
          </div>

          <div className="space-y-4">
            {sections.map((item, idx) => renderSection(item, idx))}
          </div>

          {readSections.size === sections.length &&
            activeStreamingSection === null &&
            !isProcessing && (
              <div className="mt-4 p-4 bg-green-50 border-2 border-green-300 rounded-xl text-center">
                <p className="text-green-800 font-semibold mb-3">
                  🎉 {safeT("lesson_complete", "Lesson complete!")}
                </p>
                <Link
                  href="/generate"
                  className="inline-block px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium"
                >
                  {safeT("choose_another_topic", "Choose another topic")}
                </Link>
              </div>
            )}
        </div>
      )}

      {/* Farmers Comments (kept from working app) */}
      <div className="mt-2 p-4 bg-gray-50 rounded-xl border-2 border-gray-300">
        <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
          💬 {safeT("farmers_comments", "Learner's Comments / Suggestions")}
        </h4>
        <textarea
          value={learnerComment}
          onChange={(e) => setLearnerComment(e.target.value)}
          placeholder={safeT(
            "write_suggestion_placeholder",
            "Write your suggestion to improve the content..."
          )}
          className="w-full p-3 border rounded-xl text-gray-800 h-24 resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={submitLearnerComment}
          disabled={!learnerComment.trim() || isCommentSubmitting}
          className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors"
        >
          {isCommentSubmitting
            ? safeT("submitting", "Submitting...")
            : safeT("submit_farmers_comment", "Submit Learner Comment")}
        </button>
        {commentSubmitted && (
          <p className="text-green-600 text-sm mt-2">
            ✅ {safeT("thanks_for_feedback", "Thank you! Your comment helps us improve.")}
          </p>
        )}
      </div>

      <OfflineBanner />
    </div>
  );
};

export default Agent;
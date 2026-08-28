"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  Loader2,
  Mic,
  Send,
  CheckCircle,
  Volume2,
  ChevronDown,
  Calendar,
  Home,
  MapPin,
  Globe,
} from "lucide-react";
import { useCurrency } from "@/lib/context/CurrencyContext";
import { COUNTRY_CURRENCY_MAP } from "@/lib/config/currency";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";

interface CreateInterviewAgentProps {
  userName: string;
  userId?: string;
  profileImage?: string;
}

// ========== DROPDOWN OPTIONS ==========
const breedOptions = [
  "Local",
  "Layers",
  "Sasso",
  "Kenbrew",
  "Kroiler",
  "Broiler",
  "Sussex"
];

const stageOptions = [
  "Starter (0–6 weeks)",
  "Grower (6–20 weeks)",
  "Layer (20+ weeks)"
];

const broilerStageOptions = [
  "Starter (0–4 weeks)",
  "Finisher (4–8 weeks)"
];

const quantityOptions = [
  "5 kg",
  "10 kg",
  "15 kg",
  "20 kg",
  "25 kg",
  "30 kg",
  "35 kg",
  "40 kg",
  "45 kg",
  "50 kg",
  "55 kg",
  "60 kg",
  "65 kg",
  "70 kg",
  "75 kg",
  "80 kg",
  "85 kg",
  "90 kg",
  "95 kg",
  "100 kg"
];
const ingredientOptions = [
  "whole maize",
  "maize bran",
  "wheat pollard",
  "soya meal",
  "dcp",
  "sunflower cake",
  "cotton seed cake",
  "fish meal / omena",
  "lime",
  "bone meal",
  "chick premix",
  "growers premix",
  "layers premix",
  "salt",
  "toxin binder",
  "lysine",
  "methionine",
  "threonine",
  "tryptophan",
  "coccidiostat",
  "maize germ",
  "wheat germ"
];

// ========== COUNTRY LIST ==========
const countryOptions = [
  "Algeria",
  "Antigua and Barbuda",
  "Argentina",
  "Australia",
  "Bahamas",
  "Barbados",
  "Belgium",
  "Belize",
  "Benin",
  "Bolivia",
  "Botswana",
  "Burkina Faso",
  "Burundi",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "Colombia",
  "Comoros",
  "Congo (Brazzaville)",
  "Congo (Kinshasa)",
  "Costa Rica",
  "Côte d'Ivoire",
  "Cuba",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Eswatini",
  "Ethiopia",
  "France",
  "Gabon",
  "Gambia",
  "Ghana",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "India",
  "Ireland",
  "Jamaica",
  "Kenya",
  "Lesotho",
  "Liberia",
  "Libya",
  "Madagascar",
  "Malawi",
  "Mali",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Morocco",
  "Mozambique",
  "Namibia",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "Panama",
  "Paraguay",
  "Peru",
  "Philippines",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Senegal",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Somalia",
  "South Africa",
  "South Sudan",
  "Spain",
  "Sudan",
  "Suriname",
  "Tanzania",
  "Togo",
  "Trinidad and Tobago",
  "Tunisia",
  "Uganda",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Venezuela",
  "Zambia",
  "Zimbabwe"
].sort((a, b) => a.localeCompare(b));

// ========== PHONE COUNTRY CODES ==========
const countryCodes = [
  { code: "+254", country: "Kenya", flag: "🇰🇪" },
  { code: "+256", country: "Uganda", flag: "🇺🇬" },
  { code: "+255", country: "Tanzania", flag: "🇹🇿" },
  { code: "+250", country: "Rwanda", flag: "🇷🇼" },
  { code: "+257", country: "Burundi", flag: "🇧🇮" },
  { code: "+27", country: "South Africa", flag: "🇿🇦" },
  { code: "+260", country: "Zambia", flag: "🇿🇲" },
  { code: "+263", country: "Zimbabwe", flag: "🇿🇼" },
  { code: "+265", country: "Malawi", flag: "🇲🇼" },
  { code: "+258", country: "Mozambique", flag: "🇲🇿" },
  { code: "+267", country: "Botswana", flag: "🇧🇼" },
  { code: "+264", country: "Namibia", flag: "🇳🇦" },
  { code: "+20", country: "Egypt", flag: "🇪🇬" },
  { code: "+234", country: "Nigeria", flag: "🇳🇬" },
  { code: "+233", country: "Ghana", flag: "🇬🇭" },
  { code: "+1", country: "USA/Canada", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" }
];

const CreateInterviewAgent = ({
  userName,
  userId,
  profileImage
}: CreateInterviewAgentProps) => {
  const { t, i18n } = useTranslation();
  const { setCountry, currency } = useCurrency();
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userTranscript, setUserTranscript] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastSubmittedAnswer, setLastSubmittedAnswer] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState("+254");
  const [recognitionLanguage, setRecognitionLanguage] = useState('en-US');
  const nameUsageCountRef = useRef(0);
  const voiceReadyToastShownRef = useRef(false);

  const getSpokenCurrencyName = (): string => currency.name;
  const getDisplaySymbol = (): string => currency.symbol;

  const safeT = (key: string, params?: any): string => {
    try {
      const result = t(key, params);
      if (result && typeof result.then === 'function') {
        console.warn(`Translation for "${key}" returned a Promise`);
        return key;
      }
      return typeof result === 'string' ? result : String(result || '');
    } catch (e) {
      console.error('Translation error for key:', key, e);
      return key;
    }
  };

  const [currentStep, setCurrentStep] = useState<"idle" | "configuring" | "generating" | "redirecting" | "error">("idle");
  const [configStep, setConfigStep] = useState(0);

  const [streamingQuestion, setStreamingQuestion] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const questionWordsRef = useRef<string[]>([]);

  const voiceServiceRef = useRef<any>(null);

  // ========== FARMER DETAILS (poultry only) ==========
  const [farmerDetails, setFarmerDetails] = useState({
    country: "",
    breed: "",
    stage: "",
    quantityKg: "",
    includeCoccidiostat: "No",
    availableIngredients: [] as string[],
    ingredientPrices: {} as Record<string, number>,
    county: "",
    subCounty: "",
    ward: "",
    village: "",
    numberOfBirds: "",
    salePricePerBird: "",
    pricePerEgg: "",
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

  // ----- Timer ref for karaoke word progression -----
  const wordTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ----- Voice cache to avoid repeated loading delays -----
  const voiceCacheRef = useRef<Record<string, SpeechSynthesisVoice | null>>({});

  // ----- TTS Warmup flag -----
  const ttsWarmedUpRef = useRef(false);

  // ----- Resolver for the current speech promise -----
  const speechResolveRef = useRef<(() => void) | null>(null);

  const mapI18nToVoiceLanguage = (i18nLang: string): string => {
    switch (i18nLang) {
      case 'sw': return 'sw-KE';
      case 'fr': return 'fr-FR';
      case 'es': return 'es-ES';
      case 'en-GB': return 'en-GB';
      case 'en-US': return 'en-US';
      case 'en': return 'en-US';
      default: return 'en-US';
    }
  };

  // ===== Sync voice language =====
  const previousLangRef = useRef<string>('');
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

  // ========== QUESTION DEFINITIONS ==========
  const getQuestions = useCallback(() => {
    const isBroiler = farmerDetails.breed === "Broiler";
    const stageOpts = isBroiler ? broilerStageOptions : stageOptions;

    const baseQuestions = [
      {
        id: "country",
        questionKey: "question_country",
        type: "dropdown",
        options: countryOptions,
        sectionKey: "section_location"
      },
      {
        id: "breed",
        questionKey: "question_breed",
        type: "dropdown",
        options: breedOptions,
        sectionKey: "section_breed"
      },
      {
        id: "stage",
        questionKey: "question_stage",
        type: "dropdown",
        options: stageOpts,
        sectionKey: "section_stage"
      },
      {
        id: "quantityKg",
        questionKey: "question_quantity",
        type: "dropdown",
        options: quantityOptions,
        sectionKey: "section_quantity"
      },
      {
        id: "includeCoccidiostat",
        questionKey: "question_coccidiostat",
        type: "dropdown",
        options: ["Yes", "No"],
        sectionKey: "section_coccidiostat"
      },
      {
        id: "availableIngredients",
        questionKey: "question_available_ingredients",
        type: "multiselect",
        options: ingredientOptions,
        sectionKey: "section_ingredients"
      },
      {
        id: "ingredientPrices",
        questionKey: "question_ingredient_prices",
        type: "prices",
        sectionKey: "section_prices",
      },
      // ===== NEW QUESTIONS =====
      {
        id: "numberOfBirds",
        questionKey: "question_number_of_birds",
        type: "text",
        placeholder: safeT('number_of_birds_placeholder', { default: "e.g., 100" }),
        sectionKey: "section_birds",
      },
      // Conditional: salePricePerBird for Layer OR Broiler
      ...(farmerDetails.stage === "Layer (20+ weeks)" || farmerDetails.breed === "Broiler" ? [
        {
          id: "salePricePerBird",
          questionKey: "question_sale_price_per_bird",
          type: "text",
          placeholder: safeT('sale_price_per_bird_placeholder', { default: "e.g., 1200" }),
          sectionKey: "section_financial"
        }
      ] : []),
      // Conditional: pricePerEgg only for Layer
      ...(farmerDetails.stage === "Layer (20+ weeks)" ? [
        {
          id: "pricePerEgg",
          questionKey: "question_price_per_egg",
          type: "text",
          placeholder: safeT('price_per_egg_placeholder', { default: "e.g., 20" }),
          sectionKey: "section_financial"
        }
      ] : []),
      {
        id: "county",
        questionKey: "question_county",
        type: "text",
        placeholder: safeT('county_placeholder', { default: "e.g., Bungoma" }),
        sectionKey: "section_location"
      },
      {
        id: "subCounty",
        questionKey: "question_sub_county",
        type: "text",
        placeholder: safeT('sub_county_placeholder', { default: "e.g., Kimilili" }),
        sectionKey: "section_location"
      },
      {
        id: "ward",
        questionKey: "question_ward",
        type: "text",
        placeholder: safeT('ward_placeholder', { default: "e.g., Kimilili" }),
        sectionKey: "section_location"
      },
      {
        id: "village",
        questionKey: "question_village",
        type: "text",
        placeholder: safeT('village_placeholder', { default: "e.g., Sikulu" }),
        sectionKey: "section_location"
      }
    ];

    return baseQuestions;
  }, [farmerDetails.breed, farmerDetails.stage, safeT]);

  const filterQuestions = useCallback((questions: any[]) => {
    return questions.filter(q => {
      if (q.id === "ingredientPrices" && farmerDetails.availableIngredients.length === 0) {
        return false;
      }
      return true;
    });
  }, [farmerDetails.availableIngredients]);

  const allQuestions = useMemo(() => {
    const raw = getQuestions();
    const filtered = filterQuestions(raw);
    // DEBUG: Log all questions with their placeholder
    console.log("📋 [allQuestions] Final questions array:");
    filtered.forEach((q, idx) => {
      console.log(`  ${idx}: id=${q.id}, type=${q.type}, placeholder=${q.placeholder}`);
    });
    return filtered;
  }, [getQuestions, filterQuestions]);

  const totalQuestions = allQuestions.length;

  useEffect(() => {
    setDebugInfo(prev => ({ ...prev, totalQuestions }));
  }, [totalQuestions]);

  // ========== SPEECH RECOGNITION ==========
  useEffect(() => {
    let isMounted = true;

    const checkVoiceSupport = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && isMounted) {
        const voices = window.speechSynthesis.getVoices();
        setDebugInfo(prev => {
          const newMode = voices.length > 0 ? "REAL" : "SIMULATED";
          if (prev.voiceMode === newMode) return prev;
          return { ...prev, voiceMode: newMode };
        });
      }
    };

    checkVoiceSupport();
    const timeoutId = setTimeout(checkVoiceSupport, 500);

    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) && !recognitionRef.current) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = recognitionLanguage;
      recognitionRef.current.timeout = 15000;

      recognitionRef.current.onresult = (event: any) => {
        retryCountRef.current = 0;
        if (isRecognitionActiveRef.current) {
          isRecognitionActiveRef.current = false;
          setDebugInfo(prev => ({ ...prev, isListening: false }));
        }
        const transcript = event.results[0][0].transcript;
        setUserTranscript(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        if (isRecognitionActiveRef.current) {
          isRecognitionActiveRef.current = false;
          setDebugInfo(prev => ({ ...prev, isListening: false }));
        }
        if (event.error === 'no-speech') {
          retryCountRef.current++;
          if (retryCountRef.current <= maxRetries) {
            toast.info(safeT('no_speech_detected', { current: retryCountRef.current, max: maxRetries }));
            setTimeout(() => safeStartListening(), 2000);
          }
        }
      };

      recognitionRef.current.onend = () => {
        if (isRecognitionActiveRef.current) {
          isRecognitionActiveRef.current = false;
          setDebugInfo(prev => ({ ...prev, isListening: false }));
        }
      };

      recognitionRef.current.onstart = () => {
        isRecognitionActiveRef.current = true;
        setDebugInfo(prev => ({ ...prev, isListening: true }));
        retryCountRef.current = 0;
      };
    }

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (recognitionRef.current && isRecognitionActiveRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, [recognitionLanguage, safeT]);

  // ========== PRE‑LOAD VOICES AND CACHE THEM ==========
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (allVoices.length === 0) return;

      // Pre‑cache voices for all supported languages
      const languages = ['en-US', 'en-GB', 'fr-FR', 'es-ES', 'sw-KE'];
      languages.forEach(lang => {
        let voice = allVoices.find(v => v.lang === lang && !v.name.toLowerCase().includes('male'));
        if (!voice) voice = allVoices.find(v => v.lang === lang);
        if (!voice) voice = allVoices.find(v => v.lang.startsWith(lang.split('-')[0]));
        if (voice) {
          voiceCacheRef.current[lang] = voice;
        }
      });
      if (!voiceCacheRef.current['default']) {
        voiceCacheRef.current['default'] = allVoices[0] || null;
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // ========== WARM UP TTS ENGINE ==========
  const warmUpTTS = useCallback(() => {
    if (ttsWarmedUpRef.current) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    try {
      const dummy = new SpeechSynthesisUtterance(' ');
      dummy.volume = 0;
      dummy.rate = 1;
      dummy.pitch = 1;
      dummy.onend = () => {
        window.speechSynthesis.cancel();
        ttsWarmedUpRef.current = true;
        console.log('✅ TTS engine warmed up');
      };
      dummy.onerror = () => {
        window.speechSynthesis.cancel();
        ttsWarmedUpRef.current = true;
        console.warn('⚠️ TTS warmup error, but continuing');
      };
      window.speechSynthesis.speak(dummy);
      setTimeout(() => {
        window.speechSynthesis.cancel();
        ttsWarmedUpRef.current = true;
      }, 200);
    } catch (e) {
      console.warn('TTS warmup failed:', e);
      ttsWarmedUpRef.current = true;
    }
  }, []);

  // ========== VOICE ASSISTANT REF ==========
  useEffect(() => {
    if (!voiceEnabled) {
      voiceAssistantRef.current = null;
      voiceReadyToastShownRef.current = false;
      ttsWarmedUpRef.current = false;
      return;
    }

    voiceAssistantRef.current = {
      speak: async (text: string) => {
        return streamQuestionWithVoice(text);
      }
    };

    if (!ttsWarmedUpRef.current) {
      warmUpTTS();
    }

    if (voiceEnabled && !voiceReadyToastShownRef.current) {
      toast.success(safeT('voice_ready'));
      voiceReadyToastShownRef.current = true;
    }
  }, [voiceEnabled, safeT, warmUpTTS]);

  // ================================================================
  // ========== FIXED: PROMISE-BASED VOICE WITH DYNAMIC KARAOKE ==========
  // ================================================================
  const streamQuestionWithVoice = useCallback((fullText: string): Promise<void> => {
    return new Promise((resolve) => {
      // Guard: if voice is disabled or no speech synthesis
      if (!voiceEnabled || !window.speechSynthesis) {
        setStreamingQuestion(fullText);
        resolve();
        return;
      }

      // Clean up any previous speech and timers
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      if (wordTimerRef.current) {
        clearTimeout(wordTimerRef.current);
        wordTimerRef.current = null;
      }

      // If text is empty or only spaces, just resolve
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
      const escapedSymbol = currencySymbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      let speechText = fullText.replace(new RegExp(`${escapedSymbol}\\s`, 'g'), `${spokenCurrencyName} `);
      speechText = speechText.replace(new RegExp(`\\b${escapedSymbol}\\b`, 'g'), spokenCurrencyName);

      // Stop recognition while speaking
      if (recognitionRef.current && isRecognitionActiveRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        isRecognitionActiveRef.current = false;
        setDebugInfo(prev => ({ ...prev, isListening: false }));
      }

      const words = speechText.split(' ');
      questionWordsRef.current = words;

      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.rate = 1.0;
      utterance.pitch = 1.1;
      utterance.lang = recognitionLanguage;

      // Use cached voice if available
      const cachedVoice = voiceCacheRef.current[recognitionLanguage] || voiceCacheRef.current['default'] || null;
      if (cachedVoice) {
        utterance.voice = cachedVoice;
      }

      setIsSpeaking(true);

      // ---- DYNAMIC TIMER: each word schedules the next based on its length ----
      let wordIndex = 0;
      let currentText = '';
      let isFinished = false;
      let speechEnded = false; // to prevent double resolve

      const finish = () => {
        if (isFinished) return;
        isFinished = true;
        speechEnded = true;
        if (wordTimerRef.current) {
          clearTimeout(wordTimerRef.current);
          wordTimerRef.current = null;
        }
        // Show full text if not already all shown
        let finalDisplay = fullText;
        const displaySymbol = getDisplaySymbol();
        if (displaySymbol !== currencySymbol) {
          finalDisplay = finalDisplay.replace(new RegExp(escapedSymbol, 'g'), displaySymbol);
        }
        setStreamingQuestion(finalDisplay);
        setIsStreaming(false);
        setIsSpeaking(false);
        resolve(); // resolve the promise
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
        // Estimate speaking duration: 100ms per character, min 150ms, max 1200ms
        const duration = Math.max(150, Math.min(1200, word.length * 100));

        wordTimerRef.current = setTimeout(() => {
          // Append the word
          currentText += (currentText ? ' ' : '') + word;
          let displayText = currentText;
          const displaySymbol = getDisplaySymbol();
          if (displaySymbol !== currencySymbol) {
            displayText = displayText.replace(new RegExp(spokenCurrencyName, 'g'), displaySymbol);
          }
          setStreamingQuestion(displayText);
          setCurrentWordIndex(wordIndex + 1);
          wordIndex++;
          // Schedule the next word
          scheduleNextWord();
        }, duration);
      };

      // Start the timer chain
      if (words.length > 0) {
        scheduleNextWord();
      } else {
        // No words? Just finish
        finish();
        return;
      }

      // ---- SPEECH SYNTHESIS EVENTS ----
      // Dynamic safety timeout based on text length (100ms per char + 5s buffer)
      const estimatedDuration = Math.max(5000, fullText.length * 100);
      let safetyTimeout: NodeJS.Timeout | null = setTimeout(() => {
        if (!isFinished) {
          console.warn("⚠️ Speech took too long – forcing finish");
          window.speechSynthesis.cancel(); // Stop speech to avoid lingering
          finish();
        }
      }, estimatedDuration + 5000);

      utterance.onend = () => {
        if (safetyTimeout) clearTimeout(safetyTimeout);
        if (!isFinished) {
          if (wordTimerRef.current) {
            clearTimeout(wordTimerRef.current);
            wordTimerRef.current = null;
          }
          let finalDisplay = fullText;
          const displaySymbol = getDisplaySymbol();
          if (displaySymbol !== currencySymbol) {
            finalDisplay = finalDisplay.replace(new RegExp(escapedSymbol, 'g'), displaySymbol);
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

      utterance.onerror = (event) => {
        if (safetyTimeout) clearTimeout(safetyTimeout);
        console.error("Speech error:", event);
        if (!isFinished) {
          if (wordTimerRef.current) {
            clearTimeout(wordTimerRef.current);
            wordTimerRef.current = null;
          }
          let finalDisplay = fullText;
          const ds = getDisplaySymbol();
          if (ds !== currencySymbol) finalDisplay = finalDisplay.replace(new RegExp(escapedSymbol, 'g'), ds);
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

      // Start speaking
      window.speechSynthesis.speak(utterance);
    });
  }, [currency, voiceEnabled, recognitionLanguage, getSpokenCurrencyName, getDisplaySymbol]);

  // ================================================================

  // ========== SPEAK ACKNOWLEDGMENT (now awaits speech) ==========
  const speakAcknowledgment = async (answer: string, fieldId: string) => {
    const spokenCurrencyName = getSpokenCurrencyName();
    const currencySymbol = currency.symbol;
    const escapedSymbol = currencySymbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let spokenAnswer = answer.replace(new RegExp(`${escapedSymbol}\\s`, 'g'), `${spokenCurrencyName} `);
    spokenAnswer = spokenAnswer.replace(new RegExp(`\\b${escapedSymbol}\\b`, 'g'), spokenCurrencyName);

    let acknowledgment = "";
    if (fieldId === "country") {
      acknowledgment = safeT('ack_country', { answer: spokenAnswer });
      setCountry(answer.toLowerCase());
    } else if (fieldId === "breed") {
      acknowledgment = safeT('ack_breed', { answer: spokenAnswer });
    } else if (fieldId === "stage") {
      acknowledgment = safeT('ack_stage', { answer: spokenAnswer });
    } else if (fieldId === "quantityKg") {
      acknowledgment = safeT('ack_quantity', { answer: spokenAnswer });
    } else if (fieldId === "includeCoccidiostat") {
      acknowledgment = safeT('ack_coccidiostat', { answer: spokenAnswer });
    } else if (fieldId === "availableIngredients") {
      acknowledgment = safeT('ack_ingredients', { answer: spokenAnswer });
    } else if (fieldId === "ingredientPrices") {
      acknowledgment = safeT('ack_prices', { answer: "Prices recorded" });
    } else if (fieldId === "numberOfBirds") {
      acknowledgment = safeT('ack_number_of_birds', { answer: spokenAnswer });
    } else if (fieldId === "salePricePerBird") {
      acknowledgment = safeT('ack_sale_price_per_bird', { answer: spokenAnswer });
    } else if (fieldId === "pricePerEgg") {
      acknowledgment = safeT('ack_price_per_egg', { answer: spokenAnswer });
    } else if (fieldId === "county") {
      acknowledgment = safeT('ack_county', { answer: spokenAnswer });
    } else if (fieldId === "subCounty") {
      acknowledgment = safeT('ack_sub_county', { answer: spokenAnswer });
    } else if (fieldId === "ward") {
      acknowledgment = safeT('ack_ward', { answer: spokenAnswer });
    } else if (fieldId === "village") {
      acknowledgment = safeT('ack_village', { answer: spokenAnswer });
    } else {
      acknowledgment = safeT('ack_generic', { answer: spokenAnswer });
    }

    if (voiceAssistantRef.current) {
      await voiceAssistantRef.current.speak(acknowledgment);
    }
    toast.success(safeT('recorded', { answer }));
  };

  // ========== PROCESS ANSWER ==========
  const processAnswer = async (answer: string) => {
    if (currentStep !== "configuring") return;

    const currentConfig = allQuestions[configStep];
    let cleanAnswer = answer.trim();

    if (!cleanAnswer) {
      const msg = safeT('please_provide_answer');
      toast.warning(msg);
      if (voiceAssistantRef.current) {
        await voiceAssistantRef.current.speak(msg);
      }
      return;
    }

    const numericFields = ['numberOfBirds', 'salePricePerBird', 'pricePerEgg'];
    if (numericFields.includes(currentConfig.id)) {
      const num = parseFloat(cleanAnswer);
      if (isNaN(num) || num <= 0) {
        const msg = safeT('enter_valid_number');
        toast.warning(msg);
        if (voiceAssistantRef.current) {
          await voiceAssistantRef.current.speak(msg);
        }
        return;
      }
      cleanAnswer = num.toString();
    }

    let finalValue = cleanAnswer;

    // Handle multi-select (availableIngredients)
    if (currentConfig.id === "availableIngredients") {
      const items = answer.split(',').map(s => s.trim()).filter(s => s);
      setFarmerDetails(prev => ({ ...prev, availableIngredients: items }));
      setLastSubmittedAnswer(answer);
      await speakAcknowledgment(answer, currentConfig.id);
      setUserTranscript("");
      if (configStep < allQuestions.length - 1) {
        const nextStep = configStep + 1;
        setConfigStep(nextStep);
        setTimeout(() => askQuestion(nextStep), 2500);
      } else {
        setCurrentStep("generating");
        generateSession();
      }
      return;
    }

    // Handle prices question
    if (currentConfig.id === "ingredientPrices") {
      const ingredients = farmerDetails.availableIngredients;
      const allFilled = ingredients.every(ing => farmerDetails.ingredientPrices[ing] && farmerDetails.ingredientPrices[ing] > 0);
      if (!allFilled) {
        toast.warning(safeT('enter_all_prices'));
        return;
      }
      setLastSubmittedAnswer("Prices recorded");
      await speakAcknowledgment("Prices recorded", currentConfig.id);
      setUserTranscript("");
      if (configStep < allQuestions.length - 1) {
        const nextStep = configStep + 1;
        setConfigStep(nextStep);
        setTimeout(() => askQuestion(nextStep), 1500);
      } else {
        setCurrentStep("generating");
        generateSession();
      }
      return;
    }

    // For dropdowns
    if (currentConfig.type === "dropdown") {
      const matched = currentConfig.options.find((opt: string) => opt.toLowerCase() === cleanAnswer.toLowerCase());
      if (matched) {
        finalValue = matched;
        if (currentConfig.id === "quantityKg") {
          const num = parseFloat(finalValue);
          if (!isNaN(num)) {
            finalValue = num.toString();
          }
        }
      } else {
        finalValue = currentConfig.options[0];
      }
    } else if (currentConfig.type === "text") {
      finalValue = cleanAnswer;
    } else {
      finalValue = cleanAnswer;
    }

    setFarmerDetails(prev => ({ ...prev, [currentConfig.id]: finalValue }));
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

  // ========== SAFE START/STOP LISTENING ==========
  const safeStartListening = () => {
    if (isSpeaking || isStreaming) {
      console.log("AI is speaking, waiting to listen...");
      return;
    }
    if (!recognitionRef.current || isRecognitionActiveRef.current) return;
    if (recognitionRef.current.lang !== recognitionLanguage) {
      recognitionRef.current.lang = recognitionLanguage;
    }
    try {
      recognitionRef.current.start();
      setDebugInfo(prev => ({ ...prev, isListening: true }));
    } catch (error) {}
  };

  const safeStopListening = () => {
    if (recognitionRef.current && isRecognitionActiveRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      isRecognitionActiveRef.current = false;
      setDebugInfo(prev => ({ ...prev, isListening: false }));
    }
  };

  // ========== START VOICE SETUP ==========
  const startVoiceSetup = async () => {
    console.log("🎤 [startVoiceSetup] Starting voice setup");
    if (!voiceEnabled || !voiceAssistantRef.current) {
      toast.error(safeT('enable_voice_first'));
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
      breed: "",
      stage: "",
      quantityKg: "",
      includeCoccidiostat: "No",
      availableIngredients: [],
      ingredientPrices: {},
      county: "",
      subCounty: "",
      ward: "",
      village: "",
      numberOfBirds: "",
      salePricePerBird: "",
      pricePerEgg: "",
    });
    console.log("🔄 [startVoiceSetup] Farmer details reset");

    await askQuestion(0);
  };

  // ========== ASK QUESTION (now awaits speech completion) ==========
  const askQuestion = async (step: number) => {
    if (!voiceAssistantRef.current || step >= allQuestions.length) return;
    if (isSpeaking) await new Promise(resolve => setTimeout(resolve, 500));

    const questionKey = allQuestions[step].questionKey;
    let question = safeT(questionKey);
    console.log(`❓ [askQuestion] Step ${step}: ${questionKey} -> "${question}"`);

    setDebugInfo(prev => ({ ...prev, currentQuestion: step + 1 }));
    setUserTranscript("");
    setLastSubmittedAnswer("");

    // Wait for the speech to complete before continuing
    await voiceAssistantRef.current.speak(question);

    const q = allQuestions[step];
    const locationFields = ["county", "subCounty", "ward", "village"];
    // 🔥 FIX: Do NOT start voice recognition for text questions
    if (q.type !== "multiselect" && q.type !== "prices" && q.type !== "text" && !locationFields.includes(q.id)) {
      safeStartListening();
    }
  };

  // ========== GENERATE SESSION ==========
  const generateSession = async () => {
    if (!voiceAssistantRef.current) return;
    setIsLoading(true);

    await voiceAssistantRef.current.speak(safeT('creating_profile'));

    let currentUserId = userId || localStorage.getItem('userId') || `user-${Date.now()}`;
    localStorage.setItem('userId', currentUserId);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    const requestBody = {
      ...farmerDetails,
      userid: currentUserId,
      quantityKg: parseFloat(farmerDetails.quantityKg) || 0,
      country: farmerDetails.country.toLowerCase(),
      ingredientPrices: farmerDetails.ingredientPrices,
      numberOfBirds: parseInt(farmerDetails.numberOfBirds) || 0,
      salePricePerBird: parseFloat(farmerDetails.salePricePerBird) || 0,
      pricePerEgg: parseFloat(farmerDetails.pricePerEgg) || 0,
      language: i18n.language,
    };

    console.log("📤 [generateSession] Sending request body:", JSON.stringify(requestBody, null, 2));

    try {
      const response = await fetch("/api/vapi/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      console.log("📥 [generateSession] Response data:", data);

      if (data.success && data.sessionId) {
        console.log(`✅ [generateSession] Session created: ${data.sessionId}`);
        await voiceAssistantRef.current.speak(safeT('ready_redirect'));
        setTimeout(() => window.location.href = `/interview/${data.sessionId}`, 2000);
        setCurrentStep("redirecting");
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("❌ [generateSession] Error:", error);
      if (error.name === 'AbortError') {
        toast.error(safeT('request_timeout') || "Request timed out. Please try again.");
      } else {
        toast.error(safeT('error_creating_profile') || "Failed to create feed plan. Please try again.");
      }
      setCurrentStep("error");
    } finally {
      setIsLoading(false);
    }
  };

  const stopEverything = () => {
    console.log("🛑 [stopEverything] Stopping everything");
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
    if (userTranscript.trim()) {
      processAnswer(userTranscript);
    }
  };

  // ========== RENDER INPUT ==========
  const renderInput = useCallback(() => {
    const q = allQuestions[configStep];
    if (!q) return null;

    console.log(`🔍 [renderInput] q.id: ${q.id}, q.placeholder: ${q.placeholder}, q.type: ${q.type}`);

    if (q.type === "dropdown") {
      return (
        <div className="relative">
          <select
            value={userTranscript}
            onChange={(e) => setUserTranscript(e.target.value)}
            className="w-full px-4 py-3 border-2 rounded-xl appearance-none text-blue-900 font-medium focus:border-blue-600"
          >
            <option value="" className="text-gray-500">{safeT('select_option')}</option>
            {q.options?.map((opt: string, index: number) => (
              <option key={`${opt}-${index}`} value={opt} className="text-blue-900">{opt}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-blue-600" />
        </div>
      );
    }

    if (q.type === "multiselect") {
      const selected = farmerDetails.availableIngredients || [];
      return (
        <div className="space-y-2 max-h-60 overflow-y-auto p-2 border-2 rounded-xl">
          {q.options?.map((opt: string, index: number) => (
            <label key={`${opt}-${index}`} className="flex items-center gap-2 p-2 hover:bg-blue-50 rounded-lg">
              <input
                type="checkbox"
                value={opt}
                checked={selected.includes(opt)}
                onChange={(e) => {
                  const values = e.target.checked
                    ? [...selected, opt]
                    : selected.filter(item => item !== opt);
                  setFarmerDetails(prev => ({ ...prev, availableIngredients: values }));
                  setUserTranscript(values.join(', '));
                }}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="text-blue-900">{opt}</span>
            </label>
          ))}
        </div>
      );
    }

    if (q.type === "prices") {
      const ingredients = farmerDetails.availableIngredients;
      if (ingredients.length === 0) {
        return <p className="text-gray-500">{safeT('no_ingredients_selected')}</p>;
      }
      return (
        <div className="space-y-3 max-h-60 overflow-y-auto p-2">
          {ingredients.map((ingredient: string) => (
            <div key={ingredient} className="flex items-center gap-2">
              <label className="w-40 text-sm font-medium text-gray-700">{ingredient}</label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder={safeT('price_per_kg_placeholder', { symbol: currency.symbol })}
                value={farmerDetails.ingredientPrices[ingredient] || ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setFarmerDetails(prev => ({
                    ...prev,
                    ingredientPrices: {
                      ...prev.ingredientPrices,
                      [ingredient]: isNaN(val) ? 0 : val
                    }
                  }));
                  const priceStrings = Object.entries(farmerDetails.ingredientPrices)
                    .filter(([_, v]) => v > 0)
                    .map(([k, v]) => `${k}: ${v}`);
                  setUserTranscript(priceStrings.join(', '));
                }}
                className="flex-1 px-3 py-2 border rounded-lg text-gray-800"
                autoComplete="off"
              />
              <span className="text-xs text-gray-500">{currency.symbol}</span>
            </div>
          ))}
          <button
            onClick={() => {
              const allFilled = ingredients.every(ing => farmerDetails.ingredientPrices[ing] && farmerDetails.ingredientPrices[ing] > 0);
              if (!allFilled) {
                toast.warning(safeT('enter_all_prices'));
                return;
              }
              processAnswer("Prices recorded");
            }}
            className="mt-3 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {safeT('confirm_prices')}
          </button>
        </div>
      );
    }

    if (q.type === "text") {
      return (
        <input
          key={`text-input-${configStep}`}  // Forces a new DOM element on each question
          autoFocus
          type="text"
          value={userTranscript}
          onChange={(e) => {
            console.log("✏️ Input onChange fired, new value:", e.target.value);
            setUserTranscript(e.target.value);
          }}
          placeholder={q.placeholder || safeT('type_answer')}
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

    return (
      <input
        type="text"
        value={userTranscript}
        onChange={(e) => setUserTranscript(e.target.value)}
        placeholder={safeT('type_answer')}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        name="noautofill"
        id="noautofill"
        className="w-full px-4 py-3 border-2 rounded-xl text-blue-900 font-medium focus:border-blue-600 placeholder-gray-400"
      />
    );
  }, [configStep, allQuestions, userTranscript, farmerDetails.availableIngredients, farmerDetails.ingredientPrices, currency.symbol, safeT]);

  // ========== RENDER ==========
  const colors = {
    primary: "from-emerald-400 to-cyan-400",
    secondary: "from-purple-400 to-pink-400",
    background: "bg-gradient-to-br from-slate-50 to-white",
    card: "bg-white/80 backdrop-blur-sm",
  };

  const currentSectionKey = allQuestions[configStep]?.sectionKey;
  const currentSection = currentSectionKey ? safeT(currentSectionKey) : "";
  const wordProgress = currentWordIndex > 0 && questionWordsRef.current.length > 0
    ? `${currentWordIndex}/${questionWordsRef.current.length} ${safeT('words')}`
    : '';

  return (
    <div className={`flex flex-col gap-6 p-4 ${colors.background} rounded-2xl min-h-screen`}>
      {/* Header */}
      <div className={`${colors.card} rounded-2xl p-5 shadow-xl border`}>
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <Image src={profileImage || "/farmer-avatar.png"} alt="Farmer" width={48} height={48} className="rounded-full ring-4" />
            <div>
              <h4 className="font-bold text-xl">{userName || safeT('farmer')}</h4>
              <p className="text-sm text-gray-500">{safeT('smart_farmer_building')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Currency Switcher */}
            <div className="bg-white/80 rounded-xl px-2 py-1 border border-gray-200 shadow-sm">
              <CurrencySwitcher />
            </div>

            {/* Voice Toggle */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl px-3 py-2 border border-white-30">
              <Mic className={`w-5 h-5 text-white ${isSpeaking ? 'animate-pulse' : ''}`} />
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                disabled={currentStep === "generating" || currentStep === "redirecting"}
                className={`text-white font-medium focus:outline-none ${
                  currentStep === "generating" || currentStep === "redirecting"
                    ? 'opacity-50 cursor-not-allowed text-lg'
                    : 'text-sm'
                }`}
              >
                {currentStep === "generating" || currentStep === "redirecting"
                  ? safeT('generating_please_wait')
                  : (voiceEnabled ? safeT('voice_on') : safeT('voice_off'))}
              </button>
            </div>

            {/* Start Setup Button */}
            <button
              onClick={startVoiceSetup}
              disabled={!voiceEnabled || currentStep !== "idle"}
              className={`px-6 py-2 rounded-xl font-bold text-sm ${
                voiceEnabled && currentStep === "idle"
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-105 transition-all'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {currentStep === "generating" || currentStep === "redirecting"
                ? safeT('generating_please_wait')
                : (currentStep === "idle" ? safeT('start_setup') : safeT('loading'))}
            </button>
          </div>
        </div>
        {isSpeaking && (
          <div className="mt-2 text-xs text-blue-600 flex items-center gap-1">
            <Volume2 className="w-3 h-3 animate-pulse" />
            <span>{safeT('speaking')} {wordProgress}</span>
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
              {safeT('question_x_of_y', { current: configStep + 1, total: allQuestions.length })}
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
                {streamingQuestion.split(' ').map((word, wordIdx, arr) => (
                  <span key={wordIdx}>
                    <span className="text-emerald-700 font-bold">{word}</span>
                    {wordIdx < arr.length - 1 ? ' ' : ''}
                  </span>
                ))}
              </p>
            ) : (
              <p className="text-3xl text-gray-400 italic">
                {isStreaming ? safeT('speaking_dots') : safeT('ready_for_answer')}
              </p>
            )}
          </div>

          {!isStreaming && streamingQuestion && (
            <div className="mt-6">
              <div className="bg-white rounded-xl border-2 border-purple-200 p-6">
                {renderInput()}

                {allQuestions[configStep]?.type !== "multiselect" && allQuestions[configStep]?.type !== "prices" && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={submitAnswer}
                      disabled={!userTranscript.trim()}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-2.5 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {safeT('submit_answer')}
                    </button>
                  </div>
                )}

                {allQuestions[configStep]?.type === "multiselect" && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={async () => {
                        const selected = farmerDetails.availableIngredients;
                        const allOptions = allQuestions[configStep]?.options || [];
                        if (selected.length !== allOptions.length) {
                          const warningMsg = safeT('select_all_ingredients_warning');
                          toast.warning(warningMsg);
                          await voiceAssistantRef.current?.speak(warningMsg);
                          return;
                        }
                        processAnswer(selected.join(', '));
                      }}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-2.5 rounded-xl font-medium"
                    >
                      {safeT('confirm_selection')}
                    </button>
                  </div>
                )}
              </div>

              {lastSubmittedAnswer && allQuestions[configStep]?.type !== "prices" && (
                <div className="mt-3 p-3 bg-blue-50 rounded-xl border-2 border-blue-200">
                  <p className="text-sm text-blue-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    {safeT('your_answer')}: <span className="font-bold text-blue-900">{lastSubmittedAnswer}</span>
                  </p>
                  <p className="text-xs text-blue-600 mt-1">{safeT('voice_confirmation_sent')}</p>
                </div>
              )}

              {debugInfo.isListening && (
                <div className="mt-3 p-3 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-red-600">{safeT('listening_speak_now')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Stop Button */}
      {(currentStep === "configuring" || currentStep === "generating") && (
        <button onClick={stopEverything} className="px-5 py-3 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-xl mx-auto w-48 font-medium flex items-center justify-center gap-2">
          <span>{safeT('stop_setup')}</span>
        </button>
      )}
    </div>
  );
};

export default CreateInterviewAgent;
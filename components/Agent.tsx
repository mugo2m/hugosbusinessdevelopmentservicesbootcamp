"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { useOfflineTranslation } from '@/lib/hooks/useOfflineTranslation';
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
  Beaker,
  AlertCircle,
  Rocket,
  Scale,
  Package,
  DollarSign,
  MapPin,
  Shield,
  CheckCircle,
  List,
  ClipboardList,
  Calendar,
} from "lucide-react";
import { useCurrency } from '@/lib/context/CurrencyContext';
import { COUNTRY_CURRENCY_MAP } from "@/lib/config/currency";

interface AgentProps {
  userName: string;
  userId?: string;
  interviewId?: string;
  sessionData?: any;
}

interface StructuredItem {
  key: string;
  params?: Record<string, any>;
}

const Agent = ({
  userName,
  userId,
  interviewId,
  sessionData
}: AgentProps) => {
  const { t, ready, i18n } = useOfflineTranslation();
  const { currency, setCountry, country } = useCurrency();

  // Debug logging
  console.log("🔍 [Agent] Mounted with sessionData:", sessionData);
  console.log("🔍 [Agent] Context country:", country);
  console.log("🔍 [Agent] Context currency:", currency);
  console.log("🔍 [Agent] sessionData.country:", sessionData?.country);

  // Force sync country from session data
  useEffect(() => {
    const sessionCountry = sessionData?.country;
    if (sessionCountry) {
      // Always call setCountry to ensure it updates
      setCountry(sessionCountry);
      console.log(`🔄 [Agent] Forced setCountry to: ${sessionCountry}`);
    }
  }, [sessionData?.country, setCountry]);

  // Fallback: if context currency symbol is still 'Ksh' but session country is Uganda,
  // we directly use the session country's currency symbol.
  const getDisplaySymbol = (): string => {
    // If context currency is already not 'Ksh' (e.g., 'USh'), use it.
    if (currency.symbol && currency.symbol !== 'Ksh') {
      return currency.symbol;
    }
    // Otherwise, try to derive from session country
    if (sessionData?.country) {
      const sessionCountry = sessionData.country.toLowerCase();
      const mapped = COUNTRY_CURRENCY_MAP[sessionCountry];
      if (mapped && mapped.symbol) {
        console.log(`🔄 [Agent] Fallback: using symbol ${mapped.symbol} for country ${sessionCountry}`);
        return mapped.symbol;
      }
    }
    return 'Ksh'; // ultimate fallback
  };

  const getSpokenCurrencyName = (): string => {
    if (i18n.language === 'es') return 'Euros';
    const lang = i18n.language;
    // Use the same fallback logic if needed
    const code = currency.code || (sessionData?.country ? COUNTRY_CURRENCY_MAP[sessionData.country.toLowerCase()]?.code : 'KES');
    switch (code) {
      case 'KES': return lang === 'fr' ? 'Shillings kényans' : lang === 'sw' ? 'Shilingi za Kenya' : 'Kenyan Shillings';
      case 'UGX': return lang === 'fr' ? 'Shillings ougandais' : lang === 'sw' ? 'Shilingi za Uganda' : 'Ugandan Shillings';
      case 'TZS': return lang === 'fr' ? 'Shillings tanzaniens' : lang === 'sw' ? 'Shilingi za Tanzania' : 'Tanzanian Shillings';
      default: return currency.name || 'Kenyan Shillings';
    }
  };

  useEffect(() => {
    const sessionLang = sessionData?.language;
    if (sessionLang && sessionLang !== i18n.language) {
      i18n.changeLanguage(sessionLang);
      localStorage.setItem('preferred-language', sessionLang);
    }
  }, [sessionData, i18n]);

  // ===== GET CORRECT NUTRITIONAL TARGETS BASED ON BREED AND STAGE =====
  const getNutritionalTargets = (breed: string, stage: string): { protein: number; calcium: number; energy: number } => {
    const breedKey = breed?.toLowerCase().trim() || '';
    const stageKey = stage?.toLowerCase().includes('starter') ? 'starter' :
                     stage?.toLowerCase().includes('grower') ? 'grower' :
                     stage?.toLowerCase().includes('layer') ? 'layer' :
                     stage?.toLowerCase().includes('finisher') ? 'finisher' : 'starter';

    console.log("🎯 [getNutritionalTargets] breedKey:", breedKey, "stageKey:", stageKey);

    if (breedKey === 'broiler') {
      if (stageKey === 'starter') {
        return { protein: 22.0, calcium: 0.9, energy: 2900 };
      } else if (stageKey === 'finisher') {
        return { protein: 20.0, calcium: 0.8, energy: 2950 };
      } else {
        return { protein: 20.0, calcium: 0.8, energy: 2950 };
      }
    }

    if (stageKey === 'starter') {
      return { protein: 20.15, calcium: 1.0, energy: 2800 };
    } else if (stageKey === 'grower') {
      return { protein: 16.7, calcium: 0.9, energy: 2700 };
    } else if (stageKey === 'layer') {
      return { protein: 17.04, calcium: 3.8, energy: 2750 };
    } else {
      return { protein: 16.7, calcium: 0.9, energy: 2700 };
    }
  };

  const safeT = (key: string, params?: any): string => {
    try {
      if (key && (key.includes(' ') || key.includes('\n') || key.includes('.'))) return key;
      const template = i18n.t(key);
      if (!params) return template;
      let result = template;
      for (const [paramKey, paramValue] of Object.entries(params)) {
        result = result.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue));
      }
      return result;
    } catch { return key; }
  };

  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceInitializing, setVoiceInitializing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [welcomeSpoken, setWelcomeSpoken] = useState(false);
  const [recommendationsSpoken, setRecommendationsSpoken] = useState(false);
  const [structuredList, setStructuredList] = useState<any[]>([]);
  const [structuredFinancialAdvice, setStructuredFinancialAdvice] = useState<any>(null);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [readRecommendations, setReadRecommendations] = useState<Set<number>>(new Set());
  const [recommendationStreams, setRecommendationStreams] = useState<{[key: number]: string}>({});
  const [activeStreamingRec, setActiveStreamingRec] = useState<number | null>(null);

  const [farmerComment, setFarmerComment] = useState<string>("");
  const [isCommentSubmitting, setIsCommentSubmitting] = useState<boolean>(false);
  const [commentSubmitted, setCommentSubmitted] = useState<boolean>(false);

  const nameUsageCountRef = useRef(0);
  const voiceServiceRef = useRef<VoiceService | null>(null);
  const mountedRef = useRef(true);
  const voiceServiceInitializedRef = useRef(false);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const abortAnimationRef = useRef<number | null>(null);

  const farmerName = sessionData?.farmerName || userName || "Farmer";
  const farmerCountry = sessionData?.country || 'kenya';
  const breed = sessionData?.breed || '';
  const stage = sessionData?.stage || '';
  const quantityKg = sessionData?.quantityKg || 0;
  const county = sessionData?.county || '';
  const subCounty = sessionData?.subCounty || '';
  const ward = sessionData?.ward || '';
  const village = sessionData?.village || '';

  // ===== TRANSFORM structuredList with currency replacement =====
  const transformedStructuredList = useMemo(() => {
    if (!sessionData?.structuredList) return [];

    const breed = sessionData?.breed || '';
    const stage = sessionData?.stage || '';
    const displaySymbol = getDisplaySymbol();

    return sessionData.structuredList.map((item: any) => {
      if (item.key === 'ingredient_table') {
        const ingredients = sessionData?.feedResult?.ingredients || [];
        const totalCost = sessionData?.feedResult?.totalCost || 0;

        let bulletList = '';
        ingredients.forEach((ing: any) => {
          const amount = ing.amountKg.toFixed(2);
          const cost = displaySymbol + ' ' + ing.cost.toFixed(0);
          bulletList += `• ${ing.name}: ${amount} kg (${cost})\n`;
        });
        bulletList += `\nTotal Cost: ${displaySymbol} ${totalCost.toFixed(0)}`;

        return {
          ...item,
          params: { content: bulletList }
        };
      }

      if (item.key === 'nutritional_info') {
        const nutritionData = sessionData?.feedResult?.nutritionalSummary;
        let actualProtein = nutritionData?.protein || 0;
        let actualCalcium = nutritionData?.calcium || 0;
        let actualEnergy = nutritionData?.energy || 0;

        const targets = getNutritionalTargets(breed, stage);
        let targetProtein = targets.protein;
        let targetCalcium = targets.calcium;
        let targetEnergy = targets.energy;

        if (nutritionData?.targetProtein) targetProtein = nutritionData.targetProtein;
        if (nutritionData?.targetCalcium) targetCalcium = nutritionData.targetCalcium;
        if (nutritionData?.targetEnergy) targetEnergy = nutritionData.targetEnergy;

        const tolerance = 0.05;
        const isProteinMet = targetProtein > 0 ? Math.abs(actualProtein - targetProtein) / targetProtein < tolerance : false;
        const isCalciumMet = targetCalcium > 0 ? Math.abs(actualCalcium - targetCalcium) / targetCalcium < tolerance : false;
        const isEnergyMet = targetEnergy > 0 ? Math.abs(actualEnergy - targetEnergy) / targetEnergy < tolerance : false;
        const allMet = isProteinMet && isCalciumMet && isEnergyMet;

        let bulletLines: string[] = [];
        bulletLines.push(`- Protein: ${actualProtein.toFixed(2)}% (Target: ${targetProtein}%) ${isProteinMet ? '✅' : '❌'}`);
        bulletLines.push(`- Calcium: ${actualCalcium.toFixed(2)}% (Target: ${targetCalcium}%) ${isCalciumMet ? '✅' : '❌'}`);
        bulletLines.push(`- Energy: ${actualEnergy.toFixed(0)} kcal/kg (Target: ${targetEnergy} kcal/kg) ${isEnergyMet ? '✅' : '❌'}`);

        let adviceLines: string[] = [];
        if (!isProteinMet) {
          const diff = actualProtein - targetProtein;
          const absDiff = Math.abs(diff).toFixed(1);
          const direction = diff > 0 ? 'high' : 'low';
          adviceLines.push(`  - Protein is ${absDiff}% too ${direction} - ${direction === 'high' ? 'Reduce protein sources (soya, fish, sunflower, cotton seed)' : 'Add more protein sources (soya bean meal or fish meal)'}`);
        }
        if (!isCalciumMet) {
          const diff = actualCalcium - targetCalcium;
          const absDiff = Math.abs(diff).toFixed(1);
          const direction = diff > 0 ? 'high' : 'low';
          adviceLines.push(`  - Calcium is ${absDiff}% too ${direction} - ${direction === 'high' ? 'Reduce lime or dcp' : 'Increase lime or dcp'}`);
        }
        if (!isEnergyMet) {
          const diff = actualEnergy - targetEnergy;
          const absDiff = Math.abs(diff).toFixed(0);
          const direction = diff > 0 ? 'high' : 'low';
          adviceLines.push(`  - Energy is ${absDiff} kcal/kg too ${direction} - ${direction === 'high' ? 'Reduce high-energy ingredients (maize, oil)' : 'Add more maize or vegetable oil'}`);
        }

        let summaryLine = allMet
          ? '✅ All nutritional targets met! This feed is properly balanced for your birds.'
          : '⚠️ Some nutritional targets are not met. Please review the formula:';

        let enhancedContent = bulletLines.join('\n');
        if (adviceLines.length > 0) {
          enhancedContent += '\n\n' + summaryLine + '\n' + adviceLines.join('\n');
        } else {
          enhancedContent += '\n\n' + summaryLine;
        }

        return {
          ...item,
          params: { content: enhancedContent }
        };
      }

      return item;
    }).map((item: any) => {
      if (item.params?.content && typeof item.params.content === 'string') {
        let content = item.params.content;
        content = content.replace(/\{\{CURRENCY\}\}/g, getDisplaySymbol());
        content = content.replace(/Ksh/g, getDisplaySymbol());
        return { ...item, params: { ...item.params, content } };
      }
      return item;
    });
  }, [sessionData, getDisplaySymbol]);

  const transformedFinancialAdvice = useMemo(() => {
    if (!sessionData?.structuredFinancialAdvice) return null;
    const advice = sessionData.structuredFinancialAdvice;
    if (advice.params?.content && typeof advice.params.content === 'string') {
      let content = advice.params.content;
      content = content.replace(/\{\{CURRENCY\}\}/g, getDisplaySymbol());
      content = content.replace(/Ksh/g, getDisplaySymbol());
      return { ...advice, params: { ...advice.params, content } };
    }
    return advice;
  }, [sessionData, getDisplaySymbol]);

  useEffect(() => {
    setStructuredList(transformedStructuredList);
  }, [transformedStructuredList]);

  useEffect(() => {
    if (transformedFinancialAdvice) {
      setStructuredFinancialAdvice(transformedFinancialAdvice);
    }
  }, [transformedFinancialAdvice]);

  // Submit Farmers Comment
  const submitFarmerComment = async () => {
    if (!farmerComment.trim() || !sessionData) return;
    setIsCommentSubmitting(true);
    setCommentSubmitted(false);

    try {
      const res = await fetch('/api/farmer/farmerscomments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: farmerComment,
          farmerName: sessionData.farmerName || userName || "Farmer",
          userId: userId,
          sessionId: sessionData.id || interviewId,
          crop: sessionData.breed || 'poultry',
          country: sessionData.country || 'kenya'
        })
      });

      if (res.ok) {
        setCommentSubmitted(true);
        setFarmerComment('');
        const successMessage = safeT('feedback_saved', 'your comments have been received successfully!');
        await speakWithVoice(successMessage);
        setCommentSubmitted(false);
      } else {
        const failedMessage = safeT('feedback_failed', 'your comment not received. Please try again later.');
        await speakWithVoice(failedMessage);
        setCommentSubmitted(false);
      }
    } catch (error: any) {
      console.error("Error submitting farmer comment:", error);
      const failedMessage = safeT('feedback_failed', 'your comment not received. Please try again later.');
      await speakWithVoice(failedMessage);
      setCommentSubmitted(false);
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  // Voice setup (unchanged)
  const recognitionLanguage = (() => {
    const lang = i18n.language || 'en';
    if (lang === 'en-GB') return 'en-GB';
    if (lang === 'en') return 'en-US';
    if (lang === 'fr') return 'fr-FR';
    if (lang === 'sw') return 'sw-KE';
    if (lang === 'es') return 'es-ES';
    return 'en-US';
  })();

  const getBestVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    // ... (all the voice selection logic – unchanged)
    const findBritishEnglishFemale = (): SpeechSynthesisVoice | null => {
      const femaleNames = ['libby', 'hazel', 'susan', 'maisie', 'sonia', 'kate', 'victoria', 'millie', 'olivia', 'google uk english female', 'microsoft libby', 'microsoft hazel', 'microsoft susan', 'microsoft maisie', 'microsoft sonia', 'british english female', 'uk english female'];
      for (const name of femaleNames) {
        const voice = voices.find(v => v.lang === 'en-GB' && v.name.toLowerCase().includes(name));
        if (voice) return voice;
      }
      const maleIndicators = ['george', 'ryan', 'thomas', 'david', 'mark', 'james', 'john', 'paul', 'michael'];
      const anyBritishFemale = voices.find(v => v.lang === 'en-GB' && !maleIndicators.some(m => v.name.toLowerCase().includes(m)));
      if (anyBritishFemale) return anyBritishFemale;
      return voices.find(v => v.lang === 'en-GB') || null;
    };

    const findAmericanEnglishFemale = (): SpeechSynthesisVoice | null => {
      const femaleNames = ['samantha', 'victoria', 'zira', 'jenny', 'aria', 'google us english female', 'microsoft jenny', 'microsoft zira', 'microsoft aria', 'us english female'];
      for (const name of femaleNames) {
        const voice = voices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes(name));
        if (voice) return voice;
      }
      const maleIndicators = ['david', 'mark', 'james', 'john', 'paul', 'michael', 'alex', 'thomas'];
      const anyFemale = voices.find(v => v.lang === 'en-US' && !maleIndicators.some(m => v.name.toLowerCase().includes(m)));
      if (anyFemale) return anyFemale;
      return voices.find(v => v.lang === 'en-US') || null;
    };

    const findFrenchVoice = (): SpeechSynthesisVoice | null => {
      let vivienne = voices.find(v => v.lang.startsWith('fr') && v.name.toLowerCase().includes('vivienne'));
      if (vivienne) return vivienne;
      const frenchFemale = voices.find(v => v.lang.startsWith('fr') && (v.name.toLowerCase().includes('denise') || v.name.toLowerCase().includes('google français female') || v.name.toLowerCase().includes('marie') || v.name.toLowerCase().includes('chloe')));
      if (frenchFemale) return frenchFemale;
      return voices.find(v => v.lang.startsWith('fr')) || null;
    };

    const findSpanishVoice = (): SpeechSynthesisVoice | null => {
      const femaleNames = ['elena', 'ximena', 'maria', 'paloma', 'sofia', 'catalina', 'salome', 'belkys', 'ramona', 'andrea', 'lorena', 'teresa', 'marta', 'karla', 'dalia', 'yolanda', 'margarita', 'tania', 'camila', 'karina', 'elvira', 'valentina', 'paola', 'michelle', 'gabriela', 'lucia', 'laura', 'fernanda', 'victoria', 'monica', 'paulina', 'sabina', 'helena', 'florencia'];
      for (const name of femaleNames) {
        const voice = voices.find(v => v.lang.startsWith('es') && v.name.toLowerCase().includes(name));
        if (voice) return voice;
      }
      const nonMale = voices.find(v => v.lang.startsWith('es') && !v.name.toLowerCase().includes('alvaro') && !v.name.toLowerCase().includes('jorge') && !v.name.toLowerCase().includes('manuel') && !v.name.toLowerCase().includes('andres') && !v.name.toLowerCase().includes('carlos') && !v.name.toLowerCase().includes('juan') && !v.name.toLowerCase().includes('luis') && !v.name.toLowerCase().includes('rodrigo') && !v.name.toLowerCase().includes('javier'));
      if (nonMale) return nonMale;
      return null;
    };

    const findSwahiliVoice = (): SpeechSynthesisVoice | null => {
      let swahiliVoices = voices.filter(v => v.lang === 'sw-KE' && (v.name.includes('Rafiki') || v.name.includes('Zuri') || v.name.includes('Aisha') || v.name.includes('Kenya')));
      if (swahiliVoices.length > 0) return swahiliVoices[0];
      swahiliVoices = voices.filter(v => v.lang === 'sw-KE');
      if (swahiliVoices.length > 0) return swahiliVoices[0];
      return null;
    };

    if (recognitionLanguage === 'en-GB') {
      const britishVoice = findBritishEnglishFemale();
      if (britishVoice) return { voice: britishVoice, language: 'en-GB' };
      const anyNonMale = voices.find(v => v.lang.startsWith('en') && !v.name.toLowerCase().includes('male'));
      if (anyNonMale) return { voice: anyNonMale, language: 'en-GB' };
    }
    if (recognitionLanguage === 'en-US') {
      const usVoice = findAmericanEnglishFemale();
      if (usVoice) return { voice: usVoice, language: 'en-US' };
      const anyNonMale = voices.find(v => v.lang.startsWith('en') && !v.name.toLowerCase().includes('male'));
      if (anyNonMale) return { voice: anyNonMale, language: 'en-US' };
    }
    if (recognitionLanguage === 'fr-FR' || recognitionLanguage === 'fr-CA' || recognitionLanguage.startsWith('fr')) {
      const frenchVoice = findFrenchVoice();
      if (frenchVoice) return { voice: frenchVoice, language: 'fr-FR' };
    }
    if (recognitionLanguage === 'es-ES' || recognitionLanguage.startsWith('es')) {
      const spanishVoice = findSpanishVoice();
      if (spanishVoice) return { voice: spanishVoice, language: 'es-ES' };
    }
    if (recognitionLanguage === 'sw-KE' || recognitionLanguage === 'sw-TZ' || recognitionLanguage.startsWith('sw')) {
      const swahiliVoice = findSwahiliVoice();
      if (swahiliVoice) return { voice: swahiliVoice, language: 'sw-KE' };
    }
    const anyEnglish = voices.find(v => v.lang.startsWith('en') && !v.name.toLowerCase().includes('male'));
    if (anyEnglish) return { voice: anyEnglish, language: 'en-GB' };
    if (voices.length > 0) return { voice: voices[0], language: 'en-GB' };
    return { voice: null, language: 'en-GB' };
  };

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
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      waitForVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => waitForVoices();
      }
    }
  }, []);

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
        currentUserId = localStorage.getItem('userId') || `user-${Date.now()}`;
        localStorage.setItem('userId', currentUserId);
      }

      try {
        voiceServiceRef.current = new VoiceService({
          interviewId: interviewId || `demo-${Date.now()}`,
          userId: currentUserId,
          type: "practice",
          speechRate: 0.9,
          speechVolume: 0.8,
          country: farmerCountry,
          farmerName: farmerName
        });
        voiceServiceInitializedRef.current = true;
        setVoiceInitializing(false);
        toast.success(safeT('smart_farmer_here') || "Smart Farmer AI is here!");
      } catch (error: any) {
        console.error("Failed to initialize VoiceService:", error);
        toast.error(safeT('voice_service_failed') || "Failed to initialize voice service");
        setVoiceInitializing(false);
      }
    }
  }, [voiceEnabled, farmerName, farmerCountry, safeT]);

  if (!ready) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner fullScreen={false} message="Loading your feed advisor..." />
      </div>
    );
  }

  const cleanText = (text: string): string => {
    return text
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
      .replace(/\*\*\*/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s?/g, '')
      .replace(/_/g, '')
      .replace(/~/g, '')
      .replace(/`/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const prepareForSpeech = (text: string): string => {
    let speechText = cleanText(text);
    const currencyName = getSpokenCurrencyName();
    const symbol = getDisplaySymbol();
    const escapedSymbol = symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    speechText = speechText.replace(new RegExp(`${escapedSymbol}\\s`, 'g'), `${currencyName} `);
    speechText = speechText.replace(new RegExp(`\\b${escapedSymbol}\\b`, 'g'), currencyName);
    speechText = speechText
      .replace(/Ksh\s/g, `${currencyName} `)
      .replace(/Ksh\b/g, currencyName)
      .replace(/USh\s/g, `${currencyName} `)
      .replace(/USh\b/g, currencyName)
      .replace(/TSh\s/g, `${currencyName} `)
      .replace(/TSh\b/g, currencyName);

    nameUsageCountRef.current++;
    const useName = nameUsageCountRef.current % 3 === 0;
    speechText = speechText
      .replace(/\b(farmer)\b/gi, useName ? farmerName : 'the farmer')
      .replace(/\b(you)\b/gi, useName ? farmerName : 'you')
      .replace(/\b(your)\b/gi, useName ? `${farmerName}'s` : 'your');
    return speechText;
  };

  // ========== STREAMING KARAOKE ==========
  const streamRecommendationKaraoke = async (rawRecommendation: string, index: number) => {
    console.log(`🎤 [Karaoke] Starting stream for index ${index}, key: ${structuredList[index]?.key}`);
    if (!voiceEnabled || !window.speechSynthesis) return;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      await new Promise(r => setTimeout(r, 200));
    }

    setActiveStreamingRec(index);
    setRecommendationStreams(prev => ({ ...prev, [index]: "" }));

    const fullRawText = rawRecommendation;
    const speechText = prepareForSpeech(rawRecommendation);
    const totalChars = speechText.length;
    const totalDuration = Math.max(3000, totalChars * 80);
    let startTime = 0;
    let animationId: number | null = null;

    const updateProgress = (progress: number) => {
      const charIndex = Math.floor(progress * fullRawText.length);
      setRecommendationStreams(prev => ({ ...prev, [index]: fullRawText.substring(0, charIndex) }));
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
          setRecommendationStreams(prev => ({ ...prev, [index]: fullRawText }));
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
        setRecommendationStreams(prev => ({ ...prev, [index]: fullRawText }));
        setReadRecommendations(prev => new Set(prev).add(index));
        setActiveStreamingRec(null);
        resolve();
      };
      utterance.onerror = (err) => {
        console.error("Speech error:", err);
        if (animationId) cancelAnimationFrame(animationId);
        setRecommendationStreams(prev => ({ ...prev, [index]: fullRawText }));
        setReadRecommendations(prev => new Set(prev).add(index));
        setActiveStreamingRec(null);
        resolve();
      };
      window.speechSynthesis.speak(utterance);
      currentUtteranceRef.current = utterance;
    });
  };

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

  // ========== STREAM ALL RECOMMENDATIONS ==========
  const streamAllRecommendations = async () => {
    if (structuredList.length === 0 || recommendationsSpoken) return;

    console.log("🔊 [streamAllRecommendations] Starting, structuredList keys:", structuredList.map(item => item.key));
    setRecommendationsSpoken(true);
    nameUsageCountRef.current = 0;

    const currencyName = getSpokenCurrencyName();

    const voiceScriptItem = structuredList.find((item: any) => item.key === 'voice_script');

    if (voiceScriptItem && voiceScriptItem.params?.content) {
      const voiceScript = voiceScriptItem.params.content;
      await speakWithVoice(voiceScript);
      await new Promise(resolve => setTimeout(resolve, 2000));

      const voiceIndex = structuredList.indexOf(voiceScriptItem);
      setReadRecommendations(prev => new Set(prev).add(voiceIndex));

      for (let i = 0; i < structuredList.length; i++) {
        const item = structuredList[i];
        if (item.key === 'voice_script') continue;

        let content = '';
        if (item.params?.content) {
          content = item.params.content;
        } else {
          content = safeT(item.key, item.params);
        }
        if (!content || content.trim() === '') continue;

        if (item.key === 'ingredient_list') continue;

        await streamRecommendationKaraoke(content, i);
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    } else {
      let introMessage = safeT('prepared_feed_recommendations', 'I\'ve prepared your custom poultry feed formula. ');
      if (breed && stage && quantityKg) {
        introMessage += safeT('feed_summary', {
          breed: breed,
          stage: stage,
          quantity: quantityKg,
          currencyName
        }) + ' ';
      }

      await speakWithVoice(introMessage);
      await new Promise(resolve => setTimeout(resolve, 2000));

      for (let i = 0; i < structuredList.length; i++) {
        let content = '';
        const item = structuredList[i];
        if (item.params?.content) {
          content = item.params.content;
        } else {
          content = safeT(item.key, item.params);
        }
        if (!content || content.trim() === '') continue;
        await streamRecommendationKaraoke(content, i);
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }

    if (structuredFinancialAdvice) {
      const financialText = safeT(structuredFinancialAdvice.key, structuredFinancialAdvice.params);
      await speakWithVoice(financialText);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    await speakWithVoice(safeT('post_feed_recommendations', 'That\'s your feed formula. Ask me more about poultry management.'));
  };

  // ===== START VOICE INTERVIEW =====
  const startVoiceInterview = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      if (!voiceEnabled) {
        toast.error("Please turn voice ON first by clicking the 'Voice ON' button");
        setIsProcessing(false);
        return;
      }

      if (!voiceServiceRef.current) {
        const initToast = toast.loading(safeT('initializing_voice'));
        setVoiceInitializing(true);
        let attempts = 0;
        while (!voiceServiceRef.current && attempts < 15) {
          await new Promise(resolve => setTimeout(resolve, 300));
          attempts++;
        }
        toast.dismiss(initToast);
        setVoiceInitializing(false);
        if (!voiceServiceRef.current) {
          toast.error(safeT('voice_service_failed'));
          setIsProcessing(false);
          return;
        }
      }

      setIsLoading(true);

      if (sessionData && voiceServiceRef.current && typeof voiceServiceRef.current.startFarmerSession === 'function') {
        await voiceServiceRef.current.startFarmerSession(sessionData);
      }

      if (sessionData && !welcomeSpoken) {
        setWelcomeSpoken(true);
        nameUsageCountRef.current = 0;
        setRecommendationStreams({});
        setReadRecommendations(new Set());

        const welcomeText = safeT('welcome_feed_plan', 'Welcome! I\'ve prepared your customized poultry feed plan based on your birds and stage.');
        await speakWithVoice(welcomeText);
        await new Promise(resolve => setTimeout(resolve, 2000));
        await streamAllRecommendations();
      }

      toast.success(safeT('ready_ask_away'));
    } catch (error: any) {
      console.error("Failed to start:", error);
      toast.error(safeT('failed_to_start', { message: error.message }));
    } finally {
      setIsLoading(false);
      setIsProcessing(false);
    }
  };

  const isStartButtonDisabled = isLoading || voiceInitializing || isProcessing;

  const getStartButtonText = () => {
    if (isLoading) return safeT('starting');
    if (voiceInitializing) return safeT('initializing');
    if (!voiceEnabled) return "Turn Voice ON First";
    return safeT('start_voice_session', 'Hear Recommendations');
  };

  const isHTMLContent = (content: string): boolean => {
    return content.trim().startsWith('<table') || content.trim().startsWith('<style');
  };

  // ========== RENDER FEED RECOMMENDATION TEXT ==========
  const renderRecommendationText = (item: StructuredItem, idx: number) => {
    console.log(`🎨 [renderRecommendationText] Rendering item ${idx}, key: ${item.key}`);
    let displayContent = '';
    if (item.params?.content) {
      displayContent = item.params.content;
    } else {
      displayContent = safeT(item.key, item.params);
    }

    if (!displayContent || displayContent.trim() === '') return null;

    const displayedText = recommendationStreams[idx] || '';
    const isActive = activeStreamingRec === idx;
    const isRead = readRecommendations.has(idx);
    if (!isActive && !isRead) return null;

    const finalText = isActive ? displayedText : displayContent;
    if (!finalText) return null;

    const displaySymbol = getDisplaySymbol();
    const originalSymbol = currency.symbol;
    let processedText = finalText;
    if (displaySymbol !== originalSymbol) {
      const escapedOrig = originalSymbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      processedText = processedText.replace(new RegExp(escapedOrig, 'g'), displaySymbol);
    }
    if (displaySymbol !== 'Ksh') {
      processedText = processedText.replace(/Ksh/g, displaySymbol);
    }

    let icon = null;
    let title = '';
    if (item.key === 'feed_summary') { icon = <Package className="w-5 h-5" />; title = safeT('feed_summary_title', 'Feed Summary'); }
    else if (item.key === 'ingredient_table') { icon = <Scale className="w-5 h-5" />; title = safeT('ingredient_table_title', 'Ingredients & Costs'); }
    else if (item.key === 'ingredient_list') { icon = <ClipboardList className="w-5 h-5" />; title = safeT('ingredient_list_title', 'Ingredient List'); }
    else if (item.key === 'nutritional_info') { icon = <Beaker className="w-5 h-5" />; title = safeT('nutritional_info_title', 'Nutritional Summary'); }
    else if (item.key === 'total_cost') { icon = <DollarSign className="w-5 h-5" />; title = safeT('total_cost_title', 'Total Cost'); }
    else if (item.key === 'mixing_instructions') { icon = <AlertCircle className="w-5 h-5" />; title = safeT('mixing_instructions_title', 'Mixing Instructions'); }
    else if (item.key === 'safety_warnings') { icon = <Shield className="w-5 h-5" />; title = safeT('safety_warnings_title', 'Safety Warnings'); }
    else if (item.key === 'voice_script') { icon = <Volume2 className="w-5 h-5" />; title = safeT('voice_summary_title', 'Voice Summary'); }
    else if (item.key === 'optimization_status') { icon = <Sparkles className="w-5 h-5" />; title = safeT('optimization_status_title', 'Optimization Status'); }
    else if (item.key === 'weekly_feed_plan') {
      console.log("📅 [renderRecommendationText] Rendering weekly_feed_plan with content:", displayContent);
      icon = <Calendar className="w-5 h-5" />;
      title = safeT('weekly_feed_plan_title', 'Weekly Feed Plan & Financial Summary');
    }
    else if (item.key === 'vaccination_schedule') {
      icon = <Shield className="w-5 h-5" />;
      title = safeT('vaccination_schedule_title', 'Vaccination Schedule');
    }
    else { icon = <Sparkles className="w-5 h-5" />; title = item.key; }

    if (item.key === 'voice_script') {
      return (
        <div key={idx} className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border-2 border-purple-300">
          <div className="flex items-center gap-3 text-purple-700">
            <Volume2 className="w-5 h-5 animate-pulse" />
            <span className="font-medium">{safeT('voice_summary_ready', '📢 Full formula summary spoken above')}</span>
          </div>
        </div>
      );
    }

    if (item.key === 'ingredient_list') {
      const lines = processedText.split('\n').filter(line => line.trim());
      return (
        <div
          key={idx}
          className={`rounded-xl p-5 transition-all duration-300 border-2 ${
            isActive ? 'bg-green-100 border-green-500 shadow-2xl scale-105' : 'bg-green-50 border-green-300'
          }`}
        >
          <div className="flex items-start gap-4">
            <span className="rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 bg-green-500 text-white">
              {idx + 1}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3 text-green-700">
                {icon}
                <span className="font-semibold text-sm uppercase tracking-wide">{title}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {lines.map((line, i) => {
                  const match = line.match(/^([^:]+):\s*([\d.]+)\s*kg/i);
                  if (match) {
                    const [, name, amount] = match;
                    return (
                      <div key={i} className="flex justify-between items-center p-2 bg-white rounded-lg border border-gray-200">
                        <span className="text-sm font-medium text-gray-700">{name.trim()}</span>
                        <span className="text-sm font-bold text-emerald-600">{amount} kg</span>
                      </div>
                    );
                  }
                  return (
                    <div key={i} className="p-2 bg-white rounded-lg border border-gray-200 text-sm text-gray-700">
                      {line}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (isHTMLContent(processedText)) {
      return (
        <div
          key={idx}
          className={`rounded-xl p-5 transition-all duration-300 border-2 ${
            isActive ? 'bg-blue-100 border-blue-500 shadow-2xl scale-105' : 'bg-blue-50 border-blue-300'
          }`}
        >
          <div className="flex items-start gap-4">
            <span className="rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 bg-blue-500 text-white">
              {idx + 1}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 text-blue-700">
                {icon}
                <span className="font-semibold text-sm uppercase tracking-wide">{title}</span>
              </div>
              <div
                className="prose prose-sm max-w-full overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: processedText }}
              />
            </div>
          </div>
        </div>
      );
    }

    const lines = processedText.split(/\n/);
    const progressPercent = (displayedText.length / displayContent.length) * 100;

    return (
      <div
        key={idx}
        className={`rounded-xl p-5 transition-all duration-300 border-2 ${
          isActive ? 'bg-blue-100 border-blue-500 shadow-2xl scale-105' : 'bg-blue-50 border-blue-300'
        }`}
      >
        <div className="flex items-start gap-4">
          <span className="rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 bg-blue-500 text-white">
            {idx + 1}
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 text-blue-700">
              {icon}
              <span className="font-semibold text-sm uppercase tracking-wide">{title}</span>
            </div>
            <p className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap">
              {lines.map((line, i) => (
                <span key={i}>
                  {line}
                  {i < lines.length - 1 && <br />}
                </span>
              ))}
            </p>
            {isActive && displayContent.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 transition-all duration-150" style={{ width: `${progressPercent}%` }} />
                </div>
                <span className="text-sm text-blue-700 font-medium">
                  {Math.round(progressPercent)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ========== RENDER ==========
  return (
    <div className="flex flex-col gap-6 p-4 bg-gradient-to-br from-slate-50 to-white rounded-2xl">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-emerald-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/interview/${interviewId}`} className="p-2 bg-emerald-100 hover:bg-emerald-200 rounded-xl">
              <ArrowLeft className="w-5 h-5 text-emerald-700" />
            </Link>
            <div className="relative">
              <Image src="/beautiful-avatar.png" alt={userName} width={48} height={48} className="rounded-full size-12 ring-4 ring-emerald-200" />
            </div>
            <div>
              <h4 className="font-bold text-lg text-gray-800">{userName}</h4>
              <div className="flex flex-wrap gap-1 text-xs">
                {breed && <span className="text-emerald-600 font-medium">{breed}</span>}
                {stage && <span className="text-gray-500">• {stage}</span>}
                {quantityKg > 0 && <span className="text-gray-400">• {quantityKg} kg</span>}
                {county && <span className="text-gray-400">• {county}</span>}
                {sessionData?.country && <span className="text-gray-400">• {sessionData.country}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 font-medium text-sm transition-all ${
                voiceEnabled
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                  : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
              }`}
            >
              {voiceEnabled ? <><Mic className="w-4 h-4" /><span>Voice ON</span></> : <><MicOff className="w-4 h-4" /><span>Voice OFF</span></>}
            </button>
            <button onClick={startVoiceInterview} disabled={isStartButtonDisabled} className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap ${!isStartButtonDisabled ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
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
            {safeT('ask_questions', 'Ask Questions')}
          </button>
        </Link>
        <button
          onClick={startVoiceInterview}
          disabled={isStartButtonDisabled}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold hover:from-emerald-700 hover:to-teal-700 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Volume2 className="w-5 h-5" />
          {safeT('hear_recommendations', 'Hear Recommendations')}
        </button>
      </div>

      {/* Feed Recommendations */}
      {structuredList.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border-2 border-blue-200 shadow-xl">
          <h3 className="font-bold text-2xl mb-4 flex items-center gap-2 text-blue-800">
            <Sparkles className="w-6 h-6 text-blue-600" />
            {safeT('custom_feed_formula', 'Custom Feed Formula')}
            {activeStreamingRec !== null && (
              <span className="ml-auto flex items-center gap-2 text-blue-600">
                <Volume2 className="w-5 h-5 animate-pulse" />
                <span className="text-sm">{safeT('speaking', 'Speaking')}</span>
              </span>
            )}
          </h3>
          <div className="mb-6 p-3 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-xl text-white">
            <p className="text-sm flex items-center gap-2">
              <Rocket className="w-4 h-4" />
              {safeT('feed_business_tip', 'Business Tip: Mix accurately to avoid waste and maximize growth.')}
            </p>
          </div>
          <div className="space-y-4">
            {structuredList.map((item, idx) => {
              console.log(`🖼️ [Render] Rendering item ${idx}, key: ${item.key}`);
              return renderRecommendationText(item, idx);
            })}
          </div>
          <div className="mt-4 text-center text-sm text-gray-500">
            {safeT('feed_disclaimer', 'Store feed in a dry, cool place and use within 2 weeks.')}
          </div>
          {sessionData?.feedResult?.warnings && sessionData.feedResult.warnings.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-300">
              <p className="text-red-800 text-sm flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {sessionData.feedResult.warnings.join(' ')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Location Info */}
      {(county || subCounty || ward || village) && (
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            {safeT('location_info', 'Location')}
          </h4>
          <div className="flex flex-wrap gap-2 text-sm text-gray-600">
            {county && <span className="bg-gray-100 px-3 py-1 rounded-full">🏛️ {county}</span>}
            {subCounty && <span className="bg-gray-100 px-3 py-1 rounded-full">📌 {subCounty}</span>}
            {ward && <span className="bg-gray-100 px-3 py-1 rounded-full">📍 {ward}</span>}
            {village && <span className="bg-gray-100 px-3 py-1 rounded-full">🏘️ {village}</span>}
          </div>
        </div>
      )}

      {/* Farmers Comments Section */}
      <div className="mt-2 p-4 bg-gray-50 rounded-xl border-2 border-gray-300">
        <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
          💬 {safeT('farmers_comments', 'Farmers Comments / Suggestions')}
        </h4>
        <textarea
          value={farmerComment}
          onChange={(e) => setFarmerComment(e.target.value)}
          placeholder={safeT('write_suggestion_placeholder', 'Write your suggestion to improve the content...')}
          className="w-full p-3 border rounded-xl text-gray-800 h-24 resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={submitFarmerComment}
          disabled={!farmerComment.trim() || isCommentSubmitting}
          className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors"
        >
          {isCommentSubmitting
            ? safeT('submitting', 'Submitting...')
            : safeT('submit_farmers_comment', 'Submit Farmers Comment')}
        </button>
        {commentSubmitted && (
          <p className="text-green-600 text-sm mt-2">✅ {safeT('thanks_for_feedback', 'Thank you! Your comment helps us improve.')}</p>
        )}
      </div>

      <OfflineBanner />
    </div>
  );
};

export default Agent;
// components/FundersWizard.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useCurrency } from "@/lib/context/CurrencyContext";
import { FUNDERS, Funder } from "@/lib/data/funders";
import { ChevronDown, ExternalLink, ArrowRight, Loader2, Mic, Volume2 } from "lucide-react";

interface Props {
  userCountry: string;
}

export default function FundersWizard({ userCountry }: Props) {
  const { setCountry, currency } = useCurrency();

  // --- WIZARD STATE ---
  const [step, setStep] = useState(0); // 0 = Start Screen, 1-5 = Questions, 6 = Results
  const [answers, setAnswers] = useState({
    instrument: "",
    ticketSize: "",
    sector: "",
    gender: "",
    geography: "",
  });
  const [results, setResults] = useState<Funder[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // --- VOICE/KARAOKE STATE ---
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [streamingQuestion, setStreamingQuestion] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const wordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const voiceCacheRef = useRef<Record<string, SpeechSynthesisVoice | null>>({});

  // Set the currency based on the user's country from their session
  useEffect(() => {
    if (userCountry) {
      setCountry(userCountry.toLowerCase());
    }
  }, [userCountry, setCountry]);

  // Pre-load voices for TTS
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (allVoices.length === 0) return;
      const languages = ["en-US", "en-GB"];
      languages.forEach((lang) => {
        let voice = allVoices.find((v) => v.lang === lang && !v.name.toLowerCase().includes("male"));
        if (!voice) voice = allVoices.find((v) => v.lang === lang);
        if (voice) voiceCacheRef.current[lang] = voice;
      });
      if (!voiceCacheRef.current["default"]) {
        voiceCacheRef.current["default"] = allVoices[0] || null;
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const questions = [
    {
      id: "instrument",
      text: "What type of financing are you looking for?",
      options: ["Debt", "Equity", "Grant", "Mezzanine"],
    },
    {
      id: "ticketSize",
      text: "How much funding do you need?",
      options: ["Micro (Under $50k)", "Small ($50k - $250k)", "Medium ($250k - $1M)", "Large (Over $1M)"],
    },
    {
      id: "sector",
      text: "What is the main focus of your enterprise?",
      options: ["Agribusiness", "Climate", "Food", "Smallholder"],
    },
    {
      id: "gender",
      text: "Does your business have a specific target focus?",
      options: ["General", "Women", "Youth"],
    },
    {
      id: "geography",
      text: "Where are you looking for funders?",
      options: ["Kenya", "East Africa", "Pan-African"],
    },
  ];

  // --- KARAOKE SPEECH ENGINE (From CreateInterviewAgent) ---
  const streamQuestionWithVoice = (fullText: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!voiceEnabled || !window.speechSynthesis) {
        setStreamingQuestion(fullText);
        resolve();
        return;
      }
      if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
      if (wordTimerRef.current) clearTimeout(wordTimerRef.current);

      setIsStreaming(true);
      setStreamingQuestion("");

      const utterance = new SpeechSynthesisUtterance(fullText);
      utterance.rate = 0.95;
      utterance.pitch = 1.1;

      const cachedVoice = voiceCacheRef.current["en-US"] || voiceCacheRef.current["default"];
      if (cachedVoice) utterance.voice = cachedVoice;

      const words = fullText.split(" ");
      let wordIndex = 0;
      let currentText = "";
      let isFinished = false;

      const finish = () => {
        if (isFinished) return;
        isFinished = true;
        if (wordTimerRef.current) clearTimeout(wordTimerRef.current);
        setStreamingQuestion(fullText);
        setIsStreaming(false);
        resolve();
      };

      const scheduleNextWord = () => {
        if (isFinished || wordIndex >= words.length) return;
        const word = words[wordIndex];
        const duration = Math.max(150, Math.min(1200, word.length * 90));

        wordTimerRef.current = setTimeout(() => {
          currentText += (currentText ? " " : "") + word;
          setStreamingQuestion(currentText);
          wordIndex++;
          scheduleNextWord();
        }, duration);
      };

      scheduleNextWord();

      utterance.onend = finish;
      utterance.onerror = finish;
      setTimeout(finish, Math.max(5000, fullText.length * 100) + 5000);

      window.speechSynthesis.speak(utterance);
    });
  };

  // Trigger voice when step changes to a question
  useEffect(() => {
    if (step >= 1 && step <= 5 && voiceEnabled) {
      const currentQ = questions[step - 1];
      // Speak the question and list the options
      const textToSpeak = `${currentQ.text} The options are: ${currentQ.options.join(", ")}.`;
      streamQuestionWithVoice(textToSpeak);
    } else if (step === 6 && voiceEnabled) {
      streamQuestionWithVoice(`I found ${results.length} funders that match your criteria.`);
    }
  }, [step, voiceEnabled]);

  const handleNext = () => {
    if (step < questions.length) {
      setStep(step + 1);
    } else {
      runFilter();
    }
  };

  const runFilter = () => {
    setIsSearching(true);
    setTimeout(() => {
      const filtered = FUNDERS.filter((funder) => {
        const sizeFilter = answers.ticketSize.split(" ")[0];
        const matchInstrument = funder.instrument.includes(answers.instrument);
        const matchSize = funder.ticketSize === sizeFilter;
        const matchSector = funder.sector.includes(answers.sector);
        const matchGender = funder.gender.includes(answers.gender);
        const matchGeo = funder.geography.includes(answers.geography);

        return matchInstrument && matchSize && matchSector && matchGender && matchGeo;
      });
      setResults(filtered);
      setIsSearching(false);
      setStep(6); // Move to results
    }, 600);
  };

  const handleChange = (value: string) => {
    setAnswers((prev) => ({ ...prev, [questions[step - 1].id]: value }));
  };

  const resetWizard = () => {
    setStep(0);
    setAnswers({ instrument: "", ticketSize: "", sector: "", gender: "", geography: "" });
    setResults([]);
    setStreamingQuestion("");
  };

  // --- RENDER: START SCREEN (Step 0) ---
  if (step === 0) {
    return (
      <div className="bg-white rounded-2xl p-10 border-2 border-emerald-200 shadow-xl max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-emerald-800 mb-4">Find the Right Funder</h2>
        <p className="text-gray-600 mb-8">
          I will ask you 5 quick questions to match you with the perfect capital provider.
        </p>

        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              voiceEnabled ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-400' : 'bg-gray-100 text-gray-500 border-2 border-transparent'
            }`}
          >
            <Mic className="w-5 h-5" />
            {voiceEnabled ? "Voice ON" : "Voice OFF"}
          </button>
        </div>

        <button
          onClick={() => setStep(1)}
          className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-lg hover:scale-105 transition-all shadow-lg"
        >
          Start Questionnaire
        </button>
      </div>
    );
  }

  // --- RENDER: RESULTS (Step 6) ---
  if (step === 6) {
    return (
      <div className="bg-white rounded-2xl p-6 border-2 border-emerald-200 shadow-xl animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            🎉 Matched Funders ({results.length})
          </h2>
          {isStreaming && (
            <span className="flex items-center gap-2 text-emerald-600 text-sm">
              <Volume2 className="w-4 h-4 animate-pulse" /> Reading results...
            </span>
          )}
        </div>

        {results.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl">
            <p className="text-gray-600 mb-4">No exact matches found for your specific criteria.</p>
            <button onClick={resetWizard} className="text-emerald-600 font-bold hover:underline">
              Try adjusting your filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((funder) => (
              <div key={funder.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-lg text-emerald-900">{funder.name}</h3>
                  <div className="flex gap-2 my-2 flex-wrap">
                    {funder.instrument.map((ins) => (
                      <span key={ins} className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md font-medium">{ins}</span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{funder.notes}</p>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <div className="text-sm">
                    <span className="text-gray-500">Ticket: </span>
                    <span className="font-semibold text-gray-800">
                      ${(funder.minUSD / 1000).toLocaleString()}k - ${(funder.maxUSD / 1000).toLocaleString()}k
                    </span>
                  </div>
                  <a href={funder.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-emerald-600 font-bold hover:text-emerald-800">
                    Visit <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <button onClick={resetWizard} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium">
            Start Over
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER: WIZARD QUESTIONS (Steps 1-5) ---
  const currentQ = questions[step - 1];
  const currentAnswer = answers[currentQ.id as keyof typeof answers];

  return (
    <div className="bg-white rounded-2xl p-8 border-2 border-emerald-200 shadow-xl max-w-2xl mx-auto">
      {/* Header with Voice Toggle */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          {questions.map((_, idx) => (
            <div key={idx} className={`h-2 w-8 rounded-full ${idx < step ? 'bg-emerald-500' : 'bg-gray-200'}`} />
          ))}
        </div>
        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className={`p-2 rounded-lg ${voiceEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}
        >
          <Mic className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <span className="w-8 h-8 bg-emerald-500 text-white rounded-lg flex items-center justify-center font-bold text-sm">
          {step}
        </span>
        <h2 className="text-xl font-bold text-gray-800">{currentQ.text}</h2>
      </div>

      {/* Karaoke Display Box */}
      <div className="bg-emerald-50 rounded-xl p-6 border-2 border-emerald-200 mb-6 min-h-[80px]">
        {isStreaming ? (
          <p className="text-xl text-emerald-900 font-medium leading-relaxed">
            {streamingQuestion}
            <span className="animate-pulse text-emerald-500 ml-1">▍</span>
          </p>
        ) : streamingQuestion ? (
          <p className="text-xl text-emerald-900 font-medium leading-relaxed">
            {streamingQuestion}
          </p>
        ) : (
          <p className="text-gray-400 italic">Preparing question...</p>
        )}
      </div>

      {/* Dropdown Input (Disabled while speaking) */}
      <div className="relative mb-8">
        <select
          value={currentAnswer}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isStreaming}
          className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl appearance-none text-blue-900 font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all disabled:opacity-50 disabled:bg-gray-50"
        >
          <option value="" disabled>Select an option...</option>
          {currentQ.options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
      </div>

      <div className="flex gap-3">
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            disabled={isStreaming}
            className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold disabled:opacity-50"
          >
            Back
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!currentAnswer || isStreaming || isSearching}
          className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:scale-[1.01]"
        >
          {isSearching ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Searching...</>
          ) : step === questions.length ? (
            "Find My Funders"
          ) : (
            <>Next <ArrowRight className="w-5 h-5" /></>
          )}
        </button>
      </div>
    </div>
  );
}
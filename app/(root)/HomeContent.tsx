"use client";

import { useOfflineTranslation } from "@/lib/hooks/useOfflineTranslation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { WifiOff } from "lucide-react";

interface HomeContentProps {
  user: any;
  farmerSessions: any[];
  recentQueries: any[];
}

export default function HomeContent({
  user,
  farmerSessions,
  recentQueries,
}: HomeContentProps) {
  const { t, ready, isOnline } = useOfflineTranslation();

  const [karaokeWordIndex, setKaraokeWordIndex] = useState(-1);
  const [voiceActive, setVoiceActive] = useState(false);

  const guidanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const guidanceStoppedRef = useRef(false);

  // Stop voice guidance
  const stopStartSessionGuidance = () => {
    guidanceStoppedRef.current = true;
    if (guidanceTimeoutRef.current !== null) {
      window.clearTimeout(guidanceTimeoutRef.current);
      guidanceTimeoutRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setVoiceActive(false);
    setKaraokeWordIndex(-1);
  };

  const safeT = (key: string, params?: any): string => {
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
  };

  // Start Session voice guidance (repeats until Start is pressed)
  useEffect(() => {
    if (
      !ready ||
      !user ||
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      return;
    }

    guidanceStoppedRef.current = false;

    const translatedGuidance = safeT("start_session_guidance");
    if (!translatedGuidance || translatedGuidance === "start_session_guidance") {
      return;
    }

    const words = translatedGuidance.trim().split(/\s+/);

    const speakGuidance = () => {
      if (guidanceStoppedRef.current) return;
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(translatedGuidance);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      utterance.pitch = 1.05;
      utterance.volume = 1;

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find((voice) =>
        /Microsoft Jenny|Microsoft Aria|Google UK English Female|Google US English Female|Samantha|Microsoft Zira/i.test(
          voice.name
        )
      );
      if (preferredVoice) utterance.voice = preferredVoice;

      setVoiceActive(true);
      setKaraokeWordIndex(-1);

      utterance.onboundary = (event) => {
        if (event.name !== "word") return;
        const spoken = translatedGuidance.slice(0, event.charIndex).trim();
        const currentIndex = spoken ? spoken.split(/\s+/).length - 1 : 0;
        setKaraokeWordIndex(Math.min(currentIndex, words.length - 1));
      };

      utterance.onend = () => {
        setVoiceActive(false);
        setKaraokeWordIndex(-1);
        if (guidanceStoppedRef.current) return;
        guidanceTimeoutRef.current = window.setTimeout(() => {
          speakGuidance();
        }, 2000);
      };

      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event);
        setVoiceActive(false);
        setKaraokeWordIndex(-1);
        if (guidanceStoppedRef.current) return;
        guidanceTimeoutRef.current = window.setTimeout(() => {
          speakGuidance();
        }, 2000);
      };

      window.speechSynthesis.speak(utterance);
    };

    guidanceTimeoutRef.current = window.setTimeout(() => {
      speakGuidance();
    }, 700);

    return () => {
      guidanceStoppedRef.current = true;
      if (guidanceTimeoutRef.current !== null) {
        window.clearTimeout(guidanceTimeoutRef.current);
        guidanceTimeoutRef.current = null;
      }
      window.speechSynthesis.cancel();
      setVoiceActive(false);
      setKaraokeWordIndex(-1);
    };
  }, [ready, user]);

  // Helper: format date
  const formatSessionDate = (createdAt: any): string => {
    if (!createdAt) return "Date unknown";
    try {
      let date: Date;
      if (createdAt.toDate && typeof createdAt.toDate === "function") {
        date = createdAt.toDate();
      } else if (typeof createdAt === "string") {
        date = new Date(createdAt);
      } else if (typeof createdAt === "number") {
        date = new Date(createdAt);
      } else {
        return "Invalid Date";
      }
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleDateString("en-GB");
    } catch {
      return "Invalid Date";
    }
  };

  if (!ready) {
    return <LoadingSpinner message="Loading your learning dashboard..." />;
  }

  // ===== LOGGED OUT =====
  if (!user) {
    return (
      <section className="card-cta">
        <div className="flex flex-col gap-6 max-w-lg">
          <h2 className="text-3xl font-bold text-green-800">
            📚 {safeT("hero_title", "Business Development Services BootCamp")}
          </h2>
          <p className="text-lg text-gray-700">
            {safeT(
              "hero_description",
              "Learn BDS skills 24/7 in your language — by listening."
            )}
          </p>

          <Button
            asChild
            className="bg-green-600 hover:bg-green-700 text-white max-sm:w-full"
          >
            <Link href="/sign-in">{safeT("sign_in")}</Link>
          </Button>
        </div>

        <Image
          src="/farmer-hero.jpg"
          alt="BDS Bootcamp"
          width={400}
          height={400}
          className="max-sm:hidden rounded-lg shadow-lg object-cover"
        />
      </section>
    );
  }

  const hasPastSessions = farmerSessions.length > 0;

  // ===== LOGGED IN =====
  return (
    <>
      {/* Offline banner */}
      {!isOnline && (
        <div className="mb-4 bg-yellow-50 border-2 border-yellow-300 rounded-xl p-3 flex items-center gap-2">
          <WifiOff className="w-5 h-5 text-yellow-600" />
          <p className="text-sm text-yellow-800">
            {safeT("offline_mode") || "You're offline. Using cached translations."}
          </p>
        </div>
      )}

      {/* Hero */}
      <section className="card-cta bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="flex flex-col gap-6 max-w-lg">
          <h2 className="text-3xl font-bold text-green-800">
            📚 {safeT("ask_anything_title", "Business Development Services BootCamp")}
          </h2>
          <p className="text-lg text-gray-700">
            {safeT(
              "ask_anything_description",
              "Learn BDS skills 24/7 in your language."
            )}
          </p>

          {/* 3 buttons */}
          <div className="flex flex-col sm:flex-row gap-3 max-sm:w-full">
            <Button
              asChild
              className="bg-amber-500 hover:bg-amber-600 text-white flex-1"
            >
              <Link href="/questionnaire" onClick={stopStartSessionGuidance}>
                📋 {safeT("enterprise_profile", "Enterprise Profile")}
              </Link>
            </Button>

            <Button
              asChild
              className="bg-green-600 hover:bg-green-700 text-white flex-1"
            >
              <Link href="/generate" onClick={stopStartSessionGuidance}>
                🎓 {safeT("start_session", "Start Session")}
              </Link>
            </Button>

            <Button
              asChild
              className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
            >
              <Link href="/funders" onClick={stopStartSessionGuidance}>
                🏦 {safeT("find_funding", "Find Funding")}
              </Link>
            </Button>
          </div>
        </div>

        <Image
          src="/farmer-smartphone.jpg"
          alt="BDS learning"
          width={400}
          height={400}
          className="max-sm:hidden rounded-lg shadow-lg object-cover"
          loading="eager"
        />
      </section>

      {/* My Learning Sessions */}
      <section className="flex flex-col gap-6 mt-8">
        <h2 className="text-2xl font-semibold">
          📋 {safeT("learning_sessions", "My Learning Sessions")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hasPastSessions ? (
            farmerSessions.map((session) => {
              const topicLabel = session.topicLabel || "Lesson";
              const moduleName = session.module || "";
              const locationParts = [
                session.county,
                session.subCounty,
                session.village,
                session.country,
              ].filter(Boolean);

              return (
                <div
                  key={session.id}
                  className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
                >
                  {/* Card header */}
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-3xl flex-shrink-0">📚</span>
                    <div className="flex-1 min-w-0">
                      {/* ✅ CHANGED: wrap topicLabel in safeT() */}
                      <h3 className="font-semibold text-gray-800 line-clamp-2">
                        {safeT(topicLabel)}
                      </h3>
                      {moduleName && (
                        // ✅ CHANGED: wrap moduleName in safeT()
                        <p className="text-xs text-emerald-600 mt-1 font-medium">
                          {safeT(moduleName)}
                        </p>
                      )}
                      {locationParts.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          📍 {locationParts.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Session metadata */}
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3 pt-3 border-t border-gray-100">
                    <div>
                      <span className="text-gray-500">
                        {safeT("topic", "Topic")}:
                      </span>
                      <span className="ml-1 font-medium truncate">
                        {session.topic || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">
                        {safeT("sections", "Sections")}:
                      </span>
                      <span className="ml-1 font-medium">
                        {session.lessonSections?.length ||
                          session.structuredList?.length ||
                          0}
                      </span>
                    </div>
                  </div>

                  {/* Recent queries (only latest) */}
                  {session.id === farmerSessions[0]?.id &&
                    recentQueries.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">
                          {safeT("recent_questions", "Recent Questions")}:
                        </p>
                        {recentQueries.slice(0, 2).map((q, i) => (
                          <p
                            key={i}
                            className="text-xs text-gray-700 truncate"
                          >
                            "{q.question?.substring(0, 30)}..."
                          </p>
                        ))}
                      </div>
                    )}

                  {/* Actions */}
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                      {formatSessionDate(
                        session.createdAt || session.metadata?.createdAt
                      )}
                    </span>
                    <Link
                      href={`/interview/${session.id}`}
                      className="text-sm bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full hover:bg-emerald-200 transition-colors font-medium"
                    >
                      {safeT("resume_lesson", "Resume Lesson")} →
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-3 text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">
                {safeT("no_sessions", "No lessons yet.")}
              </p>
              <Link
                href="/generate"
                className="text-green-600 hover:text-green-700 mt-2 inline-block"
                onClick={stopStartSessionGuidance}
              >
                🎓 {safeT("start_first_session", "Start your first lesson")}
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Knowledge Base Stats */}
      <section className="flex flex-col gap-6 mt-8 bg-blue-50 p-6 rounded-xl">
        <h2 className="text-2xl font-semibold">
          📚 {safeT("knowledge_base", "Knowledge Base")}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-green-600">9</div>
            <div className="text-sm text-gray-600">
              {safeT("bds_topics", "BDS Topics")}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-green-600">6</div>
            <div className="text-sm text-gray-600">
              {safeT("modules", "Modules")}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-green-600">24/7</div>
            <div className="text-sm text-gray-600">
              {safeT("voice_access", "Voice Access")}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-green-600">
              {safeT("free", "Free")}
            </div>
            <div className="text-sm text-gray-600">
              {safeT("for_learners", "For Learners")}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="flex flex-col gap-6 mt-8">
        <h2 className="text-2xl font-semibold text-blue-900">
          🎯 {safeT("how_it_works", "How It Works")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-lg border border-gray-200">
            <div className="text-3xl mb-2">1️⃣</div>
            <h3 className="font-semibold text-blue-800 mb-1">
              {safeT("step1_title", "Choose your topic")}
            </h3>
            <p className="text-sm text-blue-700">
              {safeT("step1_desc", "Pick a BDS topic from the dropdown.")}
            </p>
          </div>
          <div className="bg-white p-5 rounded-lg border border-gray-200">
            <div className="text-3xl mb-2">2️⃣</div>
            <h3 className="font-semibold text-blue-800 mb-1">
              {safeT("step2_title", "Learn by listening")}
            </h3>
            <p className="text-sm text-blue-700">
              {safeT(
                "step2_desc",
                "Each lesson is read aloud in streaming karaoke style."
              )}
            </p>
          </div>
          <div className="bg-white p-5 rounded-lg border border-gray-200">
            <div className="text-3xl mb-2">3️⃣</div>
            <h3 className="font-semibold text-blue-800 mb-1">
              {safeT("step3_title", "Ask questions anytime")}
            </h3>
            <p className="text-sm text-blue-700">
              {safeT(
                "step3_desc",
                "Use voice or text to ask your BDS tutor anything."
              )}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
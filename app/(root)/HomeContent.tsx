'use client';

import { useOfflineTranslation } from '@/lib/hooks/useOfflineTranslation';
import { useEffect, useRef, useState } from 'react';
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
  recentQueries
}: HomeContentProps) {
  const { t, ready, isOnline } =
    useOfflineTranslation();

  const [karaokeWordIndex, setKaraokeWordIndex] =
    useState(-1);

  const [voiceActive, setVoiceActive] =
    useState(false);

  const guidanceTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const guidanceStoppedRef =
    useRef(false);

  const guidanceMessage =
    'Press the Start Session button to start your business development services bootcamp.';

  // Stop the Start Session voice guidance immediately.
  const stopStartSessionGuidance = () => {
    guidanceStoppedRef.current = true;

    if (
      guidanceTimeoutRef.current !== null
    ) {
      window.clearTimeout(
        guidanceTimeoutRef.current
      );

      guidanceTimeoutRef.current = null;
    }

    if (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window
    ) {
      window.speechSynthesis.cancel();
    }

    setVoiceActive(false);

    setKaraokeWordIndex(-1);
  };

  // Safe translation helper
  const safeT = (
    key: string,
    params?: any
  ): string => {
    try {
      const result = t(
        key,
        params
      );

      // Handle if result is a Promise
      if (
        result &&
        typeof result.then ===
          'function'
      ) {
        console.warn(
          `Translation for "${key}" returned a Promise`
        );

        return key;
      }

      return typeof result ===
        'string'
        ? result
        : String(result || '');
    } catch (e) {
      console.error(
        'Translation error for key:',
        key,
        e
      );

      return key;
    }
  };

  /*
   * ============================================================
   * START SESSION VOICE GUIDANCE
   * ============================================================
   *
   * Translation key:
   *
   * start_session_guidance
   *
   * The message is voice-only.
   *
   * Behavior:
   *
   * 1. Speak the complete sentence.
   * 2. Wait 2 seconds after speech finishes.
   * 3. Speak the complete sentence again.
   * 4. Continue until Start Session is pressed.
   */

  useEffect(() => {
    if (
      !ready ||
      !user ||
      typeof window ===
        'undefined' ||
      !(
        'speechSynthesis' in
        window
      )
    ) {
      return;
    }

    guidanceStoppedRef.current =
      false;

    /*
     * Always obtain the message from the
     * existing translation key.
     */
    const translatedGuidance =
      safeT(
        'start_session_guidance'
      );

    if (
      !translatedGuidance ||
      translatedGuidance ===
        'start_session_guidance'
    ) {
      console.warn(
        'Missing translation value for start_session_guidance'
      );

      return;
    }

    const words =
      translatedGuidance
        .trim()
        .split(/\s+/);

    const speakGuidance =
      () => {
        /*
         * Don't start another sentence after
         * the farmer has pressed Start Session.
         */
        if (
          guidanceStoppedRef.current
        ) {
          return;
        }

        /*
         * Cancel any speech that might still
         * be running before beginning a new
         * complete sentence.
         */
        window.speechSynthesis.cancel();

        const utterance =
          new SpeechSynthesisUtterance(
            translatedGuidance
          );

        utterance.lang =
          'en-US';

        utterance.rate =
          0.9;

        utterance.pitch =
          1.05;

        utterance.volume =
          1;

        /*
         * Try to use a natural English voice.
         */
        const voices =
          window.speechSynthesis.getVoices();

        const preferredVoice =
          voices.find(
            (voice) =>
              /Microsoft Jenny|Microsoft Aria|Google UK English Female|Google US English Female|Samantha|Microsoft Zira/i.test(
                voice.name
              )
          );

        if (
          preferredVoice
        ) {
          utterance.voice =
            preferredVoice;
        }

        setVoiceActive(
          true
        );

        setKaraokeWordIndex(
          -1
        );

        /*
         * Keep word tracking internally.
         *
         * The karaoke words are NOT displayed.
         */
        utterance.onboundary =
          (
            event
          ) => {
            if (
              event.name !==
              'word'
            ) {
              return;
            }

            const spoken =
              translatedGuidance
                .slice(
                  0,
                  event.charIndex
                )
                .trim();

            const currentIndex =
              spoken
                ? spoken
                    .split(
                      /\s+/
                    )
                    .length -
                  1
                : 0;

            setKaraokeWordIndex(
              Math.min(
                currentIndex,
                words.length -
                  1
              )
            );
          };

        /*
         * The COMPLETE sentence has finished.
         */
        utterance.onend =
          () => {
            setVoiceActive(
              false
            );

            setKaraokeWordIndex(
              -1
            );

            /*
             * If the farmer has clicked
             * Start Session, do not repeat.
             */
            if (
              guidanceStoppedRef.current
            ) {
              return;
            }

            /*
             * IMPORTANT:
             *
             * Wait 2 seconds AFTER the complete
             * sentence has finished speaking.
             *
             * Then speak the COMPLETE sentence again.
             */
            guidanceTimeoutRef.current =
              window.setTimeout(
                () => {
                  speakGuidance();
                },
                2000
              );
          };

        /*
         * If speech fails, wait 2 seconds and
         * retry the complete sentence.
         */
        utterance.onerror =
          (
            event
          ) => {
            console.error(
              'Speech synthesis error:',
              event
            );

            setVoiceActive(
              false
            );

            setKaraokeWordIndex(
              -1
            );

            if (
              guidanceStoppedRef.current
            ) {
              return;
            }

            guidanceTimeoutRef.current =
              window.setTimeout(
                () => {
                  speakGuidance();
                },
                2000
              );
          };

        /*
         * Start the complete sentence.
         */
        window.speechSynthesis.speak(
          utterance
        );
      };

    /*
     * First announcement after the page
     * has rendered.
     */
    guidanceTimeoutRef.current =
      window.setTimeout(
        () => {
          speakGuidance();
        },
        700
      );

    /*
     * Cleanup when the farmer leaves
     * the page/component.
     */
    return () => {
      guidanceStoppedRef.current =
        true;

      if (
        guidanceTimeoutRef.current !==
        null
      ) {
        window.clearTimeout(
          guidanceTimeoutRef.current
        );

        guidanceTimeoutRef.current =
          null;
      }

      window.speechSynthesis.cancel();

      setVoiceActive(
        false
      );

      setKaraokeWordIndex(
        -1
      );
    };
  }, [
    ready,
    user
  ]);

  // Helper function to format date from string or Firestore Timestamp
  const formatSessionDate = (
    createdAt: any
  ): string => {
    if (!createdAt)
      return 'Date unknown';

    try {
      let date: Date;

      // Check if it's a Firestore Timestamp (has toDate method)
      if (
        createdAt.toDate &&
        typeof createdAt.toDate ===
          'function'
      ) {
        date =
          createdAt.toDate();
      }

      // Check if it's a string
      else if (
        typeof createdAt ===
        'string'
      ) {
        date =
          new Date(
            createdAt
          );
      }

      // Check if it's a number (timestamp)
      else if (
        typeof createdAt ===
        'number'
      ) {
        date =
          new Date(
            createdAt
          );
      }

      else {
        return 'Invalid Date';
      }

      // Check if date is valid
      if (
        isNaN(
          date.getTime()
        )
      ) {
        return 'Invalid Date';
      }

      // Format as DD/MM/YYYY
      return date.toLocaleDateString(
        'en-GB'
      );
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Show loading while translations are loading
  if (!ready) {
    return (
      <LoadingSpinner
        message="Loading your farm dashboard..."
      />
    );
  }

  if (!user) {
    return (
      <section className="card-cta">
        <div className="flex flex-col gap-6 max-w-lg">

          <h2 className="text-3xl font-bold text-green-800">
            🌾{" "}
            {safeT(
              'hero_title'
            )}
          </h2>

          <p className="text-lg text-gray-700">
            {safeT(
              'hero_description'
            )}
          </p>

          <Button
            asChild
            className="bg-green-600 hover:bg-green-700 text-white max-sm:w-full"
          >
            <Link href="/sign-in">
              {safeT(
                'sign_in'
              )}
            </Link>
          </Button>

        </div>

        <Image
          src="/farmer-hero.jpg"
          alt={safeT(
            'hero_image_alt'
          )}
          width={400}
          height={400}
          className="max-sm:hidden rounded-lg shadow-lg object-cover"
        />
      </section>
    );
  }

  const hasPastSessions =
    farmerSessions.length >
    0;

  return (
    <>
      {/* Start Session guidance is voice-only. */}

      {/* Offline Status Banner */}
      {!isOnline && (
        <div className="mb-4 bg-yellow-50 border-2 border-yellow-300 rounded-xl p-3 flex items-center gap-2">

          <WifiOff className="w-5 h-5 text-yellow-600" />

          <p className="text-sm text-yellow-800">
            {safeT(
              'offline_mode'
            ) ||
              "You're offline. Using cached translations."}
          </p>

        </div>
      )}

      {/* Hero Section */}
      <section className="card-cta bg-gradient-to-r from-green-50 to-emerald-50">

        <div className="flex flex-col gap-6 max-w-lg">

          <h2 className="text-3xl font-bold text-green-800">
            🌾{" "}
            {safeT(
              'ask_anything_title'
            )}
          </h2>

          <p className="text-lg text-gray-700">
            {safeT(
              'ask_anything_description'
            )}
          </p>

          <Button
            asChild
            className="bg-green-600 hover:bg-green-700 text-white max-sm:w-full"
          >
            <Link
              href="/generate"
              onClick={
                stopStartSessionGuidance
              }
            >
              🌱{" "}
              {safeT(
                'start_session'
              )}
            </Link>
          </Button>

        </div>

        <Image
          src="/farmer-smartphone.jpg"
          alt={safeT(
            'farmer_phone_alt'
          )}
          width={400}
          height={400}
          className="max-sm:hidden rounded-lg shadow-lg object-cover"
          loading="eager"
        />

      </section>

      {/* Past Sessions Section */}
      <section className="flex flex-col gap-6 mt-8">

        <h2 className="text-2xl font-semibold">
          📋{" "}
          {safeT(
            'farm_sessions'
          )}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {hasPastSessions ? (
            farmerSessions.map(
              (
                session
              ) => (
                <div
                  key={
                    session.id
                  }
                  className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
                >

                  <div className="flex items-center gap-2 mb-3">

                    <span className="text-2xl">
                      🌾
                    </span>

                    <div>

                      <h3 className="font-semibold text-gray-800 capitalize">
                        {session.feedName ||
                          session.crops?.join(
                            ", "
                          ) ||
                          safeT(
                            'mixed_crops'
                          )}
                      </h3>

                      <p className="text-xs text-gray-500">
                        {
                          session.county
                        }

                        {session.subCounty
                          ? `, ${session.subCounty}`
                          : ""}
                      </p>

                    </div>

                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">

                    <div>

                      <span className="text-gray-500">
                        {safeT(
                          'farm_size'
                        )}
                        :
                      </span>

                      <span className="ml-1 font-medium">
                        {session.totalFarmSize ||
                          session.cultivatedAcres ||
                          session.acres ||
                          "?"}{" "}
                        {safeT(
                          'acres'
                        )}
                      </span>

                    </div>

                    <div>

                      <span className="text-gray-500">
                        {safeT(
                          'cattle'
                        )}
                        :
                      </span>

                      <span className="ml-1 font-medium">
                        {session.cattle ||
                          0}
                      </span>

                    </div>

                  </div>

                  {/* Display warnings if they exist */}
                  {session.metadata?.warnings && (
                    <div className="mt-2 mb-2 space-y-1">

                      {session.metadata.warnings.yield?.map(
                        (
                          warning: string,
                          i: number
                        ) => (
                          <p
                            key={`yield-${i}`}
                            className="text-xs text-amber-600 flex items-start gap-1"
                          >
                            <span>
                              ⚠️
                            </span>

                            <span>
                              {
                                warning
                              }
                            </span>

                          </p>
                        )
                      )}

                      {session.metadata.warnings.price?.map(
                        (
                          warning: string,
                          i: number
                        ) => (
                          <p
                            key={`price-${i}`}
                            className="text-xs text-amber-600 flex items-start gap-1"
                          >
                            <span>
                              ⚠️
                            </span>

                            <span>
                              {
                                warning
                              }
                            </span>

                          </p>
                        )
                      )}

                      {session.metadata.warnings.spacing?.map(
                        (
                          warning: string,
                          i: number
                        ) => (
                          <p
                            key={`spacing-${i}`}
                            className="text-xs text-amber-600 flex items-start gap-1"
                          >
                            <span>
                              ⚠️
                            </span>

                            <span>
                              {
                                warning
                              }
                            </span>

                          </p>
                        )
                      )}

                    </div>
                  )}

                  {session.id ===
                    farmerSessions[0]
                      ?.id &&
                    recentQueries.length >
                      0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">

                        <p className="text-xs text-gray-500 mb-2">
                          {safeT(
                            'recent_questions'
                          )}
                          :
                        </p>

                        {recentQueries.map(
                          (
                            q,
                            i
                          ) => (
                            <p
                              key={i}
                              className="text-sm text-gray-700 truncate"
                            >
                              "
                              {q.question.substring(
                                0,
                                30
                              )}
                              ..."
                            </p>
                          )
                        )}

                      </div>
                    )}

                  <div className="mt-4 flex justify-between items-center">

                    <span className="text-xs text-gray-400">
                      {formatSessionDate(
                        session.createdAt
                      )}
                    </span>

                    <Link
                      href={`/interview/${session.id}`}
                      className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200 transition-colors"
                    >
                      {safeT(
                        'ask_more'
                      )}{" "}
                      →
                    </Link>

                  </div>

                </div>
              )
            )
          ) : (
            <div className="col-span-3 text-center py-8 bg-gray-50 rounded-lg">

              <p className="text-gray-500">
                {safeT(
                  'no_sessions'
                )}
              </p>

              <Link
                href="/generate"
                onClick={
                  stopStartSessionGuidance
                }
                className="text-green-600 hover:text-green-700 mt-2 inline-block"
              >
                🌾{" "}
                {safeT(
                  'start_first_session'
                )}
              </Link>

            </div>
          )}

        </div>

      </section>

      {/* Knowledge Base Stats */}
      <section className="flex flex-col gap-6 mt-8 bg-blue-50 p-6 rounded-xl">

        <h2 className="text-2xl font-semibold">
          📚{" "}
          {safeT(
            'knowledge_base'
          )}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          <div className="bg-white p-4 rounded-lg text-center">

            <div className="text-3xl font-bold text-green-600">
              50+
            </div>

            <div className="text-sm text-gray-600">
              {safeT(
                'crop_guides'
              )}
            </div>

          </div>

          <div className="bg-white p-4 rounded-lg text-center">

            <div className="text-3xl font-bold text-green-600">
              100+
            </div>

            <div className="text-sm text-gray-600">
              {safeT(
                'disease_images'
              )}
            </div>

          </div>

          <div className="bg-white p-4 rounded-lg text-center">

            <div className="text-3xl font-bold text-green-600">
              24/7
            </div>

            <div className="text-sm text-gray-600">
              {safeT(
                'voice_access'
              )}
            </div>

          </div>

          <div className="bg-white p-4 rounded-lg text-center">

            <div className="text-3xl font-bold text-green-600">
              {safeT(
                'free'
              )}
            </div>

            <div className="text-sm text-gray-600">
              {safeT(
                'for_farmers'
              )}
            </div>

          </div>

        </div>

      </section>

      {/* How It Works – Text color fixed to dark blue */}
      <section className="flex flex-col gap-6 mt-8">

        <h2 className="text-2xl font-semibold text-blue-900">
          🎯{" "}
          {safeT(
            'how_it_works'
          )}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="bg-white p-5 rounded-lg border border-gray-200">

            <div className="text-3xl mb-2">
              1️⃣
            </div>

            <h3 className="font-semibold text-blue-800 mb-1">
              {safeT(
                'step1_title'
              )}
            </h3>

            <p className="text-sm text-blue-700">
              {safeT(
                'step1_desc'
              )}
            </p>

          </div>

          <div className="bg-white p-5 rounded-lg border border-gray-200">

            <div className="text-3xl mb-2">
              2️⃣
            </div>

            <h3 className="font-semibold text-blue-800 mb-1">
              {safeT(
                'step2_title'
              )}
            </h3>

            <p className="text-sm text-blue-700">
              {safeT(
                'step2_desc'
              )}
            </p>

          </div>

          <div className="bg-white p-5 rounded-lg border border-gray-200">

            <div className="text-3xl mb-2">
              3️⃣
            </div>

            <h3 className="font-semibold text-blue-800 mb-1">
              {safeT(
                'step3_title'
              )}
            </h3>

            <p className="text-sm text-blue-700">
              {safeT(
                'step3_desc'
              )}
            </p>

          </div>

        </div>

      </section>
    </>
  );
}
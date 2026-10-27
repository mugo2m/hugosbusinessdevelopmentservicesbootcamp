"use client";

import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { auth } from "@/firebase/client";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

import {
  signIn,
  signUp,
  createPhoneAccount,
  signInWithPhone,
} from "@/lib/actions/auth.action";

import FormField from "./FormField";
import { useOfflineTranslation } from "@/lib/hooks/useOfflineTranslation";

// Country codes for African countries
const countryCodes = [
  {
    code: "+254",
    country: "Kenya",
    flag: "🇰🇪",
  },
  {
    code: "+255",
    country: "Tanzania",
    flag: "🇹🇿",
  },
  {
    code: "+256",
    country: "Uganda",
    flag: "🇺🇬",
  },
  {
    code: "+260",
    country: "Zambia",
    flag: "🇿🇲",
  },
  {
    code: "+27",
    country: "South Africa",
    flag: "🇿🇦",
  },
  {
    code: "+234",
    country: "Nigeria",
    flag: "🇳🇬",
  },
  {
    code: "+233",
    country: "Ghana",
    flag: "🇬🇭",
  },
  {
    code: "+1",
    country: "USA/Canada",
    flag: "🇺🇸",
  },
  {
    code: "+44",
    country: "UK",
    flag: "🇬🇧",
  },
];

// Email schema
const emailSignUpSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(3),
});

const emailSignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(3),
});

// Phone PIN schema
const phoneSignUpSchema = z.object({
  name: z.string().min(3),
  countryCode: z.string(),
  phoneNumber: z
    .string()
    .regex(
      /^\d{6,15}$/,
      "Please enter a valid phone number"
    ),
  pin: z
    .string()
    .regex(
      /^\d{4}$/,
      "PIN must be exactly 4 digits"
    ),
});

const phoneSignInSchema = z.object({
  countryCode: z.string(),
  phoneNumber: z
    .string()
    .regex(
      /^\d{6,15}$/,
      "Please enter a valid phone number"
    ),
  pin: z
    .string()
    .regex(
      /^\d{4}$/,
      "PIN must be exactly 4 digits"
    ),
});

const AuthForm = ({
  type,
}: {
  type: FormType;
}) => {
  const router = useRouter();

  const {
    t,
    ready,
  } = useOfflineTranslation();

  const [
    authMethod,
    setAuthMethod,
  ] = useState<
    "email" | "phone"
  >("email");

  /*
   * These states are retained from the
   * original component.
   *
   * They are kept empty for voice-only
   * messages so that no visible karaoke
   * message is displayed.
   */
  const [
    karaokeText,
    setKaraokeText,
  ] = useState("");

  const [
    karaokeWordIndex,
    setKaraokeWordIndex,
  ] = useState(-1);

  const [
    karaokeActive,
    setKaraokeActive,
  ] = useState(false);

  /*
   * ============================================================
   * SIGN-IN GUIDANCE REFS
   * ============================================================
   */

  const signInGuidanceTimerRef =
    useRef<
      ReturnType<typeof setTimeout> | null
    >(null);

  const signInGuidanceStoppedRef =
    useRef(false);

  const signInGuidanceSpeakingRef =
    useRef(false);

  /*
   * ============================================================
   * SAFE TRANSLATION HELPER
   * ============================================================
   */
  const safeT = (
    key: string,
    fallback?: string
  ): string => {
    try {
      const result =
        t(key);

      /*
       * Handle if result is a Promise.
       */
      if (
        result &&
        typeof (result as any).then ===
          "function"
      ) {
        return (
          fallback ??
          key
        );
      }

      /*
       * Never treat the translation key
       * itself as a valid translation.
       */
      if (
        typeof result ===
          "string" &&
        result !== key
      ) {
        return result;
      }

      return (
        fallback ??
        key
      );
    } catch {
      return (
        fallback ??
        key
      );
    }
  };

  /*
   * ============================================================
   * WAIT FOR BROWSER VOICES
   * ============================================================
   */
  const waitForVoices =
    async (
      maxAttempts = 10
    ): Promise<
      SpeechSynthesisVoice[]
    > => {
      if (
        typeof window ===
          "undefined" ||
        !(
          "speechSynthesis" in
          window
        )
      ) {
        return [];
      }

      for (
        let attempt = 0;
        attempt < maxAttempts;
        attempt++
      ) {
        const voices =
          window.speechSynthesis.getVoices();

        if (
          voices.length > 0
        ) {
          return voices;
        }

        await new Promise<void>(
          (resolve) =>
            setTimeout(
              resolve,
              300
            )
        );
      }

      return window.speechSynthesis.getVoices();
    };

  /*
   * ============================================================
   * SELECT BEST ENGLISH VOICE
   * ============================================================
   */
  const getPreferredEnglishVoice =
    (
      voices: SpeechSynthesisVoice[]
    ): SpeechSynthesisVoice | null => {
      return (
        voices.find(
          (voice) =>
            /Microsoft Jenny|Microsoft Aria|Google UK English Female|Google US English Female|Samantha|Microsoft Zira/i.test(
              voice.name
            )
        ) ??
        voices.find(
          (voice) =>
            /^en-/i.test(
              voice.lang
            )
        ) ??
        voices.find(
          (voice) =>
            /^en/i.test(
              voice.lang
            )
        ) ??
        null
      );
    };

  /*
   * ============================================================
   * SIGN-IN SUCCESS VOICE
   * ============================================================
   *
   * Translation key:
   *
   * sign_in_success_message
   *
   * Voice only.
   * No toast.
   * No visible karaoke text.
   */
  const speakSignInSuccess =
    async (): Promise<void> => {
      const message =
        safeT(
          "sign_in_success_message"
        );

      /*
       * Never speak the translation key.
       */
      if (
        !message ||
        message ===
          "sign_in_success_message"
      ) {
        console.warn(
          "Translation not ready for sign_in_success_message"
        );

        return;
      }

      if (
        typeof window ===
          "undefined" ||
        !(
          "speechSynthesis" in
          window
        )
      ) {
        return;
      }

      /*
       * Cancel any speech already playing.
       */
      window.speechSynthesis.cancel();

      await new Promise<void>(
        (resolve) =>
          setTimeout(
            resolve,
            100
          )
      );

      const voices =
        await waitForVoices();

      if (
        typeof window ===
          "undefined" ||
        !(
          "speechSynthesis" in
          window
        )
      ) {
        return;
      }

      const utterance =
        new SpeechSynthesisUtterance(
          message
        );

      utterance.lang =
        "en-US";

      /*
       * Slower rate makes the complete
       * message easier to hear.
       */
      utterance.rate =
        0.85;

      utterance.pitch =
        1.05;

      utterance.volume =
        1;

      const preferredVoice =
        getPreferredEnglishVoice(
          voices
        );

      if (
        preferredVoice
      ) {
        utterance.voice =
          preferredVoice;
      }

      /*
       * Make sure no visible karaoke
       * message is shown.
       */
      setKaraokeText("");
      setKaraokeWordIndex(-1);
      setKaraokeActive(false);

      await new Promise<void>(
        (resolve) => {
          let finished =
            false;

          const finish =
            () => {
              if (
                finished
              ) {
                return;
              }

              finished =
                true;

              setKaraokeText("");
              setKaraokeWordIndex(-1);
              setKaraokeActive(false);

              resolve();
            };

          utterance.onend =
            () => {
              finish();
            };

          utterance.onerror =
            (error) => {
              console.error(
                "Sign-in success speech error:",
                error
              );

              finish();
            };

          window.speechSynthesis.speak(
            utterance
          );
        }
      );
    };

  /*
   * ============================================================
   * SIGN-IN PAGE GUIDANCE VOICE
   * ============================================================
   *
   * Translation key:
   *
   * sign_in_guidance
   *
   * The message repeats:
   *
   * 1. Speak complete sentence.
   * 2. Wait 2 seconds.
   * 3. Speak again.
   *
   * It stops immediately when the farmer
   * enters information.
   */
  const speakSignInGuidance =
    async (): Promise<void> => {
      if (
        signInGuidanceStoppedRef.current
      ) {
        return;
      }

      const message =
        safeT(
          "sign_in_guidance"
        );

      /*
       * Never speak the translation key.
       */
      if (
        !message ||
        message ===
          "sign_in_guidance"
      ) {
        console.warn(
          "Translation not ready for sign_in_guidance"
        );

        return;
      }

      if (
        typeof window ===
          "undefined" ||
        !(
          "speechSynthesis" in
          window
        )
      ) {
        return;
      }

      /*
       * Prevent overlapping speech.
       */
      if (
        signInGuidanceSpeakingRef.current
      ) {
        return;
      }

      signInGuidanceSpeakingRef.current =
        true;

      /*
       * Stop any previous speech.
       */
      window.speechSynthesis.cancel();

      await new Promise<void>(
        (resolve) =>
          setTimeout(
            resolve,
            100
          )
      );

      if (
        signInGuidanceStoppedRef.current
      ) {
        signInGuidanceSpeakingRef.current =
          false;

        return;
      }

      const voices =
        await waitForVoices();

      if (
        signInGuidanceStoppedRef.current
      ) {
        signInGuidanceSpeakingRef.current =
          false;

        return;
      }

      const utterance =
        new SpeechSynthesisUtterance(
          message
        );

      utterance.lang =
        "en-US";

      utterance.rate =
        0.9;

      utterance.pitch =
        1.05;

      utterance.volume =
        1;

      const preferredVoice =
        getPreferredEnglishVoice(
          voices
        );

      if (
        preferredVoice
      ) {
        utterance.voice =
          preferredVoice;
      }

      /*
       * Voice only.
       */
      setKaraokeText("");
      setKaraokeWordIndex(-1);
      setKaraokeActive(false);

      await new Promise<void>(
        (resolve) => {
          let finished =
            false;

          const completeSpeech =
            () => {
              if (
                finished
              ) {
                return;
              }

              finished =
                true;

              signInGuidanceSpeakingRef.current =
                false;

              /*
               * Do not schedule another
               * repetition after the farmer
               * has begun entering information.
               */
              if (
                signInGuidanceStoppedRef.current
              ) {
                resolve();

                return;
              }

              /*
               * Wait TWO seconds after
               * the complete sentence.
               */
              signInGuidanceTimerRef.current =
                setTimeout(
                  () => {
                    if (
                      signInGuidanceStoppedRef.current
                    ) {
                      resolve();

                      return;
                    }

                    void speakSignInGuidance();

                    resolve();
                  },
                  2000
                );
            };

          utterance.onend =
            () => {
              completeSpeech();
            };

          utterance.onerror =
            (error) => {
              console.error(
                "Sign-in guidance speech error:",
                error
              );

              completeSpeech();
            };

          window.speechSynthesis.speak(
            utterance
          );
        }
      );
    };

  /*
   * ============================================================
   * STOP SIGN-IN GUIDANCE
   * ============================================================
   */
  const stopSignInGuidance =
    () => {
      /*
       * Prevent all future repetitions.
       */
      signInGuidanceStoppedRef.current =
        true;

      /*
       * Prevent a new utterance from
       * being started.
       */
      signInGuidanceSpeakingRef.current =
        false;

      /*
       * Cancel scheduled repetition.
       */
      if (
        signInGuidanceTimerRef.current
      ) {
        clearTimeout(
          signInGuidanceTimerRef.current
        );

        signInGuidanceTimerRef.current =
          null;
      }

      /*
       * Stop current voice immediately.
       */
      if (
        typeof window !==
          "undefined" &&
        "speechSynthesis" in
          window
      ) {
        window.speechSynthesis.cancel();
      }

      setKaraokeText("");
      setKaraokeWordIndex(-1);
      setKaraokeActive(false);
    };

  /*
   * ============================================================
   * EMAIL FORM
   * ============================================================
   */
  const emailForm =
    useForm<
      z.infer<
        typeof emailSignUpSchema |
        typeof emailSignInSchema
      >
    >({
      resolver:
        zodResolver(
          type ===
            "sign-up"
            ? emailSignUpSchema
            : emailSignInSchema
        ),

      defaultValues: {
        name: "",
        email: "",
        password: "",
      },
    });

  /*
   * ============================================================
   * PHONE FORM
   * ============================================================
   */
  const phoneForm =
    useForm<
      z.infer<
        typeof phoneSignUpSchema |
        typeof phoneSignInSchema
      >
    >({
      resolver:
        zodResolver(
          type ===
            "sign-up"
            ? phoneSignUpSchema
            : phoneSignInSchema
        ),

      defaultValues: {
        name: "",
        countryCode:
          "+254",
        phoneNumber:
          "",
        pin: "",
      },
    });

  /*
   * ============================================================
   * SIGN-IN GUIDANCE START
   * ============================================================
   *
   * IMPORTANT:
   * This is AFTER emailForm and phoneForm
   * have been initialized.
   */
  useEffect(() => {
    if (
      type !==
        "sign-in" ||
      !ready
    ) {
      return;
    }

    /*
     * Reset guidance state when the
     * sign-in page opens.
     */
    signInGuidanceStoppedRef.current =
      false;

    signInGuidanceSpeakingRef.current =
      false;

    if (
      signInGuidanceTimerRef.current
    ) {
      clearTimeout(
        signInGuidanceTimerRef.current
      );

      signInGuidanceTimerRef.current =
        null;
    }

    /*
     * Verify the translation is available
     * before starting speech.
     */
    const message =
      safeT(
        "sign_in_guidance"
      );

    if (
      !message ||
      message ===
        "sign_in_guidance"
    ) {
      console.warn(
        "Cannot start sign-in guidance because translation is not ready."
      );

      return;
    }

    /*
     * Give the page a short moment to render.
     */
    const initialTimer =
      window.setTimeout(
        () => {
          if (
            !signInGuidanceStoppedRef.current
          ) {
            void speakSignInGuidance();
          }
        },
        700
      );

    return () => {
      window.clearTimeout(
        initialTimer
      );

      if (
        signInGuidanceTimerRef.current
      ) {
        clearTimeout(
          signInGuidanceTimerRef.current
        );

        signInGuidanceTimerRef.current =
          null;
      }

      signInGuidanceStoppedRef.current =
        true;

      signInGuidanceSpeakingRef.current =
        false;

      if (
        typeof window !==
          "undefined" &&
        "speechSynthesis" in
          window
      ) {
        window.speechSynthesis.cancel();
      }
    };
  }, [
    type,
    ready,
  ]);

  /*
   * ============================================================
   * STOP GUIDANCE WHEN EMAIL FORM GETS INPUT
   * ============================================================
   *
   * These effects are deliberately AFTER
   * emailForm and phoneForm initialization.
   */
  useEffect(() => {
    if (
      type !==
      "sign-in"
    ) {
      return;
    }

    const subscription =
      emailForm.watch(
        (values) => {
          const email =
            String(
              values.email ??
                ""
            ).trim();

          const password =
            String(
              values.password ??
                ""
            ).trim();

          if (
            email ||
            password
          ) {
            stopSignInGuidance();
          }
        }
      );

    return () => {
      subscription.unsubscribe();
    };
  }, [
    type,
    emailForm,
  ]);

  /*
   * ============================================================
   * STOP GUIDANCE WHEN PHONE FORM GETS INPUT
   * ============================================================
   */
  useEffect(() => {
    if (
      type !==
      "sign-in"
    ) {
      return;
    }

    const subscription =
      phoneForm.watch(
        (values) => {
          const phoneNumber =
            String(
              values.phoneNumber ??
                ""
            ).trim();

          const pin =
            String(
              values.pin ??
                ""
            ).trim();

          if (
            phoneNumber ||
            pin
          ) {
            stopSignInGuidance();
          }
        }
      );

    return () => {
      subscription.unsubscribe();
    };
  }, [
    type,
    phoneForm,
  ]);

  /*
   * ============================================================
   * PHONE MESSAGE VOICE
   * ============================================================
   *
   * Translation keys:
   *
   * phone_already_registered
   * phone_account_created
   */
  const speakPhoneMessage =
    async (
      key: string,
      fallback: string
    ): Promise<void> => {
      const message =
        safeT(
          key,
          fallback
        );

      /*
       * Never speak a translation key.
       */
      if (
        !message ||
        message ===
          key
      ) {
        console.warn(
          `Translation not ready for ${key}`
        );

        return;
      }

      if (
        typeof window ===
          "undefined" ||
        !(
          "speechSynthesis" in
          window
        )
      ) {
        return;
      }

      window.speechSynthesis.cancel();

      await new Promise<void>(
        (resolve) =>
          setTimeout(
            resolve,
            100
          )
      );

      const voices =
        await waitForVoices();

      const utterance =
        new SpeechSynthesisUtterance(
          message
        );

      utterance.lang =
        "en-US";

      utterance.rate =
        0.9;

      utterance.pitch =
        1.05;

      utterance.volume =
        1;

      const preferredVoice =
        getPreferredEnglishVoice(
          voices
        );

      if (
        preferredVoice
      ) {
        utterance.voice =
          preferredVoice;
      }

      /*
       * Voice only.
       */
      setKaraokeText("");
      setKaraokeWordIndex(-1);
      setKaraokeActive(false);

      await new Promise<void>(
        (resolve) => {
          let finished =
            false;

          const finish =
            () => {
              if (
                finished
              ) {
                return;
              }

              finished =
                true;

              setKaraokeText("");
              setKaraokeWordIndex(-1);
              setKaraokeActive(false);

              resolve();
            };

          utterance.onend =
            () => {
              finish();
            };

          utterance.onerror =
            (error) => {
              console.error(
                "Phone message speech error:",
                error
              );

              finish();
            };

          window.speechSynthesis.speak(
            utterance
          );
        }
      );
    };

  /*
   * ============================================================
   * EMAIL SUBMIT
   * ============================================================
   */
  const onEmailSubmit =
    async (data: any) => {
      try {
        /*
         * Stop repeated guidance as soon
         * as the farmer submits.
         */
        stopSignInGuidance();

        if (
          type ===
          "sign-up"
        ) {
          const {
            name,
            email,
            password,
          } = data;

          const userCredential =
            await createUserWithEmailAndPassword(
              auth,
              email,
              password
            );

          const result =
            await signUp({
              uid:
                userCredential
                  .user
                  .uid,
              name,
              email,
              password,
            });

          if (
            !result.success
          ) {
            toast.error(
              result.message
            );

            return;
          }

          toast.success(
            "Account created successfully. Please sign in."
          );

          router.push(
            "/sign-in"
          );
        } else {
          const {
            email,
            password,
          } = data;

          /*
           * First verify Firebase credentials.
           */
          const userCredential =
            await signInWithEmailAndPassword(
              auth,
              email,
              password
            );

          const idToken =
            await userCredential.user.getIdToken();

          /*
           * IMPORTANT:
           *
           * Speak BEFORE calling the server-side
           * signIn action, so authentication-state
           * changes cannot interrupt the speech.
           */
          await speakSignInSuccess();

          /*
           * Safety pause after complete speech.
           */
          await new Promise<void>(
            (resolve) =>
              setTimeout(
                resolve,
                500
              )
          );

          /*
           * Complete server-side sign-in.
           */
          await signIn({
            email,
            idToken,
          });

          /*
           * Redirect only after speech has completed.
           */
          window.location.href =
            "/";
        }
      } catch (
        error: any
      ) {
        toast.error(
          error.message
        );
      }
    };

  /*
   * ============================================================
   * PHONE SUBMIT
   * ============================================================
   */
  const onPhoneSubmit =
    async (data: any) => {
      try {
        /*
         * Stop repeated sign-in guidance.
         */
        stopSignInGuidance();

        const {
          name,
          countryCode,
          phoneNumber,
          pin,
        } = data;

        const fullPhone =
          `${countryCode}${phoneNumber}`;

        if (
          type ===
          "sign-up"
        ) {
          const result =
            await createPhoneAccount(
              {
                name,
                phone:
                  fullPhone,
                pin,
              }
            );

          if (
            !result.success
          ) {
            /*
             * PHONE NUMBER ALREADY REGISTERED
             */
            const errorMessage =
              typeof result.message ===
              "string"
                ? result.message
                : "";

            const isPhoneAlreadyRegistered =
              /phone\s*number\s*already\s*registered/i.test(
                errorMessage
              ) ||
              /phone\s*already\s*registered/i.test(
                errorMessage
              );

            if (
              isPhoneAlreadyRegistered
            ) {
              await speakPhoneMessage(
                "phone_already_registered",
                "Phone number already registered"
              );

              /*
               * Redirect after the complete
               * voice message.
               */
              router.push(
                "/sign-in"
              );

              return;
            }

            /*
             * Preserve all other
             * existing error behavior.
             */
            toast.error(
              result.message
            );

            return;
          }

          /*
           * PHONE ACCOUNT CREATED SUCCESSFULLY
           */
          await speakPhoneMessage(
            "phone_account_created",
            "Phone account created successfully. Please sign in."
          );

          /*
           * Redirect after the complete
           * voice message.
           */
          router.push(
            "/sign-in"
          );
        } else {
          /*
           * PHONE SIGN-IN
           */
          const result =
            await signInWithPhone(
              {
                phone:
                  fullPhone,
                pin,
              }
            );

          if (
            !result.success
          ) {
            toast.error(
              result.message
            );

            return;
          }

          const userCredential =
            await signInWithEmailAndPassword(
              auth,
              result.email!,
              result.password!
            );

          const idToken =
            await userCredential.user.getIdToken();

          /*
           * Speak BEFORE the server-side
           * sign-in action.
           */
          await speakSignInSuccess();

          /*
           * Safety pause after complete speech.
           */
          await new Promise<void>(
            (resolve) =>
              setTimeout(
                resolve,
                500
              )
          );

          /*
           * Complete server-side sign-in.
           */
          await signIn({
            email:
              result.email!,
            idToken,
          });

          /*
           * Redirect after speech is finished.
           */
          window.location.href =
            "/";
        }
      } catch (
        error: any
      ) {
        toast.error(
          error.message
        );
      }
    };

  const isSignIn =
    type ===
    "sign-in";

  return (
    <div className="card-border lg:min-w-[566px]">

      <div className="flex flex-col gap-6 card py-14 px-10">

        <div className="flex flex-row gap-2 justify-center">

          <Image
            src="/logo.svg"
            alt="logo"
            height={32}
            width={38}
          />

          <h2 className="text-primary-100">
            hugos
          </h2>

        </div>

        {/*
         * All requested voice messages are
         * voice-only. No karaoke message panel
         * is rendered here.
         */}

        <h3 className="text-center">
          Become Business Development Services Expert
        </h3>

        {/* Method Selection Tabs - FIXED: Removed onValueChange */}
        <Tabs
          defaultValue="email"
          className="w-full"
        >

          <TabsList className="grid w-full grid-cols-2">

            <TabsTrigger
              value="email"
              onClick={() =>
                setAuthMethod(
                  "email"
                )
              }
            >
              📧 Email
            </TabsTrigger>

            <TabsTrigger
              value="phone"
              onClick={() =>
                setAuthMethod(
                  "phone"
                )
              }
            >
              📱 Phone (4-digit PIN)
            </TabsTrigger>

          </TabsList>

          {/* Email Tab Content */}
          <TabsContent value="email">

            <Form
              {...emailForm}
            >

              <form
                onSubmit={
                  emailForm.handleSubmit(
                    onEmailSubmit
                  )
                }
                className="space-y-6 mt-4"
              >

                {!isSignIn && (
                  <FormField
                    control={
                      emailForm.control
                    }
                    name="name"
                    label="Your Name"
                    placeholder="Your Name"
                    type="text"
                  />
                )}

                <FormField
                  control={
                    emailForm.control
                  }
                  name="email"
                  label="Your email address"
                  placeholder="Your email address"
                  type="email"
                />

                <FormField
                  control={
                    emailForm.control
                  }
                  name="password"
                  label="Enter your password"
                  placeholder="Enter your password"
                  type="password"
                />

                <Button
                  className="btn w-full"
                  type="submit"
                >
                  {isSignIn
                    ? "Sign In with Email"
                    : "Create Email Account"}
                </Button>

              </form>

            </Form>

          </TabsContent>

          {/* Phone Tab Content */}
          <TabsContent value="phone">

            <Form
              {...phoneForm}
            >

              <form
                onSubmit={
                  phoneForm.handleSubmit(
                    onPhoneSubmit
                  )
                }
                className="space-y-6 mt-4"
              >

                {!isSignIn && (
                  <FormField
                    control={
                      phoneForm.control
                    }
                    name="name"
                    label="Your Name"
                    placeholder="Your Name"
                    type="text"
                  />
                )}

                {/* Phone Number with Country Code */}
                <div className="space-y-2">

                  <label className="text-sm font-medium">
                    Phone Number
                  </label>

                  <div className="flex gap-2">

                    <select
                      {...phoneForm.register(
                        "countryCode"
                      )}
                      className="w-28 px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
                    >

                      {countryCodes.map(
                        (
                          country
                        ) => (
                          <option
                            key={
                              country.code
                            }
                            value={
                              country.code
                            }
                          >
                            {
                              country.flag
                            }{" "}
                            {
                              country.code
                            }
                          </option>
                        )
                      )}

                    </select>

                    <Input
                      type="tel"
                      placeholder="712345678"
                      {...phoneForm.register(
                        "phoneNumber"
                      )}
                      className="flex-1"
                      maxLength={15}
                    />

                  </div>

                </div>

                {/* 4-digit PIN */}
                <div className="space-y-2">

                  <label className="text-sm font-medium">
                    4-Digit PIN
                  </label>

                  <Input
                    type="password"
                    placeholder="3846"
                    {...phoneForm.register(
                      "pin"
                    )}
                    maxLength={4}
                    className="w-full"
                  />

                  <p className="text-xs text-gray-500">
                    Enter a 4-digit number (e.g., 3846)
                  </p>

                </div>

                <Button
                  className="btn w-full"
                  type="submit"
                >
                  {isSignIn
                    ? "Sign In with Phone"
                    : "Create Phone Account"}
                </Button>

              </form>

            </Form>

          </TabsContent>

        </Tabs>

        {/* Toggle between sign-in and sign-up */}
        <p className="text-center">

          {isSignIn
            ? "Don't have an account?"
            : "Already have an account?"}

          <Link
            href={
              !isSignIn
                ? "/sign-in"
                : "/sign-up"
            }
            className="font-bold text-user-primary ml-1"
          >
            {!isSignIn
              ? "Sign In"
              : "Sign Up"}
          </Link>

        </p>

      </div>

    </div>
  );
};

export default AuthForm;
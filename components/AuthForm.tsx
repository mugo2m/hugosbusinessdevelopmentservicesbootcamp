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
  { code: "+254", country: "Kenya", flag: "🇰🇪" },
  { code: "+255", country: "Tanzania", flag: "🇹🇿" },
  { code: "+256", country: "Uganda", flag: "🇺🇬" },
  { code: "+260", country: "Zambia", flag: "🇿🇲" },
  { code: "+27", country: "South Africa", flag: "🇿🇦" },
  { code: "+234", country: "Nigeria", flag: "🇳🇬" },
  { code: "+233", country: "Ghana", flag: "🇬🇭" },
  { code: "+1", country: "USA/Canada", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
];

const emailSignUpSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(3),
});

const emailSignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(3),
});

const phoneSignUpSchema = z.object({
  name: z.string().min(3),
  countryCode: z.string(),
  phoneNumber: z.string().regex(/^\d{6,15}$/, "Please enter a valid phone number"),
  pin: z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits"),
});

const phoneSignInSchema = z.object({
  countryCode: z.string(),
  phoneNumber: z.string().regex(/^\d{6,15}$/, "Please enter a valid phone number"),
  pin: z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits"),
});

const AuthForm = ({ type }: { type: FormType }) => {
  const router = useRouter();
  const { t, ready } = useOfflineTranslation();

  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");

  const [karaokeText, setKaraokeText] = useState("");
  const [karaokeWordIndex, setKaraokeWordIndex] = useState(-1);
  const [karaokeActive, setKaraokeActive] = useState(false);

  const signInGuidanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const signInGuidanceStoppedRef = useRef(false);
  const signInGuidanceSpeakingRef = useRef(false);

  const safeT = (key: string, fallback?: string): string => {
    try {
      const result = t(key);
      if (result && typeof (result as any).then === "function") return fallback ?? key;
      if (typeof result === "string" && result !== key) return result;
      return fallback ?? key;
    } catch {
      return fallback ?? key;
    }
  };

  const waitForVoices = async (maxAttempts = 10): Promise<SpeechSynthesisVoice[]> => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) return voices;
      await new Promise<void>((resolve) => setTimeout(resolve, 300));
    }
    return window.speechSynthesis.getVoices();
  };

  const getPreferredEnglishVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
    return (
      voices.find((voice) =>
        /Microsoft Jenny|Microsoft Aria|Google UK English Female|Google US English Female|Samantha|Microsoft Zira/i.test(voice.name)
      ) ??
      voices.find((voice) => /^en-/i.test(voice.lang)) ??
      voices.find((voice) => /^en/i.test(voice.lang)) ??
      null
    );
  };

  const speakSignInSuccess = async (): Promise<void> => {
    const message = safeT("sign_in_success_message");
    if (!message || message === "sign_in_success_message") return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    const voices = await waitForVoices();
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    utterance.pitch = 1.05;
    utterance.volume = 1;

    const preferredVoice = getPreferredEnglishVoice(voices);
    if (preferredVoice) utterance.voice = preferredVoice;

    await new Promise<void>((resolve) => {
      let finished = false;
      const finish = () => { if (finished) return; finished = true; resolve(); };
      utterance.onend = () => finish();
      utterance.onerror = () => finish();
      window.speechSynthesis.speak(utterance);
    });
  };

  const speakSignInGuidance = async (): Promise<void> => {
    if (signInGuidanceStoppedRef.current) return;
    const message = safeT("sign_in_guidance");
    if (!message || message === "sign_in_guidance") return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (signInGuidanceSpeakingRef.current) return;

    signInGuidanceSpeakingRef.current = true;
    window.speechSynthesis.cancel();
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    if (signInGuidanceStoppedRef.current) { signInGuidanceSpeakingRef.current = false; return; }

    const voices = await waitForVoices();
    if (signInGuidanceStoppedRef.current) { signInGuidanceSpeakingRef.current = false; return; }

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1.05;
    utterance.volume = 1;

    const preferredVoice = getPreferredEnglishVoice(voices);
    if (preferredVoice) utterance.voice = preferredVoice;

    await new Promise<void>((resolve) => {
      let finished = false;
      const completeSpeech = () => {
        if (finished) return;
        finished = true;
        signInGuidanceSpeakingRef.current = false;
        if (signInGuidanceStoppedRef.current) { resolve(); return; }
        signInGuidanceTimerRef.current = setTimeout(() => {
          if (signInGuidanceStoppedRef.current) { resolve(); return; }
          void speakSignInGuidance();
          resolve();
        }, 2000);
      };
      utterance.onend = () => completeSpeech();
      utterance.onerror = () => completeSpeech();
      window.speechSynthesis.speak(utterance);
    });
  };

  const stopSignInGuidance = () => {
    signInGuidanceStoppedRef.current = true;
    signInGuidanceSpeakingRef.current = false;
    if (signInGuidanceTimerRef.current) {
      clearTimeout(signInGuidanceTimerRef.current);
      signInGuidanceTimerRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setKaraokeText("");
    setKaraokeWordIndex(-1);
    setKaraokeActive(false);
  };

  const emailForm = useForm<z.infer<typeof emailSignUpSchema | typeof emailSignInSchema>>({
    resolver: zodResolver(type === "sign-up" ? emailSignUpSchema : emailSignInSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const phoneForm = useForm<z.infer<typeof phoneSignUpSchema | typeof phoneSignInSchema>>({
    resolver: zodResolver(type === "sign-up" ? phoneSignUpSchema : phoneSignInSchema),
    defaultValues: { name: "", countryCode: "+254", phoneNumber: "", pin: "" },
  });

  useEffect(() => {
    if (type !== "sign-in" || !ready) return;
    signInGuidanceStoppedRef.current = false;
    signInGuidanceSpeakingRef.current = false;
    if (signInGuidanceTimerRef.current) {
      clearTimeout(signInGuidanceTimerRef.current);
      signInGuidanceTimerRef.current = null;
    }
    const message = safeT("sign_in_guidance");
    if (!message || message === "sign_in_guidance") return;
    const initialTimer = window.setTimeout(() => {
      if (!signInGuidanceStoppedRef.current) void speakSignInGuidance();
    }, 700);
    return () => {
      window.clearTimeout(initialTimer);
      if (signInGuidanceTimerRef.current) {
        clearTimeout(signInGuidanceTimerRef.current);
        signInGuidanceTimerRef.current = null;
      }
      signInGuidanceStoppedRef.current = true;
      signInGuidanceSpeakingRef.current = false;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [type, ready]);

  useEffect(() => {
    if (type !== "sign-in") return;
    const subscription = emailForm.watch((values) => {
      if (String(values.email ?? "").trim() || String(values.password ?? "").trim()) stopSignInGuidance();
    });
    return () => subscription.unsubscribe();
  }, [type, emailForm]);

  useEffect(() => {
    if (type !== "sign-in") return;
    const subscription = phoneForm.watch((values) => {
      if (String(values.phoneNumber ?? "").trim() || String(values.pin ?? "").trim()) stopSignInGuidance();
    });
    return () => subscription.unsubscribe();
  }, [type, phoneForm]);

  const speakPhoneMessage = async (key: string, fallback: string): Promise<void> => {
    const message = safeT(key, fallback);
    if (!message || message === key) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    const voices = await waitForVoices();

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1.05;
    utterance.volume = 1;

    const preferredVoice = getPreferredEnglishVoice(voices);
    if (preferredVoice) utterance.voice = preferredVoice;

    await new Promise<void>((resolve) => {
      let finished = false;
      const finish = () => { if (finished) return; finished = true; resolve(); };
      utterance.onend = () => finish();
      utterance.onerror = () => finish();
      window.speechSynthesis.speak(utterance);
    });
  };

  const onEmailSubmit = async (data: any) => {
    try {
      stopSignInGuidance();
      if (type === "sign-up") {
        const { name, email, password } = data;
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const result = await signUp({ uid: userCredential.user.uid, name, email, password });
        if (!result.success) { toast.error(result.message); return; }
        toast.success("Account created successfully. Please sign in.");
        router.push("/sign-in");
      } else {
        const { email, password } = data;
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await userCredential.user.getIdToken();
        await speakSignInSuccess();
        await new Promise<void>((resolve) => setTimeout(resolve, 500));
        await signIn({ email, idToken });
        window.location.href = "/";
      }
    } catch (error: any) { toast.error(error.message); }
  };

  const onPhoneSubmit = async (data: any) => {
    try {
      stopSignInGuidance();
      const { name, countryCode, phoneNumber, pin } = data;
      const fullPhone = `${countryCode}${phoneNumber}`;

      if (type === "sign-up") {
        const result = await createPhoneAccount({ name, phone: fullPhone, pin });
        if (!result.success) {
          const errorMessage = typeof result.message === "string" ? result.message : "";
          const isPhoneAlreadyRegistered =
            /phone\s*number\s*already\s*registered/i.test(errorMessage) ||
            /phone\s*already\s*registered/i.test(errorMessage);
          if (isPhoneAlreadyRegistered) {
            await speakPhoneMessage("phone_already_registered", "Phone number already registered");
            router.push("/sign-in");
            return;
          }
          toast.error(result.message);
          return;
        }
        await speakPhoneMessage("phone_account_created", "Phone account created successfully. Please sign in.");
        router.push("/sign-in");
      } else {
        const result = await signInWithPhone({ phone: fullPhone, pin });
        if (!result.success) { toast.error(result.message); return; }
        const userCredential = await signInWithEmailAndPassword(auth, result.email!, result.password!);
        const idToken = await userCredential.user.getIdToken();
        await speakSignInSuccess();
        await new Promise<void>((resolve) => setTimeout(resolve, 500));
        await signIn({ email: result.email!, idToken });
        window.location.href = "/";
      }
    } catch (error: any) { toast.error(error.message); }
  };

  const isSignIn = type === "sign-in";

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat relative p-4"
      style={{ backgroundImage: "url('/muiruri.jpg')" }}
    >
      {/* ✅ dark overlay removed — photo at full brightness */}

      <div className="relative z-10">
        <div className="card-border lg:min-w-[566px]">
          <div className="flex flex-col gap-6 card py-14 px-10">

            <div className="flex flex-row gap-2 justify-center">
              <Image src="/logo.svg" alt="logo" height={32} width={38} />
              <h2 className="text-primary-100">hugos</h2>
            </div>

            <h3 className="text-center">
              Become Business Development Services Expert
            </h3>

            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email" onClick={() => setAuthMethod("email")}>
                  📧 Email
                </TabsTrigger>
                <TabsTrigger value="phone" onClick={() => setAuthMethod("phone")}>
                  📱 Phone (4-digit PIN)
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email">
                <Form {...emailForm}>
                  <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-6 mt-4">
                    {!isSignIn && (
                      <FormField control={emailForm.control} name="name" label="Your Name" placeholder="Your Name" type="text" />
                    )}
                    <FormField control={emailForm.control} name="email" label="Your email address" placeholder="Your email address" type="email" />
                    <FormField control={emailForm.control} name="password" label="Enter your password" placeholder="Enter your password" type="password" />
                    <Button className="btn w-full" type="submit">
                      {isSignIn ? "Sign In with Email" : "Create Email Account"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="phone">
                <Form {...phoneForm}>
                  <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-6 mt-4">
                    {!isSignIn && (
                      <FormField control={phoneForm.control} name="name" label="Your Name" placeholder="Your Name" type="text" />
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone Number</label>
                      <div className="flex gap-2">
                        <select
                          {...phoneForm.register("countryCode")}
                          className="w-28 px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
                        >
                          {countryCodes.map((country) => (
                            <option key={country.code} value={country.code}>
                              {country.flag} {country.code}
                            </option>
                          ))}
                        </select>
                        <Input type="tel" placeholder="712345678" {...phoneForm.register("phoneNumber")} className="flex-1" maxLength={15} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">4-Digit PIN</label>
                      <Input type="password" placeholder="3846" {...phoneForm.register("pin")} maxLength={4} className="w-full" />
                      <p className="text-xs text-gray-500">Enter a 4-digit number (e.g., 3846)</p>
                    </div>

                    <Button className="btn w-full" type="submit">
                      {isSignIn ? "Sign In with Phone" : "Create Phone Account"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>

            <p className="text-center">
              {isSignIn ? "Don't have an account?" : "Already have an account?"}
              <Link href={!isSignIn ? "/sign-in" : "/sign-up"} className="font-bold text-user-primary ml-1">
                {!isSignIn ? "Sign In" : "Sign Up"}
              </Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
// app/(root)/interview/[id]/page.tsx
import Image from "next/image";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import Agent from "@/components/Agent";

import {
  getFarmerSessionById,
  getFeedbackByInterviewId,
} from "@/lib/actions/general.action";
import { getCurrentUser } from "@/lib/actions/auth.action";

// ✅ NEW — static locale imports (works reliably in server components)
import enUS from "@/public/locales/en-US/common.json";
import frLocale from "@/public/locales/fr/common.json";
import esLocale from "@/public/locales/es/common.json";
import swLocale from "@/public/locales/sw/common.json";

type LocaleMap = Record<string, string>;

const LOCALES: Record<string, LocaleMap> = {
  "en-US": enUS as LocaleMap,
  "en-GB": enUS as LocaleMap,
  fr: frLocale as LocaleMap,
  es: esLocale as LocaleMap,
  sw: swLocale as LocaleMap,
};

function tr(key: string, language: string): string {
  if (!key) return "";
  const langKey = language?.startsWith("en") ? "en-US" : language || "en-US";
  const locale = LOCALES[langKey] || LOCALES["en-US"];
  return locale[key] || key;
}

const InterviewDetails = async ({ params }: RouteParams) => {
  const { id } = await params;

  console.log("📚 LEARNING SESSION PAGE LOADED —", id);

  const user = await getCurrentUser();
  console.log("Current user:", user?.id);

  const cookieStore = await cookies();
  const language = cookieStore.get("preferred-language")?.value || "en-US";
  console.log("🌐 Language from cookie:", language);

  const session = await getFarmerSessionById(id, language);
  console.log("Session data:", {
    exists: !!session,
    topicLabel: session?.topicLabel,
    module: session?.module,
    county: session?.county,
    language: session?.language,
  });

  if (!session) {
    console.log("❌ Session not found, redirecting...");
    redirect("/");
  }

  let feedback = null;
  try {
    if (user?.id) {
      const feedbackResult = await getFeedbackByInterviewId({
        interviewId: id,
        userId: user.id,
      });
      if (feedbackResult && typeof feedbackResult === "object") {
        feedback = feedbackResult;
      }
    }
  } catch {
    feedback = null;
  }

  // ✅ NEW — translate label + module server-side
  const rawTopicLabel = session.topicLabel || "Lesson";
  const rawModule = session.module || "";
  const topicLabel = tr(rawTopicLabel, language);
  const moduleName = rawModule ? tr(rawModule, language) : "";

  const county = session.county || "";
  const subCounty = session.subCounty || "";
  const village = session.village || "";
  const country = session.country || "";
  const location = [county, subCounty, village, country]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      {/* ===== BDS HEADER ===== */}
      <div className="flex flex-row gap-4 justify-between bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-xl mb-4 border-2 border-emerald-200">
        <div className="flex flex-row gap-4 items-center max-sm:flex-col">
          <div className="flex flex-row gap-4 items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-2xl ring-4 ring-emerald-200">
              📚
            </div>
            <div>
              <h3 className="text-xl font-semibold text-emerald-800">
                {topicLabel}
              </h3>
              <p className="text-sm text-gray-600">
                {moduleName}
                {location && (
                  <>
                    {" • "}
                    <span className="text-gray-500">{location}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg font-medium text-sm">
            🎓 {tr("learn_by_listening", language)}
          </span>
        </div>
      </div>

      <Agent
        userName={user?.name || "Learner"}
        userId={user?.id}
        interviewId={id}
        sessionData={session}
        profileImage={user?.profileURL}
      />
    </>
  );
};

export default InterviewDetails;
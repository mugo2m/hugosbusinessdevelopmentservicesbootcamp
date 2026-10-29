// app/api/vapi/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/firebase/admin";
import { generateBdsLesson } from "@/lib/bdsRecommendationEngine";

// Fields required for a profile to be considered "complete"
const PROFILE_REQUIRED_FIELDS = ["country", "county", "subCounty", "ward", "village"] as const;

type LocationFields = {
  country: string;
  county: string;
  subCounty: string;
  ward: string;
  village: string;
};

function extractLocation(body: any): LocationFields {
  const trim = (v: any) => (typeof v === "string" ? v.trim() : "");
  return {
    country: trim(body?.country).toLowerCase(),
    county: trim(body?.county),
    subCounty: trim(body?.subCounty),
    ward: trim(body?.ward),
    village: trim(body?.village),
  };
}

function isProfileComplete(loc: LocationFields): boolean {
  return PROFILE_REQUIRED_FIELDS.every((k) => Boolean(loc[k]));
}

/**
 * Persist (merge) the learner's location into `learner_profiles/{userid}`.
 * Only writes fields that are actually present, so a partial save can never
 * wipe an existing good value.
 */
async function upsertLearnerProfile(params: {
  userid: string;
  location: LocationFields;
  learnerName?: string;
  language?: string;
}) {
  const { userid, location, learnerName, language } = params;

  const data: Record<string, any> = {
    userId: userid,
    updatedAt: new Date().toISOString(),
    isComplete: isProfileComplete(location),
  };

  // Only include location keys that have a value
  (Object.keys(location) as (keyof LocationFields)[]).forEach((k) => {
    if (location[k]) data[k] = location[k];
  });

  if (learnerName) data.learnerName = learnerName;
  if (language) data.language = language;

  await db.collection("learner_profiles").doc(userid).set(data, { merge: true });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("📥 [vapi/generate] Request:", body);

    const {
      userid,
      topic,
      topicLabel: incomingTopicLabel,
      language = "en",
      learnerName = "Learner",
    } = body || {};

    if (!userid) {
      return NextResponse.json(
        { success: false, error: "userid is required" },
        { status: 400 }
      );
    }
    if (!topic) {
      return NextResponse.json(
        { success: false, error: "topic is required" },
        { status: 400 }
      );
    }

    const location = extractLocation(body);

    // ===== GENERATE LESSON CONTENT (no Firestore read) =====
    const lesson = await generateBdsLesson({
      topic,
      language,
      learnerName,
    });

    // ===== CREATE SESSION =====
    const sessionRef = db.collection("farmer_sessions").doc();
    const sessionId = sessionRef.id;

    const now = new Date().toISOString();

    const sessionDoc = {
      id: sessionId,
      userId: userid,
      language,
      learnerName,
      farmerName: learnerName, // legacy display code
      topic,
      topicLabel: lesson.topicLabel,
      module: lesson.module,
      country: location.country,
      county: location.county,
      subCounty: location.subCounty,
      ward: location.ward,
      village: location.village,
      lessonSections: lesson.lessonSections,
      structuredList: lesson.lessonSections,
      structuredFinancialAdvice: lesson.structuredFinancialAdvice,
      createdAt: now,
      metadata: {
        createdAt: now,
        source: "bds-bootcamp",
        version: "1.0",
      },
    };

    await sessionRef.set(sessionDoc);
    console.log(
      `✅ [vapi/generate] Session created: ${sessionId} — "${lesson.topicLabel}" (${lesson.lessonSections.length} sections)`
    );

    // ===== PERSIST LEARNER PROFILE (non-fatal) =====
    // This is what lets future visits skip the 6 onboarding questions.
    try {
      await upsertLearnerProfile({
        userid,
        location,
        learnerName,
        language,
      });
      console.log(
        `👤 [vapi/generate] Profile upserted for ${userid} (complete=${isProfileComplete(location)})`
      );
    } catch (profileErr) {
      // Never fail the session because of a metadata write
      console.warn("⚠️ [vapi/generate] Profile upsert failed:", profileErr);
    }

    return NextResponse.json({
      success: true,
      sessionId,
      topicLabel: lesson.topicLabel,
      module: lesson.module,
      sections: lesson.lessonSections,
      // Echo back for client debug — helps confirm topic-only flow
      profileComplete: isProfileComplete(location),
      incomingTopicLabel: incomingTopicLabel || null,
    });
  } catch (error: any) {
    console.error("❌ [vapi/generate] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "operational",
    message: "BDS BootCamp generate — generates lesson content on-the-fly",
    version: "1.1",
  });
}
// app/api/vapi/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/firebase/admin";
import { generateBdsLesson } from "@/lib/bdsRecommendationEngine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("📥 [vapi/generate] Request:", body);

    const {
      userid,
      country = "",
      topic,
      county = "",
      subCounty = "",
      ward = "",
      village = "",
      language = "en",
      learnerName = "Learner",
    } = body;

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

    // ===== GENERATE LESSON CONTENT (no Firestore read) =====
    const lesson = await generateBdsLesson({ topic, language, learnerName });

    // ===== CREATE SESSION =====
    const sessionRef = db.collection("farmer_sessions").doc();
    const sessionId = sessionRef.id;

    const sessionDoc = {
  id: sessionId,
  userId: userid,
  language,
  learnerName,
  farmerName: learnerName,              // ← ADDED (for legacy display code)
  topic,
  topicLabel: lesson.topicLabel,
  module: lesson.module,
  country: (country || "").toLowerCase(),
  county,
  subCounty,
  ward,
  village,
  lessonSections: lesson.lessonSections,
  structuredList: lesson.lessonSections,
  structuredFinancialAdvice: lesson.structuredFinancialAdvice,
  createdAt: new Date().toISOString(),    // ← ADDED (for HomeContent date display)
  metadata: {
    createdAt: new Date().toISOString(),
    source: "bds-bootcamp",
    version: "1.0",
  },
};
    await sessionRef.set(sessionDoc);
    console.log(
      `✅ [vapi/generate] Session created: ${sessionId} — "${lesson.topicLabel}" (${lesson.lessonSections.length} sections)`
    );

    return NextResponse.json({
      success: true,
      sessionId,
      topicLabel: lesson.topicLabel,
      module: lesson.module,
      sections: lesson.lessonSections,
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
    version: "1.0",
  });
}
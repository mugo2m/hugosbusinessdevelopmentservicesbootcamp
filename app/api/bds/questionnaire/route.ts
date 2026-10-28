// app/api/bds/questionnaire/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/firebase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, businessName, primaryGoal, ...rest } = body;

    if (!userId || !businessName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const docRef = db.collection("enterprise_profiles").doc();

    await docRef.set({
      id: docRef.id,
      userId,
      businessName,
      primaryGoal,
      ...rest,
      createdAt: new Date().toISOString(),
    });

    console.log(`✅ [BDS Questionnaire] Saved profile for: ${businessName}`);
    return NextResponse.json({ success: true, profileId: docRef.id });
  } catch (error: any) {
    console.error("❌ [BDS Questionnaire] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
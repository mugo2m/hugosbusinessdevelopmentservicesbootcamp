// app/api/profile/[userId]/route.ts
import { NextResponse } from "next/server";
import { db } from "@/firebase/admin";

export const dynamic = "force-dynamic";

const REQUIRED = ["country", "county", "subCounty", "ward", "village"] as const;

type Profile = {
  country: string;
  county: string;
  subCounty: string;
  ward: string;
  village: string;
  isComplete: boolean;
};

const EMPTY: Profile = {
  country: "",
  county: "",
  subCounty: "",
  ward: "",
  village: "",
  isComplete: false,
};

function buildProfile(raw: any): Profile {
  const p = {
    country: raw?.country || "",
    county: raw?.county || "",
    subCounty: raw?.subCounty || "",
    ward: raw?.ward || "",
    village: raw?.village || "",
  };
  return {
    ...p,
    isComplete: REQUIRED.every((k) => Boolean((p as any)[k])),
  };
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ userId: string }> }   // ← Promise now
) {
  // ✅ Next.js 16: MUST await params
  const { userId: rawId } = await context.params;
  const userId = rawId?.trim();

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  try {
    // 1) Dedicated profile collection (source of truth)
    const profileSnap = await db.collection("learner_profiles").doc(userId).get();
    if (profileSnap.exists) {
      const profile = buildProfile(profileSnap.data());
      console.log(`👤 [profile:GET] ${userId} → complete=${profile.isComplete}`);
      return NextResponse.json(profile);
    }

    // 2) Fallback: latest farmer_session for this user
    const sessionsSnap = await db
      .collection("farmer_sessions")
      .where("userId", "==", userId)
      .limit(20)
      .get();

    if (sessionsSnap.empty) {
      console.log(`👤 [profile:GET] ${userId} → no profile, no sessions`);
      return NextResponse.json(EMPTY);
    }

    const sessions = sessionsSnap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    }));
    sessions.sort((a, b) => {
      const ta =
        a.createdAt?.toDate?.().getTime?.() ??
        new Date(a.createdAt || 0).getTime();
      const tb =
        b.createdAt?.toDate?.().getTime?.() ??
        new Date(b.createdAt || 0).getTime();
      return tb - ta;
    });

    const profile = buildProfile(sessions[0]);
    console.log(
      `👤 [profile:GET] ${userId} → from session (complete=${profile.isComplete})`
    );
    return NextResponse.json(profile);
  } catch (err) {
    console.error("[/api/profile] error:", err);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}
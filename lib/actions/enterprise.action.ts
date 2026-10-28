// lib/actions/enterprise.action.ts
"use server";

import { db } from "@/firebase/admin";

export async function getEnterpriseProfilesByUserId(userId: string) {
  try {
    const snapshot = await db
      .collection("enterprise_profiles")
      .where("userId", "==", userId)
      .get();

    const profiles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Sort manually by createdAt descending
    return profiles.sort((a: any, b: any) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } catch (error) {
    console.error("Error fetching enterprise profiles:", error);
    return [];
  }
}

export async function getAllEnterpriseProfiles() {
  try {
    const snapshot = await db.collection("enterprise_profiles").get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching all enterprise profiles:", error);
    return [];
  }
}
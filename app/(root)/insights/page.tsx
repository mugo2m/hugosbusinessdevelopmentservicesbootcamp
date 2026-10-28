// app/(root)/insights/page.tsx
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getEnterpriseProfilesByUserId } from "@/lib/actions/enterprise.action";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function InsightsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  // Fetching user's profiles for privacy, but could easily be getAllEnterpriseProfiles()
  const profiles = await getEnterpriseProfilesByUserId(user.id);

  return <AnalyticsDashboard profiles={profiles} />;
}
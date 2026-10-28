// app/(root)/dashboard/page.tsx
import OfficerDashboard from "@/components/OfficerDashboard";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getEnterpriseProfilesByUserId } from "@/lib/actions/enterprise.action";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const profiles = await getEnterpriseProfilesByUserId(user.id);

  return (
    <OfficerDashboard
      userName={user.name || "Officer"}
      profiles={profiles}
    />
  );
}
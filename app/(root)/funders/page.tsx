// app/(root)/funders/page.tsx
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getFarmerSessionsByUserId } from "@/lib/actions/general.action";
import { redirect } from "next/navigation";
import FundersWizard from "@/components/FundersWizard";

export const dynamic = 'force-dynamic';

const FundersPage = async () => {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch user's latest session to get their country
  const sessions = await getFarmerSessionsByUserId(user.id);
  const latestSession = sessions.length > 0 ? sessions[0] : null;
  const userCountry = latestSession?.country || "kenya"; // Default to Kenya if no session

  return (
    // ✅ Full-screen mwangi.jpg background — no dark overlay
    <div
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/mwangi.jpg')" }}
    >
      <div className="container mx-auto pt-6 px-6 max-w-5xl">
        <h1 className="text-3xl font-bold text-emerald-800 mb-2 drop-shadow-sm">
          🏦 Funder Directory
        </h1>
        <p className="text-gray-700 mb-8">
          Answer a few questions to find the right capital provider for your agribusiness.
        </p>
      </div>

      <FundersWizard userCountry={userCountry} />
    </div>
  );
};

export default FundersPage;
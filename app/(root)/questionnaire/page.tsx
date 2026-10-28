import BdsQuestionnaire from "@/components/BdsQuestionnaire";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

const Page = async () => {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <BdsQuestionnaire
        userName={user?.name || "Officer"}
        userId={user?.id}
        profileImage={user?.profileURL}
      />
    </div>
  );
};

export default Page;
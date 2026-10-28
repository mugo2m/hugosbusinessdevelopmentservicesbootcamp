// components/OfficerDashboard.tsx
"use client";

import Link from "next/link";
import { Building2, MapPin, AlertCircle, ArrowRight, TrendingUp } from "lucide-react";

export default function OfficerDashboard({ userName, profiles }: { userName: string, profiles: any[] }) {
  const latestProfile = profiles[0];

  return (
    <div className="container mx-auto p-6 max-w-4xl min-h-screen flex flex-col gap-6">

      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-2xl border-2 border-emerald-200">
        <h1 className="text-3xl font-bold text-emerald-900">Welcome, {userName}</h1>
        <p className="text-emerald-700 mt-1">Here is the enterprise profile you just created.</p>
      </div>

      {!latestProfile ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <p className="text-gray-500 mb-4">No enterprise profiles found.</p>
          <Link href="/questionnaire" className="bg-emerald-600 text-white px-4 py-2 rounded-lg">
            Create Profile
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800 capitalize">{latestProfile.businessName}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  <MapPin className="w-4 h-4" />
                  {latestProfile.ward}, {latestProfile.subCounty}, {latestProfile.county}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-6 border-t">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Sectors</h3>
              <div className="flex flex-wrap gap-2">
                {latestProfile.sector?.map((s: string) => (
                  <span key={s} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm capitalize">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500" /> Key Challenges
              </h3>
              <div className="flex flex-wrap gap-2">
                {latestProfile.sellingChallenge?.map((c: string) => (
                  <span key={c} className="bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-full text-sm capitalize">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 bg-blue-50 p-4 rounded-xl border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-900">Primary Goal</h3>
            <p className="text-blue-800 mt-1">{latestProfile.primaryGoal}</p>
          </div>
        </div>
      )}

      {/* Next Step Button */}
      <div className="mt-auto pt-8 flex justify-center">
        <Link
          href="/insights"
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-3 rounded-xl font-bold hover:scale-105 transition-all shadow-lg"
        >
          <TrendingUp className="w-5 h-5" />
          Continue to Data Insights
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

    </div>
  );
}
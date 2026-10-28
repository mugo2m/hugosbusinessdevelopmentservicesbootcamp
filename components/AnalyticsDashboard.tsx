// components/AnalyticsDashboard.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  BarChart3,
  MapPin,
  ArrowRight,
  BookOpen,
  Layers,
  TrendingUp,
  Wallet,
  FileText,
  Users,
  Filter,
  ChevronDown,
  Map,
  Navigation // Icon for Sublocation/Village
} from "lucide-react";

export default function AnalyticsDashboard({ profiles }: { profiles: any[] }) {

  // ========== STATE FOR FILTERS ==========
  const [selectedCounty, setSelectedCounty] = useState<string>("all");
  const [selectedSubCounty, setSelectedSubCounty] = useState<string>("all");
  const [selectedWard, setSelectedWard] = useState<string>("all");
  const [selectedSublocation, setSelectedSublocation] = useState<string>("all");

  // Extract unique counties
  const availableCounties = useMemo(() => {
    const counties = new Set<string>();
    profiles.forEach(p => { if (p.county) counties.add(p.county.toLowerCase()); });
    return Array.from(counties).sort();
  }, [profiles]);

  // Extract unique sub-counties based on selected county
  const availableSubCounties = useMemo(() => {
    const subs = new Set<string>();
    const baseProfiles = selectedCounty === "all" ? profiles : profiles.filter(p => p.county?.toLowerCase() === selectedCounty);
    baseProfiles.forEach(p => { if (p.subCounty) subs.add(p.subCounty.toLowerCase()); });
    return Array.from(subs).sort();
  }, [profiles, selectedCounty]);

  // Extract unique wards based on selected county AND sub-county
  const availableWards = useMemo(() => {
    const wards = new Set<string>();
    let baseProfiles = profiles;
    if (selectedCounty !== "all") baseProfiles = baseProfiles.filter(p => p.county?.toLowerCase() === selectedCounty);
    if (selectedSubCounty !== "all") baseProfiles = baseProfiles.filter(p => p.subCounty?.toLowerCase() === selectedSubCounty);
    baseProfiles.forEach(p => { if (p.ward) wards.add(p.ward.toLowerCase()); });
    return Array.from(wards).sort();
  }, [profiles, selectedCounty, selectedSubCounty]);

  // Extract unique sublocations (villages) based on county, sub-county, AND ward
  const availableSublocations = useMemo(() => {
    const villages = new Set<string>();
    let baseProfiles = profiles;
    if (selectedCounty !== "all") baseProfiles = baseProfiles.filter(p => p.county?.toLowerCase() === selectedCounty);
    if (selectedSubCounty !== "all") baseProfiles = baseProfiles.filter(p => p.subCounty?.toLowerCase() === selectedSubCounty);
    if (selectedWard !== "all") baseProfiles = baseProfiles.filter(p => p.ward?.toLowerCase() === selectedWard);
    baseProfiles.forEach(p => { if (p.village) villages.add(p.village.toLowerCase()); });
    return Array.from(villages).sort();
  }, [profiles, selectedCounty, selectedSubCounty, selectedWard]);

  // ========== CASCADING HANDLERS ==========
  const handleCountyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCounty(e.target.value);
    setSelectedSubCounty("all");
    setSelectedWard("all");
    setSelectedSublocation("all");
  };

  const handleSubCountyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSubCounty(e.target.value);
    setSelectedWard("all");
    setSelectedSublocation("all");
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedWard(e.target.value);
    setSelectedSublocation("all");
  };

  // ========== FILTERING LOGIC ==========
  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => {
      const matchesCounty = selectedCounty === "all" || p.county?.toLowerCase() === selectedCounty;
      const matchesSubCounty = selectedSubCounty === "all" || p.subCounty?.toLowerCase() === selectedSubCounty;
      const matchesWard = selectedWard === "all" || p.ward?.toLowerCase() === selectedWard;
      const matchesSublocation = selectedSublocation === "all" || p.village?.toLowerCase() === selectedSublocation;

      return matchesCounty && matchesSubCounty && matchesWard && matchesSublocation;
    });
  }, [profiles, selectedCounty, selectedSubCounty, selectedWard, selectedSublocation]);

  const totalProfiles = filteredProfiles.length;

  // ========== AGGREGATION ==========
  const challengeCounts: Record<string, number> = {};
  const sectorCounts: Record<string, number> = {};
  const fundingCounts: Record<string, number> = { yes_loan: 0, yes_grant: 0, no: 0, planning: 0 };
  const performanceCounts: Record<string, number> = { inc_40: 0, inc_10: 0, same: 0, dec_10: 0, dec_50: 0 };
  const recordsCounts: Record<string, number> = { yes: 0, somewhat: 0, no: 0 };
  const employeeCounts: Record<string, number> = { owner: 0, "1-5": 0, "6-20": 0, "20+": 0 };
  const locationData: Record<string, { count: number, ward: string, subCounty: string, county: string }> = {};

  filteredProfiles.forEach((p) => {
    p.sellingChallenge?.forEach((c: string) => { challengeCounts[c] = (challengeCounts[c] || 0) + 1; });
    p.sector?.forEach((s: string) => { sectorCounts[s] = (sectorCounts[s] || 0) + 1; });
    if (p.externalFunding && fundingCounts[p.externalFunding] !== undefined) fundingCounts[p.externalFunding]++;
    if (p.performance && performanceCounts[p.performance] !== undefined) performanceCounts[p.performance]++;
    if (p.records && recordsCounts[p.records] !== undefined) recordsCounts[p.records]++;
    if (p.employees && employeeCounts[p.employees] !== undefined) employeeCounts[p.employees]++;

    const village = p.village || "Unknown Village";
    if (!locationData[village]) {
      locationData[village] = {
        count: 0,
        ward: p.ward || "Unknown Ward",
        subCounty: p.subCounty || "Unknown Sub-County",
        county: p.county || "Unknown County",
      };
    }
    locationData[village].count += 1;
  });

  const topChallenges = Object.entries(challengeCounts).sort((a, b) => b[1] - a[1]);
  const topLocations = Object.entries(locationData).sort((a, b) => b[1].count - a[1]);

  // ========== RENDER HELPERS ==========
  const StatBar = ({ label, count, total, colorClass }: { label: string, count: number, total: number, colorClass: string }) => (
    <div className="flex items-center justify-between mb-2">
      <span className="capitalize text-sm text-gray-700 w-32 truncate" title={label}>{label.replace(/_/g, " ")}</span>
      <div className="flex items-center gap-2 flex-1 justify-end">
        <div className="h-2 bg-gray-100 rounded-full w-full max-w-[120px]">
          <div className={`h-2 rounded-full ${colorClass}`} style={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }} />
        </div>
        <span className="text-xs font-semibold text-gray-500 w-6 text-right">{count}</span>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 max-w-5xl min-h-screen flex flex-col gap-6">

      {/* Header with Filters */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border-2 border-blue-200 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Regional Insights Dashboard</h1>
          <p className="text-blue-700 mt-1">Aggregated data from {totalProfiles} enterprises.</p>
        </div>

        {/* ✅ 4-LEVEL CASCADING FILTER DROPDOWNS */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full xl:w-auto">

          {/* County */}
          <div className="bg-white p-2 rounded-xl shadow-sm border border-blue-100 flex items-center gap-2 flex-1 sm:flex-none">
            <Filter className="w-4 h-4 text-blue-500 ml-1" />
            <div className="relative flex-1">
              <select value={selectedCounty} onChange={handleCountyChange} className="w-full appearance-none bg-transparent pr-6 pl-1 py-1 text-sm font-medium text-gray-700 focus:outline-none capitalize cursor-pointer">
                <option value="all">County</option>
                {availableCounties.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-0 top-1.5 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Sub-County */}
          <div className="bg-white p-2 rounded-xl shadow-sm border border-blue-100 flex items-center gap-2 flex-1 sm:flex-none">
            <Layers className="w-4 h-4 text-blue-500 ml-1" />
            <div className="relative flex-1">
              <select value={selectedSubCounty} onChange={handleSubCountyChange} disabled={availableSubCounties.length === 0} className="w-full appearance-none bg-transparent pr-6 pl-1 py-1 text-sm font-medium text-gray-700 focus:outline-none capitalize cursor-pointer disabled:opacity-50">
                <option value="all">Sub-County</option>
                {availableSubCounties.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-0 top-1.5 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Ward */}
          <div className="bg-white p-2 rounded-xl shadow-sm border border-blue-100 flex items-center gap-2 flex-1 sm:flex-none">
            <Map className="w-4 h-4 text-blue-500 ml-1" />
            <div className="relative flex-1">
              <select value={selectedWard} onChange={handleWardChange} disabled={availableWards.length === 0} className="w-full appearance-none bg-transparent pr-6 pl-1 py-1 text-sm font-medium text-gray-700 focus:outline-none capitalize cursor-pointer disabled:opacity-50">
                <option value="all">Ward</option>
                {availableWards.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
              <ChevronDown className="absolute right-0 top-1.5 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Sublocation / Village */}
          <div className="bg-white p-2 rounded-xl shadow-sm border border-blue-100 flex items-center gap-2 flex-1 sm:flex-none">
            <Navigation className="w-4 h-4 text-blue-500 ml-1" />
            <div className="relative flex-1">
              <select value={selectedSublocation} onChange={(e) => setSelectedSublocation(e.target.value)} disabled={availableSublocations.length === 0} className="w-full appearance-none bg-transparent pr-6 pl-1 py-1 text-sm font-medium text-gray-700 focus:outline-none capitalize cursor-pointer disabled:opacity-50">
                <option value="all">Sublocation</option>
                {availableSublocations.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <ChevronDown className="absolute right-0 top-1.5 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border shadow-sm text-center">
          <div className="text-3xl font-bold text-blue-600 mb-1">{totalProfiles}</div>
          <div className="text-xs text-gray-600 uppercase tracking-wide">Total Profiles</div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm text-center">
          <div className="text-3xl font-bold text-emerald-600 mb-1">{Object.keys(sectorCounts).length}</div>
          <div className="text-xs text-gray-600 uppercase tracking-wide">Sectors</div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm text-center">
          <div className="text-3xl font-bold text-amber-600 mb-1">{Object.keys(locationData).length}</div>
          <div className="text-xs text-gray-600 uppercase tracking-wide">Villages</div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm text-center">
          <div className="text-3xl font-bold text-purple-600 mb-1">{fundingCounts.yes_loan + fundingCounts.yes_grant}</div>
          <div className="text-xs text-gray-600 uppercase tracking-wide">Funded Enterprises</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">

        {/* 1. Top Challenges */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-rose-500" />
            Top Market Challenges
          </h3>
          <div className="space-y-1">
            {topChallenges.length > 0 ? topChallenges.map(([name, count]) => (
              <StatBar key={name} label={name} count={count} total={totalProfiles} colorClass="bg-rose-500" />
            )) : <p className="text-sm text-gray-500">No data for this region.</p>}
          </div>
        </div>

        {/* 2. Geography */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-500" />
            Sublocation Distribution
          </h3>
          <div className="space-y-4">
            {topLocations.length > 0 ? topLocations.slice(0, 4).map(([village, data]) => (
              <div key={village} className="flex flex-col gap-1 border-b border-gray-50 pb-2">
                <div className="flex items-center justify-between">
                  <span className="capitalize text-gray-800 font-medium">{village}</span>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{data.count} businesses</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-gray-500">
                  <Layers className="w-3 h-3" />
                  {data.ward} Ward, {data.subCounty} Sub-County, {data.county} County
                </div>
              </div>
            )) : <p className="text-sm text-gray-500">No data for this region.</p>}
          </div>
        </div>

        {/* 3. Funding & Finance */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-500" />
            Funding Status
          </h3>
          <div className="space-y-1">
            <StatBar label="Active Loan" count={fundingCounts.yes_loan} total={totalProfiles} colorClass="bg-emerald-500" />
            <StatBar label="Active Grant" count={fundingCounts.yes_grant} total={totalProfiles} colorClass="bg-teal-500" />
            <StatBar label="Planning to Apply" count={fundingCounts.planning} total={totalProfiles} colorClass="bg-amber-500" />
            <StatBar label="No Funding" count={fundingCounts.no} total={totalProfiles} colorClass="bg-gray-400" />
          </div>
        </div>

        {/* 4. Business Growth */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            Performance vs Last Season
          </h3>
          <div className="space-y-1">
            <StatBar label="Increased >40%" count={performanceCounts.inc_40} total={totalProfiles} colorClass="bg-indigo-600" />
            <StatBar label="Increased >10%" count={performanceCounts.inc_10} total={totalProfiles} colorClass="bg-indigo-400" />
            <StatBar label="Stayed Same" count={performanceCounts.same} total={totalProfiles} colorClass="bg-gray-400" />
            <StatBar label="Reduced >10%" count={performanceCounts.dec_10} total={totalProfiles} colorClass="bg-rose-400" />
            <StatBar label="Reduced >50%" count={performanceCounts.dec_50} total={totalProfiles} colorClass="bg-rose-600" />
          </div>
        </div>

        {/* 5. Systems & Records */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            Financial Record Keeping
          </h3>
          <div className="space-y-1">
            <StatBar label="Fully Digital" count={recordsCounts.yes} total={totalProfiles} colorClass="bg-amber-500" />
            <StatBar label="Notebook/Somewhat" count={recordsCounts.somewhat} total={totalProfiles} colorClass="bg-orange-400" />
            <StatBar label="No Records" count={recordsCounts.no} total={totalProfiles} colorClass="bg-red-400" />
          </div>
        </div>

        {/* 6. Business Size */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-500" />
            Employee Size
          </h3>
          <div className="space-y-1">
            <StatBar label="Owner Only" count={employeeCounts.owner} total={totalProfiles} colorClass="bg-cyan-600" />
            <StatBar label="1-5 Employees" count={employeeCounts["1-5"]} total={totalProfiles} colorClass="bg-cyan-400" />
            <StatBar label="6-20 Employees" count={employeeCounts["6-20"]} total={totalProfiles} colorClass="bg-cyan-300" />
            <StatBar label="20+ Employees" count={employeeCounts["20+"]} total={totalProfiles} colorClass="bg-cyan-200" />
          </div>
        </div>

      </div>

      {/* Call to Action */}
      <div className="mt-8 pt-6 border-t border-gray-200 flex justify-center">
        <Link
          href="/generate"
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-bold hover:scale-105 transition-all shadow-lg"
        >
          <BookOpen className="w-5 h-5" />
          Proceed to BDS Lessons
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

    </div>
  );
}
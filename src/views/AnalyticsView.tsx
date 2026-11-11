import React, { useState } from 'react';
import { PortalStats, Project, ProblemStatement, Proposal, PocRecord, Vendor, MineComplexCode, AUTHORIZED_MINE_COMPLEXES } from '../types/index.js';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Building, 
  IndianRupee,
  RefreshCw,
  FileSpreadsheet,
  Clock,
  Layers,
  Award,
  ShieldCheck,
  Check,
  MapPin,
  Building2
} from 'lucide-react';

interface AnalyticsViewProps {
  stats: PortalStats;
  projects: Project[];
  problemStatements?: ProblemStatement[];
  proposals: Proposal[];
  pocs?: PocRecord[];
  vendors?: Vendor[];
  activeComplexCode?: MineComplexCode | 'ALL';
  onNavigateToSheets?: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  stats,
  projects,
  problemStatements = [],
  proposals = [],
  pocs = [],
  vendors = [],
  activeComplexCode = 'ALL',
  onNavigateToSheets,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'Q1' | 'Q2' | 'FY26' | 'All'>('All');
  const [selectedComplexFilter, setSelectedComplexFilter] = useState<string>(activeComplexCode);

  // Filter datasets strictly by selected complex
  const filteredProblems = problemStatements.filter(p => 
    selectedComplexFilter === 'ALL' || !p.mineComplexCode || p.mineComplexCode === selectedComplexFilter
  );
  const filteredProposals = proposals.filter(p => 
    selectedComplexFilter === 'ALL' || !p.mineComplexCode || p.mineComplexCode === selectedComplexFilter
  );
  const filteredPocs = pocs.filter(p => 
    selectedComplexFilter === 'ALL' || !p.mineComplexCode || p.mineComplexCode === selectedComplexFilter
  );
  const filteredProjects = projects.filter(p => 
    selectedComplexFilter === 'ALL' || !p.mineComplexCode || p.mineComplexCode === selectedComplexFilter
  );

  const hasData = filteredProblems.length > 0 || filteredProposals.length > 0 || filteredProjects.length > 0 || filteredPocs.length > 0;

  // Real Department Distribution - calculated strictly from database
  const deptMap: Record<string, number> = {};
  filteredProblems.forEach((p) => {
    if (p.department) {
      deptMap[p.department] = (deptMap[p.department] || 0) + 1;
    }
  });
  const deptList = Object.entries(deptMap).sort((a, b) => b[1] - a[1]);

  // Real Category Distribution - calculated strictly from database
  const catMap: Record<string, number> = {};
  filteredProblems.forEach((p) => {
    if (p.category) {
      catMap[p.category] = (catMap[p.category] || 0) + 1;
    }
  });
  const catList = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

  // Real Lifecycle Stages Funnel
  const funnelStages = [
    { label: 'Problem Statements Raised', count: filteredProblems.length, color: 'bg-blue-600' },
    { label: 'Department Scrutiny Approved', count: filteredProblems.filter(p => p.status !== 'Draft' && p.status !== 'Submitted').length, color: 'bg-indigo-600' },
    { label: 'Published for Offers', count: filteredProblems.filter(p => p.status === 'Published' || p.status === 'Vendor Participation').length, color: 'bg-purple-600' },
    { label: 'Vendor Offers Received', count: filteredProposals.length, color: 'bg-cyan-600' },
    { label: 'Technical Qualifications', count: filteredProposals.filter(pr => pr.technicalComplianceStatus === 'Compliant').length, color: 'bg-teal-600' },
    { label: 'PoC Field Trials Initiated', count: filteredPocs.length, color: 'bg-amber-600' },
    { label: 'Sanctioned Work Orders', count: filteredProjects.length, color: 'bg-emerald-600' },
  ];

  // Real Projects Health Summary
  const onTrackCount = filteredProjects.filter(p => p.health === 'On Track').length;
  const atRiskCount = filteredProjects.filter(p => p.health === 'At Risk').length;
  const delayedCount = filteredProjects.filter(p => p.health === 'Delayed').length;

  // Real Financial Figures
  const totalSanctionedCr = filteredProjects.reduce((acc, p) => acc + (p.approvedValueCr || 0), 0);
  const totalActualCr = filteredProjects.reduce((acc, p) => acc + (p.actualExpenditureCr || 0), 0);

  // Real PoC Field Success Rate
  const pocsCompleted = filteredPocs.filter(p => p.status === 'Successful' || p.status === 'Closed' || p.progressPct === 100).length;
  const pocSuccessPct = filteredPocs.length > 0 ? Math.round((pocsCompleted / filteredPocs.length) * 100) : 0;

  // Real Vendor MSME Ratio
  const msmeCount = vendors.filter(v => v.msmeStatus).length;
  const msmePct = vendors.length > 0 ? Math.round((msmeCount / vendors.length) * 100) : 0;

  const activeComplexObj = AUTHORIZED_MINE_COMPLEXES.find(c => c.code === selectedComplexFilter);

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-800 text-blue-200 uppercase tracking-wider">
                SECTION 21 · MANAGEMENT ANALYTICS
              </span>
              <span className="text-xs text-slate-400">
                {selectedComplexFilter === 'ALL' ? 'All Complexes' : activeComplexObj?.name}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Executive Analytics & Performance Insights
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Transparent, deterministic indicators calculated strictly from database records without estimation or extrapolation.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700">
            {(['All', 'FY26', 'Q1', 'Q2'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedTimeframe === tf
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Complex Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedComplexFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            selectedComplexFilter === 'ALL'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>All 4 Complexes</span>
        </button>

        {AUTHORIZED_MINE_COMPLEXES.map((complex) => {
          const isActive = selectedComplexFilter === complex.code;
          return (
            <button
              key={complex.code}
              onClick={() => setSelectedComplexFilter(complex.code)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{complex.name}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Top Line Operational Indicators - Calculated strictly from DB records */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Sanctioned Capital
          </span>
          <div className="text-2xl font-black text-slate-900">₹ {totalSanctionedCr.toFixed(2)} Cr</div>
          <span className="text-[10px] text-slate-500 block">Actual Expenditure: ₹ {totalActualCr.toFixed(2)} Cr</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
            PoC Field Success Rate
          </span>
          <div className="text-2xl font-black text-emerald-700">{pocSuccessPct}%</div>
          <span className="text-[10px] text-emerald-700 block">
            {pocsCompleted} of {filteredPocs.length} trials completed
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-blue-200 bg-blue-50/20 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">
            Total Problem Statements
          </span>
          <div className="text-2xl font-black text-blue-700">{filteredProblems.length}</div>
          <span className="text-[10px] text-blue-700 block">
            {filteredProposals.length} vendor offers received
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider block">
            Active Projects Under Execution
          </span>
          <div className="text-2xl font-black text-indigo-700">
            {filteredProjects.length}
          </div>
          <span className="text-[10px] text-indigo-700 block">{onTrackCount} projects strictly on schedule</span>
        </div>
      </div>

      {!hasData ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 text-xs space-y-2">
          <BarChart3 className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-700 text-sm">No records available.</p>
          <p className="text-slate-400 text-xs">
            Performance charts and analytics will dynamically render as problem statements, vendor proposals, and project milestones are recorded in the database.
          </p>
        </div>
      ) : (
        <>
          {/* 3. Middle Section: Funnel & Department Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Lifecycle Conversion Funnel */}
            <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Enterprise Lifecycle Funnel
                  </h3>
                  <p className="text-[11px] text-slate-500">From Operational Problem to Production Commissioning</p>
                </div>
                <span className="text-xs font-mono font-bold text-slate-500">DATABASE METRICS</span>
              </div>

              <div className="space-y-3 pt-2">
                {funnelStages.map((stg, idx) => {
                  const maxCount = Math.max(funnelStages[0].count, 1);
                  const pct = funnelStages[0].count > 0 ? Math.round((stg.count / maxCount) * 100) : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">{stg.label}</span>
                        <span className="font-mono font-bold text-slate-900">{stg.count}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${stg.color} transition-all duration-500`}
                          style={{ width: `${Math.max(pct, stg.count > 0 ? 5 : 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Department-wise Problem Statement Distribution */}
            <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Departmental Origin of Requirements
                  </h3>
                  <p className="text-[11px] text-slate-500">Distribution across active operational wings</p>
                </div>
                <Building className="w-4 h-4 text-blue-600" />
              </div>

              <div className="space-y-3 pt-2">
                {deptList.length === 0 ? (
                  <p className="text-slate-400 italic py-4 text-center">No problem statements recorded yet.</p>
                ) : (
                  deptList.map(([dept, count], idx) => {
                    const total = deptList.reduce((acc, curr) => acc + curr[1], 0);
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700 truncate max-w-xs">{dept}</span>
                          <span className="font-mono font-bold text-slate-900">{count} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-blue-700 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* 4. Bottom Section: Project Health Matrix & Vendor Scorecard Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
            {/* Project Health Status */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                Execution Health Status
              </h3>
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-emerald-900">On Track</span>
                  </div>
                  <span className="font-mono font-black text-emerald-800 text-base">{onTrackCount}</span>
                </div>

                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-amber-900">At Risk</span>
                  </div>
                  <span className="font-mono font-black text-amber-800 text-base">{atRiskCount}</span>
                </div>

                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span className="font-bold text-rose-900">Critical Delays</span>
                  </div>
                  <span className="font-mono font-black text-rose-800 text-base">{delayedCount}</span>
                </div>
              </div>
            </div>

            {/* Operational Categories */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                Technology Categories
              </h3>
              <div className="space-y-2">
                {catList.length === 0 ? (
                  <p className="text-slate-400 italic py-2 text-center">No categories recorded yet.</p>
                ) : (
                  catList.map(([cat, val], idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                      <span className="text-slate-700 font-medium truncate max-w-[200px]">{cat}</span>
                      <span className="font-mono font-bold text-slate-900 px-2 py-0.5 rounded bg-white border border-slate-200">
                        {val}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Vendor Ecosystem Insights */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                Vendor Ecosystem
              </h3>
              <p className="text-slate-500 text-[11px]">
                Statistics calculated from registered industrial vendors.
              </p>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Total Registered Vendors</span>
                  <span className="font-bold text-blue-700 font-mono">{vendors.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Active MSME Proportion</span>
                  <span className="font-bold text-purple-700 font-mono">{msmePct}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Active Field Trials</span>
                  <span className="font-bold text-emerald-700 font-mono">{filteredPocs.length}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

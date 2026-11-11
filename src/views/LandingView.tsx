import React, { useState } from 'react';
import { PortalStats, ProblemStatement } from '../types/index.js';
import { 
  ArrowRight, 
  Briefcase, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  IndianRupee, 
  Building2, 
  FileText, 
  Bell, 
  ChevronRight,
  ExternalLink,
  Award,
  Layers,
  MapPin,
  Calendar,
  Users
} from 'lucide-react';

interface LandingViewProps {
  stats: PortalStats;
  problemStatements: ProblemStatement[];
  onNavigateTab: (tab: string) => void;
  onOpenCreateProblem: () => void;
  onOpenRegisterVendor: () => void;
  onSelectProblemStatement: (ps: ProblemStatement) => void;
  onOpenLogin: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  stats,
  problemStatements,
  onNavigateTab,
  onOpenCreateProblem,
  onOpenRegisterVendor,
  onSelectProblemStatement,
  onOpenLogin,
}) => {
  const publishedOpportunities = problemStatements.filter(
    (p) => p.status === 'Published' || p.status === 'Vendor Participation'
  );

  return (
    <div className="space-y-10 pb-16">
      {/* 1. HERO BANNER WITH OFFICIAL MANDATED TITLE & SUBTITLE */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-blue-900 text-white shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-4xl p-8 sm:p-12 lg:p-14 space-y-5">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-300 bg-amber-500/20 px-3 py-1 rounded-md border border-amber-400/30">
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            <span>NMDC LIMITED · ENTERPRISE WORKFLOW MANAGEMENT PORTAL</span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              NMDC PROBLEM STATEMENT & VENDOR SOLUTION PORTAL
            </h1>
            <p className="text-base sm:text-xl text-blue-200 mt-2 font-medium">
              "Connecting NMDC's Operational Requirements with Innovative Industrial Solutions."
            </p>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed font-normal">
            Facilitating the complete lifecycle of operational problem statements raised by NMDC mining complexes and plants—inviting budgetary offers, conducting transparent technical evaluations, supervising Proof of Concept (PoC) field trials, processing procurement decisions, and monitoring turnkey project execution.
          </p>

          {/* Quick CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigateTab('problems')}
              className="px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              <Briefcase className="w-4 h-4 text-slate-950" />
              <span>Explore Open Opportunities</span>
            </button>

            <button
              onClick={onOpenRegisterVendor}
              className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-700 hover:bg-blue-600 rounded-xl border border-blue-500 shadow-sm transition-all flex items-center gap-2"
            >
              <span>Vendor Registration</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenCreateProblem}
              className="px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700 transition-all flex items-center gap-2"
            >
              <span>Raise Problem Statement</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. STATUTORY METRICS DISPLAY (8 MANDATED STATS PER SECTION 4) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-700" />
            <span>Portal Operational Statistics & Real-Time Metrics</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">Calculated from Live Relational Records</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {/* Stat 1: Total Problem Statements */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Problem Statements</span>
            <span className="text-xl sm:text-2xl font-extrabold text-blue-700 font-mono mt-1 block">
              {stats.totalProblemStatements}
            </span>
            <span className="text-[10px] text-slate-400">All registered challenges</span>
          </div>

          {/* Stat 2: Open Opportunities */}
          <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">Open Opportunities</span>
            <span className="text-xl sm:text-2xl font-extrabold text-emerald-700 font-mono mt-1 block">
              {stats.openOpportunities}
            </span>
            <span className="text-[10px] text-emerald-700/80">Active for offers</span>
          </div>

          {/* Stat 3: Registered Vendors */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Registered Vendors</span>
            <span className="text-xl sm:text-2xl font-extrabold text-slate-800 font-mono mt-1 block">
              {stats.registeredVendors}
            </span>
            <span className="text-[10px] text-slate-400">Verified vendors</span>
          </div>

          {/* Stat 4: Budgetary Offers Received */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Budgetary Offers</span>
            <span className="text-xl sm:text-2xl font-extrabold text-indigo-700 font-mono mt-1 block">
              {stats.budgetaryOffersReceived}
            </span>
            <span className="text-[10px] text-slate-400">Proposals received</span>
          </div>

          {/* Stat 5: PoCs Completed */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">PoCs Completed</span>
            <span className="text-xl sm:text-2xl font-extrabold text-teal-700 font-mono mt-1 block">
              {stats.pocsCompleted}
            </span>
            <span className="text-[10px] text-slate-400">Successful trials</span>
          </div>

          {/* Stat 6: Projects Awarded */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Projects Awarded</span>
            <span className="text-xl sm:text-2xl font-extrabold text-amber-700 font-mono mt-1 block">
              {stats.projectsAwarded}
            </span>
            <span className="text-[10px] text-slate-400">LOAs / Contracts</span>
          </div>

          {/* Stat 7: Projects Under Execution */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Under Execution</span>
            <span className="text-xl sm:text-2xl font-extrabold text-blue-900 font-mono mt-1 block">
              {stats.projectsUnderExecution}
            </span>
            <span className="text-[10px] text-slate-400">Active 12-stage projects</span>
          </div>

          {/* Stat 8: Projects Completed */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Projects Completed</span>
            <span className="text-xl sm:text-2xl font-extrabold text-purple-700 font-mono mt-1 block">
              {stats.projectsCompleted}
            </span>
            <span className="text-[10px] text-slate-400">Closure & FAC verified</span>
          </div>
        </div>
      </section>

      {/* 3. FOUR MINE MODULES STRIPE */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-700" />
            <span>Four Operating Mine & Production Complexes</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">Dedicated Modules</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-400 transition-all space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                MODULE 1
              </span>
              <span className="text-[11px] font-bold text-slate-400 font-mono">DIOM</span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Donimalai Iron Ore Mine</h3>
            <p className="text-slate-500 text-xs">Bellary District, Karnataka</p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                {problemStatements.filter(p => p.mineComplexCode === 'DIOM').length} Problems
              </span>
              <button 
                onClick={() => onNavigateTab('problems')}
                className="text-blue-700 font-bold hover:underline"
              >
                Explore →
              </button>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-400 transition-all space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                MODULE 2
              </span>
              <span className="text-[11px] font-bold text-slate-400 font-mono">KIOM</span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Kumaraswamy Iron Ore Mine</h3>
            <p className="text-slate-500 text-xs">Sandur / Bellary, Karnataka</p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                {problemStatements.filter(p => p.mineComplexCode === 'KIOM').length} Problems
              </span>
              <button 
                onClick={() => onNavigateTab('problems')}
                className="text-blue-700 font-bold hover:underline"
              >
                Explore →
              </button>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-400 transition-all space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                MODULE 3
              </span>
              <span className="text-[11px] font-bold text-slate-400 font-mono">BCH</span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Bacheli Complex</h3>
            <p className="text-slate-500 text-xs">Bailadila Deposit 14 & 11C, Chhattisgarh</p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                {problemStatements.filter(p => p.mineComplexCode === 'BCH').length} Problems
              </span>
              <button 
                onClick={() => onNavigateTab('problems')}
                className="text-blue-700 font-bold hover:underline"
              >
                Explore →
              </button>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-400 transition-all space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                MODULE 4
              </span>
              <span className="text-[11px] font-bold text-slate-400 font-mono">KDL</span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Kirandul Complex</h3>
            <p className="text-slate-500 text-xs">Bailadila Deposit 5 & 10, Chhattisgarh</p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                {problemStatements.filter(p => p.mineComplexCode === 'KDL').length} Problems
              </span>
              <button 
                onClick={() => onNavigateTab('problems')}
                className="text-blue-700 font-bold hover:underline"
              >
                Explore →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. LATEST PUBLISHED OPPORTUNITIES SECTION */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-700" />
              <span>Open Problem Statements & Opportunities</span>
            </h2>
            <p className="text-xs text-slate-500">
              Open for registered vendor participation, query clarifications and budgetary offer submissions.
            </p>
          </div>
          {problemStatements.length > 0 && (
            <button
              onClick={() => onNavigateTab('problems')}
              className="text-xs font-bold text-blue-700 hover:text-blue-800 hover:underline flex items-center gap-1"
            >
              <span>View All ({problemStatements.length})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {publishedOpportunities.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 text-xs space-y-2">
            <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700 text-sm">
              No open problem statements are currently available.
            </p>
            <p className="text-slate-400 text-xs">
              Registered NMDC executives can submit new operational requirements through the Executive Dashboard.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {publishedOpportunities.slice(0, 4).map((ps) => (
              <div
                key={ps.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {ps.code}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {ps.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug">
                    {ps.title}
                  </h3>

                  <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">
                    {ps.detailedProblemStatement}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{ps.department}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{ps.projectComplex}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Indicative: <strong className="text-slate-700">{ps.indicativeBudget}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Deadline: <strong className="text-slate-700">{ps.submissionDeadline}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {ps.respondedVendorsCount || 0} Offers Received
                  </span>

                  <button
                    onClick={() => {
                      onSelectProblemStatement(ps);
                    }}
                    className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <span>Submit Solution & Offer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. ABOUT PORTAL & PS WORKFLOW LIFECYCLE SECTION */}
      <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
        <div>
          <span className="font-mono text-blue-700 font-bold uppercase text-[11px] tracking-wider block">
            GOVERNANCE & TRANSPARENCY
          </span>
          <h3 className="text-xl font-bold text-slate-900 mt-0.5">
            End-to-End Enterprise Problem Statement & Procurement Lifecycle
          </h3>
          <p className="text-xs text-slate-600 max-w-3xl mt-1">
            NMDC operational requirements undergo rigorous departmental scrutiny, transparent vendor proposal participation, structured parameter evaluations, and verified PoC field trials before final contract sanction.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
            <span className="font-mono text-blue-700 font-bold text-[10px]">STAGE 1</span>
            <strong className="block text-slate-800">Problem Statement</strong>
            <span className="text-slate-500 text-[11px] leading-tight block">
              Originating officer drafts detailed bottleneck and equipment specs.
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
            <span className="font-mono text-blue-700 font-bold text-[10px]">STAGE 2</span>
            <strong className="block text-slate-800">Scrutiny & Approval</strong>
            <span className="text-slate-500 text-[11px] leading-tight block">
              Department Head and Competent Authority vet and sanction publication.
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
            <span className="font-mono text-blue-700 font-bold text-[10px]">STAGE 3</span>
            <strong className="block text-slate-800">Vendor Offers</strong>
            <span className="text-slate-500 text-[11px] leading-tight block">
              Registered vendors submit Part A Technical & Part B Itemized Costing.
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
            <span className="font-mono text-blue-700 font-bold text-[10px]">STAGE 4</span>
            <strong className="block text-slate-800">Technical Evaluation</strong>
            <span className="text-slate-500 text-[11px] leading-tight block">
              Committee scores compliance across standard parameters.
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
            <span className="font-mono text-blue-700 font-bold text-[10px]">STAGE 5</span>
            <strong className="block text-slate-800">Proof of Concept (PoC)</strong>
            <span className="text-slate-500 text-[11px] leading-tight block">
              Field trials verify accuracy, uptime and operating durability on mine sites.
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
            <span className="font-mono text-blue-700 font-bold text-[10px]">STAGE 6</span>
            <strong className="block text-slate-800">Award & Execution</strong>
            <span className="text-slate-500 text-[11px] leading-tight block">
              Sanction of LOA, PO, Contract and 12-stage milestone project tracking.
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};

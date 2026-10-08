import React from 'react';
import { PortalStats, ProblemStatement, UserRole } from '../types/index.js';
import { 
  ArrowRight, 
  Lightbulb, 
  Briefcase, 
  Cpu, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  Clock, 
  IndianRupee,
  FileCheck2,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface LandingViewProps {
  stats: PortalStats;
  problemStatements: ProblemStatement[];
  onNavigateTab: (tab: string) => void;
  onOpenSubmitIdea: () => void;
  onOpenRegisterVendor: () => void;
  onSelectProblemStatement: (ps: ProblemStatement) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  stats,
  problemStatements,
  onNavigateTab,
  onOpenSubmitIdea,
  onOpenRegisterVendor,
  onSelectProblemStatement,
}) => {
  const featuredChallenges = problemStatements.slice(0, 4);

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-white text-slate-900 shadow-md border border-blue-200/80">
        {/* Subtle Background Accent */}
        <div className="absolute right-0 top-0 bottom-0 w-full sm:w-2/3 opacity-25 pointer-events-none z-0">
          <img
            src="/src/assets/images/nmdc_mining_innovation_hero_1791202277822.jpg"
            alt="NMDC Open-Cast Iron Ore Mining at Bailadila"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-blue-50/80 to-transparent" />
        </div>

        <div className="relative z-10 max-w-4xl p-8 sm:p-12 lg:p-14 space-y-6">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-800 bg-blue-100/80 px-3 py-1.5 rounded-md border border-blue-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span>NMDC LIMITED · AI & DIGITAL INNOVATION ECOSYSTEM</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Transforming Mining Through AI, Digital Technology & Innovation
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed font-normal">
            A unified portal for NMDC executives, technology partners and vendors to identify operational bottlenecks, propose technical solutions, execute rigorous field pilots, and realize measurable business value across India's largest iron ore operations.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onOpenSubmitIdea}
              className="px-5 py-3 text-xs sm:text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-all flex items-center gap-2"
            >
              <Lightbulb className="w-4 h-4 text-amber-300" />
              <span>Submit an Idea</span>
            </button>
            <button
              onClick={() => onNavigateTab('challenges')}
              className="px-5 py-3 text-xs sm:text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 rounded-lg border border-slate-300 shadow-2xs transition-all flex items-center gap-2"
            >
              <Briefcase className="w-4 h-4 text-blue-700" />
              <span>View Opportunities</span>
            </button>
            <button
              onClick={onOpenRegisterVendor}
              className="px-5 py-3 text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 rounded-lg transition-all flex items-center gap-2"
            >
              <span>Register as Vendor</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Dashboard Statistics Counters */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Portal Operations & Impact Metrics
          </h2>
          <span className="text-xs text-slate-500">Live Database Figures</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-slate-500 text-xs block mb-1">Total Employee Ideas</span>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {stats.totalIdeas}
            </div>
            <span className="text-[11px] text-blue-700 font-medium mt-1 block">Active Pipeline</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-slate-500 text-xs block mb-1">Active Challenges</span>
            <div className="text-2xl font-bold text-blue-700 font-mono tabular-nums">
              {stats.activeChallenges}
            </div>
            <span className="text-[11px] text-slate-500 font-medium mt-1 block">Bailadila & Donimalai</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-slate-500 text-xs block mb-1">Registered Vendors</span>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {stats.registeredVendors}
            </div>
            <span className="text-[11px] text-emerald-700 font-medium mt-1 block">MSME & Industry AI</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-slate-500 text-xs block mb-1">Proposals Received</span>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {stats.proposalsReceived}
            </div>
            <span className="text-[11px] text-slate-500 font-medium mt-1 block">Technical & Commercial</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-slate-500 text-xs block mb-1">PoCs Under Execution</span>
            <div className="text-2xl font-bold text-amber-700 font-mono tabular-nums">
              {stats.pocsUnderExecution}
            </div>
            <span className="text-[11px] text-amber-700 font-medium mt-1 block">Field Sanctioned</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-slate-500 text-xs block mb-1">Projects in Progress</span>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {stats.projectsUnderImplementation}
            </div>
            <span className="text-[11px] text-slate-500 font-medium mt-1 block">Pilots & Full Rollout</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-slate-500 text-xs block mb-1">Completed Deployments</span>
            <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">
              {stats.projectsCompleted}
            </div>
            <span className="text-[11px] text-emerald-700 font-medium mt-1 block">Verified In Field</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-slate-500 text-xs block mb-1">Estimated Annual Savings</span>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              ₹ {stats.estimatedAnnualSavingsCr} Cr
            </div>
            <span className="text-[11px] text-blue-700 font-medium mt-1 block">Projected Business Case</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs bg-gradient-to-br from-emerald-50/50 to-white">
            <span className="text-emerald-900 text-xs font-semibold block mb-1">Realised Savings</span>
            <div className="text-2xl font-extrabold text-emerald-700 font-mono tabular-nums">
              ₹ {stats.realisedSavingsCr} Cr
            </div>
            <span className="text-[11px] text-emerald-800 font-medium mt-1 block">Bottom-line Savings</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-slate-500 text-xs block mb-1">AI Solutions Live</span>
            <div className="text-2xl font-bold text-blue-700 font-mono tabular-nums">
              {stats.aiSolutionsImplemented}
            </div>
            <span className="text-[11px] text-slate-500 font-medium mt-1 block">Across NMDC Complex</span>
          </div>
        </div>
      </section>

      {/* Core Innovation Lifecycle Workflow */}
      <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div>
          <span className="text-xs font-mono text-blue-700 font-semibold tracking-wider uppercase">
            END-TO-END DIGITAL GOVERNANCE
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
            NMDC Innovation Lifecycle & Procurement Flow
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Complete digital audit trail from field problem identification through vendor proposal, dual technical-commercial review, PoC execution and organization-wide scaling.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
          {[
            { step: '01', title: 'Problem / Idea', desc: 'NMDC executives submit site bottlenecks', icon: Lightbulb },
            { step: '02', title: 'Challenge Published', desc: 'Opportunities opened to registered vendors', icon: Briefcase },
            { step: '03', title: 'Vendor Offer', desc: 'Technical & budgetary offers submitted', icon: FileCheck2 },
            { step: '04', title: 'Dual Evaluation', desc: '70% Tech + 30% Commercial scoring', icon: ShieldCheck },
            { step: '05', title: 'PoC Sanction', desc: 'Fast-track pilot approval by committee', icon: CheckCircle2 },
            { step: '06', title: 'Implementation', desc: 'Gantt tracking, milestones & KPIs', icon: Layers },
            { step: '07', title: 'Benefits Realised', desc: 'Audited savings and NMDC-wide rollout', icon: TrendingUp },
          ].map((item) => (
            <div key={item.step} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 relative group hover:border-blue-500 transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold text-slate-400">{item.step}</span>
                <item.icon className="w-4 h-4 text-blue-700" />
              </div>
              <h4 className="font-bold text-slate-900 leading-snug">{item.title}</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Innovation Challenges */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Open Innovation Challenges & Problem Statements
            </h2>
            <p className="text-xs text-slate-500">
              Technology partners and vendors are invited to submit technical solutions and budgetary offers.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('challenges')}
            className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
          >
            <span>View All Challenges</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {featuredChallenges.map((ps) => (
            <div
              key={ps.id}
              onClick={() => onSelectProblemStatement(ps)}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono font-bold text-blue-700">{ps.code}</span>
                  <div className="flex items-center gap-2">
                    <span>{ps.department}</span>
                    <span aria-hidden="true">·</span>
                    <span>Deadline: {ps.submissionDeadline}</span>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-700 transition-colors leading-snug">
                  {ps.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {ps.problemDescription}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="text-[11px] text-slate-400 block">Indicative Budget</span>
                  <strong className="font-mono text-slate-900 font-bold">{ps.budgetaryIndication}</strong>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-[11px]">
                    <strong>{ps.respondedVendorsCount}</strong> proposals submitted
                  </span>
                  <span className="text-blue-700 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    <span>Review Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Strategic Innovation Focus Areas */}
      <section className="bg-gradient-to-br from-blue-50/70 via-slate-50 to-white text-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 border border-blue-200/80 shadow-xs">
        <div>
          <span className="text-xs font-mono text-blue-700 font-semibold uppercase tracking-wider">
            TECHNOLOGY ROADMAP
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
            Strategic Focus Domains for NMDC Mining Operations
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Key operational focus areas targeted for technology interventions and AI adoption across mines.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2 hover:border-blue-400 hover:shadow-xs transition-all">
            <h4 className="font-bold text-slate-900 text-sm">HEMM Predictive Telematics</h4>
            <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
              Real-time vibration, CAN-bus telemetry and oil condition monitoring for 100T dumpers and hydraulic shovels to prevent unscheduled breakdowns.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2 hover:border-blue-400 hover:shadow-xs transition-all">
            <h4 className="font-bold text-slate-900 text-sm">Autonomous Fleet Dispatch</h4>
            <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
              AI-based dynamic routing and queue optimization between shovels and primary crushers to slash dumper idle time and diesel consumption.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2 hover:border-blue-400 hover:shadow-xs transition-all">
            <h4 className="font-bold text-slate-900 text-sm">Dense Fog & Proximity Safety</h4>
            <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
              77GHz FMCW radar and thermal sensor fusion to ensure zero-collision mine operations during heavy monsoon fog on hilltop haul roads.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2 hover:border-blue-400 hover:shadow-xs transition-all">
            <h4 className="font-bold text-slate-900 text-sm">Beneficiation Plant Digital Twins</h4>
            <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
              Discrete element modeling and 3D simulation of crushing & screening plants (SP-1 & SP-2) to anticipate chute blockages before line trips.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2 hover:border-blue-400 hover:shadow-xs transition-all">
            <h4 className="font-bold text-slate-900 text-sm">BVLOS Drone Surveillance</h4>
            <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
              Automated autonomous drone-in-a-box patrols with LiDAR and thermal imaging for the 130 km slurry pipeline and tailings dam stability.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2 hover:border-blue-400 hover:shadow-xs transition-all">
            <h4 className="font-bold text-slate-900 text-sm">AI Ore Grade Estimation</h4>
            <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
              High-speed hyperspectral vision on overland conveyors to calculate iron ore Fe content and detect damaging tramp metal in under 200ms.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

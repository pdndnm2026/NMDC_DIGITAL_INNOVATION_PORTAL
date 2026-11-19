import React, { useState, useEffect } from 'react';
import {
  User,
  UserRole,
  PortalStats,
  ProblemStatement,
  BudgetaryOfferRequest,
  DiscussionThread,
  Proposal,
  Project,
  PocRecord,
  AwardOfWork,
  Vendor,
  MineComplexCode,
  MineComplex,
  DEFAULT_ORGANISATIONAL_UNITS,
} from '../types/index.js';
import {
  PlusCircle,
  FileText,
  Users,
  Rocket,
  BarChart3,
  Building2,
  ArrowRight,
  Lock,
  UserCheck,
} from 'lucide-react';
import { fetchApi } from '../utils/api.js';

interface ExecutiveDashboardViewProps {
  currentRole: UserRole;
  currentUser: User | null;
  stats: PortalStats;
  organisationalUnits?: MineComplex[];
  problemStatements: ProblemStatement[];
  budgetaryRequests?: BudgetaryOfferRequest[];
  discussions?: DiscussionThread[];
  proposals: Proposal[];
  projects: Project[];
  pocs: PocRecord[];
  awards: AwardOfWork[];
  vendors: Vendor[];
  activeComplexCode: MineComplexCode | 'ALL';
  setActiveComplexCode: (code: MineComplexCode | 'ALL') => void;
  showDemoData?: boolean;
  hasDemoData?: boolean;
  onNavigateTab: (tab: string) => void;
  onOpenCreateProblem: () => void;
  onSelectProblemStatement: (ps: ProblemStatement) => void;
  onSelectProposal: (prop: Proposal) => void;
  onRefreshData: () => void;
}

export const ExecutiveDashboardView: React.FC<ExecutiveDashboardViewProps> = ({
  currentRole,
  currentUser,
  organisationalUnits = DEFAULT_ORGANISATIONAL_UNITS,
  problemStatements,
  budgetaryRequests = [],
  discussions = [],
  proposals,
  projects,
  pocs,
  awards,
  vendors,
  activeComplexCode,
  setActiveComplexCode,
  onNavigateTab,
  onOpenCreateProblem,
  onSelectProblemStatement,
  onRefreshData,
}) => {
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loadingApprovals, setLoadingApprovals] = useState(false);

  const isCorporateAdmin = currentRole === 'admin';
  const hasCorporateView =
    isCorporateAdmin ||
    currentRole === 'approving_authority' ||
    !currentUser?.mineComplexCode ||
    currentUser?.mineComplexCode === 'ALL' ||
    currentUser?.mineComplexCode === 'HO';
  const userAssignedComplex = currentUser?.mineComplexCode || 'ALL';

  useEffect(() => {
    if (isCorporateAdmin) {
      fetchApi('/api/admin/pending-users')
        .then((res) => {
          if (res.success) setPendingUsers(res.users || []);
        })
        .catch(() => {});
    }
  }, [isCorporateAdmin]);

  const handleApproveUser = async (userId: string) => {
    setLoadingApprovals(true);
    try {
      const res = await fetchApi(`/api/admin/users/${userId}/approve`, { method: 'POST' });
      if (res.success) {
        setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
        onRefreshData();
      }
    } finally {
      setLoadingApprovals(false);
    }
  };

  const filterByComplex = <T extends { mineComplexCode?: string }>(items: T[]): T[] =>
    activeComplexCode === 'ALL' ? items : items.filter((item) => item.mineComplexCode === activeComplexCode);

  const activeProblems = filterByComplex(problemStatements);
  const activeBors = filterByComplex(budgetaryRequests);
  const activeDiscussions = filterByComplex(discussions);
  const activeProposals = filterByComplex(proposals);
  const activePocs = filterByComplex(pocs);
  const activeAwards = filterByComplex(awards);
  const activeProjects = filterByComplex(projects);

  const activeUnit = organisationalUnits.find((u) => u.code === activeComplexCode);
  const canAccessUnit = (code: MineComplexCode) => hasCorporateView || userAssignedComplex === code;

  return (
    <div className="space-y-8 pb-12">
      {/* 1. SIMPLE HERO HEADER + 4 CLEAN KPI NUMBERS */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-blue-700">
              {activeComplexCode === 'ALL' ? 'Consolidated Workspace · All 5 Units' : activeUnit?.name || activeComplexCode}
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
              NMDC Operations &amp; Vendor Portal
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {currentUser?.name} · {currentUser?.designation || 'Authorized Officer'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {hasCorporateView && activeComplexCode !== 'ALL' && (
              <button
                onClick={() => setActiveComplexCode('ALL')}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors"
              >
                Show All 5 Units
              </button>
            )}
            {(currentRole === 'executive' || currentRole === 'dept_head' || currentRole === 'approving_authority' || currentRole === 'admin') && (
              <button
                onClick={onOpenCreateProblem}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Problem Statement</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Clean Summary KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 block">Problem Statements</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{activeProblems.length}</span>
            <span className="text-[11px] text-slate-500">Operational requirements</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 block">Budgetary Requests</span>
            <span className="text-2xl font-black text-blue-700 mt-1 block">{activeBors.length}</span>
            <span className="text-[11px] text-slate-500">{activeProposals.length} vendor responses</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 block">PoC &amp; Awards</span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">
              {activePocs.length} / {activeAwards.length}
            </span>
            <span className="text-[11px] text-slate-500">Field trials / contracts</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 block">Active Projects</span>
            <span className="text-2xl font-black text-indigo-700 mt-1 block">{activeProjects.length}</span>
            <span className="text-[11px] text-slate-500">12-stage monitoring</span>
          </div>
        </div>
      </section>

      {/* Pending Approvals Alert (Shown only to Admin when pending users exist) */}
      {isCorporateAdmin && pendingUsers.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-amber-700 shrink-0" />
            <div>
              <div className="text-xs font-bold text-amber-950">
                {pendingUsers.length} Employee Registration(s) Awaiting Activation
              </div>
              <div className="text-[11px] text-amber-800">
                Latest: {pendingUsers[0].name} (SAP {pendingUsers[0].employeeId} · {pendingUsers[0].mineComplexCode})
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={loadingApprovals}
              onClick={() => handleApproveUser(pendingUsers[0].id)}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg"
            >
              Approve {pendingUsers[0].employeeId}
            </button>
            <button
              onClick={() => onNavigateTab('admin')}
              className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 text-xs font-bold rounded-lg hover:bg-amber-100"
            >
              Open Admin Queue
            </button>
          </div>
        </div>
      )}

      {/* 2. FUNCTIONAL WORKFLOW CLUSTERS (4 Clean Cards) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            Portal Functional Clusters
          </h2>
          <span className="text-xs text-slate-500">Select a cluster module directly</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Cluster A */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between space-y-4 hover:border-blue-300 transition-colors">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">1. Requirements &amp; BOR</h3>
              <p className="text-xs text-slate-500">
                {activeProblems.length} Problems · {activeBors.length} BORs · {activeDiscussions.length} Discussions
              </p>
            </div>
            <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
              <button onClick={() => onNavigateTab('problems')} className="w-full flex items-center justify-between py-1 text-blue-700 font-semibold hover:underline">
                <span>Problem Statements</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onNavigateTab('budgetary')} className="w-full flex items-center justify-between py-1 text-slate-700 font-medium hover:text-blue-700">
                <span>Budgetary Offer Requests</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onNavigateTab('discussions')} className="w-full flex items-center justify-between py-1 text-slate-700 font-medium hover:text-blue-700">
                <span>Clarifications Chat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Cluster B */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-colors">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">2. Vendors &amp; Evaluation</h3>
              <p className="text-xs text-slate-500">
                {vendors.length} Registered Vendors · {activeProposals.length} Vendor Offers
              </p>
            </div>
            <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
              <button onClick={() => onNavigateTab('vendors')} className="w-full flex items-center justify-between py-1 text-emerald-700 font-semibold hover:underline">
                <span>Registered Vendors</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onNavigateTab('proposals')} className="w-full flex items-center justify-between py-1 text-slate-700 font-medium hover:text-emerald-700">
                <span>Vendor Responses</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onNavigateTab('evaluation')} className="w-full flex items-center justify-between py-1 text-slate-700 font-medium hover:text-emerald-700">
                <span>Technical &amp; Commercial Eval</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Cluster C */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-colors">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <Rocket className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">3. PoC &amp; Execution</h3>
              <p className="text-xs text-slate-500">
                {activePocs.length} PoC Trials · {activeAwards.length} Awards · {activeProjects.length} Projects
              </p>
            </div>
            <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
              <button onClick={() => onNavigateTab('pocs')} className="w-full flex items-center justify-between py-1 text-indigo-700 font-semibold hover:underline">
                <span>PoC Management</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onNavigateTab('awards')} className="w-full flex items-center justify-between py-1 text-slate-700 font-medium hover:text-indigo-700">
                <span>Award of Work</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onNavigateTab('projects')} className="w-full flex items-center justify-between py-1 text-slate-700 font-medium hover:text-indigo-700">
                <span>Project Monitoring</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Cluster D */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between space-y-4 hover:border-amber-300 transition-colors">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">4. MIS &amp; Governance</h3>
              <p className="text-xs text-slate-500">
                6 MIS Report Suites · SAP Employee Master · Audit Logs
              </p>
            </div>
            <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
              <button onClick={() => onNavigateTab('mis_reports')} className="w-full flex items-center justify-between py-1 text-amber-800 font-semibold hover:underline">
                <span>MIS Reports &amp; Excel</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              {isCorporateAdmin && (
                <button onClick={() => onNavigateTab('employee_master')} className="w-full flex items-center justify-between py-1 text-slate-700 font-medium hover:text-amber-800">
                  <span>Employee Master</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              <button onClick={() => onNavigateTab('mines')} className="w-full flex items-center justify-between py-1 text-slate-700 font-medium hover:text-amber-800">
                <span>5 Organisational Units</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ORGANISATIONAL UNIT CLUSTERS (5 CLEAN UNIT TILES) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-700" />
            <span>Organisational Unit Clusters (5 Units)</span>
          </h2>
          {hasCorporateView && (
            <button
              onClick={() => setActiveComplexCode('ALL')}
              className={`text-xs font-bold ${
                activeComplexCode === 'ALL' ? 'text-blue-700' : 'text-slate-500 hover:text-blue-700'
              }`}
            >
              View All Consolidated →
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {organisationalUnits.map((unit) => {
            const allowed = canAccessUnit(unit.code);
            const selected = activeComplexCode === unit.code;
            const unitPs = problemStatements.filter((p) => p.mineComplexCode === unit.code).length;
            const unitPrj = projects.filter((p) => p.mineComplexCode === unit.code).length;

            return (
              <button
                key={unit.code}
                disabled={!allowed}
                onClick={() => allowed && setActiveComplexCode(unit.code)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  !allowed
                    ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                    : selected
                    ? 'bg-blue-50 border-blue-600 ring-1 ring-blue-600'
                    : 'bg-white border-slate-200 hover:border-blue-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-extrabold text-blue-800">{unit.code}</span>
                  {!allowed && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                </div>
                <div className="font-bold text-slate-900 text-xs mt-1 truncate">{unit.shortLabel || unit.name}</div>
                <div className="text-[11px] text-slate-500 truncate">{unit.location}</div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                  <span>{unitPs} Problems</span>
                  <span>{unitPrj} Projects</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. RECENT PROBLEM STATEMENTS (CLEAN SIMPLE TABLE) */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
            Recent Operational Problem Statements
          </h3>
          <button
            onClick={() => onNavigateTab('problems')}
            className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
          >
            <span>Open Register ({activeProblems.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50/70 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">ID</th>
                <th className="py-2.5 px-4">Problem Title</th>
                <th className="py-2.5 px-4">Unit</th>
                <th className="py-2.5 px-4">Budget</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeProblems.slice(0, 5).map((ps) => (
                <tr key={ps.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">{ps.code}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900 max-w-md truncate">{ps.title}</td>
                  <td className="py-3 px-4 font-mono text-slate-700">{ps.mineComplexCode}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">{ps.indicativeBudget}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold">
                      {ps.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        onSelectProblemStatement(ps);
                        onNavigateTab('problems');
                      }}
                      className="text-blue-700 font-bold hover:underline"
                    >
                      Open →
                    </button>
                  </td>
                </tr>
              ))}
              {activeProblems.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No records available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

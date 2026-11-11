import React, { useState, useEffect } from 'react';
import { 
  User, 
  UserRole, 
  PortalStats, 
  ProblemStatement, 
  Proposal, 
  Project, 
  PocRecord, 
  AwardOfWork,
  Vendor,
  MineComplexCode,
  MineComplex,
  AUTHORIZED_MINE_COMPLEXES
} from '../types/index.js';
import { 
  PlusCircle, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Briefcase, 
  TrendingUp, 
  Layers, 
  ShieldCheck, 
  FileCheck, 
  ArrowRight,
  Filter,
  Users,
  Search,
  Building2,
  Lock,
  Check,
  X,
  UserCheck
} from 'lucide-react';
import { fetchApi } from '../utils/api.js';

interface ExecutiveDashboardViewProps {
  currentRole: UserRole;
  currentUser: User | null;
  stats: PortalStats;
  problemStatements: ProblemStatement[];
  proposals: Proposal[];
  projects: Project[];
  pocs: PocRecord[];
  awards: AwardOfWork[];
  vendors: Vendor[];
  activeComplexCode: MineComplexCode | 'ALL';
  setActiveComplexCode: (code: MineComplexCode | 'ALL') => void;
  onNavigateTab: (tab: string) => void;
  onOpenCreateProblem: () => void;
  onSelectProblemStatement: (ps: ProblemStatement) => void;
  onSelectProposal: (prop: Proposal) => void;
  onRefreshData: () => void;
}

export const ExecutiveDashboardView: React.FC<ExecutiveDashboardViewProps> = ({
  currentRole,
  currentUser,
  stats,
  problemStatements,
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
  onSelectProposal,
  onRefreshData,
}) => {
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [pendingVendors, setPendingVendors] = useState<Vendor[]>([]);
  const [loadingApprovals, setLoadingApprovals] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // Determine user access permission to active complex
  const isCorporateAdmin = currentRole === 'admin';
  const userAssignedComplex = currentUser?.mineComplexCode || 'ALL';

  // Load pending registrations if admin
  useEffect(() => {
    if (isCorporateAdmin) {
      loadPendingUsers();
    }
  }, [isCorporateAdmin]);

  const loadPendingUsers = async () => {
    try {
      const res = await fetchApi('/api/admin/pending-users');
      if (res.success) {
        setPendingUsers(res.users || []);
        setPendingVendors(res.vendors || []);
      }
    } catch {}
  };

  const handleApproveUser = async (userId: string) => {
    setLoadingApprovals(true);
    try {
      const res = await fetchApi(`/api/admin/users/${userId}/approve`, { method: 'POST' });
      if (res.success) {
        setActionMessage(res.message || 'User activated successfully.');
        loadPendingUsers();
        onRefreshData();
      }
    } catch (err: any) {
      setActionMessage(err.message || 'Failed to activate user.');
    } finally {
      setLoadingApprovals(false);
    }
  };

  const handleRejectUser = async (userId: string) => {
    setLoadingApprovals(true);
    try {
      const res = await fetchApi(`/api/admin/users/${userId}/reject`, { method: 'POST' });
      if (res.success) {
        setActionMessage(res.message || 'User rejected.');
        loadPendingUsers();
        onRefreshData();
      }
    } catch (err: any) {
      setActionMessage(err.message || 'Failed to reject user.');
    } finally {
      setLoadingApprovals(false);
    }
  };

  // Filter records by selected mine complex (or ALL if corporate admin selects ALL)
  const filterByComplex = <T extends { mineComplexCode?: string }>(items: T[]): T[] => {
    if (activeComplexCode === 'ALL') return items;
    return items.filter((item) => item.mineComplexCode === activeComplexCode);
  };

  const activeProblemStatements = filterByComplex(problemStatements);
  const activeProposals = filterByComplex(proposals);
  const activePocs = filterByComplex(pocs);
  const activeAwards = filterByComplex(awards);
  const activeProjects = filterByComplex(projects);

  const pendingApprovals = activeProblemStatements.filter(
    (ps) => ps.status === 'Submitted' || ps.status === 'Department Review' || ps.status === 'Approval'
  );

  const activeComplexObj = AUTHORIZED_MINE_COMPLEXES.find((mc) => mc.code === activeComplexCode);

  const canAccessComplex = (code: MineComplexCode): boolean => {
    if (isCorporateAdmin || userAssignedComplex === 'ALL') return true;
    return userAssignedComplex === code;
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-800 text-blue-200 border border-blue-700 font-mono">
                {currentRole.toUpperCase()}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {currentUser?.employeeId || currentUser?.vendorId || 'NMDC'}
              </span>
              {userAssignedComplex !== 'ALL' && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-900/60 text-amber-300 border border-amber-700">
                  Assigned Complex: {userAssignedComplex}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {activeComplexCode === 'ALL'
                ? 'Corporate Consolidated Command Center'
                : `${activeComplexObj?.name || activeComplexCode} Dashboard`}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {currentUser?.name} · {currentUser?.designation || 'Authorized User'} · {currentUser?.department || 'NMDC Limited'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {(currentRole === 'executive' || currentRole === 'dept_head' || currentRole === 'approving_authority' || currentRole === 'admin') && (
              <button
                onClick={onOpenCreateProblem}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Problem Statement</span>
              </button>
            )}

            <button
              onClick={() => onNavigateTab('reports')}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
            >
              <FileText className="w-4 h-4 text-slate-300" />
              <span>Statutory Registers</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. PROMINENT MINE-WISE MODULE CARDS (Section 4) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Four Operating Mine / Complex Modules (Section 4)
            </h2>
            <p className="text-[11px] text-slate-500">
              Select an authorized mine complex to enter its independent dashboard and records.
            </p>
          </div>

          {isCorporateAdmin && (
            <button
              onClick={() => setActiveComplexCode('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                activeComplexCode === 'ALL'
                  ? 'bg-blue-700 text-white border-blue-700 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Consolidated Corporate View (All 4 Complexes)
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {AUTHORIZED_MINE_COMPLEXES.map((mc, idx) => {
            const hasAccess = canAccessComplex(mc.code);
            const isSelected = activeComplexCode === mc.code;

            // Actual calculated counts from the database for this specific complex
            const complexProblems = problemStatements.filter((p) => p.mineComplexCode === mc.code);
            const complexProposals = proposals.filter((p) => p.mineComplexCode === mc.code);
            const complexAwards = awards.filter((a) => a.mineComplexCode === mc.code);
            const complexProjects = projects.filter((proj) => proj.mineComplexCode === mc.code);

            return (
              <div
                key={mc.code}
                onClick={() => {
                  if (hasAccess) {
                    setActiveComplexCode(mc.code);
                  }
                }}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  !hasAccess
                    ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed'
                    : isSelected
                    ? 'bg-blue-50/70 border-blue-600 shadow-sm ring-2 ring-blue-600/20 cursor-pointer'
                    : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-xs cursor-pointer'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-amber-300">
                      MODULE {idx + 1}: {mc.code}
                    </span>
                    {!hasAccess ? (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                        <Lock className="w-3 h-3" />
                        Restricted
                      </span>
                    ) : isSelected ? (
                      <span className="text-[10px] text-blue-700 font-bold bg-blue-100 px-2 py-0.5 rounded">
                        Active Dashboard
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-semibold">
                        Click to Enter →
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">{mc.name}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{mc.location}</p>
                  </div>
                </div>

                {/* Actual Real Database Metrics */}
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Problems</span>
                    <span className="font-black text-slate-800 text-sm">{complexProblems.length}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Offers</span>
                    <span className="font-black text-slate-800 text-sm">{complexProposals.length}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Work Orders</span>
                    <span className="font-black text-slate-800 text-sm">{complexAwards.length}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Live Projects</span>
                    <span className="font-black text-slate-800 text-sm">{complexProjects.length}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. ADMINISTRATOR USER MANAGEMENT: PENDING REGISTRATIONS (Section 14) */}
      {isCorporateAdmin && (pendingUsers.length > 0 || pendingVendors.length > 0) && (
        <div className="bg-white rounded-xl border border-amber-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-3.5 bg-amber-50/70 border-b border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-700" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Action Required · Pending User Registrations Awaiting Activation ({pendingUsers.length + pendingVendors.length})
              </h2>
            </div>
            {actionMessage && (
              <span className="text-xs text-emerald-800 font-bold bg-emerald-100 px-2.5 py-0.5 rounded">
                {actionMessage}
              </span>
            )}
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Applicant Name</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">ID / Registration</th>
                  <th className="py-2.5 px-4">Designation & Department</th>
                  <th className="py-2.5 px-4">Assigned Mine / Complex</th>
                  <th className="py-2.5 px-4">Official Email</th>
                  <th className="py-2.5 px-4 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-amber-50/20">
                    <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold text-[10px]">
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{u.employeeId || u.vendorId}</td>
                    <td className="py-3 px-4 text-slate-600">{u.designation} · {u.department}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{u.mineComplexCode || 'ALL'}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{u.email}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApproveUser(u.id)}
                          disabled={loadingApprovals}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-2xs"
                        >
                          Approve & Activate
                        </button>
                        <button
                          onClick={() => handleRejectUser(u.id)}
                          disabled={loadingApprovals}
                          className="px-2.5 py-1 bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700 rounded text-[11px] font-semibold"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. MINE-SPECIFIC DASHBOARD OVERVIEW & METRICS (Section 5) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              {activeComplexCode === 'ALL'
                ? 'Corporate Consolidated Metrics'
                : `${activeComplexObj?.name} · Actual Operational Metrics`}
            </h2>
            <p className="text-[11px] text-slate-500">
              Calculated dynamically from real database records for this complex
            </p>
          </div>
          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
            ID Sequence Prefix: {activeComplexObj?.prefix || 'MINE-PS-2026-'}
          </span>
        </div>

        {/* Dynamic Metric Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Problem Statements
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">{activeProblemStatements.length}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Raised by officers</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Pending Approvals
            </span>
            <div className="text-2xl font-black text-amber-700 mt-1">{pendingApprovals.length}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Department scrutiny</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Vendor Offers
            </span>
            <div className="text-2xl font-black text-blue-700 mt-1">{activeProposals.length}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Budgetary proposals</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              PoC Trials
            </span>
            <div className="text-2xl font-black text-purple-700 mt-1">{activePocs.length}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Field verification</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Award of Work
            </span>
            <div className="text-2xl font-black text-emerald-700 mt-1">{activeAwards.length}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">LOA / PO sanctioned</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Live Projects
            </span>
            <div className="text-2xl font-black text-indigo-700 mt-1">{activeProjects.length}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">12-Stage tracking</span>
          </div>
        </div>
      </div>

      {/* 5. INDIVIDUAL MINE WORKFLOW NAVIGATION (Section 5 Menu) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          {activeComplexObj?.name || 'Mine Complex'} · Workflow Navigation Menu
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          <button
            onClick={() => onNavigateTab('problems')}
            className="p-3 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-left transition-all space-y-1"
          >
            <span className="font-bold text-slate-900 block">Problem Statements</span>
            <span className="text-[11px] text-slate-500 block">View ({activeProblemStatements.length})</span>
          </button>

          <button
            onClick={onOpenCreateProblem}
            className="p-3 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-left transition-all space-y-1"
          >
            <span className="font-bold text-blue-700 block">+ Create Statement</span>
            <span className="text-[11px] text-slate-500 block">Raise new need</span>
          </button>

          <button
            onClick={() => onNavigateTab('proposals')}
            className="p-3 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-left transition-all space-y-1"
          >
            <span className="font-bold text-slate-900 block">Vendor Offers</span>
            <span className="text-[11px] text-slate-500 block">Part A, B, C ({activeProposals.length})</span>
          </button>

          <button
            onClick={() => onNavigateTab('pocs')}
            className="p-3 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-left transition-all space-y-1"
          >
            <span className="font-bold text-slate-900 block">PoC Management</span>
            <span className="text-[11px] text-slate-500 block">Trials ({activePocs.length})</span>
          </button>

          <button
            onClick={() => onNavigateTab('awards')}
            className="p-3 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-left transition-all space-y-1"
          >
            <span className="font-bold text-slate-900 block">Award of Work</span>
            <span className="text-[11px] text-slate-500 block">LOA/PO ({activeAwards.length})</span>
          </button>

          <button
            onClick={() => onNavigateTab('projects')}
            className="p-3 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-left transition-all space-y-1"
          >
            <span className="font-bold text-slate-900 block">Project Tracking</span>
            <span className="text-[11px] text-slate-500 block">Gantt ({activeProjects.length})</span>
          </button>
        </div>
      </div>

      {/* 6. MINE-WISE PROBLEM STATEMENT REGISTER PREVIEW (Section 6 & 15) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {activeComplexCode === 'ALL' ? 'Consolidated Problem Statements' : `${activeComplexObj?.name} · Problem Statements`}
            </h3>
            <span className="text-[11px] text-slate-500">
              Showing active operational challenges registered for this complex
            </span>
          </div>

          <button
            onClick={() => onNavigateTab('problems')}
            className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
          >
            <span>Open Full Problem Register</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeProblemStatements.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-700 text-sm">
              No problem statements have been created for this complex.
            </h4>
            <p className="text-slate-400 max-w-sm mx-auto">
              Authorized NMDC originating officers can raise operational requirements using the "Create Problem Statement" option.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Problem ID</th>
                  <th className="py-2.5 px-4">Title</th>
                  <th className="py-2.5 px-4">Department</th>
                  <th className="py-2.5 px-4">Originating Officer</th>
                  <th className="py-2.5 px-4">Budget</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeProblemStatements.slice(0, 5).map((ps) => (
                  <tr key={ps.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{ps.code}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 max-w-xs truncate">{ps.title}</td>
                    <td className="py-3 px-4 text-slate-600">{ps.department}</td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{ps.originatingOfficer}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{ps.indicativeBudget}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {ps.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          onSelectProblemStatement(ps);
                          onNavigateTab('problems');
                        }}
                        className="px-2.5 py-1 text-blue-700 font-bold hover:underline"
                      >
                        View Dossier →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

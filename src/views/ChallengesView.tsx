import React, { useState } from 'react';
import { ProblemStatement, UserRole, User, Vendor, ProblemStatementStatus, MineComplexCode, AUTHORIZED_MINE_COMPLEXES } from '../types/index.js';
import { 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  IndianRupee, 
  Building2, 
  FileText, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  MessageSquare,
  HelpCircle,
  Paperclip,
  Check,
  X,
  AlertTriangle,
  Send,
  Download,
  MapPin
} from 'lucide-react';
import { fetchApi } from '../utils/api.js';

interface ChallengesViewProps {
  problemStatements: ProblemStatement[];
  currentRole: UserRole;
  currentUser: User | null;
  currentVendor: Vendor | null;
  activeComplexCode?: MineComplexCode | 'ALL';
  onSelectComplex?: (code: MineComplexCode | 'ALL') => void;
  onOpenProposalWizard: (ps: ProblemStatement) => void;
  onOpenCompareMatrix: (ps: ProblemStatement) => void;
  onOpenCreateChallenge: () => void;
  onRefreshData?: () => void;
}

export const ChallengesView: React.FC<ChallengesViewProps> = ({
  problemStatements,
  currentRole,
  currentUser,
  currentVendor,
  activeComplexCode = 'ALL',
  onSelectComplex,
  onOpenProposalWizard,
  onOpenCompareMatrix,
  onOpenCreateChallenge,
  onRefreshData,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedComplexFilter, setSelectedComplexFilter] = useState<string>(activeComplexCode);
  const [activeDetailPs, setActiveDetailPs] = useState<ProblemStatement | null>(null);

  // Workflow action modal state (for Approve / Return / Reject)
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    ps: ProblemStatement | null;
    actionType: 'approve' | 'return' | 'reject';
  }>({
    isOpen: false,
    ps: null,
    actionType: 'approve',
  });
  const [actionRemarks, setActionRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Clarification query submission modal
  const [clarificationModal, setClarificationModal] = useState<{
    isOpen: boolean;
    ps: ProblemStatement | null;
  }>({ isOpen: false, ps: null });
  const [querySubject, setQuerySubject] = useState('');
  const [queryText, setQueryText] = useState('');
  const [clarificationSubmitting, setClarificationSubmitting] = useState(false);

  // Answer clarification query modal
  const [answeringQuery, setAnsweringQuery] = useState<{
    isOpen: boolean;
    ps: ProblemStatement | null;
    queryId: string;
  }>({ isOpen: false, ps: null, queryId: '' });
  const [answerText, setAnswerText] = useState('');

  const categories = [
    'All',
    'Mining & Heavy Earth Moving Machinery (HEMM)',
    'Mineral Processing & Crushing',
    'Slurry Pipeline & Transport',
    'Electrical & Mechanical Drives',
    'Mine Safety & Geotechnical',
    'Environment & Dust Suppression',
    'Electrical & Power Quality',
  ];

  const departments = [
    'All',
    'Mining & HEMM Engineering',
    'Crushing & Plant Engineering',
    'Slurry Beneficiation & Pipeline Transport',
    'Electrical & Automation',
    'Safety & Mine Geology',
    'Environment & Sustainable Mining',
    'Electrical Engineering',
  ];

  const statuses = [
    'All',
    'Draft',
    'Submitted',
    'Department Review',
    'Approval',
    'Published',
    'Vendor Participation',
    'Technical Evaluation',
    'PoC Underway',
  ];

  const filtered = problemStatements.filter((ps) => {
    // Complex filter
    if (selectedComplexFilter !== 'ALL' && ps.mineComplexCode !== selectedComplexFilter) {
      return false;
    }
    if (selectedCategory !== 'All' && ps.category !== selectedCategory) return false;
    if (selectedDept !== 'All' && ps.department !== selectedDept) return false;
    if (selectedStatus !== 'All' && ps.status !== selectedStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        ps.title.toLowerCase().includes(q) ||
        ps.code.toLowerCase().includes(q) ||
        ps.detailedProblemStatement.toLowerCase().includes(q) ||
        ps.department.toLowerCase().includes(q) ||
        ps.projectComplex.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Handle workflow transition
  const handleWorkflowAction = async () => {
    if (!actionModal.ps) return;
    setActionLoading(true);

    let nextStatus: ProblemStatementStatus = 'Published';
    let officerRole = currentRole;
    let officerDesignation = currentUser?.designation || 'Competent Authority';

    if (actionModal.actionType === 'approve') {
      if (actionModal.ps.status === 'Submitted' || actionModal.ps.status === 'Department Review') {
        nextStatus = 'Approval';
      } else if (actionModal.ps.status === 'Approval') {
        nextStatus = 'Vendor Participation';
      } else {
        nextStatus = 'Vendor Participation';
      }
    } else if (actionModal.actionType === 'return') {
      nextStatus = 'Draft';
    } else if (actionModal.actionType === 'reject') {
      nextStatus = 'Closed';
    }

    try {
      await fetchApi(`/api/problems/${actionModal.ps.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: nextStatus,
          action: actionModal.actionType === 'approve' ? 'Approved' : actionModal.actionType === 'return' ? 'Returned for Clarification' : 'Rejected',
          remarks: actionRemarks.trim() || `Processed by authorized ${currentRole}`,
          officerName: currentUser?.name || 'Authorized Officer',
          officerRole,
          officerDesignation,
        }),
      });

      setActionModal({ isOpen: false, ps: null, actionType: 'approve' });
      setActionRemarks('');
      if (onRefreshData) onRefreshData();
    } catch (e: any) {
      alert(`Workflow error: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit clarification query
  const handleSubmitClarification = async () => {
    if (!clarificationModal.ps || !queryText.trim()) return;
    setClarificationSubmitting(true);
    try {
      await fetchApi(`/api/problems/${clarificationModal.ps.id}/clarifications`, {
        method: 'POST',
        body: JSON.stringify({
          querySubject: querySubject || 'Technical Specification Query',
          queryText: queryText.trim(),
          vendorId: currentVendor?.id || currentUser?.vendorId || 'vnd-pending',
          vendorName: currentVendor?.name || currentUser?.name || 'Registered Vendor',
        }),
      });

      setClarificationModal({ isOpen: false, ps: null });
      setQuerySubject('');
      setQueryText('');
      if (onRefreshData) onRefreshData();
    } catch (e: any) {
      alert(`Error submitting query: ${e.message}`);
    } finally {
      setClarificationSubmitting(false);
    }
  };

  // Publish response to clarification
  const handlePublishAnswer = async () => {
    if (!answeringQuery.ps || !answerText.trim()) return;
    try {
      await fetchApi(`/api/problems/${answeringQuery.ps.id}/clarifications/${answeringQuery.queryId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          responseText: answerText.trim(),
          answeredBy: currentUser?.name || 'Concerned NMDC Department Officer',
          answeredByDesignation: currentUser?.designation || 'General Manager',
        }),
      });

      setAnsweringQuery({ isOpen: false, ps: null, queryId: '' });
      setAnswerText('');
      if (onRefreshData) onRefreshData();
    } catch (e: any) {
      alert(`Error publishing answer: ${e.message}`);
    }
  };

  const activeComplexObj = AUTHORIZED_MINE_COMPLEXES.find(c => c.code === selectedComplexFilter);

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-blue-700 font-bold uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              OPERATIONAL PROBLEM STATEMENTS · SECTIONS 6 & 7
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500 font-medium text-xs">
              {selectedComplexFilter === 'ALL' ? 'All Complexes' : activeComplexObj?.name}: {filtered.length} Records
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            NMDC Problem Statements & Operational Requirements
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full lifecycle monitoring: Draft → Submitted → Department Review → Approval → Published → Vendor Participation.
          </p>
        </div>

        {/* Action Button: Create Problem Statement */}
        {(currentRole === 'executive' || currentRole === 'dept_head' || currentRole === 'approving_authority' || currentRole === 'admin') && (
          <button
            onClick={onOpenCreateChallenge}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-xs text-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4 text-blue-200" />
            <span>Create Problem Statement</span>
          </button>
        )}
      </div>

      {/* Complex Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => {
            setSelectedComplexFilter('ALL');
            if (onSelectComplex) onSelectComplex('ALL');
          }}
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
          const count = problemStatements.filter(p => p.mineComplexCode === complex.code).length;
          return (
            <button
              key={complex.code}
              onClick={() => {
                setSelectedComplexFilter(complex.code);
                if (onSelectComplex) onSelectComplex(complex.code);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{complex.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, ID (e.g. DIOM-PS-2026-0001), equipment..."
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-700"
          >
            {statuses.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-700"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-700"
          >
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Problem Statements Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 text-xs space-y-2">
          <FileText className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-700 text-sm">
            {problemStatements.length === 0
              ? 'No open problem statements are currently available.'
              : selectedComplexFilter !== 'ALL'
              ? 'No problem statements have been created for this complex.'
              : 'No records available.'}
          </p>
          <p className="text-slate-400 text-xs">
            {currentRole === 'vendor'
              ? 'New operational opportunities will be listed once sanctioned by NMDC authorities.'
              : 'Authorized NMDC executives can click "Create Problem Statement" to raise a new operational requirement.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ps) => {
            const isPendingDeptReview = ps.status === 'Submitted' || ps.status === 'Department Review';
            const isPendingAuthorityApproval = ps.status === 'Approval';
            const isPublished = ps.status === 'Published' || ps.status === 'Vendor Participation';

            return (
              <div
                key={ps.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between p-5 space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {ps.code}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                        ps.status === 'Vendor Participation' || ps.status === 'Published'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : ps.status === 'Department Review' || ps.status === 'Submitted'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : ps.status === 'Approval'
                          ? 'bg-purple-50 text-purple-800 border-purple-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {ps.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                    {ps.title}
                  </h3>

                  <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">
                    {ps.detailedProblemStatement}
                  </p>

                  <div className="space-y-1.5 pt-1 text-[11px] text-slate-500 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Department:</span>
                      <strong className="text-slate-700 truncate max-w-[170px]">{ps.department}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Complex:</span>
                      <span className="text-slate-700 truncate max-w-[170px] font-medium">{ps.projectComplex}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Indicative Budget:</span>
                      <span className="font-mono font-bold text-slate-900">{ps.indicativeBudget}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Deadline:</span>
                      <span className="font-mono text-slate-700">{ps.submissionDeadline}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons based on Role & Status */}
                <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-slate-500">
                      {ps.respondedVendorsCount || 0} Offers Received
                    </span>
                    <button
                      onClick={() => setActiveDetailPs(ps)}
                      className="text-blue-700 hover:text-blue-800 font-semibold text-xs flex items-center gap-1"
                    >
                      <span>Full Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Contextual Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    {/* For Department Head Scrutiny */}
                    {currentRole === 'dept_head' && isPendingDeptReview && (
                      <button
                        onClick={() => setActionModal({ isOpen: true, ps, actionType: 'approve' })}
                        className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Vet & Forward to Project Head</span>
                      </button>
                    )}

                    {/* For Approving Authority Final Sanction */}
                    {currentRole === 'approving_authority' && isPendingAuthorityApproval && (
                      <button
                        onClick={() => setActionModal({ isOpen: true, ps, actionType: 'approve' })}
                        className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Sanction & Authorize Publication</span>
                      </button>
                    )}

                    {/* For Vendors: Submit Solution & Budgetary Offer */}
                    {currentRole === 'vendor' && isPublished && (
                      <button
                        onClick={() => onOpenProposalWizard(ps)}
                        className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Submit Solution & Offer</span>
                      </button>
                    )}

                    {/* Compare Matrix for Evaluators/Approvers */}
                    {(currentRole === 'comm_evaluator' || currentRole === 'tech_evaluator' || currentRole === 'approving_authority' || currentRole === 'admin') && isPublished && (
                      <button
                        onClick={() => onOpenCompareMatrix(ps)}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Commercial Matrix ({ps.respondedVendorsCount || 0})</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Problem Statement Detail Modal */}
      {activeDetailPs && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-xs text-slate-800 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {activeDetailPs.code}
                  </span>
                  <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {activeDetailPs.status}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-500 font-medium">{activeDetailPs.department}</span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                  {activeDetailPs.title}
                </h2>
              </div>
              <button
                onClick={() => setActiveDetailPs(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Basic Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 text-[11px] block">Project Complex:</span>
                  <strong className="text-slate-800 block mt-0.5">{activeDetailPs.projectComplex}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Specific Location:</span>
                  <strong className="text-slate-800 block mt-0.5">{activeDetailPs.location}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Originating Officer:</span>
                  <strong className="text-slate-800 block mt-0.5">{activeDetailPs.originatingOfficer} ({activeDetailPs.designation})</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Indicative Budget:</span>
                  <strong className="text-blue-800 font-mono text-sm block mt-0.5">{activeDetailPs.indicativeBudget}</strong>
                </div>
              </div>

              {/* Problem Details */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1.5">
                  1. Operational Problem Details & Context
                </h4>
                <div>
                  <span className="font-semibold text-slate-700 block mb-0.5">Existing Situation:</span>
                  <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-150">
                    {activeDetailPs.existingSituation || 'Standard mine extraction operations.'}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 block mb-0.5">Detailed Problem Statement:</span>
                  <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-150">
                    {activeDetailPs.detailedProblemStatement}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">Operational Difficulties:</span>
                    <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                      {activeDetailPs.operationalDifficulties || 'Bottlenecks during operations.'}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">Existing System / Equipment:</span>
                    <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                      {activeDetailPs.existingEquipment || 'Heavy earth moving and mineral handling plant.'}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">Desired Outcome:</span>
                    <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                      {activeDetailPs.desiredOutcome || 'Optimized throughput and efficiency.'}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">Expected Benefits:</span>
                    <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                      {activeDetailPs.expectedBenefits || 'Annual savings and productivity improvement.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Requirement Details */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1.5">
                  2. Technical Requirement & Scope of Supply
                </h4>
                <div>
                  <span className="font-semibold text-slate-700 block mb-0.5">Required Solution:</span>
                  <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-150">
                    {activeDetailPs.requiredSolution || 'Turnkey technological solution with rugged field instrumentation.'}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 block mb-0.5">Technical Specifications:</span>
                  <p className="text-slate-600 font-mono text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-150 leading-relaxed">
                    {activeDetailPs.technicalSpecifications || 'Standard industrial specifications.'}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">Scope of Supply & Services:</span>
                    <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                      {activeDetailPs.scopeOfSupply || 'Supply, installation, commissioning and warranty.'}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">Required Deliverables:</span>
                    <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                      {activeDetailPs.requiredDeliverables || 'Commissioning reports, calibration certificates, training.'}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">Implementation Period:</span>
                    <p className="text-slate-800 font-bold bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                      {activeDetailPs.implementationPeriodMonths} Months from Work Award
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">Submission Deadline:</span>
                    <p className="text-slate-800 font-mono font-bold bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                      {activeDetailPs.submissionDeadline}
                    </p>
                  </div>
                </div>
              </div>

              {/* Attachments Section */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1.5">
                  3. Official Technical Attachments ({activeDetailPs.attachments?.length || 0})
                </h4>
                {activeDetailPs.attachments && activeDetailPs.attachments.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeDetailPs.attachments.map((att, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="flex items-center gap-2 truncate">
                          <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-800 truncate">{att.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono shrink-0 pl-2">{att.size}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No external drawings or attachments uploaded.</p>
                )}
              </div>

              {/* Section 11: Clarification Queries & Published Responses */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-700" />
                    <span>4. Clarifications & Official Responses (Section 11)</span>
                  </h4>
                  {currentRole === 'vendor' && (
                    <button
                      onClick={() => setClarificationModal({ isOpen: true, ps: activeDetailPs })}
                      className="px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold text-xs"
                    >
                      + Ask Clarification Query
                    </button>
                  )}
                </div>

                {activeDetailPs.clarifications && activeDetailPs.clarifications.length > 0 ? (
                  <div className="space-y-2.5">
                    {activeDetailPs.clarifications.map((c) => (
                      <div key={c.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-800">Q: {c.querySubject}</span>
                          <span className="text-slate-400 font-mono">{c.submittedAt}</span>
                        </div>
                        <p className="text-slate-600 bg-white p-2 rounded border border-slate-150">
                          {c.queryText}
                        </p>

                        {c.responseText ? (
                          <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200 text-emerald-950 text-[11px] space-y-1">
                            <div className="flex items-center justify-between font-bold text-emerald-900">
                              <span>Official NMDC Clarification Response:</span>
                              <span className="font-mono text-[10px]">{c.answeredAt}</span>
                            </div>
                            <p>{c.responseText}</p>
                            <span className="text-[10px] text-emerald-700 block">
                              Answered by: {c.answeredBy} ({c.answeredByDesignation}) · Common to all participating vendors
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[11px] text-amber-700 font-medium">
                              Response preparation under department scrutiny.
                            </span>
                            {(currentRole === 'executive' || currentRole === 'dept_head') && (
                              <button
                                onClick={() => setAnsweringQuery({ isOpen: true, ps: activeDetailPs, queryId: c.id })}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-md text-[11px] font-semibold"
                              >
                                Prepare & Publish Response
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No clarification queries raised yet.</p>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-slate-500 text-[11px]">
                NMDC Operational Requisition ID: {activeDetailPs.code}
              </span>

              <div className="flex items-center gap-2">
                {currentRole === 'vendor' && (activeDetailPs.status === 'Published' || activeDetailPs.status === 'Vendor Participation') && (
                  <button
                    onClick={() => {
                      const ps = activeDetailPs;
                      setActiveDetailPs(null);
                      onOpenProposalWizard(ps);
                    }}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs"
                  >
                    Submit Solution & Budgetary Offer
                  </button>
                )}

                <button
                  onClick={() => setActiveDetailPs(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Transition Confirmation Modal */}
      {actionModal.isOpen && actionModal.ps && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-5 text-xs text-slate-800 animate-in zoom-in-95 duration-150 space-y-4">
            <div>
              <span className="font-mono text-blue-700 font-bold uppercase text-[10px] tracking-wider">
                GOVERNANCE WORKFLOW ACTION · SECTION 7
              </span>
              <h3 className="font-bold text-slate-900 text-base mt-0.5">
                {actionModal.actionType === 'approve'
                  ? 'Approve & Sanction Problem Statement'
                  : actionModal.actionType === 'return'
                  ? 'Return Problem Statement for Clarification'
                  : 'Reject Problem Statement'}
              </h3>
              <p className="text-slate-500 text-xs">
                {actionModal.ps.code}: {actionModal.ps.title}
              </p>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Official Remarks & Scrutiny Observations *
              </label>
              <textarea
                rows={3}
                required
                value={actionRemarks}
                onChange={(e) => setActionRemarks(e.target.value)}
                placeholder="Enter mandatory scrutiny remarks for permanent audit trail..."
                className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActionModal({ isOpen: false, ps: null, actionType: 'approve' })}
                className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleWorkflowAction}
                className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg shadow-2xs"
              >
                {actionLoading ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clarification Query Modal (Vendor to NMDC) */}
      {clarificationModal.isOpen && clarificationModal.ps && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-5 text-xs text-slate-800 animate-in zoom-in-95 duration-150 space-y-4">
            <div>
              <span className="font-mono text-blue-700 font-bold uppercase text-[10px] tracking-wider">
                CLARIFICATION MANAGEMENT · SECTION 11
              </span>
              <h3 className="font-bold text-slate-900 text-base mt-0.5">
                Submit Clarification Query on {clarificationModal.ps.code}
              </h3>
              <p className="text-slate-500 text-xs">
                Your technical query will be routed to the concerned NMDC department. Official answers will be published without disclosing vendor identity.
              </p>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Subject of Query</label>
              <input
                type="text"
                value={querySubject}
                onChange={(e) => setQuerySubject(e.target.value)}
                placeholder="e.g. Electrical Power Availability at High-Mast Repeater"
                className="w-full border border-slate-300 rounded-xl p-2 text-slate-900"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Detailed Technical Query *</label>
              <textarea
                rows={4}
                required
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="Specify the ambiguity, technical interface, or operating condition requiring official clarification..."
                className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setClarificationModal({ isOpen: false, ps: null })}
                className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={clarificationSubmitting}
                onClick={handleSubmitClarification}
                className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg shadow-2xs"
              >
                {clarificationSubmitting ? 'Submitting...' : 'Submit Query'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Answer Clarification Modal (NMDC to Vendors) */}
      {answeringQuery.isOpen && answeringQuery.ps && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-5 text-xs text-slate-800 animate-in zoom-in-95 duration-150 space-y-4">
            <div>
              <span className="font-mono text-emerald-800 font-bold uppercase text-[10px] tracking-wider">
                PUBLISH CLARIFICATION ANSWER · SECTION 11
              </span>
              <h3 className="font-bold text-slate-900 text-base mt-0.5">
                Prepare Official Department Response
              </h3>
              <p className="text-slate-500 text-xs">
                This answer will be officially published and notified to all participating vendors.
              </p>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Official Response Text *</label>
              <textarea
                rows={4}
                required
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Enter formal departmental clarification..."
                className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAnsweringQuery({ isOpen: false, ps: null, queryId: '' })}
                className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePublishAnswer}
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-2xs"
              >
                Publish to All Vendors
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

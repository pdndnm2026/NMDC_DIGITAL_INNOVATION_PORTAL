import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  BudgetaryOfferRequest,
  ProblemStatement,
  Proposal,
  Vendor,
  User,
  UserRole,
  MineComplex,
  MineComplexCode,
  DEFAULT_ORGANISATIONAL_UNITS,
  BUDGETARY_DISCLAIMER_TEXT,
} from '../types/index.js';
import { fetchApi } from '../utils/api.js';
import {
  FileSpreadsheet,
  PlusCircle,
  Search,
  CheckCircle2,
  Clock,
  Send,
  Calendar,
  AlertCircle,
  MessageSquare,
  XCircle,
  Lock,
  Building2,
  MapPin,
} from 'lucide-react';

interface BudgetaryOffersViewProps {
  budgetaryRequests: BudgetaryOfferRequest[];
  problemStatements: ProblemStatement[];
  proposals: Proposal[];
  vendors: Vendor[];
  currentUser: User | null;
  currentRole: UserRole;
  activeComplexCode?: MineComplexCode | 'ALL';
  organisationalUnits?: MineComplex[];
  onOpenProposalForBor: (bor: BudgetaryOfferRequest) => void;
  onOpenDiscussionForBor: (bor: BudgetaryOfferRequest) => void;
  onRefreshData: () => void;
}

export const BudgetaryOffersView: React.FC<BudgetaryOffersViewProps> = ({
  budgetaryRequests,
  problemStatements,
  proposals,
  vendors,
  currentUser,
  currentRole,
  activeComplexCode = 'ALL',
  organisationalUnits = DEFAULT_ORGANISATIONAL_UNITS,
  onOpenProposalForBor,
  onOpenDiscussionForBor,
  onRefreshData,
}) => {
  const [unitFilter, setUnitFilter] = useState<string>(activeComplexCode);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Create Modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createMode, setCreateMode] = useState<'linked' | 'direct'>('linked');
  const [linkedPsId, setLinkedPsId] = useState('');
  const [mineComplexCode, setMineComplexCode] = useState<MineComplexCode>(
    activeComplexCode !== 'ALL' ? activeComplexCode : 'DIOM'
  );
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState(currentUser?.department || 'Mining & HEMM Engineering');
  const [requirementCategory, setRequirementCategory] = useState('Mining & HEMM Automation');
  const [scopeOfWork, setScopeOfWork] = useState('');
  const [technicalSpecifications, setTechnicalSpecifications] = useState('');
  const [deliverables, setDeliverables] = useState('');
  const [estimatedBudgetCr, setEstimatedBudgetCr] = useState<number>(0);
  const [submissionDeadline, setSubmissionDeadline] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [visibilityScope, setVisibilityScope] = useState<'ALL_ELIGIBLE' | 'INVITED_ONLY'>('ALL_ELIGIBLE');
  const [invitedVendorIds, setInvitedVendorIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // Deadline Extension Modal
  const [extendBor, setExtendBor] = useState<BudgetaryOfferRequest | null>(null);
  const [newDeadline, setNewDeadline] = useState('');
  const [extendRemarks, setExtendRemarks] = useState('');

  // Cancellation Modal
  const [cancelBor, setCancelBor] = useState<BudgetaryOfferRequest | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Publish / Invite Vendors Modal
  const [publishBor, setPublishBor] = useState<BudgetaryOfferRequest | null>(null);
  const [publishScope, setPublishScope] = useState<'ALL_ELIGIBLE' | 'INVITED_ONLY'>('ALL_ELIGIBLE');
  const [publishInvitedIds, setPublishInvitedIds] = useState<string[]>([]);

  const isOfficer =
    currentRole === 'executive' ||
    currentRole === 'dept_head' ||
    currentRole === 'approving_authority' ||
    currentRole === 'admin';
  const isApprover = currentRole === 'dept_head' || currentRole === 'approving_authority' || currentRole === 'admin';
  const isVendor = currentRole === 'vendor';

  const activeVendors = vendors.filter((v) => v.status === 'Active' || v.status === 'Approved');

  const filteredBors = budgetaryRequests.filter((b) => {
    if (unitFilter !== 'ALL' && b.mineComplexCode !== unitFilter) return false;
    if (statusFilter !== 'All' && b.status !== statusFilter) return false;

    if (isVendor) {
      if (b.status !== 'Published' && b.status !== 'Closed') return false;
      if (b.visibilityScope === 'INVITED_ONLY') {
        const vid = currentUser?.vendorId;
        if (!vid || !b.invitedVendorIds.includes(vid)) return false;
      }
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        b.requestCode.toLowerCase().includes(q) ||
        b.title.toLowerCase().includes(q) ||
        b.department.toLowerCase().includes(q) ||
        (b.linkedProblemStatementCode || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleLinkedPsChange = (psId: string) => {
    setLinkedPsId(psId);
    const ps = problemStatements.find((p) => p.id === psId);
    if (ps) {
      setMineComplexCode(ps.mineComplexCode);
      setTitle(ps.title);
      setDepartment(ps.department);
      setRequirementCategory(ps.category);
      setScopeOfWork(ps.scopeOfSupply || ps.requiredSolution);
      setTechnicalSpecifications(ps.technicalSpecifications);
      setDeliverables(ps.requiredDeliverables);
      setEstimatedBudgetCr(ps.budgetNumeric);
      setSubmissionDeadline(ps.submissionDeadline);
    }
  };

  const handleCreateBor = async (publishImmediately: boolean) => {
    setErrorMsg(null);
    if (!title.trim()) {
      setErrorMsg('Budgetary Offer Request title is required.');
      return;
    }
    setCreating(true);
    try {
      await fetchApi('/api/budgetary-requests', {
        method: 'POST',
        body: JSON.stringify({
          linkedProblemStatementId: createMode === 'linked' ? linkedPsId : undefined,
          mineComplexCode,
          title,
          department,
          requirementCategory,
          scopeOfWork,
          technicalSpecifications,
          deliverables,
          estimatedBudgetCr,
          submissionDeadline,
          visibilityScope,
          invitedVendorIds,
          publishImmediately: publishImmediately && isApprover,
          createdBy: currentUser?.name || 'NMDC Officer',
          createdByDesignation: currentUser?.designation || 'Executive',
        }),
      });
      setCreateOpen(false);
      setActionMsg(`Budgetary Offer Request "${title}" created successfully.`);
      onRefreshData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create Budgetary Offer Request.');
    } finally {
      setCreating(false);
    }
  };

  const handleBorAction = async (id: string, payload: Record<string, any>) => {
    setErrorMsg(null);
    try {
      await fetchApi(`/api/budgetary-requests/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...payload,
          officerName: currentUser?.name || 'Competent Authority',
        }),
      });
      setActionMsg('Budgetary Offer Request updated.');
      onRefreshData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Action failed.');
    }
  };

  const handleExportComparativeStatement = (bor: BudgetaryOfferRequest) => {
    const linkedOffers = proposals.filter(
      (p) =>
        p.budgetaryRequestId === bor.id ||
        (bor.linkedProblemStatementId && p.problemStatementId === bor.linkedProblemStatementId)
    );
    const wb = XLSX.utils.book_new();
    const header = [
      'Offer Code',
      'Vendor Name',
      'Submission Date',
      'Technical Compliance',
      'Technical Marks',
      'Basic Subtotal (INR)',
      'GST Amount (INR)',
      'Total Budgetary Offer (INR)',
      'Delivery (Weeks)',
      'Warranty (Months)',
      'AMC / Year (INR)',
      'Commercial Rank',
    ];
    const rows = linkedOffers.map((o) => [
      o.proposalCode,
      o.vendorName,
      o.submittedAt.slice(0, 10),
      o.technicalComplianceStatus || 'Pending Evaluation',
      o.technicalMarks ?? '—',
      o.costBreakdown?.subtotalCost || 0,
      o.costBreakdown?.gstAmount || 0,
      o.costBreakdown?.totalEstimatedCost || 0,
      o.deliveryPeriodWeeks,
      o.warrantyMonths,
      o.costBreakdown?.amcCostPerYear || 0,
      o.commercialRank || 'Pending',
    ]);
    const ws = XLSX.utils.aoa_to_sheet([
      [`NMDC LIMITED — BUDGETARY OFFER COMPARATIVE STATEMENT (${bor.requestCode})`],
      [`Title: ${bor.title}`, `Unit: ${bor.mineComplexName}`, `Disclaimer: Non-Binding Budgetary Estimation`],
      [],
      header,
      ...rows,
    ]);
    ws['!cols'] = header.map(() => ({ wch: 22 }));
    XLSX.utils.book_append_sheet(wb, ws, 'Comparative_Statement');
    XLSX.writeFile(wb, `${bor.requestCode}_Comparative_Statement.xlsx`);
  };

  return (
    <div className="space-y-5 pb-14">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11px] font-mono text-amber-300 uppercase tracking-wider">
            <span>BUDGETARY OFFER REQUESTS (BOR)</span>
            <span>·</span>
            <span>{filteredBors.length} REQUESTS</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Budgetary Offer Request & Comparative Register
          </h1>
          <p className="text-xs text-slate-300 max-w-3xl">
            Issue formal budgetary enquiries linked to sanctioned Problem Statements or direct departmental technical requirements, manage invited vendor lists, extend deadlines with audit remarks, and compile comparative cost statements.
          </p>
        </div>

        {isOfficer && (
          <button
            onClick={() => setCreateOpen(true)}
            className="px-4 py-2.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 self-start lg:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Budgetary Offer Request</span>
          </button>
        )}
      </div>

      {/* Mandatory Non-Binding Disclaimer Notice */}
      <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-xs text-amber-950">
        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold block">Statutory Non-Binding Notice</strong>
          <span>{BUDGETARY_DISCLAIMER_TEXT}</span>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center justify-between">
          <span className="font-semibold">{actionMsg}</span>
          <button onClick={() => setActionMsg(null)} className="font-bold">Dismiss</button>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center justify-between">
          <span className="font-semibold">{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="font-bold">Dismiss</button>
        </div>
      )}

      {/* Unit Filter Strip (All 5 Units) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setUnitFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 ${
            unitFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>All 5 Units</span>
        </button>
        {organisationalUnits.map((u) => (
          <button
            key={u.code}
            onClick={() => setUnitFilter(u.code)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 ${
              unitFilter === u.code ? 'bg-blue-700 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{u.code} – {u.shortLabel}</span>
          </button>
        ))}
      </div>

      {/* Search & Status Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search BOR code, title, linked Problem Statement..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800"
        >
          <option value="All">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Pending Approval">Pending Approval</option>
          <option value="Approved">Approved</option>
          <option value="Published">Published</option>
          <option value="Closed">Closed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* BOR Register List */}
      {filteredBors.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 space-y-2">
          <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">No budgetary offer requests available.</p>
          <p className="text-xs text-slate-500">
            {isOfficer
              ? 'Use "Create Budgetary Offer Request" to raise an enquiry linked to a Problem Statement or as a standalone requirement.'
              : 'Published budgetary enquiries open for your participation will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBors.map((bor) => {
            const linkedOffers = proposals.filter(
              (p) =>
                p.budgetaryRequestId === bor.id ||
                (bor.linkedProblemStatementId && p.problemStatementId === bor.linkedProblemStatementId)
            );
            return (
              <div key={bor.id} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                        {bor.requestCode}
                      </span>
                      {bor.isDemo && (
                        <span className="font-mono text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded">
                          DEMO
                        </span>
                      )}
                      <span className="font-mono text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {bor.mineComplexCode}
                      </span>
                      {bor.linkedProblemStatementCode && (
                        <span className="text-[11px] font-mono text-slate-500">
                          Linked PS: {bor.linkedProblemStatementCode}
                        </span>
                      )}
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                          bor.status === 'Published'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : bor.status === 'Pending Approval'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : bor.status === 'Cancelled'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {bor.status}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{bor.title}</h3>
                    <div className="text-xs text-slate-500">
                      {bor.department} · {bor.mineComplexName} · Raised by {bor.createdBy}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs shrink-0">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Est. Budget</span>
                      <strong className="font-mono tabular-nums text-slate-900">₹ {bor.estimatedBudgetCr.toFixed(2)} Cr</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Due Date</span>
                      <strong className="font-mono tabular-nums text-slate-900">{bor.submissionDeadline}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Responses</span>
                      <strong className="font-mono tabular-nums text-blue-700">{linkedOffers.length || bor.responsesCount}</strong>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="font-semibold text-slate-700 block mb-0.5">Scope of Work & Deliverables</span>
                    <p className="text-slate-600 line-clamp-2">{bor.scopeOfWork || bor.deliverables || 'Refer technical specifications'}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="font-semibold text-slate-700 block mb-0.5">Vendor Invitation Scope</span>
                    <p className="text-slate-600">
                      {bor.visibilityScope === 'ALL_ELIGIBLE'
                        ? 'Open to All Verified / Approved Vendors'
                        : `Restricted to ${bor.invitedVendorNames.length} Invited Vendor(s): ${bor.invitedVendorNames.join(', ')}`}
                    </p>
                  </div>
                </div>

                {bor.cancellationReason && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                    <strong>Cancellation Reason:</strong> {bor.cancellationReason}
                  </div>
                )}

                {bor.deadlineHistory.length > 0 && (
                  <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg text-[11px] text-blue-900 space-y-1">
                    <strong className="block">Deadline Extension History:</strong>
                    {bor.deadlineHistory.map((dh, idx) => (
                      <div key={idx} className="font-mono">
                        {dh.previousDeadline} → {dh.newDeadline} · Approved by {dh.approvedBy} · Remarks: {dh.approvalRemarks}
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <button
                    onClick={() => onOpenDiscussionForBor(bor)}
                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-blue-700" />
                    <span>Clarifications & Discussion</span>
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    {isVendor && bor.status === 'Published' && (
                      <button
                        onClick={() => onOpenProposalForBor(bor)}
                        className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Budgetary Offer</span>
                      </button>
                    )}

                    {!isVendor && (
                      <button
                        onClick={() => handleExportComparativeStatement(bor)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Comparative Statement (.xlsx)</span>
                      </button>
                    )}

                    {isApprover && bor.status === 'Pending Approval' && (
                      <button
                        onClick={() => handleBorAction(bor.id, { action: 'approve' })}
                        className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg whitespace-nowrap"
                      >
                        Approve Request
                      </button>
                    )}

                    {isApprover && (bor.status === 'Approved' || bor.status === 'Draft') && (
                      <button
                        onClick={() => {
                          setPublishBor(bor);
                          setPublishScope(bor.visibilityScope);
                          setPublishInvitedIds(bor.invitedVendorIds);
                        }}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg whitespace-nowrap"
                      >
                        Publish & Invite Vendors
                      </button>
                    )}

                    {isApprover && bor.status === 'Published' && (
                      <>
                        <button
                          onClick={() => {
                            setExtendBor(bor);
                            setNewDeadline(bor.submissionDeadline);
                            setExtendRemarks('');
                          }}
                          className="px-3 py-1.5 border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold rounded-lg flex items-center gap-1 whitespace-nowrap"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Extend Deadline</span>
                        </button>
                        <button
                          onClick={() => handleBorAction(bor.id, { action: 'close' })}
                          className="px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg flex items-center gap-1 whitespace-nowrap"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Close</span>
                        </button>
                      </>
                    )}

                    {isApprover && bor.status !== 'Cancelled' && bor.status !== 'Closed' && (
                      <button
                        onClick={() => {
                          setCancelBor(bor);
                          setCancelReason('');
                        }}
                        className="px-3 py-1.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg flex items-center gap-1 whitespace-nowrap"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE BOR MODAL */}
      {createOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Create Budgetary Offer Request (BOR)</h3>
                <p className="text-slate-500">Link to a sanctioned Problem Statement or issue a standalone departmental enquiry.</p>
              </div>
              <button onClick={() => setCreateOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold text-base">✕</button>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setCreateMode('linked')}
                className={`flex-1 py-1.5 rounded font-semibold ${createMode === 'linked' ? 'bg-blue-700 text-white' : 'text-slate-600'}`}
              >
                Link to Existing Problem Statement
              </button>
              <button
                type="button"
                onClick={() => setCreateMode('direct')}
                className={`flex-1 py-1.5 rounded font-semibold ${createMode === 'direct' ? 'bg-blue-700 text-white' : 'text-slate-600'}`}
              >
                Direct Budgetary Offer Request
              </button>
            </div>

            {createMode === 'linked' && (
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Problem Statement</label>
                <select
                  value={linkedPsId}
                  onChange={(e) => handleLinkedPsChange(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-900"
                >
                  <option value="">-- Select Problem Statement --</option>
                  {problemStatements.map((ps) => (
                    <option key={ps.id} value={ps.id}>
                      {ps.code} ({ps.mineComplexCode}) – {ps.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Organisational Unit <span className="text-rose-600">*</span></label>
                <select
                  value={mineComplexCode}
                  onChange={(e) => setMineComplexCode(e.target.value as MineComplexCode)}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-900 font-semibold"
                >
                  {organisationalUnits.map((u) => (
                    <option key={u.code} value={u.code}>{u.code} – {u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Department <span className="text-rose-600">*</span></label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Request Title <span className="text-rose-600">*</span></label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Budgetary Offer for High-Accuracy Belt Weigher System"
                className="w-full border border-slate-300 rounded-lg p-2 text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Estimated Budget (₹ Cr)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  value={estimatedBudgetCr}
                  onChange={(e) => setEstimatedBudgetCr(parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono text-slate-900"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Submission Deadline</label>
                <input
                  type="date"
                  value={submissionDeadline}
                  onChange={(e) => setSubmissionDeadline(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono text-slate-900"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Vendor Visibility</label>
                <select
                  value={visibilityScope}
                  onChange={(e) => setVisibilityScope(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-900"
                >
                  <option value="ALL_ELIGIBLE">All Registered Vendors</option>
                  <option value="INVITED_ONLY">Selected Invited Vendors Only</option>
                </select>
              </div>
            </div>

            {visibilityScope === 'INVITED_ONLY' && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <span className="font-semibold text-slate-700 block">Select Invited Vendors ({invitedVendorIds.length} selected)</span>
                {activeVendors.length === 0 ? (
                  <p className="text-slate-400 italic">No active/approved vendors registered yet.</p>
                ) : (
                  <div className="max-h-28 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {activeVendors.map((v) => (
                      <label key={v.id} className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={invitedVendorIds.includes(v.id)}
                          onChange={(e) => {
                            setInvitedVendorIds((prev) =>
                              e.target.checked ? [...prev, v.id] : prev.filter((id) => id !== v.id)
                            );
                          }}
                        />
                        <span className="truncate">{v.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Scope of Work</label>
              <textarea
                rows={2}
                value={scopeOfWork}
                onChange={(e) => setScopeOfWork(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-slate-900"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Technical Specifications</label>
              <textarea
                rows={2}
                value={technicalSpecifications}
                onChange={(e) => setTechnicalSpecifications(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 font-mono text-[11px] text-slate-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={creating}
                onClick={() => handleCreateBor(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold"
              >
                Submit for Approval
              </button>
              {isApprover && (
                <button
                  type="button"
                  disabled={creating}
                  onClick={() => handleCreateBor(true)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold"
                >
                  Approve & Publish Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PUBLISH & INVITE MODAL */}
      {publishBor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900">Publish BOR & Invite Vendors: {publishBor.requestCode}</h3>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Visibility Scope</label>
              <select
                value={publishScope}
                onChange={(e) => setPublishScope(e.target.value as any)}
                className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-900"
              >
                <option value="ALL_ELIGIBLE">All Registered Active/Approved Vendors</option>
                <option value="INVITED_ONLY">Selected Vendors Only</option>
              </select>
            </div>
            {publishScope === 'INVITED_ONLY' && (
              <div className="max-h-36 overflow-y-auto space-y-1.5 border border-slate-200 p-2 rounded-lg">
                {activeVendors.map((v) => (
                  <label key={v.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={publishInvitedIds.includes(v.id)}
                      onChange={(e) => {
                        setPublishInvitedIds((prev) =>
                          e.target.checked ? [...prev, v.id] : prev.filter((id) => id !== v.id)
                        );
                      }}
                    />
                    <span>{v.name}</span>
                  </label>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setPublishBor(null)} className="px-3.5 py-1.5 border border-slate-300 rounded-lg">Cancel</button>
              <button
                onClick={() => {
                  handleBorAction(publishBor.id, {
                    action: 'publish',
                    visibilityScope: publishScope,
                    invitedVendorIds: publishInvitedIds,
                  });
                  setPublishBor(null);
                }}
                className="px-4 py-1.5 bg-emerald-700 text-white font-bold rounded-lg"
              >
                Publish & Notify Vendors
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXTEND DEADLINE MODAL */}
      {extendBor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900">Extend Submission Deadline: {extendBor.requestCode}</h3>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">New Submission Deadline <span className="text-rose-600">*</span></label>
              <input
                type="date"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Approval Remarks (Mandatory) <span className="text-rose-600">*</span></label>
              <textarea
                rows={3}
                value={extendRemarks}
                onChange={(e) => setExtendRemarks(e.target.value)}
                placeholder="Reason and approving authority reference for deadline extension..."
                className="w-full border border-slate-300 rounded-lg p-2"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setExtendBor(null)} className="px-3.5 py-1.5 border border-slate-300 rounded-lg">Cancel</button>
              <button
                onClick={() => {
                  if (!newDeadline || !extendRemarks.trim()) {
                    setErrorMsg('Both new deadline and approval remarks are required.');
                    return;
                  }
                  handleBorAction(extendBor.id, { action: 'extend_deadline', newDeadline, remarks: extendRemarks });
                  setExtendBor(null);
                }}
                className="px-4 py-1.5 bg-blue-700 text-white font-bold rounded-lg"
              >
                Confirm Extension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL MODAL */}
      {cancelBor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-rose-900">Cancel Budgetary Offer Request: {cancelBor.requestCode}</h3>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Cancellation Reason (Mandatory) <span className="text-rose-600">*</span></label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Provide official reason for cancellation..."
                className="w-full border border-slate-300 rounded-lg p-2"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setCancelBor(null)} className="px-3.5 py-1.5 border border-slate-300 rounded-lg">Close</button>
              <button
                onClick={() => {
                  if (!cancelReason.trim()) {
                    setErrorMsg('Cancellation reason is mandatory.');
                    return;
                  }
                  handleBorAction(cancelBor.id, { action: 'cancel', cancelReason });
                  setCancelBor(null);
                }}
                className="px-4 py-1.5 bg-rose-700 text-white font-bold rounded-lg"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { 
  AwardOfWork, 
  UserRole, 
  User, 
  ProblemStatement, 
  Proposal,
  MineComplexCode,
  AUTHORIZED_MINE_COMPLEXES 
} from '../types/index.js';
import { 
  Award, 
  Search, 
  Filter, 
  FileText, 
  Calendar, 
  ShieldCheck, 
  Building2, 
  CheckCircle2, 
  PlusCircle, 
  ChevronRight,
  Clock,
  Printer,
  MapPin
} from 'lucide-react';
import { fetchApi } from '../utils/api.js';

interface AwardsViewProps {
  awards: AwardOfWork[];
  currentRole: UserRole;
  currentUser: User | null;
  activeComplexCode?: MineComplexCode | 'ALL';
  problemStatements: ProblemStatement[];
  proposals: Proposal[];
  onRefreshData: () => void;
  onNavigateToProjects: () => void;
}

export const AwardsView: React.FC<AwardsViewProps> = ({
  awards,
  currentRole,
  currentUser,
  activeComplexCode = 'ALL',
  problemStatements,
  proposals,
  onRefreshData,
  onNavigateToProjects,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComplexFilter, setSelectedComplexFilter] = useState<string>(activeComplexCode);
  const [selectedAward, setSelectedAward] = useState<AwardOfWork | null>(null);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

  // Form state for creating new award of work - clean zero-mock defaults
  const [newAwardForm, setNewAwardForm] = useState({
    problemStatementId: '',
    vendorId: '',
    vendorName: '',
    workTitle: '',
    procurementReference: '',
    tenderEnquiryNumber: '',
    gemBidNumber: '',
    prNumber: '',
    poNumber: '',
    loaNumber: '',
    contractNumber: '',
    basicAwardValue: 0,
    gstAmount: 0,
    totalContractValue: 0,
    deliveryPeriodWeeks: 12,
    completionPeriodMonths: 6,
    warrantyPeriodMonths: 12,
    bgNumber: '',
    issuingBank: '',
    bgAmount: 0,
    validityDate: '',
    paymentTerms: 'Milestone-based payments against verified inspection and commissioning certificates.',
    scopeOfWorkSummary: '',
    department: currentUser?.department || 'Mining Engineering',
    mineComplexCode: (currentUser?.mineComplexCode || 'DIOM') as MineComplexCode,
  });

  const filteredAwards = awards.filter((a) => {
    if (selectedComplexFilter !== 'ALL' && a.mineComplexCode && a.mineComplexCode !== selectedComplexFilter) {
      return false;
    }
    const matchesSearch = !searchTerm ||
      a.awardCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.workTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.gemBidNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleCreateAward = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedPs = problemStatements.find((p) => p.id === newAwardForm.problemStatementId);
      const chosenComplexCode = selectedPs?.mineComplexCode || newAwardForm.mineComplexCode;
      const complexObj = AUTHORIZED_MINE_COMPLEXES.find(c => c.code === chosenComplexCode);

      await fetchApi('/api/awards', {
        method: 'POST',
        body: JSON.stringify({
          problemStatementId: newAwardForm.problemStatementId,
          mineComplexCode: chosenComplexCode,
          mineComplexName: complexObj?.name || chosenComplexCode,
          vendorId: newAwardForm.vendorId || 'vnd-awarded',
          vendorName: newAwardForm.vendorName,
          workTitle: newAwardForm.workTitle,
          procurementReference: newAwardForm.procurementReference,
          tenderEnquiryNumber: newAwardForm.tenderEnquiryNumber,
          gemBidNumber: newAwardForm.gemBidNumber,
          prNumber: newAwardForm.prNumber,
          poNumber: newAwardForm.poNumber,
          loaNumber: newAwardForm.loaNumber,
          contractNumber: newAwardForm.contractNumber,
          basicAwardValue: Number(newAwardForm.basicAwardValue),
          gstAmount: Number(newAwardForm.gstAmount),
          totalContractValue: Number(newAwardForm.totalContractValue),
          deliveryPeriodWeeks: Number(newAwardForm.deliveryPeriodWeeks),
          completionPeriodMonths: Number(newAwardForm.completionPeriodMonths),
          warrantyMonths: Number(newAwardForm.warrantyPeriodMonths),
          pbgDetails: {
            bgNumber: newAwardForm.bgNumber,
            issuingBank: newAwardForm.issuingBank,
            amount: Number(newAwardForm.bgAmount),
            validityDate: newAwardForm.validityDate,
          },
          paymentTerms: newAwardForm.paymentTerms,
          scopeOfWorkSummary: newAwardForm.scopeOfWorkSummary,
          department: newAwardForm.department,
          projectComplex: complexObj?.name || chosenComplexCode,
          responsibleOfficer: currentUser?.name || 'NMDC Competent Authority',
          responsibleOfficerDesignation: currentUser?.designation || 'Executive Director (Technical)',
        }),
      });

      setIsIssueModalOpen(false);
      onRefreshData();
    } catch (err: any) {
      alert(`Error creating award: ${err.message}`);
    }
  };

  const formatLakhs = (val: number) => {
    return `₹ ${(val / 100000).toFixed(2)} Lakhs`;
  };

  const formatCrores = (val: number) => {
    return `₹ ${(val / 10000000).toFixed(2)} Cr`;
  };

  const activeComplexObj = AUTHORIZED_MINE_COMPLEXES.find(c => c.code === selectedComplexFilter);

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-emerald-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-800 text-emerald-200 uppercase tracking-wider">
                SECTION 16 · CONTRACT MANAGEMENT
              </span>
              <span className="text-xs text-slate-400">
                {selectedComplexFilter === 'ALL' ? 'All Complexes' : activeComplexObj?.name}: {filteredAwards.length} Awards
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Award of Work & Contract Register
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Statutory repository of Letter of Award (LOA), Purchase Orders (PO), GeM contracts, and Performance Bank Guarantees (PBG) for audited mining projects.
            </p>
          </div>

          {(currentRole === 'approving_authority' || currentRole === 'admin' || currentRole === 'executive') && (
            <button
              onClick={() => setIsIssueModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Record New Award of Work</span>
            </button>
          )}
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
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{complex.name}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Quick Metrics Row - Strictly calculated from filteredAwards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Work Orders</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{filteredAwards.length}</div>
          <span className="text-[10px] text-slate-500">Sanctioned under DOP</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Cumulative Value</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {formatCrores(filteredAwards.reduce((acc, curr) => acc + (curr.totalContractValue || 0), 0))}
          </div>
          <span className="text-[10px] text-emerald-700">Inclusive of GST</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/20 shadow-2xs">
          <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">Secured by PBG</span>
          <div className="text-2xl font-black text-blue-700 mt-1">
            {formatCrores(filteredAwards.reduce((acc, curr) => acc + (curr.pbgDetails?.amount || 0), 0))}
          </div>
          <span className="text-[10px] text-blue-700">Bank Guarantees held</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-2xs">
          <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider block">Active Execution</span>
          <div className="text-2xl font-black text-indigo-700 mt-1">
            {filteredAwards.filter((a) => a.status === 'Under Execution' || a.status === 'Contract Signed').length}
          </div>
          <span className="text-[10px] text-indigo-700">Projects on site</span>
        </div>
      </div>

      {/* 3. Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Award Code, PO #, GeM Bid ID, or Vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        <button
          onClick={onNavigateToProjects}
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 self-end sm:self-auto"
        >
          <span>View 12-Stage Execution Gantt</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 4. Awards Cards / Table Grid */}
      <div className="space-y-4">
        {filteredAwards.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-2">
            <Award className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">
              {awards.length === 0
                ? 'No award of work records available.'
                : selectedComplexFilter !== 'ALL'
                ? 'No award of work records available for this complex.'
                : 'No records available.'}
            </h3>
            <p className="text-xs text-slate-400">
              Award of work entries are created after commercial evaluation and sanctioning of work orders.
            </p>
          </div>
        ) : (
          filteredAwards.map((award) => (
            <div 
              key={award.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-emerald-300 shadow-2xs p-5 transition-all space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {award.awardCode}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      PS: {award.problemStatementCode}
                    </span>
                    {award.mineComplexCode && (
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        {award.mineComplexCode}
                      </span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-50 text-blue-800 border border-blue-200">
                      PO: {award.poNumber}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-50 text-purple-800 border border-purple-200">
                      GeM: {award.gemBidNumber}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      award.status === 'Sanctioned' ? 'bg-amber-100 text-amber-800' :
                      award.status === 'Contract Signed' ? 'bg-cyan-100 text-cyan-800' :
                      award.status === 'Under Execution' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {award.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{award.workTitle}</h3>
                  <div className="text-xs text-slate-600 flex items-center gap-3">
                    <span className="font-semibold text-slate-800">{award.vendorName}</span>
                    <span>·</span>
                    <span>{award.department}</span>
                    <span>·</span>
                    <span>{award.projectComplex}</span>
                  </div>
                </div>

                <div className="text-right shrink-0 space-y-1">
                  <div className="text-xs text-slate-400">Total Contract Value</div>
                  <div className="text-xl font-extrabold text-slate-900">{formatCrores(award.totalContractValue)}</div>
                  <div className="text-[11px] text-slate-500">
                    Basic: {formatCrores(award.basicAwardValue)} + GST {formatCrores(award.gstAmount)}
                  </div>
                </div>
              </div>

              {/* Middle specifications & PBG Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-slate-50/70 p-3.5 rounded-lg border border-slate-100">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Performance Guarantee</span>
                  <div className="font-semibold text-slate-800">{award.pbgDetails?.issuingBank || 'Bank Guarantee'}</div>
                  <div className="text-slate-600 font-mono text-[11px]">BG: {award.pbgDetails?.bgNumber || 'Pending'}</div>
                  <div className="text-[11px] text-emerald-700 font-medium">
                    Amt: {formatLakhs(award.pbgDetails?.amount || 0)} · Valid to {award.pbgDetails?.validityDate || 'N/A'}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Contract Tenures</span>
                  <div className="text-slate-700">Delivery Period: <span className="font-bold text-slate-900">{award.deliveryPeriodWeeks} Weeks</span></div>
                  <div className="text-slate-700">Completion: <span className="font-bold text-slate-900">{award.completionPeriodMonths} Months</span></div>
                  <div className="text-slate-700">Warranty: <span className="font-bold text-slate-900">{award.warrantyPeriodMonths} Months</span></div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Nodal NMDC Officer</span>
                  <div className="font-semibold text-slate-800">{award.responsibleOfficer}</div>
                  <div className="text-slate-600 text-[11px]">{award.responsibleOfficerDesignation}</div>
                  <div className="text-[10px] text-slate-400">Award Date: {award.awardDate}</div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="text-xs text-slate-500 line-clamp-1 max-w-xl">
                  <span className="font-bold text-slate-700">Scope:</span> {award.scopeOfWorkSummary}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    onClick={() => setSelectedAward(award)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Dossier</span>
                  </button>

                  <button
                    onClick={onNavigateToProjects}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>Track 12 Stages →</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 5. Issue Award of Work Modal */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  NMDC Delegation of Powers (DOP)
                </span>
                <h2 className="text-lg font-bold text-slate-900">
                  Record Formal Award of Work & Issue LOA / PO
                </h2>
              </div>
              <button
                onClick={() => setIsIssueModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAward} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Select Problem Statement *</label>
                  <select
                    value={newAwardForm.problemStatementId}
                    onChange={(e) => {
                      const ps = problemStatements.find((p) => p.id === e.target.value);
                      setNewAwardForm({
                        ...newAwardForm,
                        problemStatementId: e.target.value,
                        workTitle: ps ? `Turnkey Implementation of ${ps.title}` : newAwardForm.workTitle,
                        department: ps?.department || newAwardForm.department,
                        mineComplexCode: ps?.mineComplexCode || newAwardForm.mineComplexCode,
                      });
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                    required
                  >
                    <option value="">-- Choose Problem Statement --</option>
                    {problemStatements.map((ps) => (
                      <option key={ps.id} value={ps.id}>
                        {ps.code} - {ps.title.slice(0, 40)}...
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contractor / Awardee Vendor *</label>
                  <input
                    type="text"
                    value={newAwardForm.vendorName}
                    onChange={(e) => setNewAwardForm({ ...newAwardForm, vendorName: e.target.value })}
                    placeholder="Enter registered vendor company name"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Formal Work Title *</label>
                <input
                  type="text"
                  value={newAwardForm.workTitle}
                  onChange={(e) => setNewAwardForm({ ...newAwardForm, workTitle: e.target.value })}
                  placeholder="e.g. Design, Supply and Commissioning of Mine Automation Package"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  required
                />
              </div>

              {/* Statutory Numbers */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">PO Number *</label>
                  <input
                    type="text"
                    value={newAwardForm.poNumber}
                    onChange={(e) => setNewAwardForm({ ...newAwardForm, poNumber: e.target.value })}
                    placeholder="e.g. PO-45001"
                    className="w-full p-1.5 bg-white border border-slate-200 rounded font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 block mb-1">GeM Bid ID *</label>
                  <input
                    type="text"
                    value={newAwardForm.gemBidNumber}
                    onChange={(e) => setNewAwardForm({ ...newAwardForm, gemBidNumber: e.target.value })}
                    placeholder="e.g. GEM/2026/B/1001"
                    className="w-full p-1.5 bg-white border border-slate-200 rounded font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 block mb-1">LOA Ref *</label>
                  <input
                    type="text"
                    value={newAwardForm.loaNumber}
                    onChange={(e) => setNewAwardForm({ ...newAwardForm, loaNumber: e.target.value })}
                    placeholder="e.g. LOA/NMDC/2026/01"
                    className="w-full p-1.5 bg-white border border-slate-200 rounded font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 block mb-1">PR Number</label>
                  <input
                    type="text"
                    value={newAwardForm.prNumber}
                    onChange={(e) => setNewAwardForm({ ...newAwardForm, prNumber: e.target.value })}
                    placeholder="e.g. PR-2026-001"
                    className="w-full p-1.5 bg-white border border-slate-200 rounded font-mono"
                  />
                </div>
              </div>

              {/* Financials */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Basic Value (₹) *</label>
                  <input
                    type="number"
                    value={newAwardForm.basicAwardValue}
                    onChange={(e) => {
                      const basic = Number(e.target.value);
                      const gst = Math.round(basic * 0.18);
                      setNewAwardForm({
                        ...newAwardForm,
                        basicAwardValue: basic,
                        gstAmount: gst,
                        totalContractValue: basic + gst,
                        bgAmount: Math.round((basic + gst) * 0.05),
                      });
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">18% GST (₹)</label>
                  <input
                    type="number"
                    value={newAwardForm.gstAmount}
                    readOnly
                    className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-emerald-800 block mb-1">Total Contract (₹)</label>
                  <input
                    type="number"
                    value={newAwardForm.totalContractValue}
                    readOnly
                    className="w-full p-2 bg-emerald-50 border border-emerald-200 rounded-lg font-bold font-mono text-emerald-900"
                  />
                </div>
              </div>

              {/* PBG */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-emerald-50/40 p-3 rounded-xl border border-emerald-100">
                <div>
                  <label className="font-bold text-emerald-900 block mb-1">PBG BG Number</label>
                  <input
                    type="text"
                    value={newAwardForm.bgNumber}
                    onChange={(e) => setNewAwardForm({ ...newAwardForm, bgNumber: e.target.value })}
                    placeholder="e.g. BG-SBI-2026-001"
                    className="w-full p-1.5 bg-white border border-emerald-200 rounded font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-emerald-900 block mb-1">Issuing Bank</label>
                  <input
                    type="text"
                    value={newAwardForm.issuingBank}
                    onChange={(e) => setNewAwardForm({ ...newAwardForm, issuingBank: e.target.value })}
                    placeholder="e.g. State Bank of India"
                    className="w-full p-1.5 bg-white border border-emerald-200 rounded"
                  />
                </div>

                <div>
                  <label className="font-bold text-emerald-900 block mb-1">BG Validity Date</label>
                  <input
                    type="date"
                    value={newAwardForm.validityDate}
                    onChange={(e) => setNewAwardForm({ ...newAwardForm, validityDate: e.target.value })}
                    className="w-full p-1.5 bg-white border border-emerald-200 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Scope of Work Summary *</label>
                <textarea
                  rows={2}
                  value={newAwardForm.scopeOfWorkSummary}
                  onChange={(e) => setNewAwardForm({ ...newAwardForm, scopeOfWorkSummary: e.target.value })}
                  placeholder="Detail the turnkey deliverables, technical specifications compliance, and milestones..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Sanction Award & Initiate Execution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Award Dossier Modal */}
      {selectedAward && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {selectedAward.awardCode}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">NMDC Work Order Dossier</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-1">{selectedAward.workTitle}</h2>
              </div>
              <button
                onClick={() => setSelectedAward(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-medium block">Awardee Contractor</span>
                  <span className="text-sm font-bold text-slate-900">{selectedAward.vendorName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Total Contract Value</span>
                  <span className="text-sm font-bold text-emerald-700">{formatCrores(selectedAward.totalContractValue)}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">PO Number</span>
                  <span className="font-mono font-bold text-slate-800">{selectedAward.poNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">GeM Bid Number</span>
                  <span className="font-mono font-bold text-slate-800">{selectedAward.gemBidNumber}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Payment Terms</h4>
                <p className="p-3 bg-slate-50 rounded-lg text-slate-700 leading-relaxed">
                  {selectedAward.paymentTerms}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Scope of Work Summary</h4>
                <p className="p-3 bg-slate-50 rounded-lg text-slate-700 leading-relaxed">
                  {selectedAward.scopeOfWorkSummary}
                </p>
              </div>

              <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">
                  Authorized by {selectedAward.responsibleOfficer} ({selectedAward.responsibleOfficerDesignation})
                </span>

                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Dossier</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

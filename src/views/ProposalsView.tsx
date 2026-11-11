import React, { useState } from 'react';
import { Proposal, ProblemStatement, UserRole, User, EvaluationParameter, MineComplexCode, AUTHORIZED_MINE_COMPLEXES } from '../types/index.js';
import { 
  FileText, 
  Search, 
  Filter, 
  Award, 
  CheckCircle2, 
  Clock, 
  IndianRupee, 
  ShieldCheck, 
  Eye, 
  Lock, 
  Download, 
  Printer, 
  ChevronRight,
  Building,
  Check,
  X,
  MapPin,
  Building2
} from 'lucide-react';

interface ProposalsViewProps {
  proposals: Proposal[];
  problemStatements: ProblemStatement[];
  currentRole: UserRole;
  currentUser: User | null;
  activeComplexCode?: MineComplexCode | 'ALL';
  parameters?: EvaluationParameter[];
  onOpenEvaluate: (proposal: Proposal) => void;
  onOpenCompare: (problemStatement: ProblemStatement) => void;
  onRefreshData: () => void;
}

export const ProposalsView: React.FC<ProposalsViewProps> = ({
  proposals,
  problemStatements,
  currentRole,
  currentUser,
  activeComplexCode = 'ALL',
  parameters = [],
  onOpenEvaluate,
  onOpenCompare,
  onRefreshData,
}) => {
  const [selectedPsFilter, setSelectedPsFilter] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedComplexFilter, setSelectedComplexFilter] = useState<string>(activeComplexCode);
  const [search, setSearch] = useState('');
  const [activeProposalDetail, setActiveProposalDetail] = useState<Proposal | null>(null);

  const isVendor = currentRole === 'vendor';

  const filtered = proposals.filter((p) => {
    // 1. Vendor confidentiality constraint: vendor only sees own offers
    if (isVendor) {
      const isOwner = (currentUser?.vendorId && p.vendorId === currentUser.vendorId) ||
                      (currentUser?.id && p.vendorId === currentUser.id);
      if (!isOwner) return false;
    }

    // 2. Complex filter
    if (selectedComplexFilter !== 'ALL' && p.mineComplexCode && p.mineComplexCode !== selectedComplexFilter) {
      return false;
    }

    // 3. Problem statement filter
    if (selectedPsFilter !== 'All' && p.problemStatementCode !== selectedPsFilter && p.problemStatementId !== selectedPsFilter) {
      return false;
    }

    // 4. Status filter
    if (selectedStatus !== 'All' && p.status !== selectedStatus) {
      return false;
    }

    // 5. Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.proposalCode.toLowerCase().includes(q) ||
        p.vendorName.toLowerCase().includes(q) ||
        p.problemStatementTitle.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeComplexObj = AUTHORIZED_MINE_COMPLEXES.find(c => c.code === selectedComplexFilter);

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-emerald-800 font-bold uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              VENDOR BUDGETARY OFFERS & TECHNICAL EVALUATION · SECTIONS 10, 12 & 13
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500 font-medium text-xs">
              {selectedComplexFilter === 'ALL' ? 'All Complexes' : activeComplexObj?.name}: {filtered.length} Submissions
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Vendor Solutions, Budgetary Offers & Evaluation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Technical proposal scrutiny, itemized cost comparisons, compliance recording and PoC recommendations.
          </p>
        </div>

        {/* Global Compare CTA */}
        {problemStatements.length > 0 && !isVendor && (
          <button
            onClick={() => {
              const psWithOffers = problemStatements.find((p) => proposals.some((prop) => prop.problemStatementId === p.id)) || problemStatements[0];
              onOpenCompare(psWithOffers);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs text-xs transition-colors shrink-0"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Open Comparative Statement Matrix</span>
          </button>
        )}
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
          const count = proposals.filter(p => p.mineComplexCode === complex.code).length;
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
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-500'}`}>
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
            placeholder="Search by proposal code, vendor name, or title..."
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedPsFilter}
            onChange={(e) => setSelectedPsFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-700"
          >
            <option value="All">All Problem Statements</option>
            {problemStatements.map((ps) => (
              <option key={ps.id} value={ps.code}>{ps.code} - {ps.title.slice(0, 32)}...</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-700"
          >
            <option value="All">All Evaluation Statuses</option>
            <option value="Submitted">Submitted (Locked)</option>
            <option value="Under Technical Evaluation">Under Technical Evaluation</option>
            <option value="Technically Qualified">Technically Qualified</option>
            <option value="Technically Disqualified">Technically Disqualified</option>
            <option value="PoC Recommended">PoC Recommended</option>
            <option value="Award Recommended">Award Recommended</option>
          </select>
        </div>
      </div>

      {/* Proposals Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 text-xs space-y-2">
          <FileText className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-700 text-sm">
            {proposals.length === 0
              ? 'No vendor offers received.'
              : selectedComplexFilter !== 'ALL'
              ? 'No budgetary offers have been received for this complex.'
              : 'No records available.'}
          </p>
          <p className="text-slate-400 text-xs">
            {isVendor
              ? 'You have not submitted budgetary offers yet. Browse open opportunities to submit.'
              : 'Vendor budgetary offers and technical proposals will appear here as they are received.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((prop) => {
            const totalCr = (prop.costBreakdown?.totalEstimatedCost || 0) / 10000000;
            const basicCr = (prop.costBreakdown?.subtotalCost || 0) / 10000000;
            const compliance = prop.technicalComplianceStatus || 'Under Review';
            const relatedPs = problemStatements.find((p) => p.id === prop.problemStatementId || p.code === prop.problemStatementCode);

            return (
              <div
                key={prop.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between p-5 space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      {prop.isLocked && <Lock className="w-3 h-3 text-emerald-700" />}
                      <span>{prop.proposalCode}</span>
                    </span>

                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                        compliance === 'Compliant'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : compliance === 'Partially Compliant'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}
                    >
                      {compliance} {prop.technicalMarks ? `(${prop.technicalMarks}/100)` : ''}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono font-bold text-blue-700 uppercase block">
                      {prop.problemStatementCode} {prop.mineComplexCode ? `· ${prop.mineComplexCode}` : ''}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1 mt-0.5">
                      {prop.problemStatementTitle}
                    </h3>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Responding Vendor:</span>
                      <strong className="text-slate-800 truncate max-w-[160px]">{prop.vendorName}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Basic Subtotal:</span>
                      <span className="font-mono text-slate-700">₹ {basicCr.toFixed(2)} Cr</span>
                    </div>
                    <div className="flex items-center justify-between font-bold text-blue-900 border-t border-slate-200 pt-1">
                      <span>Total Offer (Incl GST):</span>
                      <span className="font-mono text-xs">₹ {totalCr.toFixed(2)} Cr</span>
                    </div>
                  </div>

                  <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">
                    {prop.proposedSolution || prop.understandingOfRequirement}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Delivery: {prop.deliveryPeriodWeeks} Weeks</span>
                    <span>Warranty: {prop.warrantyMonths} Months</span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Rev #{prop.revisionNumber} ({prop.submittedAt ? prop.submittedAt.slice(0, 10) : ''})</span>
                    <button
                      onClick={() => setActiveProposalDetail(prop)}
                      className="text-blue-700 hover:text-blue-800 font-semibold text-xs flex items-center gap-1"
                    >
                      <span>Full Cost & Tech Specs</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {/* Evaluate Button for Technical Evaluators & Approvers */}
                    {(currentRole === 'tech_evaluator' || currentRole === 'approving_authority' || currentRole === 'admin') && (
                      <button
                        onClick={() => onOpenEvaluate(prop)}
                        className="py-1.5 px-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 shadow-2xs"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Evaluate Tech</span>
                      </button>
                    )}

                    {/* Compare Button */}
                    {relatedPs && !isVendor && (
                      <button
                        onClick={() => onOpenCompare(relatedPs)}
                        className="py-1.5 px-3 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1 shadow-2xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Compare (L1)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Proposal Modal */}
      {activeProposalDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-xs text-slate-800 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {activeProposalDetail.proposalCode}
                  </span>
                  <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {activeProposalDetail.status}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="font-bold text-slate-800">{activeProposalDetail.vendorName}</span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                  Budgetary Offer & Proposal: {activeProposalDetail.problemStatementCode} - {activeProposalDetail.problemStatementTitle}
                </h2>
              </div>
              <button
                onClick={() => setActiveProposalDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Part A: Technical Proposal Details */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">A</span>
                  <span>Part A: Technical Proposal & Architecture</span>
                </h4>

                <div>
                  <span className="font-semibold text-slate-700 block mb-0.5">1. Understanding of Operational Requirement:</span>
                  <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-150 leading-relaxed">
                    {activeProposalDetail.understandingOfRequirement}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-slate-700 block mb-0.5">2. Proposed Solution & Engineering Methodology:</span>
                  <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-150 leading-relaxed">
                    {activeProposalDetail.proposedSolution}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">Technical Specifications:</span>
                    <p className="text-slate-600 font-mono text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                      {activeProposalDetail.technicalSpecifications || 'Standard heavy industrial grade specifications.'}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">System Architecture:</span>
                    <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                      {activeProposalDetail.systemArchitecture || 'On-premise edge architecture with redundant controller.'}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">Equipment Details:</span>
                    <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                      {activeProposalDetail.equipmentDetails || 'Industrial edge displays and telemetry nodes.'}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">Software & Database:</span>
                    <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                      {activeProposalDetail.softwareDetails || 'Enterprise server software with REST API integration.'}
                    </p>
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-slate-700 block mb-0.5">Technical Deviations (if any):</span>
                  <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-150 font-medium">
                    {activeProposalDetail.technicalDeviations || 'None. Fully compliant with specifications.'}
                  </p>
                </div>
              </div>

              {/* Part B: Itemized Costing Table */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center">B</span>
                  <span>Part B: Itemized Commercial Costing Schedule</span>
                </h4>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100 font-bold text-slate-700">
                      <tr>
                        <th className="py-2 px-3">Item Component</th>
                        <th className="py-2 px-3 text-right">Cost (₹)</th>
                        <th className="py-2 px-3 text-right">In Lakhs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-1.5 px-3">Equipment Cost</td>
                        <td className="py-1.5 px-3 text-right font-mono">₹ {(activeProposalDetail.costBreakdown?.equipmentCost || 0).toLocaleString('en-IN')}</td>
                        <td className="py-1.5 px-3 text-right font-mono text-slate-500">₹ {((activeProposalDetail.costBreakdown?.equipmentCost || 0) / 100000).toFixed(2)} L</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3">Hardware & Telemetry Cost</td>
                        <td className="py-1.5 px-3 text-right font-mono">₹ {(activeProposalDetail.costBreakdown?.hardwareCost || 0).toLocaleString('en-IN')}</td>
                        <td className="py-1.5 px-3 text-right font-mono text-slate-500">₹ {((activeProposalDetail.costBreakdown?.hardwareCost || 0) / 100000).toFixed(2)} L</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3">Software Platform & Licenses</td>
                        <td className="py-1.5 px-3 text-right font-mono">₹ {((activeProposalDetail.costBreakdown?.softwareCost || 0) + (activeProposalDetail.costBreakdown?.licenceCost || 0)).toLocaleString('en-IN')}</td>
                        <td className="py-1.5 px-3 text-right font-mono text-slate-500">₹ {(((activeProposalDetail.costBreakdown?.softwareCost || 0) + (activeProposalDetail.costBreakdown?.licenceCost || 0)) / 100000).toFixed(2)} L</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3">Installation & Commissioning</td>
                        <td className="py-1.5 px-3 text-right font-mono">₹ {((activeProposalDetail.costBreakdown?.installationCost || 0) + (activeProposalDetail.costBreakdown?.commissioningCost || 0)).toLocaleString('en-IN')}</td>
                        <td className="py-1.5 px-3 text-right font-mono text-slate-500">₹ {(((activeProposalDetail.costBreakdown?.installationCost || 0) + (activeProposalDetail.costBreakdown?.commissioningCost || 0)) / 100000).toFixed(2)} L</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3">System Integration & Training</td>
                        <td className="py-1.5 px-3 text-right font-mono">₹ {((activeProposalDetail.costBreakdown?.integrationCost || 0) + (activeProposalDetail.costBreakdown?.trainingCost || 0)).toLocaleString('en-IN')}</td>
                        <td className="py-1.5 px-3 text-right font-mono text-slate-500">₹ {(((activeProposalDetail.costBreakdown?.integrationCost || 0) + (activeProposalDetail.costBreakdown?.trainingCost || 0)) / 100000).toFixed(2)} L</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3">Freight, Transit Insurance & Incidental</td>
                        <td className="py-1.5 px-3 text-right font-mono">₹ {((activeProposalDetail.costBreakdown?.freightCost || 0) + (activeProposalDetail.costBreakdown?.otherCharges || 0)).toLocaleString('en-IN')}</td>
                        <td className="py-1.5 px-3 text-right font-mono text-slate-500">₹ {(((activeProposalDetail.costBreakdown?.freightCost || 0) + (activeProposalDetail.costBreakdown?.otherCharges || 0)) / 100000).toFixed(2)} L</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3">Annual Maintenance Contract (AMC / Year)</td>
                        <td className="py-1.5 px-3 text-right font-mono">₹ {(activeProposalDetail.costBreakdown?.amcCostPerYear || 0).toLocaleString('en-IN')}</td>
                        <td className="py-1.5 px-3 text-right font-mono text-slate-500">₹ {((activeProposalDetail.costBreakdown?.amcCostPerYear || 0) / 100000).toFixed(2)} L</td>
                      </tr>
                      <tr className="bg-slate-50 font-semibold">
                        <td className="py-2 px-3">Basic Subtotal (Excl. Taxes)</td>
                        <td className="py-2 px-3 text-right font-mono">₹ {(activeProposalDetail.costBreakdown?.subtotalCost || 0).toLocaleString('en-IN')}</td>
                        <td className="py-2 px-3 text-right font-mono">₹ {((activeProposalDetail.costBreakdown?.subtotalCost || 0) / 10000000).toFixed(4)} Cr</td>
                      </tr>
                      <tr className="bg-slate-50 font-semibold">
                        <td className="py-2 px-3">GST (@ {activeProposalDetail.costBreakdown?.gstRate || 18}%)</td>
                        <td className="py-2 px-3 text-right font-mono">₹ {(activeProposalDetail.costBreakdown?.gstAmount || 0).toLocaleString('en-IN')}</td>
                        <td className="py-2 px-3 text-right font-mono">₹ {((activeProposalDetail.costBreakdown?.gstAmount || 0) / 10000000).toFixed(4)} Cr</td>
                      </tr>
                      <tr className="bg-blue-100/60 font-bold text-blue-950 text-sm">
                        <td className="py-2.5 px-3">Total Estimated Contract Value (Incl. GST)</td>
                        <td className="py-2.5 px-3 text-right font-mono">₹ {(activeProposalDetail.costBreakdown?.totalEstimatedCost || 0).toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-right font-mono">₹ {((activeProposalDetail.costBreakdown?.totalEstimatedCost || 0) / 10000000).toFixed(2)} Cr</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Part C: Commercial Conditions */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center">C</span>
                  <span>Part C: Commercial Terms & Conditions</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Delivery Period:</span>
                    <strong className="text-slate-800 block mt-0.5">{activeProposalDetail.deliveryPeriodWeeks} Weeks</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Warranty Period:</span>
                    <strong className="text-slate-800 block mt-0.5">{activeProposalDetail.warrantyMonths} Months</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Offer Validity:</span>
                    <strong className="text-slate-800 block mt-0.5">{activeProposalDetail.commercialConditions?.offerValidityDays || 120} Days</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">AMC Duration:</span>
                    <strong className="text-slate-800 block mt-0.5">{activeProposalDetail.commercialConditions?.amcYears || 3} Years</strong>
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-slate-700 block mb-0.5">Payment Terms:</span>
                  <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                    {activeProposalDetail.commercialConditions?.paymentTerms || 'Standard progressive milestone payments.'}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-slate-700 block mb-0.5">Price Basis & Logistics:</span>
                  <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                    {activeProposalDetail.commercialConditions?.priceBasis || 'FOR Destination site.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-slate-500 text-[11px]">
                Offer Status: {activeProposalDetail.isLocked ? 'Locked (Final Submission)' : 'Draft'}
              </span>

              <div className="flex items-center gap-2">
                {(currentRole === 'tech_evaluator' || currentRole === 'approving_authority' || currentRole === 'admin') && (
                  <button
                    onClick={() => {
                      const p = activeProposalDetail;
                      setActiveProposalDetail(null);
                      onOpenEvaluate(p);
                    }}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-xs"
                  >
                    Conduct Technical Evaluation
                  </button>
                )}

                <button
                  onClick={() => setActiveProposalDetail(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

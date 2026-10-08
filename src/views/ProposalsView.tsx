import React, { useState } from 'react';
import { Proposal, ProblemStatement, UserRole, User, EvaluationParameter } from '../types/index.js';
import { 
  FileText, 
  Search, 
  Filter, 
  Sparkles, 
  Award, 
  Layers, 
  CheckCircle2, 
  Clock, 
  IndianRupee, 
  TrendingUp,
  ShieldCheck,
  Eye,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { fetchApi } from '../utils/api.js';

interface ProposalsViewProps {
  proposals: Proposal[];
  problemStatements: ProblemStatement[];
  currentRole: UserRole;
  currentUser: User | null;
  parameters: EvaluationParameter[];
  onOpenEvaluate: (proposal: Proposal) => void;
  onOpenCompare: (problemStatement: ProblemStatement) => void;
  onOpenAiAnalysis: (proposal: Proposal) => void;
  onRefreshData: () => void;
}

export const ProposalsView: React.FC<ProposalsViewProps> = ({
  proposals,
  problemStatements,
  currentRole,
  currentUser,
  parameters,
  onOpenEvaluate,
  onOpenCompare,
  onOpenAiAnalysis,
  onRefreshData,
}) => {
  const [selectedPsFilter, setSelectedPsFilter] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [activeProposalDetail, setActiveProposalDetail] = useState<Proposal | null>(null);

  const filtered = proposals.filter((p) => {
    if (selectedPsFilter !== 'All' && p.problemStatementCode !== selectedPsFilter && p.problemStatementId !== selectedPsFilter) return false;
    if (selectedStatus !== 'All' && p.status !== selectedStatus) return false;
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

  const handleConvertProposalToProject = async (prop: Proposal) => {
    if (!confirm(`Are you sure you want to approve PoC and sanction Project for ${prop.vendorName} on ${prop.proposalCode}?`)) return;

    try {
      await fetchApi('/api/projects/convert-proposal', {
        method: 'POST',
        body: JSON.stringify({
          proposalId: prop.id,
          projectName: `${prop.problemStatementTitle} Deployment (${prop.vendorName})`,
          projectManager: 'Dr. Amitabh Verma (GM - Mining)',
        }),
      });
      alert('Project successfully created and sanctioned for PoC execution!');
      onRefreshData();
    } catch (e: any) {
      alert(`Error creating project: ${e.message}`);
    }
  };

  const getStatusColor = (status: Proposal['status']) => {
    switch (status) {
      case 'PoC Approved':
        return 'text-emerald-700 bg-emerald-50 border-emerald-300';
      case 'PoC Recommended':
        return 'text-blue-700 bg-blue-50 border-blue-300';
      case 'Technical Shortlisted':
      case 'Commercial Review':
      case 'Under Technical Review':
        return 'text-amber-700 bg-amber-50 border-amber-300';
      case 'Rejected':
        return 'text-rose-700 bg-rose-50 border-rose-300';
      default:
        return 'text-slate-700 bg-slate-100 border-slate-300';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-blue-700 font-semibold tracking-wider uppercase">
            VENDOR SOLUTIONS & BUDGETARY OFFERS
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Technical & Commercial Proposal Registry
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review detailed solution architectures, itemized budgets, weighted evaluation scores, and PoC approvals.
          </p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by proposal ID, vendor, challenge..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={selectedPsFilter}
              onChange={(e) => setSelectedPsFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              <option value="All">All Challenges</option>
              {problemStatements.map((ps) => (
                <option key={ps.id} value={ps.code}>
                  {ps.code}: {ps.title.substring(0, 36)}...
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Submitted">Submitted (New)</option>
              <option value="Under Technical Review">Under Technical Review</option>
              <option value="Technical Shortlisted">Technical Shortlisted</option>
              <option value="Commercial Review">Commercial Review</option>
              <option value="PoC Recommended">PoC Recommended</option>
              <option value="PoC Approved">PoC Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span>Showing <strong>{filtered.length}</strong> proposals</span>
          <span className="font-mono text-slate-700">
            Total Pipeline Value: ₹ {(filtered.reduce((acc, p) => acc + (p.costBreakdown?.totalCostInclGst || 0), 0) / 10000000).toFixed(2)} Cr
          </span>
        </div>
      </div>

      {/* Proposals List Table / Cards */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                <th className="p-3.5">Proposal Code</th>
                <th className="p-3.5">Vendor & Challenge</th>
                <th className="p-3.5 text-right">Total Offer (₹)</th>
                <th className="p-3.5 text-center">Tech / Comm</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((prop) => {
                const ps = problemStatements.find((p) => p.id === prop.problemStatementId || p.code === prop.problemStatementCode);
                return (
                  <tr key={prop.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {prop.proposalCode}
                      <span className="block font-normal text-slate-400 text-[10px]">
                        {new Date(prop.submittedAt).toLocaleDateString()}
                      </span>
                    </td>

                    <td className="p-3.5 max-w-sm">
                      <div className="font-bold text-slate-900">{prop.vendorName}</div>
                      <div className="text-[11px] text-slate-500 truncate" title={prop.problemStatementTitle}>
                        <strong className="font-mono text-slate-700">{prop.problemStatementCode}</strong> · {prop.problemStatementTitle}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Arch: {prop.architectureType} · Timeline: {prop.timelineMonths} mo
                      </div>
                    </td>

                    <td className="p-3.5 text-right font-mono tabular-nums whitespace-nowrap">
                      <div className="font-bold text-slate-900">
                        ₹ {((prop.costBreakdown?.totalCostInclGst || 0) / 10000000).toFixed(2)} Cr
                      </div>
                      <div className="text-[10px] text-slate-500">
                        PoC: ₹ {((prop.costBreakdown?.pocCost || 0) / 100000).toFixed(1)} L
                      </div>
                    </td>

                    <td className="p-3.5 text-center whitespace-nowrap">
                      {prop.technicalScore ? (
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold text-blue-700">
                            {prop.technicalScore}
                          </span>
                          <span className="text-slate-400"> / </span>
                          <span className="font-mono font-bold text-emerald-700">
                            {prop.commercialScore}
                          </span>
                          <span className="block text-[10px] text-slate-400 font-mono">
                            Comp: {prop.compositeScore}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Pending Review</span>
                      )}
                    </td>

                    <td className="p-3.5 text-center whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(prop.status)}`}>
                        {prop.status}
                      </span>
                    </td>

                    <td className="p-3.5 text-right whitespace-nowrap space-x-1.5">
                      <button
                        onClick={() => setActiveProposalDetail(prop)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition-colors"
                        title="View Full Offer Details"
                      >
                        Details
                      </button>

                      <button
                        onClick={() => onOpenAiAnalysis(prop)}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-xs font-semibold transition-colors inline-flex items-center gap-1"
                        title="Run Gemini AI Proposal Breakdown"
                      >
                        <Sparkles className="w-3 h-3 text-blue-600" />
                        <span>AI Review</span>
                      </button>

                      {(currentRole === 'reviewer' || currentRole === 'admin') && (
                        <button
                          onClick={() => onOpenEvaluate(prop)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold transition-colors"
                        >
                          Score
                        </button>
                      )}

                      {currentRole === 'admin' && prop.status !== 'PoC Approved' && (
                        <button
                          onClick={() => handleConvertProposalToProject(prop)}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold shadow-2xs transition-colors"
                          title="Convert to Live Implementation Project"
                        >
                          Sanction PoC
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Proposal Drawer */}
      {activeProposalDetail && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono text-blue-400 font-semibold tracking-wider">
                  PROPOSAL DOSSIER & BUDGETARY BREAKDOWN
                </span>
                <h3 className="font-bold text-sm text-slate-100 leading-snug">
                  {activeProposalDetail.proposalCode}: {activeProposalDetail.vendorName}
                </h3>
              </div>
              <button onClick={() => setActiveProposalDetail(null)} className="p-1.5 text-slate-400 hover:text-white rounded-md">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 text-xs space-y-6">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Problem Statement:</span>
                  <span className="font-bold text-slate-900">{activeProposalDetail.problemStatementCode}</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm leading-snug">
                  {activeProposalDetail.problemStatementTitle}
                </h4>
              </div>

              {/* Technical Architecture */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs">Technical Solution Description</h4>
                <p className="text-slate-700 leading-relaxed bg-white border border-slate-100 p-3 rounded-lg shadow-2xs">
                  {activeProposalDetail.solutionDescription}
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600">
                  <div>Architecture: <strong className="text-slate-800">{activeProposalDetail.architectureType}</strong></div>
                  <div>Timeline: <strong className="text-slate-800">{activeProposalDetail.timelineMonths} Months</strong></div>
                  <div>Warranty: <strong className="text-slate-800">{activeProposalDetail.warrantyPeriodYears} Years</strong></div>
                  <div>Hardware: <strong className="text-slate-800">{activeProposalDetail.hardwareSpecs}</strong></div>
                </div>
              </div>

              {/* Budgetary Offer Schedule */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-xs">Itemized Budgetary Offer Schedule (₹ INR)</h4>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 divide-y divide-slate-200/80">
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-600">Proof of Concept (PoC) Cost:</span>
                    <span className="font-mono tabular-nums font-semibold">₹ {activeProposalDetail.costBreakdown?.pocCost?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-600">Pilot Deployment Cost:</span>
                    <span className="font-mono tabular-nums font-semibold">₹ {activeProposalDetail.costBreakdown?.pilotCost?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-600">Hardware & Edge Equipment:</span>
                    <span className="font-mono tabular-nums font-semibold">₹ {activeProposalDetail.costBreakdown?.hardwareCost?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-600">Software Development & Models:</span>
                    <span className="font-mono tabular-nums font-semibold">₹ {activeProposalDetail.costBreakdown?.softwareCost?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-600">Integration & SCADA Tap:</span>
                    <span className="font-mono tabular-nums font-semibold">₹ {activeProposalDetail.costBreakdown?.integrationCost?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-600">Annual Maintenance (AMC / yr):</span>
                    <span className="font-mono tabular-nums font-semibold">₹ {activeProposalDetail.costBreakdown?.amcCostPerYear?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1.5 font-bold text-slate-800">
                    <span>Subtotal (Excl. Taxes):</span>
                    <span className="font-mono tabular-nums">₹ {activeProposalDetail.costBreakdown?.totalExclGst?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1.5 font-bold text-slate-800">
                    <span>GST (18%):</span>
                    <span className="font-mono tabular-nums">₹ {activeProposalDetail.costBreakdown?.gstAmount?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-2 text-sm font-bold text-blue-900 bg-blue-50 px-2 rounded-lg mt-1">
                    <span>Total Project Cost (Incl. GST):</span>
                    <span className="font-mono tabular-nums">₹ {activeProposalDetail.costBreakdown?.totalCostInclGst?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Business Case */}
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2">
                <h4 className="font-bold text-emerald-950 text-xs">Projected Business Case & ROI</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[11px] text-emerald-900">
                  <div>Annual Savings: <strong className="font-mono">₹ {((activeProposalDetail.businessCase?.expectedSavingsAnnual || 0) / 10000000).toFixed(2)} Cr</strong></div>
                  <div>Availability Gain: <strong className="font-mono">+{activeProposalDetail.businessCase?.availabilityImprovementPct}%</strong></div>
                  <div>Payback Period: <strong className="font-mono">{activeProposalDetail.businessCase?.paybackPeriodMonths} Months</strong></div>
                </div>
                <p className="text-[11px] text-emerald-800 pt-1 border-t border-emerald-200/60 leading-relaxed">
                  {activeProposalDetail.businessCase?.safetyBenefits}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <button
                onClick={() => {
                  const p = activeProposalDetail;
                  setActiveProposalDetail(null);
                  onOpenAiAnalysis(p);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Deep AI Analysis</span>
              </button>
              <button
                onClick={() => setActiveProposalDetail(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

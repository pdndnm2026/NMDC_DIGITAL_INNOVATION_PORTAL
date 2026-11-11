import React, { useState } from 'react';
import { Proposal, ProblemStatement } from '../types/index.js';
import { 
  X, 
  CheckCircle2, 
  Download, 
  Printer, 
  FileSpreadsheet, 
  ArrowUpDown, 
  AlertCircle,
  Building,
  ShieldCheck,
  Check,
  FileText
} from 'lucide-react';

interface ProposalComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  problemStatement: ProblemStatement;
  proposals: Proposal[];
}

export const ProposalComparisonModal: React.FC<ProposalComparisonModalProps> = ({
  isOpen,
  onClose,
  problemStatement,
  proposals,
}) => {
  const [sortBy, setSortBy] = useState<'cost_asc' | 'cost_desc' | 'score_desc'>('cost_asc');
  const [filterCompliance, setFilterCompliance] = useState<string>('All');

  if (!isOpen) return null;

  let relevantProposals = proposals.filter(
    (p) => p.problemStatementId === problemStatement.id || p.problemStatementCode === problemStatement.code
  );

  if (filterCompliance !== 'All') {
    relevantProposals = relevantProposals.filter((p) => (p.technicalComplianceStatus || 'Compliant') === filterCompliance);
  }

  // Sort proposals
  relevantProposals.sort((a, b) => {
    const costA = a.costBreakdown?.totalEstimatedCost || 0;
    const costB = b.costBreakdown?.totalEstimatedCost || 0;
    const scoreA = a.technicalMarks || 0;
    const scoreB = b.technicalMarks || 0;

    if (sortBy === 'cost_asc') return costA - costB;
    if (sortBy === 'cost_desc') return costB - costA;
    if (sortBy === 'score_desc') return scoreB - scoreA;
    return 0;
  });

  // Export to CSV function
  const handleExportCSV = () => {
    const headers = [
      'Vendor Name',
      'Proposal Code',
      'Technical Compliance',
      'Technical Score',
      'Basic Cost (Rs)',
      'GST Amount (Rs)',
      'Freight (Rs)',
      'Installation (Rs)',
      'Annual AMC (Rs)',
      'Total Cost Incl GST (Rs)',
      'Delivery Period (Weeks)',
      'Warranty (Months)',
      'Offer Validity (Days)',
      'Remarks',
    ];

    const rows = relevantProposals.map((p) => [
      `"${p.vendorName}"`,
      `"${p.proposalCode}"`,
      `"${p.technicalComplianceStatus || 'Compliant'}"`,
      p.technicalMarks || 'N/A',
      p.costBreakdown?.subtotalCost || 0,
      p.costBreakdown?.gstAmount || 0,
      p.costBreakdown?.freightCost || 0,
      p.costBreakdown?.installationCost || 0,
      p.costBreakdown?.amcCostPerYear || 0,
      p.costBreakdown?.totalEstimatedCost || 0,
      p.commercialConditions?.deliveryPeriodWeeks || p.deliveryPeriodWeeks || 12,
      p.commercialConditions?.warrantyPeriodMonths || p.warrantyMonths || 12,
      p.commercialConditions?.offerValidityDays || 120,
      `"${p.committeeRecommendation || p.technicalRemarks || 'Under Evaluation'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NMDC_Commercial_Comparative_Statement_${problemStatement.code}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[94vh] flex flex-col overflow-hidden text-xs text-slate-800 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-emerald-800 font-bold uppercase tracking-wider text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                COMMERCIAL EVALUATION COMPARATIVE STATEMENT · SECTION 13
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600 font-mono font-semibold">{problemStatement.code}</span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-0.5">
              Comparative Statement: {problemStatement.title}
            </h2>
            <p className="text-slate-500 text-[11px]">
              Project Complex: {problemStatement.projectComplex} · Indicative Budget: {problemStatement.indicativeBudget}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
              title="Export Comparative Statement to CSV / Excel"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export CSV/Excel</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
              title="Print formal report"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print Statement</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Legal & Procedural Notice */}
        <div className="p-3 bg-amber-50/80 border-b border-amber-200 px-6 flex items-start gap-3 shrink-0 text-amber-950">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-[11px]">
            <strong className="font-bold">Statutory Notice on Commercial Budgetary Offers:</strong>
            <span>
              {' '}This statement tabulates non-binding budgetary offers received in response to NMDC problem statements for techno-commercial feasibility study, planning and indicative sanction. Formal procurement contracts, purchase orders and awards of work must follow applicable CVC, GeM guidelines and financial concurrence procedures.
            </span>
          </div>
        </div>

        {/* Toolbar: Filters & Sorting */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600 text-[11px]">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-medium"
              >
                <option value="cost_asc">Total Cost: Lowest to Highest (L1 first)</option>
                <option value="cost_desc">Total Cost: Highest to Lowest</option>
                <option value="score_desc">Technical Score: Highest to Lowest</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600 text-[11px]">Technical Filter:</span>
              <select
                value={filterCompliance}
                onChange={(e) => setFilterCompliance(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-medium"
              >
                <option value="All">All Offers ({proposals.length})</option>
                <option value="Compliant">Compliant Only</option>
                <option value="Partially Compliant">Partially Compliant</option>
              </select>
            </div>
          </div>

          <span className="text-slate-500 font-mono text-[11px]">
            Showing {relevantProposals.length} Submitted Vendor Budgetary Offers
          </span>
        </div>

        {/* Content Body: Full Comparative Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {relevantProposals.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              No vendor proposals match the selected filters for this challenge.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Rank</th>
                    <th className="py-2.5 px-3">Vendor Name</th>
                    <th className="py-2.5 px-3">Technical Compliance</th>
                    <th className="py-2.5 px-3 text-right">Basic Cost (₹)</th>
                    <th className="py-2.5 px-3 text-right">GST (₹)</th>
                    <th className="py-2.5 px-3 text-right">Freight (₹)</th>
                    <th className="py-2.5 px-3 text-right">Installation (₹)</th>
                    <th className="py-2.5 px-3 text-right">AMC (₹ / Yr)</th>
                    <th className="py-2.5 px-3 text-right bg-blue-50/50 text-blue-900 font-extrabold">Total Cost (₹)</th>
                    <th className="py-2.5 px-3 text-center">Delivery</th>
                    <th className="py-2.5 px-3 text-center">Warranty</th>
                    <th className="py-2.5 px-3 text-center">Validity</th>
                    <th className="py-2.5 px-3">Remarks & Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {relevantProposals.map((p, index) => {
                    const isL1 = index === 0 && sortBy === 'cost_asc';
                    const basic = p.costBreakdown?.subtotalCost || 0;
                    const gst = p.costBreakdown?.gstAmount || 0;
                    const freight = p.costBreakdown?.freightCost || 0;
                    const installation = p.costBreakdown?.installationCost || 0;
                    const amc = p.costBreakdown?.amcCostPerYear || 0;
                    const total = p.costBreakdown?.totalEstimatedCost || 0;
                    const delivery = p.commercialConditions?.deliveryPeriodWeeks || p.deliveryPeriodWeeks || 12;
                    const warranty = p.commercialConditions?.warrantyPeriodMonths || p.warrantyMonths || 12;
                    const validity = p.commercialConditions?.offerValidityDays || 120;
                    const compliance = p.technicalComplianceStatus || 'Compliant';

                    return (
                      <tr key={p.id} className={isL1 ? 'bg-emerald-50/40 font-medium' : 'hover:bg-slate-50'}>
                        {/* Rank */}
                        <td className="py-2.5 px-3 font-mono font-bold">
                          {isL1 ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px]">
                              L1
                            </span>
                          ) : (
                            <span className="text-slate-500">L{index + 1}</span>
                          )}
                        </td>

                        {/* Vendor Name */}
                        <td className="py-2.5 px-3">
                          <strong className="block text-slate-900">{p.vendorName}</strong>
                          <span className="font-mono text-[10px] text-slate-400">{p.proposalCode}</span>
                        </td>

                        {/* Technical Compliance */}
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold text-[11px] ${
                              compliance === 'Compliant'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : compliance === 'Partially Compliant'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {compliance} {p.technicalMarks ? `(${p.technicalMarks}/100)` : ''}
                          </span>
                        </td>

                        {/* Basic Cost */}
                        <td className="py-2.5 px-3 text-right font-mono font-semibold">
                          ₹ {basic.toLocaleString('en-IN')}
                        </td>

                        {/* GST */}
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          ₹ {gst.toLocaleString('en-IN')}
                        </td>

                        {/* Freight */}
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          ₹ {freight.toLocaleString('en-IN')}
                        </td>

                        {/* Installation */}
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          ₹ {installation.toLocaleString('en-IN')}
                        </td>

                        {/* AMC */}
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          ₹ {amc.toLocaleString('en-IN')}
                        </td>

                        {/* Total Cost */}
                        <td className="py-2.5 px-3 text-right font-mono font-extrabold text-blue-900 bg-blue-50/40">
                          ₹ {total.toLocaleString('en-IN')}
                          <span className="block text-[10px] font-normal text-slate-500">
                            (₹ {(total / 10000000).toFixed(2)} Cr)
                          </span>
                        </td>

                        {/* Delivery */}
                        <td className="py-2.5 px-3 text-center font-mono">
                          {delivery} Wks
                        </td>

                        {/* Warranty */}
                        <td className="py-2.5 px-3 text-center font-mono">
                          {warranty} Mo
                        </td>

                        {/* Validity */}
                        <td className="py-2.5 px-3 text-center font-mono">
                          {validity} Days
                        </td>

                        {/* Remarks */}
                        <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                          {p.committeeRecommendation ? (
                            <strong className="text-slate-800">{p.committeeRecommendation}</strong>
                          ) : (
                            p.technicalRemarks || 'Under Evaluation'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Formally generated by NMDC Commercial & Financial Evaluation Cell per Section 13.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl transition-colors"
          >
            Close Comparative Statement
          </button>
        </div>
      </div>
    </div>
  );
};

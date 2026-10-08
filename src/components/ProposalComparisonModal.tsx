import React from 'react';
import { Proposal, ProblemStatement } from '../types/index.js';
import { X, CheckCircle2, TrendingUp, Sparkles, Building, AlertCircle } from 'lucide-react';

interface ProposalComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  problemStatement: ProblemStatement;
  proposals: Proposal[];
  onSelectAiAnalysis: (proposal: Proposal) => void;
}

export const ProposalComparisonModal: React.FC<ProposalComparisonModalProps> = ({
  isOpen,
  onClose,
  problemStatement,
  proposals,
  onSelectAiAnalysis,
}) => {
  if (!isOpen) return null;

  const relevantProposals = proposals.filter(
    (p) => p.problemStatementId === problemStatement.id || p.problemStatementCode === problemStatement.code
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-white text-slate-900 flex items-center justify-between border-b border-slate-200">
          <div>
            <span className="text-[11px] font-mono text-blue-700 font-bold tracking-wider">
              {problemStatement.code} · PROPOSAL COMPARATIVE EVALUATION MATRIX
            </span>
            <h2 className="text-base font-bold text-slate-900 truncate max-w-2xl">
              {problemStatement.title}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 text-xs space-y-6">
          {relevantProposals.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              No vendor proposals submitted for this challenge yet.
            </div>
          ) : (
            <>
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-blue-900 flex items-center justify-between">
                <span>
                  Comparing <strong>{relevantProposals.length} vendor offers</strong> against NMDC technical criteria (70% weight) and commercial criteria (30% weight).
                </span>
                <span className="font-semibold text-slate-700">Budget Indication: {problemStatement.budgetaryIndication}</span>
              </div>

              {/* Graphical Comparison Bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h4 className="font-bold text-slate-800 mb-3 text-xs">
                  Comparative Composite Score (Technical 70% + Commercial 30%)
                </h4>
                <div className="space-y-3">
                  {relevantProposals.map((p) => {
                    const tech = p.technicalScore || 80;
                    const comm = p.commercialScore || 80;
                    const composite = p.compositeScore || Math.round((tech * 0.7 + comm * 0.3) * 10) / 10;
                    return (
                      <div key={p.id} className="space-y-1">
                        <div className="flex justify-between font-medium text-slate-800">
                          <span>{p.vendorName} ({p.proposalCode})</span>
                          <span className="font-mono font-bold text-blue-700">{composite} / 100</span>
                        </div>
                        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden flex">
                          <div
                            className="bg-blue-700 h-full rounded-l-full transition-all duration-500"
                            style={{ width: `${tech * 0.7}%` }}
                            title={`Technical: ${tech}/100`}
                          />
                          <div
                            className="bg-emerald-600 h-full rounded-r-full transition-all duration-500"
                            style={{ width: `${comm * 0.3}%` }}
                            title={`Commercial: ${comm}/100`}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                          <span>Technical: {tech} (weighted: {(tech * 0.7).toFixed(1)})</span>
                          <span>Commercial: {comm} (weighted: {(comm * 0.3).toFixed(1)})</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Comprehensive Comparative Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold text-[11px]">
                      <th className="p-3 w-1/4">Evaluation Parameter</th>
                      {relevantProposals.map((p) => (
                        <th key={p.id} className="p-3 text-center border-l border-slate-200">
                          <div className="font-bold text-slate-900">{p.vendorName}</div>
                          <div className="text-[10px] font-mono text-slate-500 font-normal">{p.proposalCode}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-800">Technical Score (100)</td>
                      {relevantProposals.map((p) => (
                        <td key={p.id} className="p-3 text-center border-l border-slate-200 font-mono font-bold text-blue-700">
                          {p.technicalScore || '—'}
                        </td>
                      ))}
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-800">Commercial Score (100)</td>
                      {relevantProposals.map((p) => (
                        <td key={p.id} className="p-3 text-center border-l border-slate-200 font-mono font-bold text-emerald-700">
                          {p.commercialScore || '—'}
                        </td>
                      ))}
                    </tr>
                    <tr className="hover:bg-slate-50/50 bg-slate-50/40">
                      <td className="p-3 font-bold text-slate-900">Total Cost (Incl. 18% GST)</td>
                      {relevantProposals.map((p) => (
                        <td key={p.id} className="p-3 text-center border-l border-slate-200 font-mono font-bold text-slate-900">
                          ₹ {((p.costBreakdown?.totalCostInclGst || 0) / 10000000).toFixed(2)} Cr
                        </td>
                      ))}
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-800">PoC Sanction Cost</td>
                      {relevantProposals.map((p) => (
                        <td key={p.id} className="p-3 text-center border-l border-slate-200 font-mono">
                          ₹ {((p.costBreakdown?.pocCost || 0) / 100000).toFixed(1)} Lakhs
                        </td>
                      ))}
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-800">Implementation Timeline</td>
                      {relevantProposals.map((p) => (
                        <td key={p.id} className="p-3 text-center border-l border-slate-200 font-medium">
                          {p.timelineMonths} Months
                        </td>
                      ))}
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-800">Projected Annual Savings</td>
                      {relevantProposals.map((p) => (
                        <td key={p.id} className="p-3 text-center border-l border-slate-200 font-mono text-emerald-700 font-semibold">
                          ₹ {((p.businessCase?.expectedSavingsAnnual || 0) / 10000000).toFixed(2)} Cr / yr
                        </td>
                      ))}
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-800">Projected Payback & ROI</td>
                      {relevantProposals.map((p) => (
                        <td key={p.id} className="p-3 text-center border-l border-slate-200 font-mono">
                          {p.businessCase?.paybackPeriodMonths} mo ({p.businessCase?.roiYears} yrs)
                        </td>
                      ))}
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-800">Warranty Period</td>
                      {relevantProposals.map((p) => (
                        <td key={p.id} className="p-3 text-center border-l border-slate-200">
                          {p.warrantyPeriodYears} Years
                        </td>
                      ))}
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-800">Architecture Deployment</td>
                      {relevantProposals.map((p) => (
                        <td key={p.id} className="p-3 text-center border-l border-slate-200 font-medium text-slate-700">
                          {p.architectureType}
                        </td>
                      ))}
                    </tr>
                    <tr className="hover:bg-slate-50/50 bg-slate-50/40">
                      <td className="p-3 font-bold text-slate-900">Committee Recommendation</td>
                      {relevantProposals.map((p) => (
                        <td key={p.id} className="p-3 text-center border-l border-slate-200">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              p.committeeRecommendation === 'Recommend PoC'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : p.committeeRecommendation === 'Keep on Standby'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            {p.committeeRecommendation || p.status}
                          </span>
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-white">
                      <td className="p-3 font-semibold text-slate-800">AI Deep Analysis</td>
                      {relevantProposals.map((p) => (
                        <td key={p.id} className="p-3 text-center border-l border-slate-200">
                          <button
                            onClick={() => {
                              onSelectAiAnalysis(p);
                              onClose();
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Analyse with AI</span>
                          </button>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg"
          >
            Close Matrix
          </button>
        </div>
      </div>
    </div>
  );
};

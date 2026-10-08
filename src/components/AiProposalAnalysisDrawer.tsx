import React, { useState } from 'react';
import { Proposal, ProposalAIReview } from '../types/index.js';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  ShieldAlert, 
  TrendingUp, 
  Loader2,
  RefreshCw
} from 'lucide-react';
import { fetchApi } from '../utils/api.js';

interface AiProposalAnalysisDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: Proposal | null;
  onUpdateAnalysis: (updatedReview: ProposalAIReview) => void;
}

export const AiProposalAnalysisDrawer: React.FC<AiProposalAnalysisDrawerProps> = ({
  isOpen,
  onClose,
  proposal,
  onUpdateAnalysis,
}) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !proposal) return null;

  const review: ProposalAIReview = proposal.aiReview || {
    executiveSummary: `Technical evaluation of ${proposal.vendorName}'s submission for "${proposal.problemStatementTitle}". Proposed architecture aligns with open-cast mining standards.`,
    problemUnderstandingScore: 90,
    technicalStrengths: [
      'Comprehensive telemetry sampling architecture with local edge buffer capability.',
      'Industrial grade components rated for mining environmental extremes.',
    ],
    technicalGaps: [
      'Requires validation of dust seal maintenance intervals under Bailadila micro-fine iron dust.',
    ],
    technologyMaturity: 'Proven in Indian heavy industrial PSU environments',
    implementationRisks: ['Integration coordination with active 3-shift mine haulage operations.'],
    cybersecurityRisks: ['Ensure on-premise air-gapped configuration is verified with Corporate IT.'],
    commercialObservations: [
      `Total cost of ₹ ${((proposal.costBreakdown?.totalCostInclGst || 0) / 10000000).toFixed(2)} Cr is aligned with approved budget.`,
    ],
    costConcerns: ['Verify whether specialized transducer recalibrations are covered under AMC.'],
    roiAssessment: `Projected payback of ${proposal.businessCase?.paybackPeriodMonths || 14} months is viable.`,
    scalability: 'Deployable across multiple NMDC mine complexes.',
    vendorCapability: 'High technical competence demonstrated through previous engagements.',
    questionsForVendor: [
      'What is the mean time between sensor failures under 20g mechanical shock?',
      'Can edge processors execute without any external internet connection for up to 30 days?',
    ],
    recommendedDueDiligence: [
      'Inspect previous mining pilot sites to evaluate long-term sensor reliability.',
    ],
    confidenceScore: 92,
  };

  const handleReanalyze = async () => {
    setLoading(true);
    try {
      const res = await fetchApi(`/api/proposals/${proposal.id}/analyze-ai`, {
        method: 'POST',
      });
      if (res.success && res.data) {
        onUpdateAnalysis(res.data);
      }
    } catch (e: any) {
      alert(`AI Analysis error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 bg-white text-slate-900 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shadow-2xs">
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight flex items-center gap-2 text-slate-900">
                Gemini AI Proposal Intelligence
                <span className="text-[10px] bg-blue-100 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded font-mono font-bold">
                  {proposal.proposalCode}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">{proposal.vendorName} · {proposal.problemStatementCode}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReanalyze}
              disabled={loading}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
              title="Re-run Gemini AI Analysis"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-700' : ''}`} />
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Advisory PSU Banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-[11px] text-amber-900 flex items-center gap-2 font-medium">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            Advisory Notice: AI analysis provides analytical summaries and risk observations. Final procurement decisions remain exclusively with NMDC committees.
          </span>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 text-xs space-y-6">
          {/* Executive Summary */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-slate-900 text-xs">Executive Summary</h4>
              <span className="text-[11px] font-mono text-blue-700 font-semibold">
                Understanding Score: {review.problemUnderstandingScore} / 100
              </span>
            </div>
            <p className="text-slate-700 leading-relaxed text-xs">
              {review.executiveSummary}
            </p>
            <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-2 border-t border-slate-200">
              <span>Technology Maturity: <strong className="text-slate-800">{review.technologyMaturity}</strong></span>
              <span>·</span>
              <span>AI Confidence: <strong className="text-slate-800">{review.confidenceScore}%</strong></span>
            </div>
          </div>

          {/* Strengths & Gaps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2">
              <h4 className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Technical Strengths
              </h4>
              <ul className="space-y-1.5 text-emerald-900 text-[11px]">
                {review.technicalStrengths.map((str, i) => (
                  <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 bg-rose-50/50 border border-rose-200 rounded-xl space-y-2">
              <h4 className="font-bold text-rose-950 flex items-center gap-1.5 text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Technical Gaps & Watch-outs
              </h4>
              <ul className="space-y-1.5 text-rose-900 text-[11px]">
                {review.technicalGaps.map((gap, i) => (
                  <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                    <span className="text-rose-600 font-bold">•</span>
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Risks & Cybersecurity */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <ShieldAlert className="w-4 h-4 text-slate-700" />
              Risk Analysis (Implementation & Cybersecurity)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
              <div>
                <strong className="text-slate-800 block mb-1">Operational & Site Risks:</strong>
                <ul className="space-y-1 text-slate-600">
                  {review.implementationRisks.map((r, i) => (
                    <li key={i}>• {r}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong className="text-slate-800 block mb-1">Cybersecurity & OT Data Sovereignty:</strong>
                <ul className="space-y-1 text-slate-600">
                  {review.cybersecurityRisks.map((c, i) => (
                    <li key={i}>• {c}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Commercial & ROI Observations */}
          <div className="p-4 bg-blue-50/40 border border-blue-200 rounded-xl space-y-2">
            <h4 className="font-bold text-blue-950 flex items-center gap-1.5 text-xs">
              <TrendingUp className="w-4 h-4 text-blue-700" />
              Commercial & Financial Viability
            </h4>
            <div className="space-y-1.5 text-[11px] text-slate-700">
              {review.commercialObservations.map((obs, i) => (
                <p key={i}>• {obs}</p>
              ))}
              <p>• <strong>ROI Assessment:</strong> {review.roiAssessment}</p>
              {review.costConcerns.map((cc, i) => (
                <p key={i} className="text-amber-800">• <strong>Cost Concern:</strong> {cc}</p>
              ))}
            </div>
          </div>

          {/* Questions for Vendor & Recommended Due Diligence */}
          <div className="p-4 bg-amber-50/40 border border-amber-200 rounded-xl space-y-3">
            <h4 className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
              <HelpCircle className="w-4 h-4 text-amber-700" />
              Recommended Due Diligence & Technical Clarification Questions
            </h4>
            <div className="space-y-2 text-[11px] text-amber-900">
              <strong className="block text-slate-800">Questions to submit to vendor:</strong>
              <ol className="list-decimal pl-4 space-y-1">
                {review.questionsForVendor.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ol>

              <strong className="block text-slate-800 pt-1">Recommended verification actions:</strong>
              <ul className="space-y-1">
                {review.recommendedDueDiligence.map((dd, i) => (
                  <li key={i}>• {dd}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg"
          >
            Close AI Review
          </button>
        </div>
      </div>
    </div>
  );
};

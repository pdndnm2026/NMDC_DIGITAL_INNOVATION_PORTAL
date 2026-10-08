import React, { useState } from 'react';
import { Proposal, EvaluationParameter } from '../types/index.js';
import { X, CheckCircle2, Award, Loader2 } from 'lucide-react';
import { fetchApi } from '../utils/api.js';

interface ReviewerEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: Proposal;
  parameters: EvaluationParameter[];
  reviewerName: string;
  onEvaluationSuccess: () => void;
}

export const ReviewerEvaluationModal: React.FC<ReviewerEvaluationModalProps> = ({
  isOpen,
  onClose,
  proposal,
  parameters,
  reviewerName,
  onEvaluationSuccess,
}) => {
  // Map parameter id -> marks (0-100)
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    parameters.forEach((param) => {
      init[param.id] = 85;
    });
    return init;
  });

  const [recommendation, setRecommendation] = useState<'Recommend PoC' | 'Keep on Standby' | 'Clarification Required' | 'Reject'>('Recommend PoC');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  // Calculate technical & commercial scores based on weights
  const technicalParams = parameters.filter((p) => p.type === 'technical');
  const commercialParams = parameters.filter((p) => p.type === 'commercial');

  const totalTechWeight = technicalParams.reduce((acc, p) => acc + p.weightPct, 0) || 1;
  const totalCommWeight = commercialParams.reduce((acc, p) => acc + p.weightPct, 0) || 1;

  let weightedTechSum = 0;
  technicalParams.forEach((p) => {
    weightedTechSum += (scores[p.id] || 0) * (p.weightPct / totalTechWeight);
  });

  let weightedCommSum = 0;
  commercialParams.forEach((p) => {
    weightedCommSum += (scores[p.id] || 0) * (p.weightPct / totalCommWeight);
  });

  const calculatedTechScore = Math.round(weightedTechSum);
  const calculatedCommScore = Math.round(weightedCommSum);
  const compositeScore = Math.round((calculatedTechScore * 0.7 + calculatedCommScore * 0.3) * 10) / 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetchApi(`/api/proposals/${proposal.id}/evaluate`, {
        method: 'POST',
        body: JSON.stringify({
          reviewerName,
          technicalScore: calculatedTechScore,
          commercialScore: calculatedCommScore,
          recommendation,
          comments: comments || `Evaluated by ${reviewerName}. Solution aligns with NMDC criteria.`,
        }),
      });

      onEvaluationSuccess();
      onClose();
    } catch (err: any) {
      alert(`Evaluation error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-white text-slate-900 flex items-center justify-between border-b border-slate-200">
          <div>
            <span className="text-[11px] font-mono text-blue-700 font-bold tracking-wider">
              TECHNICAL & COMMERCIAL COMMITTEE SCORING
            </span>
            <h2 className="text-base font-bold text-slate-900">
              Evaluate Proposal: {proposal.proposalCode} ({proposal.vendorName})
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 text-xs space-y-6">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-slate-500 block text-[11px]">Opportunity</span>
              <strong className="text-slate-900 font-semibold text-xs">{proposal.problemStatementTitle}</strong>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[11px]">Proposed Price</span>
              <strong className="text-slate-900 font-mono text-xs">
                ₹ {((proposal.costBreakdown?.totalCostInclGst || 0) / 10000000).toFixed(2)} Cr
              </strong>
            </div>
          </div>

          {/* Technical Parameters */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-xs border-b border-slate-200 pb-1">
              Part A: Technical Evaluation Criteria (70% Global Weight)
            </h4>

            <div className="space-y-3">
              {technicalParams.map((param) => (
                <div key={param.id} className="p-3 bg-white border border-slate-200 rounded-lg">
                  <div className="flex justify-between items-center mb-1.5">
                    <div>
                      <span className="font-semibold text-slate-800">{param.name}</span>
                      <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-mono ml-2">
                        Weight: {param.weightPct}%
                      </span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {scores[param.id] || 0} / 100
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">{param.description}</p>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={scores[param.id] || 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setScores((prev) => ({ ...prev, [param.id]: val }));
                    }}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Commercial Parameters */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-xs border-b border-slate-200 pb-1">
              Part B: Commercial & Financial Criteria (30% Global Weight)
            </h4>

            <div className="space-y-3">
              {commercialParams.map((param) => (
                <div key={param.id} className="p-3 bg-white border border-slate-200 rounded-lg">
                  <div className="flex justify-between items-center mb-1.5">
                    <div>
                      <span className="font-semibold text-slate-800">{param.name}</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono ml-2">
                        Weight: {param.weightPct}%
                      </span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {scores[param.id] || 0} / 100
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">{param.description}</p>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={scores[param.id] || 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setScores((prev) => ({ ...prev, [param.id]: val }));
                    }}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Score Calculation Summary */}
          <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-[11px] text-slate-400">Technical Score: <span className="font-mono text-white font-bold">{calculatedTechScore}/100</span></div>
              <div className="text-[11px] text-slate-400">Commercial Score: <span className="font-mono text-white font-bold">{calculatedCommScore}/100</span></div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-amber-300 font-semibold uppercase tracking-wider">Composite Weighted Score</div>
              <div className="text-xl font-bold font-mono text-white">{compositeScore} / 100</div>
            </div>
          </div>

          {/* Committee Recommendation */}
          <div className="space-y-3">
            <label className="font-semibold text-slate-800 block">Committee Final Recommendation *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Recommend PoC', 'Keep on Standby', 'Clarification Required', 'Reject'] as const).map((rec) => (
                <button
                  key={rec}
                  type="button"
                  onClick={() => setRecommendation(rec)}
                  className={`p-2.5 rounded-lg border text-center font-semibold text-xs transition-colors ${
                    recommendation === rec
                      ? rec === 'Recommend PoC'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-600'
                        : rec === 'Reject'
                        ? 'border-rose-600 bg-rose-50 text-rose-800 ring-2 ring-rose-600'
                        : 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-600'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {rec}
                </button>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div>
            <label className="font-semibold text-slate-800 block mb-1">
              Reviewer Technical Comments & Observations
            </label>
            <textarea
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Record specific rationale for recommendation, site integration caveats, or points for vendor clarification..."
              className="w-full border border-slate-200 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
              <span>Submit Official Evaluation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

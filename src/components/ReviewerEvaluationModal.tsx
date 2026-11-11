import React, { useState } from 'react';
import { Proposal, TechnicalEvaluationParameter } from '../types/index.js';
import { X, CheckCircle2, Award, AlertCircle, FileText, Printer, Check, AlertTriangle } from 'lucide-react';
import { fetchApi } from '../utils/api.js';

interface ReviewerEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: Proposal;
  parameters: TechnicalEvaluationParameter[];
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
  // Standard Section 12 parameters
  const standardParams = [
    { id: 'param-1', name: 'Compliance with Technical Specifications', maxMarks: 20 },
    { id: 'param-2', name: 'Technical Suitability & Mining Duty Fitness', maxMarks: 20 },
    { id: 'param-3', name: 'Scope of Supply & BoQ Completeness', maxMarks: 15 },
    { id: 'param-4', name: 'Performance Parameters & Reliability', maxMarks: 15 },
    { id: 'param-5', name: 'Implementation Methodology & Staging', maxMarks: 10 },
    { id: 'param-6', name: 'Delivery Period Feasibility', maxMarks: 5 },
    { id: 'param-7', name: 'Warranty, Service Support & Spares SLA', maxMarks: 5 },
    { id: 'param-8', name: 'Relevant Experience in PSU / Mining Sector', maxMarks: 5 },
    { id: 'param-9', name: 'Assessment of Technical Deviations', maxMarks: 5 },
  ];

  // Map parameter id -> { compliance, marks, remarks }
  const [evalMap, setEvalMap] = useState<
    Record<string, { compliance: 'Compliant' | 'Partially Compliant' | 'Non-Compliant' | 'Clarification Required'; marks: number; observations: string }>
  >(() => {
    const init: any = {};
    standardParams.forEach((p) => {
      init[p.id] = {
        compliance: 'Compliant',
        marks: p.maxMarks,
        observations: 'Full compliance verified against NMDC requisition specifications.',
      };
    });
    return init;
  });

  const [overallCompliance, setOverallCompliance] = useState<'Compliant' | 'Partially Compliant' | 'Non-Compliant' | 'Clarification Required'>('Compliant');
  const [recommendation, setRecommendation] = useState<'Recommend PoC' | 'Recommend Award of Work' | 'Keep on Standby' | 'Clarification Required' | 'Reject'>('Recommend PoC');
  const [detailedObservations, setDetailedObservations] = useState(
    `The proposal submitted by ${proposal.vendorName} demonstrates high technical competency for ${proposal.problemStatementCode}. Equipment specifications and engineering architecture align with heavy opencast mining conditions.`
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate total marks
  const totalMarksAwarded = Object.values(evalMap).reduce((acc, curr) => acc + (curr.marks || 0), 0);
  const maxMarksTotal = standardParams.reduce((acc, curr) => acc + curr.maxMarks, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await fetchApi(`/api/proposals/${proposal.id}/evaluate`, {
        method: 'PATCH',
        body: JSON.stringify({
          complianceStatus: overallCompliance,
          marks: totalMarksAwarded,
          remarks: detailedObservations,
          evaluatorName: reviewerName || 'Dr. S. K. Nayak (CGM - Technical Evaluation)',
          recommendation,
        }),
      });

      onEvaluationSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Evaluation recording failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-xs text-slate-800 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-blue-700 font-bold uppercase tracking-wider text-[11px] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                TECHNICAL EVALUATION MODULE · SECTION 12
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500 font-medium">Official Committee Scrutiny</span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-0.5">
              Technical Evaluation: {proposal.proposalCode} ({proposal.vendorName})
            </h2>
            <p className="text-slate-500 text-[11px]">
              Problem Statement: {proposal.problemStatementCode} - {proposal.problemStatementTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl m-4 mb-0 flex items-center gap-2 text-rose-800 text-xs shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Summary Box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-slate-500 text-[11px] block">Technical Evaluator:</span>
              <strong className="text-slate-800 text-xs">{reviewerName || 'Dr. S. K. Nayak, CGM (Technical Committee)'}</strong>
            </div>
            <div className="text-right">
              <span className="text-slate-500 text-[11px] block">Aggregate Technical Score:</span>
              <span className="font-mono font-bold text-base text-blue-700">
                {totalMarksAwarded} / {maxMarksTotal} Marks ({Math.round((totalMarksAwarded / maxMarksTotal) * 100)}%)
              </span>
            </div>
          </div>

          {/* Parameter Evaluation Table */}
          <div className="space-y-3">
            <span className="font-bold text-slate-900 block text-xs">
              Configurable Parameter Evaluation & Compliance Recording:
            </span>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {standardParams.map((param, index) => {
                const current = evalMap[param.id] || { compliance: 'Compliant', marks: param.maxMarks, observations: '' };
                return (
                  <div key={param.id} className="p-3.5 bg-white hover:bg-slate-50/50 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400 font-bold text-[11px]">0{index + 1}.</span>
                        <strong className="text-slate-800 font-semibold">{param.name}</strong>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Compliance Radio Buttons */}
                        <select
                          value={current.compliance}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            const defaultMarks = val === 'Compliant' ? param.maxMarks : val === 'Partially Compliant' ? Math.round(param.maxMarks * 0.6) : val === 'Clarification Required' ? Math.round(param.maxMarks * 0.5) : 0;
                            setEvalMap({
                              ...evalMap,
                              [param.id]: { ...current, compliance: val, marks: defaultMarks },
                            });
                          }}
                          className={`font-semibold rounded-lg px-2.5 py-1 text-xs border ${
                            current.compliance === 'Compliant'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : current.compliance === 'Partially Compliant'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : current.compliance === 'Non-Compliant'
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : 'bg-blue-50 text-blue-800 border-blue-300'
                          }`}
                        >
                          <option value="Compliant">Compliant</option>
                          <option value="Partially Compliant">Partially Compliant</option>
                          <option value="Non-Compliant">Non-Compliant</option>
                          <option value="Clarification Required">Clarification Required</option>
                        </select>

                        {/* Marks Input */}
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max={param.maxMarks}
                            value={current.marks}
                            onChange={(e) => {
                              const m = parseInt(e.target.value) || 0;
                              setEvalMap({
                                ...evalMap,
                                [param.id]: { ...current, marks: Math.min(param.maxMarks, m) },
                              });
                            }}
                            className="w-14 border border-slate-300 rounded-lg p-1 text-center font-mono font-bold"
                          />
                          <span className="text-slate-400 font-mono text-[11px]">/ {param.maxMarks}</span>
                        </div>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={current.observations}
                      onChange={(e) =>
                        setEvalMap({
                          ...evalMap,
                          [param.id]: { ...current, observations: e.target.value },
                        })
                      }
                      placeholder="Evaluator's technical observations on this parameter..."
                      className="w-full border border-slate-200 rounded-lg p-1.5 text-slate-700 text-[11px]"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Committee Recommendation & Overall Decision */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div>
              <label className="font-bold text-slate-800 block mb-1">Overall Technical Compliance Status *</label>
              <select
                value={overallCompliance}
                onChange={(e) => setOverallCompliance(e.target.value as any)}
                className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 bg-white"
              >
                <option value="Compliant">Compliant (Technically Qualified)</option>
                <option value="Partially Compliant">Partially Compliant (With Minor Deviations)</option>
                <option value="Clarification Required">Clarification Required</option>
                <option value="Non-Compliant">Non-Compliant (Technically Disqualified)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Committee Recommendation *</label>
              <select
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value as any)}
                className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 bg-white"
              >
                <option value="Recommend PoC">Recommend PoC (Proof of Concept Trial)</option>
                <option value="Recommend Award of Work">Recommend Award of Work</option>
                <option value="Keep on Standby">Keep on Standby (L2/Alternate)</option>
                <option value="Clarification Required">Clarification Required</option>
                <option value="Reject">Reject Proposal</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-800 block mb-1">
                Detailed Technical Observations & Committee Report *
              </label>
              <textarea
                rows={3}
                required
                value={detailedObservations}
                onChange={(e) => setDetailedObservations(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-900"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Permanent audit log entry will be generated upon submission.
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-xs transition-colors"
              >
                {submitting ? 'Recording Evaluation...' : 'Record Technical Evaluation'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

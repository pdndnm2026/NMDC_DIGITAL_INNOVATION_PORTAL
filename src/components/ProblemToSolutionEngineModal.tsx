import React, { useState } from 'react';
import { ProblemToSolutionResult } from '../types/index.js';
import { 
  X, 
  Sparkles, 
  Loader2, 
  Cpu, 
  Database, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight, 
  Building2,
  FileText
} from 'lucide-react';
import { fetchApi } from '../utils/api.js';

interface ProblemToSolutionEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConvertToProblemStatement: (data: {
    title: string;
    description: string;
    expectedOutcome: string;
    keywords: string[];
  }) => void;
}

export const ProblemToSolutionEngineModal: React.FC<ProblemToSolutionEngineModalProps> = ({
  isOpen,
  onClose,
  onConvertToProblemStatement,
}) => {
  const [queryText, setQueryText] = useState('We are having excessive idle time of dumpers.');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProblemToSolutionResult | null>(null);

  if (!isOpen) return null;

  const sampleQueries = [
    'We are having excessive idle time of dumpers.',
    'High power consumption and grinding media wear in secondary ball mills.',
    'Frequent slope failures and rockfall hazards on bench 4 during heavy rains.',
    'Slurry pipeline scaling and pressure drops across the 260 km transit corridor.',
  ];

  const handleRunEngine = async () => {
    if (!queryText.trim()) return;
    setLoading(true);
    try {
      const res = await fetchApi<{ success: boolean; data: ProblemToSolutionResult }>('/api/ai/problem-solution-engine', {
        method: 'POST',
        body: JSON.stringify({ queryText }),
      });

      if (res.success && res.data) {
        setResult(res.data);
      }
    } catch (e: any) {
      alert(`AI Engine error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFormalize = () => {
    if (!result) return;
    const topSol = result.possibleSolutions[0];
    onConvertToProblemStatement({
      title: `AI Solution for ${queryText.slice(0, 50)}...`,
      description: `${queryText}\n\nRecommended Technical Strategy: ${result.recommendedApproach}`,
      expectedOutcome: `Target KPIs: ${result.expectedKpis.map(k => `${k.name} -> ${k.target} ${k.unit}`).join(', ')}`,
      keywords: result.possibleSolutions.map(s => s.technology),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-white text-slate-900 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shadow-2xs">
              <Cpu className="w-5 h-5 text-indigo-700" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-indigo-700 font-bold uppercase tracking-wider block">
                NMDC AI INTELLIGENCE PLATFORM
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                AI Problem-to-Solution Engine
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-800">
          <div className="p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-xl text-indigo-900 leading-relaxed">
            <strong className="block text-indigo-950 mb-0.5">Explore AI Architectures & Telemetry Requirements</strong>
            Enter any mining bottleneck below. The Gemini AI engine will synthesize 5 tailored solutions, enumerate required sensor & operational telemetry streams, establish realistic KPI targets, and allow 1-click formalization.
          </div>

          {/* Query input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900">
                Operational Problem / Scenario:
              </label>
              <span className="text-[11px] text-slate-400">Mining & HEMM Focus</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="e.g. We are having excessive idle time of dumpers..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none text-xs"
              />
              <button
                type="button"
                onClick={handleRunEngine}
                disabled={loading || !queryText.trim()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center gap-1.5 shrink-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin text-amber-300" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
                <span>Generate Solutions</span>
              </button>
            </div>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400">Suggestions:</span>
              {sampleQueries.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setQueryText(q)}
                  className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded transition-colors"
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>

          {/* Results Display */}
          {result && (
            <div className="space-y-6 pt-2 animate-in fade-in duration-200">
              {/* Recommended Approach */}
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider block">
                  RECOMMENDED ARCHITECTURAL BLUEPRINT
                </span>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {result.recommendedApproach}
                </p>
              </div>

              {/* 5 Possible Solutions */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 text-xs flex items-center justify-between">
                  <span>Possible Technical Solutions ({result.possibleSolutions.length})</span>
                  <span className="text-[11px] text-slate-500 font-normal">Ranked by deployment feasibility</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.possibleSolutions.map((sol, index) => (
                    <div
                      key={index}
                      className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 hover:border-indigo-400 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-indigo-700">0{index + 1}.</span>
                        <span className="text-[10px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded">
                          {sol.timeToDeployMonths} months rollout
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 leading-snug">{sol.title}</h4>
                      <p className="text-slate-600 text-[11px] leading-relaxed">{sol.description}</p>
                      <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Tech: <strong>{sol.technology}</strong></span>
                        <span className="text-slate-400">Complexity: {sol.complexity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Required Data & Telemetry vs Expected KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Required Data */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <Database className="w-4 h-4 text-blue-700" />
                    <span>Required Data & Sensor Telemetry</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-slate-700">
                    {result.requiredData.map((d, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Expected KPIs */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <TrendingUp className="w-4 h-4 text-emerald-700" />
                    <span>Expected Operational KPIs & Targets</span>
                  </div>
                  <div className="space-y-2">
                    {result.expectedKpis.map((k, i) => (
                      <div key={i} className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-800">{k.name}</span>
                        <span className="font-mono font-bold text-emerald-700">
                          {k.target} {k.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Convert to Formal NMDC Problem Statement */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Ready to solicit commercial solutions from technology partners?
                </span>
                <button
                  type="button"
                  onClick={handleFormalize}
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-md transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Convert into Formal NMDC Problem Statement</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { User, PlainProblemConversion } from '../types/index.js';
import { 
  X, 
  Sparkles, 
  Loader2, 
  Send, 
  CheckCircle2, 
  HelpCircle, 
  Cpu, 
  TrendingUp, 
  Layers,
  ArrowRight,
  Lightbulb
} from 'lucide-react';
import { fetchApi } from '../utils/api.js';

interface PostProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSubmitSuccess: () => void;
}

export const PostProblemModal: React.FC<PostProblemModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSubmitSuccess,
}) => {
  const [rawText, setRawText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [converting, setConverting] = useState(false);
  const [structuredResult, setStructuredResult] = useState<PlainProblemConversion | null>(null);

  // Field selection
  const [mineComplex, setMineComplex] = useState(currentUser?.projectComplex || 'Bailadila Deposit 5 (Kirandul)');
  const [equipmentName, setEquipmentName] = useState('BH100S 100-Tonne Dumpers');

  if (!isOpen) return null;

  const quickSamples = [
    'Our dumpers are experiencing frequent hydraulic hose failures in shift 2.',
    'Excessive idle time of dumpers waiting at the shovel and crushing plant hopper.',
    'Primary crusher eccentric shaft overheating during peak iron ore throughput.',
    'Conveyor belt longitudinal tear detection is currently purely manual and slow.',
    'Dense dust fog during dry seasons at the unloading hopper reducing operator visibility.',
  ];

  const handleConvertWithAi = async () => {
    if (!rawText.trim()) {
      alert('Please describe your operational problem first.');
      return;
    }

    setConverting(true);
    try {
      const res = await fetchApi<{ success: boolean; data: PlainProblemConversion }>('/api/ai/convert-problem', {
        method: 'POST',
        body: JSON.stringify({ rawProblemText: rawText }),
      });

      if (res.success && res.data) {
        setStructuredResult(res.data);
      }
    } catch (e: any) {
      alert(`AI Conversion error: ${e.message}`);
    } finally {
      setConverting(false);
    }
  };

  const handlePublishAsChallenge = async () => {
    if (!structuredResult) return;
    setSubmitting(true);
    try {
      await fetchApi('/api/problems', {
        method: 'POST',
        body: JSON.stringify({
          title: structuredResult.structuredTitle,
          department: structuredResult.suggestedDepartment || 'HEMM Workshop & Maintenance',
          projectComplex: mineComplex,
          category: structuredResult.problemCategory,
          problemDescription: `${rawText}\n\nAI Analysis: ${structuredResult.potentialSolution}`,
          currentProcess: 'Manual shift inspection and reactive maintenance logging.',
          currentDifficulties: `Frequent unplanned outages causing production bottlenecks on ${equipmentName}.`,
          rootCause: 'Wear, environmental dust, continuous severe duty cycle.',
          expectedOutcome: structuredResult.expectedBenefitSummary,
          budgetaryIndication: structuredResult.indicativeBudgetRange || '₹ 50 - 75 Lakhs',
          submissionDeadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString().split('T')[0],
          equipmentAffected: equipmentName || structuredResult.equipmentAffected,
          aiSuggestedKeywords: structuredResult.possibleTechnology,
        }),
      });

      onSubmitSuccess();
      onClose();
    } catch (e: any) {
      alert(`Publish error: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveAsEmployeeIdea = async () => {
    if (!structuredResult) return;
    setSubmitting(true);
    try {
      await fetchApi('/api/ideas', {
        method: 'POST',
        body: JSON.stringify({
          title: structuredResult.structuredTitle,
          submitterName: currentUser?.name || 'NMDC Officer',
          submitterEmail: currentUser?.email || 'officer@nmdc.co.in',
          employeeId: currentUser?.employeeId || 'NMDC-FLD-9102',
          designation: currentUser?.designation || 'Site Maintenance Engineer',
          department: structuredResult.suggestedDepartment || 'Mining Operations',
          projectComplex: mineComplex,
          location: 'Field Mining Pit',
          contactNumber: '+91 94250 12345',
          problemStatement: rawText,
          existingProcess: 'Reactive breakdown repairs and visual inspections.',
          currentDifficulties: 'High downtime and costly spare part replacements.',
          rootCause: 'Operating in harsh opencast conditions.',
          frequency: 'Weekly occurrence',
          employeesAffected: 30,
          equipmentAffected: equipmentName,
          productionImpact: 'Potential bottleneck in ore haulage schedule.',
          costImpact: '₹ 25-50 Lakhs annual repair costs',
          proposedInnovation: structuredResult.potentialSolution,
          aiDigitalTechnology: structuredResult.possibleTechnology.join(', '),
          expectedSolution: structuredResult.potentialSolution,
          expectedBenefit: structuredResult.expectedBenefitSummary,
          estimatedCost: structuredResult.indicativeBudgetRange || '₹ 40 Lakhs',
          estimatedAnnualSavings: '₹ 1.20 Cr',
          expectedRoiYears: 1.0,
          expectedImplementationMonths: 3,
        }),
      });

      onSubmitSuccess();
      onClose();
    } catch (e: any) {
      alert(`Save error: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-white text-slate-900 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-2xs">
              <Lightbulb className="w-5 h-5 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-blue-700 font-bold uppercase tracking-wider block">
                FIELD PERSONNEL SIMPLIFIED ENTRY
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Post an Operational Problem
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-800">
          <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl text-blue-900 leading-relaxed">
            <strong className="block text-blue-950 mb-0.5">No technical or AI jargon required!</strong>
            Simply describe the equipment issue or daily bottleneck in your own words. NMDC's AI Engine will automatically convert your field problem into a structured engineering statement with suggested technologies and KPIs.
          </div>

          {/* Mine complex and equipment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Mine / Complex</label>
              <select
                value={mineComplex}
                onChange={(e) => setMineComplex(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-medium"
              >
                <option value="Bailadila Deposit 5 (Kirandul)">Bailadila Deposit 5 (Kirandul)</option>
                <option value="Bailadila Deposit 14/11C (Bacheli)">Bailadila Deposit 14/11C (Bacheli)</option>
                <option value="Donimalai Iron Ore Mine (Karnataka)">Donimalai Iron Ore Mine (Karnataka)</option>
                <option value="Kumaraswamy Iron Ore Mine (Karnataka)">Kumaraswamy Iron Ore Mine (Karnataka)</option>
                <option value="Pellet Plant, Visakhapatnam">Pellet Plant, Visakhapatnam</option>
                <option value="Diamond Mining Project (Panna, MP)">Diamond Mining Project (Panna, MP)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Equipment / Area</label>
              <input
                type="text"
                value={equipmentName}
                onChange={(e) => setEquipmentName(e.target.value)}
                placeholder="e.g. BH100S Dumpers, Shovel PC3000, Crusher..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-medium"
              />
            </div>
          </div>

          {/* User Plain Problem Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900">
                What problem are you experiencing? *
              </label>
              <span className="text-[11px] text-slate-400">Plain Hindi or English</span>
            </div>
            <textarea
              rows={3}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="e.g. Our dumpers are experiencing frequent hydraulic hose failures during monsoon hauling, causing unplanned breakdown hours..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none text-xs leading-relaxed"
            />

            {/* Quick Prompts */}
            <div className="space-y-1 pt-1">
              <span className="text-[11px] text-slate-500 font-medium">Or pick a common mining scenario:</span>
              <div className="flex flex-wrap gap-1.5">
                {quickSamples.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRawText(sample)}
                    className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md transition-colors text-left truncate max-w-full"
                  >
                    "{sample.slice(0, 50)}..."
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AI Convert Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleConvertWithAi}
              disabled={converting || !rawText.trim()}
              className="w-full py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              {converting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Converting Plain Problem with NMDC AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Convert to Structured Statement (AI Engine)</span>
                </>
              )}
            </button>
          </div>

          {/* AI Structured Output Card */}
          {structuredResult && (
            <div className="border border-blue-200 bg-gradient-to-br from-blue-50/40 via-white to-slate-50 rounded-xl p-5 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-blue-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-900">AI Structured Problem Statement</span>
                </div>
                <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                  {structuredResult.problemCategory}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
                  FORMALIZED TITLE
                </span>
                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                  {structuredResult.structuredTitle}
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-700 font-semibold">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Possible Technologies</span>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {structuredResult.possibleTechnology.map((t) => (
                      <span key={t} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Potential KPIs</span>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {structuredResult.potentialKpis.map((k) => (
                      <span key={k} className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded text-[11px] font-medium border border-emerald-100">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                <span className="font-semibold text-slate-800 block">Recommended Solution Approach:</span>
                <p className="text-slate-600 leading-relaxed">
                  {structuredResult.potentialSolution}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px] p-2.5 bg-slate-100/70 rounded-lg">
                <div>
                  <span className="text-slate-500 block">Indicative Budget:</span>
                  <strong className="text-slate-900 font-mono">{structuredResult.indicativeBudgetRange}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Suggested Department:</span>
                  <strong className="text-slate-900">{structuredResult.suggestedDepartment}</strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleSaveAsEmployeeIdea}
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit to NMDC Idea Pipeline</span>
                </button>

                <button
                  type="button"
                  onClick={handlePublishAsChallenge}
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Publish as Open Challenge</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { User, IdeaAIAnalysis, IdeaDuplicateMatch, InnovationScoreBreakdown } from '../types/index.js';
import { 
  X, 
  Sparkles, 
  Loader2, 
  Send, 
  Paperclip, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Copy, 
  TrendingUp, 
  Cpu, 
  ShieldCheck,
  Building
} from 'lucide-react';
import { fetchApi } from '../utils/api.js';

interface IdeaSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSubmitSuccess: () => void;
}

export const IdeaSubmissionModal: React.FC<IdeaSubmissionModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSubmitSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState(currentUser?.department || 'Mining & HEMM Engineering');
  const [projectComplex, setProjectComplex] = useState(currentUser?.projectComplex || 'Bailadila Deposit 5');
  const [location, setLocation] = useState('Kirandul, Dantewada, Chhattisgarh');
  const [contactNumber, setContactNumber] = useState('+91 94250 00000');
  const [employeeId, setEmployeeId] = useState(currentUser?.employeeId || 'NMDC-BAI-4089');
  const [designation, setDesignation] = useState(currentUser?.designation || 'General Manager (Mining)');

  // Problem
  const [problemStatement, setProblemStatement] = useState('');
  const [existingProcess, setExistingProcess] = useState('');
  const [currentDifficulties, setCurrentDifficulties] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [frequency, setFrequency] = useState('Daily shifts');
  const [employeesAffected, setEmployeesAffected] = useState<number>(45);
  const [equipmentAffected, setEquipmentAffected] = useState('');
  const [productionImpact, setProductionImpact] = useState('');
  const [safetyImpact, setSafetyImpact] = useState('');
  const [costImpact, setCostImpact] = useState('');

  // Proposed Innovation
  const [proposedInnovation, setProposedInnovation] = useState('');
  const [aiDigitalTechnology, setAiDigitalTechnology] = useState('Edge AI, Computer Vision, Predictive Telematics');
  const [expectedSolution, setExpectedSolution] = useState('');
  const [expectedBenefit, setExpectedBenefit] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('₹ 50 Lakhs');
  const [estimatedAnnualSavings, setEstimatedAnnualSavings] = useState('₹ 1.80 Cr');
  const [expectedRoiYears, setExpectedRoiYears] = useState<number>(1.2);
  const [expectedImplementationMonths, setExpectedImplementationMonths] = useState<number>(4);

  // AI features
  const [aiAnalysis, setAiAnalysis] = useState<IdeaAIAnalysis | null>(null);
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Duplicate detector
  const [duplicateCheck, setDuplicateCheck] = useState<IdeaDuplicateMatch | null>(null);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  // Innovation Score
  const [innovationScore, setInnovationScore] = useState<InnovationScoreBreakdown | null>(null);
  const [calculatingScore, setCalculatingScore] = useState(false);

  if (!isOpen) return null;

  const quickSamples = [
    {
      title: 'AI Predictive Maintenance & Transmission Telematics for BH100S Dumpers',
      problem: 'Frequent unplanned transmission and hydraulic hose failure causing sudden haulage line stoppage in Deposit 5 opencast pit.',
      innovation: 'Deploy edge vibration sensors, thermal IR telemetry and machine learning remaining useful life (RUL) estimation on 18 dumpers.',
      equipment: 'BH100S 100-Tonne Dumpers',
      cost: '₹ 45 Lakhs',
      savings: '₹ 2.10 Cr',
    },
    {
      title: 'Computer Vision Sizing & Boulder Jam Detection on Primary Crusher Feed',
      problem: 'Oversize iron ore boulders exceeding 1.2m cause crusher chute blockages and secondary breaking delays.',
      innovation: 'High-speed 3D stereoscopic vision at ROM dumping hopper with automatic audio-visual alarm and hydraulic breaker positioning.',
      equipment: 'Gyratory Primary Crusher SP-1',
      cost: '₹ 38 Lakhs',
      savings: '₹ 1.45 Cr',
    },
  ];

  const handleApplySample = (s: typeof quickSamples[0]) => {
    setTitle(s.title);
    setProblemStatement(s.problem);
    setProposedInnovation(s.innovation);
    setEquipmentAffected(s.equipment);
    setEstimatedCost(s.cost);
    setEstimatedAnnualSavings(s.savings);
  };

  const handleCheckDuplicates = async () => {
    if (!title && !problemStatement) {
      alert('Please fill in Title or Problem Statement first.');
      return;
    }
    setCheckingDuplicates(true);
    try {
      const res = await fetchApi<{ success: boolean; match: IdeaDuplicateMatch }>('/api/ai/check-duplicates', {
        method: 'POST',
        body: JSON.stringify({ title, description: problemStatement }),
      });
      if (res.success && res.match) {
        setDuplicateCheck(res.match);
      }
    } catch (e: any) {
      alert(`Duplicate check error: ${e.message}`);
    } finally {
      setCheckingDuplicates(false);
    }
  };

  const handleCalculateScore = async () => {
    setCalculatingScore(true);
    try {
      const res = await fetchApi<{ success: boolean; data: InnovationScoreBreakdown }>('/api/ai/calculate-innovation-score', {
        method: 'POST',
        body: JSON.stringify({
          ideaData: {
            title,
            problemStatement,
            proposedInnovation,
            estimatedAnnualSavings,
            safetyImpact,
            costImpact,
          },
        }),
      });
      if (res.success && res.data) {
        setInnovationScore(res.data);
      }
    } catch (e: any) {
      alert(`Score calculation error: ${e.message}`);
    } finally {
      setCalculatingScore(false);
    }
  };

  const handleRunAiPreview = async () => {
    if (!title || !problemStatement || !proposedInnovation) {
      alert('Please fill in Title, Problem Statement, and Proposed Innovation before running AI classification.');
      return;
    }
    setAnalyzingAi(true);
    try {
      const res = await fetchApi('/api/ai/classify', {
        method: 'POST',
        body: JSON.stringify({
          title,
          department,
          projectComplex,
          problemStatement,
          existingProcess,
          proposedInnovation,
          aiDigitalTechnology,
          expectedBenefit,
        }),
      });

      if (res.success && res.data) {
        setAiAnalysis(res.data);
      }
    } catch (e: any) {
      alert(`AI Classification error: ${e.message}`);
    } finally {
      setAnalyzingAi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !problemStatement.trim()) {
      alert('Title and Problem Statement are required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title,
        submitterName: currentUser?.name || 'NMDC Executive',
        submitterEmail: currentUser?.email || 'executive@nmdc.co.in',
        employeeId,
        designation,
        department,
        projectComplex,
        location,
        contactNumber,
        problemStatement,
        existingProcess,
        currentDifficulties,
        rootCause,
        frequency,
        employeesAffected,
        equipmentAffected,
        productionImpact,
        safetyImpact,
        costImpact,
        proposedInnovation,
        aiDigitalTechnology,
        expectedSolution,
        expectedBenefit,
        estimatedCost,
        estimatedAnnualSavings,
        expectedRoiYears,
        expectedImplementationMonths,
      };

      await fetchApi('/api/ideas', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      onSubmitSuccess();
      onClose();
    } catch (err: any) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-white text-slate-900 flex items-center justify-between border-b border-slate-200">
          <div>
            <span className="text-[10px] font-mono text-blue-700 font-bold uppercase tracking-wider block">
              PILLAR 1: INNOVATE · NMDC EMPLOYEE IDEA ENGINE
            </span>
            <h2 className="text-base font-bold text-slate-900">
              Submit AI / Digital Transformation Idea
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Sample Selector */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Quick Mining Templates:</span>
          <div className="flex gap-2">
            {quickSamples.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplySample(s)}
                className="bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 hover:text-blue-700 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors"
              >
                {idx === 0 ? 'Dumpers Telematics' : 'Crusher Vision'}
              </button>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 text-xs space-y-6">
          {/* Submitter Info */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <h3 className="font-bold text-slate-900 text-xs mb-3 flex items-center gap-1.5">
              <span>01. Submitter Information</span>
              <span className="text-[10px] text-slate-400 font-normal">(Auto-verified from NMDC Identity)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Employee ID</label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="font-medium text-slate-700 block mb-1">Designation</label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900"
                />
              </div>
              <div>
                <label className="font-medium text-slate-700 block mb-1">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900"
                >
                  <option value="Mining & HEMM Engineering">Mining & HEMM Engineering</option>
                  <option value="Ore Processing & Beneficiation Plant">Ore Processing & Beneficiation Plant</option>
                  <option value="Mine Safety & Environment">Mine Safety & Environment</option>
                  <option value="Pellet Plant Operations">Pellet Plant Operations</option>
                  <option value="Electrical & Power Distribution">Electrical & Power Distribution</option>
                  <option value="Slurry Pipeline Division">Slurry Pipeline Division</option>
                  <option value="Corporate Information Technology">Corporate Information Technology</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Project Complex</label>
                <select
                  value={projectComplex}
                  onChange={(e) => setProjectComplex(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900"
                >
                  <option value="Bailadila Deposit 5 (Kirandul)">Bailadila Deposit 5 (Kirandul)</option>
                  <option value="Bailadila Deposit 14/11C (Bacheli)">Bailadila Deposit 14/11C (Bacheli)</option>
                  <option value="Donimalai Iron Ore Mine (Karnataka)">Donimalai Iron Ore Mine (Karnataka)</option>
                  <option value="Kumaraswamy Iron Ore Mine (Karnataka)">Kumaraswamy Iron Ore Mine (Karnataka)</option>
                  <option value="Diamond Mining Project (Panna, MP)">Diamond Mining Project (Panna, MP)</option>
                  <option value="Corporate Office (Hyderabad)">Corporate Office (Hyderabad)</option>
                </select>
              </div>
              <div>
                <label className="font-medium text-slate-700 block mb-1">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900"
                />
              </div>
              <div>
                <label className="font-medium text-slate-700 block mb-1">Contact Number</label>
                <input
                  type="text"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Problem Definition */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs">
                02. Operational Problem Description
              </h3>

              {/* DUPLICATE DETECTOR BUTTON */}
              <button
                type="button"
                onClick={handleCheckDuplicates}
                disabled={checkingDuplicates || !title}
                className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-semibold text-[11px] transition-colors flex items-center gap-1.5"
              >
                {checkingDuplicates ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>Run AI Duplicate Detector</span>
              </button>
            </div>

            {/* DUPLICATE RESULT CARD */}
            {duplicateCheck && (
              <div className={`p-3.5 rounded-xl border space-y-2 ${
                duplicateCheck.similarityPct > 70 
                  ? 'bg-amber-50/80 border-amber-300 text-amber-950' 
                  : 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {duplicateCheck.similarityPct > 70 ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                    <strong className="text-xs">
                      AI Duplicate Detector: {duplicateCheck.similarityPct}% Match
                    </strong>
                  </div>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white/80 border">
                    {duplicateCheck.existingIdeaCode}
                  </span>
                </div>

                <div className="text-[11px] space-y-1">
                  <div>
                    <strong>Similar Idea / Project:</strong> {duplicateCheck.existingTitle}
                  </div>
                  <div className="flex flex-wrap gap-4 text-slate-600">
                    <span>Status: <strong>{duplicateCheck.status}</strong></span>
                    <span>Owner: <strong>{duplicateCheck.projectOwner}</strong></span>
                    <span>Already Implemented: <strong>{duplicateCheck.alreadyImplemented ? 'Yes (Donimalai)' : 'No (In evaluation)'}</strong></span>
                  </div>
                  <p className="pt-1 text-slate-700 italic">
                    "{duplicateCheck.recommendation}"
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="font-semibold text-slate-800 block mb-1">
                Idea / Solution Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. AI-Based Predictive Maintenance for BH100S Dumpers"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-800 block mb-1">
                Detailed Problem Statement *
              </label>
              <textarea
                rows={3}
                required
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                placeholder="Explain the operational bottleneck, frequency of breakdown, or process inefficiency..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Equipment Affected</label>
                <input
                  type="text"
                  value={equipmentAffected}
                  onChange={(e) => setEquipmentAffected(e.target.value)}
                  placeholder="e.g. BH100S Dumpers, Komatsu PC3000..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                />
              </div>
              <div>
                <label className="font-medium text-slate-700 block mb-1">Breakdown Frequency</label>
                <input
                  type="text"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  placeholder="e.g. 3-4 times per month during shifts"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Innovation & Benefits */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs">
                03. Proposed Innovation & Technology
              </h3>

              {/* INNOVATION SCORE BUTTON */}
              <button
                type="button"
                onClick={handleCalculateScore}
                disabled={calculatingScore}
                className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg font-semibold text-[11px] transition-colors flex items-center gap-1.5"
              >
                {calculatingScore ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                ) : (
                  <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                )}
                <span>Calculate Innovation Score</span>
              </button>
            </div>

            {/* INNOVATION SCORE BREAKDOWN CARD */}
            {innovationScore && (
              <div className="p-4 bg-gradient-to-br from-amber-50/70 via-white to-slate-50 border border-amber-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-slate-900 text-xs">Automated Innovation Score</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono font-bold text-amber-800 text-sm bg-amber-100 px-2.5 py-0.5 rounded">
                    <span>Score: {innovationScore.overallScore}/100</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Business Benefit (20%)</span>
                    <strong className="text-slate-800 font-mono">{innovationScore.businessBenefit}/100</strong>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Safety Impact (15%)</span>
                    <strong className="text-slate-800 font-mono">{innovationScore.safetyImpact}/100</strong>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Cost Saving (15%)</span>
                    <strong className="text-slate-800 font-mono">{innovationScore.costSaving}/100</strong>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Innovation (10%)</span>
                    <strong className="text-slate-800 font-mono">{innovationScore.innovation}/100</strong>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Scalability (15%)</span>
                    <strong className="text-slate-800 font-mono">{innovationScore.scalability}/100</strong>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Feasibility (10%)</span>
                    <strong className="text-slate-800 font-mono">{innovationScore.feasibility}/100</strong>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Digital Maturity (10%)</span>
                    <strong className="text-slate-800 font-mono">{innovationScore.digitalMaturity}/100</strong>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">ESG Impact (5%)</span>
                    <strong className="text-slate-800 font-mono">{innovationScore.esgImpact}/100</strong>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="font-semibold text-slate-800 block mb-1">
                Proposed Innovation / Technical Approach
              </label>
              <textarea
                rows={2}
                value={proposedInnovation}
                onChange={(e) => setProposedInnovation(e.target.value)}
                placeholder="Explain the proposed AI, IoT, telematics or digital transformation approach..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="font-medium text-slate-700 block mb-1">AI / Digital Technology Required</label>
                <input
                  type="text"
                  value={aiDigitalTechnology}
                  onChange={(e) => setAiDigitalTechnology(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                />
              </div>
              <div>
                <label className="font-medium text-slate-700 block mb-1">Estimated Annual Savings</label>
                <input
                  type="text"
                  value={estimatedAnnualSavings}
                  onChange={(e) => setEstimatedAnnualSavings(e.target.value)}
                  placeholder="e.g. ₹ 1.80 Cr"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-mono"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={handleRunAiPreview}
                disabled={analyzingAi}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
              >
                {analyzingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Run Gemini AI Classification</span>
              </button>

              {aiAnalysis && (
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>AI Classified: {aiAnalysis.recommendedPriority} Priority</span>
                </span>
              )}
            </div>

            {aiAnalysis && (
              <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-2 text-[11px] text-indigo-950">
                <div className="flex items-center justify-between">
                  <strong>Recommended Approach:</strong>
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-indigo-200">
                    {aiAnalysis.technologyMaturity}
                  </span>
                </div>
                <p className="leading-relaxed text-indigo-900">
                  {aiAnalysis.recommendationSummary}
                </p>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold shadow-xs flex items-center gap-1.5"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin text-amber-300" /> : <Send className="w-4 h-4" />}
              <span>Submit Idea into NMDC Pipeline</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

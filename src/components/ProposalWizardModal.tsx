import React, { useState } from 'react';
import { ProblemStatement, Vendor, ProposalCostBreakdown } from '../types/index.js';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Building2, 
  FileText, 
  Cpu, 
  Clock, 
  IndianRupee, 
  TrendingUp, 
  Upload, 
  Sparkles,
  Loader2
} from 'lucide-react';
import { fetchApi } from '../utils/api.js';

interface ProposalWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  problemStatement: ProblemStatement;
  vendor: Vendor | null;
  onSubmitSuccess: () => void;
}

export const ProposalWizardModal: React.FC<ProposalWizardModalProps> = ({
  isOpen,
  onClose,
  problemStatement,
  vendor,
  onSubmitSuccess,
}) => {
  const effectiveVendor: Vendor = vendor || {
    id: 'vnd-001',
    name: 'MiningTech Solutions Pvt Ltd',
    legalEntity: 'Private Limited',
    cin: 'U72200MH2019PTC328491',
    pan: 'AABCM8921K',
    gstin: '27AABCM8921K1ZX',
    registeredAddress: 'Unit 402, Technology Park, Powai, Mumbai 400076',
    website: 'https://miningtech.in',
    yearEstablished: 2019,
    companySize: '51-200',
    msmeStatus: true,
    startupStatus: true,
    contactPerson: 'Ananya Deshmukh',
    designation: 'Head of Industrial AI',
    email: 'ananya@miningtech.in',
    mobile: '+91 98201 12345',
    capabilities: ['Predictive Maintenance', 'HEMM Telematics', 'Edge Computing', 'Computer Vision'],
    miningExperienceYears: 6,
    majorCustomers: ['NMDC Limited', 'Coal India', 'Tata Steel Mining'],
    status: 'Active',
    performanceScore: 92,
    documents: [],
    createdAt: '2025-01-10T10:00:00Z',
  };

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [extractingAi, setExtractingAi] = useState(false);
  const [aiExtractedNote, setAiExtractedNote] = useState<string | null>(null);

  // Form State
  // Step 2: Understanding
  const [understanding, setUnderstanding] = useState('');
  const [existingSituation, setExistingSituation] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [proposedImprovement, setProposedImprovement] = useState('');

  // Step 3: Technical Solution
  const [solutionDesc, setSolutionDesc] = useState('');
  const [architectureType, setArchitectureType] = useState<'Hybrid Edge-Cloud' | 'Cloud' | 'On-Premise'>('Hybrid Edge-Cloud');
  const [techStackStr, setTechStackStr] = useState('Rust, Python, TensorFlow Lite, TimescaleDB, Docker, React');
  const [aiModelsStr, setAiModelsStr] = useState('Multivariate LSTM Autoencoder, Spectrogram Anomaly Net');
  const [hardwareSpecs, setHardwareSpecs] = useState('MIL-STD-810H Industrial Edge Gateway with IP68 junction boxes');
  const [softwareSpecs, setSoftwareSpecs] = useState('Real-time telemetry ingestion pipeline with REST and SAP PM APIs');
  const [sensorsDetails, setSensorsDetails] = useState('Triaxial vibration sensors, optical oil quality transmitters');
  const [cybersecurity, setCybersecurity] = useState('TLS 1.3 encrypted telemetry, Cert-In compliant, air-gapped readiness');

  // Step 4: Implementation
  const [methodology, setMethodology] = useState('3-Phase Delivery: Phase 1 (Lab bench), Phase 2 (PoC), Phase 3 (Mine rollout)');
  const [timelineMonths, setTimelineMonths] = useState(4);
  const [manpower, setManpower] = useState('1 Lead AI Engineer, 1 Mining Domain Expert, 2 Resident Field Technicians');
  const [training, setTraining] = useState('2 weeks hands-on certification for 20 NMDC engineers');
  const [warrantyYears, setWarrantyYears] = useState(3);
  const [amcScope, setAmcScope] = useState('Comprehensive on-site hardware replacement within 24h & software upgrades');

  // Step 5: Budgetary Offer (in ₹)
  const [pocCost, setPocCost] = useState<number>(3500000);
  const [pilotCost, setPilotCost] = useState<number>(6500000);
  const [hardwareCost, setHardwareCost] = useState<number>(9500000);
  const [softwareCost, setSoftwareCost] = useState<number>(5000000);
  const [integrationCost, setIntegrationCost] = useState<number>(2000000);
  const [licenceCost, setLicenceCost] = useState<number>(2500000);
  const [trainingCost, setTrainingCost] = useState<number>(800000);
  const [amcCostPerYear, setAmcCostPerYear] = useState<number>(1800000);
  const [otherCost, setOtherCost] = useState<number>(500000);
  const gstRate = 18;

  // Step 6: Business Case
  const [expectedSavingsAnnual, setExpectedSavingsAnnual] = useState<number>(32000000); // 3.2 Cr
  const [productivityImprovementPct, setProductivityImprovementPct] = useState<number>(14.5);
  const [availabilityImprovementPct, setAvailabilityImprovementPct] = useState<number>(12.0);
  const [mtbfImprovementPct, setMtbfImprovementPct] = useState<number>(35.0);
  const [mttrReductionPct, setMttrReductionPct] = useState<number>(22.0);
  const [energySavingPct, setEnergySavingPct] = useState<number>(6.0);
  const [safetyBenefits, setSafetyBenefits] = useState('Eliminates catastrophic brake lock and engine fire risks on gradient roads');
  const [roiYears, setRoiYears] = useState<number>(1.2);
  const [paybackPeriodMonths, setPaybackPeriodMonths] = useState<number>(14);

  // Calculations
  const totalExclGst =
    (pocCost || 0) +
    (pilotCost || 0) +
    (hardwareCost || 0) +
    (softwareCost || 0) +
    (integrationCost || 0) +
    (licenceCost || 0) +
    (trainingCost || 0) +
    (amcCostPerYear || 0) +
    (otherCost || 0);

  const gstAmount = Math.round(totalExclGst * (gstRate / 100));
  const totalCostInclGst = totalExclGst + gstAmount;

  if (!isOpen) return null;

  const handleAiExtract = async () => {
    setExtractingAi(true);
    try {
      const res = await fetchApi('/api/ai/document-extract', {
        method: 'POST',
        body: JSON.stringify({
          fileName: `Technical_Budgetary_Proposal_${effectiveVendor.name}.pdf`,
          content: `Vendor proposal for ${problemStatement.title}. Proposed PoC cost ₹ 35 Lakhs, Pilot cost ₹ 65 Lakhs, Total capital hardware and software licenses. 3-year warranty and on-site support.`,
        }),
      });

      if (res.success && res.data) {
        setAiExtractedNote(`Document AI extracted: ${res.data.extractedHardware} | Total: ${res.data.extractedTotalCost}`);
      }
    } catch {
      // ignore
    } finally {
      setExtractingAi(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const costBreakdown: ProposalCostBreakdown = {
        pocCost,
        pilotCost,
        hardwareCost,
        softwareCost,
        integrationCost,
        licenceCost,
        trainingCost,
        amcCostPerYear,
        otherCost,
        gstRate,
        totalExclGst,
        gstAmount,
        totalCostInclGst,
      };

      const payload = {
        problemStatementId: problemStatement.id,
        problemStatementCode: problemStatement.code,
        problemStatementTitle: problemStatement.title,
        vendorId: effectiveVendor.id,
        vendorName: effectiveVendor.name,
        problemUnderstanding: understanding || `Comprehensive response to ${problemStatement.title} tailored for NMDC mines.`,
        existingSituationAssessment: existingSituation || problemStatement.currentProcess,
        rootCauseAnalysis: rootCause || problemStatement.rootCause,
        proposedImprovement: proposedImprovement || problemStatement.expectedOutcome,
        solutionDescription: solutionDesc || `Industrial edge-AI solution addressing ${problemStatement.code}.`,
        architectureType,
        technologyStack: techStackStr.split(',').map((s) => s.trim()),
        aiMlModels: aiModelsStr.split(',').map((s) => s.trim()),
        hardwareSpecs,
        softwareSpecs,
        sensorsIotDetails: sensorsDetails,
        cybersecurityCompliance: cybersecurity,
        dataRequirements: 'Telemetry logs and baseline sensor calibrations',
        methodology,
        timelineMonths,
        manpowerRequired: manpower,
        trainingScope: training,
        warrantyPeriodYears: warrantyYears,
        amcScope,
        costBreakdown,
        businessCase: {
          expectedSavingsAnnual,
          productivityImprovementPct,
          availabilityImprovementPct,
          mtbfImprovementPct,
          mttrReductionPct,
          energySavingPct,
          safetyBenefits,
          roiYears,
          paybackPeriodMonths,
        },
        documents: [
          { title: 'Technical Proposal Dossier', fileName: `Tech_Proposal_${effectiveVendor.name.replace(/\s+/g, '_')}.pdf`, type: 'Technical' },
          { title: 'Commercial Price Schedule', fileName: `Commercial_Offer_${effectiveVendor.name.replace(/\s+/g, '_')}.pdf`, type: 'Commercial' },
        ],
      };

      await fetchApi('/api/proposals', {
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

  const steps = [
    { num: 1, label: 'Company Profile', icon: Building2 },
    { num: 2, label: 'Problem Understanding', icon: FileText },
    { num: 3, label: 'Technical Solution', icon: Cpu },
    { num: 4, label: 'Implementation', icon: Clock },
    { num: 5, label: 'Budgetary Offer', icon: IndianRupee },
    { num: 6, label: 'Business Case', icon: TrendingUp },
    { num: 7, label: 'Documents & Verification', icon: Upload },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-white text-slate-900 flex items-center justify-between border-b border-slate-200">
          <div>
            <span className="text-[11px] font-mono text-blue-700 font-bold tracking-wider">
              {problemStatement.code} · OPPORTUNITY RESPONSE WIZARD
            </span>
            <h2 className="text-base font-bold text-slate-900 truncate max-w-2xl">
              {problemStatement.title}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[680px]">
            {steps.map((s, idx) => (
              <div key={s.num} className="flex items-center gap-2">
                <button
                  onClick={() => setStep(s.num)}
                  className={`flex items-center gap-1.5 text-xs font-medium py-1 px-2.5 rounded-md transition-colors ${
                    step === s.num
                      ? 'bg-blue-700 text-white font-semibold shadow-xs'
                      : step > s.num
                      ? 'text-emerald-700 bg-emerald-50'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {step > s.num ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-bold">
                      {s.num}
                    </span>
                  )}
                  <span>{s.label}</span>
                </button>
                {idx < steps.length - 1 && <span className="text-slate-300 text-xs">/</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Form Body Viewport */}
        <div className="flex-1 overflow-y-auto p-6 text-xs">
          {/* STEP 1: Company Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-lg text-blue-900 leading-relaxed">
                Vendor details automatically pre-populated from your NMDC registered profile. Please verify that all statutory credentials are up to date.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Company Name</label>
                  <input
                    type="text"
                    disabled
                    value={effectiveVendor.name}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-slate-700 font-medium"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Legal Entity & CIN</label>
                  <input
                    type="text"
                    disabled
                    value={`${effectiveVendor.legalEntity} (${effectiveVendor.cin})`}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-slate-700"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">GSTIN & PAN</label>
                  <input
                    type="text"
                    disabled
                    value={`GSTIN: ${effectiveVendor.gstin} | PAN: ${effectiveVendor.pan}`}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Authorised Contact</label>
                  <input
                    type="text"
                    disabled
                    value={`${effectiveVendor.contactPerson} (${effectiveVendor.designation})`}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-slate-700"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Demonstrated Capabilities</label>
                  <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    {effectiveVendor.capabilities.map((c) => (
                      <span key={c} className="text-[11px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700 font-medium">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Understanding of Problem */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  1. Comprehensive Understanding of NMDC's Problem Statement *
                </label>
                <textarea
                  rows={4}
                  value={understanding}
                  onChange={(e) => setUnderstanding(e.target.value)}
                  placeholder={`Describe your technical understanding of ${problemStatement.title} specifically for open-cast iron ore mining at ${problemStatement.projectComplex}...`}
                  className="w-full border border-slate-200 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  2. Assessment of Existing Operational Situation & Difficulties
                </label>
                <textarea
                  rows={3}
                  value={existingSituation}
                  onChange={(e) => setExistingSituation(e.target.value)}
                  placeholder="Detail current limitations observed in scheduled/reactive maintenance, dust/vibration bottlenecks, or manual logbooks..."
                  className="w-full border border-slate-200 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    3. Root Cause Analysis
                  </label>
                  <input
                    type="text"
                    value={rootCause}
                    onChange={(e) => setRootCause(e.target.value)}
                    placeholder="e.g. Abrasive iron ore particulate ingress and heavy shock cycles"
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    4. Proposed Operational Improvement
                  </label>
                  <input
                    type="text"
                    value={proposedImprovement}
                    onChange={(e) => setProposedImprovement(e.target.value)}
                    placeholder="e.g. Early warning 48h prior to catastrophic component failure"
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Technical Solution */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Technical Solution Description & Architecture *
                </label>
                <textarea
                  rows={3}
                  value={solutionDesc}
                  onChange={(e) => setSolutionDesc(e.target.value)}
                  placeholder="Detailed description of the proposed solution, edge components, telemetry ingestion pipeline, and predictive algorithms..."
                  className="w-full border border-slate-200 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">Architecture Deployment Type</label>
                  <select
                    value={architectureType}
                    onChange={(e: any) => setArchitectureType(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-900 bg-white"
                  >
                    <option value="Hybrid Edge-Cloud">Hybrid Edge-Cloud (Recommended for Mines)</option>
                    <option value="On-Premise">Pure On-Premise Air-Gapped NMDC Server</option>
                    <option value="Cloud">MeitY Empanelled Cloud Instance</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1">Technology Stack</label>
                  <input
                    type="text"
                    value={techStackStr}
                    onChange={(e) => setTechStackStr(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1">AI / ML Model Architecture</label>
                  <input
                    type="text"
                    value={aiModelsStr}
                    onChange={(e) => setAiModelsStr(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1">Hardware / Edge Specifications</label>
                  <input
                    type="text"
                    value={hardwareSpecs}
                    onChange={(e) => setHardwareSpecs(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1">Sensors & IoT Specifications</label>
                  <input
                    type="text"
                    value={sensorsDetails}
                    onChange={(e) => setSensorsDetails(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1">Cybersecurity & Cert-In Compliance</label>
                  <input
                    type="text"
                    value={cybersecurity}
                    onChange={(e) => setCybersecurity(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Implementation */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="font-semibold text-slate-800 block mb-1">Implementation Methodology</label>
                <textarea
                  rows={3}
                  value={methodology}
                  onChange={(e) => setMethodology(e.target.value)}
                  placeholder="Outline the staged rollout from bench calibration through pilot testing and plant-wide commissioning..."
                  className="w-full border border-slate-200 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">Implementation Timeline (Months)</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={timelineMonths}
                    onChange={(e) => setTimelineMonths(parseInt(e.target.value, 10) || 1)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-900 tabular-nums"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">Warranty Period (Years)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={warrantyYears}
                    onChange={(e) => setWarrantyYears(parseInt(e.target.value, 10) || 1)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-900 tabular-nums"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">Manpower & Field Resource Plan</label>
                  <input
                    type="text"
                    value={manpower}
                    onChange={(e) => setManpower(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">Training Scope for NMDC Personnel</label>
                  <input
                    type="text"
                    value={training}
                    onChange={(e) => setTraining(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-900"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="font-semibold text-slate-800 block mb-1">Annual Maintenance Contract (AMC) Terms</label>
                  <textarea
                    rows={2}
                    value={amcScope}
                    onChange={(e) => setAmcScope(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Budgetary Offer */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-900 flex items-center justify-between">
                <span>
                  Please specify itemised prices in Indian Rupees (₹). Total cost will be automatically computed with 18% GST.
                </span>
                <span className="font-bold text-xs">Indication: {problemStatement.budgetaryIndication}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">PoC Cost (₹) *</label>
                  <input
                    type="number"
                    value={pocCost}
                    onChange={(e) => setPocCost(parseInt(e.target.value, 10) || 0)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Pilot Cost (₹)</label>
                  <input
                    type="number"
                    value={pilotCost}
                    onChange={(e) => setPilotCost(parseInt(e.target.value, 10) || 0)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Hardware Cost (₹)</label>
                  <input
                    type="number"
                    value={hardwareCost}
                    onChange={(e) => setHardwareCost(parseInt(e.target.value, 10) || 0)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Software Development Cost (₹)</label>
                  <input
                    type="number"
                    value={softwareCost}
                    onChange={(e) => setSoftwareCost(parseInt(e.target.value, 10) || 0)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Integration Cost (₹)</label>
                  <input
                    type="number"
                    value={integrationCost}
                    onChange={(e) => setIntegrationCost(parseInt(e.target.value, 10) || 0)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Software Licence Cost (₹)</label>
                  <input
                    type="number"
                    value={licenceCost}
                    onChange={(e) => setLicenceCost(parseInt(e.target.value, 10) || 0)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Training Cost (₹)</label>
                  <input
                    type="number"
                    value={trainingCost}
                    onChange={(e) => setTrainingCost(parseInt(e.target.value, 10) || 0)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">AMC / Year (₹)</label>
                  <input
                    type="number"
                    value={amcCostPerYear}
                    onChange={(e) => setAmcCostPerYear(parseInt(e.target.value, 10) || 0)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Other Overheads (₹)</label>
                  <input
                    type="number"
                    value={otherCost}
                    onChange={(e) => setOtherCost(parseInt(e.target.value, 10) || 0)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono tabular-nums"
                  />
                </div>
              </div>

              {/* Automatic Calculation Summary Panel */}
              <div className="mt-4 p-4 bg-slate-900 text-white rounded-xl space-y-2">
                <div className="flex justify-between text-slate-300 text-xs">
                  <span>Subtotal (Excl. GST):</span>
                  <span className="font-mono tabular-nums font-semibold">
                    ₹ {totalExclGst.toLocaleString('en-IN')} (₹ {(totalExclGst / 10000000).toFixed(2)} Cr)
                  </span>
                </div>
                <div className="flex justify-between text-slate-300 text-xs">
                  <span>Applicable GST (18%):</span>
                  <span className="font-mono tabular-nums font-semibold">
                    ₹ {gstAmount.toLocaleString('en-IN')} (₹ {(gstAmount / 10000000).toFixed(2)} Cr)
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-bold text-amber-300">
                  <span>TOTAL ESTIMATED PROJECT COST:</span>
                  <span className="font-mono tabular-nums text-base">
                    ₹ {totalCostInclGst.toLocaleString('en-IN')} (₹ {(totalCostInclGst / 10000000).toFixed(2)} Cr)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Business Case */}
          {step === 6 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Expected Annual Financial Savings (₹)
                  </label>
                  <input
                    type="number"
                    value={expectedSavingsAnnual}
                    onChange={(e) => setExpectedSavingsAnnual(parseInt(e.target.value, 10) || 0)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono tabular-nums"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Equivalent to ₹ {(expectedSavingsAnnual / 10000000).toFixed(2)} Crores / Year
                  </span>
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Payback Period (Months) & ROI (Years)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="0.1"
                      value={paybackPeriodMonths}
                      onChange={(e) => setPaybackPeriodMonths(parseFloat(e.target.value) || 0)}
                      placeholder="Payback Months"
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={roiYears}
                      onChange={(e) => setRoiYears(parseFloat(e.target.value) || 0)}
                      placeholder="ROI Years"
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Productivity Improvement (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={productivityImprovementPct}
                    onChange={(e) => setProductivityImprovementPct(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Equipment Availability Improvement (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={availabilityImprovementPct}
                    onChange={(e) => setAvailabilityImprovementPct(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1">MTBF Improvement (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={mtbfImprovementPct}
                    onChange={(e) => setMtbfImprovementPct(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1">MTTR Reduction (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={mttrReductionPct}
                    onChange={(e) => setMttrReductionPct(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="font-semibold text-slate-800 block mb-1">
                    Quantified Safety, Environmental & Operational Benefits
                  </label>
                  <textarea
                    rows={2}
                    value={safetyBenefits}
                    onChange={(e) => setSafetyBenefits(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Documents */}
          {step === 7 && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Supporting Documents</h4>
                    <p className="text-slate-500 text-xs">
                      Technical proposal, Bill of Materials, Architecture diagram, and past PSU reference letters.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAiExtract}
                    disabled={extractingAi}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg border border-blue-200 font-semibold text-xs"
                  >
                    {extractingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>Extract with Document AI</span>
                  </button>
                </div>

                {aiExtractedNote && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs">
                    {aiExtractedNote}
                  </div>
                )}

                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer bg-white">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <span className="font-semibold text-slate-700 block">Click to attach technical and commercial files</span>
                  <span className="text-[11px] text-slate-400">PDF, DOCX, XLSX, PPTX up to 25MB</span>
                </div>

                <div className="space-y-2 mt-3">
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                    <span className="font-medium text-slate-700">1. Technical_Proposal_{effectiveVendor.name.replace(/\s+/g, '_')}.pdf</span>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-mono">Ready</span>
                  </div>
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                    <span className="font-medium text-slate-700">2. Commercial_Schedule_Budgetary_Offer.xlsx</span>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-mono">Ready</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h5 className="font-bold text-blue-900 mb-1">Proposal Submission Declaration</h5>
                <p className="text-blue-800 text-[11px] leading-relaxed">
                  By clicking Submit Proposal, {effectiveVendor.name} confirms that all budgetary estimates, technical specifications, and past experience credentials are authentic and comply with NMDC procurement integrity covenants.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep(step - 1)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-40 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <div className="text-xs text-slate-500 font-medium">
            Step {step} of 7
          </div>

          {step < 7 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Submit Final Proposal & Budgetary Offer</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

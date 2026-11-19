import React, { useState } from 'react';
import {
  ProblemStatement,
  BudgetaryOfferRequest,
  Vendor,
  CommercialItemCost,
  ProposalCommercialConditions,
  AttachmentFile,
  BUDGETARY_DISCLAIMER_TEXT,
} from '../types/index.js';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Building2, 
  FileText, 
  IndianRupee, 
  Clock, 
  Save, 
  Send,
  Lock,
  Paperclip,
  Trash2,
  AlertCircle,
  Upload
} from 'lucide-react';
import { fetchApi } from '../utils/api.js';

interface ProposalWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  problemStatement?: ProblemStatement | null;
  budgetaryRequest?: BudgetaryOfferRequest | null;
  vendor: Vendor | null;
  onSubmitSuccess: () => void;
}

export const ProposalWizardModal: React.FC<ProposalWizardModalProps> = ({
  isOpen,
  onClose,
  problemStatement,
  budgetaryRequest,
  vendor,
  onSubmitSuccess,
}) => {
  const targetCode = problemStatement?.code || budgetaryRequest?.requestCode || '';
  const targetTitle = problemStatement?.title || budgetaryRequest?.title || '';
  const targetComplex = problemStatement?.projectComplex || budgetaryRequest?.mineComplexName || 'NMDC Unit';
  const targetBudgetLabel = problemStatement?.indicativeBudget || (budgetaryRequest ? `₹ ${(budgetaryRequest.estimatedBudgetCr || 0).toFixed(2)} Cr` : 'Not Specified');

  const [activeTab, setActiveTab] = useState<'partA' | 'partB' | 'partC' | 'review'>('partA');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Part A: Technical Proposal
  // ---------------------------------------------------------------------------
  const [understandingOfRequirement, setUnderstandingOfRequirement] = useState(
    targetCode
      ? `Engineering response against NMDC ${targetCode} ("${targetTitle}") at ${targetComplex}.`
      : ''
  );
  const [proposedSolution, setProposedSolution] = useState('');
  const [technicalSpecifications, setTechnicalSpecifications] = useState('');
  const [equipmentDetails, setEquipmentDetails] = useState('');
  const [softwareDetails, setSoftwareDetails] = useState('');
  const [systemArchitecture, setSystemArchitecture] = useState('On-Premise Industrial Edge with Redundant Central Server');
  const [scopeOfSupply, setScopeOfSupply] = useState('');
  const [installationCommissioning, setInstallationCommissioning] = useState('Turnkey delivery and on-site installation by OEM certified engineers during planned maintenance intervals.');
  const [integrationRequirements, setIntegrationRequirements] = useState('Standard industrial communication port (Modbus TCP / Profinet / OPC-UA).');
  const [implementationMethodology, setImplementationMethodology] = useState('4-Stage Methodology: Engineering Survey, Hardware Supply, Installation & Cold Commissioning, Acceptance Demonstration.');
  const [deliveryPeriodWeeks, setDeliveryPeriodWeeks] = useState<number>(12);
  const [warrantyMonths, setWarrantyMonths] = useState<number>(12);
  const [amcScope, setAmcScope] = useState('Preventive maintenance and hardware spares support as per NMDC SLA.');
  const [trainingScope, setTrainingScope] = useState('Hands-on operational and maintenance training for NMDC engineers.');
  const [technicalDeviations, setTechnicalDeviations] = useState('None. Fully compliant with specifications and DGMS guidelines.');
  const [supportingDocuments, setSupportingDocuments] = useState<AttachmentFile[]>([]);
  const [newDocName, setNewDocName] = useState('');

  // ---------------------------------------------------------------------------
  // Part B: Commercial Proposal (Item-wise costing in ₹)
  // ---------------------------------------------------------------------------
  const [equipmentCost, setEquipmentCost] = useState<number>(0);
  const [hardwareCost, setHardwareCost] = useState<number>(0);
  const [softwareCost, setSoftwareCost] = useState<number>(0);
  const [licenceCost, setLicenceCost] = useState<number>(0);
  const [installationCost, setInstallationCost] = useState<number>(0);
  const [commissioningCost, setCommissioningCost] = useState<number>(0);
  const [integrationCost, setIntegrationCost] = useState<number>(0);
  const [trainingCost, setTrainingCost] = useState<number>(0);
  const [freightCost, setFreightCost] = useState<number>(0);
  const [amcCostPerYear, setAmcCostPerYear] = useState<number>(0);
  const [otherCharges, setOtherCharges] = useState<number>(0);
  const [gstRate, setGstRate] = useState<number>(18);

  // Auto-calculated subtotals and totals
  const subtotalCost =
    equipmentCost +
    hardwareCost +
    softwareCost +
    licenceCost +
    installationCost +
    commissioningCost +
    integrationCost +
    trainingCost +
    freightCost +
    amcCostPerYear +
    otherCharges;

  const gstAmount = Math.round((subtotalCost * gstRate) / 100);
  const totalEstimatedCost = subtotalCost + gstAmount;

  // ---------------------------------------------------------------------------
  // Part C: Commercial Conditions
  // ---------------------------------------------------------------------------
  const [offerValidityDays, setOfferValidityDays] = useState<number>(120);
  const [paymentTerms, setPaymentTerms] = useState(
    '20% Advance against Bank Guarantee, 60% on progressive delivery, 20% on commissioning and acceptance.'
  );
  const [amcYears, setAmcYears] = useState<number>(3);
  const [priceBasis, setPriceBasis] = useState(
    `FOR Destination ${targetComplex} (Inclusive of packing, forwarding, transit insurance, and freight).`
  );
  const [taxesAndDuties, setTaxesAndDuties] = useState(
    'GST extra as applicable at time of invoicing.'
  );
  const [otherCommercialConditions, setOtherCommercialConditions] = useState(
    'Performance Bank Guarantee (PBG) of 5% of contract value valid for warranty period plus 60 days claim period.'
  );

  if (!isOpen || (!problemStatement && !budgetaryRequest)) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const added: AttachmentFile[] = files.map((file) => {
      const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
      const sizeStr = file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`;
      return {
        name: file.name,
        size: sizeStr,
        type: ext,
        mediaKind: ['PNG', 'JPG', 'JPEG'].includes(ext) ? 'image' : 'document',
        url: URL.createObjectURL(file),
      };
    });
    setSupportingDocuments((prev) => [...prev, ...added]);
    e.target.value = '';
  };

  const handleAddDoc = () => {
    if (!newDocName.trim()) return;
    const ext = newDocName.split('.').pop()?.toUpperCase() || 'FILE';
    setSupportingDocuments([
      ...supportingDocuments,
      { name: newDocName.trim(), size: 'Reference File', type: ext, mediaKind: 'document' },
    ]);
    setNewDocName('');
  };

  const handleRemoveDoc = (idx: number) => {
    setSupportingDocuments(supportingDocuments.filter((_, i) => i !== idx));
  };

  const handleFormSubmit = async (isDraft: boolean) => {
    if (!vendor) {
      setErrorMessage('An active, verified Vendor account is required to submit a solution & budgetary offer.');
      return;
    }
    if (!proposedSolution.trim() && !isDraft) {
      setErrorMessage('Please provide a detailed description of the Proposed Solution in Part A.');
      setActiveTab('partA');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const costBreakdown: CommercialItemCost = {
      equipmentCost,
      hardwareCost,
      softwareCost,
      licenceCost,
      installationCost,
      commissioningCost,
      integrationCost,
      trainingCost,
      freightCost,
      amcCostPerYear,
      otherCharges,
      subtotalCost,
      gstRate,
      gstAmount,
      totalEstimatedCost,
    };

    const commercialConditions: ProposalCommercialConditions = {
      deliveryPeriodWeeks,
      offerValidityDays,
      paymentTerms,
      warrantyPeriodMonths: warrantyMonths,
      amcYears,
      priceBasis,
      taxesAndDuties,
      otherCommercialConditions,
    };

    try {
      await fetchApi('/api/proposals', {
        method: 'POST',
        body: JSON.stringify({
          problemStatementId: problemStatement?.id || budgetaryRequest?.linkedProblemStatementId || '',
          problemStatementCode: problemStatement?.code || budgetaryRequest?.linkedProblemStatementCode || budgetaryRequest?.requestCode || '',
          problemStatementTitle: problemStatement?.title || budgetaryRequest?.title || '',
          budgetaryRequestId: budgetaryRequest?.id,
          mineComplexCode: problemStatement?.mineComplexCode || budgetaryRequest?.mineComplexCode || 'HO',
          vendorId: vendor.id,
          vendorName: vendor.name,
          understandingOfRequirement,
          proposedSolution,
          technicalSpecifications,
          equipmentDetails,
          softwareDetails,
          systemArchitecture,
          scopeOfSupply,
          installationCommissioning,
          integrationRequirements,
          implementationMethodology,
          deliveryPeriodWeeks,
          warrantyMonths,
          amcScope,
          trainingScope,
          technicalDeviations,
          supportingDocuments,
          costBreakdown,
          commercialConditions,
          isDraft,
        }),
      });

      onSubmitSuccess();
      onClose();
    } catch (e: any) {
      setErrorMessage(e.message || 'Error submitting budgetary offer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-5 sm:p-6 text-xs text-slate-800 animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-emerald-800 font-bold uppercase tracking-wider text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {budgetaryRequest ? 'BUDGETARY OFFER RESPONSE (BOR)' : 'VENDOR SOLUTION & BUDGETARY OFFER'}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600 font-mono font-semibold">{targetCode}</span>
            </div>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg mt-0.5">
              Submit Solution & Budgetary Offer: {targetTitle}
            </h3>
            <p className="text-slate-500 text-xs">
              {vendor ? (
                <>
                  Responding as registered vendor: <strong className="text-slate-800">{vendor.name}</strong> ({vendor.legalEntity})
                </>
              ) : (
                <span className="text-rose-700 font-semibold">
                  Sign in with an approved Vendor account to submit a binding offer.
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Navigation Tabs */}
        <div className="flex items-center gap-2 py-3 border-b border-slate-100 bg-slate-50/60 px-3 -mx-6 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('partA')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'partA' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <span>Part A: Technical Proposal</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('partB')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'partB' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <span>Part B: Itemized Costing (₹ {(totalEstimatedCost / 10000000).toFixed(2)} Cr)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('partC')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'partC' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <span>Part C: Commercial Conditions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('review')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'review' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <span>Review & Final Submission</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl my-3 flex items-center gap-2 text-rose-800 text-xs shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto py-4 pr-1 space-y-4">
          {/* PART A: TECHNICAL PROPOSAL */}
          {activeTab === 'partA' && (
            <div className="space-y-4">
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  1. Understanding of Operational Requirement *
                </label>
                <textarea
                  rows={2}
                  value={understandingOfRequirement}
                  onChange={(e) => setUnderstandingOfRequirement(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  2. Proposed Technical Solution & Methodology *
                </label>
                <textarea
                  rows={3}
                  required
                  value={proposedSolution}
                  onChange={(e) => setProposedSolution(e.target.value)}
                  placeholder="Detail the architecture, industrial components, algorithms, and engineering approach..."
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    3. Technical Specifications & Tolerances
                  </label>
                  <textarea
                    rows={2}
                    value={technicalSpecifications}
                    onChange={(e) => setTechnicalSpecifications(e.target.value)}
                    placeholder="Sensors, measurement frequency, IP ratings, power requirements..."
                    className="w-full border border-slate-300 rounded-xl p-2 text-slate-900 font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    4. Equipment Details (Make & Model)
                  </label>
                  <textarea
                    rows={2}
                    value={equipmentDetails}
                    onChange={(e) => setEquipmentDetails(e.target.value)}
                    placeholder="Specific OEM models, sensors, cameras, radar, or PLCs proposed..."
                    className="w-full border border-slate-300 rounded-xl p-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    5. Software & Analytics Details
                  </label>
                  <textarea
                    rows={2}
                    value={softwareDetails}
                    onChange={(e) => setSoftwareDetails(e.target.value)}
                    placeholder="Software platform, database, APIs, user dashboards..."
                    className="w-full border border-slate-300 rounded-xl p-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    6. System Architecture Type
                  </label>
                  <select
                    value={systemArchitecture}
                    onChange={(e) => setSystemArchitecture(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2 bg-white text-slate-900"
                  >
                    <option value="On-Premise Industrial Edge with Redundant Central Server">On-Premise Industrial Edge (Recommended for Mines)</option>
                    <option value="Hybrid Edge-Cloud (MeitY Approved Indian Cloud)">Hybrid Edge-Cloud</option>
                    <option value="Air-Gapped Standalone SCADA Integration">Air-Gapped Standalone SCADA</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    7. Scope of Supply
                  </label>
                  <textarea
                    rows={2}
                    value={scopeOfSupply}
                    onChange={(e) => setScopeOfSupply(e.target.value)}
                    placeholder="Complete bill of quantities, cabling, enclosures, accessories..."
                    className="w-full border border-slate-300 rounded-xl p-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    8. Integration & SCADA Requirements
                  </label>
                  <textarea
                    rows={2}
                    value={integrationRequirements}
                    onChange={(e) => setIntegrationRequirements(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    9. Delivery Period (Weeks)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="52"
                    value={deliveryPeriodWeeks}
                    onChange={(e) => setDeliveryPeriodWeeks(parseInt(e.target.value) || 12)}
                    className="w-full border border-slate-300 rounded-xl p-2 text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    10. Warranty Period (Months)
                  </label>
                  <input
                    type="number"
                    min="12"
                    max="60"
                    value={warrantyMonths}
                    onChange={(e) => setWarrantyMonths(parseInt(e.target.value) || 12)}
                    className="w-full border border-slate-300 rounded-xl p-2 text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  11. Technical Deviations (if any)
                </label>
                <textarea
                  rows={2}
                  value={technicalDeviations}
                  onChange={(e) => setTechnicalDeviations(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              {/* Technical Attachments */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <span className="font-bold text-slate-800 block">Technical Supporting Documents (PDF, DOCX, XLSX, PNG, JPG)</span>
                <label className="flex items-center justify-center gap-2 border border-dashed border-slate-300 hover:border-blue-500 bg-white rounded-xl p-3 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-blue-700" />
                  <span className="font-semibold text-slate-700">Select Proposal Architecture / BOM Files</span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    placeholder="Or enter document reference filename (e.g. System_SLD_Architecture.pdf)"
                    className="flex-1 border border-slate-300 rounded-xl p-2 bg-white text-slate-900 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddDoc}
                    className="px-3 py-2 bg-slate-800 text-white font-semibold rounded-xl whitespace-nowrap"
                  >
                    Add Reference
                  </button>
                </div>
                <div className="space-y-1.5">
                  {supportingDocuments.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                      <span className="font-medium text-slate-700">{doc.name} ({doc.size})</span>
                      <button type="button" onClick={() => handleRemoveDoc(idx)} className="text-slate-400 hover:text-rose-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PART B: COMMERCIAL PROPOSAL (ITEM-WISE COSTING) */}
          {activeTab === 'partB' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-blue-950">
                <div>
                  <span className="font-bold block text-sm">Item-Wise Budgetary Offer Cost Breakdown</span>
                  <span className="text-[11px] text-blue-800">
                    Provide realistic estimates across all equipment, engineering, freight, and service components.
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-blue-700 uppercase font-bold tracking-wider block">Total Estimated Cost (Incl. GST)</span>
                  <span className="text-base font-extrabold text-blue-900">
                    ₹ {(totalEstimatedCost / 10000000).toFixed(2)} Cr
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="font-semibold text-slate-700 block mb-1">Equipment Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={equipmentCost}
                    onChange={(e) => setEquipmentCost(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 bg-white"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">₹ {(equipmentCost / 100000).toFixed(2)} Lakhs</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="font-semibold text-slate-700 block mb-1">Hardware & Sensors Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={hardwareCost}
                    onChange={(e) => setHardwareCost(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 bg-white"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">₹ {(hardwareCost / 100000).toFixed(2)} Lakhs</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="font-semibold text-slate-700 block mb-1">Software Core Platform (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={softwareCost}
                    onChange={(e) => setSoftwareCost(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 bg-white"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">₹ {(softwareCost / 100000).toFixed(2)} Lakhs</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="font-semibold text-slate-700 block mb-1">Perpetual Licence Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={licenceCost}
                    onChange={(e) => setLicenceCost(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 bg-white"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">₹ {(licenceCost / 100000).toFixed(2)} Lakhs</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="font-semibold text-slate-700 block mb-1">Installation Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={installationCost}
                    onChange={(e) => setInstallationCost(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 bg-white"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">₹ {(installationCost / 100000).toFixed(2)} Lakhs</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="font-semibold text-slate-700 block mb-1">Commissioning Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={commissioningCost}
                    onChange={(e) => setCommissioningCost(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 bg-white"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">₹ {(commissioningCost / 100000).toFixed(2)} Lakhs</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="font-semibold text-slate-700 block mb-1">Integration Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={integrationCost}
                    onChange={(e) => setIntegrationCost(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 bg-white"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">₹ {(integrationCost / 100000).toFixed(2)} Lakhs</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="font-semibold text-slate-700 block mb-1">Training Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={trainingCost}
                    onChange={(e) => setTrainingCost(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 bg-white"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">₹ {(trainingCost / 100000).toFixed(2)} Lakhs</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="font-semibold text-slate-700 block mb-1">Freight & Transit Insurance (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={freightCost}
                    onChange={(e) => setFreightCost(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 bg-white"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">₹ {(freightCost / 100000).toFixed(2)} Lakhs</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="font-semibold text-slate-700 block mb-1">Annual AMC Cost (₹ / Year)</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={amcCostPerYear}
                    onChange={(e) => setAmcCostPerYear(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 bg-white"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">₹ {(amcCostPerYear / 100000).toFixed(2)} Lakhs</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="font-semibold text-slate-700 block mb-1">Other Incidental Charges (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={otherCharges}
                    onChange={(e) => setOtherCharges(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 bg-white"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">₹ {(otherCharges / 100000).toFixed(2)} Lakhs</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="font-semibold text-slate-700 block mb-1">Applicable GST Rate (%)</label>
                  <select
                    value={gstRate}
                    onChange={(e) => setGstRate(parseInt(e.target.value) || 18)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold text-slate-900 bg-white"
                  >
                    <option value="18">18% GST (Standard)</option>
                    <option value="12">12% GST</option>
                    <option value="5">5% GST</option>
                    <option value="28">28% GST</option>
                  </select>
                </div>
              </div>

              {/* Automatic Subtotal Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden mt-3">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold">
                    <tr>
                      <th className="py-2 px-3">Cost Summary Component</th>
                      <th className="py-2 px-3 text-right">Amount (₹)</th>
                      <th className="py-2 px-3 text-right">In Crores</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-800">Basic Subtotal (Excl. Taxes)</td>
                      <td className="py-2 px-3 text-right font-mono font-semibold">₹ {subtotalCost.toLocaleString('en-IN')}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600">₹ {(subtotalCost / 10000000).toFixed(4)} Cr</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-800">Goods & Services Tax (GST @ {gstRate}%)</td>
                      <td className="py-2 px-3 text-right font-mono font-semibold">₹ {gstAmount.toLocaleString('en-IN')}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600">₹ {(gstAmount / 10000000).toFixed(4)} Cr</td>
                    </tr>
                    <tr className="bg-blue-50/80 font-bold text-blue-900">
                      <td className="py-2.5 px-3">Total Estimated Contract Cost (Incl. GST)</td>
                      <td className="py-2.5 px-3 text-right font-mono text-sm">₹ {totalEstimatedCost.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-sm">₹ {(totalEstimatedCost / 10000000).toFixed(2)} Cr</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PART C: COMMERCIAL CONDITIONS */}
          {activeTab === 'partC' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Delivery Period (Weeks) *
                  </label>
                  <input
                    type="number"
                    value={deliveryPeriodWeeks}
                    onChange={(e) => setDeliveryPeriodWeeks(parseInt(e.target.value) || 12)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Offer Validity (Days) *
                  </label>
                  <input
                    type="number"
                    value={offerValidityDays}
                    onChange={(e) => setOfferValidityDays(parseInt(e.target.value) || 120)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">
                    Payment Terms *
                  </label>
                  <textarea
                    rows={2}
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Warranty Period (Months) *
                  </label>
                  <input
                    type="number"
                    value={warrantyMonths}
                    onChange={(e) => setWarrantyMonths(parseInt(e.target.value) || 12)}
                    className="w-full border border-slate-300 rounded-xl p-2 text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    AMC Commitment Period (Years) *
                  </label>
                  <input
                    type="number"
                    value={amcYears}
                    onChange={(e) => setAmcYears(parseInt(e.target.value) || 3)}
                    className="w-full border border-slate-300 rounded-xl p-2 text-slate-900 font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">
                    Price Basis *
                  </label>
                  <input
                    type="text"
                    value={priceBasis}
                    onChange={(e) => setPriceBasis(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">
                    Taxes & Duties
                  </label>
                  <input
                    type="text"
                    value={taxesAndDuties}
                    onChange={(e) => setTaxesAndDuties(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">
                    Other Commercial Conditions & PBG Details
                  </label>
                  <textarea
                    rows={2}
                    value={otherCommercialConditions}
                    onChange={(e) => setOtherCommercialConditions(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* REVIEW & SUBMISSION SUMMARY */}
          {activeTab === 'review' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3">
                <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-amber-900 text-xs space-y-1.5">
                  <strong className="block font-bold">Important Notice Regarding Final Submission</strong>
                  <span className="block">
                    Per NMDC procurement governance guidelines, upon clicking <strong>"Submit & Lock Offer"</strong>, this budgetary offer and technical proposal will be permanently locked.
                  </span>
                  <span className="block text-[11px] font-medium text-amber-800 pt-1 border-t border-amber-200/80">
                    {BUDGETARY_DISCLAIMER_TEXT}
                  </span>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="font-bold text-slate-900 block border-b border-slate-200 pb-1">
                    Proposal Identification
                  </span>
                  <div>
                    <span className="text-slate-500">Reference Requirement:</span>
                    <strong className="block text-slate-800">{targetCode} - {targetTitle}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Responding Vendor:</span>
                    <strong className="block text-slate-800">{vendor?.name || 'Not Signed In as Vendor'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Delivery Period:</span>
                    <span className="block text-slate-800 font-medium">{deliveryPeriodWeeks} Weeks from LOA</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="font-bold text-slate-900 block border-b border-slate-200 pb-1">
                    Commercial Summary
                  </span>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Basic Subtotal:</span>
                    <span className="font-mono font-semibold">₹ {(subtotalCost / 10000000).toFixed(2)} Cr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">GST ({gstRate}%):</span>
                    <span className="font-mono font-semibold">₹ {(gstAmount / 10000000).toFixed(2)} Cr</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-blue-900">
                    <span>Total Contract Offer:</span>
                    <span className="font-mono text-sm">₹ {(totalEstimatedCost / 10000000).toFixed(2)} Cr</span>
                  </div>
                  <div className="text-[11px] text-slate-500 pt-1">
                    Indicative Budget: {targetBudgetLabel}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3.5 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {activeTab !== 'partA' && (
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'review') setActiveTab('partC');
                  else if (activeTab === 'partC') setActiveTab('partB');
                  else if (activeTab === 'partB') setActiveTab('partA');
                }}
                className="flex items-center gap-1 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous Part</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={submitting || !vendor}
              onClick={() => handleFormSubmit(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-semibold rounded-xl transition-colors"
            >
              <Save className="w-4 h-4 text-slate-500" />
              <span>Save Draft</span>
            </button>

            {activeTab !== 'review' ? (
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'partA') setActiveTab('partB');
                  else if (activeTab === 'partB') setActiveTab('partC');
                  else if (activeTab === 'partC') setActiveTab('review');
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs transition-colors"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting || !vendor}
                onClick={() => handleFormSubmit(false)}
                className="flex items-center gap-1.5 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition-colors"
              >
                <Lock className="w-4 h-4 text-emerald-200" />
                <span>{submitting ? 'Locking & Submitting...' : 'Submit & Lock Offer'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

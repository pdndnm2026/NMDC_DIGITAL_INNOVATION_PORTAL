import React, { useState } from 'react';
import { ProblemStatement, Vendor, CommercialItemCost, ProposalCommercialConditions } from '../types/index.js';
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
  AlertCircle
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
    name: 'MiningTech Dynamics Pvt Ltd',
    legalEntity: 'Private Limited',
    cin: 'U72200TG2018PTC125890',
    pan: 'AABCM9012F',
    gstin: '36AABCM9012F1Z4',
    registeredAddress: 'Plot 42, Hitec City Phase 2, Madhapur, Hyderabad, Telangana - 500081',
    website: 'https://miningtechdynamics.in',
    yearEstablished: 2018,
    companySize: '51-200',
    msmeStatus: true,
    startupStatus: false,
    contactPerson: 'Ananya Deshmukh',
    designation: 'Managing Director & CTO',
    email: 'vendor@miningtech.in',
    mobile: '+91 98230 44551',
    areasOfExpertise: ['HEMM Telematics', 'Fleet Management', 'Industrial Automation'],
    capabilities: ['Edge Computing', 'CAN-Bus Telemetry', 'Mine Dispatch Algorithm'],
    miningExperienceYears: 8,
    miningPsuExperience: 'Deployed fleet tracking at Coal India and Tata Steel',
    majorCustomers: ['Coal India Limited', 'Tata Steel Mining'],
    annualTurnoverCr: 24.5,
    netWorthCr: 12.8,
    status: 'Active',
    performanceScore: 92,
    documents: [],
    createdAt: '2025-01-10T10:00:00Z',
  };

  const [activeTab, setActiveTab] = useState<'partA' | 'partB' | 'partC' | 'review'>('partA');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Part A: Technical Proposal
  // ---------------------------------------------------------------------------
  const [understandingOfRequirement, setUnderstandingOfRequirement] = useState(
    `We have conducted a thorough engineering analysis of NMDC Problem Statement ${problemStatement.code} ("${problemStatement.title}"). Our technical solution directly addresses the operational bottlenecks at ${problemStatement.projectComplex}.`
  );
  const [proposedSolution, setProposedSolution] = useState('');
  const [technicalSpecifications, setTechnicalSpecifications] = useState('');
  const [equipmentDetails, setEquipmentDetails] = useState('');
  const [softwareDetails, setSoftwareDetails] = useState('');
  const [systemArchitecture, setSystemArchitecture] = useState('On-Premise Industrial Edge with Redundant Central Server');
  const [scopeOfSupply, setScopeOfSupply] = useState('');
  const [installationCommissioning, setInstallationCommissioning] = useState('Turnkey delivery and on-site installation by OEM certified engineers during planned maintenance intervals without production stoppage.');
  const [integrationRequirements, setIntegrationRequirements] = useState('Requires standard industrial communication port (Modbus TCP / Profinet / OPC-UA) and database read access.');
  const [implementationMethodology, setImplementationMethodology] = useState('4-Stage Methodology: Stage 1 Engineering & Site Survey, Stage 2 Hardware Supply & Assembly, Stage 3 Field Installation & Cold Commissioning, Stage 4 30-Day Hot Trial and Acceptance.');
  const [deliveryPeriodWeeks, setDeliveryPeriodWeeks] = useState<number>(12);
  const [warrantyMonths, setWarrantyMonths] = useState<number>(12);
  const [amcScope, setAmcScope] = useState('Comprehensive 24x7 resident engineer support at mine site, quarterly preventive maintenance, and all hardware spares replacement.');
  const [trainingScope, setTrainingScope] = useState('Hands-on certification for NMDC operating crew, electrical supervisors, and IT administrators.');
  const [technicalDeviations, setTechnicalDeviations] = useState('None. Fully compliant with all specifications and statutory DGMS mining guidelines.');
  const [supportingDocuments, setSupportingDocuments] = useState<{ name: string; size: string; type: string }[]>([
    { name: 'Technical_Proposal_Detailed_Architecture.pdf', size: '3.8 MB', type: 'PDF' },
    { name: 'Bill_of_Materials_Schedule_A.xlsx', size: '640 KB', type: 'XLSX' },
  ]);
  const [newDocName, setNewDocName] = useState('');

  // ---------------------------------------------------------------------------
  // Part B: Commercial Proposal (Item-wise costing in ₹)
  // ---------------------------------------------------------------------------
  const [equipmentCost, setEquipmentCost] = useState<number>(12000000); // 1.20 Cr
  const [hardwareCost, setHardwareCost] = useState<number>(4500000);  // 45 Lakhs
  const [softwareCost, setSoftwareCost] = useState<number>(3800000);  // 38 Lakhs
  const [licenceCost, setLicenceCost] = useState<number>(1200000);    // 12 Lakhs
  const [installationCost, setInstallationCost] = useState<number>(1100000); // 11 Lakhs
  const [commissioningCost, setCommissioningCost] = useState<number>(850000); // 8.5 Lakhs
  const [integrationCost, setIntegrationCost] = useState<number>(650000);     // 6.5 Lakhs
  const [trainingCost, setTrainingCost] = useState<number>(400000);         // 4 Lakhs
  const [freightCost, setFreightCost] = useState<number>(550000);           // 5.5 Lakhs
  const [amcCostPerYear, setAmcCostPerYear] = useState<number>(1500000);     // 15 Lakhs
  const [otherCharges, setOtherCharges] = useState<number>(200000);         // 2 Lakhs
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
    '20% Advance against Bank Guarantee, 60% on progressive material delivery at NMDC Central Stores, 20% on final commissioning and 30-day performance acceptance demonstration.'
  );
  const [amcYears, setAmcYears] = useState<number>(3);
  const [priceBasis, setPriceBasis] = useState(
    `FOR Destination ${problemStatement.projectComplex} (Inclusive of packing, forwarding, transit insurance, and freight).`
  );
  const [taxesAndDuties, setTaxesAndDuties] = useState(
    'GST at 18% extra as applicable at time of invoicing. Any statutory variation on government account shall be to NMDC account.'
  );
  const [otherCommercialConditions, setOtherCommercialConditions] = useState(
    'Performance Bank Guarantee (PBG) of 5% of contract value valid for warranty period plus 60 days claim period shall be furnished within 21 days of LOA issuance.'
  );

  if (!isOpen) return null;

  const handleAddDoc = () => {
    if (!newDocName.trim()) return;
    const ext = newDocName.split('.').pop()?.toUpperCase() || 'FILE';
    setSupportingDocuments([
      ...supportingDocuments,
      { name: newDocName.trim(), size: '1.2 MB', type: ext },
    ]);
    setNewDocName('');
  };

  const handleRemoveDoc = (idx: number) => {
    setSupportingDocuments(supportingDocuments.filter((_, i) => i !== idx));
  };

  const handleFormSubmit = async (isDraft: boolean) => {
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
          problemStatementId: problemStatement.id,
          problemStatementCode: problemStatement.code,
          problemStatementTitle: problemStatement.title,
          vendorId: effectiveVendor.id,
          vendorName: effectiveVendor.name,
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
                VENDOR SOLUTION & BUDGETARY OFFER · SECTION 10
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600 font-mono font-semibold">{problemStatement.code}</span>
            </div>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg mt-0.5">
              Submit Solution & Budgetary Offer: {problemStatement.title}
            </h3>
            <p className="text-slate-500 text-xs">
              Responding as registered vendor: <strong className="text-slate-800">{effectiveVendor.name}</strong> ({effectiveVendor.legalEntity})
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
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="font-bold text-slate-800 block mb-1">Technical Supporting Documents</span>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    placeholder="e.g. System_SLD_Architecture_Diagram.pdf"
                    className="flex-1 border border-slate-300 rounded-xl p-2 text-slate-900 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddDoc}
                    className="px-3 py-2 bg-slate-800 text-white font-semibold rounded-xl"
                  >
                    Add File
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
                <div className="text-amber-900 text-xs">
                  <strong className="block font-bold">Important Notice Regarding Final Submission</strong>
                  <span>
                    Per NMDC procurement governance guidelines, upon clicking <strong>"Submit & Lock Offer"</strong>, this budgetary offer and technical proposal will be permanently locked. Any subsequent changes will require an authorized revision process with timestamped version history.
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
                    <span className="text-slate-500">Problem Statement:</span>
                    <strong className="block text-slate-800">{problemStatement.code} - {problemStatement.title}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Responding Vendor:</span>
                    <strong className="block text-slate-800">{effectiveVendor.name}</strong>
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
                    <span className="text-slate-500">GST (18%):</span>
                    <span className="font-mono font-semibold">₹ {(gstAmount / 10000000).toFixed(2)} Cr</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-blue-900">
                    <span>Total Contract Offer:</span>
                    <span className="font-mono text-sm">₹ {(totalEstimatedCost / 10000000).toFixed(2)} Cr</span>
                  </div>
                  <div className="text-[11px] text-slate-500 pt-1">
                    Indicative Budget: {problemStatement.indicativeBudget}
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
              disabled={submitting}
              onClick={() => handleFormSubmit(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
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
                disabled={submitting}
                onClick={() => handleFormSubmit(false)}
                className="flex items-center gap-1.5 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs transition-colors"
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

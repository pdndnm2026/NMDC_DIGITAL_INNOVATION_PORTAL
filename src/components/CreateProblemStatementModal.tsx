import React, { useState, useEffect } from 'react';
import { X, Send, Save, AlertCircle, Trash2, Upload, Video, Image as ImageIcon, FileText } from 'lucide-react';
import { fetchApi } from '../utils/api.js';
import {
  User,
  MineComplexCode,
  MineComplex,
  DEFAULT_ORGANISATIONAL_UNITS,
  AttachmentFile,
} from '../types/index.js';

interface CreateProblemStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUser?: User | null;
  defaultComplexCode?: MineComplexCode | 'ALL';
  organisationalUnits?: MineComplex[];
}

export const CreateProblemStatementModal: React.FC<CreateProblemStatementModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentUser,
  defaultComplexCode,
  organisationalUnits = DEFAULT_ORGANISATIONAL_UNITS,
}) => {
  const [activeStep, setActiveStep] = useState<'basic' | 'problem' | 'requirement' | 'attachments'>('basic');
  
  // Selected Complex
  const initialComplexCode: MineComplexCode = 
    (currentUser?.mineComplexCode && currentUser.mineComplexCode !== 'ALL'
      ? currentUser.mineComplexCode
      : (defaultComplexCode && defaultComplexCode !== 'ALL' ? defaultComplexCode : 'DIOM'));

  const [selectedComplexCode, setSelectedComplexCode] = useState<MineComplexCode>(initialComplexCode);

  // Basic Details
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState(currentUser?.department || 'Mining & HEMM Engineering');
  const [location, setLocation] = useState(currentUser?.location || '');
  const [originatingOfficer, setOriginatingOfficer] = useState(currentUser?.name || '');
  const [designation, setDesignation] = useState(currentUser?.designation || '');
  const [submissionDate, setSubmissionDate] = useState(new Date().toISOString().substring(0, 10));
  const [category, setCategory] = useState('Mining & Heavy Earth Moving Machinery (HEMM)');

  // Problem Details
  const [existingSituation, setExistingSituation] = useState('');
  const [detailedProblemStatement, setDetailedProblemStatement] = useState('');
  const [operationalDifficulties, setOperationalDifficulties] = useState('');
  const [existingEquipment, setExistingEquipment] = useState('');
  const [reasonForRequirement, setReasonForRequirement] = useState('');
  const [desiredOutcome, setDesiredOutcome] = useState('');
  const [expectedBenefits, setExpectedBenefits] = useState('');
  const [supportingTechnicalInfo, setSupportingTechnicalInfo] = useState('');

  // Requirement Details
  const [requiredSolution, setRequiredSolution] = useState('');
  const [technicalSpecifications, setTechnicalSpecifications] = useState('');
  const [scopeOfSupply, setScopeOfSupply] = useState('');
  const [requiredDeliverables, setRequiredDeliverables] = useState('');
  const [implementationPeriodMonths, setImplementationPeriodMonths] = useState<number>(6);
  const [budgetNumeric, setBudgetNumeric] = useState<number>(0);
  const [requiredVendorExperience, setRequiredVendorExperience] = useState('');
  const [submissionDeadline, setSubmissionDeadline] = useState(
    new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10)
  );

  // Attachments (Documents, Images & Videos)
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [newAttachmentName, setNewAttachmentName] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.mineComplexCode && currentUser.mineComplexCode !== 'ALL') {
      setSelectedComplexCode(currentUser.mineComplexCode);
    } else if (defaultComplexCode && defaultComplexCode !== 'ALL') {
      setSelectedComplexCode(defaultComplexCode);
    }
    if (currentUser?.name && !originatingOfficer) {
      setOriginatingOfficer(currentUser.name);
    }
    if (currentUser?.designation && !designation) {
      setDesignation(currentUser.designation);
    }
    if (currentUser?.department && !department) {
      setDepartment(currentUser.department);
    }
  }, [currentUser, defaultComplexCode]);

  if (!isOpen) return null;

  const currentComplexObj = organisationalUnits.find(c => c.code === selectedComplexCode);

  const detectMediaKind = (ext: string): 'document' | 'image' | 'video' => {
    const clean = ext.toUpperCase();
    if (['MP4', 'WEBM', 'MOV'].includes(clean)) return 'video';
    if (['PNG', 'JPG', 'JPEG', 'WEBP'].includes(clean)) return 'image';
    return 'document';
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setErrorMessage(null);

    const added: AttachmentFile[] = [];
    for (const file of files) {
      const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
      const mediaKind = detectMediaKind(ext);
      const maxBytes = mediaKind === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxBytes) {
        setErrorMessage(`File "${file.name}" exceeds maximum allowed size (${mediaKind === 'video' ? '50 MB for video' : '10 MB for documents'}).`);
        continue;
      }
      const sizeStr = file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`;
      added.push({
        name: file.name,
        size: sizeStr,
        type: ext,
        mediaKind,
        url: URL.createObjectURL(file),
      });
    }
    if (added.length > 0) {
      setAttachments(prev => [...prev, ...added]);
    }
    e.target.value = '';
  };

  const handleAddAttachment = () => {
    if (!newAttachmentName.trim()) return;
    const ext = newAttachmentName.split('.').pop()?.toUpperCase() || 'FILE';
    const mediaKind = detectMediaKind(ext);
    setAttachments([
      ...attachments,
      { name: newAttachmentName.trim(), size: 'Reference File', type: ext, mediaKind },
    ]);
    setNewAttachmentName('');
  };

  const handleRemoveAttachment = (idx: number) => {
    setAttachments(attachments.filter((_, i) => i !== idx));
  };

  const handleSave = async (isDraft: boolean) => {
    if (!title.trim() && !isDraft) {
      setErrorMessage('Please provide a descriptive Problem Statement Title.');
      setActiveStep('basic');
      return;
    }
    if (!detailedProblemStatement.trim() && !isDraft) {
      setErrorMessage('Please provide detailed operational problem statement information.');
      setActiveStep('problem');
      return;
    }
    if (budgetNumeric <= 0 && !isDraft) {
      setErrorMessage('Please provide an indicative budget estimate.');
      setActiveStep('requirement');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    try {
      await fetchApi('/api/problems', {
        method: 'POST',
        body: JSON.stringify({
          mineComplexCode: selectedComplexCode,
          mineComplexName: currentComplexObj?.name || selectedComplexCode,
          title: title.trim(),
          department,
          projectComplex: currentComplexObj?.name || selectedComplexCode,
          location: location.trim() || `${currentComplexObj?.location}, Bench / Workshop Area`,
          originatingOfficer: originatingOfficer.trim() || currentUser?.name || 'Authorized Officer',
          designation: designation.trim() || currentUser?.designation || 'Executive',
          submissionDate,
          category,
          existingSituation: existingSituation.trim(),
          detailedProblemStatement: detailedProblemStatement.trim(),
          operationalDifficulties: operationalDifficulties.trim(),
          existingEquipment: existingEquipment.trim(),
          reasonForRequirement: reasonForRequirement.trim(),
          desiredOutcome: desiredOutcome.trim(),
          expectedBenefits: expectedBenefits.trim(),
          supportingTechnicalInfo: supportingTechnicalInfo.trim(),
          requiredSolution: requiredSolution.trim(),
          technicalSpecifications: technicalSpecifications.trim(),
          scopeOfSupply: scopeOfSupply.trim(),
          requiredDeliverables: requiredDeliverables.trim(),
          implementationPeriodMonths,
          indicativeBudget: `₹ ${budgetNumeric.toFixed(2)} Cr`,
          budgetNumeric,
          requiredVendorExperience: requiredVendorExperience.trim(),
          submissionDeadline,
          attachments,
          isDraft,
        }),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit problem statement.');
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
              <span className="font-mono text-blue-700 font-bold uppercase tracking-wider text-[11px] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {selectedComplexCode}-PS-2026-XXXX (AUTO GENERATED)
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600 font-medium">{currentComplexObj?.name}</span>
            </div>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg mt-0.5">
              Create NMDC Operational Problem Statement
            </h3>
            <p className="text-slate-500 text-xs">
              Formally record technology requirements and operational bottlenecks for invitation of vendor solutions.
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
            onClick={() => setActiveStep('basic')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeStep === 'basic' ? 'bg-blue-700 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <span>1. Basic Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep('problem')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeStep === 'problem' ? 'bg-blue-700 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <span>2. Problem Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep('requirement')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeStep === 'requirement' ? 'bg-blue-700 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <span>3. Requirement Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep('attachments')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeStep === 'attachments' ? 'bg-blue-700 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <span>4. Attachments ({attachments.length})</span>
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
          {activeStep === 'basic' && (
            <div className="space-y-4">
              {/* Organisational Unit Selection (All 5 DB Units) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="font-bold text-slate-800 block text-xs">
                  Assigned Organisational Unit / Mine Complex *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {organisationalUnits.filter(u => u.activeStatus).map((complex) => {
                    const isSelected = selectedComplexCode === complex.code;
                    return (
                      <button
                        key={complex.code}
                        type="button"
                        onClick={() => setSelectedComplexCode(complex.code)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold ring-1 ring-blue-600'
                            : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-xs truncate">{complex.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono truncate">{complex.code} · {complex.state}</div>
                        </div>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded shrink-0 ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {complex.code}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Problem Statement Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. In-Pit Secondary Sizing and Crusher Hopper Optimization"
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Department *</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 bg-white text-slate-900"
                  >
                    <option value="Mining & HEMM Engineering">Mining & HEMM Engineering</option>
                    <option value="Mineral Processing & Beneficiation">Mineral Processing & Beneficiation</option>
                    <option value="Crushing & Screening Plant">Crushing & Screening Plant</option>
                    <option value="Electrical & Power Systems">Electrical & Power Systems</option>
                    <option value="Safety & Mine Geology">Safety & Mine Geology</option>
                    <option value="Environment & Sustainable Mining">Environment & Sustainable Mining</option>
                    <option value="Materials Management & Central Stores">Materials Management</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 bg-white text-slate-900"
                  >
                    <option value="Mining & Heavy Earth Moving Machinery (HEMM)">Mining & HEMM</option>
                    <option value="Mineral Processing & Crushing">Mineral Processing & Crushing</option>
                    <option value="Slurry Pipeline & Transport">Slurry Pipeline & Transport</option>
                    <option value="Electrical & Mechanical Drives">Electrical & Mechanical Drives</option>
                    <option value="Mine Safety & Geotechnical">Mine Safety & Geotechnical</option>
                    <option value="Environment & Dust Suppression">Environment & Dust Suppression</option>
                    <option value="Automation & SCADA Systems">Automation & SCADA Systems</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Specific Location within Complex</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Primary Crushing Unit - Bench 14"
                    className="w-full border border-slate-300 rounded-xl p-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Date of Submission</label>
                  <input
                    type="date"
                    value={submissionDate}
                    onChange={(e) => setSubmissionDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Originating Officer Name *</label>
                  <input
                    type="text"
                    required
                    value={originatingOfficer}
                    onChange={(e) => setOriginatingOfficer(e.target.value)}
                    placeholder="Officer full name"
                    className="w-full border border-slate-300 rounded-xl p-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Designation *</label>
                  <input
                    type="text"
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Senior Manager / DGM"
                    className="w-full border border-slate-300 rounded-xl p-2 text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {activeStep === 'problem' && (
            <div className="space-y-3.5">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Existing Situation</label>
                <textarea
                  rows={2}
                  value={existingSituation}
                  onChange={(e) => setExistingSituation(e.target.value)}
                  placeholder="Describe current operational setup, baseline equipment deployed and present process flow..."
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Detailed Problem Statement *</label>
                <textarea
                  rows={3}
                  required
                  value={detailedProblemStatement}
                  onChange={(e) => setDetailedProblemStatement(e.target.value)}
                  placeholder="Clearly explain the technical and operational difficulty, bottleneck causes and failure modes..."
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Operational Difficulties</label>
                  <textarea
                    rows={2}
                    value={operationalDifficulties}
                    onChange={(e) => setOperationalDifficulties(e.target.value)}
                    placeholder="Specific difficulties faced by mining crews or plant operators..."
                    className="w-full border border-slate-300 rounded-xl p-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Existing System / Equipment</label>
                  <textarea
                    rows={2}
                    value={existingEquipment}
                    onChange={(e) => setExistingEquipment(e.target.value)}
                    placeholder="Make, model, operating capacity, and age of current machinery..."
                    className="w-full border border-slate-300 rounded-xl p-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Reason for Requirement</label>
                  <textarea
                    rows={2}
                    value={reasonForRequirement}
                    onChange={(e) => setReasonForRequirement(e.target.value)}
                    placeholder="Why standard in-house methods cannot resolve the operational difficulty..."
                    className="w-full border border-slate-300 rounded-xl p-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Desired Outcome</label>
                  <textarea
                    rows={2}
                    value={desiredOutcome}
                    onChange={(e) => setDesiredOutcome(e.target.value)}
                    placeholder="Target operational metrics, throughput increase, or automation level..."
                    className="w-full border border-slate-300 rounded-xl p-2 text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Expected Operational & Financial Benefits</label>
                  <textarea
                    rows={2}
                    value={expectedBenefits}
                    onChange={(e) => setExpectedBenefits(e.target.value)}
                    placeholder="Estimated annual cost savings, safety hazard elimination, fuel/power reduction..."
                    className="w-full border border-slate-300 rounded-xl p-2 text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Supporting Technical Information</label>
                  <textarea
                    rows={2}
                    value={supportingTechnicalInfo}
                    onChange={(e) => setSupportingTechnicalInfo(e.target.value)}
                    placeholder="Power availability, network coverage, ambient conditions, physical clearances at the mine site..."
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {activeStep === 'requirement' && (
            <div className="space-y-3.5">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Required Solution Description</label>
                <textarea
                  rows={2}
                  value={requiredSolution}
                  onChange={(e) => setRequiredSolution(e.target.value)}
                  placeholder="Envisaged technological solution, hardware/software approach..."
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Technical Specifications & Performance Parameters</label>
                <textarea
                  rows={3}
                  value={technicalSpecifications}
                  onChange={(e) => setTechnicalSpecifications(e.target.value)}
                  placeholder="Ruggedization requirements, IP ratings, operating temperature, communication protocols..."
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Scope of Supply / Services</label>
                  <textarea
                    rows={2}
                    value={scopeOfSupply}
                    onChange={(e) => setScopeOfSupply(e.target.value)}
                    placeholder="Field instruments, cabling, control panels, software, installation, testing..."
                    className="w-full border border-slate-300 rounded-xl p-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Required Deliverables</label>
                  <textarea
                    rows={2}
                    value={requiredDeliverables}
                    onChange={(e) => setRequiredDeliverables(e.target.value)}
                    placeholder="Drawings, test reports, commissioning certificate, user manual, training..."
                    className="w-full border border-slate-300 rounded-xl p-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Indicative Budget (₹ Crores) *</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    value={budgetNumeric}
                    onChange={(e) => setBudgetNumeric(parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 1.50"
                    className="w-full border border-slate-300 rounded-xl p-2 text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Implementation Period (Months)</label>
                  <input
                    type="number"
                    min="1"
                    max="48"
                    value={implementationPeriodMonths}
                    onChange={(e) => setImplementationPeriodMonths(parseInt(e.target.value) || 6)}
                    className="w-full border border-slate-300 rounded-xl p-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Submission Deadline for Offers</label>
                  <input
                    type="date"
                    value={submissionDeadline}
                    onChange={(e) => setSubmissionDeadline(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Required Vendor Experience / Eligibility</label>
                  <input
                    type="text"
                    value={requiredVendorExperience}
                    onChange={(e) => setRequiredVendorExperience(e.target.value)}
                    placeholder="e.g. Minimum 3 years experience in mining or heavy process industry..."
                    className="w-full border border-slate-300 rounded-xl p-2 text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {activeStep === 'attachments' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Upload Technical Documents, Drawings & Site Videos
                  </label>
                  <p className="text-slate-500 text-[11px]">
                    Supports technical files (PDF, DOCX, XLSX, PNG, JPG up to 10 MB) and operational site walkthrough videos (MP4, WEBM, MOV up to 50 MB).
                  </p>
                </div>

                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white rounded-xl p-5 cursor-pointer transition-colors">
                  <Upload className="w-6 h-6 text-blue-700 mb-1.5" />
                  <span className="font-bold text-slate-800 text-xs">Click to select Documents, Images, or Video Files (MP4 / WEBM / MOV)</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">Multiple files supported</span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.mp4,.webm,.mov"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </label>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newAttachmentName}
                    onChange={(e) => setNewAttachmentName(e.target.value)}
                    placeholder="Or enter drawing/video reference filename (e.g. Crusher_Site_Walkthrough.mp4)"
                    className="flex-1 border border-slate-300 rounded-xl p-2 bg-white text-slate-900 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddAttachment}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl whitespace-nowrap"
                  >
                    Add Reference
                  </button>
                </div>
              </div>

              {/* Uploaded Documents & Videos List */}
              <div className="space-y-2">
                <span className="font-semibold text-slate-700 block text-xs">
                  Attached Technical Files & Videos ({attachments.length}):
                </span>
                {attachments.length === 0 ? (
                  <p className="text-slate-400 italic py-2">No documents or videos attached yet.</p>
                ) : (
                  attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-lg font-bold text-[10px] flex items-center justify-center shrink-0 ${
                            att.mediaKind === 'video'
                              ? 'bg-purple-100 text-purple-800'
                              : att.mediaKind === 'image'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {att.mediaKind === 'video' ? (
                              <Video className="w-4 h-4" />
                            ) : att.mediaKind === 'image' ? (
                              <ImageIcon className="w-4 h-4" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-800 block truncate">{att.name}</span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {att.type} · {att.size} {att.mediaKind === 'video' ? '· Video Attachment' : ''}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {att.mediaKind === 'video' && att.url && (
                        <video
                          controls
                          src={att.url}
                          className="w-full max-h-48 rounded-lg border border-slate-200 bg-slate-950"
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3.5 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <span className="font-semibold">Workflow:</span>
            <span>Draft → Submitted → Department Review → Approval → Published</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSave(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
            >
              <Save className="w-4 h-4 text-slate-500" />
              <span>Save as Draft</span>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSave(false)}
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-xs transition-colors"
            >
              <Send className="w-4 h-4 text-blue-200" />
              <span>{submitting ? 'Submitting...' : 'Submit for Department Review'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

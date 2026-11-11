import React, { useState, useEffect } from 'react';
import { PocRecord, UserRole, User, PocStatus, MineComplexCode, AUTHORIZED_MINE_COMPLEXES } from '../types/index.js';
import { 
  Layers, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Building2, 
  IndianRupee, 
  ArrowRight,
  ShieldCheck, 
  Calendar, 
  FileText, 
  Printer, 
  X, 
  Upload, 
  Plus,
  MapPin
} from 'lucide-react';
import { fetchApi } from '../utils/api.js';

interface PocManagementViewProps {
  currentRole: UserRole;
  currentUser: User | null;
  activeComplexCode?: MineComplexCode | 'ALL';
  onRefreshData?: () => void;
}

export const PocManagementView: React.FC<PocManagementViewProps> = ({
  currentRole,
  currentUser,
  activeComplexCode = 'ALL',
  onRefreshData,
}) => {
  const [pocs, setPocs] = useState<PocRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedComplexFilter, setSelectedComplexFilter] = useState<string>(activeComplexCode);
  const [search, setSearch] = useState('');
  const [selectedPocDetail, setSelectedPocDetail] = useState<PocRecord | null>(null);

  // Status transition state
  const [updatingPoc, setUpdatingPoc] = useState<PocRecord | null>(null);
  const [targetStatus, setTargetStatus] = useState<PocStatus>('Approved');
  const [progressPct, setProgressPct] = useState<number>(50);
  const [actualResults, setActualResults] = useState('');
  const [observations, setObservations] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPocs();
  }, [selectedStatus, selectedComplexFilter]);

  const loadPocs = async () => {
    setLoading(true);
    try {
      const url = selectedComplexFilter !== 'ALL'
        ? `/api/pocs?status=${selectedStatus}&mineComplex=${selectedComplexFilter}`
        : `/api/pocs?status=${selectedStatus}`;
      const res = await fetchApi<{ success: boolean; data: PocRecord[] }>(url);
      if (res.success && res.data) {
        setPocs(res.data);
      }
    } catch (e) {
      console.error('Failed to load PoCs:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePocStatus = async () => {
    if (!updatingPoc) return;
    setSubmitting(true);
    try {
      const res = await fetchApi<{ success: boolean; data: PocRecord }>(
        `/api/pocs/${updatingPoc.id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: targetStatus,
            progressPct,
            actualResults,
            observations,
            recommendations,
          }),
        }
      );

      if (res.success) {
        setPocs(pocs.map((p) => (p.id === updatingPoc.id ? res.data : p)));
        setUpdatingPoc(null);
        if (selectedPocDetail?.id === updatingPoc.id) {
          setSelectedPocDetail(res.data);
        }
        if (onRefreshData) onRefreshData();
      }
    } catch (e: any) {
      alert(`Update error: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const pocStatuses: PocStatus[] = [
    'Proposed',
    'Under Approval',
    'Approved',
    'Scheduled',
    'Under Trial',
    'Evaluation',
    'Successful',
    'Unsuccessful',
    'Closed',
  ];

  const filtered = pocs.filter((p) => {
    if (selectedComplexFilter !== 'ALL' && p.mineComplexCode && p.mineComplexCode !== selectedComplexFilter) return false;
    if (selectedStatus !== 'All' && p.status !== selectedStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.pocCode.toLowerCase().includes(q) ||
        p.vendorName.toLowerCase().includes(q) ||
        p.problemStatementTitle.toLowerCase().includes(q) ||
        p.trialLocation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeComplexObj = AUTHORIZED_MINE_COMPLEXES.find(c => c.code === selectedComplexFilter);

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-teal-800 font-bold uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              PROOF OF CONCEPT (PoC) MANAGEMENT · SECTION 14
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500 font-medium text-xs">
              {selectedComplexFilter === 'ALL' ? 'All Complexes' : activeComplexObj?.name}: {filtered.length} Trials
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            NMDC Field Trials & Proof of Concept (PoC) Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Stage Progression: Proposed → Under Approval → Approved → Scheduled → Under Trial → Evaluation → Successful / Unsuccessful → Closed.
          </p>
        </div>
      </div>

      {/* Complex Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedComplexFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            selectedComplexFilter === 'ALL'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>All 4 Complexes</span>
        </button>

        {AUTHORIZED_MINE_COMPLEXES.map((complex) => {
          const isActive = selectedComplexFilter === complex.code;
          return (
            <button
              key={complex.code}
              onClick={() => setSelectedComplexFilter(complex.code)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                isActive
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{complex.name}</span>
            </button>
          );
        })}
      </div>

      {/* Workflow Tabs / Quick Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedStatus('All')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            selectedStatus === 'All'
              ? 'bg-blue-700 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>All Stages</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
            {pocs.length}
          </span>
        </button>

        {pocStatuses.map((st) => {
          const count = pocs.filter((p) => p.status === st).length;
          const isActive = selectedStatus === st;
          return (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{st}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* PoC Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 text-xs space-y-2">
          <Layers className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-700 text-sm">
            {pocs.length === 0
              ? 'No PoC records available.'
              : selectedComplexFilter !== 'ALL'
              ? 'No PoC records available for this complex.'
              : 'No records available.'}
          </p>
          <p className="text-slate-400 text-xs">
            Field trials will be registered once technical evaluation recommends a Proof of Concept.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((poc) => {
            const isSuccessful = poc.status === 'Successful';
            const isUnderTrial = poc.status === 'Under Trial';

            return (
              <div
                key={poc.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between p-5 space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {poc.pocCode}
                    </span>

                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                        isSuccessful
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : isUnderTrial
                          ? 'bg-blue-50 text-blue-800 border-blue-300 animate-pulse'
                          : 'bg-purple-50 text-purple-800 border-purple-200'
                      }`}
                    >
                      {poc.status} ({poc.progressPct}%)
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block">
                      {poc.problemStatementCode} {poc.mineComplexCode ? `· ${poc.mineComplexCode}` : ''}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1 mt-0.5">
                      {poc.problemStatementTitle}
                    </h3>
                  </div>

                  {/* PoC Metrics Table */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Participating Vendor:</span>
                      <strong className="text-slate-800 truncate max-w-[170px]">{poc.vendorName}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Trial Location:</span>
                      <span className="text-slate-700 truncate max-w-[170px]">{poc.trialLocation}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Equipment / Process:</span>
                      <span className="text-slate-700 truncate max-w-[170px]">{poc.equipmentProcess}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Trial Cost:</span>
                      <span className="font-mono font-bold text-slate-800">₹ {(poc.trialCost / 100000).toFixed(2)} Lakhs</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                      <span>Field Verification Progress</span>
                      <span>{poc.progressPct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-teal-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${poc.progressPct}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">
                    <strong>Scope:</strong> {poc.pocScope}
                  </p>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedPocDetail(poc)}
                    className="text-blue-700 hover:text-blue-800 font-semibold text-xs flex items-center gap-1"
                  >
                    <span>View PoC Evaluation Report</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {(currentRole === 'poc_committee' || currentRole === 'approving_authority' || currentRole === 'admin') && (
                    <button
                      onClick={() => {
                        setUpdatingPoc(poc);
                        setTargetStatus(poc.status);
                        setProgressPct(poc.progressPct);
                        setActualResults(poc.actualResults || '');
                        setObservations(poc.observations || '');
                        setRecommendations(poc.recommendations || '');
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs"
                    >
                      Update Stage
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed PoC Evaluation Report Modal */}
      {selectedPocDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-xs text-slate-800 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {selectedPocDetail.pocCode}
                  </span>
                  <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {selectedPocDetail.status}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="font-bold text-slate-800">{selectedPocDetail.vendorName}</span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                  Proof of Concept (PoC) Evaluation Report: {selectedPocDetail.problemStatementTitle}
                </h2>
              </div>
              <button
                onClick={() => setSelectedPocDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Parameters & Scope */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 text-[11px] block">Trial Location:</span>
                  <strong className="text-slate-800 block mt-0.5">{selectedPocDetail.trialLocation}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Equipment / Process:</span>
                  <strong className="text-slate-800 block mt-0.5">{selectedPocDetail.equipmentProcess}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Trial Period:</span>
                  <strong className="text-slate-800 block mt-0.5">{selectedPocDetail.trialPeriodWeeks} Weeks ({selectedPocDetail.startDate} to {selectedPocDetail.completionDate})</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Trial Sanction Cost:</span>
                  <strong className="text-slate-800 font-mono block mt-0.5">₹ {(selectedPocDetail.trialCost / 100000).toFixed(2)} Lakhs</strong>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-800 block mb-1">PoC Scope & Trial Objectives:</span>
                <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-150 leading-relaxed">
                  {selectedPocDetail.pocScope}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Baseline Performance:</span>
                  <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                    {selectedPocDetail.baselinePerformance}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Expected Target Performance:</span>
                  <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                    {selectedPocDetail.expectedPerformance}
                  </p>
                </div>
              </div>

              {/* Committee Members & Responsibilities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-2">NMDC PoC Committee Members:</span>
                  {selectedPocDetail.nmdcCommitteeMembers && selectedPocDetail.nmdcCommitteeMembers.length > 0 ? (
                    <ul className="space-y-1 text-slate-600">
                      {selectedPocDetail.nmdcCommitteeMembers.map((m, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-400 italic">Designated Mine Operations Committee</p>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-2">Vendor Obligations & Responsibilities:</span>
                  <p className="text-slate-600 leading-relaxed">
                    {selectedPocDetail.vendorResponsibilities || 'Supply of trial instrumentation, setup, and performance logging.'}
                  </p>
                </div>
              </div>

              {/* Actual Results & Recommendations */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1.5">
                  Actual Trial Results, Committee Observations & Final Sanction
                </h4>

                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Actual Measured Results:</span>
                  <p className="text-slate-700 bg-emerald-50/50 p-3 rounded-xl border border-emerald-200 font-medium leading-relaxed">
                    {selectedPocDetail.actualResults || 'Field trial in progress. Preliminary results pending.'}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-slate-700 block mb-1">PoC Committee Observations:</span>
                  <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-150 leading-relaxed">
                    {selectedPocDetail.observations || 'Trial verification underway per SOP.'}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Committee Recommendation for Full Commercial Rollout:</span>
                  <p className="text-slate-800 bg-blue-50/50 p-3 rounded-xl border border-blue-200 font-bold leading-relaxed">
                    {selectedPocDetail.recommendations || 'Recommended for evaluation completion.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Print Formal PoC Report</span>
              </button>

              <button
                onClick={() => setSelectedPocDetail(null)}
                className="px-4 py-2 bg-slate-800 text-white font-semibold rounded-xl"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stage Transition Modal */}
      {updatingPoc && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-5 text-xs text-slate-800 animate-in zoom-in-95 duration-150 space-y-4">
            <div>
              <span className="font-mono text-teal-800 font-bold uppercase text-[10px] tracking-wider">
                POC STAGE TRANSITION · SECTION 14
              </span>
              <h3 className="font-bold text-slate-900 text-base mt-0.5">
                Update PoC Trial Stage: {updatingPoc.pocCode}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">PoC Stage *</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as PocStatus)}
                  className="w-full border border-slate-300 rounded-xl p-2 font-bold text-slate-900 bg-white"
                >
                  {pocStatuses.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Progress Percentage (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={progressPct}
                  onChange={(e) => setProgressPct(parseInt(e.target.value) || 0)}
                  className="w-full border border-slate-300 rounded-xl p-2 text-slate-900 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Actual Measured Results</label>
              <textarea
                rows={2}
                value={actualResults}
                onChange={(e) => setActualResults(e.target.value)}
                placeholder="Data, accuracy, MTBF, throughput results observed during trial..."
                className="w-full border border-slate-300 rounded-xl p-2 text-slate-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Committee Observations</label>
              <textarea
                rows={2}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Field inspection remarks, ambient conditions, sensor reliability..."
                className="w-full border border-slate-300 rounded-xl p-2 text-slate-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Final Recommendation for Commercial Sanction</label>
              <textarea
                rows={2}
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                placeholder="Recommend for full mine rollout / keep on standby / close..."
                className="w-full border border-slate-300 rounded-xl p-2 text-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUpdatingPoc(null)}
                className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSavePocStatus}
                className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg shadow-2xs"
              >
                {submitting ? 'Updating...' : 'Save Stage Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

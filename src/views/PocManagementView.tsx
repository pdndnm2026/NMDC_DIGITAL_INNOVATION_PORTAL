import React, { useState, useEffect } from 'react';
import { PocRecord, UserRole, User } from '../types/index.js';
import { 
  Layers, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  Building, 
  IndianRupee, 
  Cpu, 
  TrendingUp, 
  UserCheck, 
  ArrowRight,
  Sparkles,
  Edit2
} from 'lucide-react';
import { fetchApi } from '../utils/api.js';

interface PocManagementViewProps {
  currentRole: UserRole;
  currentUser: User | null;
  onRefreshData?: () => void;
}

export const PocManagementView: React.FC<PocManagementViewProps> = ({
  currentRole,
  currentUser,
}) => {
  const [pocs, setPocs] = useState<PocRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedPocDetail, setSelectedPocDetail] = useState<PocRecord | null>(null);

  // Status updating state
  const [updatingPocId, setUpdatingPocId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<PocRecord['status']>('Success Criteria Met');
  const [newProgress, setNewProgress] = useState<number>(100);
  const [resultsNotes, setResultsNotes] = useState('');
  const [recommendation, setRecommendation] = useState('Recommend Full Pilot Phase on remaining 14 Dumpers.');

  useEffect(() => {
    loadPocs();
  }, [selectedSite, selectedStatus]);

  const loadPocs = async () => {
    setLoading(true);
    try {
      const res = await fetchApi<{ success: boolean; data: PocRecord[] }>(
        `/api/pocs?site=${selectedSite}&status=${selectedStatus}`
      );
      if (res.success && res.data) {
        setPocs(res.data);
      }
    } catch (e) {
      console.error('Failed to load PoCs:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (pocId: string) => {
    try {
      const res = await fetchApi<{ success: boolean; data: PocRecord }>(`/api/pocs/${pocId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: newStatus,
          progressPct: newProgress,
          resultsSummary: resultsNotes,
          recommendation,
        }),
      });

      if (res.success) {
        setPocs(pocs.map((p) => (p.id === pocId ? res.data : p)));
        setUpdatingPocId(null);
        if (selectedPocDetail?.id === pocId) {
          setSelectedPocDetail(res.data);
        }
      }
    } catch (e: any) {
      alert(`Update error: ${e.message}`);
    }
  };

  const sites = [
    'All',
    'Bailadila Deposit 5',
    'Bailadila Deposit 14',
    'Donimalai Mine',
    'Kumaraswamy Mine',
    'Pellet Plant Vizag',
  ];

  const statuses = [
    'All',
    'In Evaluation',
    'Active Bench Testing',
    'Field Trial Underway',
    'Success Criteria Met',
    'Approved for Pilot',
    'Discontinued',
  ];

  const filtered = pocs.filter((poc) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        poc.title.toLowerCase().includes(q) ||
        poc.pocCode.toLowerCase().includes(q) ||
        poc.vendorName.toLowerCase().includes(q) ||
        poc.equipmentTarget.toLowerCase().includes(q) ||
        poc.responsibleOfficer.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: PocRecord['status']) => {
    switch (status) {
      case 'Success Criteria Met':
      case 'Approved for Pilot':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'Field Trial Underway':
      case 'Active Bench Testing':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'In Evaluation':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Discontinued':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      default:
        return 'text-slate-700 bg-slate-100 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-blue-700 font-semibold tracking-wider uppercase">
            STAGE 4 IMPLEMENTATION GOVERNANCE
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            PoC (Proof of Concept) Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Rigorous tracking of baseline vs. target metrics, sensor trials, and pilot approvals across NMDC production complexes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-slate-400 block">Fast-Track Pilot Sanctions</span>
            <span className="text-xs font-bold text-slate-700">Go/No-Go Decision Gates</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search PoC code, equipment, vendor, officer..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              {sites.map((s) => (
                <option key={s} value={s}>
                  Site Complex: {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              {statuses.map((st) => (
                <option key={st} value={st}>
                  Stage Status: {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span>Active PoCs Tracked: <strong>{filtered.length}</strong></span>
          <span className="font-mono">
            Total Sanctioned PoC Budget: ₹ {(filtered.reduce((a, b) => a + b.cost, 0) / 100000).toFixed(1)} Lakhs
          </span>
        </div>
      </div>

      {/* PoC Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((poc) => (
          <div
            key={poc.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-blue-500 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              {/* Header meta */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-700 text-sm">{poc.pocCode}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-slate-500">{poc.problemStatementCode}</span>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${getStatusBadge(poc.status)}`}>
                  {poc.status}
                </span>
              </div>

              {/* Title & Vendor */}
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {poc.title}
                </h3>
                <span className="text-xs text-blue-700 font-semibold block mt-0.5">
                  Technology Partner: {poc.vendorName}
                </span>
              </div>

              {/* Objective */}
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <strong>Objective:</strong> {poc.objective}
              </p>

              {/* Equipment, Site, Officer */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div>
                  <span className="text-slate-400 block">Equipment:</span>
                  <strong className="text-slate-800">{poc.equipmentTarget}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Mine Complex:</span>
                  <strong className="text-slate-800">{poc.siteComplex}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Responsible Officer:</span>
                  <strong className="text-slate-800">{poc.responsibleOfficer}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Duration / Cost:</span>
                  <strong className="text-slate-800">{poc.durationWeeks} weeks · ₹ {(poc.cost / 100000).toFixed(1)} Lakhs</strong>
                </div>
              </div>

              {/* Baseline vs Target Metrics */}
              <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-blue-950">
                  <span>KPI Tracked: {poc.kpiName}</span>
                  <span className="text-blue-700 font-mono">{poc.progressPct}% Complete</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2 bg-white rounded-lg border border-blue-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">BASELINE METRIC</span>
                    <strong className="text-slate-700 font-mono text-xs">{poc.baselineMetric}</strong>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-blue-100">
                    <span className="text-[10px] text-emerald-600 uppercase font-bold block">TARGET SUCCESS METRIC</span>
                    <strong className="text-emerald-700 font-mono text-xs">{poc.targetMetric}</strong>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all"
                    style={{ width: `${poc.progressPct}%` }}
                  />
                </div>
              </div>

              {/* Test results if available */}
              {poc.testResultsSummary && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-900">
                  <strong>Trial Findings:</strong> {poc.testResultsSummary}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setSelectedPocDetail(poc)}
                className="text-xs text-slate-600 hover:text-slate-900 font-medium"
              >
                View Complete Dossier
              </button>

              {(currentRole === 'reviewer' || currentRole === 'admin' || currentRole === 'project_manager') && (
                <button
                  type="button"
                  onClick={() => {
                    setUpdatingPocId(poc.id);
                    setNewStatus(poc.status);
                    setNewProgress(poc.progressPct);
                    setResultsNotes(poc.testResultsSummary || '');
                    setRecommendation(poc.recommendationForPilot || '');
                  }}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Update Decision Gate</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Decision Gate Update Modal */}
      {updatingPocId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 text-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm">Update PoC Decision Gate</h3>
              <button onClick={() => setUpdatingPocId(null)} className="text-slate-400 hover:text-slate-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">PoC Stage Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900"
                >
                  <option value="Active Bench Testing">Active Bench Testing</option>
                  <option value="Field Trial Underway">Field Trial Underway</option>
                  <option value="Success Criteria Met">Success Criteria Met</option>
                  <option value="Approved for Pilot">Approved for Pilot</option>
                  <option value="Discontinued">Discontinued / No-Go</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Progress Percentage ({newProgress}%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={newProgress}
                  onChange={(e) => setNewProgress(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Field Test Findings & Metrics Achieved</label>
                <textarea
                  rows={2}
                  value={resultsNotes}
                  onChange={(e) => setResultsNotes(e.target.value)}
                  placeholder="e.g. Achieved 94.6% anomaly detection accuracy on BH100S dumper #14 over 420 operating hours..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Recommendation for Pilot / Scale-Up</label>
                <input
                  type="text"
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  placeholder="e.g. Sanction full pilot expansion across Kirandul fleet..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setUpdatingPocId(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(updatingPocId)}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold"
              >
                Record Decision Gate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Dossier Modal */}
      {selectedPocDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 text-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="font-mono text-xs text-blue-700 font-bold block">
                  {selectedPocDetail.pocCode} · DOSSIER
                </span>
                <h3 className="font-bold text-slate-900 text-base leading-snug">
                  {selectedPocDetail.title}
                </h3>
              </div>
              <button onClick={() => setSelectedPocDetail(null)} className="text-slate-400 hover:text-slate-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 block">Vendor Partner</span>
                  <strong className="text-slate-900">{selectedPocDetail.vendorName}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Site Complex</span>
                  <strong className="text-slate-900">{selectedPocDetail.siteComplex}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Equipment</span>
                  <strong className="text-slate-900">{selectedPocDetail.equipmentTarget}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">NMDC Officer</span>
                  <strong className="text-slate-900">{selectedPocDetail.responsibleOfficer}</strong>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-xs mb-1">PoC Objective & Verification Scope</h4>
                <p className="text-slate-600 leading-relaxed bg-white border border-slate-200 p-3 rounded-lg">
                  {selectedPocDetail.objective}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <span className="text-slate-500 font-semibold block">Baseline Reference</span>
                  <p className="text-slate-800 font-mono font-bold">{selectedPocDetail.baselineMetric}</p>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1">
                  <span className="text-emerald-800 font-semibold block">Target Threshold</span>
                  <p className="text-emerald-900 font-mono font-bold">{selectedPocDetail.targetMetric}</p>
                </div>
              </div>

              {selectedPocDetail.testResultsSummary && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1">
                  <span className="font-bold text-blue-950 block">Documented Test Results</span>
                  <p className="text-blue-900 leading-relaxed">{selectedPocDetail.testResultsSummary}</p>
                </div>
              )}

              {selectedPocDetail.recommendationForPilot && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-1">
                  <span className="font-bold text-amber-950 block">Pilot Scaling Recommendation</span>
                  <p className="text-amber-900 leading-relaxed">{selectedPocDetail.recommendationForPilot}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPocDetail(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

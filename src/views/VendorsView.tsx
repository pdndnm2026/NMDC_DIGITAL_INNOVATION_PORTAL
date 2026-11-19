import React, { useState } from 'react';
import { Vendor, VendorStatus, UserRole } from '../types/index.js';
import { 
  Building2, 
  Search, 
  Award, 
  Plus,
  AlertCircle,
  X
} from 'lucide-react';
import { fetchApi } from '../utils/api.js';

interface VendorsViewProps {
  vendors: Vendor[];
  currentRole: UserRole;
  onOpenRegisterVendor: () => void;
  onRefreshVendors: () => void;
}

export const VendorsView: React.FC<VendorsViewProps> = ({
  vendors,
  currentRole,
  onOpenRegisterVendor,
  onRefreshVendors,
}) => {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [activeVendorDocModal, setActiveVendorDocModal] = useState<Vendor | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const filtered = vendors.filter((v) => {
    if (selectedStatus !== 'All' && v.status !== selectedStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        v.name.toLowerCase().includes(q) ||
        (v.capabilities && v.capabilities.some((c) => c.toLowerCase().includes(q))) ||
        (v.pan && v.pan.toLowerCase().includes(q)) ||
        (v.gstin && v.gstin.toLowerCase().includes(q)) ||
        (v.cin && v.cin.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleUpdateStatus = async (vendorId: string, status: VendorStatus, reason?: string) => {
    setActionError(null);
    try {
      await fetchApi(`/api/vendors/${vendorId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, rejectionReason: reason }),
      });
      onRefreshVendors();
      if (activeVendorDocModal) {
        setActiveVendorDocModal((prev) =>
          prev ? { ...prev, status, rejectionReason: reason } : null
        );
      }
      setShowRejectBox(false);
      setRejectionReason('');
    } catch (e: any) {
      setActionError(`Error updating vendor status: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-blue-700 font-semibold tracking-wider uppercase">
            VENDOR EMPANELMENT &amp; REGISTRATION DIRECTORY
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            NMDC Technology Vendor &amp; Partner Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Empanelled heavy engineering, mining technology, automation, instrumentation and industrial equipment manufacturers verified for NMDC operations.
          </p>
        </div>

        <button
          onClick={onOpenRegisterVendor}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Vendor</span>
        </button>
      </div>

      {actionError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendor name, PAN, GSTIN, capability..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Approved">Approved</option>
            <option value="Under Verification">Under Verification</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Vendors Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 text-xs space-y-2">
          <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-700 text-sm">No records available.</p>
          <p className="text-slate-400 text-xs">
            Industrial vendors can register online. Account activation is processed by the portal administrator.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v) => (
            <div
              key={v.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">{v.name}</h3>
                      {v.isDemo && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-mono text-[9px] font-bold">
                          DEMO
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {v.legalEntity} · Est. {v.yearEstablished}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                    v.status === 'Active' || v.status === 'Approved'
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : v.status === 'Rejected' || v.status === 'Suspended'
                      ? 'text-rose-700 bg-rose-50 border-rose-200'
                      : 'text-amber-700 bg-amber-50 border-amber-200'
                  }`}>
                    {v.status}
                  </span>
                </div>

                {/* Statutory Meta */}
                <div className="p-2.5 bg-slate-50 rounded-lg text-[11px] font-mono text-slate-600 space-y-0.5">
                  <div>PAN: <strong className="text-slate-800">{v.pan || 'N/A'}</strong></div>
                  <div>
                    GSTIN:{' '}
                    {v.gstExempt ? (
                      <strong className="text-blue-700 font-sans">GST Exempt ({v.gstExemptionReason || 'Exempt'})</strong>
                    ) : (
                      <strong className="text-slate-800">{v.gstin || 'N/A'}</strong>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-1 font-sans text-[10px]">
                    {v.msmeStatus && <span className="bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-semibold">MSME</span>}
                    {v.startupStatus && <span className="bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-semibold">DPIIT Startup</span>}
                    <span>Mining Exp: <strong>{v.miningExperienceYears} yrs</strong></span>
                  </div>
                </div>

                {/* Capabilities */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Areas of Expertise</span>
                  <div className="flex flex-wrap gap-1">
                    {v.capabilities && v.capabilities.map((c) => (
                      <span key={c} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-blue-700" />
                  <span className="font-mono font-bold text-slate-800">{v.performanceScore || 0}/100</span>
                  <span className="text-slate-400 text-[10px]">Score</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRejectBox(false);
                      setRejectionReason('');
                      setActiveVendorDocModal(v);
                    }}
                    className="px-2.5 py-1 text-slate-700 hover:text-blue-700 font-semibold text-xs"
                  >
                    Inspect ({v.documents?.length || 0} Docs)
                  </button>

                  {currentRole === 'admin' && v.status !== 'Active' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(v.id, 'Active')}
                      className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-semibold text-xs transition-colors"
                    >
                      Activate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vendor Document & Lifecycle Inspection Modal */}
      {activeVendorDocModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-150 text-xs space-y-4">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Vendor Verification &amp; Documents: {activeVendorDocModal.name}
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Lifecycle: Pending → Under Verification → Approved / Rejected → Active / Suspended
                </p>
              </div>
              <button onClick={() => setActiveVendorDocModal(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeVendorDocModal.rejectionReason && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px]">
                <strong>Rejection Remarks:</strong> {activeVendorDocModal.rejectionReason}
              </div>
            )}

            <div className="space-y-2.5 max-h-[40vh] overflow-y-auto">
              {activeVendorDocModal.documents && activeVendorDocModal.documents.length > 0 ? (
                activeVendorDocModal.documents.map((doc) => (
                  <div key={doc.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800 block text-xs">{doc.title}</span>
                      <span className="text-[11px] text-slate-500">{doc.fileName} · {doc.fileSize}</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {doc.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 italic py-2">No documents attached.</p>
              )}
            </div>

            {currentRole === 'admin' && showRejectBox && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-2">
                <label className="font-bold text-rose-900 block">Mandatory Rejection Reason *</label>
                <textarea
                  rows={2}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter statutory verification discrepancy or missing certificate reason..."
                  className="w-full p-2 bg-white border border-rose-300 rounded text-xs text-slate-900"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRejectBox(false)}
                    className="px-3 py-1 bg-white border border-slate-300 rounded text-slate-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!rejectionReason.trim()}
                    onClick={() => handleUpdateStatus(activeVendorDocModal.id, 'Rejected', rejectionReason.trim())}
                    className="px-3 py-1 bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white rounded font-bold"
                  >
                    Confirm Reject
                  </button>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => setActiveVendorDocModal(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>

              {currentRole === 'admin' && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => handleUpdateStatus(activeVendorDocModal.id, 'Under Verification')}
                    className="px-2.5 py-1.5 text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg"
                  >
                    Mark Under Verification
                  </button>
                  <button
                    onClick={() => setShowRejectBox(true)}
                    className="px-2.5 py-1.5 text-xs font-semibold bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(activeVendorDocModal.id, 'Suspended')}
                    className="px-2.5 py-1.5 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg"
                  >
                    Suspend
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(activeVendorDocModal.id, 'Active')}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                  >
                    Approve &amp; Activate
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

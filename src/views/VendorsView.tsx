import React, { useState } from 'react';
import { Vendor, UserRole } from '../types/index.js';
import { 
  Building2, 
  Search, 
  CheckCircle2, 
  Clock, 
  FileCheck2, 
  ShieldCheck, 
  Award, 
  ExternalLink,
  Plus
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

  const filtered = vendors.filter((v) => {
    if (selectedStatus !== 'All' && v.status !== selectedStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        v.name.toLowerCase().includes(q) ||
        v.capabilities.some((c) => c.toLowerCase().includes(q)) ||
        v.cin.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleUpdateStatus = async (vendorId: string, status: Vendor['status']) => {
    try {
      await fetchApi(`/api/vendors/${vendorId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      onRefreshVendors();
      if (activeVendorDocModal) {
        setActiveVendorDocModal((prev) => (prev ? { ...prev, status } : null));
      }
    } catch (e: any) {
      alert(`Error updating vendor status: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-blue-700 font-semibold tracking-wider uppercase">
            REGISTERED TECHNOLOGY PARTNERS
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            NMDC Technology Vendor & Partner Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Empanelled AI, IoT, robotics, and industrial technology companies verified for mining implementation.
          </p>
        </div>

        <button
          onClick={onOpenRegisterVendor}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Vendor</span>
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendor name, capability, CIN..."
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
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((v) => (
          <div
            key={v.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">{v.name}</h3>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {v.legalEntity} · Est. {v.yearEstablished}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  v.status === 'Active' || v.status === 'Approved'
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : 'text-amber-700 bg-amber-50 border-amber-200'
                }`}>
                  {v.status}
                </span>
              </div>

              {/* Statutory Meta */}
              <div className="p-2.5 bg-slate-50 rounded-lg text-[11px] font-mono text-slate-600 space-y-0.5">
                <div>CIN: <strong className="text-slate-800">{v.cin}</strong></div>
                <div>GSTIN: <strong className="text-slate-800">{v.gstin}</strong></div>
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
                  {v.capabilities.map((c) => (
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
                <span className="font-mono font-bold text-slate-800">{v.performanceScore}/100</span>
                <span className="text-slate-400 text-[10px]">Score</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveVendorDocModal(v)}
                  className="px-2.5 py-1 text-slate-700 hover:text-blue-700 font-semibold text-xs"
                >
                  Documents ({v.documents?.length || 0})
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

      {/* Vendor Document Inspection Modal */}
      {activeVendorDocModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-150 text-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-1">
              Statutory Documents: {activeVendorDocModal.name}
            </h3>
            <p className="text-slate-500 mb-4 text-xs">Review corporate registration, GST, PAN, and credentials.</p>

            <div className="space-y-2.5 max-h-[50vh] overflow-y-auto">
              {activeVendorDocModal.documents.map((doc) => (
                <div key={doc.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800 block text-xs">{doc.title}</span>
                    <span className="text-[11px] text-slate-500">{doc.fileName} · {doc.fileSize}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setActiveVendorDocModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
              {currentRole === 'admin' && (
                <button
                  onClick={() => {
                    handleUpdateStatus(activeVendorDocModal.id, 'Active');
                    setActiveVendorDocModal(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm"
                >
                  Verify & Approve Vendor
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

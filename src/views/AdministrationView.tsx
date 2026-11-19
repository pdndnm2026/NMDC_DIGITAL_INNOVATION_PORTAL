import React, { useState, useEffect } from 'react';
import {
  User,
  UserRole,
  Vendor,
  MineComplex,
  MineComplexCode,
  DEFAULT_ORGANISATIONAL_UNITS,
} from '../types/index.js';
import { fetchApi } from '../utils/api.js';
import {
  ShieldCheck,
  UserCheck,
  Building2,
  Database,
  Trash2,
  Download,
  FileSpreadsheet,
  Activity,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface AdministrationViewProps {
  currentRole: UserRole;
  organisationalUnits?: MineComplex[];
  hasDemoData: boolean;
  onLoadDemoData: () => Promise<void>;
  onClearDemoData: () => Promise<void>;
  onNavigateTab: (tab: string) => void;
  onRefreshData: () => void;
}

export const AdministrationView: React.FC<AdministrationViewProps> = ({
  currentRole,
  organisationalUnits = DEFAULT_ORGANISATIONAL_UNITS,
  hasDemoData,
  onLoadDemoData,
  onClearDemoData,
  onNavigateTab,
  onRefreshData,
}) => {
  const [subTab, setSubTab] = useState<'queue' | 'users' | 'units' | 'demo'>('queue');
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [pendingVendors, setPendingVendors] = useState<Vendor[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [assignedRoles, setAssignedRoles] = useState<Record<string, UserRole>>({});
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [rejectReasonModal, setRejectReasonModal] = useState<{ type: 'user' | 'vendor'; id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadAdminQueues();
  }, []);

  const loadAdminQueues = async () => {
    try {
      const [pRes, uRes] = await Promise.all([
        fetchApi<{ success: boolean; users: User[]; vendors: Vendor[] }>('/api/admin/pending-users'),
        fetchApi<{ success: boolean; data: User[] }>('/api/admin/users'),
      ]);
      if (pRes.success) {
        setPendingUsers(pRes.users || []);
        setPendingVendors(pRes.vendors || []);
      }
      if (uRes.success) {
        setAllUsers(uRes.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveUser = async (u: User) => {
    setBusy(true);
    setErrorMsg(null);
    try {
      const roleToAssign = assignedRoles[u.id] || u.role;
      const res = await fetchApi<{ success: boolean; message?: string }>(`/api/admin/users/${u.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ assignedRole: roleToAssign }),
      });
      setStatusMsg(res.message || `Activated account for ${u.name}.`);
      await loadAdminQueues();
      onRefreshData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Activation failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleVendorLifecycle = async (vendorId: string, status: Vendor['status'], reason?: string) => {
    setBusy(true);
    setErrorMsg(null);
    try {
      await fetchApi(`/api/vendors/${vendorId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, rejectionReason: reason }),
      });
      setStatusMsg(`Vendor status updated to ${status}.`);
      await loadAdminQueues();
      onRefreshData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update vendor status.');
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, role: UserRole, unitCode?: MineComplexCode | 'ALL') => {
    try {
      await fetchApi(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role, mineComplexCode: unitCode }),
      });
      setStatusMsg('User role updated.');
      await loadAdminQueues();
    } catch (err: any) {
      setErrorMsg(err.message || 'Role update failed.');
    }
  };

  if (currentRole !== 'admin') {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-2">
        <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
        <h2 className="text-base font-bold text-slate-800">Portal Administrator Access Required</h2>
        <p className="text-xs text-slate-500">Only authorized NMDC Portal Administrators can access verification queues and system governance settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-14">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[11px] font-mono text-amber-300 uppercase tracking-wider">
            PORTAL GOVERNANCE & VERIFICATION CONSOLE
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Portal Administration & System Configuration
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl">
            Verify newly registered employees and vendors, manage user roles across all 5 units, and control isolated demonstration data.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigateTab('employee_master')}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Employee Master</span>
          </button>
          <button
            onClick={() => onNavigateTab('activity')}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>
          <button
            onClick={() => onNavigateTab('sheets')}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Google Sheets Sync</span>
          </button>
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setSubTab('queue')}
          className={`px-3.5 py-2 rounded-lg whitespace-nowrap ${subTab === 'queue' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Verification Queue ({pendingUsers.length + pendingVendors.length})
        </button>
        <button
          onClick={() => setSubTab('users')}
          className={`px-3.5 py-2 rounded-lg whitespace-nowrap ${subTab === 'users' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Registered Users & Roles ({allUsers.length})
        </button>
        <button
          onClick={() => setSubTab('units')}
          className={`px-3.5 py-2 rounded-lg whitespace-nowrap ${subTab === 'units' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Organisational Units ({organisationalUnits.length})
        </button>
        <button
          onClick={() => setSubTab('demo')}
          className={`px-3.5 py-2 rounded-lg whitespace-nowrap ${subTab === 'demo' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Demo Showcase Controls
        </button>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex justify-between">
          <span className="font-semibold">{statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="font-bold">Dismiss</button>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex justify-between">
          <span className="font-semibold">{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="font-bold">Dismiss</button>
        </div>
      )}

      {/* SUBTAB 1: VERIFICATION QUEUE */}
      {subTab === 'queue' && (
        <div className="space-y-5">
          {/* Pending Employees */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800 uppercase tracking-wider">
              Pending Employee Accounts ({pendingUsers.filter((u) => u.role !== 'vendor').length})
            </div>
            {pendingUsers.filter((u) => u.role !== 'vendor').length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No pending employee verification requests.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 text-[11px]">
                    <tr>
                      <th className="p-3">Employee</th>
                      <th className="p-3">SAP ID</th>
                      <th className="p-3">Dept & Unit</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Assign Role</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingUsers.filter((u) => u.role !== 'vendor').map((u) => (
                      <tr key={u.id}>
                        <td className="p-3 font-bold text-slate-900">
                          {u.name}
                          {u.verifiedFromEmployeeMaster && (
                            <span className="ml-2 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                              SAP Master Verified
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono">{u.employeeId}</td>
                        <td className="p-3 text-slate-600">{u.department} · {u.mineComplexCode}</td>
                        <td className="p-3 font-mono text-[11px]">{u.email}</td>
                        <td className="p-3">
                          <select
                            value={assignedRoles[u.id] || u.role}
                            onChange={(e) => setAssignedRoles({ ...assignedRoles, [u.id]: e.target.value as UserRole })}
                            className="border border-slate-300 rounded px-2 py-1 text-xs bg-white"
                          >
                            <option value="executive">NMDC Executive</option>
                            <option value="dept_head">Department Head</option>
                            <option value="approving_authority">Approving Authority</option>
                            <option value="tech_evaluator">Technical Evaluator</option>
                            <option value="comm_evaluator">Commercial Evaluator</option>
                            <option value="poc_committee">PoC Committee Member</option>
                            <option value="project_manager">Project Manager</option>
                          </select>
                        </td>
                        <td className="p-3 text-right space-x-2 whitespace-nowrap">
                          <button
                            disabled={busy}
                            onClick={() => handleApproveUser(u)}
                            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold"
                          >
                            Approve & Activate
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => setRejectReasonModal({ type: 'user', id: u.id, name: u.name })}
                            className="px-3 py-1 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded font-semibold"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pending Vendors */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800 uppercase tracking-wider">
              Pending Vendor Registrations ({pendingVendors.length})
            </div>
            {pendingVendors.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No pending vendor verification requests.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingVendors.map((v) => (
                  <div key={v.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm text-slate-900">{v.name}</strong>
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                          {v.status}
                        </span>
                      </div>
                      <div className="font-mono text-[11px] text-slate-600">
                        PAN: {v.pan} · GSTIN: {v.gstExempt ? 'EXEMPT' : v.gstin} · Email: {v.email}
                      </div>
                      <div className="text-slate-500">
                        Documents: {v.documents.map((d) => `${d.type} (${d.fileName})`).join(' | ')}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {v.status === 'Pending' && (
                        <button
                          disabled={busy}
                          onClick={() => handleVendorLifecycle(v.id, 'Under Verification')}
                          className="px-3 py-1.5 border border-blue-300 bg-blue-50 text-blue-800 font-semibold rounded-lg"
                        >
                          Mark Under Verification
                        </button>
                      )}
                      <button
                        disabled={busy}
                        onClick={() => handleVendorLifecycle(v.id, 'Active')}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg"
                      >
                        Approve & Activate
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => setRejectReasonModal({ type: 'vendor', id: v.id, name: v.name })}
                        className="px-3 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold rounded-lg"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: ALL USERS */}
      {subTab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">SAP / Vendor ID</th>
                  <th className="p-3">Unit Access</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allUsers.map((u) => (
                  <tr key={u.id}>
                    <td className="p-3 font-semibold text-slate-900">{u.name}</td>
                    <td className="p-3 font-mono text-[11px]">{u.email}</td>
                    <td className="p-3 font-mono text-[11px]">{u.employeeId || u.vendorId || '—'}</td>
                    <td className="p-3 font-mono">{u.mineComplexCode || 'ALL'}</td>
                    <td className="p-3">
                      {u.role === 'vendor' ? (
                        <span className="font-mono text-slate-700">vendor</span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => handleUpdateUserRole(u.id, e.target.value as UserRole, u.mineComplexCode)}
                          className="border border-slate-200 rounded px-2 py-1 text-xs bg-white"
                        >
                          <option value="executive">executive</option>
                          <option value="dept_head">dept_head</option>
                          <option value="approving_authority">approving_authority</option>
                          <option value="tech_evaluator">tech_evaluator</option>
                          <option value="comm_evaluator">comm_evaluator</option>
                          <option value="poc_committee">poc_committee</option>
                          <option value="project_manager">project_manager</option>
                          <option value="admin">admin</option>
                        </select>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.status === 'Active' ? 'bg-emerald-50 text-emerald-800' :
                        u.status === 'Pending' ? 'bg-amber-50 text-amber-800' : 'bg-rose-50 text-rose-800'
                      }`}>
                        {u.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: ORGANISATIONAL UNITS */}
      {subTab === 'units' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
              <tr>
                <th className="p-3">Unit Code</th>
                <th className="p-3">Organisational Unit Name</th>
                <th className="p-3">Type</th>
                <th className="p-3">Location & State</th>
                <th className="p-3">PS ID Prefix</th>
                <th className="p-3">BOR ID Prefix</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {organisationalUnits.map((u) => (
                <tr key={u.id}>
                  <td className="p-3 font-mono font-bold text-blue-700">{u.code}</td>
                  <td className="p-3 font-semibold text-slate-900">{u.name}</td>
                  <td className="p-3 text-slate-600">{u.unitType}</td>
                  <td className="p-3 text-slate-600">{u.location}, {u.state}</td>
                  <td className="p-3 font-mono text-[11px]">{u.prefix}0001</td>
                  <td className="p-3 font-mono text-[11px]">{u.borPrefix}0001</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold text-[10px]">
                      {u.activeStatus ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SUBTAB 4: DEMO SHOWCASE CONTROLS */}
      {subTab === 'demo' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 text-xs">
          <div className="flex items-start gap-3">
            <Database className="w-6 h-6 text-blue-700 shrink-0" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Isolated Demo Dataset Governance</h3>
              <p className="text-slate-600 max-w-3xl leading-relaxed">
                The showcase dataset contains 5 isolated demonstration records covering DIOM, KIOM, Bacheli, Kirandul & Head Office across the full workflow (Problem Statement → BOR → Offers → Discussions → PoC → Award → Project Monitoring). Every demonstration item is flagged <code className="font-mono bg-slate-100 px-1">isDemo: true</code>, badged <strong>[DEMO]</strong>, and strictly excluded from Live operational statistics and Live MIS reports by default.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              disabled={hasDemoData}
              onClick={onLoadDemoData}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-500 text-white rounded-lg font-bold flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>{hasDemoData ? 'Demo Showcase Currently Loaded' : 'Load 5-Unit Demo Dataset'}</span>
            </button>

            <button
              disabled={!hasDemoData}
              onClick={onClearDemoData}
              className="px-4 py-2 bg-rose-700 hover:bg-rose-800 disabled:bg-slate-200 disabled:text-slate-500 text-white rounded-lg font-bold flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete All Demo Data Permanently</span>
            </button>
          </div>
        </div>
      )}

      {/* REJECT REASON MODAL */}
      {rejectReasonModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-rose-900">Reject Registration: {rejectReasonModal.name}</h3>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Rejection Remarks</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejecting verification..."
                className="w-full border border-slate-300 rounded-lg p-2"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setRejectReasonModal(null)} className="px-3 py-1.5 border border-slate-300 rounded-lg">Cancel</button>
              <button
                onClick={async () => {
                  if (rejectReasonModal.type === 'vendor') {
                    await handleVendorLifecycle(rejectReasonModal.id, 'Rejected', rejectReason || 'Rejected by Administrator');
                  } else {
                    await fetchApi(`/api/admin/users/${rejectReasonModal.id}/reject`, {
                      method: 'POST',
                      body: JSON.stringify({ reason: rejectReason }),
                    });
                    await loadAdminQueues();
                    onRefreshData();
                  }
                  setRejectReasonModal(null);
                  setRejectReason('');
                }}
                className="px-4 py-1.5 bg-rose-700 text-white font-bold rounded-lg"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

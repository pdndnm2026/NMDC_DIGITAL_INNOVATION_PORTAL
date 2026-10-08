import React, { useState, useEffect } from 'react';
import { ActivityLog, AuditLog, UserRole } from '../types/index.js';
import { 
  Activity, 
  ShieldCheck, 
  Radio, 
  Clock, 
  User, 
  Building, 
  Award, 
  FileText, 
  CheckCircle2, 
  RefreshCw,
  Search
} from 'lucide-react';
import { fetchApi } from '../utils/api.js';

interface ActivityMonitorViewProps {
  initialActivities: ActivityLog[];
  currentRole: UserRole;
}

export const ActivityMonitorView: React.FC<ActivityMonitorViewProps> = ({
  initialActivities,
  currentRole,
}) => {
  const [activities, setActivities] = useState<ActivityLog[]>(initialActivities);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'stream' | 'audit'>('stream');
  const [searchAudit, setSearchAudit] = useState('');
  const [liveConnected, setLiveConnected] = useState(true);

  // Set up live SSE listener
  useEffect(() => {
    let evtSource: EventSource | null = null;
    try {
      evtSource = new EventSource('/api/realtime/stream');
      evtSource.addEventListener('activity', (event) => {
        try {
          const newAct = JSON.parse(event.data);
          setActivities((prev) => [newAct, ...prev.slice(0, 49)]);
        } catch {
          // ignore
        }
      });
      evtSource.onopen = () => setLiveConnected(true);
      evtSource.onerror = () => setLiveConnected(false);
    } catch {
      setLiveConnected(false);
    }

    // Load audits
    loadAudits();

    return () => {
      if (evtSource) evtSource.close();
    };
  }, []);

  const loadAudits = async () => {
    try {
      const res = await fetchApi('/api/audit-logs');
      if (res.success && res.data) {
        setAuditLogs(res.data);
      }
    } catch {
      // ignore
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('LOGIN')) return 'text-slate-600 bg-slate-100 border-slate-200';
    if (action.includes('PROPOSAL')) return 'text-blue-700 bg-blue-50 border-blue-200';
    if (action.includes('EVALUATION') || action.includes('APPROVED')) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (action.includes('MILESTONE')) return 'text-purple-700 bg-purple-50 border-purple-200';
    return 'text-amber-700 bg-amber-50 border-amber-200';
  };

  const filteredAudits = auditLogs.filter((a) => {
    if (!searchAudit.trim()) return true;
    const q = searchAudit.toLowerCase();
    return (
      a.action.toLowerCase().includes(q) ||
      a.entityType.toLowerCase().includes(q) ||
      a.userId.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-blue-700 font-semibold tracking-wider uppercase">
            AUDIT TRAIL & SYSTEM TELEMETRY
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Real-Time Portal Activity Monitor
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time SSE event pipeline recording all authentication events, proposal submissions, evaluations, and milestone progressions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${liveConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span className="font-semibold text-slate-700">{liveConnected ? 'SSE Live Stream Active' : 'Disconnected'}</span>
          </div>

          <button
            onClick={() => {
              loadAudits();
            }}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"
            title="Refresh logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('stream')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'stream'
              ? 'bg-blue-700 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Real-Time Stream Feed ({activities.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'bg-blue-700 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Immutable Audit Logs ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: Live Stream Feed */}
      {activeTab === 'stream' && (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs text-xs">
          {activities.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              No recent activity recorded.
            </div>
          ) : (
            activities.map((act) => (
              <div
                key={act.id}
                className="p-4 hover:bg-slate-50/80 transition-colors flex items-start justify-between gap-4"
              >
                <div className="space-y-1 max-w-3xl">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getActionColor(act.action)}`}>
                      {act.action}
                    </span>
                    <span className="font-semibold text-slate-800">{act.user}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-[11px] text-slate-500 font-medium">{act.role}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-[11px] font-mono text-slate-500">[{act.entity}]</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed text-xs">
                    {act.details}
                  </p>
                </div>

                <div className="text-right text-[11px] font-mono tabular-nums text-slate-400 shrink-0">
                  {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: Immutable Audit Logs Table */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="relative max-w-sm text-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchAudit}
              onChange={(e) => setSearchAudit(e.target.value)}
              placeholder="Search audit actions, user ID, entity..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User ID</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Entity Type</th>
                  <th className="p-3">Result</th>
                  <th className="p-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {filteredAudits.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70">
                    <td className="p-3 text-slate-500 tabular-nums">
                      {new Date(a.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 text-slate-900 font-bold">
                      {a.userId}
                    </td>
                    <td className="p-3 text-blue-700 font-semibold">
                      {a.action}
                    </td>
                    <td className="p-3 text-slate-600">
                      {a.entityType} ({a.entityId})
                    </td>
                    <td className="p-3">
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                        {a.result}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">
                      {a.ipAddress}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

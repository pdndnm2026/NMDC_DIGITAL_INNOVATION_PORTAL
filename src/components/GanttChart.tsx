import React, { useState } from 'react';
import { ProjectMilestone, HealthStatus } from '../types/index.js';
import { CheckCircle2, Clock, AlertTriangle, AlertCircle, Edit2 } from 'lucide-react';

interface GanttChartProps {
  milestones: ProjectMilestone[];
  onUpdateMilestone?: (milestoneId: string, progressPct: number, status: HealthStatus) => void;
  canEdit?: boolean;
}

export const GanttChart: React.FC<GanttChartProps> = ({ milestones, onUpdateMilestone, canEdit }) => {
  const [selectedMilestone, setSelectedMilestone] = useState<ProjectMilestone | null>(null);
  const [editProgress, setEditProgress] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<HealthStatus>('On Track');

  if (!milestones || milestones.length === 0) {
    return <div className="p-8 text-center text-slate-400 text-sm">No milestones defined for this project.</div>;
  }

  // Calculate timeline min/max dates
  const dates = milestones.flatMap((m) => [
    new Date(m.plannedStartDate).getTime(),
    new Date(m.plannedEndDate).getTime(),
    m.actualEndDate ? new Date(m.actualEndDate).getTime() : new Date().getTime(),
  ]);

  const minTime = Math.min(...dates);
  const maxTime = Math.max(...dates);
  const totalDuration = maxTime - minTime || 1;

  const getStatusColor = (status: HealthStatus) => {
    switch (status) {
      case 'Completed':
        return {
          bar: 'bg-blue-600',
          badge: 'text-blue-700 bg-blue-50 border-blue-200',
          dot: 'bg-blue-600',
        };
      case 'On Track':
        return {
          bar: 'bg-emerald-600',
          badge: 'text-emerald-700 bg-emerald-50 border-emerald-200',
          dot: 'bg-emerald-600',
        };
      case 'At Risk':
        return {
          bar: 'bg-amber-500',
          badge: 'text-amber-700 bg-amber-50 border-amber-200',
          dot: 'bg-amber-500',
        };
      case 'Delayed':
        return {
          bar: 'bg-rose-600',
          badge: 'text-rose-700 bg-rose-50 border-rose-200',
          dot: 'bg-rose-600',
        };
    }
  };

  const openEdit = (m: ProjectMilestone) => {
    if (!canEdit) return;
    setSelectedMilestone(m);
    setEditProgress(m.progressPct);
    setEditStatus(m.status);
  };

  const handleSave = () => {
    if (selectedMilestone && onUpdateMilestone) {
      onUpdateMilestone(selectedMilestone.id, editProgress, editStatus);
      setSelectedMilestone(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Legend & Header */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="font-semibold text-slate-800">
          Project Milestone Gantt Schedule
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> On Track
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> At Risk
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600" /> Delayed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Completed
          </span>
        </div>
      </div>

      {/* Chart Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[760px] p-4 space-y-4">
          {milestones.map((m, idx) => {
            const start = new Date(m.plannedStartDate).getTime();
            const end = new Date(m.plannedEndDate).getTime();
            const leftPct = Math.max(0, Math.min(100, ((start - minTime) / totalDuration) * 100));
            const widthPct = Math.max(5, Math.min(100 - leftPct, ((end - start) / totalDuration) * 100));
            const style = getStatusColor(m.status);

            return (
              <div key={m.id} className="group relative">
                {/* Milestone Info Row */}
                <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                  <div className="flex items-center gap-2 truncate max-w-[400px]">
                    <span className="font-mono text-[11px] text-slate-400 font-medium">
                      0{idx + 1}.
                    </span>
                    <span className="font-medium text-slate-900 truncate" title={m.title}>
                      {m.title}
                    </span>
                    <span className="text-[10px] text-slate-500 hidden sm:inline">
                      ({m.stage})
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] font-mono tabular-nums text-slate-500">
                      {m.plannedStartDate} → {m.plannedEndDate}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${style.badge}`}>
                      {m.progressPct}% {m.status}
                    </span>
                    {canEdit && (
                      <button
                        onClick={() => openEdit(m)}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                        title="Update progress"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Timeline Bar Track */}
                <div className="h-6 bg-slate-100 rounded-md relative overflow-hidden flex items-center">
                  {/* Planned Window */}
                  <div
                    className="absolute top-0 bottom-0 rounded-md bg-slate-200/80 border border-slate-300/50"
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  />

                  {/* Actual Progress Fill */}
                  <div
                    className={`absolute top-1 bottom-1 rounded transition-all duration-300 ${style.bar} shadow-xs`}
                    style={{
                      left: `${leftPct}%`,
                      width: `${(widthPct * m.progressPct) / 100}%`,
                    }}
                  />

                  <div
                    className="absolute text-[10px] font-bold text-white px-2 pointer-events-none drop-shadow-xs"
                    style={{ left: `${leftPct + 1}%` }}
                  >
                    {m.progressPct > 15 ? `${m.progressPct}%` : ''}
                  </div>
                </div>

                {/* Responsible Person & Deliverable meta */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span className="truncate max-w-[320px]">
                    Lead: <strong className="font-medium text-slate-700">{m.responsiblePerson}</strong>
                  </span>
                  <span className="truncate max-w-[360px] text-right text-slate-400">
                    Deliverable: {m.deliverables}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Milestone Progress Modal */}
      {selectedMilestone && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Update Milestone Progress
            </h3>
            <p className="text-xs text-slate-500 mb-4">{selectedMilestone.title}</p>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="font-medium text-slate-700">Progress: {editProgress}%</label>
                  <span className="font-mono text-slate-500 tabular-nums">{editProgress} / 100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editProgress}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setEditProgress(val);
                    if (val === 100) setEditStatus('Completed');
                    else if (val > 0 && editStatus === 'Completed') setEditStatus('On Track');
                  }}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1.5">Health Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['On Track', 'At Risk', 'Delayed', 'Completed'] as HealthStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEditStatus(st)}
                      className={`py-2 px-3 rounded-lg border text-left text-xs font-medium transition-colors ${
                        editStatus === st
                          ? 'border-blue-600 bg-blue-50 text-blue-800'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedMilestone(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm"
              >
                Save Progress
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

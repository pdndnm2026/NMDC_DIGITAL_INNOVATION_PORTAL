import React, { useState } from 'react';
import { Project, ProjectMilestone, HealthStatus, UserRole, User } from '../types/index.js';
import { GanttChart } from '../components/GanttChart.js';
import { 
  Briefcase, 
  Layers, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  ShieldAlert, 
  Target, 
  Calendar, 
  Building, 
  FileText,
  Plus
} from 'lucide-react';
import { fetchApi } from '../utils/api.js';

interface ProjectsViewProps {
  projects: Project[];
  currentRole: UserRole;
  currentUser: User | null;
  onRefreshProjects: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  currentRole,
  currentUser,
  onRefreshProjects,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'gantt' | 'risks' | 'kpis' | 'benefits'>('gantt');

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const handleUpdateMilestone = async (mId: string, progressPct: number, status: HealthStatus) => {
    if (!activeProject) return;
    try {
      await fetchApi(`/api/projects/${activeProject.id}/milestones/${mId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          progressPct,
          status,
          actualEndDate: progressPct === 100 ? new Date().toISOString().split('T')[0] : undefined,
        }),
      });
      onRefreshProjects();
    } catch (e: any) {
      alert(`Error updating milestone: ${e.message}`);
    }
  };

  const getHealthBadge = (health: HealthStatus) => {
    switch (health) {
      case 'On Track':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'At Risk':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Delayed':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'Completed':
        return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-blue-700 font-semibold tracking-wider uppercase">
            PROJECT EXECUTION & LIFECYCLE MANAGEMENT
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Active Innovation & Implementation Projects
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track milestones, interactive Gantt charts, operational KPIs, risk matrices, and audited benefit realization.
          </p>
        </div>
      </div>

      {/* Projects Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
        {projects.map((proj) => {
          const isSelected = proj.id === selectedProjectId;
          return (
            <button
              key={proj.id}
              onClick={() => setSelectedProjectId(proj.id)}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between space-y-2 ${
                isSelected
                  ? 'bg-blue-50/70 border-blue-600 ring-2 ring-blue-600/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-mono font-bold text-slate-700 text-[10px]">{proj.projectCode}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getHealthBadge(proj.health)}`}>
                    {proj.health}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 line-clamp-2 leading-snug">
                  {proj.name}
                </h4>
                <div className="text-[11px] text-slate-500 mt-1 truncate">
                  Vendor: <strong className="text-slate-700">{proj.vendorName}</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="text-slate-500">Stage: <strong className="text-slate-700">{proj.currentStage}</strong></span>
                  <span className="font-mono font-bold text-blue-700">{proj.progressPct}%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${proj.progressPct}%` }} />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {activeProject && (
        <div className="space-y-6">
          {/* Active Project Banner */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                  <span className="font-mono font-bold text-blue-700">{activeProject.projectCode}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeProject.nmdcComplex}</span>
                  <span aria-hidden="true">·</span>
                  <span>Department: {activeProject.nmdcDepartment}</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  {activeProject.name}
                </h2>
                <div className="text-xs text-slate-600 mt-1 flex items-center gap-4">
                  <span>Vendor: <strong className="text-slate-900">{activeProject.vendorName}</strong></span>
                  <span>Project Manager: <strong className="text-slate-900">{activeProject.projectManager}</strong></span>
                </div>
              </div>

              {/* Financial Snapshot */}
              <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs shrink-0">
                <div>
                  <span className="text-slate-400 block text-[10px]">Sanctioned Budget</span>
                  <strong className="font-mono font-bold text-slate-900 text-sm">
                    ₹ {activeProject.approvedBudgetCr} Cr
                  </strong>
                </div>
                <div className="border-l border-slate-200 pl-3">
                  <span className="text-slate-400 block text-[10px]">Actual Expenditure</span>
                  <strong className="font-mono font-bold text-blue-700 text-sm">
                    ₹ {activeProject.actualExpenditureCr} Cr
                  </strong>
                </div>
                <div className="border-l border-slate-200 pl-3">
                  <span className="text-slate-400 block text-[10px]">Completion Target</span>
                  <strong className="font-mono font-bold text-slate-800 text-sm">
                    {activeProject.targetCompletionDate}
                  </strong>
                </div>
              </div>
            </div>

            {/* Navigation Tabs inside Project */}
            <div className="flex items-center gap-2 border-t border-slate-100 pt-3 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('gantt')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'gantt'
                    ? 'bg-blue-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Gantt Schedule & Milestones ({activeProject.milestones?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('kpis')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'kpis'
                    ? 'bg-blue-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>Operational KPIs ({activeProject.kpis?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('risks')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'risks'
                    ? 'bg-blue-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Risk Log ({activeProject.risks?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('benefits')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'benefits'
                    ? 'bg-blue-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Realised Benefits ({activeProject.benefits?.length || 0})</span>
              </button>
            </div>
          </div>

          {/* TAB 1: Gantt Chart */}
          {activeTab === 'gantt' && (
            <GanttChart
              milestones={activeProject.milestones || []}
              onUpdateMilestone={handleUpdateMilestone}
              canEdit={currentRole === 'admin' || currentRole === 'project_manager' || currentRole === 'vendor'}
            />
          )}

          {/* TAB 2: Operational KPIs */}
          {activeTab === 'kpis' && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Key Performance Indicators</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {activeProject.kpis.map((kpi) => (
                  <div key={kpi.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-800">{kpi.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        kpi.status === 'Target Met' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {kpi.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-center font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Baseline</span>
                        <strong className="text-slate-700 text-xs">{kpi.baseline}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Current</span>
                        <strong className="text-blue-700 text-xs font-bold">{kpi.current}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Target</span>
                        <strong className="text-emerald-700 text-xs font-bold">{kpi.target}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Risk Register */}
          {activeTab === 'risks' && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Project Risk Register & Mitigations</h3>
              <div className="space-y-3 text-xs">
                {activeProject.risks.map((risk) => (
                  <div key={risk.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{risk.category} Risk</span>
                        <span aria-hidden="true">·</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          risk.severity === 'High' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {risk.severity} Severity
                        </span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{risk.description}</p>
                      <p className="text-[11px] text-slate-500">
                        <strong className="text-slate-700">Mitigation:</strong> {risk.mitigationPlan}
                      </p>
                    </div>

                    <span className="px-2.5 py-1 bg-white border border-slate-300 rounded font-semibold text-slate-700 self-start md:self-auto shrink-0">
                      Status: {risk.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Benefits Realised */}
          {activeTab === 'benefits' && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Quantified Benefits Realisation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {activeProject.benefits.map((b) => (
                  <div key={b.id} className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2">
                    <span className="font-bold text-emerald-950 block">{b.category} Benefit</span>
                    <p className="text-emerald-900 leading-relaxed text-xs">{b.description}</p>
                    <div className="flex justify-between items-center pt-2 border-t border-emerald-200/60 font-mono text-xs">
                      <span className="text-emerald-800">Projected: <strong>₹ {b.projectedAnnualCr} Cr/yr</strong></span>
                      <span className="text-emerald-950 font-bold">Realised: <strong>₹ {b.realisedAnnualCr} Cr/yr</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

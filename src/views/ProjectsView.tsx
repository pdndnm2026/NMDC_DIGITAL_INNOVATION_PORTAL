import React, { useState } from 'react';
import { Project, ProjectMilestone, HealthStatus, UserRole, User, ProjectStage, MineComplexCode, AUTHORIZED_MINE_COMPLEXES } from '../types/index.js';
import { GanttChart } from '../components/GanttChart.js';
import { 
  Briefcase, 
  Layers, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  IndianRupee, 
  Building2, 
  FileText, 
  ShieldCheck,
  Award,
  Calendar,
  Check,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  MapPin
} from 'lucide-react';
import { fetchApi } from '../utils/api.js';

interface ProjectsViewProps {
  projects: Project[];
  currentRole: UserRole;
  currentUser: User | null;
  activeComplexCode?: MineComplexCode | 'ALL';
  onRefreshProjects: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  currentRole,
  currentUser,
  activeComplexCode = 'ALL',
  onRefreshProjects,
}) => {
  const [selectedComplexFilter, setSelectedComplexFilter] = useState<string>(activeComplexCode);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'gantt' | 'stages' | 'sla' | 'award'>('gantt');

  const filteredProjects = projects.filter((p) => {
    if (selectedComplexFilter !== 'ALL' && p.mineComplexCode && p.mineComplexCode !== selectedComplexFilter) {
      return false;
    }
    return true;
  });

  const activeProject = filteredProjects.find((p) => p.id === selectedProjectId) || filteredProjects[0];

  const standardStages: ProjectStage[] = [
    'Project Initiation',
    'Requirement Finalisation',
    'Engineering',
    'Manufacturing',
    'Inspection',
    'Dispatch',
    'Delivery',
    'Installation',
    'Commissioning',
    'Testing',
    'Acceptance',
    'Closure',
  ];

  const handleUpdateMilestone = async (mId: string, progressPct: number, status: HealthStatus) => {
    if (!activeProject) return;
    try {
      await fetchApi(`/api/projects/${activeProject.id}/milestones/${mId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          progressPct,
          status,
          actualFinishDate: progressPct === 100 ? new Date().toISOString().substring(0, 10) : undefined,
        }),
      });
      onRefreshProjects();
    } catch (e: any) {
      alert(`Error updating milestone: ${e.message}`);
    }
  };

  const activeComplexObj = AUTHORIZED_MINE_COMPLEXES.find(c => c.code === selectedComplexFilter);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-blue-700 font-bold uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              PROJECT EXECUTION & GANTT MONITORING · SECTIONS 17, 18 & 19
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500 font-medium text-xs">
              {selectedComplexFilter === 'ALL' ? 'All Complexes' : activeComplexObj?.name}: {filteredProjects.length} Projects
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Project Execution, Milestones & Contract Monitoring
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time physical and financial progress tracking, interactive Gantt charts, SLA compliance and vendor performance.
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
          const count = projects.filter(p => p.mineComplexCode === complex.code).length;
          return (
            <button
              key={complex.code}
              onClick={() => setSelectedComplexFilter(complex.code)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{complex.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Projects Selection Strip / Empty State */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 text-xs space-y-2">
          <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-700 text-sm">
            {projects.length === 0
              ? 'No projects have been registered.'
              : selectedComplexFilter !== 'ALL'
              ? 'No projects have been registered for this complex.'
              : 'No records available.'}
          </p>
          <p className="text-slate-400 text-xs">
            Projects are automatically initiated upon sanctioning of an Award of Work.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {filteredProjects.map((proj) => {
              const isSelected = activeProject?.id === proj.id;
              return (
                <button
                  key={proj.id}
                  onClick={() => setSelectedProjectId(proj.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-600 ring-2 ring-blue-600/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-mono text-[10px] font-bold text-blue-700 bg-white px-1.5 py-0.5 rounded border border-blue-200">
                        {proj.projectCode}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          proj.health === 'Completed'
                            ? 'bg-purple-100 text-purple-800'
                            : proj.health === 'On Track'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {proj.health}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 line-clamp-1">{proj.name}</h4>
                    <span className="text-[11px] text-slate-500 block truncate">{proj.vendorName}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Physical: <strong className="text-slate-800">{proj.physicalProgressPct}%</strong></span>
                    <span className="font-mono font-bold text-slate-700">₹ {proj.approvedValueCr} Cr</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Project Dashboard Container */}
          {activeProject && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              {/* Project Meta Banner */}
              <div className="p-5 sm:p-6 bg-slate-900 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {activeProject.projectCode}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-300 text-xs font-semibold">{activeProject.department} ({activeProject.projectComplex})</span>
                  </div>
                  <h2 className="text-base sm:text-xl font-bold tracking-tight text-white">
                    {activeProject.name}
                  </h2>
                  <p className="text-xs text-slate-300">
                    Contractor: <strong className="text-amber-300">{activeProject.vendorName}</strong> · Project Manager: {activeProject.projectManager}
                  </p>
                </div>

                <div className="flex items-center gap-4 bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-xs shrink-0">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Physical Progress</span>
                    <span className="text-base font-extrabold text-emerald-400 font-mono">{activeProject.physicalProgressPct}%</span>
                  </div>
                  <div className="border-l border-slate-700 pl-4">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Sanctioned Budget</span>
                    <span className="text-base font-extrabold text-white font-mono">₹ {activeProject.approvedValueCr} Cr</span>
                  </div>
                  <div className="border-l border-slate-700 pl-4">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Target Completion</span>
                    <span className="text-base font-extrabold text-amber-300 font-mono">{activeProject.targetCompletionDate}</span>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 bg-slate-50/70 text-xs overflow-x-auto">
                <button
                  onClick={() => setActiveTab('gantt')}
                  className={`px-3 py-2 font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'gantt'
                      ? 'border-blue-700 text-blue-700'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Interactive Gantt Chart & Milestones</span>
                </button>

                <button
                  onClick={() => setActiveTab('stages')}
                  className={`px-3 py-2 font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'stages'
                      ? 'border-blue-700 text-blue-700'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>12 Execution Stages Stepper</span>
                </button>

                <button
                  onClick={() => setActiveTab('sla')}
                  className={`px-3 py-2 font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'sla'
                      ? 'border-blue-700 text-blue-700'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>SLA, Warranty & Contract Monitoring</span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-5 sm:p-6 text-xs">
                {/* TAB 1: GANTT CHART & MILESTONE EDITOR */}
                {activeTab === 'gantt' && (
                  <div className="space-y-6">
                    {activeProject.milestones && activeProject.milestones.length > 0 ? (
                      <>
                        <GanttChart
                          milestones={activeProject.milestones}
                          canEdit={currentRole === 'project_manager' || currentRole === 'approving_authority' || currentRole === 'admin'}
                          onUpdateMilestone={handleUpdateMilestone}
                        />

                        {/* Milestone Detailed Table */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                          <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-100 text-slate-700 font-bold text-[11px]">
                              <tr>
                                <th className="py-2.5 px-3">Milestone Deliverable</th>
                                <th className="py-2.5 px-3">Stage</th>
                                <th className="py-2.5 px-3">Planned Dates</th>
                                <th className="py-2.5 px-3">Actual / Finish</th>
                                <th className="py-2.5 px-3 text-center">Delay</th>
                                <th className="py-2.5 px-3 text-center">Progress</th>
                                <th className="py-2.5 px-3">Status</th>
                                <th className="py-2.5 px-3">NMDC Officer</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                              {activeProject.milestones.map((m) => (
                                <tr key={m.id} className="hover:bg-slate-50">
                                  <td className="py-2.5 px-3">
                                    <strong className="block text-slate-900">{m.title}</strong>
                                    <span className="text-[10px] text-slate-500">{m.deliverables}</span>
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-600 font-medium">{m.stage}</td>
                                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                                    {m.plannedStartDate} → {m.plannedFinishDate}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                                    {m.actualFinishDate || 'Pending'}
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-mono">
                                    {m.delayDays > 0 ? (
                                      <span className="text-rose-600 font-bold">+{m.delayDays}d</span>
                                    ) : (
                                      <span className="text-emerald-700 font-bold">0d</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-bold font-mono">
                                    {m.progressPct}%
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        m.status === 'Completed'
                                          ? 'bg-purple-100 text-purple-800'
                                          : m.status === 'On Track'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}
                                    >
                                      {m.status}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-700">{m.responsibleOfficer}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : (
                      <p className="text-slate-400 italic py-4">No milestones registered yet for this project.</p>
                    )}
                  </div>
                )}

                {/* TAB 2: 12 EXECUTION STAGES STEPPER */}
                {activeTab === 'stages' && (
                  <div className="space-y-6">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="font-bold text-slate-900 block text-xs">
                        12 Standard Project Execution Stages (Mandated by Section 17):
                      </span>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Current Stage: <strong className="text-blue-700 font-bold">{activeProject.currentStage}</strong> (Stage {standardStages.indexOf(activeProject.currentStage) + 1} of 12)
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {standardStages.map((stageName, idx) => {
                        const currentStageIndex = standardStages.indexOf(activeProject.currentStage);
                        const isCompleted = idx < currentStageIndex || activeProject.currentStage === 'Closure';
                        const isCurrent = idx === currentStageIndex && activeProject.currentStage !== 'Closure';

                        return (
                          <div
                            key={stageName}
                            className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${
                              isCurrent
                                ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-2xs'
                                : isCompleted
                                ? 'bg-emerald-50/30 border-emerald-200 text-slate-800'
                                : 'bg-white border-slate-200 text-slate-400'
                            }`}
                          >
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                isCompleted
                                ? 'bg-emerald-600 text-white'
                                : isCurrent
                                ? 'bg-blue-700 text-white animate-pulse'
                                : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                            </div>

                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-900 block text-xs">{stageName}</span>
                              <span className="text-[11px] block">
                                {isCompleted
                                  ? 'Stage completed & verified'
                                  : isCurrent
                                  ? 'Active execution stage'
                                  : 'Pending previous stage closure'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 3: SLA, WARRANTY & CONTRACT MONITORING */}
                {activeTab === 'sla' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                        <span className="text-slate-500 text-[11px] block">Warranty Expiry Date</span>
                        <span className="font-mono font-bold text-slate-900 text-sm block">
                          {activeProject.warrantyExpiryDate || 'Pending Commissioning'}
                        </span>
                        <span className="text-emerald-700 text-[10px] font-semibold">Active Warranty Coverage</span>
                      </div>

                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                        <span className="text-slate-500 text-[11px] block">Annual Maintenance Contract (AMC)</span>
                        <span className="font-bold text-slate-900 text-sm block">
                          {activeProject.amcActive ? 'Active 3-Year Agreement' : 'Standby'}
                        </span>
                        <span className="text-slate-500 text-[10px]">Resident Engineer support</span>
                      </div>

                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                        <span className="text-slate-500 text-[11px] block">Vendor Performance Scorecard</span>
                        <span className="font-mono font-extrabold text-blue-700 text-sm block">
                          {activeProject.performanceScore || 0} / 100
                        </span>
                        <span className="text-emerald-700 text-[10px] font-semibold">Performance Rating</span>
                      </div>
                    </div>

                    {/* SLA Records Table */}
                    {activeProject.slaRecords && activeProject.slaRecords.length > 0 ? (
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead className="bg-slate-100 font-bold text-slate-700">
                            <tr>
                              <th className="py-2.5 px-3">Service Level Agreement (SLA) Name</th>
                              <th className="py-2.5 px-3 text-center">Target Response</th>
                              <th className="py-2.5 px-3 text-center">Actual Mean Response</th>
                              <th className="py-2.5 px-3 text-center">Compliance Rate</th>
                              <th className="py-2.5 px-3 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {activeProject.slaRecords.map((sla, i) => (
                              <tr key={i} className="hover:bg-slate-50">
                                <td className="py-2 px-3 font-semibold text-slate-800">{sla.slaName}</td>
                                <td className="py-2 px-3 text-center font-mono">{sla.targetResponseHours} Hours</td>
                                <td className="py-2 px-3 text-center font-mono font-bold text-blue-700">{sla.actualResponseHours} Hours</td>
                                <td className="py-2 px-3 text-center font-mono font-bold text-emerald-700">{sla.compliancePct}%</td>
                                <td className="py-2 px-3 text-center">
                                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold text-[10px]">
                                    {sla.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">No SLA records defined yet.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

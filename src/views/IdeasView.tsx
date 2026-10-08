import React, { useState } from 'react';
import { Idea, UserRole, User } from '../types/index.js';
import { 
  Lightbulb, 
  Plus, 
  Search, 
  Filter, 
  Sparkles, 
  MessageSquare, 
  CheckCircle2, 
  XCircle, 
  Building, 
  IndianRupee,
  ChevronDown,
  FileSpreadsheet
} from 'lucide-react';
import { fetchApi } from '../utils/api.js';

interface IdeasViewProps {
  ideas: Idea[];
  currentRole: UserRole;
  currentUser: User | null;
  onOpenSubmitIdea: () => void;
  onRefreshIdeas: () => void;
  onNavigateToSheets?: () => void;
}

export const IdeasView: React.FC<IdeasViewProps> = ({
  ideas,
  currentRole,
  currentUser,
  onOpenSubmitIdea,
  onRefreshIdeas,
  onNavigateToSheets,
}) => {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [commentingIdea, setCommentingIdea] = useState<Idea | null>(null);
  const [commentText, setCommentText] = useState('');
  const [selectedNewStatus, setSelectedNewStatus] = useState<Idea['status']>('Approved');

  const departments = [
    'All',
    'Mining & HEMM Engineering',
    'HEMM Workshop',
    'Mining Operations',
    'Environment & Forestry',
    'Ore Handling Plant',
    'Survey & Geology',
    'Safety & Occupational Health',
    'Pellet Plant Operations',
    'Civil & Public Health Engineering',
    'Traffic & Railway Logistics',
    'Slurry Pipeline Division',
  ];

  const filtered = ideas.filter((idea) => {
    if (selectedDept !== 'All' && idea.department !== selectedDept) return false;
    if (selectedStatus !== 'All' && idea.status !== selectedStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        idea.title.toLowerCase().includes(q) ||
        idea.ideaCode.toLowerCase().includes(q) ||
        idea.submitterName.toLowerCase().includes(q) ||
        idea.proposedInnovation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleUpdateStatus = async (ideaId: string, status: Idea['status'], comment?: string) => {
    try {
      await fetchApi(`/api/ideas/${ideaId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          comment,
          reviewerName: currentUser?.name || 'Technical Reviewer',
        }),
      });
      onRefreshIdeas();
      setCommentingIdea(null);
      setCommentText('');
    } catch (e: any) {
      alert(`Error updating status: ${e.message}`);
    }
  };

  const getStatusStyle = (status: Idea['status']) => {
    switch (status) {
      case 'Approved':
      case 'PoC Approved':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'Under Evaluation':
      case 'Screening':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'Rejected':
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
            ORGANISATIONAL INNOVATION PIPELINE
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            NMDC Executive & Employee Innovation Ideas
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Grassroots AI and digital transformation solutions submitted by engineers, mine managers, and operational staff.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onNavigateToSheets && (
            <button
              onClick={onNavigateToSheets}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
              title="Export or Sync Ideas with Google Sheets"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Google Sheets</span>
            </button>
          )}
          <button
            onClick={onOpenSubmitIdea}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Submit New Idea</span>
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, idea ID, submitter, keyword..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  Department: {d}
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
              <option value="All">All Statuses</option>
              <option value="Submitted">Submitted (Pending Screen)</option>
              <option value="Screening">Under Screening</option>
              <option value="Under Evaluation">Technical Evaluation</option>
              <option value="Approved">Approved</option>
              <option value="PoC Approved">PoC Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span>Showing <strong>{filtered.length}</strong> employee ideas</span>
          <span className="font-mono text-slate-700">
            Total Projected Savings: ₹ {filtered.reduce((acc, i) => acc + (parseFloat(i.estimatedAnnualSavings.replace(/[^0-9.]/g, '')) || 0), 0).toFixed(2)} Cr
          </span>
        </div>
      </div>

      {/* Ideas Cards List */}
      <div className="space-y-4">
        {filtered.map((idea) => (
          <div
            key={idea.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all space-y-4"
          >
            {/* Meta Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-blue-700">{idea.ideaCode}</span>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-slate-700">{idea.department}</span>
                <span aria-hidden="true">·</span>
                <span>{idea.projectComplex}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-slate-400">
                  {new Date(idea.submittedAt).toLocaleDateString()}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusStyle(idea.status)}`}>
                  {idea.status}
                </span>
              </div>
            </div>

            {/* Title & Submitter */}
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {idea.title}
              </h3>
              <div className="text-xs text-slate-500 mt-1">
                Submitted by <strong className="text-slate-800 font-semibold">{idea.submitterName}</strong> ({idea.designation}) · ID: <span className="font-mono">{idea.employeeId}</span>
              </div>
            </div>

            {/* Problem & Proposed Innovation Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Operational Problem</span>
                <p className="text-slate-700 leading-relaxed">{idea.problemStatement}</p>
                {idea.equipmentAffected && (
                  <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                    Equipment: <strong className="text-slate-700">{idea.equipmentAffected}</strong>
                  </div>
                )}
              </div>

              <div className="p-3 bg-blue-50/40 border border-blue-100 rounded-lg space-y-1">
                <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">Proposed Innovation</span>
                <p className="text-slate-800 leading-relaxed">{idea.proposedInnovation}</p>
                <div className="text-[11px] text-blue-900 pt-1 border-t border-blue-200/60 flex items-center justify-between">
                  <span>Tech: <strong>{idea.aiDigitalTechnology}</strong></span>
                  <span className="font-mono font-bold text-emerald-700">Savings: {idea.estimatedAnnualSavings}</span>
                </div>
              </div>
            </div>

            {/* AI Analysis Box (if available) */}
            {idea.aiAnalysis && (
              <div className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-lg space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Gemini AI Classification & Technical Sizing</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded">
                    Priority {idea.aiAnalysis.recommendedPriority}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600">
                  <div>Severity: <strong className="text-slate-800">{idea.aiAnalysis.problemSeverity}</strong></div>
                  <div>Business Value: <strong className="text-slate-800">{idea.aiAnalysis.potentialBusinessValue}</strong></div>
                  <div>Complexity: <strong className="text-slate-800">{idea.aiAnalysis.estimatedComplexity}</strong></div>
                  <div>Maturity: <strong className="text-slate-800">{idea.aiAnalysis.technologyMaturity}</strong></div>
                </div>

                <p className="text-[11px] text-slate-600 border-t border-slate-200/60 pt-1 leading-relaxed">
                  {idea.aiAnalysis.recommendationSummary}
                </p>
              </div>
            )}

            {/* Reviewer Comments (if any) */}
            {idea.reviewerComments && idea.reviewerComments.length > 0 && (
              <div className="p-2.5 bg-amber-50/60 border border-amber-200/60 rounded-lg text-xs space-y-1">
                <span className="text-[10px] font-bold text-amber-900 block">Reviewer Notes:</span>
                {idea.reviewerComments.map((c, idx) => (
                  <p key={idx} className="text-amber-800 text-[11px]">{c}</p>
                ))}
              </div>
            )}

            {/* Bottom Actions for Reviewer / Admin */}
            {(currentRole === 'reviewer' || currentRole === 'admin') && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Committee Action:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCommentingIdea(idea);
                      setSelectedNewStatus('Approved');
                    }}
                    className="px-3 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 rounded font-semibold text-xs transition-colors"
                  >
                    Approve for PoC
                  </button>
                  <button
                    onClick={() => {
                      setCommentingIdea(idea);
                      setSelectedNewStatus('Under Evaluation');
                    }}
                    className="px-3 py-1 bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-300 rounded font-semibold text-xs transition-colors"
                  >
                    Add Feedback
                  </button>
                  <button
                    onClick={() => {
                      setCommentingIdea(idea);
                      setSelectedNewStatus('Rejected');
                    }}
                    className="px-3 py-1 bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-300 rounded font-semibold text-xs transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Reviewer Action Modal */}
      {commentingIdea && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Reviewer Decision & Feedback
            </h3>
            <p className="text-xs text-slate-500 mb-4">{commentingIdea.ideaCode}: {commentingIdea.title}</p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Status</label>
                <select
                  value={selectedNewStatus}
                  onChange={(e: any) => setSelectedNewStatus(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-white text-slate-900"
                >
                  <option value="Under Evaluation">Under Evaluation</option>
                  <option value="Approved">Approved for PoC</option>
                  <option value="PoC Approved">PoC Sanctioned</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Reviewer Observations</label>
                <textarea
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Record justification, budget alignment notes, or questions for employee..."
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCommentingIdea(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(commentingIdea.id, selectedNewStatus, commentText)}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm"
              >
                Save Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

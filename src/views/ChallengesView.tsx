import React, { useState } from 'react';
import { ProblemStatement, UserRole, Vendor } from '../types/index.js';
import { 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  IndianRupee, 
  Building, 
  FileText, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';

interface ChallengesViewProps {
  problemStatements: ProblemStatement[];
  currentRole: UserRole;
  currentVendor: Vendor | null;
  onOpenProposalWizard: (ps: ProblemStatement) => void;
  onOpenCompareMatrix: (ps: ProblemStatement) => void;
  onOpenCreateChallenge: () => void;
}

export const ChallengesView: React.FC<ChallengesViewProps> = ({
  problemStatements,
  currentRole,
  currentVendor,
  onOpenProposalWizard,
  onOpenCompareMatrix,
  onOpenCreateChallenge,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [activeDetailPs, setActiveDetailPs] = useState<ProblemStatement | null>(null);

  const categories = [
    'All',
    'Predictive Maintenance',
    'Fleet Management',
    'Safety',
    'Maintenance Optimisation',
    'Digital Twin',
    'Drone Technology',
    'Computer Vision',
    'Energy Management',
  ];

  const departments = [
    'All',
    'Mining & HEMM Engineering',
    'Mine Planning & Production Operations',
    'Mine Safety & Environment',
    'HEMM Workshop & Maintenance',
    'Ore Processing & Beneficiation Plant (SP-1 & SP-2)',
    'Environment & Pipeline Infrastructure',
    'Quality Control & Ore Beneficiation',
    'Electrical & Power Distribution',
  ];

  const filtered = problemStatements.filter((ps) => {
    if (selectedCategory !== 'All' && ps.category !== selectedCategory) return false;
    if (selectedDept !== 'All' && ps.department !== selectedDept) return false;
    if (selectedStatus !== 'All' && ps.status !== selectedStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        ps.title.toLowerCase().includes(q) ||
        ps.code.toLowerCase().includes(q) ||
        ps.problemDescription.toLowerCase().includes(q) ||
        ps.department.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-blue-700 font-semibold tracking-wider uppercase">
            OPEN INNOVATION OPPORTUNITIES
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            NMDC Innovation Challenges & Problem Statements
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Published technology challenges across NMDC production complexes open for technical proposals and budgetary offers.
          </p>
        </div>

        {currentRole === 'admin' && (
          <button
            onClick={onOpenCreateChallenge}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Publish New Challenge</span>
          </button>
        )}
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search challenges, keywords, equipment..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  Category: {c}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
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

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open for Proposals</option>
              <option value="Under Evaluation">Under Evaluation</option>
              <option value="PoC Awarded">PoC Sanctioned</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Count result */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span>Showing <strong>{filtered.length}</strong> problem statements</span>
          <span className="font-mono">Total Budget Indication: ₹ {filtered.reduce((a, b) => a + b.budgetNumeric, 0).toFixed(1)} Cr</span>
        </div>
      </div>

      {/* Challenge Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((ps) => (
          <div
            key={ps.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              {/* Card Meta Kicker (No Pill Badges!) */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-700 text-sm">{ps.code}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-slate-700">{ps.category}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span>Deadline: <strong>{ps.submissionDeadline}</strong></span>
                  <span aria-hidden="true">·</span>
                  <span className={ps.status === 'Open' ? 'text-emerald-700 font-semibold' : 'text-slate-600'}>
                    {ps.status}
                  </span>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {ps.title}
              </h3>

              {/* Department & Complex */}
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-medium">{ps.department}</span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-500">{ps.projectComplex}</span>
              </div>

              {/* Description preview */}
              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                {ps.problemDescription}
              </p>

              {/* Key impacts */}
              {ps.equipmentAffected && (
                <div className="p-2.5 bg-slate-50 rounded-lg text-[11px] text-slate-600 space-y-1">
                  <div>
                    <strong className="text-slate-700">Equipment Affected:</strong> {ps.equipmentAffected}
                  </div>
                  {ps.costImpact && (
                    <div>
                      <strong className="text-slate-700">Cost Impact:</strong> {ps.costImpact}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Budgetary Indication</span>
                <strong className="font-mono text-slate-900 font-bold text-sm">
                  {ps.budgetaryIndication}
                </strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveDetailPs(ps)}
                  className="px-3 py-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                >
                  View Details
                </button>

                {/* Compare Matrix for Committee/Admin */}
                {(currentRole === 'reviewer' || currentRole === 'admin') && ps.respondedVendorsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => onOpenCompareMatrix(ps)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold transition-colors"
                  >
                    Compare Offers ({ps.respondedVendorsCount})
                  </button>
                )}

                {/* Vendor Offer Submission */}
                {(currentRole === 'vendor' || currentRole === 'public') && (
                  <button
                    type="button"
                    onClick={() => onOpenProposalWizard(ps)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold shadow-xs transition-colors"
                  >
                    <span>Submit Solution</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Problem Statement Detail Drawer */}
      {activeDetailPs && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-4 bg-white text-slate-900 flex items-center justify-between border-b border-slate-200">
              <div>
                <span className="text-[10px] font-mono text-blue-700 font-bold tracking-wider">
                  PROBLEM STATEMENT SPECIFICATION
                </span>
                <h3 className="font-bold text-sm text-slate-900 leading-snug">
                  {activeDetailPs.code}: {activeDetailPs.title}
                </h3>
              </div>
              <button onClick={() => setActiveDetailPs(null)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 text-xs space-y-6">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[10px]">Department</span>
                  <strong className="text-slate-800 font-semibold">{activeDetailPs.department}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Project Complex</span>
                  <strong className="text-slate-800 font-semibold">{activeDetailPs.projectComplex}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Submission Deadline</span>
                  <strong className="text-slate-800 font-mono">{activeDetailPs.submissionDeadline}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Indicative Budget</span>
                  <strong className="text-slate-900 font-mono text-sm">{activeDetailPs.budgetaryIndication}</strong>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs">Detailed Problem Description</h4>
                <p className="text-slate-700 leading-relaxed bg-white border border-slate-100 p-3 rounded-lg shadow-2xs">
                  {activeDetailPs.problemDescription}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                  <h5 className="font-bold text-slate-800">Existing Situation & Process</h5>
                  <p className="text-slate-600 leading-relaxed">{activeDetailPs.currentProcess}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                  <h5 className="font-bold text-slate-800">Current Bottlenecks & Difficulties</h5>
                  <p className="text-slate-600 leading-relaxed">{activeDetailPs.currentDifficulties}</p>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-1.5">
                <h5 className="font-bold text-blue-950">Expected Technical Outcome & KPIs</h5>
                <p className="text-blue-900 leading-relaxed">{activeDetailPs.expectedOutcome}</p>
              </div>

              {activeDetailPs.aiSuggestedKeywords && (
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-700 text-[11px]">Recommended AI & Technology Focus:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeDetailPs.aiSuggestedKeywords.map((kw) => (
                      <span key={kw} className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs text-slate-500">
                <strong>{activeDetailPs.respondedVendorsCount}</strong> responses logged
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveDetailPs(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg"
                >
                  Close
                </button>
                {(currentRole === 'vendor' || currentRole === 'public') && (
                  <button
                    onClick={() => {
                      const ps = activeDetailPs;
                      setActiveDetailPs(null);
                      onOpenProposalWizard(ps);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm"
                  >
                    Submit Technical Proposal
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  KnowledgeRepositoryItem, 
  ImplementedSolution, 
  UserRole, 
  User 
} from '../types/index.js';
import { 
  BookOpen, 
  Search, 
  Filter, 
  FileText, 
  Download, 
  Building, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  IndianRupee, 
  Share2, 
  Sparkles,
  Layers,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { fetchApi } from '../utils/api.js';

interface KnowledgeRepositoryViewProps {
  currentRole: UserRole;
  currentUser: User | null;
  onNavigateToSubmitIdea?: () => void;
}

export const KnowledgeRepositoryView: React.FC<KnowledgeRepositoryViewProps> = ({
  currentRole,
  currentUser,
  onNavigateToSubmitIdea,
}) => {
  const [activeTab, setActiveTab] = useState<'knowledge' | 'implemented'>('knowledge');
  
  // Knowledge base state
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeRepositoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [knowledgeSearch, setKnowledgeSearch] = useState('');
  
  // Already Implemented Search state
  const [implementedSolutions, setImplementedSolutions] = useState<ImplementedSolution[]>([]);
  const [implementedQuery, setImplementedQuery] = useState('AI predictive maintenance for excavators');
  const [implementedComplex, setImplementedComplex] = useState('All');
  const [searchingImplemented, setSearchingImplemented] = useState(false);

  // Selected item modal
  const [selectedItem, setSelectedItem] = useState<KnowledgeRepositoryItem | null>(null);
  const [scaleModalSolution, setScaleModalSolution] = useState<ImplementedSolution | null>(null);

  useEffect(() => {
    loadKnowledgeBase();
    loadImplementedSolutions();
  }, [selectedCategory, selectedType]);

  const loadKnowledgeBase = async () => {
    try {
      const res = await fetchApi<{ success: boolean; data: KnowledgeRepositoryItem[] }>(
        `/api/knowledge-base?category=${selectedCategory}&type=${selectedType}&search=${knowledgeSearch}`
      );
      if (res.success && res.data) {
        setKnowledgeItems(res.data);
      }
    } catch (e) {
      console.error('Failed to load knowledge base:', e);
    }
  };

  const loadImplementedSolutions = async (q?: string) => {
    setSearchingImplemented(true);
    try {
      const queryParam = q !== undefined ? q : implementedQuery;
      const res = await fetchApi<{ success: boolean; data: ImplementedSolution[] }>(
        `/api/already-implemented?query=${encodeURIComponent(queryParam)}&complex=${implementedComplex}`
      );
      if (res.success && res.data) {
        setImplementedSolutions(res.data);
      }
    } catch (e) {
      console.error('Failed to load implemented solutions:', e);
    } finally {
      setSearchingImplemented(false);
    }
  };

  const categories = [
    'All',
    'AI',
    'Mining',
    'HEMM',
    'Safety',
    'Maintenance',
    'Environment',
    'Energy',
    'Procurement',
    'Automation',
    'Digitalisation',
  ];

  const types = [
    'All',
    'Completed Project',
    'PoC Report',
    'Technical SOP',
    'Case Study',
    'Vendor Solution Whitepaper',
    'Lessons Learned',
  ];

  const complexes = [
    'All',
    'Bailadila Deposit 5',
    'Bailadila Deposit 14',
    'Donimalai Complex',
    'Kumaraswamy Iron Ore Mine',
    'Vizag Pellet Plant',
  ];

  const handleRequestScale = (sol: ImplementedSolution) => {
    setScaleModalSolution(sol);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-blue-700 font-semibold tracking-wider uppercase">
            INSTITUTIONAL MEMORY & LESSONS LEARNED
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            NMDC Innovation Knowledge Repository
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Preserving engineering reports, technical SOPs, PoC case studies, and proven mine deployments across transfers and promotions.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'knowledge'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Knowledge Base (10 Categories)
          </button>
          <button
            onClick={() => setActiveTab('implemented')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'implemented'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>"Already Implemented in NMDC"</span>
          </button>
        </div>
      </div>

      {/* TAB 1: KNOWLEDGE REPOSITORY */}
      {activeTab === 'knowledge' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={knowledgeSearch}
                  onChange={(e) => {
                    setKnowledgeSearch(e.target.value);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && loadKnowledgeBase()}
                  placeholder="Search technical reports, equipment, SOPs, learnings..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

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

              <div>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  {types.map((t) => (
                    <option key={t} value={t}>
                      Document Type: {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
              <span>Archived Knowledge Items: <strong>{knowledgeItems.length}</strong></span>
              <span className="text-slate-400">DGMS & ISO-compliant Knowledge Preservation</span>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {knowledgeItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                      {item.category}
                    </span>
                    <span className="text-slate-500 font-medium text-[11px]">{item.type}</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {item.title}
                  </h3>

                  {/* Complex and Equipment */}
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span>{item.complex}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-slate-700">{item.equipment}</span>
                  </div>

                  {/* Summary */}
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {item.summary}
                  </p>

                  {/* Key Learnings preview */}
                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      KEY LESSON LEARNED
                    </span>
                    <p className="text-[11px] text-slate-700 italic">
                      "{item.keyLearnings[0]}"
                    </p>
                  </div>
                </div>

                {/* Footer and Author */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="text-[11px] text-slate-400">
                    <span>By {item.author} ({item.year})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold transition-colors flex items-center gap-1"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-blue-700" />
                    <span>Read Report</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: "ALREADY IMPLEMENTED IN NMDC" SEARCH */}
      {activeTab === 'implemented' && (
        <div className="space-y-6">
          {/* Prominent Search Banner */}
          <div className="bg-gradient-to-br from-blue-50/90 via-indigo-50/70 to-white rounded-2xl p-6 sm:p-8 text-slate-900 shadow-sm border border-blue-200/80 space-y-4">
            <div>
              <span className="text-[10px] font-mono font-bold text-blue-700 uppercase tracking-widest block mb-1">
                PRE-SUBMISSION VERIFICATION ENGINE
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Check What Has Already Been Implemented in NMDC
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mt-1">
                Before spending time designing a new idea or pilot, search our live registry of solutions already commissioned at Donimalai, Kirandul, Bacheli, or Panna. Avoid duplicate effort and scale proven technologies across mines!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={implementedQuery}
                  onChange={(e) => setImplementedQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadImplementedSolutions(implementedQuery)}
                  placeholder="Enter problem or tech (e.g. AI predictive maintenance for excavators)..."
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm"
                />
              </div>

              <select
                value={implementedComplex}
                onChange={(e) => {
                  setImplementedComplex(e.target.value);
                  setTimeout(() => loadImplementedSolutions(), 50);
                }}
                className="bg-white border border-slate-300 text-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm focus:outline-none"
              >
                {complexes.map((c) => (
                  <option key={c} value={c}>
                    Mine: {c}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => loadImplementedSolutions(implementedQuery)}
                className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-sm transition-colors text-xs sm:text-sm shrink-0 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Search Implemented Projects</span>
              </button>
            </div>

            {/* Quick Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600">
              <span className="text-[11px] text-slate-500 font-medium">Try searching:</span>
              {[
                'AI predictive maintenance for excavators',
                'Slurry pipeline scaling radar',
                'Autonomous dumper fleet dispatch',
                'Crusher boulder AI detection',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    setImplementedQuery(chip);
                    loadImplementedSolutions(chip);
                  }}
                  className="bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-md text-[11px] transition-colors"
                >
                  "{chip}"
                </button>
              ))}
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Found <strong>{implementedSolutions.length}</strong> matching implemented solutions</span>
              <span>Proven Mine Benchmark Data</span>
            </div>

            <div className="space-y-4">
              {implementedSolutions.map((sol) => (
                <div
                  key={sol.id}
                  className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:border-blue-500 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Implemented & Live ({sol.commissionYear})
                        </span>
                        <span className="text-xs text-slate-500">
                          Site: <strong>{sol.implementedComplex}</strong>
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 leading-snug">
                        {sol.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1">
                        <strong>Problem Addressed:</strong> {sol.problemAddressed}
                      </p>
                    </div>

                    <div className="text-right sm:shrink-0">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">ANNUAL VALUE REALISED</span>
                      <strong className="text-emerald-700 font-mono text-lg font-bold">
                        {sol.annualBenefits}
                      </strong>
                    </div>
                  </div>

                  {/* 4 Details Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Technology Stack:</span>
                      <strong className="text-slate-800">{sol.technology}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Vendor / Partner:</span>
                      <strong className="text-slate-800">{sol.vendor}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Capex Cost:</span>
                      <strong className="text-slate-800 font-mono">{sol.cost}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Project Owner / Contact:</span>
                      <strong className="text-slate-800">{sol.contactPerson}</strong>
                    </div>
                  </div>

                  {/* Results and Benefits */}
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg text-xs text-emerald-950 space-y-1">
                    <strong className="block font-bold">Operational Results Achieved:</strong>
                    <p className="text-emerald-900 leading-relaxed">{sol.results}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500">Scale-out Status:</span>
                      <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                        {sol.scalingReadiness}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRequestScale(sol)}
                        className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Request to Scale to My Mine</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 text-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="font-mono text-xs text-blue-700 font-bold block">
                  {selectedItem.category} · {selectedItem.type}
                </span>
                <h3 className="font-bold text-slate-900 text-base leading-snug">
                  {selectedItem.title}
                </h3>
              </div>
              <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-700">
                <ChevronRight className="w-5 h-5 rotate-90" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 block">Complex</span>
                  <strong className="text-slate-900">{selectedItem.complex}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Equipment</span>
                  <strong className="text-slate-900">{selectedItem.equipment}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Author</span>
                  <strong className="text-slate-900">{selectedItem.author}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Year</span>
                  <strong className="text-slate-900">{selectedItem.year}</strong>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-xs mb-1">Executive Summary</h4>
                <p className="text-slate-700 leading-relaxed bg-white border border-slate-200 p-3 rounded-lg">
                  {selectedItem.summary}
                </p>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1">
                <h4 className="font-bold text-emerald-950 text-xs">Documented Results & Benefits</h4>
                <p className="text-emerald-900 leading-relaxed">{selectedItem.resultsAndBenefits}</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-xs mb-1.5">Key Learnings & Operational Recommendations</h4>
                <ul className="space-y-1.5 text-slate-700">
                  {selectedItem.keyLearnings.map((l, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>{l}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between text-[11px] text-slate-500">
                <span>Contact Officer: <strong>{selectedItem.contactOfficer}</strong></span>
                <span className="font-mono">{selectedItem.documentFileName} ({selectedItem.documentSize})</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => alert(`Downloading official document: ${selectedItem.documentFileName}`)}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Report ({selectedItem.documentSize})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Scale Modal */}
      {scaleModalSolution && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 text-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">Request Solution Scaling</h3>
              <button onClick={() => setScaleModalSolution(null)} className="text-slate-400 hover:text-slate-700">
                <ChevronRight className="w-5 h-5 rotate-90" />
              </button>
            </div>

            <p className="text-slate-600">
              You are requesting to initiate the transfer and rollout of <strong>"{scaleModalSolution.title}"</strong> (currently active at <em>{scaleModalSolution.implementedComplex}</em>) to your mine complex.
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <div><strong>Technology:</strong> {scaleModalSolution.technology}</div>
              <div><strong>Vendor Partner:</strong> {scaleModalSolution.vendor}</div>
              <div><strong>Focal Officer:</strong> {scaleModalSolution.contactPerson}</div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Target Complex / Mine</label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900">
                <option>Bailadila Deposit 5 (Kirandul)</option>
                <option>Bailadila Deposit 14/11C (Bacheli)</option>
                <option>Kumaraswamy Mine (Karnataka)</option>
                <option>Pellet Plant (Visakhapatnam)</option>
              </select>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setScaleModalSolution(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(`Scaling request dispatched to ${scaleModalSolution.contactPerson} and Corporate IT.`);
                  setScaleModalSolution(null);
                }}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold"
              >
                Send Transfer Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

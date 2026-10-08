import React, { useState, useEffect } from 'react';
import { 
  VendorMarketplaceSolution, 
  Vendor, 
  UserRole, 
  User, 
  VendorRatingParameterScores 
} from '../types/index.js';
import { 
  Building2, 
  Search, 
  Filter, 
  Cpu, 
  CheckCircle2, 
  Award, 
  Video, 
  FileText, 
  Star, 
  ShieldCheck, 
  Clock, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Sliders,
  Send
} from 'lucide-react';
import { fetchApi } from '../utils/api.js';

interface VendorMarketplaceViewProps {
  currentRole: UserRole;
  currentUser: User | null;
  onRefreshVendors?: () => void;
}

export const VendorMarketplaceView: React.FC<VendorMarketplaceViewProps> = ({
  currentRole,
  currentUser,
}) => {
  const [solutions, setSolutions] = useState<VendorMarketplaceSolution[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedEquipment, setSelectedEquipment] = useState('All');
  const [activeSolutionModal, setActiveSolutionModal] = useState<VendorMarketplaceSolution | null>(null);

  // Rating Modal state
  const [ratingVendorModal, setRatingVendorModal] = useState<Vendor | null>(null);
  const [ratingScores, setRatingScores] = useState<Record<string, number>>({
    technicalPerformance: 90,
    delivery: 88,
    support: 92,
    responseTime: 94,
    uptime: 95,
    documentation: 85,
    training: 88,
    cybersecurity: 95,
    costPerformance: 86,
    slaCompliance: 92,
  });
  const [ratingRemarks, setRatingRemarks] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedEquipment]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [solRes, vRes] = await Promise.all([
        fetchApi<{ success: boolean; data: VendorMarketplaceSolution[] }>(
          `/api/vendor-marketplace?category=${selectedCategory}&equipment=${selectedEquipment}`
        ),
        fetchApi<{ success: boolean; data: Vendor[] }>('/api/vendors'),
      ]);

      if (solRes.success && solRes.data) setSolutions(solRes.data);
      if (vRes.success && vRes.data) setVendors(vRes.data);
    } catch (e) {
      console.error('Marketplace load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'All',
    'Predictive Maintenance & Condition Monitoring',
    'Fleet Optimization & Autonomous Haulage',
    'Computer Vision & Video Analytics',
    'IoT & Environmental Monitoring',
    'Robotics & Drone Survey',
  ];

  const equipments = [
    'All',
    'BH100S Dumpers',
    'Komatsu PC3000 Excavators',
    'Gyratory Crushers',
    'Overland Conveyor',
    'Beneficiation Plant',
  ];

  const filteredSolutions = solutions.filter((sol) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        sol.title.toLowerCase().includes(q) ||
        sol.shortSummary.toLowerCase().includes(q) ||
        sol.vendorName.toLowerCase().includes(q) ||
        sol.targetMiningEquipment.some((eq) => eq.toLowerCase().includes(q)) ||
        sol.technologyStack.some((tech) => tech.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const ratingParameters = [
    { key: 'technicalPerformance', label: '1. Technical Performance & Model Accuracy', max: 100 },
    { key: 'delivery', label: '2. Delivery & Milestone Timeliness', max: 100 },
    { key: 'support', label: '3. Field & Engineering Support', max: 100 },
    { key: 'responseTime', label: '4. Critical Response Time on Mine Site', max: 100 },
    { key: 'uptime', label: '5. Hardware & Edge Compute Uptime', max: 100 },
    { key: 'documentation', label: '6. Engineering Documentation & SOPs', max: 100 },
    { key: 'training', label: '7. Training of NMDC Mining Staff', max: 100 },
    { key: 'cybersecurity', label: '8. Cybersecurity & OT Security Protocol', max: 100 },
    { key: 'costPerformance', label: '9. Budget Adherence & Cost Performance', max: 100 },
    { key: 'slaCompliance', label: '10. Overall SLA & Contract Compliance', max: 100 },
  ];

  const calculateOverallScore = () => {
    const vals = Object.values(ratingScores);
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  };

  const handleSubmitRating = async () => {
    if (!ratingVendorModal) return;
    setSubmittingRating(true);
    try {
      const overall = calculateOverallScore();
      const payload = {
        ...ratingScores,
        overallScore: overall,
        evaluatedBy: currentUser?.name ? `${currentUser.name} (${currentUser.designation || 'NMDC'})` : 'NMDC Evaluation Panel',
        evaluatedAt: new Date().toISOString().split('T')[0],
        remarks: ratingRemarks || 'Verified field performance across NMDC production cycle.',
      };

      await fetchApi(`/api/vendors/${ratingVendorModal.id}/rate`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      alert(`Vendor rated successfully! New Performance Score: ${overall}/100.`);
      setRatingVendorModal(null);
      loadData();
    } catch (e: any) {
      alert(`Rating error: ${e.message}`);
    } finally {
      setSubmittingRating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-blue-700 font-semibold tracking-wider uppercase">
            OPEN ECOSYSTEM SHOWCASE
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Vendor Solution Marketplace & Ratings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Browse commercialized AI products, mining equipment solutions, case studies, and 10-parameter vendor performance records across NMDC.
          </p>
        </div>

        {/* Quick Search Tip */}
        <div className="hidden lg:flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Search: <em>"Show vendors with predictive maintenance for mining equipment"</em></span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search solutions, AI models, equipment (e.g. dumpers)..."
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
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              {equipments.map((eq) => (
                <option key={eq} value={eq}>
                  Equipment: {eq}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span>Displaying <strong>{filteredSolutions.length}</strong> technology products</span>
          <span>Empanelled Tech Partners: <strong>{vendors.length}</strong></span>
        </div>
      </div>

      {/* Solution Marketplace Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSolutions.map((sol) => {
          const vendorObj = vendors.find((v) => v.id === sol.vendorId || v.name === sol.vendorName);
          const score = vendorObj?.performanceScore || 90;

          return (
            <div
              key={sol.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Meta header */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-blue-700">{sol.vendorName}</span>
                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 rounded font-mono font-bold text-[11px]">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span>Rating: {score}/100</span>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {sol.title}
                  </h3>
                  <span className="text-[11px] text-slate-500 block mt-0.5">{sol.category}</span>
                </div>

                {/* Summary */}
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {sol.shortSummary}
                </p>

                {/* Target Mining Equipment */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    TARGET MINING EQUIPMENT
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {sol.targetMiningEquipment.map((eq) => (
                      <span key={eq} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tech Stack tags */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {sol.technologyStack.map((tech) => (
                    <span key={tech} className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded text-[10px] font-mono">
                      {tech}
                    </span>
                  ))}
                </div>

                {/* TRL Level badge */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Technology Readiness: <strong>TRL-{sol.trlLevel}</strong></span>
                  {sol.demoVideoAvailable && (
                    <span className="flex items-center gap-1 text-emerald-700 font-medium">
                      <Video className="w-3 h-3" />
                      <span>Demo Video</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSolutionModal(sol)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Product Specs</span>
                </button>

                {(currentRole === 'reviewer' || currentRole === 'admin' || currentRole === 'executive' || currentRole === 'project_manager') && vendorObj && (
                  <button
                    type="button"
                    onClick={() => {
                      setRatingVendorModal(vendorObj);
                      setRatingRemarks('');
                    }}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Star className="w-3.5 h-3.5" />
                    <span>Rate Vendor (10 Params)</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Solution Detail Modal */}
      {activeSolutionModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 text-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="font-mono text-xs text-blue-700 font-bold block">
                  {activeSolutionModal.vendorName} · PRODUCT SPECIFICATION
                </span>
                <h3 className="font-bold text-slate-900 text-base leading-snug">
                  {activeSolutionModal.title}
                </h3>
              </div>
              <button onClick={() => setActiveSolutionModal(null)} className="text-slate-400 hover:text-slate-700">
                <ChevronRight className="w-5 h-5 rotate-90" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 text-xs mb-1">Architecture & Operational Overview</h4>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {activeSolutionModal.fullDescription}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-xs mb-1.5">Documented Operational Benefits</h4>
                <ul className="space-y-1.5 text-slate-700">
                  {activeSolutionModal.keyBenefits.map((b, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <span className="font-bold text-slate-800 block">Past Deployments & References</span>
                  <ul className="space-y-1 text-slate-600 text-[11px]">
                    {activeSolutionModal.pastInstallations.map((inst, i) => (
                      <li key={i}>• {inst}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <span className="font-bold text-slate-800 block">Certifications & Standards</span>
                  <ul className="space-y-1 text-slate-600 text-[11px]">
                    {activeSolutionModal.certifications.map((c, i) => (
                      <li key={i}>• {c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveSolutionModal(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg"
              >
                Close Specification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10-Parameter Vendor Rating Modal */}
      {ratingVendorModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 text-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="font-mono text-xs text-amber-700 font-bold block uppercase tracking-wider">
                  NMDC POST-PROJECT VENDOR RATING SYSTEM
                </span>
                <h3 className="font-bold text-slate-900 text-base leading-snug">
                  Rate Vendor: {ratingVendorModal.name}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">COMPOSITE SCORE</span>
                <strong className="text-lg font-mono font-bold text-amber-600">
                  {calculateOverallScore()}/100
                </strong>
              </div>
            </div>

            <p className="text-slate-500 text-xs">
              Score the vendor across the 10 standard NMDC performance dimensions based on site trial or project execution:
            </p>

            <div className="max-h-[50vh] overflow-y-auto space-y-3.5 pr-2">
              {ratingParameters.map((param) => {
                const currentVal = ratingScores[param.key] || 90;
                return (
                  <div key={param.key} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                      <span>{param.label}</span>
                      <span className="font-mono text-blue-700 font-bold">{currentVal}/100</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      step="1"
                      value={currentVal}
                      onChange={(e) =>
                        setRatingScores({
                          ...ratingScores,
                          [param.key]: parseInt(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>
                );
              })}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Technical Remarks & Field Performance Notes
                </label>
                <textarea
                  rows={2}
                  value={ratingRemarks}
                  onChange={(e) => setRatingRemarks(e.target.value)}
                  placeholder="e.g. Demonstrated high uptime during monsoon at Bailadila. Prompt field technician availability..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 text-xs"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRatingVendorModal(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitRating}
                disabled={submittingRating}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shadow-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit 10-Parameter Performance Audit</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

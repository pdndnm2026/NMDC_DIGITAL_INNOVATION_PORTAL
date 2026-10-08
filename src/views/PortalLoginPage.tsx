import React, { useState } from 'react';
import { UserRole } from '../types/index.js';
import { 
  Lightbulb, 
  Cpu, 
  ShieldCheck, 
  Layers, 
  TrendingUp, 
  ArrowRight, 
  Building2, 
  Briefcase, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  User, 
  ChevronRight,
  Eye,
  IndianRupee,
  Activity
} from 'lucide-react';
import { fetchApi } from '../utils/api.js';

interface PortalLoginPageProps {
  onLoginSuccess: (user: any) => void;
  onExploreAsPublic: () => void;
  stats: {
    totalIdeas: number;
    activeChallenges: number;
    registeredVendors: number;
    pocsUnderExecution: number;
    realisedSavingsCr: number;
    estimatedAnnualSavingsCr: number;
  };
}

export const PortalLoginPage: React.FC<PortalLoginPageProps> = ({
  onLoginSuccess,
  onExploreAsPublic,
  stats,
}) => {
  const [activeLoginTab, setActiveLoginTab] = useState<'executive' | 'vendor' | 'quick'>('executive');
  const [email, setEmail] = useState('executive@nmdc.co.in');
  const [password, setPassword] = useState('••••••••••••');
  const [loading, setLoading] = useState(false);

  const pillars = [
    {
      num: '01',
      id: 'innovate',
      title: 'INNOVATE',
      lead: 'Employees submit ideas & operational problems',
      desc: 'Frontline engineers, HEMM operators, and complex heads identify real equipment bottlenecks and propose digital innovations.',
      icon: Lightbulb,
      badge: 'Grassroots & Field',
    },
    {
      num: '02',
      id: 'solve',
      title: 'SOLVE',
      lead: 'Vendors, startups, IITs & tech partners propose solutions',
      desc: 'Empanelled technology partners respond to published challenges with technical architectures and itemized budgetary offers.',
      icon: Cpu,
      badge: 'Open Marketplace',
    },
    {
      num: '03',
      id: 'evaluate',
      title: 'EVALUATE',
      lead: 'AI-assisted technical, commercial & business evaluation',
      desc: 'Technical committees conduct weighted scoring (70% tech / 30% commercial) with Gemini AI risk assessment and duplicate detection.',
      icon: ShieldCheck,
      badge: '70/30 Dual Track',
    },
    {
      num: '04',
      id: 'implement',
      title: 'IMPLEMENT',
      lead: 'PoC → Pilot → Project → Deployment → Scale-up',
      desc: 'Interactive Gantt charts, structured milestone gates, risk registers, and operational KPIs guide deployment across mines.',
      icon: Layers,
      badge: 'PoC to Enterprise',
    },
    {
      num: '05',
      id: 'measure',
      title: 'MEASURE',
      lead: 'Track cost, production, safety, ESG & financial benefits',
      desc: 'Realised savings and availability gains are audited against baselines, fulfilling NMDC Vision 2030 strategic objectives.',
      icon: TrendingUp,
      badge: 'Audited Impact',
    },
  ];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const role: UserRole = activeLoginTab === 'vendor' ? 'vendor' : 'executive';
      const res = await fetchApi('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
      });
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      alert(`Login failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPersona = async (role: UserRole, userEmail: string) => {
    setLoading(true);
    try {
      const res = await fetchApi('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: userEmail, role }),
      });
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      alert(`Quick login failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Corporate PSU Bar */}
      <div className="bg-white border-b border-slate-200 text-xs py-2 px-4 sm:px-8 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-blue-700 text-white font-extrabold flex items-center justify-center text-xs tracking-wider shadow-xs">
            NMDC
          </div>
          <span className="font-bold text-slate-900">NMDC Limited</span>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="text-slate-500 hidden sm:inline text-[11px]">
            A Navratna PSU under Ministry of Steel, Government of India · Vision 2030
          </span>
        </div>

        <button
          onClick={onExploreAsPublic}
          className="text-xs text-blue-700 hover:text-blue-800 font-semibold flex items-center gap-1.5 transition-colors"
        >
          <span>Explore Public Challenges</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Hero & Login Section */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-10 lg:py-14 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Side: Brand Vision & Pillars Intro */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-800 bg-blue-50 px-3 py-1.5 rounded-md border border-blue-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span>ENTERPRISE DIGITAL TRANSFORMATION GATEWAY</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            NMDC Innovation, AI & Digital Transformation Platform
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed font-normal">
            Connecting an idea all the way to a measurable operational result. A unified digital governance platform powering NMDC's mines, beneficiation plants, slurry pipelines, and heavy machinery fleet.
          </p>

          {/* Realised Impact Snapshot Bar */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div>
              <span className="text-slate-500 text-[11px] block font-medium">Live Ideas & Problems</span>
              <strong className="text-slate-900 font-mono text-base">{stats.totalIdeas} Active</strong>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block font-medium">PoCs in Flight</span>
              <strong className="text-blue-700 font-mono text-base">{stats.pocsUnderExecution} Sanctioned</strong>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block font-medium">Realised Savings</span>
              <strong className="text-emerald-700 font-mono text-base">₹ {stats.realisedSavingsCr} Cr</strong>
            </div>
          </div>
        </div>

        {/* Right Side: Tabbed Login Portal Gateway */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden p-6 sm:p-7 space-y-6">
          <div>
            <span className="text-[10px] font-mono font-bold text-blue-700 tracking-wider uppercase block mb-1">
              AUTHORIZED PERSONNEL & PARTNER ACCESS
            </span>
            <h2 className="text-lg font-bold text-slate-900">Sign In to NMDC Workspace</h2>
          </div>

          {/* Tab selector */}
          <div className="flex border-b border-slate-200 text-xs font-semibold">
            <button
              onClick={() => {
                setActiveLoginTab('executive');
                setEmail('executive@nmdc.co.in');
              }}
              className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
                activeLoginTab === 'executive'
                  ? 'border-blue-600 text-blue-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              NMDC Executive
            </button>
            <button
              onClick={() => {
                setActiveLoginTab('vendor');
                setEmail('vendor@miningtech.in');
              }}
              className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
                activeLoginTab === 'vendor'
                  ? 'border-blue-600 text-blue-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Technology Partner
            </button>
            <button
              onClick={() => setActiveLoginTab('quick')}
              className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
                activeLoginTab === 'quick'
                  ? 'border-blue-600 text-blue-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              1-Click Demo
            </button>
          </div>

          {/* Quick Persona Mode */}
          {activeLoginTab === 'quick' ? (
            <div className="space-y-3 text-xs">
              <p className="text-slate-500 text-[11px]">
                Click any role to enter directly with verified sample data:
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => handleQuickPersona('executive', 'executive@nmdc.co.in')}
                  className="w-full p-2.5 bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-lg text-left flex items-center justify-between transition-colors"
                >
                  <div>
                    <strong className="text-slate-900 block">Dr. Amitabh Verma</strong>
                    <span className="text-[11px] text-slate-500">GM (Mining) · Bailadila Deposit 5</span>
                  </div>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-mono px-2 py-0.5 rounded font-bold border border-blue-200">
                    Executive
                  </span>
                </button>

                <button
                  onClick={() => handleQuickPersona('vendor', 'vendor@miningtech.in')}
                  className="w-full p-2.5 bg-slate-50 hover:bg-purple-50/70 border border-slate-200 hover:border-purple-300 rounded-lg text-left flex items-center justify-between transition-colors"
                >
                  <div>
                    <strong className="text-slate-900 block">Ananya Deshmukh</strong>
                    <span className="text-[11px] text-slate-500">Head of Industrial AI · MiningTech</span>
                  </div>
                  <span className="text-[10px] bg-purple-100 text-purple-800 font-mono px-2 py-0.5 rounded font-bold border border-purple-200">
                    Vendor
                  </span>
                </button>

                <button
                  onClick={() => handleQuickPersona('reviewer', 'reviewer@nmdc.co.in')}
                  className="w-full p-2.5 bg-slate-50 hover:bg-amber-50/70 border border-slate-200 hover:border-amber-300 rounded-lg text-left flex items-center justify-between transition-colors"
                >
                  <div>
                    <strong className="text-slate-900 block">Shri S. K. Nayak</strong>
                    <span className="text-[11px] text-slate-500">CGM (R&D) · Technical Committee</span>
                  </div>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-mono px-2 py-0.5 rounded font-bold border border-amber-200">
                    Reviewer
                  </span>
                </button>

                <button
                  onClick={() => handleQuickPersona('admin', 'admin@nmdc.co.in')}
                  className="w-full p-2.5 bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 rounded-lg text-left flex items-center justify-between transition-colors"
                >
                  <div>
                    <strong className="text-slate-900 block">Shri R. K. Sharma</strong>
                    <span className="text-[11px] text-slate-500">Executive Director (Digital & IT)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-2 py-0.5 rounded font-bold border border-emerald-200">
                    Admin
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  {activeLoginTab === 'executive' ? 'Employee Email or ID' : 'Company Email or CIN'}
                </label>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center justify-between text-slate-500 text-[11px]">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600 border-slate-300" />
                  <span>Remember Session</span>
                </label>
                <span className="text-slate-400">SSO Enabled</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg shadow-sm transition-colors text-xs flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="pt-2 border-t border-slate-100 text-center">
            <button
              onClick={onExploreAsPublic}
              className="text-xs text-slate-500 hover:text-slate-900 font-medium transition-colors"
            >
              Continue as Guest / Public Viewer →
            </button>
          </div>
        </div>
      </div>

      {/* The Five Connected Pillars Showcase Section */}
      <div className="bg-white border-t border-slate-200 py-12 px-4 sm:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="text-xs sm:text-sm font-mono font-bold text-blue-700 uppercase tracking-widest">
              NMDC VISION 2030 ARCHITECTURE
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              The Five Connected Pillars of NMDC Digital Transformation
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Transforming how India's premier mineral producer identifies problems, partners with industry, deploys robust field technology, and measures bottom-line value.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {pillars.map((p) => (
              <div
                key={p.id}
                className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-blue-400 hover:bg-white hover:shadow-md transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-400">{p.num}</span>
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {p.badge}
                    </span>
                  </div>

                  <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 group-hover:scale-105 transition-transform shadow-2xs">
                    <p.icon className="w-5 h-5" />
                  </div>

                  <h4 className="font-bold text-slate-900 text-base tracking-tight">{p.title}</h4>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">{p.lead}</p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-200">
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-slate-200 py-4 px-4 sm:px-8 text-center text-slate-500 text-xs">
        © 2026 NMDC Limited. Corporate IT & Innovation Wing · Khanij Bhavan, Masab Tank, Hyderabad 500028.
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { User, UserRole, AppNotification, MineComplexCode, AUTHORIZED_MINE_COMPLEXES } from '../types/index.js';
import { 
  Bell, 
  ShieldCheck, 
  Menu, 
  X,
  LogOut,
  ChevronDown,
  PlusCircle,
  Briefcase,
  Building2,
  MapPin,
  Check
} from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeComplexCode: MineComplexCode | 'ALL';
  onSelectComplex: (complex: MineComplexCode | 'ALL') => void;
  onOpenAuth: (initialMode?: 'login' | 'register-exec' | 'register-vendor') => void;
  onLogout: () => void;
  onOpenCreateProblem: () => void;
  notifications: AppNotification[];
  onOpenNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  currentUser,
  activeTab,
  setActiveTab,
  activeComplexCode,
  onSelectComplex,
  onOpenAuth,
  onLogout,
  onOpenCreateProblem,
  notifications,
  onOpenNotifications,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [complexDropdownOpen, setComplexDropdownOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const roleLabels: Record<UserRole, { label: string; tag: string }> = {
    public: { label: 'Public Visitor', tag: 'Public' },
    executive: { label: 'NMDC Executive / Employee', tag: 'Executive' },
    dept_head: { label: 'Department Head', tag: 'Dept Head' },
    approving_authority: { label: 'Approving Authority', tag: 'Approver' },
    vendor: { label: 'Registered Vendor', tag: 'Vendor' },
    tech_evaluator: { label: 'Technical Evaluator', tag: 'Tech Eval' },
    comm_evaluator: { label: 'Commercial Evaluator', tag: 'Comm Eval' },
    poc_committee: { label: 'PoC Committee Member', tag: 'PoC Comm' },
    project_manager: { label: 'Project Manager', tag: 'PM' },
    admin: { label: 'Portal Administrator', tag: 'Admin' },
  };

  const navItems = [
    { id: 'home', label: 'Home' },
    ...(currentRole !== 'public' ? [{ id: 'dashboard', label: 'Mine Dashboard' }] : []),
    { id: 'problems', label: 'Problem Statements' },
    { id: 'proposals', label: 'Vendor Offers & Evaluation' },
    { id: 'pocs', label: 'PoC Management' },
    { id: 'awards', label: 'Award of Work' },
    { id: 'projects', label: 'Project Tracking & Gantt' },
    { id: 'vendors', label: 'Registered Vendors' },
    { id: 'analytics', label: 'Management Analytics' },
    { id: 'reports', label: 'Reports & Downloads' },
    { id: 'activity', label: 'Audit Trail' },
    { id: 'sheets', label: 'Google Sheets' },
  ];

  const isCorporateAdmin = currentRole === 'admin' || !currentUser?.mineComplexCode;
  const activeComplexObj = AUTHORIZED_MINE_COMPLEXES.find(c => c.code === activeComplexCode);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      {/* Top Bar PSU Brand Stripe */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4 sm:px-6 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-amber-400 tracking-wider uppercase text-xs">NMDC LIMITED</span>
          <span className="text-slate-600">|</span>
          <span className="hidden md:inline text-slate-300 text-xs font-medium">
            A Navratna Enterprise under Ministry of Steel, Government of India
          </span>
        </div>
        
        {/* Top Right: Active Mine / Complex Badge & User Account */}
        <div className="flex items-center gap-3 text-xs">
          {/* Mine / Complex Selector Dropdown */}
          <div className="relative">
            {isCorporateAdmin ? (
              <div>
                <button
                  onClick={() => setComplexDropdownOpen(!complexDropdownOpen)}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold px-2.5 py-1 rounded border border-slate-700 transition-colors text-xs"
                  title="Switch Mine / Complex Module"
                >
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {activeComplexCode === 'ALL' ? 'Corporate View (All Complexes)' : activeComplexObj?.name || activeComplexCode}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {complexDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-1.5 w-72 bg-white text-slate-900 border border-slate-200 rounded-xl shadow-2xl py-2 z-50 text-xs animate-in fade-in duration-150"
                    onClick={() => setComplexDropdownOpen(false)}
                  >
                    <div className="px-3.5 py-1.5 text-[11px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-100 flex items-center justify-between">
                      <span>Select Mine / Complex Module</span>
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => onSelectComplex('ALL')}
                        className={`w-full text-left px-3.5 py-2 transition-colors flex items-center justify-between ${
                          activeComplexCode === 'ALL' ? 'bg-blue-50 text-blue-800 font-bold' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="font-semibold">All 4 Complexes (Consolidated View)</div>
                          <div className="text-[11px] text-slate-500">DIOM, KIOM, Bacheli & Kirandul</div>
                        </div>
                        {activeComplexCode === 'ALL' && <Check className="w-4 h-4 text-blue-600" />}
                      </button>

                      {AUTHORIZED_MINE_COMPLEXES.map((complex) => (
                        <button
                          key={complex.code}
                          onClick={() => onSelectComplex(complex.code)}
                          className={`w-full text-left px-3.5 py-2 transition-colors flex items-center justify-between border-t border-slate-100 ${
                            activeComplexCode === complex.code ? 'bg-blue-50 text-blue-800 font-bold' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <div className="font-semibold">{complex.name}</div>
                            <div className="text-[11px] text-slate-500">{complex.location}, {complex.state}</div>
                          </div>
                          {activeComplexCode === complex.code && <Check className="w-4 h-4 text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-slate-800 text-amber-300 font-medium px-2.5 py-1 rounded border border-slate-700 text-xs">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>{activeComplexObj?.name || currentUser?.projectComplex || 'NMDC'}</span>
              </div>
            )}
          </div>

          <span className="hidden sm:inline text-slate-700">|</span>

          {/* Quick Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          <span className="hidden sm:inline text-slate-700">|</span>

          {/* User Status / Login / Logout */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-slate-200 text-xs font-semibold truncate max-w-[160px]">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-400">
                  {roleLabels[currentRole]?.label || currentUser.role}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-1 p-1 px-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="text-[11px]">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => onOpenAuth('login')}
              className="text-xs font-semibold text-amber-300 hover:text-amber-200"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
        {/* Wordmark & Official Title */}
        <div className="flex items-center gap-3.5 shrink-0">
          <button 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 text-left focus:outline-none group"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-700 to-blue-950 text-white flex flex-col items-center justify-center shadow-sm ring-1 ring-blue-900/40">
              <span className="text-xs font-extrabold tracking-wider leading-none">NMDC</span>
              <span className="text-[9px] text-amber-300 font-bold uppercase tracking-tight mt-0.5">PORTAL</span>
            </div>
            <div>
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 block leading-tight">
                NMDC Problem Statement & Vendor Solution Portal
              </span>
              <span className="text-xs text-slate-500 font-medium block leading-none mt-1">
                Connecting NMDC's Operational Requirements with Innovative Industrial Solutions
              </span>
            </div>
          </button>
        </div>

        {/* Right CTA: Create Problem Statement (For authorized roles) */}
        <div className="hidden lg:flex items-center gap-3">
          {(currentRole === 'executive' || currentRole === 'dept_head' || currentRole === 'approving_authority' || currentRole === 'admin') && (
            <button
              onClick={onOpenCreateProblem}
              className="flex items-center gap-2 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-blue-200" />
              <span>Create Problem Statement</span>
            </button>
          )}

          {currentRole === 'vendor' && (
            <button
              onClick={() => setActiveTab('problems')}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Briefcase className="w-4 h-4 text-emerald-200" />
              <span>Browse Open Opportunities</span>
            </button>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Horizontal Nav Bar */}
      <div className="border-t border-slate-200/80 bg-slate-50/70 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 py-1.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold ${
                  activeTab === item.id ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {(currentRole === 'executive' || currentRole === 'dept_head' || currentRole === 'approving_authority' || currentRole === 'admin') && (
              <button
                onClick={() => {
                  onOpenCreateProblem();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 bg-blue-700 text-white text-xs font-bold rounded-lg text-center"
              >
                + Create Problem Statement
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

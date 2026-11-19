import React, { useState } from 'react';
import {
  User,
  UserRole,
  AppNotification,
  MineComplexCode,
  MineComplex,
  DEFAULT_ORGANISATIONAL_UNITS,
} from '../types/index.js';
import {
  Bell,
  Menu,
  X,
  LogOut,
  ChevronDown,
  PlusCircle,
  Briefcase,
  Building2,
  MapPin,
  Check,
  LayoutGrid,
  FileText,
  Users,
  Rocket,
  BarChart3,
} from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeComplexCode: MineComplexCode | 'ALL';
  onSelectComplex: (complex: MineComplexCode | 'ALL') => void;
  organisationalUnits?: MineComplex[];
  onOpenAuth: (initialMode?: 'login' | 'register-exec' | 'register-vendor') => void;
  onLogout: () => void;
  onOpenCreateProblem: () => void;
  notifications: AppNotification[];
  onOpenNotifications: () => void;
  showDemoData?: boolean;
  onToggleDemoData?: (val: boolean) => void;
  hasDemoData?: boolean;
  discussionsUnreadCount?: number;
}

interface NavItem {
  id: string;
  label: string;
  badge?: number;
}

interface PortalCluster {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: NavItem[];
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  currentUser,
  activeTab,
  setActiveTab,
  activeComplexCode,
  onSelectComplex,
  organisationalUnits = DEFAULT_ORGANISATIONAL_UNITS,
  onOpenAuth,
  onLogout,
  onOpenCreateProblem,
  notifications,
  onOpenNotifications,
  discussionsUnreadCount = 0,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [complexDropdownOpen, setComplexDropdownOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const roleLabels: Record<UserRole, string> = {
    public: 'Public Visitor',
    executive: 'NMDC Executive',
    dept_head: 'Department Head',
    approving_authority: 'Approving Authority',
    vendor: 'Registered Vendor',
    tech_evaluator: 'Technical Evaluator',
    comm_evaluator: 'Commercial Evaluator',
    poc_committee: 'PoC Committee',
    project_manager: 'Project Manager',
    admin: 'Portal Administrator',
  };

  const isNavAuthorized = (id: string): boolean => {
    if (currentRole === 'admin') return true;
    if (currentRole === 'public') {
      return ['dashboard', 'mines', 'problems', 'vendors', 'projects'].includes(id);
    }
    if (currentRole === 'vendor') {
      return [
        'dashboard',
        'mines',
        'problems',
        'budgetary',
        'vendors',
        'proposals',
        'discussions',
        'pocs',
        'projects',
      ].includes(id);
    }
    if (id === 'employee_master' || id === 'admin') return false;
    return true;
  };

  // 5 Clean Functional Clusters (Simplifies Navigation)
  const rawClusters: PortalCluster[] = [
    {
      id: 'overview',
      label: 'Overview & Units',
      icon: <LayoutGrid className="w-3.5 h-3.5" />,
      items: [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'mines', label: 'Mine / Complex Selection' },
      ],
    },
    {
      id: 'requirements',
      label: 'Requirements & BOR',
      icon: <FileText className="w-3.5 h-3.5" />,
      items: [
        { id: 'problems', label: 'Problem Statements' },
        { id: 'budgetary', label: 'Budgetary Offer Request' },
        { id: 'discussions', label: 'Discussion & Clarifications', badge: discussionsUnreadCount },
      ],
    },
    {
      id: 'vendors',
      label: 'Vendors & Evaluation',
      icon: <Users className="w-3.5 h-3.5" />,
      items: [
        { id: 'vendors', label: 'Vendor Registration' },
        { id: 'proposals', label: 'Vendor Responses' },
        { id: 'evaluation', label: 'Evaluation' },
      ],
    },
    {
      id: 'execution',
      label: 'PoC & Projects',
      icon: <Rocket className="w-3.5 h-3.5" />,
      items: [
        { id: 'pocs', label: 'PoC Management' },
        { id: 'awards', label: 'Award of Work' },
        { id: 'projects', label: 'Project Monitoring' },
      ],
    },
    {
      id: 'governance',
      label: 'MIS & Admin',
      icon: <BarChart3 className="w-3.5 h-3.5" />,
      items: [
        { id: 'mis_reports', label: 'MIS Reports' },
        { id: 'employee_master', label: 'Employee Master' },
        { id: 'administration', label: 'Administration' },
        { id: 'sheets', label: 'Google Sheets' },
        { id: 'activity', label: 'Audit Trail' },
      ],
    },
  ];

  // Normalize legacy 'admin' id seamlessly with 'administration'
  const normalizedActiveTab = activeTab === 'admin' ? 'administration' : activeTab;

  const clusters = rawClusters
    .map((cluster) => ({
      ...cluster,
      items: cluster.items
        .map((item) => ({
          ...item,
          id: item.id === 'administration' ? 'admin' : item.id,
        }))
        .filter((item) => isNavAuthorized(item.id)),
    }))
    .filter((cluster) => cluster.items.length > 0);

  const activeCluster =
    clusters.find((c) => c.items.some((i) => i.id === activeTab || (i.id === 'admin' && normalizedActiveTab === 'administration'))) ||
    clusters[0];

  const hasCorporateAccess =
    currentRole === 'admin' ||
    currentRole === 'approving_authority' ||
    currentRole === 'public' ||
    currentRole === 'vendor' ||
    !currentUser?.mineComplexCode ||
    currentUser?.mineComplexCode === 'ALL' ||
    currentUser?.mineComplexCode === 'HO';

  const activeComplexObj = organisationalUnits.find((c) => c.code === activeComplexCode);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
      {/* 1. Slim Brand & Utility Top Strip */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4 sm:px-6 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="font-extrabold text-amber-400 tracking-wider uppercase">NMDC LIMITED</span>
          <span className="hidden md:inline text-slate-500">·</span>
          <span className="hidden md:inline text-slate-300 text-[11px]">
            Problem Statement, Vendor Solution &amp; Project Management Portal
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {/* Unit Switcher */}
          <div className="relative">
            {hasCorporateAccess ? (
              <div>
                <button
                  onClick={() => setComplexDropdownOpen(!complexDropdownOpen)}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold px-2.5 py-1 rounded border border-slate-700 transition-colors"
                >
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {activeComplexCode === 'ALL'
                      ? 'All 5 Units'
                      : activeComplexObj?.shortLabel || activeComplexCode}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {complexDropdownOpen && (
                  <div
                    className="absolute right-0 mt-1.5 w-72 bg-white text-slate-900 border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-xs"
                    onClick={() => setComplexDropdownOpen(false)}
                  >
                    <button
                      onClick={() => onSelectComplex('ALL')}
                      className={`w-full text-left px-3.5 py-2 flex items-center justify-between ${
                        activeComplexCode === 'ALL' ? 'bg-blue-50 text-blue-800 font-bold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>All 5 Organisational Units</span>
                      {activeComplexCode === 'ALL' && <Check className="w-4 h-4 text-blue-600" />}
                    </button>

                    {organisationalUnits.map((unit) => (
                      <button
                        key={unit.code}
                        onClick={() => onSelectComplex(unit.code)}
                        className={`w-full text-left px-3.5 py-2 flex items-center justify-between border-t border-slate-100 ${
                          activeComplexCode === unit.code ? 'bg-blue-50 text-blue-800 font-bold' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="font-semibold">{unit.shortLabel || unit.name}</div>
                          <div className="text-[11px] text-slate-500">{unit.location}</div>
                        </div>
                        {activeComplexCode === unit.code && <Check className="w-4 h-4 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-slate-800 text-amber-300 font-medium px-2.5 py-1 rounded border border-slate-700">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>{activeComplexObj?.shortLabel || currentUser?.mineComplexCode}</span>
              </div>
            )}
          </div>

          {/* Notifications */}
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

          {/* User Info & Switch Account */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="hidden lg:block text-right">
                <span className="text-slate-200 font-semibold block leading-tight truncate max-w-[140px]">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-400 block leading-tight">
                  {roleLabels[currentRole]}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-1 px-2 py-1 text-slate-300 hover:text-amber-300 hover:bg-slate-800 rounded transition-colors text-[11px] font-medium"
                title="Switch User / Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Switch / Sign Out</span>
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

      {/* 2. Primary Cluster Navigation Bar (5 Clean Clusters) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <button
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-3 text-left shrink-0"
        >
          <img
            src="/assets/aistudio/nmdc_logo_72562162.jpg"
            alt="NMDC Limited Logo"
            className="h-11 w-auto object-contain bg-white rounded-md p-0.5 border border-slate-200 shrink-0"
          />
          <div className="hidden sm:block">
            <span className="text-sm font-extrabold text-slate-900 block leading-tight">
              NMDC Enterprise Portal
            </span>
            <span className="text-[11px] text-slate-500 block leading-tight">
              Clusterized Workflow Workspace
            </span>
          </div>
        </button>

        {/* 5 Clean Cluster Pills */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {clusters.map((cluster) => {
            const isActiveCluster = activeCluster?.id === cluster.id;
            return (
              <button
                key={cluster.id}
                onClick={() => setActiveTab(cluster.items[0].id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isActiveCluster
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white'
                }`}
              >
                {cluster.icon}
                <span>{cluster.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action CTA */}
        <div className="flex items-center gap-2 shrink-0">
          {(currentRole === 'executive' || currentRole === 'dept_head' || currentRole === 'approving_authority' || currentRole === 'admin') && (
            <button
              onClick={onOpenCreateProblem}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Raise Problem</span>
            </button>
          )}

          {currentRole === 'vendor' && (
            <button
              onClick={() => setActiveTab('problems')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Briefcase className="w-4 h-4" />
              <span>Open Opportunities</span>
            </button>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 3. Focused Cluster Sub-Navigation (2-4 Clean Tabs Only) */}
      {activeCluster && (
        <div className="hidden lg:block bg-slate-50 border-t border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between py-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-2">
                {activeCluster.label}:
              </span>
              {activeCluster.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      isActive
                        ? 'bg-white text-blue-800 border border-blue-200 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-600 text-white">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <span className="text-[11px] text-slate-500 font-medium">
              Scope: {activeComplexCode === 'ALL' ? 'All 5 NMDC Units' : activeComplexObj?.name || activeComplexCode}
            </span>
          </div>
        </div>
      )}

      {/* Mobile Cluster Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-4 max-h-[75vh] overflow-y-auto">
          {clusters.map((cluster) => (
            <div key={cluster.id} className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1.5">
                {cluster.icon}
                <span>{cluster.label}</span>
              </div>
              <div className="grid grid-cols-1 gap-1">
                {cluster.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between ${
                      activeTab === item.id ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </header>
  );
};

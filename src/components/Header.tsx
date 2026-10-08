import React, { useState } from 'react';
import { User, UserRole, AppNotification } from '../types/index.js';
import { 
  Bell, 
  Sparkles, 
  ShieldCheck, 
  UserCheck, 
  Briefcase, 
  Menu, 
  X,
  LogOut,
  ChevronDown,
  PlusCircle,
  Lightbulb,
  FileSpreadsheet
} from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSwitchRole: (role: UserRole) => void;
  onOpenAuth: (initialMode?: 'login' | 'register-exec' | 'register-vendor') => void;
  onLogout: () => void;
  onOpenAiAssistant: () => void;
  onOpenPostProblem: () => void;
  notifications: AppNotification[];
  onOpenNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  currentUser,
  activeTab,
  setActiveTab,
  onSwitchRole,
  onOpenAuth,
  onLogout,
  onOpenAiAssistant,
  onOpenPostProblem,
  notifications,
  onOpenNotifications,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const roleLabels: Record<UserRole, { label: string; tag: string }> = {
    public: { label: 'Public User', tag: 'Public' },
    executive: { label: 'NMDC Executive', tag: 'Executive' },
    vendor: { label: 'Registered Vendor', tag: 'Vendor' },
    reviewer: { label: 'Technical Committee', tag: 'Reviewer' },
    project_manager: { label: 'Project Manager', tag: 'PM' },
    admin: { label: 'Portal Administrator', tag: 'Admin' },
  };

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'challenges', label: 'Challenges' },
    { id: 'ideas', label: 'Ideas' },
    { id: 'engine', label: 'AI Solution Engine' },
    { id: 'pocs', label: 'PoC Management' },
    { id: 'vendor-marketplace', label: 'Vendor Showcase' },
    { id: 'proposals', label: 'Proposals' },
    { id: 'projects', label: 'Projects' },
    { id: 'knowledge', label: 'Knowledge Base' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'sheets', label: 'Google Sheets' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top Bar PSU Brand Stripe */}
      <div className="bg-slate-100 text-slate-700 text-xs py-1.5 px-4 sm:px-6 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-900 tracking-wide uppercase text-xs">NMDC Limited</span>
          <span className="text-slate-300">|</span>
          <span className="hidden md:inline text-slate-600 text-xs">A Navratna Enterprise under Ministry of Steel, Government of India · Vision 2030</span>
        </div>
        <div className="flex items-center gap-4 text-slate-700 text-xs">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="text-slate-500">Demo Persona:</span>
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-1 bg-white hover:bg-slate-50 text-blue-700 font-semibold px-2.5 py-1 rounded border border-slate-300 shadow-2xs transition-colors text-xs"
                title="Switch persona for evaluation"
              >
                <span>{roleLabels[currentRole].label}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {roleMenuOpen && (
                <div 
                  className="absolute right-0 mt-1 w-60 bg-white border border-slate-200 rounded-md shadow-xl py-1 z-50 text-xs"
                  onClick={() => setRoleMenuOpen(false)}
                >
                  <div className="px-3 py-1.5 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-100">
                    Switch Test Persona
                  </div>
                  {(Object.keys(roleLabels) as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => onSwitchRole(r)}
                      className={`w-full text-left px-3 py-2 transition-colors flex items-center justify-between ${currentRole === r ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                      <span className="text-xs">{roleLabels[r].label}</span>
                      <span className="text-[11px] text-slate-400 font-mono">[{roleLabels[r].tag}]</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <span className="hidden sm:inline text-slate-300">|</span>
          <button 
            onClick={() => setActiveTab('sheets')}
            className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded transition-colors font-semibold text-xs"
            title="Google Sheets & Workspace Hub"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Google Sheets</span>
          </button>
          <span className="hidden sm:inline text-slate-300">|</span>
          <button 
            onClick={onOpenAiAssistant}
            className="flex items-center gap-1 text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded transition-colors font-semibold text-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>AI Assistant</span>
          </button>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
        {/* Zone 1: Wordmark & Emblem */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 text-left focus:outline-none"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-700 text-white flex items-center justify-center font-extrabold text-base shadow-sm ring-1 ring-blue-800/50">
              NMDC
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 block leading-tight">
                Innovation & AI Platform
              </span>
              <span className="text-xs text-slate-500 font-medium block leading-none mt-0.5">
                Digital Transformation Portal
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden xl:flex items-center gap-5 text-sm font-semibold text-slate-600 overflow-x-auto py-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`transition-colors py-1 relative whitespace-nowrap ${
                activeTab === item.id
                  ? 'text-blue-700 font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              {item.label}
              {activeTab === item.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-700 rounded-full" />
              )}
            </button>
          ))}
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Post a Problem Button */}
          <button
            onClick={onOpenPostProblem}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm rounded-lg shadow-xs transition-colors"
            title="Field-friendly problem submission with AI conversion"
          >
            <Lightbulb className="w-4 h-4 fill-slate-950 text-slate-950" />
            <span className="hidden sm:inline">POST A PROBLEM</span>
            <span className="sm:hidden">Post</span>
          </button>

          {/* Notifications */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="hidden lg:block text-right">
                <div className="text-xs font-semibold text-slate-900 truncate max-w-[130px]">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 truncate max-w-[130px]">
                  {currentUser.department || roleLabels[currentRole].label}
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Sign Out to Portal Login"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap"
              >
                Sign In
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-1 text-xs">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-md font-medium transition-colors ${
                activeTab === item.id
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <button
              onClick={() => {
                onOpenPostProblem();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-md font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 flex items-center gap-2"
            >
              <Lightbulb className="w-4 h-4" />
              <span>POST A PROBLEM (Field Entry)</span>
            </button>
            <button
              onClick={() => {
                onOpenAiAssistant();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-md font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>NMDC Innovation Assistant</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

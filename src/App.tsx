import React, { useState, useEffect } from 'react';
import { 
  UserRole, 
  User, 
  PortalStats, 
  ProblemStatement, 
  Proposal, 
  Project, 
  Vendor, 
  PocRecord,
  AwardOfWork, 
  EvaluationParameter, 
  AppNotification, 
  ActivityLog,
  MineComplexCode
} from './types/index.js';
import { Header } from './components/Header.js';
import { NotificationDrawer } from './components/NotificationDrawer.js';
import { ProposalWizardModal } from './components/ProposalWizardModal.js';
import { ProposalComparisonModal } from './components/ProposalComparisonModal.js';
import { ReviewerEvaluationModal } from './components/ReviewerEvaluationModal.js';
import { CreateProblemStatementModal } from './components/CreateProblemStatementModal.js';

import { PortalLoginPage } from './views/PortalLoginPage.js';
import { LandingView } from './views/LandingView.js';
import { ExecutiveDashboardView } from './views/ExecutiveDashboardView.js';
import { ChallengesView } from './views/ChallengesView.js';
import { ProposalsView } from './views/ProposalsView.js';
import { PocManagementView } from './views/PocManagementView.js';
import { AwardsView } from './views/AwardsView.js';
import { ProjectsView } from './views/ProjectsView.js';
import { VendorsView } from './views/VendorsView.js';
import { AnalyticsView } from './views/AnalyticsView.js';
import { ReportsView } from './views/ReportsView.js';
import { ActivityMonitorView } from './views/ActivityMonitorView.js';
import { GoogleSheetsView } from './views/GoogleSheetsView.js';
import { AuthModal } from './views/AuthModal.js';

import { fetchApi } from './utils/api.js';

export function App() {
  // Authentication Gateway state: starts at login page
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentRole, setCurrentRole] = useState<UserRole>('public');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Active Mine / Operating Complex Module ('ALL' for corporate view, or 'DIOM' | 'KIOM' | 'BCH' | 'KDL')
  const [activeComplexCode, setActiveComplexCode] = useState<MineComplexCode | 'ALL'>('ALL');

  const [activeTab, setActiveTab] = useState<string>('home');

  // Core Portal Data - Zero mock defaults: everything strictly from DB
  const [stats, setStats] = useState<PortalStats>({
    totalProblemStatements: 0,
    openOpportunities: 0,
    registeredVendors: 0,
    budgetaryOffersReceived: 0,
    pocsCompleted: 0,
    pocsUnderExecution: 0,
    projectsAwarded: 0,
    projectsUnderExecution: 0,
    projectsCompleted: 0,
    totalAwardedValueCr: 0,
  });

  const [problemStatements, setProblemStatements] = useState<ProblemStatement[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [pocs, setPocs] = useState<PocRecord[]>([]);
  const [awards, setAwards] = useState<AwardOfWork[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [parameters, setParameters] = useState<EvaluationParameter[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register-exec' | 'register-vendor'>('login');
  const [createProblemOpen, setCreateProblemOpen] = useState(false);
  const [selectedPsForProposal, setSelectedPsForProposal] = useState<ProblemStatement | null>(null);
  const [selectedPsForCompare, setSelectedPsForCompare] = useState<ProblemStatement | null>(null);
  const [selectedProposalForEvaluation, setSelectedProposalForEvaluation] = useState<Proposal | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Load all initial data on mount and whenever complex filter changes
  useEffect(() => {
    loadAllData();
  }, [activeComplexCode]);

  const loadAllData = async () => {
    try {
      const complexQuery = activeComplexCode !== 'ALL' ? `?mineComplex=${activeComplexCode}` : '';
      const [sRes, psRes, prRes, pocRes, aRes, projRes, vRes, paramRes, notifRes, actRes] = await Promise.allSettled([
        fetchApi(`/api/stats${complexQuery}`),
        fetchApi(`/api/problems${complexQuery}`),
        fetchApi(`/api/proposals${complexQuery}`),
        fetchApi(`/api/pocs${complexQuery}`),
        fetchApi(`/api/awards${complexQuery}`),
        fetchApi(`/api/projects${complexQuery}`),
        fetchApi('/api/vendors'),
        fetchApi('/api/evaluation-parameters'),
        fetchApi('/api/notifications'),
        fetchApi('/api/activities'),
      ]);

      if (sRes.status === 'fulfilled' && sRes.value.success) setStats(sRes.value.data);
      if (psRes.status === 'fulfilled' && psRes.value.success) setProblemStatements(psRes.value.data);
      if (prRes.status === 'fulfilled' && prRes.value.success) setProposals(prRes.value.data);
      if (pocRes.status === 'fulfilled' && pocRes.value.success) setPocs(pocRes.value.data);
      if (aRes.status === 'fulfilled' && aRes.value.success) setAwards(aRes.value.data);
      if (projRes.status === 'fulfilled' && projRes.value.success) setProjects(projRes.value.data);
      if (vRes.status === 'fulfilled' && vRes.value.success) setVendors(vRes.value.data);
      if (paramRes.status === 'fulfilled' && paramRes.value.success) setParameters(paramRes.value.data);
      if (notifRes.status === 'fulfilled' && notifRes.value.success) setNotifications(notifRes.value.data);
      if (actRes.status === 'fulfilled' && actRes.value.success) setActivities(actRes.value.data);
    } catch (e) {
      console.error('Data load error:', e);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentRole('public');
    setActiveComplexCode('ALL');
  };

  const handleMarkNotifRead = async (id: string) => {
    try {
      await fetchApi(`/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const currentVendorObj = vendors.find((v) => v.id === currentUser?.vendorId) || null;

  // 1. RENDER CLEAN SIGN-IN / REGISTRATION GATEWAY IF NOT AUTHENTICATED
  if (!isAuthenticated) {
    return (
      <PortalLoginPage
        stats={stats}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setCurrentRole(user.role);
          if (user.mineComplexCode) {
            setActiveComplexCode(user.mineComplexCode);
          } else {
            setActiveComplexCode('ALL');
          }
          setIsAuthenticated(true);
          loadAllData();
        }}
        onExploreAsPublic={() => {
          setCurrentUser(null);
          setCurrentRole('public');
          setActiveComplexCode('ALL');
          setIsAuthenticated(true);
        }}
      />
    );
  }

  // 2. RENDER MAIN AUTHENTICATED ENTERPRISE WORKSPACE
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Universal Top Bar with Mine Module Selector and Real User Account */}
      <Header
        currentRole={currentRole}
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeComplexCode={activeComplexCode}
        onSelectComplex={(code) => setActiveComplexCode(code)}
        onOpenAuth={(mode) => {
          setAuthInitialMode(mode || 'login');
          setAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        onOpenCreateProblem={() => setCreateProblemOpen(true)}
        notifications={notifications}
        onOpenNotifications={() => setNotificationsOpen(true)}
      />

      {/* Main Tab Router */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
        {activeTab === 'home' && (
          <LandingView
            stats={stats}
            problemStatements={problemStatements}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenCreateProblem={() => setCreateProblemOpen(true)}
            onOpenRegisterVendor={() => {
              setAuthInitialMode('register-vendor');
              setAuthModalOpen(true);
            }}
            onSelectProblemStatement={(ps) => {
              setSelectedPsForProposal(ps);
            }}
            onOpenLogin={() => {
              setAuthInitialMode('login');
              setAuthModalOpen(true);
            }}
          />
        )}

        {activeTab === 'dashboard' && (
          <ExecutiveDashboardView
            currentRole={currentRole}
            currentUser={currentUser}
            stats={stats}
            problemStatements={problemStatements}
            proposals={proposals}
            projects={projects}
            pocs={pocs}
            awards={awards}
            vendors={vendors}
            activeComplexCode={activeComplexCode}
            onSelectComplex={(code) => setActiveComplexCode(code)}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenCreateProblem={() => setCreateProblemOpen(true)}
            onSelectProblemStatement={(ps) => {
              setSelectedPsForProposal(ps);
            }}
            onSelectProposal={(prop) => {
              setSelectedProposalForEvaluation(prop);
            }}
            onRefreshData={loadAllData}
          />
        )}

        {(activeTab === 'problems' || activeTab === 'challenges') && (
          <ChallengesView
            problemStatements={problemStatements}
            currentRole={currentRole}
            currentUser={currentUser}
            currentVendor={currentVendorObj}
            activeComplexCode={activeComplexCode}
            onSelectComplex={(code) => setActiveComplexCode(code)}
            onOpenProposalWizard={(ps) => setSelectedPsForProposal(ps)}
            onOpenCompareMatrix={(ps) => setSelectedPsForCompare(ps)}
            onOpenCreateChallenge={() => setCreateProblemOpen(true)}
            onRefreshData={loadAllData}
          />
        )}

        {activeTab === 'proposals' && (
          <ProposalsView
            proposals={proposals}
            problemStatements={problemStatements}
            currentRole={currentRole}
            currentUser={currentUser}
            activeComplexCode={activeComplexCode}
            parameters={parameters}
            onOpenEvaluate={(p) => setSelectedProposalForEvaluation(p)}
            onOpenCompare={(ps) => setSelectedPsForCompare(ps)}
            onRefreshData={loadAllData}
          />
        )}

        {activeTab === 'pocs' && (
          <PocManagementView
            currentRole={currentRole}
            currentUser={currentUser}
            activeComplexCode={activeComplexCode}
            onRefreshData={loadAllData}
          />
        )}

        {activeTab === 'awards' && (
          <AwardsView
            awards={awards}
            currentRole={currentRole}
            currentUser={currentUser}
            activeComplexCode={activeComplexCode}
            problemStatements={problemStatements}
            proposals={proposals}
            onRefreshData={loadAllData}
            onNavigateToProjects={() => setActiveTab('projects')}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectsView
            projects={projects}
            currentRole={currentRole}
            currentUser={currentUser}
            activeComplexCode={activeComplexCode}
            onRefreshProjects={loadAllData}
          />
        )}

        {activeTab === 'vendors' && (
          <VendorsView
            vendors={vendors}
            currentRole={currentRole}
            onOpenRegisterVendor={() => {
              setAuthInitialMode('register-vendor');
              setAuthModalOpen(true);
            }}
            onRefreshVendors={loadAllData}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            stats={stats}
            projects={projects}
            problemStatements={problemStatements}
            proposals={proposals}
            pocs={pocs}
            vendors={vendors}
            activeComplexCode={activeComplexCode}
            onNavigateToSheets={() => setActiveTab('sheets')}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            problemStatements={problemStatements}
            vendors={vendors}
            proposals={proposals}
            pocs={pocs}
            awards={awards}
            projects={projects}
            currentRole={currentRole}
            currentUser={currentUser}
            activeComplexCode={activeComplexCode}
          />
        )}

        {activeTab === 'activity' && (
          <ActivityMonitorView
            initialActivities={activities}
            currentRole={currentRole}
          />
        )}

        {activeTab === 'sheets' && (
          <GoogleSheetsView
            ideas={[]}
            problemStatements={problemStatements}
            projects={projects}
            currentRole={currentRole}
            currentUser={currentUser}
            onRefreshData={loadAllData}
          />
        )}
      </main>

      {/* Corporate PSU Footer */}
      <footer className="bg-white text-slate-600 text-xs border-t border-slate-200 mt-16 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <span className="w-8 h-8 rounded bg-blue-700 text-white flex items-center justify-center font-bold text-sm">
                  NMDC
                </span>
                <span>NMDC Limited</span>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                National Mineral Development Corporation Limited. A Navratna Public Sector Enterprise under Ministry of Steel, Government of India.
              </p>
              <div className="text-xs text-slate-400 font-mono">
                CIN: L13100TG1958GOI000774 · Operational Governance Portal
              </div>
            </div>

            <div className="space-y-2.5">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">Corporate Office</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                "Khanij Bhavan", 10-3-311/A, Castle Hills, Masab Tank, Hyderabad, Telangana 500028, India.
              </p>
              <p className="text-xs sm:text-sm text-slate-600">
                Phone: +91 40 2222 1800<br />
                Email: procurement@nmdc.co.in
              </p>
            </div>

            <div className="space-y-2.5">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">4 Operational Complexes</h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li>• MODULE 1: DIOM - Donimalai Iron Ore Mine</li>
                <li>• MODULE 2: KIOM - Kumaraswamy Iron Ore Mine</li>
                <li>• MODULE 3: BACHELI COMPLEX - Deposit 14 & 11C</li>
                <li>• MODULE 4: KIRANDUL COMPLEX - Deposit 5 & 10</li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">Enterprise Modules</h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li>
                  <button onClick={() => setActiveTab('problems')} className="hover:text-blue-700 transition-colors">
                    1. Problem Statement Register
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('proposals')} className="hover:text-blue-700 transition-colors">
                    2. Vendor Budgetary Offers & Comparative Matrix
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('pocs')} className="hover:text-blue-700 transition-colors">
                    3. Proof of Concept (PoC) Management
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('awards')} className="hover:text-blue-700 transition-colors">
                    4. Award of Work & Contract Register
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('projects')} className="hover:text-blue-700 transition-colors">
                    5. 12-Stage Project Execution Tracking
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              © 2026 NMDC Limited. All Rights Reserved. Enterprise Workflow & Project Management Platform.
            </div>
            <div className="flex items-center gap-4 text-slate-500">
              <button onClick={() => setIsAuthenticated(false)} className="hover:text-slate-900 transition-colors">
                Return to Login Page
              </button>
              <span>·</span>
              <button onClick={() => setActiveTab('reports')} className="hover:text-blue-700 font-semibold transition-colors">
                Statutory Registers
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* ALL MODALS & DRAWERS */}
      {/* 1. Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authInitialMode}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setCurrentRole(user.role);
          if (user.mineComplexCode) {
            setActiveComplexCode(user.mineComplexCode);
          }
          loadAllData();
        }}
      />

      {/* 2. Create Problem Statement Modal (Section 6) */}
      <CreateProblemStatementModal
        isOpen={createProblemOpen}
        onClose={() => setCreateProblemOpen(false)}
        onSuccess={loadAllData}
        currentUser={currentUser}
        defaultComplexCode={activeComplexCode}
      />

      {/* 3. Vendor Proposal Wizard Modal (Section 10) */}
      {selectedPsForProposal && (
        <ProposalWizardModal
          isOpen={true}
          onClose={() => setSelectedPsForProposal(null)}
          problemStatement={selectedPsForProposal}
          vendor={currentVendorObj}
          onSubmitSuccess={loadAllData}
        />
      )}

      {/* 4. Proposal Comparison Matrix Modal (Section 13) */}
      {selectedPsForCompare && (
        <ProposalComparisonModal
          isOpen={true}
          onClose={() => setSelectedPsForCompare(null)}
          problemStatement={selectedPsForCompare}
          proposals={proposals}
        />
      )}

      {/* 5. Reviewer Evaluation Modal (Section 12) */}
      {selectedProposalForEvaluation && (
        <ReviewerEvaluationModal
          isOpen={true}
          onClose={() => setSelectedProposalForEvaluation(null)}
          proposal={selectedProposalForEvaluation}
          parameters={parameters}
          reviewerName={currentUser?.name || 'Technical Evaluator'}
          onEvaluationSuccess={loadAllData}
        />
      )}

      {/* 6. Notification Center */}
      <NotificationDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkNotifRead}
        onNavigate={(link) => {
          if (link) {
            const clean = link.replace('/', '');
            setActiveTab(clean);
          }
        }}
      />
    </div>
  );
}

export default App;

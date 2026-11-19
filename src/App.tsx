import React, { useState, useEffect } from 'react';
import {
  UserRole,
  User,
  PortalStats,
  ProblemStatement,
  BudgetaryOfferRequest,
  DiscussionThread,
  Proposal,
  Project,
  Vendor,
  PocRecord,
  AwardOfWork,
  EvaluationParameter,
  AppNotification,
  ActivityLog,
  MineComplexCode,
  MineComplex,
  DEFAULT_ORGANISATIONAL_UNITS,
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
import { MineSelectionView } from './views/MineSelectionView.js';
import { ChallengesView } from './views/ChallengesView.js';
import { BudgetaryOffersView } from './views/BudgetaryOffersView.js';
import { ProposalsView } from './views/ProposalsView.js';
import { DiscussionsView } from './views/DiscussionsView.js';
import { PocManagementView } from './views/PocManagementView.js';
import { AwardsView } from './views/AwardsView.js';
import { ProjectsView } from './views/ProjectsView.js';
import { VendorsView } from './views/VendorsView.js';
import { EmployeeMasterView } from './views/EmployeeMasterView.js';
import { MisReportsView } from './views/MisReportsView.js';
import { AdministrationView } from './views/AdministrationView.js';
import { AnalyticsView } from './views/AnalyticsView.js';
import { ReportsView } from './views/ReportsView.js';
import { ActivityMonitorView } from './views/ActivityMonitorView.js';
import { GoogleSheetsView } from './views/GoogleSheetsView.js';
import { AuthModal } from './views/AuthModal.js';

import { fetchApi } from './utils/api.js';

const INITIAL_ADMIN_SESSION: User = {
  id: 'usr-admin-1',
  email: 'admin@nmdc.co.in',
  name: 'Rajendra Prasad Verma',
  role: 'admin',
  employeeId: '10024501',
  designation: 'General Manager (IT & Systems)',
  department: 'Corporate IT & Executive Cell',
  mineComplexCode: 'ALL',
  projectComplex: 'Head Office & All Mining Complexes',
  location: 'Khanij Bhavan, Hyderabad',
  mobile: '9849012301',
  status: 'Active',
  verifiedFromEmployeeMaster: true,
  createdAt: '2026-01-05T09:30:00Z',
};

export function App() {
  // Opens directly into the Clusterized Portal with full pre-populated enterprise data;
  // Sign Out / Switch User opens the clean PortalLoginPage anytime.
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');
  const [currentUser, setCurrentUser] = useState<User | null>(INITIAL_ADMIN_SESSION);

  const [activeComplexCode, setActiveComplexCode] = useState<MineComplexCode | 'ALL'>('ALL');
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const [showDemoData, setShowDemoData] = useState<boolean>(false);
  const [hasDemoData, setHasDemoData] = useState<boolean>(false);

  const [organisationalUnits, setOrganisationalUnits] = useState<MineComplex[]>(DEFAULT_ORGANISATIONAL_UNITS);
  const [stats, setStats] = useState<PortalStats>({
    totalProblemStatements: 0,
    openOpportunities: 0,
    registeredVendors: 0,
    budgetaryRequestsActive: 0,
    budgetaryOffersReceived: 0,
    pocsCompleted: 0,
    pocsUnderExecution: 0,
    projectsAwarded: 0,
    projectsUnderExecution: 0,
    projectsCompleted: 0,
    totalAwardedValueCr: 0,
  });

  const [problemStatements, setProblemStatements] = useState<ProblemStatement[]>([]);
  const [budgetaryRequests, setBudgetaryRequests] = useState<BudgetaryOfferRequest[]>([]);
  const [discussions, setDiscussions] = useState<DiscussionThread[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [pocs, setPocs] = useState<PocRecord[]>([]);
  const [awards, setAwards] = useState<AwardOfWork[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [parameters, setParameters] = useState<EvaluationParameter[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  // Modals & Context
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register-exec' | 'register-vendor'>('login');
  const [createProblemOpen, setCreateProblemOpen] = useState(false);
  const [selectedPsForProposal, setSelectedPsForProposal] = useState<ProblemStatement | null>(null);
  const [selectedBorForProposal, setSelectedBorForProposal] = useState<BudgetaryOfferRequest | null>(null);
  const [selectedPsForCompare, setSelectedPsForCompare] = useState<ProblemStatement | null>(null);
  const [selectedProposalForEvaluation, setSelectedProposalForEvaluation] = useState<Proposal | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [preselectedDiscussionEntity, setPreselectedDiscussionEntity] = useState<{
    type: 'PROBLEM' | 'BUDGETARY_REQUEST';
    id: string;
    code: string;
    title: string;
    mineComplexCode: string;
  } | null>(null);

  useEffect(() => {
    loadAllData();
  }, [activeComplexCode, showDemoData, currentRole, currentUser?.vendorId]);

  const loadAllData = async () => {
    try {
      const unitParam = activeComplexCode !== 'ALL' ? `mineComplex=${activeComplexCode}` : '';
      const unitQuery = unitParam ? `?${unitParam}` : '';
      const statsQuery = `?${[unitParam, `includeDemo=${showDemoData}`].filter(Boolean).join('&')}`;
      const discussionQuery = `?viewerRole=${currentRole}${currentUser?.vendorId ? `&vendorId=${encodeURIComponent(currentUser.vendorId)}` : ''}`;

      const [
        unitsRes,
        sRes,
        psRes,
        borRes,
        prRes,
        discRes,
        pocRes,
        aRes,
        projRes,
        vRes,
        paramRes,
        notifRes,
        actRes,
        demoStatusRes,
      ] = await Promise.allSettled([
        fetchApi('/api/units'),
        fetchApi(`/api/stats${statsQuery}`),
        fetchApi(`/api/problems${unitQuery}`),
        fetchApi(`/api/budgetary-requests${unitQuery}`),
        fetchApi(`/api/proposals${unitQuery}`),
        fetchApi(`/api/discussions${discussionQuery}`),
        fetchApi(`/api/pocs${unitQuery}`),
        fetchApi(`/api/awards${unitQuery}`),
        fetchApi(`/api/projects${unitQuery}`),
        fetchApi('/api/vendors'),
        fetchApi('/api/evaluation-parameters'),
        fetchApi('/api/notifications'),
        fetchApi('/api/activities'),
        fetchApi('/api/demo/status'),
      ]);

      if (unitsRes.status === 'fulfilled' && unitsRes.value.success && Array.isArray(unitsRes.value.data)) {
        setOrganisationalUnits(unitsRes.value.data);
      }
      if (sRes.status === 'fulfilled' && sRes.value.success) setStats(sRes.value.data);
      if (psRes.status === 'fulfilled' && psRes.value.success) setProblemStatements(psRes.value.data);
      if (borRes.status === 'fulfilled' && borRes.value.success) setBudgetaryRequests(borRes.value.data);
      if (prRes.status === 'fulfilled' && prRes.value.success) setProposals(prRes.value.data);
      if (discRes.status === 'fulfilled' && discRes.value.success) setDiscussions(discRes.value.data);
      if (pocRes.status === 'fulfilled' && pocRes.value.success) setPocs(pocRes.value.data);
      if (aRes.status === 'fulfilled' && aRes.value.success) setAwards(aRes.value.data);
      if (projRes.status === 'fulfilled' && projRes.value.success) setProjects(projRes.value.data);
      if (vRes.status === 'fulfilled' && vRes.value.success) setVendors(vRes.value.data);
      if (paramRes.status === 'fulfilled' && paramRes.value.success) setParameters(paramRes.value.data);
      if (notifRes.status === 'fulfilled' && notifRes.value.success) setNotifications(notifRes.value.data);
      if (actRes.status === 'fulfilled' && actRes.value.success) setActivities(actRes.value.data);
      if (demoStatusRes.status === 'fulfilled' && demoStatusRes.value.success) {
        const exists = Boolean(demoStatusRes.value.data?.hasDemoData);
        setHasDemoData(exists);
        if (!exists && showDemoData) setShowDemoData(false);
      }
    } catch (e) {
      console.error('Data load error:', e);
    }
  };

  const handleLoadDemoData = async () => {
    const res = await fetchApi<{ success: boolean; error?: string }>('/api/demo/load', { method: 'POST' });
    if (!res.success) throw new Error(res.error || 'Failed to load Demo Showcase dataset.');
    setHasDemoData(true);
    setShowDemoData(true);
    await loadAllData();
  };

  const handleClearDemoData = async () => {
    const res = await fetchApi<{ success: boolean; error?: string }>('/api/demo/clear', { method: 'DELETE' });
    if (!res.success) throw new Error(res.error || 'Failed to clear Demo Showcase dataset.');
    setHasDemoData(false);
    setShowDemoData(false);
    await loadAllData();
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentRole('public');
    setActiveComplexCode('ALL');
    setActiveTab('dashboard');
  };

  const handleMarkNotifRead = async (id: string) => {
    try {
      await fetchApi(`/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (e) {
      console.error(e);
    }
  };

  const currentVendorObj = vendors.find((v) => v.id === currentUser?.vendorId) || null;

  const filterDemo = <T extends { isDemo?: boolean }>(items: T[]): T[] =>
    showDemoData ? items : items.filter((item) => !item.isDemo);

  const visibleProblemStatements = filterDemo(problemStatements);
  const visibleBudgetaryRequests = filterDemo(budgetaryRequests);
  const visibleProposals = filterDemo(proposals);
  const visibleDiscussions = filterDemo(discussions);
  const visiblePocs = filterDemo(pocs);
  const visibleAwards = filterDemo(awards);
  const visibleProjects = filterDemo(projects);
  const visibleVendors = filterDemo(vendors);

  const discussionsUnreadCount = visibleDiscussions.reduce((acc, thread) => {
    const count =
      currentRole === 'vendor'
        ? thread.unreadByVendor || 0
        : thread.unreadByOfficer || 0;
    return acc + count;
  }, 0);

  if (!isAuthenticated) {
    return (
      <PortalLoginPage
        stats={stats}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setCurrentRole(user.role);
          if (user.mineComplexCode && user.mineComplexCode !== 'ALL') {
            setActiveComplexCode(user.mineComplexCode);
          } else {
            setActiveComplexCode('ALL');
          }
          setActiveTab('dashboard');
          setIsAuthenticated(true);
          loadAllData();
        }}
        onExploreAsPublic={() => {
          setCurrentUser(null);
          setCurrentRole('public');
          setActiveComplexCode('ALL');
          setActiveTab('dashboard');
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-blue-600 selection:text-white">
      <Header
        currentRole={currentRole}
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeComplexCode={activeComplexCode}
        onSelectComplex={(code) => setActiveComplexCode(code)}
        organisationalUnits={organisationalUnits}
        onOpenAuth={(mode) => {
          setAuthInitialMode(mode || 'login');
          setAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        onOpenCreateProblem={() => setCreateProblemOpen(true)}
        notifications={notifications}
        onOpenNotifications={() => setNotificationsOpen(true)}
        showDemoData={showDemoData}
        onToggleDemoData={setShowDemoData}
        hasDemoData={hasDemoData}
        discussionsUnreadCount={discussionsUnreadCount}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
        {(activeTab === 'home' || (activeTab === 'dashboard' && currentRole === 'public')) && (
          <LandingView
            stats={stats}
            problemStatements={visibleProblemStatements}
            organisationalUnits={organisationalUnits}
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

        {activeTab === 'dashboard' && currentRole !== 'public' && (
          <ExecutiveDashboardView
            currentRole={currentRole}
            currentUser={currentUser}
            stats={stats}
            organisationalUnits={organisationalUnits}
            problemStatements={visibleProblemStatements}
            budgetaryRequests={visibleBudgetaryRequests}
            discussions={visibleDiscussions}
            proposals={visibleProposals}
            projects={visibleProjects}
            pocs={visiblePocs}
            awards={visibleAwards}
            vendors={visibleVendors}
            activeComplexCode={activeComplexCode}
            setActiveComplexCode={(code) => setActiveComplexCode(code)}
            showDemoData={showDemoData}
            hasDemoData={hasDemoData}
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

        {activeTab === 'mines' && (
          <MineSelectionView
            organisationalUnits={organisationalUnits}
            activeComplexCode={activeComplexCode}
            onSelectComplex={(code) => setActiveComplexCode(code)}
            onNavigateTab={(tab) => setActiveTab(tab)}
            currentUser={currentUser}
            currentRole={currentRole}
            problemStatements={visibleProblemStatements}
            budgetaryRequests={visibleBudgetaryRequests}
            proposals={visibleProposals}
            pocs={visiblePocs}
            awards={visibleAwards}
            projects={visibleProjects}
          />
        )}

        {(activeTab === 'problems' || activeTab === 'challenges') && (
          <ChallengesView
            problemStatements={visibleProblemStatements}
            organisationalUnits={organisationalUnits}
            currentRole={currentRole}
            currentUser={currentUser}
            currentVendor={currentVendorObj}
            activeComplexCode={activeComplexCode}
            onSelectComplex={(code) => setActiveComplexCode(code)}
            onOpenProposalWizard={(ps) => setSelectedPsForProposal(ps)}
            onOpenCompareMatrix={(ps) => setSelectedPsForCompare(ps)}
            onOpenDiscussionForPs={(ps) => {
              setPreselectedDiscussionEntity({
                type: 'PROBLEM',
                id: ps.id,
                code: ps.code,
                title: ps.title,
                mineComplexCode: ps.mineComplexCode,
              });
              setActiveTab('discussions');
            }}
            onOpenCreateChallenge={() => setCreateProblemOpen(true)}
            onRefreshData={loadAllData}
          />
        )}

        {activeTab === 'budgetary' && (
          <BudgetaryOffersView
            budgetaryRequests={visibleBudgetaryRequests}
            problemStatements={visibleProblemStatements}
            proposals={visibleProposals}
            vendors={visibleVendors}
            currentUser={currentUser}
            currentRole={currentRole}
            activeComplexCode={activeComplexCode}
            organisationalUnits={organisationalUnits}
            onOpenProposalForBor={(bor) => setSelectedBorForProposal(bor)}
            onOpenDiscussionForBor={(bor) => {
              setPreselectedDiscussionEntity({
                type: 'BUDGETARY_REQUEST',
                id: bor.id,
                code: bor.requestCode,
                title: bor.title,
                mineComplexCode: bor.mineComplexCode,
              });
              setActiveTab('discussions');
            }}
            onRefreshData={loadAllData}
          />
        )}

        {activeTab === 'vendors' && (
          <VendorsView
            vendors={visibleVendors}
            currentRole={currentRole}
            onOpenRegisterVendor={() => {
              setAuthInitialMode('register-vendor');
              setAuthModalOpen(true);
            }}
            onRefreshVendors={loadAllData}
          />
        )}

        {activeTab === 'proposals' && (
          <ProposalsView
            proposals={visibleProposals}
            problemStatements={visibleProblemStatements}
            organisationalUnits={organisationalUnits}
            mode="responses"
            currentRole={currentRole}
            currentUser={currentUser}
            activeComplexCode={activeComplexCode}
            parameters={parameters}
            onOpenEvaluate={(p) => setSelectedProposalForEvaluation(p)}
            onOpenCompare={(ps) => setSelectedPsForCompare(ps)}
            onRefreshData={loadAllData}
          />
        )}

        {activeTab === 'discussions' && (
          <DiscussionsView
            discussions={visibleDiscussions}
            problemStatements={visibleProblemStatements}
            budgetaryRequests={visibleBudgetaryRequests}
            vendors={visibleVendors}
            currentUser={currentUser}
            currentRole={currentRole}
            organisationalUnits={organisationalUnits}
            preselectedEntity={preselectedDiscussionEntity}
            onClearPreselected={() => setPreselectedDiscussionEntity(null)}
            onRefreshData={loadAllData}
          />
        )}

        {activeTab === 'evaluation' && (
          <ProposalsView
            proposals={visibleProposals}
            problemStatements={visibleProblemStatements}
            organisationalUnits={organisationalUnits}
            mode="evaluation"
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
            organisationalUnits={organisationalUnits}
            currentRole={currentRole}
            currentUser={currentUser}
            activeComplexCode={activeComplexCode}
            showDemoData={showDemoData}
            onRefreshData={loadAllData}
          />
        )}

        {activeTab === 'awards' && (
          <AwardsView
            awards={visibleAwards}
            organisationalUnits={organisationalUnits}
            currentRole={currentRole}
            currentUser={currentUser}
            activeComplexCode={activeComplexCode}
            problemStatements={visibleProblemStatements}
            proposals={visibleProposals}
            onRefreshData={loadAllData}
            onNavigateToProjects={() => setActiveTab('projects')}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectsView
            projects={visibleProjects}
            organisationalUnits={organisationalUnits}
            currentRole={currentRole}
            currentUser={currentUser}
            activeComplexCode={activeComplexCode}
            onRefreshProjects={loadAllData}
          />
        )}

        {activeTab === 'employee_master' && (
          <EmployeeMasterView
            currentUser={currentUser}
            currentRole={currentRole}
            organisationalUnits={organisationalUnits}
            onRefreshData={loadAllData}
          />
        )}

        {activeTab === 'mis_reports' && (
          <MisReportsView
            problemStatements={problemStatements}
            budgetaryRequests={budgetaryRequests}
            vendors={vendors}
            proposals={proposals}
            pocs={pocs}
            awards={awards}
            projects={projects}
            organisationalUnits={organisationalUnits}
            currentRole={currentRole}
          />
        )}

        {activeTab === 'admin' && (
          <AdministrationView
            currentRole={currentRole}
            organisationalUnits={organisationalUnits}
            hasDemoData={hasDemoData}
            onLoadDemoData={handleLoadDemoData}
            onClearDemoData={handleClearDemoData}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onRefreshData={loadAllData}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            stats={stats}
            projects={visibleProjects}
            problemStatements={visibleProblemStatements}
            proposals={visibleProposals}
            pocs={visiblePocs}
            vendors={visibleVendors}
            activeComplexCode={activeComplexCode}
            onNavigateToSheets={() => setActiveTab('sheets')}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            problemStatements={visibleProblemStatements}
            vendors={visibleVendors}
            proposals={visibleProposals}
            pocs={visiblePocs}
            awards={visibleAwards}
            projects={visibleProjects}
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
            problemStatements={visibleProblemStatements}
            projects={visibleProjects}
            currentRole={currentRole}
            currentUser={currentUser}
            onRefreshData={loadAllData}
          />
        )}
      </main>

      {/* Simple Clean Corporate Footer */}
      <footer className="bg-white text-slate-600 text-xs border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/aistudio/nmdc_logo_72562162.jpg"
              alt="NMDC Limited Logo"
              className="h-8 w-auto object-contain bg-white rounded p-0.5 border border-slate-200 shrink-0"
            />
            <span className="font-bold text-slate-900">NMDC Limited</span>
            <span className="text-slate-300">·</span>
            <span>5 Organisational Units (HO, DIOM, KIOM, Bacheli, Kirandul)</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <button onClick={handleLogout} className="hover:text-blue-700 font-semibold transition-colors">
              Sign In / Switch Account
            </button>
            <span>·</span>
            <button onClick={() => setActiveTab('mis_reports')} className="hover:text-blue-700 font-semibold transition-colors">
              MIS Reports
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authInitialMode}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setCurrentRole(user.role);
          if (user.mineComplexCode && user.mineComplexCode !== 'ALL') {
            setActiveComplexCode(user.mineComplexCode);
          } else {
            setActiveComplexCode('ALL');
          }
          setActiveTab('dashboard');
          loadAllData();
        }}
      />

      <CreateProblemStatementModal
        isOpen={createProblemOpen}
        onClose={() => setCreateProblemOpen(false)}
        onSuccess={loadAllData}
        currentUser={currentUser}
        defaultComplexCode={activeComplexCode}
        organisationalUnits={organisationalUnits}
      />

      {(selectedPsForProposal || selectedBorForProposal) && (
        <ProposalWizardModal
          isOpen={true}
          onClose={() => {
            setSelectedPsForProposal(null);
            setSelectedBorForProposal(null);
          }}
          problemStatement={selectedPsForProposal}
          budgetaryRequest={selectedBorForProposal}
          vendor={currentVendorObj}
          onSubmitSuccess={loadAllData}
        />
      )}

      {selectedPsForCompare && (
        <ProposalComparisonModal
          isOpen={true}
          onClose={() => setSelectedPsForCompare(null)}
          problemStatement={selectedPsForCompare}
          proposals={visibleProposals}
        />
      )}

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

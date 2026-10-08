import React, { useState, useEffect } from 'react';
import { 
  UserRole, 
  User, 
  PortalStats, 
  ProblemStatement, 
  Idea, 
  Proposal, 
  Project, 
  Vendor, 
  EvaluationParameter, 
  AppNotification, 
  ActivityLog,
  ProposalAIReview
} from './types/index.js';
import { Header } from './components/Header.js';
import { NotificationDrawer } from './components/NotificationDrawer.js';
import { AiAssistantModal } from './components/AiAssistantModal.js';
import { ProposalWizardModal } from './components/ProposalWizardModal.js';
import { IdeaSubmissionModal } from './components/IdeaSubmissionModal.js';
import { ProposalComparisonModal } from './components/ProposalComparisonModal.js';
import { ReviewerEvaluationModal } from './components/ReviewerEvaluationModal.js';
import { AiProposalAnalysisDrawer } from './components/AiProposalAnalysisDrawer.js';
import { CreateProblemStatementModal } from './components/CreateProblemStatementModal.js';
import { AdminConfigModal } from './components/AdminConfigModal.js';
import { PostProblemModal } from './components/PostProblemModal.js';
import { ProblemToSolutionEngineModal } from './components/ProblemToSolutionEngineModal.js';

import { PortalLoginPage } from './views/PortalLoginPage.js';
import { LandingView } from './views/LandingView.js';
import { ChallengesView } from './views/ChallengesView.js';
import { IdeasView } from './views/IdeasView.js';
import { ProposalsView } from './views/ProposalsView.js';
import { ProjectsView } from './views/ProjectsView.js';
import { AnalyticsView } from './views/AnalyticsView.js';
import { ActivityMonitorView } from './views/ActivityMonitorView.js';
import { VendorsView } from './views/VendorsView.js';
import { PocManagementView } from './views/PocManagementView.js';
import { VendorMarketplaceView } from './views/VendorMarketplaceView.js';
import { KnowledgeRepositoryView } from './views/KnowledgeRepositoryView.js';
import { GoogleSheetsView } from './views/GoogleSheetsView.js';
import { AuthModal } from './views/AuthModal.js';

import { fetchApi } from './utils/api.js';

export function App() {
  // Authentication Gateway state:
  // Starts with login page before main portal as requested!
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentRole, setCurrentRole] = useState<UserRole>('executive');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [activeTab, setActiveTab] = useState<string>('home');

  // Core Portal Data
  const [stats, setStats] = useState<PortalStats>({
    totalIdeas: 10,
    activeChallenges: 8,
    registeredVendors: 6,
    proposalsReceived: 12,
    pocsUnderExecution: 2,
    projectsUnderImplementation: 3,
    projectsCompleted: 1,
    estimatedAnnualSavingsCr: 18.25,
    realisedSavingsCr: 6.15,
    aiSolutionsImplemented: 4,
  });

  const [problemStatements, setProblemStatements] = useState<ProblemStatement[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [parameters, setParameters] = useState<EvaluationParameter[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register-exec' | 'register-vendor'>('login');
  const [submitIdeaOpen, setSubmitIdeaOpen] = useState(false);
  const [postProblemOpen, setPostProblemOpen] = useState(false);
  const [solutionEngineOpen, setSolutionEngineOpen] = useState(false);

  const [selectedPsForProposal, setSelectedPsForProposal] = useState<ProblemStatement | null>(null);
  const [selectedPsForCompare, setSelectedPsForCompare] = useState<ProblemStatement | null>(null);
  const [selectedProposalForEvaluation, setSelectedProposalForEvaluation] = useState<Proposal | null>(null);
  const [selectedProposalForAi, setSelectedProposalForAi] = useState<Proposal | null>(null);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [createChallengeOpen, setCreateChallengeOpen] = useState(false);
  const [adminConfigOpen, setAdminConfigOpen] = useState(false);

  // Load all initial data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [sRes, psRes, idRes, prRes, projRes, vRes, paramRes, notifRes, actRes] = await Promise.allSettled([
        fetchApi('/api/stats'),
        fetchApi('/api/problems'),
        fetchApi('/api/ideas'),
        fetchApi('/api/proposals'),
        fetchApi('/api/projects'),
        fetchApi('/api/vendors'),
        fetchApi('/api/evaluation-parameters'),
        fetchApi('/api/notifications'),
        fetchApi('/api/activities'),
      ]);

      if (sRes.status === 'fulfilled' && sRes.value.success) setStats(sRes.value.data);
      if (psRes.status === 'fulfilled' && psRes.value.success) setProblemStatements(psRes.value.data);
      if (idRes.status === 'fulfilled' && idRes.value.success) setIdeas(idRes.value.data);
      if (prRes.status === 'fulfilled' && prRes.value.success) setProposals(prRes.value.data);
      if (projRes.status === 'fulfilled' && projRes.value.success) setProjects(projRes.value.data);
      if (vRes.status === 'fulfilled' && vRes.value.success) setVendors(vRes.value.data);
      if (paramRes.status === 'fulfilled' && paramRes.value.success) setParameters(paramRes.value.data);
      if (notifRes.status === 'fulfilled' && notifRes.value.success) setNotifications(notifRes.value.data);
      if (actRes.status === 'fulfilled' && actRes.value.success) setActivities(actRes.value.data);
    } catch (e) {
      console.error('Data load error:', e);
    }
  };

  const handleSwitchRole = (role: UserRole) => {
    setCurrentRole(role);
    if (role === 'public') {
      setCurrentUser(null);
    } else if (role === 'executive') {
      setCurrentUser({
        id: 'usr-exec-1',
        email: 'executive@nmdc.co.in',
        name: 'Dr. Amitabh Verma',
        role: 'executive',
        department: 'Mining & HEMM Engineering',
        employeeId: 'NMDC-BAI-4089',
        designation: 'General Manager (Mining)',
        projectComplex: 'Bailadila Deposit 5 (Kirandul)',
        createdAt: '2025-02-01T09:30:00Z',
      });
    } else if (role === 'vendor') {
      setCurrentUser({
        id: 'usr-vendor-1',
        email: 'vendor@miningtech.in',
        name: 'Ananya Deshmukh',
        role: 'vendor',
        vendorId: 'vnd-001',
        designation: 'Head of Industrial AI',
        createdAt: '2025-02-10T14:15:00Z',
      });
    } else if (role === 'reviewer') {
      setCurrentUser({
        id: 'usr-reviewer-1',
        email: 'reviewer@nmdc.co.in',
        name: 'Shri S. K. Nayak',
        role: 'reviewer',
        department: 'Technical Committee (R&D & Mine Safety)',
        employeeId: 'NMDC-RES-2104',
        designation: 'Chief General Manager (R&D)',
        projectComplex: 'R&D Centre, Hyderabad',
        createdAt: '2025-01-20T11:00:00Z',
      });
    } else if (role === 'project_manager') {
      setCurrentUser({
        id: 'usr-pm-1',
        email: 'pm@nmdc.co.in',
        name: 'V. Rajeshwar Rao',
        role: 'project_manager',
        department: 'Electrical & Automation',
        employeeId: 'NMDC-DON-3112',
        designation: 'Deputy General Manager (Projects)',
        projectComplex: 'Donimalai Iron Ore Mine, Karnataka',
        createdAt: '2025-02-15T08:45:00Z',
      });
    } else if (role === 'admin') {
      setCurrentUser({
        id: 'usr-admin-1',
        email: 'admin@nmdc.co.in',
        name: 'Shri R. K. Sharma',
        role: 'admin',
        department: 'Corporate IT & Digital Transformation',
        employeeId: 'NMDC-CORP-0104',
        designation: 'Executive Director (Digital & IT)',
        projectComplex: 'Corporate Office Hyderabad',
        createdAt: '2025-01-15T10:00:00Z',
      });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentRole('public');
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

  // 1. RENDER LOGIN PAGE BEFORE MAIN PORTAL IF NOT AUTHENTICATED
  if (!isAuthenticated) {
    return (
      <PortalLoginPage
        stats={stats}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setCurrentRole(user.role);
          setIsAuthenticated(true);
          loadAllData();
        }}
        onExploreAsPublic={() => {
          setCurrentUser(null);
          setCurrentRole('public');
          setIsAuthenticated(true);
        }}
      />
    );
  }

  // 2. RENDER MAIN AUTHENTICATED WORKSPACE
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Universal Top Bar */}
      <Header
        currentRole={currentRole}
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSwitchRole={handleSwitchRole}
        onOpenAuth={(mode) => {
          setAuthInitialMode(mode || 'login');
          setAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        onOpenAiAssistant={() => setAiAssistantOpen(true)}
        onOpenPostProblem={() => setPostProblemOpen(true)}
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
            onOpenSubmitIdea={() => setSubmitIdeaOpen(true)}
            onOpenRegisterVendor={() => {
              setAuthInitialMode('register-vendor');
              setAuthModalOpen(true);
            }}
            onSelectProblemStatement={(ps) => {
              setSelectedPsForProposal(ps);
            }}
          />
        )}

        {activeTab === 'challenges' && (
          <ChallengesView
            problemStatements={problemStatements}
            currentRole={currentRole}
            currentVendor={currentVendorObj}
            onOpenProposalWizard={(ps) => setSelectedPsForProposal(ps)}
            onOpenCompareMatrix={(ps) => setSelectedPsForCompare(ps)}
            onOpenCreateChallenge={() => setCreateChallengeOpen(true)}
          />
        )}

        {activeTab === 'ideas' && (
          <IdeasView
            ideas={ideas}
            currentRole={currentRole}
            currentUser={currentUser}
            onOpenSubmitIdea={() => setSubmitIdeaOpen(true)}
            onRefreshIdeas={loadAllData}
            onNavigateToSheets={() => setActiveTab('sheets')}
          />
        )}

        {activeTab === 'engine' && (
          <div className="space-y-6 pb-12">
            <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-white p-8 rounded-2xl text-slate-900 shadow-xs border border-blue-200/80 space-y-4">
              <div>
                <span className="text-xs font-mono text-blue-700 font-bold uppercase tracking-wider block">
                  PILLAR 2: SOLVE · AUTOMATED ARCHITECTURE SYNTHESIS
                </span>
                <h1 className="text-2xl font-bold text-slate-900">AI Problem-to-Solution Engine</h1>
                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mt-1">
                  Enter operational mining bottlenecks to automatically generate 5 technical solutions, required sensor & GPS data points, expected KPIs, and convert with 1-click into formal NMDC Problem Statements.
                </p>
              </div>

              <button
                onClick={() => setSolutionEngineOpen(true)}
                className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-sm transition-colors text-xs flex items-center gap-2"
              >
                <span>Launch Interactive Solution Engine</span>
              </button>
            </div>

            {/* Embedded problem to solution quick launcher */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <span className="font-mono text-blue-700 font-bold text-xs">01. FLEET DOWNTIME</span>
                <h3 className="font-bold text-slate-900">Excessive Idle Time of Dumpers</h3>
                <p className="text-slate-600 text-[11px]">
                  Generates dynamic dispatch, queue prediction, GPS telematics and cycle-time KPIs.
                </p>
                <button
                  onClick={() => setSolutionEngineOpen(true)}
                  className="text-blue-700 font-semibold pt-1 text-[11px] block hover:underline"
                >
                  Run Engine for Dumpers →
                </button>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <span className="font-mono text-blue-700 font-bold text-xs">02. CRUSHER CHUTE JAM</span>
                <h3 className="font-bold text-slate-900">Primary Crusher Boulder Blockages</h3>
                <p className="text-slate-600 text-[11px]">
                  Generates 3D stereo vision, breaker automation, size distribution curve and MTBF metrics.
                </p>
                <button
                  onClick={() => setSolutionEngineOpen(true)}
                  className="text-blue-700 font-semibold pt-1 text-[11px] block hover:underline"
                >
                  Run Engine for Crushers →
                </button>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <span className="font-mono text-blue-700 font-bold text-xs">03. SLURRY CORRIDOR</span>
                <h3 className="font-bold text-slate-900">Slurry Pipeline Scale & Pressure Drop</h3>
                <p className="text-slate-600 text-[11px]">
                  Generates acoustic leak detection, pigging optimization, and viscous head loss KPIs.
                </p>
                <button
                  onClick={() => setSolutionEngineOpen(true)}
                  className="text-blue-700 font-semibold pt-1 text-[11px] block hover:underline"
                >
                  Run Engine for Pipeline →
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pocs' && (
          <PocManagementView
            currentRole={currentRole}
            currentUser={currentUser}
            onRefreshData={loadAllData}
          />
        )}

        {activeTab === 'vendor-marketplace' && (
          <VendorMarketplaceView
            currentRole={currentRole}
            currentUser={currentUser}
            onRefreshVendors={loadAllData}
          />
        )}

        {activeTab === 'knowledge' && (
          <KnowledgeRepositoryView
            currentRole={currentRole}
            currentUser={currentUser}
            onNavigateToSubmitIdea={() => setSubmitIdeaOpen(true)}
          />
        )}

        {activeTab === 'proposals' && (
          <ProposalsView
            proposals={proposals}
            problemStatements={problemStatements}
            currentRole={currentRole}
            currentUser={currentUser}
            parameters={parameters}
            onOpenEvaluate={(p) => setSelectedProposalForEvaluation(p)}
            onOpenCompare={(ps) => setSelectedPsForCompare(ps)}
            onOpenAiAnalysis={(p) => setSelectedProposalForAi(p)}
            onRefreshData={loadAllData}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectsView
            projects={projects}
            currentRole={currentRole}
            currentUser={currentUser}
            onRefreshProjects={loadAllData}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            stats={stats}
            projects={projects}
            ideas={ideas}
            proposals={proposals}
            onNavigateToSheets={() => setActiveTab('sheets')}
          />
        )}

        {activeTab === 'activity' && (
          <ActivityMonitorView
            initialActivities={activities}
            currentRole={currentRole}
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

        {activeTab === 'sheets' && (
          <GoogleSheetsView
            ideas={ideas}
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
                CIN: L13100TG1958GOI000774 · Vision 2030
              </div>
            </div>

            <div className="space-y-2.5">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">Corporate Office</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                "Khanij Bhavan", 10-3-311/A, Castle Hills, Masab Tank, Hyderabad, Telangana 500028, India.
              </p>
              <p className="text-xs sm:text-sm text-slate-600">
                Phone: +91 40 2222 1800<br />
                Email: innovation@nmdc.co.in
              </p>
            </div>

            <div className="space-y-2.5">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">Operating Complexes</h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li>• Bailadila Iron Ore Mine, Deposit-5 (Kirandul)</li>
                <li>• Bailadila Iron Ore Mine, Deposit-14/11C (Bacheli)</li>
                <li>• Donimalai Iron Ore Mine (Bellary, Karnataka)</li>
                <li>• Kumaraswamy Iron Ore Mine (Karnataka)</li>
                <li>• Diamond Mining Project (Majhgawan, Panna, MP)</li>
                <li>• Pellets Plant & Beneficiation (Visakhapatnam)</li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">Five Connected Pillars</h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li>
                  <button onClick={() => setActiveTab('ideas')} className="hover:text-blue-700 transition-colors">
                    1. INNOVATE: Grassroots Problem Identification
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('challenges')} className="hover:text-blue-700 transition-colors">
                    2. SOLVE: Open Technology Marketplace
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('proposals')} className="hover:text-blue-700 transition-colors">
                    3. EVALUATE: 70/30 Dual-Track & AI Review
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('pocs')} className="hover:text-blue-700 transition-colors">
                    4. IMPLEMENT: PoC → Pilot → Rollout
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('analytics')} className="hover:text-blue-700 transition-colors">
                    5. MEASURE: Audited Bottom-line RoI
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              © 2026 NMDC Limited. All Rights Reserved. Innovation, AI & Digital Transformation Platform.
            </div>
            <div className="flex items-center gap-4 text-slate-500">
              <button onClick={() => setIsAuthenticated(false)} className="hover:text-slate-900 transition-colors">
                Return to Login Page
              </button>
              <span>·</span>
              <button onClick={() => setAdminConfigOpen(true)} className="hover:text-slate-900 transition-colors">
                Admin Evaluation Weights
              </button>
              <span>·</span>
              <button onClick={() => setAiAssistantOpen(true)} className="hover:text-blue-700 text-blue-700 font-semibold transition-colors">
                AI Assistant
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
          loadAllData();
        }}
      />

      {/* 2. Employee Idea Submission Modal (with duplicate detector & innovation score) */}
      <IdeaSubmissionModal
        isOpen={submitIdeaOpen}
        onClose={() => setSubmitIdeaOpen(false)}
        currentUser={currentUser}
        onSubmitSuccess={loadAllData}
      />

      {/* 3. POST A PROBLEM Modal (Simplified Field Entry with AI Structuring) */}
      <PostProblemModal
        isOpen={postProblemOpen}
        onClose={() => setPostProblemOpen(false)}
        currentUser={currentUser}
        onSubmitSuccess={loadAllData}
      />

      {/* 4. AI Problem-to-Solution Engine Modal */}
      <ProblemToSolutionEngineModal
        isOpen={solutionEngineOpen}
        onClose={() => setSolutionEngineOpen(false)}
        onConvertToProblemStatement={async (statementData) => {
          try {
            await fetchApi('/api/problems', {
              method: 'POST',
              body: JSON.stringify({
                title: statementData.title,
                department: currentUser?.department || 'Mining & HEMM Engineering',
                projectComplex: currentUser?.projectComplex || 'Bailadila Deposit 5',
                category: 'Fleet Management',
                problemDescription: statementData.description,
                currentProcess: 'Manual shift telemetry logging.',
                currentDifficulties: 'High equipment idle time and fuel loss.',
                rootCause: 'Lack of dynamic real-time dispatch and queue sensing.',
                expectedOutcome: statementData.expectedOutcome,
                budgetaryIndication: '₹ 1.20 - 1.80 Cr',
                submissionDeadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString().split('T')[0],
                equipmentAffected: 'BH100S 100-Tonne Dumpers',
                aiSuggestedKeywords: statementData.keywords,
              }),
            });
            loadAllData();
            setActiveTab('challenges');
          } catch (e: any) {
            alert(`Failed to save problem statement: ${e.message}`);
          }
        }}
      />

      {/* 5. Vendor Proposal Wizard Modal */}
      {selectedPsForProposal && (
        <ProposalWizardModal
          isOpen={true}
          onClose={() => setSelectedPsForProposal(null)}
          problemStatement={selectedPsForProposal}
          vendor={currentVendorObj}
          onSubmitSuccess={loadAllData}
        />
      )}

      {/* 6. Proposal Comparison Matrix Modal */}
      {selectedPsForCompare && (
        <ProposalComparisonModal
          isOpen={true}
          onClose={() => setSelectedPsForCompare(null)}
          problemStatement={selectedPsForCompare}
          proposals={proposals}
          onSelectAiAnalysis={(prop) => {
            setSelectedProposalForAi(prop);
          }}
        />
      )}

      {/* 7. Reviewer Evaluation Modal */}
      {selectedProposalForEvaluation && (
        <ReviewerEvaluationModal
          isOpen={true}
          onClose={() => setSelectedProposalForEvaluation(null)}
          proposal={selectedProposalForEvaluation}
          parameters={parameters}
          reviewerName={currentUser?.name || 'Reviewer'}
          onEvaluationSuccess={loadAllData}
        />
      )}

      {/* 8. AI Proposal Analysis Drawer */}
      <AiProposalAnalysisDrawer
        isOpen={!!selectedProposalForAi}
        onClose={() => setSelectedProposalForAi(null)}
        proposal={selectedProposalForAi}
        onUpdateAnalysis={(updatedReview: ProposalAIReview) => {
          if (selectedProposalForAi) {
            selectedProposalForAi.aiReview = updatedReview;
          }
        }}
      />

      {/* 9. AI Innovation Assistant Chat */}
      <AiAssistantModal
        isOpen={aiAssistantOpen}
        onClose={() => setAiAssistantOpen(false)}
        userRole={currentRole}
      />

      {/* 10. Notification Center */}
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

      {/* 11. Create Challenge Modal (Admin) */}
      <CreateProblemStatementModal
        isOpen={createChallengeOpen}
        onClose={() => setCreateChallengeOpen(false)}
        onSuccess={loadAllData}
      />

      {/* 12. Admin Configuration Modal */}
      <AdminConfigModal
        isOpen={adminConfigOpen}
        onClose={() => setAdminConfigOpen(false)}
        parameters={parameters}
        onUpdateParameters={(up) => setParameters(up)}
      />
    </div>
  );
}
export default App;

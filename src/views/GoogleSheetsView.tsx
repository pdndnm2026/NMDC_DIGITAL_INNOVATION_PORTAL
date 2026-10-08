import React, { useState, useEffect } from 'react';
import { Idea, ProblemStatement, Project, UserRole, User } from '../types/index.js';
import { 
  FileSpreadsheet, 
  ExternalLink, 
  Download, 
  Upload, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Search, 
  FolderOpen, 
  LogOut, 
  Table, 
  ArrowRight,
  ShieldCheck,
  Eye,
  FilePlus,
  Database
} from 'lucide-react';
import { 
  googleSignIn, 
  logoutGoogle, 
  getAccessToken, 
  initAuth,
  auth
} from '../services/googleAuth.js';
import { 
  listSpreadsheets, 
  getSpreadsheetDetails, 
  getSpreadsheetValues, 
  createSpreadsheet, 
  exportIdeasToNewSheet, 
  exportChallengesToNewSheet, 
  exportProjectsToNewSheet,
  DriveSpreadsheetFile,
  SpreadsheetDetails 
} from '../services/googleSheets.js';
import { fetchApi } from '../utils/api.js';

interface GoogleSheetsViewProps {
  ideas: Idea[];
  problemStatements: ProblemStatement[];
  projects: Project[];
  currentRole: UserRole;
  currentUser: User | null;
  onRefreshData?: () => void;
}

export const GoogleSheetsView: React.FC<GoogleSheetsViewProps> = ({
  ideas,
  problemStatements,
  projects,
  currentRole,
  onRefreshData,
}) => {
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [spreadsheets, setSpreadsheets] = useState<DriveSpreadsheetFile[]>([]);
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Active preview state
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [selectedSheetDetails, setSelectedSheetDetails] = useState<SpreadsheetDetails | null>(null);
  const [activeTabName, setActiveTabName] = useState<string>('');
  const [sheetValues, setSheetValues] = useState<(string | number)[][]>([]);
  const [loadingValues, setLoadingValues] = useState(false);

  // Export action state
  const [exportingType, setExportingType] = useState<'ideas' | 'challenges' | 'projects' | null>(null);
  const [exportSuccessUrl, setExportSuccessUrl] = useState<string | null>(null);
  const [exportSuccessTitle, setExportSuccessTitle] = useState<string>('');

  // Mandatory confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionName: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    actionName: '',
    onConfirm: () => {},
  });

  // Import state
  const [importingIdeas, setImportingIdeas] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setAccessToken(token);
        fetchSpreadsheets(token);
      },
      () => {
        setGoogleUser(null);
        setAccessToken(null);
        setSpreadsheets([]);
      }
    );

    // Also check current auth state
    if (auth.currentUser) {
      getAccessToken().then((token) => {
        if (token) {
          setGoogleUser(auth.currentUser);
          setAccessToken(token);
          fetchSpreadsheets(token);
        }
      });
    }

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setAccessToken(result.accessToken);
        await fetchSpreadsheets(result.accessToken);
      }
    } catch (err: any) {
      alert(`Google Sign-In error: ${err.message || err}`);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logoutGoogle();
    setGoogleUser(null);
    setAccessToken(null);
    setSpreadsheets([]);
    setSelectedSheetId(null);
    setSelectedSheetDetails(null);
    setSheetValues([]);
  };

  const fetchSpreadsheets = async (token?: string) => {
    const tokenToUse = token || accessToken;
    if (!tokenToUse) return;

    setLoadingSheets(true);
    try {
      const files = await listSpreadsheets(tokenToUse);
      setSpreadsheets(files);
    } catch (err: any) {
      console.error('Failed to list spreadsheets:', err);
    } finally {
      setLoadingSheets(false);
    }
  };

  const handleSelectSpreadsheet = async (sheetFile: DriveSpreadsheetFile) => {
    if (!accessToken) return;
    setSelectedSheetId(sheetFile.id);
    setLoadingValues(true);
    try {
      const details = await getSpreadsheetDetails(accessToken, sheetFile.id);
      setSelectedSheetDetails(details);
      
      // Load first sheet tab
      const firstTab = details.sheets[0]?.title || 'Sheet1';
      setActiveTabName(firstTab);
      
      const valuesRes = await getSpreadsheetValues(accessToken, sheetFile.id, `${firstTab}!A1:Z50`);
      setSheetValues(valuesRes.values);
    } catch (err: any) {
      alert(`Failed to load sheet details: ${err.message}`);
    } finally {
      setLoadingValues(false);
    }
  };

  const handleSwitchTab = async (tabName: string) => {
    if (!accessToken || !selectedSheetId) return;
    setActiveTabName(tabName);
    setLoadingValues(true);
    try {
      const valuesRes = await getSpreadsheetValues(accessToken, selectedSheetId, `${tabName}!A1:Z50`);
      setSheetValues(valuesRes.values);
    } catch (err: any) {
      alert(`Failed to load tab values: ${err.message}`);
    } finally {
      setLoadingValues(false);
    }
  };

  // Export handlers with explicit confirmation dialog (Mandatory per Google Workspace integration skill)
  const triggerExportIdeas = () => {
    if (!accessToken) {
      handleSignIn();
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: 'Export NMDC Innovation Ideas to Google Sheet?',
      description: `This will create a new Google Spreadsheet in your Google Drive containing ${ideas.length} recorded employee ideas with status, department, and financial savings.`,
      actionName: 'Create & Export Sheet',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        setExportingType('ideas');
        try {
          const res = await exportIdeasToNewSheet(accessToken, ideas);
          setExportSuccessUrl(res.spreadsheetUrl);
          setExportSuccessTitle(`NMDC Innovation Portal - Employee Ideas Register`);
          fetchSpreadsheets(accessToken);
        } catch (err: any) {
          alert(`Export failed: ${err.message}`);
        } finally {
          setExportingType(null);
        }
      },
    });
  };

  const triggerExportChallenges = () => {
    if (!accessToken) {
      handleSignIn();
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: 'Export Active Challenges to Google Sheet?',
      description: `This will create a new Google Spreadsheet in your Google Drive containing ${problemStatements.length} published NMDC challenges with budgetary indication and vendor response counts.`,
      actionName: 'Create & Export Sheet',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        setExportingType('challenges');
        try {
          const res = await exportChallengesToNewSheet(accessToken, problemStatements);
          setExportSuccessUrl(res.spreadsheetUrl);
          setExportSuccessTitle(`NMDC Innovation Portal - Active Challenges`);
          fetchSpreadsheets(accessToken);
        } catch (err: any) {
          alert(`Export failed: ${err.message}`);
        } finally {
          setExportingType(null);
        }
      },
    });
  };

  const triggerExportProjects = () => {
    if (!accessToken) {
      handleSignIn();
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: 'Export Projects & PoCs to Google Sheet?',
      description: `This will create a new Google Spreadsheet in your Google Drive with ${projects.length} field implementation projects, budgets, and milestones.`,
      actionName: 'Create & Export Sheet',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        setExportingType('projects');
        try {
          const res = await exportProjectsToNewSheet(accessToken, projects);
          setExportSuccessUrl(res.spreadsheetUrl);
          setExportSuccessTitle(`NMDC Innovation Portal - Project Register`);
          fetchSpreadsheets(accessToken);
        } catch (err: any) {
          alert(`Export failed: ${err.message}`);
        } finally {
          setExportingType(null);
        }
      },
    });
  };

  // Import ideas from currently previewed Google Sheet
  const handleImportCurrentSheet = () => {
    if (!sheetValues || sheetValues.length < 2) {
      alert('The current sheet does not contain enough data rows to import ideas.');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: `Import Ideas from "${selectedSheetDetails?.title}"?`,
      description: `We will inspect ${sheetValues.length - 1} rows from this Google Spreadsheet and import new innovation ideas into the NMDC database.`,
      actionName: 'Confirm & Import Rows',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        setImportingIdeas(true);
        try {
          const headers = sheetValues[0].map((h) => String(h).toLowerCase());
          let importedCount = 0;

          // Process rows
          for (let i = 1; i < sheetValues.length; i++) {
            const row = sheetValues[i];
            if (!row || row.length === 0 || !row[0]) continue;

            const title = String(row[1] || row[0] || 'Imported Idea from Sheet');
            const department = String(row[2] || 'Mining & HEMM Engineering');
            const submitter = String(row[3] || 'Google Sheet Importer');
            const problem = String(row[9] || row[4] || 'Identified via spreadsheet data sync');
            const proposed = String(row[10] || row[5] || 'Proposed technical solution');
            const impact = String(row[11] || row[6] || 'Operational improvement');

            await fetchApi('/api/ideas', {
              method: 'POST',
              body: JSON.stringify({
                title,
                department,
                submitterName: submitter,
                designation: 'Senior Executive',
                problemIdentified: problem,
                proposedInnovation: proposed,
                expectedImpact: impact,
                estimatedAnnualSavings: '₹ 25 Lakhs',
              }),
            });
            importedCount++;
          }

          setImportResult(`Successfully imported ${importedCount} ideas from Google Sheet!`);
          if (onRefreshData) onRefreshData();
        } catch (err: any) {
          alert(`Import error: ${err.message}`);
        } finally {
          setImportingIdeas(false);
        }
      },
    });
  };

  const filteredSheets = spreadsheets.filter((s) =>
    s.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-emerald-700 font-bold tracking-wider uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              GOOGLE WORKSPACE INTEGRATION
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-medium">Google Sheets & Google Drive API v4</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
            <span>NMDC Google Sheets Integration Hub</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Synchronize, export, and inspect innovation ideas, tender challenges, and PoC registers directly with Google Sheets.
          </p>
        </div>

        {/* Google Auth Status / Login Button */}
        <div>
          {accessToken && googleUser ? (
            <div className="flex items-center gap-3 bg-white p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200 shadow-2xs">
              {googleUser.photoURL ? (
                <img
                  src={googleUser.photoURL}
                  alt={googleUser.displayName || 'Google User'}
                  className="w-8 h-8 rounded-full border border-slate-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                  G
                </div>
              )}
              <div className="text-left hidden sm:block">
                <span className="text-xs font-bold text-slate-800 block leading-tight">
                  {googleUser.displayName || 'Google User'}
                </span>
                <span className="text-[11px] text-slate-500 block leading-none truncate max-w-[150px]">
                  {googleUser.email}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Disconnect Google Account"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="gsi-material-button flex items-center gap-2.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl shadow-xs transition-all font-semibold text-xs sm:text-sm"
            >
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 shrink-0">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>{isSigningIn ? 'Connecting Google...' : 'Sign in with Google'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Bar */}
      {exportSuccessUrl && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-4 text-xs sm:text-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-3 text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <strong className="block font-bold">Spreadsheet Created Successfully!</strong>
              <span className="text-emerald-800">{exportSuccessTitle} is now live in your Google Drive.</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={exportSuccessUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
            >
              <span>Open in Google Sheets</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => setExportSuccessUrl(null)}
              className="text-emerald-700 hover:text-emerald-900 px-2 py-1 text-xs"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {importResult && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs sm:text-sm text-blue-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>{importResult}</span>
          </div>
          <button onClick={() => setImportResult(null)} className="text-blue-700 hover:underline text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Quick Action Cards: Export to Google Sheets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Ideas to Sheets */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-400 hover:shadow-sm transition-all group">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {ideas.length} Records
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-700 transition-colors">
              Export Employee Ideas
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Export all submitted innovation proposals, department allocations, innovation scores, and estimated annual savings to a formatted Google Sheet.
            </p>
          </div>

          <button
            onClick={triggerExportIdeas}
            disabled={exportingType === 'ideas'}
            className="w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-2xs flex items-center justify-center gap-2 transition-colors"
          >
            {exportingType === 'ideas' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <FilePlus className="w-4 h-4" />
            )}
            <span>Export to Google Sheet</span>
          </button>
        </div>

        {/* Card 2: Challenges to Sheets */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-400 hover:shadow-sm transition-all group">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <Table className="w-5 h-5" />
              </span>
              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {problemStatements.length} Challenges
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-700 transition-colors">
              Export Active Challenges
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Generate a spreadsheet containing published technical problem statements, deadlines, departments, budgets, and vendor response tallies.
            </p>
          </div>

          <button
            onClick={triggerExportChallenges}
            disabled={exportingType === 'challenges'}
            className="w-full py-2.5 px-3 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-2xs flex items-center justify-center gap-2 transition-colors"
          >
            {exportingType === 'challenges' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <FilePlus className="w-4 h-4" />
            )}
            <span>Export to Google Sheet</span>
          </button>
        </div>

        {/* Card 3: Projects to Sheets */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-purple-400 hover:shadow-sm transition-all group">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </span>
              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {projects.length} Pilots
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-base group-hover:text-purple-700 transition-colors">
              Export Projects & PoCs
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Create an executive spreadsheet with sanctioned pilot milestones, vendor contractors, budget utilization, and verified financial RoI.
            </p>
          </div>

          <button
            onClick={triggerExportProjects}
            disabled={exportingType === 'projects'}
            className="w-full py-2.5 px-3 bg-purple-700 hover:bg-purple-800 disabled:bg-slate-300 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-2xs flex items-center justify-center gap-2 transition-colors"
          >
            {exportingType === 'projects' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <FilePlus className="w-4 h-4" />
            )}
            <span>Export to Google Sheet</span>
          </button>
        </div>
      </div>

      {/* Main Workspace: Spreadsheet Explorer & Live Sheet Viewer */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-emerald-600" />
              <span>Google Drive Spreadsheet Explorer</span>
            </h2>
            <p className="text-xs text-slate-500">
              Browse, inspect, and interact with spreadsheets in your connected Google account.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {accessToken && (
              <button
                onClick={() => fetchSpreadsheets(accessToken)}
                disabled={loadingSheets}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingSheets ? 'animate-spin' : ''}`} />
                <span>Refresh Drive</span>
              </button>
            )}
          </div>
        </div>

        {!accessToken ? (
          /* When Google Account not connected */
          <div className="p-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Connect Google Sheets</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Sign in with your Google Account to browse spreadsheets from Google Drive, export NMDC datasets, or batch import ideas.
              </p>
            </div>
            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-colors inline-flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{isSigningIn ? 'Connecting...' : 'Connect Google Workspace'}</span>
            </button>
          </div>
        ) : (
          /* When connected */
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            {/* Left Column: List of Spreadsheets */}
            <div className="lg:col-span-4 p-4 space-y-3 max-h-[600px] overflow-y-auto">
              {/* Search filter */}
              <div className="relative text-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter spreadsheets..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {loadingSheets ? (
                <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>Loading Google Spreadsheets...</span>
                </div>
              ) : filteredSheets.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  {spreadsheets.length === 0
                    ? 'No spreadsheets found in Drive. Click "Export" above to create one!'
                    : 'No spreadsheets matched your filter.'}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredSheets.map((file) => {
                    const isSelected = selectedSheetId === file.id;
                    return (
                      <div
                        key={file.id}
                        onClick={() => handleSelectSpreadsheet(file)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'bg-emerald-50/80 border-emerald-400 shadow-2xs'
                            : 'bg-white border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-700' : 'text-slate-500'}`} />
                            <span className="font-semibold text-xs text-slate-900 truncate block">
                              {file.name}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block font-mono">
                            Modified: {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>

                        <a
                          href={file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}/edit`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-100 rounded transition-colors"
                          title="Open in Google Sheets"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Spreadsheet Viewer & Inspection */}
            <div className="lg:col-span-8 p-4 sm:p-6 space-y-4">
              {selectedSheetDetails ? (
                <div className="space-y-4">
                  {/* Sheet Header info & Tabs */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          PREVIEWING SHEET
                        </span>
                        <a
                          href={`https://docs.google.com/spreadsheets/d/${selectedSheetDetails.spreadsheetId}/edit`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-700 hover:underline flex items-center gap-1"
                        >
                          <span>Open in Sheets</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base mt-1">
                        {selectedSheetDetails.title}
                      </h3>
                    </div>

                    {/* Batch import action button */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleImportCurrentSheet}
                        disabled={importingIdeas}
                        className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors"
                        title="Import ideas found in this spreadsheet into NMDC portal"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{importingIdeas ? 'Importing...' : 'Import Ideas into Portal'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Tabs selector */}
                  {selectedSheetDetails.sheets.length > 1 && (
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
                      {selectedSheetDetails.sheets.map((tab) => (
                        <button
                          key={tab.title}
                          onClick={() => handleSwitchTab(tab.title)}
                          className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                            activeTabName === tab.title
                              ? 'bg-emerald-700 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {tab.title}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Table values preview */}
                  {loadingValues ? (
                    <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                      <span>Reading cell values from Google Sheets API...</span>
                    </div>
                  ) : sheetValues.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-xs">
                      No cell values found in this range.
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-[450px] shadow-2xs text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold sticky top-0 z-10">
                            <th className="p-2.5 text-center text-slate-400 font-mono w-10 border-r border-slate-200">#</th>
                            {sheetValues[0]?.map((cell, idx) => (
                              <th key={idx} className="p-2.5 font-semibold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                                {String(cell || `Col ${idx + 1}`)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {sheetValues.slice(1).map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-2.5 text-center font-mono text-slate-400 border-r border-slate-100">
                                {rIdx + 2}
                              </td>
                              {sheetValues[0]?.map((_, cIdx) => (
                                <td key={cIdx} className="p-2.5 text-slate-700 border-r border-slate-100 max-w-[250px] truncate">
                                  {String(row[cIdx] ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-16 text-center text-slate-400 space-y-2">
                  <Table className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="font-semibold text-slate-600 text-sm">Select a Spreadsheet to Inspect</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Click any spreadsheet on the left to read live rows, inspect columns, and import data into NMDC.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MANDATORY USER CONFIRMATION MODAL (per Google Workspace Integration Skill) */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base leading-snug">
                  {confirmDialog.title}
                </h3>
                <span className="text-xs text-slate-500">Google Workspace Operation</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {confirmDialog.description}
            </p>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{confirmDialog.actionName}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

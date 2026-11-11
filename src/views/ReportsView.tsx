import React, { useState } from 'react';
import { 
  ProblemStatement, 
  Vendor, 
  Proposal, 
  PocRecord, 
  AwardOfWork, 
  Project,
  UserRole,
  User,
  MineComplexCode,
  AUTHORIZED_MINE_COMPLEXES
} from '../types/index.js';
import { 
  DownloadCloud, 
  FileSpreadsheet, 
  Printer, 
  Filter, 
  FileText, 
  Search, 
  CheckCircle2, 
  Building2,
  Calendar,
  Layers,
  Award,
  TrendingUp,
  ShieldCheck,
  MapPin
} from 'lucide-react';

interface ReportsViewProps {
  problemStatements: ProblemStatement[];
  vendors: Vendor[];
  proposals: Proposal[];
  pocs: PocRecord[];
  awards: AwardOfWork[];
  projects: Project[];
  currentRole: UserRole;
  currentUser: User | null;
  activeComplexCode?: MineComplexCode | 'ALL';
}

type ReportType = 
  | 'problem_register' 
  | 'vendor_register' 
  | 'participation_report' 
  | 'comparative_statement' 
  | 'tech_eval_report' 
  | 'poc_register' 
  | 'awards_register' 
  | 'project_progress';

export const ReportsView: React.FC<ReportsViewProps> = ({
  problemStatements,
  vendors,
  proposals,
  pocs,
  awards,
  projects,
  currentRole,
  currentUser,
  activeComplexCode = 'ALL',
}) => {
  const [activeReport, setActiveReport] = useState<ReportType>('problem_register');
  const [selectedComplexFilter, setSelectedComplexFilter] = useState<string>(activeComplexCode);

  // Filter datasets by mine/complex
  const filteredProblems = problemStatements.filter(p => 
    selectedComplexFilter === 'ALL' || !p.mineComplexCode || p.mineComplexCode === selectedComplexFilter
  );

  const filteredProposals = proposals.filter(p => 
    selectedComplexFilter === 'ALL' || !p.mineComplexCode || p.mineComplexCode === selectedComplexFilter
  );

  const filteredPocs = pocs.filter(p => 
    selectedComplexFilter === 'ALL' || !p.mineComplexCode || p.mineComplexCode === selectedComplexFilter
  );

  const filteredAwards = awards.filter(a => 
    selectedComplexFilter === 'ALL' || !a.mineComplexCode || a.mineComplexCode === selectedComplexFilter
  );

  const filteredProjects = projects.filter(p => 
    selectedComplexFilter === 'ALL' || !p.mineComplexCode || p.mineComplexCode === selectedComplexFilter
  );

  // CSV Download Helper
  const downloadCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map(row => 
        row.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(',')
      )
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    switch (activeReport) {
      case 'problem_register': {
        const headers = ['Complex', 'Problem Code', 'Title', 'Department', 'Originating Officer', 'Category', 'Indicative Budget', 'Status', 'Date'];
        const rows = filteredProblems.map(p => [
          p.mineComplexCode || 'N/A', p.code, p.title, p.department, p.originatingOfficer, p.category, p.indicativeBudget, p.status, p.submissionDate
        ]);
        downloadCSV(`NMDC_Problem_Statement_Register_${selectedComplexFilter}`, headers, rows);
        break;
      }
      case 'vendor_register': {
        const headers = ['Vendor ID', 'Company Name', 'Legal Entity', 'CIN', 'PAN', 'GSTIN', 'MSME', 'Startup', 'Contact Person', 'Email', 'Status'];
        const rows = vendors.map(v => [
          v.id, v.name, v.legalEntity, v.cin, v.pan, v.gstin, v.msmeStatus ? 'YES' : 'NO', v.startupStatus ? 'YES' : 'NO', v.contactPerson, v.email, v.status
        ]);
        downloadCSV('NMDC_Vendor_Register', headers, rows);
        break;
      }
      case 'comparative_statement': {
        const headers = ['Complex', 'Proposal Code', 'Problem Code', 'Vendor Name', 'Technical Compliance', 'Basic Cost (INR)', 'GST 18% (INR)', 'Total Cost (INR)', 'Delivery (Weeks)', 'Validity (Days)', 'Status'];
        const rows = filteredProposals.map(pr => [
          pr.mineComplexCode || 'N/A', pr.proposalCode, pr.problemStatementCode, pr.vendorName, pr.technicalComplianceStatus || 'Compliant',
          pr.costBreakdown?.subtotalCost || 0, pr.costBreakdown?.gstAmount || 0, pr.costBreakdown?.totalEstimatedCost || 0,
          pr.commercialConditions?.deliveryPeriodWeeks || 0, pr.commercialConditions?.offerValidityDays || 90, pr.status
        ]);
        downloadCSV(`NMDC_Budgetary_Comparative_Statement_${selectedComplexFilter}`, headers, rows);
        break;
      }
      case 'tech_eval_report': {
        const headers = ['Complex', 'Proposal Code', 'Vendor', 'Marks Awarded', 'Max Marks', 'Compliance Status', 'Evaluator', 'Recommendation'];
        const rows = filteredProposals.map(pr => [
          pr.mineComplexCode || 'N/A', pr.proposalCode, pr.vendorName, pr.technicalMarks || 0, 100, pr.technicalComplianceStatus || 'Under Scrutiny',
          pr.evaluatedBy || 'Technical Committee', pr.committeeRecommendation || 'Under Evaluation'
        ]);
        downloadCSV(`NMDC_Technical_Evaluation_Report_${selectedComplexFilter}`, headers, rows);
        break;
      }
      case 'poc_register': {
        const headers = ['Complex', 'PoC Code', 'Problem Code', 'Vendor Name', 'Trial Location', 'Trial Cost (INR)', 'Start Date', 'Completion Date', 'Status', 'Progress (%)'];
        const rows = filteredPocs.map(poc => [
          poc.mineComplexCode || 'N/A', poc.pocCode, poc.problemStatementCode, poc.vendorName, poc.trialLocation, poc.trialCost, poc.startDate, poc.completionDate, poc.status, poc.progressPct
        ]);
        downloadCSV(`NMDC_PoC_Register_${selectedComplexFilter}`, headers, rows);
        break;
      }
      case 'awards_register': {
        const headers = ['Complex', 'Award Code', 'Work Title', 'Vendor Name', 'PO Number', 'GeM Bid ID', 'Total Contract Value (INR)', 'PBG Bank', 'PBG Amount (INR)', 'Status'];
        const rows = filteredAwards.map(a => [
          a.mineComplexCode || 'N/A', a.awardCode, a.workTitle, a.vendorName, a.poNumber, a.gemBidNumber, a.totalContractValue, a.pbgDetails?.issuingBank || '', a.pbgDetails?.amount || 0, a.status
        ]);
        downloadCSV(`NMDC_Award_of_Work_Register_${selectedComplexFilter}`, headers, rows);
        break;
      }
      case 'project_progress': {
        const headers = ['Complex', 'Project Code', 'Project Name', 'Contractor', 'Department', 'Approved Value (Cr)', 'Current Stage', 'Health', 'Physical Progress (%)', 'Target Completion'];
        const rows = filteredProjects.map(p => [
          p.mineComplexCode || 'N/A', p.projectCode, p.name, p.vendorName, p.department, p.approvedValueCr, p.currentStage, p.health, p.physicalProgressPct, p.targetCompletionDate
        ]);
        downloadCSV(`NMDC_Project_Execution_Progress_Report_${selectedComplexFilter}`, headers, rows);
        break;
      }
      default:
        break;
    }
  };

  const reportTabs = [
    { id: 'problem_register', label: '1. Problem Statement Register', count: filteredProblems.length },
    { id: 'vendor_register', label: '2. Vendor Register', count: vendors.length },
    { id: 'comparative_statement', label: '3. Comparative Statement', count: filteredProposals.length },
    { id: 'tech_eval_report', label: '4. Technical Evaluation Report', count: filteredProposals.length },
    { id: 'poc_register', label: '5. PoC Register', count: filteredPocs.length },
    { id: 'awards_register', label: '6. Award of Work Register', count: filteredAwards.length },
    { id: 'project_progress', label: '7. Project Progress Report', count: filteredProjects.length },
  ];

  const activeComplexObj = AUTHORIZED_MINE_COMPLEXES.find(c => c.code === selectedComplexFilter);

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-800 text-blue-200 uppercase tracking-wider">
                SECTION 24 · AUDITED REGISTERS
              </span>
              <span className="text-xs text-slate-400">
                {selectedComplexFilter === 'ALL' ? 'All Complexes' : activeComplexObj?.name}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Reports & Registers Download Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Export comprehensive statutory registers in CSV / Excel with official NMDC Navratna letterhead.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export CSV / Excel</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Register</span>
            </button>
          </div>
        </div>
      </div>

      {/* Complex Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedComplexFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            selectedComplexFilter === 'ALL'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>All 4 Complexes</span>
        </button>

        {AUTHORIZED_MINE_COMPLEXES.map((complex) => {
          const isActive = selectedComplexFilter === complex.code;
          return (
            <button
              key={complex.code}
              onClick={() => setSelectedComplexFilter(complex.code)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{complex.name}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Navigation Pills for Reports */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {reportTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id as ReportType)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
              activeReport === tab.id
                ? 'bg-blue-700 text-white border-blue-700 shadow-2xs font-bold'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeReport === tab.id ? 'bg-blue-800 text-blue-100' : 'bg-slate-100 text-slate-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* 3. Official Printable Letterhead Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-6">
        {/* NMDC Letterhead Header */}
        <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-blue-900 text-white flex flex-col items-center justify-center font-bold text-xs">
              <span>NMDC</span>
            </div>
            <div>
              <div className="text-base font-extrabold text-slate-900 uppercase tracking-tight">
                National Mineral Development Corporation Limited
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                (A Government of India Navratna Enterprise) · Complex: {selectedComplexFilter === 'ALL' ? 'Corporate Consolidated' : activeComplexObj?.name}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                CIN: L13100TG1958GOI000774 · Generated: {new Date().toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded border border-blue-200 block">
              OFFICIAL REGISTER RECORD
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">
              Audit & Vigilance Compliant
            </span>
          </div>
        </div>

        {/* 4. Dynamic Data Table based on Active Report */}
        {activeReport === 'problem_register' && (
          <div className="overflow-x-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
              Comprehensive Problem Statement Register ({filteredProblems.length})
            </h3>
            {filteredProblems.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No records available.
              </div>
            ) : (
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 border-r border-slate-200">Complex</th>
                    <th className="p-2.5 border-r border-slate-200">Code</th>
                    <th className="p-2.5 border-r border-slate-200">Title</th>
                    <th className="p-2.5 border-r border-slate-200">Department</th>
                    <th className="p-2.5 border-r border-slate-200">Originating Officer</th>
                    <th className="p-2.5 border-r border-slate-200">Budget</th>
                    <th className="p-2.5">Workflow Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredProblems.map((ps) => (
                    <tr key={ps.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold font-mono text-slate-600 border-r border-slate-200">{ps.mineComplexCode || 'N/A'}</td>
                      <td className="p-2.5 font-mono font-bold text-blue-700 border-r border-slate-200">{ps.code}</td>
                      <td className="p-2.5 font-medium text-slate-900 border-r border-slate-200">{ps.title}</td>
                      <td className="p-2.5 text-slate-600 border-r border-slate-200">{ps.department}</td>
                      <td className="p-2.5 text-slate-700 border-r border-slate-200">{ps.originatingOfficer}</td>
                      <td className="p-2.5 font-semibold text-slate-800 border-r border-slate-200">{ps.indicativeBudget}</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {ps.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeReport === 'vendor_register' && (
          <div className="overflow-x-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
              Approved & Registered Vendor Directory ({vendors.length})
            </h3>
            {vendors.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No records available.
              </div>
            ) : (
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 border-r border-slate-200">Company Name</th>
                    <th className="p-2.5 border-r border-slate-200">Entity Type</th>
                    <th className="p-2.5 border-r border-slate-200">CIN</th>
                    <th className="p-2.5 border-r border-slate-200">PAN / GSTIN</th>
                    <th className="p-2.5 border-r border-slate-200">MSME / Startup</th>
                    <th className="p-2.5 border-r border-slate-200">Contact Officer</th>
                    <th className="p-2.5">Verification Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {vendors.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900 border-r border-slate-200">{v.name}</td>
                      <td className="p-2.5 text-slate-600 border-r border-slate-200">{v.legalEntity}</td>
                      <td className="p-2.5 font-mono text-[11px] border-r border-slate-200">{v.cin}</td>
                      <td className="p-2.5 font-mono text-[11px] border-r border-slate-200">{v.pan} / {v.gstin}</td>
                      <td className="p-2.5 border-r border-slate-200">
                        {v.msmeStatus ? 'MSME Verified' : 'Standard'}
                      </td>
                      <td className="p-2.5 text-slate-700 border-r border-slate-200">{v.contactPerson} ({v.email})</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeReport === 'comparative_statement' && (
          <div className="overflow-x-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
              Section 13: Budgetary Offer Comparative Statement Matrix ({filteredProposals.length})
            </h3>
            {filteredProposals.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No records available.
              </div>
            ) : (
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 border-r border-slate-200">Complex</th>
                    <th className="p-2.5 border-r border-slate-200">Vendor Name</th>
                    <th className="p-2.5 border-r border-slate-200">Technical Compliance</th>
                    <th className="p-2.5 border-r border-slate-200">Basic Cost (₹)</th>
                    <th className="p-2.5 border-r border-slate-200">GST 18% (₹)</th>
                    <th className="p-2.5 border-r border-slate-200">Total Cost (₹)</th>
                    <th className="p-2.5 border-r border-slate-200">Delivery</th>
                    <th className="p-2.5 border-r border-slate-200">Rank</th>
                    <th className="p-2.5">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredProposals.map((pr) => (
                    <tr key={pr.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold font-mono text-slate-600 border-r border-slate-200">{pr.mineComplexCode || 'N/A'}</td>
                      <td className="p-2.5 font-bold text-slate-900 border-r border-slate-200">{pr.vendorName}</td>
                      <td className="p-2.5 border-r border-slate-200">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {pr.technicalComplianceStatus || 'Compliant'}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono text-slate-800 border-r border-slate-200">
                        ₹ {(pr.costBreakdown?.subtotalCost || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5 font-mono text-slate-600 border-r border-slate-200">
                        ₹ {(pr.costBreakdown?.gstAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5 font-mono font-bold text-slate-900 border-r border-slate-200">
                        ₹ {(pr.costBreakdown?.totalEstimatedCost || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5 text-slate-700 border-r border-slate-200">
                        {pr.commercialConditions?.deliveryPeriodWeeks || 12} Weeks
                      </td>
                      <td className="p-2.5 border-r border-slate-200">
                        <span className="font-bold text-blue-700">{pr.commercialRank || 'L1'}</span>
                      </td>
                      <td className="p-2.5 text-slate-500 text-[11px]">
                        {pr.committeeRecommendation || 'Budgetary offer scrutinized'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeReport === 'poc_register' && (
          <div className="overflow-x-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
              Section 14: Proof of Concept (PoC) Field Trials Register ({filteredPocs.length})
            </h3>
            {filteredPocs.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No records available.
              </div>
            ) : (
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 border-r border-slate-200">Complex</th>
                    <th className="p-2.5 border-r border-slate-200">PoC Code</th>
                    <th className="p-2.5 border-r border-slate-200">Problem Statement</th>
                    <th className="p-2.5 border-r border-slate-200">Vendor</th>
                    <th className="p-2.5 border-r border-slate-200">Trial Location</th>
                    <th className="p-2.5 border-r border-slate-200">Trial Cost (₹)</th>
                    <th className="p-2.5">Status & Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredPocs.map((poc) => (
                    <tr key={poc.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold font-mono text-slate-600 border-r border-slate-200">{poc.mineComplexCode || 'N/A'}</td>
                      <td className="p-2.5 font-mono font-bold text-purple-700 border-r border-slate-200">{poc.pocCode}</td>
                      <td className="p-2.5 font-medium text-slate-900 border-r border-slate-200">{poc.problemStatementTitle}</td>
                      <td className="p-2.5 text-slate-700 border-r border-slate-200">{poc.vendorName}</td>
                      <td className="p-2.5 text-slate-600 border-r border-slate-200">{poc.trialLocation}</td>
                      <td className="p-2.5 font-mono text-slate-800 border-r border-slate-200">₹ {poc.trialCost.toLocaleString('en-IN')}</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                          {poc.status} ({poc.progressPct}%)
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeReport === 'awards_register' && (
          <div className="overflow-x-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
              Section 16: Award of Work & PO Register ({filteredAwards.length})
            </h3>
            {filteredAwards.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No records available.
              </div>
            ) : (
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 border-r border-slate-200">Complex</th>
                    <th className="p-2.5 border-r border-slate-200">Award Code</th>
                    <th className="p-2.5 border-r border-slate-200">Work Title</th>
                    <th className="p-2.5 border-r border-slate-200">Vendor Name</th>
                    <th className="p-2.5 border-r border-slate-200">PO Number</th>
                    <th className="p-2.5 border-r border-slate-200">Contract Value (₹)</th>
                    <th className="p-2.5">PBG Held</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredAwards.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold font-mono text-slate-600 border-r border-slate-200">{a.mineComplexCode || 'N/A'}</td>
                      <td className="p-2.5 font-mono font-bold text-emerald-800 border-r border-slate-200">{a.awardCode}</td>
                      <td className="p-2.5 font-bold text-slate-900 border-r border-slate-200">{a.workTitle}</td>
                      <td className="p-2.5 text-slate-700 border-r border-slate-200">{a.vendorName}</td>
                      <td className="p-2.5 font-mono text-slate-800 border-r border-slate-200">{a.poNumber}</td>
                      <td className="p-2.5 font-mono font-bold text-emerald-700 border-r border-slate-200">
                        ₹ {a.totalContractValue.toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5 text-slate-600">
                        {a.pbgDetails?.issuingBank} (₹ {(a.pbgDetails?.amount || 0).toLocaleString('en-IN')})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeReport === 'project_progress' && (
          <div className="overflow-x-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
              Section 17: 12-Stage Project Execution Register ({filteredProjects.length})
            </h3>
            {filteredProjects.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No records available.
              </div>
            ) : (
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 border-r border-slate-200">Complex</th>
                    <th className="p-2.5 border-r border-slate-200">Project Code</th>
                    <th className="p-2.5 border-r border-slate-200">Project Name</th>
                    <th className="p-2.5 border-r border-slate-200">Contractor</th>
                    <th className="p-2.5 border-r border-slate-200">Value (Cr)</th>
                    <th className="p-2.5 border-r border-slate-200">Current Stage</th>
                    <th className="p-2.5 border-r border-slate-200">Health</th>
                    <th className="p-2.5">Progress (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredProjects.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold font-mono text-slate-600 border-r border-slate-200">{p.mineComplexCode || 'N/A'}</td>
                      <td className="p-2.5 font-mono font-bold text-indigo-700 border-r border-slate-200">{p.projectCode}</td>
                      <td className="p-2.5 font-bold text-slate-900 border-r border-slate-200">{p.name}</td>
                      <td className="p-2.5 text-slate-700 border-r border-slate-200">{p.vendorName}</td>
                      <td className="p-2.5 font-mono text-slate-800 border-r border-slate-200">₹ {p.approvedValueCr} Cr</td>
                      <td className="p-2.5 text-blue-800 font-semibold border-r border-slate-200">{p.currentStage}</td>
                      <td className="p-2.5 border-r border-slate-200">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.health === 'On Track' ? 'bg-emerald-100 text-emerald-800' :
                          p.health === 'At Risk' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {p.health}
                        </span>
                      </td>
                      <td className="p-2.5 font-bold text-slate-900">{p.physicalProgressPct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>Confidential NMDC Corporate Document · For Official Operational Use Only</span>
          <span>NMDC Production Portal · Zero-AI Governance Core</span>
        </div>
      </div>
    </div>
  );
};

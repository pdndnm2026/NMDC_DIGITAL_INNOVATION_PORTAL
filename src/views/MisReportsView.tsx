import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  ProblemStatement,
  BudgetaryOfferRequest,
  Vendor,
  Proposal,
  PocRecord,
  AwardOfWork,
  Project,
  MineComplex,
  UserRole,
  DEFAULT_ORGANISATIONAL_UNITS,
} from '../types/index.js';
import {
  FileSpreadsheet,
  Printer,
  Filter,
  Building2,
  BarChart3,
} from 'lucide-react';

interface MisReportsViewProps {
  problemStatements: ProblemStatement[];
  budgetaryRequests: BudgetaryOfferRequest[];
  vendors: Vendor[];
  proposals: Proposal[];
  pocs: PocRecord[];
  awards: AwardOfWork[];
  projects: Project[];
  organisationalUnits?: MineComplex[];
  currentRole: UserRole;
}

type MisSuite = 'problem_mis' | 'budgetary_mis' | 'vendor_mis' | 'poc_mis' | 'award_mis' | 'project_mis';
type DataScope = 'live' | 'demo' | 'combined';

export const MisReportsView: React.FC<MisReportsViewProps> = ({
  problemStatements,
  budgetaryRequests,
  vendors,
  proposals,
  pocs,
  awards,
  projects,
  organisationalUnits = DEFAULT_ORGANISATIONAL_UNITS,
  currentRole,
}) => {
  const [activeSuite, setActiveSuite] = useState<MisSuite>('problem_mis');
  // Strict isolation rule: Live Operational MIS defaults to excluding DEMO data
  const [dataScope, setDataScope] = useState<DataScope>('live');
  const [unitFilter, setUnitFilter] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [vendorFilter, setVendorFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [fyFilter, setFyFilter] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const matchScope = (isDemo?: boolean) => {
    if (dataScope === 'live') return !isDemo;
    if (dataScope === 'demo') return Boolean(isDemo);
    return true;
  };

  const matchDate = (dateStr?: string) => {
    if (!dateStr) return true;
    const d = dateStr.slice(0, 10);
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    if (fyFilter === 'FY 2025-26' && (d < '2025-04-01' || d > '2026-03-31')) return false;
    if (fyFilter === 'FY 2026-27' && (d < '2026-04-01' || d > '2027-03-31')) return false;
    return true;
  };

  const allDepartments = useMemo(() => {
    const set = new Set<string>();
    problemStatements.forEach((p) => p.department && set.add(p.department));
    budgetaryRequests.forEach((b) => b.department && set.add(b.department));
    projects.forEach((pr) => pr.department && set.add(pr.department));
    return Array.from(set).sort();
  }, [problemStatements, budgetaryRequests, projects]);

  const fProblems = problemStatements.filter(
    (p) =>
      matchScope(p.isDemo) &&
      (unitFilter === 'ALL' || p.mineComplexCode === unitFilter) &&
      (deptFilter === 'ALL' || p.department === deptFilter) &&
      (statusFilter === 'ALL' || p.status === statusFilter) &&
      matchDate(p.submissionDate)
  );

  const fBors = budgetaryRequests.filter(
    (b) =>
      matchScope(b.isDemo) &&
      (unitFilter === 'ALL' || b.mineComplexCode === unitFilter) &&
      (deptFilter === 'ALL' || b.department === deptFilter) &&
      (statusFilter === 'ALL' || b.status === statusFilter) &&
      matchDate(b.createdAt)
  );

  const fVendors = vendors.filter(
    (v) =>
      matchScope(v.isDemo) &&
      (vendorFilter === 'ALL' || v.id === vendorFilter) &&
      (statusFilter === 'ALL' || v.status === statusFilter) &&
      matchDate(v.createdAt)
  );

  const fOffers = proposals.filter(
    (o) =>
      matchScope(o.isDemo) &&
      (unitFilter === 'ALL' || o.mineComplexCode === unitFilter) &&
      (vendorFilter === 'ALL' || o.vendorId === vendorFilter) &&
      matchDate(o.submittedAt)
  );

  const fPocs = pocs.filter(
    (p) =>
      matchScope(p.isDemo) &&
      (unitFilter === 'ALL' || p.mineComplexCode === unitFilter) &&
      (vendorFilter === 'ALL' || p.vendorId === vendorFilter) &&
      (statusFilter === 'ALL' || p.status === statusFilter) &&
      matchDate(p.startDate)
  );

  const fAwards = awards.filter(
    (a) =>
      matchScope(a.isDemo) &&
      (unitFilter === 'ALL' || a.mineComplexCode === unitFilter) &&
      (deptFilter === 'ALL' || a.department === deptFilter) &&
      (vendorFilter === 'ALL' || a.vendorId === vendorFilter) &&
      (statusFilter === 'ALL' || a.status === statusFilter) &&
      matchDate(a.awardDate)
  );

  const fProjects = projects.filter(
    (p) =>
      matchScope(p.isDemo) &&
      (unitFilter === 'ALL' || p.mineComplexCode === unitFilter) &&
      (deptFilter === 'ALL' || p.department === deptFilter) &&
      (vendorFilter === 'ALL' || p.vendorId === vendorFilter) &&
      (statusFilter === 'ALL' || p.health === statusFilter || p.currentStage === statusFilter) &&
      matchDate(p.startDate)
  );

  const handleExportMisExcel = () => {
    const wb = XLSX.utils.book_new();
    const metaRows = [
      ['NMDC LIMITED — CONSOLIDATED MANAGEMENT INFORMATION SYSTEM (MIS) REPORT'],
      [`Report Suite: ${activeSuite.toUpperCase()}`, `Data Scope: ${dataScope.toUpperCase()}`, `Unit: ${unitFilter}`, `Generated: ${new Date().toLocaleString('en-IN')}`],
      [],
    ];

    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (activeSuite === 'problem_mis') {
      headers = ['Unit', 'Problem ID', 'Title', 'Department', 'Originating Officer', 'Budget (Cr)', 'Offers', 'Status', 'Date', 'Dataset'];
      rows = fProblems.map((p) => [
        p.mineComplexCode, p.code, p.title, p.department, p.originatingOfficer, p.budgetNumeric, p.respondedVendorsCount, p.status, p.submissionDate, p.isDemo ? 'DEMO' : 'LIVE',
      ]);
    } else if (activeSuite === 'budgetary_mis') {
      headers = ['Unit', 'BOR Code', 'Linked PS', 'Title', 'Department', 'Est. Budget (Cr)', 'Deadline', 'Responses', 'Status', 'Dataset'];
      rows = fBors.map((b) => [
        b.mineComplexCode, b.requestCode, b.linkedProblemStatementCode || 'Direct', b.title, b.department, b.estimatedBudgetCr, b.submissionDeadline, b.responsesCount, b.status, b.isDemo ? 'DEMO' : 'LIVE',
      ]);
    } else if (activeSuite === 'vendor_mis') {
      headers = ['Company Name', 'Legal Entity', 'PAN', 'GSTIN', 'MSME', 'Startup', 'State', 'Turnover (Cr)', 'Status', 'Dataset'];
      rows = fVendors.map((v) => [
        v.name, v.legalEntity, v.pan, v.gstin, v.msmeStatus ? 'Yes' : 'No', v.startupStatus ? 'Yes' : 'No', v.state, v.annualTurnoverCr, v.status, v.isDemo ? 'DEMO' : 'LIVE',
      ]);
    } else if (activeSuite === 'poc_mis') {
      headers = ['Unit', 'PoC Code', 'PS Code', 'Vendor', 'Trial Location', 'Cost (INR)', 'Progress %', 'Status', 'Dataset'];
      rows = fPocs.map((p) => [
        p.mineComplexCode, p.pocCode, p.problemStatementCode, p.vendorName, p.trialLocation, p.trialCost, p.progressPct, p.status, p.isDemo ? 'DEMO' : 'LIVE',
      ]);
    } else if (activeSuite === 'award_mis') {
      headers = ['Unit', 'Award Code', 'Work Title', 'Vendor', 'PO No', 'LOA No', 'Contract Value (INR)', 'PBG (INR)', 'Status', 'Dataset'];
      rows = fAwards.map((a) => [
        a.mineComplexCode, a.awardCode, a.workTitle, a.vendorName, a.poNumber, a.loaNumber, a.totalContractValue, a.pbgDetails?.amount || 0, a.status, a.isDemo ? 'DEMO' : 'LIVE',
      ]);
    } else {
      headers = ['Unit', 'Project Code', 'Project Name', 'Vendor', 'Approved Value (Cr)', 'Spent (Cr)', 'Stage', 'Health', 'Physical %', 'Dataset'];
      rows = fProjects.map((p) => [
        p.mineComplexCode, p.projectCode, p.name, p.vendorName, p.approvedValueCr, p.actualExpenditureCr, p.currentStage, p.health, p.physicalProgressPct, p.isDemo ? 'DEMO' : 'LIVE',
      ]);
    }

    const ws = XLSX.utils.aoa_to_sheet([...metaRows, headers, ...rows]);
    ws['!cols'] = headers.map(() => ({ wch: 20 }));
    XLSX.utils.book_append_sheet(wb, ws, 'MIS_Report');
    XLSX.writeFile(wb, `NMDC_${activeSuite}_${dataScope}_${unitFilter}.xlsx`);
  };

  const unitSummary = organisationalUnits.map((u) => ({
    code: u.code,
    name: u.shortLabel,
    problems: fProblems.filter((p) => p.mineComplexCode === u.code).length,
    bors: fBors.filter((b) => b.mineComplexCode === u.code).length,
    offers: fOffers.filter((o) => o.mineComplexCode === u.code).length,
    pocs: fPocs.filter((p) => p.mineComplexCode === u.code).length,
    awards: fAwards.filter((a) => a.mineComplexCode === u.code).length,
    projects: fProjects.filter((p) => p.mineComplexCode === u.code).length,
  }));

  const misSuites: { id: MisSuite; label: string; count: number }[] = [
    { id: 'problem_mis', label: 'A. Problem Statement MIS', count: fProblems.length },
    { id: 'budgetary_mis', label: 'B. Budgetary Offer MIS', count: fBors.length },
    { id: 'vendor_mis', label: 'C. Vendor MIS', count: fVendors.length },
    { id: 'poc_mis', label: 'D. PoC MIS', count: fPocs.length },
    { id: 'award_mis', label: 'E. Award of Work MIS', count: fAwards.length },
    { id: 'project_mis', label: 'F. Project Monitoring MIS', count: fProjects.length },
  ];

  return (
    <div className="space-y-5 pb-14">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11px] font-mono text-amber-300 uppercase tracking-wider">
            <span>MANAGEMENT INFORMATION SYSTEM (MIS)</span>
            <span>·</span>
            <span>5 ORGANISATIONAL UNITS CONSOLIDATED</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            NMDC Corporate & Unit-Wise MIS Reports
          </h1>
          <p className="text-xs text-slate-300 max-w-3xl">
            Live database analytics across Head Office, DIOM, KIOM, Bacheli & Kirandul. Demo dataset is strictly isolated and excluded from Live MIS reports by default.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportMisExcel}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel (.xlsx)</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
          >
            <Printer className="w-4 h-4" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Filter className="w-4 h-4 text-blue-700" />
            <span>MIS Filter Matrix</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
            <span className="text-[11px] text-slate-500 font-semibold px-2">Data Scope:</span>
            {(['live', 'demo', 'combined'] as DataScope[]).map((sc) => (
              <button
                key={sc}
                onClick={() => setDataScope(sc)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                  dataScope === sc ? 'bg-blue-700 text-white' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                {sc === 'live' ? 'Live Only (Default)' : sc === 'demo' ? 'Demo Only' : 'Combined'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Unit (All 5)</label>
            <select value={unitFilter} onChange={(e) => setUnitFilter(e.target.value)} className="w-full border border-slate-200 rounded-lg p-1.5 bg-white">
              <option value="ALL">All 5 Units</option>
              {organisationalUnits.map((u) => (
                <option key={u.code} value={u.code}>{u.code} – {u.shortLabel}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Department</label>
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="w-full border border-slate-200 rounded-lg p-1.5 bg-white">
              <option value="ALL">All Departments</option>
              {allDepartments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Vendor</label>
            <select value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)} className="w-full border border-slate-200 rounded-lg p-1.5 bg-white">
              <option value="ALL">All Vendors</option>
              {vendors.filter((v) => matchScope(v.isDemo)).map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Financial Year</label>
            <select value={fyFilter} onChange={(e) => setFyFilter(e.target.value)} className="w-full border border-slate-200 rounded-lg p-1.5 bg-white">
              <option value="ALL">All Financial Years</option>
              <option value="FY 2025-26">FY 2025-26</option>
              <option value="FY 2026-27">FY 2026-27</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">From Date</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full border border-slate-200 rounded-lg p-1.5 font-mono" />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">To Date</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full border border-slate-200 rounded-lg p-1.5 font-mono" />
          </div>
        </div>
      </div>

      {/* 5-Unit Consolidated Summary Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <BarChart3 className="w-4 h-4 text-blue-700" />
          <span>Unit-Wise Consolidated Summary ({dataScope === 'live' ? 'Live Operational Records Only' : dataScope === 'demo' ? 'Isolated Demo Dataset' : 'Live + Demo Combined'})</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                <th className="py-2 px-3">Organisational Unit</th>
                <th className="py-2 px-3 text-right">Problem Statements</th>
                <th className="py-2 px-3 text-right">BORs Issued</th>
                <th className="py-2 px-3 text-right">Vendor Offers</th>
                <th className="py-2 px-3 text-right">PoCs</th>
                <th className="py-2 px-3 text-right">Work Orders</th>
                <th className="py-2 px-3 text-right">Projects</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {unitSummary.map((u) => (
                <tr key={u.code} className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-semibold text-slate-900">
                    <span className="font-mono text-blue-700 mr-2">{u.code}</span>
                    {u.name}
                  </td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums">{u.problems}</td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums">{u.bors}</td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums">{u.offers}</td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums">{u.pocs}</td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums">{u.awards}</td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums">{u.projects}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6 MIS Report Suites Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {misSuites.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSuite(tab.id)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap border flex items-center gap-1.5 ${
              activeSuite === tab.id ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${activeSuite === tab.id ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Active MIS Detailed Register */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {activeSuite === 'problem_mis' && (
          fProblems.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">No records available for the selected filter criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                  <tr>
                    <th className="p-2.5">Unit</th>
                    <th className="p-2.5">Problem Code</th>
                    <th className="p-2.5">Title</th>
                    <th className="p-2.5">Department</th>
                    <th className="p-2.5 text-right">Budget (Cr)</th>
                    <th className="p-2.5 text-right">Offers</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fProblems.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-slate-700">{p.mineComplexCode}</td>
                      <td className="p-2.5 font-mono text-blue-700 font-bold">{p.code}</td>
                      <td className="p-2.5 font-medium text-slate-900">
                        {p.title} {p.isDemo && <span className="ml-1 text-[10px] font-mono bg-amber-100 text-amber-900 px-1 rounded">DEMO</span>}
                      </td>
                      <td className="p-2.5 text-slate-600">{p.department}</td>
                      <td className="p-2.5 text-right font-mono tabular-nums">₹ {p.budgetNumeric.toFixed(2)}</td>
                      <td className="p-2.5 text-right font-mono tabular-nums">{p.respondedVendorsCount}</td>
                      <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">{p.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {activeSuite === 'budgetary_mis' && (
          fBors.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">No records available for the selected filter criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                  <tr>
                    <th className="p-2.5">Unit</th>
                    <th className="p-2.5">BOR Code</th>
                    <th className="p-2.5">Title</th>
                    <th className="p-2.5">Scope</th>
                    <th className="p-2.5 text-right">Est. Budget (Cr)</th>
                    <th className="p-2.5">Deadline</th>
                    <th className="p-2.5 text-right">Offers</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fBors.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-slate-700">{b.mineComplexCode}</td>
                      <td className="p-2.5 font-mono text-blue-700 font-bold">{b.requestCode}</td>
                      <td className="p-2.5 font-medium text-slate-900">
                        {b.title} {b.isDemo && <span className="ml-1 text-[10px] font-mono bg-amber-100 text-amber-900 px-1 rounded">DEMO</span>}
                      </td>
                      <td className="p-2.5 text-slate-600">{b.visibilityScope === 'ALL_ELIGIBLE' ? 'All Vendors' : 'Invited Only'}</td>
                      <td className="p-2.5 text-right font-mono tabular-nums">₹ {b.estimatedBudgetCr.toFixed(2)}</td>
                      <td className="p-2.5 font-mono text-slate-700">{b.submissionDeadline}</td>
                      <td className="p-2.5 text-right font-mono tabular-nums">{b.responsesCount}</td>
                      <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">{b.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {activeSuite === 'vendor_mis' && (
          fVendors.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">No records available for the selected filter criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                  <tr>
                    <th className="p-2.5">Company Name</th>
                    <th className="p-2.5">Entity</th>
                    <th className="p-2.5">PAN / GSTIN</th>
                    <th className="p-2.5">MSME</th>
                    <th className="p-2.5">State</th>
                    <th className="p-2.5 text-right">Turnover (Cr)</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fVendors.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900">
                        {v.name} {v.isDemo && <span className="ml-1 text-[10px] font-mono bg-amber-100 text-amber-900 px-1 rounded">DEMO</span>}
                      </td>
                      <td className="p-2.5 text-slate-600">{v.legalEntity}</td>
                      <td className="p-2.5 font-mono text-[11px]">{v.pan} / {v.gstExempt ? 'EXEMPT' : v.gstin}</td>
                      <td className="p-2.5">{v.msmeStatus ? 'MSME' : 'Standard'}</td>
                      <td className="p-2.5 text-slate-600">{v.state}</td>
                      <td className="p-2.5 text-right font-mono tabular-nums">₹ {v.annualTurnoverCr}</td>
                      <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">{v.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {activeSuite === 'poc_mis' && (
          fPocs.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">No records available for the selected filter criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                  <tr>
                    <th className="p-2.5">Unit</th>
                    <th className="p-2.5">PoC Code</th>
                    <th className="p-2.5">Problem Statement</th>
                    <th className="p-2.5">Vendor</th>
                    <th className="p-2.5 text-right">Trial Cost (₹)</th>
                    <th className="p-2.5 text-right">Progress</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fPocs.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-slate-700">{p.mineComplexCode}</td>
                      <td className="p-2.5 font-mono text-teal-800 font-bold">{p.pocCode}</td>
                      <td className="p-2.5 font-medium text-slate-900">
                        {p.problemStatementTitle} {p.isDemo && <span className="ml-1 text-[10px] font-mono bg-amber-100 text-amber-900 px-1 rounded">DEMO</span>}
                      </td>
                      <td className="p-2.5 text-slate-700">{p.vendorName}</td>
                      <td className="p-2.5 text-right font-mono tabular-nums">₹ {p.trialCost.toLocaleString('en-IN')}</td>
                      <td className="p-2.5 text-right font-mono tabular-nums font-bold">{p.progressPct}%</td>
                      <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">{p.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {activeSuite === 'award_mis' && (
          fAwards.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">No records available for the selected filter criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                  <tr>
                    <th className="p-2.5">Unit</th>
                    <th className="p-2.5">Award Code</th>
                    <th className="p-2.5">Work Title</th>
                    <th className="p-2.5">Vendor</th>
                    <th className="p-2.5">PO / LOA Ref</th>
                    <th className="p-2.5 text-right">Contract Value (Cr)</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fAwards.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-slate-700">{a.mineComplexCode}</td>
                      <td className="p-2.5 font-mono text-emerald-800 font-bold">{a.awardCode}</td>
                      <td className="p-2.5 font-medium text-slate-900">
                        {a.workTitle} {a.isDemo && <span className="ml-1 text-[10px] font-mono bg-amber-100 text-amber-900 px-1 rounded">DEMO</span>}
                      </td>
                      <td className="p-2.5 text-slate-700">{a.vendorName}</td>
                      <td className="p-2.5 font-mono text-[11px]">{a.poNumber} / {a.loaNumber}</td>
                      <td className="p-2.5 text-right font-mono tabular-nums font-bold">₹ {(a.totalContractValue / 10000000).toFixed(2)} Cr</td>
                      <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {activeSuite === 'project_mis' && (
          fProjects.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">No records available for the selected filter criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                  <tr>
                    <th className="p-2.5">Unit</th>
                    <th className="p-2.5">Project Code</th>
                    <th className="p-2.5">Project Name</th>
                    <th className="p-2.5">Contractor</th>
                    <th className="p-2.5">Current Stage</th>
                    <th className="p-2.5 text-right">Value (Cr)</th>
                    <th className="p-2.5 text-right">Progress %</th>
                    <th className="p-2.5">Health</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fProjects.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-slate-700">{p.mineComplexCode}</td>
                      <td className="p-2.5 font-mono text-indigo-800 font-bold">{p.projectCode}</td>
                      <td className="p-2.5 font-medium text-slate-900">
                        {p.name} {p.isDemo && <span className="ml-1 text-[10px] font-mono bg-amber-100 text-amber-900 px-1 rounded">DEMO</span>}
                      </td>
                      <td className="p-2.5 text-slate-700">{p.vendorName}</td>
                      <td className="p-2.5 text-blue-800 font-semibold">{p.currentStage}</td>
                      <td className="p-2.5 text-right font-mono tabular-nums">₹ {p.approvedValueCr.toFixed(2)}</td>
                      <td className="p-2.5 text-right font-mono tabular-nums font-bold">{p.physicalProgressPct}%</td>
                      <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">{p.health}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
};

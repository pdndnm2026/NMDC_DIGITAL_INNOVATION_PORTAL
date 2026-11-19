import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  EmployeeMasterRecord,
  EmployeeImportHistory,
  MineComplex,
  MineComplexCode,
  User,
  UserRole,
  DEFAULT_ORGANISATIONAL_UNITS,
} from '../types/index.js';
import { fetchApi } from '../utils/api.js';
import {
  Users,
  UserPlus,
  FileSpreadsheet,
  Download,
  Upload,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit3,
  History,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';

interface EmployeeMasterViewProps {
  currentUser: User | null;
  currentRole: UserRole;
  organisationalUnits?: MineComplex[];
  onRefreshData?: () => void;
}

interface ParsedExcelRow {
  rowNumber: number;
  employeeName: string;
  sapEmployeeId: string;
  officialEmail: string;
  mobileNumber: string;
  designation: string;
  department: string;
  areaOfWork: string;
  mineComplexRaw: string;
  mineComplexCode: MineComplexCode | '';
  location: string;
  employeeStatus: 'Active' | 'Inactive';
  errors: string[];
  isDuplicateInFile: boolean;
  existingRecord?: EmployeeMasterRecord;
  changedFields: { field: string; currentVal: string; newVal: string }[];
}

const EXCEL_HEADERS = [
  'Employee Name',
  'SAP Employee ID',
  'Email ID',
  'Mobile Number',
  'Designation',
  'Department',
  'Area of Work',
  'Mine/Complex',
  'Location',
  'Employee Status',
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const EmployeeMasterView: React.FC<EmployeeMasterViewProps> = ({
  currentUser,
  currentRole,
  organisationalUnits = DEFAULT_ORGANISATIONAL_UNITS,
  onRefreshData,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'excel' | 'history'>('directory');
  const [employees, setEmployees] = useState<EmployeeMasterRecord[]>([]);
  const [importHistory, setImportHistory] = useState<EmployeeImportHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const [unitFilter, setUnitFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Manual Entry Modal
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeMasterRecord | null>(null);
  const [formState, setFormState] = useState({
    employeeName: '',
    sapEmployeeId: '',
    officialEmail: '',
    mobileNumber: '',
    designation: '',
    department: '',
    areaOfWork: '',
    mineComplexCode: 'HO' as MineComplexCode,
    location: '',
    employeeStatus: 'Active' as 'Active' | 'Inactive',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [savingManual, setSavingManual] = useState(false);

  // Excel Import State
  const [excelFilename, setExcelFilename] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedExcelRow[]>([]);
  const [allowOverwrite, setAllowOverwrite] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<EmployeeImportHistory | null>(null);
  const [excelError, setExcelError] = useState<string | null>(null);

  const canManage = currentRole === 'admin' || currentRole === 'dept_head' || currentRole === 'approving_authority';

  useEffect(() => {
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    setLoading(true);
    try {
      const [emRes, histRes] = await Promise.all([
        fetchApi<{ success: boolean; data: EmployeeMasterRecord[] }>('/api/employee-master'),
        fetchApi<{ success: boolean; data: EmployeeImportHistory[] }>('/api/employee-master/import-history'),
      ]);
      if (emRes.success) setEmployees(emRes.data || []);
      if (histRes.success) setImportHistory(histRes.data || []);
    } catch (e) {
      console.error('Failed to load Employee Master:', e);
    } finally {
      setLoading(false);
    }
  };

  const resolveUnitCode = (raw: string): MineComplexCode | '' => {
    const val = (raw || '').trim().toLowerCase();
    if (!val) return '';
    for (const u of organisationalUnits) {
      if (
        u.code.toLowerCase() === val ||
        u.name.toLowerCase() === val ||
        u.shortLabel.toLowerCase() === val ||
        u.fullName.toLowerCase() === val
      ) {
        return u.code;
      }
    }
    if (val.includes('head') || val === 'ho' || val.includes('hyderabad')) return 'HO';
    if (val.includes('donimalai') || val === 'diom') return 'DIOM';
    if (val.includes('kumaraswamy') || val === 'kiom') return 'KIOM';
    if (val.includes('bacheli') || val === 'bch') return 'BCH';
    if (val.includes('kirandul') || val === 'kdl') return 'KDL';
    return '';
  };

  const revalidateRows = (rows: ParsedExcelRow[]): ParsedExcelRow[] => {
    const seenSap = new Map<string, number>();
    const seenEmail = new Map<string, number>();

    rows.forEach((r) => {
      const sapKey = r.sapEmployeeId.trim().toLowerCase();
      if (sapKey) seenSap.set(sapKey, (seenSap.get(sapKey) || 0) + 1);
      const emailKey = r.officialEmail.trim().toLowerCase();
      if (emailKey) seenEmail.set(emailKey, (seenEmail.get(emailKey) || 0) + 1);
    });

    return rows.map((row) => {
      const errors: string[] = [];
      const sap = row.sapEmployeeId.trim();
      const email = row.officialEmail.trim().toLowerCase();
      const resolvedCode = resolveUnitCode(row.mineComplexRaw);

      if (!row.employeeName.trim()) errors.push('Employee Name missing');
      if (!sap) errors.push('SAP Employee ID missing');
      if (!row.designation.trim()) errors.push('Designation missing');
      if (!row.department.trim()) errors.push('Department missing');
      if (!resolvedCode) errors.push(`Invalid Mine/Complex ("${row.mineComplexRaw || 'Blank'}")`);
      if (email && !EMAIL_RE.test(email)) errors.push('Invalid Email ID format');

      const dupSapInFile = Boolean(sap && (seenSap.get(sap.toLowerCase()) || 0) > 1);
      const dupEmailInFile = Boolean(email && (seenEmail.get(email) || 0) > 1);
      if (dupSapInFile) errors.push('Duplicate SAP ID in uploaded Excel');
      if (dupEmailInFile) errors.push('Duplicate Email ID in uploaded Excel');

      const existingBySap = employees.find((e) => e.sapEmployeeId.toLowerCase() === sap.toLowerCase());
      const existingByEmail = email
        ? employees.find((e) => e.officialEmail && e.officialEmail.toLowerCase() === email && e.sapEmployeeId.toLowerCase() !== sap.toLowerCase())
        : undefined;

      if (existingByEmail) {
        errors.push(`Email already belongs to SAP ID ${existingByEmail.sapEmployeeId}`);
      }

      const changedFields: { field: string; currentVal: string; newVal: string }[] = [];
      if (existingBySap) {
        const pairs: [string, string, string][] = [
          ['Employee Name', existingBySap.employeeName, row.employeeName.trim()],
          ['Email ID', existingBySap.officialEmail, email],
          ['Mobile', existingBySap.mobileNumber, row.mobileNumber.trim()],
          ['Designation', existingBySap.designation, row.designation.trim()],
          ['Department', existingBySap.department, row.department.trim()],
          ['Area of Work', existingBySap.areaOfWork, row.areaOfWork.trim()],
          ['Mine/Complex', existingBySap.mineComplexCode, resolvedCode],
          ['Location', existingBySap.location, row.location.trim()],
          ['Status', existingBySap.employeeStatus, row.employeeStatus],
        ];
        for (const [label, cur, nxt] of pairs) {
          if (cur !== nxt && nxt !== '') {
            changedFields.push({ field: label, currentVal: cur || '—', newVal: nxt });
          }
        }
      }

      return {
        ...row,
        mineComplexCode: resolvedCode,
        errors,
        isDuplicateInFile: dupSapInFile || dupEmailInFile,
        existingRecord: existingBySap,
        changedFields,
      };
    });
  };

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const wsData = [
      EXCEL_HEADERS,
      [
        'Sample Name (Replace Row)',
        '100234',
        'name@nmdc.co.in',
        '9876543210',
        'Senior Manager',
        'Mining & HEMM Engineering',
        'Mine Planning & Operations',
        'DIOM',
        'Donimalai Mine Bench',
        'Active',
      ],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = EXCEL_HEADERS.map(() => ({ wch: 24 }));
    XLSX.utils.book_append_sheet(wb, ws, 'Employee_Master');

    const unitSheet = XLSX.utils.aoa_to_sheet([
      ['Valid Mine/Complex Code', 'Full Registered Unit Name', 'Location'],
      ...organisationalUnits.map((u) => [u.code, u.name, u.location]),
    ]);
    XLSX.utils.book_append_sheet(wb, unitSheet, 'Valid_Units_Reference');
    XLSX.writeFile(wb, 'NMDC_Employee_Master_Template.xlsx');
  };

  const handleExportMaster = () => {
    const wb = XLSX.utils.book_new();
    const rows = employees.map((e) => [
      e.employeeName,
      e.sapEmployeeId,
      e.officialEmail,
      e.mobileNumber,
      e.designation,
      e.department,
      e.areaOfWork,
      e.mineComplexCode,
      e.location,
      e.employeeStatus,
    ]);
    const ws = XLSX.utils.aoa_to_sheet([EXCEL_HEADERS, ...rows]);
    ws['!cols'] = EXCEL_HEADERS.map(() => ({ wch: 22 }));
    XLSX.utils.book_append_sheet(wb, ws, 'Employee_Master');
    XLSX.writeFile(wb, `NMDC_Employee_Master_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExcelFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setExcelError(null);
    setImportResult(null);
    setAllowOverwrite(false);
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFilename(file.name);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(firstSheet, { defval: '' });

      if (jsonRows.length === 0) {
        setExcelError('The uploaded Excel file contains no data rows.');
        setParsedRows([]);
        return;
      }

      const fileCols = Object.keys(jsonRows[0]).map((k) => k.trim());
      const missingHeaders = ['Employee Name', 'SAP Employee ID', 'Designation', 'Department', 'Mine/Complex'].filter(
        (req) => !fileCols.some((fc) => fc.toLowerCase() === req.toLowerCase())
      );

      if (missingHeaders.length > 0) {
        setExcelError(`Missing mandatory Excel columns: ${missingHeaders.join(', ')}. Please download and use the standard Excel template.`);
        setParsedRows([]);
        return;
      }

      const getCol = (r: Record<string, any>, name: string) => {
        const key = Object.keys(r).find((k) => k.trim().toLowerCase() === name.toLowerCase());
        return key ? String(r[key] ?? '').trim() : '';
      };

      const initialRows: ParsedExcelRow[] = jsonRows.map((r, idx) => {
        const rawUnit = getCol(r, 'Mine/Complex');
        const rawStatus = getCol(r, 'Employee Status').toLowerCase();
        return {
          rowNumber: idx + 2,
          employeeName: getCol(r, 'Employee Name'),
          sapEmployeeId: getCol(r, 'SAP Employee ID'),
          officialEmail: getCol(r, 'Email ID'),
          mobileNumber: getCol(r, 'Mobile Number'),
          designation: getCol(r, 'Designation'),
          department: getCol(r, 'Department'),
          areaOfWork: getCol(r, 'Area of Work'),
          mineComplexRaw: rawUnit,
          mineComplexCode: resolveUnitCode(rawUnit),
          location: getCol(r, 'Location'),
          employeeStatus: rawStatus === 'inactive' ? 'Inactive' : 'Active',
          errors: [],
          isDuplicateInFile: false,
          changedFields: [],
        };
      });

      setParsedRows(revalidateRows(initialRows));
    } catch (err: any) {
      setExcelError(`Failed to parse Excel file: ${err.message || 'Invalid format'}`);
      setParsedRows([]);
    }
  };

  const handleUpdatePreviewCell = (rowIdx: number, field: keyof ParsedExcelRow, value: string) => {
    const next = [...parsedRows];
    const target = { ...next[rowIdx], [field]: value };
    if (field === 'mineComplexRaw') {
      target.mineComplexCode = resolveUnitCode(value);
    }
    next[rowIdx] = target;
    setParsedRows(revalidateRows(next));
  };

  const handleRemovePreviewRow = (rowIdx: number) => {
    const next = parsedRows.filter((_, i) => i !== rowIdx);
    setParsedRows(revalidateRows(next));
  };

  const handleConfirmExcelImport = async () => {
    const validRows = parsedRows.filter((r) => r.errors.length === 0);
    const existingMatches = validRows.filter((r) => Boolean(r.existingRecord));

    if (validRows.length === 0) {
      setExcelError('No valid rows ready for import. Correct highlighted rows or remove invalid rows.');
      return;
    }

    if (existingMatches.length > 0 && !allowOverwrite) {
      setExcelError(
        `${existingMatches.length} row(s) match existing SAP Employee IDs. Review the change comparison below and tick "Confirm overwrite of existing records" or remove those rows.`
      );
      return;
    }

    setImporting(true);
    setExcelError(null);
    try {
      const invalidRows = parsedRows.filter((r) => r.errors.length > 0);
      const dupCount = parsedRows.filter((r) => r.isDuplicateInFile).length;
      const errSummary = invalidRows.slice(0, 15).map((r) => `Row ${r.rowNumber} (${r.sapEmployeeId || 'No SAP ID'}): ${r.errors.join('; ')}`);

      const res = await fetchApi<{ success: boolean; summary: EmployeeImportHistory }>('/api/employee-master/import', {
        method: 'POST',
        body: JSON.stringify({
          rows: validRows.map((r) => ({
            employeeName: r.employeeName,
            sapEmployeeId: r.sapEmployeeId,
            officialEmail: r.officialEmail,
            mobileNumber: r.mobileNumber,
            designation: r.designation,
            department: r.department,
            areaOfWork: r.areaOfWork,
            mineComplexCode: r.mineComplexCode,
            location: r.location,
            employeeStatus: r.employeeStatus,
          })),
          allowOverwrite,
          filename: excelFilename,
          uploadedBy: currentUser?.name || 'Portal Administrator',
          uploadedByRole: currentRole,
          totalUploaded: parsedRows.length,
          rejectedCount: invalidRows.length,
          duplicateCount: dupCount,
          errorsSummary: errSummary,
        }),
      });

      if (res.success) {
        setImportResult(res.summary);
        setParsedRows([]);
        await loadMasterData();
        if (onRefreshData) onRefreshData();
      }
    } catch (err: any) {
      setExcelError(err.message || 'Excel import failed.');
    } finally {
      setImporting(false);
    }
  };

  const openAddManual = () => {
    setEditingEmployee(null);
    setFormState({
      employeeName: '',
      sapEmployeeId: '',
      officialEmail: '',
      mobileNumber: '',
      designation: '',
      department: 'Mining & HEMM Engineering',
      areaOfWork: '',
      mineComplexCode: 'HO',
      location: '',
      employeeStatus: 'Active',
    });
    setFormError(null);
    setManualModalOpen(true);
  };

  const openEditManual = (emp: EmployeeMasterRecord) => {
    setEditingEmployee(emp);
    setFormState({
      employeeName: emp.employeeName,
      sapEmployeeId: emp.sapEmployeeId,
      officialEmail: emp.officialEmail,
      mobileNumber: emp.mobileNumber,
      designation: emp.designation,
      department: emp.department,
      areaOfWork: emp.areaOfWork,
      mineComplexCode: emp.mineComplexCode,
      location: emp.location,
      employeeStatus: emp.employeeStatus,
    });
    setFormError(null);
    setManualModalOpen(true);
  };

  const handleSaveManualEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSavingManual(true);
    try {
      if (editingEmployee) {
        await fetchApi(`/api/employee-master/${editingEmployee.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            ...formState,
            updatedBy: currentUser?.name || 'Portal Administrator',
          }),
        });
        setFormSuccess(`Updated employee master record for ${formState.employeeName}.`);
      } else {
        await fetchApi('/api/employee-master', {
          method: 'POST',
          body: JSON.stringify({
            ...formState,
            updatedBy: currentUser?.name || 'Portal Administrator',
          }),
        });
        setFormSuccess(`Added ${formState.employeeName} (SAP: ${formState.sapEmployeeId}) to Employee Master.`);
      }
      setManualModalOpen(false);
      await loadMasterData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save employee record.');
    } finally {
      setSavingManual(false);
    }
  };

  const filteredEmployees = employees.filter((e) => {
    if (unitFilter !== 'ALL' && e.mineComplexCode !== unitFilter) return false;
    if (statusFilter !== 'ALL' && e.employeeStatus !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        e.employeeName.toLowerCase().includes(q) ||
        e.sapEmployeeId.toLowerCase().includes(q) ||
        (e.officialEmail && e.officialEmail.toLowerCase().includes(q)) ||
        e.department.toLowerCase().includes(q) ||
        e.designation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const validPreviewCount = parsedRows.filter((r) => r.errors.length === 0).length;
  const invalidPreviewCount = parsedRows.filter((r) => r.errors.length > 0).length;
  const overwritePreviewRows = parsedRows.filter((r) => r.errors.length === 0 && r.existingRecord);

  return (
    <div className="space-y-5 pb-14">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11px] font-mono text-amber-300 uppercase tracking-wider">
            <span>ADMINISTRATION · EMPLOYEE MASTER MANAGEMENT</span>
            <span>·</span>
            <span>{employees.length} VERIFIED RECORDS</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            NMDC Employee Master Data Management
          </h1>
          <p className="text-xs text-slate-300 max-w-3xl">
            Authoritative personnel directory across all 5 organisational units (Head Office, DIOM, KIOM, Bacheli, Kirandul). Self-registration verifies SAP Employee ID against this master. Uploading records never auto-creates login accounts or passwords.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleExportMaster}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>

          {canManage && (
            <button
              onClick={openAddManual}
              className="px-3.5 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Employee Manually</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('directory')}
          className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'directory' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Employee Directory ({employees.length})</span>
        </button>

        {canManage && (
          <button
            onClick={() => setActiveSubTab('excel')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'excel' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Upload Through Excel (.xlsx / .xls)</span>
          </button>
        )}

        <button
          onClick={() => setActiveSubTab('history')}
          className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'history' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Import History ({importHistory.length})</span>
        </button>
      </div>

      {formSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{formSuccess}</span>
          </div>
          <button onClick={() => setFormSuccess(null)} className="text-emerald-700 font-bold text-xs">Dismiss</button>
        </div>
      )}

      {/* TAB 1: DIRECTORY */}
      {activeSubTab === 'directory' && (
        <div className="space-y-4">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Name, SAP ID, Email, Designation, Department..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800"
            >
              <option value="ALL">All 5 Units</option>
              {organisationalUnits.map((u) => (
                <option key={u.code} value={u.code}>
                  {u.code} – {u.shortLabel}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <button
              onClick={loadMasterData}
              className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {loading ? (
              <div className="p-10 text-center text-xs text-slate-500">Loading Employee Master...</div>
            ) : filteredEmployees.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">No employee master records available.</p>
                <p className="text-xs text-slate-500">
                  Add employees manually or bulk upload through an Excel workbook to populate the verification directory.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                      <th className="py-2.5 px-3">SAP ID</th>
                      <th className="py-2.5 px-3">Employee Name</th>
                      <th className="py-2.5 px-3">Designation</th>
                      <th className="py-2.5 px-3">Department</th>
                      <th className="py-2.5 px-3">Area of Work</th>
                      <th className="py-2.5 px-3">Mine / Complex</th>
                      <th className="py-2.5 px-3">Official Email</th>
                      <th className="py-2.5 px-3">Mobile</th>
                      <th className="py-2.5 px-3">Status</th>
                      {canManage && <th className="py-2.5 px-3 text-right">Edit</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEmployees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-700 tabular-nums">{emp.sapEmployeeId}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{emp.employeeName}</td>
                        <td className="py-2.5 px-3 text-slate-700">{emp.designation}</td>
                        <td className="py-2.5 px-3 text-slate-700">{emp.department}</td>
                        <td className="py-2.5 px-3 text-slate-500">{emp.areaOfWork || '—'}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                            {emp.mineComplexCode}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{emp.officialEmail || '—'}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 tabular-nums">{emp.mobileNumber || '—'}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              emp.employeeStatus === 'Active'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {emp.employeeStatus}
                          </span>
                        </td>
                        {canManage && (
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => openEditManual(emp)}
                              className="p-1.5 text-slate-500 hover:text-blue-700 rounded hover:bg-blue-50"
                              title="Edit Employee"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: EXCEL UPLOAD WORKFLOW */}
      {activeSubTab === 'excel' && canManage && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Step 1: Download Template & Upload Workbook</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Expected columns: {EXCEL_HEADERS.join(' | ')}. Valid units: HO, DIOM, KIOM, BCH, KDL.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap self-start"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Standard Excel Template (.xlsx)</span>
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-600">
                <strong className="text-slate-900 block">Select Employee Master Excel File (.xlsx / .xls)</strong>
                <span>Rows are validated client-side for duplicates, mandatory columns, and registered units before saving.</span>
              </div>
              <label className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 shrink-0">
                <Upload className="w-3.5 h-3.5" />
                <span>Choose Excel File</span>
                <input type="file" accept=".xlsx,.xls" onChange={handleExcelFileUpload} className="hidden" />
              </label>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                <strong>Governance Isolation:</strong> Uploading employee master records does NOT auto-create user accounts or passwords. Employees must register via the portal and undergo administrator verification.
              </span>
            </div>

            {excelError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2 font-medium">
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{excelError}</span>
              </div>
            )}
          </div>

          {/* Import Summary */}
          {importResult && (
            <div className="bg-white rounded-xl border border-emerald-300 p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Excel Import Completed — {importResult.filename}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-500 block">Total Uploaded</span>
                  <strong className="text-lg font-mono tabular-nums text-slate-900">{importResult.totalRows}</strong>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <span className="text-emerald-700 block">Newly Imported</span>
                  <strong className="text-lg font-mono tabular-nums text-emerald-800">{importResult.importedCount}</strong>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-blue-700 block">Updated Existing</span>
                  <strong className="text-lg font-mono tabular-nums text-blue-800">{importResult.updatedCount}</strong>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="text-amber-700 block">Duplicates</span>
                  <strong className="text-lg font-mono tabular-nums text-amber-800">{importResult.duplicateCount}</strong>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                  <span className="text-rose-700 block">Rejected</span>
                  <strong className="text-lg font-mono tabular-nums text-rose-800">{importResult.rejectedCount}</strong>
                </div>
              </div>
              {importResult.errorsSummary.length > 0 && (
                <div className="text-xs bg-rose-50/70 p-3 rounded-lg border border-rose-200 space-y-1">
                  <span className="font-bold text-rose-800 block">Validation Errors Logged:</span>
                  {importResult.errorsSummary.map((err, i) => (
                    <div key={i} className="text-rose-700 font-mono text-[11px]">{err}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Interactive Preview Table */}
          {parsedRows.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Step 2: Preview & Correct Uploaded Records ({excelFilename})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Valid rows: <strong className="text-emerald-700">{validPreviewCount}</strong> · Invalid rows highlighted in red: <strong className="text-rose-700">{invalidPreviewCount}</strong> · Existing SAP matches: <strong className="text-amber-700">{overwritePreviewRows.length}</strong>
                  </p>
                </div>

                <button
                  type="button"
                  disabled={importing || validPreviewCount === 0}
                  onClick={handleConfirmExcelImport}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold whitespace-nowrap"
                >
                  {importing ? 'Importing Valid Records...' : `Confirm Final Import (${validPreviewCount} Valid Rows)`}
                </button>
              </div>

              {/* Overwrite Diff Preview */}
              {overwritePreviewRows.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-3 text-xs">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-amber-950 block">
                          Existing Employee Records Detected ({overwritePreviewRows.length}) — Overwrite Confirmation Required
                        </strong>
                        <span className="text-amber-800">
                          Existing records are never overwritten silently. Review proposed field changes below.
                        </span>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 font-bold text-amber-950 bg-white px-3 py-1.5 rounded-lg border border-amber-300 cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={allowOverwrite}
                        onChange={(e) => setAllowOverwrite(e.target.checked)}
                        className="rounded text-blue-700"
                      />
                      <span>Confirm overwrite of existing records</span>
                    </label>
                  </div>

                  <div className="max-h-40 overflow-y-auto bg-white rounded-lg border border-amber-200 divide-y divide-amber-100">
                    {overwritePreviewRows.map((row) => (
                      <div key={row.rowNumber} className="p-2.5 flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="font-mono font-bold text-slate-900">SAP {row.sapEmployeeId} ({row.employeeName}):</span>
                        {row.changedFields.length === 0 ? (
                          <span className="text-slate-500">No field values changed</span>
                        ) : (
                          row.changedFields.map((ch, idx) => (
                            <span key={idx} className="bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                              <strong>{ch.field}:</strong> <span className="line-through text-slate-400">{ch.currentVal}</span> → <span className="text-emerald-800 font-semibold">{ch.newVal}</span>
                            </span>
                          ))
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                      <th className="p-2">Row</th>
                      <th className="p-2">SAP ID</th>
                      <th className="p-2">Employee Name</th>
                      <th className="p-2">Email ID</th>
                      <th className="p-2">Designation</th>
                      <th className="p-2">Department</th>
                      <th className="p-2">Unit (Code)</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Validation</th>
                      <th className="p-2 text-right">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row, idx) => {
                      const hasErr = row.errors.length > 0;
                      return (
                        <tr key={idx} className={hasErr ? 'bg-rose-50/80' : row.existingRecord ? 'bg-amber-50/40' : 'bg-white'}>
                          <td className="p-2 font-mono text-[11px] text-slate-500">{row.rowNumber}</td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={row.sapEmployeeId}
                              onChange={(e) => handleUpdatePreviewCell(idx, 'sapEmployeeId', e.target.value)}
                              className="w-24 border border-slate-300 rounded px-1.5 py-1 font-mono text-[11px] bg-white"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={row.employeeName}
                              onChange={(e) => handleUpdatePreviewCell(idx, 'employeeName', e.target.value)}
                              className="w-36 border border-slate-300 rounded px-1.5 py-1 text-[11px] bg-white"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={row.officialEmail}
                              onChange={(e) => handleUpdatePreviewCell(idx, 'officialEmail', e.target.value)}
                              className="w-40 border border-slate-300 rounded px-1.5 py-1 font-mono text-[11px] bg-white"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={row.designation}
                              onChange={(e) => handleUpdatePreviewCell(idx, 'designation', e.target.value)}
                              className="w-32 border border-slate-300 rounded px-1.5 py-1 text-[11px] bg-white"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={row.department}
                              onChange={(e) => handleUpdatePreviewCell(idx, 'department', e.target.value)}
                              className="w-36 border border-slate-300 rounded px-1.5 py-1 text-[11px] bg-white"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={row.mineComplexCode || row.mineComplexRaw}
                              onChange={(e) => handleUpdatePreviewCell(idx, 'mineComplexRaw', e.target.value)}
                              className="border border-slate-300 rounded px-1.5 py-1 text-[11px] bg-white"
                            >
                              <option value="">{row.mineComplexRaw ? `Invalid (${row.mineComplexRaw})` : 'Select Unit'}</option>
                              {organisationalUnits.map((u) => (
                                <option key={u.code} value={u.code}>{u.code}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <select
                              value={row.employeeStatus}
                              onChange={(e) => handleUpdatePreviewCell(idx, 'employeeStatus', e.target.value)}
                              className="border border-slate-300 rounded px-1.5 py-1 text-[11px] bg-white"
                            >
                              <option value="Active">Active</option>
                              <option value="Inactive">Inactive</option>
                            </select>
                          </td>
                          <td className="p-2 text-[11px]">
                            {hasErr ? (
                              <span className="text-rose-700 font-semibold">{row.errors.join('; ')}</span>
                            ) : row.existingRecord ? (
                              <span className="text-amber-700 font-semibold">Update Existing</span>
                            ) : (
                              <span className="text-emerald-700 font-semibold">Valid New</span>
                            )}
                          </td>
                          <td className="p-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemovePreviewRow(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600"
                              title="Remove row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: IMPORT HISTORY */}
      {activeSubTab === 'history' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {importHistory.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">No Excel import history available.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Filename</th>
                    <th className="py-2.5 px-3">Uploaded By</th>
                    <th className="py-2.5 px-3 text-right">Uploaded</th>
                    <th className="py-2.5 px-3 text-right">Imported</th>
                    <th className="py-2.5 px-3 text-right">Updated</th>
                    <th className="py-2.5 px-3 text-right">Rejected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {importHistory.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 tabular-nums">
                        {new Date(h.timestamp).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{h.filename}</td>
                      <td className="py-2.5 px-3 text-slate-700">{h.uploadedBy}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">{h.totalRows}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-700 font-bold">{h.importedCount}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-blue-700 font-bold">{h.updatedCount}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-rose-700 font-bold">{h.rejectedCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MANUAL ADD / EDIT MODAL */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingEmployee ? `Edit Employee Master: ${editingEmployee.sapEmployeeId}` : 'Add Employee to Employee Master'}
                </h3>
                <p className="text-slate-500 text-xs">SAP Employee ID and Official Email must be unique across NMDC.</p>
              </div>
              <button onClick={() => setManualModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold text-base">✕</button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 font-medium">{formError}</div>
            )}

            <form onSubmit={handleSaveManualEmployee} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Employee Name <span className="text-rose-600">*</span></label>
                  <input
                    type="text"
                    required
                    value={formState.employeeName}
                    onChange={(e) => setFormState({ ...formState, employeeName: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">SAP Employee ID <span className="text-rose-600">*</span></label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingEmployee)}
                    value={formState.sapEmployeeId}
                    onChange={(e) => setFormState({ ...formState, sapEmployeeId: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono text-slate-900 disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Official Email ID</label>
                  <input
                    type="email"
                    value={formState.officialEmail}
                    onChange={(e) => setFormState({ ...formState, officialEmail: e.target.value })}
                    placeholder="name@nmdc.co.in"
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    value={formState.mobileNumber}
                    onChange={(e) => setFormState({ ...formState, mobileNumber: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Designation <span className="text-rose-600">*</span></label>
                  <input
                    type="text"
                    required
                    value={formState.designation}
                    onChange={(e) => setFormState({ ...formState, designation: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Department <span className="text-rose-600">*</span></label>
                  <input
                    type="text"
                    required
                    value={formState.department}
                    onChange={(e) => setFormState({ ...formState, department: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Area of Work</label>
                  <input
                    type="text"
                    value={formState.areaOfWork}
                    onChange={(e) => setFormState({ ...formState, areaOfWork: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mine / Complex <span className="text-rose-600">*</span></label>
                  <select
                    value={formState.mineComplexCode}
                    onChange={(e) => setFormState({ ...formState, mineComplexCode: e.target.value as MineComplexCode })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-900 font-semibold"
                  >
                    {organisationalUnits.map((u) => (
                      <option key={u.code} value={u.code}>{u.code} – {u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Location</label>
                  <input
                    type="text"
                    value={formState.location}
                    onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Employee Status</label>
                  <select
                    value={formState.employeeStatus}
                    onChange={(e) => setFormState({ ...formState, employeeStatus: e.target.value as 'Active' | 'Inactive' })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-900 font-semibold"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingManual}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold"
                >
                  {savingManual ? 'Saving...' : editingEmployee ? 'Save Changes' : 'Save Employee Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

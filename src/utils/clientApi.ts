// NMDC Limited - Problem Statement, Vendor Solution & Project Management Portal
// Enterprise Client API Adapter (Syncs 1:1 with server.ts, LocalStorage Persistent on Netlify/Client)

import { db } from '../server/db.js';
import {
  User,
  UserRole,
  Vendor,
  VendorStatus,
  ProblemStatement,
  BudgetaryOfferRequest,
  BudgetaryRequestStatus,
  Proposal,
  DiscussionThread,
  DiscussionMessage,
  PocRecord,
  AwardOfWork,
  Project,
  EmployeeMasterRecord,
  EmployeeImportHistory,
  ProblemStatementStatus,
  PocStatus,
  MineComplexCode,
  DEFAULT_ORGANISATIONAL_UNITS,
  BUDGETARY_DISCLAIMER_TEXT,
} from '../types/index.js';

const STORAGE_KEY = 'nmdc_portal_v5_cluster_mock';
let isHydrated = false;

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;

function cleanOldStorage() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem('nmdc_production_v4_enterprise_store');
    localStorage.removeItem('nmdc_production_clean_v3_store');
    localStorage.removeItem('nmdc_enterprise_portal_v2_store');
    localStorage.removeItem('nmdc_enterprise_portal_store');
    localStorage.removeItem('nmdc_portal_store_v1');
  } catch {
    // ignore
  }
}

function hydrateFromStorage() {
  if (isHydrated) return;
  isHydrated = true;
  cleanOldStorage();

  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data.organisationalUnits) && data.organisationalUnits.length === 5) {
        db.organisationalUnits = data.organisationalUnits;
      }
      if (Array.isArray(data.employeeMaster)) db.employeeMaster = data.employeeMaster;
      if (Array.isArray(data.employeeImportHistory)) db.employeeImportHistory = data.employeeImportHistory;
      if (Array.isArray(data.problemStatements)) db.problemStatements = data.problemStatements;
      if (Array.isArray(data.budgetaryRequests)) db.budgetaryRequests = data.budgetaryRequests;
      if (Array.isArray(data.proposals)) db.proposals = data.proposals;
      if (Array.isArray(data.discussions)) db.discussions = data.discussions;
      if (Array.isArray(data.projects)) db.projects = data.projects;
      if (Array.isArray(data.vendors)) db.vendors = data.vendors;
      if (Array.isArray(data.users)) db.users = data.users;
      if (Array.isArray(data.pocRecords)) db.pocRecords = data.pocRecords;
      if (Array.isArray(data.awardsOfWork)) db.awardsOfWork = data.awardsOfWork;
      if (Array.isArray(data.notifications)) db.notifications = data.notifications;
      if (Array.isArray(data.activityLogs)) db.activityLogs = data.activityLogs;
      if (Array.isArray(data.auditLogs)) db.auditLogs = data.auditLogs;
      if (Array.isArray(data.evaluationParameters)) db.evaluationParameters = data.evaluationParameters;
    } else {
      saveToStorage();
    }
  } catch (err) {
    console.warn('[NMDC Enterprise API] Failed to restore state:', err);
  }
}

function saveToStorage() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;

  try {
    const payload = {
      organisationalUnits: db.organisationalUnits,
      employeeMaster: db.employeeMaster,
      employeeImportHistory: db.employeeImportHistory,
      problemStatements: db.problemStatements,
      budgetaryRequests: db.budgetaryRequests,
      proposals: db.proposals,
      discussions: db.discussions,
      projects: db.projects,
      vendors: db.vendors,
      users: db.users,
      pocRecords: db.pocRecords,
      awardsOfWork: db.awardsOfWork,
      notifications: db.notifications,
      activityLogs: db.activityLogs,
      auditLogs: db.auditLogs,
      evaluationParameters: db.evaluationParameters,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('[NMDC Enterprise API] Failed to save state:', err);
  }
}

function broadcastActivity(activity: any) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nmdc:activity', { detail: activity }));
  }
}

function parseUrl(endpoint: string) {
  const [pathname, queryString] = endpoint.split('?');
  const params: Record<string, string> = {};
  if (queryString) {
    const pairs = queryString.split('&');
    for (const pair of pairs) {
      const [k, v] = pair.split('=');
      if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
    }
  }
  return { pathname, params };
}

function getUnitInfo(code: string) {
  return db.organisationalUnits.find((mc) => mc.code === code) || DEFAULT_ORGANISATIONAL_UNITS[0];
}

export async function handleClientApi<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  hydrateFromStorage();

  const method = (options?.method || 'GET').toUpperCase();
  const { pathname, params } = parseUrl(endpoint);
  let body: any = {};
  if (options?.body) {
    try {
      body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    } catch {
      body = {};
    }
  }

  // -------------------------------------------------------------------------
  // 0. ORGANISATIONAL UNITS CONFIGURATION (5 Units including Head Office)
  // -------------------------------------------------------------------------
  if (pathname === '/api/units' && method === 'GET') {
    return { success: true, data: db.organisationalUnits } as T;
  }

  // -------------------------------------------------------------------------
  // 1. STATS (Live excludes isDemo by default)
  // -------------------------------------------------------------------------
  if (pathname === '/api/stats' && method === 'GET') {
    const complex = params.mineComplex || params.complex;
    const includeDemo = params.includeDemo === 'true';
    const stats = db.getStats(complex, includeDemo);
    return { success: true, data: stats } as T;
  }

  // -------------------------------------------------------------------------
  // 2. DEMO DATA ISOLATION CONTROLS
  // -------------------------------------------------------------------------
  if (pathname === '/api/demo/status' && method === 'GET') {
    return {
      success: true,
      hasDemoData: db.hasDemoData(),
      demoCounts: {
        problemStatements: db.problemStatements.filter((p) => p.isDemo).length,
        budgetaryRequests: db.budgetaryRequests.filter((b) => b.isDemo).length,
        proposals: db.proposals.filter((p) => p.isDemo).length,
        vendors: db.vendors.filter((v) => v.isDemo).length,
        discussions: db.discussions.filter((d) => d.isDemo).length,
        pocs: db.pocRecords.filter((p) => p.isDemo).length,
        awards: db.awardsOfWork.filter((a) => a.isDemo).length,
        projects: db.projects.filter((p) => p.isDemo).length,
      },
    } as T;
  }

  if (pathname === '/api/demo/load' && method === 'POST') {
    const res = db.loadDemoData();
    db.addActivity('Portal System', 'admin', 'DEMO_DATA_LOADED', 'DEMO-SET', `Loaded ${res.loadedCount} isolated DEMO records across DIOM, KIOM, BCH, KDL & HO.`);
    saveToStorage();
    return { success: true, ...res } as T;
  }

  if (pathname === '/api/demo/clear' && method === 'DELETE') {
    const res = db.clearDemoData();
    db.addActivity('Portal Administrator', 'admin', 'DEMO_DATA_DELETED', 'DEMO-SET', `Deleted ${res.removedCount} isolated DEMO records permanently.`);
    saveToStorage();
    return { success: true, ...res } as T;
  }

  // -------------------------------------------------------------------------
  // 3. AUTHENTICATION, ADMIN SETUP & EMPLOYEE MASTER SELF-REGISTRATION
  // -------------------------------------------------------------------------
  if (pathname === '/api/auth/login' && method === 'POST') {
    const loginIdentifier = (body.email || body.username || body.userId || '').trim().toLowerCase();
    const password = body.password || '';

    if (db.users.length === 0) {
      throw new Error('NO_ADMIN_SETUP_REQUIRED: The portal administrator account has not been initialized yet.');
    }

    const user = db.users.find(
      (u) =>
        u.email.toLowerCase() === loginIdentifier ||
        (u.employeeId && u.employeeId.toLowerCase() === loginIdentifier) ||
        (u.vendorId && u.vendorId.toLowerCase() === loginIdentifier)
    );

    if (!user || (user.passwordHash && user.passwordHash !== password)) {
      throw new Error('Invalid Email ID / User ID or Password.');
    }

    if (user.status === 'Pending') {
      throw new Error('Your registration is pending verification and activation by the NMDC Portal Administrator.');
    }

    if (user.status === 'Suspended') {
      throw new Error('Your account is currently suspended or rejected. Please contact the Portal Administrator.');
    }

    const act = db.addActivity(user.name, user.role, 'USER_LOGIN', user.id, `User ${user.name} signed in.`);
    broadcastActivity(act);
    saveToStorage();
    return { success: true, user } as T;
  }

  if (pathname === '/api/auth/setup-admin' && method === 'POST') {
    const existingAdmin = db.users.find((u) => u.role === 'admin');
    if (existingAdmin) {
      throw new Error('An administrator account already exists. Please sign in.');
    }

    const { name, email, employeeId, designation, department, password } = body;
    if (!name || !email || !employeeId || !password) {
      throw new Error('Administrator Name, Official Email, Employee ID and Password are mandatory.');
    }

    const adminUser: User = {
      id: `usr-admin-${Date.now()}`,
      email: email.trim(),
      name: name.trim(),
      role: 'admin',
      department: (department || 'Corporate IT & Executive Cell').trim(),
      employeeId: employeeId.trim(),
      designation: (designation || 'Portal Administrator').trim(),
      mineComplexCode: 'ALL',
      projectComplex: 'Head Office (Hyderabad)',
      status: 'Active',
      passwordHash: password,
      createdAt: new Date().toISOString(),
    };

    db.users.push(adminUser);
    db.addAudit(adminUser.id, 'admin', 'INITIAL_ADMIN_SETUP', 'User', adminUser.id, undefined, 'Active', 'First Portal Administrator configured', 'SUCCESS');
    saveToStorage();
    return { success: true, user: adminUser } as T;
  }

  // Verify SAP ID against Employee Master (Section 3)
  if (pathname === '/api/auth/verify-sap' && method === 'POST') {
    const sapId = (body.sapEmployeeId || body.employeeId || '').trim();
    if (!sapId) {
      throw new Error('Please enter your SAP Employee ID.');
    }
    const master = db.employeeMaster.find((e) => e.sapEmployeeId.toLowerCase() === sapId.toLowerCase());
    if (!master) {
      throw new Error('Your employee details are not available in the Employee Master. Please contact the concerned administrator.');
    }
    if (master.employeeStatus !== 'Active') {
      throw new Error('Your Employee Master record is marked Inactive. Please contact the concerned administrator.');
    }
    return { success: true, employee: master } as T;
  }

  // NMDC Employee Registration validated strictly against Employee Master
  if (pathname === '/api/auth/register-executive' && method === 'POST') {
    const sapId = (body.employeeId || body.sapEmployeeId || '').trim();
    const email = (body.email || '').trim();
    const mobile = (body.mobile || '').trim();
    const password = body.password || '';

    if (!sapId || !email || !password) {
      throw new Error('SAP Employee ID, Official Email ID and Password are required.');
    }

    const master = db.employeeMaster.find((e) => e.sapEmployeeId.toLowerCase() === sapId.toLowerCase());
    if (!master) {
      throw new Error('Your employee details are not available in the Employee Master. Please contact the concerned administrator.');
    }
    if (master.employeeStatus !== 'Active') {
      throw new Error('Your Employee Master status is Inactive. Please contact the concerned administrator.');
    }

    if (master.officialEmail && master.officialEmail.toLowerCase() !== email.toLowerCase()) {
      throw new Error(`Official Email ID does not match the email registered in Employee Master for SAP ID ${master.sapEmployeeId}.`);
    }

    if (db.users.some((u) => u.employeeId && u.employeeId.toLowerCase() === master.sapEmployeeId.toLowerCase())) {
      throw new Error(`An account for SAP Employee ID ${master.sapEmployeeId} is already registered.`);
    }
    if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with this email address already exists.');
    }

    const unit = getUnitInfo(master.mineComplexCode);

    const newUser: User = {
      id: `usr-exec-${Date.now()}`,
      email: master.officialEmail || email,
      name: master.employeeName,
      role: 'executive',
      department: master.department, // Strictly inherited from Employee Master
      areaOfWork: master.areaOfWork,
      employeeId: master.sapEmployeeId,
      designation: master.designation,
      mineComplexCode: unit.code, // Strictly inherited from Employee Master
      projectComplex: unit.name,
      location: master.location,
      mobile: mobile || master.mobileNumber,
      status: 'Pending',
      passwordHash: password,
      verifiedFromEmployeeMaster: true,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    const act = db.addActivity(
      newUser.name,
      'executive',
      'EMPLOYEE_REGISTERED_FROM_MASTER',
      newUser.employeeId || newUser.id,
      `Employee ${newUser.name} (${newUser.employeeId}) verified from Employee Master (${unit.code}) and registered. Status: Pending Admin Verification.`
    );
    db.addNotification('New Employee Registration Pending', `${newUser.name} (${newUser.employeeId}) registered via Employee Master for ${unit.shortLabel}.`, 'info', '/admin', undefined, 'admin');
    broadcastActivity(act);
    saveToStorage();

    return {
      success: true,
      message: 'Registration verified against Employee Master and submitted. Your account is pending administrator activation.',
      user: newUser,
    } as T;
  }

  // Compulsory Vendor Registration & Validation (Section 4)
  if (pathname === '/api/auth/register-vendor' && method === 'POST') {
    const {
      companyName,
      legalConstitution,
      registrationNumber,
      pan,
      gstExempt,
      gstExemptionReason,
      gstin,
      registeredAddress,
      state,
      pinCode,
      country,
      website,
      yearEstablished,
      contactPerson,
      designation,
      email,
      mobile,
      alternateMobile,
      natureOfBusiness,
      businessCategory,
      companyProfile,
      areasOfBusiness,
      miningExperienceYears,
      msmeStatus,
      startupStatus,
      password,
      documents,
      declarationAccepted,
    } = body;

    const cleanPan = (pan || '').trim().toUpperCase();
    const cleanGstin = (gstin || '').trim().toUpperCase();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanMobile = (mobile || '').replace(/\D/g, '').slice(-10);

    if (!companyName?.trim() || !legalConstitution || !registeredAddress?.trim() || !state?.trim() || !pinCode?.trim() || !country?.trim()) {
      throw new Error('All mandatory Company Details fields marked with * are required.');
    }
    if (!contactPerson?.trim() || !designation?.trim() || !natureOfBusiness?.trim() || !businessCategory?.trim() || !companyProfile?.trim()) {
      throw new Error('All mandatory Contact & Business Details fields marked with * are required.');
    }
    if (!PAN_REGEX.test(cleanPan)) {
      throw new Error('Invalid PAN format. Expected 10-character PAN (e.g., AAAAA0000A).');
    }
    if (!gstExempt && !GSTIN_REGEX.test(cleanGstin)) {
      throw new Error('Invalid GSTIN format. Expected 15-character GSTIN (or select GST Exemption declaration).');
    }
    if (gstExempt && !gstExemptionReason?.trim()) {
      throw new Error('Please specify GST Exemption justification.');
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
      throw new Error('Invalid Official Email ID format.');
    }
    if (!MOBILE_REGEX.test(cleanMobile)) {
      throw new Error('Invalid Mobile Number. Enter a valid 10-digit mobile number.');
    }
    if (!/^\d{6}$/.test((pinCode || '').trim())) {
      throw new Error('Invalid PIN Code. Must be 6 digits.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }
    if (!declarationAccepted) {
      throw new Error('You must accept the mandatory declaration before submitting Vendor Registration.');
    }

    // Duplicate checks across live vendors
    if (db.vendors.some((v) => !v.isDemo && v.pan.toUpperCase() === cleanPan)) {
      throw new Error(`A vendor with PAN ${cleanPan} is already registered.`);
    }
    if (!gstExempt && db.vendors.some((v) => !v.isDemo && v.gstin.toUpperCase() === cleanGstin)) {
      throw new Error(`A vendor with GSTIN ${cleanGstin} is already registered.`);
    }
    if (db.vendors.some((v) => !v.isDemo && v.email.toLowerCase() === cleanEmail) || db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error(`An account with Official Email ${cleanEmail} already exists.`);
    }

    // Mandatory documents validation
    const docsList: any[] = Array.isArray(documents) ? documents : [];
    const hasDoc = (type: string) => docsList.some((d) => d.type === type && d.fileName);
    if (!hasDoc('Registration') || !hasDoc('PAN') || (!gstExempt && !hasDoc('GST')) || (gstExempt && !hasDoc('GSTExemption')) || !hasDoc('AuthorisationLetter')) {
      throw new Error('Mandatory documents missing: Registration Certificate, PAN Card, GST Certificate (or Exemption proof), and Authorisation Letter are compulsory.');
    }
    if (msmeStatus && !hasDoc('MSME')) {
      throw new Error('MSME / Udyam Registration Certificate is mandatory when MSME Status is selected.');
    }

    const vendorId = `vnd-${Date.now().toString().slice(-6)}`;
    const areas = Array.isArray(areasOfBusiness)
      ? areasOfBusiness
      : typeof areasOfBusiness === 'string'
      ? areasOfBusiness.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];

    const newVendor: Vendor = {
      id: vendorId,
      name: companyName.trim(),
      legalEntity: legalConstitution,
      cin: (registrationNumber || '').trim(),
      pan: cleanPan,
      gstExempt: Boolean(gstExempt),
      gstExemptionReason: gstExempt ? (gstExemptionReason || '').trim() : undefined,
      gstin: gstExempt ? 'EXEMPT' : cleanGstin,
      registeredAddress: registeredAddress.trim(),
      state: state.trim(),
      pinCode: pinCode.trim(),
      country: country.trim(),
      website: (website || '').trim(),
      yearEstablished: Number(yearEstablished) || new Date().getFullYear(),
      companySize: body.companySize || '51-200',
      msmeStatus: Boolean(msmeStatus),
      startupStatus: Boolean(startupStatus),
      contactPerson: contactPerson.trim(),
      designation: designation.trim(),
      email: cleanEmail,
      mobile: cleanMobile,
      alternateMobile: (alternateMobile || '').trim(),
      natureOfBusiness: natureOfBusiness.trim(),
      businessCategory: businessCategory.trim(),
      companyProfile: companyProfile.trim(),
      areasOfExpertise: areas,
      capabilities: areas,
      miningExperienceYears: Number(miningExperienceYears) || 0,
      miningPsuExperience: (body.miningPsuExperience || '').trim(),
      majorCustomers: [],
      annualTurnoverCr: Number(body.annualTurnoverCr) || 0,
      netWorthCr: Number(body.netWorthCr) || 0,
      declarationAccepted: true,
      declarationTimestamp: new Date().toISOString(),
      status: 'Pending',
      performanceScore: 0,
      documents: docsList.map((d, idx) => ({
        id: `doc-${Date.now()}-${idx}`,
        vendorId,
        title: d.title || d.type,
        type: d.type,
        fileName: d.fileName,
        fileSize: d.fileSize || 'PDF',
        mimeType: d.mimeType,
        uploadedAt: new Date().toISOString().substring(0, 10),
        status: 'Pending' as const,
      })),
      createdAt: new Date().toISOString(),
    };

    db.vendors.unshift(newVendor);

    const vendorUser: User = {
      id: `usr-${vendorId}`,
      email: cleanEmail,
      name: newVendor.contactPerson,
      role: 'vendor',
      vendorId: newVendor.id,
      designation: newVendor.designation,
      mobile: cleanMobile,
      status: 'Pending',
      passwordHash: password,
      createdAt: new Date().toISOString(),
    };
    db.users.push(vendorUser);

    const act = db.addActivity(newVendor.name, 'vendor', 'VENDOR_REGISTRATION_SUBMITTED', newVendor.id, `Vendor ${newVendor.name} submitted compulsory registration. Status: Pending.`);
    db.addNotification('New Vendor Registration Awaiting Verification', `${newVendor.name} (${cleanPan}) registered and awaiting verification.`, 'info', '/admin', undefined, 'admin');
    db.addAudit(vendorUser.id, 'vendor', 'REGISTER_VENDOR', 'Vendor', newVendor.id, undefined, 'Pending', 'Compulsory vendor registration submitted', 'SUCCESS');
    broadcastActivity(act);
    saveToStorage();

    return {
      success: true,
      message: 'Vendor registration submitted successfully. Status: Pending verification by Portal Administrator.',
      vendor: newVendor,
    } as T;
  }

  // -------------------------------------------------------------------------
  // 4. EMPLOYEE MASTER DATA MANAGEMENT (Change Request Section 2)
  // STRICT RULE: Does NOT auto-create login accounts or passwords
  // -------------------------------------------------------------------------
  if (pathname === '/api/employee-master' && method === 'GET') {
    let list = [...db.employeeMaster];
    if (params.unit && params.unit !== 'ALL') {
      list = list.filter((e) => e.mineComplexCode === params.unit);
    }
    if (params.status && params.status !== 'ALL') {
      list = list.filter((e) => e.employeeStatus === params.status);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (e) =>
          e.employeeName.toLowerCase().includes(q) ||
          e.sapEmployeeId.toLowerCase().includes(q) ||
          e.officialEmail.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q)
      );
    }
    return { success: true, data: list } as T;
  }

  if (pathname === '/api/employee-master' && method === 'POST') {
    const sapId = (body.sapEmployeeId || '').trim();
    const email = (body.officialEmail || '').trim().toLowerCase();
    const unitCode = (body.mineComplexCode || 'HO') as MineComplexCode;

    if (!body.employeeName?.trim() || !sapId || !body.designation?.trim() || !body.department?.trim() || !unitCode) {
      throw new Error('Employee Name, SAP Employee ID, Designation, Department and Mine/Complex are mandatory.');
    }
    if (email && !EMAIL_REGEX.test(email)) {
      throw new Error('Invalid Official Email ID format.');
    }
    if (db.employeeMaster.some((e) => e.sapEmployeeId.toLowerCase() === sapId.toLowerCase())) {
      throw new Error(`Duplicate SAP Employee ID: ${sapId} already exists in Employee Master.`);
    }
    if (email && db.employeeMaster.some((e) => e.officialEmail && e.officialEmail.toLowerCase() === email)) {
      throw new Error(`Duplicate Email ID: ${email} already belongs to another employee record.`);
    }

    const unit = getUnitInfo(unitCode);
    const now = new Date().toISOString();

    const record: EmployeeMasterRecord = {
      id: `em-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      employeeName: body.employeeName.trim(),
      sapEmployeeId: sapId,
      officialEmail: email,
      mobileNumber: (body.mobileNumber || '').trim(),
      designation: body.designation.trim(),
      department: body.department.trim(),
      areaOfWork: (body.areaOfWork || '').trim(),
      mineComplexCode: unit.code,
      mineComplexName: unit.name,
      location: (body.location || unit.location).trim(),
      employeeStatus: body.employeeStatus === 'Inactive' ? 'Inactive' : 'Active',
      createdAt: now,
      updatedAt: now,
      updatedBy: body.updatedBy || 'Portal Administrator',
    };

    db.employeeMaster.unshift(record);
    db.addAudit(body.updatedBy || 'admin', 'admin', 'EMPLOYEE_MASTER_CREATED', 'EmployeeMaster', record.sapEmployeeId, undefined, record.employeeStatus, `Added ${record.employeeName} to Employee Master (${unit.code})`, 'SUCCESS');
    db.addActivity(body.updatedBy || 'Portal Administrator', 'admin', 'EMPLOYEE_MASTER_ADDED', record.sapEmployeeId, `Employee ${record.employeeName} (${record.sapEmployeeId}) added to Master (${unit.code}).`);
    saveToStorage();

    return { success: true, data: record } as T;
  }

  const emUpdateMatch = pathname.match(/^\/api\/employee-master\/([^/]+)$/);
  if (emUpdateMatch && method === 'PUT') {
    const id = emUpdateMatch[1];
    const existing = db.employeeMaster.find((e) => e.id === id || e.sapEmployeeId === id);
    if (!existing) throw new Error('Employee Master record not found');

    const newEmail = (body.officialEmail ?? existing.officialEmail).trim().toLowerCase();
    if (newEmail && db.employeeMaster.some((e) => e.id !== existing.id && e.officialEmail.toLowerCase() === newEmail)) {
      throw new Error(`Email ID ${newEmail} is already assigned to another employee.`);
    }

    const unit = getUnitInfo(body.mineComplexCode || existing.mineComplexCode);
    existing.employeeName = (body.employeeName ?? existing.employeeName).trim();
    existing.officialEmail = newEmail;
    existing.mobileNumber = (body.mobileNumber ?? existing.mobileNumber).trim();
    existing.designation = (body.designation ?? existing.designation).trim();
    existing.department = (body.department ?? existing.department).trim();
    existing.areaOfWork = (body.areaOfWork ?? existing.areaOfWork).trim();
    existing.mineComplexCode = unit.code;
    existing.mineComplexName = unit.name;
    existing.location = (body.location ?? existing.location).trim();
    existing.employeeStatus = body.employeeStatus || existing.employeeStatus;
    existing.updatedAt = new Date().toISOString();
    const updatedByName = body.updatedBy || 'Portal Administrator';
    existing.updatedBy = updatedByName;

    db.addAudit(updatedByName, 'admin', 'EMPLOYEE_MASTER_UPDATED', 'EmployeeMaster', existing.sapEmployeeId, undefined, existing.employeeStatus, 'Updated Employee Master details', 'SUCCESS');
    saveToStorage();
    return { success: true, data: existing } as T;
  }

  if (pathname === '/api/employee-master/import' && method === 'POST') {
    const { rows, allowOverwrite, filename, uploadedBy, uploadedByRole, totalUploaded, rejectedCount, duplicateCount, errorsSummary } = body;
    const validRows: any[] = Array.isArray(rows) ? rows : [];

    let importedCount = 0;
    let updatedCount = 0;
    const now = new Date().toISOString();

    for (const row of validRows) {
      const sapId = (row.sapEmployeeId || '').trim();
      if (!sapId) continue;
      const unit = getUnitInfo(row.mineComplexCode);
      const existing = db.employeeMaster.find((e) => e.sapEmployeeId.toLowerCase() === sapId.toLowerCase());

      if (existing) {
        if (allowOverwrite) {
          existing.employeeName = row.employeeName.trim();
          existing.officialEmail = (row.officialEmail || '').trim().toLowerCase();
          existing.mobileNumber = (row.mobileNumber || '').trim();
          existing.designation = row.designation.trim();
          existing.department = row.department.trim();
          existing.areaOfWork = (row.areaOfWork || '').trim();
          existing.mineComplexCode = unit.code;
          existing.mineComplexName = unit.name;
          existing.location = (row.location || unit.location).trim();
          existing.employeeStatus = row.employeeStatus === 'Inactive' ? 'Inactive' : 'Active';
          existing.updatedAt = now;
          existing.updatedBy = uploadedBy || 'Admin';
          updatedCount++;
        }
      } else {
        db.employeeMaster.unshift({
          id: `em-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          employeeName: row.employeeName.trim(),
          sapEmployeeId: sapId,
          officialEmail: (row.officialEmail || '').trim().toLowerCase(),
          mobileNumber: (row.mobileNumber || '').trim(),
          designation: row.designation.trim(),
          department: row.department.trim(),
          areaOfWork: (row.areaOfWork || '').trim(),
          mineComplexCode: unit.code,
          mineComplexName: unit.name,
          location: (row.location || unit.location).trim(),
          employeeStatus: row.employeeStatus === 'Inactive' ? 'Inactive' : 'Active',
          createdAt: now,
          updatedAt: now,
          updatedBy: uploadedBy || 'Admin',
        });
        importedCount++;
      }
    }

    const hist: EmployeeImportHistory = {
      id: `imp-${Date.now()}`,
      timestamp: now,
      uploadedBy: uploadedBy || 'Portal Administrator',
      uploadedByRole: uploadedByRole || 'admin',
      filename: filename || 'employee_master.xlsx',
      totalRows: Number(totalUploaded) || validRows.length,
      importedCount,
      updatedCount,
      duplicateCount: Number(duplicateCount) || 0,
      rejectedCount: Number(rejectedCount) || 0,
      errorsSummary: Array.isArray(errorsSummary) ? errorsSummary : [],
    };
    db.employeeImportHistory.unshift(hist);
    db.addActivity(hist.uploadedBy, 'admin', 'EMPLOYEE_MASTER_EXCEL_IMPORT', hist.filename, `Imported ${importedCount} new, updated ${updatedCount} existing employees from ${hist.filename}.`);
    db.addAudit(hist.uploadedBy, 'admin', 'EXCEL_IMPORT_EMPLOYEE_MASTER', 'EmployeeMaster', hist.id, undefined, `${importedCount} imported / ${updatedCount} updated`, hist.filename, 'SUCCESS');
    saveToStorage();

    return { success: true, summary: hist } as T;
  }

  if (pathname === '/api/employee-master/import-history' && method === 'GET') {
    return { success: true, data: db.employeeImportHistory } as T;
  }

  // -------------------------------------------------------------------------
  // 5. ADMIN USER & VENDOR VERIFICATION LIFECYCLE
  // -------------------------------------------------------------------------
  if (pathname === '/api/admin/users' && method === 'GET') {
    return { success: true, data: db.users } as T;
  }

  if (pathname === '/api/admin/pending-users' && method === 'GET') {
    const pendingUsers = db.users.filter((u) => u.status === 'Pending');
    const pendingVendors = db.vendors.filter((v) => v.status === 'Pending' || v.status === 'Under Verification');
    return { success: true, users: pendingUsers, vendors: pendingVendors } as T;
  }

  const approveUserMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)\/approve$/);
  if (approveUserMatch && method === 'POST') {
    const userId = approveUserMatch[1];
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error('User record not found');

    user.status = 'Active';
    if (body.assignedRole) user.role = body.assignedRole as UserRole;
    if (user.vendorId) {
      const vendor = db.vendors.find((v) => v.id === user.vendorId);
      if (vendor) vendor.status = 'Active';
    }

    const act = db.addActivity('Portal Administrator', 'admin', 'USER_ACTIVATED', user.name, `User ${user.name} (${user.role}) verified and activated.`);
    db.addAudit('usr-admin', 'admin', 'ACTIVATE_USER', 'User', user.id, 'Pending', 'Active', `Approved role: ${user.role}`, 'SUCCESS');
    broadcastActivity(act);
    saveToStorage();
    return { success: true, message: `Account for ${user.name} activated successfully.`, user } as T;
  }

  const rejectUserMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)\/reject$/);
  if (rejectUserMatch && method === 'POST') {
    const userId = rejectUserMatch[1];
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error('User record not found');

    user.status = 'Suspended';
    if (user.vendorId) {
      const vendor = db.vendors.find((v) => v.id === user.vendorId);
      if (vendor) {
        vendor.status = 'Rejected';
        vendor.rejectionReason = body.reason || 'Verification requirements not met.';
      }
    }
    saveToStorage();
    return { success: true, message: `Registration for ${user.name} rejected.` } as T;
  }

  const roleUpdateMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)\/role$/);
  if (roleUpdateMatch && method === 'PATCH') {
    const userId = roleUpdateMatch[1];
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    const prev = user.role;
    user.role = body.role as UserRole;
    if (body.mineComplexCode) user.mineComplexCode = body.mineComplexCode;
    db.addAudit('admin', 'admin', 'UPDATE_USER_ROLE', 'User', user.id, prev, user.role, 'Admin role update', 'SUCCESS');
    saveToStorage();
    return { success: true, user } as T;
  }

  // -------------------------------------------------------------------------
  // 6. PROBLEM STATEMENTS (5 Units + Video Upload + Approvals)
  // -------------------------------------------------------------------------
  if (pathname === '/api/problems' && method === 'GET') {
    let list = [...db.problemStatements];
    const complex = params.mineComplex || params.complex;
    if (complex && complex !== 'ALL' && complex !== 'All') {
      list = list.filter((p) => p.mineComplexCode === complex);
    }
    if (params.category && params.category !== 'All') {
      list = list.filter((p) => p.category === params.category);
    }
    if (params.status && params.status !== 'All') {
      list = list.filter((p) => p.status === params.status);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.department.toLowerCase().includes(q) ||
          p.detailedProblemStatement.toLowerCase().includes(q)
      );
    }
    return { success: true, data: list } as T;
  }

  if (pathname === '/api/problems' && method === 'POST') {
    const mineCode: MineComplexCode = (body.mineComplexCode as MineComplexCode) || 'HO';
    const complex = getUnitInfo(mineCode);
    const code = db.generateProblemStatementCode(mineCode);

    const newPS: ProblemStatement = {
      id: `ps-${Date.now()}`,
      code,
      mineComplexCode: complex.code,
      mineComplexName: complex.fullName,
      title: body.title || 'Operational Problem Statement',
      department: body.department || 'Mining & HEMM Engineering',
      projectComplex: complex.fullName,
      location: body.location || complex.location,
      originatingOfficer: body.originatingOfficer || 'Originating Officer',
      designation: body.designation || 'Officer',
      submissionDate: new Date().toISOString().substring(0, 10),
      category: body.category || 'Mining & Heavy Earth Moving Machinery (HEMM)',
      subCategory: body.subCategory || '',
      existingSituation: body.existingSituation || '',
      detailedProblemStatement: body.detailedProblemStatement || body.problemDescription || '',
      operationalDifficulties: body.operationalDifficulties || '',
      existingEquipment: body.existingEquipment || '',
      reasonForRequirement: body.reasonForRequirement || '',
      desiredOutcome: body.desiredOutcome || '',
      expectedBenefits: body.expectedBenefits || '',
      supportingTechnicalInfo: body.supportingTechnicalInfo || '',
      requiredSolution: body.requiredSolution || '',
      technicalSpecifications: body.technicalSpecifications || '',
      scopeOfSupply: body.scopeOfSupply || '',
      requiredDeliverables: body.requiredDeliverables || '',
      implementationPeriodMonths: Number(body.implementationPeriodMonths) || 6,
      indicativeBudget: body.indicativeBudget || `₹ ${Number(body.budgetNumeric || 0).toFixed(2)} Cr`,
      budgetNumeric: Number(body.budgetNumeric) || 0,
      requiredVendorExperience: body.requiredVendorExperience || '',
      submissionDeadline: body.submissionDeadline || '2026-12-31',
      attachments: Array.isArray(body.attachments) ? body.attachments : [],
      status: body.isDraft ? 'Draft' : 'Submitted',
      publishedDate: undefined,
      createdBy: body.originatingOfficer || 'NMDC Officer',
      approvals: [
        {
          stage: 'Department Review',
          action: 'Approved',
          officerName: body.originatingOfficer || 'Originating Officer',
          officerRole: 'executive',
          officerDesignation: body.designation || 'Officer',
          remarks: body.isDraft ? 'Saved as draft.' : 'Submitted for departmental scrutiny.',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        },
      ],
      clarifications: [],
      respondedVendorsCount: 0,
      isDemo: false,
    };

    db.problemStatements.unshift(newPS);
    const act = db.addActivity(newPS.originatingOfficer, 'executive', 'PROBLEM_STATEMENT_CREATED', newPS.code, `New problem statement ${newPS.code} created for ${complex.name}.`);
    db.addAudit('usr-exec', 'executive', 'CREATE_PROBLEM_STATEMENT', 'ProblemStatement', newPS.id, undefined, newPS.status, `Unit: ${complex.code}`, 'SUCCESS');
    broadcastActivity(act);
    saveToStorage();
    return { success: true, data: newPS } as T;
  }

  const psApprovalMatch = pathname.match(/^\/api\/problems\/([^/]+)\/(approval|status)$/);
  if (psApprovalMatch && method === 'PATCH') {
    const id = psApprovalMatch[1];
    const { action, officerName, officerRole, officerDesignation, remarks, targetStatus, status } = body;
    const ps = db.problemStatements.find((p) => p.id === id || p.code === id);
    if (!ps) throw new Error('Problem statement not found');

    const prev = ps.status;
    const resolvedStatus = (targetStatus || status) as ProblemStatementStatus;
    ps.status = resolvedStatus;
    if ((resolvedStatus === 'Published' || resolvedStatus === 'Vendor Participation') && !ps.publishedDate) {
      ps.publishedDate = new Date().toISOString().substring(0, 10);
    }

    ps.approvals.push({
      stage: 'Competent Authority Approval',
      action: action || 'Approved',
      officerName: officerName || 'Approving Authority',
      officerRole: officerRole || 'approving_authority',
      officerDesignation: officerDesignation || 'Unit Approving Authority',
      remarks: remarks || 'Reviewed and processed.',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    });

    const act = db.addActivity(officerName || 'Authority', officerRole || 'approving_authority', 'PROBLEM_STATEMENT_STATUS_CHANGED', ps.code, `${ps.code} transitioned from "${prev}" to "${ps.status}".`);
    db.addAudit('usr-approver', officerRole || 'approving_authority', 'APPROVE_PROBLEM_STATEMENT', 'ProblemStatement', ps.id, prev, ps.status, remarks || '', 'SUCCESS');
    broadcastActivity(act);
    saveToStorage();
    return { success: true, data: ps } as T;
  }

  // Legacy PS Clarification queries
  const clarMatch = pathname.match(/^\/api\/problems\/([^/]+)\/clarifications$/);
  if (clarMatch && method === 'POST') {
    const id = clarMatch[1];
    const ps = db.problemStatements.find((p) => p.id === id || p.code === id);
    if (!ps) throw new Error('Problem statement not found');
    const clar: any = {
      id: `clar-${Date.now()}`,
      problemStatementId: ps.id,
      problemStatementCode: ps.code,
      problemStatementTitle: ps.title,
      vendorId: body.vendorId || 'vnd',
      vendorName: body.vendorName || 'Vendor',
      querySubject: body.querySubject || 'Technical query',
      queryText: body.queryText || '',
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'Pending Response',
      isCommonToAll: true,
    };
    ps.clarifications.push(clar);
    saveToStorage();
    return { success: true, data: clar } as T;
  }

  const clarRespMatch = pathname.match(/^\/api\/problems\/([^/]+)\/clarifications\/([^/]+)(\/respond)?$/);
  if (clarRespMatch && method === 'PATCH') {
    const id = clarRespMatch[1];
    const cid = clarRespMatch[2];
    const ps = db.problemStatements.find((p) => p.id === id || p.code === id);
    if (!ps) throw new Error('Problem statement not found');
    const clar = ps.clarifications.find((c) => c.id === cid);
    if (!clar) throw new Error('Clarification not found');
    clar.responseText = body.responseText;
    clar.answeredBy = body.answeredBy || 'Concerned NMDC Department Officer';
    clar.answeredByDesignation = body.answeredByDesignation || 'Officer';
    clar.answeredAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    clar.status = 'Published to All Vendors';
    saveToStorage();
    return { success: true, data: clar } as T;
  }

  // -------------------------------------------------------------------------
  // 7. BUDGETARY OFFER REQUEST MODULE (Change Request Section 5)
  // -------------------------------------------------------------------------
  if (pathname === '/api/budgetary-requests' && method === 'GET') {
    let list = [...db.budgetaryRequests];
    const complex = params.mineComplex || params.complex;
    if (complex && complex !== 'ALL' && complex !== 'All') {
      list = list.filter((b) => b.mineComplexCode === complex);
    }
    if (params.status && params.status !== 'All') {
      list = list.filter((b) => b.status === params.status);
    }
    return { success: true, data: list } as T;
  }

  if (pathname === '/api/budgetary-requests' && method === 'POST') {
    const linkedPs = body.linkedProblemStatementId
      ? db.problemStatements.find((p) => p.id === body.linkedProblemStatementId || p.code === body.linkedProblemStatementId)
      : undefined;

    const mineCode: MineComplexCode = (linkedPs?.mineComplexCode || body.mineComplexCode || 'HO') as MineComplexCode;
    const unit = getUnitInfo(mineCode);
    const requestCode = db.generateBudgetaryRequestCode(mineCode);

    const invitedIds: string[] = Array.isArray(body.invitedVendorIds) ? body.invitedVendorIds : [];
    const invitedNames = invitedIds.map((vid) => db.vendors.find((v) => v.id === vid)?.name || vid);

    const newBor: BudgetaryOfferRequest = {
      id: `bor-${Date.now()}`,
      requestCode,
      mineComplexCode: unit.code,
      mineComplexName: unit.fullName,
      linkedProblemStatementId: linkedPs?.id,
      linkedProblemStatementCode: linkedPs?.code,
      title: (body.title || linkedPs?.title || '').trim(),
      department: body.department || linkedPs?.department || 'Mining & HEMM Engineering',
      requirementCategory: body.requirementCategory || linkedPs?.category || 'Engineering & Automation',
      scopeOfWork: body.scopeOfWork || linkedPs?.scopeOfSupply || '',
      technicalSpecifications: body.technicalSpecifications || linkedPs?.technicalSpecifications || '',
      deliverables: body.deliverables || linkedPs?.requiredDeliverables || '',
      estimatedBudgetCr: Number(body.estimatedBudgetCr ?? linkedPs?.budgetNumeric ?? 0),
      submissionDeadline: body.submissionDeadline || linkedPs?.submissionDeadline || '2026-12-31',
      visibilityScope: body.visibilityScope === 'INVITED_ONLY' ? 'INVITED_ONLY' : 'ALL_ELIGIBLE',
      invitedVendorIds: invitedIds,
      invitedVendorNames: invitedNames,
      status: body.publishImmediately ? 'Published' : body.isDraft ? 'Draft' : 'Pending Approval',
      createdBy: body.createdBy || 'NMDC Officer',
      createdByDesignation: body.createdByDesignation || 'Officer',
      approvedBy: body.publishImmediately ? body.createdBy : undefined,
      approvedAt: body.publishImmediately ? new Date().toISOString().substring(0, 10) : undefined,
      publishedAt: body.publishImmediately ? new Date().toISOString().substring(0, 10) : undefined,
      deadlineHistory: [],
      disclaimerText: BUDGETARY_DISCLAIMER_TEXT,
      attachments: Array.isArray(body.attachments) ? body.attachments : [],
      responsesCount: 0,
      isDemo: false,
      createdAt: new Date().toISOString(),
    };

    if (!newBor.title) throw new Error('Title for Budgetary Offer Request is required.');
    db.budgetaryRequests.unshift(newBor);

    if (newBor.status === 'Published') {
      db.addNotification('New Budgetary Offer Request Published', `${newBor.requestCode}: ${newBor.title} (${unit.shortLabel}). Deadline: ${newBor.submissionDeadline}.`, 'info', '/budgetary', undefined, 'vendor');
    }
    const act = db.addActivity(newBor.createdBy, 'executive', 'BUDGETARY_REQUEST_CREATED', newBor.requestCode, `Created Budgetary Offer Request ${newBor.requestCode} (${unit.code}) · Status: ${newBor.status}.`);
    broadcastActivity(act);
    saveToStorage();
    return { success: true, data: newBor } as T;
  }

  const borStatusMatch = pathname.match(/^\/api\/budgetary-requests\/([^/]+)\/status$/);
  if (borStatusMatch && method === 'PATCH') {
    const id = borStatusMatch[1];
    const bor = db.budgetaryRequests.find((b) => b.id === id || b.requestCode === id);
    if (!bor) throw new Error('Budgetary Offer Request not found');

    const { action, officerName, remarks, newDeadline, cancelReason, visibilityScope, invitedVendorIds } = body;
    const prev = bor.status;

    if (action === 'approve') {
      bor.status = 'Approved';
      bor.approvedBy = officerName || 'Competent Authority';
      bor.approvedAt = new Date().toISOString().substring(0, 10);
    } else if (action === 'publish') {
      bor.status = 'Published';
      bor.publishedAt = new Date().toISOString().substring(0, 10);
      if (visibilityScope) bor.visibilityScope = visibilityScope;
      if (Array.isArray(invitedVendorIds)) {
        bor.invitedVendorIds = invitedVendorIds;
        bor.invitedVendorNames = invitedVendorIds.map((vid: string) => db.vendors.find((v) => v.id === vid)?.name || vid);
      }
      db.addNotification('Budgetary Enquiry Invitation', `${bor.requestCode} published for vendor budgetary offers. Submission due: ${bor.submissionDeadline}.`, 'info', '/budgetary', undefined, 'vendor');
    } else if (action === 'extend_deadline') {
      if (!newDeadline || !remarks?.trim()) {
        throw new Error('New deadline date and approval remarks are mandatory for deadline extension.');
      }
      bor.deadlineHistory.push({
        previousDeadline: bor.submissionDeadline,
        newDeadline,
        approvedBy: officerName || 'Approving Authority',
        approvalRemarks: remarks.trim(),
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      });
      bor.submissionDeadline = newDeadline;
      db.addNotification('Budgetary Deadline Extended', `Submission deadline for ${bor.requestCode} extended to ${newDeadline}.`, 'warning', '/budgetary', undefined, 'vendor');
    } else if (action === 'close') {
      bor.status = 'Closed';
      bor.closedAt = new Date().toISOString().substring(0, 10);
    } else if (action === 'cancel') {
      if (!cancelReason?.trim()) {
        throw new Error('Cancellation reason is mandatory.');
      }
      bor.status = 'Cancelled';
      bor.cancelledAt = new Date().toISOString().substring(0, 10);
      bor.cancellationReason = cancelReason.trim();
    } else if (body.status) {
      bor.status = body.status as BudgetaryRequestStatus;
    }

    const act = db.addActivity(officerName || 'Officer', 'approving_authority', `BOR_${(action || 'UPDATED').toUpperCase()}`, bor.requestCode, `${bor.requestCode} updated (${prev} -> ${bor.status}).`);
    db.addAudit(officerName || 'officer', 'approving_authority', 'UPDATE_BUDGETARY_REQUEST', 'BudgetaryOfferRequest', bor.id, prev, bor.status, remarks || cancelReason || action, 'SUCCESS');
    broadcastActivity(act);
    saveToStorage();
    return { success: true, data: bor } as T;
  }

  // -------------------------------------------------------------------------
  // 8. VENDOR PROPOSALS & BUDGETARY OFFERS (Linkable to PS or BOR)
  // -------------------------------------------------------------------------
  if (pathname === '/api/proposals' && method === 'GET') {
    let list = [...db.proposals];
    const complex = params.mineComplex || params.complex;
    if (complex && complex !== 'ALL' && complex !== 'All') {
      list = list.filter((p) => p.mineComplexCode === complex);
    }
    if (params.problemStatementId) {
      list = list.filter((p) => p.problemStatementId === params.problemStatementId);
    }
    if (params.budgetaryRequestId) {
      list = list.filter((p) => p.budgetaryRequestId === params.budgetaryRequestId);
    }
    if (params.vendorId) {
      list = list.filter((p) => p.vendorId === params.vendorId);
    }
    return { success: true, data: list } as T;
  }

  if (pathname === '/api/proposals' && method === 'POST') {
    const ps = body.problemStatementId
      ? db.problemStatements.find((p) => p.id === body.problemStatementId || p.code === body.problemStatementId)
      : undefined;
    const bor = body.budgetaryRequestId
      ? db.budgetaryRequests.find((b) => b.id === body.budgetaryRequestId || b.requestCode === body.budgetaryRequestId)
      : undefined;

    if (!ps && !bor) {
      throw new Error('Associated Problem Statement or Budgetary Offer Request not found.');
    }

    const mineCode = (ps?.mineComplexCode || bor?.mineComplexCode || 'HO') as MineComplexCode;
    const unit = getUnitInfo(mineCode);
    const proposalCode = db.generateProposalCode(mineCode);

    const newProp: Proposal = {
      id: `prop-${Date.now()}`,
      proposalCode,
      mineComplexCode: unit.code,
      mineComplexName: unit.fullName,
      budgetaryRequestId: bor?.id,
      budgetaryRequestCode: bor?.requestCode,
      problemStatementId: ps?.id || bor?.linkedProblemStatementId || bor?.id || '',
      problemStatementCode: ps?.code || bor?.linkedProblemStatementCode || bor?.requestCode || '',
      problemStatementTitle: ps?.title || bor?.title || 'Vendor Offer',
      vendorId: body.vendorId || '',
      vendorName: body.vendorName || 'Registered Vendor',
      submittedAt: new Date().toISOString(),
      status: body.isDraft ? 'Draft' : 'Submitted',
      isLocked: !body.isDraft,
      revisionNumber: 1,
      versionHistory: [
        {
          revisionNumber: 1,
          submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          revisedBy: body.vendorName || 'Vendor',
          reasonForRevision: 'Initial budgetary offer submission',
          changesSummary: 'Part A, B and C submitted.',
        },
      ],
      understandingOfRequirement: body.understandingOfRequirement || '',
      proposedSolution: body.proposedSolution || '',
      technicalSpecifications: body.technicalSpecifications || '',
      equipmentDetails: body.equipmentDetails || '',
      softwareDetails: body.softwareDetails || '',
      systemArchitecture: body.systemArchitecture || '',
      scopeOfSupply: body.scopeOfSupply || '',
      installationCommissioning: body.installationCommissioning || '',
      integrationRequirements: body.integrationRequirements || '',
      implementationMethodology: body.implementationMethodology || '',
      deliveryPeriodWeeks: Number(body.deliveryPeriodWeeks) || 12,
      warrantyMonths: Number(body.warrantyMonths) || 12,
      amcScope: body.amcScope || '',
      trainingScope: body.trainingScope || '',
      technicalDeviations: body.technicalDeviations || 'None.',
      supportingDocuments: Array.isArray(body.supportingDocuments) ? body.supportingDocuments : [],
      costBreakdown: body.costBreakdown || {
        equipmentCost: 0, hardwareCost: 0, softwareCost: 0, licenceCost: 0,
        installationCost: 0, commissioningCost: 0, integrationCost: 0, trainingCost: 0,
        freightCost: 0, amcCostPerYear: 0, otherCharges: 0, subtotalCost: 0,
        gstRate: 18, gstAmount: 0, totalEstimatedCost: 0,
      },
      commercialConditions: body.commercialConditions || {
        deliveryPeriodWeeks: 12,
        offerValidityDays: 90,
        paymentTerms: 'Standard NMDC Budgetary Milestones',
        warrantyPeriodMonths: 12,
        amcYears: 3,
        priceBasis: `FOR Destination (${unit.name})`,
        taxesAndDuties: 'GST extra at prevailing statutory rates',
        otherCommercialConditions: '',
      },
      isDemo: false,
    };

    db.proposals.unshift(newProp);
    if (ps) ps.respondedVendorsCount = (ps.respondedVendorsCount || 0) + 1;
    if (bor) bor.responsesCount = (bor.responsesCount || 0) + 1;

    const act = db.addActivity(newProp.vendorName, 'vendor', 'PROPOSAL_SUBMITTED', newProp.proposalCode, `Offer ${newProp.proposalCode} submitted for ${newProp.problemStatementCode} (${unit.code}).`);
    db.addNotification('New Vendor Budgetary Offer Received', `${newProp.vendorName} submitted ${newProp.proposalCode} against ${newProp.problemStatementCode}.`, 'success', '/proposals');
    broadcastActivity(act);
    saveToStorage();
    return { success: true, data: newProp } as T;
  }

  const propEvalMatch = pathname.match(/^\/api\/proposals\/([^/]+)\/evaluate$/);
  if (propEvalMatch && method === 'PATCH') {
    const id = propEvalMatch[1];
    const prop = db.proposals.find((p) => p.id === id || p.proposalCode === id);
    if (!prop) throw new Error('Proposal not found');

    prop.technicalComplianceStatus = body.complianceStatus || 'Compliant';
    prop.technicalMarks = Number(body.marks) || 0;
    prop.technicalRemarks = body.remarks || '';
    prop.evaluatedBy = body.evaluatorName || 'Evaluator';
    prop.evaluatedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    prop.committeeRecommendation = body.recommendation || 'Recommend PoC';
    prop.status =
      body.complianceStatus === 'Compliant'
        ? 'Technically Qualified'
        : body.complianceStatus === 'Non-Compliant'
        ? 'Technically Disqualified'
        : 'Under Technical Evaluation';

    db.addActivity(prop.evaluatedBy || 'Evaluator', 'tech_evaluator', 'TECHNICAL_EVALUATION_RECORDED', prop.proposalCode, `Evaluated ${prop.proposalCode}: ${prop.technicalComplianceStatus} (${prop.technicalMarks}/100)`);
    saveToStorage();
    return { success: true, data: prop } as T;
  }

  // -------------------------------------------------------------------------
  // 9. DISCUSSION & CLARIFICATIONS FACILITY (Immutable + Confidential)
  // -------------------------------------------------------------------------
  if (pathname === '/api/discussions' && method === 'GET') {
    let list = [...db.discussions];
    if (params.mineComplex && params.mineComplex !== 'ALL') {
      list = list.filter((d) => d.mineComplexCode === params.mineComplex);
    }
    if (params.linkedEntityId) {
      list = list.filter((d) => d.linkedEntityId === params.linkedEntityId || d.linkedEntityCode === params.linkedEntityId);
    }
    // Strict vendor privacy: vendors can ONLY view common public clarifications OR their own private vendor thread
    if (params.viewerRole === 'vendor') {
      const vId = params.vendorId || '';
      list = list.filter((d) => d.isCommonPublic || (vId && d.vendorId === vId));
    }
    return { success: true, data: list } as T;
  }

  if (pathname === '/api/discussions' && method === 'POST') {
    const {
      mineComplexCode,
      linkedEntityType,
      linkedEntityId,
      linkedEntityCode,
      linkedEntityTitle,
      subject,
      vendorId,
      vendorName,
      isCommonPublic,
      senderId,
      senderName,
      senderOrganisation,
      senderRole,
      messageText,
      attachments,
    } = body;

    if (!subject?.trim() || !messageText?.trim() || !linkedEntityId) {
      throw new Error('Subject, Linked Reference and Message text are required.');
    }

    const mineCode: MineComplexCode = (mineComplexCode as MineComplexCode) || 'HO';
    const threadCode = db.generateDiscussionCode(mineCode);
    const nowIso = new Date().toISOString();
    const displayTs = nowIso.replace('T', ' ').substring(0, 16);
    const threadId = `dsc-${Date.now()}`;

    const firstMsg: DiscussionMessage = {
      id: `msg-${Date.now()}`,
      threadId,
      senderId: senderId || 'usr',
      senderName: senderName || 'User',
      senderOrganisation: senderOrganisation || 'NMDC Portal',
      senderRole: (senderRole as UserRole) || 'executive',
      messageText: messageText.trim(),
      attachments: Array.isArray(attachments) ? attachments : [],
      timestamp: displayTs,
      isOfficialClarification: Boolean(isCommonPublic),
    };

    const thread: DiscussionThread = {
      id: threadId,
      threadCode,
      mineComplexCode: mineCode,
      linkedEntityType: linkedEntityType || 'PROBLEM',
      linkedEntityId,
      linkedEntityCode: linkedEntityCode || linkedEntityId,
      linkedEntityTitle: linkedEntityTitle || '',
      subject: subject.trim(),
      vendorId: isCommonPublic ? undefined : vendorId,
      vendorName: isCommonPublic ? undefined : vendorName,
      isCommonPublic: Boolean(isCommonPublic),
      status: 'Open',
      unreadByVendor: senderRole !== 'vendor' ? 1 : 0,
      unreadByOfficer: senderRole === 'vendor' ? 1 : 0,
      messages: [firstMsg],
      isDemo: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.discussions.unshift(thread);
    db.addNotification(
      isCommonPublic ? 'Common Official Clarification Published' : 'New Clarification Thread Started',
      `${threadCode} on ${thread.linkedEntityCode}: "${thread.subject}"`,
      'info',
      '/discussions',
      undefined,
      senderRole === 'vendor' ? 'executive' : 'vendor'
    );
    const act = db.addActivity(firstMsg.senderName, firstMsg.senderRole, 'DISCUSSION_THREAD_CREATED', thread.threadCode, `Started clarification thread on ${thread.linkedEntityCode}.`);
    broadcastActivity(act);
    saveToStorage();
    return { success: true, data: thread } as T;
  }

  const dscMsgMatch = pathname.match(/^\/api\/discussions\/([^/]+)\/messages$/);
  if (dscMsgMatch && method === 'POST') {
    const id = dscMsgMatch[1];
    const thread = db.discussions.find((d) => d.id === id || d.threadCode === id);
    if (!thread) throw new Error('Discussion thread not found');
    if (thread.status === 'Closed') throw new Error('This discussion has been closed and is locked as a permanent record.');
    if (!body.messageText?.trim()) throw new Error('Message text cannot be empty.');

    const nowIso = new Date().toISOString();
    const msg: DiscussionMessage = {
      id: `msg-${Date.now()}`,
      threadId: thread.id,
      senderId: body.senderId || 'usr',
      senderName: body.senderName || 'User',
      senderOrganisation: body.senderOrganisation || 'NMDC',
      senderRole: (body.senderRole as UserRole) || 'executive',
      messageText: body.messageText.trim(),
      attachments: Array.isArray(body.attachments) ? body.attachments : [],
      timestamp: nowIso.replace('T', ' ').substring(0, 16),
      isOfficialClarification: Boolean(body.isOfficialClarification),
    };

    thread.messages.push(msg);
    thread.updatedAt = nowIso;
    if (msg.senderRole === 'vendor') {
      thread.unreadByOfficer += 1;
    } else {
      thread.unreadByVendor += 1;
    }

    db.addNotification(
      `New Reply in ${thread.threadCode}`,
      `${msg.senderName} (${msg.senderOrganisation}) replied on ${thread.linkedEntityCode}.`,
      'info',
      '/discussions'
    );
    saveToStorage();
    return { success: true, data: thread } as T;
  }

  const dscCloseMatch = pathname.match(/^\/api\/discussions\/([^/]+)\/close$/);
  if (dscCloseMatch && method === 'PATCH') {
    const id = dscCloseMatch[1];
    const thread = db.discussions.find((d) => d.id === id || d.threadCode === id);
    if (!thread) throw new Error('Discussion thread not found');
    thread.status = 'Closed';
    const closedByName = body.closedBy || 'Authorized NMDC Officer';
    thread.closedBy = closedByName;
    thread.closedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    db.addActivity(closedByName, 'executive', 'DISCUSSION_CLOSED', thread.threadCode, `Closed discussion ${thread.threadCode}.`);
    saveToStorage();
    return { success: true, data: thread } as T;
  }

  const dscReadMatch = pathname.match(/^\/api\/discussions\/([^/]+)\/read$/);
  if (dscReadMatch && method === 'PATCH') {
    const id = dscReadMatch[1];
    const thread = db.discussions.find((d) => d.id === id);
    if (thread) {
      if (body.role === 'vendor') thread.unreadByVendor = 0;
      else thread.unreadByOfficer = 0;
      saveToStorage();
    }
    return { success: true } as T;
  }

  // -------------------------------------------------------------------------
  // 10. PoC, AWARD OF WORK, PROJECTS, VENDORS
  // -------------------------------------------------------------------------
  if (pathname === '/api/pocs' && method === 'GET') {
    let list = [...db.pocRecords];
    const complex = params.mineComplex || params.complex;
    if (complex && complex !== 'ALL' && complex !== 'All') list = list.filter((p) => p.mineComplexCode === complex);
    if (params.status && params.status !== 'All') list = list.filter((p) => p.status === params.status);
    return { success: true, data: list } as T;
  }

  if (pathname === '/api/pocs' && method === 'POST') {
    const mineCode: MineComplexCode = (body.mineComplexCode as MineComplexCode) || 'HO';
    const unit = getUnitInfo(mineCode);
    const pocCode = db.generatePocCode(mineCode);

    const newPoc: PocRecord = {
      id: `poc-${Date.now()}`,
      pocCode,
      mineComplexCode: unit.code,
      mineComplexName: unit.fullName,
      relatedProblemStatementId: body.relatedProblemStatementId || '',
      problemStatementCode: body.problemStatementCode || '',
      problemStatementTitle: body.problemStatementTitle || 'Field Trial',
      vendorId: body.vendorId || '',
      vendorName: body.vendorName || '',
      trialLocation: body.trialLocation || unit.fullName,
      equipmentProcess: body.equipmentProcess || 'Operational Equipment',
      pocScope: body.pocScope || '',
      trialPeriodWeeks: Number(body.trialPeriodWeeks) || 4,
      startDate: body.startDate || new Date().toISOString().substring(0, 10),
      completionDate: body.completionDate || '2026-12-31',
      baselinePerformance: body.baselinePerformance || '',
      expectedPerformance: body.expectedPerformance || '',
      evaluationParameters: Array.isArray(body.evaluationParameters) ? body.evaluationParameters : ['Measurement accuracy', 'System uptime'],
      nmdcCommitteeMembers: Array.isArray(body.nmdcCommitteeMembers) ? body.nmdcCommitteeMembers : ['PoC Committee Chair'],
      vendorResponsibilities: body.vendorResponsibilities || '',
      trialCost: Number(body.trialCost) || 0,
      status: (body.status as PocStatus) || 'Proposed',
      progressPct: 0,
      trialReports: [],
      isClosed: false,
      isDemo: false,
    };

    db.pocRecords.unshift(newPoc);
    db.addActivity('PoC Committee', 'poc_committee', 'POC_INITIATED', newPoc.pocCode, `PoC trial ${newPoc.pocCode} initiated for ${unit.name}.`);
    saveToStorage();
    return { success: true, data: newPoc } as T;
  }

  const pocStatusMatch = pathname.match(/^\/api\/pocs\/([^/]+)\/status$/);
  if (pocStatusMatch && method === 'PATCH') {
    const id = pocStatusMatch[1];
    const poc = db.pocRecords.find((p) => p.id === id || p.pocCode === id);
    if (!poc) throw new Error('PoC record not found');
    const prev = poc.status;
    poc.status = body.status as PocStatus;
    if (body.progressPct !== undefined) poc.progressPct = Number(body.progressPct);
    if (body.actualResults) poc.actualResults = body.actualResults;
    if (body.observations) poc.observations = body.observations;
    if (body.recommendations) poc.recommendations = body.recommendations;
    if (body.status === 'Closed' || body.status === 'Successful') poc.isClosed = true;
    db.addActivity('PoC Committee', 'poc_committee', 'POC_STATUS_UPDATED', poc.pocCode, `PoC ${poc.pocCode}: ${prev} -> ${body.status}.`);
    saveToStorage();
    return { success: true, data: poc } as T;
  }

  if (pathname === '/api/awards' && method === 'GET') {
    let list = [...db.awardsOfWork];
    const complex = params.mineComplex || params.complex;
    if (complex && complex !== 'ALL' && complex !== 'All') list = list.filter((a) => a.mineComplexCode === complex);
    return { success: true, data: list } as T;
  }

  if (pathname === '/api/awards' && method === 'POST') {
    const mineCode: MineComplexCode = (body.mineComplexCode as MineComplexCode) || 'HO';
    const unit = getUnitInfo(mineCode);
    const awardCode = db.generateAwardCode(mineCode);

    const newAward: AwardOfWork = {
      id: `aow-${Date.now()}`,
      awardCode,
      mineComplexCode: unit.code,
      mineComplexName: unit.fullName,
      problemStatementId: body.problemStatementId || '',
      problemStatementCode: body.problemStatementCode || '',
      workTitle: body.workTitle || 'Implementation Contract',
      vendorId: body.vendorId || '',
      vendorName: body.vendorName || '',
      procurementReference: body.procurementReference || `NMDC/${mineCode}/PROC/2026/001`,
      tenderEnquiryNumber: body.tenderEnquiryNumber || `NMDC-${mineCode}-TENDER-2026-001`,
      gemBidNumber: body.gemBidNumber || 'GEM/2026/B/001',
      prNumber: body.prNumber || 'PR-2026-001',
      poNumber: body.poNumber || 'PO-450000001',
      loaNumber: body.loaNumber || `LOA/NMDC/${mineCode}/2026/001`,
      contractNumber: body.contractNumber || `CONT-NMDC-${mineCode}-2026-001`,
      awardDate: body.awardDate || new Date().toISOString().substring(0, 10),
      basicAwardValue: Number(body.basicAwardValue) || 0,
      gstAmount: Number(body.gstAmount) || 0,
      totalContractValue: Number(body.totalContractValue) || 0,
      deliveryPeriodWeeks: Number(body.deliveryPeriodWeeks) || 12,
      completionPeriodMonths: Number(body.completionPeriodMonths) || 6,
      warrantyPeriodMonths: Number(body.warrantyMonths) || 12,
      pbgDetails: body.pbgDetails || {
        bgNumber: 'BG-PENDING',
        issuingBank: 'Bank',
        amount: Math.round((Number(body.totalContractValue) || 0) * 0.05),
        validityDate: '2027-12-31',
      },
      paymentTerms: body.paymentTerms || 'Standard NMDC Commercial Milestones',
      scopeOfWorkSummary: body.scopeOfWorkSummary || '',
      responsibleOfficer: body.responsibleOfficer || 'Nodal Officer',
      responsibleOfficerDesignation: body.responsibleOfficerDesignation || 'DGM (Projects)',
      department: body.department || 'Mining Engineering',
      projectComplex: unit.fullName,
      status: 'Sanctioned',
      documents: [],
      isDemo: false,
    };

    db.awardsOfWork.unshift(newAward);

    const projectCode = db.generateProjectCode(mineCode);
    const newProject: Project = {
      id: `prj-${Date.now()}`,
      projectCode,
      mineComplexCode: unit.code,
      mineComplexName: unit.fullName,
      awardId: newAward.id,
      problemStatementId: newAward.problemStatementId,
      problemStatementCode: newAward.problemStatementCode,
      name: newAward.workTitle,
      vendorId: newAward.vendorId,
      vendorName: newAward.vendorName,
      department: newAward.department,
      projectComplex: unit.fullName,
      projectHead: `${unit.shortLabel} Head`,
      projectManager: newAward.responsibleOfficer,
      approvedValueCr: Number((newAward.totalContractValue / 10000000).toFixed(2)),
      actualExpenditureCr: 0,
      startDate: new Date().toISOString().substring(0, 10),
      targetCompletionDate: '2026-12-31',
      currentStage: 'Project Initiation',
      health: 'On Track',
      physicalProgressPct: 0,
      financialProgressPct: 0,
      milestones: [
        {
          id: `m-${Date.now()}-1`,
          title: 'Project Initiation & Kickoff',
          stage: 'Project Initiation',
          plannedStartDate: new Date().toISOString().substring(0, 10),
          plannedFinishDate: '2026-06-30',
          progressPct: 0,
          status: 'On Track',
          responsibleOfficer: newAward.responsibleOfficer,
          vendorResponsibility: 'Project Lead',
          delayDays: 0,
          deliverables: 'Charter and baseline schedule.',
        },
      ],
      slaRecords: [],
      warrantyExpiryDate: '2027-12-31',
      amcActive: true,
      performanceScore: 100,
      reports: [],
      isDemo: false,
    };
    db.projects.unshift(newProject);
    db.addActivity(newAward.responsibleOfficer, 'approving_authority', 'AWARD_OF_WORK_SANCTIONED', newAward.awardCode, `Award ${newAward.awardCode} issued for ${unit.name}.`);
    saveToStorage();
    return { success: true, data: newAward } as T;
  }

  if (pathname === '/api/projects' && method === 'GET') {
    let list = [...db.projects];
    const complex = params.mineComplex || params.complex;
    if (complex && complex !== 'ALL' && complex !== 'All') list = list.filter((p) => p.mineComplexCode === complex);
    return { success: true, data: list } as T;
  }

  const projMilestoneMatch = pathname.match(/^\/api\/projects\/([^/]+)\/milestones\/([^/]+)$/);
  if (projMilestoneMatch && method === 'PATCH') {
    const id = projMilestoneMatch[1];
    const mid = projMilestoneMatch[2];
    const proj = db.projects.find((p) => p.id === id || p.projectCode === id);
    if (!proj) throw new Error('Project not found');
    const milestone = proj.milestones.find((m) => m.id === mid);
    if (milestone) {
      if (body.progressPct !== undefined) milestone.progressPct = Number(body.progressPct);
      if (body.status) milestone.status = body.status;
      if (body.delayDays !== undefined) milestone.delayDays = Number(body.delayDays);
    }
    if (body.currentStage) proj.currentStage = body.currentStage;
    if (proj.milestones.length > 0) {
      proj.physicalProgressPct = Math.round(proj.milestones.reduce((acc, m) => acc + m.progressPct, 0) / proj.milestones.length);
    }
    saveToStorage();
    return { success: true, data: proj } as T;
  }

  if (pathname === '/api/vendors' && method === 'GET') {
    return { success: true, data: db.vendors } as T;
  }

  const vendorStatusMatch = pathname.match(/^\/api\/vendors\/([^/]+)\/status$/);
  if (vendorStatusMatch && method === 'PATCH') {
    const id = vendorStatusMatch[1];
    const vendor = db.vendors.find((v) => v.id === id);
    if (!vendor) throw new Error('Vendor not found');
    const prev = vendor.status;
    vendor.status = body.status as VendorStatus;
    if (body.rejectionReason) vendor.rejectionReason = body.rejectionReason;
    if (body.status === 'Approved' || body.status === 'Active') {
      vendor.documents.forEach((d) => { d.status = 'Verified'; });
    }
    const user = db.users.find((u) => u.vendorId === vendor.id);
    if (user) {
      user.status = body.status === 'Active' || body.status === 'Approved' ? 'Active' : body.status === 'Suspended' || body.status === 'Rejected' ? 'Suspended' : 'Pending';
    }
    db.addActivity('Portal Administrator', 'admin', 'VENDOR_STATUS_UPDATED', vendor.name, `Vendor "${vendor.name}": ${prev} -> ${body.status}.`);
    saveToStorage();
    return { success: true, data: vendor } as T;
  }

  if (pathname === '/api/evaluation-parameters' && method === 'GET') {
    return { success: true, data: db.evaluationParameters } as T;
  }

  if (pathname === '/api/notifications' && method === 'GET') {
    return { success: true, data: db.notifications } as T;
  }

  const notifReadMatch = pathname.match(/^\/api\/notifications\/([^/]+)\/read$/);
  if (notifReadMatch && method === 'PATCH') {
    const n = db.notifications.find((notif) => notif.id === notifReadMatch[1]);
    if (n) n.read = true;
    saveToStorage();
    return { success: true } as T;
  }

  if (pathname === '/api/activities' && method === 'GET') {
    return { success: true, data: db.activityLogs.slice(0, 100) } as T;
  }

  if (pathname === '/api/audit-logs' && method === 'GET') {
    return { success: true, data: db.auditLogs.slice(0, 100) } as T;
  }

  return { success: true, data: [] } as T;
}

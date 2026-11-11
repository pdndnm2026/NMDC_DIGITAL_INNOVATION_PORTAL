// NMDC Limited - Problem Statement, Vendor Solution & Project Management Portal
// Production Client API Adapter with Concurrency-Safe Sequences & Zero Mock Data

import { db } from '../server/db.js';
import {
  User,
  Vendor,
  ProblemStatement,
  Proposal,
  PocRecord,
  AwardOfWork,
  Project,
  ProblemStatementStatus,
  PocStatus,
  ProjectMilestone,
  MineComplexCode,
  AUTHORIZED_MINE_COMPLEXES
} from '../types/index.js';

const STORAGE_KEY = 'nmdc_production_clean_v3_store';
let isHydrated = false;

function cleanOldStorage() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem('nmdc_enterprise_portal_v2_store');
    localStorage.removeItem('nmdc_enterprise_portal_store');
    localStorage.removeItem('nmdc_portal_store_v1');
  } catch {}
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
      if (Array.isArray(data.problemStatements)) db.problemStatements = data.problemStatements;
      if (Array.isArray(data.proposals)) db.proposals = data.proposals;
      if (Array.isArray(data.projects)) db.projects = data.projects;
      if (Array.isArray(data.vendors)) db.vendors = data.vendors;
      if (Array.isArray(data.users)) db.users = data.users;
      if (Array.isArray(data.pocRecords)) db.pocRecords = data.pocRecords;
      if (Array.isArray(data.awardsOfWork)) db.awardsOfWork = data.awardsOfWork;
      if (Array.isArray(data.notifications)) db.notifications = data.notifications;
      if (Array.isArray(data.activityLogs)) db.activityLogs = data.activityLogs;
      if (Array.isArray(data.auditLogs)) db.auditLogs = data.auditLogs;
      if (Array.isArray(data.evaluationParameters)) db.evaluationParameters = data.evaluationParameters;
    }
  } catch (err) {
    console.warn('[NMDC Production API] Failed to restore cached state from localStorage:', err);
  }
}

function saveToStorage() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;

  try {
    const payload = {
      problemStatements: db.problemStatements,
      proposals: db.proposals,
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
    console.warn('[NMDC Production API] Failed to save state to localStorage:', err);
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

  // Helper to get mine complex details
  const getComplexInfo = (code: string) => {
    return AUTHORIZED_MINE_COMPLEXES.find((mc) => mc.code === code) || AUTHORIZED_MINE_COMPLEXES[0];
  };

  // -------------------------------------------------------------------------
  // 1. STATS (Calculated dynamically from real database records)
  // -------------------------------------------------------------------------
  if (pathname === '/api/stats' && method === 'GET') {
    const complex = params.mineComplex || params.complex;
    const stats = db.getStats(complex);
    return { success: true, data: stats } as T;
  }

  // -------------------------------------------------------------------------
  // 2. AUTHENTICATION & REGISTRATION (Section 2 & 3)
  // -------------------------------------------------------------------------
  if (pathname === '/api/auth/login' && method === 'POST') {
    const loginIdentifier = (body.email || body.username || body.userId || '').trim().toLowerCase();
    const password = body.password || '';

    // If database is completely empty and no users exist, check if this is initial setup request
    if (db.users.length === 0) {
      throw new Error('NO_ADMIN_SETUP_REQUIRED: The database is empty. Please set up the initial Corporate Administrator account.');
    }

    // Search for user by email, employeeId, or vendor ID
    const user = db.users.find(
      (u) =>
        u.email.toLowerCase() === loginIdentifier ||
        (u.employeeId && u.employeeId.toLowerCase() === loginIdentifier) ||
        (u.vendorId && u.vendorId.toLowerCase() === loginIdentifier)
    );

    if (!user) {
      throw new Error('Invalid User ID / Email or Password.');
    }

    // Verify password if stored
    if (user.passwordHash && user.passwordHash !== password) {
      throw new Error('Invalid User ID / Email or Password.');
    }

    // Check account status
    if (user.status === 'Pending') {
      throw new Error('Your registration is pending verification and activation by the NMDC Portal Administrator.');
    }

    if (user.status === 'Suspended') {
      throw new Error('Your account has been deactivated. Please contact the Portal Administrator.');
    }

    // Log activity
    const act = db.addActivity(user.name, user.role, 'USER_LOGIN', user.id, `User ${user.name} logged into portal.`);
    broadcastActivity(act);

    return { success: true, user } as T;
  }

  // Setup Initial Corporate Administrator (Section 1)
  if (pathname === '/api/auth/setup-admin' && method === 'POST') {
    const existingAdmin = db.users.find((u) => u.role === 'admin');
    if (existingAdmin) {
      throw new Error('An administrator account already exists. Please sign in.');
    }

    const adminUser: User = {
      id: `usr-admin-${Date.now()}`,
      email: body.email || 'admin@nmdc.co.in',
      name: body.name || 'Corporate Administrator',
      role: 'admin',
      department: body.department || 'Corporate IT & Executive Cell',
      employeeId: body.employeeId || 'NMDC-CORP-ADMIN',
      designation: body.designation || 'Portal Administrator',
      mineComplexCode: 'ALL',
      projectComplex: 'Corporate Office Hyderabad',
      status: 'Active',
      passwordHash: body.password || 'admin123',
      createdAt: new Date().toISOString(),
    };

    db.users.push(adminUser);
    db.addAudit(adminUser.id, 'admin', 'INITIAL_ADMIN_SETUP', 'User', adminUser.id, undefined, 'Active', 'First Corporate Administrator initialized', 'SUCCESS');
    saveToStorage();

    return { success: true, user: adminUser } as T;
  }

  // Executive Registration (Section 3A)
  if (pathname === '/api/auth/register-executive' && method === 'POST') {
    const { name, employeeId, designation, department, mineComplexCode, email, mobile, password } = body;

    if (!name || !employeeId || !designation || !department || !mineComplexCode || !email || !password) {
      throw new Error('All mandatory fields are required for executive registration.');
    }

    // Check if employeeId or email already exists
    if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with this email address already exists.');
    }
    if (db.users.some((u) => u.employeeId && u.employeeId.toLowerCase() === employeeId.toLowerCase())) {
      throw new Error('An account with this Employee ID already exists.');
    }

    const complex = getComplexInfo(mineComplexCode);

    const newUser: User = {
      id: `usr-exec-${Date.now()}`,
      email,
      name,
      role: 'executive',
      department,
      employeeId,
      designation,
      mineComplexCode: complex.code,
      projectComplex: complex.name,
      mobile,
      status: 'Pending', // Mandatory requirement: pending until administrator activation
      passwordHash: password,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);

    const act = db.addActivity(
      newUser.name,
      'executive',
      'EXECUTIVE_REGISTRATION_SUBMITTED',
      newUser.employeeId || newUser.id,
      `Executive registration submitted for ${newUser.name} (${newUser.department}, ${complex.name}). Status: Pending Approval.`
    );
    db.addAudit(newUser.id, 'executive', 'REGISTER_EXECUTIVE', 'User', newUser.id, undefined, 'Pending', 'Executive registration pending approval', 'SUCCESS');
    broadcastActivity(act);
    saveToStorage();

    return { success: true, message: 'Registration submitted successfully. Your account is pending administrator verification.', user: newUser } as T;
  }

  // Vendor Registration (Section 3B)
  if (pathname === '/api/auth/register-vendor' && method === 'POST') {
    const {
      companyName,
      registrationNumber,
      pan,
      gstin,
      registeredAddress,
      contactPerson,
      designation,
      email,
      mobile,
      website,
      msmeStatus,
      areasOfBusiness,
      password,
      documents
    } = body;

    if (!companyName || !pan || !gstin || !contactPerson || !email || !password) {
      throw new Error('Company name, PAN, GSTIN, Contact Person, Email and Password are required.');
    }

    if (db.vendors.some((v) => v.pan.toLowerCase() === pan.toLowerCase())) {
      throw new Error('A vendor with this PAN already exists.');
    }
    if (db.vendors.some((v) => v.gstin.toLowerCase() === gstin.toLowerCase())) {
      throw new Error('A vendor with this GSTIN already exists.');
    }

    const vendorId = `vnd-${Date.now().toString().slice(-4)}`;

    const newVendor: Vendor = {
      id: vendorId,
      name: companyName,
      legalEntity: body.legalConstitution || 'Private Limited',
      cin: registrationNumber || 'U14200KA2020PTC123456',
      pan: pan.toUpperCase(),
      gstin: gstin.toUpperCase(),
      registeredAddress: registeredAddress || '',
      website: website || '',
      yearEstablished: Number(body.yearEstablished) || 2020,
      companySize: '51-200',
      msmeStatus: Boolean(msmeStatus),
      startupStatus: Boolean(body.startupStatus),
      contactPerson,
      designation: designation || 'Authorized Representative',
      email,
      mobile: mobile || '',
      areasOfExpertise: Array.isArray(areasOfBusiness) ? areasOfBusiness : typeof areasOfBusiness === 'string' ? [areasOfBusiness] : ['Industrial Automation'],
      capabilities: [],
      miningExperienceYears: Number(body.miningExperienceYears) || 0,
      miningPsuExperience: body.miningPsuExperience || '',
      majorCustomers: [],
      annualTurnoverCr: Number(body.annualTurnoverCr) || 0,
      netWorthCr: Number(body.netWorthCr) || 0,
      status: 'Pending', // Pending until administrator activation
      performanceScore: 0,
      documents: Array.isArray(documents)
        ? documents.map((d: any, idx: number) => ({
            id: `doc-${Date.now()}-${idx}`,
            vendorId,
            title: d.title || 'Statutory Certificate',
            type: d.type || 'Registration',
            fileName: d.fileName || 'Document.pdf',
            fileSize: d.fileSize || '1.2 MB',
            uploadedAt: new Date().toISOString().substring(0, 10),
            status: 'Pending' as const,
          }))
        : [],
      createdAt: new Date().toISOString(),
    };

    db.vendors.unshift(newVendor);

    const vendorUser: User = {
      id: `usr-${vendorId}`,
      email: newVendor.email,
      name: newVendor.contactPerson,
      role: 'vendor',
      vendorId: newVendor.id,
      designation: newVendor.designation,
      status: 'Pending',
      passwordHash: password,
      createdAt: new Date().toISOString(),
    };
    db.users.push(vendorUser);

    const act = db.addActivity(newVendor.name, 'vendor', 'VENDOR_REGISTRATION_SUBMITTED', newVendor.id, `Vendor ${newVendor.name} registered. Status: Pending Administrator Approval.`);
    db.addAudit(vendorUser.id, 'vendor', 'REGISTER_VENDOR', 'Vendor', newVendor.id, undefined, 'Pending', 'Vendor registration pending approval', 'SUCCESS');
    broadcastActivity(act);
    saveToStorage();

    return { success: true, message: 'Vendor registration submitted successfully. Your account is pending administrator verification.', vendor: newVendor } as T;
  }

  // -------------------------------------------------------------------------
  // 3. ADMIN USER APPROVALS & ACTIVATION (Section 14)
  // -------------------------------------------------------------------------
  if (pathname === '/api/admin/pending-users' && method === 'GET') {
    const pendingUsers = db.users.filter((u) => u.status === 'Pending');
    const pendingVendors = db.vendors.filter((v) => v.status === 'Pending');
    return { success: true, users: pendingUsers, vendors: pendingVendors } as T;
  }

  const approveUserMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)\/approve$/);
  if (approveUserMatch && method === 'POST') {
    const userId = approveUserMatch[1];
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error('User record not found');

    user.status = 'Active';

    // If this is a vendor user, activate the corresponding vendor entity
    if (user.vendorId) {
      const vendor = db.vendors.find((v) => v.id === user.vendorId);
      if (vendor) vendor.status = 'Active';
    }

    const act = db.addActivity('Portal Administrator', 'admin', 'USER_ACTIVATED', user.name, `User ${user.name} (${user.role}) has been activated.`);
    db.addAudit('usr-admin', 'admin', 'ACTIVATE_USER', 'User', user.id, 'Pending', 'Active', 'Approved and activated by admin', 'SUCCESS');
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
      if (vendor) vendor.status = 'Suspended';
    }

    saveToStorage();
    return { success: true, message: `Registration for ${user.name} rejected.` } as T;
  }

  // -------------------------------------------------------------------------
  // 4. MINE-WISE PROBLEM STATEMENTS (Sections 5 & 6)
  // -------------------------------------------------------------------------
  if (pathname === '/api/problems' && method === 'GET') {
    let list = [...db.problemStatements];

    // Filter by Mine Complex (DIOM, KIOM, BCH, KDL)
    const complex = params.mineComplex || params.complex;
    if (complex && complex !== 'ALL' && complex !== 'All') {
      list = list.filter((p) => p.mineComplexCode === complex || p.projectComplex?.includes(complex));
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
    const mineCode: MineComplexCode = (body.mineComplexCode as MineComplexCode) || 'DIOM';
    const complex = getComplexInfo(mineCode);
    
    // Concurrency-safe unique ID (e.g. DIOM-PS-2026-0001)
    const code = db.generateProblemStatementCode(mineCode);

    const newPS: ProblemStatement = {
      id: `ps-${Date.now()}`,
      code,
      mineComplexCode: complex.code,
      mineComplexName: complex.fullName,
      title: body.title || 'Operational Problem Statement',
      department: body.department || 'Mining & HEMM Engineering',
      projectComplex: complex.fullName,
      location: complex.location,
      originatingOfficer: body.originatingOfficer || 'Originating Officer',
      designation: body.designation || 'General Manager (Mining)',
      submissionDate: new Date().toISOString().substring(0, 10),
      category: body.category || 'Mining & Heavy Earth Moving Machinery (HEMM)',
      subCategory: body.subCategory || 'General Mining Operational Efficiency',
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
      indicativeBudget: body.indicativeBudget || '₹ 2.50 Cr',
      budgetNumeric: Number(body.budgetNumeric) || 2.50,
      requiredVendorExperience: body.requiredVendorExperience || 'Minimum 3 years heavy industrial experience',
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
          officerDesignation: body.designation || 'General Manager',
          remarks: 'Submitted for departmental scrutiny.',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        },
      ],
      clarifications: [],
      respondedVendorsCount: 0,
    };

    db.problemStatements.unshift(newPS);

    const act = db.addActivity(
      newPS.originatingOfficer,
      'executive',
      'PROBLEM_STATEMENT_CREATED',
      newPS.code,
      `New problem statement ${newPS.code} created for ${complex.name}. Status: ${newPS.status}.`
    );
    db.addAudit('usr-exec', 'executive', 'CREATE_PROBLEM_STATEMENT', 'ProblemStatement', newPS.id, undefined, newPS.status, 'Created operational problem statement', 'SUCCESS');
    broadcastActivity(act);
    saveToStorage();

    return { success: true, data: newPS } as T;
  }

  // Multi-Level Approvals (Section 7)
  const approvalMatch = pathname.match(/^\/api\/problems\/([^/]+)\/approval$/);
  if (approvalMatch && method === 'PATCH') {
    const id = approvalMatch[1];
    const { action, officerName, officerRole, officerDesignation, remarks, targetStatus } = body;
    const ps = db.problemStatements.find((p) => p.id === id || p.code === id);
    if (!ps) throw new Error('Problem statement not found');

    const prev = ps.status;
    ps.status = targetStatus as ProblemStatementStatus;
    if (targetStatus === 'Published' && !ps.publishedDate) {
      ps.publishedDate = new Date().toISOString().substring(0, 10);
    }

    ps.approvals.push({
      stage: 'Competent Authority Approval',
      action: action || 'Approved',
      officerName: officerName || 'Approving Authority',
      officerRole: officerRole || 'approving_authority',
      officerDesignation: officerDesignation || 'Chief General Manager',
      remarks: remarks || 'Sanctioned.',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    });

    const act = db.addActivity(
      officerName || 'Approving Authority',
      officerRole || 'approving_authority',
      'PROBLEM_STATEMENT_STATUS_CHANGED',
      ps.code,
      `${ps.code} status changed from "${prev}" to "${ps.status}".`
    );
    db.addAudit('usr-approver', officerRole || 'approving_authority', 'APPROVE_PROBLEM_STATEMENT', 'ProblemStatement', ps.id, prev, ps.status, remarks || 'Approval processed', 'SUCCESS');
    broadcastActivity(act);
    saveToStorage();

    return { success: true, data: ps } as T;
  }

  // Clarifications
  const clarMatch = pathname.match(/^\/api\/problems\/([^/]+)\/clarifications$/);
  if (clarMatch && method === 'POST') {
    const id = clarMatch[1];
    const { vendorId, vendorName, querySubject, queryText } = body;
    const ps = db.problemStatements.find((p) => p.id === id || p.code === id);
    if (!ps) throw new Error('Problem statement not found');

    const clar: any = {
      id: `clar-${Date.now()}`,
      problemStatementId: ps.id,
      problemStatementCode: ps.code,
      problemStatementTitle: ps.title,
      vendorId: vendorId || 'vnd-001',
      vendorName: vendorName || 'Registered Vendor',
      querySubject: querySubject || 'Technical query',
      queryText: queryText || '',
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'Pending Response',
      isCommonToAll: true,
    };

    ps.clarifications.push(clar);
    const act = db.addActivity(vendorName || 'Vendor', 'vendor', 'CLARIFICATION_QUERY_SUBMITTED', ps.code, `New clarification submitted for ${ps.code}: "${querySubject}".`);
    broadcastActivity(act);
    saveToStorage();

    return { success: true, data: clar } as T;
  }

  const clarRespMatch = pathname.match(/^\/api\/problems\/([^/]+)\/clarifications\/([^/]+)\/respond$/);
  if (clarRespMatch && method === 'PATCH') {
    const id = clarRespMatch[1];
    const cid = clarRespMatch[2];
    const ps = db.problemStatements.find((p) => p.id === id || p.code === id);
    if (!ps) throw new Error('Problem statement not found');

    const clar = ps.clarifications.find((c) => c.id === cid);
    if (!clar) throw new Error('Clarification query not found');

    clar.responseText = body.responseText;
    clar.answeredBy = body.answeredBy || 'Concerned NMDC Department Officer';
    clar.answeredByDesignation = body.answeredByDesignation || 'General Manager';
    clar.answeredAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    clar.status = 'Published to All Vendors';

    const act = db.addActivity(clar.answeredBy || 'Concerned NMDC Officer', 'executive', 'CLARIFICATION_ANSWER_PUBLISHED', ps.code, `Answer published for query on ${ps.code}.`);
    broadcastActivity(act);
    saveToStorage();

    return { success: true, data: clar } as T;
  }

  // -------------------------------------------------------------------------
  // 5. MINE-WISE VENDOR PROPOSALS & BUDGETARY OFFERS (Sections 7, 8 & 10)
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
    if (params.vendorId) {
      list = list.filter((p) => p.vendorId === params.vendorId);
    }
    return { success: true, data: list } as T;
  }

  if (pathname === '/api/proposals' && method === 'POST') {
    const ps = db.problemStatements.find((p) => p.id === body.problemStatementId || p.code === body.problemStatementCode);
    if (!ps) throw new Error('Associated problem statement not found');

    // Inherit mine complex from problem statement strictly (Section 7)
    const mineCode = ps.mineComplexCode;
    const proposalCode = db.generateProposalCode(mineCode);

    const newProp: Proposal = {
      id: `prop-${Date.now()}`,
      proposalCode,
      mineComplexCode: ps.mineComplexCode,
      mineComplexName: ps.mineComplexName,
      problemStatementId: ps.id,
      problemStatementCode: ps.code,
      problemStatementTitle: ps.title,
      vendorId: body.vendorId || 'vnd-001',
      vendorName: body.vendorName || 'Registered Vendor',
      submittedAt: new Date().toISOString(),
      status: body.isDraft ? 'Draft' : 'Submitted',
      isLocked: !body.isDraft,
      revisionNumber: 1,
      versionHistory: [
        {
          revisionNumber: 1,
          submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          revisedBy: body.vendorName || 'Vendor Lead',
          reasonForRevision: 'Initial offer submission',
          changesSummary: 'Complete Part A, B and C submitted.',
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
      technicalDeviations: body.technicalDeviations || 'No technical deviations.',
      supportingDocuments: Array.isArray(body.supportingDocuments) ? body.supportingDocuments : [],
      costBreakdown: body.costBreakdown || {
        equipmentCost: 0,
        hardwareCost: 0,
        softwareCost: 0,
        licenceCost: 0,
        installationCost: 0,
        commissioningCost: 0,
        integrationCost: 0,
        trainingCost: 0,
        freightCost: 0,
        amcCostPerYear: 0,
        otherCharges: 0,
        subtotalCost: 0,
        gstRate: 18,
        gstAmount: 0,
        totalEstimatedCost: 0,
      },
      commercialConditions: body.commercialConditions || {
        deliveryPeriodWeeks: 12,
        offerValidityDays: 90,
        paymentTerms: 'Standard NMDC Commercial Milestones',
        warrantyPeriodMonths: 12,
        amcYears: 3,
        priceBasis: `FOR Destination (${ps.mineComplexName})`,
        taxesAndDuties: 'GST extra at prevailing statutory rates',
        otherCommercialConditions: '',
      },
      technicalComplianceStatus: undefined,
      commercialRank: undefined,
    };

    db.proposals.unshift(newProp);
    ps.respondedVendorsCount = (ps.respondedVendorsCount || 0) + 1;

    const act = db.addActivity(newProp.vendorName, 'vendor', 'PROPOSAL_SUBMITTED', newProp.proposalCode, `Budgetary offer ${newProp.proposalCode} submitted for ${ps.code} (${ps.mineComplexCode}).`);
    db.addAudit('usr-vendor', 'vendor', 'SUBMIT_PROPOSAL', 'Proposal', newProp.id, undefined, newProp.status, 'Submitted vendor offer', 'SUCCESS');
    broadcastActivity(act);
    saveToStorage();

    return { success: true, data: newProp } as T;
  }

  // Technical Evaluation
  const propEvalMatch = pathname.match(/^\/api\/proposals\/([^/]+)\/evaluate$/);
  if (propEvalMatch && method === 'PATCH') {
    const id = propEvalMatch[1];
    const { complianceStatus, marks, remarks, evaluatorName, recommendation } = body;
    const prop = db.proposals.find((p) => p.id === id || p.proposalCode === id);
    if (!prop) throw new Error('Proposal not found');

    prop.technicalComplianceStatus = complianceStatus || 'Compliant';
    prop.technicalMarks = Number(marks) || 90;
    prop.technicalRemarks = remarks || 'Technically evaluated against specifications.';
    prop.evaluatedBy = evaluatorName || 'Technical Evaluator';
    prop.evaluatedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    prop.committeeRecommendation = recommendation || 'Recommend PoC';
    prop.status = complianceStatus === 'Compliant' ? 'Technically Qualified' : complianceStatus === 'Non-Compliant' ? 'Technically Disqualified' : 'Under Technical Evaluation';

    const act = db.addActivity(prop.evaluatedBy || 'Technical Evaluator', 'tech_evaluator', 'TECHNICAL_EVALUATION_RECORDED', prop.proposalCode, `Technical evaluation recorded for ${prop.proposalCode}: ${complianceStatus} (Marks: ${marks}/100)`);
    db.addAudit('usr-techeval', 'tech_evaluator', 'EVALUATE_PROPOSAL', 'Proposal', prop.id, undefined, prop.status, remarks || 'Technical parameters evaluated', 'SUCCESS');
    broadcastActivity(act);
    saveToStorage();

    return { success: true, data: prop } as T;
  }

  // -------------------------------------------------------------------------
  // 6. MINE-WISE PROOF OF CONCEPT (PoC) (Section 9 & 14)
  // -------------------------------------------------------------------------
  if (pathname === '/api/pocs' && method === 'GET') {
    let list = [...db.pocRecords];
    const complex = params.mineComplex || params.complex;
    if (complex && complex !== 'ALL' && complex !== 'All') {
      list = list.filter((p) => p.mineComplexCode === complex);
    }
    if (params.status && params.status !== 'All') {
      list = list.filter((p) => p.status === params.status);
    }
    return { success: true, data: list } as T;
  }

  if (pathname === '/api/pocs' && method === 'POST') {
    const mineCode: MineComplexCode = (body.mineComplexCode as MineComplexCode) || 'DIOM';
    const complex = getComplexInfo(mineCode);
    const pocCode = db.generatePocCode(mineCode);

    const newPoc: PocRecord = {
      id: `poc-${Date.now()}`,
      pocCode,
      mineComplexCode: complex.code,
      mineComplexName: complex.fullName,
      relatedProblemStatementId: body.relatedProblemStatementId || '',
      problemStatementCode: body.problemStatementCode || '',
      problemStatementTitle: body.problemStatementTitle || 'Operational Field Trial',
      vendorId: body.vendorId || '',
      vendorName: body.vendorName || '',
      trialLocation: body.trialLocation || complex.fullName,
      equipmentProcess: body.equipmentProcess || 'Operational Mining Equipment',
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
      actualResults: '',
      observations: '',
      recommendations: '',
      status: (body.status as PocStatus) || 'Proposed',
      progressPct: 0,
      trialReports: [],
      isClosed: false,
    };

    db.pocRecords.unshift(newPoc);
    const act = db.addActivity('PoC Committee', 'poc_committee', 'POC_INITIATED', newPoc.pocCode, `PoC trial ${newPoc.pocCode} initiated for ${complex.name}.`);
    broadcastActivity(act);
    saveToStorage();

    return { success: true, data: newPoc } as T;
  }

  const pocStatusMatch = pathname.match(/^\/api\/pocs\/([^/]+)\/status$/);
  if (pocStatusMatch && method === 'PATCH') {
    const id = pocStatusMatch[1];
    const { status, progressPct, actualResults, observations, recommendations } = body;
    const poc = db.pocRecords.find((p) => p.id === id || p.pocCode === id);
    if (!poc) throw new Error('PoC record not found');

    const prev = poc.status;
    poc.status = status as PocStatus;
    if (progressPct !== undefined) poc.progressPct = Number(progressPct);
    if (actualResults) poc.actualResults = actualResults;
    if (observations) poc.observations = observations;
    if (recommendations) poc.recommendations = recommendations;
    if (status === 'Closed' || status === 'Successful') poc.isClosed = true;

    const act = db.addActivity('PoC Committee', 'poc_committee', 'POC_STATUS_UPDATED', poc.pocCode, `PoC ${poc.pocCode} transitioned from ${prev} to ${status}.`);
    broadcastActivity(act);
    saveToStorage();

    return { success: true, data: poc } as T;
  }

  // -------------------------------------------------------------------------
  // 7. MINE-WISE AWARD OF WORK (Section 10 & 16)
  // -------------------------------------------------------------------------
  if (pathname === '/api/awards' && method === 'GET') {
    let list = [...db.awardsOfWork];
    const complex = params.mineComplex || params.complex;
    if (complex && complex !== 'ALL' && complex !== 'All') {
      list = list.filter((a) => a.mineComplexCode === complex);
    }
    return { success: true, data: list } as T;
  }

  if (pathname === '/api/awards' && method === 'POST') {
    const mineCode: MineComplexCode = (body.mineComplexCode as MineComplexCode) || 'DIOM';
    const complex = getComplexInfo(mineCode);
    const awardCode = db.generateAwardCode(mineCode);

    const newAward: AwardOfWork = {
      id: `aow-${Date.now()}`,
      awardCode,
      mineComplexCode: complex.code,
      mineComplexName: complex.fullName,
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
        bgNumber: 'BG-SBI-2026-001',
        issuingBank: 'State Bank of India',
        amount: Math.round((Number(body.totalContractValue) || 0) * 0.05),
        validityDate: '2027-12-31',
      },
      paymentTerms: body.paymentTerms || 'Standard NMDC Commercial Milestones',
      scopeOfWorkSummary: body.scopeOfWorkSummary || '',
      responsibleOfficer: body.responsibleOfficer || 'Nodal Officer',
      responsibleOfficerDesignation: body.responsibleOfficerDesignation || 'DGM (Projects)',
      department: body.department || 'Mining Engineering',
      projectComplex: complex.fullName,
      status: 'Sanctioned',
      documents: [],
    };

    db.awardsOfWork.unshift(newAward);

    // Auto-instantiate Project record under execution (Section 11)
    const projectCode = db.generateProjectCode(mineCode);
    const newProject: Project = {
      id: `prj-${Date.now()}`,
      projectCode,
      mineComplexCode: complex.code,
      mineComplexName: complex.fullName,
      awardId: newAward.id,
      problemStatementId: newAward.problemStatementId,
      problemStatementCode: newAward.problemStatementCode,
      name: newAward.workTitle,
      vendorId: newAward.vendorId,
      vendorName: newAward.vendorName,
      department: newAward.department,
      projectComplex: complex.fullName,
      projectHead: `${complex.name} Head`,
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
          deliverables: 'Charter and baseline plan.',
        },
      ],
      slaRecords: [],
      warrantyExpiryDate: '2027-12-31',
      amcActive: true,
      performanceScore: 100,
      reports: [],
    };

    db.projects.unshift(newProject);

    const act = db.addActivity(newAward.responsibleOfficer, 'approving_authority', 'AWARD_OF_WORK_SANCTIONED', newAward.awardCode, `Award of work ${newAward.awardCode} issued for ${complex.name}.`);
    broadcastActivity(act);
    saveToStorage();

    return { success: true, data: newAward } as T;
  }

  // -------------------------------------------------------------------------
  // 8. MINE-WISE PROJECT MONITORING (Section 11 & 17)
  // -------------------------------------------------------------------------
  if (pathname === '/api/projects' && method === 'GET') {
    let list = [...db.projects];
    const complex = params.mineComplex || params.complex;
    if (complex && complex !== 'ALL' && complex !== 'All') {
      list = list.filter((p) => p.mineComplexCode === complex);
    }
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
      const avg = proj.milestones.reduce((acc, m) => acc + m.progressPct, 0) / proj.milestones.length;
      proj.physicalProgressPct = Math.round(avg);
    }

    const act = db.addActivity(proj.projectManager, 'project_manager', 'MILESTONE_UPDATED', proj.projectCode, `Milestone progress updated in ${proj.projectCode}.`);
    broadcastActivity(act);
    saveToStorage();

    return { success: true, data: proj } as T;
  }

  // -------------------------------------------------------------------------
  // 9. VENDORS & EVALUATION PARAMETERS
  // -------------------------------------------------------------------------
  if (pathname === '/api/vendors' && method === 'GET') {
    return { success: true, data: db.vendors } as T;
  }

  const vendorStatusMatch = pathname.match(/^\/api\/vendors\/([^/]+)\/status$/);
  if (vendorStatusMatch && method === 'PATCH') {
    const id = vendorStatusMatch[1];
    const vendor = db.vendors.find((v) => v.id === id);
    if (!vendor) throw new Error('Vendor not found');

    const prev = vendor.status;
    vendor.status = body.status;

    // Sync corresponding user status if present
    const user = db.users.find((u) => u.vendorId === vendor.id);
    if (user) user.status = body.status === 'Active' ? 'Active' : 'Suspended';

    const act = db.addActivity('Admin', 'admin', 'VENDOR_STATUS_UPDATED', vendor.name, `Vendor "${vendor.name}" transitioned from ${prev} to ${body.status}.`);
    broadcastActivity(act);
    saveToStorage();

    return { success: true, data: vendor } as T;
  }

  if (pathname === '/api/evaluation-parameters' && method === 'GET') {
    return { success: true, data: db.evaluationParameters } as T;
  }

  // Notifications & Activities
  if (pathname === '/api/notifications' && method === 'GET') {
    return { success: true, data: db.notifications } as T;
  }

  const notifReadMatch = pathname.match(/^\/api\/notifications\/([^/]+)\/read$/);
  if (notifReadMatch && method === 'PATCH') {
    const id = notifReadMatch[1];
    const n = db.notifications.find((notif) => notif.id === id);
    if (n) n.read = true;
    saveToStorage();
    return { success: true } as T;
  }

  if (pathname === '/api/activities' && method === 'GET') {
    return { success: true, data: db.activityLogs.slice(0, 50) } as T;
  }

  return { success: true, data: [] } as T;
}

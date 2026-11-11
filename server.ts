import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './src/server/db.js';
import {
  ProblemStatement,
  Proposal,
  PocRecord,
  AwardOfWork,
  Project,
  Vendor,
  User,
  ProblemStatementStatus,
  PocStatus,
  ProjectStage,
  HealthStatus,
  MineComplexCode,
  AUTHORIZED_MINE_COMPLEXES
} from './src/types/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Set up Server-Sent Events (SSE) subscribers for real-time live admin monitor
const sseClients: Response[] = [];

function broadcastSSE(event: string, data: any) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.write(payload);
    } catch {
      // client dropped
    }
  });
}

const getComplexInfo = (code: string) => {
  return AUTHORIZED_MINE_COMPLEXES.find((mc) => mc.code === code) || AUTHORIZED_MINE_COMPLEXES[0];
};

// REST API ROUTES

// 1. Portal Statistics (Section 4 & 12)
app.get('/api/stats', (req: Request, res: Response) => {
  try {
    const complex = (req.query.mineComplex || req.query.complex) as string;
    const stats = db.getStats(complex);
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Authentication & Registrations (Section 2 & 3)
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const loginIdentifier = (email || '').trim().toLowerCase();

  if (db.users.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'NO_ADMIN_SETUP_REQUIRED: The database is empty. Please set up the initial Corporate Administrator account.',
    });
  }

  const user = db.users.find(
    (u) =>
      u.email.toLowerCase() === loginIdentifier ||
      (u.employeeId && u.employeeId.toLowerCase() === loginIdentifier) ||
      (u.vendorId && u.vendorId.toLowerCase() === loginIdentifier)
  );

  if (!user || (user.passwordHash && user.passwordHash !== password)) {
    return res.status(401).json({ success: false, message: 'Invalid User ID / Email or Password.' });
  }

  if (user.status === 'Pending') {
    return res.status(403).json({
      success: false,
      message: 'Your registration is pending verification and activation by the NMDC Portal Administrator.',
    });
  }

  if (user.status === 'Suspended') {
    return res.status(403).json({
      success: false,
      message: 'Your account has been deactivated. Please contact the Portal Administrator.',
    });
  }

  const act = db.addActivity(user.name, user.role, 'USER_LOGIN', user.id, `User ${user.name} logged into portal.`);
  broadcastSSE('activity', act);

  res.json({ success: true, user });
});

// Setup Initial Corporate Administrator (Section 1)
app.post('/api/auth/setup-admin', (req: Request, res: Response) => {
  const existingAdmin = db.users.find((u) => u.role === 'admin');
  if (existingAdmin) {
    return res.status(400).json({ success: false, message: 'An administrator account already exists. Please sign in.' });
  }

  const adminUser: User = {
    id: `usr-admin-${Date.now()}`,
    email: req.body.email || 'admin@nmdc.co.in',
    name: req.body.name || 'Corporate Administrator',
    role: 'admin',
    department: req.body.department || 'Corporate IT & Executive Cell',
    employeeId: req.body.employeeId || 'NMDC-CORP-ADMIN',
    designation: req.body.designation || 'Portal Administrator',
    mineComplexCode: 'ALL',
    projectComplex: 'Corporate Office Hyderabad',
    status: 'Active',
    passwordHash: req.body.password || 'admin123',
    createdAt: new Date().toISOString(),
  };

  db.users.push(adminUser);
  db.addAudit(adminUser.id, 'admin', 'INITIAL_ADMIN_SETUP', 'User', adminUser.id, undefined, 'Active', 'First Corporate Administrator initialized', 'SUCCESS');

  res.json({ success: true, user: adminUser });
});

// Executive Registration (Section 3A)
app.post('/api/auth/register-executive', (req: Request, res: Response) => {
  const { name, employeeId, designation, department, mineComplexCode, email, mobile, password } = req.body;

  if (!name || !employeeId || !designation || !department || !mineComplexCode || !email || !password) {
    return res.status(400).json({ success: false, message: 'All mandatory fields are required.' });
  }

  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
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
    status: 'Pending',
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
  broadcastSSE('activity', act);

  res.status(201).json({
    success: true,
    message: 'Registration submitted successfully. Your account is pending administrator verification.',
    user: newUser,
  });
});

// Vendor Registration (Section 3B)
app.post('/api/auth/register-vendor', (req: Request, res: Response) => {
  const { companyName, registrationNumber, pan, gstin, registeredAddress, contactPerson, designation, email, mobile, website, msmeStatus, areasOfBusiness, password, documents } = req.body;

  if (!companyName || !pan || !gstin || !contactPerson || !email || !password) {
    return res.status(400).json({ success: false, message: 'Company name, PAN, GSTIN, Contact Person, Email and Password are required.' });
  }

  const vendorId = `vnd-${Date.now().toString().slice(-4)}`;

  const newVendor: Vendor = {
    id: vendorId,
    name: companyName,
    legalEntity: req.body.legalConstitution || 'Private Limited',
    cin: registrationNumber || 'U14200KA2020PTC123456',
    pan: pan.toUpperCase(),
    gstin: gstin.toUpperCase(),
    registeredAddress: registeredAddress || '',
    website: website || '',
    yearEstablished: Number(req.body.yearEstablished) || 2020,
    companySize: '51-200',
    msmeStatus: Boolean(msmeStatus),
    startupStatus: Boolean(req.body.startupStatus),
    contactPerson,
    designation: designation || 'Authorized Representative',
    email,
    mobile: mobile || '',
    areasOfExpertise: Array.isArray(areasOfBusiness) ? areasOfBusiness : [areasOfBusiness || 'Mining Technology'],
    capabilities: [],
    miningExperienceYears: Number(req.body.miningExperienceYears) || 0,
    miningPsuExperience: req.body.miningPsuExperience || '',
    majorCustomers: [],
    annualTurnoverCr: Number(req.body.annualTurnoverCr) || 0,
    netWorthCr: Number(req.body.netWorthCr) || 0,
    status: 'Pending',
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
  broadcastSSE('activity', act);

  res.status(201).json({
    success: true,
    message: 'Vendor registration submitted successfully. Your account is pending administrator verification.',
    vendor: newVendor,
  });
});

// Admin User Activation (Section 14)
app.get('/api/admin/pending-users', (_req: Request, res: Response) => {
  const pendingUsers = db.users.filter((u) => u.status === 'Pending');
  const pendingVendors = db.vendors.filter((v) => v.status === 'Pending');
  res.json({ success: true, users: pendingUsers, vendors: pendingVendors });
});

app.post('/api/admin/users/:id/approve', (req: Request, res: Response) => {
  const { id } = req.params;
  const user = db.users.find((u) => u.id === id);
  if (!user) return res.status(404).json({ success: false, message: 'User record not found' });

  user.status = 'Active';
  if (user.vendorId) {
    const v = db.vendors.find((vendor) => vendor.id === user.vendorId);
    if (v) v.status = 'Active';
  }

  const act = db.addActivity('Portal Administrator', 'admin', 'USER_ACTIVATED', user.name, `User ${user.name} (${user.role}) activated.`);
  broadcastSSE('activity', act);

  res.json({ success: true, message: `Account for ${user.name} activated successfully.`, user });
});

app.post('/api/admin/users/:id/reject', (req: Request, res: Response) => {
  const { id } = req.params;
  const user = db.users.find((u) => u.id === id);
  if (!user) return res.status(404).json({ success: false, message: 'User record not found' });

  user.status = 'Suspended';
  res.json({ success: true, message: `Registration for ${user.name} rejected.` });
});

// 3. Mine-Wise Problem Statements (Sections 5 & 6)
app.get('/api/problems', (req: Request, res: Response) => {
  const { category, status, complex, mineComplex, search } = req.query;
  let list = [...db.problemStatements];

  const targetComplex = (mineComplex || complex) as string;
  if (targetComplex && targetComplex !== 'ALL' && targetComplex !== 'All') {
    list = list.filter((p) => p.mineComplexCode === targetComplex || p.projectComplex.includes(targetComplex));
  }
  if (category && category !== 'All') {
    list = list.filter((p) => p.category === category);
  }
  if (status && status !== 'All') {
    list = list.filter((p) => p.status === status);
  }
  if (search) {
    const q = (search as string).toLowerCase();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        p.detailedProblemStatement.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, data: list });
});

app.post('/api/problems', (req: Request, res: Response) => {
  const body = req.body;
  const mineCode: MineComplexCode = (body.mineComplexCode as MineComplexCode) || 'DIOM';
  const complex = getComplexInfo(mineCode);
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
    detailedProblemStatement: body.detailedProblemStatement || '',
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
        remarks: 'Created and submitted for departmental technical scrutiny.',
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
  broadcastSSE('activity', act);

  res.status(201).json({ success: true, data: newPS });
});

// Approvals & Clarifications
app.patch('/api/problems/:id/approval', (req: Request, res: Response) => {
  const { id } = req.params;
  const { action, officerName, officerRole, officerDesignation, remarks, targetStatus } = req.body;
  const ps = db.problemStatements.find((p) => p.id === id || p.code === id);
  if (!ps) return res.status(404).json({ success: false, message: 'Problem statement not found' });

  const prevStatus = ps.status;
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
    remarks: remarks || 'Reviewed and sanctioned.',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
  });

  const act = db.addActivity(
    officerName || 'Approving Authority',
    officerRole || 'approving_authority',
    'PROBLEM_STATEMENT_STATUS_CHANGED',
    ps.code,
    `${ps.code} status changed from "${prevStatus}" to "${ps.status}".`
  );
  broadcastSSE('activity', act);

  res.json({ success: true, data: ps });
});

// 4. Mine-Wise Proposals (Sections 7, 8 & 10)
app.get('/api/proposals', (req: Request, res: Response) => {
  const { problemStatementId, mineComplex, complex, vendorId } = req.query;
  let list = [...db.proposals];

  const targetComplex = (mineComplex || complex) as string;
  if (targetComplex && targetComplex !== 'ALL' && targetComplex !== 'All') {
    list = list.filter((p) => p.mineComplexCode === targetComplex);
  }
  if (problemStatementId) {
    list = list.filter((p) => p.problemStatementId === problemStatementId);
  }
  if (vendorId) {
    list = list.filter((p) => p.vendorId === vendorId);
  }
  res.json({ success: true, data: list });
});

app.post('/api/proposals', (req: Request, res: Response) => {
  const body = req.body;
  const ps = db.problemStatements.find((p) => p.id === body.problemStatementId || p.code === body.problemStatementCode);
  if (!ps) return res.status(404).json({ success: false, message: 'Problem statement not found' });

  // Strictly inherit mine complex from problem statement (Section 7)
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
  broadcastSSE('activity', act);

  res.status(201).json({ success: true, data: newProp });
});

// Technical Evaluation (Section 12)
app.patch('/api/proposals/:id/evaluate', (req: Request, res: Response) => {
  const { id } = req.params;
  const { complianceStatus, marks, remarks, evaluatorName, recommendation } = req.body;
  const prop = db.proposals.find((p) => p.id === id || p.proposalCode === id);
  if (!prop) return res.status(404).json({ success: false, message: 'Proposal not found' });

  prop.technicalComplianceStatus = complianceStatus || 'Compliant';
  prop.technicalMarks = Number(marks) || 90;
  prop.technicalRemarks = remarks || 'Technically evaluated against specifications.';
  prop.evaluatedBy = evaluatorName || 'Technical Evaluator';
  prop.evaluatedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
  prop.committeeRecommendation = recommendation || 'Recommend PoC';
  prop.status = complianceStatus === 'Compliant' ? 'Technically Qualified' : complianceStatus === 'Non-Compliant' ? 'Technically Disqualified' : 'Under Technical Evaluation';

  const act = db.addActivity(prop.evaluatedBy || 'Technical Evaluator', 'tech_evaluator', 'TECHNICAL_EVALUATION_RECORDED', prop.proposalCode, `Technical evaluation recorded for ${prop.proposalCode}: ${complianceStatus} (Marks: ${marks}/100)`);
  broadcastSSE('activity', act);

  res.json({ success: true, data: prop });
});

// 5. Mine-Wise Proof of Concept (PoC) Management (Section 9 & 14)
app.get('/api/pocs', (req: Request, res: Response) => {
  const { status, mineComplex, complex } = req.query;
  let list = [...db.pocRecords];
  const targetComplex = (mineComplex || complex) as string;
  if (targetComplex && targetComplex !== 'ALL' && targetComplex !== 'All') {
    list = list.filter((p) => p.mineComplexCode === targetComplex);
  }
  if (status && status !== 'All') {
    list = list.filter((p) => p.status === status);
  }
  res.json({ success: true, data: list });
});

app.post('/api/pocs', (req: Request, res: Response) => {
  const body = req.body;
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
  broadcastSSE('activity', act);

  res.status(201).json({ success: true, data: newPoc });
});

app.patch('/api/pocs/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, progressPct, actualResults, observations, recommendations } = req.body;
  const poc = db.pocRecords.find((p) => p.id === id || p.pocCode === id);
  if (!poc) return res.status(404).json({ success: false, message: 'PoC record not found' });

  const prev = poc.status;
  poc.status = status as PocStatus;
  if (progressPct !== undefined) poc.progressPct = Number(progressPct);
  if (actualResults) poc.actualResults = actualResults;
  if (observations) poc.observations = observations;
  if (recommendations) poc.recommendations = recommendations;
  if (status === 'Closed' || status === 'Successful') poc.isClosed = true;

  const act = db.addActivity('PoC Committee', 'poc_committee', 'POC_STATUS_UPDATED', poc.pocCode, `PoC ${poc.pocCode} transitioned from ${prev} to ${status}.`);
  broadcastSSE('activity', act);

  res.json({ success: true, data: poc });
});

// 6. Mine-Wise Award of Work (Section 10 & 16)
app.get('/api/awards', (req: Request, res: Response) => {
  const { mineComplex, complex } = req.query;
  let list = [...db.awardsOfWork];
  const targetComplex = (mineComplex || complex) as string;
  if (targetComplex && targetComplex !== 'ALL' && targetComplex !== 'All') {
    list = list.filter((a) => a.mineComplexCode === targetComplex);
  }
  res.json({ success: true, data: list });
});

app.post('/api/awards', (req: Request, res: Response) => {
  const body = req.body;
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

  // Auto-instantiate Project
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
  broadcastSSE('activity', act);

  res.status(201).json({ success: true, data: newAward });
});

// 7. Mine-Wise Project Execution (Section 11)
app.get('/api/projects', (req: Request, res: Response) => {
  const { mineComplex, complex } = req.query;
  let list = [...db.projects];
  const targetComplex = (mineComplex || complex) as string;
  if (targetComplex && targetComplex !== 'ALL' && targetComplex !== 'All') {
    list = list.filter((p) => p.mineComplexCode === targetComplex);
  }
  res.json({ success: true, data: list });
});

// 8. Vendors & System Config
app.get('/api/vendors', (_req: Request, res: Response) => {
  res.json({ success: true, data: db.vendors });
});

app.get('/api/evaluation-parameters', (_req: Request, res: Response) => {
  res.json({ success: true, data: db.evaluationParameters });
});

app.get('/api/notifications', (_req: Request, res: Response) => {
  res.json({ success: true, data: db.notifications });
});

app.get('/api/activities', (_req: Request, res: Response) => {
  res.json({ success: true, data: db.activityLogs.slice(0, 50) });
});

// Vite Middleware Mounting (for Dev) & Static Serving (for Prod)
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NMDC Production Portal Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

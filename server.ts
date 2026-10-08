import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './src/server/db.js';
import {
  classifyIdeaWithGemini,
  analyzeProposalWithGemini,
  generateDocumentExtraction,
  generateManagementInsights,
  answerNmdcAssistantChat,
  convertPlainProblemToStructured,
  generateProblemToSolutionEngine,
  detectIdeaDuplicates,
  calculateInnovationScore,
} from './src/server/gemini.js';

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

// REST API ROUTES

// 1. Portal Statistics
app.get('/api/stats', (_req: Request, res: Response) => {
  try {
    const stats = db.getStats();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Authentication
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password, role } = req.body;
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  // Demo user lookup or role-switch simulation
  let user = db.users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());

  if (!user && role) {
    user = db.users.find((u) => u.role === role);
  }

  if (!user) {
    // If not pre-seeded, create dynamic authenticated user
    user = {
      id: `usr-${Date.now()}`,
      email: email || 'user@nmdc.co.in',
      name: email?.split('@')[0]?.toUpperCase() || 'NMDC User',
      role: (role as any) || 'executive',
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
  }

  const act = db.addActivity(
    user.name,
    user.role,
    'USER_LOGIN',
    'Authentication',
    `User ${user.email} signed into the portal with role: ${user.role}.`,
    ip
  );
  db.addAudit(user.id, 'USER_LOGIN', 'User', user.id, undefined, user.role, 'SUCCESS', ip);
  broadcastSSE('activity', act);

  res.json({
    success: true,
    user,
    token: `nmdc_jwt_token_${user.id}_${Date.now()}`,
  });
});

app.post('/api/auth/register-executive', (req: Request, res: Response) => {
  const { name, email, employeeId, designation, department, projectComplex, location, contactNumber } = req.body;
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  const newUser = {
    id: `usr-exec-${Date.now()}`,
    email,
    name,
    role: 'executive' as const,
    department,
    employeeId,
    designation,
    projectComplex,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  const act = db.addActivity(name, 'executive', 'NEW_REGISTRATION', 'ExecutiveUser', `Executive ${name} (${employeeId}) registered from ${projectComplex}.`, ip);
  db.addAudit(newUser.id, 'EXECUTIVE_REGISTERED', 'User', newUser.id, undefined, JSON.stringify({ department, projectComplex }), 'SUCCESS', ip);
  broadcastSSE('activity', act);

  db.addNotification('Executive Registration', `Welcome ${name}! Your account is active. You may now submit AI and Digital ideas.`, 'success', '/ideas', newUser.id);

  res.json({ success: true, user: newUser, token: `nmdc_jwt_token_${newUser.id}` });
});

app.post('/api/auth/register-vendor', (req: Request, res: Response) => {
  const {
    companyName,
    legalEntity,
    cin,
    pan,
    gstin,
    registeredAddress,
    website,
    yearEstablished,
    companySize,
    msmeStatus,
    startupStatus,
    contactPerson,
    designation,
    email,
    mobile,
    capabilities,
    miningExperienceYears,
    majorCustomers,
  } = req.body;
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  const vendorId = `vnd-${Date.now().toString(36)}`;
  const newVendor = {
    id: vendorId,
    name: companyName,
    legalEntity: legalEntity || 'Private Limited',
    cin: cin || 'U72900TG2024PTC189201',
    pan: pan || 'AABCV9901M',
    gstin: gstin || '36AABCV9901M1ZT',
    registeredAddress: registeredAddress || 'India',
    website: website || '',
    yearEstablished: parseInt(yearEstablished, 10) || 2020,
    companySize: companySize || '11-50',
    msmeStatus: !!msmeStatus,
    startupStatus: !!startupStatus,
    contactPerson: contactPerson || 'Authorized Representative',
    designation: designation || 'Director',
    email,
    mobile: mobile || '+91 90000 00000',
    capabilities: Array.isArray(capabilities) ? capabilities : ['AI', 'Mining Technology'],
    miningExperienceYears: parseInt(miningExperienceYears, 10) || 3,
    majorCustomers: Array.isArray(majorCustomers) ? majorCustomers : ['PSU / Mining Enterprises'],
    status: 'Active' as const, // Activated for immediate demo workflow
    performanceScore: 85,
    documents: [
      {
        id: `doc-${Date.now()}`,
        vendorId,
        title: 'Company Registration & GSTIN',
        type: 'Registration' as const,
        fileName: `${companyName.replace(/\s+/g, '_')}_Docs.pdf`,
        fileSize: '1.8 MB',
        uploadedAt: new Date().toISOString().split('T')[0],
        status: 'Verified' as const,
      },
    ],
    createdAt: new Date().toISOString(),
  };

  db.vendors.push(newVendor);

  const newUser = {
    id: `usr-v-${Date.now()}`,
    email,
    name: contactPerson || companyName,
    role: 'vendor' as const,
    vendorId,
    designation,
    createdAt: new Date().toISOString(),
  };
  db.users.push(newUser);

  const act = db.addActivity(companyName, 'vendor', 'VENDOR_REGISTERED', 'VendorRegistration', `Vendor "${companyName}" registered and submitted statutory documents.`, ip);
  db.addAudit(newUser.id, 'VENDOR_REGISTERED', 'Vendor', vendorId, undefined, companyName, 'SUCCESS', ip);
  broadcastSSE('activity', act);

  db.addNotification('Vendor Registration Approved', `Vendor "${companyName}" is activated. You can now view challenges and submit proposals.`, 'success', '/problems');

  res.json({ success: true, vendor: newVendor, user: newUser, token: `nmdc_jwt_token_${newUser.id}` });
});

// 3. Ideas Management
app.get('/api/ideas', (req: Request, res: Response) => {
  const { department, status, search, submitterEmail } = req.query;
  let list = [...db.ideas];

  if (submitterEmail) {
    list = list.filter((i) => i.submitterEmail?.toLowerCase() === (submitterEmail as string).toLowerCase());
  }
  if (department && department !== 'All') {
    list = list.filter((i) => i.department === department);
  }
  if (status && status !== 'All') {
    list = list.filter((i) => i.status === status);
  }
  if (search) {
    const q = (search as string).toLowerCase();
    list = list.filter((i) => i.title.toLowerCase().includes(q) || i.problemStatement.toLowerCase().includes(q) || i.ideaCode.toLowerCase().includes(q));
  }

  res.json({ success: true, data: list });
});

app.post('/api/ideas', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const nextSeq = String(db.ideas.length + 1).padStart(3, '0');
    const ideaCode = `IDEA-2025-${nextSeq}`;

    // Perform server-side Gemini AI classification
    let aiClassification = undefined;
    try {
      aiClassification = await classifyIdeaWithGemini({
        title: data.title,
        department: data.department,
        projectComplex: data.projectComplex,
        problemStatement: data.problemStatement,
        existingProcess: data.existingProcess || '',
        proposedInnovation: data.proposedInnovation,
        aiDigitalTechnology: data.aiDigitalTechnology || '',
        expectedBenefit: data.expectedBenefit || '',
      });
    } catch (e) {
      console.error('Classification error:', e);
    }

    const newIdea = {
      ...data,
      id: `idea-${Date.now()}`,
      ideaCode,
      status: 'Submitted',
      submittedAt: new Date().toISOString(),
      aiAnalysis: aiClassification,
      reviewerComments: [],
    };

    db.ideas.unshift(newIdea);

    const act = db.addActivity(
      data.submitterName || 'Executive',
      'executive',
      'IDEA_CREATED',
      ideaCode,
      `Executive ${data.submitterName} submitted innovation idea "${data.title}" for ${data.department}.`,
      ip
    );
    db.addAudit(data.employeeId || 'exec', 'IDEA_CREATED', 'Idea', newIdea.id, undefined, ideaCode, 'SUCCESS', ip);
    broadcastSSE('activity', act);

    db.addNotification(
      'New Idea Submitted',
      `Idea ${ideaCode}: "${data.title}" submitted by ${data.submitterName}. Ready for Screening.`,
      'info',
      '/ideas'
    );

    res.json({ success: true, data: newIdea });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.patch('/api/ideas/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, comment, reviewerName } = req.body;
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  const idea = db.ideas.find((i) => i.id === id);
  if (!idea) return res.status(404).json({ success: false, message: 'Idea not found' });

  const prev = idea.status;
  idea.status = status;
  if (comment) {
    idea.reviewerComments = idea.reviewerComments || [];
    idea.reviewerComments.push(`[${new Date().toLocaleDateString()}] ${reviewerName || 'Reviewer'}: ${comment}`);
  }

  const act = db.addActivity(reviewerName || 'Reviewer', 'reviewer', 'IDEA_STATUS_UPDATED', idea.ideaCode, `Idea ${idea.ideaCode} status transitioned from "${prev}" to "${status}".`, ip);
  db.addAudit('reviewer', 'IDEA_STATUS_UPDATED', 'Idea', id, prev, status, 'SUCCESS', ip);
  broadcastSSE('activity', act);

  db.addNotification(`Idea ${idea.ideaCode} Status: ${status}`, `Reviewer updated status of "${idea.title}".`, 'info', '/ideas');

  res.json({ success: true, data: idea });
});

app.post('/api/ideas/:id/classify', async (req: Request, res: Response) => {
  const { id } = req.params;
  const idea = db.ideas.find((i) => i.id === id);
  if (!idea) return res.status(404).json({ success: false, message: 'Idea not found' });

  const analysis = await classifyIdeaWithGemini({
    title: idea.title,
    department: idea.department,
    projectComplex: idea.projectComplex,
    problemStatement: idea.problemStatement,
    existingProcess: idea.existingProcess,
    proposedInnovation: idea.proposedInnovation,
    aiDigitalTechnology: idea.aiDigitalTechnology,
    expectedBenefit: idea.expectedBenefit,
  });

  idea.aiAnalysis = analysis;
  res.json({ success: true, data: analysis });
});

// 4. Problem Statements (Challenges)
app.get('/api/problems', (req: Request, res: Response) => {
  const { category, department, status, search } = req.query;
  let list = [...db.problemStatements];

  if (category && category !== 'All') {
    list = list.filter((p) => p.category === category);
  }
  if (department && department !== 'All') {
    list = list.filter((p) => p.department === department);
  }
  if (status && status !== 'All') {
    list = list.filter((p) => p.status === status);
  }
  if (search) {
    const q = (search as string).toLowerCase();
    list = list.filter((p) => p.title.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.problemDescription.toLowerCase().includes(q));
  }

  res.json({ success: true, data: list });
});

app.get('/api/problems/:id', (req: Request, res: Response) => {
  const ps = db.problemStatements.find((p) => p.id === req.params.id || p.code === req.params.id);
  if (!ps) return res.status(404).json({ success: false, message: 'Problem statement not found' });
  res.json({ success: true, data: ps });
});

app.post('/api/problems', (req: Request, res: Response) => {
  const data = req.body;
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const nextSeq = String(db.problemStatements.length + 1).padStart(3, '0');
  const code = `PS-${nextSeq}`;

  const newPS = {
    ...data,
    id: `ps-${Date.now()}`,
    code,
    status: 'Open' as const,
    respondedVendorsCount: 0,
    publishedDate: new Date().toISOString().split('T')[0],
    createdBy: data.createdBy || 'Corporate Office IT & Innovation',
  };

  db.problemStatements.unshift(newPS);

  const act = db.addActivity('Admin', 'admin', 'CHALLENGE_PUBLISHED', code, `Published new challenge ${code}: "${data.title}".`, ip);
  db.addAudit('admin', 'CHALLENGE_PUBLISHED', 'ProblemStatement', newPS.id, undefined, code, 'SUCCESS', ip);
  broadcastSSE('activity', act);

  db.addNotification('New Challenge Published', `${code}: "${data.title}" is now open for vendor technical and budgetary offers.`, 'info', '/problems');

  res.json({ success: true, data: newPS });
});

// 5. Vendors Management
app.get('/api/vendors', (_req: Request, res: Response) => {
  res.json({ success: true, data: db.vendors });
});

app.patch('/api/vendors/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, score } = req.body;
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  const vendor = db.vendors.find((v) => v.id === id);
  if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

  const prev = vendor.status;
  vendor.status = status;
  if (score !== undefined) vendor.performanceScore = score;

  const act = db.addActivity('Admin', 'admin', 'VENDOR_STATUS_UPDATED', vendor.name, `Updated vendor status for "${vendor.name}" to ${status}.`, ip);
  db.addAudit('admin', 'VENDOR_STATUS_UPDATED', 'Vendor', id, prev, status, 'SUCCESS', ip);
  broadcastSSE('activity', act);

  res.json({ success: true, data: vendor });
});

// 6. Proposals & Budgetary Offers
app.get('/api/proposals', (req: Request, res: Response) => {
  const { problemStatementId, vendorId, status } = req.query;
  let list = [...db.proposals];

  if (problemStatementId) {
    list = list.filter((p) => p.problemStatementId === problemStatementId || p.problemStatementCode === problemStatementId);
  }
  if (vendorId) {
    list = list.filter((p) => p.vendorId === vendorId);
  }
  if (status && status !== 'All') {
    list = list.filter((p) => p.status === status);
  }

  res.json({ success: true, data: list });
});

app.post('/api/proposals', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const nextSeq = String(db.proposals.length + 1).padStart(3, '0');
    const proposalCode = `PROP-2025-${nextSeq}`;

    const ps = db.problemStatements.find((p) => p.id === data.problemStatementId || p.code === data.problemStatementCode);
    if (ps) {
      ps.respondedVendorsCount = (ps.respondedVendorsCount || 0) + 1;
    }

    // Auto calculate costs
    const c = data.costBreakdown || {};
    const totalExclGst =
      (c.pocCost || 0) +
      (c.pilotCost || 0) +
      (c.hardwareCost || 0) +
      (c.softwareCost || 0) +
      (c.integrationCost || 0) +
      (c.licenceCost || 0) +
      (c.trainingCost || 0) +
      (c.amcCostPerYear || 0) +
      (c.otherCost || 0);

    const gstRate = c.gstRate || 18;
    const gstAmount = Math.round(totalExclGst * (gstRate / 100));
    const totalCostInclGst = totalExclGst + gstAmount;

    const computedCostBreakdown = {
      ...c,
      totalExclGst,
      gstAmount,
      totalCostInclGst,
    };

    const newProposal = {
      ...data,
      id: `prop-${Date.now()}`,
      proposalCode,
      submittedAt: new Date().toISOString(),
      status: 'Submitted',
      costBreakdown: computedCostBreakdown,
    };

    // Run AI analysis
    try {
      const aiReview = await analyzeProposalWithGemini(newProposal, ps);
      newProposal.aiReview = aiReview;
    } catch (e) {
      console.error('Proposal AI analysis err:', e);
    }

    db.proposals.unshift(newProposal);

    const act = db.addActivity(
      data.vendorName || 'Vendor',
      'vendor',
      'PROPOSAL_SUBMITTED',
      proposalCode,
      `Vendor "${data.vendorName}" submitted technical & budgetary proposal ${proposalCode} for ${ps?.code || 'Challenge'}. Total: ₹ ${(totalCostInclGst / 10000000).toFixed(2)} Cr.`,
      ip
    );
    db.addAudit(data.vendorId || 'vnd', 'PROPOSAL_SUBMITTED', 'Proposal', newProposal.id, undefined, proposalCode, 'SUCCESS', ip);
    broadcastSSE('activity', act);

    db.addNotification(
      'Proposal Received',
      `New proposal ${proposalCode} received for ${ps?.code || 'Challenge'} from ${data.vendorName}.`,
      'info',
      '/proposals'
    );

    res.json({ success: true, data: newProposal });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/proposals/:id/evaluate', (req: Request, res: Response) => {
  const { id } = req.params;
  const { reviewerName, technicalScore, commercialScore, recommendation, comments } = req.body;
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  const prop = db.proposals.find((p) => p.id === id);
  if (!prop) return res.status(404).json({ success: false, message: 'Proposal not found' });

  prop.technicalScore = technicalScore;
  prop.commercialScore = commercialScore;
  prop.compositeScore = Math.round((technicalScore * 0.7 + commercialScore * 0.3) * 10) / 10;
  prop.committeeRecommendation = recommendation;
  prop.committeeComments = comments;

  if (recommendation === 'Recommend PoC') {
    prop.status = 'PoC Recommended';
  }

  const act = db.addActivity(
    reviewerName || 'Reviewer',
    'reviewer',
    'EVALUATION_COMPLETED',
    prop.proposalCode,
    `Committee evaluated ${prop.proposalCode}: Tech ${technicalScore}, Comm ${commercialScore}. Rec: ${recommendation}.`,
    ip
  );
  db.addAudit('reviewer', 'PROPOSAL_EVALUATED', 'Proposal', id, undefined, JSON.stringify({ technicalScore, commercialScore, recommendation }), 'SUCCESS', ip);
  broadcastSSE('activity', act);

  res.json({ success: true, data: prop });
});

app.patch('/api/proposals/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, comments } = req.body;
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  const prop = db.proposals.find((p) => p.id === id);
  if (!prop) return res.status(404).json({ success: false, message: 'Proposal not found' });

  const prev = prop.status;
  prop.status = status;
  if (comments) prop.committeeComments = comments;

  const act = db.addActivity('Admin', 'admin', 'PROPOSAL_STATUS_CHANGED', prop.proposalCode, `Proposal ${prop.proposalCode} changed to "${status}".`, ip);
  db.addAudit('admin', 'PROPOSAL_STATUS_CHANGED', 'Proposal', id, prev, status, 'SUCCESS', ip);
  broadcastSSE('activity', act);

  db.addNotification(`Proposal ${prop.proposalCode} Updated`, `Status changed to ${status}.`, 'info', '/proposals');

  res.json({ success: true, data: prop });
});

app.post('/api/proposals/:id/analyze-ai', async (req: Request, res: Response) => {
  const { id } = req.params;
  const prop = db.proposals.find((p) => p.id === id);
  if (!prop) return res.status(404).json({ success: false, message: 'Proposal not found' });

  const ps = db.problemStatements.find((p) => p.id === prop.problemStatementId || p.code === prop.problemStatementCode);
  const analysis = await analyzeProposalWithGemini(prop, ps);
  prop.aiReview = analysis;

  res.json({ success: true, data: analysis });
});

// 7. Evaluation Parameters (Configurable by Admin)
app.get('/api/evaluation-parameters', (_req: Request, res: Response) => {
  res.json({ success: true, data: db.evaluationParameters });
});

app.put('/api/evaluation-parameters', (req: Request, res: Response) => {
  const { parameters } = req.body;
  if (Array.isArray(parameters)) {
    db.evaluationParameters = parameters;
    db.addAudit('admin', 'EVALUATION_PARAMS_UPDATED', 'Config', 'EvaluationParameters', undefined, 'Updated weights', 'SUCCESS', '127.0.0.1');
    res.json({ success: true, data: db.evaluationParameters });
  } else {
    res.status(400).json({ success: false, message: 'Parameters array required' });
  }
});

// 8. Projects & Milestones
app.get('/api/projects', (req: Request, res: Response) => {
  res.json({ success: true, data: db.projects });
});

app.post('/api/projects/convert-proposal', (req: Request, res: Response) => {
  const { proposalId, projectName, projectManager } = req.body;
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  const prop = db.proposals.find((p) => p.id === proposalId);
  if (!prop) return res.status(404).json({ success: false, message: 'Proposal not found' });

  const ps = db.problemStatements.find((p) => p.id === prop.problemStatementId);
  const nextSeq = String(db.projects.length + 1).padStart(2, '0');
  const projectCode = `NMDC-PRJ-2025-${nextSeq}`;

  const budgetCr = Math.round(((prop.costBreakdown?.totalCostInclGst || 30000000) / 10000000) * 100) / 100;

  const newProject = {
    id: `proj-${Date.now()}`,
    projectCode,
    name: projectName || `${prop.problemStatementTitle} Deployment`,
    problemStatementId: prop.problemStatementId,
    problemStatementCode: prop.problemStatementCode,
    vendorId: prop.vendorId,
    vendorName: prop.vendorName,
    nmdcDepartment: ps?.department || 'Operations',
    nmdcComplex: ps?.projectComplex || 'Bailadila Complex',
    projectManager: projectManager || 'Dr. Amitabh Verma (GM - Mining)',
    approvedBudgetCr: budgetCr,
    actualExpenditureCr: Math.round(budgetCr * 0.25 * 100) / 100,
    startDate: new Date().toISOString().split('T')[0],
    targetCompletionDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * (prop.timelineMonths || 6) * 30).toISOString().split('T')[0],
    currentStage: 'PoC' as const,
    health: 'On Track' as const,
    progressPct: 15,
    milestones: [
      {
        id: `m-${Date.now()}-1`,
        title: 'Project Initiation, Kick-off & Site Survey',
        stage: 'Initiation' as const,
        plannedStartDate: new Date().toISOString().split('T')[0],
        plannedEndDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().split('T')[0],
        progressPct: 100,
        status: 'Completed' as const,
        responsiblePerson: projectManager || 'Project Manager',
        deliverables: 'Signed charter, baseline specs, site permits',
      },
      {
        id: `m-${Date.now()}-2`,
        title: 'Prototype / PoC Testing on Site',
        stage: 'PoC' as const,
        plannedStartDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().split('T')[0],
        plannedEndDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 75).toISOString().split('T')[0],
        progressPct: 30,
        status: 'On Track' as const,
        responsiblePerson: `${prop.vendorName} Lead`,
        deliverables: 'Proof of concept bench test on selected equipment',
      },
      {
        id: `m-${Date.now()}-3`,
        title: 'Pilot Deployment & User Acceptance Testing (UAT)',
        stage: 'Pilot' as const,
        plannedStartDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 80).toISOString().split('T')[0],
        plannedEndDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 140).toISOString().split('T')[0],
        progressPct: 0,
        status: 'On Track' as const,
        responsiblePerson: 'NMDC Technical Lead',
        deliverables: 'Live field pilot with telemetry correlation',
      },
    ],
    risks: [
      {
        id: `r-${Date.now()}`,
        description: 'Vibration & dust ingress during heavy monsoon cycles.',
        category: 'Technical' as const,
        severity: 'Medium' as const,
        mitigationPlan: 'Heavy duty IP68 enclosures with polyurethane sleeves.',
        status: 'Mitigated' as const,
      },
    ],
    kpis: [
      {
        id: `k-${Date.now()}-1`,
        name: 'Availability Improvement',
        baseline: 'Baseline Level',
        target: `${prop.businessCase?.availabilityImprovementPct || 10}%`,
        current: 'Measuring',
        unit: '%',
        status: 'In Progress' as const,
      },
    ],
    benefits: [
      {
        id: `b-${Date.now()}`,
        category: 'Financial' as const,
        description: 'Cost savings through reduced equipment breakdown & diesel optimization.',
        projectedAnnualCr: Math.round(((prop.businessCase?.expectedSavingsAnnual || 25000000) / 10000000) * 100) / 100,
        realisedAnnualCr: 0,
      },
    ],
    reports: [],
  };

  prop.status = 'PoC Approved';
  if (ps) ps.status = 'PoC Awarded';

  db.projects.unshift(newProject);

  const act = db.addActivity(
    'Admin',
    'admin',
    'PROJECT_CREATED',
    projectCode,
    `Converted proposal ${prop.proposalCode} into active implementation project ${projectCode} for ${prop.vendorName}.`,
    ip
  );
  db.addAudit('admin', 'PROJECT_CREATED', 'Project', newProject.id, undefined, projectCode, 'SUCCESS', ip);
  broadcastSSE('activity', act);

  db.addNotification('New Project Initiated', `Project ${projectCode}: "${newProject.name}" has been sanctioned.`, 'success', '/projects');

  res.json({ success: true, data: newProject });
});

app.patch('/api/projects/:id/milestones/:mId', (req: Request, res: Response) => {
  const { id, mId } = req.params;
  const { progressPct, status, actualEndDate } = req.body;
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  const proj = db.projects.find((p) => p.id === id);
  if (!proj) return res.status(404).json({ success: false, message: 'Project not found' });

  const m = proj.milestones.find((milestone) => milestone.id === mId);
  if (!m) return res.status(404).json({ success: false, message: 'Milestone not found' });

  const prev = m.progressPct;
  if (progressPct !== undefined) m.progressPct = progressPct;
  if (status) m.status = status;
  if (actualEndDate) m.actualEndDate = actualEndDate;

  // Recalculate project progress
  const total = proj.milestones.reduce((acc, cur) => acc + cur.progressPct, 0);
  proj.progressPct = Math.round(total / proj.milestones.length);

  const act = db.addActivity('Project Manager', 'project_manager', 'MILESTONE_UPDATED', proj.projectCode, `Milestone "${m.title}" updated: ${prev}% -> ${m.progressPct}%. Status: ${m.status}.`, ip);
  db.addAudit('pm', 'MILESTONE_UPDATED', 'ProjectMilestone', mId, String(prev), String(m.progressPct), 'SUCCESS', ip);
  broadcastSSE('activity', act);

  res.json({ success: true, data: proj });
});

// 9. Real-time Activity Logs & Server-Sent Events (SSE)
app.get('/api/activities', (_req: Request, res: Response) => {
  res.json({ success: true, data: db.activityLogs });
});

app.get('/api/realtime/stream', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  res.write(`event: connected\ndata: ${JSON.stringify({ time: new Date().toISOString() })}\n\n`);
  sseClients.push(res);

  req.on('close', () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

// 10. Audit Logs (Immutable, Admin View)
app.get('/api/audit-logs', (_req: Request, res: Response) => {
  res.json({ success: true, data: db.auditLogs });
});

// 11. In-App Notifications
app.get('/api/notifications', (req: Request, res: Response) => {
  const { userId } = req.query;
  const list = db.notifications.filter((n) => !n.userId || n.userId === userId);
  res.json({ success: true, data: list });
});

app.patch('/api/notifications/:id/read', (req: Request, res: Response) => {
  const notif = db.notifications.find((n) => n.id === req.params.id);
  if (notif) notif.read = true;
  res.json({ success: true });
});

// 12. Gemini AI Endpoints
app.post('/api/ai/classify', async (req: Request, res: Response) => {
  try {
    const analysis = await classifyIdeaWithGemini(req.body);
    res.json({ success: true, data: analysis });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/ai/analyze-proposal', async (req: Request, res: Response) => {
  try {
    const { proposal, problemStatement } = req.body;
    const review = await analyzeProposalWithGemini(proposal, problemStatement);
    res.json({ success: true, data: review });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/ai/document-extract', async (req: Request, res: Response) => {
  try {
    const { fileName, content } = req.body;
    const extracted = await generateDocumentExtraction(fileName || 'Document.pdf', content || 'Vendor Technical Submission');
    res.json({ success: true, data: extracted });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/ai/management-insights', async (_req: Request, res: Response) => {
  try {
    const stats = db.getStats();
    const insights = await generateManagementInsights(stats, db.projects, db.ideas, db.proposals);
    res.json({ success: true, data: insights });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const { message, history, role } = req.body;
    const reply = await answerNmdcAssistantChat(message, history || [], role || 'public');
    res.json({ success: true, reply });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 13. NMDC Innovation Knowledge Repository
app.get('/api/knowledge-base', (req: Request, res: Response) => {
  const { category, type, search } = req.query;
  let list = [...db.knowledgeItems];
  if (category && category !== 'All') {
    list = list.filter((k) => k.category === category);
  }
  if (type && type !== 'All') {
    list = list.filter((k) => k.type === type);
  }
  if (search) {
    const q = (search as string).toLowerCase();
    list = list.filter((k) => k.title.toLowerCase().includes(q) || k.summary.toLowerCase().includes(q) || k.complex.toLowerCase().includes(q));
  }
  res.json({ success: true, data: list });
});

// 14. "Already Implemented in NMDC" Search
app.get('/api/already-implemented', (req: Request, res: Response) => {
  const { query, complex } = req.query;
  let list = [...db.implementedSolutions];
  if (complex && complex !== 'All') {
    list = list.filter((i) => i.implementedComplex.toLowerCase().includes((complex as string).toLowerCase()));
  }
  if (query) {
    const q = (query as string).toLowerCase();
    list = list.filter((i) =>
      i.title.toLowerCase().includes(q) ||
      i.problemAddressed.toLowerCase().includes(q) ||
      i.technology.toLowerCase().includes(q) ||
      i.vendor.toLowerCase().includes(q)
    );
  }
  res.json({ success: true, data: list });
});

// 15. Vendor Solution Marketplace
app.get('/api/vendor-marketplace', (req: Request, res: Response) => {
  const { category, equipment, search } = req.query;
  let list = [...db.vendorSolutions];
  if (category && category !== 'All') {
    list = list.filter((v) => v.category === category);
  }
  if (equipment && equipment !== 'All') {
    list = list.filter((v) => v.targetMiningEquipment.some((eq) => eq.toLowerCase().includes((equipment as string).toLowerCase())));
  }
  if (search) {
    const q = (search as string).toLowerCase();
    list = list.filter((v) =>
      v.title.toLowerCase().includes(q) ||
      v.shortSummary.toLowerCase().includes(q) ||
      v.vendorName.toLowerCase().includes(q)
    );
  }
  res.json({ success: true, data: list });
});

// 16. Dedicated PoC Management Module
app.get('/api/pocs', (req: Request, res: Response) => {
  const { status, site } = req.query;
  let list = [...db.pocRecords];
  if (status && status !== 'All') {
    list = list.filter((p) => p.status === status);
  }
  if (site && site !== 'All') {
    list = list.filter((p) => p.siteComplex.includes(site as string));
  }
  res.json({ success: true, data: list });
});

app.patch('/api/pocs/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, progressPct, resultsSummary, recommendation } = req.body;
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  const poc = db.pocRecords.find((p) => p.id === id);
  if (!poc) return res.status(404).json({ success: false, message: 'PoC record not found' });

  const prev = poc.status;
  poc.status = status;
  if (progressPct !== undefined) poc.progressPct = progressPct;
  if (resultsSummary) poc.testResultsSummary = resultsSummary;
  if (recommendation) poc.recommendationForPilot = recommendation;

  const act = db.addActivity('Technical Committee', 'reviewer', 'POC_STATUS_UPDATED', poc.pocCode, `PoC ${poc.pocCode} transitioned from ${prev} to ${status}.`, ip);
  db.addAudit('reviewer', 'POC_STATUS_UPDATED', 'PoCRecord', id, prev, status, 'SUCCESS', ip);
  broadcastSSE('activity', act);

  res.json({ success: true, data: poc });
});

// 17. Vendor Rating System (10 Parameters)
app.post('/api/vendors/:id/rate', (req: Request, res: Response) => {
  const { id } = req.params;
  const scores = req.body;
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  const vendor = db.vendors.find((v) => v.id === id);
  if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

  db.rateVendor(id, scores);

  const act = db.addActivity(
    scores.evaluatedBy || 'Project Manager',
    'project_manager',
    'VENDOR_RATED',
    vendor.name,
    `Evaluated vendor "${vendor.name}". New overall performance rating: ${vendor.performanceScore}/100.`,
    ip
  );
  db.addAudit('pm', 'VENDOR_RATED', 'Vendor', id, undefined, JSON.stringify(scores), 'SUCCESS', ip);
  broadcastSSE('activity', act);

  res.json({ success: true, data: vendor, ratingHistory: db.vendorRatings[id] });
});

// 18. Innovation Score Config
app.get('/api/innovation-score-weights', (_req: Request, res: Response) => {
  res.json({ success: true, data: db.innovationScoreWeights });
});

app.put('/api/innovation-score-weights', (req: Request, res: Response) => {
  const { weights } = req.body;
  if (weights) {
    db.innovationScoreWeights = weights;
    res.json({ success: true, data: db.innovationScoreWeights });
  } else {
    res.status(400).json({ success: false, message: 'Weights required' });
  }
});

// 19. AI Plain Problem to Structured Statement Converter
app.post('/api/ai/convert-problem', async (req: Request, res: Response) => {
  try {
    const { rawProblemText } = req.body;
    const structured = await convertPlainProblemToStructured(rawProblemText || '');
    res.json({ success: true, data: structured });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 20. AI Problem-to-Solution Engine
app.post('/api/ai/problem-solution-engine', async (req: Request, res: Response) => {
  try {
    const { queryText } = req.body;
    const result = await generateProblemToSolutionEngine(queryText || '');
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 21. AI Idea Duplicate Detector
app.post('/api/ai/check-duplicates', async (req: Request, res: Response) => {
  try {
    const { title, description } = req.body;
    const match = await detectIdeaDuplicates(title || '', description || '', db.ideas);
    res.json({ success: true, match });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 22. AI Idea Innovation Score Calculator
app.post('/api/ai/calculate-innovation-score', (req: Request, res: Response) => {
  try {
    const { ideaData } = req.body;
    const scoreBreakdown = calculateInnovationScore(ideaData, db.innovationScoreWeights);
    res.json({ success: true, data: scoreBreakdown });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
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
    console.log(`[NMDC Portal Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

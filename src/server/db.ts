// NMDC Limited - Problem Statement, Vendor Solution & Project Management Portal
// Enterprise Database Store with 5 Organisational Units, Employee Master, Budgetary Requests, Discussions & Demo Isolation

import {
  User,
  Vendor,
  ProblemStatement,
  BudgetaryOfferRequest,
  Proposal,
  DiscussionThread,
  TechnicalEvaluationParameter,
  TechnicalEvaluationReport,
  PocRecord,
  AwardOfWork,
  Project,
  EmployeeMasterRecord,
  EmployeeImportHistory,
  ActivityLog,
  AuditLog,
  AppNotification,
  PortalStats,
  MineComplex,
  MineComplexCode,
  DEFAULT_ORGANISATIONAL_UNITS,
} from '../types/index.js';
import { createIsolatedDemoDataset, createFullPortalMockDataset } from './demoSeed.js';

class NMDCDataStore {
  // 1. Organisational Units (DB-configured — 5 units including Head Office)
  public organisationalUnits: MineComplex[] = [...DEFAULT_ORGANISATIONAL_UNITS];
  // Legacy alias
  public get mineComplexes(): MineComplex[] {
    return this.organisationalUnits;
  }

  // 2. Enterprise Tables (Initialized with full cross-unit mock dataset)
  public users: User[] = [];
  public employeeMaster: EmployeeMasterRecord[] = [];
  public employeeImportHistory: EmployeeImportHistory[] = [];
  public vendors: Vendor[] = [];
  public problemStatements: ProblemStatement[] = [];
  public budgetaryRequests: BudgetaryOfferRequest[] = [];
  public proposals: Proposal[] = [];
  public discussions: DiscussionThread[] = [];
  public pocRecords: PocRecord[] = [];
  public awardsOfWork: AwardOfWork[] = [];
  public projects: Project[] = [];
  public technicalEvaluationReports: TechnicalEvaluationReport[] = [];
  public notifications: AppNotification[] = [];
  public activityLogs: ActivityLog[] = [];
  public auditLogs: AuditLog[] = [];

  // Concurrency-safe Sequence Counters for all 5 Units (HO, DIOM, KIOM, BCH, KDL)
  private sequenceCounters: Record<string, number> = {
    'HO-PS': 0, 'DIOM-PS': 0, 'KIOM-PS': 0, 'BCH-PS': 0, 'KDL-PS': 0,
    'HO-BOR': 0, 'DIOM-BOR': 0, 'KIOM-BOR': 0, 'BCH-BOR': 0, 'KDL-BOR': 0,
    'HO-PROP': 0, 'DIOM-PROP': 0, 'KIOM-PROP': 0, 'BCH-PROP': 0, 'KDL-PROP': 0,
    'HO-DSC': 0, 'DIOM-DSC': 0, 'KIOM-DSC': 0, 'BCH-DSC': 0, 'KDL-DSC': 0,
    'HO-POC': 0, 'DIOM-POC': 0, 'KIOM-POC': 0, 'BCH-POC': 0, 'KDL-POC': 0,
    'HO-AOW': 0, 'DIOM-AOW': 0, 'KIOM-AOW': 0, 'BCH-AOW': 0, 'KDL-AOW': 0,
    'HO-PRJ': 0, 'DIOM-PRJ': 0, 'KIOM-PRJ': 0, 'BCH-PRJ': 0, 'KDL-PRJ': 0,
  };

  constructor() {
    this.seedFullMockPortalData();
  }

  public seedFullMockPortalData(): void {
    const seed = createFullPortalMockDataset();
    this.users = seed.users;
    this.employeeMaster = seed.employeeMaster;
    this.employeeImportHistory = seed.employeeImportHistory;
    this.vendors = seed.vendors;
    this.problemStatements = seed.problemStatements;
    this.budgetaryRequests = seed.budgetaryRequests;
    this.proposals = seed.proposals;
    this.discussions = seed.discussions;
    this.pocRecords = seed.pocRecords;
    this.awardsOfWork = seed.awardsOfWork;
    this.projects = seed.projects;
    this.notifications = seed.notifications;
    this.activityLogs = seed.activityLogs;
    this.auditLogs = seed.auditLogs;
    this.sequenceCounters = { ...this.sequenceCounters, ...seed.sequenceCounters };
  }

  // 3. Configurable Technical Evaluation Parameters
  public evaluationParameters: TechnicalEvaluationParameter[] = [
    {
      id: 'param-1',
      name: 'Compliance with Specifications',
      category: 'Technical',
      maxMarks: 15,
      description: 'Adherence to NMDC operational and technical specs without deviation.',
      mandatory: true,
    },
    {
      id: 'param-2',
      name: 'Technical Suitability & Robustness',
      category: 'Technical',
      maxMarks: 15,
      description: 'Ruggedness for harsh open-cast iron ore mining conditions.',
      mandatory: true,
    },
    {
      id: 'param-3',
      name: 'Scope of Supply Completeness',
      category: 'Technical',
      maxMarks: 10,
      description: 'Adequacy of hardware, instrumentation, software, cabling & spares.',
      mandatory: true,
    },
    {
      id: 'param-4',
      name: 'Performance Parameters & Accuracy',
      category: 'Technical',
      maxMarks: 15,
      description: 'Measurement resolution, cycle time reduction, throughput enhancement.',
      mandatory: true,
    },
    {
      id: 'param-5',
      name: 'Implementation Methodology',
      category: 'Technical',
      maxMarks: 10,
      description: 'Structured deployment without disrupting ongoing mining operations.',
      mandatory: true,
    },
    {
      id: 'param-6',
      name: 'Delivery Period Adherence',
      category: 'General',
      maxMarks: 10,
      description: 'Feasibility of promised timeline from LOA to site handover.',
      mandatory: false,
    },
    {
      id: 'param-7',
      name: 'Warranty & Service Support (OEM SLA)',
      category: 'General',
      maxMarks: 10,
      description: 'Local presence, MTTR < 4 hours, and engineer availability.',
      mandatory: true,
    },
    {
      id: 'param-8',
      name: 'Relevant Mining / Heavy PSU Experience',
      category: 'General',
      maxMarks: 10,
      description: 'Track record in opencast mines, beneficiation plants, or steel PSUs.',
      mandatory: false,
    },
    {
      id: 'param-9',
      name: 'Technical Deviations Assessment',
      category: 'Technical',
      maxMarks: 5,
      description: 'Criticality of any proposed deviations or exceptions.',
      mandatory: true,
    },
  ];

  // Sequence generators
  private nextCode(prefixKey: string, mid: string): string {
    this.sequenceCounters[prefixKey] = (this.sequenceCounters[prefixKey] || 0) + 1;
    const year = new Date().getFullYear();
    const count = this.sequenceCounters[prefixKey];
    const [unit] = prefixKey.split('-');
    return `${unit}-${mid}-${year}-${String(count).padStart(4, '0')}`;
  }

  public generateProblemStatementCode(mineCode: MineComplexCode): string {
    return this.nextCode(`${mineCode}-PS`, 'PS');
  }

  public generateBudgetaryRequestCode(mineCode: MineComplexCode): string {
    return this.nextCode(`${mineCode}-BOR`, 'BOR');
  }

  public generateProposalCode(mineCode: MineComplexCode): string {
    return this.nextCode(`${mineCode}-PROP`, 'PROP');
  }

  public generateDiscussionCode(mineCode: MineComplexCode): string {
    return this.nextCode(`${mineCode}-DSC`, 'DSC');
  }

  public generatePocCode(mineCode: MineComplexCode): string {
    return this.nextCode(`${mineCode}-POC`, 'POC');
  }

  public generateAwardCode(mineCode: MineComplexCode): string {
    return this.nextCode(`${mineCode}-AOW`, 'AOW');
  }

  public generateProjectCode(mineCode: MineComplexCode): string {
    return this.nextCode(`${mineCode}-PRJ`, 'PRJ');
  }

  // Demo Data Management (Strict Isolation)
  public loadDemoData(): { loadedCount: number } {
    const demo = createIsolatedDemoDataset();
    // Avoid duplicates
    const existingIds = new Set([
      ...this.vendors.map((v) => v.id),
      ...this.problemStatements.map((p) => p.id),
      ...this.budgetaryRequests.map((b) => b.id),
      ...this.proposals.map((p) => p.id),
      ...this.discussions.map((d) => d.id),
      ...this.pocRecords.map((p) => p.id),
      ...this.awardsOfWork.map((a) => a.id),
      ...this.projects.map((p) => p.id),
    ]);

    let loaded = 0;
    for (const v of demo.vendors) if (!existingIds.has(v.id)) { this.vendors.push(v); loaded++; }
    for (const ps of demo.problemStatements) if (!existingIds.has(ps.id)) { this.problemStatements.push(ps); loaded++; }
    for (const b of demo.budgetaryRequests) if (!existingIds.has(b.id)) { this.budgetaryRequests.push(b); loaded++; }
    for (const pr of demo.proposals) if (!existingIds.has(pr.id)) { this.proposals.push(pr); loaded++; }
    for (const d of demo.discussions) if (!existingIds.has(d.id)) { this.discussions.push(d); loaded++; }
    for (const poc of demo.pocRecords) if (!existingIds.has(poc.id)) { this.pocRecords.push(poc); loaded++; }
    for (const a of demo.awardsOfWork) if (!existingIds.has(a.id)) { this.awardsOfWork.push(a); loaded++; }
    for (const proj of demo.projects) if (!existingIds.has(proj.id)) { this.projects.push(proj); loaded++; }

    return { loadedCount: loaded };
  }

  public clearDemoData(): { removedCount: number } {
    const countBefore =
      this.vendors.filter((r) => r.isDemo).length +
      this.problemStatements.filter((r) => r.isDemo).length +
      this.budgetaryRequests.filter((r) => r.isDemo).length +
      this.proposals.filter((r) => r.isDemo).length +
      this.discussions.filter((r) => r.isDemo).length +
      this.pocRecords.filter((r) => r.isDemo).length +
      this.awardsOfWork.filter((r) => r.isDemo).length +
      this.projects.filter((r) => r.isDemo).length;

    this.vendors = this.vendors.filter((r) => !r.isDemo);
    this.problemStatements = this.problemStatements.filter((r) => !r.isDemo);
    this.budgetaryRequests = this.budgetaryRequests.filter((r) => !r.isDemo);
    this.proposals = this.proposals.filter((r) => !r.isDemo);
    this.discussions = this.discussions.filter((r) => !r.isDemo);
    this.pocRecords = this.pocRecords.filter((r) => !r.isDemo);
    this.awardsOfWork = this.awardsOfWork.filter((r) => !r.isDemo);
    this.projects = this.projects.filter((r) => !r.isDemo);

    return { removedCount: countBefore };
  }

  public hasDemoData(): boolean {
    return (
      this.problemStatements.some((p) => p.isDemo) ||
      this.budgetaryRequests.some((b) => b.isDemo) ||
      this.vendors.some((v) => v.isDemo)
    );
  }

  // Dynamic Statistics Calculated Strictly from Database Records
  // Defaults strictly to excluding Demo records (`includeDemo = false`)
  public getStats(complexFilter?: string, includeDemo = false): PortalStats {
    const filterDemo = <T extends { isDemo?: boolean }>(items: T[]) =>
      includeDemo ? items : items.filter((i) => !i.isDemo);

    let pList = filterDemo(this.problemStatements);
    let borList = filterDemo(this.budgetaryRequests);
    let prList = filterDemo(this.proposals);
    let pocList = filterDemo(this.pocRecords);
    let aList = filterDemo(this.awardsOfWork);
    let projList = filterDemo(this.projects);
    let vList = filterDemo(this.vendors);

    if (complexFilter && complexFilter !== 'ALL' && complexFilter !== 'All') {
      pList = pList.filter((p) => p.mineComplexCode === complexFilter);
      borList = borList.filter((b) => b.mineComplexCode === complexFilter);
      prList = prList.filter((pr) => pr.mineComplexCode === complexFilter);
      pocList = pocList.filter((poc) => poc.mineComplexCode === complexFilter);
      aList = aList.filter((a) => a.mineComplexCode === complexFilter);
      projList = projList.filter((proj) => proj.mineComplexCode === complexFilter);
    }

    const totalAwardedValue = aList.reduce((acc, curr) => acc + (curr.totalContractValue || 0), 0);
    const totalAwardedValueCr = totalAwardedValue > 0 ? Number((totalAwardedValue / 10000000).toFixed(2)) : 0;

    return {
      totalProblemStatements: pList.length,
      openOpportunities: pList.filter((p) => p.status === 'Published' || p.status === 'Vendor Participation').length,
      budgetaryRequestsActive: borList.filter((b) => b.status === 'Published').length,
      registeredVendors: vList.filter((v) => v.status === 'Active' || v.status === 'Approved').length,
      budgetaryOffersReceived: prList.length,
      pocsCompleted: pocList.filter((poc) => poc.status === 'Successful' || poc.status === 'Closed').length,
      pocsUnderExecution: pocList.filter((poc) => poc.status === 'Under Trial' || poc.status === 'Evaluation' || poc.status === 'Scheduled').length,
      projectsAwarded: aList.length,
      projectsUnderExecution: projList.filter((proj) => proj.currentStage !== 'Closure').length,
      projectsCompleted: projList.filter((proj) => proj.currentStage === 'Closure').length,
      totalAwardedValueCr,
    };
  }

  public addNotification(
    title: string,
    message: string,
    type: AppNotification['type'] = 'info',
    link?: string,
    userId?: string,
    targetRole?: AppNotification['targetRole']
  ): AppNotification {
    const n: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      message,
      type,
      link,
      userId,
      targetRole,
      createdAt: new Date().toISOString(),
      read: false,
    };
    this.notifications.unshift(n);
    if (this.notifications.length > 200) this.notifications.pop();
    return n;
  }

  public addActivity(
    user: string,
    role: string,
    action: string,
    entity: string,
    details: string,
    ipAddress?: string
  ): ActivityLog {
    const act: ActivityLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      user,
      role,
      action,
      entity,
      details,
      ipAddress: ipAddress || '127.0.0.1',
    };
    this.activityLogs.unshift(act);
    if (this.activityLogs.length > 500) this.activityLogs.pop();
    return act;
  }

  public addAudit(
    userId: string,
    userRole: string,
    action: string,
    entityType: string,
    entityId: string,
    previousValue?: string,
    newValue?: string,
    remarks?: string,
    result: 'SUCCESS' | 'FAILURE' = 'SUCCESS',
    ipAddress?: string
  ): AuditLog {
    const audit: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      userId,
      userRole,
      action,
      entityType,
      entityId,
      previousValue,
      newValue,
      remarks: remarks || '',
      result,
      ipAddress: ipAddress || '127.0.0.1',
    };
    this.auditLogs.unshift(audit);
    return audit;
  }
}

export const db = new NMDCDataStore();

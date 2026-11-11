// NMDC Limited - Problem Statement, Vendor Solution & Project Management Portal
// Production Database Store with Concurrency-Safe Sequences & Zero Mock Data

import {
  User,
  Vendor,
  ProblemStatement,
  Proposal,
  TechnicalEvaluationParameter,
  TechnicalEvaluationReport,
  PocRecord,
  AwardOfWork,
  Project,
  ActivityLog,
  AuditLog,
  AppNotification,
  PortalStats,
  ClarificationQuery,
  MineComplex,
  MineComplexCode,
  AUTHORIZED_MINE_COMPLEXES
} from '../types/index.js';

class NMDCDataStore {
  // 1. Authorized Mine Complexes (System Configuration - Section 13)
  public mineComplexes: MineComplex[] = [...AUTHORIZED_MINE_COMPLEXES];

  // 2. Production Tables - ZERO MOCK DATA (All initialized empty)
  public users: User[] = [];
  public vendors: Vendor[] = [];
  public problemStatements: ProblemStatement[] = [];
  public proposals: Proposal[] = [];
  public pocRecords: PocRecord[] = [];
  public awardsOfWork: AwardOfWork[] = [];
  public projects: Project[] = [];
  public technicalEvaluationReports: TechnicalEvaluationReport[] = [];
  public notifications: AppNotification[] = [];
  public activityLogs: ActivityLog[] = [];
  public auditLogs: AuditLog[] = [];

  // Sequence Counters for concurrency-safe unique ID generation (Section 6)
  private sequenceCounters: Record<string, number> = {
    'DIOM-PS': 0,
    'KIOM-PS': 0,
    'BCH-PS': 0,
    'KDL-PS': 0,
    'DIOM-PROP': 0,
    'KIOM-PROP': 0,
    'BCH-PROP': 0,
    'KDL-PROP': 0,
    'DIOM-POC': 0,
    'KIOM-POC': 0,
    'BCH-POC': 0,
    'KDL-POC': 0,
    'DIOM-AOW': 0,
    'KIOM-AOW': 0,
    'BCH-AOW': 0,
    'KDL-AOW': 0,
    'DIOM-PRJ': 0,
    'KIOM-PRJ': 0,
    'BCH-PRJ': 0,
    'KDL-PRJ': 0,
  };

  // 3. Configurable Technical Evaluation Parameters (Section 12)
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

  // 4. Concurrency-Safe Sequence Mechanism for Unique IDs (Section 6)
  public generateProblemStatementCode(mineCode: MineComplexCode): string {
    const key = `${mineCode}-PS`;
    this.sequenceCounters[key] = (this.sequenceCounters[key] || 0) + 1;
    const year = new Date().getFullYear();
    const count = this.sequenceCounters[key];
    return `${mineCode}-PS-${year}-${String(count).padStart(4, '0')}`;
  }

  public generateProposalCode(mineCode: MineComplexCode): string {
    const key = `${mineCode}-PROP`;
    this.sequenceCounters[key] = (this.sequenceCounters[key] || 0) + 1;
    const year = new Date().getFullYear();
    const count = this.sequenceCounters[key];
    return `${mineCode}-PROP-${year}-${String(count).padStart(4, '0')}`;
  }

  public generatePocCode(mineCode: MineComplexCode): string {
    const key = `${mineCode}-POC`;
    this.sequenceCounters[key] = (this.sequenceCounters[key] || 0) + 1;
    const year = new Date().getFullYear();
    const count = this.sequenceCounters[key];
    return `${mineCode}-POC-${year}-${String(count).padStart(4, '0')}`;
  }

  public generateAwardCode(mineCode: MineComplexCode): string {
    const key = `${mineCode}-AOW`;
    this.sequenceCounters[key] = (this.sequenceCounters[key] || 0) + 1;
    const year = new Date().getFullYear();
    const count = this.sequenceCounters[key];
    return `${mineCode}-AOW-${year}-${String(count).padStart(4, '0')}`;
  }

  public generateProjectCode(mineCode: MineComplexCode): string {
    const key = `${mineCode}-PRJ`;
    this.sequenceCounters[key] = (this.sequenceCounters[key] || 0) + 1;
    const year = new Date().getFullYear();
    const count = this.sequenceCounters[key];
    return `${mineCode}-PRJ-${year}-${String(count).padStart(4, '0')}`;
  }

  // 5. Dynamic Statistics Calculated Strictly from Database Records (Section 1 & 12)
  public getStats(complexFilter?: string): PortalStats {
    let pList = [...this.problemStatements];
    let prList = [...this.proposals];
    let pocList = [...this.pocRecords];
    let aList = [...this.awardsOfWork];
    let projList = [...this.projects];
    let vList = [...this.vendors];

    if (complexFilter && complexFilter !== 'ALL' && complexFilter !== 'All') {
      pList = pList.filter((p) => p.mineComplexCode === complexFilter || p.projectComplex?.includes(complexFilter));
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

  // 6. Audit & Activity Logging
  public addActivity(
    user: string,
    role: string,
    action: string,
    entity: string,
    details: string,
    ipAddress?: string
  ): ActivityLog {
    const act: ActivityLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
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
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
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

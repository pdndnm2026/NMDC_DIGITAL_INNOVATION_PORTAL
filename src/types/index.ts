// NMDC Problem Statement, Vendor Solution & Project Management Portal
// Enterprise Type Definitions

export type UserRole = 
  | 'public'              // Public Visitor
  | 'executive'           // NMDC Executive / Employee
  | 'dept_head'           // Department Head
  | 'approving_authority' // Approving Authority / Project Head
  | 'vendor'              // Registered Vendor
  | 'tech_evaluator'      // Technical Evaluator
  | 'comm_evaluator'      // Commercial Evaluator
  | 'poc_committee'       // PoC Committee Member
  | 'project_manager'     // Project Manager
  | 'admin';              // Portal Administrator

export type MineComplexCode = 'DIOM' | 'KIOM' | 'BCH' | 'KDL';

export interface MineComplex {
  id: string;
  code: MineComplexCode;
  name: string;
  fullName: string;
  location: string;
  state: string;
  activeStatus: boolean;
  prefix: string;
}

export const AUTHORIZED_MINE_COMPLEXES: MineComplex[] = [
  {
    id: 'mc-diom',
    code: 'DIOM',
    name: 'DIOM - Donimalai Iron Ore Mine',
    fullName: 'Donimalai Iron Ore Mine',
    location: 'Bellary, Karnataka',
    state: 'Karnataka',
    activeStatus: true,
    prefix: 'DIOM-PS-2026-',
  },
  {
    id: 'mc-kiom',
    code: 'KIOM',
    name: 'KIOM - Kumaraswamy Iron Ore Mine',
    fullName: 'Kumaraswamy Iron Ore Mine',
    location: 'Bellary, Karnataka',
    state: 'Karnataka',
    activeStatus: true,
    prefix: 'KIOM-PS-2026-',
  },
  {
    id: 'mc-bch',
    code: 'BCH',
    name: 'Bacheli Complex',
    fullName: 'Bacheli Complex (Bailadila Dep-14/11C)',
    location: 'Dantewada, Chhattisgarh',
    state: 'Chhattisgarh',
    activeStatus: true,
    prefix: 'BCH-PS-2026-',
  },
  {
    id: 'mc-kdl',
    code: 'KDL',
    name: 'Kirandul Complex',
    fullName: 'Kirandul Complex (Bailadila Dep-5/11B)',
    location: 'Dantewada, Chhattisgarh',
    state: 'Chhattisgarh',
    activeStatus: true,
    prefix: 'KDL-PS-2026-',
  },
];

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  employeeId?: string;
  designation?: string;
  mineComplexCode?: MineComplexCode | 'ALL';
  projectComplex?: string;
  location?: string;
  vendorId?: string;
  avatarUrl?: string;
  mobile?: string;
  status?: 'Pending' | 'Active' | 'Suspended';
  passwordHash?: string;
  createdAt: string;
}

export interface EmployeeProfile {
  userId: string;
  employeeId: string;
  designation: string;
  department: string;
  projectComplex: string;
  location: string;
  contactNumber: string;
  totalStatementsRaised: number;
}

// ---------------------------------------------------------------------------
// VENDOR TYPES (Section 8)
// ---------------------------------------------------------------------------
export type VendorStatus = 'Pending' | 'Under Verification' | 'Approved' | 'Active' | 'Suspended';

export interface VendorDocument {
  id: string;
  vendorId: string;
  title: string;
  type: 'Registration' | 'GST' | 'PAN' | 'MSME' | 'Startup' | 'Technical' | 'WorkOrder' | 'Financial';
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  status: 'Verified' | 'Pending' | 'Rejected';
}

export interface Vendor {
  id: string;
  name: string;
  legalEntity: 'Private Limited' | 'Public Limited' | 'LLP' | 'Partnership' | 'Proprietorship';
  cin: string;
  pan: string;
  gstin: string;
  registeredAddress: string;
  website: string;
  yearEstablished: number;
  companySize: '1-10' | '11-50' | '51-200' | '201-500' | '500+';
  msmeStatus: boolean;
  startupStatus: boolean;
  contactPerson: string;
  designation: string;
  email: string;
  mobile: string;
  areasOfExpertise: string[];
  capabilities: string[];
  miningExperienceYears: number;
  miningPsuExperience: string;
  majorCustomers: string[];
  annualTurnoverCr: number;
  netWorthCr: number;
  status: VendorStatus;
  performanceScore: number; // 0 - 100
  documents: VendorDocument[];
  createdAt: string;
}

// ---------------------------------------------------------------------------
// PROBLEM STATEMENT TYPES (Sections 6 & 7)
// Workflow: Draft → Submitted → Department Review → Approval → Published → Vendor Participation
// ---------------------------------------------------------------------------
export type ProblemStatementStatus = 
  | 'Draft' 
  | 'Submitted' 
  | 'Department Review' 
  | 'Approval' 
  | 'Published' 
  | 'Vendor Participation' 
  | 'Technical Evaluation' 
  | 'Commercial Evaluation' 
  | 'PoC Underway' 
  | 'Award Sanctioned' 
  | 'Closed';

export interface ProblemStatementApprovalRecord {
  stage: 'Department Review' | 'Competent Authority Approval' | 'Portal Publication' | 'Return for Clarification';
  action: 'Approved' | 'Returned for Clarification' | 'Rejected';
  officerName: string;
  officerRole: string;
  officerDesignation: string;
  remarks: string;
  timestamp: string;
}

export interface ClarificationQuery {
  id: string;
  problemStatementId: string;
  problemStatementCode: string;
  problemStatementTitle: string;
  vendorId: string;
  vendorName: string;
  querySubject: string;
  queryText: string;
  submittedAt: string;
  status: 'Pending Response' | 'Response Prepared' | 'Published to All Vendors';
  responseText?: string;
  answeredBy?: string;
  answeredByDesignation?: string;
  answeredAt?: string;
  isCommonToAll: boolean;
}

export interface ProblemStatement {
  id: string;
  code: string; // e.g. DIOM-PS-2026-0001
  mineComplexCode: MineComplexCode;
  mineComplexName: string;
  title: string;
  
  // Basic Details
  department: string;
  projectComplex: string;
  location: string;
  originatingOfficer: string;
  designation: string;
  submissionDate: string;
  category: string;
  subCategory?: string;

  // Problem Details
  existingSituation: string;
  detailedProblemStatement: string;
  operationalDifficulties: string;
  existingEquipment: string;
  reasonForRequirement: string;
  desiredOutcome: string;
  expectedBenefits: string;
  supportingTechnicalInfo: string;

  // Requirement Details
  requiredSolution: string;
  technicalSpecifications: string;
  scopeOfSupply: string;
  requiredDeliverables: string;
  implementationPeriodMonths: number;
  indicativeBudget: string; // e.g. "₹ 2.50 Cr"
  budgetaryIndication?: string;
  problemDescription?: string;
  budgetNumeric: number;
  requiredVendorExperience: string;
  submissionDeadline: string;

  // Attachments
  attachments: { name: string; size: string; type: string; url?: string }[];

  // Workflow & Audit
  status: ProblemStatementStatus;
  publishedDate?: string;
  createdBy: string;
  approvals: ProblemStatementApprovalRecord[];
  clarifications: ClarificationQuery[];
  respondedVendorsCount: number;
}

// ---------------------------------------------------------------------------
// VENDOR PROPOSAL & BUDGETARY OFFER (Section 10)
// Part A: Technical Proposal
// Part B: Commercial Proposal (item-wise costing)
// Part C: Commercial Conditions
// ---------------------------------------------------------------------------
export type ProposalStatus = 
  | 'Draft' 
  | 'Submitted' 
  | 'Under Technical Evaluation' 
  | 'Technically Qualified' 
  | 'Technically Disqualified' 
  | 'Clarification Required' 
  | 'Under Commercial Evaluation' 
  | 'PoC Recommended' 
  | 'Award Recommended' 
  | 'Awarded' 
  | 'Rejected';

export interface CommercialItemCost {
  equipmentCost: number;
  hardwareCost: number;
  softwareCost: number;
  licenceCost: number;
  installationCost: number;
  commissioningCost: number;
  integrationCost: number;
  trainingCost: number;
  freightCost: number;
  amcCostPerYear: number;
  otherCharges: number;
  subtotalCost: number;
  gstRate: number; // e.g. 18
  gstAmount: number;
  totalEstimatedCost: number;
}

export interface ProposalCommercialConditions {
  deliveryPeriodWeeks: number;
  offerValidityDays: number;
  paymentTerms: string;
  warrantyPeriodMonths: number;
  amcYears: number;
  priceBasis: string; // e.g. "FOR Destination Bailadila Iron Ore Project (Kirandul/Bacheli)"
  taxesAndDuties: string;
  otherCommercialConditions: string;
}

export interface ProposalVersionHistory {
  revisionNumber: number;
  submittedAt: string;
  revisedBy: string;
  reasonForRevision: string;
  changesSummary: string;
}

export interface Proposal {
  id: string;
  proposalCode: string; // e.g. PROP-2026-VND01-001
  mineComplexCode: MineComplexCode;
  mineComplexName: string;
  problemStatementId: string;
  problemStatementCode: string;
  problemStatementTitle: string;
  vendorId: string;
  vendorName: string;
  submittedAt: string;
  status: ProposalStatus;
  isLocked: boolean;
  revisionNumber: number;
  versionHistory: ProposalVersionHistory[];

  // Part A: Technical Proposal
  understandingOfRequirement: string;
  proposedSolution: string;
  technicalSpecifications: string;
  equipmentDetails: string;
  softwareDetails: string;
  systemArchitecture: string;
  scopeOfSupply: string;
  installationCommissioning: string;
  integrationRequirements: string;
  implementationMethodology: string;
  deliveryPeriodWeeks: number;
  warrantyMonths: number;
  amcScope: string;
  trainingScope: string;
  technicalDeviations: string;
  supportingDocuments: { name: string; size: string; type: string }[];

  // Part B: Commercial Proposal
  costBreakdown: CommercialItemCost;

  // Part C: Commercial Conditions
  commercialConditions: ProposalCommercialConditions;

  // Evaluation Linkages
  technicalComplianceStatus?: 'Compliant' | 'Partially Compliant' | 'Non-Compliant' | 'Clarification Required';
  technicalMarks?: number;
  technicalRemarks?: string;
  evaluatedBy?: string;
  evaluatedAt?: string;
  commercialRank?: 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
  committeeRecommendation?: 'Recommend PoC' | 'Recommend Award of Work' | 'Keep on Standby' | 'Clarification Required' | 'Reject';
  committeeComments?: string;
}

// ---------------------------------------------------------------------------
// TECHNICAL & COMMERCIAL EVALUATION (Sections 12 & 13)
// ---------------------------------------------------------------------------
export interface TechnicalEvaluationParameter {
  id: string;
  name: string;
  category: 'Technical' | 'Commercial' | 'General';
  maxMarks: number;
  description: string;
  mandatory: boolean;
}

export type EvaluationParameter = TechnicalEvaluationParameter;

export interface TechnicalParameterEvaluation {
  parameterId: string;
  parameterName: string;
  compliance: 'Compliant' | 'Partially Compliant' | 'Non-Compliant' | 'Clarification Required';
  marksAwarded: number;
  observations: string;
}

export interface TechnicalEvaluationReport {
  id: string;
  proposalId: string;
  proposalCode: string;
  problemStatementId: string;
  problemStatementCode: string;
  vendorName: string;
  evaluatorId: string;
  evaluatorName: string;
  evaluatorDesignation: string;
  evaluationDate: string;
  parameterEvaluations: TechnicalParameterEvaluation[];
  totalMarksAwarded: number;
  maxTotalMarks: number;
  overallCompliance: 'Compliant' | 'Partially Compliant' | 'Non-Compliant' | 'Clarification Required';
  observationsAndStrengths: string;
  technicalDeviationsIdentified: string;
  finalRecommendation: 'Technically Qualified' | 'Technically Disqualified' | 'Clarification Required';
}

// ---------------------------------------------------------------------------
// PROOF OF CONCEPT (PoC) MANAGEMENT (Section 14)
// Status: Proposed → Under Approval → Approved → Scheduled → Under Trial → Evaluation → Successful / Unsuccessful → Closed
// ---------------------------------------------------------------------------
export type PocStatus = 
  | 'Proposed' 
  | 'Under Approval' 
  | 'Approved' 
  | 'Scheduled' 
  | 'Under Trial' 
  | 'Evaluation' 
  | 'Successful' 
  | 'Unsuccessful' 
  | 'Closed';

export interface PocRecord {
  id: string;
  pocCode: string; // e.g. DIOM-POC-2026-01
  mineComplexCode: MineComplexCode;
  mineComplexName: string;
  relatedProblemStatementId: string;
  problemStatementCode: string;
  problemStatementTitle: string;
  vendorId: string;
  vendorName: string;
  trialLocation: string; // e.g. Bailadila Deposit 14 Screening Plant
  equipmentProcess: string; // e.g. Tertiary Cone Crusher Chute
  pocScope: string;
  trialPeriodWeeks: number;
  startDate: string;
  completionDate: string;
  baselinePerformance: string;
  expectedPerformance: string;
  evaluationParameters: string[];
  nmdcCommitteeMembers: string[];
  vendorResponsibilities: string;
  trialCost: number; // In Rupees
  actualResults?: string;
  observations?: string;
  recommendations?: string;
  status: PocStatus;
  progressPct: number;
  trialReports: { name: string; date: string; author: string }[];
  isClosed: boolean;
}

// ---------------------------------------------------------------------------
// PROCUREMENT PROCESSING & AWARD OF WORK (Sections 15 & 16)
// ---------------------------------------------------------------------------
export type ProcurementMethod = 
  | 'Open E-Tender' 
  | 'GeM Custom Bid' 
  | 'Limited Tender Enquiry' 
  | 'Proprietary / Single Source' 
  | 'Nominative Sanction';

export interface ProcurementProcessingRecord {
  id: string;
  problemStatementId: string;
  proposalId: string;
  administrativeApprovalRef: string;
  financialConcurrenceRef: string;
  expenditureSanctionRef: string;
  sanctionedAmountCr: number;
  recommendedVendorId: string;
  recommendedVendorName: string;
  approvalAuthority: string;
  procurementMethod: ProcurementMethod;
  prReference: string;
  tenderEnquiryRef: string;
  gemBidId: string;
  processedDate: string;
  dopComplianceVerified: boolean;
  remarks: string;
}

export interface AwardOfWork {
  id: string;
  awardCode: string; // e.g. DIOM-AOW-2026-001
  mineComplexCode: MineComplexCode;
  mineComplexName: string;
  problemStatementId: string;
  problemStatementCode: string;
  workTitle: string;
  vendorId: string;
  vendorName: string;
  procurementReference: string;
  tenderEnquiryNumber: string;
  gemBidNumber: string;
  prNumber: string;
  poNumber: string;
  loaNumber: string;
  contractNumber: string;
  awardDate: string;
  basicAwardValue: number;
  gstAmount: number;
  totalContractValue: number;
  deliveryPeriodWeeks: number;
  completionPeriodMonths: number;
  warrantyPeriodMonths: number;
  pbgDetails: {
    bgNumber: string;
    issuingBank: string;
    amount: number;
    validityDate: string;
  };
  paymentTerms: string;
  scopeOfWorkSummary: string;
  responsibleOfficer: string;
  responsibleOfficerDesignation: string;
  department: string;
  projectComplex: string;
  status: 'Sanctioned' | 'Contract Signed' | 'Under Execution' | 'Completed';
  documents: { name: string; type: string; date: string }[];
}

// ---------------------------------------------------------------------------
// PROJECT EXECUTION MANAGEMENT (Section 17 & 18)
// 12 Standard Project Stages
// ---------------------------------------------------------------------------
export type ProjectStage = 
  | 'Project Initiation'
  | 'Requirement Finalisation'
  | 'Engineering'
  | 'Manufacturing'
  | 'Inspection'
  | 'Dispatch'
  | 'Delivery'
  | 'Installation'
  | 'Commissioning'
  | 'Testing'
  | 'Acceptance'
  | 'Closure';

export type HealthStatus = 'On Track' | 'At Risk' | 'Delayed' | 'Completed';

export interface ProjectMilestone {
  id: string;
  title: string;
  stage: ProjectStage;
  plannedStartDate: string;
  plannedFinishDate: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualFinishDate?: string;
  actualEndDate?: string;
  progressPct: number;
  status: HealthStatus;
  responsibleOfficer: string;
  responsiblePerson?: string;
  vendorResponsibility: string;
  dependencies?: string[];
  delayDays: number;
  deliverables: string;
}

export interface ProjectSlaRecord {
  slaName: string;
  targetResponseHours: number;
  actualResponseHours: number;
  compliancePct: number;
  status: 'Compliant' | 'Breached' | 'Under Review';
}

export interface Project {
  id: string;
  projectCode: string; // e.g. DIOM-PRJ-2026-01
  mineComplexCode: MineComplexCode;
  mineComplexName: string;
  awardId: string;
  problemStatementId: string;
  problemStatementCode: string;
  name: string;
  vendorId: string;
  vendorName: string;
  department: string;
  nmdcDepartment?: string;
  projectComplex: string;
  projectHead: string;
  projectManager: string;
  approvedValueCr: number;
  approvedBudgetCr?: number;
  actualExpenditureCr: number;
  startDate: string;
  targetCompletionDate: string;
  actualCompletionDate?: string;
  currentStage: ProjectStage;
  health: HealthStatus;
  physicalProgressPct: number;
  financialProgressPct: number;
  milestones: ProjectMilestone[];
  slaRecords: ProjectSlaRecord[];
  warrantyExpiryDate: string;
  amcActive: boolean;
  performanceScore: number;
  reports: { title: string; date: string; author: string }[];
  benefits?: any[];
}

export interface Idea {
  id: string;
  ideaCode?: string;
  title?: string;
  department?: string;
  submitterName?: string;
  status?: string;
  estimatedAnnualSavings?: string;
  [key: string]: any;
}

// ---------------------------------------------------------------------------
// AUDIT, NOTIFICATIONS & STATS (Sections 20, 21, 22, 23)
// ---------------------------------------------------------------------------
export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  entity: string;
  details: string;
  ipAddress?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId: string;
  previousValue?: string;
  newValue?: string;
  remarks: string;
  result: 'SUCCESS' | 'FAILURE';
  ipAddress: string;
}

export interface AppNotification {
  id: string;
  userId?: string;
  targetRole?: UserRole;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  link?: string;
  createdAt: string;
  read: boolean;
}

export interface PortalStats {
  totalProblemStatements: number;
  openOpportunities: number;
  registeredVendors: number;
  budgetaryOffersReceived: number;
  pocsCompleted: number;
  pocsUnderExecution: number;
  projectsAwarded: number;
  projectsUnderExecution: number;
  projectsCompleted: number;
  totalAwardedValueCr: number;
}

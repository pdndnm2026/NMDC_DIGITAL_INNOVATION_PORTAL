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

export type MineComplexCode = 'HO' | 'DIOM' | 'KIOM' | 'BCH' | 'KDL';

export interface MineComplex {
  id: string;
  code: MineComplexCode;
  name: string;
  fullName: string;
  shortLabel: string;
  unitType: 'Head Office' | 'Iron Ore Mine' | 'Mining Complex';
  location: string;
  state: string;
  activeStatus: boolean;
  prefix: string;
  borPrefix: string;
  isCorporateAccess?: boolean;
}

export const DEFAULT_ORGANISATIONAL_UNITS: MineComplex[] = [
  {
    id: 'unit-ho',
    code: 'HO',
    name: 'Head Office (Hyderabad)',
    fullName: 'NMDC Corporate Head Office, Khanij Bhavan',
    shortLabel: 'Head Office',
    unitType: 'Head Office',
    location: 'Masab Tank, Hyderabad',
    state: 'Telangana',
    activeStatus: true,
    prefix: 'HO-PS-2026-',
    borPrefix: 'HO-BOR-2026-',
    isCorporateAccess: true,
  },
  {
    id: 'unit-diom',
    code: 'DIOM',
    name: 'DIOM – Donimalai Iron Ore Mine',
    fullName: 'Donimalai Iron Ore Mine',
    shortLabel: 'DIOM',
    unitType: 'Iron Ore Mine',
    location: 'Sandur, Bellary District',
    state: 'Karnataka',
    activeStatus: true,
    prefix: 'DIOM-PS-2026-',
    borPrefix: 'DIOM-BOR-2026-',
  },
  {
    id: 'unit-kiom',
    code: 'KIOM',
    name: 'KIOM – Kumaraswamy Iron Ore Mine',
    fullName: 'Kumaraswamy Iron Ore Mine',
    shortLabel: 'KIOM',
    unitType: 'Iron Ore Mine',
    location: 'Sandur, Bellary District',
    state: 'Karnataka',
    activeStatus: true,
    prefix: 'KIOM-PS-2026-',
    borPrefix: 'KIOM-BOR-2026-',
  },
  {
    id: 'unit-bch',
    code: 'BCH',
    name: 'Bacheli Complex',
    fullName: 'Bailadila Iron Ore Mine – Bacheli Complex (Dep-14/11C)',
    shortLabel: 'Bacheli',
    unitType: 'Mining Complex',
    location: 'Bacheli, Dantewada District',
    state: 'Chhattisgarh',
    activeStatus: true,
    prefix: 'BCH-PS-2026-',
    borPrefix: 'BCH-BOR-2026-',
  },
  {
    id: 'unit-kdl',
    code: 'KDL',
    name: 'Kirandul Complex',
    fullName: 'Bailadila Iron Ore Mine – Kirandul Complex (Dep-5/11B)',
    shortLabel: 'Kirandul',
    unitType: 'Mining Complex',
    location: 'Kirandul, Dantewada District',
    state: 'Chhattisgarh',
    activeStatus: true,
    prefix: 'KDL-PS-2026-',
    borPrefix: 'KDL-BOR-2026-',
  },
];

// Kept for backward imports while views receive DB-loaded units via /api/units
export const AUTHORIZED_MINE_COMPLEXES: MineComplex[] = DEFAULT_ORGANISATIONAL_UNITS;

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  areaOfWork?: string;
  employeeId?: string; // SAP Employee ID for NMDC staff
  designation?: string;
  mineComplexCode?: MineComplexCode | 'ALL';
  projectComplex?: string;
  location?: string;
  vendorId?: string;
  avatarUrl?: string;
  mobile?: string;
  status?: 'Pending' | 'Active' | 'Suspended';
  passwordHash?: string;
  verifiedFromEmployeeMaster?: boolean;
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
// EMPLOYEE MASTER MANAGEMENT (Change Request Section 2)
// ---------------------------------------------------------------------------
export interface EmployeeMasterRecord {
  id: string;
  employeeName: string;
  sapEmployeeId: string; // Strictly unique
  officialEmail: string; // Unique wherever provided
  mobileNumber: string;
  designation: string;
  department: string;
  areaOfWork: string;
  mineComplexCode: MineComplexCode;
  mineComplexName: string;
  location: string;
  employeeStatus: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface EmployeeImportHistory {
  id: string;
  timestamp: string;
  uploadedBy: string;
  uploadedByRole: string;
  filename: string;
  totalRows: number;
  importedCount: number;
  updatedCount: number;
  duplicateCount: number;
  rejectedCount: number;
  errorsSummary: string[];
}

// ---------------------------------------------------------------------------
// VENDOR TYPES & COMPULSORY REGISTRATION VALIDATION (Change Request Section 4)
// ---------------------------------------------------------------------------
export type VendorStatus =
  | 'Pending'
  | 'Under Verification'
  | 'Approved'
  | 'Rejected'
  | 'Active'
  | 'Suspended';

export type VendorDocType =
  | 'Registration'
  | 'PAN'
  | 'GST'
  | 'GSTExemption'
  | 'MSME'
  | 'AuthorisationLetter'
  | 'WorkOrder'
  | 'Startup'
  | 'Technical'
  | 'Financial';

export interface VendorDocument {
  id: string;
  vendorId: string;
  title: string;
  type: VendorDocType;
  fileName: string;
  fileSize: string;
  mimeType?: string;
  uploadedAt: string;
  status: 'Verified' | 'Pending' | 'Rejected';
}

export interface Vendor {
  id: string;
  name: string;
  legalEntity: 'Private Limited' | 'Public Limited' | 'LLP' | 'Partnership' | 'Proprietorship' | 'PSU / Govt Body';
  cin: string;
  pan: string;
  gstExempt: boolean;
  gstExemptionReason?: string;
  gstin: string;
  registeredAddress: string;
  state: string;
  pinCode: string;
  country: string;
  website: string;
  yearEstablished: number;
  companySize: '1-10' | '11-50' | '51-200' | '201-500' | '500+';
  msmeStatus: boolean;
  startupStatus: boolean;
  contactPerson: string;
  designation: string;
  email: string;
  mobile: string;
  alternateMobile?: string;
  natureOfBusiness: string;
  businessCategory: string;
  companyProfile: string;
  areasOfExpertise: string[];
  capabilities: string[];
  miningExperienceYears: number;
  miningPsuExperience: string;
  majorCustomers: string[];
  annualTurnoverCr: number;
  netWorthCr: number;
  declarationAccepted: boolean;
  declarationTimestamp?: string;
  status: VendorStatus;
  rejectionReason?: string;
  performanceScore: number; // 0 - 100
  documents: VendorDocument[];
  isDemo?: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// PROBLEM STATEMENT TYPES (With Video Upload + Demo Isolation)
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

export interface AttachmentFile {
  name: string;
  size: string;
  type: string;
  mediaKind?: 'document' | 'image' | 'video';
  url?: string;
}

export interface ProblemStatement {
  id: string;
  code: string; // e.g. DIOM-PS-2026-0001 or HO-PS-2026-0001
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

  // Attachments (Docs, Images & Videos: MP4/WebM/MOV)
  attachments: AttachmentFile[];

  // Workflow & Audit
  status: ProblemStatementStatus;
  publishedDate?: string;
  createdBy: string;
  approvals: ProblemStatementApprovalRecord[];
  clarifications: ClarificationQuery[];
  respondedVendorsCount: number;
  isDemo?: boolean;
}

// ---------------------------------------------------------------------------
// BUDGETARY OFFER REQUEST MODULE (Change Request Section 5)
// ---------------------------------------------------------------------------
export type BudgetaryRequestStatus =
  | 'Draft'
  | 'Pending Approval'
  | 'Approved'
  | 'Published'
  | 'Closed'
  | 'Cancelled';

export interface DeadlineExtensionRecord {
  previousDeadline: string;
  newDeadline: string;
  approvedBy: string;
  approvalRemarks: string;
  timestamp: string;
}

export interface BudgetaryOfferRequest {
  id: string;
  requestCode: string; // e.g. DIOM-BOR-2026-0001
  mineComplexCode: MineComplexCode;
  mineComplexName: string;
  linkedProblemStatementId?: string;
  linkedProblemStatementCode?: string;
  title: string;
  department: string;
  requirementCategory: string;
  scopeOfWork: string;
  technicalSpecifications: string;
  deliverables: string;
  estimatedBudgetCr: number;
  submissionDeadline: string;
  visibilityScope: 'ALL_ELIGIBLE' | 'INVITED_ONLY';
  invitedVendorIds: string[];
  invitedVendorNames: string[];
  status: BudgetaryRequestStatus;
  createdBy: string;
  createdByDesignation: string;
  approvedBy?: string;
  approvedAt?: string;
  publishedAt?: string;
  closedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  deadlineHistory: DeadlineExtensionRecord[];
  disclaimerText: string;
  attachments: AttachmentFile[];
  responsesCount: number;
  isDemo?: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// VENDOR PROPOSAL & BUDGETARY OFFER RESPONSE
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
  priceBasis: string;
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
  proposalCode: string; // e.g. DIOM-PROP-2026-0001
  mineComplexCode: MineComplexCode;
  mineComplexName: string;
  budgetaryRequestId?: string;
  budgetaryRequestCode?: string;
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
  supportingDocuments: AttachmentFile[];

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
  isDemo?: boolean;
}

// ---------------------------------------------------------------------------
// DISCUSSION & CLARIFICATIONS FACILITY (Change Request Section 6)
// Immutable official record; strict vendor privacy
// ---------------------------------------------------------------------------
export interface DiscussionMessage {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderOrganisation: string;
  senderRole: UserRole;
  messageText: string;
  attachments: AttachmentFile[];
  timestamp: string;
  isOfficialClarification?: boolean;
}

export interface DiscussionThread {
  id: string;
  threadCode: string; // e.g. DIOM-DSC-2026-0001
  mineComplexCode: MineComplexCode;
  linkedEntityType: 'PROBLEM' | 'BUDGETARY_REQUEST';
  linkedEntityId: string;
  linkedEntityCode: string;
  linkedEntityTitle: string;
  subject: string;
  vendorId?: string; // Owning vendor for confidential 1:1 threads
  vendorName?: string;
  isCommonPublic: boolean; // True = official clarification published to all vendors
  status: 'Open' | 'Closed';
  closedBy?: string;
  closedAt?: string;
  unreadByVendor: number;
  unreadByOfficer: number;
  messages: DiscussionMessage[];
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// TECHNICAL & COMMERCIAL EVALUATION
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
// PROOF OF CONCEPT (PoC) MANAGEMENT
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
  pocCode: string;
  mineComplexCode: MineComplexCode;
  mineComplexName: string;
  relatedProblemStatementId: string;
  problemStatementCode: string;
  problemStatementTitle: string;
  vendorId: string;
  vendorName: string;
  trialLocation: string;
  equipmentProcess: string;
  pocScope: string;
  trialPeriodWeeks: number;
  startDate: string;
  completionDate: string;
  baselinePerformance: string;
  expectedPerformance: string;
  evaluationParameters: string[];
  nmdcCommitteeMembers: string[];
  vendorResponsibilities: string;
  trialCost: number;
  actualResults?: string;
  observations?: string;
  recommendations?: string;
  status: PocStatus;
  progressPct: number;
  trialReports: { name: string; date: string; author: string }[];
  isClosed: boolean;
  isDemo?: boolean;
}

// ---------------------------------------------------------------------------
// PROCUREMENT PROCESSING & AWARD OF WORK
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
  awardCode: string;
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
  isDemo?: boolean;
}

// ---------------------------------------------------------------------------
// PROJECT EXECUTION MANAGEMENT (12 Standard Stages)
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
  projectCode: string;
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
  isDemo?: boolean;
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
// AUDIT, NOTIFICATIONS & STATS
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
  budgetaryRequestsActive: number;
  registeredVendors: number;
  budgetaryOffersReceived: number;
  pocsCompleted: number;
  pocsUnderExecution: number;
  projectsAwarded: number;
  projectsUnderExecution: number;
  projectsCompleted: number;
  totalAwardedValueCr: number;
}

export const VENDOR_DECLARATION_TEXT =
  'I hereby declare that all information and documents submitted are true, accurate and genuine to the best of my knowledge. I understand that any false or misleading information may result in rejection or blacklisting.';

export const BUDGETARY_DISCLAIMER_TEXT =
  'NON-BINDING BUDGETARY REQUEST: This Budgetary Offer Request (BOR) is issued solely for technical feasibility evaluation and budgetary cost estimation. Submission of a budgetary offer does not constitute a tender bid, financial commitment, or obligation to award work.';

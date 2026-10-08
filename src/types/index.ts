export type UserRole = 
  | 'public' 
  | 'executive' 
  | 'vendor' 
  | 'reviewer' 
  | 'project_manager' 
  | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  employeeId?: string;
  designation?: string;
  projectComplex?: string;
  vendorId?: string;
  avatarUrl?: string;
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
  totalIdeasSubmitted: number;
}

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
  capabilities: string[];
  miningExperienceYears: number;
  majorCustomers: string[];
  status: VendorStatus;
  performanceScore: number; // 0 - 100
  documents: VendorDocument[];
  createdAt: string;
}

export type ChallengeStatus = 'Open' | 'Under Evaluation' | 'PoC Awarded' | 'Closed';

export interface ProblemStatement {
  id: string;
  code: string; // e.g. PS-001
  title: string;
  department: string;
  projectComplex: string;
  category: string;
  subCategory?: string;
  problemDescription: string;
  currentProcess: string;
  currentDifficulties: string;
  rootCause: string;
  expectedOutcome: string;
  submissionDeadline: string;
  budgetaryIndication: string; // e.g. "₹ 2.50 Cr"
  budgetNumeric: number;
  status: ChallengeStatus;
  respondedVendorsCount: number;
  publishedDate: string;
  createdBy: string;
  equipmentAffected?: string;
  productionImpact?: string;
  safetyImpact?: string;
  costImpact?: string;
  aiSuggestedKeywords?: string[];
  documents?: { title: string; fileName: string; size: string }[];
}

export type IdeaStatus = 
  | 'Submitted' 
  | 'Screening' 
  | 'Under Evaluation' 
  | 'Approved' 
  | 'Rejected' 
  | 'PoC Approved' 
  | 'Converted to Challenge';

export interface IdeaAIAnalysis {
  category: string;
  subCategory: string;
  problemSeverity: 'Low' | 'Medium' | 'High' | 'Critical';
  potentialBusinessValue: 'Moderate' | 'High' | 'Transformative';
  estimatedComplexity: 'Low' | 'Medium' | 'High';
  technologyMaturity: 'Emerging' | 'Proven' | 'Enterprise-Ready';
  possibleAiTechnologies: string[];
  suggestedSolutionApproach: string;
  similarExistingIdeas: string[];
  potentialNmdcDepartments: string[];
  potentialScalability: string;
  recommendedPriority: 'P1' | 'P2' | 'P3';
  recommendationSummary: string;
  reviewedByAiAt?: string;
}

export interface Idea {
  id: string;
  ideaCode: string;
  title: string;
  submitterName: string;
  submitterEmail: string;
  employeeId: string;
  designation: string;
  department: string;
  projectComplex: string;
  location: string;
  contactNumber: string;
  problemStatement: string;
  existingProcess: string;
  currentDifficulties: string;
  rootCause: string;
  frequency: string;
  employeesAffected: number;
  equipmentAffected: string;
  productionImpact: string;
  safetyImpact?: string;
  costImpact: string;
  proposedInnovation: string;
  aiDigitalTechnology: string;
  expectedSolution: string;
  expectedBenefit: string;
  estimatedCost: string;
  estimatedAnnualSavings: string;
  expectedRoiYears: number;
  expectedImplementationMonths: number;
  status: IdeaStatus;
  submittedAt: string;
  reviewerComments?: string[];
  aiAnalysis?: IdeaAIAnalysis;
  attachments?: { name: string; size: string; type: string }[];
}

export interface ProposalCostBreakdown {
  pocCost: number;
  pilotCost: number;
  hardwareCost: number;
  softwareCost: number;
  integrationCost: number;
  licenceCost: number;
  trainingCost: number;
  amcCostPerYear: number;
  otherCost: number;
  gstRate: number; // e.g. 18
  totalExclGst: number;
  gstAmount: number;
  totalCostInclGst: number;
}

export interface ProposalBusinessCase {
  expectedSavingsAnnual: number; // In Lakhs or Crores
  productivityImprovementPct: number;
  availabilityImprovementPct: number;
  mtbfImprovementPct: number;
  mttrReductionPct: number;
  energySavingPct: number;
  safetyBenefits: string;
  roiYears: number;
  paybackPeriodMonths: number;
}

export type ProposalStatus = 
  | 'Submitted' 
  | 'Under Technical Review' 
  | 'Technical Shortlisted' 
  | 'Commercial Review' 
  | 'PoC Recommended' 
  | 'PoC Approved' 
  | 'Rejected';

export interface ProposalAIReview {
  executiveSummary: string;
  problemUnderstandingScore: number;
  technicalStrengths: string[];
  technicalGaps: string[];
  technologyMaturity: string;
  implementationRisks: string[];
  cybersecurityRisks: string[];
  commercialObservations: string[];
  costConcerns: string[];
  roiAssessment: string;
  scalability: string;
  vendorCapability: string;
  questionsForVendor: string[];
  recommendedDueDiligence: string[];
  confidenceScore: number;
}

export interface Proposal {
  id: string;
  proposalCode: string;
  problemStatementId: string;
  problemStatementCode: string;
  problemStatementTitle: string;
  vendorId: string;
  vendorName: string;
  submittedAt: string;
  status: ProposalStatus;
  
  // Step 2: Understanding
  problemUnderstanding: string;
  existingSituationAssessment: string;
  rootCauseAnalysis: string;
  proposedImprovement: string;
  
  // Step 3: Technical
  solutionDescription: string;
  architectureType: 'Cloud' | 'On-Premise' | 'Hybrid Edge-Cloud';
  technologyStack: string[];
  aiMlModels: string[];
  hardwareSpecs: string;
  softwareSpecs: string;
  sensorsIotDetails: string;
  cybersecurityCompliance: string;
  dataRequirements: string;
  
  // Step 4: Implementation
  methodology: string;
  timelineMonths: number;
  manpowerRequired: string;
  trainingScope: string;
  warrantyPeriodYears: number;
  amcScope: string;
  
  // Step 5: Costs
  costBreakdown: ProposalCostBreakdown;
  
  // Step 6: Business Case
  businessCase: ProposalBusinessCase;
  
  // Step 7: Documents
  documents: { title: string; fileName: string; type: string }[];
  
  // Evaluation scores
  technicalScore?: number;
  commercialScore?: number;
  compositeScore?: number;
  committeeRecommendation?: 'Recommend PoC' | 'Keep on Standby' | 'Clarification Required' | 'Reject';
  committeeComments?: string;
  
  // AI analysis
  aiReview?: ProposalAIReview;
}

export interface EvaluationParameter {
  id: string;
  name: string;
  type: 'technical' | 'commercial';
  weightPct: number;
  description: string;
  maxMarks: number;
}

export interface ProposalEvaluationRecord {
  id: string;
  proposalId: string;
  reviewerId: string;
  reviewerName: string;
  evaluatedAt: string;
  parameterScores: Record<string, number>; // parameterId -> score out of maxMarks
  weightedScore: number;
  strengths: string;
  concerns: string;
  recommendation: 'Recommend PoC' | 'Keep on Standby' | 'Clarification Required' | 'Reject';
}

export type ProjectStage = 
  | 'Initiation' 
  | 'Requirement Finalisation' 
  | 'PoC' 
  | 'Pilot' 
  | 'Implementation' 
  | 'Testing' 
  | 'Training' 
  | 'Go-Live' 
  | 'Stabilisation' 
  | 'Benefits Realisation' 
  | 'Closure';

export type HealthStatus = 'On Track' | 'At Risk' | 'Delayed' | 'Completed';

export interface ProjectMilestone {
  id: string;
  title: string;
  stage: ProjectStage;
  plannedStartDate: string;
  plannedEndDate: string;
  actualEndDate?: string;
  progressPct: number;
  status: HealthStatus;
  responsiblePerson: string;
  dependencies?: string[];
  deliverables: string;
}

export interface ProjectRisk {
  id: string;
  description: string;
  category: 'Technical' | 'Operational' | 'Vendor' | 'Site' | 'Security';
  severity: 'Low' | 'Medium' | 'High';
  mitigationPlan: string;
  status: 'Open' | 'Mitigated' | 'Closed';
}

export interface ProjectKPI {
  id: string;
  name: string;
  baseline: string;
  target: string;
  current: string;
  unit: string;
  status: 'Target Met' | 'In Progress' | 'Off Track';
}

export interface ProjectBenefit {
  id: string;
  category: 'Financial' | 'Safety' | 'Productivity' | 'Environment';
  description: string;
  projectedAnnualCr: number;
  realisedAnnualCr: number;
}

export interface Project {
  id: string;
  projectCode: string;
  name: string;
  problemStatementId: string;
  problemStatementCode: string;
  vendorId: string;
  vendorName: string;
  nmdcDepartment: string;
  nmdcComplex: string;
  projectManager: string;
  approvedBudgetCr: number;
  actualExpenditureCr: number;
  startDate: string;
  targetCompletionDate: string;
  actualCompletionDate?: string;
  currentStage: ProjectStage;
  health: HealthStatus;
  progressPct: number;
  milestones: ProjectMilestone[];
  risks: ProjectRisk[];
  kpis: ProjectKPI[];
  benefits: ProjectBenefit[];
  reports: { title: string; date: string; author: string }[];
}

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
  action: string;
  entityType: string;
  entityId: string;
  previousValue?: string;
  newValue?: string;
  result: 'SUCCESS' | 'FAILURE';
  ipAddress: string;
}

export interface AppNotification {
  id: string;
  userId?: string; // If undefined, broadcast
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  link?: string;
  createdAt: string;
  read: boolean;
}

export interface PortalStats {
  totalIdeas: number;
  activeChallenges: number;
  registeredVendors: number;
  proposalsReceived: number;
  pocsUnderExecution: number;
  projectsUnderImplementation: number;
  projectsCompleted: number;
  estimatedAnnualSavingsCr: number;
  realisedSavingsCr: number;
  aiSolutionsImplemented: number;
}

export type PillarId = 'innovate' | 'solve' | 'evaluate' | 'implement' | 'measure';

export interface InnovationScoreWeights {
  businessBenefitWeight: number; // 20%
  safetyImpactWeight: number; // 15%
  costSavingWeight: number; // 15%
  innovationWeight: number; // 10%
  scalabilityWeight: number; // 15%
  feasibilityWeight: number; // 10%
  digitalMaturityWeight: number; // 10%
  esgImpactWeight: number; // 5%
}

export interface InnovationScoreBreakdown {
  businessBenefit: number; // 0-100
  safetyImpact: number; // 0-100
  costSaving: number; // 0-100
  innovation: number; // 0-100
  scalability: number; // 0-100
  feasibility: number; // 0-100
  digitalMaturity: number; // 0-100
  esgImpact: number; // 0-100
  overallScore: number; // 0-100
}

export interface PlainProblemConversion {
  rawText: string;
  structuredTitle: string;
  problemCategory: string;
  possibleTechnology: string[];
  potentialKpis: string[];
  potentialSolution: string;
  equipmentAffected?: string;
  expectedBenefitSummary: string;
  suggestedDepartment: string;
  indicativeBudgetRange: string;
}

export interface ProblemToSolutionResult {
  queryText: string;
  possibleSolutions: {
    title: string;
    description: string;
    technology: string;
    complexity: 'Low' | 'Medium' | 'High';
    timeToDeployMonths: number;
  }[];
  requiredData: string[];
  expectedKpis: {
    name: string;
    target: string;
    unit: string;
  }[];
  recommendedApproach: string;
}

export interface IdeaDuplicateMatch {
  similarityPct: number;
  existingIdeaId: string;
  existingIdeaCode: string;
  existingTitle: string;
  status: string;
  projectOwner: string;
  existingSolution: string;
  alreadyImplemented: boolean;
  implementationComplex?: string;
  recommendation: string;
}

export interface KnowledgeRepositoryItem {
  id: string;
  title: string;
  category: 'AI' | 'Mining' | 'HEMM' | 'Safety' | 'Maintenance' | 'Environment' | 'Energy' | 'Procurement' | 'Automation' | 'Digitalisation';
  type: 'Completed Project' | 'PoC Report' | 'Technical SOP' | 'Case Study' | 'Vendor Solution Whitepaper' | 'Lessons Learned';
  complex: string;
  equipment: string;
  author: string;
  year: number;
  summary: string;
  resultsAndBenefits: string;
  keyLearnings: string[];
  documentFileName: string;
  documentSize: string;
  contactOfficer: string;
}

export interface ImplementedSolution {
  id: string;
  title: string;
  problemAddressed: string;
  technology: string;
  vendor: string;
  implementedComplex: string;
  commissionYear: number;
  results: string;
  cost: string;
  annualBenefits: string;
  contactPerson: string;
  scalingReadiness: 'Ready for Mine-wide Rollout' | 'Site Specific' | 'Pilot Verification Complete';
}

export interface VendorRatingParameterScores {
  technicalPerformance: number;
  delivery: number;
  support: number;
  responseTime: number;
  uptime: number;
  documentation: number;
  training: number;
  cybersecurity: number;
  costPerformance: number;
  slaCompliance: number;
  overallScore: number;
  evaluatedBy: string;
  evaluatedAt: string;
  remarks: string;
}

export interface VendorMarketplaceSolution {
  id: string;
  vendorId: string;
  vendorName: string;
  title: string;
  category: string;
  targetMiningEquipment: string[];
  shortSummary: string;
  fullDescription: string;
  technologyStack: string[];
  keyBenefits: string[];
  certifications: string[];
  pastInstallations: string[];
  demoVideoAvailable: boolean;
  caseStudyTitle?: string;
  trlLevel: number;
}

export interface PocRecord {
  id: string;
  pocCode: string;
  title: string;
  problemStatementCode: string;
  problemStatementTitle: string;
  vendorId: string;
  vendorName: string;
  objective: string;
  baselineMetric: string;
  targetMetric: string;
  kpiName: string;
  durationWeeks: number;
  cost: number;
  siteComplex: string;
  equipmentTarget: string;
  responsibleOfficer: string;
  startDate: string;
  endDate: string;
  status: 'In Evaluation' | 'Active Bench Testing' | 'Field Trial Underway' | 'Success Criteria Met' | 'Approved for Pilot' | 'Discontinued';
  progressPct: number;
  testResultsSummary?: string;
  recommendationForPilot?: string;
}


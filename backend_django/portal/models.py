# NMDC Limited - Problem Statement, Vendor Solution & Project Management Portal
# Django PostgreSQL Enterprise Database Models (Zero-AI Architecture)

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

# 0. Dedicated Mine / Operating Complex Model (Section 4 & 13)
class MineComplex(models.Model):
    complex_code = models.CharField(max_length=10, primary_key=True, unique=True, help_text="DIOM, KIOM, BCH, KDL")
    name = models.CharField(max_length=150)
    location = models.CharField(max_length=150)
    state = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'nmdc_mine_complexes'
        verbose_name = 'Mine / Complex'
        verbose_name_plural = 'Mine / Operating Complexes'

    def __str__(self):
        return f"{self.complex_code} - {self.name}"

# 1. Ten User Roles (Section 3)
class UserRole(models.TextChoices):
    PUBLIC = 'public', 'Public Visitor'
    EXECUTIVE = 'executive', 'NMDC Executive / Employee'
    DEPT_HEAD = 'dept_head', 'Department Head'
    APPROVING_AUTHORITY = 'approving_authority', 'Approving Authority'
    VENDOR = 'vendor', 'Registered Vendor'
    TECH_EVALUATOR = 'tech_evaluator', 'Technical Evaluator'
    COMM_EVALUATOR = 'comm_evaluator', 'Commercial Evaluator'
    POC_COMMITTEE = 'poc_committee', 'PoC Committee Member'
    PROJECT_MANAGER = 'project_manager', 'Project Manager'
    ADMIN = 'admin', 'Portal Administrator'

class PortalUserStatus(models.TextChoices):
    PENDING = 'Pending', 'Pending Admin Verification'
    ACTIVE = 'Active', 'Active & Verified'
    SUSPENDED = 'Suspended', 'Suspended'

class PortalUser(AbstractUser):
    role = models.CharField(max_length=30, choices=UserRole.choices, default=UserRole.PUBLIC)
    status = models.CharField(max_length=20, choices=PortalUserStatus.choices, default=PortalUserStatus.PENDING)
    employee_id = models.CharField(max_length=50, blank=True, null=True, unique=True)
    department = models.CharField(max_length=150, blank=True, null=True)
    designation = models.CharField(max_length=150, blank=True, null=True)
    
    # ForeignKey to Dedicated Mine/Complex
    mine_complex = models.ForeignKey(MineComplex, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_users')
    project_complex = models.CharField(max_length=150, blank=True, null=True)
    mobile = models.CharField(max_length=20, blank=True, null=True)
    vendor_ref = models.ForeignKey('Vendor', on_delete=models.SET_NULL, null=True, blank=True, related_name='representatives')

    class Meta:
        db_table = 'nmdc_portal_users'
        verbose_name = 'Portal User'
        verbose_name_plural = 'Portal Users'

# 2. Vendor Registration & Verification (Section 8)
class VendorStatus(models.TextChoices):
    PENDING = 'Pending', 'Pending Admin Verification'
    UNDER_VERIFICATION = 'Under Verification', 'Under Verification'
    APPROVED = 'Approved', 'Approved'
    ACTIVE = 'Active', 'Active'
    SUSPENDED = 'Suspended', 'Suspended'

class Vendor(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, verbose_name="Company Name")
    registration_number = models.CharField(max_length=50, blank=True, verbose_name="Registration Number")
    legal_constitution = models.CharField(max_length=50, choices=[
        ('Private Limited', 'Private Limited'),
        ('Public Limited', 'Public Limited'),
        ('LLP', 'Limited Liability Partnership (LLP)'),
        ('Partnership', 'Partnership'),
        ('Proprietorship', 'Proprietorship'),
    ], default='Private Limited')
    cin = models.CharField(max_length=30, unique=True, verbose_name="CIN", blank=True, null=True)
    pan = models.CharField(max_length=15, unique=True, verbose_name="PAN")
    gstin = models.CharField(max_length=20, unique=True, verbose_name="GSTIN")
    registered_address = models.TextField()
    website = models.URLField(blank=True, null=True)
    year_established = models.PositiveIntegerField(default=2015)
    contact_person = models.CharField(max_length=150)
    designation = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    mobile = models.CharField(max_length=20)
    msme_status = models.BooleanField(default=False, verbose_name="MSME Registered")
    startup_status = models.BooleanField(default=False, verbose_name="DPIIT Startup")
    areas_of_expertise = models.JSONField(default=list)
    mining_experience_years = models.PositiveIntegerField(default=0)
    mining_psu_experience = models.TextField(blank=True)
    annual_turnover_cr = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    net_worth_cr = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    status = models.CharField(max_length=30, choices=VendorStatus.choices, default=VendorStatus.PENDING)
    performance_score = models.PositiveIntegerField(default=85, validators=[MinValueValidator(0), MaxValueValidator(100)])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'nmdc_vendors'

class VendorDocument(models.Model):
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=200)
    document_type = models.CharField(max_length=50, choices=[
        ('Registration', 'Certificate of Incorporation'),
        ('GST', 'GST Registration Certificate'),
        ('PAN', 'PAN Card'),
        ('MSME', 'MSME / Udyam Certificate'),
        ('Startup', 'DPIIT Startup Certificate'),
        ('WorkOrder', 'Prior Work Order / Completion Certificate'),
        ('Financial', 'Audited Balance Sheet'),
    ])
    file = models.FileField(upload_to='vendor_documents/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(PortalUser, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = 'nmdc_vendor_documents'

# 3. Problem Statement & Approvals (Sections 6 & 7)
class ProblemStatementStatus(models.TextChoices):
    DRAFT = 'Draft', 'Draft'
    SUBMITTED = 'Submitted', 'Submitted'
    DEPT_REVIEW = 'Department Review', 'Department Review'
    APPROVAL = 'Approval', 'Approval'
    PUBLISHED = 'Published', 'Published'
    VENDOR_PARTICIPATION = 'Vendor Participation', 'Vendor Participation'
    TECHNICAL_EVALUATION = 'Technical Evaluation', 'Technical Evaluation'
    COMMERCIAL_EVALUATION = 'Commercial Evaluation', 'Commercial Evaluation'
    POC_UNDERWAY = 'PoC Underway', 'PoC Underway'
    AWARD_SANCTIONED = 'Award Sanctioned', 'Award Sanctioned'
    CLOSED = 'Closed', 'Closed'

class ProblemStatement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True, help_text="e.g. DIOM-PS-2026-0001")
    mine_complex = models.ForeignKey(MineComplex, on_delete=models.PROTECT, related_name='problem_statements')
    title = models.CharField(max_length=300)
    department = models.CharField(max_length=150)
    project_complex = models.CharField(max_length=150)
    location = models.CharField(max_length=150)
    originating_officer = models.ForeignKey(PortalUser, on_delete=models.PROTECT, related_name='originating_problems')
    designation = models.CharField(max_length=150)
    submission_date = models.DateField(auto_now_add=True)
    category = models.CharField(max_length=150)
    sub_category = models.CharField(max_length=150, blank=True)
    
    # Problem details
    existing_situation = models.TextField()
    detailed_problem_statement = models.TextField()
    operational_difficulties = models.TextField()
    existing_equipment = models.CharField(max_length=255, blank=True)
    reason_for_requirement = models.TextField()
    desired_outcome = models.TextField()
    expected_benefits = models.TextField()
    supporting_technical_info = models.TextField(blank=True)

    # Requirement details
    required_solution = models.TextField()
    technical_specifications = models.TextField()
    scope_of_supply = models.TextField()
    required_deliverables = models.TextField()
    implementation_period_months = models.PositiveIntegerField(default=6)
    indicative_budget = models.CharField(max_length=100)
    budget_numeric_cr = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    required_vendor_experience = models.TextField()
    submission_deadline = models.DateField()

    status = models.CharField(max_length=30, choices=ProblemStatementStatus.choices, default=ProblemStatementStatus.DRAFT)
    published_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'nmdc_problem_statements'

class ProblemStatementApproval(models.Model):
    problem_statement = models.ForeignKey(ProblemStatement, on_delete=models.CASCADE, related_name='approval_history')
    stage = models.CharField(max_length=100)
    action = models.CharField(max_length=50, choices=[('Approved', 'Approved'), ('Returned', 'Returned for Clarification'), ('Rejected', 'Rejected')])
    officer = models.ForeignKey(PortalUser, on_delete=models.PROTECT)
    remarks = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'nmdc_problem_statement_approvals'

# 4. Clarification Management (Section 11)
class ClarificationQuery(models.Model):
    problem_statement = models.ForeignKey(ProblemStatement, on_delete=models.CASCADE, related_name='clarifications')
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE)
    query_subject = models.CharField(max_length=255)
    query_text = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=40, choices=[
        ('Pending Response', 'Pending Response'),
        ('Response Prepared', 'Response Prepared'),
        ('Published to All Vendors', 'Published to All Vendors'),
    ], default='Pending Response')
    response_text = models.TextField(blank=True, null=True)
    answered_by = models.ForeignKey(PortalUser, on_delete=models.SET_NULL, null=True, blank=True)
    answered_at = models.DateTimeField(null=True, blank=True)
    is_common_to_all = models.BooleanField(default=True)

    class Meta:
        db_table = 'nmdc_clarification_queries'

# 5. Vendor Proposal & Budgetary Offer (Section 10)
class ProposalStatus(models.TextChoices):
    DRAFT = 'Draft', 'Draft'
    SUBMITTED = 'Submitted', 'Submitted'
    UNDER_TECH_EVAL = 'Under Technical Evaluation', 'Under Technical Evaluation'
    TECH_QUALIFIED = 'Technically Qualified', 'Technically Qualified'
    TECH_DISQUALIFIED = 'Technically Disqualified', 'Technically Disqualified'
    CLARIFICATION_REQUIRED = 'Clarification Required', 'Clarification Required'
    UNDER_COMM_EVAL = 'Under Commercial Evaluation', 'Under Commercial Evaluation'
    POC_RECOMMENDED = 'PoC Recommended', 'PoC Recommended'
    AWARD_RECOMMENDED = 'Award Recommended', 'Award Recommended'
    AWARDED = 'Awarded', 'Awarded'
    REJECTED = 'Rejected', 'Rejected'

class VendorProposal(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    proposal_code = models.CharField(max_length=50, unique=True, help_text="e.g. DIOM-PROP-2026-0001")
    problem_statement = models.ForeignKey(ProblemStatement, on_delete=models.PROTECT, related_name='proposals')
    mine_complex = models.ForeignKey(MineComplex, on_delete=models.PROTECT, related_name='proposals')
    vendor = models.ForeignKey(Vendor, on_delete=models.PROTECT, related_name='proposals')
    submitted_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=40, choices=ProposalStatus.choices, default=ProposalStatus.SUBMITTED)
    is_locked = models.BooleanField(default=True)
    revision_number = models.PositiveIntegerField(default=1)

    # Part A: Technical Proposal
    understanding_of_requirement = models.TextField()
    proposed_solution = models.TextField()
    technical_specifications = models.TextField()
    equipment_details = models.TextField()
    software_details = models.TextField()
    system_architecture = models.TextField()
    scope_of_supply = models.TextField()
    installation_commissioning = models.TextField()
    integration_requirements = models.TextField()
    implementation_methodology = models.TextField()
    delivery_period_weeks = models.PositiveIntegerField(default=12)
    warranty_months = models.PositiveIntegerField(default=12)
    amc_scope = models.TextField()
    training_scope = models.TextField()
    technical_deviations = models.TextField(blank=True)

    # Part B: Itemized Commercial Proposal
    equipment_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    hardware_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    software_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    licence_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    installation_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    commissioning_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    integration_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    training_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    freight_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    amc_cost_per_year = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    other_charges = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    subtotal_cost = models.DecimalField(max_digits=14, decimal_places=2, default=0.0)
    gst_rate_pct = models.DecimalField(max_digits=4, decimal_places=2, default=18.0)
    gst_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0.0)
    total_estimated_cost = models.DecimalField(max_digits=14, decimal_places=2, default=0.0)

    # Part C: Commercial Conditions
    offer_validity_days = models.PositiveIntegerField(default=90)
    payment_terms = models.TextField()
    amc_years = models.PositiveIntegerField(default=3)
    price_basis = models.CharField(max_length=255, default='FOR Destination')
    taxes_and_duties = models.TextField(default='GST extra at prevailing statutory rates')

    # Evaluation results
    technical_compliance_status = models.CharField(max_length=40, blank=True, null=True)
    technical_marks = models.PositiveIntegerField(blank=True, null=True)
    technical_remarks = models.TextField(blank=True, null=True)
    evaluated_by = models.ForeignKey(PortalUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='evaluated_proposals')
    commercial_rank = models.CharField(max_length=10, blank=True, null=True)
    committee_recommendation = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        db_table = 'nmdc_vendor_proposals'

# 6. Technical Evaluation (Section 12)
class TechnicalEvaluationParameter(models.Model):
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=50, default='Technical')
    max_marks = models.PositiveIntegerField(default=10)
    description = models.TextField()
    mandatory = models.BooleanField(default=True)

    class Meta:
        db_table = 'nmdc_evaluation_parameters'

class ParameterScore(models.Model):
    proposal = models.ForeignKey(VendorProposal, on_delete=models.CASCADE, related_name='scores')
    parameter = models.ForeignKey(TechnicalEvaluationParameter, on_delete=models.PROTECT)
    compliance = models.CharField(max_length=40, choices=[
        ('Compliant', 'Compliant'),
        ('Partially Compliant', 'Partially Compliant'),
        ('Non-Compliant', 'Non-Compliant'),
        ('Clarification Required', 'Clarification Required')
    ])
    marks_awarded = models.PositiveIntegerField()
    observations = models.TextField()

    class Meta:
        db_table = 'nmdc_parameter_scores'

# 7. Proof of Concept (PoC) Management (Section 14)
class PocRecord(models.Model):
    poc_code = models.CharField(max_length=50, unique=True, help_text="e.g. DIOM-POC-2026-0001")
    mine_complex = models.ForeignKey(MineComplex, on_delete=models.PROTECT, related_name='pocs')
    problem_statement = models.ForeignKey(ProblemStatement, on_delete=models.PROTECT)
    vendor = models.ForeignKey(Vendor, on_delete=models.PROTECT)
    trial_location = models.CharField(max_length=255)
    equipment_process = models.CharField(max_length=255)
    poc_scope = models.TextField()
    trial_period_weeks = models.PositiveIntegerField(default=4)
    start_date = models.DateField()
    completion_date = models.DateField()
    baseline_performance = models.TextField()
    expected_performance = models.TextField()
    trial_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    actual_results = models.TextField(blank=True)
    observations = models.TextField(blank=True)
    recommendations = models.TextField(blank=True)
    status = models.CharField(max_length=40, default='Proposed')
    progress_pct = models.PositiveIntegerField(default=0)
    is_closed = models.BooleanField(default=False)

    class Meta:
        db_table = 'nmdc_poc_records'

# 8. Award of Work & Contract (Section 16)
class AwardOfWork(models.Model):
    award_code = models.CharField(max_length=50, unique=True, help_text="e.g. DIOM-AOW-2026-0001")
    mine_complex = models.ForeignKey(MineComplex, on_delete=models.PROTECT, related_name='awards')
    problem_statement = models.ForeignKey(ProblemStatement, on_delete=models.PROTECT)
    proposal = models.ForeignKey(VendorProposal, on_delete=models.PROTECT, null=True, blank=True)
    work_title = models.CharField(max_length=300)
    vendor = models.ForeignKey(Vendor, on_delete=models.PROTECT)
    procurement_reference = models.CharField(max_length=100)
    tender_enquiry_number = models.CharField(max_length=100)
    gem_bid_number = models.CharField(max_length=100)
    pr_number = models.CharField(max_length=100)
    po_number = models.CharField(max_length=100)
    loa_number = models.CharField(max_length=100)
    contract_number = models.CharField(max_length=100)
    award_date = models.DateField()
    basic_award_value = models.DecimalField(max_digits=14, decimal_places=2)
    gst_amount = models.DecimalField(max_digits=14, decimal_places=2)
    total_contract_value = models.DecimalField(max_digits=14, decimal_places=2)
    delivery_period_weeks = models.PositiveIntegerField()
    completion_period_months = models.PositiveIntegerField()
    warranty_period_months = models.PositiveIntegerField()
    
    # PBG
    pbg_number = models.CharField(max_length=100)
    pbg_issuing_bank = models.CharField(max_length=150)
    pbg_amount = models.DecimalField(max_digits=12, decimal_places=2)
    pbg_validity_date = models.DateField()

    payment_terms = models.TextField()
    scope_of_work_summary = models.TextField()
    responsible_officer = models.ForeignKey(PortalUser, on_delete=models.PROTECT)
    status = models.CharField(max_length=40, default='Sanctioned')

    class Meta:
        db_table = 'nmdc_awards_of_work'

# 9. 12-Stage Project Execution Tracking (Sections 17 & 18)
class Project(models.Model):
    project_code = models.CharField(max_length=50, unique=True, help_text="e.g. DIOM-PRJ-2026-0001")
    mine_complex = models.ForeignKey(MineComplex, on_delete=models.PROTECT, related_name='projects')
    award = models.ForeignKey(AwardOfWork, on_delete=models.PROTECT)
    name = models.CharField(max_length=300)
    vendor = models.ForeignKey(Vendor, on_delete=models.PROTECT)
    department = models.CharField(max_length=150)
    project_complex = models.CharField(max_length=150)
    project_manager = models.ForeignKey(PortalUser, on_delete=models.PROTECT)
    approved_value_cr = models.DecimalField(max_digits=10, decimal_places=2)
    actual_expenditure_cr = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    start_date = models.DateField()
    target_completion_date = models.DateField()
    actual_completion_date = models.DateField(null=True, blank=True)
    current_stage = models.CharField(max_length=50, default='Project Initiation')
    health = models.CharField(max_length=30, default='On Track')
    physical_progress_pct = models.PositiveIntegerField(default=0)
    financial_progress_pct = models.PositiveIntegerField(default=0)
    warranty_expiry_date = models.DateField(null=True, blank=True)
    amc_active = models.BooleanField(default=True)
    performance_score = models.PositiveIntegerField(default=90)

    class Meta:
        db_table = 'nmdc_projects'

class ProjectMilestone(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='milestones')
    title = models.CharField(max_length=255)
    stage = models.CharField(max_length=50)
    planned_start_date = models.DateField()
    planned_finish_date = models.DateField()
    actual_finish_date = models.DateField(null=True, blank=True)
    progress_pct = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=30, default='On Track')
    responsible_officer = models.CharField(max_length=150)
    vendor_responsibility = models.CharField(max_length=150)
    delay_days = models.IntegerField(default=0)
    deliverables = models.TextField()

    class Meta:
        db_table = 'nmdc_project_milestones'

# 10. Immutable Audit Trail (Section 23)
class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(PortalUser, on_delete=models.SET_NULL, null=True, blank=True)
    user_role = models.CharField(max_length=50)
    action = models.CharField(max_length=100)
    entity_type = models.CharField(max_length=100)
    entity_id = models.CharField(max_length=100)
    previous_value = models.TextField(blank=True, null=True)
    new_value = models.TextField(blank=True, null=True)
    remarks = models.TextField(blank=True)
    result = models.CharField(max_length=20, default='SUCCESS')
    ip_address = models.GenericIPAddressField(default='127.0.0.1')

    class Meta:
        db_table = 'nmdc_audit_logs'
        ordering = ['-timestamp']

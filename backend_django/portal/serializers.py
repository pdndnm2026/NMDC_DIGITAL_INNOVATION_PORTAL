# NMDC Limited - Problem Statement, Vendor Solution & Project Management Portal
# Django REST Framework Serializers

from rest_framework import serializers
from .models import (
    PortalUser,
    Vendor,
    VendorDocument,
    ProblemStatement,
    ProblemStatementApproval,
    ClarificationQuery,
    VendorProposal,
    TechnicalEvaluationParameter,
    ParameterScore,
    PocRecord,
    AwardOfWork,
    Project,
    ProjectMilestone,
    AuditLog
)

class PortalUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortalUser
        fields = ['id', 'username', 'email', 'role', 'employee_id', 'department', 'designation', 'project_complex', 'mobile']

class VendorDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = VendorDocument
        fields = '__all__'

class VendorSerializer(serializers.ModelSerializer):
    documents = VendorDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = Vendor
        fields = '__all__'

class ClarificationQuerySerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)

    class Meta:
        model = ClarificationQuery
        fields = '__all__'

class ProblemStatementApprovalSerializer(serializers.ModelSerializer):
    officer_name = serializers.CharField(source='officer.get_full_name', read_only=True)

    class Meta:
        model = ProblemStatementApproval
        fields = '__all__'

class ProblemStatementSerializer(serializers.ModelSerializer):
    approval_history = ProblemStatementApprovalSerializer(many=True, read_only=True)
    clarifications = ClarificationQuerySerializer(many=True, read_only=True)
    proposals_count = serializers.IntegerField(source='proposals.count', read_only=True)

    class Meta:
        model = ProblemStatement
        fields = '__all__'

class ParameterScoreSerializer(serializers.ModelSerializer):
    parameter_name = serializers.CharField(source='parameter.name', read_only=True)

    class Meta:
        model = ParameterScore
        fields = '__all__'

class VendorProposalSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    problem_statement_code = serializers.CharField(source='problem_statement.code', read_only=True)
    scores = ParameterScoreSerializer(many=True, read_only=True)

    class Meta:
        model = VendorProposal
        fields = '__all__'

class TechnicalEvaluationParameterSerializer(serializers.ModelSerializer):
    class Meta:
        model = TechnicalEvaluationParameter
        fields = '__all__'

class PocRecordSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    problem_statement_code = serializers.CharField(source='problem_statement.code', read_only=True)

    class Meta:
        model = PocRecord
        fields = '__all__'

class AwardOfWorkSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    problem_statement_code = serializers.CharField(source='problem_statement.code', read_only=True)

    class Meta:
        model = AwardOfWork
        fields = '__all__'

class ProjectMilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectMilestone
        fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    milestones = ProjectMilestoneSerializer(many=True, read_only=True)
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)

    class Meta:
        model = Project
        fields = '__all__'

class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = '__all__'

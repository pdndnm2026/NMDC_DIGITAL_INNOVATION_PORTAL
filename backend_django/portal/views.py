# NMDC Limited - Problem Statement, Vendor Solution & Project Management Portal
# Django REST Framework ViewSets

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Sum
from .models import (
    PortalUser,
    Vendor,
    ProblemStatement,
    ClarificationQuery,
    VendorProposal,
    TechnicalEvaluationParameter,
    PocRecord,
    AwardOfWork,
    Project,
    ProjectMilestone,
    AuditLog
)
from .serializers import (
    PortalUserSerializer,
    VendorSerializer,
    ProblemStatementSerializer,
    ClarificationQuerySerializer,
    VendorProposalSerializer,
    TechnicalEvaluationParameterSerializer,
    PocRecordSerializer,
    AwardOfWorkSerializer,
    ProjectSerializer,
    ProjectMilestoneSerializer,
    AuditLogSerializer
)

class ProblemStatementViewSet(viewsets.ModelViewSet):
    queryset = ProblemStatement.objects.all().order_by('-created_at')
    serializer_class = ProblemStatementSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.query_params.get('category')
        status_filter = self.request.query_params.get('status')
        complex_filter = self.request.query_params.get('complex')

        if category and category != 'All':
            qs = qs.filter(category=category)
        if status_filter and status_filter != 'All':
            qs = qs.filter(status=status_filter)
        if complex_filter and complex_filter != 'All':
            qs = qs.filter(project_complex__icontains=complex_filter)
        return qs

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        ps = self.get_object()
        target_status = request.data.get('targetStatus', 'Published')
        remarks = request.data.get('remarks', 'Approved by competent authority')
        
        ps.status = target_status
        ps.save()

        AuditLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            user_role='approving_authority',
            action='APPROVE_PROBLEM_STATEMENT',
            entity_type='ProblemStatement',
            entity_id=str(ps.id),
            new_value=target_status,
            remarks=remarks
        )

        return Response({'success': True, 'status': ps.status})

class VendorViewSet(viewsets.ModelViewSet):
    queryset = Vendor.objects.all().order_by('-created_at')
    serializer_class = VendorSerializer

    @action(detail=True, methods=['patch'], url_path='status')
    def update_status(self, request, pk=None):
        vendor = self.get_object()
        new_status = request.data.get('status')
        if new_status:
            vendor.status = new_status
            vendor.save()
            return Response({'success': True, 'status': vendor.status})
        return Response({'success': False, 'message': 'Status parameter required'}, status=status.HTTP_400_BAD_REQUEST)

class VendorProposalViewSet(viewsets.ModelViewSet):
    queryset = VendorProposal.objects.all().order_by('-submitted_at')
    serializer_class = VendorProposalSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        ps_id = self.request.query_params.get('problemStatementId')
        if ps_id:
            qs = qs.filter(problem_statement_id=ps_id)
        return qs

    @action(detail=True, methods=['patch'], url_path='evaluate')
    def evaluate(self, request, pk=None):
        prop = self.get_object()
        compliance = request.data.get('complianceStatus', 'Compliant')
        marks = request.data.get('marks', 90)
        remarks = request.data.get('remarks', 'Evaluated against parameters')

        prop.technical_compliance_status = compliance
        prop.technical_marks = marks
        prop.technical_remarks = remarks
        prop.status = 'Technically Qualified' if compliance == 'Compliant' else 'Technically Disqualified'
        prop.save()

        return Response({'success': True, 'data': VendorProposalSerializer(prop).data})

class PocRecordViewSet(viewsets.ModelViewSet):
    queryset = PocRecord.objects.all().order_by('-start_date')
    serializer_class = PocRecordSerializer

class AwardOfWorkViewSet(viewsets.ModelViewSet):
    queryset = AwardOfWork.objects.all().order_by('-award_date')
    serializer_class = AwardOfWorkSerializer

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by('-start_date')
    serializer_class = ProjectSerializer

    @action(detail=True, methods=['patch'], url_path='milestones/(?P<milestone_id>[^/.]+)')
    def update_milestone(self, request, pk=None, milestone_id=None):
        project = self.get_object()
        try:
            milestone = project.milestones.get(id=milestone_id)
            milestone.progress_pct = request.data.get('progressPct', milestone.progress_pct)
            milestone.status = request.data.get('status', milestone.status)
            milestone.save()

            # Recalculate physical progress
            avg_progress = project.milestones.aggregate(avg=models.Avg('progress_pct'))['avg']
            project.physical_progress_pct = int(avg_progress or 0)
            project.save()

            return Response({'success': True, 'data': ProjectSerializer(project).data})
        except ProjectMilestone.DoesNotExist:
            return Response({'success': False, 'message': 'Milestone not found'}, status=status.HTTP_404_NOT_FOUND)

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer

class StatsViewSet(viewsets.ViewSet):
    def list(self, request):
        stats = {
            'totalProblemStatements': ProblemStatement.objects.count(),
            'openOpportunities': ProblemStatement.objects.filter(status='Published').count(),
            'registeredVendors': Vendor.objects.count(),
            'budgetaryOffersReceived': VendorProposal.objects.count(),
            'pocsCompleted': PocRecord.objects.filter(status='Successful').count(),
            'pocsUnderExecution': PocRecord.objects.filter(status='Under Trial').count(),
            'projectsAwarded': AwardOfWork.objects.count(),
            'projectsUnderExecution': Project.objects.exclude(current_stage='Closure').count(),
            'projectsCompleted': Project.objects.filter(current_stage='Closure').count(),
            'totalAwardedValueCr': float(AwardOfWork.objects.aggregate(total=Sum('total_contract_value'))['total'] or 0) / 10000000.0,
        }
        return Response({'success': True, 'data': stats})

# NMDC Limited - Portal API Routing
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProblemStatementViewSet,
    VendorViewSet,
    VendorProposalViewSet,
    PocRecordViewSet,
    AwardOfWorkViewSet,
    ProjectViewSet,
    AuditLogViewSet,
    StatsViewSet
)

router = DefaultRouter()
router.register(r'problems', ProblemStatementViewSet)
router.register(r'vendors', VendorViewSet)
router.register(r'proposals', VendorProposalViewSet)
router.register(r'pocs', PocRecordViewSet)
router.register(r'awards', AwardOfWorkViewSet)
router.register(r'projects', ProjectViewSet)
router.register(r'audit', AuditLogViewSet)
router.register(r'stats', StatsViewSet, basename='stats')

urlpatterns = [
    path('api/', include(router.urls)),
]

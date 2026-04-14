from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from logs.views import LogViewSet, LogSourceViewSet
from analytics.views import DashboardStatsView

# ✅ Single clean import — removed duplicates
from alerts.views import (
    AlertViewSet, AlertRuleViewSet,
    simulate_attack, block_ip, unblock_ip,
    get_blocked_ips, get_mitigation_status,unlock_account,
)

router = DefaultRouter()
router.register(r'logs/sources', LogSourceViewSet, basename='logsource')
router.register(r'logs', LogViewSet, basename='log')
router.register(r'alert-rules', AlertRuleViewSet, basename='alertrule')
router.register(r'alerts', AlertViewSet, basename='alert')

urlpatterns = [
    path('admin/', admin.site.urls),

    # API endpoints
    path('api/', include(router.urls)),

    # Authentication
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Analytics
    path('api/analytics/dashboard/', DashboardStatsView.as_view(), name='dashboard_stats'),

    # Attack simulation
    path('api/simulate/', simulate_attack, name='simulate_attack'),

    # IP Management
    path('api/block-ip/', block_ip, name='block_ip'),
    path('api/unblock-ip/', unblock_ip, name='unblock_ip'),
    path('api/blocked-ips/', get_blocked_ips, name='blocked_ips'),

    # ✅ NEW — Mitigation status for dashboard panel
    path('api/mitigation-status/', get_mitigation_status, name='mitigation_status'),
    path('api/unlock-account/', unlock_account, name='unlock_account'),
]
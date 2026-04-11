from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from logs.views import LogViewSet, LogSourceViewSet
from alerts.views import AlertViewSet, AlertRuleViewSet
from analytics.views import DashboardStatsView

from alerts.views import AlertViewSet, AlertRuleViewSet, simulate_attack 

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

    path('api/simulate/', simulate_attack, name='simulate_attack'),
]

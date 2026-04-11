from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from logs.models import Log
from alerts.models import Alert


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Time range for statistics
        last_24h = timezone.now() - timedelta(hours=24)
        last_7d = timezone.now() - timedelta(days=7)
        
        # Basic counts
        total_logs = Log.objects.count()
        logs_last_24h = Log.objects.filter(created_at__gte=last_24h).count()
        
        total_alerts = Alert.objects.count()
        active_alerts = Alert.objects.filter(status='NEW').count()
        critical_alerts = Alert.objects.filter(
            severity='CRITICAL',
            status__in=['NEW', 'ACKNOWLEDGED']
        ).count()
        
        # Log level distribution
        log_level_distribution = list(
            Log.objects.values('log_level')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        
        # Alert severity distribution
        alert_severity_distribution = list(
            Alert.objects.values('severity')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        
        # Top source IPs
        top_source_ips = list(
            Log.objects.values('source_ip')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )
        
        # Logs over time (last 7 days)
        logs_over_time = []
        for i in range(7):
            day = timezone.now() - timedelta(days=i)
            day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            count = Log.objects.filter(
                timestamp__gte=day_start,
                timestamp__lt=day_end
            ).count()
            logs_over_time.append({
                'time': day_start.strftime('%Y-%m-%d'),
                'count': count
            })
        logs_over_time.reverse()
        
        # Recent alerts
        recent_alerts = Alert.objects.select_related('rule')[:10]
        recent_alerts_data = [{
            'id': alert.pk,
            'title': alert.title,
            'severity': alert.severity,
            'status': alert.status,
            'triggered_at': alert.triggered_at,
            'time_ago': self._time_ago(alert.triggered_at)
        } for alert in recent_alerts]
        
        return Response({
            'total_logs': total_logs,
            'logs_last_24h': logs_last_24h,
            'total_alerts': total_alerts,
            'active_alerts': active_alerts,
            'critical_alerts': critical_alerts,
            'log_level_distribution': log_level_distribution,
            'alert_severity_distribution': alert_severity_distribution,
            'top_source_ips': top_source_ips,
            'logs_over_time': logs_over_time,
            'recent_alerts': recent_alerts_data,
        })
    
    def _time_ago(self, dt):
        """Calculate time ago string"""
        now = timezone.now()
        diff = now - dt
        seconds = diff.total_seconds()
        
        if seconds < 60:
            return f"{int(seconds)}s ago"
        elif seconds < 3600:
            return f"{int(seconds / 60)}m ago"
        elif seconds < 86400:
            return f"{int(seconds / 3600)}h ago"
        else:
            return f"{int(seconds / 86400)}d ago"

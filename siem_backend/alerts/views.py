from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Alert, AlertRule
from .serializers import AlertSerializer, AlertRuleSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
import random 
from typing import Any


class AlertRuleViewSet(viewsets.ModelViewSet):
    queryset = AlertRule.objects.all()
    serializer_class = AlertRuleSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class AlertViewSet(viewsets.ModelViewSet):
    queryset = Alert.objects.all()
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self) -> Any:
        queryset = Alert.objects.select_related('rule').all()
        
        # Apply filters
        status_filter = self.request.GET.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        severity = self.request.GET.get('severity')
        if severity:
            queryset = queryset.filter(severity=severity)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        """Acknowledge an alert"""
        alert = self.get_object()
        if alert.status in ['RESOLVED', 'FALSE_POSITIVE']:
            return Response({'error': 'Cannot acknowledge a closed alert'}, status=status.HTTP_400_BAD_REQUEST)
            
        if alert.status == 'NEW':
            alert.status = 'ACKNOWLEDGED'
            alert.acknowledged_at = timezone.now()
            alert.acknowledged_by = request.user
            alert.save()
            
        return Response({'status': 'Alert acknowledged'})
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Resolve an alert"""
        alert = self.get_object()
        if alert.status in ['RESOLVED', 'FALSE_POSITIVE']:
            return Response({'error': 'Alert is already resolved or closed'}, status=status.HTTP_400_BAD_REQUEST)
            
        alert.status = 'RESOLVED'
        alert.resolved_at = timezone.now()
        alert.resolved_by = request.user
        alert.notes = request.data.get('notes', '')
        alert.save()
        return Response({'status': 'Alert resolved'})
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def simulate_attack(request):
    """Endpoint to simulate different attack types for demo"""
    attack_type = request.data.get('attack_type')
    
    SUSPICIOUS_IPS = [
        '45.142.212.61',
        '185.220.101.44', 
        '91.109.190.48',
    ]
    attacker_ip = random.choice(SUSPICIOUS_IPS)
    
    try:
        from logs.models import Log, LogSource
        
        log_source, _ = LogSource.objects.get_or_create(
            name='Attack Simulator',
            defaults={
                'source_type': 'APPLICATION',
                'description': 'Demo attack simulator'
            }
        )
        
        if attack_type == 'bruteforce':
            # Create 10 failed login logs
            for i in range(10):
                Log.objects.create(
                    source=log_source,
                    timestamp=timezone.now(),
                    source_ip=attacker_ip,
                    destination_ip='192.168.1.10',
                    log_level='WARNING',
                    event_type='login_failed',
                    message=f'Failed password attempt {i+1} for admin from {attacker_ip}',
                    raw_data={'attempt': i+1, 'user': 'admin'},
                    parsed=True,
                    parsed_at=timezone.now()
                )
            # Create alert
            rule = AlertRule.objects.filter(
                name='Brute Force Detection'
            ).first()
            if rule:
                alert = Alert.objects.create(
                    rule=rule,
                    severity='HIGH',
                    status='NEW',
                    title=f'Brute Force Attack from {attacker_ip}',
                    description=f'10 failed login attempts detected from {attacker_ip}',
                    source_ip=attacker_ip,
                    threat_score=80,
                    details={'attempts': 10, 'target': 'admin'}
                )
                return Response({
                    'status': 'success',
                    'message': f'Brute force simulated from {attacker_ip}',
                    'alert_id': alert.id # type: ignore
                })

        elif attack_type == 'portscan':
            # Create port scan logs
            for port in range(20, 45):
                Log.objects.create(
                    source=log_source,
                    timestamp=timezone.now(),
                    source_ip=attacker_ip,
                    destination_ip='192.168.1.10',
                    source_port=random.randint(50000, 60000),
                    destination_port=port,
                    log_level='WARNING',
                    event_type='port_scan',
                    message=f'Port scan detected on port {port} from {attacker_ip}',
                    raw_data={'port': port, 'scan_pattern': True},
                    parsed=True,
                    parsed_at=timezone.now()
                )
            # Create alert
            rule = AlertRule.objects.filter(
                name='Port Scanning Detection'
            ).first()
            if rule:
                alert = Alert.objects.create(
                    rule=rule,
                    severity='CRITICAL',
                    status='NEW',
                    title=f'Port Scan from {attacker_ip}',
                    description=f'Sequential port scanning detected from {attacker_ip}',
                    source_ip=attacker_ip,
                    threat_score=85,
                    details={'ports_scanned': 25, 'range': '20-44'}
                )
                return Response({
                    'status': 'success',
                    'message': f'Port scan simulated from {attacker_ip}',
                    'alert_id': alert.id # type: ignore
                })

        return Response(
            {'error': 'Invalid attack type'}, 
            status=400
        )
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)

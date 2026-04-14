from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Alert, AlertRule, BlockedIP
from .serializers import AlertSerializer, AlertRuleSerializer
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

        status_filter = self.request.GET.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        severity = self.request.GET.get('severity')
        if severity:
            queryset = queryset.filter(severity=severity)

        return queryset

    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        alert = self.get_object()
        if alert.status in ['RESOLVED', 'FALSE_POSITIVE']:
            return Response(
                {'error': 'Cannot acknowledge a closed alert'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if alert.status == 'NEW':
            alert.status = 'ACKNOWLEDGED'
            alert.acknowledged_at = timezone.now()
            alert.acknowledged_by = request.user
            alert.save()
        return Response({'status': 'Alert acknowledged'})

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        alert = self.get_object()
        if alert.status in ['RESOLVED', 'FALSE_POSITIVE']:
            return Response(
                {'error': 'Alert is already resolved or closed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        alert.status = 'RESOLVED'
        alert.resolved_at = timezone.now()
        alert.resolved_by = request.user
        alert.notes = request.data.get('notes', '')
        alert.save()
        return Response({'status': 'Alert resolved'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def simulate_attack(request):
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

            rule = AlertRule.objects.filter(name='Brute Force Detection').first()
            if rule:
                alert = Alert.objects.create(
                    rule=rule,
                    severity='HIGH',
                    status='NEW',
                    title=f'Brute Force Attack from {attacker_ip}',
                    description=f'10 failed login attempts detected from {attacker_ip}',
                    source_ip=attacker_ip,
                    threat_score=80,
                    details={
                        'attempts': 10,
                        'target': 'admin',
                        'mitigation_applied': True,
                        'mitigation_type': 'ACCOUNT_LOCKOUT'
                    }
                )

                # Block IP in DB
                BlockedIP.objects.get_or_create(
                    ip_address=attacker_ip,
                    defaults={
                        'reason': 'Auto-blocked: Brute force attack detected',
                        'blocked_by': 'AUTO'
                    }
                )

                # ✅ NEW — Lock admin account for 15 minutes
                from siem_backend.middleware import lock_account
                lock_account('admin', duration_seconds=900)
                print(f"🔒 Account 'admin' locked for 15 minutes")

                return Response({
                    'status': 'success',
                    'message': f'Brute force simulated from {attacker_ip}. Admin account locked for 15 minutes.',
                    'alert_id': alert.pk,
                    'mitigation': 'account_locked'
                })

        elif attack_type == 'portscan':
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

            rule = AlertRule.objects.filter(name='Port Scanning Detection').first()
            if rule:
                alert = Alert.objects.create(
                    rule=rule,
                    severity='CRITICAL',
                    status='NEW',
                    title=f'Port Scan from {attacker_ip}',
                    description=f'Sequential port scanning detected from {attacker_ip}',
                    source_ip=attacker_ip,
                    threat_score=85,
                    details={
                        'ports_scanned': 25,
                        'range': '20-44',
                        'mitigation_applied': True,
                        'mitigation_type': 'IP_BLACKLIST'
                    }
                )

                # ✅ NEW — Blacklist IP in memory for 10 minutes
                from siem_backend.middleware import block_ip_memory
                block_ip_memory(attacker_ip, duration_seconds=600, reason='blacklist')
                print(f"🚫 IP {attacker_ip} blacklisted for 10 minutes")

                # Block IP in DB
                BlockedIP.objects.get_or_create(
                    ip_address=attacker_ip,
                    defaults={
                        'reason': 'Auto-blacklisted: Port scan detected',
                        'blocked_by': 'AUTO'
                    }
                )

                return Response({
                    'status': 'success',
                    'message': f'Port scan simulated from {attacker_ip}. IP blacklisted for 10 minutes.',
                    'alert_id': alert.pk,
                    'mitigation': 'ip_blacklisted'
                })

        return Response({'error': 'Invalid attack type'}, status=400)

    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def block_ip(request):
    ip = request.data.get('ip_address')
    reason = request.data.get('reason', 'Manually blocked by analyst')

    if not ip:
        return Response({'error': 'IP address required'}, status=400)

    blocked, created = BlockedIP.objects.get_or_create(
        ip_address=ip,
        defaults={'reason': reason, 'blocked_by': 'ANALYST'}
    )

    if not created:
        blocked.is_active = True
        blocked.reason = reason
        blocked.save()

    # ✅ Also block in memory immediately
    from siem_backend.middleware import block_ip_memory
    block_ip_memory(ip, duration_seconds=86400, reason='manual')

    return Response({
        'status': 'success',
        'message': f'IP {ip} has been blocked',
        'ip': ip
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unblock_ip(request):
    ip = request.data.get('ip_address')

    if not ip:
        return Response({'error': 'IP address required'}, status=400)

    # ✅ Unblock from memory too
    from siem_backend.middleware import unblock_ip_memory
    unblock_ip_memory(ip)

    try:
        blocked = BlockedIP.objects.get(ip_address=ip)
        blocked.is_active = False
        blocked.save()
        return Response({
            'status': 'success',
            'message': f'IP {ip} has been unblocked'
        })
    except BlockedIP.DoesNotExist:
        return Response({
            'status': 'success',
            'message': f'IP {ip} unblocked from memory'
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_blocked_ips(request):
    blocked = BlockedIP.objects.filter(is_active=True)
    data = [{
        'ip_address': b.ip_address,
        'reason': b.reason,
        'blocked_at': b.blocked_at,
        'blocked_by': b.blocked_by
    } for b in blocked]
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_mitigation_status(request):
    """Get current in-memory mitigation status for dashboard"""
    from siem_backend.middleware import get_mitigation_status as get_status
    data = get_status()
    return Response(data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unlock_account(request):
    username = request.data.get('username')
    if not username:
        return Response({'error': 'Username required'}, status=400)
    from siem_backend.middleware import locked_accounts
    if username in locked_accounts:
        del locked_accounts[username]
    return Response({
        'status': 'success',
        'message': f'{username} has been unlocked'
    })
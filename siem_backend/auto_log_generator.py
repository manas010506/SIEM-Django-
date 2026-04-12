# auto_log_generator.py
import os, django, random, time, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'siem_backend.settings')
django.setup()

from alerts.models import Alert, AlertRule
from logs.models import Log, LogSource
from django.utils import timezone

REALISTIC_EVENTS = [
    ('INFO',     'login_success',      '192.168.1.{}',  'User logged in successfully'),
    ('INFO',     'api_request',        '10.0.0.{}',     'GET /api/dashboard/ 200 OK - 45ms'),
    ('WARNING',  'login_failed',       '45.142.212.61', 'Failed login attempt for admin'),
    ('INFO',     'file_access',        '192.168.1.{}',  'File accessed: /var/www/html/index.php'),
    ('ERROR',    'database_query',     '192.168.1.20',  'Query timeout after 30s on table users'),
    ('INFO',     'network_connection', '172.16.0.{}',   'New connection established on port 443'),
    ('WARNING',  'port_scan',          '185.220.101.44','Multiple port connection attempts detected'),
    ('INFO',     'logout',             '192.168.1.{}',  'User session ended after 30 minutes'),
    ('WARNING',  'data_transfer',      '10.0.0.{}',     'Large data transfer: 500MB to external IP'),
    ('CRITICAL', 'login_failed',       '91.109.190.48', 'Brute force attempt detected'),
]

source = LogSource.objects.first()
print("Auto log generator running... Press Ctrl+C to stop")

from collections import defaultdict
ip_counts = defaultdict(int)

def check_and_create_alert(level, event, ip):
    """Create alert if suspicious pattern detected"""
    if event == 'login_failed':
        ip_counts[ip] += 1
        # After 5 failed logins from same IP create alert
        if ip_counts[ip] == 5:
            rule = AlertRule.objects.filter(
                name='Brute Force Detection'
            ).first()
            if rule:
                Alert.objects.create(
                    rule=rule,
                    severity='HIGH',
                    status='NEW',
                    title=f'Brute Force Attack from {ip}',
                    description=f'5 failed login attempts from {ip}',
                    source_ip=ip,
                    threat_score=80,
                    details={'attempts': 5}
                )
                print(f"🚨 ALERT CREATED: Brute Force from {ip}")
                ip_counts[ip] = 0  # Reset counter

    if event == 'port_scan':
        rule = AlertRule.objects.filter(
            name='Port Scanning Detection'
        ).first()
        if rule and random.random() < 0.3:  # 30% chance per scan log
            Alert.objects.create(
                rule=rule,
                severity='CRITICAL',
                status='NEW',
                title=f'Port Scan from {ip}',
                description=f'Port scanning detected from {ip}',
                source_ip=ip,
                threat_score=85,
                details={'scan_detected': True}
            )
            print(f"🚨 ALERT CREATED: Port Scan from {ip}")

while True:
    level, event, ip_template, message = random.choice(REALISTIC_EVENTS)
    ip = ip_template.format(random.randint(1, 254)) if '{}' in ip_template else ip_template

    Log.objects.create(
        source=source,
        timestamp=timezone.now(),
        source_ip=ip,
        log_level=level,
        event_type=event,
        message=message,
        raw_data={'auto_generated': True},
        parsed=True,
        parsed_at=timezone.now()
    )
    print(f"[{level}] {event} from {ip}")
    check_and_create_alert(level, event, ip)
    time.sleep(random.uniform(2, 5))  # New log every 2-5 seconds
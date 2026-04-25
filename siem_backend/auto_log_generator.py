import os, django, random, time, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'siem_backend.settings')
django.setup()

from logs.models import Log, LogSource
from django.utils import timezone

# ✅ Only normal realistic logs — no attacks
# Attacks are handled by Attack Simulator buttons
REALISTIC_EVENTS = [
    ('INFO',    'login_success',      '192.168.1.{}', 'User logged in successfully'),
    ('INFO',    'api_request',        '10.0.0.{}',    'GET /api/dashboard/ 200 OK - 45ms'),
    ('INFO',    'api_request',        '192.168.1.{}', 'POST /api/logs/ 201 Created - 120ms'),
    ('INFO',    'file_access',        '192.168.1.{}', 'File accessed: /var/www/html/index.php'),
    ('INFO',    'network_connection', '172.16.0.{}',  'New connection established on port 443'),
    ('INFO',    'logout',             '192.168.1.{}', 'User session ended after 30 minutes'),
    ('INFO',    'file_access',        '10.0.0.{}',    'File accessed: /etc/nginx/nginx.conf'),
    ('INFO',    'api_request',        '172.16.0.{}',  'GET /api/alerts/ 200 OK - 89ms'),
    ('WARNING', 'login_failed',       '192.168.1.{}', 'Failed login attempt — invalid password'),
    ('WARNING', 'data_transfer',      '10.0.0.{}',    'Large data transfer: 500MB to external IP'),
    ('WARNING', 'config_change',      '192.168.1.{}', 'System configuration modified by user'),
    ('WARNING', 'disk_usage',         '192.168.1.20', 'Disk usage exceeded 85% on /var partition'),
    ('ERROR',   'database_query',     '192.168.1.20', 'Query timeout after 30s on table users'),
    ('ERROR',   'service_error',      '10.0.0.20',    'Service nginx failed to restart'),
    ('ERROR',   'connection_refused', '172.16.0.{}',  'Connection refused on port 5432 (PostgreSQL)'),
]

source = LogSource.objects.first()
if not source:
    print("ERROR: No log source found! Run generate_sample_data.py first")
    exit(1)

print(f"✅ Auto log generator running...")
print(f"✅ Using log source: {source.name}")
print(f"✅ Generating normal system logs every 2-5 seconds")
print(f"✅ Press Ctrl+C to stop")
print("-" * 50)

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
    time.sleep(random.uniform(2, 5))
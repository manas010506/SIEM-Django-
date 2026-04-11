"""
Sample Data Generation Script for SIEM Project
Works with both SQLite and MySQL

Usage:
    python generate_sample_data.py

This will create:
- 5 log sources
- 10,000+ sample logs
- 5 alert rules
- Realistic attack scenarios
"""

import os
import django
import random
from datetime import datetime, timedelta

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'siem_backend.settings')
django.setup()

from logs.models import Log, LogSource
from alerts.models import AlertRule
from django.contrib.auth.models import User

# Sample data configurations
SAMPLE_IPS = [
    '192.168.1.100', '192.168.1.101', '192.168.1.102',
    '10.0.0.45', '10.0.0.46', '10.0.0.47',
    '172.16.0.23', '172.16.0.24', '172.16.0.25',
    '203.0.113.5', '203.0.113.6', '203.0.113.7',
]

SUSPICIOUS_IPS = [
    '45.142.212.61',   # Known malicious
    '185.220.101.44',  # Tor exit node
    '91.109.190.48',   # Suspicious activity
]

EVENT_TYPES = [
    'login_success', 'login_failed', 'logout',
    'file_access', 'file_modify', 'file_delete',
    'network_connection', 'port_scan', 'data_transfer',
    'database_query', 'api_request', 'system_error'
]

LOG_MESSAGES = {
    'login_success': [
        'User logged in successfully',
        'Authentication successful',
        'Session opened for user'
    ],
    'login_failed': [
        'Failed password for user',
        'Authentication failure',
        'Invalid credentials provided',
        'Maximum authentication attempts exceeded'
    ],
    'logout': [
        'User logged out',
        'Session closed',
        'Connection terminated'
    ],
    'file_access': [
        'File accessed: /var/www/data/users.db',
        'Read operation on sensitive file',
        'Access to configuration file'
    ],
    'network_connection': [
        'Established connection to remote host',
        'Incoming connection from external IP',
        'Connection attempt blocked by firewall'
    ],
    'port_scan': [
        'Multiple port connection attempts detected',
        'Sequential port access pattern observed',
        'Scanning activity detected'
    ],
    'system_error': [
        'System service failure',
        'Memory allocation error',
        'Disk I/O error'
    ]
}


def create_log_sources():
    """Create sample log sources"""
    print("Creating log sources...")
    
    sources_data = [
        {
            'name': 'Main Web Server',
            'source_type': 'WEB_SERVER',
            'ip_address': '192.168.1.10',
            'description': 'Primary Apache web server'
        },
        {
            'name': 'Database Server',
            'source_type': 'DATABASE',
            'ip_address': '192.168.1.20',
            'description': 'MySQL database server'
        },
        {
            'name': 'Corporate Firewall',
            'source_type': 'FIREWALL',
            'ip_address': '192.168.1.1',
            'description': 'Main network firewall'
        },
        {
            'name': 'Email Server',
            'source_type': 'APPLICATION',
            'ip_address': '192.168.1.30',
            'description': 'Corporate email server'
        },
        {
            'name': 'VPN Gateway',
            'source_type': 'NETWORK',
            'ip_address': '192.168.1.5',
            'description': 'VPN gateway for remote access'
        }
    ]
    
    created_sources = []
    for source_data in sources_data:
        source, created = LogSource.objects.get_or_create(
            name=source_data['name'],
            defaults=source_data
        )
        created_sources.append(source)
        print(f"  {'Created' if created else 'Found'}: {source.name}")
    
    return created_sources


def generate_normal_logs(sources, count=10000):
    """Generate normal log traffic"""
    print(f"\nGenerating {count} normal log entries...")
    
    end_time = datetime.now()
    start_time = end_time - timedelta(days=30)
    
    # Use bulk_create for better performance (works with both DBs)
    batch_size = 500
    logs_to_create = []
    
    for i in range(count):
        # Random timestamp in the last 30 days
        random_seconds = random.randint(0, int((end_time - start_time).total_seconds()))
        timestamp = start_time + timedelta(seconds=random_seconds)
        
        # Pick random source and event type
        source = random.choice(sources)
        event_type = random.choice(EVENT_TYPES)
        
        # Determine log level based on event type
        if event_type == 'login_failed':
            log_level = random.choice(['WARNING', 'ERROR'])
        elif event_type == 'port_scan':
            log_level = 'CRITICAL'
        elif event_type == 'system_error':
            log_level = random.choice(['ERROR', 'CRITICAL'])
        else:
            log_level = random.choice(['DEBUG', 'INFO'])
        
        # Get appropriate message
        messages = LOG_MESSAGES.get(event_type, ['System log entry'])
        message = random.choice(messages)
        
        # Generate raw data
        raw_data = {
            'timestamp': timestamp.isoformat(),
            'source_ip': random.choice(SAMPLE_IPS),
            'event_type': event_type,
            'message': message,
            'user_agent': 'Mozilla/5.0',
            'protocol': random.choice(['HTTP/1.1', 'HTTPS', 'SSH', 'FTP']),
        }
        
        log = Log(
            source=source,
            timestamp=timestamp,
            source_ip=random.choice(SAMPLE_IPS),
            destination_ip=random.choice(SAMPLE_IPS[:3]),
            source_port=random.randint(1024, 65535),
            destination_port=random.choice([80, 443, 22, 3306, 5432]),
            log_level=log_level,
            event_type=event_type,
            message=message,
            raw_data=raw_data,
            parsed=True,
            parsed_at=timestamp
        )
        
        logs_to_create.append(log)
        
        # Bulk insert every batch_size records
        if len(logs_to_create) >= batch_size:
            Log.objects.bulk_create(logs_to_create)
            print(f"  Generated {i + 1} logs...")
            logs_to_create = []
    
    # Insert remaining logs
    if logs_to_create:
        Log.objects.bulk_create(logs_to_create)
    
    print(f"✓ Generated {count} normal logs")


def generate_attack_scenarios(sources):
    """Generate realistic attack scenarios"""
    print("\nGenerating attack scenarios...")
    
    # Scenario 1: Brute Force Attack (last 2 hours)
    print("1. Generating brute force attack scenario...")
    attack_time = datetime.now() - timedelta(hours=2)
    attacker_ip = random.choice(SUSPICIOUS_IPS)
    
    # 10 failed login attempts in 5 minutes
    for i in range(10):
        timestamp = attack_time + timedelta(seconds=i*30)
        Log.objects.create(
            source=sources[0],  # Web server
            timestamp=timestamp,
            source_ip=attacker_ip,
            destination_ip='192.168.1.10',
            log_level='WARNING',
            event_type='login_failed',
            message=f'Failed password for admin from {attacker_ip}',
            raw_data={'attempt': i+1, 'user': 'admin'},
            parsed=True,
            parsed_at=timestamp
        )
    print("   ✓ Brute force attack (10 failed logins)")
    
    # Scenario 2: Port Scanning (last 6 hours)
    print("2. Generating port scanning scenario...")
    scan_time = datetime.now() - timedelta(hours=6)
    scanner_ip = random.choice(SUSPICIOUS_IPS)
    
    # Scan 25 different ports in 2 minutes
    for port in range(20, 45):
        timestamp = scan_time + timedelta(seconds=port*5)
        Log.objects.create(
            source=sources[2],  # Firewall
            timestamp=timestamp,
            source_ip=scanner_ip,
            destination_ip='192.168.1.10',
            source_port=random.randint(50000, 60000),
            destination_port=port,
            log_level='WARNING',
            event_type='port_scan',
            message=f'Connection attempt to port {port}',
            raw_data={'scan_pattern': True, 'port': port},
            parsed=True,
            parsed_at=timestamp
        )
    print("   ✓ Port scanning (25 ports)")
    
    # Scenario 3: High Error Rate (last hour)
    print("3. Generating high error rate scenario...")
    error_time = datetime.now() - timedelta(hours=1)
    
    # 50 errors in 10 minutes
    for i in range(50):
        timestamp = error_time + timedelta(seconds=i*12)
        Log.objects.create(
            source=sources[1],  # Database
            timestamp=timestamp,
            source_ip='192.168.1.20',
            destination_ip='192.168.1.10',
            log_level='ERROR',
            event_type='database_query',
            message='Query execution failed: Connection timeout',
            raw_data={'error_code': 'DB_TIMEOUT'},
            parsed=True,
            parsed_at=timestamp
        )
    print("   ✓ High error rate (50 errors)")
    
    # Scenario 4: Suspicious File Access (last 30 minutes)
    print("4. Generating suspicious file access scenario...")
    access_time = datetime.now() - timedelta(minutes=30)
    suspicious_user_ip = random.choice(SUSPICIOUS_IPS)
    
    sensitive_files = [
        '/etc/passwd', '/etc/shadow', '/var/www/config/database.yml',
        '/root/.ssh/authorized_keys', '/var/log/auth.log'
    ]
    
    for i, file in enumerate(sensitive_files):
        timestamp = access_time + timedelta(minutes=i*2)
        Log.objects.create(
            source=sources[0],
            timestamp=timestamp,
            source_ip=suspicious_user_ip,
            destination_ip='192.168.1.10',
            log_level='CRITICAL',
            event_type='file_access',
            message=f'Unauthorized access attempt to {file}',
            raw_data={'file_path': file, 'access_denied': False},
            parsed=True,
            parsed_at=timestamp
        )
    print("   ✓ Suspicious file access (5 sensitive files)")
    
    print("\n✓ All attack scenarios generated")


def create_detection_rules():
    """Create sample alert rules"""
    print("\nCreating detection rules...")
    
    # Get or create admin user
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={'is_staff': True, 'is_superuser': True}
    )
    
    if created or not admin_user.password:
        admin_user.set_password('admin123')
        admin_user.save()
        print("  Created admin user (username: admin, password: admin123)")
    
    rules = [
        {
            'name': 'Brute Force Detection',
            'description': 'Detects multiple failed login attempts from the same IP',
            'rule_type': 'THRESHOLD',
            'severity': 'HIGH',
            'condition': {
                'event_type': 'login_failed',
                'threshold': 5,
                'time_window_seconds': 300,
                'group_by': 'source_ip'
            },
        },
        {
            'name': 'Port Scanning Detection',
            'description': 'Detects port scanning activity',
            'rule_type': 'THRESHOLD',
            'severity': 'CRITICAL',
            'condition': {
                'event_type': 'port_scan',
                'threshold': 20,
                'time_window_seconds': 120,
                'group_by': 'source_ip'
            },
        },
        {
            'name': 'High Error Rate',
            'description': 'Detects unusually high error rates',
            'rule_type': 'THRESHOLD',
            'severity': 'MEDIUM',
            'condition': {
                'log_level': 'ERROR',
                'threshold': 30,
                'time_window_seconds': 600
            },
        },
        {
            'name': 'Suspicious IP Activity',
            'description': 'Activity from known malicious IPs',
            'rule_type': 'PATTERN',
            'severity': 'CRITICAL',
            'condition': {
                'source_ip_list': SUSPICIOUS_IPS,
                'any_activity': True
            },
        },
        {
            'name': 'After Hours Access',
            'description': 'Access during non-business hours',
            'rule_type': 'PATTERN',
            'severity': 'MEDIUM',
            'condition': {
                'time_range_start': '22:00',
                'time_range_end': '06:00',
                'event_type': 'file_access'
            },
        }
    ]
    
    for rule_data in rules:
        rule, created = AlertRule.objects.get_or_create(
            name=rule_data['name'],
            defaults={**rule_data, 'created_by': admin_user}
        )
        print(f"  {'Created' if created else 'Found'}: {rule.name}")
    
    print("✓ Detection rules created")


def main():
    """Main function to generate all sample data"""
    print("=" * 70)
    print("SIEM SAMPLE DATA GENERATION SCRIPT")
    print("Works with both SQLite and MySQL")
    print("=" * 70)
    
    # Step 1: Create log sources
    sources = create_log_sources()
    
    # Step 2: Generate normal traffic
    generate_normal_logs(sources, count=10000)
    
    # Step 3: Generate attack scenarios
    generate_attack_scenarios(sources)
    
    # Step 4: Create detection rules
    create_detection_rules()
    
    # Print statistics
    print("\n" + "=" * 70)
    print("GENERATION COMPLETE - Statistics:")
    print("=" * 70)
    print(f"Total Logs: {Log.objects.count()}")
    print(f"Log Sources: {LogSource.objects.count()}")
    print(f"Alert Rules: {AlertRule.objects.count()}")
    
    print(f"\nLog Levels:")
    from django.db.models import Count
    for level in Log.objects.values('log_level').annotate(count=Count('id')):
        print(f"  {level['log_level']}: {level['count']}")
    
    print(f"\nEvent Types (top 10):")
    for event in Log.objects.values('event_type').annotate(count=Count('id')).order_by('-count')[:10]:
        print(f"  {event['event_type']}: {event['count']}")
    
    print("\n" + "=" * 70)
    print("You can now:")
    print("1. Run: python manage.py runserver")
    print("2. Open frontend and login with:")
    print("   Username: admin")
    print("   Password: admin123")
    print("=" * 70)


if __name__ == '__main__':
    main()

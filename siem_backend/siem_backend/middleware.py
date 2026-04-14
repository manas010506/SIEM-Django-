import time
import json
from collections import defaultdict
from django.http import JsonResponse
from django.utils import timezone

# ── Request tracking ──────────────────────────────────────────────────────────
request_counts = defaultdict(list)
alerted_ips = {}

# ── In-memory mitigation stores ───────────────────────────────────────────────
blocked_ips = {}        # { ip: expiry_timestamp } — DoS blocks (5 min)
blacklisted_ips = {}    # { ip: expiry_timestamp } — Port scan (10 min)
locked_accounts = {}    # { username: expiry_timestamp } — Brute force (15 min)

# ── Localhost IPs — never block these ─────────────────────────────────────────
TRUSTED_IPS = {'127.0.0.1', '::1', 'localhost'}


# ── Module-level mitigation functions ─────────────────────────────────────────

def is_ip_blocked(ip):
    now = time.time()
    if ip in blocked_ips:
        if now < blocked_ips[ip]:
            return True, 'IP temporarily blocked due to DoS attack detection'
        else:
            del blocked_ips[ip]
    if ip in blacklisted_ips:
        if now < blacklisted_ips[ip]:
            return True, 'IP blacklisted due to port scanning activity'
        else:
            del blacklisted_ips[ip]
    return False, ''


def is_account_locked(username):
    now = time.time()
    if username in locked_accounts:
        if now < locked_accounts[username]:
            return True
        else:
            del locked_accounts[username]
    return False


def block_ip_memory(ip, duration_seconds=300, reason='dos'):
    if ip in TRUSTED_IPS:
        print(f"⚠️ Skipping block for trusted IP: {ip}")
        return
    expiry = time.time() + duration_seconds
    if reason == 'blacklist':
        blacklisted_ips[ip] = expiry
    else:
        blocked_ips[ip] = expiry
    print(f"🛡️ MITIGATION: IP {ip} blocked for {duration_seconds}s ({reason})")


def lock_account(username, duration_seconds=900):
    locked_accounts[username] = time.time() + duration_seconds
    print(f"🔒 MITIGATION: Account '{username}' locked for {duration_seconds}s")


def unblock_ip_memory(ip):
    removed = False
    if ip in blocked_ips:
        del blocked_ips[ip]
        removed = True
    if ip in blacklisted_ips:
        del blacklisted_ips[ip]
        removed = True
    if removed:
        print(f"✅ MITIGATION RELEASED: IP {ip} unblocked")
    return removed


def get_mitigation_status():
    now = time.time()
    return {
        'blocked_ips': [
            {'ip': ip, 'type': 'DoS Block', 'expires_in': max(0, int(expiry - now))}
            for ip, expiry in blocked_ips.items() if now < expiry
        ],
        'blacklisted_ips': [
            {'ip': ip, 'type': 'Port Scan Blacklist', 'expires_in': max(0, int(expiry - now))}
            for ip, expiry in blacklisted_ips.items() if now < expiry
        ],
        'locked_accounts': [
            {'username': username, 'expires_in': max(0, int(expiry - now))}
            for username, expiry in locked_accounts.items() if now < expiry
        ],
    }


# ── Middleware Class ───────────────────────────────────────────────────────────

class RequestMonitoringMiddleware:

    def __init__(self, get_response):
        self.get_response = get_response
        self.DOS_THRESHOLD = 50
        self.TIME_WINDOW = 30
        self.ALERT_COOLDOWN = 60
        self.BLOCK_DURATION = 300
        self.BLACKLIST_DURATION = 600
        self.LOCKOUT_DURATION = 900
        self.log_source = None
        self._initialized = False

    def _lazy_init(self):
        if self._initialized:
            return
        self._initialized = True
        try:
            from logs.models import LogSource
            from alerts.models import AlertRule
            self.log_source, _ = LogSource.objects.get_or_create(
                name='Request Monitor',
                defaults={
                    'source_type': 'APPLICATION',
                    'description': 'Real-time request monitoring system'
                }
            )
            AlertRule.objects.get_or_create(
                name='DoS Attack Detection',
                defaults={
                    'description': 'Detects Denial of Service attacks based on request rate',
                    'rule_type': 'THRESHOLD',
                    'severity': 'CRITICAL',
                    'condition': {
                        'event_type': 'dos_attack',
                        'threshold': self.DOS_THRESHOLD,
                        'time_window_seconds': self.TIME_WINDOW
                    },
                    'is_active': True
                }
            )
        except Exception as e:
            print(f"Middleware lazy init error: {e}")

    def __call__(self, request):
        self._lazy_init()

        if self.should_skip_monitoring(request):
            return self.get_response(request)

        ip = self.get_client_ip(request)

        # ✅ FIX: Account lockout checked FIRST — applies to ALL IPs including localhost
        if request.path == '/api/auth/login/' and request.method == 'POST':
            try:
                body = json.loads(request.body)
                username = body.get('username', '')
                if username and is_account_locked(username):
                    print(f"🔒 LOCKED LOGIN ATTEMPT: {username} from {ip}")
                    return JsonResponse({
                        'error': 'Account temporarily locked',
                        'message': f'Account {username} is locked due to brute force detection.',
                        'mitigation': 'account_lockout',
                        'code': 'ACCOUNT_LOCKED'
                    }, status=423)
            except Exception:
                pass

        # ✅ Now skip trusted IPs for DoS monitoring only
        if ip in TRUSTED_IPS:
            return self.get_response(request)

        # ── Check if IP is blocked or blacklisted ──────────────────────────
        is_blocked, block_reason = is_ip_blocked(ip)
        if is_blocked:
            print(f"🚫 BLOCKED REQUEST from {ip}: {block_reason}")
            return JsonResponse({
                'error': 'Access denied',
                'reason': block_reason,
                'mitigation': 'active',
                'message': 'Your IP has been temporarily blocked by the SIEM system.'
            }, status=429 if 'DoS' in block_reason else 403)

        # ── DoS detection using sliding window ────────────────────────────
        current_time = time.time()
        request_counts[ip].append(current_time)
        request_counts[ip] = [
            t for t in request_counts[ip]
            if current_time - t < self.TIME_WINDOW
        ]

        request_count = len(request_counts[ip])
        print(f"DEBUG: IP={ip}, count={request_count}, threshold={self.DOS_THRESHOLD}")

        if request_count > self.DOS_THRESHOLD:
            self.handle_dos_attack(request, ip, request_count)
        elif request_count > 20 and request_count % 10 == 0:
            self.log_suspicious_activity(request, ip, request_count)

        return self.get_response(request)

    def handle_dos_attack(self, request, ip, request_count):
        current_time = time.time()
        if ip in alerted_ips:
            if current_time - alerted_ips[ip] < self.ALERT_COOLDOWN:
                return
        alerted_ips[ip] = current_time

        block_ip_memory(ip, self.BLOCK_DURATION, reason='dos')

        try:
            from alerts.models import BlockedIP
            BlockedIP.objects.get_or_create(
                ip_address=ip,
                defaults={
                    'reason': f'Auto-blocked: DoS attack ({request_count} requests in {self.TIME_WINDOW}s)',
                    'blocked_by': 'AUTO'
                }
            )
            print(f"🚫 AUTO-BLOCKED: {ip}")
        except Exception as e:
            print(f"Error persisting block to DB: {e}")

        try:
            from logs.models import Log
            Log.objects.create(
                source=self.log_source,
                timestamp=timezone.now(),
                source_ip=ip,
                log_level='CRITICAL',
                event_type='dos_attack',
                message=f'DoS attack detected: {request_count} requests in {self.TIME_WINDOW}s',
                raw_data={
                    'request_count': request_count,
                    'time_window': self.TIME_WINDOW,
                    'path': request.path,
                    'method': request.method,
                    'user_agent': request.META.get('HTTP_USER_AGENT', 'Unknown'),
                    'mitigation_applied': True,
                    'mitigation_type': 'IP_BLOCK',
                    'block_duration': self.BLOCK_DURATION
                },
                parsed=True,
                parsed_at=timezone.now()
            )
        except Exception as e:
            print(f"Error logging DoS attack: {e}")

        try:
            from alerts.models import Alert, AlertRule
            dos_rule = AlertRule.objects.filter(name='DoS Attack Detection').first()
            if dos_rule:
                Alert.objects.create(
                    rule=dos_rule,
                    severity='CRITICAL',
                    status='NEW',
                    title=f'DoS Attack from {ip}',
                    description=(
                        f'Detected {request_count} requests in {self.TIME_WINDOW}s '
                        f'from {ip}. IP blocked for {self.BLOCK_DURATION}s.'
                    ),
                    source_ip=ip,
                    threat_score=95,
                    details={
                        'request_count': request_count,
                        'threshold': self.DOS_THRESHOLD,
                        'time_window': self.TIME_WINDOW,
                        'path': request.path,
                        'method': request.method,
                        'detected_at': timezone.now().isoformat(),
                        'mitigation_applied': True,
                        'mitigation_type': 'IP_BLOCK',
                        'block_duration_seconds': self.BLOCK_DURATION
                    }
                )
                print(f"🚨 ALERT: DoS from {ip} — {request_count} requests")
        except Exception as e:
            print(f"Error creating DoS alert: {e}")

    def log_suspicious_activity(self, request, ip, request_count):
        try:
            from logs.models import Log
            Log.objects.create(
                source=self.log_source,
                timestamp=timezone.now(),
                source_ip=ip,
                log_level='WARNING',
                event_type='suspicious_activity',
                message=f'High request rate: {request_count} requests in {self.TIME_WINDOW}s',
                raw_data={
                    'request_count': request_count,
                    'time_window': self.TIME_WINDOW,
                    'path': request.path,
                    'method': request.method
                },
                parsed=True,
                parsed_at=timezone.now()
            )
        except Exception as e:
            print(f"Error logging suspicious activity: {e}")

    def should_skip_monitoring(self, request):
        skip_paths = ['/static/', '/media/', '/admin/jsi18n/']
        if any(request.path.startswith(path) for path in skip_paths):
            return True
        return False  # ✅ Removed trusted IP check from here

    def get_client_ip(self, request):
        x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded:
            return x_forwarded.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'Unknown')
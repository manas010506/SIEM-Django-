import time
from collections import defaultdict
from django.utils import timezone

request_counts = defaultdict(list)
alerted_ips = {}


class RequestMonitoringMiddleware:

    def __init__(self, get_response):
        self.get_response = get_response
        self.DOS_THRESHOLD = 50
        self.TIME_WINDOW = 30
        self.ALERT_COOLDOWN = 60
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
        current_time = time.time()

        request_counts[ip].append(current_time)
        request_counts[ip] = [
            t for t in request_counts[ip]
            if current_time - t < self.TIME_WINDOW
        ]

        request_count = len(request_counts[ip])

        # DEBUG: shows counting in server terminal
        print(f"DEBUG: IP={ip}, count={request_count}, threshold={self.DOS_THRESHOLD}")

        if request_count > self.DOS_THRESHOLD:
            self.handle_dos_attack(request, ip, request_count)
        elif request_count > 20 and request_count % 10 == 0:
            self.log_suspicious_activity(request, ip, request_count)

        return self.get_response(request)  # ← MUST be last, inside __call__

    def handle_dos_attack(self, request, ip, request_count):
        current_time = time.time()

        if ip in alerted_ips:
            if current_time - alerted_ips[ip] < self.ALERT_COOLDOWN:
                return

        alerted_ips[ip] = current_time

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
                    'user_agent': request.META.get('HTTP_USER_AGENT', 'Unknown')
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
                        f'Detected {request_count} requests in {self.TIME_WINDOW} seconds '
                        f'from IP {ip}. Threshold: {self.DOS_THRESHOLD} requests.'
                    ),
                    source_ip=ip,
                    threat_score=95,
                    details={
                        'request_count': request_count,
                        'threshold': self.DOS_THRESHOLD,
                        'time_window': self.TIME_WINDOW,
                        'path': request.path,
                        'method': request.method,
                        'detected_at': timezone.now().isoformat()
                    }
                )
                print(f"🚨 ALERT: DoS attack detected from {ip} - {request_count} requests")
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
        return any(request.path.startswith(path) for path in skip_paths)

    def get_client_ip(self, request):
        x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded:
            return x_forwarded.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'Unknown')
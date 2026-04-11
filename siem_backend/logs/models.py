from django.db import models
from django.contrib.auth.models import User

class LogSource(models.Model):
    """Represents a source that generates logs"""
    SOURCE_TYPES = [
        ('FIREWALL', 'Firewall'),
        ('WEB_SERVER', 'Web Server'),
        ('DATABASE', 'Database'),
        ('APPLICATION', 'Application'),
        ('NETWORK', 'Network Device'),
    ]
    
    name = models.CharField(max_length=200)
    source_type = models.CharField(max_length=50, choices=SOURCE_TYPES)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'log_sources'
        indexes = [
            models.Index(fields=['source_type']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.source_type})"


class Log(models.Model):
    """Main log entry model"""
    LOG_LEVELS = [
        ('DEBUG', 'Debug'),
        ('INFO', 'Info'),
        ('WARNING', 'Warning'),
        ('ERROR', 'Error'),
        ('CRITICAL', 'Critical'),
    ]
    
    source = models.ForeignKey(LogSource, on_delete=models.CASCADE, related_name='logs')
    timestamp = models.DateTimeField(db_index=True)
    source_ip = models.GenericIPAddressField(db_index=True)
    destination_ip = models.GenericIPAddressField(null=True, blank=True)
    source_port = models.IntegerField(null=True, blank=True)
    destination_port = models.IntegerField(null=True, blank=True)
    
    log_level = models.CharField(max_length=20, choices=LOG_LEVELS, db_index=True)
    event_type = models.CharField(max_length=50, db_index=True)
    
    message = models.TextField()
    raw_data = models.JSONField()  # Works in both SQLite 3.9+ and MySQL 5.7+
    
    parsed = models.BooleanField(default=False)
    parsed_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        ordering = ['-timestamp']
        db_table = 'logs'
        indexes = [
            models.Index(fields=['timestamp', 'log_level']),
            models.Index(fields=['source_ip', 'timestamp']),
            models.Index(fields=['event_type', 'timestamp']),
        ]
    
    def __str__(self):
        return f"[{self.log_level}] {self.event_type} - {self.timestamp}"
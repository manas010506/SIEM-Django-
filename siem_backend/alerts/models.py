from django.db import models
from django.contrib.auth.models import User
from logs.models import Log

class AlertRule(models.Model):
    """Security detection rules"""
    SEVERITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    ]
    
    RULE_TYPES = [
        ('THRESHOLD', 'Threshold Based'),
        ('PATTERN', 'Pattern Matching'),
        ('ANOMALY', 'Anomaly Detection'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField()
    rule_type = models.CharField(max_length=20, choices=RULE_TYPES)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    
    # Rule configuration stored as JSON
    condition = models.JSONField()
    
    is_active = models.BooleanField(default=True)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'alert_rules'
    
    def __str__(self):
        return f"{self.name} ({self.severity})"


class Alert(models.Model):
    """Security alerts triggered by rules"""
    STATUS_CHOICES = [
        ('NEW', 'New'),
        ('ACKNOWLEDGED', 'Acknowledged'),
        ('INVESTIGATING', 'Investigating'),
        ('RESOLVED', 'Resolved'),
        ('FALSE_POSITIVE', 'False Positive'),
    ]
    
    rule = models.ForeignKey(AlertRule, on_delete=models.CASCADE, related_name='alerts')
    severity = models.CharField(max_length=20)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NEW')
    
    related_logs = models.ManyToManyField(Log, related_name='alerts')
    
    title = models.CharField(max_length=300)
    description = models.TextField()
    
    source_ip = models.GenericIPAddressField(null=True, blank=True)
    threat_score = models.IntegerField(default=0)
    details = models.JSONField(default=dict)
    
    triggered_at = models.DateTimeField(auto_now_add=True, db_index=True)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    acknowledged_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='acknowledged_alerts'
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_alerts'
    )
    
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-triggered_at']
        db_table = 'alerts'
    
    def __str__(self):
        return f"[{self.severity}] {self.title}"
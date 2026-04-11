from django.contrib import admin
from .models import Alert, AlertRule

@admin.register(AlertRule)
class AlertRuleAdmin(admin.ModelAdmin):
    list_display = ['name', 'rule_type', 'severity', 'is_active', 'created_at']
    list_filter = ['rule_type', 'severity', 'is_active']
    search_fields = ['name', 'description']


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ['title', 'severity', 'status', 'source_ip', 'triggered_at']
    list_filter = ['severity', 'status']
    search_fields = ['title', 'source_ip']
    date_hierarchy = 'triggered_at'

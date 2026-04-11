from django.contrib import admin
from .models import Log, LogSource

@admin.register(LogSource)
class LogSourceAdmin(admin.ModelAdmin):
    list_display = ['name', 'source_type', 'ip_address', 'is_active', 'created_at']
    list_filter = ['source_type', 'is_active']
    search_fields = ['name', 'ip_address']


@admin.register(Log)
class LogAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'log_level', 'source', 'source_ip', 'event_type']
    list_filter = ['log_level', 'event_type', 'source']
    search_fields = ['source_ip', 'message']
    date_hierarchy = 'timestamp'
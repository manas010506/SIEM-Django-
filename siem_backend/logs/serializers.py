from rest_framework import serializers
from .models import Log, LogSource

class LogSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LogSource
        fields = '__all__'


class LogSerializer(serializers.ModelSerializer):
    source_name = serializers.CharField(source='source.name', read_only=True)
    
    class Meta:
        model = Log
        fields = '__all__'
        read_only_fields = ['created_at', 'parsed_at']


class LogIngestSerializer(serializers.Serializer):
    """Serializer for ingesting raw logs"""
    source_id = serializers.IntegerField()
    timestamp = serializers.DateTimeField()
    source_ip = serializers.IPAddressField()
    destination_ip = serializers.IPAddressField(required=False, allow_null=True)
    source_port = serializers.IntegerField(required=False, allow_null=True)
    destination_port = serializers.IntegerField(required=False, allow_null=True)
    log_level = serializers.ChoiceField(
        choices=['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
    )
    event_type = serializers.CharField(max_length=50)
    message = serializers.CharField()
    raw_data = serializers.JSONField(required=False)
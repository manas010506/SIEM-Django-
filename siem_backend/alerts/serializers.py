from rest_framework import serializers
from .models import Alert, AlertRule

class AlertRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlertRule
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class AlertSerializer(serializers.ModelSerializer):
    rule_name = serializers.CharField(source='rule.name', read_only=True)
    
    class Meta:
        model = Alert
        fields = '__all__'
        read_only_fields = ['triggered_at']
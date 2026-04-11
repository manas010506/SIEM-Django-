from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Log, LogSource
from .serializers import LogSerializer, LogSourceSerializer, LogIngestSerializer


class LogSourceViewSet(viewsets.ModelViewSet):
    queryset = LogSource.objects.all()
    serializer_class = LogSourceSerializer
    permission_classes = [IsAuthenticated]


class LogViewSet(viewsets.ModelViewSet):
    queryset = Log.objects.all()
    serializer_class = LogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Log.objects.select_related('source').all()
        
        # Apply filters
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date and end_date:
            queryset = queryset.filter(timestamp__range=[start_date, end_date])
        
        log_level = self.request.query_params.get('log_level')
        if log_level:
            queryset = queryset.filter(log_level=log_level)
        
        source_ip = self.request.query_params.get('source_ip')
        if source_ip:
            queryset = queryset.filter(source_ip=source_ip)
        
        event_type = self.request.query_params.get('event_type')
        if event_type:
            queryset = queryset.filter(event_type=event_type)
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def ingest(self, request):
        """Ingest a single log entry"""
        serializer = LogIngestSerializer(data=request.data)
        if serializer.is_valid():
            try:
                source = LogSource.objects.get(id=serializer.validated_data['source_id'])
                
                log = Log.objects.create(
                    source=source,
                    timestamp=serializer.validated_data['timestamp'],
                    source_ip=serializer.validated_data['source_ip'],
                    destination_ip=serializer.validated_data.get('destination_ip'),
                    source_port=serializer.validated_data.get('source_port'),
                    destination_port=serializer.validated_data.get('destination_port'),
                    log_level=serializer.validated_data['log_level'],
                    event_type=serializer.validated_data['event_type'],
                    message=serializer.validated_data['message'],
                    raw_data=serializer.validated_data.get('raw_data', {}),
                    parsed=True,
                    parsed_at=timezone.now()
                )
                
                return Response(LogSerializer(log).data, status=status.HTTP_201_CREATED)
            except LogSource.DoesNotExist:
                return Response(
                    {'error': 'Log source not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
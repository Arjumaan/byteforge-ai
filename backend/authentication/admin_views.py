from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Sum
from chat.models import Conversation, Message
from payments.models import Payment
from payments.serializers import PaymentSerializer

User = get_user_model()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard_view(request):
    """Get admin dashboard statistics"""
    
    # Check if user is admin
    if not request.user.is_admin:
        return Response({
            'error': 'Unauthorized. Admin access required.'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Get statistics
    total_users = User.objects.count()
    total_conversations = Conversation.objects.count()
    total_tokens = Conversation.objects.aggregate(Sum('total_tokens_used'))['total_tokens_used__sum'] or 0
    
    # Get latest payments
    latest_payments = Payment.objects.all()[:10]
    
    return Response({
        'total_users': total_users,
        'total_conversations': total_conversations,
        'total_tokens_used': total_tokens,
        'latest_payments': PaymentSerializer(latest_payments, many=True).data
    }, status=status.HTTP_200_OK)

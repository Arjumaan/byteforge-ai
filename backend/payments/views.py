"""
Views for payment functionality.
"""
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.conf import settings

from .models import Payment
from .serializers import (
    PaymentSerializer,
    CreatePaymentSerializer,
    PaymentHistorySerializer,
)
from chat.models import Conversation
from chat.serializers import ConversationSerializer


class CreatePaymentView(APIView):
    """Create a new payment for token top-up."""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = CreatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        conversation_id = serializer.validated_data['conversation_id']
        amount = serializer.validated_data['amount']
        
        # Get the conversation
        conversation = get_object_or_404(
            Conversation,
            id=conversation_id,
            user=request.user
        )
        
        # Calculate tokens (example: $1 = 1000 tokens)
        tokens_to_add = int(float(amount) * 1000)
        
        # Create payment record
        payment = Payment.objects.create(
            user=request.user,
            conversation=conversation,
            amount=amount,
            tokens_added=tokens_to_add,
            status='pending'
        )
        
        # Process payment (mock - always succeeds)
        success = payment.process_payment()
        
        if success: 
            return Response({
                'success': True,
                'message': 'Payment processed successfully',
                'payment':  PaymentSerializer(payment).data,
                'conversation':  ConversationSerializer(conversation).data,
                'token_usage': {
                    'total_tokens_used': conversation.total_tokens_used,
                    'token_limit': conversation.token_limit,
                    'remaining_tokens': conversation.remaining_tokens,
                    'usage_percentage': conversation.usage_percentage,
                }
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'success': False,
                'message': 'Payment processing failed',
                'payment': PaymentSerializer(payment).data
            }, status=status.HTTP_400_BAD_REQUEST)


class PaymentHistoryView(generics.ListAPIView):
    """Get payment history for the current user."""
    
    permission_classes = [IsAuthenticated]
    serializer_class = PaymentHistorySerializer
    
    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user).select_related('conversation')
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        # Calculate totals
        total_spent = sum(float(p.amount) for p in queryset if p.status == 'success')
        total_tokens_purchased = sum(p.tokens_added for p in queryset if p.status == 'success')
        
        return Response({
            'success':  True,
            'payments': serializer.data,
            'summary': {
                'total_payments': queryset.count(),
                'total_spent': total_spent,
                'total_tokens_purchased': total_tokens_purchased,
            }
        })


class PaymentDetailView(APIView):
    """Get details of a specific payment."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        payment = get_object_or_404(
            Payment,
            id=pk,
            user=request.user
        )
        
        return Response({
            'success': True,
            'payment': PaymentSerializer(payment).data
        })
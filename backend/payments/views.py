from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Payment
from .serializers import PaymentSerializer, CreatePaymentSerializer
from chat.models import Conversation


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_payment_view(request):
    """Create a payment for token top-up"""
    
    serializer = CreatePaymentSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    conversation_id = serializer.validated_data['conversation_id']
    amount = serializer.validated_data['amount']
    tokens_to_add = serializer.validated_data['tokens_to_add']
    
    # Get conversation
    conversation = get_object_or_404(Conversation, id=conversation_id, user=request.user)
    
    # Create payment (mock payment - auto success)
    # WARNING: This is a mock implementation for demonstration purposes only.
    # In production, integrate with a real payment gateway (Stripe, PayPal, etc.)
    # and validate payment status before adding tokens.
    payment = Payment.objects.create(
        user=request.user,
        conversation=conversation,
        amount=amount,
        tokens_added=tokens_to_add,
        status='success'  # Mock: automatically successful
    )
    
    # Add tokens to conversation limit
    conversation.token_limit += tokens_to_add
    conversation.save()
    
    return Response({
        'message': 'Payment successful',
        'payment': PaymentSerializer(payment).data,
        'new_token_limit': conversation.token_limit
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_history_view(request):
    """Get payment history for user"""
    
    payments = Payment.objects.filter(user=request.user)
    serializer = PaymentSerializer(payments, many=True)
    
    return Response(serializer.data, status=status.HTTP_200_OK)

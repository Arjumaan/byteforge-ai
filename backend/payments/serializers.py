"""
Serializers for payment functionality.
"""
from rest_framework import serializers
from .models import Payment
from chat.serializers import ConversationSerializer


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for payment data."""
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    conversation_title = serializers.CharField(source='conversation.title', read_only=True)
    
    class Meta: 
        model = Payment
        fields = [
            'id', 'user_email', 'conversation_title', 'amount', 
            'tokens_added', 'status', 'transaction_id', 'created_at'
        ]
        read_only_fields = ['id', 'status', 'transaction_id', 'created_at']


class CreatePaymentSerializer(serializers.Serializer):
    """Serializer for creating a payment."""
    
    conversation_id = serializers.IntegerField(required=True)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=1.00)
    
    def validate_amount(self, value):
        """Calculate tokens based on amount."""
        # $1 = 1000 tokens (example rate)
        return value


class PaymentHistorySerializer(serializers.ModelSerializer):
    """Serializer for payment history."""
    
    conversation = ConversationSerializer(read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'conversation', 'amount', 'tokens_added', 
            'status', 'transaction_id', 'created_at'
        ]
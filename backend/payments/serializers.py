from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for payments"""
    
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = Payment
        fields = ['id', 'user', 'user_email', 'conversation', 'amount', 
                  'tokens_added', 'status', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class CreatePaymentSerializer(serializers.Serializer):
    """Serializer for creating a payment"""
    
    conversation_id = serializers.IntegerField(required=True)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=True)
    tokens_to_add = serializers.IntegerField(required=True, min_value=1000)

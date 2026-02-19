"""
Serializers for chat functionality.
"""
from rest_framework import serializers
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for chat messages."""
    
    class Meta:
        model = Message
        fields = ['id', 'role', 'content', 'tokens_used', 'created_at']
        read_only_fields = ['id', 'tokens_used', 'created_at']


class ConversationSerializer(serializers.ModelSerializer):
    """Serializer for conversations."""
    
    last_message = serializers.SerializerMethodField()
    message_count = serializers.SerializerMethodField()
    remaining_tokens = serializers.ReadOnlyField()
    usage_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'title', 'total_tokens_used', 'token_limit',
            'remaining_tokens', 'usage_percentage', 'message_count',
            'last_message', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'total_tokens_used', 'created_at', 'updated_at']
    
    def get_last_message(self, obj):
        """Get the last message in the conversation."""
        last_msg = obj.messages.last()
        if last_msg: 
            return {
                'content': last_msg.content[: 100] + '...' if len(last_msg.content) > 100 else last_msg.content,
                'role':  last_msg.role,
                'created_at': last_msg.created_at
            }
        return None
    
    def get_message_count(self, obj):
        """Get total message count."""
        return obj.messages.count()


class ConversationDetailSerializer(ConversationSerializer):
    """Detailed serializer for conversations with messages."""
    
    messages = MessageSerializer(many=True, read_only=True)
    
    class Meta(ConversationSerializer.Meta):
        fields = ConversationSerializer.Meta.fields + ['messages']


class SendMessageSerializer(serializers.Serializer):
    """Serializer for sending a message."""
    
    message = serializers.CharField(required=True, max_length=10000)
    conversation_id = serializers.IntegerField(required=False, allow_null=True)
    provider = serializers.CharField(required=False, default='gemini')
    model = serializers.CharField(required=False, allow_null=True)
    persona = serializers.CharField(required=False, default='general')


class CreateConversationSerializer(serializers.ModelSerializer):
    """Serializer for creating a new conversation."""
    
    class Meta:
        model = Conversation
        fields = ['title']
    
    def create(self, validated_data):
        user = self.context['request'].user
        return Conversation.objects.create(user=user, **validated_data)


class TokenUsageSerializer(serializers.Serializer):
    """Serializer for token usage information."""
    
    conversation_id = serializers.IntegerField()
    total_tokens_used = serializers.IntegerField()
    token_limit = serializers.IntegerField()
    remaining_tokens = serializers.IntegerField()
    usage_percentage = serializers.FloatField()
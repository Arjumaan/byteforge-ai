from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Conversation, Message
from .serializers import (
    ConversationSerializer, MessageSerializer, 
    ConversationCreateSerializer, SendMessageSerializer
)
from .gemini_service import GeminiService


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def conversations_view(request):
    """List all conversations or create a new one"""
    
    if request.method == 'GET':
        conversations = Conversation.objects.filter(user=request.user)
        serializer = ConversationSerializer(conversations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    elif request.method == 'POST':
        serializer = ConversationCreateSerializer(data=request.data)
        
        if serializer.is_valid():
            conversation = serializer.save(user=request.user)
            return Response(
                ConversationSerializer(conversation).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def conversation_history_view(request, conversation_id):
    """Get message history for a conversation"""
    
    conversation = get_object_or_404(Conversation, id=conversation_id, user=request.user)
    messages = conversation.messages.all()
    serializer = MessageSerializer(messages, many=True)
    
    return Response({
        'conversation': ConversationSerializer(conversation).data,
        'messages': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message_view(request):
    """Send a message and get AI response"""
    
    serializer = SendMessageSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    conversation_id = serializer.validated_data['conversation_id']
    user_message = serializer.validated_data['message']
    
    # Get conversation
    conversation = get_object_or_404(Conversation, id=conversation_id, user=request.user)
    
    # Check token limit
    if conversation.is_token_limit_reached():
        return Response({
            'error': 'Token limit reached for this conversation. Please make a payment to continue.',
            'token_limit_reached': True
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Initialize Gemini service
    gemini_service = GeminiService()
    
    # Count tokens in user message
    user_tokens = gemini_service.count_tokens(user_message)
    
    # Save user message
    user_msg = Message.objects.create(
        conversation=conversation,
        user=request.user,
        role='user',
        content=user_message,
        tokens_used=int(user_tokens)
    )
    
    # Get conversation history for context
    conversation_history = conversation.messages.all()
    
    # Generate AI response
    ai_response_data = gemini_service.generate_response(user_message, conversation_history)
    
    # Save AI response
    ai_msg = Message.objects.create(
        conversation=conversation,
        role='assistant',
        content=ai_response_data['response'],
        tokens_used=ai_response_data['tokens_used']
    )
    
    # Update conversation token count
    total_tokens = int(user_tokens) + ai_response_data['tokens_used']
    conversation.add_tokens(total_tokens)
    
    # Update conversation title from first message if still default
    if conversation.title == 'New Conversation' and conversation.messages.count() == 2:
        conversation.title = user_message[:50] + ('...' if len(user_message) > 50 else '')
        conversation.save()
    
    return Response({
        'user_message': MessageSerializer(user_msg).data,
        'ai_response': MessageSerializer(ai_msg).data,
        'conversation': ConversationSerializer(conversation).data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def token_usage_view(request, conversation_id):
    """Get token usage for a conversation"""
    
    conversation = get_object_or_404(Conversation, id=conversation_id, user=request.user)
    
    return Response({
        'conversation_id': conversation.id,
        'total_tokens_used': conversation.total_tokens_used,
        'token_limit': conversation.token_limit,
        'tokens_remaining': conversation.token_limit - conversation.total_tokens_used,
        'percentage_used': (conversation.total_tokens_used / conversation.token_limit * 100) if conversation.token_limit > 0 else 0
    }, status=status.HTTP_200_OK)

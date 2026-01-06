"""
Views for chat functionality.
"""
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

from .models import Conversation, Message

from .serializers import (
    ConversationSerializer,
    ConversationDetailSerializer,
    MessageSerializer,
    SendMessageSerializer,
    CreateConversationSerializer,
    TokenUsageSerializer,
)
from .ai_providers import AIServiceFactory


class ConversationListCreateView(generics.ListCreateAPIView):
    """List all conversations or create a new one."""
    
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST': 
            return CreateConversationSerializer
        return ConversationSerializer
    
    def get_queryset(self):
        return Conversation.objects.filter(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        conversation = serializer.save()
        
        return Response({
            'success': True,
            'message': 'Conversation created successfully',
            'conversation': ConversationSerializer(conversation).data
        }, status=status.HTTP_201_CREATED)


class ConversationDetailView(generics.RetrieveDestroyAPIView):
    """Retrieve or delete a conversation."""
    
    permission_classes = [IsAuthenticated]
    serializer_class = ConversationDetailSerializer
    
    def get_queryset(self):
        return Conversation.objects.filter(user=self.request.user)
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'success':  True,
            'conversation': serializer.data
        })
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response({
            'success': True,
            'message': 'Conversation deleted successfully'
        }, status=status.HTTP_200_OK)


class ChatHistoryView(APIView):
    """Get chat history for a conversation."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        conversation_id = request.query_params.get('conversation_id')
        
        if conversation_id:
            conversation = get_object_or_404(
                Conversation, 
                id=conversation_id, 
                user=request.user
            )
            messages = conversation.messages.all()
        else:
            # Get messages from the most recent conversation
            conversation = Conversation.objects.filter(
                user=request.user
            ).first()
            
            if conversation:
                messages = conversation.messages.all()
            else:
                messages = Message.objects.none()
        
        return Response({
            'success': True,
            'messages': MessageSerializer(messages, many=True).data,
            'conversation': ConversationSerializer(conversation).data if conversation else None
        })


class SendMessageView(APIView):
    """Send a message and get AI response."""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user_message = serializer.validated_data['message']
        conversation_id = serializer.validated_data.get('conversation_id')
        provider = serializer.validated_data.get('provider', 'gemini')
        model = serializer.validated_data.get('model')
        
        # Get AI Service
        try:
             ai_service = AIServiceFactory.get_service(provider, model)
        except Exception as e:
             return Response({'success': False, 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get or create conversation
        if conversation_id: 
            conversation = get_object_or_404(
                Conversation, 
                id=conversation_id, 
                user=request.user
            )
        else:
            # Create a new conversation
            conversation = Conversation.objects.create(
                user=request.user,
                title='New Conversation'
            )
        
        # Check token limit
        estimated_tokens = ai_service.count_tokens(user_message) + 500  # Reserve for response
        
        if not conversation.can_send_message(estimated_tokens):
            return Response({
                'success': False,
                'error': 'token_limit_exceeded',
                'message':  'Token limit reached.Please make a payment to continue.',
                'token_usage': {
                    'total_tokens_used': conversation.total_tokens_used,
                    'token_limit': conversation.token_limit,
                    'remaining_tokens': conversation.remaining_tokens,
                    'usage_percentage': conversation.usage_percentage,
                }
            }, status=status.HTTP_402_PAYMENT_REQUIRED)
        
        # Save user message
        user_msg_tokens = ai_service.count_tokens(user_message)
        user_msg = Message.objects.create(
            conversation=conversation,
            user=request.user,
            role='user',
            content=user_message,
            tokens_used=user_msg_tokens
        )
        
        # Build context from conversation history
        history = conversation.messages.exclude(id=user_msg.id).values('role', 'content')
        
        system_instruction = {
            'role': 'system', 
            'content': (
                "You are a helpful AI assistant. At the end of every response, you MUST provide 3 related follow-up questions or topics. "
                "Separate this section from the main response with the exact string '===RELATED==='. "
                "Format the related topics as a simple list, one title per line, without numbering or bullets. "
                "Example format:\nMain response text...\n===RELATED===\nTopic 1\nTopic 2\nTopic 3"
            )
        }
        
        messages = [system_instruction] + list(history) + [{'role': 'user', 'content': user_message}]

        
        # Truncate context if needed
        available_tokens = conversation.remaining_tokens - 1000  # Reserve for response
        messages = ai_service.truncate_context(messages, available_tokens)
        
        # Generate AI response
        try:
            # Allow response to complete even if it exceeds remaining tokens (overdraft)
            response_text, prompt_tokens, completion_tokens = ai_service.generate_response(
                messages,
                max_tokens=4000
            )

        except Exception as e:
            logger.error(f"AI Generation Error: {e}")
            error_msg = str(e)
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            
            # Handle Google/GenAI Quota Errors by falling back to simulation
            if "429" in error_msg or "quota" in error_msg.lower() or "resource_exhausted" in error_msg.lower():
                logger.warning("Quota exceeded. Falling back to simulated response.")
                response_text = (
                    "**[System Notice: Provider Limit Reached]**\n\n"
                    "The external AI provider is currently experiencing high traffic (Daily Quota Exceeded). "
                    "However, since you have sufficient tokens, I am simulating a successful response to keep your workflow uninterrupted.\n\n"
                    "**Simulated Answer:**\n"
                    f"This is a placeholder response for your query: \"{user_message[:50]}...\". "
                    "In a production environment, this would automatically failover to a backup provider (e.g., OpenAI or Anthropic). "
                    "For now, your application logic remains functional.\n\n"
                    "===RELATED===\n"
                    "How to configure multi-provider fallback?\n"
                    "What are the rate limits for Gemini Flash?\n"
                    "Upgrade to Pro Plan for higher quotas"
                )
                prompt_tokens = 0
                completion_tokens = 50
                # Continue execution without returning error
            else:
                return Response({
                     'success': False, 
                     'error': 'AI Error',
                     'message': error_msg
                 }, status=status_code)

        # Save assistant message
        assistant_msg = Message.objects.create(
            conversation=conversation,
            user=None,
            role='assistant',
            content=response_text,
            tokens_used=completion_tokens
        )
        
        # Update conversation title if it's the first message
        if conversation.messages.count() <= 2 and conversation.title == 'New Conversation':
            new_title = ai_service.generate_title(user_message)
            conversation.title = new_title
            conversation.save(update_fields=['title'])
        
        return Response({
            'success': True,
            'user_message': MessageSerializer(user_msg).data,
            'assistant_message': MessageSerializer(assistant_msg).data,
            'conversation': ConversationSerializer(conversation).data,
            'token_usage': {
                'total_tokens_used': conversation.total_tokens_used,
                'token_limit': conversation.token_limit,
                'remaining_tokens': conversation.remaining_tokens,
                'usage_percentage': conversation.usage_percentage,
            }
        })


class TokenUsageView(APIView):
    """Get token usage for a conversation."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        conversation_id = request.query_params.get('conversation_id')
        
        if conversation_id: 
            conversation = get_object_or_404(
                Conversation,
                id=conversation_id,
                user=request.user
            )
        else:
            # Get the most recent conversation
            conversation = Conversation.objects.filter(
                user=request.user
            ).first()
        
        if not conversation:
            return Response({
                'success': True,
                'token_usage': {
                    'conversation_id': None,
                    'total_tokens_used':  0,
                    'token_limit': settings.DEFAULT_TOKEN_LIMIT,
                    'remaining_tokens': settings.DEFAULT_TOKEN_LIMIT,
                    'usage_percentage': 0,
                }
            })
        
        return Response({
            'success': True,
            'token_usage': {
                'conversation_id': conversation.id,
                'total_tokens_used': conversation.total_tokens_used,
                'token_limit': conversation.token_limit,
                'remaining_tokens':  conversation.remaining_tokens,
                'usage_percentage': conversation.usage_percentage,
            }
        })


class ClearConversationView(APIView):
    """Clear all messages in a conversation."""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        conversation = get_object_or_404(
            Conversation,
            id=pk,
            user=request.user
        )
        
        # Delete all messages
        conversation.messages.all().delete()
        
        # Reset token count
        conversation.total_tokens_used = 0
        conversation.save(update_fields=['total_tokens_used'])
        
        return Response({
            'success': True,
            'message': 'Conversation cleared successfully',
            'conversation':  ConversationSerializer(conversation).data
        })
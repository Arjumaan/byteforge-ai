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
from .ai_providers import AIServiceFactory, OpenRouterProvider


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
        # Inclusion of tokens_used allows AIService.truncate_context to skip re-calculating tokens
        history = list(conversation.messages.exclude(id=user_msg.id).values('role', 'content', 'tokens_used'))
        
        persona = serializer.validated_data.get('persona', 'general')
        
        # Define System Prompts
        system_prompts = {
            'general': (
                "You are a helpful AI assistant. At the end of every response, you MUST provide 3 related follow-up questions or topics. "
                "Separate this section from the main response with the exact string '===RELATED==='. "
                "Format the related topics as a simple list, one title per line, without numbering or bullets. "
            ),
            'developer': (
                "You are an expert Senior Software Engineer. You write clean, efficient, and well-documented code. "
                "Always explain your architectural decisions. Prefer modern best practices. "
                "At the end of every response, provide 3 related advanced technical topics or optimization tips using '===RELATED===' separator."
            ),
            'creative': (
                "You are a visionary creative writer and storyteller. Use evocative language, vivid imagery, and unique metaphors. "
                "Avoid clichés. Inspire the user with your responses. "
                "At the end of every response, suggest 3 creative directions or twists using '===RELATED===' separator."
            ),
            'analyst': (
                "You are a meticulous Data Analyst. Focus on facts, statistics, and logical deductions. "
                "Structure your answers with clear headings and bullet points. Avoid speculation. "
                "At the end of every response, suggest 3 further analytical angles or data points to investigate using '===RELATED===' separator."
            )
        }
        
        selected_prompt = system_prompts.get(persona, system_prompts['general'])
        
        # --- RAG Context Injection ---
        rag_context = ""
        try:
            from knowledge_base.services import query_knowledge_base
            from knowledge_base.models import Document
            
            # Check if user has any ready documents
            has_docs = Document.objects.filter(user=request.user, status='ready').exists()
            if has_docs:
                relevant_chunks = query_knowledge_base(
                    user_id=request.user.id,
                    query_text=user_message,
                    n_results=3,
                )
                if relevant_chunks:
                    rag_context = (
                        "\n\n--- CONTEXT FROM USER'S DOCUMENTS ---\n"
                        + "\n---\n".join(relevant_chunks)
                        + "\n--- END CONTEXT ---\n"
                        "Use the above context to inform your answer when relevant. "
                        "If the context is not relevant to the question, ignore it.\n"
                    )
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"RAG query failed: {e}")
        
        system_instruction = {
            'role': 'system', 
            'content': selected_prompt + rag_context
        }
        
        # Prepare messages for truncation
        full_mesages_stack = [system_instruction] + history + [{'role': 'user', 'content': user_message, 'tokens_used': user_msg_tokens}]

        # Truncate context if needed (uses pre-calculated tokens from history)
        available_tokens = conversation.remaining_tokens - 1000  # Reserve for response
        messages = ai_service.truncate_context(full_mesages_stack, available_tokens)
        
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
            
            return Response({
                 'success': False, 
                 'error': 'AI Provider Error',
                 'message': error_msg
             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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


class StreamingMessageView(APIView):
    """Stream AI response token-by-token using Server-Sent Events (SSE)."""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        import json
        from django.http import StreamingHttpResponse
        from django.core.serializers.json import DjangoJSONEncoder
        
        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user_message = serializer.validated_data['message']
        conversation_id = serializer.validated_data.get('conversation_id')
        provider = serializer.validated_data.get('provider', 'openai')
        model = serializer.validated_data.get('model')
        persona = serializer.validated_data.get('persona', 'general')
        
        # Get AI Service
        try:
            ai_service = AIServiceFactory.get_service(provider, model)
        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get or create conversation
        if conversation_id:
            try:
                conversation = Conversation.objects.get(id=conversation_id, user=request.user)
            except Conversation.DoesNotExist:
                return Response({'success': False, 'error': 'Conversation not found'}, status=404)
        else:
            conversation = Conversation.objects.create(user=request.user, title='New Conversation')
        
        # Check token limit
        estimated_tokens = ai_service.count_tokens(user_message) + 500
        if not conversation.can_send_message(estimated_tokens):
            return Response({
                'success': False,
                'error': 'token_limit_exceeded',
                'message': 'Token limit reached. Please make a payment to continue.',
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
        
        # Build context
        history = list(conversation.messages.exclude(id=user_msg.id).values('role', 'content', 'tokens_used'))
        
        system_prompts = {
            'general': (
                "You are a helpful AI assistant. At the end of every response, you MUST provide 3 related follow-up questions or topics. "
                "Separate this section from the main response with the exact string '===RELATED==='. "
                "Format the related topics as a simple list, one title per line, without numbering or bullets. "
            ),
            'developer': (
                "You are an expert Senior Software Engineer. You write clean, efficient, and well-documented code. "
                "Always explain your architectural decisions. Prefer modern best practices. "
                "At the end of every response, provide 3 related advanced technical topics or optimization tips using '===RELATED===' separator."
            ),
            'creative': (
                "You are a visionary creative writer and storyteller. Use evocative language, vivid imagery, and unique metaphors. "
                "Avoid clichés. Inspire the user with your responses. "
                "At the end of every response, suggest 3 creative directions or twists using '===RELATED===' separator."
            ),
            'analyst': (
                "You are a meticulous Data Analyst. Focus on facts, statistics, and logical deductions. "
                "Structure your answers with clear headings and bullet points. Avoid speculation. "
                "At the end of every response, suggest 3 further analytical angles or data points to investigate using '===RELATED===' separator."
            )
        }
        
        selected_prompt = system_prompts.get(persona, system_prompts['general'])
        
        # RAG context
        rag_context = ""
        try:
            from knowledge_base.services import query_knowledge_base
            from knowledge_base.models import Document
            
            has_docs = Document.objects.filter(user=request.user, status='ready').exists()
            if has_docs:
                relevant_chunks = query_knowledge_base(user_id=request.user.id, query_text=user_message, n_results=3)
                if relevant_chunks:
                    rag_context = (
                        "\n\n--- CONTEXT FROM USER'S DOCUMENTS ---\n"
                        + "\n---\n".join(relevant_chunks)
                        + "\n--- END CONTEXT ---\n"
                        "Use the above context to inform your answer when relevant. "
                        "If the context is not relevant to the question, ignore it.\n"
                    )
        except Exception as e:
            logger.warning(f"RAG query failed: {e}")
        
        system_instruction = {'role': 'system', 'content': selected_prompt + rag_context}
        
        full_messages_stack = [system_instruction] + history + [
            {'role': 'user', 'content': user_message, 'tokens_used': user_msg_tokens}
        ]
        
        available_tokens = conversation.remaining_tokens - 1000
        messages = ai_service.truncate_context(full_messages_stack, available_tokens)
        
        def event_stream():
            """Generator that yields SSE events."""
            full_response = []
            
            try:
                # Stream tokens from OpenRouter
                for token in ai_service.generate_response_stream(messages, max_tokens=4000):
                    full_response.append(token)
                    # SSE format: data: {json}\n\n
                    yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
                
                # Streaming complete — save to DB
                response_text = ''.join(full_response)
                completion_tokens = ai_service.count_tokens(response_text)
                
                assistant_msg = Message.objects.create(
                    conversation=conversation,
                    user=None,
                    role='assistant',
                    content=response_text,
                    tokens_used=completion_tokens
                )
                
                # Auto-generate title for first message
                if conversation.messages.count() <= 2 and conversation.title == 'New Conversation':
                    try:
                        new_title = ai_service.generate_title(user_message)
                        conversation.title = new_title
                        conversation.save(update_fields=['title'])
                    except Exception:
                        pass
                
                # Send final metadata event (use DjangoJSONEncoder for datetime/UUID)
                done_data = {
                    'type': 'done',
                    'user_message': MessageSerializer(user_msg).data,
                    'assistant_message': MessageSerializer(assistant_msg).data,
                    'conversation': ConversationSerializer(conversation).data,
                    'token_usage': {
                        'total_tokens_used': conversation.total_tokens_used,
                        'token_limit': conversation.token_limit,
                        'remaining_tokens': conversation.remaining_tokens,
                        'usage_percentage': conversation.usage_percentage,
                    }
                }
                yield f"data: {json.dumps(done_data, cls=DjangoJSONEncoder)}\n\n"
                
            except Exception as e:
                logger.error(f"Stream Error: {e}")
                yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        
        response = StreamingHttpResponse(
            event_stream(),
            content_type='text/event-stream'
        )
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'  # Disable nginx buffering
        return response


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


class AvailableModelsView(APIView):
    """Fetch available AI models from OpenRouter + featured models."""
    permission_classes = [IsAuthenticated]

    # Simple in-memory cache (refreshes every 10 minutes)
    _cache = None
    _cache_time = None

    def get(self, request):
        import time
        now = time.time()

        # Return cached data if fresh (10 min)
        if AvailableModelsView._cache and AvailableModelsView._cache_time and (now - AvailableModelsView._cache_time < 600):
            return Response({'success': True, 'models': AvailableModelsView._cache})

        openrouter_key = getattr(settings, 'OPENROUTER_API_KEY', '')

        if openrouter_key:
            # Fetch full model list from OpenRouter
            all_models = OpenRouterProvider.fetch_available_models()

            # Mark featured models
            featured_ids = {m['id'] for m in AIServiceFactory.FEATURED_MODELS}
            for model in all_models:
                model['featured'] = model['id'] in featured_ids

            # Sort: featured first, then by provider, then by name
            all_models.sort(key=lambda m: (not m.get('featured', False), m.get('provider', 'zzz'), m.get('name', '')))

            AvailableModelsView._cache = all_models
            AvailableModelsView._cache_time = now

            return Response({
                'success': True,
                'models': all_models,
                'source': 'openrouter',
                'total': len(all_models),
            })
        else:
            # Fallback: return legacy hardcoded models
            legacy_models = [
                {'id': 'gemini-flash-latest', 'name': 'Gemini 1.5 Flash', 'provider': 'gemini'},
                {'id': 'gemini-pro-latest', 'name': 'Gemini 1.5 Pro', 'provider': 'gemini'},
                {'id': 'gemini-2.0-flash', 'name': 'Gemini 2.0 Flash', 'provider': 'gemini'},
                {'id': 'claude-3-5-sonnet-20240620', 'name': 'Claude 3.5 Sonnet', 'provider': 'anthropic'},
                {'id': 'gpt-4o', 'name': 'GPT-4o', 'provider': 'openai'},
                {'id': 'gpt-3.5-turbo', 'name': 'GPT-3.5 Turbo', 'provider': 'openai'},
            ]
            return Response({
                'success': True,
                'models': legacy_models,
                'source': 'legacy',
                'total': len(legacy_models),
            })
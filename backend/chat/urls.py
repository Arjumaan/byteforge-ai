"""
URL patterns for chat functionality.
"""
from django.urls import path
from .views import (
    ConversationListCreateView,
    ConversationDetailView,
    ChatHistoryView,
    SendMessageView,
    TokenUsageView,
    ClearConversationView,
)

urlpatterns = [
    path('conversations/', ConversationListCreateView.as_view(), name='conversations'),
    path('conversations/<int:pk>/', ConversationDetailView.as_view(), name='conversation_detail'),
    path('conversations/<int:pk>/clear/', ClearConversationView.as_view(), name='clear_conversation'),
    path('history/', ChatHistoryView.as_view(), name='chat_history'),
    path('send/', SendMessageView.as_view(), name='send_message'),
    path('token-usage/', TokenUsageView.as_view(), name='token_usage'),
]
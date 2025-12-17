from django.urls import path
from . import views

urlpatterns = [
    path('conversations', views.conversations_view, name='conversations'),
    path('conversations/<int:conversation_id>/history', views.conversation_history_view, name='conversation_history'),
    path('send', views.send_message_view, name='send_message'),
    path('conversations/<int:conversation_id>/token-usage', views.token_usage_view, name='token_usage'),
]

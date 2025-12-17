from django.db import models
from django.conf import settings
from django.utils import timezone


class Conversation(models.Model):
    """Conversation model to track chat sessions"""
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='conversations')
    title = models.CharField(max_length=255, default='New Conversation')
    total_tokens_used = models.IntegerField(default=0)
    token_limit = models.IntegerField(default=20000)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'conversations'
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"{self.title} - {self.user.email}"
    
    def is_token_limit_reached(self):
        """Check if conversation has reached token limit"""
        return self.total_tokens_used >= self.token_limit
    
    def add_tokens(self, tokens):
        """Add tokens to conversation"""
        self.total_tokens_used += tokens
        self.save()


class Message(models.Model):
    """Message model to store chat messages"""
    
    ROLE_CHOICES = (
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('system', 'System'),
    )
    
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    tokens_used = models.IntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'messages'
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.role}: {self.content[:50]}"

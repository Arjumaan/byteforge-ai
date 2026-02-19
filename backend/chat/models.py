"""
Models for chat functionality.
"""
from django.db import models
from django.conf import settings
from django.utils import timezone


class Conversation(models.Model):
    """Model representing a chat conversation."""
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='conversations'
    )
    title = models.CharField(max_length=255, default='New Conversation')
    total_tokens_used = models.IntegerField(default=0)
    token_limit = models.IntegerField(default=20000)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'conversations'
        ordering = ['-updated_at']
        verbose_name = 'Conversation'
        verbose_name_plural = 'Conversations'
    
    def __str__(self):
        return f"{self.title} - {self.user.email}"
    
    @property
    def remaining_tokens(self):
        """Calculate remaining tokens."""
        return max(0, self.token_limit - self.total_tokens_used)
    
    @property
    def usage_percentage(self):
        """Calculate token usage percentage."""
        if self.token_limit == 0:
            return 100
        return min(100, (self.total_tokens_used / self.token_limit) * 100)
    
    def can_send_message(self, estimated_tokens=500):
        """Check if a new message can be sent within token limits."""
        return (self.total_tokens_used + estimated_tokens) <= self.token_limit
    
    def add_tokens(self, amount):
        """Add tokens to the conversation limit (after payment)."""
        self.token_limit += amount
        self.save(update_fields=['token_limit'])


class Message(models.Model):
    """Model representing a chat message."""
    
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('system', 'System'),
    ]
    
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='messages'
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    tokens_used = models.IntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta: 
        db_table = 'messages'
        ordering = ['created_at']
        verbose_name = 'Message'
        verbose_name_plural = 'Messages'
    
    def __str__(self):
        return f"{self.role}:  {self.content[: 50]}..."
    
    def save(self, *args, **kwargs):
        """Update conversation token count on save."""
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        if is_new and self.tokens_used > 0:
            self.conversation.total_tokens_used += self.tokens_used
            self.conversation.updated_at = timezone.now()
            self.conversation.save(update_fields=['total_tokens_used', 'updated_at'])
"""
Models for payment functionality.
"""
from django.db import models
from django.conf import settings
from django.utils import timezone


class Payment(models.Model):
    """Model representing a payment transaction."""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payments'
    )
    conversation = models.ForeignKey(
        'chat.Conversation',
        on_delete=models.CASCADE,
        related_name='payments'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    tokens_added = models.IntegerField(default=10000)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'
    
    def __str__(self):
        return f"Payment #{self.id} - {self.user.email} - ${self.amount}"
    
    def process_payment(self):
        """
        Process the payment (mock implementation).In production, this would integrate with a real payment gateway.
        """
        # Mock payment processing - always succeeds
        self.status = 'success'
        self.transaction_id = f"TXN_{self.id}_{timezone.now().strftime('%Y%m%d%H%M%S')}"
        self.save(update_fields=['status', 'transaction_id', 'updated_at'])
        
        # Add tokens to conversation
        self.conversation.add_tokens(self.tokens_added)
        
        return True
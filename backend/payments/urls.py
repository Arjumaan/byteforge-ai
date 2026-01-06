"""
URL patterns for payment functionality.
"""
from django.urls import path
from .views import (
    CreatePaymentView,
    PaymentHistoryView,
    PaymentDetailView,
)

urlpatterns = [
    path('create/', CreatePaymentView.as_view(), name='create_payment'),
    path('history/', PaymentHistoryView.as_view(), name='payment_history'),
    path('<int:pk>/', PaymentDetailView.as_view(), name='payment_detail'),
]